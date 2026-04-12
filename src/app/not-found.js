import GuardianBeastEmptyState from '@/components/GuardianBeastEmptyState';
import Header from '@/components/Header';

export default function NotFound() {
  return (
    <main className="main-wrapper">
      <Header />
      
      <div className="titan-abyss fade-in" style={{ padding: '100px 0' }}>
        <GuardianBeastEmptyState 
            title="LINH GIỚI HƯ VÔ"
            message={`"Đạo hữu dừng bước! Linh thú canh giữ tàng thư báo rằng đạo hữu đã lạc vào một cẩm chú cổ xưa. Không gian này <strong>không chứa đựng bất kỳ bí tịch nào</strong>."`}
            buttonText="Quay Lại Hiện Thực"
        />
      </div>
    </main>
  );
}
