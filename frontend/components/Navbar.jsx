'use client';
import Link from 'next/link';

/**
 * Presentational top navbar. All state (user, coins, notifications, sidebar
 * toggle, streak summary, unread chat count) is owned by app/layout.js and
 * passed down as props — this component only renders and calls handlers.
 */
export default function Navbar({
  user,
  isSuperAdmin,
  coins,
  streakCount = 0,       // current streak day count; pass 0/undefined to hide the flame pill
  unreadDmCount = 0,      // unread personal-chat message count; pass 0 to hide the badge
  sidebarOpen,
  onToggleSidebar,
  onBack,
  onForward,
  notifications,
  unreadCount,
  showNotifDropdown,
  notifRef,
  onOpenNotifications,
  onLogout,
}) {
  return (
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
          onClick={onToggleSidebar}
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px', display: 'flex', flexDirection: 'column', gap: '5px' }}
        >
          <span style={{ display: 'block', width: '22px', height: '2px', background: '#fff', borderRadius: '2px', transition: 'all 0.3s', transform: sidebarOpen ? 'rotate(45deg) translateY(7px)' : 'none' }} />
          <span style={{ display: 'block', width: '22px', height: '2px', background: '#fff', borderRadius: '2px', transition: 'all 0.3s', opacity: sidebarOpen ? 0 : 1 }} />
          <span style={{ display: 'block', width: '22px', height: '2px', background: '#fff', borderRadius: '2px', transition: 'all 0.3s', transform: sidebarOpen ? 'rotate(-45deg) translateY(-7px)' : 'none' }} />
        </button>

        <div style={{ display: 'flex', gap: '2px' }}>
          <button onClick={onBack} title="Go back"
            style={{ background: 'none', border: 'none', color: '#a0a0a0', cursor: 'pointer', padding: '6px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button onClick={onForward} title="Go forward"
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
        {!isSuperAdmin && streakCount > 0 && (
          <Link href="/dashboard#streak" style={{ textDecoration: 'none' }} title={`${streakCount}-day streak`}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)',
              borderRadius: '999px', padding: '5px 12px',
            }}>
              <span>🔥</span>
              <span style={{ color: '#f97316', fontWeight: 700, fontSize: '14px' }}>{streakCount}</span>
            </div>
          </Link>
        )}

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

        {!isSuperAdmin && (
          <Link href="/chat" style={{ textDecoration: 'none', position: 'relative' }} title="Messages">
            <button style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#a0a0a0', padding: '6px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', position: 'relative',
            }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
              </svg>
              {unreadDmCount > 0 && (
                <span style={{
                  position: 'absolute', top: '2px', right: '2px',
                  background: '#ef4444', color: '#fff',
                  borderRadius: '999px', fontSize: '10px', fontWeight: 700,
                  minWidth: '16px', height: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 3px', lineHeight: 1,
                }}>{unreadDmCount > 99 ? '99+' : unreadDmCount}</span>
              )}
            </button>
          </Link>
        )}

        {!isSuperAdmin && (
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button onClick={onOpenNotifications} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#a0a0a0', padding: '6px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', position: 'relative',
              transition: 'color 0.2s',
            }} onMouseEnter={e => e.currentTarget.style.color = '#f5c518'}
               onMouseLeave={e => e.currentTarget.style.color = '#a0a0a0'}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
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
                  <span style={{ fontSize: '11px', color: '#555' }}>{notifications.filter(n => !n.read).length === 0 ? 'All caught up!' : `${notifications.filter(n => !n.read).length} unread`}</span>
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
                    }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
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
          <Link href="/profile" style={{ textDecoration: 'none' }} title="Profile">
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: isSuperAdmin ? '#a78bfa' : '#f5c518', color: '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '13px', cursor: 'pointer',
            }}>
              {user?.fullName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
          </Link>
          <button onClick={onLogout} className="btn-outline" style={{ padding: '5px 12px', fontSize: '12px' }}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
