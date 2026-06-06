'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile, deleteAccount, requestEmailChange, confirmEmailChange, getMyCoins } from '@/lib/api';

const EyeBtn = ({ show, onToggle }) => (
  <button type="button" onClick={onToggle} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:'4px', display:'flex', alignItems:'center' }}>
    {show
      ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
      : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    }
  </button>
);

export default function SettingsPage() {
  const router = useRouter();
  const [user,              setUser]              = useState(null);
  const [activeTab,         setActiveTab]         = useState('PROFILE');
  const [msg,               setMsg]               = useState({ text:'', type:'' });
  const [loading,           setLoading]           = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleted,           setDeleted]           = useState(false);
  const [profileForm,       setProfileForm]       = useState({ fullName:'', newUsername:'' });
  const [passwordForm,      setPasswordForm]      = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [deletePassword,    setDeletePassword]    = useState('');
  const [showCurrentPwd,    setShowCurrentPwd]    = useState(false);
  const [showNewPwd,        setShowNewPwd]        = useState(false);
  const [showConfirmPwd,    setShowConfirmPwd]    = useState(false);
  const [emailStep,         setEmailStep]         = useState('IDLE');
  const [newEmail,          setNewEmail]          = useState('');
  const [emailOtp,          setEmailOtp]          = useState('');

  useEffect(() => {
    const s = localStorage.getItem('user');
    if (s) {
      const u = JSON.parse(s);
      setUser(u);
      setProfileForm({ fullName: u.fullName||'', newUsername: u.username||'' });
    }
    getMyCoins().then(r => {
      setUser(p => p ? {...p, coins:r.data.coins} : p);
      localStorage.setItem('coins', r.data.coins);
    }).catch(()=>{});
  }, []);

  const showMsg = (text, type='success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text:'', type:'' }), 5000); };

  const handleProfileUpdate = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const payload = { fullName: profileForm.fullName };
      if (!user.usernameChanged && profileForm.newUsername !== user.username) payload.newUsername = profileForm.newUsername;
      const res = await updateProfile(payload);
      const u = { ...user, ...res.data.user };
      localStorage.setItem('user', JSON.stringify(u)); setUser(u);
      showMsg('Profile updated successfully!');
    } catch(err){ showMsg(err.response?.data?.message || 'Update failed.', 'error'); }
    finally { setLoading(false); }
  };

  const handleRequestEmailChange = async () => {
    if (!newEmail || !newEmail.includes('@')) { showMsg('Please enter a valid email address.', 'error'); return; }
    setLoading(true);
    try { await requestEmailChange({ newEmail }); setEmailStep('OTP_SENT'); showMsg('OTP sent to ' + newEmail); }
    catch(err){ showMsg(err.response?.data?.message || 'Failed to send OTP.', 'error'); }
    finally { setLoading(false); }
  };

  const handleConfirmEmailChange = async () => {
    if (!emailOtp || emailOtp.length !== 6) { showMsg('Please enter the 6-digit OTP.', 'error'); return; }
    setLoading(true);
    try {
      const res = await confirmEmailChange({ otp: emailOtp });
      const u = { ...user, ...res.data.user };
      localStorage.setItem('user', JSON.stringify(u)); setUser(u);
      setEmailStep('IDLE'); setNewEmail(''); setEmailOtp('');
      showMsg('Email updated successfully!');
    } catch(err){ showMsg(err.response?.data?.message || 'Verification failed.', 'error'); }
    finally { setLoading(false); }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { showMsg('Passwords do not match.', 'error'); return; }
    if (passwordForm.newPassword.length < 6) { showMsg('Password must be at least 6 characters.', 'error'); return; }
    setLoading(true);
    try {
      await updateProfile({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      setPasswordForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
      showMsg('Password changed successfully!');
    } catch(err){ showMsg(err.response?.data?.message || 'Password change failed.', 'error'); }
    finally { setLoading(false); }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) { showMsg('Please enter your password to confirm.', 'error'); return; }
    setLoading(true);
    try {
      await deleteAccount({ userId: user.id, password: deletePassword });
      localStorage.clear(); sessionStorage.clear();
      document.cookie = 'token=; path=/; max-age=0';
      setDeleted(true);
      setTimeout(() => { window.location.href = window.location.origin + '/login'; }, 2500);
    } catch(err){ showMsg(err.response?.data?.message || 'Delete failed.', 'error'); setLoading(false); }
  };

  if (deleted) return (
    <div style={{ minHeight:'80vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'16px' }}>
      <div style={{ width:'56px', height:'56px', borderRadius:'14px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg width="24" height="24" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
      </div>
      <h2 style={{ fontSize:'20px', fontWeight:800, color:'var(--text-primary)' }}>Account Deleted</h2>
      <p style={{ color:'var(--text-muted)', fontSize:'13px' }}>Redirecting to login...</p>
    </div>
  );

  const TABS = [
    { key:'PROFILE',  label:'Profile'  },
    { key:'PASSWORD', label:'Password' },
    { key:'HELP',     label:'Help'     },
    { key:'DANGER',   label:'Danger Zone', danger:true },
  ];

  const Label = ({ children }) => (
    <label style={{ display:'block', fontSize:'11px', fontWeight:700, color:'var(--text-muted)', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'0.4px' }}>{children}</label>
  );

  return (
    <>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ maxWidth:'600px', animation:'fadeUp 0.4s cubic-bezier(0.16,1,0.3,1)' }}>

        {/* Header */}
        <div style={{ marginBottom:'28px' }}>
          <h1 style={{ fontSize:'22px', fontWeight:800, color:'var(--text-primary)', letterSpacing:'-0.3px', marginBottom:'3px' }}>Settings</h1>
          <p style={{ fontSize:'13px', color:'var(--text-muted)', margin:0 }}>Manage your account preferences</p>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'4px', marginBottom:'24px', background:'var(--bg-elevated)', borderRadius:'10px', padding:'4px', border:'1px solid var(--border)', flexWrap:'wrap' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              padding:'7px 16px', borderRadius:'7px', fontSize:'13px', fontWeight:600,
              background: activeTab === t.key ? 'var(--bg-card)' : 'transparent',
              color: activeTab === t.key ? (t.danger ? '#ef4444' : 'var(--text-primary)') : (t.danger ? '#ef4444' : 'var(--text-muted)'),
              border: activeTab === t.key ? `1px solid ${t.danger ? 'rgba(239,68,68,0.3)' : 'var(--border)'}` : '1px solid transparent',
              cursor:'pointer', transition:'all 0.2s',
              boxShadow: activeTab === t.key ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Message */}
        {msg.text && (
          <div style={{
            background: msg.type==='error' ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
            border:`1px solid ${msg.type==='error' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
            borderRadius:'10px', padding:'11px 16px',
            color: msg.type==='error' ? '#ef4444' : '#22c55e',
            fontSize:'13px', marginBottom:'20px', fontWeight:500,
          }}>{msg.text}</div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'PROFILE' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            {/* Avatar card */}
            <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'14px', padding:'24px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'24px' }}>
                <div style={{
                  width:'56px', height:'56px', borderRadius:'50%',
                  background: user?.avatarColor || 'var(--accent)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'22px', fontWeight:800, color:'#000', flexShrink:0,
                }}>
                  {user?.fullName?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:'15px', color:'var(--text-primary)' }}>{user?.fullName}</div>
                  <div style={{ color:'var(--text-muted)', fontSize:'13px' }}>@{user?.username}</div>
                  <div style={{ color:'var(--accent)', fontSize:'12px', marginTop:'2px', fontWeight:600 }}>{user?.coins || 0} coins</div>
                </div>
              </div>
              <form onSubmit={handleProfileUpdate} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                <div>
                  <Label>Full Name</Label>
                  <input className="input" value={profileForm.fullName} onChange={e => setProfileForm({...profileForm, fullName:e.target.value})} placeholder="Your full name" />
                </div>
                <div>
                  <Label>Username {user?.usernameChanged ? <span style={{ color:'var(--text-muted)', fontSize:'10px', textTransform:'none', fontWeight:400 }}>(already changed)</span> : <span style={{ color:'var(--text-muted)', fontSize:'10px', textTransform:'none', fontWeight:400 }}>(can only change once)</span>}</Label>
                  <input className="input" value={profileForm.newUsername} onChange={e => setProfileForm({...profileForm, newUsername:e.target.value})} disabled={!!user?.usernameChanged} style={{ opacity: user?.usernameChanged ? 0.5 : 1, cursor: user?.usernameChanged ? 'not-allowed' : 'text' }} />
                </div>
                <button type="submit" disabled={loading} style={{ alignSelf:'flex-start', background:'var(--accent)', color:'#000', border:'none', borderRadius:'10px', padding:'10px 20px', fontSize:'13px', fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </form>
            </div>

            {/* Email card */}
            <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'14px', padding:'24px' }}>
              <div style={{ marginBottom:'16px' }}>
                <div style={{ fontSize:'14px', fontWeight:700, color:'var(--text-primary)', marginBottom:'4px' }}>Change Email</div>
                <div style={{ fontSize:'12px', color:'var(--text-muted)' }}>Current: <span style={{ color:'var(--text-secondary)' }}>{user?.email}</span></div>
              </div>
              {emailStep === 'IDLE' ? (
                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  <div>
                    <Label>New Email Address</Label>
                    <input className="input" type="email" placeholder="new@email.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                  </div>
                  <button onClick={handleRequestEmailChange} disabled={loading} style={{ alignSelf:'flex-start', background:'var(--bg-elevated)', border:'1px solid var(--border)', color:'var(--text-primary)', borderRadius:'10px', padding:'9px 18px', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
                    {loading ? 'Sending...' : 'Send OTP'}
                  </button>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  <div style={{ background:'rgba(245,197,24,0.06)', border:'1px solid rgba(245,197,24,0.2)', borderRadius:'8px', padding:'10px 14px', fontSize:'13px', color:'var(--accent)' }}>
                    OTP sent to <strong>{newEmail}</strong>. Enter it below.
                  </div>
                  <div>
                    <Label>6-digit OTP</Label>
                    <input className="input" placeholder="000000" maxLength={6} value={emailOtp} onChange={e => setEmailOtp(e.target.value.replace(/\D/g,''))} />
                  </div>
                  <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                    <button onClick={handleConfirmEmailChange} disabled={loading} style={{ background:'var(--accent)', color:'#000', border:'none', borderRadius:'10px', padding:'9px 18px', fontSize:'13px', fontWeight:700, cursor:'pointer' }}>
                      {loading ? 'Verifying...' : 'Confirm Email'}
                    </button>
                    <button onClick={handleRequestEmailChange} disabled={loading} style={{ background:'none', border:'1px solid var(--border)', color:'var(--text-muted)', borderRadius:'10px', padding:'9px 16px', fontSize:'13px', cursor:'pointer' }}>Resend OTP</button>
                    <button onClick={() => { setEmailStep('IDLE'); setEmailOtp(''); setNewEmail(''); }} style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:'12px', cursor:'pointer', padding:'4px' }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PASSWORD TAB */}
        {activeTab === 'PASSWORD' && (
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'14px', padding:'24px' }}>
            <div style={{ fontSize:'14px', fontWeight:700, color:'var(--text-primary)', marginBottom:'20px' }}>Change Password</div>
            <form onSubmit={handlePasswordUpdate} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              {[
                { label:'Current Password', field:'currentPassword', show:showCurrentPwd, toggle:()=>setShowCurrentPwd(v=>!v) },
                { label:'New Password',     field:'newPassword',     show:showNewPwd,     toggle:()=>setShowNewPwd(v=>!v) },
                { label:'Confirm Password', field:'confirmPassword', show:showConfirmPwd, toggle:()=>setShowConfirmPwd(v=>!v) },
              ].map(f => (
                <div key={f.field}>
                  <Label>{f.label}</Label>
                  <div style={{ position:'relative' }}>
                    <input className="input" type={f.show ? 'text':'password'} value={passwordForm[f.field]} onChange={e => setPasswordForm({...passwordForm,[f.field]:e.target.value})} placeholder="••••••••" required style={{ paddingRight:'44px' }} />
                    <EyeBtn show={f.show} onToggle={f.toggle} />
                  </div>
                </div>
              ))}
              <button type="submit" disabled={loading} style={{ alignSelf:'flex-start', background:'var(--accent)', color:'#000', border:'none', borderRadius:'10px', padding:'10px 20px', fontSize:'13px', fontWeight:700, cursor:'pointer' }}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}

        {/* HELP TAB */}
        {activeTab === 'HELP' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {[
              { q:'How do I earn coins?', a:'Complete group tasks assigned to you. Higher priority tasks give more coins. You also get streak bonuses for completing tasks on consecutive days.' },
              { q:'What is an Open Task?', a:'An Open Task has no assigned member — anyone in the group can claim it. First come, first served — and they pay bonus coins.' },
              { q:'How do I redeem coins?', a:'Go to Rewards → Redeem tab. Your group admin can create redeem options with a minimum of 50 coins.' },
              { q:'What is MyNest?', a:"MyNest is your private task space — tasks only you can see. These don't earn coins since they're not group tasks." },
              { q:'What is Quest Master?', a:'Every Monday, the member who earned the most coins that week is crowned Quest Master and earns a bonus reward.' },
              { q:'How do I change my email or password?', a:'Profile tab to update name, username (once), or email. Password tab to change your password.' },
            ].map((item, i) => (
              <div key={i} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'12px', padding:'18px 20px' }}>
                <div style={{ fontWeight:700, fontSize:'13px', color:'var(--text-primary)', marginBottom:'6px' }}>{item.q}</div>
                <div style={{ color:'var(--text-muted)', fontSize:'13px', lineHeight:1.6 }}>{item.a}</div>
              </div>
            ))}
            <div style={{ background:'var(--bg-card)', border:'1px solid rgba(245,197,24,0.2)', borderRadius:'12px', padding:'18px 20px' }}>
              <div style={{ fontWeight:700, fontSize:'13px', color:'var(--text-primary)', marginBottom:'6px' }}>Contact Support</div>
              <div style={{ color:'var(--text-muted)', fontSize:'13px', lineHeight:1.6 }}>
                Having an issue? Reach out at <span style={{ color:'var(--accent)' }}>pallavisable505@gmail.com</span>. We typically respond within 24 hours.
              </div>
            </div>
          </div>
        )}

        {/* DANGER TAB */}
        {activeTab === 'DANGER' && (
          <div style={{ background:'var(--bg-card)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'14px', padding:'24px' }}>
            <div style={{ fontSize:'14px', fontWeight:700, color:'#ef4444', marginBottom:'8px' }}>Delete Account</div>
            <p style={{ color:'var(--text-muted)', fontSize:'13px', marginBottom:'20px', lineHeight:1.6 }}>
              This will permanently delete your account, tasks, coins, and rewards. This action <strong style={{ color:'var(--text-primary)' }}>cannot be undone</strong>.
            </p>
            {!showDeleteConfirm ? (
              <button onClick={() => setShowDeleteConfirm(true)} style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', color:'#ef4444', borderRadius:'10px', padding:'10px 20px', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
                I want to delete my account
              </button>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                <div style={{ fontSize:'13px', color:'#ef4444', fontWeight:600 }}>Enter your password to confirm:</div>
                <input className="input" type="password" placeholder="Your password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} />
                <div style={{ display:'flex', gap:'10px' }}>
                  <button onClick={handleDeleteAccount} disabled={loading} style={{ background:'#ef4444', border:'none', color:'#fff', borderRadius:'10px', padding:'10px 20px', fontSize:'13px', fontWeight:700, cursor:'pointer' }}>
                    {loading ? 'Deleting...' : 'Delete My Account'}
                  </button>
                  <button onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); }} style={{ background:'none', border:'1px solid var(--border)', color:'var(--text-muted)', borderRadius:'10px', padding:'10px 18px', fontSize:'13px', cursor:'pointer' }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
