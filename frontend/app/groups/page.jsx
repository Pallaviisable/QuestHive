'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getMyGroups, createGroup, joinGroup } from '@/lib/api';

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { fetchGroups(); }, []);

  const fetchGroups = async () => {
    try {
      const res = await getMyGroups();
      setGroups(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createGroup(createForm);
      setShowCreate(false);
      setCreateForm({ name: '', description: '' });
      fetchGroups();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group.');
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    try {
      await joinGroup(inviteCode);
      setShowJoin(false);
      setInviteCode('');
      fetchGroups();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid invite code.');
    }
  };

  return (
    <div className="animate-fadeSlideUp">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800 }}>My Groups</h1>
          <p style={{ color: '#a0a0a0', marginTop: '4px' }}>Manage and explore your hives</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-outline" onClick={() => setShowJoin(true)}>🔗 Join Group</button>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>+ Create Group</button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444',
          borderRadius: '8px', padding: '10px 14px', color: '#ef4444',
          fontSize: '13px', marginBottom: '16px',
        }}>{error}</div>
      )}

      {/* Groups Grid */}
      {loading ? (
        <div style={{ color: '#f5c518', textAlign: 'center', padding: '40px' }}>🐝 Loading groups...</div>
      ) : groups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#a0a0a0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🐝</div>
          <p>No groups yet. Create or join one!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {groups.map((group, i) => (
            <Link key={i} href={`/groups/${group.id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ padding: '24px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '14px',
                    background: 'rgba(245,197,24,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
                  }}>🐝</div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{group.name}</h3>
                    <p style={{ color: '#a0a0a0', fontSize: '13px' }}>{group.memberIds?.length || 0} members</p>
                  </div>
                </div>
                {group.description && (
                  <p style={{ color: '#a0a0a0', fontSize: '13px', marginBottom: '16px' }}>{group.description}</p>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className="badge badge-yellow">View Tasks →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Create Group" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Group Name</label>
              <input className="input" placeholder="My Awesome Group" value={createForm.name}
                onChange={e => setCreateForm({ ...createForm, name: e.target.value })} required />
            </div>
            <div>
              <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Description</label>
              <input className="input" placeholder="What's this group about?" value={createForm.description}
                onChange={e => setCreateForm({ ...createForm, description: e.target.value })} />
            </div>
            <button className="btn-primary" type="submit" style={{ justifyContent: 'center' }}>🐝 Create</button>
          </form>
        </Modal>
      )}

      {/* Join Modal */}
      {showJoin && (
        <Modal title="Join Group" onClose={() => setShowJoin(false)}>
          <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Invite Code</label>
              <input className="input" placeholder="ABC123" value={inviteCode}
                onChange={e => setInviteCode(e.target.value)} required />
            </div>
            <button className="btn-primary" type="submit" style={{ justifyContent: 'center' }}>🔗 Join</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
    }}>
      <div className="animate-fadeSlideUp" style={{
        background: '#1a1a1a', borderRadius: '20px', border: '1px solid #2a2a2a',
        padding: '32px', width: '100%', maxWidth: '420px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#a0a0a0', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}