'use client';
import { useEffect, useState, useRef } from 'react';
import { getNotifications, markAllRead, markNotificationRead } from '@/lib/api';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import FeedbackButton from '@/components/FeedbackButton';
import './globals.css';

const memberNavItems = [
  { label: 'Dashboard', href: '/dashboard', svgIcon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { label: 'Groups',    href: '/groups',    svgIcon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { label: 'Tasks',     href: '/tasks',     svgIcon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { label: 'Rewards',   href: '/rewards',   svgIcon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { label: 'Settings',  href: '/settings',  svgIcon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

// Bug #4: Superadmin gets proper navigation
const superAdminNavItems = [
  { label: 'Console',   href: '/superadmin',            svgIcon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { label: 'Analytics', href: '/superadmin/analytics',  svgIcon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { label: 'Dashboard', href: '/dashboard',             svgIcon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
];

function SvgIcon({ path, size = 18 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8"
      viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

function PageLoader() {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: '3px',
      background: 'linear-gradient(90deg, #f5c518, #fff8dc, #f5c518)',
      backgroundSize: '200% 100%',
      animation: 'loaderSlide 1s linear infinite',
      zIndex: 9999,
    }} />
  );
}

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW failed:', err));
  });
}

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [coins, setCoins] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [toast, setToast] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef(null);
  const stompRef = useRef(null);

  const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/request-access', '/invite-preview', '/superadmin'];
  const isAuthPage = authRoutes.some(route => pathname.startsWith(route));

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch (e) { localStorage.removeItem('user'); }
    }
    if (!token && !isAuthPage) router.push('/login');

    // Fetch notifications
    const storedUser = stored ? (() => { try { return JSON.parse(stored); } catch(e) { return null; } })() : null;
    if (token && storedUser) {
      getNotifications().then(res => {
        setNotifications(res.data);
        setUnreadCount(res.data.filter(n => !n.read).length);
      }).catch(() => {});

      // WebSocket for real-time notifications (polling fallback — no Turbopack issues)
      if (!stompRef.current) {
        stompRef.current = true;
        const pollNotifications = () => {
          getNotifications().then(res => {
            setNotifications(res.data);
            setUnreadCount(res.data.filter(n => !n.read).length);
          }).catch(() => {});
        };
        const interval = setInterval(pollNotifications, 15000);
        stompRef.current = interval;
      }
    }

    const loginSuccess = localStorage.getItem('loginSuccess');
    if (loginSuccess) {
      setToast('Login successful! Welcome back 🐝');
      localStorage.removeItem('loginSuccess');
      setTimeout(() => setToast(''), 3500);
    }
  }, [pathname]);

  useEffect(() => {
    const stored = localStorage.getItem('coins');
    if (stored) setCoins(parseInt(stored));
  }, [pathname]);

  useEffect(() => {
    setIsNavigating(true);
    const t = setTimeout(() => setIsNavigating(false), 600);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpenNotifications = async () => {
    setShowNotifDropdown(v => !v);
    if (!showNotifDropdown && unreadCount > 0) {
      await markAllRead().catch(() => {});
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

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

  // Bug #4: pick correct nav based on role
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const navItems = isSuperAdmin ? superAdminNavItems : memberNavItems;

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f5c518" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        {isNavigating && <PageLoader />}

        {toast && (
          <div style={{
            position: 'fixed', top: '72px', left: '50%', transform: 'translateX(-50%)',
            background: '#22c55e', color: '#fff', borderRadius: '12px',
            padding: '12px 24px', fontWeight: 600, fontSize: '14px',
            zIndex: 9998, boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            animation: 'fadeSlideUp 0.3s ease',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            ✓ {toast}
          </div>
        )}

        {/* TOP NAVBAR */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 150,
          background: 'rgba(17,17,17,0.97)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid #2a2a2a',
          padding: '0 20px',
          height: '60px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px', display: 'flex', flexDirection: 'column', gap: '5px' }}
            >
              <span style={{ display: 'block', width: '22px', height: '2px', background: '#fff', borderRadius: '2px', transition: 'all 0.3s', transform: sidebarOpen ? 'rotate(45deg) translateY(7px)' : 'none' }} />
              <span style={{ display: 'block', width: '22px', height: '2px', background: '#fff', borderRadius: '2px', transition: 'all 0.3s', opacity: sidebarOpen ? 0 : 1 }} />
              <span style={{ display: 'block', width: '22px', height: '2px', background: '#fff', borderRadius: '2px', transition: 'all 0.3s', transform: sidebarOpen ? 'rotate(-45deg) translateY(-7px)' : 'none' }} />
            </button>

            <div style={{ display: 'flex', gap: '2px' }}>
              <button onClick={() => router.back()} title="Go back"
                style={{ background: 'none', border: 'none', color: '#a0a0a0', cursor: 'pointer', padding: '6px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <button onClick={() => router.forward()} title="Go forward"
                style={{ background: 'none', border: 'none', color: '#a0a0a0', cursor: 'pointer', padding: '6px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>

            <Link href={isSuperAdmin ? '/superadmin' : '/dashboard'} style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#f5c518' }}>
                🐝 QuestHive {isSuperAdmin && <span style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 600, marginLeft: '6px' }}>ADMIN</span>}
              </span>
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {!isSuperAdmin && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'rgba(245,197,24,0.1)', border: '1px solid rgba(245,197,24,0.3)',
                borderRadius: '999px', padding: '5px 12px',
              }}>
                <span>🪙</span>
                <span style={{ color: '#f5c518', fontWeight: 700, fontSize: '14px' }}>{coins}</span>
              </div>
            )}
            {/* Bell Notification Icon */}
            {!isSuperAdmin && (
              <div ref={notifRef} style={{ position: 'relative' }}>
                <button onClick={handleOpenNotifications} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#a0a0a0', padding: '6px', borderRadius: '8px',
                  display: 'flex', alignItems: 'center', position: 'relative',
                  transition: 'color 0.2s',
                }} onMouseEnter={e => e.currentTarget.style.color='#f5c518'}
                   onMouseLeave={e => e.currentTarget.style.color='#a0a0a0'}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
                  </svg>
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute', top: '2px', right: '2px',
                      background: '#ef4444', color: '#fff',
                      borderRadius: '999px', fontSize: '10px', fontWeight: 700,
                      minWidth: '16px', height: '16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 3px', lineHeight: 1,
                    }}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                  )}
                </button>

                {showNotifDropdown && (
                  <div style={{
                    position: 'absolute', top: '44px', right: 0,
                    width: '320px', maxHeight: '420px',
                    background: '#1a1a1a', border: '1px solid #2a2a2a',
                    borderRadius: '14px', overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 999,
                  }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid #2a2a2a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: '#fff', fontSize: '14px' }}>🔔 Notifications</span>
                      <span style={{ fontSize: '11px', color: '#555' }}>{notifications.filter(n=>!n.read).length === 0 ? 'All caught up!' : `${notifications.filter(n=>!n.read).length} unread`}</span>
                    </div>
                    <div style={{ overflowY: 'auto', maxHeight: '360px' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '32px', textAlign: 'center', color: '#555', fontSize: '13px' }}>
                          No notifications yet 🐝
                        </div>
                      ) : notifications.slice(0, 30).map(n => (
                        <div key={n.id} style={{
                          padding: '12px 16px', borderBottom: '1px solid #222',
                          background: n.read ? 'transparent' : 'rgba(245,197,24,0.04)',
                          cursor: 'pointer', transition: 'background 0.2s',
                        }} onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.04)'}
                           onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(245,197,24,0.04)'}>
                          <div style={{ fontWeight: 600, fontSize: '13px', color: '#fff', marginBottom: '3px' }}>{n.title}</div>
                          <div style={{ fontSize: '12px', color: '#a0a0a0', lineHeight: 1.4 }}>{n.body}</div>
                          <div style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>
                            {new Date(n.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: isSuperAdmin ? '#a78bfa' : '#f5c518', color: '#000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '13px',
              }}>
                {user?.fullName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <button onClick={handleLogout} className="btn-outline" style={{ padding: '5px 12px', fontSize: '12px' }}>
                Logout
              </button>
            </div>
          </div>
        </nav>

        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <aside style={{
            width: sidebarOpen ? '220px' : '0px',
            minWidth: sidebarOpen ? '220px' : '0px',
            background: '#111',
            borderRight: '1px solid #2a2a2a',
            transition: 'all 0.3s ease',
            overflow: 'hidden',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ flex: 1, overflowY: 'auto', paddingTop: sidebarOpen ? '20px' : '0', overflowX: 'hidden', minHeight: 0 }}>
              {navItems.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '11px 20px', margin: '2px 10px', borderRadius: '10px',
                      background: active ? 'rgba(245,197,24,0.12)' : 'transparent',
                      borderLeft: active ? '3px solid #f5c518' : '3px solid transparent',
                      color: active ? '#f5c518' : '#a0a0a0',
                      fontWeight: active ? 700 : 400,
                      transition: 'all 0.2s', cursor: 'pointer',
                      whiteSpace: 'nowrap', fontSize: '14px',
                    }}>
                      <SvgIcon path={item.svgIcon} />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {sidebarOpen && (
              <div style={{ padding: '16px 20px 20px', flexShrink: 0 }}>
                <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(245,197,24,0.05)', border: '1px solid #2a2a2a' }}>
                  <div style={{ fontSize: '11px', color: '#555', marginBottom: '2px' }}>
                    {isSuperAdmin ? '👑 Super Admin' : 'Logged in as'}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.fullName || user?.username || 'User'}
                  </div>
                </div>
              </div>
            )}
          </aside>

          <main style={{
            flex: 1, minHeight: 0, minWidth: 0,
            overflowY: 'auto', overflowX: 'auto',
            padding: '28px 32px',
            animation: 'fadeSlideUp 0.35s ease forwards',
          }}>
            {children}
          </main>
        </div>
      <FeedbackButton />
      </body>
    </html>
  );
}
