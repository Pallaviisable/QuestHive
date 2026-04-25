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
      const entries = Object.entries(lbRes.data)
        .map(([userId, coins]) => ({ userId, coins }))
        .sort((a, b) => b.coins - a.coins);
      setLeaderboard(entries);
      setGroup(groupRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // FIX: MongoDB returns _id not id — check both to be safe
  const getMemberName = (userId) => {
    if (!group?.members) return userId;
    const member = group.members.find(
      m => (m._id === userId) || (m.id === userId) || (String(m._id) === String(userId))
    );
    return member ? (member.fullName || member.username) : userId;
  };

  const getInitial = (userId) => {
    const name = getMemberName(userId);
    // If name is still a raw ID (lookup failed), show '?' instead of first char of ID
    if (name === userId && userId.length > 10) return '?';
    return name[0]?.toUpperCase() || '?';
  };

  const medals = ['🥇', '🥈', '🥉'];
  const rankColors = ['#f5c518', '#c0c0c0', '#cd7f32'];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', flexDirection: 'column', gap: '12px' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid #f5c518', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <p style={{ color: '#f5c518', fontWeight: 600 }}>Loading leaderboard...</p>
    </div>
  );

  return (
    <div className="animate-fadeSlideUp">
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800 }}>🏆 Weekly Leaderboard</h1>
        <p style={{ color: '#a0a0a0', marginTop: '4px', fontSize: '14px' }}>
          {group?.name} — this week's top performers
        </p>
      </div>

      {leaderboard.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#a0a0a0', background: '#1a1a1a', borderRadius: '16px', border: '1px dashed #2a2a2a' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
          <p style={{ fontWeight: 700, color: '#fff', marginBottom: '6px' }}>No activity this week yet</p>
          <p style={{ fontSize: '13px' }}>Complete tasks to earn coins and appear here!</p>
        </div>
      ) : (
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {leaderboard.map((entry, i) => {
            const isMe = entry.userId === user?.id || entry.userId === user?._id;
            const name = isMe ? 'You' : getMemberName(entry.userId);
            const initial = getInitial(entry.userId);
            const isTop3 = i < 3;

            return (
              <div key={i} className="animate-fadeSlideUp" style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '18px 24px',
                background: i === 0
                  ? 'linear-gradient(135deg, rgba(245,197,24,0.12), rgba(245,197,24,0.04))'
                  : '#1a1a1a',
                borderRadius: '16px',
                border: i === 0
                  ? '1px solid rgba(245,197,24,0.45)'
                  : isMe
                  ? '1px solid rgba(245,197,24,0.25)'
                  : '1px solid #2a2a2a',
                animationDelay: `${i * 0.07}s`,
                transition: 'all 0.2s',
              }}>
                {/* Rank */}
                <div style={{ minWidth: '40px', textAlign: 'center' }}>
                  {isTop3 ? (
                    <span style={{ fontSize: '28px' }}>{medals[i]}</span>
                  ) : (
                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#555' }}>#{i + 1}</span>
                  )}
                </div>

                {/* Avatar */}
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                  background: isTop3 ? rankColors[i] : isMe ? '#f5c518' : '#2a2a2a',
                  color: (isTop3 || isMe) ? '#000' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '17px',
                  boxShadow: i === 0 ? '0 0 16px rgba(245,197,24,0.35)' : 'none',
                }}>
                  {initial}
                </div>

                {/* Name */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 700, fontSize: '15px',
                    color: isMe ? '#f5c518' : '#fff',
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}>
                    {name}
                    {isMe && <span style={{ fontSize: '16px' }}>🐝</span>}
                    {i === 0 && <span style={{ fontSize: '12px', color: '#f5c518', fontWeight: 600, background: 'rgba(245,197,24,0.15)', borderRadius: '999px', padding: '2px 8px' }}>Quest Master 👑</span>}
                  </div>
                  {isMe && (
                    <div style={{ fontSize: '11px', color: '#a0a0a0', marginTop: '2px' }}>That's you!</div>
                  )}
                </div>

                {/* Coins */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#f5c518', fontSize: '22px', fontWeight: 900 }}>{entry.coins}</div>
                  <div style={{ color: '#555', fontSize: '11px', fontWeight: 600 }}>coins</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}