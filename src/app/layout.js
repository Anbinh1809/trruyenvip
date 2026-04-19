import "./tokens.css";
import "./industrial-core.css";
import "./titan-components.css";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/components/widgets/ToastProvider";
import { EngagementProvider } from "@/contexts/EngagementContext";
import { HistoryProvider } from "@/contexts/HistoryContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import SWRegistration from "@/components/widgets/SWRegistration";
import MobileNav from "@/components/layout/MobileNav";
import BackToTop from "@/components/layout/BackToTop";

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
    <html lang="vi" data-scroll-smooth="true" suppressHydrationWarning>
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
