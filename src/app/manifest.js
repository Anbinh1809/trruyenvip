export default function manifest() {
  return {
    name: 'TruyenVip - Nền tảng Đọc Truyện Tranh Online Cao Cấp',
    short_name: 'TruyenVip',
    description: 'Trải nghiệm đọc truyện tranh đỉnh cao với giao diện Premium tuyệt mỹ.',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#ff3e3e',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
