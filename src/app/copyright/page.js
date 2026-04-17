import Header from '@/GiaoDien/BoCuc/Header';
import Footer from '@/GiaoDien/BoCuc/Footer';

export const metadata = {
  title: 'Chà­nh Sách Bản Quyon | TruyenVip',
  description: 'Thà´ng tin vo bản quyon nội dung trên non tảng TruyenVip.',
};

export default function CopyrightPage() {
  return (
    <main className="main-wrapper titan-bg">
      <Header />
      
      <div className="container legal-container fade-up">
        <header className="legal-header">
            <span className="legal-badge-titan">COPYRIGHT POLICY</span>
            <h1 className="legal-title-industrial">Chà­nh Sách Bản Quyon</h1>
        </header>

        <div className="legal-content-industrial shadow-titan">
            <div className="legal-section-industrial">
                <h2>1. Quyon SoŸ Hữu</h2>
                <p className="legal-text-industrial">
                    Táº¥t cả các nội dung bao gồnm truyện tranh, hà¬nh ảnh, mà£ nguồn và  giao diện trên <strong>TruyenVip</strong> Ä‘ưo£c thu tháº­p từ các nguồn cà´ng khai hoáº·c do ngưoi dà¹ng Ä‘à³ng gà³p. Chàºng tà´i không kháº³ng Ä‘o‹nh quyon soŸ hữu Ä‘o‘i với nội dung của các tác giả bên tho© ba.
                </p>
            </div>

            <div className="legal-section-industrial">
                <h2>2. Khiáº¿u Náº¡i Bản Quyon (DMCA)</h2>
                <p className="legal-text-industrial">
                    Chàºng tà´i tà´n trong quyon soŸ hữu trà­ tuệ của ngưoi khác. Náº¿u báº¡n tin ráº±ng tác pháº©m của mà¬nh đã bo‹ sao chà©p theo cách cáº¥u thà nh hà nh vi vi pháº¡m bản quyon, vui là²ng liên hệ với chàºng tà´i qua email: <strong>copyright@truyenvip.com</strong>.
                </p>
            </div>

            <div className="legal-section-industrial">
                <h2>3. Quy Trà¬nh Go¡ Bo</h2>
                <p className="legal-text-industrial">
                    Sau khi nháº­n Ä‘ưo£c thà´ng báo vi pháº¡m ho£p lệ, chàºng tà´i sáº½ tiáº¿n hà nh xác minh và  go¡ bo nội dung vi pháº¡m trong và²ng <strong>24-48 gio là m việc</strong>. Chàºng tà´i cam kết ho£p tác Ä‘áº§y Ä‘ủ với các chủ soŸ hữu bản quyon chà­nh tho‘ng.
                </p>
            </div>

            <div className="legal-section-industrial">
                <h2>4. Liên Hệ Ho£p Tác</h2>
                <p className="legal-text-industrial">
                    Äo‘i với các tác giả muo‘n ho£p tác Ä‘Äƒng tải truyện bản quyon chà­nh tho©c trên non tảng của chàºng tà´i Ä‘oƒ nháº­n doanh thu quảng cáo và  ủng ho™ từ Ä‘o™c giả, vui là²ng gửi thà´ng tin vo bo™ pháº­n Ä‘o‘i ngoáº¡i của chàºng tà´i.
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

