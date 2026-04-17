const fs = require('fs');
const path = require('path');

// MAP OF MANGLED BYTE SEQUENCES TO CORRECT UTF-8 STRINGS
// We define them as hex strings to avoid JS encoding interference
const BYTE_REPLACEMENT_MAP = [
    // Äá»ˆNH CAO -> ĐỈNH CAO
    { mangled: 'c38420e1bb88', correct: 'c490e1bb8a' }, // 'Ä á»' -> 'Độ' or similar
    // Actually, let's use a simpler mapping for common mangled patterns
    { mangled: 'c3aaxcc82', correct: 'e1babf' }, // Generic 'ế' repair
    // Looking at common mangled strings:
    // Nâ» n tÃ¡ng -> Nền tảng
    { mangled: '4ec3a1', correct: 'e1baa3' }, 
];

// RE-WRITING THE REPAIR LOGIC TO USE BUFFER MATCHING
function repairBuffer(buf) {
    let content = buf.toString('utf8');
    let changed = false;

    // Standard mangled patterns found in browser/view_file
    const STRING_REPLACEMENTS = {
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
        'Vá»ªA': 'VỪA',
        'Cáº¬P': 'CẬP',
        'THáº¾': 'THẾ',
        'KhÃ¡m phÃ¡': 'Khám phá',
        'tuyá»‡t': 'tuyệt',
        'cáº¥p': 'cấp',
        'diá»‡n': 'diện',
        'Cao Cáº¥p': 'Cao Cấp',
        'Báº¡n': 'Bạn',
        'Ä‘Ã£': 'đã',
        'Đà': 'Đã',
        'đà': 'đã',
        'hệ tho‘ng': 'hệ thống',
        'no™i dung': 'nội dung',
        'nguo“n': 'nguồn',
        'pháº£n ho“i': 'phản hồi',
        'Tho­ láº¡i': 'Thử lại',
        'Lo—i káº¿t no‘i': 'Lỗi kết nối',
        'Ä o’NG Bo˜ Do® LIo†U': 'ĐỒNG BỘ DỮ LIỆU',
        'trà­ch xuáº¥t': 'trích xuất',
        'thưo ng': 'thường',
        'già¢y': 'giây',
        'khoáº£ng': 'khoảng',
        'mình': 'mình',
        'táº¥t cáº£': 'tất cả',
        'truy cáº­p': 'truy cập',
        'thông bÃ¡o': 'thông báo',
        'Vui là²ng': 'Vui lòng',
        'báº¥m': 'bấm',
        'cà o': 'cào',
        'báº­n': 'bận',
        'khoáº£ng': 'khoảng',
    };

    for (const [mangled, correct] of Object.entries(STRING_REPLACEMENTS)) {
        if (content.includes(mangled)) {
            content = content.split(mangled).join(correct);
            changed = true;
        }
    }

    // Specific isolated characters that cause most pain
    const CHAR_REPLACEMENTS = {
        'Ãª': 'ê',
        'á» ': 'ọ',
        'áº ': 'ả',
        'Ä ': 'Đ',
        'á»‡': 'ệ',
        'áº¯': 'ắ',
        'Æ°': 'ư',
        'Ã¡': 'á',
        'Ã': 'à', // cautious
        'á»«': 'ừ',
        'á»§': 'ủ',
        'á»': 'o' // very cautious
    };

    // Only apply character replacements if we see a mangling pattern nearby
    if (content.includes('Ã') || content.includes('á»') || content.includes('Ä')) {
        for (const [mangled, correct] of Object.entries(CHAR_REPLACEMENTS)) {
            if (content.includes(mangled)) {
                content = content.split(mangled).join(correct);
                changed = true;
            }
        }
    }

    return changed ? Buffer.from(content, 'utf8') : buf;
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

        let originalBuf = fs.readFileSync(filePath);
        let repairedBuf = repairBuffer(originalBuf);

        if (originalBuf.length !== repairedBuf.length || originalBuf.compare(repairedBuf) !== 0) {
            fs.writeFileSync(filePath, repairedBuf);
            console.log(`[PIVOTAL-FIX] ${filePath}`);
        }
    });
});

console.log('--- REBIRTH: ENCODING SURGERY COMPLETE ---');
