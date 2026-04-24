'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register, verifyEmail } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '' });
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('register');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateEmail(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      setStep('verify');
      setSuccess('OTP sent to ' + form.email + '. Please check your inbox.');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyEmail({ email: form.email, otp });
      setSuccess('Email verified! Redirecting to login...');
      setTimeout(() => router.push('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0f0f0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="animate-fadeSlideUp" style={{
        background: '#1a1a1a', borderRadius: '20px',
        border: '1px solid #2a2a2a', padding: '48px',
        width: '100%', maxWidth: '420px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🐝</div>
          <h1 style={{ color: '#f5c518', fontSize: '28px', fontWeight: 800 }}>
            {step === 'register' ? 'Join the Hive' : 'Verify Your Email'}
          </h1>
          <p style={{ color: '#a0a0a0', marginTop: '4px' }}>
            {step === 'register' ? 'Create your account' : `Enter the OTP sent to ${form.email}`}
          </p>
        </div>

        {/* STEP 1 — Register form */}
        {step === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { key: 'fullName', label: 'Full Name', type: 'text', placeholder: 'Pallavi Sable' },
              { key: 'username', label: 'Username', type: 'text', placeholder: 'pallavi123' },
              { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
            ].map(field => (
              <div key={field.key}>
                <label style={{ color: '#a0a0a0', fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                  {field.label}
                </label>
                <input
                  className="input"
                  type={field.type}
                  placeholder={field.placeholder}
                  value={form[field.key]}
                  onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                  required
                />
              </div>
            ))}

            {/* Password field with eye toggle */}
            <div>
              <label style={{ color: '#a0a0a0', fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  style={{ paddingRight: '44px', width: '100%', boxSizing: 'border-box' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: 0,
                    color: '#a0a0a0', lineHeight: 1,
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
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
              style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
              {loading ? '⏳ Sending OTP...' : '🐝 Create Account'}
            </button>
          </form>
        )}

        {/* STEP 2 — OTP verification */}
        {step === 'verify' && (
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {success && (
              <div style={{
                background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e',
                borderRadius: '8px', padding: '10px 14px', color: '#22c55e', fontSize: '13px',
              }}>{success}</div>
            )}

            <div>
              <label style={{ color: '#a0a0a0', fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                Enter OTP
              </label>
              <input
                className="input"
                type="text"
                placeholder="123456"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                maxLength={6}
                required
                style={{ letterSpacing: '8px', fontSize: '20px', textAlign: 'center' }}
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444',
                borderRadius: '8px', padding: '10px 14px', color: '#ef4444', fontSize: '13px',
              }}>{error}</div>
            )}

            <button className="btn-primary" type="submit" disabled={loading}
              style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? '⏳ Verifying...' : '✅ Verify Email'}
            </button>

            <button type="button" onClick={() => { setStep('register'); setError(''); setSuccess(''); }}
              style={{ background: 'none', border: 'none', color: '#a0a0a0', cursor: 'pointer', fontSize: '13px' }}>
              ← Back to register
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '24px', color: '#a0a0a0', fontSize: '14px' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#f5c518', textDecoration: 'none' }}>Login</Link>
        </div>
      </div>
    </div>
  );
}