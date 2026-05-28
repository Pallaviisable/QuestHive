'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getMyTasks, getMyGroups, getMyCoins, getMyXP, getGroupHealth } from '@/lib/api';
import OnboardingTour from '@/components/OnboardingTour';

function XpBar({ xp }) {
  if (!xp) return null;
  return (
    <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '14px', padding: '16px 20px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: '#f5c518', fontWeight: 800, fontSize: '16px' }}>⚡ Level {xp.level}</span>
          <span style={{ color: '#a0a0a0', fontSize: '12px' }}>{xp.title}</span>
        </div>
        <span style={{ color: '#555', fontSize: '12px' }}>{xp.xpIntoCurrentLevel} / {xp.xpForNextLevel} XP</span>
      </div>
      <div style={{ background: '#111', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: '999px',
          background: 'linear-gradient(90deg, #f5c518, #ffdd57)',
          width: `${xp.progressPercent}%`,
          transition: 'width 0.6s ease',
        }} />
      </div>
      <div style={{ marginTop: '6px', fontSize: '11px', color: '#444' }}>Total XP: {xp.totalXp}</div>
      {xp.frame && xp.frame !== 'NONE' && (
        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            padding: '4px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
            background: xp.frame === 'LEGENDARY' ? 'rgba(245,197,24,0.2)' :
                        xp.frame === 'CHAMPION' ? 'rgba(168,85,247,0.2)' :
                        xp.frame === 'ELITE' ? 'rgba(59,130,246,0.2)' : 'rgba(34,197,94,0.2)',
            color: xp.frame === 'LEGENDARY' ? '#f5c518' :
                   xp.frame === 'CHAMPION' ? '#a855f7' :
                   xp.frame === 'ELITE' ? '#3b82f6' : '#22c55e',
            border: '1px solid currentColor',
          }}>
            {xp.frame === 'LEGENDARY' ? '👑 LEGENDARY FRAME' :
             xp.frame === 'CHAMPION' ? '🏆 CHAMPION FRAME' :
             xp.frame === 'ELITE' ? '⚔️ ELITE FRAME' :
             xp.frame === 'VETERAN' ? '🛡️ VETERAN FRAME' :
             xp.frame === 'DEDICATED' ? '💪 DEDICATED FRAME' : '🌱 RISING FRAME'}
          </div>
        </div>
      )}
    </div>
  );
}

function GroupHealthMini({ group }) {
  const [health, setHealth] = useState(null);
  useEffect(() => {
    getGroupHealth(group.id).then(r => setHealth(r.data)).catch(() => {});
  }, [group.id]);
  if (!health) return null;
  const color = health.status === 'HEALTHY' ? '#22c55e' : health.status === 'AT_RISK' ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', color: '#555' }}>Group Health</span>
        <span style={{ fontSize: '11px', color, fontWeight: 700 }}>{health.healthPercent}%</span>
      </div>
      <div style={{ background: '#111', borderRadius: '999px', height: '5px', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: '999px', background: color, width: `${health.healthPercent}%`, transition: 'width 0.5s' }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [coins, setCoins] = useState(0);
  const [xp, setXp] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      if (!u.hasSeenTour) setShowTour(true);
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, groupsRes, coinsRes, xpRes] = await Promise.all([
        getMyTasks(), getMyGroups(), getMyCoins(), getMyXP()
      ]);
      setTasks(tasksRes.data);
      setGroups(groupsRes.data);
      setCoins(coinsRes.data.coins);
      setXp(xpRes.data);
      localStorage.setItem('coins', coinsRes.data.coins);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pending = tasks.filter(t => t.status === 'PENDING').length;
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const completed = tasks.filter(t => t.status === 'COMPLETED').length;
  const overdue = tasks.filter(t => t.status !== 'COMPLETED' && t.deadline && new Date(t.deadline) < new Date()).length;

  const stats = [
    { label: 'Total Tasks', value: tasks.length, icon: '📋', color: '#f5c518' },
    { label: 'Pending',     value: pending,       icon: '⏳', color: '#f97316' },
    { label: 'In Progress', value: inProgress,    icon: '🔄', color: '#3b82f6' },
    { label: 'Completed',   value: completed,     icon: '✅', color: '#22c55e' },
    { label: 'Overdue',     value: overdue,       icon: '🔴', color: '#ef4444' },
    { label: 'Coins',       value: coins,         icon: '🪙', color: '#f5c518' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '12px' }}>
      <div style={{ fontSize: '36px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>🐝</div>
      <div style={{ color: '#f5c518', fontSize: '16px', fontWeight: 600 }}>Loading your hive...</div>
    </div>
  );

  return (
    <div className="animate-fadeSlideUp">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>
          Welcome back, {user?.fullName?.split(' ')[0] || 'Hive Member'} 👋
        </h1>
        <p style={{ color: '#a0a0a0', marginTop: '4px' }}>Here's what's happening in your hive today.</p>
      </div>

      <XpBar xp={xp} />

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '14px', marginBottom: '32px' }}>
        {stats.map((stat, i) => (
          <div key={i} className="card" style={{ padding: '18px', textAlign: 'center' }}>
            <div style={{ fontSize: '26px', marginBottom: '6px' }}>{stat.icon}</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ color: '#a0a0a0', fontSize: '12px', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Tasks + Groups */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Recent Tasks */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700 }}>Recent Tasks</h2>
            <Link href="/tasks" style={{ color: '#f5c518', fontSize: '13px', textDecoration: 'none' }}>View all →</Link>
          </div>
          {tasks.slice(0, 5).map((task, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i < 4 ? '1px solid #2a2a2a' : 'none' }}>
              <span style={{ fontSize: '16px' }}>
                {task.status === 'COMPLETED' ? '✅' : task.status === 'IN_PROGRESS' ? '🔄' : new Date(task.deadline) < new Date() ? '🔴' : '⏳'}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</div>
                <div style={{ fontSize: '11px', color: '#a0a0a0' }}>{task.priority} · {task.category}</div>
              </div>
              <span style={{ color: '#f5c518', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>+{task.coinsReward}🪙</span>
            </div>
          ))}
          {tasks.length === 0 && <p style={{ color: '#a0a0a0', textAlign: 'center', padding: '20px', fontSize: '13px' }}>No tasks yet!</p>}
        </div>

        {/* My Groups */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700 }}>My Groups</h2>
            <Link href="/groups" style={{ color: '#f5c518', fontSize: '13px', textDecoration: 'none' }}>View all →</Link>
          </div>
          {groups.slice(0, 4).map((group, i) => (
            <Link key={i} href={`/groups/${group.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ padding: '10px 0', borderBottom: i < 3 ? '1px solid #2a2a2a' : 'none', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245,197,24,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>🐝</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{group.name}</div>
                    <div style={{ fontSize: '11px', color: '#a0a0a0' }}>{group.memberIds?.length || 0} members</div>
                  </div>
                </div>
                <GroupHealthMini group={group} />
              </div>
            </Link>
          ))}
          {groups.length === 0 && <p style={{ color: '#a0a0a0', textAlign: 'center', padding: '20px', fontSize: '13px' }}>No groups yet!</p>}
        </div>
      </div>
      {showTour && <OnboardingTour onComplete={() => { setShowTour(false); const u = JSON.parse(localStorage.getItem('user') || '{}'); u.hasSeenTour = true; localStorage.setItem('user', JSON.stringify(u)); }} />}
    </div>
  );
}
