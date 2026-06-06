'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getPlatformAnalytics } from '@/lib/api';

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'SUPER_ADMIN') { router.push('/dashboard'); return; }
    getPlatformAnalytics().then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', flexDirection: 'column', gap: '12px' }}>
      <div style={{ fontSize: '36px' }}>🐝</div>
      <p style={{ color: '#f5c518' }}>Loading analytics...</p>
    </div>
  );

  if (!data) return <p style={{ color: '#ef4444', padding: '40px' }}>Failed to load analytics.</p>;

  const maxDaily = Math.max(...(data.dailyActivity || []).map(d => d.completed), 1);

  // The 5 required superadmin metrics
  const metrics = [
    {
      title: 'Groups Created vs Deleted',
      icon: '🏠',
      color: '#818cf8',
      items: [
        { label: 'Total Created', value: data.totalGroups ?? '—', color: '#34d399' },
        { label: 'Deleted This Month', value: data.groupsDeletedThisMonth ?? '—', color: '#f87171' },
        { label: 'Active Groups', value: data.activeGroups ?? '—', color: '#f5c518' },
      ],
    },
    {
      title: 'Member Retention (Week over Week)',
      icon: '📈',
      color: '#34d399',
      items: [
        { label: 'Active This Week', value: data.activeUsersThisWeek ?? '—', color: '#34d399' },
        { label: 'Active Last Week', value: data.activeUsersLastWeek ?? '—', color: '#818cf8' },
        { label: 'Retention Rate', value: data.retentionRatePercent != null ? data.retentionRatePercent + '%' : '—', color: '#f5c518' },
      ],
    },
    {
      title: 'Most Used Features',
      icon: '⚡',
      color: '#f5c518',
      items: [
        { label: 'Tasks Created', value: data.totalTasks ?? '—', color: '#f5c518' },
        { label: 'Tasks Completed', value: data.completedTasks ?? '—', color: '#34d399' },
        { label: 'Rewards Redeemed', value: data.totalRedemptions ?? '—', color: '#818cf8' },
        { label: 'Chat Messages', value: data.totalMessages ?? '—', color: '#fbbf24' },
      ],
    },
    {
      title: 'Admin Activity Levels',
      icon: '👑',
      color: '#fbbf24',
      items: [
        { label: 'Total Admins', value: data.totalAdmins ?? '—', color: '#fbbf24' },
        { label: 'Admins Active This Week', value: data.activeAdminsThisWeek ?? '—', color: '#34d399' },
        { label: 'Tasks Assigned This Week', value: data.tasksCreatedThisWeek ?? '—', color: '#818cf8' },
      ],
    },
    {
      title: 'Churn Signals',
      icon: '⚠️',
      color: '#f87171',
      items: [
        { label: 'Inactive Groups (15+ days)', value: data.inactiveGroups ?? '—', color: '#f87171' },
        { label: 'Users Not Logged In (7+ days)', value: data.dormantUsers ?? '—', color: '#fbbf24' },
        { label: 'Deactivated Accounts', value: data.deactivatedUsers ?? '—', color: '#f87171' },
        { label: 'Zero Completions Ever', value: data.dropOff?.usersWithZeroCompletions ?? '—', color: '#888' },
      ],
    },
  ];

  return (
    <div style={{ padding: '0 0 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <button onClick={() => router.push('/superadmin')}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', borderRadius: '8px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer' }}>
              ← Console
            </button>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800 }}>📊 Platform Analytics</h1>
          <p style={{ color: '#a0a0a0', marginTop: '4px' }}>Real-time usage stats across all users and groups.</p>
        </div>
      </div>

      {/* Quick stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', marginBottom: '36px' }}>
        {[
          { label: 'Total Users', value: data.totalUsers, icon: '👥', color: '#f5c518' },
          { label: 'Active Users', value: data.activeUsers, icon: '✅', color: '#22c55e' },
          { label: 'New This Week', value: data.newUsersThisWeek, icon: '🆕', color: '#3b82f6' },
          { label: 'Total Tasks', value: data.totalTasks, icon: '📋', color: '#f5c518' },
          { label: 'Completion Rate', value: (data.completionRatePercent ?? 0) + '%', icon: '📊', color: '#a855f7' },
          { label: 'Overdue Tasks', value: data.overdueTasks, icon: '⏰', color: '#f97316' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '14px', padding: '18px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', marginBottom: '6px' }}>{s.icon}</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: s.color }}>{s.value ?? '—'}</div>
            <div style={{ fontSize: '11px', color: '#555', marginTop: '4px', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* 5 Core Metrics */}
      <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#a0a0a0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Core Metrics</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginBottom: '36px' }}>
        {metrics.map((metric, i) => (
          <div key={i} style={{ background: '#1a1a1a', border: `1px solid ${metric.color}33`, borderRadius: '16px', padding: '22px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${metric.color}, transparent)` }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '20px' }}>{metric.icon}</span>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{metric.title}</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {metric.items.map((item, j) => (
                <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#666' }}>{item.label}</span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Daily Completions Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>📅 Daily Completions (7 days)</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px' }}>
            {(data.dailyActivity || []).map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '11px', color: '#f5c518', fontWeight: 700 }}>{d.completed}</span>
                <div style={{
                  width: '100%', borderRadius: '6px 6px 0 0',
                  background: d.completed > 0 ? 'linear-gradient(180deg,#f5c518,#f59e0b)' : '#222',
                  height: `${Math.max((d.completed / maxDaily) * 100, d.completed > 0 ? 8 : 4)}%`,
                }} />
                <span style={{ fontSize: '9px', color: '#444' }}>{d.date?.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>🏆 Top Active Users</h2>
          {(data.topActiveUsers || []).length === 0 && <p style={{ color: '#555', fontSize: '13px' }}>No data yet.</p>}
          {(data.topActiveUsers || []).map((u, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: i < (data.topActiveUsers.length - 1) ? '1px solid #2a2a2a' : 'none' }}>
              <span style={{ fontSize: '16px' }}>{['🥇','🥈','🥉','4️⃣','5️⃣'][i] || '•'}</span>
              <span style={{ flex: 1, fontSize: '13px', fontWeight: 600 }}>{u.name || u.userId}</span>
              <span style={{ color: '#22c55e', fontSize: '13px', fontWeight: 700 }}>{u.completedTasks} ✅</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category + Priority breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>📂 Tasks by Category</h2>
          {Object.entries(data.categoryBreakdown || {}).map(([cat, count], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1f1f1f', fontSize: '12px' }}>
              <span style={{ color: '#a0a0a0' }}>{cat}</span>
              <span style={{ color: '#f5c518', fontWeight: 700 }}>{count}</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>⚡ Tasks by Priority</h2>
          {Object.entries(data.priorityBreakdown || {}).map(([pri, count], i) => {
            const color = pri === 'HIGH' ? '#ef4444' : pri === 'MEDIUM' ? '#f5c518' : '#22c55e';
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1f1f1f', fontSize: '12px' }}>
                <span style={{ color }}>{pri}</span>
                <span style={{ color, fontWeight: 700 }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
