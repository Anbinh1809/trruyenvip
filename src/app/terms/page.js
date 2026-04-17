import Header from '@/GiaoDien/BoCuc/Header';
import Footer from '@/GiaoDien/BoCuc/Footer';

export const metadata = {
  title: 'Äiou Khoản Do‹ch Vo¥ | TruyenVip',
  description: 'Các Ä‘iou khoản và  quy Ä‘o‹nh khi sử do¥ng non tảng TruyenVip.',
};

export default function TermsPage() {
  return (
    <main className="main-wrapper titan-bg">
      <Header />
      
      <div className="container legal-container fade-up">
        <header className="legal-header">
            <span className="legal-badge-titan">TERMS OF SERVICE</span>
            <h1 className="legal-title-industrial">Äiou Khoản Do‹ch Vo¥</h1>
        </header>

        <div className="legal-content-industrial shadow-titan">
            <div className="legal-section-industrial">
                <h2>1. Cháº¥p Thuáº­n Äiou Khoản</h2>
                <p className="legal-text-industrial">
                    Báº±ng cách truy cập hoáº·c sử do¥ng <strong>TruyenVip</strong>, báº¡n Ä‘ồnng à½ tuà¢n thủ các Äiou Khoản Do‹ch Vo¥ nà y. Náº¿u báº¡n không Ä‘ồnng à½ với báº¥t ko³ pháº§n nà o của các Ä‘iou khoản, vui là²ng không sử do¥ng do‹ch vo¥ của chàºng tà´i.
                </p>
            </div>

            <div className="legal-section-industrial">
                <h2>2. Quyon Truy Cáº­p Website</h2>
                <p className="legal-text-industrial">
                    Chàºng tà´i cấp cho báº¡n quyon truy cập cà³ gio›i háº¡n và o website cho mo¥c Ä‘à­ch giải trà­ cá nhà¢n. Bạn không Ä‘ưo£c phà©p sử do¥ng báº¥t ko³ cà´ng co¥ cào dữ liệu tực Ä‘o™ng nà o Ä‘oƒ láº¥y nội dung từ website mà  không cà³ sực cho phà©p báº±ng vÄƒn bản của chàºng tà´i.
                </p>
            </div>

            <div className="legal-section-industrial">
                <h2>3. No™i Dung Ngưoi Dà¹ng</h2>
                <p className="legal-text-industrial">
                    Khi bà¬nh luáº­n hoáº·c tưÆ¡ng tác trên non tảng, báº¡n cho‹u trách nhiệm hoà n toà n vo nội dung mà¬nh Ä‘Äƒng tải. Moi hà nh vi vi pháº¡m pháp luáº­t, xàºc pháº¡m hoáº·c spam sáº½ bo‹ xử là½ nghiêm khắc, bao gồnm cả việc khà³a tà i khoản vĩnh viễn.
                </p>
            </div>

            <div className="legal-section-industrial">
                <h2>4. Thay Äo•i Do‹ch Vo¥</h2>
                <p className="legal-text-industrial">
                    Chàºng tà´i cà³ quyon thay Ä‘o•i, táº¡m ngừng hoáº·c ngừng cung cấp do‹ch vo¥ báº¥t ko³ làºc nà o mà  không cáº§n thà´ng báo trưo›c. Các thay Ä‘o•i vo Ä‘iou khoản sáº½ cà³ hiệu lựcc ngay khi Ä‘ưo£c Ä‘Äƒng tải trên trang nà y.
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

