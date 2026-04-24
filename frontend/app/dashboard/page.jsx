'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getMyTasks, getMyGroups, getMyCoins } from '@/lib/api';

export default function DashboardPage() {
  const [tasks, setTasks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [coins, setCoins] = useState(0);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, groupsRes, coinsRes] = await Promise.all([
        getMyTasks(), getMyGroups(), getMyCoins()
      ]);
      setTasks(tasksRes.data);
      setGroups(groupsRes.data);
      setCoins(coinsRes.data.coins);
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

  const stats = [
    { label: 'Total Tasks', value: tasks.length, icon: '📋', color: '#f5c518' },
    { label: 'Pending', value: pending, icon: '⏳', color: '#f97316' },
    { label: 'In Progress', value: inProgress, icon: '🔄', color: '#3b82f6' },
    { label: 'Completed', value: completed, icon: '✅', color: '#22c55e' },
    { label: 'Groups', value: groups.length, icon: '👥', color: '#a855f7' },
    { label: 'Coins', value: coins, icon: '🪙', color: '#f5c518' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ color: '#f5c518', fontSize: '18px' }}>🐝 Loading your hive...</div>
    </div>
  );

  return (
    <div className="animate-fadeSlideUp">
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>
          Welcome back, {user?.fullName?.split(' ')[0] || 'Hive Member'} 👋
        </h1>
        <p style={{ color: '#a0a0a0', marginTop: '4px' }}>Here's what's happening in your hive today.</p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '16px', marginBottom: '40px',
      }}>
        {stats.map((stat, i) => (
          <div key={i} className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{stat.icon}</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ color: '#a0a0a0', fontSize: '13px', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Tasks + Groups */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* Recent Tasks */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Recent Tasks</h2>
            <Link href="/tasks" style={{ color: '#f5c518', fontSize: '13px', textDecoration: 'none' }}>View all →</Link>
          </div>
          {tasks.slice(0, 5).map((task, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 0', borderBottom: '1px solid #2a2a2a',
            }}>
              <span style={{ fontSize: '16px' }}>
                {task.status === 'COMPLETED' ? '✅' : task.status === 'IN_PROGRESS' ? '🔄' : '⏳'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{task.title}</div>
                <div style={{ fontSize: '12px', color: '#a0a0a0' }}>{task.priority} • {task.category}</div>
              </div>
              <span style={{ color: '#f5c518', fontSize: '13px', fontWeight: 700 }}>+{task.coinsReward}🪙</span>
            </div>
          ))}
          {tasks.length === 0 && (
            <p style={{ color: '#a0a0a0', textAlign: 'center', padding: '20px' }}>No tasks yet!</p>
          )}
        </div>

        {/* My Groups */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700 }}>My Groups</h2>
            <Link href="/groups" style={{ color: '#f5c518', fontSize: '13px', textDecoration: 'none' }}>View all →</Link>
          </div>
          {groups.slice(0, 5).map((group, i) => (
            <Link key={i} href={`/groups/${group.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 0', borderBottom: '1px solid #2a2a2a',
                cursor: 'pointer', transition: 'opacity 0.2s',
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'rgba(245,197,24,0.15)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                }}>🐝</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{group.name}</div>
                  <div style={{ fontSize: '12px', color: '#a0a0a0' }}>{group.memberIds?.length || 0} members</div>
                </div>
              </div>
            </Link>
          ))}
          {groups.length === 0 && (
            <p style={{ color: '#a0a0a0', textAlign: 'center', padding: '20px' }}>No groups yet!</p>
          )}
        </div>
      </div>
    </div>
  );
}