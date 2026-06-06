'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getMyTasks, getMyGroups, getMyCoins, getMyXP, getGroupHealth } from '@/lib/api';
import OnboardingTour from '@/components/OnboardingTour';

const FRAME_CONFIG = {
  LEGENDARY: { color: '#f5c518', label: 'Legendary' },
  CHAMPION:  { color: '#a855f7', label: 'Champion'  },
  ELITE:     { color: '#3b82f6', label: 'Elite'     },
  VETERAN:   { color: '#22c55e', label: 'Veteran'   },
  DEDICATED: { color: '#f97316', label: 'Dedicated' },
  RISING:    { color: '#6b7280', label: 'Rising'    },
};

function GroupHealthMini({ group }) {
  const [health, setHealth] = useState(null);
  useEffect(() => {
    getGroupHealth(group.id).then(r => setHealth(r.data)).catch(() => {});
  }, [group.id]);
  if (!health) return null;
  const color = health.status === 'HEALTHY' ? '#22c55e' : health.status === 'AT_RISK' ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.3px' }}>GROUP HEALTH</span>
        <span style={{ fontSize: '10px', color, fontWeight: 700 }}>{health.healthPercent}%</span>
      </div>
      <div style={{ background: 'var(--bg-elevated)', borderRadius: '999px', height: '4px', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: '999px', background: color, width: `${health.healthPercent}%`, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

const STATUS_COLOR = { PENDING: '#6b7280', IN_PROGRESS: '#3b82f6', COMPLETED: '#22c55e' };
const PRIORITY_COLOR = { LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#ef4444' };

export default function DashboardPage() {
  const [tasks,    setTasks]    = useState([]);
  const [groups,   setGroups]   = useState([]);
  const [coins,    setCoins]    = useState(0);
  const [xp,       setXp]       = useState(null);
  const [user,     setUser]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [showTour, setShowTour] = useState(false);
  const [entered,  setEntered]  = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      if (!u.hasSeenTour) setShowTour(true);
    }
    const wasLogin = localStorage.getItem('loginSuccess');
    if (wasLogin) { localStorage.removeItem('loginSuccess'); setEntered(true); }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, groupsRes, coinsRes, xpRes] = await Promise.all([
        getMyTasks(), getMyGroups(), getMyCoins(), getMyXP()
      ]);
      setTasks(tasksRes.data);
      setGroups(groupsRes.data);
      setCoins(coinsRes.data.coins);
      setXp(xpRes.data);
      localStorage.setItem('coins', coinsRes.data.coins);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const pending    = tasks.filter(t => t.status === 'PENDING').length;
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const completed  = tasks.filter(t => t.status === 'COMPLETED').length;
  const overdue    = tasks.filter(t => t.status !== 'COMPLETED' && t.deadline && new Date(t.deadline) < new Date()).length;

  const frame = xp?.frame && FRAME_CONFIG[xp.frame];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '32px', height: '32px', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading your hive...</span>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmerIn { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:translateX(0); } }
        .dash-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; transition: border-color 0.2s, box-shadow 0.2s; }
        .dash-card:hover { border-color: var(--border-hover); }
        .stat-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 18px 20px; display: flex; flex-direction: column; gap: 6px; transition: all 0.2s; cursor: default; }
        .stat-card:hover { border-color: var(--border-hover); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
        .task-row { display: flex; align-items: center; gap: 12px; padding: 11px 0; border-bottom: 1px solid var(--border); transition: background 0.15s; border-radius: 8px; }
        .task-row:last-child { border-bottom: none; }
      `}</style>

      <div style={{ animation: 'fadeUp 0.4s cubic-bezier(0.16,1,0.3,1)' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px', marginBottom: '4px' }}>
              Welcome back, {user?.fullName?.split(' ')[0] || 'there'}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(245,197,24,0.08)', border: '1px solid rgba(245,197,24,0.2)',
              borderRadius: '10px', padding: '8px 14px',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#f5c518" opacity="0.2"/><circle cx="12" cy="12" r="7" stroke="#f5c518" strokeWidth="1.5"/></svg>
              <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent)' }}>{coins}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>coins</span>
            </div>
          </div>
        </div>

        {/* ── XP Bar ── */}
        {xp && (
          <div style={{ marginBottom: '20px', animation: 'shimmerIn 0.5s ease' }}>
            <div className="dash-card" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              {/* Level badge */}
              <div style={{
                width: '52px', height: '52px', borderRadius: '12px', flexShrink: 0,
                background: `${frame?.color || 'var(--accent)'}15`,
                border: `1.5px solid ${frame?.color || 'var(--accent)'}40`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 16px ${frame?.color || 'var(--accent)'}20`,
              }}>
                <span style={{ fontSize: '10px', color: frame?.color || 'var(--accent)', fontWeight: 700 }}>LVL</span>
                <span style={{ fontSize: '20px', fontWeight: 900, color: frame?.color || 'var(--accent)', lineHeight: 1 }}>{xp.level}</span>
              </div>

              {/* XP details */}
              <div style={{ flex: 1, minWidth: '180px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{xp.title}</span>
                    {frame && (
                      <span style={{
                        fontSize: '10px', fontWeight: 700, letterSpacing: '0.4px',
                        color: frame.color, background: `${frame.color}15`,
                        border: `1px solid ${frame.color}35`,
                        borderRadius: '999px', padding: '2px 8px',
                      }}>{frame.label.toUpperCase()}</span>
                    )}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {xp.xpIntoCurrentLevel} / {xp.xpForNextLevel} XP
                  </span>
                </div>
                <div style={{ background: 'var(--bg-elevated)', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '999px',
                    background: `linear-gradient(90deg, ${frame?.color || '#f5c518'}, ${frame?.color || '#ffdd57'}99)`,
                    width: `${xp.progressPercent}%`,
                    transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
                    boxShadow: `0 0 8px ${frame?.color || 'var(--accent)'}60`,
                  }} />
                </div>
                <div style={{ marginTop: '5px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  {xp.xpForNextLevel - xp.xpIntoCurrentLevel} XP to next level · Total: {xp.totalXp} XP
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Stats Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', marginBottom: '24px' }}>
          {[
            { label: 'Total Tasks',  value: tasks.length, color: 'var(--text-primary)', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="3" width="13" height="13" rx="2"/><path d="M5 7H2a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-3"/></svg> },
            { label: 'Pending',      value: pending,      color: '#f97316',              icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
            { label: 'In Progress',  value: inProgress,   color: '#3b82f6',              icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> },
            { label: 'Completed',    value: completed,    color: '#22c55e',              icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> },
            { label: 'Overdue',      value: overdue,      color: '#ef4444',              icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
            { label: 'My Groups',    value: groups.length,color: '#a855f7',              icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
          ].map((stat, i) => (
            <div key={i} className="stat-card" style={{ animationDelay: `${i * 0.05}s` }}>
              <div style={{ color: stat.color, opacity: 0.7 }}>{stat.icon}</div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: stat.color, letterSpacing: '-0.5px', lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.2px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── Recent Tasks + Groups ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

          {/* Recent Tasks */}
          <div className="dash-card" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Recent Tasks</span>
              <Link href="/tasks" style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                View all <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </div>

            {tasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                No tasks assigned yet
              </div>
            ) : tasks.slice(0, 5).map((task, i) => {
              const isOverdue = task.status !== 'COMPLETED' && task.deadline && new Date(task.deadline) < new Date();
              const sc = STATUS_COLOR[task.status] || '#6b7280';
              return (
                <div key={i} className="task-row">
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: isOverdue ? '#ef4444' : sc,
                    boxShadow: `0 0 6px ${isOverdue ? '#ef4444' : sc}60`,
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '8px' }}>
                      <span style={{ color: PRIORITY_COLOR[task.priority] || 'var(--text-muted)' }}>{task.priority}</span>
                      <span>·</span>
                      <span>{task.category}</span>
                      {task.deadline && <span>· {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>+{task.coinsReward}</span>
                </div>
              );
            })}
          </div>

          {/* My Groups */}
          <div className="dash-card" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>My Groups</span>
              <Link href="/groups" style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                View all <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </div>

            {groups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                No groups yet
              </div>
            ) : groups.slice(0, 4).map((group, i) => (
              <Link key={i} href={`/groups/${group.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 0',
                  borderBottom: i < Math.min(groups.length, 4) - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'opacity 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                    background: 'rgba(245,197,24,0.1)', border: '1px solid rgba(245,197,24,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="16" height="16" fill="none" stroke="var(--accent)" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{group.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{group.memberIds?.length || 0} members</div>
                    <GroupHealthMini group={group} />
                  </div>
                  <svg width="14" height="14" fill="none" stroke="var(--text-muted)" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Quick actions ── */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
          {[
            { label: 'Go to Tasks',      href: '/tasks',   color: 'var(--accent)' },
            { label: 'View Rewards',     href: '/rewards', color: '#22c55e' },
            { label: 'Browse Groups',    href: '/groups',  color: '#3b82f6' },
            { label: 'Account Settings', href: '/settings',color: '#a855f7' },
          ].map((a, i) => (
            <Link key={i} href={a.href} style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                background: `${a.color}10`, border: `1px solid ${a.color}25`,
                color: a.color, display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'all 0.2s', cursor: 'pointer',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = `${a.color}20`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = `${a.color}10`; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {a.label}
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </Link>
          ))}
        </div>

      </div>

      {showTour && (
        <OnboardingTour onComplete={() => {
          setShowTour(false);
          const u = JSON.parse(localStorage.getItem('user') || '{}');
          u.hasSeenTour = true;
          localStorage.setItem('user', JSON.stringify(u));
        }} />
      )}
    </>
  );
}
