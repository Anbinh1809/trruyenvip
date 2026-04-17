const fs = require('fs');
const path = require('path');

const MANGLED_MAP = {
    'TRUYÃŠNVIP': 'TRUYÊNVIP',
    'Ná» n táº£ng': 'Nền tảng',
    'Ä á» c Truyá»‡n': 'Đọc Truyện',
    'Tranh Online': 'Tranh Online',
    'Cao Cáº¥p': 'Cao Cấp',
    'siÃªu nhanh': 'siêu nhanh',
    'diá»‡n': 'diện',
    'tráº£i nghiá»‡m': 'trải nghiệm',
    'mÆ°á»£t mÃ ': 'mượt mà',
    'quáº£ng cÃ¡o': 'quảng cáo',
    'PhÃ¡m phÃ¡': 'Khám phá',
    'tháº¿ giá»›i': 'thế giới',
    'Ä‘á»‰nh cao': 'đỉnh cao',
    'vá»›i': 'với',
    'tuyá»‡t má»¹': 'tuyệt mỹ',
    'Trang chá»§': 'Trang chủ',
    'Bá»  qua Ä‘áº¿n': 'Bỏ qua đến',
    'ná»™i dung chÃ­nh': 'nội dung chính',
    'KHÃ M PHÃ ': 'KHÁM PHÁ',
    'KHO TRUYá»†N': 'KHO TRUYỆN',
    'CÃ’N TRá» NG': 'CÒN TRỐNG',
    'Báº¯t Ä‘áº§u xÃ¢y dá»±ng': 'Bắt đầu xây dựng',
    'tuyá»‡t pháº©m tinh hoa': 'tuyệt phẩm tinh hoa',
    'Ä ang truy xuáº¥t': 'Đang truy xuất',
    'Ä á»“ng bá»™': 'Đồng bộ',
    'vÄ©nh viá»…n': 'vĩnh viễn',
    'Ä Äƒng nháº­p': 'Đăng nhập',
    'KHÃ”NG TÃŒM THáº¤Y': 'KHÔNG TÌM THẤY',
    'Bộ truyện bạn yêu cầu khÃ´ng tồn tại': 'Bộ truyện bạn yêu cầu không tồn tại',
    'TRUYÃŠN': 'TRUYỆN',
    'khÃ´ng': 'không',
    'đá» c': 'đọc',
    'cáº­p': 'cập',
    'nháº­t': 'nhật',
    'Báº¡n': 'Bạn',
    'Ä‘Ã£': 'đã',
    'đáº¥p': 'đấp',
    'báº£n': 'bản',
    'quyá» n': 'quyền',
    'tá»‘c Ä‘á»™': 'tốc độ',
    'khá»•ng lá»“': 'khổng lồ',
    'Táº¤T Cáº¢': 'TẤT CẢ',
    'Vá»ªA': 'VỪA',
    'Vá»«a': 'Vừa',
    'Cáº¬P': 'CẬP',
    'TÃŒM': 'TÌM',
    'THáº¾': 'THẾ',
    'Bá»™': 'Bộ',
};

// Advanced: Also handle specific common mangled characters that appear in isolation
const CHAR_MAP = {
    'Ãª': 'ê',
    'á» ': 'ọ',
    'áº ': 'ả',
    'Ä á» ': 'Độ', // Watch out for over-replacing
    'Ä ': 'Đ',
    'áº¯': 'ắ',
    'á»‡': 'ệ',
    'Æ°': 'ư'
};

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const targetDirs = ['src/app', 'src/GiaoDien', 'src/HeThong', 'src/NguCanh', 'src/TroThu'];

targetDirs.forEach(targetDir => {
    if (!fs.existsSync(targetDir)) return;
    
    walkDir(targetDir, (filePath) => {
        if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx') && !filePath.endsWith('.ts') && !filePath.endsWith('.tsx') && !filePath.endsWith('.css')) return;

        let content = fs.readFileSync(filePath, 'utf8');
        let changed = false;

        // Pass 1: Word-based restoration
        for (const [mangled, correct] of Object.entries(MANGLED_MAP)) {
            if (content.includes(mangled)) {
                content = content.split(mangled).join(correct);
                changed = true;
            }
        }

        // Pass 2: Final cleanup for missed sequences (if safe)
        // Only run on strings that look clearly mangled
        if (content.includes('Ãª') || content.includes('á»') || content.includes('Ä')) {
             for (const [mangled, correct] of Object.entries(CHAR_MAP)) {
                if (content.includes(mangled)) {
                    content = content.split(mangled).join(correct);
                    changed = true;
                }
            }
        }

        if (changed) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`[SANITIZED] ${filePath}`);
        }
    });
});

console.log('--- TITAN ENCODING REPAIR COMPLETE ---');
