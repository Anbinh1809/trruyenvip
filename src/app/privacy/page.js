import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Chính Sách Bảo Mật | TruyenVip',
  description: 'Chính sách bảo mật thông tin người dùng trên TruyenVip.',
};

export default function PrivacyPage() {
  return (
    <main className="main-wrapper titan-bg">
      <Header />
      
      <div className="container legal-container fade-up">
        <header className="legal-header">
            <span className="legal-badge-titan">PRIVACY POLICY</span>
            <h1 className="legal-title-industrial">Chính Sách Bảo Mật</h1>
        </header>

        <div className="legal-content-industrial shadow-titan">
            <div className="legal-section-industrial">
                <h2>1. Thu Thập Thông Tin</h2>
                <p className="legal-text-industrial">
                    Chúng tôi chỉ thu thập những thông tin cần thiết tối thiểu để cung cấp dịch vụ tốt nhất cho bạn, bao gồm địa chỉ email (nếu bạn đăng ký tài khoản) và các sở thích đọc truyện để cá nhân hóa trải nghiệm.
                </p>
            </div>

            <div className="legal-section-industrial">
                <h2>2. Sử Dụng Cookie</h2>
                <p className="legal-text-industrial">
                    Chúng tôi sử dụng cookie để lưu trữ phiên đăng nhập và các cài đặt giao diện (như chế độ sáng/tối, cỡ chữ) của bạn. Bạn có thể từ chối cookie qua cài đặt trình duyệt, nhưng một số tính năng có thể không hoạt động ổn định.
                </p>
            </div>

            <div className="legal-section-industrial">
                <h2>3. Bảo Mật Dữ Liệu</h2>
                <p className="legal-text-industrial">
                    Mọi dữ liệu cá nhân của người dùng được mã hóa bằng công nghệ <strong>SSL 256-bit</strong> tiêu chuẩn công nghiệp. Chúng tôi cam kết không bao giờ bán hoặc chia sẻ thông tin của bạn cho bất kỳ bên thứ ba nào vì mục đích thương mại.
                </p>
            </div>

            <div className="legal-section-industrial">
                <h2>4. Quyền Của Người Dùng</h2>
                <p className="legal-text-industrial">
                    Bạn có quyền yêu cầu xem, sửa đổi hoặc xóa hoàn toàn dữ liệu cá nhân (bao gồm cả lịch sử đọc truyện và tài khoản) của mình khỏi hệ thống của chúng tôi thông qua trang cá nhân hoặc liên hệ trực tiếp.
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
