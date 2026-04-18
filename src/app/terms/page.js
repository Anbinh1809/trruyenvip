import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata = {
  title: 'Đio�u Kho?n Do�ch Vo� | TruyenVip',
  description: 'C�c đio�u kho?n v� quy đo�nh khi s? do�ng no�n t?ng TruyenVip.',
};

export default function TermsPage() {
  return (
    <main className="main-wrapper titan-bg">
      <Header />
      
      <div className="container legal-container fade-up">
        <header className="legal-header">
            <span className="legal-badge-titan">TERMS OF SERVICE</span>
            <h1 className="legal-title-industrial">Đio�u Kho?n Do�ch Vo�</h1>
        </header>

        <div className="legal-content-industrial shadow-titan">
            <div className="legal-section-industrial">
                <h2>1. Chấp Thuận Đio�u Kho?n</h2>
                <p className="legal-text-industrial">
                    Bằng c�ch truy c?p hoặc s? do�ng <strong>TruyenVip</strong>, bạn đ?nng � tu�n th? c�c Đio�u Kho?n Do�ch Vo� n�y. Nếu bạn kh�ng đ?nng � v?i bất ko� phần n�o c?a c�c đio�u kho?n, vui l�ng kh�ng s? do�ng do�ch vo� c?a ch�ng t�i.
                </p>
            </div>

            <div className="legal-section-industrial">
                <h2>2. Quyo�n Truy Cập Website</h2>
                <p className="legal-text-industrial">
                    Ch�ng t�i c?p cho bạn quyo�n truy c?p c� gio�i hạn v�o website cho mo�c đ�ch gi?i tr� c� nh�n. B?n kh�ng đuo�c ph�p s? do�ng bất ko� c�ng co� c�o d? li?u t?c đo�ng n�o đo� lấy nội dung t? website m� kh�ng c� s?c cho ph�p bằng văn b?n c?a ch�ng t�i.
                </p>
            </div>

            <div className="legal-section-industrial">
                <h2>3. No�i Dung Nguo�i D�ng</h2>
                <p className="legal-text-industrial">
                    Khi b�nh luận hoặc tuơng t�c tr�n no�n t?ng, bạn cho�u tr�ch nhi?m ho�n to�n vo� nội dung m�nh đăng tải. Mo�i h�nh vi vi phạm ph�p luật, x�c phạm hoặc spam sẽ bo� x? l� nghi�m kh?c, bao g?nm c? vi?c kh�a t�i kho?n vinh vi?n.
                </p>
            </div>

            <div className="legal-section-industrial">
                <h2>4. Thay Đã�i Do�ch Vo�</h2>
                <p className="legal-text-industrial">
                    Ch�ng t�i c� quyo�n thay đo�i, tạm ngủng hộặc ng?ng cung c?p do�ch vo� bất ko� l�c n�o m� kh�ng cần th�ng b�o truo�c. C�c thay đo�i vo� đio�u kho?n sẽ c� hi?u l?cc ngay khi đuo�c đăng tải tr�n trang n�y.
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

