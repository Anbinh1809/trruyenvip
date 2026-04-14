import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Chính Sách Bản Quyền | TruyenVip',
  description: 'Thông tin về bản quyền nội dung trên nền tảng TruyenVip.',
};

export default function CopyrightPage() {
  return (
    <main className="main-wrapper titan-bg">
      <Header />
      
      <div className="container legal-container fade-up">
        <header className="legal-header">
            <span className="legal-badge-titan">COPYRIGHT POLICY</span>
            <h1 className="legal-title-industrial">Chính Sách Bản Quyền</h1>
        </header>

        <div className="legal-content-industrial shadow-titan">
            <div className="legal-section-industrial">
                <h2>1. Quyền Sở Hữu</h2>
                <p className="legal-text-industrial">
                    Tất cả các nội dung bao gồm truyện tranh, hình ảnh, mã nguồn và giao diện trên <strong>TruyenVip</strong> được thu thập từ các nguồn công khai hoặc do người dùng đóng góp. Chúng tôi không khẳng định quyền sở hữu đối với nội dung của các tác giả bên thứ ba.
                </p>
            </div>

            <div className="legal-section-industrial">
                <h2>2. Khiếu Nại Bản Quyền (DMCA)</h2>
                <p className="legal-text-industrial">
                    Chúng tôi tôn trọng quyền sở hữu trí tuệ của người khác. Nếu bạn tin rằng tác phẩm của mình đã bị sao chép theo cách cấu thành hành vi vi phạm bản quyền, vui lòng liên hệ với chúng tôi qua email: <strong>copyright@truyenvip.com</strong>.
                </p>
            </div>

            <div className="legal-section-industrial">
                <h2>3. Quy Trình Gỡ Bỏ</h2>
                <p className="legal-text-industrial">
                    Sau khi nhận được thông báo vi phạm hợp lệ, chúng tôi sẽ tiến hành xác minh và gỡ bỏ nội dung vi phạm trong vòng <strong>24-48 giờ làm việc</strong>. Chúng tôi cam kết hợp tác đầy đủ với các chủ sở hữu bản quyền chính thống.
                </p>
            </div>

            <div className="legal-section-industrial">
                <h2>4. Liên Hệ Hợp Tác</h2>
                <p className="legal-text-industrial">
                    Đối với các tác giả muốn hợp tác đăng tải truyện bản quyền chính thức trên nền tảng của chúng tôi để nhận doanh thu quảng cáo và ủng hộ từ độc giả, vui lòng gửi thông tin về bộ phận đối ngoại của chúng tôi.
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
