'use client';
import { useEffect, useState } from 'react';
import { getGroupHealth } from '@/lib/api';

export default function GroupHealthBar({ groupId }) {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    if (groupId) getGroupHealth(groupId).then(r => setHealth(r.data)).catch(() => {});
  }, [groupId]);

  if (!health) return null;

  const color = health.status === 'HEALTHY' ? '#22c55e' : health.status === 'AT_RISK' ? '#f59e0b' : '#ef4444';
  const emoji = health.status === 'HEALTHY' ? '💚' : health.status === 'AT_RISK' ? '⚠️' : '🔴';

  return (
    <div style={{ background: '#1a1a1a', border: `1px solid ${color}30`, borderRadius: '14px', padding: '16px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontWeight: 700, fontSize: '14px' }}>{emoji} Group Health</span>
        <span style={{ color, fontWeight: 800, fontSize: '14px' }}>{health.healthPercent}%</span>
      </div>
      <div style={{ background: '#111', borderRadius: '999px', height: '10px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: '999px',
          background: color,
          width: `${health.healthPercent}%`,
          transition: 'width 0.6s ease',
        }} />
      </div>
      <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '12px', color: '#a0a0a0' }}>
        <span>✅ {health.completed} done</span>
        <span>📋 {health.total} total</span>
        {health.overdue > 0 && <span style={{ color: '#ef4444' }}>⏰ {health.overdue} overdue</span>}
      </div>
    </div>
  );
}
