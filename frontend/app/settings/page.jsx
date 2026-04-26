'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile, deleteAccount, requestEmailChange, confirmEmailChange, getMyCoins } from '@/lib/api';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('PROFILE');
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const [profileForm, setProfileForm] = useState({ fullName: '', newUsername: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [deletePassword, setDeletePassword] = useState('');

  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const [emailStep, setEmailStep] = useState('IDLE');
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      setProfileForm({ fullName: u.fullName || '', newUsername: u.username || '' });
    }
    getMyCoins().then(res => {
      setUser(prev => prev ? { ...prev, coins: res.data.coins } : prev);
      localStorage.setItem('coins', res.data.coins);
    }).catch(() => {});
  }, []);

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 5000);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { fullName: profileForm.fullName };
      if (!user.usernameChanged && profileForm.newUsername !== user.username) {
        payload.newUsername = profileForm.newUsername;
      }
      const res = await updateProfile(payload);
      const updatedUser = { ...user, ...res.data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      showMsg('✅ Profile updated successfully!');
    } catch (err) {
      showMsg('❌ ' + (err.response?.data?.message || 'Update failed.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestEmailChange = async () => {
    if (!newEmail || !newEmail.includes('@')) { showMsg('❌ Please enter a valid email address.', 'error'); return; }
    setLoading(true);
    try {
      await requestEmailChange({ newEmail });
      setEmailStep('OTP_SENT');
      showMsg('📧 OTP sent to ' + newEmail + '. Check your inbox!');
    } catch (err) {
      showMsg('❌ ' + (err.response?.data?.message || 'Failed to send OTP.'), 'error');
    } finally { setLoading(false); }
  };

  const handleConfirmEmailChange = async () => {
    if (!emailOtp || emailOtp.length !== 6) { showMsg('❌ Please enter the 6-digit OTP.', 'error'); return; }
    setLoading(true);
    try {
      const res = await confirmEmailChange({ otp: emailOtp });
      const updatedUser = { ...user, ...res.data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setEmailStep('IDLE'); setNewEmail(''); setEmailOtp('');
      showMsg('✅ Email updated successfully!');
    } catch (err) {
      showMsg('❌ ' + (err.response?.data?.message || 'Verification failed.'), 'error');
    } finally { setLoading(false); }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { showMsg('❌ New passwords do not match.', 'error'); return; }
    if (passwordForm.newPassword.length < 6) { showMsg('❌ Password must be at least 6 characters.', 'error'); return; }
    setLoading(true);
    try {
      await updateProfile({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showMsg('✅ Password changed successfully!');
    } catch (err) {
      showMsg('❌ ' + (err.response?.data?.message || 'Password change failed.'), 'error');
    } finally { setLoading(false); }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) { showMsg('❌ Please enter your password to confirm.', 'error'); return; }
    if (!user?.id) { showMsg('❌ User session expired. Please login again.', 'error'); return; }
    setLoading(true);
    try {
      await deleteAccount({ userId: user.id, password: deletePassword });
      localStorage.clear(); sessionStorage.clear();
      document.cookie = 'token=; path=/; max-age=0';
      setDeleted(true);
      setTimeout(() => { window.location.href = window.location.origin + '/login'; }, 2500);
    } catch (err) {
      showMsg('❌ ' + (err.response?.data?.message || 'Delete failed.'), 'error');
      setLoading(false);
    }
  };

  if (deleted) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div style={{ fontSize: '64px' }}>🗑️</div>
        <h2 style={{ fontSize: '22px', fontWeight: 800 }}>Account Deleted</h2>
        <p style={{ color: '#a0a0a0', fontSize: '14px' }}>Your account has been permanently deleted.</p>
        <p style={{ color: '#555', fontSize: '13px' }}>Redirecting to login...</p>
      </div>
    );
  }

  const tabs = [
    { key: 'PROFILE',  label: '👤 Profile' },
    { key: 'PASSWORD', label: '🔒 Password' },
    { key: 'HELP',     label: '💬 Help & Support' },
    { key: 'DANGER',   label: '⚠️ Delete Account' },
  ];

  const EyeBtn = ({ show, onToggle }) => (
    <button type="button" onClick={onToggle} style={{
      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
      background: 'none', border: 'none', color: '#a0a0a0', cursor: 'pointer',
      padding: '4px', display: 'flex', alignItems: 'center',
    }}>
      {show ? (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      ) : (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      )}
    </button>
  );

  return (
    <div className="animate-fadeSlideUp" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800 }}>⚙️ Settings</h1>
        <p style={{ color: '#a0a0a0', marginTop: '4px' }}>Manage your account preferences</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: '8px 18px', borderRadius: '999px', fontSize: '13px', fontWeight: 600,
            background: activeTab === t.key ? '#f5c518' : '#222',
            color: activeTab === t.key ? '#000' : '#a0a0a0',
            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      {msg.text && (
        <div style={{
          background: msg.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
          border: `1px solid ${msg.type === 'error' ? '#ef4444' : '#22c55e'}`,
          borderRadius: '8px', padding: '10px 14px',
          color: msg.type === 'error' ? '#ef4444' : '#22c55e',
          fontSize: '13px', marginBottom: '16px',
        }}>{msg.text}</div>
      )}

      {/* PROFILE TAB */}
      {activeTab === 'PROFILE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: user?.avatarColor || '#f5c518', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: 800, color: '#000' }}>
                {user?.fullName?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '16px' }}>{user?.fullName}</div>
                <div style={{ color: '#a0a0a0', fontSize: '13px' }}>@{user?.username}</div>
                <div style={{ color: '#f5c518', fontSize: '12px', marginTop: '2px' }}>🪙 {user?.coins || 0} coins</div>
              </div>
            </div>
            <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Full Name</label>
                <input className="input" value={profileForm.fullName} onChange={e => setProfileForm({ ...profileForm, fullName: e.target.value })} placeholder="Your full name" />
              </div>
              <div>
                <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  Username{' '}
                  <span style={{ color: '#555', fontSize: '11px' }}>{user?.usernameChanged ? '(already changed — cannot change again)' : '(can only be changed once)'}</span>
                </label>
                <input className="input" value={profileForm.newUsername} onChange={e => setProfileForm({ ...profileForm, newUsername: e.target.value })} disabled={!!user?.usernameChanged} style={{ opacity: user?.usernameChanged ? 0.5 : 1, cursor: user?.usernameChanged ? 'not-allowed' : 'text' }} />
              </div>
              <button className="btn-primary" type="submit" disabled={loading} style={{ alignSelf: 'flex-start', minWidth: '140px', justifyContent: 'center' }}>
                {loading ? '⏳ Saving...' : '💾 Save Profile'}
              </button>
            </form>
          </div>

          <div className="card" style={{ padding: '28px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>📧 Change Email</h2>
            <p style={{ color: '#a0a0a0', fontSize: '12px', marginBottom: '20px' }}>Current email: <span style={{ color: '#fff' }}>{user?.email}</span></p>
            {emailStep === 'IDLE' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>New Email Address</label>
                  <input className="input" type="email" placeholder="new@email.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                </div>
                <button className="btn-outline" onClick={handleRequestEmailChange} disabled={loading} style={{ alignSelf: 'flex-start', minWidth: '180px', justifyContent: 'center' }}>
                  {loading ? '⏳ Sending...' : '📨 Send Verification OTP'}
                </button>
              </div>
            )}
            {emailStep === 'OTP_SENT' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: 'rgba(245,197,24,0.08)', border: '1px solid rgba(245,197,24,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#f5c518' }}>
                  📧 OTP sent to <strong>{newEmail}</strong>. Enter it below to confirm.
                </div>
                <div>
                  <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>6-digit OTP</label>
                  <input className="input" placeholder="000000" maxLength={6} value={emailOtp} onChange={e => setEmailOtp(e.target.value.replace(/\D/g, ''))} />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn-primary" onClick={handleConfirmEmailChange} disabled={loading} style={{ minWidth: '140px', justifyContent: 'center' }}>
                    {loading ? '⏳ Verifying...' : '✅ Confirm Email'}
                  </button>
                  <button onClick={() => { setEmailStep('IDLE'); setEmailOtp(''); setNewEmail(''); }} style={{ background: '#222', border: '1px solid #333', color: '#a0a0a0', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                </div>
                <button onClick={handleRequestEmailChange} disabled={loading} style={{ background: 'none', border: 'none', color: '#a0a0a0', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline', alignSelf: 'flex-start' }}>Resend OTP</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PASSWORD TAB */}
      {activeTab === 'PASSWORD' && (
        <div className="card" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>🔒 Change Password</h2>
          <form onSubmit={handlePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Current Password</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showCurrentPwd ? 'text' : 'password'} value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} placeholder="Enter current password" required style={{ paddingRight: '44px' }} />
                <EyeBtn show={showCurrentPwd} onToggle={() => setShowCurrentPwd(v => !v)} />
              </div>
            </div>
            <div>
              <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showNewPwd ? 'text' : 'password'} value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} placeholder="Enter new password" required style={{ paddingRight: '44px' }} />
                <EyeBtn show={showNewPwd} onToggle={() => setShowNewPwd(v => !v)} />
              </div>
            </div>
            <div>
              <label style={{ color: '#a0a0a0', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={showConfirmPwd ? 'text' : 'password'} value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} placeholder="Confirm new password" required style={{ paddingRight: '44px' }} />
                <EyeBtn show={showConfirmPwd} onToggle={() => setShowConfirmPwd(v => !v)} />
              </div>
            </div>
            <button className="btn-primary" type="submit" disabled={loading} style={{ alignSelf: 'flex-start', minWidth: '160px', justifyContent: 'center' }}>
              {loading ? '⏳ Updating...' : '🔒 Update Password'}
            </button>
          </form>
        </div>
      )}

      {/* HELP TAB */}
      {activeTab === 'HELP' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { q: '🪙 How do I earn coins?', a: 'Complete group tasks assigned to you. Higher priority tasks (HIGH) give more coins. You also get streak bonuses for completing tasks on consecutive days.' },
            { q: '🔓 What is an Open Task?', a: 'An Open Task has no assigned member — anyone in the group can claim it. If nobody claims it in 6 hours, all members get notified. After 8 hours, everyone loses 5 coins.' },
            { q: '🎁 How do I redeem coins?', a: 'Go to Rewards → Redeem tab. Your group admin (or any member) can create redeem options with a minimum of 50 coins.' },
            { q: '🪺 What is MyNest?', a: "MyNest is your personal task space — tasks only you can see. These don't earn coins since they're not group tasks." },
            { q: '👑 What is Quest Master?', a: 'Every Monday, the member who earned the most coins that week is crowned Quest Master of the week.' },
            { q: '📧 How do I change my email or password?', a: 'Go to Settings → Profile to update your name, username (once), or email. Go to Settings → Password to change your password.' },
            { q: '🗺️ How does the Map feature work?', a: 'The Map shows real-time locations of group members who have shared their location. It works best on mobile with GPS.' },
          ].map((item, i) => (
            <div key={i} className="card" style={{ padding: '20px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>{item.q}</div>
              <div style={{ color: '#a0a0a0', fontSize: '13px', lineHeight: 1.6 }}>{item.a}</div>
            </div>
          ))}
          <div className="card" style={{ padding: '20px', border: '1px solid rgba(245,197,24,0.2)' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>📬 Contact Support</div>
            <div style={{ color: '#a0a0a0', fontSize: '13px', lineHeight: 1.6 }}>
              Having an issue? Reach out at <span style={{ color: '#f5c518' }}>pallavisable505@gmail.com</span><br />We typically respond within 24 hours. 🐝
            </div>
          </div>
        </div>
      )}

      {/* DANGER ZONE TAB */}
      {activeTab === 'DANGER' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '28px', border: '1px solid rgba(239,68,68,0.3)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#ef4444', marginBottom: '8px' }}>🗑️ Delete Account</h2>
            <p style={{ color: '#a0a0a0', fontSize: '13px', marginBottom: '20px', lineHeight: 1.6 }}>
              This will permanently delete your account, all your tasks, coins, and rewards. This action <strong style={{ color: '#fff' }}>cannot be undone</strong>.
            </p>
            {!showDeleteConfirm ? (
              <button onClick={() => setShowDeleteConfirm(true)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>⚠️ I want to delete my account</button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ color: '#ef4444', fontSize: '13px', fontWeight: 600 }}>Enter your password to confirm deletion:</p>
                <input className="input" type="password" placeholder="Your password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={handleDeleteAccount} disabled={loading} style={{ background: '#ef4444', border: 'none', color: '#fff', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                    {loading ? '⏳ Deleting...' : '🗑️ Yes, Delete My Account'}
                  </button>
                  <button onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); }} style={{ background: '#222', border: '1px solid #333', color: '#a0a0a0', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}