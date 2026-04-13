import GuardianBeastEmptyState from '@/components/GuardianBeastEmptyState';
import Header from '@/components/Header';

export default function NotFound() {
  return (
    <main className="main-wrapper">
      <Header />
      
      <div className="titan-abyss fade-in" style={{ padding: '100px 0' }}>
        <GuardianBeastEmptyState 
            title="KHÔNG TÌM THẤY TRANG"
            message={`Đường dẫn bạn truy cập hiện không tồn tại hoặc đã được di dời sang địa chỉ mới. Vui lòng kiểm tra lại liên kết.`}
            buttonText="Quay Lại Trang Chủ"
        />
      </div>
    </main>
  );
}
