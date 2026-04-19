import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

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
                    Bằng việc truy cập và sử dụng dịch vụ của <strong>TruyenVip</strong>, bạn đồng ý tuân thủ các điều khoản và điều kiện được nêu tại đây. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, vui lòng ngừng sử dụng dịch vụ ngay lập tức.
                </p>
            </div>

            <div className="legal-section-industrial">
                <h2>2. Quyền Truy Cập & Tài Khoản</h2>
                <p className="legal-text-industrial">
                    Bạn chịu trách nhiệm bảo mật thông tin tài khoản của mình. Mọi hoạt động diễn ra dưới tài khoản của bạn sẽ thuộc trách nhiệm của bạn. Chúng tôi có quyền tạm khóa hoặc chấm dứt tài khoản nếu phát hiện hành vi vi phạm quy định cộng đồng.
                </p>
            </div>

            <div className="legal-section-industrial">
                <h2>3. Quy Định Nội Dung</h2>
                <p className="legal-text-industrial">
                    Người dùng không được phép đăng tải, bình luận các nội dung vi phạm pháp luật, đồi trụy, kích động bạo lực hoặc xúc phạm danh dự của người khác. Chúng tôi có bộ lọc tự động và đội ngũ kiểm duyệt để loại bỏ các nội dung này.
                </p>
            </div>

            <div className="legal-section-industrial">
                <h2>4. Thay Đổi Dịch Vụ</h2>
                <p className="legal-text-industrial">
                    Hệ thống có quyền thay đổi, tạm dừng hoặc chấm dứt bất kỳ phần nào của dịch vụ vào bất kỳ lúc nào mà không cần báo trước để thực hiện bảo trì hoặc nâng cấp hệ thống.
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
