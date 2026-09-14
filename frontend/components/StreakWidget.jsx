'use client';
import { useEffect, useState } from 'react';
import { getStreakStatus, restoreStreak } from '@/lib/api';

export default function StreakWidget() {
  const [streak, setStreak] = useState(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    getStreakStatus().then(r => setStreak(r.data)).catch(() => {});
  }, []);

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const res = await restoreStreak();
      setStreak(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setRestoring(false);
    }
  };

  if (!streak) return null;

  return (
    <div className="dash-card" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
      <div style={{
        width: '52px', height: '52px', borderRadius: '12px', flexShrink: 0,
        background: 'rgba(249,115,22,0.1)', border: '1.5px solid rgba(249,115,22,0.3)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 16px rgba(249,115,22,0.15)',
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#f97316">
          <path d="M12 2c1 3-2 4-2 7a3 3 0 106 0c1.5 1.5 2 3.5 2 5a6 6 0 11-12 0c0-4 3-6 4-10 .5 1 .8 2 2 2z"/>
        </svg>
        <span style={{ fontSize: '15px', fontWeight: 900, color: '#f97316', lineHeight: 1, marginTop: '2px' }}>{streak.streak}</span>
      </div>

      <div style={{ flex: 1, minWidth: '180px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {streak.streak} day streak
          </span>
          {streak.freezeTokens > 0 && (
            <span style={{
              fontSize: '10px', fontWeight: 700, letterSpacing: '0.3px',
              color: '#3b82f6', background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.3)',
              borderRadius: '999px', padding: '2px 8px',
            }}>
              {streak.freezeTokens} FREEZE{streak.freezeTokens > 1 ? 'S' : ''}
            </span>
          )}
        </div>

        {streak.plannedPauseUntil && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Paused until {new Date(streak.plannedPauseUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        )}

        {streak.canRestore && !streak.plannedPauseUntil && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Last streak broke at {streak.lastBrokenStreak} days
          </div>
        )}
      </div>

      {streak.canRestore && (
        <button
          onClick={handleRestore}
          disabled={restoring}
          style={{
            padding: '8px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 700,
            background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)',
            color: '#f97316', cursor: restoring ? 'default' : 'pointer',
            opacity: restoring ? 0.6 : 1, flexShrink: 0,
          }}
        >
          {restoring ? 'Restoring…' : `Restore for ${streak.restoreCost} coins`}
        </button>
      )}
    </div>
  );
}
