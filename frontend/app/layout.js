'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import './globals.css';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', svgIcon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { label: 'Groups',    href: '/groups',    svgIcon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { label: 'Tasks',     href: '/tasks',     svgIcon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { label: 'Rewards',   href: '/rewards',   svgIcon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { label: 'Settings',  href: '/settings',  svgIcon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z' },
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

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [coins, setCoins] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [toast, setToast] = useState('');

  const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
  const isAuthPage = authRoutes.some(route => pathname.startsWith(route));

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch (e) { localStorage.removeItem('user'); }
    }
    if (!token && !isAuthPage) router.push('/login');

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
      {/*removed overflow:hidden from body — it was blocking ALL page scrolling */}
      <body style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        {isNavigating && <PageLoader />}

        {/* SUCCESS TOAST */}
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
            {/* Animated Hamburger */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px', display: 'flex', flexDirection: 'column', gap: '5px' }}
            >
              <span style={{ display: 'block', width: '22px', height: '2px', background: '#fff', borderRadius: '2px', transition: 'all 0.3s', transform: sidebarOpen ? 'rotate(45deg) translateY(7px)' : 'none' }} />
              <span style={{ display: 'block', width: '22px', height: '2px', background: '#fff', borderRadius: '2px', transition: 'all 0.3s', opacity: sidebarOpen ? 0 : 1 }} />
              <span style={{ display: 'block', width: '22px', height: '2px', background: '#fff', borderRadius: '2px', transition: 'all 0.3s', transform: sidebarOpen ? 'rotate(-45deg) translateY(-7px)' : 'none' }} />
            </button>

            {/* Back / Forward buttons */}
            <div style={{ display: 'flex', gap: '2px' }}>
              <button
                onClick={() => router.back()}
                title="Go back"
                style={{
                  background: 'none', border: 'none', color: '#a0a0a0', cursor: 'pointer',
                  padding: '6px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#a0a0a0'; }}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                onClick={() => router.forward()}
                title="Go forward"
                style={{
                  background: 'none', border: 'none', color: '#a0a0a0', cursor: 'pointer',
                  padding: '6px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#a0a0a0'; }}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>

            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#f5c518' }}>🐝 QuestHive</span>
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(245,197,24,0.1)', border: '1px solid rgba(245,197,24,0.3)',
              borderRadius: '999px', padding: '5px 12px',
            }}>
              <span>🪙</span>
              <span style={{ color: '#f5c518', fontWeight: 700, fontSize: '14px' }}>{coins}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: '#f5c518', color: '#000',
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

        {/* BODY: flex row, fills remaining height, overflow hidden so children control their own scroll */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

          {/* SIDEBAR — fixed height, never scrolls itself. Only inner nav scrolls if needed */}
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
            {/* Nav items — scrolls if items overflow */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              paddingTop: sidebarOpen ? '20px' : '0',
              overflowX: 'hidden',
              minHeight: 0,
            }}>
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
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#a0a0a0'; e.currentTarget.style.background = 'transparent'; }}}
                    >
                      <SvgIcon path={item.svgIcon} />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* User info pinned at bottom of sidebar */}
            {sidebarOpen && (
              <div style={{ padding: '16px 20px 20px', flexShrink: 0 }}>
                <div style={{
                  padding: '12px', borderRadius: '12px',
                  background: 'rgba(245,197,24,0.05)', border: '1px solid #2a2a2a',
                }}>
                  <div style={{ fontSize: '11px', color: '#555', marginBottom: '2px' }}>Logged in as</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.fullName || user?.username || 'User'}
                  </div>
                </div>
              </div>
            )}
          </aside>

          {/* MAIN CONTENT — this is the only scrollable area */}
          <main style={{
            flex: 1,
            minHeight: 0,        
            minWidth: 0,         
            overflowY: 'auto',   /* vertical scroll */
            overflowX: 'auto',   /* horizontal scroll */
            padding: '28px 32px',
            animation: 'fadeSlideUp 0.35s ease forwards',
          }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}