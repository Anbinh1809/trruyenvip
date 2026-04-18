const fs = require('fs');
const file = 'src/GiaoDien/ThanhPhan/LiveSearch.js';
let content = fs.readFileSync(file, 'utf8');

const mappings = {
    'Ä á»“ng bá»™ dá»¯ liá»‡u thÃ nh cÃ´ng!': 'Đồng bộ dữ liệu thành công!',
    'Tính năng ¬tính năng đang phát triển.': 'Tính năng này hiện đang bảo trì.',
    'Lá»—i káº¿t ná»‘i mÃ¡y chá»§.': 'Lỗi kết nối máy chủ.',
    'TÃ¬m truyá»‡n hoáº·c dÃ¡n link NetTruyen...': 'Tìm truyện hoặc dán link NetTruyen...',
    'Ä ANG Ä á»’NG Bá»˜...': 'ĐANG ĐỒNG BỘ...',
    'Dá»’N Dá»® LIá»†U NGUá»’N NGOÃ€I': 'DỒN DỮ LIỆU NGUỒN NGOÀI',
    'Ä ang cáº­p nháº­t': 'Đang cập nhật',
    'KHÃ”NG TÃŒM THáº¤Y': 'KHÔNG TÌM THẤY',
    'Thá»­ tá»« khÃ³a khÃ¡c hoáº·c dÃ¡n link truyá»‡n.': 'Thử từ khóa khác hoặc dán link truyện.'
};

for (const [key, value] of Object.entries(mappings)) {
    content = content.split(key).join(value);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed LiveSearch.js');
