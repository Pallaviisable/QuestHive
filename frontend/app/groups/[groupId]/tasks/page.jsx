'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  getGroupTasks, getTasksAssignedByMe, createGroupTask, updateTaskStatus,
  deleteTask, claimTask, editTask, denyTask, updateTaskPriority,
  addTaskComment, addSubtask, completeSubtask, addCommitmentPledge,
  requestBonusReview, flagBonus, getReviewStatus, getMyXP,
} from '@/lib/api';
import axios from 'axios';

const CATEGORIES = ['GROCERIES', 'HOME', 'SCHOOL', 'PERSONAL', 'WORK', 'OTHER'];
const priorityColor = { LOW: '#22c55e', MEDIUM: '#f5c518', HIGH: '#ef4444' };
const statusColor   = { PENDING: '#a0a0a0', IN_PROGRESS: '#3b82f6', COMPLETED: '#22c55e' };
const statusBg      = { PENDING: 'rgba(160,160,160,0.12)', IN_PROGRESS: 'rgba(59,130,246,0.12)', COMPLETED: 'rgba(34,197,94,0.12)' };

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

/* ─── Task Detail Modal ─────────────────────────────────────── */
function TaskDetailModal({ task, user, onClose, onRefresh, xpMap }) {
  const [comments, setComments]         = useState(task.comments || []);
  const [subtasks, setSubtasks]         = useState(task.subtasks || []);
  const [pledge, setPledge]             = useState(task.pledgeMessage || '');
  const [commentText, setCommentText]   = useState('');
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [pledgeText, setPledgeText]     = useState('');
  const [tab, setTab]                   = useState('SUBTASKS');
  const [saving, setSaving]             = useState(false);
  const [reviewStatus, setReviewStatus] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  useEffect(() => {
    if (tab === 'REVIEW') loadReviewStatus();
  }, [tab]);

  const loadReviewStatus = async () => {
    setReviewLoading(true);
    try {
      const res = await getReviewStatus(task.id);
      setReviewStatus(res.data);
    } catch { setReviewStatus(null); }
    setReviewLoading(false);
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setSaving(true);
    try {
      const res = await addTaskComment(task.id, { content: commentText.trim() });
      setComments(res.data.comments || []); setCommentText(''); onRefresh();
    } catch { alert('Failed to add comment'); }
    setSaving(false);
  };

  const handleAddSubtask = async () => {
    if (!subtaskTitle.trim()) return;
    setSaving(true);
    try {
      const res = await addSubtask(task.id, { title: subtaskTitle.trim() });
      setSubtasks(res.data.subtasks || []); setSubtaskTitle(''); onRefresh();
    } catch { alert('Failed to add subtask'); }
    setSaving(false);
  };

  const handleCompleteSubtask = async (subtaskId) => {
    try {
      const res = await completeSubtask(task.id, subtaskId);
      setSubtasks(res.data.subtasks || []); onRefresh();
    } catch { alert('Failed to complete subtask'); }
  };

  const handlePledge = async () => {
    if (!pledgeText.trim()) return;
    setSaving(true);
    try {
      await addCommitmentPledge(task.id, { message: pledgeText.trim() });
      setPledge(pledgeText.trim()); setPledgeText(''); onRefresh();
    } catch { alert('Failed to save pledge'); }
    setSaving(false);
  };

  const handleRequestReview = async () => {
    setSaving(true);
    try {
      await requestBonusReview(task.id, task.bonusCoins || 0);
      await loadReviewStatus();
    } catch { alert('Failed to request review'); }
    setSaving(false);
  };

  const handleFlagBonus = async () => {
    setSaving(true);
    try {
      await flagBonus(task.id);
      await loadReviewStatus();
    } catch { alert('Failed to flag bonus'); }
    setSaving(false);
  };

  const completedSubtasks = subtasks.filter(s => s.completed).length;
  const subtaskProgress   = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

  // Assignee XP info
  const assigneeXp = xpMap?.[task.assignedToId];
  const assigneeTier = assigneeXp ? getTier(assigneeXp.level || 1) : TITLE_TIERS[0];
  const assigneeLevel = assigneeXp?.level || 1;

  const isAssignedToMe = task.assignedToId === user?.id;
  const showReviewTab = task.status === 'COMPLETED' && (task.bonusCoins > 0 || task.openTaskBonus);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '16px' }}>
      <div style={{ background: '#141414', borderRadius: '20px', border: '1px solid #2a2a2a', width: '100%', maxWidth: '620px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid #2a2a2a', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <span style={{ padding: '2px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: `${priorityColor[task.priority]}22`, color: priorityColor[task.priority] }}>{task.priority}</span>
                <span style={{ padding: '2px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: statusBg[task.status], color: statusColor[task.status] }}>{task.status.replace('_',' ')}</span>
                <span style={{ padding: '2px 9px', borderRadius: '999px', fontSize: '11px', background: '#222', color: '#a0a0a0' }}>{task.category}</span>
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>{task.title}</h2>
              {task.description && <p style={{ color: '#a0a0a0', fontSize: '13px', marginTop: '6px', lineHeight: 1.5 }}>{task.description}</p>}
              <div style={{ display: 'flex', gap: '14px', marginTop: '10px', fontSize: '12px', color: '#666', flexWrap: 'wrap', alignItems: 'center' }}>
                {task.deadline && <span>⏰ {new Date(task.deadline).toLocaleDateString()}</span>}
                <span style={{ color: '#f5c518', fontWeight: 700 }}>🪙 {task.coinsReward}</span>
                {subtasks.length > 0 && <span>📝 {completedSubtasks}/{subtasks.length} subtasks</span>}
                {/* Assignee with title badge */}
                {task.assignedToId && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    👤
                    {assigneeTier.frame !== 'none' && (
                      <span style={{ fontSize: '10px', background: `${assigneeTier.color}22`, color: assigneeTier.color, borderRadius: '999px', padding: '1px 6px', fontWeight: 700 }}>
                        {assigneeTier.title} Lv.{assigneeLevel}
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose} style={{ background: '#222', border: '1px solid #333', color: '#a0a0a0', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer', flexShrink: 0, fontSize: '14px' }}>✕</button>
          </div>

          {subtasks.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ background: '#111', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '999px', background: '#22c55e', width: `${subtaskProgress}%`, transition: 'width 0.4s' }} />
              </div>
              <div style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>{subtaskProgress}% complete</div>
            </div>
          )}

          {pledge && (
            <div style={{ marginTop: '10px', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '10px', padding: '10px 12px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span>🤝</span>
              <div>
                <div style={{ fontSize: '12px', color: '#a855f7', fontWeight: 800, marginBottom: '4px', letterSpacing: '0.5px' }}>COMMITMENT PLEDGE</div>
                <div style={{ fontSize: '14px', color: '#e9d5ff', fontWeight: 500 }}>{pledge}</div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', padding: '12px 24px 0', borderBottom: '1px solid #2a2a2a', flexShrink: 0, overflowX: 'auto' }}>
          {[
            { key: 'SUBTASKS', label: `📝 Subtasks ${subtasks.length > 0 ? `(${subtasks.length})` : ''}` },
            { key: 'COMMENTS', label: `💬 Comments ${comments.length > 0 ? `(${comments.length})` : ''}` },
            ...(isAssignedToMe ? [{ key: 'PLEDGE', label: '🤝 Pledge' }] : []),
            ...(showReviewTab ? [{ key: 'REVIEW', label: '⚖️ Bonus Review' }] : []),
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '8px 14px', borderRadius: '8px 8px 0 0', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              background: tab === t.key ? '#1a1a1a' : 'transparent',
              color: tab === t.key ? '#f5c518' : '#555',
              borderBottom: tab === t.key ? '2px solid #f5c518' : '2px solid transparent',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* SUBTASKS */}
          {tab === 'SUBTASKS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {subtasks.length === 0 && <p style={{ color: '#555', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No subtasks yet.</p>}
              {subtasks.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#1a1a1a', borderRadius: '10px', border: '1px solid #2a2a2a' }}>
                  <button onClick={() => !s.completed && handleCompleteSubtask(s.id)} style={{ width: '20px', height: '20px', borderRadius: '6px', border: s.completed ? 'none' : '2px solid #444', background: s.completed ? '#22c55e' : 'transparent', cursor: s.completed ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '12px' }}>{s.completed ? '✓' : ''}</button>
                  <span style={{ fontSize: '13px', color: s.completed ? '#555' : '#fff', textDecoration: s.completed ? 'line-through' : 'none', flex: 1 }}>{s.title}</span>
                  {s.completed && <span style={{ fontSize: '10px', color: '#444' }}>✓ done</span>}
                </div>
              ))}
              {task.status !== 'COMPLETED' && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <input value={subtaskTitle} onChange={e => setSubtaskTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddSubtask()} placeholder="Add subtask..." style={{ flex: 1, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff', padding: '8px 12px', fontSize: '13px', outline: 'none' }} />
                  <button onClick={handleAddSubtask} disabled={saving || !subtaskTitle.trim()} style={{ background: subtaskTitle.trim() ? '#f5c518' : '#222', color: subtaskTitle.trim() ? '#000' : '#555', border: 'none', borderRadius: '8px', padding: '8px 14px', fontWeight: 700, cursor: subtaskTitle.trim() ? 'pointer' : 'not-allowed', fontSize: '13px' }}>Add</button>
                </div>
              )}
            </div>
          )}

          {/* COMMENTS */}
          {tab === 'COMMENTS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {comments.length === 0 && <p style={{ color: '#555', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No comments yet.</p>}
              {comments.map((c, i) => {
                const isMe = c.userId === user?.id;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '80%', background: isMe ? 'rgba(245,197,24,0.1)' : '#1a1a1a', border: isMe ? '1px solid rgba(245,197,24,0.25)' : '1px solid #2a2a2a', borderRadius: isMe ? '12px 12px 4px 12px' : '12px 12px 12px 4px', padding: '10px 14px' }}>
                      {!isMe && <div style={{ fontSize: '11px', color: '#f5c518', fontWeight: 700, marginBottom: '4px' }}>{c.authorName}</div>}
                      <div style={{ fontSize: '13px', color: '#fff', lineHeight: 1.5 }}>{c.content}</div>
                      <div style={{ fontSize: '10px', color: '#444', marginTop: '4px', textAlign: 'right' }}>{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <input value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddComment()} placeholder="Write a comment..." style={{ flex: 1, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff', padding: '8px 12px', fontSize: '13px', outline: 'none' }} />
                <button onClick={handleAddComment} disabled={saving || !commentText.trim()} style={{ background: commentText.trim() ? '#f5c518' : '#222', color: commentText.trim() ? '#000' : '#555', border: 'none', borderRadius: '8px', padding: '8px 14px', fontWeight: 700, cursor: commentText.trim() ? 'pointer' : 'not-allowed', fontSize: '13px' }}>Send</button>
              </div>
            </div>
          )}

          {/* PLEDGE */}
          {tab === 'PLEDGE' && (
            <div>
              {pledge ? (
                <div style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ fontSize: '13px', color: '#a855f7', fontWeight: 700, marginBottom: '8px' }}>🤝 Active Pledge</div>
                  <p style={{ color: '#c4b5fd', fontSize: '15px', lineHeight: 1.6 }}>{pledge}</p>
                </div>
              ) : (
                <div>
                  <p style={{ color: '#a0a0a0', fontSize: '13px', marginBottom: '16px', lineHeight: 1.6 }}>Make a commitment pledge to show your dedication. Visible to all group members.</p>
                  <textarea value={pledgeText} onChange={e => setPledgeText(e.target.value)} placeholder="I commit to completing this task by..." rows={4} style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px', color: '#fff', padding: '12px', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  <button onClick={handlePledge} disabled={saving || !pledgeText.trim()} style={{ marginTop: '10px', background: pledgeText.trim() ? 'rgba(168,85,247,0.2)' : '#222', color: pledgeText.trim() ? '#a855f7' : '#555', border: pledgeText.trim() ? '1px solid rgba(168,85,247,0.4)' : '1px solid #333', borderRadius: '10px', padding: '10px 20px', fontWeight: 700, cursor: pledgeText.trim() ? 'pointer' : 'not-allowed', fontSize: '13px' }}>🤝 Make Pledge</button>
                </div>
              )}
            </div>
          )}

          {/* BONUS REVIEW */}
          {tab === 'REVIEW' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ color: '#a0a0a0', fontSize: '13px', lineHeight: 1.6 }}>
                Members can flag a bonus as disproportionate or request a review if they think the reward wasn't fair.
              </p>

              {/* Bonus amount */}
              <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '22px' }}>🪙</span>
                <div>
                  <div style={{ fontSize: '13px', color: '#555', fontWeight: 600 }}>Bonus Coins Awarded</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#f5c518' }}>{task.bonusCoins || task.coinsReward || 0}</div>
                </div>
              </div>

              {reviewLoading ? (
                <div style={{ color: '#555', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Loading review status...</div>
              ) : reviewStatus ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Status */}
                  <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '14px 18px' }}>
                    <div style={{ fontSize: '11px', color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Review Status</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>
                        {reviewStatus.status === 'APPROVED' ? '✅' : reviewStatus.status === 'FLAGGED' ? '🚩' : reviewStatus.status === 'PENDING' ? '⏳' : '💬'}
                      </span>
                      <span style={{ fontWeight: 700, color: reviewStatus.status === 'APPROVED' ? '#22c55e' : reviewStatus.status === 'FLAGGED' ? '#ef4444' : '#f5c518' }}>
                        {reviewStatus.status || 'No review yet'}
                      </span>
                    </div>
                  </div>

                  {/* Flag count */}
                  {reviewStatus.flagCount > 0 && (
                    <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '12px 16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span>🚩</span>
                      <span style={{ fontSize: '13px', color: '#f87171' }}><strong>{reviewStatus.flagCount}</strong> member{reviewStatus.flagCount > 1 ? 's have' : ' has'} flagged this bonus as disproportionate.</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {!isAssignedToMe && reviewStatus.status !== 'FLAGGED' && (
                      <button onClick={handleFlagBonus} disabled={saving} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                        🚩 Flag as Disproportionate
                      </button>
                    )}
                    {isAssignedToMe && reviewStatus.status !== 'PENDING' && reviewStatus.status !== 'APPROVED' && (
                      <button onClick={handleRequestReview} disabled={saving} style={{ background: 'rgba(245,197,24,0.1)', border: '1px solid rgba(245,197,24,0.3)', color: '#f5c518', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                        💬 Request Bonus Review
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {!isAssignedToMe && (
                    <button onClick={handleFlagBonus} disabled={saving} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                      🚩 Flag as Disproportionate
                    </button>
                  )}
                  {isAssignedToMe && (
                    <button onClick={handleRequestReview} disabled={saving} style={{ background: 'rgba(245,197,24,0.1)', border: '1px solid rgba(245,197,24,0.3)', color: '#f5c518', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                      💬 Request Bonus Review
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function GroupTasksPage() {
  const { groupId } = useParams();
  const [tasks, setTasks]               = useState([]);
  const [group, setGroup]               = useState(null);
  const [user, setUser]                 = useState(null);
  const [showCreate, setShowCreate]     = useState(false);
  const [loading, setLoading]           = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [view, setView]                 = useState('ALL');
  const [error, setError]               = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingTask, setEditingTask]   = useState(null);
  const [editError, setEditError]       = useState('');
  const [priorityUpdating, setPriorityUpdating] = useState(null);
  const [xpMap, setXpMap]               = useState({});
  const [form, setForm] = useState({ assignedToId: '', title: '', description: '', priority: 'MEDIUM', category: 'WORK', deadline: '', bonusCoins: '' });
  const [editForm, setEditForm] = useState({ title: '', description: '', priority: 'MEDIUM', category: 'WORK', deadline: '' });

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    fetchData();
  }, [view]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [tasksRes, groupRes] = await Promise.all([
        view === 'ASSIGNED_BY_ME' ? getTasksAssignedByMe(groupId) : getGroupTasks(groupId),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/groups/${groupId}/detail`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setTasks(tasksRes.data);
      setGroup(groupRes.data);
      fetchGroupXp(groupRes.data?.members || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchGroupXp = async (members) => {
    const token = localStorage.getItem('token');
    const results = {};
    await Promise.all(members.map(async (m) => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/xp/user/${m.id ?? m._id}`, { headers: { Authorization: `Bearer ${token}` } });
        results[m.id ?? m._id] = res.data;
      } catch {}
    }));
    try {
      const myXp = await getMyXP();
      const stored = localStorage.getItem('user');
      const me = stored ? JSON.parse(stored) : null;
      if (me) results[me.id ?? me._id] = myXp.data;
    } catch {}
    setXpMap(results);
  };

  const handleCreate = async (e) => {
    e.preventDefault(); setError('');
    if (form.assignedToId && form.assignedToId === storedUser?.id) {
      setError('You cannot assign a task to yourself. Please use My Nest to create personal tasks.');
      return;
    }
    try {
      await createGroupTask({ ...form, groupId, assignedToId: form.assignedToId || null, bonusCoins: form.bonusCoins ? parseInt(form.bonusCoins) : null, deadline: form.deadline ? new Date(form.deadline).toISOString() : null });
      setShowCreate(false);
      setForm({ assignedToId: '', title: '', description: '', priority: 'MEDIUM', category: 'WORK', deadline: '', bonusCoins: '' });
      fetchData();
    } catch (err) { setError(err.response?.data?.message || 'Failed to create task.'); }
  };

  const handleEdit = async (e) => {
    e.preventDefault(); setEditError('');
    try {
      await editTask(editingTask.id, { ...editForm, deadline: editForm.deadline ? new Date(editForm.deadline).toISOString() : null });
      setEditingTask(null); fetchData();
    } catch (err) { setEditError(err.response?.data?.message || 'Failed to update task.'); }
  };

  const handlePriorityChange = async (taskId, newPriority) => {
    setPriorityUpdating(taskId);
    try { await updateTaskPriority(taskId, newPriority); fetchData(); }
    catch (err) { alert(err.response?.data?.error || 'Failed to update priority'); }
    finally { setPriorityUpdating(null); }
  };

  const openEditModal = (task) => {
    setEditingTask(task); setEditError('');
    setEditForm({ title: task.title || '', description: task.description || '', priority: task.priority || 'MEDIUM', category: task.category || 'WORK', deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '' });
  };

  const getMemberName = (userId) => {
    if (!userId) return 'Unassigned';
    const member = group?.members?.find(m => (m.id ?? m._id) === userId);
    return member ? (member.fullName || member.username) : 'Unknown';
  };

  const getMemberXpInfo = (userId) => {
    const xp = xpMap[userId];
    if (!xp) return { level: 1, tier: TITLE_TIERS[0] };
    const level = xp.level || 1;
    return { level, tier: getTier(level) };
  };

  const storedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const isAdmin = group?.adminId === (storedUser?.id ?? storedUser?._id);
  const filtered = filterStatus === 'ALL' ? tasks : tasks.filter(t => t.status === filterStatus);

  const total = tasks.length, pending = tasks.filter(t => t.status==='PENDING').length,
        inProg = tasks.filter(t => t.status==='IN_PROGRESS').length,
        completed = tasks.filter(t => t.status==='COMPLETED').length,
        openCount = tasks.filter(t => !t.assignedToId).length;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', flexDirection: 'column', gap: '12px' }}>
      <div style={{ fontSize: '36px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>🐝</div>
      <p style={{ color: '#f5c518', fontWeight: 600 }}>Loading tasks...</p>
    </div>
  );

  return (
    <div className="animate-fadeSlideUp">

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>✅ Group Tasks</h1>
          <p style={{ color: '#a0a0a0', marginTop: '2px', fontSize: '14px' }}>{group?.name}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>+ Assign Task</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[{ label:'Total', value:total, color:'#a0a0a0' }, { label:'Pending', value:pending, color:'#a0a0a0' }, { label:'In Progress', value:inProg, color:'#3b82f6' }, { label:'Completed', value:completed, color:'#22c55e' }, { label:'🔓 Open', value:openCount, color:'#f5c518' }].map(s => (
          <div key={s.label} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '10px 16px', minWidth: '80px' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: '#555', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* View + Filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '4px', background: '#1a1a1a', borderRadius: '10px', padding: '4px', border: '1px solid #2a2a2a' }}>
          {[{ key:'ASSIGNED_BY_ME', label:'📤 By Me' }, { key:'ALL', label:'👁️ All' }].map(v => (
            <button key={v.key} onClick={() => setView(v.key)} style={{ padding: '6px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, background: view===v.key ? '#f5c518' : 'transparent', color: view===v.key ? '#000' : '#a0a0a0', border: 'none', cursor: 'pointer' }}>{v.label}</button>
          ))}
        </div>
        <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '7px 12px', fontSize: '13px', minWidth: '150px', width: 'auto' }}>
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#555' }}>{filtered.length} of {tasks.length} tasks</div>
      </div>

      {/* Task List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', background: '#1a1a1a', borderRadius: '16px', border: '1px dashed #2a2a2a' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
          <p style={{ color: '#fff', fontWeight: 700 }}>No tasks here</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map((task, i) => {
            const isOpenTask = !task.assignedToId;
            const isCreator = task.assignedById === user?.id;
            const isAssignedToMe = task.assignedToId === user?.id;
            const hasSubtasks = (task.subtasks || []).length > 0;
            const hasComments = (task.comments || []).length > 0;
            const hasPledge   = !!task.pledgeMessage;
            const { level: assigneeLevel, tier: assigneeTier } = getMemberXpInfo(task.assignedToId);

            return (
              <div key={i} style={{ background: '#1a1a1a', borderRadius: '14px', border: isOpenTask ? '1px solid rgba(245,197,24,0.4)' : '1px solid #2a2a2a', overflow: 'hidden' }}>
                {isOpenTask && (
                  <div style={{ background: 'linear-gradient(90deg,rgba(245,197,24,0.2),rgba(245,197,24,0.05))', padding: '5px 18px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(245,197,24,0.15)' }}>
                    <span style={{ fontSize: '12px' }}>🔓</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#f5c518' }}>Open Task — Anyone can claim!</span>
                    {task.openTaskBonus && <span style={{ marginLeft: 'auto', background: 'rgba(34,197,94,0.15)', color: '#22c55e', borderRadius: '999px', padding: '2px 8px', fontSize: '10px', fontWeight: 700 }}>⭐ Bonus</span>}
                  </div>
                )}

                <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{task.title}</h3>
                      {isAdmin && task.status !== 'COMPLETED' ? (
                        <select value={task.priority} disabled={priorityUpdating===task.id} onChange={e => handlePriorityChange(task.id, e.target.value)}
                          style={{ background: `${priorityColor[task.priority]}22`, border: `1px solid ${priorityColor[task.priority]}66`, borderRadius: '999px', color: priorityColor[task.priority], fontSize: '11px', fontWeight: 700, padding: '2px 8px', cursor: 'pointer', outline: 'none' }}>
                          <option value="LOW">🟢 LOW</option><option value="MEDIUM">🟡 MEDIUM</option><option value="HIGH">🔴 HIGH</option>
                        </select>
                      ) : (
                        <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: `${priorityColor[task.priority]}22`, color: priorityColor[task.priority] }}>{task.priority}</span>
                      )}
                      <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: statusBg[task.status], color: statusColor[task.status] }}>{task.status.replace('_',' ')}</span>
                    </div>

                    {task.description && <p style={{ color: '#a0a0a0', fontSize: '12px', marginBottom: '8px', lineHeight: 1.4 }}>{task.description}</p>}

                    <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: '#666', flexWrap: 'wrap', alignItems: 'center' }}>
                      {/* Assignee with title badge */}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        👤 {getMemberName(task.assignedToId)}
                        {task.assignedToId && assigneeTier.frame !== 'none' && (
                          <span style={{ background: `${assigneeTier.color}22`, color: assigneeTier.color, borderRadius: '999px', padding: '1px 6px', fontSize: '10px', fontWeight: 700 }}>
                            {assigneeTier.title} Lv.{assigneeLevel}
                          </span>
                        )}
                      </span>
                      <span>📂 {task.category}</span>
                      {task.deadline && <span>⏰ {new Date(task.deadline).toLocaleDateString()}</span>}
                      <span style={{ color: '#f5c518', fontWeight: 700 }}>🪙 {task.coinsReward}</span>
                    </div>

                    {/* Indicators */}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                      {hasSubtasks && (
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: 'rgba(59,130,246,0.15)', color: '#3b82f6', fontWeight: 600 }}>
                          📝 {(task.subtasks||[]).filter(s=>s.completed).length}/{(task.subtasks||[]).length} subtasks
                        </span>
                      )}
                      {hasComments && (
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: 'rgba(34,197,94,0.12)', color: '#22c55e', fontWeight: 600 }}>
                          💬 {(task.comments||[]).length}
                        </span>
                      )}
                      {hasPledge && (
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: 'rgba(168,85,247,0.12)', color: '#a855f7', fontWeight: 600 }}>
                          🤝 pledged
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button onClick={() => setSelectedTask(task)} style={{ background: 'rgba(245,197,24,0.1)', border: '1px solid rgba(245,197,24,0.25)', color: '#f5c518', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>Details</button>
                    {isOpenTask && !isCreator && (
                      <button className="btn-primary" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => claimTask(task.id).then(fetchData)}>🙋 Claim</button>
                    )}
                    {isAssignedToMe && task.status === 'PENDING' && (
                      <button className="btn-outline" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => updateTaskStatus(task.id,'IN_PROGRESS').then(fetchData)}>Start</button>
                    )}
                    {isAssignedToMe && task.status === 'IN_PROGRESS' && (
                      <button className="btn-primary" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => updateTaskStatus(task.id,'COMPLETED').then(fetchData)}>Done ✅</button>
                    )}
                    {isAssignedToMe && task.status !== 'COMPLETED' && !task.personal && (
                      <button onClick={() => denyTask(task.id).then(fetchData)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' }}>❌</button>
                    )}
                    {(isCreator || isAdmin) && task.status !== 'COMPLETED' && (
                      <>
                        <button onClick={() => openEditModal(task)} style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6', borderRadius: '8px', padding: '6px 8px', fontSize: '13px', cursor: 'pointer' }}>✏️</button>
                        <button onClick={() => deleteTask(task.id).then(fetchData)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '8px', padding: '6px 8px', fontSize: '13px', cursor: 'pointer' }}>🗑️</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          user={user}
          xpMap={xpMap}
          onClose={() => setSelectedTask(null)}
          onRefresh={() => { fetchData(); setSelectedTask(null); }}
        />
      )}

      {/* Assign Task Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' }}>
          <div style={{ background: '#1a1a1a', borderRadius: '20px', border: '1px solid #2a2a2a', width: '100%', maxWidth: '500px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 26px 16px', borderBottom: '1px solid #2a2a2a', flexShrink: 0 }}>
              <div><h2 style={{ fontSize: '18px', fontWeight: 700 }}>✅ Assign Task</h2><p style={{ color: '#a0a0a0', fontSize: '12px' }}>Leave "Assign To" empty for Open Task 🔓</p></div>
              <button onClick={() => { setShowCreate(false); setError(''); }} style={{ background: '#222', border: '1px solid #333', color: '#a0a0a0', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer', fontSize: '14px' }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', padding: '20px 26px', flex: 1 }}>
              {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '8px', padding: '10px', color: '#ef4444', fontSize: '13px', marginBottom: '14px' }}>{error}</div>}
              <form id="assignForm" onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div><label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Title *</label><input className="input" placeholder="What needs to be done?" value={form.title} onChange={e => setForm({...form,title:e.target.value})} required /></div>
                <div><label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Assign To <span style={{ color: '#555' }}>(optional)</span></label>
                  <select className="input" value={form.assignedToId} onChange={e => setForm({...form,assignedToId:e.target.value})}>
                    <option value="">🔓 Open Task</option>
                    {group?.members?.map(m => <option key={m.id??m._id} value={m.id??m._id}>{m.fullName}{(m.id??m._id)===group.adminId?' (Admin)':''}</option>)}
                  </select>
                </div>
                <div><label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Description</label><input className="input" placeholder="Optional..." value={form.description} onChange={e => setForm({...form,description:e.target.value})} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div><label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Priority</label>
                    <select className="input" value={form.priority} onChange={e => setForm({...form,priority:e.target.value})}>{['LOW','MEDIUM','HIGH'].map(p=><option key={p} value={p}>{p}</option>)}</select></div>
                  <div><label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Category</label>
                    <select className="input" value={form.category} onChange={e => setForm({...form,category:e.target.value})}>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div><label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Deadline</label><input className="input" type="datetime-local" value={form.deadline} onChange={e => setForm({...form,deadline:e.target.value})} /></div>
                  <div><label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Bonus Coins 🪙</label><input className="input" type="number" placeholder="0" min="0" value={form.bonusCoins} onChange={e => setForm({...form,bonusCoins:e.target.value})} /></div>
                </div>
              </form>
            </div>
            <div style={{ padding: '14px 26px 20px', borderTop: '1px solid #2a2a2a', flexShrink: 0 }}>
              <button form="assignForm" className="btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }}>✅ Assign Task</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' }}>
          <div style={{ background: '#1a1a1a', borderRadius: '20px', border: '1px solid #2a2a2a', width: '100%', maxWidth: '500px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 26px 16px', borderBottom: '1px solid #2a2a2a', flexShrink: 0 }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>✏️ Edit Task</h2>
              <button onClick={() => setEditingTask(null)} style={{ background: '#222', border: '1px solid #333', color: '#a0a0a0', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer', fontSize: '14px' }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', padding: '20px 26px', flex: 1 }}>
              {editError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '8px', padding: '10px', color: '#ef4444', fontSize: '13px', marginBottom: '14px' }}>{editError}</div>}
              <form id="editForm" onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div><label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Title *</label><input className="input" value={editForm.title} onChange={e => setEditForm({...editForm,title:e.target.value})} required /></div>
                <div><label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Description</label><input className="input" value={editForm.description} onChange={e => setEditForm({...editForm,description:e.target.value})} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div><label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Priority</label>
                    <select className="input" value={editForm.priority} onChange={e => setEditForm({...editForm,priority:e.target.value})}>{['LOW','MEDIUM','HIGH'].map(p=><option key={p} value={p}>{p}</option>)}</select></div>
                  <div><label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Category</label>
                    <select className="input" value={editForm.category} onChange={e => setEditForm({...editForm,category:e.target.value})}>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                </div>
                <div><label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Deadline</label><input className="input" type="datetime-local" value={editForm.deadline} onChange={e => setEditForm({...editForm,deadline:e.target.value})} /></div>
              </form>
            </div>
            <div style={{ padding: '14px 26px 20px', borderTop: '1px solid #2a2a2a', flexShrink: 0 }}>
              <button form="editForm" className="btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
