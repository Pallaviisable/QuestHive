'use client';
import { useEffect, useState } from 'react';
import { getMyRewards, getMyCoins, getMyGroups, getRedeemOptions, redeemOption, createRedeemOption, getRedeemHistory, deleteRedeemOption } from '@/lib/api';

const MIN_COINS = 50;

export default function RewardsPage() {
  const [coins, setCoins] = useState(0);
  const [rewards, setRewards] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [redeemOptions, setRedeemOptions] = useState([]);
  const [redeemHistory, setRedeemHistory] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [activeTab, setActiveTab] = useState('REDEEM');
  const [isAdmin, setIsAdmin] = useState(false);
  const [newOption, setNewOption] = useState({ title: '', description: '', coinsRequired: '' });

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchRedeemOptions();
      fetchRedeemHistory();
    }
  }, [selectedGroup]);

  useEffect(() => {
    if (groups.length > 0 && selectedGroup) {
      const stored = localStorage.getItem('user');
      if (!stored) return;
      const u = JSON.parse(stored);
      const grp = groups.find(g => g.id === selectedGroup);
      setIsAdmin(grp?.adminId === u?.id);
    }
  }, [groups, selectedGroup]);

  const fetchData = async () => {
    try {
      const [rewardsRes, coinsRes, groupsRes] = await Promise.all([
        getMyRewards(), getMyCoins(), getMyGroups()
      ]);
      setRewards(rewardsRes.data);
      setCoins(coinsRes.data.coins);
      setGroups(groupsRes.data);
      localStorage.setItem('coins', coinsRes.data.coins);
      if (groupsRes.data.length > 0) setSelectedGroup(groupsRes.data[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRedeemOptions = async () => {
    try {
      const res = await getRedeemOptions(selectedGroup);
      setRedeemOptions(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchRedeemHistory = async () => {
    try {
      const res = await getRedeemHistory(selectedGroup);
      setRedeemHistory(res.data);
    } catch (err) { console.error(err); }
  };

  const handleRedeem = async (optionId, cost) => {
    if (coins < cost) {
      setMsg('❌ Not enough coins. Keep completing tasks! 🐝');
      setTimeout(() => setMsg(''), 3000);
      return;
    }
    try {
      await redeemOption(optionId);
      setMsg('🎉 Redeemed successfully!');
      setTimeout(() => setMsg(''), 3000);
      fetchData();
      fetchRedeemHistory();
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || 'Redemption failed.'));
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const handleCreateOption = async () => {
    const cost = parseInt(newOption.coinsRequired);
    if (!newOption.title.trim()) {
      setMsg('❌ Please enter a title.');
      setTimeout(() => setMsg(''), 3000);
      return;
    }
    if (isNaN(cost) || cost < MIN_COINS) {
      setMsg(`❌ Minimum coins required is ${MIN_COINS}.`);
      setTimeout(() => setMsg(''), 3000);
      return;
    }
    try {
      await createRedeemOption(selectedGroup, { ...newOption, coinsRequired: cost });
      setNewOption({ title: '', description: '', coinsRequired: '' });
      fetchRedeemOptions();
      setMsg('✅ Redeem option created!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || 'Failed to create option.'));
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const handleDeleteOption = async (optionId) => {
    if (!confirm('Delete this redeem option?')) return;
    try {
      await deleteRedeemOption(optionId);
      fetchRedeemOptions();
    } catch (err) { console.error(err); }
  };

  const redeemRewards = rewards.filter(r => r.description?.startsWith('Redeemed:'));

  const nextOption = redeemOptions
    .filter(o => o.coinsRequired > coins)
    .sort((a, b) => a.coinsRequired - b.coinsRequired)[0];
  const progressPct = nextOption
    ? Math.min(100, Math.round((coins / nextOption.coinsRequired) * 100))
    : 100;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', flexDirection: 'column', gap: '12px' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid #f5c518', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <p style={{ color: '#f5c518', fontWeight: 600 }}>Loading rewards...</p>
    </div>
  );

  return (
    <div className="animate-fadeSlideUp">

      {msg && (
        <div style={{
          position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)',
          background: msg.includes('❌') ? 'rgba(239,68,68,0.95)' : 'rgba(34,197,94,0.95)',
          color: '#fff', borderRadius: '12px', padding: '12px 24px',
          fontWeight: 600, fontSize: '14px', zIndex: 9998,
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)', animation: 'fadeSlideUp 0.3s ease',
          whiteSpace: 'nowrap',
        }}>{msg}</div>
      )}

      {/* Coins Hero Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(245,197,24,0.18), rgba(245,197,24,0.04))',
        border: '1px solid rgba(245,197,24,0.35)',
        borderRadius: '24px', padding: '32px 36px', marginBottom: '28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'rgba(245,197,24,0.15)', border: '2px solid rgba(245,197,24,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px',
          }}>🪙</div>
          <div>
            <div style={{ fontSize: '13px', color: '#a0a0a0', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Your Balance</div>
            <div style={{ fontSize: '52px', fontWeight: 900, color: '#f5c518', lineHeight: 1 }}>{coins}</div>
            <div style={{ color: '#a0a0a0', fontSize: '13px', marginTop: '2px' }}>coins earned</div>
          </div>
        </div>
        {nextOption && (
          <div style={{ minWidth: '220px', flex: 1, maxWidth: '320px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
              <span style={{ color: '#a0a0a0' }}>Next: <span style={{ color: '#fff', fontWeight: 600 }}>{nextOption.title}</span></span>
              <span style={{ color: '#f5c518', fontWeight: 700 }}>{progressPct}%</span>
            </div>
            <div style={{ background: '#2a2a2a', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
              <div style={{ width: `${progressPct}%`, height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg, #f5c518, #ffe066)', transition: 'width 0.6s ease' }} />
            </div>
            <div style={{ fontSize: '11px', color: '#555', marginTop: '6px' }}>{nextOption.coinsRequired - coins} more coins needed</div>
          </div>
        )}
        {!nextOption && redeemOptions.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '12px', padding: '12px 20px' }}>
            <span style={{ fontSize: '20px' }}>🎉</span>
            <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '14px' }}>You can afford all rewards!</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', background: '#1a1a1a', borderRadius: '14px', padding: '5px', width: 'fit-content', border: '1px solid #2a2a2a' }}>
        {[
          { key: 'REDEEM',  label: '🎁 Redeem' },
          { key: 'HISTORY', label: '🧾 History' },
          { key: 'REWARDS', label: '📜 My Rewards' },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: '8px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
            background: activeTab === t.key ? '#f5c518' : 'transparent',
            color: activeTab === t.key ? '#000' : '#a0a0a0',
            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* REDEEM TAB */}
      {activeTab === 'REDEEM' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <label style={{ color: '#a0a0a0', fontSize: '13px', whiteSpace: 'nowrap' }}>Group:</label>
            <select className="input" value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} style={{ fontSize: '13px', maxWidth: '240px' }}>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          {/* CREATE REDEEM OPTION FORM */}
          {isAdmin && (
            <div style={{
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
            }}>
              <h3 style={{ color: '#f5c518', fontWeight: 700, fontSize: '16px', marginBottom: '20px' }}>
                🎁 Create Redeem Option
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ color: '#a0a0a0', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Title</label>
                  <input className="input" placeholder="e.g. Choose dinner tonight" value={newOption.title} onChange={e => setNewOption({ ...newOption, title: e.target.value })} />
                </div>
                <div>
                  <label style={{ color: '#a0a0a0', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</label>
                  <input className="input" placeholder="e.g. Winner picks the restaurant" value={newOption.description} onChange={e => setNewOption({ ...newOption, description: e.target.value })} />
                </div>
                <div>
                  <label style={{ color: '#a0a0a0', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Coins Required 🪙</label>
                  <input className="input" type="number" min="50" placeholder="Minimum 50 coins" value={newOption.coinsRequired} onChange={e => setNewOption({ ...newOption, coinsRequired: e.target.value })} style={{ width: '200px' }} />
                  <p style={{ color: '#555', fontSize: '11px', marginTop: '4px' }}>Minimum 50 coins required</p>
                </div>
                <div style={{ paddingTop: '4px' }}>
                  <button className="btn-primary" onClick={handleCreateOption} style={{ width: '100%' }}>+ Create Redeem Option</button>
                </div>
              </div>
            </div>
          )}

          {redeemOptions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#1a1a1a', borderRadius: '16px', border: '1px dashed #2a2a2a' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎁</div>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>No redeem options yet</p>
              <p style={{ color: '#a0a0a0', fontSize: '13px' }}>Add options for your group to redeem coins.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {redeemOptions.map((option, i) => {
                const canAfford = coins >= option.coinsRequired;
                return (
                  <div key={i} style={{
                    background: '#1a1a1a', borderRadius: '16px', padding: '20px',
                    border: canAfford ? '1px solid rgba(245,197,24,0.4)' : '1px solid #2a2a2a',
                    display: 'flex', flexDirection: 'column', gap: '12px', transition: 'all 0.2s',
                    boxShadow: canAfford ? '0 0 20px rgba(245,197,24,0.08)' : 'none',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: canAfford ? 'rgba(245,197,24,0.15)' : '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>🎁</div>
                      <button onClick={() => handleDeleteOption(option.id)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', padding: '4px', fontSize: '16px', transition: 'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color = '#444'}>🗑️</button>
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{option.title}</div>
                      {option.description && <div style={{ fontSize: '12px', color: '#a0a0a0', lineHeight: 1.5 }}>{option.description}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                      <div>
                        <div style={{ color: '#f5c518', fontSize: '18px', fontWeight: 800 }}>🪙 {option.coinsRequired}</div>
                        {!canAfford && <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '2px' }}>Need {option.coinsRequired - coins} more</div>}
                      </div>
                      <button onClick={() => handleRedeem(option.id, option.coinsRequired)} disabled={!canAfford} style={{
                        padding: '9px 18px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', border: 'none',
                        cursor: canAfford ? 'pointer' : 'not-allowed',
                        background: canAfford ? '#f5c518' : '#2a2a2a',
                        color: canAfford ? '#000' : '#555', transition: 'all 0.2s',
                      }}>{canAfford ? 'Redeem ✨' : 'Locked 🔒'}</button>
                    </div>
                    {!canAfford && (
                      <div style={{ background: '#2a2a2a', borderRadius: '999px', height: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, Math.round((coins / option.coinsRequired) * 100))}%`, height: '100%', background: '#f5c518', borderRadius: '999px', transition: 'width 0.5s ease' }} />
                      </div>
                    )}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <label style={{ color: '#a0a0a0', fontSize: '13px', whiteSpace: 'nowrap' }}>Group:</label>
            <select className="input" value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} style={{ fontSize: '13px', maxWidth: '240px' }}>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          {redeemHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#1a1a1a', borderRadius: '16px', border: '1px dashed #2a2a2a' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🧾</div>
              <p style={{ color: '#fff', fontWeight: 700, marginBottom: '6px' }}>No redemptions yet</p>
              <p style={{ color: '#a0a0a0', fontSize: '13px' }}>Redeem coins to see history here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {redeemHistory.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', background: '#1a1a1a', borderRadius: '14px', border: '1px solid #2a2a2a' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🎁</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{r.description}</div>
                    <div style={{ fontSize: '12px', color: '#a0a0a0', marginTop: '2px' }}>{new Date(r.earnedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  </div>
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '4px 10px', color: '#ef4444', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>−{Math.abs(r.coinsEarned)}🪙</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MY REWARDS TAB */}
      {activeTab === 'REWARDS' && (
        <div>
          {redeemRewards.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#1a1a1a', borderRadius: '16px', border: '1px dashed #2a2a2a' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📜</div>
              <p style={{ color: '#fff', fontWeight: 700, marginBottom: '6px' }}>No rewards redeemed yet</p>
              <p style={{ color: '#a0a0a0', fontSize: '13px' }}>Earn coins by completing tasks and redeem them!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {redeemRewards.map((reward, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', background: '#1a1a1a', borderRadius: '14px', border: '1px solid #2a2a2a' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245,197,24,0.1)', border: '1px solid rgba(245,197,24,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🏆</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{reward.description}</div>
                    <div style={{ fontSize: '12px', color: '#a0a0a0', marginTop: '2px' }}>{new Date(reward.earnedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  </div>
                  <div style={{ background: 'rgba(245,197,24,0.1)', border: '1px solid rgba(245,197,24,0.2)', borderRadius: '8px', padding: '4px 10px', color: '#f5c518', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>{reward.coinsEarned}🪙</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}