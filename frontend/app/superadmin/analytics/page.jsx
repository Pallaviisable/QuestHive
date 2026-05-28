'use client';
import { useEffect, useState } from 'react';
import { getPlatformAnalytics } from '@/lib/api';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlatformAnalytics().then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', flexDirection: 'column', gap: '12px' }}>
      <div style={{ fontSize: '36px' }}>🐝</div>
      <p style={{ color: '#f5c518' }}>Loading analytics...</p>
    </div>
  );

  if (!data) return <p style={{ color: '#ef4444', padding: '40px' }}>Failed to load analytics.</p>;

  const statCards = [
    { label: 'Total Users', value: data.totalUsers, icon: '👥', color: '#f5c518' },
    { label: 'Active Users', value: data.activeUsers, icon: '✅', color: '#22c55e' },
    { label: 'New This Week', value: data.newUsersThisWeek, icon: '🆕', color: '#3b82f6' },
    { label: 'Deactivated', value: data.deactivatedUsers, icon: '🚫', color: '#ef4444' },
    { label: 'Total Tasks', value: data.totalTasks, icon: '📋', color: '#f5c518' },
    { label: 'Completed', value: data.completedTasks, icon: '✅', color: '#22c55e' },
    { label: 'Denied', value: data.deniedTasks, icon: '❌', color: '#ef4444' },
    { label: 'Overdue', value: data.overdueTasks, icon: '⏰', color: '#f97316' },
    { label: 'Completion Rate', value: String(data.completionRatePercent) + '%', icon: '📊', color: '#a855f7' },
    { label: 'Tasks This Week', value: data.tasksCreatedThisWeek, icon: '📅', color: '#3b82f6' },
  ];

  const maxDaily = Math.max(...(data.dailyActivity || []).map(d => d.completed), 1);

  return (
    <div style={{ padding: '0 0 40px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800 }}>📊 Platform Analytics</h1>
        <p style={{ color: '#a0a0a0', marginTop: '4px' }}>Real-time usage stats across all users and groups.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '32px' }}>
        {statCards.map((s, i) => (
          <div key={i} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '14px', padding: '18px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>{s.icon}</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: '#555', marginTop: '4px', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

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
                  height: String(Math.max((d.completed / maxDaily) * 100, d.completed > 0 ? 8 : 4)) + '%',
                }} />
                <span style={{ fontSize: '9px', color: '#444' }}>{d.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>🏆 Top Active Users</h2>
          {(data.topActiveUsers || []).length === 0 && <p style={{ color: '#555', fontSize: '13px' }}>No data yet.</p>}
          {(data.topActiveUsers || []).map((u, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: i < data.topActiveUsers.length - 1 ? '1px solid #2a2a2a' : 'none' }}>
              <span style={{ fontSize: '16px' }}>{['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</span>
              <span style={{ flex: 1, fontSize: '13px', fontWeight: 600 }}>{u.name || u.userId}</span>
              <span style={{ color: '#22c55e', fontSize: '13px', fontWeight: 700 }}>{u.completedTasks} ✅</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>📂 By Category</h2>
          {Object.entries(data.categoryBreakdown || {}).map(([cat, count], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1f1f1f', fontSize: '12px' }}>
              <span style={{ color: '#a0a0a0' }}>{cat}</span>
              <span style={{ color: '#f5c518', fontWeight: 700 }}>{count}</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>⚡ By Priority</h2>
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

        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>📉 Drop-off Points</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#ef4444' }}>{data.dropOff && data.dropOff.usersWithNoTasksAssigned}</div>
              <div style={{ fontSize: '11px', color: '#a0a0a0', marginTop: '4px' }}>Users with no tasks assigned</div>
            </div>
            <div style={{ background: 'rgba(245,197,24,0.1)', border: '1px solid rgba(245,197,24,0.3)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#f5c518' }}>{data.dropOff && data.dropOff.usersWithZeroCompletions}</div>
              <div style={{ fontSize: '11px', color: '#a0a0a0', marginTop: '4px' }}>Users with zero completions</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
