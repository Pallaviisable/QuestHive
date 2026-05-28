'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getFairnessReport, getConcentrationReport } from '@/lib/api';

export default function FairnessPage() {
  const { groupId } = useParams();
  const [report, setReport] = useState(null);
  const [concentration, setConcentration] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getFairnessReport(groupId),
      getConcentrationReport(groupId)
    ]).then(([r1, r2]) => { setReport(r1.data); setConcentration(r2.data); }).catch(() => {}).finally(() => setLoading(false));
  }, [groupId]);

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#f5c518' }}>Loading fairness data...</div>;
  if (!report) return <div style={{ padding: '60px', textAlign: 'center', color: '#ef4444' }}>Failed to load report.</div>;

  const statusColor = report.fairnessStatus === 'FAIR' ? '#22c55e' : report.fairnessStatus === 'SLIGHTLY_UNEVEN' ? '#f59e0b' : '#ef4444';
  const members = Object.keys(report.memberNames);
  const maxCount = Math.max(...members.map(id => report.taskCountPerMember[id] || 0), 1);

  return (
    <div style={{ maxWidth: '700px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>⚖️ Fairness Report</h1>
      <p style={{ color: '#a0a0a0', fontSize: '14px', marginBottom: '24px' }}>Task distribution across group members</p>

      <div style={{ background: '#1a1a1a', border: `1px solid ${statusColor}40`, borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>{report.fairnessStatus === 'FAIR' ? '✅' : report.fairnessStatus === 'SLIGHTLY_UNEVEN' ? '⚠️' : '🚨'}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '16px', color: statusColor }}>{report.fairnessStatus.replace('_', ' ')}</div>
            <div style={{ color: '#a0a0a0', fontSize: '13px', marginTop: '2px' }}>{report.suggestion}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {members.map(memberId => {
          const count = report.taskCountPerMember[memberId] || 0;
          const coins = report.coinsPerMember[memberId] || 0;
          const pct = Math.round((count / maxCount) * 100);
          return (
            <div key={memberId} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600 }}>{report.memberNames[memberId]}</span>
                <span style={{ color: '#a0a0a0', fontSize: '13px' }}>{count} tasks · 🪙 {coins}</span>
              </div>
              <div style={{ background: '#111', borderRadius: '999px', height: '8px' }}>
                <div style={{ height: '100%', borderRadius: '999px', background: '#f5c518', width: `${pct}%`, transition: 'width 0.5s' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Fairness Part 2 — Concentration Alerts */}
      {concentration && concentration.alerts && concentration.alerts.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>🚨 Fairness Alerts</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {concentration.alerts.map((alert, i) => (
              <div key={i} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '14px 16px', fontSize: '13px', color: '#fca5a5', lineHeight: 1.5 }}>
                {alert}
              </div>
            ))}
          </div>
        </div>
      )}
      {concentration && (!concentration.alerts || concentration.alerts.length === 0) && (
        <div style={{ marginTop: '24px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '12px', padding: '14px 16px', fontSize: '13px', color: '#86efac' }}>
          ✅ No concentration or disparity alerts in the last 14 days.
        </div>
      )}
    </div>
  );
}
