import Header from '@/GiaoDien/BoCuc/Header';
import Footer from '@/GiaoDien/BoCuc/Footer';

export const metadata = {
  title: 'Chà­nh Sách Bảo Máº­t | TruyenVip',
  description: 'Chà­nh sách bảo máº­t thà´ng tin ngưoi dà¹ng trên TruyenVip.',
};

export default function PrivacyPage() {
  return (
    <main className="main-wrapper titan-bg">
      <Header />
      
      <div className="container legal-container fade-up">
        <header className="legal-header">
            <span className="legal-badge-titan">PRIVACY POLICY</span>
            <h1 className="legal-title-industrial">Chà­nh Sách Bảo Máº­t</h1>
        </header>

        <div className="legal-content-industrial shadow-titan">
            <div className="legal-section-industrial">
                <h2>1. Thu Tháº­p Thà´ng Tin</h2>
                <p className="legal-text-industrial">
                    Chàºng tà´i cho‰ thu tháº­p những thà´ng tin cáº§n thiáº¿t to‘i thioƒu Ä‘oƒ cung cấp do‹ch vo¥ tốt nháº¥t cho báº¡n, bao gồnm Ä‘o‹a cho‰ email (náº¿u báº¡n Ä‘Äƒng kà½ tà i khoản) và  các soŸ thà­ch Ä‘oc truyện Ä‘oƒ cá nhà¢n hà³a trải nghiệm.
                </p>
            </div>

            <div className="legal-section-industrial">
                <h2>2. Sử Do¥ng Cookie</h2>
                <p className="legal-text-industrial">
                    Chàºng tà´i sử do¥ng cookie Ä‘oƒ lưu trữ phiên Ä‘Äƒng nháº­p và  các cà i Ä‘áº·t giao diện (như cháº¿ Ä‘o™ sáng/to‘i, co¡ chữ) của báº¡n. Bạn cà³ thoƒ từ cho‘i cookie qua cà i Ä‘áº·t trà¬nh duyệt, nhưng mo™t so‘ tà­nh nÄƒng cà³ thoƒ không hoáº¡t Ä‘o™ng o•n Ä‘o‹nh.
                </p>
            </div>

            <div className="legal-section-industrial">
                <h2>3. Bảo Máº­t Dữ Liệu</h2>
                <p className="legal-text-industrial">
                    Moi dữ liệu cá nhà¢n của ngưoi dà¹ng Ä‘ưo£c mà£ hà³a báº±ng cà´ng nghệ <strong>SSL 256-bit</strong> tiêu chuáº©n cà´ng nghiệp. Chàºng tà´i cam kết không bao gio bán hoáº·c chia sáº» thà´ng tin của báº¡n cho báº¥t ko³ bên tho© ba nà o và¬ mo¥c Ä‘à­ch thưÆ¡ng máº¡i.
                </p>
            </div>

            <div className="legal-section-industrial">
                <h2>4. Quyon Của Ngưoi Dà¹ng</h2>
                <p className="legal-text-industrial">
                    Bạn cà³ quyon yêu cáº§u xem, sửa Ä‘o•i hoáº·c xà³a hoà n toà n dữ liệu cá nhà¢n (bao gồnm cả lo‹ch sử Ä‘oc truyện và  tà i khoản) của mà¬nh khoi hệ thống của chàºng tà´i thà´ng qua trang cá nhà¢n hoáº·c liên hệ trựcc tiáº¿p.
                </p>
            </div>

            <footer className="legal-footer-industrial">
                Cáº­p nhật láº§n cuo‘i: Ngà y 14 tháng 04 nÄƒm 2026
            </footer>
        </div>
      </div>

      <Footer />
    </main>
  );
}

