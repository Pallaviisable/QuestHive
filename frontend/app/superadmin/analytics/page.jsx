'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getPlatformAnalytics } from '@/lib/api';

const Pill = ({ label, value, color }) => (
  <div style={{
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '16px 20px',
    display: 'flex', flexDirection: 'column', gap: '6px',
  }}>
    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
    <span style={{ fontSize: '24px', fontWeight: 800, color: color || 'var(--text-primary)', letterSpacing: '-0.5px' }}>{value ?? '—'}</span>
  </div>
);

const MetricCard = ({ title, accent, rows }) => (
  <div style={{
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: '12px', overflow: 'hidden',
  }}>
    <div style={{
      padding: '14px 20px', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', gap: '10px',
    }}>
      <div style={{ width: '3px', height: '16px', background: accent, borderRadius: '2px', flexShrink: 0 }} />
      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</span>
    </div>
    <div style={{ padding: '6px 0' }}>
      {rows.map((row, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 20px',
          borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none',
        }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{row.label}</span>
          <span style={{ fontSize: '15px', fontWeight: 700, color: row.color || 'var(--text-primary)' }}>{row.value ?? '—'}</span>
        </div>
      ))}
    </div>
  </div>
);

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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '32px', height: '32px', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading analytics...</span>
    </div>
  );

  if (!data) return (
    <div style={{ padding: '40px', color: 'var(--danger)', fontSize: '14px' }}>Failed to load analytics data.</div>
  );

  const maxDaily = Math.max(...(data.dailyActivity || []).map(d => d.completed), 1);

  return (
    <div style={{ maxWidth: '1200px', padding: '0 0 60px' }}>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => router.push('/superadmin')} style={{
            background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)',
            borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Console
          </button>
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px', letterSpacing: '-0.3px' }}>Platform Analytics</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Live usage metrics across all users, groups, and tasks.</p>
      </div>

      {/* Top KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginBottom: '28px' }}>
        <Pill label="Total Users"     value={data.totalUsers}            color="var(--text-primary)" />
        <Pill label="Active"          value={data.activeUsers}           color="var(--success)" />
        <Pill label="New This Week"   value={data.newUsersThisWeek}      color="var(--info)" />
        <Pill label="Total Tasks"     value={data.totalTasks}            color="var(--text-primary)" />
        <Pill label="Completion"      value={(data.completionRatePercent ?? 0) + '%'} color="var(--accent)" />
        <Pill label="Overdue"         value={data.overdueTasks}          color="var(--danger)" />
      </div>

      {/* 5 Core Metric Cards */}
      <div style={{ marginBottom: '10px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Core Metrics</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px' }}>
        <MetricCard
          title="Groups"
          accent="var(--info)"
          rows={[
            { label: 'Total Created',        value: data.totalGroups,            color: 'var(--text-primary)' },
            { label: 'Active (last 15 days)', value: data.activeGroups,          color: 'var(--success)' },
            { label: 'Inactive',             value: data.inactiveGroups,         color: 'var(--warning)' },
            { label: 'Deleted This Month',   value: data.groupsDeletedThisMonth, color: 'var(--danger)' },
          ]}
        />
        <MetricCard
          title="Member Retention (WoW)"
          accent="var(--success)"
          rows={[
            { label: 'Active This Week',  value: data.activeUsersThisWeek,  color: 'var(--text-primary)' },
            { label: 'Active Last Week',  value: data.activeUsersLastWeek,  color: 'var(--text-secondary)' },
            { label: 'Retention Rate',    value: (data.retentionRatePercent ?? 0) + '%', color: data.retentionRatePercent > 60 ? 'var(--success)' : 'var(--warning)' },
            { label: 'Dormant Users',     value: data.dormantUsers,         color: 'var(--warning)' },
          ]}
        />
        <MetricCard
          title="Feature Usage"
          accent="var(--accent)"
          rows={[
            { label: 'Tasks Created',      value: data.totalTasks,       color: 'var(--text-primary)' },
            { label: 'Tasks Completed',    value: data.completedTasks,   color: 'var(--success)' },
            { label: 'Rewards Redeemed',   value: data.totalRedemptions, color: 'var(--accent)' },
            { label: 'Chat Messages',      value: data.totalMessages,    color: 'var(--text-secondary)' },
          ]}
        />
        <MetricCard
          title="Admin Activity"
          accent="var(--warning)"
          rows={[
            { label: 'Total Admins',           value: data.totalAdmins,           color: 'var(--text-primary)' },
            { label: 'Active This Week',        value: data.activeAdminsThisWeek,  color: 'var(--success)' },
            { label: 'Tasks Assigned (7 days)', value: data.tasksCreatedThisWeek,  color: 'var(--text-secondary)' },
          ]}
        />
        <MetricCard
          title="Churn Signals"
          accent="var(--danger)"
          rows={[
            { label: 'Inactive Groups',       value: data.inactiveGroups,                          color: 'var(--danger)' },
            { label: 'Dormant Users (7d)',     value: data.dormantUsers,                            color: 'var(--warning)' },
            { label: 'Deactivated Accounts',  value: data.deactivatedUsers,                        color: 'var(--danger)' },
            { label: 'Zero Completions Ever', value: data.dropOff?.usersWithZeroCompletions,       color: 'var(--text-muted)' },
          ]}
        />
        <MetricCard
          title="Task Health"
          accent="var(--purple)"
          rows={[
            { label: 'Completed',  value: data.completedTasks,  color: 'var(--success)' },
            { label: 'Denied',     value: data.deniedTasks,     color: 'var(--danger)' },
            { label: 'Overdue',    value: data.overdueTasks,    color: 'var(--warning)' },
            { label: 'This Week',  value: data.tasksCreatedThisWeek, color: 'var(--text-secondary)' },
          ]}
        />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>

        {/* Bar chart */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Daily Completions</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>last 7 days</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '100px' }}>
            {(data.dailyActivity || []).map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: d.completed > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>{d.completed || ''}</span>
                <div style={{
                  width: '100%', borderRadius: '4px 4px 0 0',
                  background: d.completed > 0 ? 'var(--accent)' : 'var(--bg-elevated)',
                  height: `${Math.max((d.completed / maxDaily) * 80, d.completed > 0 ? 6 : 4)}px`,
                  minHeight: '4px',
                  opacity: d.completed > 0 ? 1 : 0.4,
                  transition: 'height 0.3s ease',
                }} />
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{d.date?.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top users */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Top Performers</span>
          </div>
          {(data.topActiveUsers || []).length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No data yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {(data.topActiveUsers || []).map((u, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '8px 12px', borderRadius: '8px',
                  background: i === 0 ? 'rgba(245,197,24,0.06)' : 'transparent',
                }}>
                  <span style={{
                    width: '22px', height: '22px', borderRadius: '6px',
                    background: i === 0 ? 'var(--accent)' : 'var(--bg-elevated)',
                    color: i === 0 ? '#000' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 800, flexShrink: 0,
                  }}>{i + 1}</span>
                  <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{u.name || u.userId}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>{u.completedTasks} tasks</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
