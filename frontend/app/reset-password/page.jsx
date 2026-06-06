'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { resetPassword, resendOtp } from '@/lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get('email') || '';

  const [form, setForm] = useState({ email: emailFromQuery, otp: '', newPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  const isExpired = error.toLowerCase().includes('expired');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      await resetPassword(form);
      setSuccess('Password reset! Redirecting to login...');
      setTimeout(() => router.push('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP or something went wrong.');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (!form.email) { setError('Enter your email first.'); return; }
    setResending(true); setResendMsg(''); setError('');
    try {
      await resendOtp(form.email);
      setResendMsg('New OTP sent! Check your email.');
      setForm(f => ({ ...f, otp: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally { setResending(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#13131a', borderRadius: '20px', border: '1px solid #1e1e2e', padding: '48px', width: '100%', maxWidth: '420px', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔑</div>
          <h1 style={{ color: '#f5c518', fontSize: '28px', fontWeight: 800 }}>Reset Password</h1>
          <p style={{ color: '#8888aa', marginTop: '4px', fontSize: '14px' }}>Enter the OTP sent to your email</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="field-label">Email</label>
            <input className="input" type="email" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
              <label className="field-label" style={{ margin: 0 }}>OTP Code</label>
              <button type="button" onClick={handleResend} disabled={resending}
                style={{ background: 'none', border: 'none', color: '#f5c518', fontSize: '12px', cursor: 'pointer', fontWeight: 600, padding: 0, opacity: resending ? 0.6 : 1 }}>
                {resending ? '⏳ Sending...' : '🔄 Resend OTP'}
              </button>
            </div>
            <input className="input" type="text" placeholder="Enter 6-digit OTP"
              value={form.otp} onChange={e => setForm({ ...form, otp: e.target.value })} required />
          </div>

          <div>
            <label className="field-label">New Password</label>
            <input className="input" type="password" placeholder="••••••••"
              value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} required />
          </div>

          {error && (
            <div style={{ background: isExpired ? 'rgba(245,197,24,0.08)' : 'rgba(239,68,68,0.1)', border: `1px solid ${isExpired ? '#f5c518' : '#ef4444'}`, borderRadius: '10px', padding: '10px 14px', color: isExpired ? '#f5c518' : '#ef4444', fontSize: '13px' }}>
              {error}
              {isExpired && (
                <button type="button" onClick={handleResend}
                  style={{ display: 'block', marginTop: '8px', background: 'none', border: 'none', color: '#f5c518', fontSize: '13px', cursor: 'pointer', fontWeight: 700, padding: 0, textDecoration: 'underline' }}>
                  Click here to get a new OTP →
                </button>
              )}
            </div>
          )}

          {resendMsg && (
            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '10px', padding: '10px 14px', color: '#22c55e', fontSize: '13px' }}>
              ✓ {resendMsg}
            </div>
          )}

          {success && (
            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '10px', padding: '10px 14px', color: '#22c55e', fontSize: '13px' }}>
              {success}
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}>
            {loading ? '⏳ Resetting...' : '🔑 Reset Password'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px' }}>
          <Link href="/login" style={{ color: '#f5c518', textDecoration: 'none' }}>← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ color: '#fff', textAlign: 'center', marginTop: '100px' }}>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
