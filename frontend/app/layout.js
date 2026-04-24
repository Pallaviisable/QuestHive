'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import './globals.css';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: '🏠' },
  { label: 'Groups',    href: '/groups',    icon: '👥' },
  { label: 'Tasks',     href: '/tasks',     icon: '✅' },
  { label: 'Rewards',   href: '/rewards',   icon: '🪙' },
  { label: 'Settings',  href: '/settings',  icon: '⚙️' },
];

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [coins, setCoins] = useState(0);

  const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
  const isAuthPage = authRoutes.some(route => pathname.startsWith(route));

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    if (!token && !isAuthPage) router.push('/login');
  }, [pathname]);

  useEffect(() => {
    const stored = localStorage.getItem('coins');
    if (stored) setCoins(parseInt(stored));
  }, [pathname]);

  const handleLogout = () => {
    localStorage.clear();
    document.cookie = 'token=; path=/; max-age=0';
    router.push('/login');
  };

  if (isAuthPage) {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* TOP NAVBAR */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: 'rgba(17,17,17,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #2a2a2a',
          padding: '0 24px',
          height: '60px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}
            >☰</button>
            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: '22px', fontWeight: 800, color: '#f5c518', letterSpacing: '-0.5px' }}>
                🐝 QuestHive
              </span>
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(245,197,24,0.1)',
              border: '1px solid rgba(245,197,24,0.3)',
              borderRadius: '999px', padding: '6px 14px',
            }}>
              <span>🪙</span>
              <span style={{ color: '#f5c518', fontWeight: 700 }}>{coins}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: '#f5c518', color: '#000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '14px',
              }}>
                {user?.fullName?.[0] || user?.username?.[0] || 'U'}
              </div>
              <span style={{ color: '#fff', fontSize: '14px' }}>
                {user?.fullName || user?.username || 'User'}
              </span>
              <button onClick={handleLogout} className="btn-outline" style={{ padding: '6px 14px', fontSize: '13px' }}>
                Logout
              </button>
            </div>
          </div>
        </nav>

        {/* BODY — sidebar + content */}
        <div style={{ display: 'flex', flex: 1 }}>
          <aside style={{
            width: sidebarOpen ? '220px' : '0px',
            minWidth: sidebarOpen ? '220px' : '0px',
            background: '#111',
            borderRight: '1px solid #2a2a2a',
            transition: 'all 0.3s ease',
            overflow: 'hidden',
            padding: sidebarOpen ? '24px 0' : '0',
          }}>
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 24px', margin: '2px 8px', borderRadius: '10px',
                    background: active ? 'rgba(245,197,24,0.1)' : 'transparent',
                    borderLeft: active ? '3px solid #f5c518' : '3px solid transparent',
                    color: active ? '#f5c518' : '#a0a0a0',
                    fontWeight: active ? 700 : 400,
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#a0a0a0'; }}
                  >
                    <span style={{ fontSize: '18px' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </aside>

          <main style={{
            flex: 1, padding: '32px',
            animation: 'fadeSlideUp 0.4s ease forwards',
            overflowY: 'auto',
          }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}