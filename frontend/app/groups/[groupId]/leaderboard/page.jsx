'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getLeaderboard, getGroupDetail, getMyXP } from '@/lib/api';
import axios from 'axios';

const TITLE_TIERS = [
  { frame: 'none',     title: 'Newcomer',       minLevel: 1,  color: '#666',    ring: '#444' },
  { frame: 'bronze',   title: 'Task Starter',   minLevel: 3,  color: '#cd7f32', ring: '#cd7f32' },
  { frame: 'silver',   title: 'Steady Worker',  minLevel: 6,  color: '#c0c0c0', ring: '#c0c0c0' },
  { frame: 'gold',     title: 'Dedicated Bee',  minLevel: 10, color: '#f5c518', ring: '#f5c518' },
  { frame: 'purple',   title: 'Quest Champion', minLevel: 15, color: '#a855f7', ring: '#a855f7' },
  { frame: 'elite',    title: 'Elite Bee',      minLevel: 20, color: '#ef4444', ring: 'linear-gradient(135deg,#f5c518,#ef4444)' },
];

function getTier(level) {
  let tier = TITLE_TIERS[0];
  for (const t of TITLE_TIERS) { if (level >= t.minLevel) tier = t; }
  return tier;
}

export default function LeaderboardPage() {
  const { groupId } = useParams();
  const [leaderboard, setLeaderboard] = useState([]);
  const [group, setGroup] = useState(null);
  const [xpMap, setXpMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('LEADERBOARD');
  const [levelUpBanner, setLevelUpBanner] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [lbRes, groupRes] = await Promise.all([getLeaderboard(groupId), getGroupDetail(groupId)]);
      const entries = Object.entries(lbRes.data)
        .map(([userId, coins]) => ({ userId, coins }))
        .sort((a, b) => b.coins - a.coins);
      setLeaderboard(entries);
      setGroup(groupRes.data);

      // Fetch XP for each member
      const token = localStorage.getItem('token');
      const xpResults = {};
      await Promise.all(
        (groupRes.data?.members || []).map(async (m) => {
          try {
            const res = await axios.get(
              `${process.env.NEXT_PUBLIC_API_URL}/xp/user/${m.id ?? m._id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            xpResults[m.id ?? m._id] = res.data;
          } catch {
            // fallback: try /xp/me for current user
          }
        })
      );
      // Also fetch current user's XP via /xp/me
      try {
        const myXp = await getMyXP();
        const stored = localStorage.getItem('user');
        const me = stored ? JSON.parse(stored) : null;
        if (me) xpResults[me.id ?? me._id] = myXp.data;
      } catch {}
      setXpMap(xpResults);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getMember = (userId) => {
    if (!group?.members) return null;
    return group.members.find(m => (m._id === userId) || (m.id === userId) || (String(m._id) === String(userId)));
  };

  const getMemberName = (userId) => {
    const member = getMember(userId);
    return member ? (member.fullName || member.username) : userId;
  };

  const getInitial = (userId) => {
    const name = getMemberName(userId);
    if (name === userId && userId.length > 10) return '?';
    return name[0]?.toUpperCase() || '?';
  };

  const getXpInfo = (userId) => {
    const xp = xpMap[userId];
    if (!xp) return { level: 1, totalXp: 0, tier: TITLE_TIERS[0] };
    const level = xp.level || 1;
    return { level, totalXp: xp.totalXp || 0, tier: getTier(level) };
  };

  const medals = ['🥇', '🥈', '🥉'];
  const rankColors = ['#f5c518', '#c0c0c0', '#cd7f32'];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', flexDirection: 'column', gap: '12px' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid #f5c518', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <p style={{ color: '#f5c518', fontWeight: 600 }}>Loading leaderboard...</p>
    </div>
  );

  // Hall of Fame: for each tier, find who holds it (highest level member in that tier)
  const hallOfFame = TITLE_TIERS.slice(1).map(tier => {
    const holders = (group?.members || [])
      .map(m => ({ member: m, ...getXpInfo(m.id ?? m._id) }))
      .filter(({ level }) => getTier(level).frame === tier.frame)
      .sort((a, b) => b.level - a.level);
    return { tier, holders };
  });

  return (
    <div className="animate-fadeSlideUp">
      {/* Level-up banner */}
      {levelUpBanner && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 999, background: 'linear-gradient(135deg,#f5c518,#ff9500)', color: '#000', borderRadius: '16px', padding: '16px 28px', fontWeight: 800, fontSize: '16px', boxShadow: '0 8px 32px rgba(245,197,24,0.5)', animation: 'fadeSlideUp 0.4s ease' }}>
          🎉 {levelUpBanner}
        </div>
      )}

      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800 }}>🏆 Leaderboard</h1>
        <p style={{ color: '#a0a0a0', marginTop: '4px', fontSize: '14px' }}>{group?.name}</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', justifyContent: 'center' }}>
        {[{ key: 'LEADERBOARD', label: '🏆 Rankings' }, { key: 'HALL_OF_FAME', label: '⭐ Hall of Fame' }].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ padding: '8px 20px', borderRadius: '999px', fontSize: '13px', fontWeight: 600, background: activeTab === t.key ? '#f5c518' : '#222', color: activeTab === t.key ? '#000' : '#a0a0a0', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* LEADERBOARD TAB */}
      {activeTab === 'LEADERBOARD' && (
        <>
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
                const { level, tier } = getXpInfo(entry.userId);

                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '16px 20px',
                    background: i === 0 ? 'linear-gradient(135deg,rgba(245,197,24,0.12),rgba(245,197,24,0.04))' : '#1a1a1a',
                    borderRadius: '16px',
                    border: i === 0 ? '1px solid rgba(245,197,24,0.45)' : isMe ? '1px solid rgba(245,197,24,0.25)' : '1px solid #2a2a2a',
                    animationDelay: `${i * 0.07}s`,
                    transition: 'all 0.2s',
                  }}>
                    {/* Rank */}
                    <div style={{ minWidth: '36px', textAlign: 'center' }}>
                      {isTop3 ? <span style={{ fontSize: '26px' }}>{medals[i]}</span> : <span style={{ fontSize: '15px', fontWeight: 800, color: '#555' }}>#{i + 1}</span>}
                    </div>

                    {/* Avatar with frame ring */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '50%',
                        background: isTop3 ? rankColors[i] : isMe ? '#f5c518' : '#2a2a2a',
                        color: (isTop3 || isMe) ? '#000' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '17px',
                        boxShadow: tier.frame !== 'none' ? `0 0 0 3px ${tier.color}, 0 0 12px ${tier.color}55` : i === 0 ? '0 0 16px rgba(245,197,24,0.35)' : 'none',
                      }}>{initial}</div>
                      {level > 1 && (
                        <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: '#111', border: `1px solid ${tier.color}`, borderRadius: '999px', fontSize: '9px', fontWeight: 800, color: tier.color, padding: '1px 5px', lineHeight: 1.4 }}>
                          {level}
                        </div>
                      )}
                    </div>

                    {/* Name + title */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: isMe ? '#f5c518' : '#fff', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {name}
                        {isMe && <span style={{ fontSize: '14px' }}>🐝</span>}
                        {i === 0 && <span style={{ fontSize: '11px', color: '#f5c518', background: 'rgba(245,197,24,0.15)', borderRadius: '999px', padding: '2px 8px', fontWeight: 600 }}>Quest Master 👑</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: tier.color, fontWeight: 600, marginTop: '2px' }}>
                        {tier.title} · Lv.{level}
                      </div>
                    </div>

                    {/* Coins */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ color: '#f5c518', fontSize: '20px', fontWeight: 900 }}>{entry.coins}</div>
                      <div style={{ color: '#555', fontSize: '11px', fontWeight: 600 }}>coins</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* HALL OF FAME TAB */}
      {activeTab === 'HALL_OF_FAME' && (
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ color: '#555', fontSize: '13px', textAlign: 'center', marginBottom: '8px' }}>Members who have reached each title tier in this group.</p>
          {hallOfFame.reverse().map(({ tier, holders }) => (
            <div key={tier.frame} style={{ background: '#1a1a1a', borderRadius: '16px', border: `1px solid ${tier.color}44`, padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `${tier.color}22`, border: `2px solid ${tier.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: tier.color }}>
                  {tier.frame === 'elite' ? '👑' : tier.frame === 'purple' ? '💜' : tier.frame === 'gold' ? '🌟' : tier.frame === 'silver' ? '🥈' : '🥉'}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '15px', color: tier.color }}>{tier.title}</div>
                  <div style={{ fontSize: '11px', color: '#555' }}>Level {tier.minLevel}+ required</div>
                </div>
              </div>

              {holders.length === 0 ? (
                <div style={{ color: '#444', fontSize: '13px', fontStyle: 'italic', padding: '8px 0' }}>
                  Nobody yet — be the first to reach Level {tier.minLevel}! 🐝
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {holders.map(({ member, level, totalXp }) => {
                    const isMe = (member.id ?? member._id) === (user?.id ?? user?._id);
                    return (
                      <div key={member.id ?? member._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#222', borderRadius: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `${tier.color}22`, border: `2px solid ${tier.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px', color: tier.color }}>
                          {member.fullName?.[0]?.toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: isMe ? '#f5c518' : '#fff' }}>
                            {member.fullName} {isMe && '(You)'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#555' }}>{totalXp} XP</div>
                        </div>
                        <div style={{ background: `${tier.color}22`, border: `1px solid ${tier.color}66`, borderRadius: '999px', padding: '2px 10px', fontSize: '11px', fontWeight: 800, color: tier.color }}>
                          Lv.{level}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
