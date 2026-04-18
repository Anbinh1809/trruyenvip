import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata = {
  title: 'Ch�nh S�ch B?n Quyo�n | TruyenVip',
  description: 'Th�ng tin vo� b?n quyo�n n?i dung tr�n no�n t?ng TruyenVip.',
};

export default function CopyrightPage() {
  return (
    <main className="main-wrapper titan-bg">
      <Header />
      
      <div className="container legal-container fade-up">
        <header className="legal-header">
            <span className="legal-badge-titan">COPYRIGHT POLICY</span>
            <h1 className="legal-title-industrial">Ch�nh S�ch B?n Quyo�n</h1>
        </header>

        <div className="legal-content-industrial shadow-titan">
            <div className="legal-section-industrial">
                <h2>1. Quyo�n So� H?u</h2>
                <p className="legal-text-industrial">
                    Tất c? c�c n?i dung bao g?nm truy?n tranh, h�nh ?nh, m� ngu?n v� giao di?n tr�n <strong>TruyenVip</strong> đuo�c thu thập t? c�c ngu?n c�ng khai hoặc do nguo�i d�ng đ�ng g�p. Ch�ng t�i kh�ng khẳng đo�nh quyo�n so� h?u đo�i v?i n?i dung c?a c�c t�c gi? b�n tho� ba.
                </p>
            </div>

            <div className="legal-section-industrial">
                <h2>2. Khiếu Nại B?n Quyo�n (DMCA)</h2>
                <p className="legal-text-industrial">
                    Ch�ng t�i t�n tro�ng quyo�n so� h?u tr� tu? c?a nguo�i kh�c. Nếu bạn tin rằng t�c phẩm c?a m�nh d� bo� sao ch�p theo c�ch cấu th�nh h�nh vi vi phạm b?n quyo�n, vui l�ng li�n h? v?i ch�ng t�i qua email: <strong>copyright@truyenvip.com</strong>.
                </p>
            </div>

            <div className="legal-section-industrial">
                <h2>3. Quy Tr�nh Go� Bo�</h2>
                <p className="legal-text-industrial">
                    Sau khi nhận đuo�c th�ng b�o vi phạm ho�p l?, ch�ng t�i sẽ tiến h�nh x�c minh v� go� bo� n?i dung vi phạm trong v�ng <strong>24-48 gio� l�m vi?c</strong>. Ch�ng t�i cam k?t ho�p t�c đầy đ? v?i c�c ch? so� h?u b?n quyo�n ch�nh tho�ng.
                </p>
            </div>

            <div className="legal-section-industrial">
                <h2>4. Li�n H? Ho�p T�c</h2>
                <p className="legal-text-industrial">
                    Đo�i v?i c�c t�c gi? muo�n ho�p t�c đăng t?i truy?n b?n quyo�n ch�nh tho�c tr�n no�n t?ng c?a ch�ng t�i đo� nhận doanh thu qu?ng c�o v� ?ng ho� t? đo�c gi?, vui l�ng g?i th�ng tin vo� bo� phận đo�i ngoại c?a ch�ng t�i.
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

