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
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState('REWARDS');
  const [form, setForm] = useState({ title: '', description: '', coinsRequired: '' });

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
      return;
    }
    try {
      await redeemOption(optionId);
      setMsg('🎉 Redeemed successfully!');
      fetchData();
      fetchRedeemHistory();
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || 'Redemption failed.'));
    }
  };

  const handleCreateOption = async (e) => {
    e.preventDefault();
    const coins = parseInt(form.coinsRequired);
    if (isNaN(coins) || coins < MIN_COINS) {
      setMsg(`❌ Minimum coins required is ${MIN_COINS}.`);
      return;
    }
    try {
      await createRedeemOption(selectedGroup, { ...form, coinsRequired: coins });
      setShowCreate(false);
      setForm({ title: '', description: '', coinsRequired: '' });
      fetchRedeemOptions();
      setMsg('✅ Redeem option created!');
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.message || 'Failed to create option.'));
    }
  };

  const handleDeleteOption = async (optionId) => {
    if (!confirm('Delete this redeem option?')) return;
    try {
      await deleteRedeemOption(optionId);
      fetchRedeemOptions();
    } catch (err) { console.error(err); }
  };

  // ← Filter reward history: only show redeemed items (not task completions)
  const redeemRewards = rewards.filter(r => r.description?.startsWith('Redeemed:'));

  return (
    <div className="animate-fadeSlideUp">
      {/* Coins Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(245,197,24,0.15), rgba(245,197,24,0.05))',
        border: '1px solid rgba(245,197,24,0.3)',
        borderRadius: '20px', padding: '32px', marginBottom: '32px',
        display: 'flex', alignItems: 'center', gap: '24px',
      }}>
        <div style={{ fontSize: '64px' }}>🪙</div>
        <div>
          <div style={{ fontSize: '48px', fontWeight: 900, color: '#f5c518', lineHeight: 1 }}>{coins}</div>
          <div style={{ color: '#a0a0a0', fontSize: '16px', marginTop: '4px' }}>Total Coins</div>
        </div>
      </div>

      {msg && (
        <div style={{
          background: msg.includes('❌') ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
          border: `1px solid ${msg.includes('❌') ? '#ef4444' : '#22c55e'}`,
          borderRadius: '8px', padding: '10px 14px',
          color: msg.includes('❌') ? '#ef4444' : '#22c55e',
          fontSize: '13px', marginBottom: '16px',
        }}>{msg}</div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[
          { key: 'REWARDS', label: '📜 Reward History' },
          { key: 'REDEEM', label: '🎁 Redeem' },
          { key: 'HISTORY', label: '🧾 Redeem History' },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: '8px 20px', borderRadius: '999px', fontSize: '13px', fontWeight: 600,
            background: activeTab === t.key ? '#f5c518' : '#222',
            color: activeTab === t.key ? '#000' : '#a0a0a0',
            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Reward History Tab — only redeemed items */}
      {activeTab === 'REWARDS' && (
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>📜 Your Redeemed Rewards</h2>
          {loading ? (
            <div style={{ color: '#a0a0a0', textAlign: 'center', padding: '20px' }}>Loading...</div>
          ) : redeemRewards.length === 0 ? (
            <div style={{ color: '#a0a0a0', textAlign: 'center', padding: '20px' }}>
              No rewards redeemed yet. Earn coins and redeem them! 🎁
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {redeemRewards.map((reward, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px', background: '#222', borderRadius: '10px',
                }}>
                  <span style={{ fontSize: '20px' }}>🎁</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{reward.description}</div>
                    <div style={{ fontSize: '11px', color: '#a0a0a0' }}>
                      {new Date(reward.earnedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>{reward.coinsEarned}🪙</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Redeem Tab */}
      {activeTab === 'REDEEM' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700 }}>🎁 Redeem Options</h2>
            <button className="btn-primary" onClick={() => setShowCreate(true)} style={{ fontSize: '12px', padding: '6px 12px' }}>
              + Add
            </button>
          </div>
          <select className="input" value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}
            style={{ marginBottom: '16px', fontSize: '13px' }}>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          {redeemOptions.length === 0 ? (
            <div style={{ color: '#a0a0a0', textAlign: 'center', padding: '20px' }}>No redeem options yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {redeemOptions.map((option, i) => (
                <div key={i} style={{
                  background: '#222', borderRadius: '10px', padding: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{option.title}</div>
                    {option.description && <div style={{ fontSize: '12px', color: '#a0a0a0' }}>{option.description}</div>}
                    <div style={{ color: '#f5c518', fontSize: '13px', fontWeight: 700, marginTop: '4px' }}>
                      🪙 {option.coinsRequired} coins
                    </div>
                    {coins < option.coinsRequired && (
                      <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>
                        Need {option.coinsRequired - coins} more coins 💪
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button
                      onClick={() => handleRedeem(option.id, option.coinsRequired)}
                      disabled={coins < option.coinsRequired}
                      style={{
                        fontSize: '12px', padding: '8px 14px', borderRadius: '8px', fontWeight: 600,
                        border: 'none', cursor: coins < option.coinsRequired ? 'not-allowed' : 'pointer',
                        background: coins < option.coinsRequired ? '#2a2a2a' : '#f5c518',
                        color: coins < option.coinsRequired ? '#555' : '#000', transition: 'all 0.2s',
                      }}>Redeem</button>
                    <button onClick={() => handleDeleteOption(option.id)} style={{
                      background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444',
                      color: '#ef4444', borderRadius: '8px', padding: '8px 10px', fontSize: '12px', cursor: 'pointer',
                    }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Redeem History Tab */}
      {activeTab === 'HISTORY' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700 }}>🧾 Group Redeem History</h2>
            <select className="input" value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}
              style={{ marginTop: '12px', fontSize: '13px' }}>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          {redeemHistory.length === 0 ? (
            <div style={{ color: '#a0a0a0', textAlign: 'center', padding: '20px' }}>No redemptions yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {redeemHistory.map((r, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px', background: '#222', borderRadius: '10px',
                }}>
                  <span style={{ fontSize: '20px' }}>🎁</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{r.description}</div>
                    <div style={{ fontSize: '11px', color: '#a0a0a0' }}>
                      {new Date(r.earnedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>{r.coinsEarned}🪙</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }}>
          <div className="animate-fadeSlideUp" style={{
            background: '#1a1a1a', borderRadius: '20px', border: '1px solid #2a2a2a',
            padding: '32px', width: '100%', maxWidth: '420px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>New Redeem Option</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: '#a0a0a0', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreateOption} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Title</label>
                <input className="input" placeholder="e.g. Skip Monday Meeting" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div>
                <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Description</label>
                <input className="input" placeholder="Optional" value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  Coins Required <span style={{ color: '#f5c518' }}>(minimum {MIN_COINS})</span>
                </label>
                <input className="input" type="number" min={MIN_COINS} placeholder={String(MIN_COINS)}
                  value={form.coinsRequired}
                  onChange={e => setForm({ ...form, coinsRequired: e.target.value })} required />
              </div>
              <button className="btn-primary" type="submit" style={{ justifyContent: 'center' }}>🎁 Create</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}