/**
 * Engagement System Constants
 */

export const RANKS = [
  { lv: 1, title: 'Thành viên mới', chest: 'Wood' },
  { lv: 6, title: 'Thành viên tích cực', chest: 'Stone' },
  { lv: 11, title: 'Độc giả trung thành', chest: 'Bronze' },
  { lv: 21, title: 'Độc giả gạo cội', chest: 'Silver' },
  { lv: 36, title: 'Chuyên gia đọc truyện', chest: 'Gold' },
  { lv: 51, title: 'Hội viên cao cấp', chest: 'Platinum' },
  { lv: 100, title: 'Thành viên danh dự', chest: 'Diamond' },
  { lv: 150, title: 'Thành viên tinh anh', chest: 'Supreme' }
];

export const MISSION_TYPES = {
    READ_CHAPTER: 'READ_CHAPTER',
    READ_PROGRESS: 'READ_PROGRESS',
    COMMENT: 'COMMENT',
    DAILY_LOGIN: 'DAILY_LOGIN',
    GENRE_DIVERSITY: 'GENRE_DIVERSITY'
};

export const CHEST_DATA = {
    Wood: { name: 'Rương Gỗ', color: '#8B4513', loot: [{ type: 'xp', range: [10, 20], weight: 100 }] },
    Stone: { name: 'Rương Đá', color: '#808080', loot: [{ type: 'xp', range: [30, 50], weight: 100 }] },
    Bronze: { name: 'Rương Đồng', color: '#CD7F32', loot: [{ type: 'xp', range: [50, 80], weight: 99 }, { type: 'coin', range: [50, 250], weight: 1 }] },
    Silver: { name: 'Rương Bạc', color: '#C0C0C0', loot: [{ type: 'xp', range: [100, 200], weight: 97 }, { type: 'coin', range: [250, 500], weight: 3 }] },
    Gold: { name: 'Rương Vàng', color: '#FFD700', loot: [{ type: 'xp', range: [200, 500], weight: 95 }, { type: 'coin', range: [500, 1200], weight: 5 }] },
    Platinum: { name: 'Rương Bạch Kim', color: '#E5E4E2', loot: [{ type: 'xp', range: [500, 1000], weight: 92.5 }, { type: 'coin', range: [1000, 2500], weight: 7 }, { type: 'coin', range: [5000, 5000], weight: 0.5 }] },
    Diamond: { name: 'Rương Kim Cương', color: '#B9F2FF', loot: [{ type: 'xp', range: [1000, 2000], weight: 90 }, { type: 'coin', range: [2500, 5000], weight: 10 }] },
    Supreme: { name: 'Rương Tối Thượng', color: '#FF0000', loot: [{ type: 'xp', range: [2000, 5000], weight: 85 }, { type: 'coin', range: [5000, 10000], weight: 15 }] }
};

export const calculateRank = (xp) => {
    const level = Math.floor(xp / 100) + 1;
    const rank = [...RANKS].reverse().find(r => level >= r.lv);
    return { level, title: rank ? rank.title : 'Thành viên mới' };
};
