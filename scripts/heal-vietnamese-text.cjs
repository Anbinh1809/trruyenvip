const fs = require('fs');
const path = require('path');
const replacements = [
  ['bnh luận', 'bình luận'], ['Bnh luận', 'Bình luận'],
  ['di?m danh', 'điểm danh'], ['Điom danh', 'Điểm danh'], ['điom danh', 'điểm danh'],
  ['ti kho?n', 'tài khoản'],
  ['thu vi?n', 'thư viện'], ['bo suu tập', 'bộ sưu tập'],
  ['Đ c ti kho?n', 'Đã có tài khoản'], ['Chua c ti kho?n', 'Chưa có tài khoản'],
  ['đoa cho', 'địa chỉ'], 
  ['non t?ng', 'nền tảng'], ['n?i dung', 'nội dung'],
  ['đuoc', 'được'], ['tuơng tc', 'tương tác'],
  ['chuyon d? li?u', 'chuyển dữ liệu'], ['doch vo', 'dịch vụ'],
  ['chuơng', 'chương'], ['Chuơng', 'Chương'], 
  ['nhi?m vo', 'nhiệm vụ'], ['nhi?m v?', 'nhiệm vụ'],
  ['hon ton', 'hoàn toàn'], ['thng bo', 'thông báo'],
  ['đoc truy?n', 'đọc truyện'], ['moi nhất', 'mới nhất'],
  ['t? kha', 'từ khóa'], 
  ['đoi v?i', 'đối với'], ['c quyon', 'có quyền'],
  ['b?n quyon', 'bản quyền'], ['ho đ?ng', 'hoạt động'],
  ['s?p xếp', 'sắp xếp'], ['thnh cng', 'thành công'],
  ['k?t n?i', 'kết nối'], ['hop l?', 'hợp lệ'],
  ['ho tro', 'hỗ trợ'], ['lin k?t', 'liên kết'],
  ['c?a bạn', 'của bạn'],
  ['tm thấy', 'tìm thấy'], ['đăng t?i', 'đăng tải'],
  ['đoc ti?p', 'đọc tiếp'], 
  ['đo ch?c', 'để chắc'], ['k?t qu?', 'kết quả'],
  ['th? l?i', 'thử lại'],
  ['xc minh', 'xác minh'], ['xo l', 'xử lý'],
  ['bo co', 'báo cáo'], 
  ['go bo', 'gỡ bỏ'],
  ['chnh sch', 'chính sách'], ['quyon so h?u', 'quyền sở hữu'],
  ['Truy?n', 'Truyện'],
  ['thoi gian', 'thời gian'], ['vi ph?m', 'vi phạm'],
  ['b?o t?n', 'bảo tồn'], ['đo nhận', 'để nhận'],
  ['?ng ho', 'ủng hộ'], 
  ['tc gi?', 'tác giả'], ['ph?n qu', 'phần quà'],
  ['lin ti?p', 'liên tiếp'], ['k?n k?', 'kềnh kệ'],
  ['t?n t?i', 'tồn tại'], ['hnh vi', 'hành vi'],
  ['Yu c?u', 'Yêu cầu'], ['qu nhanh', 'quá nhanh'],
  ['Tuy?t voi!', 'Tuyệt vời!'], 
  ['Khch ?n danh', 'Khách ẩn danh'], ['r?ni', 'rồi'],
  ['hm nay', 'hôm nay'],
  ['Đ xa', 'Đã xóa'], 
  ['ĐANG Xo L Do LI?U', 'ĐANG XỬ LÝ DỮ LIỆU'],
  ['quyon', 'quyền'],
  ['Xo l', 'Xử lý'],
  ['Do li?u', 'Dữ liệu'],
  ['đoi 1 pht', 'đợi 1 phút'],
  ['Loi', 'Lỗi'],
  ['t?m l?', 'tóm lược'],
  ['Đ c ti', 'Đã có tài'],
  // UTF8 mojibake replacements
  ['Báº¡n Ä‘Ã£ Ä‘Äƒng kÃ½ quÃ¡ nhiá» u tÃ i khoáº£n', 'Bạn đã đăng ký quá nhiều tài khoản'],
  ['giá» ', 'giờ'], ['ThÃ´ng tin', 'Thông tin'],
  ['Ä‘Äƒng kÃ½', 'đăng ký'], ['Ä‘Äƒng nháº­p', 'đăng nhập'],
  ['khÃ´ng há»£p lá»‡', 'không hợp lệ'], ['thiáº¿u dá»¯ liá»‡u', 'thiếu dữ liệu'],
  ['thiáº¿t bá»‹', 'thiết bị'], ['kÃ½ tá»±', 'ký tự'],
  ['Ä‘áº·c biá»‡t', 'đặc biệt'], ['Máº­t kháº©u', 'Mật khẩu'],
  ['pháº£i cÃ³ Ã­t nháº¥t', 'phải có ít nhất'], ['Ä‘Ãºng Ä‘á»‹nh dáº¡ng', 'đúng định dạng'],
  ['Ä‘Ã£ Ä‘Æ°á»£c sá»¯ dá»¥ng', 'đã được sử dụng'], ['thÃ nh cÃ´ng', 'thành công'],
  ['Ä Äƒng kÃ½ thÃ nh cÃ´ng', 'Đăng ký thành công'],
  ['Lá»—i há»‡ thá»‘ng', 'Lỗi hệ thống'], ['Ä‘áº§u tiÃªn', 'đầu tiên'],
  ['Ä‘áº§u', 'đầu'], ['Ä‘áº¿n', 'đến'],
  ['Ä‘áº¡i diá»‡n', 'đại diện'], ['Ä‘á»‹a chá»‰', 'địa chỉ'],
  ['Ä‘á» c truyá»‡n', 'đọc truyện'], ['Ä‘ang cáº­p nháº­t', 'đang cập nhật'],
  ['Ä‘Ã£ sao chÃ©p', 'đã sao chép'], ['liÃªn káº¿t vÃ o bá»™ nhá»› táº¡m', 'liên kết vào bộ nhớ tạm'],
  ['tiáº¿p chÆ°Æ¡ng', 'tiếp chương'], ['káº¿t quáº£', 'kết quả'],
  ['báº£o máº­t', 'bảo mật'], ['cá»§a báº¡n', 'của bạn'],
  ['yÃªu thÃ­ch', 'yêu thích'], ['XÃ³a', 'Xóa'], ['ThÃªm vÃ o', 'Thêm vào'],
  ['Ä‘áº§u yÃªu thÃ­ch', 'đầu yêu thích'], ['Ä ANG', 'ĐANG'],
  ['Ä oŒC', 'ĐỌC'], ['Dož', 'DỞ'], ['To¤C', 'TỤC'],
  ['TIáº¾P', 'TIẾP'], ['Ä ang', 'Đang'], ['bÃ¬a truyá»‡n', 'bìa truyện'],
  ['cá»±c hay táº¡i', 'cực hay tại'], ['Hà£y là', 'Hãy là'], ['ngưo i', 'người'],
  ['Ä‘áº§u tiÃªn', 'đầu tiên'], ['Ä ang bÃ¬nh luáº­n báº±ng', 'Đang bình luận bằng'],
  ['Go¬I', 'GỬI'], ['Bo¬I', 'BỞI'], ['M?I NHẤT', 'MỚI NHẤT'], ['CŨ NHẤT', 'CŨ NHẤT'],
  ['N?i dung d?c h?i', 'Nội dung độc hại'],
  ['Ä Äƒng kÃ½ quÃ¡', 'Đăng ký quá'], ['bÃ¬nh luáº­n', 'bình luận'],
  ['cáº­p nháº­t', 'cập nhật'], ['chÆ°Æ¡ng', 'chương']
];

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.match(/\.(js|ts|jsx|tsx|css)$/)) filelist.push(dirFile);
    }
  });
  return filelist;
}

const files = walkSync('src');
let changedFiles = 0;

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let newContent = content;
  
  replacements.forEach(([bad, good]) => {
     const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
     const regex = new RegExp(escapeRegExp(bad), 'g');
     newContent = newContent.replace(regex, good);
  });
  
  if (newContent !== content) {
     fs.writeFileSync(f, newContent, 'utf8');
     changedFiles++;
     console.log('Fixed:', f);
  }
});

console.log('Total files fixed:', changedFiles);
