'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getGroupTasks, getTasksAssignedByMe, createGroupTask, updateTaskStatus, deleteTask, claimTask, editTask, denyTask } from '@/lib/api';
import axios from 'axios';

const CATEGORIES = ['GROCERIES', 'HOME', 'SCHOOL', 'PERSONAL', 'WORK', 'OTHER'];

export default function GroupTasksPage() {
  const { groupId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [group, setGroup] = useState(null);
  const [user, setUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [view, setView] = useState('ASSIGNED_TO_ME');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    assignedToId: '', title: '', description: '',
    priority: 'MEDIUM', category: 'WORK', deadline: '', bonusCoins: ''
  });
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '', description: '', priority: 'MEDIUM', category: 'WORK', deadline: ''
  });
  const [editError, setEditError] = useState('');

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
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/groups/${groupId}/detail`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setTasks(tasksRes.data);
      setGroup(groupRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createGroupTask({
        ...form, groupId,
        assignedToId: form.assignedToId || null,
        bonusCoins: form.bonusCoins ? parseInt(form.bonusCoins) : null,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      });
      setShowCreate(false);
      setForm({ assignedToId: '', title: '', description: '', priority: 'MEDIUM', category: 'WORK', deadline: '', bonusCoins: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task.');
    }
  };

  const handleStatus = async (taskId, status) => {
    try { await updateTaskStatus(taskId, status); fetchData(); } catch (err) { console.error(err); }
  };

  const handleClaim = async (taskId) => {
    try { await claimTask(taskId); fetchData(); } catch (err) { console.error(err); }
  };

  const handleDeny = async (taskId) => {
    try { await denyTask(taskId); fetchData(); } catch (err) { alert(err.response?.data?.message || 'Failed to deny task.'); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditError('');
    try {
      await editTask(editingTask.id, {
        ...editForm,
        deadline: editForm.deadline ? new Date(editForm.deadline).toISOString() : null,
      });
      setEditingTask(null);
      fetchData();
    } catch (err) { setEditError(err.response?.data?.message || 'Failed to update task.'); }
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setEditError('');
    setEditForm({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'MEDIUM',
      category: task.category || 'WORK',
      deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '',
    });
  };

  const filtered = filterStatus === 'ALL' ? tasks : tasks.filter(t => t.status === filterStatus);
  const priorityColor = { LOW: '#22c55e', MEDIUM: '#f5c518', HIGH: '#ef4444' };
  const statusColor   = { PENDING: '#a0a0a0', IN_PROGRESS: '#3b82f6', COMPLETED: '#22c55e' };
  const statusBg      = { PENDING: 'rgba(160,160,160,0.12)', IN_PROGRESS: 'rgba(59,130,246,0.12)', COMPLETED: 'rgba(34,197,94,0.12)' };

  const getMemberName = (id) => {
    const m = group?.members?.find(m => m.id === id);
    return m ? (m.fullName || m.username) : 'Unknown';
  };

  // Stats bar
  const total     = tasks.length;
  const pending   = tasks.filter(t => t.status === 'PENDING').length;
  const inProg    = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const completed = tasks.filter(t => t.status === 'COMPLETED').length;
  const openCount = tasks.filter(t => !t.assignedToId).length;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', flexDirection: 'column', gap: '12px' }}>
      <div style={{ fontSize: '36px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>🐝</div>
      <p style={{ color: '#f5c518', fontWeight: 600 }}>Loading tasks...</p>
    </div>
  );

  return (
    <div className="animate-fadeSlideUp">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>✅ Group Tasks</h1>
          <p style={{ color: '#a0a0a0', marginTop: '2px', fontSize: '14px' }}>{group?.name}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>+ Assign Task</button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: total,     color: '#a0a0a0' },
          { label: 'Pending',  value: pending,   color: '#a0a0a0' },
          { label: 'In Progress', value: inProg,    color: '#3b82f6' },
          { label: 'Completed', value: completed, color: '#22c55e' },
          { label: '🔓 Open',   value: openCount, color: '#f5c518' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px',
            padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '80px',
          }}>
            <span style={{ fontSize: '20px', fontWeight: 800, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: '11px', color: '#555', fontWeight: 600 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* View toggle + Status filter (dropdown) in one row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* View toggle pills */}
        <div style={{ display: 'flex', gap: '6px', background: '#1a1a1a', borderRadius: '12px', padding: '4px', border: '1px solid #2a2a2a' }}>
          {[
            { key: 'ASSIGNED_TO_ME', label: '📥 Mine' },
            { key: 'ASSIGNED_BY_ME', label: '📤 By Me' },
            { key: 'ALL',            label: '👁️ All' },
          ].map(v => (
            <button key={v.key} onClick={() => setView(v.key)} style={{
              padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
              background: view === v.key ? '#f5c518' : 'transparent',
              color: view === v.key ? '#000' : '#a0a0a0',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            }}>{v.label}</button>
          ))}
        </div>

        {/* Status filter — DROPDOWN instead of pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ color: '#a0a0a0', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>Status:</label>
          <select
            className="input"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: '7px 12px', fontSize: '13px', minWidth: '150px', width: 'auto' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#555' }}>
          {filtered.length} of {tasks.length} tasks
        </div>
      </div>

      {/* Task List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', background: '#1a1a1a', borderRadius: '16px', border: '1px dashed #2a2a2a' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: '16px', marginBottom: '6px' }}>No tasks here</p>
          <p style={{ color: '#a0a0a0', fontSize: '13px' }}>Try a different filter or assign a new task.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((task, i) => {
            const isOpenTask    = !task.assignedToId;
            const isCreator     = task.assignedById === user?.id;
            const isAssignedToMe = task.assignedToId === user?.id;

            return (
              <div key={i} style={{
                background: '#1a1a1a',
                borderRadius: '16px',
                border: isOpenTask
                  ? '1px solid rgba(245,197,24,0.4)'
                  : '1px solid #2a2a2a',
                padding: '0',
                overflow: 'hidden',
                transition: 'all 0.2s',
              }}>
                {/* Open task top stripe */}
                {isOpenTask && (
                  <div style={{
                    background: 'linear-gradient(90deg, rgba(245,197,24,0.2), rgba(245,197,24,0.05))',
                    padding: '6px 20px',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    borderBottom: '1px solid rgba(245,197,24,0.2)',
                  }}>
                    <span style={{ fontSize: '14px' }}>🔓</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#f5c518' }}>Open Task — Anyone can claim this!</span>
                    {task.openTaskBonus && (
                      <span style={{
                        marginLeft: 'auto', background: 'rgba(34,197,94,0.15)',
                        color: '#22c55e', borderRadius: '999px', padding: '2px 10px',
                        fontSize: '11px', fontWeight: 700,
                      }}>⭐ Bonus Coins</span>
                    )}
                  </div>
                )}

                <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    {/* Title + badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>{task.title}</h3>
                      <span style={{
                        padding: '2px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                        background: `${priorityColor[task.priority]}22`, color: priorityColor[task.priority],
                      }}>{task.priority}</span>
                      <span style={{
                        padding: '2px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                        background: statusBg[task.status], color: statusColor[task.status],
                      }}>{task.status.replace('_', ' ')}</span>
                    </div>

                    {task.description && (
                      <p style={{ color: '#a0a0a0', fontSize: '13px', marginBottom: '10px', lineHeight: 1.5 }}>{task.description}</p>
                    )}

                    {/* Meta info row */}
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#666', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        👤
                        {isOpenTask ? (
                          <span style={{
                            color: '#f5c518', fontWeight: 600,
                            background: 'rgba(245,197,24,0.1)', borderRadius: '6px', padding: '1px 6px',
                          }}>Unclaimed</span>
                        ) : (
                          <span style={{ color: '#ccc' }}>{getMemberName(task.assignedToId)}</span>
                        )}
                      </span>
                      <span>📂 {task.category}</span>
                      {task.deadline && <span>⏰ {new Date(task.deadline).toLocaleDateString()}</span>}
                      <span style={{ color: '#f5c518', fontWeight: 700 }}>🪙 {task.coinsReward}</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
                    {isOpenTask && !isCreator && (
                      <button className="btn-primary" style={{ fontSize: '12px', padding: '7px 14px' }}
                        onClick={() => handleClaim(task.id)}>
                        🙋 Claim
                      </button>
                    )}
                    {isAssignedToMe && task.status === 'PENDING' && (
                      <button className="btn-outline" style={{ fontSize: '12px', padding: '7px 14px' }}
                        onClick={() => handleStatus(task.id, 'IN_PROGRESS')}>Start</button>
                    )}
                    {isAssignedToMe && task.status === 'IN_PROGRESS' && (
                      <button className="btn-primary" style={{ fontSize: '12px', padding: '7px 14px' }}
                        onClick={() => handleStatus(task.id, 'COMPLETED')}>Done ✅</button>
                    )}
                    {isAssignedToMe && task.status !== 'COMPLETED' && !task.personal && (
                      <button onClick={() => handleDeny(task.id)} style={{
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                        color: '#ef4444', borderRadius: '8px', padding: '7px 12px',
                        fontSize: '12px', cursor: 'pointer',
                      }}>❌ Deny</button>
                    )}
                    {isCreator && task.status !== 'COMPLETED' && (
                      <button onClick={() => openEditModal(task)} style={{
                        background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
                        color: '#3b82f6', borderRadius: '8px', padding: '7px 10px',
                        fontSize: '14px', cursor: 'pointer',
                      }}>✏️</button>
                    )}
                    {isCreator && task.status !== 'COMPLETED' && (
                      <button onClick={() => deleteTask(task.id).then(fetchData)} style={{
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                        color: '#ef4444', borderRadius: '8px', padding: '7px 10px',
                        fontSize: '14px', cursor: 'pointer',
                      }}>🗑️</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Assign Task Modal ── */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' }}>
          <div className="animate-fadeSlideUp" style={{ background: '#1a1a1a', borderRadius: '20px', border: '1px solid #2a2a2a', width: '100%', maxWidth: '500px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px 16px', borderBottom: '1px solid #2a2a2a', flexShrink: 0 }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700 }}>✅ Assign Task</h2>
                <p style={{ color: '#a0a0a0', fontSize: '12px', marginTop: '2px' }}>Leave "Assign To" empty to make it an Open Task 🔓</p>
              </div>
              <button onClick={() => { setShowCreate(false); setError(''); }} style={{ background: '#222', border: '1px solid #333', color: '#a0a0a0', fontSize: '16px', cursor: 'pointer', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', padding: '20px 28px', flex: 1 }}>
              {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '8px', padding: '10px', color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}
              <form id="assignForm" onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Title *</label>
                  <input className="input" placeholder="What needs to be done?" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div>
                  <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Assign To <span style={{ color: '#666' }}>(optional)</span></label>
                  <select className="input" value={form.assignedToId} onChange={e => setForm({ ...form, assignedToId: e.target.value })}>
                    <option value="">🔓 Open Task (anyone can claim)</option>
                    {group?.members?.map(m => <option key={m.id} value={m.id}>{m.fullName} {m.id === group.adminId ? '(Admin)' : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Description</label>
                  <input className="input" placeholder="Optional details..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Priority</label>
                    <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                      {['LOW', 'MEDIUM', 'HIGH'].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Category</label>
                    <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Deadline</label>
                    <input className="input" type="datetime-local" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Bonus Coins 🪙</label>
                    <input className="input" type="number" placeholder="0" min="0" value={form.bonusCoins} onChange={e => setForm({ ...form, bonusCoins: e.target.value })} />
                  </div>
                </div>
              </form>
            </div>
            <div style={{ padding: '16px 28px 24px', borderTop: '1px solid #2a2a2a', flexShrink: 0 }}>
              <button form="assignForm" className="btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }}>✅ Assign Task</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Task Modal ── */}
      {editingTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' }}>
          <div className="animate-fadeSlideUp" style={{ background: '#1a1a1a', borderRadius: '20px', border: '1px solid #2a2a2a', width: '100%', maxWidth: '500px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px 16px', borderBottom: '1px solid #2a2a2a', flexShrink: 0 }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700 }}>✏️ Edit Task</h2>
                <p style={{ color: '#a0a0a0', fontSize: '12px', marginTop: '2px' }}>Update task details</p>
              </div>
              <button onClick={() => setEditingTask(null)} style={{ background: '#222', border: '1px solid #333', color: '#a0a0a0', fontSize: '16px', cursor: 'pointer', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', padding: '20px 28px', flex: 1 }}>
              {editError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '8px', padding: '10px', color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>{editError}</div>}
              <form id="editForm" onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Title *</label>
                  <input className="input" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} required />
                </div>
                <div>
                  <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Description</label>
                  <input className="input" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Priority</label>
                    <select className="input" value={editForm.priority} onChange={e => setEditForm({ ...editForm, priority: e.target.value })}>
                      {['LOW', 'MEDIUM', 'HIGH'].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Category</label>
                    <select className="input" value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Deadline</label>
                  <input className="input" type="datetime-local" value={editForm.deadline} onChange={e => setEditForm({ ...editForm, deadline: e.target.value })} />
                </div>
              </form>
            </div>
            <div style={{ padding: '16px 28px 24px', borderTop: '1px solid #2a2a2a', flexShrink: 0 }}>
              <button form="editForm" className="btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }}>✏️ Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}