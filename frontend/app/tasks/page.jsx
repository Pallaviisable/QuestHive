'use client';
import { useEffect, useState } from 'react';
import { getMyTasks, getMyPersonalTasks, createPersonalTask, updateTaskStatus, deleteTask } from '@/lib/api';

const STATUSES    = ['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'];
const PRIORITIES  = ['ALL', 'LOW', 'MEDIUM', 'HIGH'];
const CATEGORIES  = ['ALL', 'GROCERIES', 'HOME', 'SCHOOL', 'PERSONAL', 'WORK', 'OTHER'];

export default function TasksPage() {
  const [tasks, setTasks]         = useState([]);
  const [tab, setTab]             = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [user, setUser]           = useState(null);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus,   setFilterStatus]   = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', category: 'WORK', deadline: '' });

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
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault(); setError('');
    try {
      await createPersonalTask({ ...form, deadline: form.deadline ? new Date(form.deadline).toISOString() : null });
      setShowCreate(false);
      setForm({ title: '', description: '', priority: 'MEDIUM', category: 'WORK', deadline: '' });
      fetchTasks();
    } catch (err) { setError(err.response?.data?.message || 'Failed to create task.'); }
  };

  const handleStatus = async (taskId, status) => {
    try { await updateTaskStatus(taskId, status); fetchTasks(); } catch (err) { console.error(err); }
  };

  const handleDelete = async (taskId) => {
    try { await deleteTask(taskId); fetchTasks(); } catch (err) { console.error(err); }
  };

  const priorityColor = { LOW: '#22c55e', MEDIUM: '#f5c518', HIGH: '#ef4444' };
  const statusColor   = { PENDING: '#a0a0a0', IN_PROGRESS: '#3b82f6', COMPLETED: '#22c55e' };
  const statusBg      = { PENDING: 'rgba(160,160,160,0.12)', IN_PROGRESS: 'rgba(59,130,246,0.12)', COMPLETED: 'rgba(34,197,94,0.12)' };

  const filtered = tasks.filter(t => {
    if (filterStatus   !== 'ALL' && t.status   !== filterStatus)   return false;
    if (filterPriority !== 'ALL' && t.priority  !== filterPriority) return false;
    if (filterCategory !== 'ALL' && t.category  !== filterCategory) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const activeFilters = [filterStatus, filterPriority, filterCategory].filter(f => f !== 'ALL').length;

  return (
    <div className="animate-fadeSlideUp">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800 }}>Tasks</h1>
          <p style={{ color: '#a0a0a0', marginTop: '2px', fontSize: '14px' }}>Manage and track your tasks</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>+ Add Task</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[{ key: 'ALL', label: 'All Tasks' }, { key: 'MYNEST', label: '🪺 MyNest' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '7px 18px', borderRadius: '999px', fontSize: '13px', fontWeight: 600,
            background: tab === t.key ? '#f5c518' : '#222',
            color: tab === t.key ? '#000' : '#a0a0a0',
            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Search + Filter bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#555' }}
            width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input className="input" placeholder="Search tasks..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
        </div>

        <button onClick={() => setShowFilters(!showFilters)} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '9px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
          background: showFilters ? 'rgba(245,197,24,0.15)' : '#222',
          color: showFilters ? '#f5c518' : '#a0a0a0',
          border: showFilters ? '1px solid rgba(245,197,24,0.4)' : '1px solid #333',
          cursor: 'pointer',
        }}>
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round">
            <path d="M3 4h18M7 8h10M10 12h4" />
          </svg>
          Filters
          {activeFilters > 0 && (
            <span style={{ background: '#f5c518', color: '#000', borderRadius: '999px', width: '18px', height: '18px', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {activeFilters}
            </span>
          )}
        </button>

        {activeFilters > 0 && (
          <button onClick={() => { setFilterStatus('ALL'); setFilterPriority('ALL'); setFilterCategory('ALL'); }}
            style={{ padding: '9px 14px', borderRadius: '10px', fontSize: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer' }}>
            Clear
          </button>
        )}
      </div>

      {/* Filter dropdowns */}
      {showFilters && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', padding: '16px', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
          {[
            { label: 'Status',   value: filterStatus,   setter: setFilterStatus,   options: STATUSES },
            { label: 'Priority', value: filterPriority, setter: setFilterPriority, options: PRIORITIES },
            { label: 'Category', value: filterCategory, setter: setFilterCategory, options: CATEGORIES },
          ].map(f => (
            <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ color: '#a0a0a0', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.label}</label>
              <select className="input" value={f.value} onChange={e => f.setter(e.target.value)}
                style={{ padding: '7px 12px', fontSize: '13px', minWidth: '130px' }}>
                {f.options.map(o => <option key={o} value={o}>{o === 'ALL' ? `All ${f.label}s` : o.replace('_', ' ')}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      {!loading && <div style={{ fontSize: '13px', color: '#555', marginBottom: '12px' }}>Showing {filtered.length} of {tasks.length} tasks</div>}

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', flexDirection: 'column', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid #f5c518', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          <p style={{ color: '#f5c518', fontWeight: 600 }}>Loading tasks...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '44px', marginBottom: '12px' }}>🪺</div>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: '16px', marginBottom: '6px' }}>
            {tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
          </p>
          <p style={{ color: '#a0a0a0', fontSize: '13px' }}>
            {tasks.length === 0 ? 'Tasks assigned to you will appear here.' : 'Try adjusting your filters.'}
          </p>
        </div>
      ) : (
        /* TABLE layout like reference UI */
        <div style={{ background: '#1a1a1a', borderRadius: '16px', border: '1px solid #2a2a2a', overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 120px',
            padding: '12px 20px', borderBottom: '1px solid #2a2a2a',
            fontSize: '11px', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.6px',
          }}>
            <span>Task</span><span>Priority</span><span>Status</span><span>Category</span><span>Assignee</span><span>Actions</span>
          </div>

          {filtered.map((task, i) => (
            <div key={i}
              style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 120px',
                padding: '14px 20px', borderBottom: i < filtered.length - 1 ? '1px solid #222' : 'none',
                alignItems: 'center', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Title */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{task.title}</span>
                  {task.personal && <span className="badge badge-yellow" style={{ fontSize: '10px' }}>🪺</span>}
                </div>
                {task.deadline && (
                  <span style={{ fontSize: '11px', color: '#555', marginTop: '2px', display: 'block' }}>
                    ⏰ {new Date(task.deadline).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Priority badge */}
              <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: `${priorityColor[task.priority]}20`, color: priorityColor[task.priority], width: 'fit-content' }}>
                {task.priority}
              </span>

              {/* Status badge */}
              <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: statusBg[task.status], color: statusColor[task.status], width: 'fit-content' }}>
                {task.status.replace('_', ' ')}
              </span>

              {/* Category */}
              <span style={{ fontSize: '12px', color: '#a0a0a0' }}>{task.category}</span>

              {/* Assignee — "Unassigned" instead of "Unclaimed" */}
              <span style={{ fontSize: '12px', color: task.assignedTo ? '#fff' : '#555', fontStyle: task.assignedTo ? 'normal' : 'italic' }}>
                {task.assignedToName || task.assignedTo || 'Unassigned'}
              </span>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {task.status === 'PENDING' && (
                  <button className="btn-outline" style={{ fontSize: '11px', padding: '5px 10px' }}
                    onClick={() => handleStatus(task.id, 'IN_PROGRESS')}>Start</button>
                )}
                {task.status === 'IN_PROGRESS' && (
                  <button className="btn-primary" style={{ fontSize: '11px', padding: '5px 10px' }}
                    onClick={() => handleStatus(task.id, 'COMPLETED')}>Done ✓</button>
                )}
                {(task.personal || task.assignedById === user?.id) && (
                  <button onClick={() => handleDelete(task.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '8px', padding: '5px 8px', fontSize: '12px', cursor: 'pointer' }}>
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' }}>
          <div className="animate-fadeSlideUp" style={{ background: '#1a1a1a', borderRadius: '20px', border: '1px solid #2a2a2a', width: '100%', maxWidth: '440px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 26px 16px', borderBottom: '1px solid #2a2a2a' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>🪺 Add to MyNest</h2>
              <button onClick={() => { setShowCreate(false); setError(''); }} style={{ background: '#222', border: '1px solid #333', color: '#a0a0a0', fontSize: '16px', cursor: 'pointer', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', padding: '20px 26px', flex: 1 }}>
              {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '8px', padding: '10px', color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}
              <form id="nestForm" onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Title *</label>
                  <input className="input" placeholder="What needs to be done?" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
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
                      {['GROCERIES','HOME','SCHOOL','PERSONAL','WORK','OTHER'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Deadline</label>
                  <input className="input" type="datetime-local" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
                </div>
              </form>
            </div>
            <div style={{ padding: '14px 26px 22px', borderTop: '1px solid #2a2a2a' }}>
              <button form="nestForm" className="btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }}>🪺 Add to Nest</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}