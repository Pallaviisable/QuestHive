'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  inviteByEmail,
  leaveGroup,
  deleteGroup,
  removeMember,
  getGroupActivities,
  getRedeemHistory,
  deactivateMember,
  reactivateMember,
  getMyXP,
} from '@/lib/api';
import axios from 'axios';

const TITLE_TIERS = [
  { frame: 'none',   title: 'Newcomer',       minLevel: 1,  color: '#666' },
  { frame: 'bronze', title: 'Task Starter',   minLevel: 3,  color: '#cd7f32' },
  { frame: 'silver', title: 'Steady Worker',  minLevel: 6,  color: '#c0c0c0' },
  { frame: 'gold',   title: 'Dedicated Bee',  minLevel: 10, color: '#f5c518' },
  { frame: 'purple', title: 'Quest Champion', minLevel: 15, color: '#a855f7' },
  { frame: 'elite',  title: 'Elite Bee',      minLevel: 20, color: '#ef4444' },
];

function getTier(level = 1) {
  let tier = TITLE_TIERS[0];
  for (const t of TITLE_TIERS) { if (level >= t.minLevel) tier = t; }
  return tier;
}

const activityIcon = {
  TASK_ASSIGNED: '📋', TASK_COMPLETED: '✅', TASK_DENIED: '❌', TASK_CLAIMED: '🙋',
  REWARD_REDEEMED: '🎁', MEMBER_JOINED: '👋', MEMBER_LEFT: '🚪', MEMBER_REMOVED: '🚫',
  OPEN_TASK_REMINDER: '⏰', OPEN_TASK_PENALTY: '⚠️', PLEDGE_MADE: '🤝', PLEDGE_FULFILLED: '✅', PLEDGE_MISSED: '❌',
};

export default function GroupDetailPage() {
  const { groupId } = useParams();
  const router = useRouter();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removeReason, setRemoveReason] = useState('');
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [user, setUser] = useState(null);
  const [xpMap, setXpMap] = useState({});

  const [inviteEmail, setInviteEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const [confirmModal, setConfirmModal] = useState(null);
  const [reasonModal, setReasonModal] = useState(null);
  const [reasonText, setReasonText] = useState('');

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
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/groups/${groupId}/detail`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGroup(res.data);
      fetchXpForMembers(res.data?.members || []);
    } catch {
      setError('Failed to load group.');
    } finally {
      setLoading(false);
    }
  };

  const fetchXpForMembers = async (members) => {
    const token = localStorage.getItem('token');
    const results = {};
    await Promise.all(members.map(async (m) => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/xp/user/${m.id ?? m._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        results[m.id ?? m._id] = res.data;
      } catch {}
    }));
    // Current user via /xp/me
    try {
      const myXp = await getMyXP();
      const stored = localStorage.getItem('user');
      const me = stored ? JSON.parse(stored) : null;
      if (me) results[me.id ?? me._id] = myXp.data;
    } catch {}
    setXpMap(results);
  };

  const getXpInfo = (userId) => {
    const xp = xpMap[userId];
    if (!xp) return { level: 1, tier: TITLE_TIERS[0] };
    const level = xp.level || 1;
    return { level, tier: getTier(level) };
  };

  const fetchActivities = async () => {
    try { const res = await getGroupActivities(groupId); setActivities(res.data); } catch {}
  };

  const fetchGroupRewards = async () => {
    try { const res = await getRedeemHistory(groupId); setGroupRewards(res.data); } catch {}
  };

  const handleInvite = async (e) => {
    e.preventDefault(); setMsg(''); setError('');
    try {
      await inviteByEmail(groupId, inviteEmail);
      setMsg('Invite sent!'); setInviteEmail('');
    } catch (err) { setError(err.response?.data?.message || 'Failed to send invite.'); }
  };

  const handleLeaveGroup = () => {
    setConfirmModal({ title: '🚪 Leave Group', message: 'Are you sure you want to leave this group?', confirmLabel: 'Yes, Leave',
      onConfirm: async () => {
        try { await leaveGroup(groupId); router.push('/groups'); }
        catch (err) { setError(err.response?.data?.message || 'Failed to leave group.'); setConfirmModal(null); }
      },
    });
  };

  const handleDeleteGroup = () => {
    setConfirmModal({ title: '🗑️ Delete Group', message: 'Are you sure you want to delete this group? This cannot be undone.', confirmLabel: 'Yes, Delete',
      onConfirm: async () => {
        try { await deleteGroup(groupId); router.push('/groups'); }
        catch (err) { setError(err.response?.data?.message || 'Failed to delete group.'); setConfirmModal(null); }
      },
    });
  };

  const handleRemoveMember = (member) => { setRemoveTarget(member); setRemoveReason(''); setShowRemoveModal(true); };

  const confirmRemoveMember = async () => {
    if (!removeTarget) return;
    try {
      await removeMember(groupId, removeTarget.id, removeReason);
      setShowRemoveModal(false); setRemoveTarget(null);
      setMsg(`${removeTarget.fullName} has been removed.`);
      fetchGroup(); fetchActivities();
    } catch (err) { setError(err.response?.data?.message || 'Failed to remove member.'); setShowRemoveModal(false); }
  };

  const handleDeactivateMember = (member) => {
    setReasonText('');
    setReasonModal({
      title: `Deactivate ${member.fullName}?`, subtitle: 'Provide a reason — it will be emailed to the member.',
      btnLabel: 'Deactivate', btnColor: '#f5c518', btnTextColor: '#000',
      onConfirm: async (reason) => {
        try { await deactivateMember(groupId, member.id, reason); setReasonModal(null); setMsg(`${member.fullName} has been deactivated.`); fetchGroup(); }
        catch (err) { setError(err.response?.data?.message || 'Failed to deactivate member.'); setReasonModal(null); }
      },
    });
  };

  const handleReactivateMember = async (member) => {
    try { await reactivateMember(groupId, member.id); setMsg(`${member.fullName} has been reactivated.`); fetchGroup(); }
    catch (err) { setError(err.response?.data?.message || 'Failed to reactivate member.'); }
  };

  const isAdmin = user?.id === group?.adminId;
  const deactivatedIds = group?.deactivatedMemberIds || [];
  const validMembers = group?.members?.filter(m => m.fullName && m.fullName !== 'Unknown User') || [];

  const quickLinks = [
    { label: '✅ Tasks', href: `/groups/${groupId}/tasks` },
    { label: '🏆 Leaderboard', href: `/groups/${groupId}/leaderboard` },
    { label: '💬 Chat', href: `/groups/${groupId}/chat` },
    { label: '⚖️ Fairness', href: `/groups/${groupId}/fairness` },
  ];

  const tabs = [
    { key: 'MEMBERS', label: '👥 Members' },
    { key: 'HALL_OF_FAME', label: '⭐ Hall of Fame' },
    { key: 'ACTIVITY', label: '🔔 Activity' },
    { key: 'REWARDS', label: '🏆 Rewards' },
  ];

  // Hall of Fame: tiers with holders from this group
  const TITLE_TIERS_DISPLAY = TITLE_TIERS.slice(1).reverse();
  const hallOfFame = TITLE_TIERS_DISPLAY.map(tier => {
    const holders = validMembers
      .map(m => ({ member: m, ...getXpInfo(m.id ?? m._id) }))
      .filter(({ level }) => getTier(level).frame === tier.frame)
      .sort((a, b) => b.level - a.level);
    return { tier, holders };
  });

  if (loading) return <div style={{ color: '#f5c518', padding: '40px' }}>🐝 Loading...</div>;

  return (
    <div className="animate-fadeSlideUp">

      {/* Remove Member Modal */}
      {showRemoveModal && removeTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400, padding: '16px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-hover)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Remove Member</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Remove <strong style={{ color: 'var(--text-primary)' }}>{removeTarget.fullName}</strong> from this group?
            </p>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Reason (optional)</label>
              <textarea className="input" placeholder="Let them know why..." value={removeReason} onChange={e => setRemoveReason(e.target.value)} rows={3} style={{ resize: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowRemoveModal(false); setRemoveTarget(null); }} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmRemoveMember} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', cursor: 'pointer', fontWeight: 700 }}>Remove Member</button>
            </div>
          </div>
        </div>
      )}

      {confirmModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '16px', padding: '32px', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>{confirmModal.title}</h3>
            <p style={{ color: '#a0a0a0', fontSize: '14px', marginBottom: '28px', lineHeight: '1.6' }}>{confirmModal.message}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setConfirmModal(null)} style={{ fontSize: '14px', padding: '8px 20px' }}>Cancel</button>
              <button onClick={confirmModal.onConfirm} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>{confirmModal.confirmLabel}</button>
            </div>
          </div>
        </div>
      )}

      {reasonModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '16px', padding: '32px', maxWidth: '420px', width: '90%' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{reasonModal.title}</h3>
            <p style={{ color: '#a0a0a0', fontSize: '13px', marginBottom: '16px' }}>{reasonModal.subtitle}</p>
            <textarea value={reasonText} onChange={e => setReasonText(e.target.value)} placeholder="Write a reason (optional)..." rows={3} style={{ width: '100%', background: '#222', border: '1px solid #333', borderRadius: '10px', color: '#fff', padding: '10px 14px', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setReasonModal(null)} style={{ fontSize: '13px' }}>Cancel</button>
              <button onClick={() => reasonModal.onConfirm(reasonText)} style={{ background: reasonModal.btnColor || '#ef4444', color: reasonModal.btnTextColor || '#fff', border: 'none', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>{reasonModal.btnLabel}</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(245,197,24,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>🐝</div>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800 }}>{group?.name}</h1>
            <p style={{ color: '#a0a0a0' }}>{group?.description}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
          {quickLinks.map(link => (
            <Link key={link.href} href={link.href}><button className="btn-outline" style={{ fontSize: '14px' }}>{link.label}</button></Link>
          ))}
        </div>
      </div>

      {msg && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', borderRadius: '8px', padding: '10px 14px', color: '#22c55e', fontSize: '13px', marginBottom: '16px' }}>{msg}</div>}
      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '8px', padding: '10px 14px', color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ padding: '8px 18px', borderRadius: '999px', fontSize: '13px', fontWeight: 600, background: activeTab === t.key ? '#f5c518' : '#222', color: activeTab === t.key ? '#000' : '#a0a0a0', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* MEMBERS TAB */}
      {activeTab === 'MEMBERS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>👥 Members ({validMembers.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {validMembers.map((member, i) => {
                const isDeactivated = deactivatedIds.includes(member.id);
                const memberId = member.id ?? member._id;
                const { level, tier } = getXpInfo(memberId);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: isDeactivated ? 'rgba(239,68,68,0.05)' : '#222', borderRadius: '10px', border: isDeactivated ? '1px solid rgba(239,68,68,0.2)' : '1px solid transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Avatar with frame ring */}
                      <div style={{ position: 'relative' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: member.avatarColor || '#f5c518', color: '#000',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: '14px', opacity: isDeactivated ? 0.5 : 1,
                          boxShadow: tier.frame !== 'none' ? `0 0 0 2px ${tier.color}` : 'none',
                        }}>{member.fullName?.[0]?.toUpperCase()}</div>
                        {level > 1 && (
                          <div style={{ position: 'absolute', bottom: '-3px', right: '-3px', background: '#111', border: `1px solid ${tier.color}`, borderRadius: '999px', fontSize: '8px', fontWeight: 800, color: tier.color, padding: '1px 4px', lineHeight: 1.4 }}>
                            {level}
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ color: isDeactivated ? '#666' : '#fff', fontSize: '14px', fontWeight: 600 }}>{member.fullName}</div>
                        {/* Title badge under name */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <span style={{ fontSize: '11px', color: tier.color, fontWeight: 600 }}>{tier.title}</span>
                          {tier.frame !== 'none' && <span style={{ fontSize: '9px', background: `${tier.color}22`, color: tier.color, borderRadius: '999px', padding: '1px 6px', fontWeight: 700 }}>Lv.{level}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {memberId === group.adminId && <span className="badge badge-yellow">Admin</span>}
                        {isDeactivated && <span style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: '10px', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>DEACTIVATED</span>}
                      </div>
                    </div>
                    {isAdmin && memberId !== (user?.id ?? user?._id) && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {isDeactivated ? (
                          <button onClick={() => handleReactivateMember(member)} style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Reactivate</button>
                        ) : (
                          <button onClick={() => handleDeactivateMember(member)} style={{ background: 'none', border: 'none', color: '#f5c518', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Deactivate</button>
                        )}
                        <button onClick={() => handleRemoveMember(member)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Remove</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {isAdmin && (
            <div className="card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>📧 Invite by Email</h2>
              <p style={{ color: '#666', fontSize: '12px', marginBottom: '16px' }}>An invite link will be sent to their email.</p>
              <form onSubmit={handleInvite} style={{ display: 'flex', gap: '10px' }}>
                <input className="input" type="email" placeholder="member@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required style={{ flex: 1 }} />
                <button className="btn-primary" type="submit" style={{ whiteSpace: 'nowrap' }}>Send Invite</button>
              </form>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            {!isAdmin && <button className="btn-outline" onClick={handleLeaveGroup} style={{ color: '#ef4444', borderColor: '#ef4444', fontSize: '14px' }}>🚪 Leave Group</button>}
            {isAdmin && <button className="btn-outline" onClick={handleDeleteGroup} style={{ color: '#ef4444', borderColor: '#ef4444', fontSize: '14px' }}>🗑️ Delete Group</button>}
          </div>
        </div>
      )}

      {/* HALL OF FAME TAB */}
      {activeTab === 'HALL_OF_FAME' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ color: '#555', fontSize: '13px', marginBottom: '4px' }}>Members in this group who have reached each title tier.</p>
          {hallOfFame.map(({ tier, holders }) => (
            <div key={tier.frame} style={{ background: '#1a1a1a', borderRadius: '16px', border: `1px solid ${tier.color}44`, padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: `${tier.color}22`, border: `2px solid ${tier.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: tier.color, fontWeight: 800 }}>
                  {tier.frame === 'elite' ? '👑' : tier.frame === 'purple' ? '💜' : tier.frame === 'gold' ? '🌟' : tier.frame === 'silver' ? '🥈' : '🥉'}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: tier.color }}>{tier.title}</div>
                  <div style={{ fontSize: '11px', color: '#555' }}>Level {tier.minLevel}+ required</div>
                </div>
              </div>
              {holders.length === 0 ? (
                <div style={{ color: '#444', fontSize: '13px', fontStyle: 'italic' }}>Nobody yet — be the first to reach Level {tier.minLevel}! 🐝</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {holders.map(({ member, level }) => {
                    const isMe = (member.id ?? member._id) === (user?.id ?? user?._id);
                    return (
                      <div key={member.id ?? member._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: '#222', borderRadius: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `${tier.color}22`, border: `2px solid ${tier.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px', color: tier.color }}>
                          {member.fullName?.[0]?.toUpperCase()}
                        </div>
                        <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: isMe ? '#f5c518' : '#fff' }}>{member.fullName}{isMe ? ' (You)' : ''}</span>
                        <span style={{ background: `${tier.color}22`, border: `1px solid ${tier.color}55`, borderRadius: '999px', padding: '2px 10px', fontSize: '11px', fontWeight: 800, color: tier.color }}>Lv.{level}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ACTIVITY TAB */}
      {activeTab === 'ACTIVITY' && (
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>🔔 Group Activity</h2>
          {activities.length === 0 ? (
            <div style={{ color: '#a0a0a0', textAlign: 'center', padding: '32px' }}>No activity yet. Start assigning tasks! 🐝</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activities.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', background: '#222', borderRadius: '10px' }}>
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>{activityIcon[a.type] || '📌'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>
                      <span style={{ color: '#f5c518' }}>{a.actorName}</span>
                      {a.targetName && <> → <span style={{ color: '#a0a0a0' }}>{a.targetName}</span></>}
                    </div>
                    <div style={{ fontSize: '12px', color: '#a0a0a0', marginTop: '2px' }}>{a.detail}</div>
                    {a.coins !== 0 && <div style={{ fontSize: '11px', color: a.coins > 0 ? '#f5c518' : '#ef4444', marginTop: '2px' }}>{a.coins > 0 ? `+${a.coins}` : a.coins}🪙</div>}
                  </div>
                  <div style={{ fontSize: '11px', color: '#555', flexShrink: 0 }}>
                    {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}<br />
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
            <div style={{ color: '#a0a0a0', textAlign: 'center', padding: '32px' }}>No rewards redeemed yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {groupRewards.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#222', borderRadius: '10px' }}>
                  <span style={{ fontSize: '20px' }}>🎁</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{r.description}</div>
                    <div style={{ fontSize: '11px', color: '#a0a0a0' }}>{new Date(r.earnedAt).toLocaleDateString()}</div>
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
