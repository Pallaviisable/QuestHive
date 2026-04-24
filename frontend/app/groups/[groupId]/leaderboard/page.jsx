'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getLeaderboard, getGroup } from '@/lib/api';

export default function LeaderboardPage() {
  const { groupId } = useParams();
  const [leaderboard, setLeaderboard] = useState([]);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [lbRes, groupRes] = await Promise.all([getLeaderboard(groupId), getGroup(groupId)]);
      const entries = Object.entries(lbRes.data).map(([userId, coins]) => ({ userId, coins }));
      setLeaderboard(entries);
      setGroup(groupRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="animate-fadeSlideUp">
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800 }}>🏆 Weekly Leaderboard</h1>
        <p style={{ color: '#a0a0a0', marginTop: '4px' }}>{group?.name} — this week's top performers</p>
      </div>

      {loading ? (
        <div style={{ color: '#f5c518', textAlign: 'center', padding: '40px' }}>Loading leaderboard...</div>
      ) : leaderboard.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#a0a0a0' }}>
          No activity this week yet. Complete tasks to earn coins!
        </div>
      ) : (
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {leaderboard.map((entry, i) => (
            <div key={i} className="card animate-fadeSlideUp" style={{
              padding: '20px 24px',
              display: 'flex', alignItems: 'center', gap: '16px',
              animationDelay: `${i * 0.08}s`,
              border: i === 0 ? '1px solid rgba(245,197,24,0.5)' : undefined,
              background: i === 0 ? 'rgba(245,197,24,0.05)' : undefined,
            }}>
              <span style={{ fontSize: '28px', minWidth: '40px' }}>{medals[i] || `#${i + 1}`}</span>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: i === 0 ? '#f5c518' : '#333',
                color: i === 0 ? '#000' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '16px',
              }}>
                {entry.userId[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: entry.userId === user?.id ? '#f5c518' : '#fff' }}>
                  {entry.userId === user?.id ? 'You 🐝' : entry.userId}
                </div>
                {i === 0 && <div style={{ color: '#f5c518', fontSize: '12px' }}>Quest Master 👑</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#f5c518', fontSize: '20px', fontWeight: 800 }}>{entry.coins}</div>
                <div style={{ color: '#a0a0a0', fontSize: '12px' }}>coins</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}