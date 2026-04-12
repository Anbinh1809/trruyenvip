# 💎 TruyenVip Gold Master - Nền tảng Đọc Truyện Tranh Tối Thượng

![Header Icon](https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/gem.svg)

**TruyenVip** không chỉ là một website đọc truyện, mà là một hệ sinh thái content được gia cố với những tiêu chuẩn khắt khe nhất về bảo mật, hiệu năng và thẩm mỹ.

## 🚀 Tính năng "God-Tier" Crawler

Cỗ máy cào dữ liệu của TruyenVip được thiết kế để tự vận hành và tự phục hồi (Self-healing):

- **Smart Deduplication**: Tự động hợp nhất dữ liệu từ nhiều nguồn (NetTruyen, TruyenQQ) dựa trên thuật toán so khớp Slug & Title, đảm bảo không bao giờ bị trùng lặp truyện.
- **Gap Detection & Auto-Backfill**: Tự động phát hiện các chương bị thiếu trong lịch sử và thực hiện đồng bộ hóa sâu (Deep-Sync) để lấp đầy khoảng trống dữ liệu.
- **Atomic Concurrency Control**: Cơ chế Wait-Lock thông minh ngăn chặn Race Condition khi nhiều tiến trình cùng cào ảnh cho một chương.
- **Monotonic Progress Protection**: Đảm bảo XP và Coins của người dùng luôn tăng trưởng ổn định, không bị ghi đè bởi dữ liệu cũ từ network.

## 🛡️ Hệ thống Bảo mật & Hạ tầng "Sắt"

- **SSRF Ironclad**: Image Proxy được bảo vệ bởi danh sách Domain Whitelist nghiêm ngặt, ngăn chặn tấn công SSRF.
- **Antidote for XSS**: Toàn bộ dữ liệu Metadata và JSON-LD được khử trùng và mã hóa (Sanitized) trước khi render.
- **Integrity Constraints**: Ràng buộc Database cấp độ cứng (UNIQUE, ON DELETE CASCADE) giúp dữ liệu luôn toàn vẹn và sạch sẽ.
- **Boot Resilience**: Cơ chế Retry-Wait giúp ứng dụng tự phục hồi và chờ đợi Database khi khởi động lại server.

## ✨ Thẩm mỹ Cinematic

- **Typography Mastery**: Sử dụng phông chữ **Outfit** cho tiêu đề mạnh mẽ và **Inter** cho nội dung mượt mà.
- **Sleek UI/UX**: Ngôn ngữ thiết kế Glassmorphism, Dark mode cao cấp và hiệu ứng Micro-animations đỉnh cao.
- **Responsive Architecture**: Tối ưu hóa tuyệt đối cho di động với Dashboard Rank & Level riêng biệt.

## 🛠️ Hướng dẫn Cài đặt

### yêu cầu hệ thống
- **Node.js**: v18+
- **Database**: Microsoft SQL Server (MSSQL)
- **Environment Variables**:
  ```env
  DB_USER=your_user
  DB_PASSWORD=your_password
  DB_SERVER=your_host
  DB_NAME=TruyenVip
  NODE_ENV=production
  ```

### Các bước triển khai
1. **Cài đặt dependencies**: `npm install`
2. **Khởi tạo Database**: `node db-init.js`
3. **Build ứng dụng**: `npm run build`
4. **Khởi chạy**: `npm start`

---
**TruyenVip - Nâng tầm trải nghiệm đọc truyện tranh của bạn.**
