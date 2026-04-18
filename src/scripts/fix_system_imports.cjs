const fs = require('fs');
const path = require('path');

const MAPPINGS = {
    // GiaoDien -> BoCuc
    '@/GiaoDien/Header': '@/GiaoDien/BoCuc/Header',
    '@/GiaoDien/Footer': '@/GiaoDien/BoCuc/Footer',
    '@/GiaoDien/MobileNav': '@/GiaoDien/BoCuc/MobileNav',
    '@/GiaoDien/BackToTop': '@/GiaoDien/BoCuc/BackToTop',
    '@/GiaoDien/DiscoveryTrigger': '@/GiaoDien/BoCuc/DiscoveryTrigger',
    '@/GiaoDien/MobileGenreNav': '@/GiaoDien/BoCuc/MobileGenreNav',
    '@/GiaoDien/NotificationBell': '@/GiaoDien/BoCuc/NotificationBell',

    // GiaoDien -> ThanhPhan
    '@/GiaoDien/MangaCard': '@/GiaoDien/ThanhPhan/MangaCard',
    '@/GiaoDien/LiveSearch': '@/GiaoDien/ThanhPhan/LiveSearch',
    '@/GiaoDien/CommentSection': '@/GiaoDien/ThanhPhan/CommentSection',
    '@/GiaoDien/CommentItem': '@/GiaoDien/ThanhPhan/CommentItem',
    '@/GiaoDien/ContinueReadingButton': '@/GiaoDien/ThanhPhan/ContinueReadingButton',
    '@/GiaoDien/DetailActions': '@/GiaoDien/ThanhPhan/DetailActions',
    '@/GiaoDien/DetailCover': '@/GiaoDien/ThanhPhan/DetailCover',
    '@/GiaoDien/EmptyState': '@/GiaoDien/ThanhPhan/EmptyState',
    '@/GiaoDien/ExpandableText': '@/GiaoDien/ThanhPhan/ExpandableText',
    '@/GiaoDien/FavoriteButton': '@/GiaoDien/ThanhPhan/FavoriteButton',
    '@/GiaoDien/FeaturedSlider': '@/GiaoDien/ThanhPhan/FeaturedSlider',
    '@/GiaoDien/Hero': '@/GiaoDien/ThanhPhan/Hero',
    '@/GiaoDien/RecentlyRead': '@/GiaoDien/ThanhPhan/RecentlyRead',
    '@/GiaoDien/RecommendedForYou': '@/GiaoDien/ThanhPhan/RecommendedForYou',
    '@/GiaoDien/RecrawlButton': '@/GiaoDien/ThanhPhan/RecrawlButton',
    '@/GiaoDien/ShareButton': '@/GiaoDien/ThanhPhan/ShareButton',
    '@/GiaoDien/TrendingTicker': '@/GiaoDien/ThanhPhan/TrendingTicker',
    '@/GiaoDien/ZenModeButton': '@/GiaoDien/ThanhPhan/ZenModeButton',

    // GiaoDien -> TrinhDoc
    '@/GiaoDien/ReaderHud': '@/GiaoDien/TrinhDoc/ReaderHud',
    '@/GiaoDien/ReaderSettings': '@/GiaoDien/TrinhDoc/ReaderSettings',
    '@/GiaoDien/ChapterSelector': '@/GiaoDien/TrinhDoc/ChapterSelector',
    '@/GiaoDien/ChapterPrefetcher': '@/GiaoDien/TrinhDoc/ChapterPrefetcher',
    '@/GiaoDien/EndPageCelebration': '@/GiaoDien/TrinhDoc/EndPageCelebration',
    '@/GiaoDien/NextChapterPrefetcher': '@/GiaoDien/TrinhDoc/NextChapterPrefetcher',
    '@/GiaoDien/ReaderManager': '@/GiaoDien/TrinhDoc/ReaderManager',
    '@/GiaoDien/ReadingProgressBar': '@/GiaoDien/TrinhDoc/ReadingProgressBar',

    // GiaoDien -> TienIch
    '@/GiaoDien/ToastProvider': '@/GiaoDien/TienIch/ToastProvider',
    '@/GiaoDien/SWRegistration': '@/GiaoDien/TienIch/SWRegistration',
    '@/GiaoDien/IndustrialSkeleton': '@/GiaoDien/TienIch/IndustrialSkeleton',
    '@/GiaoDien/IndustrialEmptyState': '@/GiaoDien/TienIch/IndustrialEmptyState',
    '@/GiaoDien/LevelUpOverlay': '@/GiaoDien/TienIch/LevelUpOverlay',
    '@/GiaoDien/HistoryRecorder': '@/GiaoDien/TienIch/HistoryRecorder',

    // HeThong -> API
    '@/HeThong/XuLyAPI': '@/HeThong/API/XuLyAPI',
    '@hethong/XuLyAPI': '@hethong/API/XuLyAPI',

    // HeThong -> BaoMat
    '@/HeThong/XacThuc': '@/HeThong/BaoMat/XacThuc',
    '@hethong/XacThuc': '@hethong/BaoMat/XacThuc',
    '@/HeThong/crypto': '@/HeThong/BaoMat/crypto',
    '@hethong/crypto': '@hethong/BaoMat/crypto',

    // HeThong -> Database
    '@/HeThong/CoSoDuLieu': '@/HeThong/Database/CoSoDuLieu',
    '@hethong/CoSoDuLieu': '@hethong/Database/CoSoDuLieu',
    '@/HeThong/BaoTri': '@/HeThong/Database/BaoTri',
    '@hethong/BaoTri': '@hethong/Database/BaoTri',

    // HeThong -> HangSo
    '@/HeThong/engagement': '@/HeThong/HangSo/engagement',
    '@hethong/engagement': '@hethong/HangSo/engagement',

    // TroThu -> Hooks (if any used @/TroThu directly)
    '@/TroThu/useIsMounted': '@/TroThu/Hooks/useIsMounted',
    '@/TroThu/useLocalStorage': '@/TroThu/Hooks/useLocalStorage',
    '@/TroThu/useHudScroll': '@/TroThu/Hooks/useHudScroll',
    '@/TroThu/useReaderKeys': '@/TroThu/Hooks/useReaderKeys',
};

function walkDir(dir, callback) {
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
        if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx') && !filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;

        let content = fs.readFileSync(filePath, 'utf8');
        let changed = false;

        for (const [oldPath, newPath] of Object.entries(MAPPINGS)) {
            // Check for both single and double quotes
            if (content.includes(`'${oldPath}'`) || content.includes(`"${oldPath}"`)) {
                content = content.split(`'${oldPath}'`).join(`'${newPath}'`);
                content = content.split(`"${oldPath}"`).join(`"${newPath}"`);
                changed = true;
            }
        }

        if (changed) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`[FIXED] ${filePath}`);
        }
    });
});

console.log('--- Import Repair Complete ---');
