import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Điều Khoản Dịch Vụ | TruyenVip',
  description: 'Các điều khoản và quy định khi sử dụng nền tảng TruyenVip.',
};

export default function TermsPage() {
  return (
    <main className="main-wrapper titan-bg">
      <Header />
      
      <div className="container legal-container fade-up">
        <header className="legal-header">
            <span className="legal-badge-titan">TERMS OF SERVICE</span>
            <h1 className="legal-title-industrial">Điều Khoản Dịch Vụ</h1>
        </header>

        <div className="legal-content-industrial shadow-titan">
            <div className="legal-section-industrial">
                <h2>1. Chấp Thuận Điều Khoản</h2>
                <p className="legal-text-industrial">
                    Bằng cách truy cập hoặc sử dụng <strong>TruyenVip</strong>, bạn đồng ý tuân thủ các Điều Khoản Dịch Vụ này. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản, vui lòng không sử dụng dịch vụ của chúng tôi.
                </p>
            </div>

            <div className="legal-section-industrial">
                <h2>2. Quyền Truy Cập Website</h2>
                <p className="legal-text-industrial">
                    Chúng tôi cấp cho bạn quyền truy cập có giới hạn vào website cho mục đích giải trí cá nhân. Bạn không được phép sử dụng bất kỳ công cụ cào dữ liệu tự động nào để lấy nội dung từ website mà không có sự cho phép bằng văn bản của chúng tôi.
                </p>
            </div>

            <div className="legal-section-industrial">
                <h2>3. Nội Dung Người Dùng</h2>
                <p className="legal-text-industrial">
                    Khi bình luận hoặc tương tác trên nền tảng, bạn chịu trách nhiệm hoàn toàn về nội dung mình đăng tải. Mọi hành vi vi phạm pháp luật, xúc phạm hoặc spam sẽ bị xử lý nghiêm khắc, bao gồm cả việc khóa tài khoản vĩnh viễn.
                </p>
            </div>

            <div className="legal-section-industrial">
                <h2>4. Thay Đổi Dịch Vụ</h2>
                <p className="legal-text-industrial">
                    Chúng tôi có quyền thay đổi, tạm ngừng hoặc ngừng cung cấp dịch vụ bất kỳ lúc nào mà không cần thông báo trước. Các thay đổi về điều khoản sẽ có hiệu lực ngay khi được đăng tải trên trang này.
                </p>
            </div>

            <footer className="legal-footer-industrial">
                Cập nhật lần cuối: Ngày 14 tháng 04 năm 2026
            </footer>
        </div>
      </div>

      <Footer />
    </main>
  );
}
