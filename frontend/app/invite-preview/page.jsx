'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { validateInvite } from '@/lib/api';

function InvitePreviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setError('No invite token found. Please use the link from your email.');
      setLoading(false);
      return;
    }
    validateInvite(token)
      .then(res => { setInvite(res.data); setLoading(false); })
      .catch(err => {
        setError(err.response?.data?.message || 'This invite link is invalid or has expired.');
        setLoading(false);
      });
  }, [token]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #f5c518', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#f5c518' }}>Validating your invite...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="animate-fadeSlideUp" style={{ background: '#1a1a1a', borderRadius: '20px', border: '1px solid #2a2a2a', padding: '48px', width: '100%', maxWidth: '460px' }}>

        {error ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
            <h1 style={{ color: '#ef4444', fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>Invalid Invite</h1>
            <p style={{ color: '#a0a0a0', fontSize: '14px', marginBottom: '24px' }}>{error}</p>
            <Link href="/login" style={{ color: '#f5c518' }}>← Go to Login</Link>
          </div>
        ) : invite?.alreadyRegistered ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🐝</div>
            <h1 style={{ color: '#f5c518', fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>You're in!</h1>
            <p style={{ color: '#a0a0a0', fontSize: '14px', marginBottom: '8px' }}>
              You've been added to <strong style={{ color: '#fff' }}>{invite.groupName}</strong>.
            </p>
            <p style={{ color: '#a0a0a0', fontSize: '13px', marginBottom: '28px' }}>{invite.message}</p>
            <button className="btn-primary" onClick={() => router.push('/login')}
              style={{ width: '100%', justifyContent: 'center' }}>
              Login to Access Your Group →
            </button>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🐝</div>
              <h1 style={{ color: '#f5c518', fontSize: '26px', fontWeight: 800 }}>You've been invited!</h1>
              <p style={{ color: '#a0a0a0', marginTop: '6px', fontSize: '14px' }}>
                {invite?.type === 'ADMIN'
                  ? 'Your request to become a Family Admin has been approved.'
                  : `You're invited to join a group on QuestHive.`}
              </p>
            </div>

            {invite?.groupName && (
              <div style={{ background: 'rgba(245,197,24,0.08)', border: '1px solid rgba(245,197,24,0.2)', borderRadius: '14px', padding: '20px', marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245,197,24,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🏠</div>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '16px' }}>{invite.groupName}</div>
                    <div style={{ color: '#a0a0a0', fontSize: '12px' }}>{invite.memberCount} member{invite.memberCount !== 1 ? 's' : ''} already</div>
                  </div>
                </div>
                {invite.groupDescription && (
                  <p style={{ color: '#a0a0a0', fontSize: '13px', lineHeight: '1.6' }}>{invite.groupDescription}</p>
                )}
              </div>
            )}

            <div style={{ background: '#222', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', fontSize: '13px', color: '#a0a0a0' }}>
              📧 This invite was sent to <strong style={{ color: '#f5c518' }}>{invite?.email}</strong>
            </div>

            <button className="btn-primary" onClick={() => router.push(`/register?token=${token}`)}
              style={{ width: '100%', justifyContent: 'center', fontSize: '15px', padding: '14px' }}>
              🐝 Create My Account & Join
            </button>

            <p style={{ textAlign: 'center', color: '#555', fontSize: '12px', marginTop: '16px' }}>
              Link expires in 48 hours • Single use only
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function InvitePreviewPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #f5c518', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    }>
      <InvitePreviewContent />
    </Suspense>
  );
}