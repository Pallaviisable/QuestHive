'use client';
import { useEffect, useState } from 'react';
import { getMyTasks, getMyPersonalTasks, createPersonalTask, updateTaskStatus, deleteTask } from '@/lib/api';

const STATUSES   = ['ALL','PENDING','IN_PROGRESS','COMPLETED'];
const PRIORITIES = ['ALL','LOW','MEDIUM','HIGH'];
const CATEGORIES = ['ALL','GROCERIES','HOME','SCHOOL','PERSONAL','WORK','OTHER'];

const PRIORITY_COLOR = { LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#ef4444' };
const STATUS_COLOR   = { PENDING: '#6b7280', IN_PROGRESS: '#3b82f6', COMPLETED: '#22c55e' };
const STATUS_BG      = { PENDING: 'rgba(107,114,128,0.12)', IN_PROGRESS: 'rgba(59,130,246,0.12)', COMPLETED: 'rgba(34,197,94,0.12)' };

export default function TasksPage() {
  const [tasks,          setTasks]          = useState([]);
  const [tab,            setTab]            = useState('ALL');
  const [showCreate,     setShowCreate]     = useState(false);
  const [loading,        setLoading]        = useState(true);
  const [user,           setUser]           = useState(null);
  const [error,          setError]          = useState('');
  const [search,         setSearch]         = useState('');
  const [showFilters,    setShowFilters]    = useState(false);
  const [filterStatus,   setFilterStatus]   = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [form, setForm] = useState({ title:'', description:'', priority:'MEDIUM', category:'WORK', deadline:'' });

  useEffect(() => {
    const s = localStorage.getItem('user');
    if (s) setUser(JSON.parse(s));
    fetchTasks();
  }, [tab]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = tab === 'MYNEST' ? await getMyPersonalTasks() : await getMyTasks();
      setTasks(res.data);
    } catch(e){ console.error(e); } finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault(); setError('');
    try {
      await createPersonalTask({ ...form, deadline: form.deadline ? new Date(form.deadline).toISOString() : null });
      setShowCreate(false);
      setForm({ title:'', description:'', priority:'MEDIUM', category:'WORK', deadline:'' });
      fetchTasks();
    } catch(err){ setError(err.response?.data?.message || 'Failed to create task.'); }
  };

  const handleStatus = async (id, status) => {
    try { await updateTaskStatus(id, status); fetchTasks(); } catch(e){ console.error(e); }
  };

  const handleDelete = async (id) => {
    try { await deleteTask(id); fetchTasks(); } catch(e){ console.error(e); }
  };

  const filtered = tasks.filter(t => {
    if (filterStatus   !== 'ALL' && t.status   !== filterStatus)   return false;
    if (filterPriority !== 'ALL' && t.priority  !== filterPriority) return false;
    if (filterCategory !== 'ALL' && t.category  !== filterCategory) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const activeFilters = [filterStatus, filterPriority, filterCategory].filter(f => f !== 'ALL').length;

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .task-row { transition: background 0.15s; }
        .task-row:hover { background: rgba(255,255,255,0.025) !important; }
      `}</style>

      <div style={{ animation: 'fadeUp 0.4s cubic-bezier(0.16,1,0.3,1)' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px', flexWrap:'wrap', gap:'12px' }}>
          <div>
            <h1 style={{ fontSize:'22px', fontWeight:800, color:'var(--text-primary)', letterSpacing:'-0.3px', marginBottom:'3px' }}>Tasks</h1>
            <p style={{ fontSize:'13px', color:'var(--text-muted)', margin:0 }}>Manage and track your tasks</p>
          </div>
          <button onClick={() => setShowCreate(true)} style={{
            background:'var(--accent)', color:'#000', border:'none', borderRadius:'10px',
            padding:'9px 18px', fontSize:'13px', fontWeight:700, cursor:'pointer',
            display:'flex', alignItems:'center', gap:'6px',
            boxShadow:'0 4px 16px rgba(245,197,24,0.25)',
          }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Task
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'4px', marginBottom:'20px', background:'var(--bg-elevated)', borderRadius:'10px', padding:'4px', width:'fit-content', border:'1px solid var(--border)' }}>
          {[{ key:'ALL', label:'All Tasks' }, { key:'MYNEST', label:'MyNest' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding:'7px 18px', borderRadius:'7px', fontSize:'13px', fontWeight:600,
              background: tab === t.key ? 'var(--bg-card)' : 'transparent',
              color: tab === t.key ? 'var(--text-primary)' : 'var(--text-muted)',
              border: tab === t.key ? '1px solid var(--border)' : '1px solid transparent',
              cursor:'pointer', transition:'all 0.2s',
              boxShadow: tab === t.key ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Search + Filter */}
        <div style={{ display:'flex', gap:'10px', marginBottom:'12px', flexWrap:'wrap' }}>
          <div style={{ position:'relative', flex:1, minWidth:'200px' }}>
            <svg style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}
              width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
            </svg>
            <input className="input" placeholder="Search tasks..." value={search}
              onChange={e => setSearch(e.target.value)} style={{ paddingLeft:'36px' }} />
          </div>

          <button onClick={() => setShowFilters(!showFilters)} style={{
            display:'flex', alignItems:'center', gap:'6px',
            padding:'9px 16px', borderRadius:'10px', fontSize:'13px', fontWeight:600,
            background: showFilters ? 'rgba(245,197,24,0.1)' : 'var(--bg-elevated)',
            color: showFilters ? 'var(--accent)' : 'var(--text-muted)',
            border: showFilters ? '1px solid rgba(245,197,24,0.3)' : '1px solid var(--border)',
            cursor:'pointer', transition:'all 0.2s',
          }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round">
              <path d="M3 4h18M7 8h10M10 12h4"/>
            </svg>
            Filters
            {activeFilters > 0 && (
              <span style={{ background:'var(--accent)', color:'#000', borderRadius:'999px', width:'17px', height:'17px', fontSize:'10px', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {activeFilters}
              </span>
            )}
          </button>

          {activeFilters > 0 && (
            <button onClick={() => { setFilterStatus('ALL'); setFilterPriority('ALL'); setFilterCategory('ALL'); }}
              style={{ padding:'9px 14px', borderRadius:'10px', fontSize:'12px', background:'rgba(239,68,68,0.08)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.25)', cursor:'pointer', fontWeight:600 }}>
              Clear
            </button>
          )}
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div style={{ display:'flex', gap:'16px', marginBottom:'16px', flexWrap:'wrap', padding:'16px 20px', background:'var(--bg-card)', borderRadius:'12px', border:'1px solid var(--border)' }}>
            {[
              { label:'Status',   value:filterStatus,   setter:setFilterStatus,   options:STATUSES   },
              { label:'Priority', value:filterPriority, setter:setFilterPriority, options:PRIORITIES },
              { label:'Category', value:filterCategory, setter:setFilterCategory, options:CATEGORIES },
            ].map(f => (
              <div key={f.label}>
                <label style={{ color:'var(--text-muted)', fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.6px', display:'block', marginBottom:'6px' }}>{f.label}</label>
                <select className="input" value={f.value} onChange={e => f.setter(e.target.value)}
                  style={{ padding:'7px 12px', fontSize:'13px', minWidth:'130px' }}>
                  {f.options.map(o => <option key={o} value={o}>{o === 'ALL' ? `All ${f.label}s` : o.replace('_',' ')}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <div style={{ fontSize:'12px', color:'var(--text-muted)', marginBottom:'12px' }}>
            {filtered.length} of {tasks.length} tasks
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'80px', flexDirection:'column', gap:'14px' }}>
            <div style={{ width:'28px', height:'28px', border:'2px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
            <span style={{ fontSize:'13px', color:'var(--text-muted)' }}>Loading tasks...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'64px 20px', background:'var(--bg-card)', borderRadius:'16px', border:'1px solid var(--border)' }}>
            <div style={{ width:'48px', height:'48px', borderRadius:'12px', background:'var(--bg-elevated)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <svg width="22" height="22" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="9" y="3" width="13" height="13" rx="2"/><path d="M5 7H2a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-3"/></svg>
            </div>
            <p style={{ color:'var(--text-primary)', fontWeight:700, fontSize:'15px', marginBottom:'6px' }}>
              {tasks.length === 0 ? 'No tasks yet' : 'No tasks match filters'}
            </p>
            <p style={{ color:'var(--text-muted)', fontSize:'13px' }}>
              {tasks.length === 0 ? 'Tasks assigned to you will appear here.' : 'Try adjusting your filters.'}
            </p>
          </div>
        ) : (
          <div style={{ background:'var(--bg-card)', borderRadius:'14px', border:'1px solid var(--border)', overflow:'hidden' }}>
            {/* Table header */}
            <div style={{
              display:'grid', gridTemplateColumns:'2fr 100px 130px 110px 130px',
              padding:'11px 20px', borderBottom:'1px solid var(--border)',
              fontSize:'10px', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.6px',
              background:'var(--bg-elevated)',
            }}>
              <span>Task</span><span>Priority</span><span>Status</span><span>Category</span><span>Actions</span>
            </div>

            {filtered.map((task, i) => {
              const isOverdue = task.status !== 'COMPLETED' && task.deadline && new Date(task.deadline) < new Date();
              return (
                <div key={i} className="task-row" style={{
                  display:'grid', gridTemplateColumns:'2fr 100px 130px 110px 130px',
                  padding:'13px 20px', borderBottom: i < filtered.length-1 ? '1px solid var(--border)' : 'none',
                  alignItems:'center',
                }}>
                  {/* Title */}
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <div style={{ width:'7px', height:'7px', borderRadius:'50%', flexShrink:0, background: isOverdue ? '#ef4444' : STATUS_COLOR[task.status], boxShadow:`0 0 5px ${isOverdue ? '#ef4444' : STATUS_COLOR[task.status]}60` }} />
                      <span style={{ fontSize:'13px', fontWeight:600, color:'var(--text-primary)' }}>{task.title}</span>
                      {task.personal && <span style={{ fontSize:'9px', fontWeight:700, color:'#22c55e', background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:'999px', padding:'1px 6px' }}>NEST</span>}
                    </div>
                    {task.deadline && (
                      <span style={{ fontSize:'11px', color: isOverdue ? '#ef4444' : 'var(--text-muted)', marginTop:'3px', display:'block', paddingLeft:'15px' }}>
                        {isOverdue ? 'Overdue · ' : ''}{new Date(task.deadline).toLocaleDateString('en-US', { month:'short', day:'numeric' })}
                      </span>
                    )}
                  </div>

                  {/* Priority */}
                  <span style={{
                    display:'inline-flex', padding:'3px 10px', borderRadius:'999px',
                    fontSize:'10px', fontWeight:700, width:'fit-content',
                    background:`${PRIORITY_COLOR[task.priority]}15`,
                    color: PRIORITY_COLOR[task.priority],
                    border:`1px solid ${PRIORITY_COLOR[task.priority]}30`,
                  }}>{task.priority}</span>

                  {/* Status */}
                  <span style={{
                    display:'inline-flex', padding:'3px 10px', borderRadius:'999px',
                    fontSize:'10px', fontWeight:700, width:'fit-content',
                    background: STATUS_BG[task.status], color: STATUS_COLOR[task.status],
                    border:`1px solid ${STATUS_COLOR[task.status]}30`,
                  }}>{task.status.replace('_',' ')}</span>

                  {/* Category */}
                  <span style={{ fontSize:'12px', color:'var(--text-muted)', fontWeight:500 }}>{task.category}</span>

                  {/* Actions */}
                  <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                    {task.status === 'PENDING' && (
                      <button onClick={() => handleStatus(task.id, 'IN_PROGRESS')} style={{
                        fontSize:'11px', padding:'5px 12px', borderRadius:'7px', fontWeight:600, cursor:'pointer',
                        background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.25)', color:'#3b82f6',
                        transition:'all 0.15s',
                      }}>Start</button>
                    )}
                    {task.status === 'IN_PROGRESS' && (
                      <button onClick={() => handleStatus(task.id, 'COMPLETED')} style={{
                        fontSize:'11px', padding:'5px 12px', borderRadius:'7px', fontWeight:700, cursor:'pointer',
                        background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.25)', color:'#22c55e',
                        transition:'all 0.15s',
                      }}>Done</button>
                    )}
                    {(task.personal || task.assignedById === user?.id) && (
                      <button onClick={() => handleDelete(task.id)} style={{
                        background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)',
                        color:'#ef4444', borderRadius:'7px', padding:'5px 8px', fontSize:'12px', cursor:'pointer',
                        display:'flex', alignItems:'center',
                      }}>
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreate && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(6px)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:200, padding:'80px 16px 16px', overflowY:'auto' }}>
          <div style={{ background:'var(--bg-card)', borderRadius:'18px', border:'1px solid var(--border-hover)', width:'100%', maxWidth:'440px', boxShadow:'0 24px 80px rgba(0,0,0,0.6)', animation:'fadeUp 0.25s ease' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 24px', borderBottom:'1px solid var(--border)' }}>
              <div>
                <h2 style={{ fontSize:'16px', fontWeight:700, color:'var(--text-primary)', margin:0 }}>Add to MyNest</h2>
                <p style={{ fontSize:'12px', color:'var(--text-muted)', margin:'2px 0 0' }}>Private personal task</p>
              </div>
              <button onClick={() => { setShowCreate(false); setError(''); }} style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', color:'var(--text-muted)', borderRadius:'7px', width:'30px', height:'30px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px' }}>✕</button>
            </div>

            <form id="nestForm" onSubmit={handleCreate} style={{ padding:'22px 24px', display:'flex', flexDirection:'column', gap:'16px' }}>
              {error && (
                <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'8px', padding:'10px 14px', color:'#ef4444', fontSize:'13px' }}>{error}</div>
              )}

              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:700, color:'var(--text-muted)', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.4px' }}>Title *</label>
                <input className="input" placeholder="What needs to be done?" value={form.title} onChange={e => setForm({...form, title:e.target.value})} required autoFocus />
              </div>

              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:700, color:'var(--text-muted)', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.4px' }}>Description</label>
                <input className="input" placeholder="Optional details..." value={form.description} onChange={e => setForm({...form, description:e.target.value})} />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div>
                  <label style={{ display:'block', fontSize:'11px', fontWeight:700, color:'var(--text-muted)', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.4px' }}>Priority</label>
                  <select className="input" value={form.priority} onChange={e => setForm({...form, priority:e.target.value})}>
                    {['LOW','MEDIUM','HIGH'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'11px', fontWeight:700, color:'var(--text-muted)', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.4px' }}>Category</label>
                  <select className="input" value={form.category} onChange={e => setForm({...form, category:e.target.value})}>
                    {['GROCERIES','HOME','SCHOOL','PERSONAL','WORK','OTHER'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:700, color:'var(--text-muted)', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.4px' }}>Deadline</label>
                <input className="input" type="datetime-local" value={form.deadline} onChange={e => setForm({...form, deadline:e.target.value})} />
              </div>
            </form>

            <div style={{ padding:'0 24px 22px', display:'flex', gap:'10px' }}>
              <button onClick={() => { setShowCreate(false); setError(''); }} style={{ flex:1, background:'none', border:'1px solid var(--border)', color:'var(--text-muted)', borderRadius:'10px', padding:'11px', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>Cancel</button>
              <button form="nestForm" type="submit" style={{ flex:2, background:'var(--accent)', color:'#000', border:'none', borderRadius:'10px', padding:'11px', fontSize:'14px', fontWeight:700, cursor:'pointer' }}>Add to Nest</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
