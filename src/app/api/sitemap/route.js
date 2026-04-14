import { query } from '@/lib/db';

export async function GET(request) {
  const host = request.headers.get('host') || 'truyenvip.com';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const origin = `${protocol}://${host}`;

  try {
    // 1. Fetch top 100 most popular manga for the sitemap
    const mangaRes = await query(`
      SELECT id, last_crawled 
      FROM "Manga" 
      ORDER BY views_at_source DESC 
      LIMIT 100
    `);

    const tasks = mangaRes.recordset || [];
    const mangaEntries = tasks.map(m => `
  <url>
    <loc>${origin}/manga/${m.id}</loc>
    <lastmod>${new Date(m.last_crawled || Date.now()).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join('');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${origin}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>always</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${origin}/genres</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>${mangaEntries}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59'
      }
    });
  } catch (error) {
    console.error('Sitemap generation failed:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
}
