'use client';
import { useEffect, useState } from 'react';
import { getMyXP } from '@/lib/api';

export default function XpBar() {
  const [xp, setXp] = useState(null);

  useEffect(() => {
    getMyXP().then(r => setXp(r.data)).catch(() => {});
  }, []);

  if (!xp) return null;

  return (
    <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '14px', padding: '16px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div>
          <span style={{ color: '#f5c518', fontWeight: 800, fontSize: '15px' }}>Level {xp.level}</span>
          <span style={{ color: '#a0a0a0', fontSize: '12px', marginLeft: '10px' }}>{xp.title}</span>
        </div>
        <span style={{ color: '#a0a0a0', fontSize: '12px' }}>{xp.xpIntoCurrentLevel} / {xp.xpForNextLevel} XP</span>
      </div>
      <div style={{ background: '#111', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: '999px',
          background: 'linear-gradient(90deg, #f5c518, #ffdd57)',
          width: `${xp.progressPercent}%`,
          transition: 'width 0.6s ease',
        }} />
      </div>
      <div style={{ marginTop: '6px', fontSize: '11px', color: '#555' }}>Total XP: {xp.totalXp}</div>
    </div>
  );
}
