'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { requestAdminAccess } from '@/lib/api';

export default function RequestAccessPage() {
  const [form, setForm] = useState({ fullName: '', email: '', reason: '' });
  const [captchaToken, setCaptchaToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const captchaRef = useRef(null);

  const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (siteKey && !captchaToken) {
      setError('Please complete the CAPTCHA.');
      return;
    }
    setLoading(true);
    try {
      await requestAdminAccess({ ...form, captchaToken });
      setSuccess("Request submitted! Check your email — we'll be in touch once reviewed.");
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
      captchaRef.current?.resetCaptcha();
      setCaptchaToken('');
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
        background: '#1a1a1a', borderRadius: '20px', border: '1px solid #2a2a2a',
        padding: '48px', width: '100%', maxWidth: '480px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🐝</div>
          <h1 style={{ color: '#f5c518', fontSize: '26px', fontWeight: 800 }}>Request Admin Access</h1>
          <p style={{ color: '#a0a0a0', marginTop: '6px', fontSize: '14px', lineHeight: '1.6' }}>
            Want to create and manage a family group on QuestHive?<br />
            Submit a request — our team reviews every application.
          </p>
        </div>

        {success ? (
          <div style={{
            background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e',
            borderRadius: '12px', padding: '20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>✅</div>
            <p style={{ color: '#22c55e', fontWeight: 600 }}>{success}</p>
            <Link href="/login" style={{ color: '#f5c518', fontSize: '13px', marginTop: '16px', display: 'block' }}>
              ← Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { key: 'fullName', label: 'Full Name', type: 'text', placeholder: 'Your full name' },
              { key: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com' },
            ].map(field => (
              <div key={field.key}>
                <label style={{ color: '#a0a0a0', fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                  {field.label}
                </label>
                <input className="input" type={field.type} placeholder={field.placeholder}
                  value={form[field.key]} onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                  required />
              </div>
            ))}

            <div>
              <label style={{ color: '#a0a0a0', fontSize: '13px', marginBottom: '6px', display: 'block' }}>
                Why do you want to create a group?
              </label>
              <textarea className="input" placeholder="Tell us briefly about your group and who it's for..."
                value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
                required rows={4} style={{ resize: 'none' }} />
            </div>

            {siteKey && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <HCaptcha sitekey={siteKey} onVerify={token => setCaptchaToken(token)}
                  ref={captchaRef} theme="dark" />
              </div>
            )}

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444',
                borderRadius: '8px', padding: '10px 14px', color: '#ef4444', fontSize: '13px',
              }}>{error}</div>
            )}

            <button className="btn-primary" type="submit" disabled={loading}
              style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '16px', height: '16px', border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  Submitting...
                </span>
              ) : '🐝 Submit Request'}
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