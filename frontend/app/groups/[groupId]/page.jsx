'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { inviteByEmail, leaveGroup, deleteGroup, regenerateCode, removeMember, getGroupActivities, getRedeemHistory } from '@/lib/api';
import axios from 'axios';

const activityIcon = {
  TASK_ASSIGNED: '📋', TASK_COMPLETED: '✅', TASK_DENIED: '❌',
  TASK_CLAIMED: '🙋', REWARD_REDEEMED: '🎁', MEMBER_JOINED: '👋',
  MEMBER_LEFT: '🚪', MEMBER_REMOVED: '🚫', OPEN_TASK_REMINDER: '⏰',
  OPEN_TASK_PENALTY: '⚠️',
};

export default function GroupDetailPage() {
  const { groupId } = useParams();
  const router = useRouter();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [activeTab, setActiveTab] = useState('MEMBERS');
  const [activities, setActivities] = useState([]);
  const [groupRewards, setGroupRewards] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    fetchGroup();
    fetchActivities();
    fetchGroupRewards();
  }, []);

  const fetchGroup = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:8080/api/groups/${groupId}/detail`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroup(res.data);
    } catch (err) {
      setError('Failed to load group.');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await getGroupActivities(groupId);
      setActivities(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchGroupRewards = async () => {
    try {
      const res = await getRedeemHistory(groupId);
      setGroupRewards(res.data);
    } catch (err) { console.error(err); }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      await inviteByEmail(groupId, inviteEmail);
      setMsg('Invite sent!');
      setInviteEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invite.');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    try {
      await regenerateCode(groupId);
      fetchGroup();
      setMsg('Invite code regenerated!');
    } catch (err) {
      setError('Failed to regenerate code.');
    }
  };

  const handleLeaveGroup = () => {
    setConfirmModal({
      type: 'leave', title: '🚪 Leave Group',
      message: 'Are you sure you want to leave this group?',
      confirmLabel: 'Yes, Leave',
      onConfirm: async () => {
        try {
          await leaveGroup(groupId);
          router.push('/groups');
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to leave group.');
          setConfirmModal(null);
        }
      }
    });
  };

  const handleDeleteGroup = () => {
    setConfirmModal({
      type: 'delete', title: '🗑️ Delete Group',
      message: 'Are you sure you want to delete this group? This cannot be undone.',
      confirmLabel: 'Yes, Delete',
      onConfirm: async () => {
        try {
          await deleteGroup(groupId);
          router.push('/groups');
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to delete group.');
          setConfirmModal(null);
        }
      }
    });
  };

  const handleRemoveMember = (member) => {
    setConfirmModal({
      type: 'remove',
      title: '🚫 Remove Member',
      message: `Are you sure you want to remove ${member.fullName} from the group? Their tasks will remain.`,
      confirmLabel: 'Yes, Remove',
      onConfirm: async () => {
        try {
          await removeMember(groupId, member.id);
          setConfirmModal(null);
          setMsg(`${member.fullName} has been removed from the group.`);
          fetchGroup();
          fetchActivities();
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to remove member.');
          setConfirmModal(null);
        }
      }
    });
  };

  const isAdmin = user?.id === group?.adminId;

  // Filter out any members with no name (deleted/unknown users)
  const validMembers = group?.members?.filter(m => m.fullName && m.fullName !== 'Unknown User') || [];

  const quickLinks = [
    { label: '✅ Tasks', href: `/groups/${groupId}/tasks` },
    { label: '🗺️ Map', href: `/groups/${groupId}/map` },
    { label: '🏆 Leaderboard', href: `/groups/${groupId}/leaderboard` },
  ];

  const tabs = [
    { key: 'MEMBERS', label: '👥 Members' },
    { key: 'ACTIVITY', label: '🔔 Activity' },
    { key: 'REWARDS', label: '🏆 Rewards' },
  ];

  if (loading) return <div style={{ color: '#f5c518', padding: '40px' }}>🐝 Loading...</div>;

  return (
    <div className="animate-fadeSlideUp">
      {/* Confirm Modal */}
      {confirmModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: '#1a1a1a', border: '1px solid #333', borderRadius: '16px',
            padding: '32px', maxWidth: '400px', width: '90%',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>{confirmModal.title}</h3>
            <p style={{ color: '#a0a0a0', fontSize: '14px', marginBottom: '28px', lineHeight: '1.6' }}>{confirmModal.message}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setConfirmModal(null)}
                style={{ fontSize: '14px', padding: '8px 20px' }}>Cancel</button>
              <button onClick={confirmModal.onConfirm} style={{
                background: '#ef4444', color: '#fff', border: 'none',
                borderRadius: '8px', padding: '8px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              }}>{confirmModal.confirmLabel}</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'rgba(245,197,24,0.15)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '28px',
          }}>🐝</div>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800 }}>{group?.name}</h1>
            <p style={{ color: '#a0a0a0' }}>{group?.description}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
          {quickLinks.map(link => (
            <Link key={link.href} href={link.href}>
              <button className="btn-outline" style={{ fontSize: '14px' }}>{link.label}</button>
            </Link>
          ))}
        </div>
      </div>

      {msg && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', borderRadius: '8px', padding: '10px 14px', color: '#22c55e', fontSize: '13px', marginBottom: '16px' }}>{msg}</div>}
      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '8px', padding: '10px 14px', color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

      {/* Invite Code */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#a0a0a0', marginBottom: '4px' }}>🔗 Invite Code</div>
            <span style={{ color: '#f5c518', fontSize: '22px', fontWeight: 800, letterSpacing: '4px' }}>
              {group?.inviteCode}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-primary" onClick={handleCopyCode} style={{ padding: '6px 14px', fontSize: '13px' }}>
              {copied ? '✅ Copied!' : '📋 Copy'}
            </button>
            {isAdmin && (
              <button className="btn-outline" onClick={handleRegenerate} style={{ fontSize: '13px' }}>
                🔄 Regenerate
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: '8px 18px', borderRadius: '999px', fontSize: '13px', fontWeight: 600,
            background: activeTab === t.key ? '#f5c518' : '#222',
            color: activeTab === t.key ? '#000' : '#a0a0a0',
            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* MEMBERS TAB */}
      {activeTab === 'MEMBERS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
              👥 Members ({validMembers.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {validMembers.map((member, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: '#222', borderRadius: '10px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: member.avatarColor || '#f5c518', color: '#000',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '13px',
                    }}>
                      {member.fullName?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>
                        {member.fullName}
                      </div>
                      <div style={{ color: '#888', fontSize: '12px' }}>{member.email}</div>
                    </div>
                    {member.id === group.adminId && <span className="badge badge-yellow">Admin</span>}
                  </div>
                  {isAdmin && member.id !== user?.id && (
                    <button
                      onClick={() => handleRemoveMember(member)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }}>
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Invite by Email — admin only */}
          {isAdmin && (
            <div className="card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>📧 Invite by Email</h2>
              <form onSubmit={handleInvite} style={{ display: 'flex', gap: '10px' }}>
                <input className="input" type="email" placeholder="member@example.com"
                  value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required
                  style={{ flex: 1 }} />
                <button className="btn-primary" type="submit" style={{ whiteSpace: 'nowrap' }}>Send Invite</button>
              </form>
            </div>
          )}

          {/* Group Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            {!isAdmin && (
              <button className="btn-outline" onClick={handleLeaveGroup}
                style={{ color: '#ef4444', borderColor: '#ef4444', fontSize: '14px' }}>
                🚪 Leave Group
              </button>
            )}
            {isAdmin && (
              <button className="btn-outline" onClick={handleDeleteGroup}
                style={{ color: '#ef4444', borderColor: '#ef4444', fontSize: '14px' }}>
                🗑️ Delete Group
              </button>
            )}
          </div>
        </div>
      )}

      {/* ACTIVITY TAB */}
      {activeTab === 'ACTIVITY' && (
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>🔔 Group Activity</h2>
          {activities.length === 0 ? (
            <div style={{ color: '#a0a0a0', textAlign: 'center', padding: '32px' }}>
              No activity yet. Start assigning tasks! 🐝
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activities.map((a, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  padding: '12px', background: '#222', borderRadius: '10px',
                }}>
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>{activityIcon[a.type] || '📌'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>
                      <span style={{ color: '#f5c518' }}>{a.actorName}</span>
                      {a.targetName && <> → <span style={{ color: '#a0a0a0' }}>{a.targetName}</span></>}
                    </div>
                    <div style={{ fontSize: '12px', color: '#a0a0a0', marginTop: '2px' }}>{a.detail}</div>
                    {a.coins !== 0 && (
                      <div style={{ fontSize: '11px', color: a.coins > 0 ? '#f5c518' : '#ef4444', marginTop: '2px' }}>
                        {a.coins > 0 ? `+${a.coins}` : a.coins}🪙
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#555', flexShrink: 0 }}>
                    {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    <br />
                    {new Date(a.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REWARDS TAB */}
      {activeTab === 'REWARDS' && (
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>🏆 Group Reward Redemptions</h2>
          {groupRewards.length === 0 ? (
            <div style={{ color: '#a0a0a0', textAlign: 'center', padding: '32px' }}>
              No rewards redeemed in this group yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {groupRewards.map((r, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px', background: '#222', borderRadius: '10px',
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
    </div>
  );
}