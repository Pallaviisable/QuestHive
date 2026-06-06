'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { forgotPassword } from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      await forgotPassword(email);
      setSent(true);
      setSuccess('OTP sent to your email!');
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#1a1a1a', borderRadius: '20px', border: '1px solid #2a2a2a', padding: '48px', width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔐</div>
          <h1 style={{ color: '#f5c518', fontSize: '28px', fontWeight: 800 }}>Forgot Password</h1>
          <p style={{ color: '#a0a0a0', marginTop: '4px' }}>Enter your email to receive an OTP</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ color: '#a0a0a0', fontSize: '13px', marginBottom: '6px', display: 'block' }}>
              Email <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input className="input" type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '8px', padding: '10px 14px', color: '#ef4444', fontSize: '13px' }}>
              {error}
              {error.toLowerCase().includes('expired') && (
                <button type="button" onClick={handleSubmit}
                  style={{ display: 'block', marginTop: '8px', background: 'none', border: 'none', color: '#f5c518', fontSize: '13px', cursor: 'pointer', fontWeight: 600, padding: 0 }}>
                  🔄 Resend OTP
                </button>
              )}
            </div>
          )}

          {success && (
            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', borderRadius: '8px', padding: '10px 14px', color: '#22c55e', fontSize: '13px' }}>
              {success}
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
            {loading ? '⏳ Sending...' : sent ? '🔄 Resend OTP' : '📧 Send OTP'}
          </button>

          {sent && (
            <button type="button" onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}`)}
              style={{ background: 'none', border: '1px solid #2a2a2a', color: '#a0a0a0', borderRadius: '10px', padding: '10px', fontSize: '13px', cursor: 'pointer', width: '100%' }}>
              Already have an OTP? Enter it →
            </button>
          )}
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px' }}>
          <Link href="/login" style={{ color: '#f5c518', textDecoration: 'none' }}>← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
