const fs = require('fs');
const file = 'src/GiaoDien/ThanhPhan/CommentItem.js';
let content = fs.readFileSync(file, 'utf8');

const mappings = {
    'Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a bÃ¬nh luáº­n nÃ y?': 'Bạn có chắc chắn muốn xóa bình luận này?',
    'KhÃ´ng thá»ƒ xÃ³a bÃ¬nh luáº­n. Vui lÃ²ng thá»­ láº¡i.': 'Không thể xóa bình luận. Vui lòng thử lại.',
    'LÃ½ do bÃ¡o cÃ¡o ná»™i dung nÃ y (vÃ­ dá»¥: Ná»™i dung Ä‘á»™c háº¡i, Spam...):': 'Lý do báo cáo nội dung này (ví dụ: Nội dung độc hại, Spam...):',
    'Lá»—i gá»­i bÃ¡o cÃ¡o': 'Lỗi gửi báo cáo',
    'Ä‘Ã£ tráº£ lá» i': 'đã trả lời',
    'Tráº£ lá» i': 'Trả lời',
    'Viáº¿t cÃ¢u tráº£ lá» i...': 'Viết câu trả lời...',
    'Gá»­i': 'Gửi',
    'Há»§y': 'Hủy'
};

for (const [key, value] of Object.entries(mappings)) {
    content = content.split(key).join(value);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed CommentItem.js');
