'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { resetPassword } from '@/lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get('email') || '';

  const [form, setForm] = useState({ email: emailFromQuery, otp: '', newPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await resetPassword(form);
      setSuccess('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP or something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0f0f0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#1a1a1a', borderRadius: '20px',
        border: '1px solid #2a2a2a', padding: '48px',
        width: '100%', maxWidth: '420px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔑</div>
          <h1 style={{ color: '#f5c518', fontSize: '28px', fontWeight: 800 }}>Reset Password</h1>
          <p style={{ color: '#a0a0a0', marginTop: '4px' }}>Enter the OTP sent to your email</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ color: '#a0a0a0', fontSize: '13px', marginBottom: '6px', display: 'block' }}>Email</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label style={{ color: '#a0a0a0', fontSize: '13px', marginBottom: '6px', display: 'block' }}>OTP Code</label>
            <input
              className="input"
              type="text"
              placeholder="Enter 6-digit OTP"
              value={form.otp}
              onChange={e => setForm({ ...form, otp: e.target.value })}
              required
            />
          </div>
          <div>
            <label style={{ color: '#a0a0a0', fontSize: '13px', marginBottom: '6px', display: 'block' }}>New Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={form.newPassword}
              onChange={e => setForm({ ...form, newPassword: e.target.value })}
              required
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444',
              borderRadius: '8px', padding: '10px 14px', color: '#ef4444', fontSize: '13px',
            }}>{error}</div>
          )}

          {success && (
            <div style={{
              background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e',
              borderRadius: '8px', padding: '10px 14px', color: '#22c55e', fontSize: '13px',
            }}>{success}</div>
          )}

          <button className="btn-primary" type="submit" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
            {loading ? '⏳ Resetting...' : '🔑 Reset Password'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', color: '#a0a0a0', fontSize: '14px' }}>
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