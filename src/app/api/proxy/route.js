import sharp from 'sharp';
import { query } from '@/lib/db';

// RAM OPTIMIZATION: Enable Sharp cache with a 50MB limit to balance speed vs memory
sharp.cache({ memory: 50, items: 100, files: 20 });

import { generateProxySignature, simpleHash } from '@/lib/crypto';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');
  const quality = searchParams.get('q') || '75';
  const width = searchParams.get('w') || '0';
  const sig = searchParams.get('sig');

  if (!imageUrl) {
    return new Response('Missing URL', { status: 400 });
  }

  // TITAN SECURITY: Dual-mode Signature Verification
  // - 16-char HMAC: generated server-side via generateProxySignature()
  // - 8-char simpleHash: generated client-side via getSignedProxyUrl() in MangaCard etc.

  const expectedHmac = generateProxySignature(imageUrl, width, quality);
  const expectedSimple = simpleHash(`${imageUrl}|${width}|${quality}`);
  if (!sig || (sig !== expectedHmac && sig !== expectedSimple)) {
    return new Response('Forbidden: Invalid Signature', { status: 403 });
  }


  const allowedDomains = [
    // PRIMARY MIRRORS & CDN
    'nettruyenplus.com', 'nettruyenfull.com', 'nettruyentop.com', 'nettruyenviet.com', 'nettruyen.us.com', 'nettruyenus.com', 'nettruyennew.com', 'nettruyenon.com',
    'nettruyentv.com', 'nettruyenv.com', 'nettruyenmax.com', 'nettruyenpro.com',
    'nettruyenco.vn', 'nettruyenio.com', 'truyenqqplus.com', 'truyenqqno.com', 'truyenqq.top',
    'truyenqq.info', 'truyenqq.nu', 'truyenqqvn.com', 'truyenqqio.com', 'truyenqqq.com',
    
    // IMAGE SERVERS & CDNs
    'nt-cdn.xyz', 'nt-cdn.com', 'nt-cdn1.xyz', 'nt-cdn2.xyz',
    'imagetruyen.com', 'st.nettruyen.com', 'st.nettruyennew.com',
    'st.nhattruyen.com', 'hinhhinh.com', 'truyenvua.com'
  ];
  
  try {
    const parsedUrl = new URL(imageUrl);
    const domain = parsedUrl.hostname;

    // PROTOCOL SHIELD: Only allow standard web protocols
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return new Response('Forbidden: Invalid protocol', { status: 403 });
    }

    // SSRF Protection: Titan-grade Numeric IP Shield
    const blocklist = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
    
    const isPrivateIP = (ip) => {
        const parts = ip.split('.').map(Number);
        if (parts.length !== 4 || parts.some(isNaN)) return false;
        return (
            parts[0] === 10 ||
            (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
            (parts[0] === 192 && parts[1] === 168) ||
            (parts[0] === 127) ||
            (parts[0] === 0)
        );
    };

    // If the hostname is an IP, check it directly. 
    // If it's a domain, the whitelist check below is the primary defense.
    if (/^[0-9.]+$/.test(domain) && isPrivateIP(domain)) {
        return new Response('Forbidden: Internal IP access blocked', { status: 403 });
    }

    if (blocklist.includes(domain)) {
        return new Response('Forbidden: Local address access blocked', { status: 403 });
    }

    // Proxy Loop Protection
    if (imageUrl.includes('/api/proxy') || domain.includes('truyenvip.com')) {
        return new Response('Forbidden: Proxy recursion blocked', { status: 403 });
    }

    const isAllowed = allowedDomains.some(d => domain === d || domain.endsWith('.' + d));
    if (!isAllowed) return new Response('Forbidden: Domain not whitelisted', { status: 403 });

    // Multi-Stage Referer Strategies (The "Gauntlet")
    const strategies = [
        { name: 'Target-Path', referer: imageUrl.split('/').slice(0, -1).join('/') + '/' }, // New Dynamic Path Strategy
        { name: 'Target-Host', referer: parsedUrl.origin + '/' }, 
        { name: 'Self-Domain', referer: `https://${domain}/` },
        { name: 'On-Domain', referer: 'https://nettruyenon.com/' },
        { name: 'QQ-Domain', referer: 'https://truyenqqno.com/' },
        { name: 'Stealth', referer: '' }
    ];

    const userAgents = [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36',
    ];

    // HIGH-SPEED RACING ENGINE: Fire all strategies concurrently
    // We use a custom racing logic that takes the first SUCCESSFUL (ok) response
    const fetchWithStrategy = async (strategy) => {
        const headers = { 
            'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache'
        };
        if (strategy.referer) headers['Referer'] = strategy.referer;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s for slower CDNs

        try {
            const response = await fetch(imageUrl, { headers, signal: controller.signal, next: { revalidate: 86400 } });
            clearTimeout(timeoutId);
            if (response.ok) return { response, strategy: strategy.name };
            throw new Error(`Status ${response.status}`);
        } catch (e) {
            clearTimeout(timeoutId);
            throw e;
        }
    };

    try {
        // Race the most likely strategies first, but concurrently
        const { response, strategy: winningStrategy } = await Promise.any(
            strategies.map(s => fetchWithStrategy(s))
        ).catch(() => { throw new Error('All strategies failed to fetch image'); });

        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        
        // --- OOM PROTECTION: 10MB Limit ---
        if (buffer.byteLength > 10 * 1024 * 1024) {
            return new Response(buffer, {
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=31536000, immutable',
                    'Access-Control-Allow-Origin': '*',
                    'X-Optimization': 'skipped-too-large'
                },
            });
        }
        
        // --- Smart Image Optimization ---
        if (contentType.includes('gif')) {
            return new Response(buffer, {
                headers: {
                    'Content-Type': 'image/gif',
                    'Cache-Control': 'public, max-age=31536000, immutable',
                    'Access-Control-Allow-Origin': '*',
                },
            });
        }

        try {
            const accept = request.headers.get('accept') || '';
            const supportsAvif = accept.includes('image/avif');
            
            let transformer = sharp(Buffer.from(buffer));
            
            if (width > 0) {
                transformer = transformer.resize({ 
                    width: Math.min(width, 1800),
                    withoutEnlargement: true 
                });
            }

            // SMART COMPRESSION: Use the requested quality (q) or default to 75 (Standard)
            const finalQuality = Math.min(Math.max(quality, 30), 96);
            const isTurbo = finalQuality <= 65;
            
            // SHARPENING: Improve crispness of manga text and line art (compensates for compression)
            // Stiffer sharpening for Turbo mode to maintain readability
            const sigma = isTurbo ? 1.0 : 0.8;
            transformer = transformer.sharpen({ sigma, m1: 1.0, m2: 2.0 });

            let processedBuffer;
            let finalMime = 'image/webp';
            let optTag = `sharp-webp-${winningStrategy}-q${finalQuality}`;

            if (supportsAvif) {
                // AVIF is superior for manga line-art: 10-15% lower quality looks like WebP 85-90%
                // Use effort: 2 for Turbo to speed up processing
                processedBuffer = await transformer
                    .avif({ quality: finalQuality, effort: isTurbo ? 2 : 3 })
                    .toBuffer();
                finalMime = 'image/avif';
                optTag = `sharp-avif-${winningStrategy}-q${finalQuality}`;
            } else {
                // Effort 6 for standard, Effort 4 for Turbo to balance OOM/Speed
                processedBuffer = await transformer
                    .webp({ quality: finalQuality, effort: isTurbo ? 2 : 4, lossless: false })
                    .toBuffer();
            }

            return new Response(processedBuffer, {
                headers: {
                    'Content-Type': finalMime,
                    'Cache-Control': 'public, max-age=31536000, stale-while-revalidate=604800, immutable',
                    'Vary': 'Accept',
                    'Access-Control-Allow-Origin': '*',
                    'Timing-Allow-Origin': '*',
                    'X-Optimization': optTag
                },
            });
        } catch (sharpError) {
            return new Response(buffer, {
                headers: {
                    'Content-Type': response.headers.get('content-type') || 'image/jpeg',
                    'Cache-Control': 'public, max-age=31536000, immutable',
                    'Access-Control-Allow-Origin': '*',
                    'Timing-Allow-Origin': '*'
                },
            });
        }
    } catch (raceError) {
        throw new Error(`Racing Exhausted: ${raceError.message}`);
    }

  } catch (error) {
    console.error('Ultimate Proxy Error:', error.message, imageUrl);

    // Diagnostic Logging: Sampled to avoid DB saturation (5% rate)
    if (Math.random() < 0.05) {
      query("INSERT INTO CrawlLogs (message, status) VALUES (@message, 'error')", { 
          message: `Proxy Failure: ${error.message.substring(0, 100)} | URL: ${imageUrl.substring(0, 300)}`
      }).catch(() => {});
    }
    
    // --- SLEEK EMBEDDED PLACEHOLDER ---
    // A clean, dark-themed SVG so we don't depend on external sites for error states
    const errorSvg = `
      <svg width="400" height="600" viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="600" fill="#121212"/>
        <path d="M150 250 L250 250 L200 180 Z" fill="#333"/>
        <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#555" font-weight="bold">TRUYEN VIP</text>
        <text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#333">Content Unavailable</text>
        <rect x="100" y="380" width="200" height="2" fill="#222"/>
      </svg>
    `.trim();

    return new Response(errorSvg, {
        headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=3600'
        }
    });
  }
}
