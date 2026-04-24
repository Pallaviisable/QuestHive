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
  const [filter, setFilter] = useState('ALL');
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
    try {
      const token = localStorage.getItem('token');
      const [tasksRes, groupRes] = await Promise.all([
        view === 'ASSIGNED_BY_ME' ? getTasksAssignedByMe(groupId) : getGroupTasks(groupId),
        axios.get(`http://localhost:8080/api/groups/${groupId}/detail`, {
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
        ...form,
        groupId,
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
    try {
      await updateTaskStatus(taskId, status);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClaim = async (taskId) => {
    try {
      await claimTask(taskId);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeny = async (taskId) => {
    try {
      await denyTask(taskId);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to deny task.');
    }
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
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update task.');
    }
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

  const filtered = filter === 'ALL' ? tasks : tasks.filter(t => t.status === filter);
  const priorityColor = { LOW: '#22c55e', MEDIUM: '#f5c518', HIGH: '#ef4444' };
  const statusColor = { PENDING: '#a0a0a0', IN_PROGRESS: '#3b82f6', COMPLETED: '#22c55e' };

  const getMemberName = (id) => {
    const m = group?.members?.find(m => m.id === id);
    return m ? m.fullName : id;
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', flexDirection: 'column', gap: '12px' }}>
      <div style={{ fontSize: '36px' }}>🐝</div>
      <p style={{ color: '#f5c518', fontWeight: 600 }}>Loading tasks...</p>
    </div>
  );

  return (
    <div className="animate-fadeSlideUp">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>✅ Group Tasks</h1>
          <p style={{ color: '#a0a0a0', marginTop: '2px' }}>{group?.name}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>+ Assign Task</button>
      </div>

      {/* View Toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[
          { key: 'ASSIGNED_TO_ME', label: '📥 Assigned to Me' },
          { key: 'ASSIGNED_BY_ME', label: '📤 Assigned by Me' },
          { key: 'ALL', label: '👁️ All Tasks' },
        ].map(v => (
          <button key={v.key} onClick={() => setView(v.key)} style={{
            padding: '7px 16px', borderRadius: '999px', fontSize: '13px', fontWeight: 600,
            background: view === v.key ? '#f5c518' : '#222',
            color: view === v.key ? '#000' : '#a0a0a0',
            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
          }}>{v.label}</button>
        ))}
      </div>

      {/* Status Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '6px 16px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
            background: filter === s ? '#333' : '#1a1a1a',
            color: filter === s ? '#fff' : '#666',
            border: `1px solid ${filter === s ? '#555' : '#2a2a2a'}`,
            cursor: 'pointer', transition: 'all 0.2s',
          }}>{s.replace('_', ' ')}</button>
        ))}
      </div>

      {/* Task List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: '16px', marginBottom: '6px' }}>No tasks here</p>
          <p style={{ color: '#a0a0a0', fontSize: '13px' }}>Assign a task to get your group started!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((task, i) => {
            const isOpenTask = !task.assignedToId;
            const isCreator = task.assignedById === user?.id;
            const isAssignedToMe = task.assignedToId === user?.id;
            return (
              <div key={i} className="card" style={{
                padding: '20px', display: 'flex', alignItems: 'center', gap: '16px',
                border: isOpenTask ? '1px solid rgba(245,197,24,0.3)' : undefined,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700 }}>{task.title}</h3>
                    {isOpenTask && (
                      <span className="badge" style={{ background: 'rgba(245,197,24,0.15)', color: '#f5c518' }}>
                        🔓 Open Task
                      </span>
                    )}
                    {task.openTaskBonus && (
                      <span className="badge" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
                        ⭐ +5 Bonus
                      </span>
                    )}
                    <span className="badge" style={{ background: `${priorityColor[task.priority]}22`, color: priorityColor[task.priority] }}>
                      {task.priority}
                    </span>
                    <span className="badge" style={{ background: `${statusColor[task.status]}22`, color: statusColor[task.status] }}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  {task.description && <p style={{ color: '#a0a0a0', fontSize: '13px', marginBottom: '8px' }}>{task.description}</p>}
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#a0a0a0', flexWrap: 'wrap' }}>
                    <span>👤 {isOpenTask ? 'Unclaimed' : getMemberName(task.assignedToId)}</span>
                    <span>📂 {task.category}</span>
                    {task.deadline && <span>⏰ {new Date(task.deadline).toLocaleDateString()}</span>}
                    <span style={{ color: '#f5c518' }}>🪙 {task.coinsReward}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {/* Claim — open task, not creator */}
                  {isOpenTask && !isCreator && (
                    <button className="btn-primary" style={{ fontSize: '12px', padding: '6px 12px' }}
                      onClick={() => handleClaim(task.id)}>
                      🙋 Claim
                    </button>
                  )}
                  {/* Start */}
                  {isAssignedToMe && task.status === 'PENDING' && (
                    <button className="btn-outline" style={{ fontSize: '12px', padding: '6px 12px' }}
                      onClick={() => handleStatus(task.id, 'IN_PROGRESS')}>Start</button>
                  )}
                  {/* Complete */}
                  {isAssignedToMe && task.status === 'IN_PROGRESS' && (
                    <button className="btn-primary" style={{ fontSize: '12px', padding: '6px 12px' }}
                      onClick={() => handleStatus(task.id, 'COMPLETED')}>Complete ✅</button>
                  )}
                  {/* Deny — assigned to me, not completed, not personal */}
                  {isAssignedToMe && task.status !== 'COMPLETED' && !task.personal && (
                    <button onClick={() => handleDeny(task.id)} style={{
                      background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444',
                      color: '#ef4444', borderRadius: '8px', padding: '6px 10px',
                      fontSize: '12px', cursor: 'pointer',
                    }}>❌ Deny</button>
                  )}
                  {/* Edit — creator only, not completed */}
                  {isCreator && task.status !== 'COMPLETED' && (
                    <button onClick={() => openEditModal(task)} style={{
                      background: 'rgba(59,130,246,0.1)', border: '1px solid #3b82f6',
                      color: '#3b82f6', borderRadius: '8px', padding: '6px 10px',
                      fontSize: '12px', cursor: 'pointer',
                    }}>✏️</button>
                  )}
                  {/* Delete — creator only, not completed */}
                  {isCreator && task.status !== 'COMPLETED' && (
                    <button onClick={() => deleteTask(task.id).then(fetchData)} style={{
                      background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444',
                      color: '#ef4444', borderRadius: '8px', padding: '6px 10px',
                      fontSize: '12px', cursor: 'pointer',
                    }}>🗑️</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign Task Modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: '16px',
        }}>
          <div className="animate-fadeSlideUp" style={{
            background: '#1a1a1a', borderRadius: '20px', border: '1px solid #2a2a2a',
            width: '100%', maxWidth: '500px', maxHeight: '90vh',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '24px 28px 16px', borderBottom: '1px solid #2a2a2a', flexShrink: 0,
            }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700 }}>✅ Assign Task</h2>
                <p style={{ color: '#a0a0a0', fontSize: '12px', marginTop: '2px' }}>
                  Leave "Assign To" empty to make it an Open Task 🔓
                </p>
              </div>
              <button onClick={() => { setShowCreate(false); setError(''); }} style={{
                background: '#222', border: '1px solid #333', color: '#a0a0a0',
                fontSize: '16px', cursor: 'pointer', borderRadius: '8px',
                width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', padding: '20px 28px', flex: 1 }}>
              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444',
                  borderRadius: '8px', padding: '10px', color: '#ef4444',
                  fontSize: '13px', marginBottom: '16px',
                }}>{error}</div>
              )}
              <form id="assignForm" onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Title *</label>
                  <input className="input" placeholder="What needs to be done?" value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div>
                  <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                    Assign To <span style={{ color: '#666' }}>(optional — leave empty for Open Task 🔓)</span>
                  </label>
                  <select className="input" value={form.assignedToId}
                    onChange={e => setForm({ ...form, assignedToId: e.target.value })}>
                    <option value="">🔓 Open Task (anyone can claim)</option>
                    {group?.members?.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} {m.id === group.adminId ? '(Admin)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Description</label>
                  <input className="input" placeholder="Optional details..." value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })} />
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
                    <input className="input" type="datetime-local" value={form.deadline}
                      onChange={e => setForm({ ...form, deadline: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Bonus Coins 🪙</label>
                    <input className="input" type="number" placeholder="0" min="0" value={form.bonusCoins}
                      onChange={e => setForm({ ...form, bonusCoins: e.target.value })} />
                  </div>
                </div>
              </form>
            </div>
            <div style={{ padding: '16px 28px 24px', borderTop: '1px solid #2a2a2a', flexShrink: 0 }}>
              <button form="assignForm" className="btn-primary" type="submit"
                style={{ width: '100%', justifyContent: 'center' }}>
                ✅ Assign Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: '16px',
        }}>
          <div className="animate-fadeSlideUp" style={{
            background: '#1a1a1a', borderRadius: '20px', border: '1px solid #2a2a2a',
            width: '100%', maxWidth: '500px', maxHeight: '90vh',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '24px 28px 16px', borderBottom: '1px solid #2a2a2a', flexShrink: 0,
            }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700 }}>✏️ Edit Task</h2>
                <p style={{ color: '#a0a0a0', fontSize: '12px', marginTop: '2px' }}>Update task details</p>
              </div>
              <button onClick={() => setEditingTask(null)} style={{
                background: '#222', border: '1px solid #333', color: '#a0a0a0',
                fontSize: '16px', cursor: 'pointer', borderRadius: '8px',
                width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', padding: '20px 28px', flex: 1 }}>
              {editError && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444',
                  borderRadius: '8px', padding: '10px', color: '#ef4444',
                  fontSize: '13px', marginBottom: '16px',
                }}>{editError}</div>
              )}
              <form id="editForm" onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Title *</label>
                  <input className="input" value={editForm.title}
                    onChange={e => setEditForm({ ...editForm, title: e.target.value })} required />
                </div>
                <div>
                  <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Description</label>
                  <input className="input" value={editForm.description}
                    onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Priority</label>
                    <select className="input" value={editForm.priority}
                      onChange={e => setEditForm({ ...editForm, priority: e.target.value })}>
                      {['LOW', 'MEDIUM', 'HIGH'].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Category</label>
                    <select className="input" value={editForm.category}
                      onChange={e => setEditForm({ ...editForm, category: e.target.value })}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Deadline</label>
                  <input className="input" type="datetime-local" value={editForm.deadline}
                    onChange={e => setEditForm({ ...editForm, deadline: e.target.value })} />
                </div>
              </form>
            </div>
            <div style={{ padding: '16px 28px 24px', borderTop: '1px solid #2a2a2a', flexShrink: 0 }}>
              <button form="editForm" className="btn-primary" type="submit"
                style={{ width: '100%', justifyContent: 'center' }}>
                ✏️ Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}