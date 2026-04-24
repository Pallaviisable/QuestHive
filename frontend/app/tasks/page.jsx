'use client';
import { useEffect, useState } from 'react';
import { getMyTasks, getMyPersonalTasks, createPersonalTask, updateTaskStatus, deleteTask } from '@/lib/api';

const CATEGORIES = ['GROCERIES', 'HOME', 'SCHOOL', 'PERSONAL', 'WORK', 'OTHER'];

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [tab, setTab] = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', priority: 'MEDIUM', category: 'WORK', deadline: ''
  });

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    fetchTasks();
  }, [tab]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = tab === 'MYNEST' ? await getMyPersonalTasks() : await getMyTasks();
      setTasks(res.data);
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
      await createPersonalTask({
        ...form,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      });
      setShowCreate(false);
      setForm({ title: '', description: '', priority: 'MEDIUM', category: 'WORK', deadline: '' });
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task.');
    }
  };

  const handleStatus = async (taskId, status) => {
    try {
      await updateTaskStatus(taskId, status);
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await deleteTask(taskId);
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const priorityColor = { LOW: '#22c55e', MEDIUM: '#f5c518', HIGH: '#ef4444' };
  const statusColor = { PENDING: '#a0a0a0', IN_PROGRESS: '#3b82f6', COMPLETED: '#22c55e' };

  return (
    <div className="animate-fadeSlideUp">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>🪺 MyNest</h1>
          <p style={{ color: '#a0a0a0', marginTop: '2px' }}>Your personal task space</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>+ Add to Nest</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[
          { key: 'ALL', label: '📋 All Tasks' },
          { key: 'MYNEST', label: '🪺 MyNest' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 20px', borderRadius: '999px', fontSize: '13px', fontWeight: 600,
            background: tab === t.key ? '#f5c518' : '#222',
            color: tab === t.key ? '#000' : '#a0a0a0',
            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '36px' }}>🐝</div>
          <p style={{ color: '#f5c518', fontWeight: 600 }}>Loading tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🪺</div>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: '16px', marginBottom: '6px' }}>
            {tab === 'MYNEST' ? 'Your nest is empty!' : 'No tasks assigned to you'}
          </p>
          <p style={{ color: '#a0a0a0', fontSize: '13px' }}>
            {tab === 'MYNEST' ? 'Add personal tasks to your nest!' : 'Tasks assigned to you will appear here.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tasks.map((task, i) => (
            <div key={i} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700 }}>{task.title}</h3>
                    <span className="badge" style={{ background: `${priorityColor[task.priority]}22`, color: priorityColor[task.priority] }}>
                      {task.priority}
                    </span>
                    <span className="badge" style={{ background: `${statusColor[task.status]}22`, color: statusColor[task.status] }}>
                      {task.status.replace('_', ' ')}
                    </span>
                    {task.personal && <span className="badge badge-yellow">🪺 MyNest</span>}
                  </div>
                  {task.description && (
                    <p style={{ color: '#a0a0a0', fontSize: '13px', marginBottom: '8px' }}>{task.description}</p>
                  )}
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#a0a0a0', flexWrap: 'wrap' }}>
                    <span>📂 {task.category}</span>
                    {task.deadline && <span>⏰ {new Date(task.deadline).toLocaleDateString()}</span>}
                    {/* No coins shown for personal tasks */}
                    {!task.personal && <span style={{ color: '#f5c518' }}>🪙 {task.coinsReward}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  {task.status === 'PENDING' && (
                    <button className="btn-outline" style={{ fontSize: '12px', padding: '6px 12px' }}
                      onClick={() => handleStatus(task.id, 'IN_PROGRESS')}>Start</button>
                  )}
                  {task.status === 'IN_PROGRESS' && (
                    <button className="btn-primary" style={{ fontSize: '12px', padding: '6px 12px' }}
                      onClick={() => handleStatus(task.id, 'COMPLETED')}>Done ✅</button>
                  )}
                  {(task.personal || task.assignedById === user?.id) && (
                    <button onClick={() => handleDelete(task.id)} style={{
                      background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444',
                      color: '#ef4444', borderRadius: '8px', padding: '6px 10px',
                      fontSize: '12px', cursor: 'pointer',
                    }}>🗑️</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MyNest Task Modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: '16px',
        }}>
          <div className="animate-fadeSlideUp" style={{
            background: '#1a1a1a', borderRadius: '20px', border: '1px solid #2a2a2a',
            width: '100%', maxWidth: '440px', maxHeight: '90vh',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '24px 28px 16px', borderBottom: '1px solid #2a2a2a', flexShrink: 0,
            }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700 }}>🪺 Add to MyNest</h2>
                <p style={{ color: '#a0a0a0', fontSize: '12px', marginTop: '2px' }}>Only visible to you</p>
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
              <form id="nestForm" onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Title *</label>
                  <input className="input" placeholder="What needs to be done?" value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })} required />
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
                <div>
                  <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Deadline</label>
                  <input className="input" type="datetime-local" value={form.deadline}
                    onChange={e => setForm({ ...form, deadline: e.target.value })} />
                </div>
              </form>
            </div>

            <div style={{ padding: '16px 28px 24px', borderTop: '1px solid #2a2a2a', flexShrink: 0 }}>
              <button form="nestForm" className="btn-primary" type="submit"
                style={{ width: '100%', justifyContent: 'center' }}>
                🪺 Add to Nest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}