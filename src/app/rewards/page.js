'use client';

import Header from '@/GiaoDien/BoCuc/Header';
import Footer from '@/GiaoDien/BoCuc/Footer';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/NguCanh/AuthContext';
import { useEngagement } from '@/NguCanh/EngagementContext';
import { useToast } from '@/GiaoDien/TienIch/ToastProvider';
import { Coins, Landmark, CheckCircle, Clock, AlertTriangle, XCircle, CreditCard } from 'lucide-react';

const REWARDS_CATALOG = [
    { label: 'Ràºt 10.000Ä‘', value: 10, cost: 10000, color: '#ff3e3e' },
    { label: 'Ràºt 20.000Ä‘', value: 20, cost: 20000, color: '#3b82f6' },
    { label: 'Ràºt 50.000Ä‘', value: 50, cost: 50000, color: '#10b981' },
    { label: 'Ràºt 100.000Ä‘', value: 100, cost: 100000, color: '#f59e0b' },
];

const BANK_LIST = [
    'Vietcombank', 'MB Bank', 'Techcombank', 'VietinBank', 
    'Agribank', 'BIDV', 'TPBank', 'VPBank', 'ACB', 
    'MoMo (E-Wallet)', 'ZaloPay (E-Wallet)'
];

export default function RewardsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { vipCoins, mounted, deductCoins } = useEngagement();
  const { addToast } = useToast();
  
  const [bankName, setBankName] = useState(BANK_LIST[0]);
  const [accountNo, setAccountNo] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('info');

  const fetchHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
        const res = await fetch('/api/redemption');
        if (res.ok) {
            const data = await res.json();
            setHistory(data);
        }
    } catch (e) {
        console.error('Fetch error', e);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
        const timer = setTimeout(() => fetchHistory(), 0);
        return () => clearTimeout(timer);
    }
  }, [isAuthenticated, fetchHistory]);

  const removeAccents = (str) => {
    return str.normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/Ä‘/g, 'd').replace(/Ä/g, 'D')
              .toUpperCase();
  };

  const handleRedeem = async (item) => {
    if (vipCoins < item.cost) {
      setMsg('So‘ dư VipCoins không Ä‘ủ Ä‘oƒ ràºt tion.');
      setMsgType('error');
      return;
    }
    if (!accountNo || !accountHolder) {
      setMsg('Vui lòng cung cấp STK và  Tên chủ tà i khoản.');
      setMsgType('error');
      return;
    }

    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/redemption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bankName, 
          accountNo, 
          accountHolder: removeAccents(accountHolder), 
          amount: item.value
        })
      });

      if (res.ok) {
        addToast('Yêu cáº§u ràºt tion thành công!', 'success');
        deductCoins(item.cost); // TITAN SYNC: Immediate local balance update
        setMsg(`Yêu cáº§u ràºt ${item.value}k vo ${bankName} đã Ä‘ưo£c gửi. Chàºng tà´i sáº½ xử là½ trong và²ng 24 gio.`);
        setMsgType('success');
        setAccountNo('');
        setAccountHolder('');
        fetchHistory();
      } else {
        const errText = await res.text();
        setMsg('Ràºt tion tháº¥t báº¡i: ' + errText);
        setMsgType('error');
      }
    } catch (e) {
      setMsg('Lỗi kết nối máy chủ.');
      setMsgType('error');
    }
    setLoading(false);
  };

  if (authLoading || !mounted) return (
    <div className="fullscreen-loader-industrial">
        <div className="loader-titan-ring" />
        <style jsx>{`
            .fullscreen-loader-industrial {
                height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: var(--bg-primary);
            }
        `}</style>
    </div>
  );

  return (
    <main className="main-wrapper titan-bg">
      <Header />
      
      <div className="container rewards-container fade-in">
        <div className="rewards-header-box">
               <h1 className="rewards-title-industrial">Ràºt Tion Tà i Khoản</h1>
               <p className="rewards-subtitle-industrial">Cà y truyện nháº­n thưoŸng. Chuyoƒn tion trựcc tiáº¿p vo ngà¢n hà ng của báº¡n. To· lệ quy Ä‘o•i: 1 VipCoin = 1 VNÄ.</p>
               
               <div className="coins-display-industrial">
                  <Coins size={40} color="#fbbf24" strokeWidth={1.5} />
                  <div className="coins-meta-industrial">
                      <span className="coins-label-industrial">VipCoins hiện cà³</span>
                      <div className="coins-amount-industrial">{vipCoins.toLocaleString()}</div>
                  </div>
               </div>
        </div>

        <div className="rewards-main-grid-industrial">
          {/* FORM SECTION */}
          <div className="redemption-form-card shadow-titan">
                <h3 className="form-title-industrial">
                    <Landmark size={24} color="var(--accent)" /> THà”NG TIN THo¤ HÆ¯ožNG
                </h3>
                
                <div className="input-field-industrial">
                        <label className="field-label-titan">NGà‚N Hà€NG / Và ÄIộN To¬</label>
                        <select className="select-titan-industrial" value={bankName} onChange={(e) => setBankName(e.target.value)}>
                            {BANK_LIST.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                </div>
                
                <div className="input-field-industrial">
                        <label className="field-label-titan">So Tà€I KHOáº¢N</label>
                        <input className="input-titan-industrial" type="text" placeholder="Nháº­p so‘ tà i khoản..." value={accountNo} onChange={(e) => setAccountNo(e.target.value)} />
                </div>

                <div className="input-field-industrial">
                        <label className="field-label-titan">TàŠN CHo¦ Tà€I KHOáº¢N (KHà”NG Dáº¤U)</label>
                        <input className="input-titan-industrial uppercase-text" type="text" placeholder="NGUYEN VAN A..." value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} />
                </div>

                {msg && (
                    <div className={`form-message-industrial fade-in ${msgType}`}>
                        {msgType === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                        <span>{msg}</span>
                    </div>
                )}
                
                <div className="form-safety-hint">
                    <CheckCircle size={14} className="text-secondary" />
                    Bảo máº­t 256-bit SSL. Giao do‹ch an toà n tuyệt Ä‘o‘i.
                </div>
          </div>

          {/* CATALOG SECTION */}
          <div className="redemption-catalog-industrial">
                <h3 className="catalog-title-industrial">CHoŒN MộNH GIà RàšT</h3>
                <div className="redeem-grid-titan">
                    {REWARDS_CATALOG.map(item => (
                        <div key={item.value} className="redeem-card-titan">
                            <div className="card-icon-industrial" style={{ color: item.color }}>
                                <CreditCard size={48} strokeWidth={1.5} />
                            </div>
                            <h4 className="card-label-industrial">{item.label}</h4>
                            <p className="card-cost-industrial">To‘n {item.cost.toLocaleString()} Coins</p>
                            <button 
                                className="btn btn-primary redeem-btn-titan" 
                                disabled={loading || vipCoins < item.cost}
                                onClick={() => handleRedeem(item)}
                                style={{ background: vipCoins < item.cost ? 'rgba(255,255,255,0.05)' : item.color }}
                            >
                                {loading ? '...' : (vipCoins < item.cost ? 'Chưa Ä‘ủ Coins' : 'Ràºt ngay')}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="redemption-history-section">
                        <h3 className="history-title-industrial">
                            <Clock size={24} color="#60a5fa" /> LoŠCH So¬ GIAO DoŠCH
                        </h3>
                        <div className="history-list-industrial glass-scrollbar">
                            {history.map(req => (
                                <div key={req.id} className="history-item-industrial">
                                    <div className="history-main-info">
                                        <div className="history-value-row">{req.card_value}k â†’ <span className="bank-name-industrial">{req.bank_name || 'Legacy'}</span></div>
                                        <div className="history-time-industrial">{new Date(req.created_at).toLocaleString('vi-VN')}</div>
                                    </div>
                                    <div className={`status-pill-industrial ${req.status.toLowerCase()}`}>
                                        <div className="status-dot" />
                                        <span>{req.status === 'Pending' ? 'CHoœ DUYộT' : (req.status === 'Done' ? 'HOà€N Táº¤T' : 'Toª CHoI')}</span>
                                    </div>
                                </div>
                            ))}
                            {history.length === 0 && <div className="history-empty-state">Chưa cà³ giao do‹ch nà o Ä‘ưo£c thựcc hiện.</div>}
                        </div>
                </div>
          </div>
        </div>
      </div>
      <Footer />
      <style jsx>{`
        .rewards-container {
            padding-top: 140px;
            padding-bottom: 100px;
        }
        .rewards-title-industrial {
            font-size: 3.5rem; 
            font-weight: 950; 
            margin-bottom: 20px; 
            color: var(--accent);
            letter-spacing: -3px;
        }
        .rewards-subtitle-industrial {
            color: rgba(255,255,255,0.4); 
            font-size: 1.1rem; 
            max-width: 650px; 
            margin: 0 auto 50px; 
            font-weight: 600;
            line-height: 1.7;
        }
        .coins-meta-industrial { text-align: left; }
        .coins-label-industrial {
            font-size: 0.75rem; 
            font-weight: 900; 
            opacity: 0.5; 
            text-transform: uppercase;
            letter-spacing: 1.5px;
        }
        .coins-amount-industrial {
            font-size: 2rem; 
            font-weight: 950;
            letter-spacing: -1px;
            color: white;
        }
        .rewards-main-grid-industrial {
            display: grid; 
            grid-template-columns: 380px 1fr; 
            gap: 60px;
            align-items: flex-start;
        }
        .redemption-form-card {
            padding: 40px; 
            border-radius: 24px; 
            background: rgba(15, 23, 42, 0.4);
            border: 1px solid var(--glass-border);
            backdrop-filter: blur(20px);
        }
        .form-title-industrial {
            font-size: 1.2rem; 
            font-weight: 950; 
            margin-bottom: 40px; 
            display: flex; 
            align-items: center; 
            gap: 12px;
            color: white;
            letter-spacing: 0.5px;
        }
        .field-label-titan {
            display: block;
            font-size: 0.75rem;
            font-weight: 950;
            color: rgba(255, 255, 255, 0.4);
            margin-bottom: 12px;
            letter-spacing: 1px;
        }
        .input-field-industrial { margin-bottom: 25px; }
        .select-titan-industrial, .input-titan-industrial {
            width: 100%;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--glass-border);
            padding: 15px 20px;
            border-radius: 12px;
            color: white;
            font-weight: 700;
            font-size: 1rem;
            outline: none;
            transition: all 0.3s;
        }
        .select-titan-industrial:focus, .input-titan-industrial:focus {
            border-color: var(--accent);
            background: rgba(255, 255, 255, 0.08);
        }
        .uppercase-text { text-transform: uppercase; }
        .form-message-industrial {
            padding: 20px; 
            border-radius: 16px; 
            font-weight: 800; 
            display: flex; 
            align-items: center; 
            gap: 12px;
            font-size: 0.9rem;
            line-height: 1.5;
            margin-top: 30px;
        }
        .form-message-industrial.success {
            background: rgba(16, 185, 129, 0.1); 
            color: #10b981; 
            border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .form-message-industrial.error {
            background: rgba(255, 62, 62, 0.1); 
            color: var(--accent); 
            border: 1px solid rgba(255, 62, 62, 0.2);
        }
        .form-safety-hint {
            margin-top: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            font-size: 0.75rem;
            font-weight: 700;
            color: rgba(255, 255, 255, 0.2);
        }
        .catalog-title-industrial {
            font-size: 1.4rem;
            font-weight: 950;
            margin-bottom: 30px;
            letter-spacing: 1px;
            color: white;
        }
        .card-icon-industrial { margin-bottom: 20px; opacity: 0.8; }
        .card-label-industrial { font-size: 1.5rem; font-weight: 950; margin-bottom: 8px; color: white; }
        .card-cost-industrial { font-size: 0.9rem; font-weight: 700; color: rgba(255, 255, 255, 0.4); margin-bottom: 25px; }
        .redeem-btn-titan { width: 100%; border-radius: 12px; font-weight: 950; font-size: 1rem; padding: 14px; }
        .redemption-history-section { margin-top: 80px; }
        .history-title-industrial {
            font-size: 1.4rem;
            font-weight: 950;
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            gap: 15px;
            color: white;
            letter-spacing: 0.5px;
        }
        .history-list-industrial {
            background: rgba(15, 23, 42, 0.3);
            border-radius: 20px;
            border: 1px solid var(--glass-border);
            max-height: 500px;
            overflow-y: auto;
        }
        .history-item-industrial {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 25px 30px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            transition: background 0.3s;
        }
        .history-item-industrial:hover { background: rgba(255, 255, 255, 0.02); }
        .history-item-industrial:last-child { border-bottom: none; }
        .history-value-row { font-size: 1.3rem; font-weight: 950; color: white; margin-bottom: 4px; }
        .bank-name-industrial { color: #60a5fa; }
        .history-time-industrial { font-size: 0.8rem; font-weight: 700; color: rgba(255, 255, 255, 0.3); }
        .status-pill-industrial {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 18px;
            border-radius: 40px;
            font-size: 0.75rem;
            font-weight: 950;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            letter-spacing: 1px;
        }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; }
        .status-pill-industrial.pending { color: #ffa500; }
        .status-pill-industrial.pending .status-dot { background: #ffa500; box-shadow: 0 0 10px #ffa500; }
        .status-pill-industrial.done { color: #10b981; }
        .status-pill-industrial.done .status-dot { background: #10b981; box-shadow: 0 0 10px #10b981; }
        .status-pill-industrial.rejected { color: #ef4444; }
        .status-pill-industrial.rejected .status-dot { background: #ef4444; box-shadow: 0 0 10px #ef4444; }
        .history-empty-state { padding: 80px; text-align: center; color: rgba(255, 255, 255, 0.2); font-weight: 800; }
        @media (max-width: 1024px) {
            .rewards-main-grid-industrial { grid-template-columns: 1fr; }
            .rewards-title-industrial { font-size: 2.5rem; }
        }
      `}</style>
    </main>
  );
}

