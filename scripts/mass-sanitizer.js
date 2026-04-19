import fs from 'fs';
import path from 'path';

const MAPPINGS = {
    'Phm Nhn': 'Phàm Nhân',
    'Đ c?p nh?t ?nh đại di?n': 'Đã cập nhật ảnh đại diện',
    'Loi c?p nh?t': 'Lỗi cập nhật',
    'Vui lng th? lại': 'Vui lòng thử lại',
    'Lỗi kết nối my ch?': 'Lỗi kết nối máy chủ',
    'Yu cầu đăng nhập': 'Yêu cầu đăng nhập',
    'đo xem thng tin c nhn': 'để xem thông tin cá nhân',
    'qu?n l ti kho?n': 'quản lý tài khoản',
    'QUẢN TRo VIN': 'QUẢN TRỊ VIÊN',
    'ĐãC GIẢ VIP': 'ĐỘC GIẢ VIP',
    'BẢNG ĐIoU KHIoN QUẢN TRo': 'BẢNG ĐIỀU KHIỂN QUẢN TRỊ',
    'Dn link ?nh đại di?n moi': 'Dán link ảnh đại diện mới',
    'C?P NHẬT': 'CẬP NHẬT',
    'Cấp Đã': 'Cấp Độ',
    'TIẾN Đã CẤP BẬC': 'TIẾN ĐỘ CẤP BẬC',
    'Cần thm': 'Cần thêm',
    'đo thăng c?p': 'để thăng cấp',
    'TRUY?N YU THCH': 'TRUYỆN YÊU THÍCH',
    'LoCH So ĐãC TRUY?N': 'LỊCH SỬ ĐỌC TRUYỆN',
    'ĐĂNG XUẤT TI KHOẢN': 'ĐĂNG XUẤT TÀI KHOẢN',
    'Káº¾T QUáº¢': 'KẾT QUẢ',
    'bo™ truy?n': 'bộ truyện',
    't? khà³a': 'từ khóa',
    'phà¹ ho£p': 'phù hợp',
    'c?a báº¡n': 'của bạn',
    'tà¬m tháº¥y': 'tìm thấy',
    'TRÆ¯?C': 'TRƯỚC',
    'KHÔNG TÌM TH?Y TRUY?N': 'KHÔNG TÌM THẤY TRUYỆN',
    'Thay Đãi Doch Vo': 'Thay Đổi Dịch Vụ',
    'LoCH So ĐãC': 'LỊCH SỬ ĐỌC',
    'ĐãC TIẾP': 'ĐỌC TIẾP',
    'ĐÀ SẴN SÀNG': 'ĐÃ SẴN SÀNG',
    'tuyá»‡t': 'tuyệt',
    'quáº£ng cÃ¡o': 'quảng cáo',
    'Ä‘á»‰nh cao': 'đỉnh cao',
    'b?n quyon': 'bản quyền',
    'hop tc': 'hợp tác',
    'thng tin': 'thông tin',
    'đo nhận': 'để nhận',
    'hon tất': 'hoàn tất',
    'thnh cng': 'thành công'
};

const FILES_TO_SANITIZE = [
    'src/app/profile/page.js',
    'src/app/history/page.js',
    'src/app/search/page.js',
    'src/app/terms/page.js',
    'src/app/copyright/page.js',
    'src/app/layout.js',
    'src/app/manga/[id]/page.js',
    'src/app/manga/[id]/chapter/[chapterId]/page.js'
];

async function sanitize() {
    console.log('--- GLOBAL TITAN SANITIZATION PULSE ---');
    
    for (const relPath of FILES_TO_SANITIZE) {
        const absPath = path.resolve(process.cwd(), relPath);
        if (!fs.existsSync(absPath)) {
            console.warn(`[Skip] File not found: ${relPath}`);
            continue;
        }

        let content = fs.readFileSync(absPath, 'utf8');
        let changed = false;

        for (const [mangled, clean] of Object.entries(MAPPINGS)) {
            if (content.includes(mangled)) {
                content = content.replaceAll(mangled, clean);
                changed = true;
            }
        }

        if (changed) {
            fs.writeFileSync(absPath, content, 'utf8');
            console.log(`[Fixed] ${relPath}`);
        } else {
            console.log(`[Clean] ${relPath}`);
        }
    }
    console.log('--- SANITIZATION COMPLETE ---');
}

sanitize();
