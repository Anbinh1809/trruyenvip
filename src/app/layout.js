import "./tokens.css";
import "./industrial-core.css";
import "./titan-components.css";
import "./globals.css";
import { Inter } from 'next/font/google';
import { ThemeProvider } from "@/context/ThemeContext";
import { HistoryProvider } from "@/context/HistoryContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { EngagementProvider } from "@/context/EngagementContext";
import { ToastProvider } from "@/components/ToastProvider";
import { AuthProvider } from "@/context/AuthContext";
import MobileNav from "@/components/MobileNav";
import BackToTop from "@/components/BackToTop";
import SWRegistration from "@/components/SWRegistration";

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: "TruyenVip - Nền tảng Đọc Truyện Tranh Online Cao Cấp",
  description: "Website đọc truyện tranh bản quyền, tốc độ siêu nhanh, giao diện cinematic, trải nghiệm mượt mà không quảng cáo.",
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  other: {
    'preconnect': ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
  },
  openGraph: {
    title: "TruyenVip - Đọc Truyện Tranh Cao Cấp",
    description: "Khám phá thế giới truyện tranh đỉnh cao với giao diện Premium tuyệt mỹ.",
    url: 'https://truyenvip.com',
    siteName: 'TruyenVip',
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "TruyenVip - Đọc Truyện Tranh Cao Cấp",
    description: "Trải nghiệm đọc truyện đỉnh cao tại TruyenVip",
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TruyenVip',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#ff3e3e',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className={`${inter.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('unhandledrejection', function(event) {
                console.error('TITAN_PROMISE_REJECTION:', event.reason);
              });
              window.onerror = function(message, source, lineno, colno, error) {
                console.error('TITAN_RUNTIME_ERROR:', message, error);
              };
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <a href="#main-content" className="skip-to-content-titan">Bỏ qua đến nội dung chính</a>
        <AuthProvider>
          <ThemeProvider>
            <ToastProvider> 
              <EngagementProvider>
                <HistoryProvider>
                  <FavoritesProvider>
                    <main id="main-content">
                      {children}
                    </main>
                    <SWRegistration />
                    <MobileNav />
                    <BackToTop />
                  </FavoritesProvider>
                </HistoryProvider>
              </EngagementProvider>
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
