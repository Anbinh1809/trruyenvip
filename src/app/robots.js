export default function robots() {
  const baseUrl = 'https://truyenvip.com';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/manga/', '/genres/', '/search/', '/api/proxy'],
        disallow: ['/api/', '/admin/', '/auth/', '/user/', '/profile/'],
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

