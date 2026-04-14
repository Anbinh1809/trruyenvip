'use client';

import { createContext, useContext, useReducer, useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import LevelUpOverlay from '@/components/LevelUpOverlay';
import { useAuth } from './AuthContext';

import { RANKS, MISSION_TYPES, CHEST_DATA } from '@/lib/constants/engagement';

const EngagementContext = createContext();

export { RANKS, calculateRank } from '@/lib/constants/engagement';

const initialState = {
  xp: 0,
  vipCoins: 0,
  level: 1,
  rankTitle: 'Cấp 1',
  userUuid: '',
  checkInStreak: 0,
  lastCheckIn: '',
  dailyMissions: {
    date: new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }),
    missions: [
        { id: 1, type: MISSION_TYPES.DAILY_LOGIN, target: 1, current: 0, label: 'Điểm danh hằng ngày', xp: 50, claimed: false },
        { id: 2, type: MISSION_TYPES.READ_CHAPTER, target: 10, current: 0, label: 'Đọc 10 chương truyện', xp: 100, claimed: false },
        { id: 3, type: MISSION_TYPES.READ_PROGRESS, target: 15, current: 0, label: 'Đọc truyện 15 phút', xp: 150, claimed: false },
        { id: 4, type: MISSION_TYPES.COMMENT, target: 2, current: 0, label: 'Gửi 2 bình luận', xp: 100, claimed: false },
        { id: 5, type: MISSION_TYPES.GENRE_DIVERSITY, target: 3, current: 0, label: 'Đọc 3 thể loại khác nhau', xp: 200, claimed: false }
    ]
  }
};

function engagementReducer(state, action) {
  switch (action.type) {
    case 'SYNC_USER': {
        const { xp, vipCoins, uuid, isServerSync } = action.payload;
        if (state.xp === xp && state.vipCoins === vipCoins && state.userUuid === uuid) return state;

        const level = Math.floor(xp / 100) + 1;
        const rank = [...RANKS].reverse().find(r => level >= r.lv);

        if (typeof window !== 'undefined') {
            localStorage.setItem('truyenvip_xp', xp.toString());
            localStorage.setItem('truyenvip_coins', vipCoins.toString());
            localStorage.setItem('truyenvip_user_uuid', uuid);
        }

        return {
         ...state,
         xp,
         vipCoins,
         userUuid: uuid,
         level,
         rankTitle: rank ? rank.title : 'Thành viên mới'
        };
    }
    case 'ADD_XP': {
      const nextXp = state.xp + action.amount;
      const nextLevel = Math.floor(nextXp / 100) + 1;
      const rank = [...RANKS].reverse().find(r => nextLevel >= r.lv);
      localStorage.setItem('truyenvip_xp', nextXp.toString());
      return {
        ...state,
        xp: nextXp,
        level: nextLevel,
        rankTitle: rank ? rank.title : 'Thành viên mới'
      };
    }
    case 'ADD_COINS': {
        const nextCoins = state.vipCoins + action.amount;
        localStorage.setItem('truyenvip_coins', nextCoins.toString());
        return { ...state, vipCoins: nextCoins };
    }
    case 'DEDUCT_COINS': {
        const nextCoins = Math.max(0, state.vipCoins - action.amount);
        localStorage.setItem('truyenvip_coins', nextCoins.toString());
        return { ...state, vipCoins: nextCoins };
    }
    case 'UPDATE_MISSION': {
        const { type, increment } = action;
        const idx = state.dailyMissions.missions.findIndex(m => m.type === type);
        if (idx === -1 || state.dailyMissions.missions[idx].current >= state.dailyMissions.missions[idx].target) return state;
        
        const newMissions = [...state.dailyMissions.missions];
        newMissions[idx] = { ...newMissions[idx], current: Math.min(newMissions[idx].target, newMissions[idx].current + increment) };
        const nextMissions = { ...state.dailyMissions, missions: newMissions };
        localStorage.setItem('truyenvip_daily_missions', JSON.stringify(nextMissions));
        return { ...state, dailyMissions: nextMissions };
    }
    case 'CLAIM_MISSION': {
        const { missionId } = action;
        const idx = state.dailyMissions.missions.findIndex(m => m.id === missionId);
        if (idx === -1) return state;
        const newMissions = [...state.dailyMissions.missions];
        newMissions[idx] = { ...newMissions[idx], claimed: true };
        const nextMissions = { ...state.dailyMissions, missions: newMissions };
        localStorage.setItem('truyenvip_daily_missions', JSON.stringify(nextMissions));
        return { ...state, dailyMissions: nextMissions };
    }
    case 'RESET_MISSIONS': {
        const nextMissions = { ...initialState.dailyMissions, date: new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }) };
        localStorage.setItem('truyenvip_daily_missions', JSON.stringify(nextMissions));
        return { ...state, dailyMissions: nextMissions };
    }
    case 'CHECK_IN': {
        const { today, nextStreak } = action;
        localStorage.setItem('truyenvip_last_checkin', today || '');
        localStorage.setItem('truyenvip_checkin_streak', (nextStreak || 0).toString());
        return { ...state, lastCheckIn: today, checkInStreak: nextStreak };
    }
    default:
      return state;
  }
}

export function EngagementProvider({ children }) {
  const { addToast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [state, dispatch] = useReducer(engagementReducer, initialState);
  const [celebrationQueue, setCelebrationQueue] = useState([]);
  const [activeCelebration, setActiveCelebration] = useState(null);
  const [mounted, setMounted] = useState(false);
  
  const lastSyncRef = useRef({ xp: -1, coins: -1 });
  const hasCelebratedLevelRef = useRef(1);
  const isFirstSyncRef = useRef(true);
  const pendingDeltasRef = useRef({ xp: 0, coins: 0 });
  const isSyncingRef = useRef(false);
  const lastXpGainTimeRef = useRef(0); // TITAN THROTTLE
  const [isTabActive, setIsTabActive] = useState(true);

  const syncToServer = useCallback(async () => {
    // Check if there is anything to sync or if already syncing
    if (!isAuthenticated || isSyncingRef.current) return;
    if (pendingDeltasRef.current.xp === 0 && pendingDeltasRef.current.coins === 0) return;

    isSyncingRef.current = true;
    
    // ATOMIC SNAPSHOT: Capture current deltas to send, but keep the original ref for new updates
    const snapshot = { ...pendingDeltasRef.current };

    try {
        const res = await fetch('/api/auth/update-stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ xpDelta: snapshot.xp, coinDelta: snapshot.coins })
        });
        
        if (res.ok) {
            // SUCCESS: Subtract exactly what we synced from the buffer
            // This ensures XP earned *during* this fetch is preserved
            pendingDeltasRef.current.xp -= snapshot.xp;
            pendingDeltasRef.current.coins -= snapshot.coins;
        } else {
             const data = await res.json();
             // If rate limited, we just wait for next cycle
             if (res.status !== 429) {
                console.error('Failed to sync engagement deltas:', data.error);
             }
        }
    } catch (e) {
        console.error('Network error during engagement sync', e);
        // On error, we don't subtract; deltas will stay in buffer for next attempt
    } finally {
        isSyncingRef.current = false;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
        const timer = setInterval(syncToServer, 5000);

        // FINAL SYNC BEFORE DEPARTURE
        const handleBeforeUnload = () => {
            if (pendingDeltasRef.current.xp > 0 || pendingDeltasRef.current.coins > 0) {
               // TITAN RELIABILITY: Use fetch with keepalive:true to ensure completion
               // sendBeacon doesn't allow custom headers like application/json easily
               fetch('/api/auth/update-stats', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    xpDelta: pendingDeltasRef.current.xp, 
                    coinDelta: pendingDeltasRef.current.coins 
                  }),
                  keepalive: true
               });
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            clearInterval(timer);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            syncToServer();
        };
    }
  }, [isAuthenticated, syncToServer]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedXp = parseInt(localStorage.getItem('truyenvip_xp') || '0');
    const savedCoins = parseInt(localStorage.getItem('truyenvip_coins') || '0');
    const savedLastCheckIn = localStorage.getItem('truyenvip_last_checkin') || '';
    const savedStreak = parseInt(localStorage.getItem('truyenvip_checkin_streak') || '0');
    let savedUuid = localStorage.getItem('truyenvip_user_uuid');
    if (!savedUuid) {
        savedUuid = 'v-' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('truyenvip_user_uuid', savedUuid);
    }
    hasCelebratedLevelRef.current = Math.floor(savedXp / 100) + 1;
    setMounted(true);

    // Multi-Tab Presence Sync: Listen for updates from other tabs
    const handleStorageChange = (e) => {
        if (e.key === 'truyenvip_xp' || e.key === 'truyenvip_coins') {
            const nextXp = parseInt(localStorage.getItem('truyenvip_xp') || '0');
            const nextCoins = parseInt(localStorage.getItem('truyenvip_coins') || '0');
            const nextUuid = localStorage.getItem('truyenvip_user_uuid') || '';
            
            // Sync internal state with the new storage values (ServerSync: false to avoid loop)
            dispatch({ type: 'SYNC_USER', payload: { xp: nextXp, vipCoins: nextCoins, uuid: nextUuid } });
        }
    };

    const handleVisibilityChange = () => {
        setIsTabActive(document.visibilityState === 'visible');
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const uXp = user?.xp ?? 0;
  const uCoins = user?.vipCoins ?? 0;
  const uUuid = user?.uuid ?? '';

  useEffect(() => {
    if (isAuthenticated) {
        // RECONCILIATION: Server baseline + Local unsynced deltas
        // This prevents the server's slightly-stale session data from wiping out 
        // local XP that hasn't finished hitting the sync loop yet.
        const adjustedXp = uXp + pendingDeltasRef.current.xp;
        const adjustedCoins = uCoins + pendingDeltasRef.current.coins;

        if (adjustedXp !== lastSyncRef.current.xp || adjustedCoins !== lastSyncRef.current.coins) {
            const nextLevel = Math.floor(adjustedXp / 100) + 1;
            
            // TITAN LOGIN FIX: If this is the first server sync, align the celebration ref
            // to the current level to prevent back-filling a queue of fireworks for levels 
            // the user already earned in previous sessions.
            if (isFirstSyncRef.current) {
                hasCelebratedLevelRef.current = nextLevel;
                isFirstSyncRef.current = false;
            }

            dispatch({ type: 'SYNC_USER', payload: { 
                xp: adjustedXp, 
                vipCoins: adjustedCoins, 
                uuid: uUuid, 
                isServerSync: true 
            }});
            lastSyncRef.current = { xp: adjustedXp, coins: adjustedCoins };
        }
    }
  }, [isAuthenticated, uXp, uCoins, uUuid]);

  // DAILY MISSION AUTO-RESET (Midnight Guardian - Server Powered)
  useEffect(() => {
    if (!mounted) return;
    const checkDateChange = async () => {
        try {
            const timeRes = await fetch('/api/system/time');
            const { dateString } = await timeRes.json();
            
            if (state.dailyMissions.date !== dateString) {
                console.log('[Engagement] New day detected by Server. Resetting daily missions.');
                dispatch({ type: 'RESET_MISSIONS' });
                // We also update the mission date to the server's date string
                localStorage.setItem('truyenvip_daily_missions', JSON.stringify({ ...state.dailyMissions, date: dateString }));
            }
        } catch (e) {
            // Fallback to local if server time fails
            const today = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
            if (state.dailyMissions.date !== today) {
                dispatch({ type: 'RESET_MISSIONS' });
            }
        }
    };
    checkDateChange();
    const timer = setInterval(checkDateChange, 300000); // Check every 5 minutes
    return () => clearInterval(timer);
  }, [mounted, state.dailyMissions.date, state.dailyMissions]);

  useEffect(() => {
      if (mounted && state.level > hasCelebratedLevelRef.current) {
          const newLevels = [];
          for (let i = hasCelebratedLevelRef.current + 1; i <= state.level; i++) {
              newLevels.push(i);
          }
          setCelebrationQueue(prev => [...prev, ...newLevels]);
          hasCelebratedLevelRef.current = state.level;
      }
  }, [state.level, mounted]);

  useEffect(() => {
      if (!activeCelebration && celebrationQueue.length > 0) {
          const nextLevel = celebrationQueue[0];
          setActiveCelebration(nextLevel);
          setCelebrationQueue(prev => prev.slice(1));
      }
  }, [celebrationQueue, activeCelebration]);

  const addXp = useCallback((amount, silent = false) => {
    const now = Date.now();
    // TITAN THROTTLE: Prevent XP spamming (10s cooldown)
    if (!silent && now - lastXpGainTimeRef.current < 10000) {
        if (addToast) addToast("Hệ thống ghi nhận hoạt động quá nhanh, vui lòng chờ giây lát!", "info");
        return;
    }
    
    if (!silent) lastXpGainTimeRef.current = now;

    dispatch({ type: 'ADD_XP', amount });
    pendingDeltasRef.current.xp += amount;
    if (!silent && addToast) addToast(`+${amount} XP`, 'xp');
  }, [addToast]);

  const addCoins = useCallback((amount, silent = false) => {
    dispatch({ type: 'ADD_COINS', amount });
    pendingDeltasRef.current.coins += amount;
    if (!silent && addToast) addToast(`+${amount} VipCoins`, 'coin');
  }, [addToast]);

  const deductCoins = useCallback((amount) => {
    dispatch({ type: 'DEDUCT_COINS', amount });
    pendingDeltasRef.current.coins -= amount;
  }, []);

  const updateMission = useCallback((type, increment = 1) => {
    dispatch({ type: 'UPDATE_MISSION', type, increment });
  }, []);

  const checkIn = useCallback((forcedDate) => {
    const today = forcedDate || new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
    if (state.lastCheckIn === today) return { success: false, msg: 'Bạn đã điểm danh hôm nay rồi!' };

    let nextStreak = state.checkInStreak + 1;
    if (state.lastCheckIn) {
        const lastDate = new Date(state.lastCheckIn);
        const nowDate = new Date(today);
        lastDate.setHours(0,0,0,0);
        nowDate.setHours(0,0,0,0);
        const diffDays = Math.round((nowDate - lastDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return { success: false, msg: 'Bạn đã điểm danh hôm nay rồi!' };
        if (diffDays > 1) nextStreak = 1;
    }

    dispatch({ type: 'CHECK_IN', today, nextStreak });
    const xpReward = 50 + (nextStreak * 10);
    const coinReward = 100 + (nextStreak * 20);
    addXp(xpReward, true);
    addCoins(coinReward, true);

    let msg = `Điểm danh thành công! Nhận ${xpReward} XP & ${coinReward} VipCoins.`;
    if (nextStreak === 7) {
        addCoins(1000, true);
        msg += " CHÚC MỪNG: Thưởng chuỗi 7 ngày +1000 VipCoins!";
    }
    if (addToast) addToast(msg, 'success');
    return { success: true, msg };
  }, [state.lastCheckIn, state.checkInStreak, addXp, addCoins, addToast]);

  const openChest = useCallback((missionId) => {
    const m = state.dailyMissions.missions.find(mi => mi.id === missionId);
    if (!m || m.claimed || m.current < m.target) return;

    const currentRank = [...RANKS].reverse().find(r => state.level >= r.lv);
    const chestType = currentRank ? currentRank.chest : 'Wood';
    const chest = CHEST_DATA[chestType];
    const rand = Math.random() * 100;
    let accumulated = 0;
    let prize = null;

    for (const item of chest.loot) {
        accumulated += item.weight;
        if (rand <= accumulated) {
            const amount = Math.floor(Math.random() * (item.range[1] - item.range[0] + 1)) + item.range[0];
            prize = { type: item.type, amount, name: chest.name };
            break;
        }
    }

    if (prize) {
        dispatch({ type: 'CLAIM_MISSION', missionId });
        if (prize.type === 'xp') addXp(prize.amount, true);
        else addCoins(prize.amount, true);
        if (addToast) addToast(`Mở ${prize.name}: +${prize.amount} ${prize.type === 'xp' ? 'XP' : 'VipCoins'}`, prize.type === 'xp' ? 'xp' : 'coin');
        return { ...prize, chestName: chest.name };
    }
    return null;
  }, [state.dailyMissions, state.level, addXp, addCoins, addToast]);

  const getRankInfo = useCallback((currentXp) => {
    const calculatedLevel = Math.floor(currentXp / 100) + 1;
    return [...RANKS].reverse().find(r => calculatedLevel >= r.lv) || { title: 'Thành viên mới', chest: 'Wood' };
  }, []);

  const memoValue = useMemo(() => ({
    ...state,
    xpProgress: state.xp % 100,
    addXp, addCoins, deductCoins,
    updateMission, openChest, checkIn,
    getRankInfo,
    mounted
  }), [state, addXp, addCoins, deductCoins, updateMission, openChest, checkIn, getRankInfo, mounted]);

  useEffect(() => {
    if (mounted) document.body.classList.add('titan-mounted');
  }, [mounted]);

  return (
    <EngagementContext.Provider value={memoValue}>
      {children}
      {mounted && activeCelebration && (
        <LevelUpOverlay 
            level={activeCelebration} 
            rank={[...RANKS].reverse().find(r => activeCelebration >= r.lv)?.title || 'Cấp 1'} 
            onComplete={() => setActiveCelebration(null)} 
        />
      )}
    </EngagementContext.Provider>
  );
}

export const useEngagement = () => useContext(EngagementContext);
