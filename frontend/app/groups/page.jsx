'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getMyGroups, createGroup, joinGroup } from '@/lib/api';

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => { fetchGroups(); }, []);

  const fetchGroups = async () => {
    try {
      const res = await getMyGroups();
      setGroups(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createGroup(createForm);
      setShowCreate(false);
      setCreateForm({ name: '', description: '' });
      setSuccessMsg('Group created successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchGroups();
    } catch (err) { setError(err.response?.data?.message || 'Failed to create group.'); }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    try {
      await joinGroup(inviteCode);
      setShowJoin(false);
      setInviteCode('');
      setSuccessMsg('Joined group successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchGroups();
    } catch (err) { setError(err.response?.data?.message || 'Invalid invite code.'); }
  };

  return (
    <div className="animate-fadeSlideUp">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800 }}>My Groups</h1>
          <p style={{ color: '#a0a0a0', marginTop: '4px', fontSize: '14px' }}>Manage and explore your hives</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-outline" onClick={() => { setShowJoin(true); setError(''); }}>🔗 Join Group</button>
          <button className="btn-primary" onClick={() => { setShowCreate(true); setError(''); }}>+ Create Group</button>
        </div>
      </div>

      {successMsg && (
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', borderRadius: '10px', padding: '10px 16px', color: '#22c55e', fontSize: '13px', marginBottom: '16px' }}>
          ✓ {successMsg}
        </div>
      )}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '10px', padding: '10px 16px', color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', flexDirection: 'column', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid #f5c518', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          <p style={{ color: '#f5c518', fontWeight: 600 }}>Loading groups...</p>
        </div>
      ) : groups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#a0a0a0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🐝</div>
          <p style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>No groups yet</p>
          <p style={{ fontSize: '14px' }}>Create or join a group to get started!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {groups.map((group, i) => (
            <Link key={i} href={`/groups/${group.id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{
                padding: '24px', cursor: 'pointer',
                height: '180px',           /* fixed height */
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0, background: 'rgba(245,197,24,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>🐝</div>
                    <div style={{ overflow: 'hidden' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{group.name}</h3>
                      <p style={{ color: '#a0a0a0', fontSize: '12px' }}>{group.memberIds?.length || 0} members</p>
                    </div>
                  </div>
                  {/* Description truncated to 2 lines with ellipsis */}
                  <p style={{
                    color: '#a0a0a0', fontSize: '13px', lineHeight: '1.5',
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {group.description || 'No description added.'}
                  </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-yellow" style={{ fontSize: '11px' }}>View Tasks →</span>
                  <span style={{ fontSize: '11px', color: '#555' }}>{group.taskIds?.length || 0} tasks</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && (
        <Modal title="Create Group" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Group Name *</label>
              <input className="input" placeholder="e.g. Study Squad" value={createForm.name}
                onChange={e => setCreateForm({ ...createForm, name: e.target.value })} required />
            </div>
            <div>
              <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Description</label>
              <textarea className="input" placeholder="What's this group about? (optional)"
                value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                rows={3} style={{ resize: 'none' }} />
            </div>
            <button className="btn-primary" type="submit" style={{ justifyContent: 'center' }}>🐝 Create Group</button>
          </form>
        </Modal>
      )}

      {showJoin && (
        <Modal title="Join Group" onClose={() => setShowJoin(false)}>
          <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Invite Code *</label>
              <input className="input" placeholder="Enter invite code e.g. ABC123" value={inviteCode}
                onChange={e => setInviteCode(e.target.value)} required />
            </div>
            <button className="btn-primary" type="submit" style={{ justifyContent: 'center' }}>🔗 Join Group</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' }}>
      <div className="animate-fadeSlideUp" style={{ background: '#1a1a1a', borderRadius: '20px', border: '1px solid #2a2a2a', padding: '32px', width: '100%', maxWidth: '420px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>{title}</h2>
          <button onClick={onClose} style={{ background: '#222', border: '1px solid #333', color: '#a0a0a0', fontSize: '16px', cursor: 'pointer', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}