'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getSuperAdminRequests, getAllSuperAdminRequests,
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
    } catch (err) { setError('Failed to load data.'); }
    finally { setLoading(false); }
  };

  const action = async (fn, successMsg) => {
    setError(''); setMsg('');
    try { await fn(); setMsg(successMsg); fetchAll(); }
    catch (err) { setError(err.response?.data?.message || 'Action failed.'); }
  };

  const statusColor = { PENDING: '#f5c518', APPROVED: '#22c55e', REJECTED: '#ef4444' };
  const roleColor = { FAMILY_ADMIN: '#a855f7', MEMBER: '#60a5fa' };

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', padding: '32px 24px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <div style={{ fontSize: '40px' }}>👑</div>
          <div>
            <h1 style={{ color: '#f5c518', fontSize: '28px', fontWeight: 800 }}>Super Admin Dashboard</h1>
            <p style={{ color: '#a0a0a0', fontSize: '14px' }}>Manage Family Admin requests and platform users</p>
          </div>
        </div>

        {msg && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', borderRadius: '10px', padding: '10px 16px', color: '#22c55e', fontSize: '13px', marginBottom: '16px' }}>✓ {msg}</div>}
        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '10px', padding: '10px 16px', color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {[
            { key: 'REQUESTS', label: `📋 Admin Requests (${requests.filter(r => r.status === 'PENDING').length} pending)` },
            { key: 'USERS', label: `👥 All Users (${users.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '10px 20px', borderRadius: '999px', fontSize: '13px', fontWeight: 600,
              background: tab === t.key ? '#f5c518' : '#1a1a1a',
              color: tab === t.key ? '#000' : '#a0a0a0',
              border: tab === t.key ? 'none' : '1px solid #2a2a2a',
              cursor: 'pointer',
            }}>{t.label}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid #f5c518', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : tab === 'REQUESTS' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {requests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#a0a0a0' }}>No requests yet.</div>
            ) : requests.map(req => (
              <div key={req.id} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '14px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>{req.fullName}</span>
                      <span style={{
                        fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '999px',
                        background: `${statusColor[req.status]}20`,
                        color: statusColor[req.status],
                      }}>{req.status}</span>
                    </div>
                    <div style={{ color: '#a0a0a0', fontSize: '13px', marginBottom: '4px' }}>📧 {req.email}</div>
                    <div style={{ color: '#888', fontSize: '13px', lineHeight: '1.5' }}>
                      <span style={{ color: '#555' }}>Reason: </span>{req.reason}
                    </div>
                    <div style={{ color: '#555', fontSize: '11px', marginTop: '6px' }}>
                      {new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {req.status === 'PENDING' && (
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button onClick={() => action(() => approveAdminRequest(req.id), `Approved ${req.fullName}. Invite sent!`)}
                        style={{ background: '#22c55e', color: '#000', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                        ✅ Approve
                      </button>
                      <button onClick={() => action(() => rejectAdminRequest(req.id), `Rejected ${req.fullName}.`)}
                        style={{ background: '#ef444420', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                        ❌ Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {users.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#a0a0a0' }}>No users yet.</div>
            ) : users.map(u => (
              <div key={u.id} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: u.avatarColor || '#4CAF50', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px', color: '#000' }}>
                    {u.fullName?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {u.fullName}
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: `${roleColor[u.role] || '#888'}20`, color: roleColor[u.role] || '#888' }}>
                        {u.role?.replace('_', ' ')}
                      </span>
                      {u.status === 'DEACTIVATED' && (
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: '#ef444420', color: '#ef4444' }}>DEACTIVATED</span>
                      )}
                    </div>
                    <div style={{ color: '#a0a0a0', fontSize: '12px' }}>{u.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {u.status === 'ACTIVE' ? (
                    <button onClick={() => action(() => deactivatePlatformUser(u.id), `${u.fullName} deactivated.`)}
                      style={{ background: '#f5c51820', color: '#f5c518', border: '1px solid #f5c518', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                      Deactivate
                    </button>
                  ) : (
                    <button onClick={() => action(() => activatePlatformUser(u.id), `${u.fullName} reactivated.`)}
                      style={{ background: '#22c55e20', color: '#22c55e', border: '1px solid #22c55e', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                      Reactivate
                    </button>
                  )}
                  <button onClick={() => { if (confirm(`Remove ${u.fullName} from QuestHive permanently?`)) action(() => removePlatformUser(u.id), `${u.fullName} removed.`); }}
                    style={{ background: '#ef444420', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}