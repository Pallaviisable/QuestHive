'use client';
import { useEffect, useState } from 'react';
import { getMyRewards, getMyCoins, getMyGroups, getRedeemOptions, redeemOption, createRedeemOption, getRedeemHistory, deleteRedeemOption } from '@/lib/api';

const MIN_COINS = 50;
const TYPE_CFG = {
  TASK_COMPLETION: { color:'#22c55e', label:'Task Completed' },
  STREAK_BONUS:    { color:'#f97316', label:'Streak Bonus'   },
  QUEST_MASTER:    { color:'#a855f7', label:'Quest Master'   },
  BONUS:           { color:'#f5c518', label:'Bonus'          },
};

export default function RewardsPage() {
  const [coins,         setCoins]         = useState(0);
  const [rewards,       setRewards]       = useState([]);
  const [groups,        setGroups]        = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [redeemOptions, setRedeemOptions] = useState([]);
  const [redeemHistory, setRedeemHistory] = useState([]);
  const [user,          setUser]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [toast,         setToast]         = useState(null);
  const [showCreate,    setShowCreate]    = useState(false);
  const [activeTab,     setActiveTab]     = useState('REDEEM');
  const [form,          setForm]          = useState({ title:'', description:'', coinsRequired:'' });

  useEffect(() => {
    const s = localStorage.getItem('user');
    if (s) setUser(JSON.parse(s));
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedGroup) { fetchRedeemOptions(); fetchRedeemHistory(); }
  }, [selectedGroup]);

  const showToast = (msg, ok=true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    try {
      const [rr, cr, gr] = await Promise.all([getMyRewards(), getMyCoins(), getMyGroups()]);
      setRewards(rr.data); setCoins(cr.data.coins); setGroups(gr.data);
      localStorage.setItem('coins', cr.data.coins);
      if (gr.data.length > 0) setSelectedGroup(gr.data[0].id);
    } catch(e){ console.error(e); } finally { setLoading(false); }
  };

  const fetchRedeemOptions = async () => {
    try { const r = await getRedeemOptions(selectedGroup); setRedeemOptions(r.data); } catch(e){}
  };

  const fetchRedeemHistory = async () => {
    try { const r = await getRedeemHistory(selectedGroup); setRedeemHistory(r.data); } catch(e){}
  };

  const handleRedeem = async (optId, cost) => {
    if (coins < cost) { showToast('Not enough coins. Keep completing tasks!', false); return; }
    try {
      await redeemOption(optId);
      showToast('Redeemed successfully!');
      fetchData(); fetchRedeemHistory();
    } catch(err){ showToast(err.response?.data?.message || 'Redemption failed.', false); }
  };

  const handleCreateOption = async (e) => {
    e.preventDefault();
    const cost = parseInt(form.coinsRequired);
    if (isNaN(cost) || cost < MIN_COINS) { showToast(`Minimum ${MIN_COINS} coins required.`, false); return; }
    try {
      await createRedeemOption(selectedGroup, { ...form, coinsRequired: cost });
      setShowCreate(false);
      setForm({ title:'', description:'', coinsRequired:'' });
      fetchRedeemOptions();
      showToast('Redeem option created!');
    } catch(err){ showToast(err.response?.data?.message || 'Failed to create option.', false); }
  };

  const handleDeleteOption = async (id) => {
    if (!confirm('Delete this redeem option?')) return;
    try { await deleteRedeemOption(id); fetchRedeemOptions(); } catch(e){}
  };

  const nextOption = redeemOptions.filter(o => o.coinsRequired > coins).sort((a,b) => a.coinsRequired - b.coinsRequired)[0];
  const progressPct = nextOption ? Math.min(100, Math.round((coins / nextOption.coinsRequired)*100)) : 100;

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', flexDirection:'column', gap:'14px' }}>
      <div style={{ width:'28px', height:'28px', border:'2px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <span style={{ fontSize:'13px', color:'var(--text-muted)' }}>Loading rewards...</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes toastIn{from{opacity:0;transform:translate(-50%,-12px)}to{opacity:1;transform:translate(-50%,0)}}
        .reward-card { transition: all 0.2s; }
        .reward-card:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,0,0,0.3); }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position:'fixed', top:'76px', left:'50%',
          transform:'translateX(-50%)',
          background: toast.ok ? 'rgba(34,197,94,0.95)' : 'rgba(239,68,68,0.95)',
          color:'#fff', borderRadius:'10px', padding:'10px 22px',
          fontWeight:600, fontSize:'13px', zIndex:9999,
          boxShadow:'0 4px 24px rgba(0,0,0,0.4)',
          animation:'toastIn 0.3s ease',
          whiteSpace:'nowrap',
        }}>{toast.msg}</div>
      )}

      <div style={{ animation:'fadeUp 0.4s cubic-bezier(0.16,1,0.3,1)' }}>

        {/* Header */}
        <div style={{ marginBottom:'24px' }}>
          <h1 style={{ fontSize:'22px', fontWeight:800, color:'var(--text-primary)', letterSpacing:'-0.3px', marginBottom:'3px' }}>Rewards</h1>
          <p style={{ fontSize:'13px', color:'var(--text-muted)', margin:0 }}>Earn coins, redeem rewards, track history</p>
        </div>

        {/* Coins hero */}
        <div style={{
          background:'var(--bg-card)', border:'1px solid rgba(245,197,24,0.2)',
          borderRadius:'16px', padding:'24px 28px', marginBottom:'24px',
          display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'20px',
          boxShadow:'0 0 32px rgba(245,197,24,0.05)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:'18px' }}>
            <div style={{
              width:'60px', height:'60px', borderRadius:'50%',
              background:'rgba(245,197,24,0.1)', border:'1.5px solid rgba(245,197,24,0.3)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 0 20px rgba(245,197,24,0.15)',
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#f5c518" opacity="0.15"/>
                <circle cx="12" cy="12" r="8" stroke="#f5c518" strokeWidth="1.5"/>
                <text x="12" y="16" textAnchor="middle" fill="#f5c518" fontSize="8" fontWeight="800">C</text>
              </svg>
            </div>
            <div>
              <div style={{ fontSize:'11px', color:'var(--text-muted)', fontWeight:600, letterSpacing:'0.5px', textTransform:'uppercase', marginBottom:'4px' }}>Your Balance</div>
              <div style={{ fontSize:'44px', fontWeight:900, color:'var(--accent)', lineHeight:1, letterSpacing:'-1px' }}>{coins}</div>
              <div style={{ fontSize:'12px', color:'var(--text-muted)', marginTop:'2px' }}>coins earned</div>
            </div>
          </div>

          {nextOption ? (
            <div style={{ minWidth:'220px', flex:1, maxWidth:'300px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px', fontSize:'12px' }}>
                <span style={{ color:'var(--text-muted)' }}>Next: <span style={{ color:'var(--text-primary)', fontWeight:600 }}>{nextOption.title}</span></span>
                <span style={{ color:'var(--accent)', fontWeight:700 }}>{progressPct}%</span>
              </div>
              <div style={{ background:'var(--bg-elevated)', borderRadius:'999px', height:'6px', overflow:'hidden' }}>
                <div style={{ width:`${progressPct}%`, height:'100%', borderRadius:'999px', background:'linear-gradient(90deg,var(--accent),#ffe066)', transition:'width 0.6s ease' }} />
              </div>
              <div style={{ fontSize:'11px', color:'var(--text-muted)', marginTop:'6px' }}>{nextOption.coinsRequired - coins} more coins needed</div>
            </div>
          ) : redeemOptions.length > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:'10px', padding:'12px 18px' }}>
              <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 8px #22c55e' }} />
              <span style={{ color:'#22c55e', fontWeight:700, fontSize:'13px' }}>You can afford all rewards!</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'4px', marginBottom:'24px', background:'var(--bg-elevated)', borderRadius:'10px', padding:'4px', width:'fit-content', border:'1px solid var(--border)' }}>
          {[{ key:'REDEEM', label:'Redeem' }, { key:'HISTORY', label:'History' }, { key:'REWARDS', label:'My Rewards' }].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              padding:'7px 20px', borderRadius:'7px', fontSize:'13px', fontWeight:600,
              background: activeTab === t.key ? 'var(--bg-card)' : 'transparent',
              color: activeTab === t.key ? 'var(--text-primary)' : 'var(--text-muted)',
              border: activeTab === t.key ? '1px solid var(--border)' : '1px solid transparent',
              cursor:'pointer', transition:'all 0.2s',
              boxShadow: activeTab === t.key ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
            }}>{t.label}</button>
          ))}
        </div>

        {/* REDEEM TAB */}
        {activeTab === 'REDEEM' && (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'12px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <label style={{ fontSize:'12px', color:'var(--text-muted)', fontWeight:600, whiteSpace:'nowrap' }}>Group</label>
                <select className="input" value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} style={{ fontSize:'13px', maxWidth:'220px' }}>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <button onClick={() => setShowCreate(true)} style={{
                background:'var(--accent)', color:'#000', border:'none', borderRadius:'10px',
                padding:'9px 18px', fontSize:'13px', fontWeight:700, cursor:'pointer',
                display:'flex', alignItems:'center', gap:'6px',
              }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Option
              </button>
            </div>

            {redeemOptions.length === 0 ? (
              <div style={{ textAlign:'center', padding:'64px 20px', background:'var(--bg-card)', borderRadius:'16px', border:'1px dashed var(--border-hover)' }}>
                <div style={{ width:'48px', height:'48px', borderRadius:'12px', background:'var(--bg-elevated)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                  <svg width="22" height="22" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
                </div>
                <p style={{ color:'var(--text-primary)', fontWeight:700, fontSize:'15px', marginBottom:'6px' }}>No redeem options yet</p>
                <p style={{ color:'var(--text-muted)', fontSize:'13px' }}>Add options for your group to redeem coins.</p>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(270px, 1fr))', gap:'14px' }}>
                {redeemOptions.map((opt, i) => {
                  const canAfford = coins >= opt.coinsRequired;
                  const pct = Math.min(100, Math.round((coins / opt.coinsRequired)*100));
                  return (
                    <div key={i} className="reward-card" style={{
                      background:'var(--bg-card)', borderRadius:'14px', padding:'20px',
                      border: canAfford ? '1px solid rgba(245,197,24,0.3)' : '1px solid var(--border)',
                      display:'flex', flexDirection:'column', gap:'14px',
                      boxShadow: canAfford ? '0 0 24px rgba(245,197,24,0.06)' : 'none',
                    }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                        <div style={{ width:'40px', height:'40px', borderRadius:'10px', background: canAfford ? 'rgba(245,197,24,0.12)' : 'var(--bg-elevated)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <svg width="18" height="18" fill="none" stroke={canAfford ? 'var(--accent)' : 'var(--text-muted)'} strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
                        </div>
                        <button onClick={() => handleDeleteOption(opt.id)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:'4px', display:'flex', alignItems:'center', transition:'color 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.color='#ef4444'}
                          onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                        </button>
                      </div>

                      <div>
                        <div style={{ fontSize:'15px', fontWeight:700, color:'var(--text-primary)', marginBottom:'4px' }}>{opt.title}</div>
                        {opt.description && <div style={{ fontSize:'12px', color:'var(--text-muted)', lineHeight:1.5 }}>{opt.description}</div>}
                      </div>

                      {!canAfford && (
                        <div style={{ background:'var(--bg-elevated)', borderRadius:'999px', height:'4px', overflow:'hidden' }}>
                          <div style={{ width:`${pct}%`, height:'100%', background:'var(--accent)', borderRadius:'999px', transition:'width 0.5s' }} />
                        </div>
                      )}

                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'auto' }}>
                        <div>
                          <div style={{ color:'var(--accent)', fontSize:'18px', fontWeight:800 }}>{opt.coinsRequired} coins</div>
                          {!canAfford && <div style={{ fontSize:'11px', color:'#ef4444', marginTop:'2px' }}>Need {opt.coinsRequired - coins} more</div>}
                        </div>
                        <button onClick={() => handleRedeem(opt.id, opt.coinsRequired)} disabled={!canAfford} style={{
                          padding:'9px 18px', borderRadius:'10px', fontWeight:700, fontSize:'13px',
                          border:'none', cursor: canAfford ? 'pointer' : 'not-allowed',
                          background: canAfford ? 'var(--accent)' : 'var(--bg-elevated)',
                          color: canAfford ? '#000' : 'var(--text-muted)',
                          transition:'all 0.2s',
                          boxShadow: canAfford ? '0 4px 14px rgba(245,197,24,0.25)' : 'none',
                        }}>
                          {canAfford ? 'Redeem' : 'Locked'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'HISTORY' && (
          <div>
            {/* Mini stats */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:'10px', marginBottom:'24px' }}>
              {[
                { label:'Total Earned',   value:`${rewards.reduce((s,r)=>s+(r.coinsEarned||0),0)} coins`, color:'var(--accent)' },
                { label:'Task Rewards',   value:rewards.filter(r=>r.type==='TASK_COMPLETION').length, color:'#22c55e' },
                { label:'Streak Bonuses', value:rewards.filter(r=>r.type==='STREAK_BONUS').length, color:'#f97316' },
                { label:'Quest Master',   value:rewards.filter(r=>r.type==='QUEST_MASTER').length, color:'#a855f7' },
              ].map((s,i) => (
                <div key={i} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'12px', padding:'16px', textAlign:'center' }}>
                  <div style={{ fontSize:'18px', fontWeight:800, color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:'10px', color:'var(--text-muted)', marginTop:'4px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.3px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize:'11px', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:'12px' }}>Earned History</div>

            {rewards.length === 0 ? (
              <div style={{ textAlign:'center', padding:'48px', background:'var(--bg-card)', borderRadius:'14px', border:'1px solid var(--border)' }}>
                <p style={{ color:'var(--text-muted)', fontSize:'13px' }}>No rewards yet. Complete tasks to earn coins!</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginBottom:'32px' }}>
                {[...rewards].sort((a,b) => new Date(b.earnedAt)-new Date(a.earnedAt)).map((r,i) => {
                  const cfg = TYPE_CFG[r.type] || TYPE_CFG['BONUS'];
                  return (
                    <div key={i} style={{
                      display:'flex', alignItems:'center', gap:'12px',
                      padding:'12px 16px', background:'var(--bg-card)',
                      borderRadius:'12px', border:`1px solid ${cfg.color}20`,
                    }}>
                      <div style={{ width:'36px', height:'36px', borderRadius:'9px', background:`${cfg.color}12`, border:`1px solid ${cfg.color}25`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:cfg.color, boxShadow:`0 0 6px ${cfg.color}` }} />
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'13px', fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.description || cfg.label}</div>
                        <div style={{ display:'flex', gap:'8px', marginTop:'3px', alignItems:'center' }}>
                          <span style={{ fontSize:'11px', color:'var(--text-muted)' }}>{new Date(r.earnedAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
                          <span style={{ fontSize:'10px', padding:'1px 6px', borderRadius:'999px', background:`${cfg.color}12`, color:cfg.color, fontWeight:700 }}>{cfg.label}</span>
                        </div>
                      </div>
                      {r.coinsEarned > 0 && (
                        <span style={{ background:'rgba(245,197,24,0.1)', border:'1px solid rgba(245,197,24,0.2)', borderRadius:'8px', padding:'4px 10px', color:'var(--accent)', fontWeight:700, fontSize:'13px', flexShrink:0 }}>+{r.coinsEarned}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ fontSize:'11px', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:'12px' }}>Redemption History</div>
            <div style={{ marginBottom:'16px' }}>
              <select className="input" value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} style={{ fontSize:'13px', maxWidth:'220px' }}>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            {redeemHistory.length === 0 ? (
              <div style={{ textAlign:'center', padding:'32px', background:'var(--bg-card)', borderRadius:'12px', border:'1px solid var(--border)' }}>
                <p style={{ color:'var(--text-muted)', fontSize:'13px' }}>No redemptions yet for this group.</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                {redeemHistory.map((r,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px', background:'var(--bg-card)', borderRadius:'12px', border:'1px solid var(--border)' }}>
                    <div style={{ width:'36px', height:'36px', borderRadius:'9px', background:'rgba(245,197,24,0.08)', border:'1px solid rgba(245,197,24,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg width="16" height="16" fill="none" stroke="var(--accent)" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'13px', fontWeight:600, color:'var(--text-primary)' }}>{r.optionTitle || 'Redeemed reward'}</div>
                      <div style={{ fontSize:'11px', color:'var(--text-muted)', marginTop:'2px' }}>{new Date(r.redeemedAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
                    </div>
                    <span style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'8px', padding:'4px 10px', color:'#ef4444', fontWeight:700, fontSize:'13px', flexShrink:0 }}>-{r.coinsSpent}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MY REWARDS TAB */}
        {activeTab === 'REWARDS' && (
          <div>
            {rewards.filter(r => r.type === 'QUEST_MASTER').length === 0 ? (
              <div style={{ textAlign:'center', padding:'64px 20px', background:'var(--bg-card)', borderRadius:'16px', border:'1px solid var(--border)' }}>
                <p style={{ color:'var(--text-muted)', fontSize:'13px' }}>No badges or titles earned yet.</p>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'12px' }}>
                {rewards.filter(r=>r.type==='QUEST_MASTER').map((r,i) => (
                  <div key={i} style={{ background:'rgba(168,85,247,0.06)', border:'1px solid rgba(168,85,247,0.2)', borderRadius:'14px', padding:'20px', textAlign:'center' }}>
                    <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'rgba(168,85,247,0.15)', border:'1.5px solid rgba(168,85,247,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
                      <svg width="22" height="22" fill="none" stroke="#a855f7" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    </div>
                    <div style={{ fontSize:'13px', fontWeight:700, color:'#a855f7' }}>Quest Master</div>
                    <div style={{ fontSize:'11px', color:'var(--text-muted)', marginTop:'4px' }}>{new Date(r.earnedAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Option Modal */}
      {showCreate && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(6px)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:200, padding:'80px 16px 16px', overflowY:'auto' }}>
          <div style={{ background:'var(--bg-card)', borderRadius:'18px', border:'1px solid var(--border-hover)', width:'100%', maxWidth:'420px', boxShadow:'0 24px 80px rgba(0,0,0,0.6)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 24px', borderBottom:'1px solid var(--border)' }}>
              <h2 style={{ fontSize:'16px', fontWeight:700, color:'var(--text-primary)', margin:0 }}>New Redeem Option</h2>
              <button onClick={() => setShowCreate(false)} style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', color:'var(--text-muted)', borderRadius:'7px', width:'30px', height:'30px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>
            <form onSubmit={handleCreateOption} style={{ padding:'22px 24px', display:'flex', flexDirection:'column', gap:'16px' }}>
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:700, color:'var(--text-muted)', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.4px' }}>Title *</label>
                <input className="input" placeholder="e.g. Coffee treat" value={form.title} onChange={e => setForm({...form,title:e.target.value})} required autoFocus />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:700, color:'var(--text-muted)', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.4px' }}>Description</label>
                <textarea className="input" placeholder="Optional details..." value={form.description} onChange={e => setForm({...form,description:e.target.value})} rows={2} style={{ resize:'none' }} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:700, color:'var(--text-muted)', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.4px' }}>Coins Required (min {MIN_COINS}) *</label>
                <input className="input" type="number" min={MIN_COINS} placeholder={`e.g. ${MIN_COINS}`} value={form.coinsRequired} onChange={e => setForm({...form,coinsRequired:e.target.value})} required />
              </div>
              <div style={{ display:'flex', gap:'10px', paddingTop:'4px' }}>
                <button type="button" onClick={() => setShowCreate(false)} style={{ flex:1, background:'none', border:'1px solid var(--border)', color:'var(--text-muted)', borderRadius:'10px', padding:'11px', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex:2, background:'var(--accent)', color:'#000', border:'none', borderRadius:'10px', padding:'11px', fontSize:'14px', fontWeight:700, cursor:'pointer' }}>Create Option</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
