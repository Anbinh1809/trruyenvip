const fs = require('fs');
const path = require('path');

const STRING_MAP = {
    'THẾ GIošI': 'THẾ GIỚI',
    'Tháº¿ giá»›i': 'Thế giới',
    'to‘t': 'tốt',
    'to‘t nháº¥t': 'tốt nhất',
    'nho¯ng': 'những',
    'nhÆ°': 'như',
    'mÆ°á»£t': 'mượt',
    'mÆ°á»£t mà': 'mượt mà',
    'tráº¡i': 'trải',
    'ná»™i': 'nội',
    'nguá»“n': 'nguồn',
    'pháº£n': 'phản',
    'ho“i': 'hồi',
    'káº¿t': 'kết',
    'no‘i': 'nối',
    'tá»‘c': 'tốc',
    'đá»™': 'độ',
    'siÃªu': 'siêu',
    'khá»•ng': 'khổng',
    'lá»“': 'lồ',
    'khoáº£ng': 'khoảng',
    'già¢y': 'giây',
    'cáº­p': 'cập',
    'nháº­t': 'nhật',
    'Vá»ªA': 'VỪA',
    'Cáº¬P': 'CẬP',
    'TÃŒM': 'TÌM',
    'THáº¾': 'THẾ',
    'Bá»™': 'Bộ',
    'Báº¡n': 'Bạn',
    'Đã': 'Đã',
    'đã': 'đã',
    'Tho­ láº¡i': 'Thử lại',
    'Hệ thong': 'Hệ thống',
    'hệ thong': 'hệ thống',
    'cào': 'cào',
    'bận': 'bận',
    'ĐANG ĐO’NG BO’': 'ĐANG ĐỒNG BỘ',
    'DỮ LIỆU': 'DỮ LIỆU',
    'trích xuất': 'trích xuất',
    'thuờng': 'thường',
    'ĐANG KHỞI TẠO': 'ĐANG KHỞI TẠO',
    'ĐÀ SẴN SÀNG': 'ĐÃ SẴN SÀNG',
    'TIẾP TỤC ĐỌC': 'TIẾP TỤC ĐỌC',
    'TRUYỆN ĐANG HOT': 'TRUYỆN ĐANG HOT',
    'VỪA CẬP NHẬT': 'VỪA CẬP NHẬT',
    'Ná» n táº£ng': 'Nền tảng',
    'Ä á» c Truyá»‡n': 'Đọc Truyện',
    'siÃªu nhanh': 'siêu nhanh',
    'tráº£i nghiá»‡m': 'trải nghiệm',
    'mÆ°á»£t mÃ ': 'mượt mà',
    'quáº£ng cÃ¡o': 'quảng cáo',
    'Ä‘á»‰nh cao': 'đình cao',
    'Ä á»ˆNH CAO': 'ĐỈNH CAO',
    'TIáº¾P Tá»¤C Ä á»ŒC': 'TIẾP TỤC ĐỌC',
    'TRUYÃŠN': 'TRUYỆN',
    'KhÃ¡m phÃ¡': 'Khám phá',
    'tuyá»‡t': 'tuyệt',
    'cáº¥p': 'cấp',
    'diá»‡n': 'diện',
    'Cao Cáº¥p': 'Cao Cấp',
    'Ä‘Ã£': 'đã',
    'Đà': 'Đã',
    'đà': 'đã',
    'no™i dung': 'nội dung',
    'nguo“n': 'nguồn',
    'pháº£n ho“i': 'phản hồi',
    'Lo—i káº¿t no‘i': 'Lỗi kết nối',
    'Ä o’NG Bo˜ Do® LIo†U': 'ĐỒNG BỘ DỮ LIỆU',
    'trà­ch xuáº¥t': 'trích xuất',
    'thưo ng': 'thường',
    'mình': 'mình',
    'táº¥t cáº£': 'tất cả',
    'truy cáº­p': 'truy cập',
    'thông bÃ¡o': 'thông báo',
    'Vui là²ng': 'Vui lòng',
    'báº¥m': 'bấm',
    'cà o': 'cào',
    'báº­n': 'bận',
    'Ä ồnng bo™': 'Đồng bộ',
    'thà nh cà´ng': 'thành công',
    'Bo˜': 'Bộ',
    'Ä ANG': 'ĐANG',
    'Ä ỒNG': 'ĐỒNG',
    'DỒN': 'ĐỒNG',
    'NGUỒN NGOÀI': 'NGUỒN NGOÀI',
    'Ä ang': 'Đang',
};

// CHARACTER-LEVEL REMAPPING (CRAWLING THE DEEPEST CORRUPTION)
const CHAR_MAP = {
    'oš': 'Ớ',
    'oˆ': 'ố', // or ồ, defaults to common
    'o¯': 'ữ',
    'o†': 'ộ',
    'o’': 'Ồ',
    'o“': 'ồn',
    'o±': 'ực',
    'o­': 'ử',
    'á»›': 'ớ',
    'á»³': 'ỳ',
    'á»£': 'ợ',
    'á»¹': 'ỹ',
    'áº£': 'ả',
    'áº£': 'ả',
    'á»ƒ': 'ể',
    'áº¹': 'ẹ',
    'á»‹': 'ị',
};

function processContent(content) {
    let changed = false;
    
    // Pass 1: Global Strings
    for (const [mangled, correct] of Object.entries(STRING_MAP)) {
        if (content.includes(mangled)) {
            content = content.split(mangled).join(correct);
            changed = true;
        }
    }

    // Pass 2: Character fragments (only if it looks mangled)
    if (content.includes('o') || content.includes('á')) {
        for (const [mangled, correct] of Object.entries(CHAR_MAP)) {
            if (content.includes(mangled)) {
                content = content.split(mangled).join(correct);
                changed = true;
            }
        }
    }

    return { content, changed };
}

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
    walkDir(targetDir, (filePath) => {
        if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx') && !filePath.endsWith('.tsx') && !filePath.endsWith('.css')) return;

        let original = fs.readFileSync(filePath, 'utf8');
        let { content: repaired, changed } = processContent(original);

        if (changed) {
            fs.writeFileSync(filePath, repaired, 'utf8');
            console.log(`[ULTIMATE-FIX] ${filePath}`);
        }
    });
});

console.log('--- TITAN ULTIMATE SANITIZATION COMPLETE ---');
