'use client';
import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { validateInvite, registerWithInvite } from '@/lib/api';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [invite, setInvite] = useState(null);
  const [form, setForm] = useState({ fullName: '', username: '', password: '' });
  const [captchaToken, setCaptchaToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState('');
  const captchaRef = useRef(null);

  const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;

  useEffect(() => {
    if (!token) {
      setError('No invite token found. You need an invite link to register on QuestHive.');
      setValidating(false);
      return;
    }
    validateInvite(token)
      .then(res => {
        if (res.data.alreadyRegistered) { router.push('/login'); return; }
        setInvite(res.data);
        setValidating(false);
      })
      .catch(err => {
        setError(err.response?.data?.message || 'This invite link is invalid or has expired.');
        setValidating(false);
      });
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (siteKey && !captchaToken) { setError('Please complete the CAPTCHA.'); return; }
    setLoading(true);
    try {
      await registerWithInvite({
        fullName: form.fullName,
        username: form.username,
        email: invite.email,
        password: form.password,
        inviteToken: token,
        captchaToken,
      });
      router.push('/login?registered=true');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      captchaRef.current?.resetCaptcha();
      setCaptchaToken('');
    } finally {
      setLoading(false);
    }
  };

  if (validating) return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #f5c518', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#f5c518' }}>Validating your invite...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="animate-fadeSlideUp" style={{ background: '#1a1a1a', borderRadius: '20px', border: '1px solid #2a2a2a', padding: '48px', width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🐝</div>
          <h1 style={{ color: '#f5c518', fontSize: '26px', fontWeight: 800 }}>
            {error ? 'Invalid Invite' : 'Join the Hive'}
          </h1>
          {invite?.groupName && (
            <p style={{ color: '#a0a0a0', marginTop: '6px', fontSize: '14px' }}>
              Joining <strong style={{ color: '#f5c518' }}>{invite.groupName}</strong>
            </p>
          )}
        </div>

        {error ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '10px', padding: '16px', color: '#ef4444', fontSize: '14px', marginBottom: '20px' }}>
              {error}
            </div>
            <p style={{ color: '#a0a0a0', fontSize: '13px', marginBottom: '16px' }}>
              You need a valid invite link to create an account.
            </p>
            <Link href="/login" style={{ color: '#f5c518', fontSize: '14px' }}>← Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ color: '#a0a0a0', fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                Email <span style={{ color: '#555', fontSize: '11px' }}>(from your invite)</span>
              </label>
              <input className="input" type="email" value={invite?.email || ''} readOnly
                style={{ opacity: 0.6, cursor: 'not-allowed' }} />
            </div>

            {[
              { key: 'fullName', label: 'Full Name', type: 'text', placeholder: 'Your full name' },
              { key: 'username', label: 'Username', type: 'text', placeholder: 'Choose a username' },
            ].map(field => (
              <div key={field.key}>
                <label style={{ color: '#a0a0a0', fontSize: '13px', marginBottom: '6px', display: 'block' }}>{field.label}</label>
                <input className="input" type={field.type} placeholder={field.placeholder}
                  value={form[field.key]} onChange={e => setForm({ ...form, [field.key]: e.target.value })} required />
              </div>
            ))}

            <div>
              <label style={{ color: '#a0a0a0', fontSize: '13px', marginBottom: '6px', display: 'block' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  required style={{ paddingRight: '48px', width: '100%', boxSizing: 'border-box' }} />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a0a0a0' }}>
                  {showPassword
                    ? <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    : <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  }
                </button>
              </div>
            </div>

            {siteKey && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <HCaptcha sitekey={siteKey} onVerify={t => setCaptchaToken(t)} ref={captchaRef} theme="dark" />
              </div>
            )}

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '8px', padding: '10px 14px', color: '#ef4444', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <button className="btn-primary" type="submit" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}>
              {loading
                ? <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '16px', height: '16px', border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                    Creating account...
                  </span>
                : '🐝 Create Account'}
            </button>

            <div style={{ textAlign: 'center', color: '#a0a0a0', fontSize: '13px' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#f5c518', textDecoration: 'none' }}>Login</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #f5c518', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}