'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAllSuperAdminRequests,
  approveAdminRequest, rejectAdminRequest,
  getSuperAdminUsers, deactivatePlatformUser,
  activatePlatformUser, removePlatformUser
} from '@/lib/api';

export default function SuperAdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState('REQUESTS');
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'SUPER_ADMIN') { router.push('/dashboard'); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [reqRes, userRes] = await Promise.all([
        getAllSuperAdminRequests(),
        getSuperAdminUsers(),
      ]);
      setRequests(reqRes.data);
      setUsers(userRes.data);
    } catch { setError('Failed to load data.'); }
    finally { setLoading(false); }
  };

  const action = async (fn, successMsg) => {
    setError(''); setMsg('');
    try { await fn(); setMsg(successMsg); fetchAll(); }
    catch (err) { setError(err.response?.data?.message || 'Action failed.'); }
  };

  const pending = requests.filter(r => r.status === 'PENDING').length;
  const filteredUsers = users.filter(u =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: 'Total Users', value: users.length, icon: '👥', color: '#818cf8' },
    { label: 'Pending', value: pending, icon: '⏳', color: '#fbbf24' },
    { label: 'Active', value: users.filter(u => u.status === 'ACTIVE').length, icon: '✅', color: '#34d399' },
    { label: 'Deactivated', value: users.filter(u => u.status === 'DEACTIVATED').length, icon: '🚫', color: '#f87171' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #0f0a1a 40%, #0a0f1a 100%)',
      fontFamily: 'Inter, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background orbs */}
      <div style={{ position: 'fixed', top: '-200px', left: '-200px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-200px', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,197,24,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: '40%', right: '10%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Topbar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,10,15,0.7)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 40px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ fontSize: '24px' }}>🐝</div>
          <div>
            <div style={{ color: '#f5c518', fontWeight: 800, fontSize: '16px', letterSpacing: '-0.3px' }}>QuestHive</div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', marginTop: '-2px' }}>Super Admin Console</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '999px', padding: '4px 12px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
            <span style={{ color: '#22c55e', fontSize: '12px', fontWeight: 600 }}>All systems operational</span>
          </div>
          <button onClick={() => router.push('/superadmin/analytics')} style={{ background: 'rgba(245,197,24,0.1)', border: '1px solid rgba(245,197,24,0.2)', color: '#f5c518', borderRadius: '10px', padding: '7px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(10px)' }}>📊 Analytics</button>
          <button onClick={() => { localStorage.clear(); document.cookie = 'token=; path=/; max-age=0'; window.location.href = '/login'; }} style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#f87171', borderRadius: '10px', padding: '7px 16px',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            backdropFilter: 'blur(10px)',
          }}>Sign out</button>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 24px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '999px', padding: '4px 14px', marginBottom: '16px' }}>
            <span style={{ fontSize: '12px' }}>👑</span>
            <span style={{ color: '#a78bfa', fontSize: '12px', fontWeight: 600 }}>Super Administrator</span>
          </div>
          <h1 style={{ fontSize: '40px', fontWeight: 800, color: '#fff', letterSpacing: '-1px', marginBottom: '8px', background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Admin Console
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '15px' }}>Manage platform access, users, and Family Admin approvals</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '40px' }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px', padding: '24px',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${s.color}60, transparent)` }} />
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>{s.icon}</div>
              <div style={{ fontSize: '36px', fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: '6px' }}>{s.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {msg && (
          <div style={{ background: 'rgba(34,197,94,0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '12px', padding: '12px 18px', color: '#34d399', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ✓ {msg}
          </div>
        )}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '12px 18px', color: '#f87171', fontSize: '13px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '4px', marginBottom: '28px', width: 'fit-content' }}>
          {[
            { key: 'REQUESTS', label: '📋 Admin Requests', badge: pending },
            { key: 'USERS', label: '👥 All Users', badge: null },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '10px 22px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s',
              background: tab === t.key ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: tab === t.key ? '#fff' : 'rgba(255,255,255,0.3)',
              backdropFilter: tab === t.key ? 'blur(10px)' : 'none',
              boxShadow: tab === t.key ? '0 0 0 1px rgba(255,255,255,0.1)' : 'none',
            }}>
              {t.label}
              {t.badge > 0 && (
                <span style={{ background: 'linear-gradient(135deg, #f5c518, #fbbf24)', color: '#000', borderRadius: '999px', padding: '1px 8px', fontSize: '11px', fontWeight: 800 }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
            <div style={{ width: '36px', height: '36px', border: '2px solid rgba(245,197,24,0.3)', borderTopColor: '#f5c518', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : tab === 'REQUESTS' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {requests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', color: 'rgba(255,255,255,0.2)' }}>
                No requests yet.
              </div>
            ) : requests.map(req => (
              <div key={req.id} style={{
                background: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${req.status === 'PENDING' ? 'rgba(245,197,24,0.2)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '18px', padding: '22px 26px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap',
                position: 'relative', overflow: 'hidden',
              }}>
                {req.status === 'PENDING' && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(245,197,24,0.5), transparent)' }} />}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>{req.fullName}</span>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.8px',
                      background: req.status === 'PENDING' ? 'rgba(245,197,24,0.12)' : req.status === 'APPROVED' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                      color: req.status === 'PENDING' ? '#fbbf24' : req.status === 'APPROVED' ? '#34d399' : '#f87171',
                      border: `1px solid ${req.status === 'PENDING' ? 'rgba(245,197,24,0.25)' : req.status === 'APPROVED' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                    }}>{req.status}</span>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '8px' }}>{req.email}</div>
                  <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px', fontStyle: 'italic', lineHeight: 1.5 }}>"{req.reason}"</div>
                  <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: '11px', marginTop: '8px' }}>
                    {new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {req.status === 'PENDING' && (
                  <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                    <button onClick={() => action(() => approveAdminRequest(req.id), `Approved ${req.fullName} — invite sent`)} style={{
                      background: 'rgba(34,197,94,0.12)', color: '#34d399',
                      border: '1px solid rgba(34,197,94,0.25)', borderRadius: '10px',
                      padding: '9px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                      backdropFilter: 'blur(10px)', transition: 'all 0.2s',
                    }}>✓ Approve</button>
                    <button onClick={() => action(() => rejectAdminRequest(req.id), `Rejected ${req.fullName}`)} style={{
                      background: 'rgba(239,68,68,0.08)', color: '#f87171',
                      border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px',
                      padding: '9px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                      backdropFilter: 'blur(10px)', transition: 'all 0.2s',
                    }}>✕ Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div>
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.04)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
                  color: '#fff', padding: '12px 18px', fontSize: '13px', outline: 'none',
                  boxSizing: 'border-box',
                }} />
            </div>
            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              {filteredUsers.length} users
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredUsers.map(u => (
                <div key={u.id} style={{
                  background: 'rgba(255,255,255,0.03)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '16px', padding: '16px 22px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap',
                  transition: 'border-color 0.2s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '200px' }}>
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '12px',
                      background: `linear-gradient(135deg, ${u.avatarColor || '#818cf8'}, ${u.avatarColor || '#818cf8'}88)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '14px', color: '#000', flexShrink: 0,
                      boxShadow: `0 4px 12px ${u.avatarColor || '#818cf8'}40`,
                    }}>
                      {u.fullName?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>{u.fullName}</div>
                      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>{u.email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px',
                      background: u.role === 'SUPER_ADMIN' ? 'rgba(239,68,68,0.1)' : u.role === 'FAMILY_ADMIN' ? 'rgba(168,85,247,0.1)' : 'rgba(99,102,241,0.1)',
                      color: u.role === 'SUPER_ADMIN' ? '#f87171' : u.role === 'FAMILY_ADMIN' ? '#c084fc' : '#818cf8',
                      border: `1px solid ${u.role === 'SUPER_ADMIN' ? 'rgba(239,68,68,0.2)' : u.role === 'FAMILY_ADMIN' ? 'rgba(168,85,247,0.2)' : 'rgba(99,102,241,0.2)'}`,
                    }}>{u.role?.replace('_', ' ')}</span>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px',
                      background: u.status === 'ACTIVE' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      color: u.status === 'ACTIVE' ? '#34d399' : '#f87171',
                      border: `1px solid ${u.status === 'ACTIVE' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                    }}>{u.status}</span>
                    {u.role !== 'SUPER_ADMIN' && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {u.status === 'ACTIVE' ? (
                          <button onClick={() => action(() => deactivatePlatformUser(u.id), `${u.fullName} deactivated`)} style={{
                            background: 'rgba(245,197,24,0.08)', color: '#fbbf24',
                            border: '1px solid rgba(245,197,24,0.2)', borderRadius: '8px',
                            padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                          }}>Deactivate</button>
                        ) : (
                          <button onClick={() => action(() => activatePlatformUser(u.id), `${u.fullName} reactivated`)} style={{
                            background: 'rgba(34,197,94,0.08)', color: '#34d399',
                            border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px',
                            padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                          }}>Reactivate</button>
                        )}
                        <button onClick={() => { if (confirm(`Remove ${u.fullName}?`)) action(() => removePlatformUser(u.id), `${u.fullName} removed`); }} style={{
                          background: 'rgba(239,68,68,0.08)', color: '#f87171',
                          border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px',
                          padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                        }}>Remove</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
