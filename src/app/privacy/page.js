import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata = {
  title: 'Ch�nh S�ch B?o Mật | TruyenVip',
  description: 'Ch�nh s�ch b?o mật th�ng tin nguo�i d�ng tr�n TruyenVip.',
};

export default function PrivacyPage() {
  return (
    <main className="main-wrapper titan-bg">
      <Header />
      
      <div className="container legal-container fade-up">
        <header className="legal-header">
            <span className="legal-badge-titan">PRIVACY POLICY</span>
            <h1 className="legal-title-industrial">Ch�nh S�ch B?o Mật</h1>
        </header>

        <div className="legal-content-industrial shadow-titan">
            <div className="legal-section-industrial">
                <h2>1. Thu Thập Th�ng Tin</h2>
                <p className="legal-text-industrial">
                    Ch�ng t�i cho� thu thập nh?ng th�ng tin cần thiết to�i thio�u đo� cung c?p do�ch vo� t?t nhất cho bạn, bao g?nm đo�a cho� email (nếu bạn đăng k� t�i kho?n) v� c�c so� th�ch đo�c truy?n đo� c� nh�n h�a tr?i nghi?m.
                </p>
            </div>

            <div className="legal-section-industrial">
                <h2>2. S? Do�ng Cookie</h2>
                <p className="legal-text-industrial">
                    Ch�ng t�i s? do�ng cookie đo� luu tr? phi�n đăng nhập v� c�c c�i đặt giao di?n (nhu chế đo� s�ng/to�i, co� ch?) của bạn. B?n c� tho� t? cho�i cookie qua c�i đặt tr�nh duy?t, nhung mo�t so� t�nh năng c� tho� kh�ng hoạt đo�ng o�n đo�nh.
                </p>
            </div>

            <div className="legal-section-industrial">
                <h2>3. B?o Mật D? Li?u</h2>
                <p className="legal-text-industrial">
                    Mo�i d? li?u c� nh�n c?a nguo�i d�ng đuo�c m� h�a bằng c�ng ngh? <strong>SSL 256-bit</strong> ti�u chuẩn c�ng nghi?p. Ch�ng t�i cam k?t kh�ng bao gio� b�n hoặc chia sẻ th�ng tin của bạn cho bất ko� b�n tho� ba n�o v� mo�c đ�ch thuơng mại.
                </p>
            </div>

            <div className="legal-section-industrial">
                <h2>4. Quyo�n C?a Nguo�i D�ng</h2>
                <p className="legal-text-industrial">
                    B?n c� quyo�n y�u cầu xem, s?a đo�i hoặc x�a ho�n to�n d? li?u c� nh�n (bao g?nm c? lo�ch s? đo�c truy?n v� t�i kho?n) c?a m�nh kho�i hệ thống c?a ch�ng t�i th�ng qua trang c� nh�n hoặc li�n h? tr?cc tiếp.
                </p>
            </div>

            <footer className="legal-footer-industrial">
                Cập nh?t lần cuo�i: Ng�y 14 th�ng 04 năm 2026
            </footer>
        </div>
      </div>

      <Footer />
    </main>
  );
}

