'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/lib/api';

/* ── Floating animated task card ── */
const CARDS = [
  { title: 'Design system audit', user: 'Priya', coins: 25, status: 'done',     top: '12%',  left: '8%',  delay: 0 },
  { title: 'Write sprint retro',  user: 'Aryan', coins: 15, status: 'progress', top: '28%',  left: '62%', delay: 0.6 },
  { title: 'Fix login redirect',  user: 'Meera', coins: 20, status: 'done',     top: '52%',  left: '4%',  delay: 1.1 },
  { title: 'Update API docs',     user: 'Rohan', coins: 10, status: 'pending',  top: '67%',  left: '58%', delay: 0.3 },
  { title: 'Code review PR #42',  user: 'Sneha', coins: 30, status: 'done',     top: '80%',  left: '20%', delay: 0.9 },
  { title: 'Team standup notes',  user: 'Dev',   coins: 12, status: 'progress', top: '18%',  left: '38%', delay: 1.5 },
];

const STATUS_COLOR = { done: '#22c55e', progress: '#3b82f6', pending: '#6b7280' };
const STATUS_LABEL = { done: 'Completed', progress: 'In Progress', pending: 'Pending' };

function FloatingCard({ card, index }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), card.delay * 1000 + 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position: 'absolute',
      top: card.top, left: card.left,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.95)',
      transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1)',
      animation: visible ? `floatY${index % 3} ${4 + index * 0.4}s ease-in-out infinite` : 'none',
      zIndex: 1,
      pointerEvents: 'none',
      width: '200px',
    }}>
      <div style={{
        background: 'rgba(18,18,28,0.85)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        padding: '12px 14px',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <div style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: STATUS_COLOR[card.status],
            boxShadow: `0 0 6px ${STATUS_COLOR[card.status]}`,
            flexShrink: 0,
          }} />
          <span style={{ fontSize: '10px', fontWeight: 600, color: STATUS_COLOR[card.status] }}>
            {STATUS_LABEL[card.status]}
          </span>
        </div>
        <p style={{ fontSize: '12px', fontWeight: 600, color: '#e0e0f0', margin: '0 0 6px', lineHeight: 1.3 }}>
          {card.title}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: '#555570' }}>{card.user}</span>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#f5c518' }}>+{card.coins} coins</span>
        </div>
      </div>
    </div>
  );
}

/* ── Typing headline ── */
const HEADLINES = ['Assign tasks.', 'Track progress.', 'Earn rewards.', 'Level up together.'];
function TypingHeadline() {
  const [lineIdx, setLineIdx] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const target = HEADLINES[lineIdx];
    if (!deleting && displayed.length < target.length) {
      const t = setTimeout(() => setDisplayed(target.slice(0, displayed.length + 1)), 60);
      return () => clearTimeout(t);
    }
    if (!deleting && displayed.length === target.length) {
      if (lineIdx === HEADLINES.length - 1) { setDone(true); return; }
      const t = setTimeout(() => setDeleting(true), 1400);
      return () => clearTimeout(t);
    }
    if (deleting && displayed.length > 0) {
      const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 30);
      return () => clearTimeout(t);
    }
    if (deleting && displayed.length === 0) {
      setDeleting(false);
      setLineIdx(i => i + 1);
    }
  }, [displayed, deleting, lineIdx, done]);

  return (
    <span style={{ color: 'var(--accent)' }}>
      {displayed}
      {!done && <span style={{ animation: 'blink 1s step-end infinite', opacity: 1, color: 'var(--accent)' }}>|</span>}
    </span>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('coins', res.data.user?.coins || 0);
      localStorage.setItem('loginSuccess', 'true');
      document.cookie = `token=${res.data.token}; path=/; max-age=86400`;
      document.cookie = `role=${res.data.user?.role || 'MEMBER'}; path=/; max-age=86400`;
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes floatY0 { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-10px)} }
        @keyframes floatY1 { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-7px)} }
        @keyframes floatY2 { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-13px)} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        fontFamily: "'Inter', sans-serif",
      }}>

        {/* ── LEFT: Login form ── */}
        <div style={{
          flex: '0 0 420px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 52px',
          borderRight: '1px solid var(--border)',
          minHeight: '100vh',
          position: 'relative',
          zIndex: 10,
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '44px' }}>
            <div style={{
              width: '34px', height: '34px',
              background: 'var(--accent)',
              borderRadius: '9px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(245,197,24,0.3)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: '17px', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>QuestHive</span>
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px', letterSpacing: '-0.4px' }}>
            Sign in
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
            No account?{' '}
            <Link href="/request-access" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
              Request access
            </Link>
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '7px', letterSpacing: '0.2px' }}>
                Email address
              </label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
                autoFocus
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.2px' }}>
                  Password
                </label>
                <Link href="/forgot-password" style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  style={{ paddingRight: '44px' }}
                />
                <button type="button" onClick={() => setShowPassword(p => !p)} style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 0,
                }}>
                  {showPassword
                    ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '8px', padding: '10px 14px', color: '#ef4444',
                fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              background: loading ? 'var(--bg-elevated)' : 'var(--accent)',
              color: loading ? 'var(--text-muted)' : '#000',
              border: 'none', borderRadius: '10px', padding: '12px 20px',
              fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s', marginTop: '4px',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(245,197,24,0.25)',
            }}>
              {loading
                ? <><span style={{ width: '14px', height: '14px', border: '2px solid var(--text-muted)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />Signing in...</>
                : 'Sign in'
              }
            </button>
          </form>
        </div>

        {/* ── RIGHT: Animated panel ── */}
        <div style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--bg-card)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Glow blobs */}
          <div style={{ position: 'absolute', top: '-15%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(245,197,24,0.08) 0%, transparent 65%)', borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-10%', left: '-5%',  width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 65%)', borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '40%', left: '30%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(34,197,94,0.04) 0%, transparent 65%)', borderRadius: '50%', pointerEvents: 'none' }} />

          {/* Floating task cards */}
          {CARDS.map((card, i) => <FloatingCard key={i} card={card} index={i} />)}

          {/* Center content */}
          <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '380px', padding: '0 24px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'rgba(245,197,24,0.08)', border: '1px solid rgba(245,197,24,0.2)',
              borderRadius: '999px', padding: '5px 14px', marginBottom: '20px',
            }}>
              <span style={{ width: '6px', height: '6px', background: 'var(--accent)', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px var(--accent)' }} />
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.2px' }}>Task management, gamified</span>
            </div>

            <h2 style={{ fontSize: '34px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px', letterSpacing: '-0.8px', lineHeight: 1.15, minHeight: '84px' }}>
              <TypingHeadline />
            </h2>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '28px' }}>
              Turn everyday responsibilities into quests your team actually wants to complete.
            </p>

            {/* Live stat strip */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              {[
                { value: '10', label: 'Active users', color: '#22c55e' },
                { value: '34',  label: 'Tasks tracked', color: 'var(--accent)' },
                { value: '68%', label: 'Completion rate', color: '#818cf8' },
              ].map((s, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '12px', padding: '12px 16px', textAlign: 'center', minWidth: '90px',
                }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
