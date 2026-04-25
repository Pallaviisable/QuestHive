'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/lib/api';

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
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0f0f0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}>
      <div className="animate-fadeSlideUp" style={{
        background: '#1a1a1a', borderRadius: '20px',
        border: '1px solid #2a2a2a', padding: '40px 36px',
        width: '100%', maxWidth: '420px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '44px', marginBottom: '8px' }}>🐝</div>
          <h1 style={{ color: '#f5c518', fontSize: '26px', fontWeight: 800 }}>QuestHive</h1>
          <p style={{ color: '#a0a0a0', marginTop: '4px', fontSize: '14px' }}>Welcome back, hive member!</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ color: '#a0a0a0', fontSize: '13px', marginBottom: '6px', display: 'block' }}>Email</label>
            <input className="input" type="email" placeholder="you@example.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>

          <div>
            <label style={{ color: '#a0a0a0', fontSize: '13px', marginBottom: '6px', display: 'block' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                style={{ paddingRight: '48px', width: '100%', boxSizing: 'border-box' }}
              />
              {/*
                FIXED convention:
                  showPassword=false → password is HIDDEN  → show CLOSED (slashed) eye
                  showPassword=true  → password is VISIBLE → show OPEN eye
              */}
              <button type="button" onClick={() => setShowPassword(prev => !prev)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  color: '#a0a0a0', display: 'flex', alignItems: 'center',
                }}>
                {showPassword ? (
                  /* Password is VISIBLE → open eye → click to hide */
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  /* Password is HIDDEN → slashed eye → click to show */
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444',
              borderRadius: '8px', padding: '10px 14px', color: '#ef4444', fontSize: '13px',
            }}>{error}</div>
          )}

          <button className="btn-primary" type="submit" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '16px', height: '16px', border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                Logging in...
              </span>
            ) : 'Login →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', color: '#a0a0a0', fontSize: '14px' }}>
          <Link href="/forgot-password" style={{ color: '#f5c518', textDecoration: 'none' }}>Forgot password?</Link>
          <span style={{ margin: '0 12px' }}>•</span>
          <Link href="/register" style={{ color: '#f5c518', textDecoration: 'none' }}>Create account</Link>
        </div>
      </div>
    </div>
  );
}