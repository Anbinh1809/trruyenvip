# 📜 Hướng Dẫn Quản Trị Hệ Thống TruyenVip (Admin Guide)

Chào Đạo Hữu, đây là bản hướng dẫn toàn diện để ông làm chủ hệ thống TruyenVip, từ việc cào dữ liệu đến quản lý "Linh Thú" Guardian.

---

## 🚀 1. Khởi Chạy Hệ Thống

Dự án Next.js có 2 chế độ chạy chính:

*   **Chế độ Phát triển (Development):** Tải nhanh, hỗ trợ sửa code trực tiếp.
    ```powershell
    npm run dev
    ```
*   **Chế độ Sản xuất (Production):** Chạy cực nhanh, ổn định, đã tối ưu RAM.
    ```powershell
    npm run build
    npm run start
    ```

---

## 🏆 2. Quản Lý Tài Khoản Admin

Mọi tính năng quản trị đều nằm sau lớp bảo mật Role. Để nâng cấp một tài khoản lên Admin:

1.  Đăng ký tài khoản trên web.
2.  Mở SQL Server Management Studio (SSMS).
3.  Chạy lệnh SQL sau:
    ```sql
    UPDATE Users SET role = 'admin' WHERE username = 'Tên_Của_Ông';
    ```

---

## 🤖 3. Vận Hành Máy Cào (Crawler Radar)

Hệ thống có 3 chế độ cào chính để đảm bảo nội dung luôn mới:

*   **Tự động (Background):** Chạy ngầm mỗi 30 phút (Cấu hình trong `instrumentation.js`).
*   **Thủ công (Terminal):** Cào cưỡng bức qua dòng lệnh:
    ```powershell
    npm run crawl:manual
    ```
*   **Giao diện Admin:** Vào mục **`/admin/crawler`** để xem Radar thời gian thực.
    *   **Mirror-IQ**: Chỉ số uy tín của các nguồn. Điểm càng cao, nguồn càng ổn định.
    *   **Pressure**: Tỉ lệ áp lực bị chặn IP. Nếu > 50%, hệ thống sẽ tự đi chậm lại.

---

## 🚑 4. Hệ Thống Guardian (Linh Thú Tự Chữa Lành)

Guardian là tính năng "set-and-forget" (Cài một lần chạy mãi mãi). 

*   **Audit Trail:** Vào **`/admin/guardian`** để xem Linh Thú đã làm gì.
*   **FIX_GAP**: Tự động vá các chương bị thiếu trong chuỗi (ví dụ: có chap 1 và 3, thiếu chap 2).
*   **FIX_IMAGE**: Tự động tìm nguồn dự phòng khi ảnh chap đó bị lỗi 404 hoặc bị xóa.

---

## 🧹 5. Bảo Trì & Xử Lý Sự Cố (Troubleshooting)

### Lỗi chiếm dụng RAM / Ghost Processes:
Nếu Terminal hiện lỗi "Port 3000 in use" hoặc RAM tăng đột ngột, hãy chạy lệnh này:
```powershell
taskkill /F /IM node.exe
```

### Dọn dẹp Database:
Hệ thống tự động xóa nhật ký (Logs) sau mỗi 1 ngày để đảm bảo database không bị phình to.

---

## 📁 6. Cấu Hình Biến Môi Trường (.env)
Đảm bảo file `.env` có đầy đủ:
- `DB_SERVER`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET` (Chuỗi ký tự bất kỳ để mã hóa đăng nhập)
