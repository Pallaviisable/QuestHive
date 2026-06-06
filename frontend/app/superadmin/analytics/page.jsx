'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getPlatformAnalytics } from '@/lib/api';

/* ── Tooltip ─────────────────────────────────────────────────── */
function Tooltip({ text, x, y, visible }) {
  if (!visible) return null;
  return (
    <g>
      <rect x={x - 28} y={y - 28} width={56} height={20} rx={4}
        fill="#1a1a2e" stroke="#2e2e42" strokeWidth={1} />
      <text x={x} y={y - 14} textAnchor="middle" fill="#f5c518"
        fontSize={11} fontWeight={700}>{text}</text>
    </g>
  );
}

/* ── Bar Chart ───────────────────────────────────────────────── */
function BarChart({ data, width = 500, height = 160 }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(...data.map(d => d.value), 1);
  const padL = 32, padB = 28, padT = 24, padR = 12;
  const W = width - padL - padR;
  const H = height - padB - padT;
  const barW = Math.floor(W / data.length * 0.55);
  const gap = W / data.length;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
        const y = padT + H - f * H;
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={padL + W} y2={y}
              stroke="#1e1e2e" strokeWidth={1} />
            <text x={padL - 6} y={y + 4} textAnchor="end"
              fill="#44445a" fontSize={9}>{Math.round(max * f)}</text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const bh = Math.max((d.value / max) * H, d.value > 0 ? 4 : 2);
        const x = padL + gap * i + (gap - barW) / 2;
        const y = padT + H - bh;
        const isHov = hover === i;
        return (
          <g key={i}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            style={{ cursor: 'pointer' }}>
            {/* Bar background */}
            <rect x={x} y={padT} width={barW} height={H}
              fill="transparent" />
            {/* Bar */}
            <rect x={x} y={y} width={barW} height={bh} rx={3}
              fill={isHov ? '#ffdd57' : d.value > 0 ? '#f5c518' : '#1e1e2e'}
              opacity={d.value > 0 ? 1 : 0.5}
              style={{ transition: 'fill 0.15s' }} />
            {/* Label */}
            <text x={x + barW / 2} y={padT + H + 16}
              textAnchor="middle" fill="#44445a" fontSize={9}>
              {d.label}
            </text>
            {isHov && d.value > 0 && (
              <Tooltip text={String(d.value)}
                x={x + barW / 2} y={y} visible />
            )}
          </g>
        );
      })}

      {/* Axes */}
      <line x1={padL} y1={padT} x2={padL} y2={padT + H}
        stroke="#2e2e42" strokeWidth={1} />
      <line x1={padL} y1={padT + H} x2={padL + W} y2={padT + H}
        stroke="#2e2e42" strokeWidth={1} />
    </svg>
  );
}

/* ── Donut Chart ─────────────────────────────────────────────── */
function DonutChart({ segments, size = 160, thickness = 28 }) {
  const [hover, setHover] = useState(null);
  const r = (size / 2) - thickness / 2 - 4;
  const cx = size / 2, cy = size / 2;
  const total = segments.reduce((s, d) => s + (d.value || 0), 0);
  if (total === 0) return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="#1e1e2e" strokeWidth={thickness} />
      <text x={cx} y={cy + 5} textAnchor="middle"
        fill="#44445a" fontSize={12}>No data</text>
    </svg>
  );

  let startAngle = -Math.PI / 2;
  const arcs = segments.map((seg, i) => {
    const angle = (seg.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const endAngle = startAngle + angle;
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const large = angle > Math.PI ? 1 : 0;
    const path = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
    const mid = startAngle + angle / 2;
    startAngle = endAngle;
    return { ...seg, path, mid, i };
  });

  const hov = hover !== null ? arcs[hover] : null;

  return (
    <svg width={size} height={size} style={{ overflow: 'visible' }}>
      {arcs.map((arc, i) => (
        <path key={i} d={arc.path}
          fill="none"
          stroke={arc.color}
          strokeWidth={hover === i ? thickness + 4 : thickness}
          strokeLinecap="round"
          opacity={hover !== null && hover !== i ? 0.4 : 1}
          style={{ cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
        />
      ))}
      {/* Center text */}
      <text x={cx} y={cy - 6} textAnchor="middle"
        fill={hov ? hov.color : '#f0f0f8'} fontSize={22} fontWeight={800}>
        {hov ? hov.value : total}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle"
        fill="#44445a" fontSize={10} fontWeight={600}>
        {hov ? hov.label : 'TOTAL'}
      </text>
    </svg>
  );
}

/* ── Horizontal Bar ──────────────────────────────────────────── */
function HBarChart({ data, color = '#f5c518' }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {data.map((d, i) => (
        <div key={i}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
          style={{ cursor: 'default' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: hover === i ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: hover === i ? 600 : 400, transition: 'all 0.15s' }}>{d.label}</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: d.color || color }}>{d.value}</span>
          </div>
          <div style={{ background: 'var(--bg-elevated)', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
            <div style={{
              width: `${(d.value / max) * 100}%`,
              height: '100%',
              background: d.color || color,
              borderRadius: '999px',
              transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
              opacity: hover === i ? 1 : 0.75,
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Retention Line Chart ────────────────────────────────────── */
function LineChart({ thisWeek, lastWeek, width = 300, height = 120 }) {
  const points = [
    { label: 'Last Wk', value: lastWeek },
    { label: 'This Wk', value: thisWeek },
  ];
  const max = Math.max(thisWeek, lastWeek, 1);
  const padL = 28, padB = 24, padT = 16, padR = 12;
  const W = width - padL - padR;
  const H = height - padB - padT;
  const xs = points.map((_, i) => padL + (i / (points.length - 1)) * W);
  const ys = points.map(p => padT + H - (p.value / max) * H);
  const line = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x} ${ys[i]}`).join(' ');
  const area = `${line} L ${xs[xs.length-1]} ${padT+H} L ${xs[0]} ${padT+H} Z`;
  const trend = thisWeek >= lastWeek;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={trend ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
          <stop offset="100%" stopColor={trend ? '#22c55e' : '#ef4444'} stopOpacity={0} />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((f, i) => (
        <line key={i} x1={padL} y1={padT + H * (1-f)} x2={padL+W} y2={padT + H * (1-f)}
          stroke="#1e1e2e" strokeWidth={1} />
      ))}
      <path d={area} fill="url(#lineGrad)" />
      <path d={line} fill="none"
        stroke={trend ? '#22c55e' : '#ef4444'} strokeWidth={2.5} strokeLinecap="round" />
      {xs.map((x, i) => (
        <g key={i}>
          <circle cx={x} cy={ys[i]} r={5}
            fill={trend ? '#22c55e' : '#ef4444'} stroke="#0a0a0f" strokeWidth={2} />
          <text x={x} y={padT + H + 16} textAnchor="middle"
            fill="#44445a" fontSize={10}>{points[i].label}</text>
          <text x={x} y={ys[i] - 10} textAnchor="middle"
            fill="var(--text-primary)" fontSize={11} fontWeight={700}>{points[i].value}</text>
        </g>
      ))}
    </svg>
  );
}

/* ── KPI Pill ────────────────────────────────────────────────── */
const Pill = ({ label, value, color, sub }) => (
  <div style={{
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '18px 20px',
    display: 'flex', flexDirection: 'column', gap: '4px',
    transition: 'border-color 0.2s',
  }}
    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
  >
    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
    <span style={{ fontSize: '26px', fontWeight: 800, color: color || 'var(--text-primary)', letterSpacing: '-0.5px', lineHeight: 1 }}>{value ?? '—'}</span>
    {sub && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sub}</span>}
  </div>
);

/* ── Card wrapper ────────────────────────────────────────────── */
const Card = ({ title, subtitle, accent, children, style = {} }) => (
  <div style={{
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: '14px', overflow: 'hidden', ...style,
  }}>
    <div style={{
      padding: '16px 20px', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', gap: '10px',
    }}>
      {accent && <div style={{ width: '3px', height: '18px', background: accent, borderRadius: '2px', flexShrink: 0 }} />}
      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>{subtitle}</div>}
      </div>
    </div>
    <div style={{ padding: '20px' }}>{children}</div>
  </div>
);

/* ── Main Page ───────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'SUPER_ADMIN') { router.push('/dashboard'); return; }
    getPlatformAnalytics()
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
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

  /* Derived data for charts */
  const dailyBars = (data.dailyActivity || []).map(d => ({
    label: d.date?.slice(5) || '',
    value: d.completed || 0,
  }));

  const taskDonut = [
    { label: 'Completed', value: data.completedTasks || 0,  color: '#22c55e' },
    { label: 'Overdue',   value: data.overdueTasks || 0,    color: '#ef4444' },
    { label: 'Denied',    value: data.deniedTasks || 0,     color: '#f59e0b' },
    { label: 'Active',    value: Math.max((data.totalTasks || 0) - (data.completedTasks || 0) - (data.overdueTasks || 0) - (data.deniedTasks || 0), 0), color: '#3b82f6' },
  ].filter(s => s.value > 0);

  const groupDonut = [
    { label: 'Active',   value: data.activeGroups   || 0, color: '#22c55e' },
    { label: 'Inactive', value: data.inactiveGroups || 0, color: '#ef4444' },
  ].filter(s => s.value > 0);

  const categoryBars = Object.entries(data.categoryBreakdown || {}).map(([k, v]) => ({
    label: k.charAt(0) + k.slice(1).toLowerCase(),
    value: v,
    color: '#818cf8',
  }));

  const priorityBars = Object.entries(data.priorityBreakdown || {}).map(([k, v]) => ({
    label: k.charAt(0) + k.slice(1).toLowerCase(),
    value: v,
    color: k === 'HIGH' ? '#ef4444' : k === 'MEDIUM' ? '#f59e0b' : '#22c55e',
  }));

  const userBars = (data.topActiveUsers || []).map(u => ({
    label: (u.name || u.userId || '').split(' ')[0],
    value: u.completedTasks || 0,
    color: '#f5c518',
  }));

  return (
    <div style={{ padding: '0 0 80px' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ marginBottom: '14px' }}>
          <button onClick={() => router.push('/superadmin')} style={{
            background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)',
            borderRadius: '6px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: '5px',
          }}>
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Console
          </button>
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px', letterSpacing: '-0.3px' }}>
          Platform Analytics
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
          Live metrics across all users, groups, and tasks.
        </p>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '10px', marginBottom: '24px' }}>
        <Pill label="Total Users"   value={data.totalUsers}                          color="var(--text-primary)" />
        <Pill label="Active Users"  value={data.activeUsers}                         color="var(--success)"      sub={`${data.deactivatedUsers || 0} deactivated`} />
        <Pill label="New This Week" value={data.newUsersThisWeek}                    color="var(--info)" />
        <Pill label="Total Tasks"   value={data.totalTasks}                          color="var(--text-primary)" />
        <Pill label="Completion"    value={(data.completionRatePercent ?? 0) + '%'}  color="var(--accent)" />
        <Pill label="Overdue"       value={data.overdueTasks}                        color="var(--danger)" />
      </div>

      {/* Row 1 — Daily bar + Task donut + Group donut */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>

        <Card title="Daily Completions" subtitle="last 7 days" accent="#f5c518">
          <BarChart data={dailyBars} width={480} height={160} />
        </Card>

        <Card title="Task Status" subtitle="all time" accent="#22c55e">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <DonutChart segments={taskDonut} size={140} thickness={24} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
              {taskDonut.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', flex: 1 }}>{s.label}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Group Health" subtitle="active vs inactive" accent="#3b82f6">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <DonutChart segments={groupDonut} size={140} thickness={24} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
              {groupDonut.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', flex: 1 }}>{s.label}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: s.color }}>{s.value}</span>
                </div>
              ))}
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Groups</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>{data.totalGroups || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 2 — Retention line + Priority bars + Category bars */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>

        <Card title="Member Retention" subtitle="week over week" accent="#22c55e">
          <LineChart thisWeek={data.activeUsersThisWeek || 0} lastWeek={data.activeUsersLastWeek || 0} width={280} height={130} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '12px' }}>
            {[
              { label: 'This Week', value: data.activeUsersThisWeek || 0, color: '#22c55e' },
              { label: 'Last Week', value: data.activeUsersLastWeek || 0, color: 'var(--text-secondary)' },
              { label: 'Rate', value: (data.retentionRatePercent || 0) + '%', color: data.retentionRatePercent > 60 ? '#22c55e' : '#f59e0b' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '8px', background: 'var(--bg-elevated)', borderRadius: '8px' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Priority Breakdown" subtitle="tasks by priority" accent="#f59e0b">
          {priorityBars.length > 0
            ? <HBarChart data={priorityBars} />
            : <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No task data yet</p>}
        </Card>

        <Card title="Category Breakdown" subtitle="tasks by category" accent="#818cf8">
          {categoryBars.length > 0
            ? <HBarChart data={categoryBars} color="#818cf8" />
            : <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No category data yet</p>}
        </Card>
      </div>

      {/* Row 3 — Top performers bar + Churn signals + Admin activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>

        <Card title="Top Performers" subtitle="by tasks completed" accent="#f5c518">
          {userBars.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(data.topActiveUsers || []).map((u, i) => {
                const max = data.topActiveUsers[0]?.completedTasks || 1;
                const pct = ((u.completedTasks || 0) / max) * 100;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0,
                      background: i === 0 ? 'var(--accent)' : 'var(--bg-elevated)',
                      color: i === 0 ? '#000' : 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: 800,
                    }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name || u.userId}</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', flexShrink: 0, marginLeft: '8px' }}>{u.completedTasks} tasks</span>
                      </div>
                      <div style={{ background: 'var(--bg-elevated)', borderRadius: '999px', height: '5px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${pct}%`, height: '100%', borderRadius: '999px',
                          background: i === 0 ? 'var(--accent)' : '#818cf8',
                          transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
                        }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No completions yet</p>
          )}
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Card title="Churn Signals" accent="#ef4444">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Inactive Groups',      value: data.inactiveGroups,                       color: '#ef4444' },
                { label: 'Dormant Users (7d)',    value: data.dormantUsers,                         color: '#f59e0b' },
                { label: 'Deactivated Accounts', value: data.deactivatedUsers,                     color: '#ef4444' },
                { label: 'Zero Completions',     value: data.dropOff?.usersWithZeroCompletions,    color: '#44445a' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{row.label}</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: row.color }}>{row.value ?? '—'}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Admin Activity" accent="#f59e0b">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Total Admins',      value: data.totalAdmins,           color: 'var(--text-primary)' },
                { label: 'Active This Week',  value: data.activeAdminsThisWeek,  color: '#22c55e' },
                { label: 'Tasks Assigned',    value: data.tasksCreatedThisWeek,  color: 'var(--text-secondary)' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{row.label}</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: row.color }}>{row.value ?? '—'}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

    </div>
  );
}
