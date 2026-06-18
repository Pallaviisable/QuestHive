'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  inviteByEmail, leaveGroup, deleteGroup, removeMember,
  getGroupActivities, getRedeemHistory, deactivateMember,
  reactivateMember, getMyXP, getGroupMemberAnalytics,
} from '@/lib/api';
import axios from 'axios';

const TITLE_TIERS = [
  { frame:'none',   title:'Newcomer',       minLevel:1,  color:'#666'    },
  { frame:'bronze', title:'Task Starter',   minLevel:3,  color:'#cd7f32' },
  { frame:'silver', title:'Steady Worker',  minLevel:6,  color:'#c0c0c0' },
  { frame:'gold',   title:'Dedicated Bee',  minLevel:10, color:'#f5c518' },
  { frame:'purple', title:'Quest Champion', minLevel:15, color:'#a855f7' },
  { frame:'elite',  title:'Elite Bee',      minLevel:20, color:'#ef4444' },
];
function getTier(level=1){ let t=TITLE_TIERS[0]; for(const x of TITLE_TIERS){if(level>=x.minLevel)t=x;} return t; }

const activityIcon = {
  TASK_ASSIGNED:'📋',TASK_COMPLETED:'✅',TASK_DENIED:'❌',TASK_CLAIMED:'🙋',
  REWARD_REDEEMED:'🎁',MEMBER_JOINED:'👋',MEMBER_LEFT:'🚪',MEMBER_REMOVED:'🚫',
  OPEN_TASK_REMINDER:'⏰',OPEN_TASK_PENALTY:'⚠️',PLEDGE_MADE:'🤝',PLEDGE_FULFILLED:'✅',PLEDGE_MISSED:'❌',
};

function StatRing({ value, max, color, size=56 }) {
  const pct = max > 0 ? Math.min(100, Math.round((value/max)*100)) : 0;
  const r = (size/2)-5; const circ = 2*Math.PI*r;
  const dash = (pct/100)*circ;
  return (
    <svg width={size} height={size} style={{flexShrink:0}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth="4"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} style={{transition:'stroke-dasharray 0.6s ease'}}/>
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="central"
        style={{fontSize:'11px',fontWeight:700,fill:color}}>{pct}%</text>
    </svg>
  );
}

function MemberAnalyticsTab({ groupId, currentUserId, adminId }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('tasksCompleted');
  const [error, setError] = useState('');

  useEffect(() => {
    getGroupMemberAnalytics(groupId)
      .then(r => setMembers(r.data))
      .catch(() => setError('Failed to load analytics.'))
      .finally(() => setLoading(false));
  }, [groupId]);

  const sorted = [...members].sort((a,b) => (b[sort]||0) - (a[sort]||0));

  const SORT_OPTIONS = [
    { key:'tasksCompleted',       label:'Tasks Done'   },
    { key:'completionRatePercent',label:'Completion %' },
    { key:'coins',                label:'Coins'        },
    { key:'totalXp',              label:'XP'           },
    { key:'streak',               label:'Streak'       },
  ];

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'60px',gap:'12px'}}>
      <div style={{width:'24px',height:'24px',border:'2px solid var(--border)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <span style={{fontSize:'13px',color:'var(--text-muted)'}}>Loading analytics...</span>
    </div>
  );
  if (error) return <div style={{color:'#ef4444',padding:'24px',fontSize:'13px'}}>{error}</div>;
  if (members.length === 0) return (
    <div style={{textAlign:'center',padding:'60px',color:'var(--text-muted)',fontSize:'13px'}}>No members found.</div>
  );

  const totalTasks = members.reduce((s,m) => s+m.tasksAssigned, 0);
  const totalDone  = members.reduce((s,m) => s+m.tasksCompleted, 0);
  const groupRate  = totalTasks > 0 ? Math.round((totalDone/totalTasks)*100) : 0;

  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:'10px',marginBottom:'20px'}}>
        {[
          {label:'Group tasks',    value:totalTasks,       color:'var(--text-primary)'},
          {label:'Completed',      value:totalDone,        color:'#22c55e'},
          {label:'Completion rate',value:`${groupRate}%`,  color:'var(--accent)'},
          {label:'Members',        value:members.length,   color:'#3b82f6'},
        ].map((s,i) => (
          <div key={i} style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'12px',padding:'16px',textAlign:'center'}}>
            <div style={{fontSize:'22px',fontWeight:800,color:s.color,lineHeight:1}}>{s.value}</div>
            <div style={{fontSize:'10px',color:'var(--text-muted)',marginTop:'5px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.4px'}}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'16px',alignItems:'center'}}>
        <span style={{fontSize:'11px',color:'var(--text-muted)',fontWeight:600,marginRight:'4px'}}>SORT BY</span>
        {SORT_OPTIONS.map(o => (
          <button key={o.key} onClick={() => setSort(o.key)} style={{
            padding:'5px 14px',borderRadius:'999px',fontSize:'12px',fontWeight:600,cursor:'pointer',
            background: sort===o.key ? 'rgba(245,197,24,0.12)' : 'var(--bg-elevated)',
            color: sort===o.key ? 'var(--accent)' : 'var(--text-muted)',
            border: sort===o.key ? '1px solid rgba(245,197,24,0.3)' : '1px solid var(--border)',
            transition:'all 0.15s',
          }}>{o.label}</button>
        ))}
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
        {sorted.map((m,i) => {
          const tier = getTier(m.level);
          const isMe = m.userId === currentUserId;
          const isAdm = m.userId === adminId;
          const rankEmoji = i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`;
          const rankColor = i===0?'#f5c518':i===1?'#c0c0c0':i===2?'#cd7f32':'var(--text-muted)';
          const rateColor = m.completionRatePercent>=80?'#22c55e':m.completionRatePercent>=50?'#f59e0b':'#ef4444';
          return (
            <div key={m.userId} style={{
              background:'var(--bg-card)',borderRadius:'14px',
              border: isMe ? '1px solid rgba(245,197,24,0.3)' : '1px solid var(--border)',
              padding:'16px 20px',
              boxShadow: isMe ? '0 0 20px rgba(245,197,24,0.05)' : 'none',
            }}>
              <div style={{display:'flex',alignItems:'center',gap:'14px',flexWrap:'wrap'}}>
                <div style={{fontSize:'16px',width:'24px',textAlign:'center',flexShrink:0,color:rankColor,fontWeight:800}}>
                  {rankEmoji}
                </div>
                <div style={{position:'relative',flexShrink:0}}>
                  <div style={{
                    width:'40px',height:'40px',borderRadius:'50%',
                    background:m.avatarColor||'#f5c518',color:'#000',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontWeight:800,fontSize:'15px',
                    boxShadow:tier.frame!=='none'?`0 0 0 2px ${tier.color}`:'none',
                  }}>{m.fullName?.[0]?.toUpperCase()}</div>
                  <div style={{
                    position:'absolute',bottom:'-3px',right:'-3px',
                    background:'var(--bg-card)',border:`1px solid ${tier.color}`,
                    borderRadius:'999px',fontSize:'8px',fontWeight:800,
                    color:tier.color,padding:'1px 4px',lineHeight:1.4,
                  }}>Lv{m.level}</div>
                </div>
                <div style={{flex:'1 1 120px',minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap'}}>
                    <span style={{fontSize:'14px',fontWeight:700,color:isMe?'var(--accent)':'var(--text-primary)'}}>
                      {m.fullName}{isMe?' (You)':''}
                    </span>
                    {isAdm && <span style={{fontSize:'9px',background:'rgba(245,197,24,0.15)',color:'var(--accent)',border:'1px solid rgba(245,197,24,0.3)',borderRadius:'999px',padding:'1px 6px',fontWeight:700}}>ADMIN</span>}
                  </div>
                  <div style={{fontSize:'11px',color:tier.color,marginTop:'2px',fontWeight:600}}>{m.titleBadge}</div>
                </div>
                <StatRing value={m.tasksCompleted} max={m.tasksAssigned} color={rateColor}/>
                <div style={{display:'flex',gap:'16px',flexWrap:'wrap'}}>
                  {[
                    {label:'Done',   value:m.tasksCompleted,        color:'#22c55e'},
                    {label:'Denied', value:m.tasksDenied,           color:'#ef4444'},
                    {label:'Pending',value:m.tasksPending,          color:'#f59e0b'},
                    {label:'Coins',  value:m.coins,                 color:'var(--accent)'},
                    {label:'XP',     value:m.totalXp,               color:'#a855f7'},
                    {label:'Streak', value:`${m.streak}🔥`,         color:'#f97316'},
                  ].map((s,j) => (
                    <div key={j} style={{textAlign:'center',minWidth:'36px'}}>
                      <div style={{fontSize:'14px',fontWeight:800,color:s.color,lineHeight:1}}>{s.value}</div>
                      <div style={{fontSize:'9px',color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.3px',marginTop:'3px'}}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              {m.tasksAssigned > 0 && (
                <div style={{marginTop:'12px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px',fontSize:'10px',color:'var(--text-muted)'}}>
                    <span>{m.tasksCompleted}/{m.tasksAssigned} tasks completed</span>
                    <span style={{color:rateColor,fontWeight:700}}>{m.completionRatePercent}%</span>
                  </div>
                  <div style={{background:'var(--bg-elevated)',borderRadius:'999px',height:'4px',overflow:'hidden'}}>
                    <div style={{height:'100%',borderRadius:'999px',background:rateColor,width:`${m.completionRatePercent}%`,transition:'width 0.6s ease'}}/>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function GroupDetailPage() {
  const { groupId } = useParams();
  const router = useRouter();
  const [group,          setGroup]          = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [removeTarget,   setRemoveTarget]   = useState(null);
  const [removeReason,   setRemoveReason]   = useState('');
  const [showRemoveModal,setShowRemoveModal]= useState(false);
  const [user,           setUser]           = useState(null);
  const [xpMap,          setXpMap]          = useState({});
  const [inviteEmail,    setInviteEmail]    = useState('');
  const [msg,            setMsg]            = useState('');
  const [error,          setError]          = useState('');
  const [confirmModal,   setConfirmModal]   = useState(null);
  const [reasonModal,    setReasonModal]    = useState(null);
  const [reasonText,     setReasonText]     = useState('');
  const [activeTab,      setActiveTab]      = useState('MEMBERS');
  const [activities,     setActivities]     = useState([]);
  const [groupRewards,   setGroupRewards]   = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    fetchGroup(); fetchActivities(); fetchGroupRewards();
  }, []);

  const fetchGroup = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/groups/${groupId}/detail`,
        { headers:{ Authorization:`Bearer ${token}` } }
      );
      setGroup(res.data);
      fetchXpForMembers(res.data?.members || []);
    } catch { setError('Failed to load group.'); }
    finally { setLoading(false); }
  };

  const fetchXpForMembers = async (members) => {
    const token = localStorage.getItem('token');
    const results = {};
    await Promise.all(members.map(async (m) => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/xp/user/${m.id??m._id}`,
          { headers:{ Authorization:`Bearer ${token}` } }
        );
        results[m.id??m._id] = res.data;
      } catch {}
    }));
    try {
      const myXp = await getMyXP();
      const me = JSON.parse(localStorage.getItem('user')||'{}');
      if (me) results[me.id??me._id] = myXp.data;
    } catch {}
    setXpMap(results);
  };

  const getXpInfo = (userId) => {
    const xp = xpMap[userId];
    if (!xp) return { level:1, tier:TITLE_TIERS[0] };
    return { level:xp.level||1, tier:getTier(xp.level||1) };
  };

  const fetchActivities   = async () => { try { const r = await getGroupActivities(groupId);  setActivities(r.data);   } catch {} };
  const fetchGroupRewards = async () => { try { const r = await getRedeemHistory(groupId);     setGroupRewards(r.data); } catch {} };

  const handleInvite = async (e) => {
    e.preventDefault(); setMsg(''); setError('');
    try { await inviteByEmail(groupId, inviteEmail); setMsg('Invite sent!'); setInviteEmail(''); }
    catch (err) { setError(err.response?.data?.message || 'Failed to send invite.'); }
  };

  const handleLeaveGroup = () => setConfirmModal({
    title:'🚪 Leave Group', message:'Are you sure you want to leave this group?', confirmLabel:'Yes, Leave',
    onConfirm: async () => {
      try { await leaveGroup(groupId); router.push('/groups'); }
      catch (err) { setError(err.response?.data?.message||'Failed.'); setConfirmModal(null); }
    },
  });

  const handleDeleteGroup = () => setConfirmModal({
    title:'🗑️ Delete Group', message:'Delete this group? This cannot be undone.', confirmLabel:'Yes, Delete',
    onConfirm: async () => {
      try { await deleteGroup(groupId); router.push('/groups'); }
      catch (err) { setError(err.response?.data?.message||'Failed.'); setConfirmModal(null); }
    },
  });

  const handleRemoveMember = (m) => { setRemoveTarget(m); setRemoveReason(''); setShowRemoveModal(true); };
  const confirmRemoveMember = async () => {
    if (!removeTarget) return;
    try {
      await removeMember(groupId, removeTarget.id, removeReason);
      setShowRemoveModal(false); setRemoveTarget(null);
      setMsg(`${removeTarget.fullName} has been removed.`);
      fetchGroup(); fetchActivities();
    } catch (err) { setError(err.response?.data?.message||'Failed.'); setShowRemoveModal(false); }
  };

  const handleDeactivateMember = (member) => {
    setReasonText('');
    setReasonModal({
      title:`Deactivate ${member.fullName}?`, subtitle:'Provide a reason — it will be emailed to the member.',
      btnLabel:'Deactivate', btnColor:'#f5c518', btnTextColor:'#000',
      onConfirm: async (reason) => {
        try { await deactivateMember(groupId, member.id, reason); setReasonModal(null); setMsg(`${member.fullName} deactivated.`); fetchGroup(); }
        catch (err) { setError(err.response?.data?.message||'Failed.'); setReasonModal(null); }
      },
    });
  };

  const handleReactivateMember = async (member) => {
    try { await reactivateMember(groupId, member.id); setMsg(`${member.fullName} reactivated.`); fetchGroup(); }
    catch (err) { setError(err.response?.data?.message||'Failed.'); }
  };

  const isAdmin        = user?.id === group?.adminId;
  const deactivatedIds = group?.deactivatedMemberIds || [];
  const validMembers   = group?.members?.filter(m => m.fullName && m.fullName !== 'Unknown User') || [];

  const quickLinks = [
    { label:'✅ Tasks',       href:`/groups/${groupId}/tasks`       },
    { label:'🏆 Leaderboard', href:`/groups/${groupId}/leaderboard` },
    { label:'💬 Chat',        href:`/groups/${groupId}/chat`        },
    { label:'⚖️ Fairness',   href:`/groups/${groupId}/fairness`    },
  ];

  const tabs = [
    { key:'MEMBERS',      label:'👥 Members'      },
    { key:'ANALYTICS',    label:'📊 Analytics'    },
    { key:'HALL_OF_FAME', label:'⭐ Hall of Fame' },
    { key:'ACTIVITY',     label:'🔔 Activity'     },
    { key:'REWARDS',      label:'🏆 Rewards'      },
  ];

  const TITLE_TIERS_DISPLAY = TITLE_TIERS.slice(1).reverse();
  const hallOfFame = TITLE_TIERS_DISPLAY.map(tier => {
    const holders = validMembers
      .map(m => ({ member:m, ...getXpInfo(m.id??m._id) }))
      .filter(({ level }) => getTier(level).frame === tier.frame)
      .sort((a,b) => b.level - a.level);
    return { tier, holders };
  });

  if (loading) return <div style={{color:'#f5c518',padding:'40px'}}>🐝 Loading...</div>;

  return (
    <div className="animate-fadeSlideUp">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {showRemoveModal && removeTarget && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:400,padding:'16px'}}>
          <div style={{background:'var(--bg-card)',border:'1px solid var(--border-hover)',borderRadius:'16px',padding:'28px',width:'100%',maxWidth:'400px'}}>
            <h3 style={{fontSize:'16px',fontWeight:700,marginBottom:'6px'}}>Remove Member</h3>
            <p style={{fontSize:'13px',color:'var(--text-secondary)',marginBottom:'20px'}}>
              Remove <strong style={{color:'var(--text-primary)'}}>{removeTarget.fullName}</strong> from this group?
            </p>
            <textarea className="input" placeholder="Reason (optional)..." value={removeReason} onChange={e=>setRemoveReason(e.target.value)} rows={3} style={{resize:'none',marginBottom:'16px'}}/>
            <div style={{display:'flex',gap:'10px',justifyContent:'flex-end'}}>
              <button onClick={()=>{setShowRemoveModal(false);setRemoveTarget(null);}} style={{background:'none',border:'1px solid var(--border)',color:'var(--text-secondary)',borderRadius:'8px',padding:'8px 18px',fontSize:'13px',cursor:'pointer'}}>Cancel</button>
              <button onClick={confirmRemoveMember} style={{background:'rgba(239,68,68,0.12)',border:'1px solid rgba(239,68,68,0.3)',color:'var(--danger)',borderRadius:'8px',padding:'8px 18px',fontSize:'13px',cursor:'pointer',fontWeight:700}}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {confirmModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'16px',padding:'32px',maxWidth:'400px',width:'90%'}}>
            <h3 style={{fontSize:'18px',fontWeight:700,marginBottom:'12px'}}>{confirmModal.title}</h3>
            <p style={{color:'var(--text-secondary)',fontSize:'14px',marginBottom:'28px',lineHeight:'1.6'}}>{confirmModal.message}</p>
            <div style={{display:'flex',gap:'12px',justifyContent:'flex-end'}}>
              <button className="btn-outline" onClick={()=>setConfirmModal(null)}>Cancel</button>
              <button onClick={confirmModal.onConfirm} style={{background:'#ef4444',color:'#fff',border:'none',borderRadius:'8px',padding:'8px 20px',fontSize:'14px',fontWeight:600,cursor:'pointer'}}>{confirmModal.confirmLabel}</button>
            </div>
          </div>
        </div>
      )}

      {reasonModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'16px',padding:'32px',maxWidth:'420px',width:'90%'}}>
            <h3 style={{fontSize:'18px',fontWeight:700,marginBottom:'8px'}}>{reasonModal.title}</h3>
            <p style={{color:'var(--text-secondary)',fontSize:'13px',marginBottom:'16px'}}>{reasonModal.subtitle}</p>
            <textarea value={reasonText} onChange={e=>setReasonText(e.target.value)} placeholder="Write a reason (optional)..." rows={3} style={{width:'100%',background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:'10px',color:'var(--text-primary)',padding:'10px 14px',fontSize:'13px',outline:'none',resize:'vertical',fontFamily:'inherit',boxSizing:'border-box'}}/>
            <div style={{display:'flex',gap:'10px',marginTop:'16px',justifyContent:'flex-end'}}>
              <button className="btn-outline" onClick={()=>setReasonModal(null)}>Cancel</button>
              <button onClick={()=>reasonModal.onConfirm(reasonText)} style={{background:reasonModal.btnColor,color:reasonModal.btnTextColor,border:'none',borderRadius:'8px',padding:'8px 20px',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>{reasonModal.btnLabel}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{marginBottom:'24px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'16px',marginBottom:'8px'}}>
          <div style={{width:'56px',height:'56px',borderRadius:'16px',background:'rgba(245,197,24,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'28px',border:'1px solid rgba(245,197,24,0.2)'}}>🐝</div>
          <div>
            <h1 style={{fontSize:'26px',fontWeight:800}}>{group?.name}</h1>
            <p style={{color:'var(--text-muted)',fontSize:'13px',margin:0}}>{group?.description}</p>
          </div>
        </div>
        <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginTop:'16px'}}>
          {quickLinks.map(link => (
            <Link key={link.href} href={link.href}>
              <button className="btn-outline" style={{fontSize:'13px',padding:'7px 16px'}}>{link.label}</button>
            </Link>
          ))}
        </div>
      </div>

      {msg   && <div style={{background:'rgba(34,197,94,0.1)',border:'1px solid #22c55e',borderRadius:'8px',padding:'10px 14px',color:'#22c55e',fontSize:'13px',marginBottom:'16px'}}>✓ {msg}</div>}
      {error && <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid #ef4444',borderRadius:'8px',padding:'10px 14px',color:'#ef4444',fontSize:'13px',marginBottom:'16px'}}>{error}</div>}

      <div style={{display:'flex',gap:'0',marginBottom:'24px',borderBottom:'1px solid var(--border)',overflowX:'auto'}}>
        {tabs.map(t => (
          <button key={t.key} onClick={()=>setActiveTab(t.key)} style={{
            padding:'10px 18px',fontSize:'13px',fontWeight:activeTab===t.key?700:500,
            background:'transparent',border:'none',cursor:'pointer',
            color:activeTab===t.key?'var(--accent)':'var(--text-muted)',
            borderBottom:activeTab===t.key?'2px solid var(--accent)':'2px solid transparent',
            transition:'all 0.2s',whiteSpace:'nowrap',marginBottom:'-1px',
          }}>{t.label}</button>
        ))}
      </div>

      {activeTab==='MEMBERS' && (
        <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
          <div className="card" style={{padding:'24px'}}>
            <h2 style={{fontSize:'16px',fontWeight:700,marginBottom:'16px'}}>👥 Members ({validMembers.length})</h2>
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {validMembers.map((member,i) => {
                const isDeactivated = deactivatedIds.includes(member.id);
                const memberId = member.id??member._id;
                const { level, tier } = getXpInfo(memberId);
                return (
                  <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',background:isDeactivated?'rgba(239,68,68,0.05)':'var(--bg-elevated)',borderRadius:'10px',border:isDeactivated?'1px solid rgba(239,68,68,0.2)':'1px solid transparent'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                      <div style={{position:'relative'}}>
                        <div style={{width:'36px',height:'36px',borderRadius:'50%',background:member.avatarColor||'#f5c518',color:'#000',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'14px',opacity:isDeactivated?0.5:1,boxShadow:tier.frame!=='none'?`0 0 0 2px ${tier.color}`:'none'}}>{member.fullName?.[0]?.toUpperCase()}</div>
                        {level>1&&<div style={{position:'absolute',bottom:'-3px',right:'-3px',background:'var(--bg-card)',border:`1px solid ${tier.color}`,borderRadius:'999px',fontSize:'8px',fontWeight:800,color:tier.color,padding:'1px 4px',lineHeight:1.4}}>{level}</div>}
                      </div>
                      <div>
                        <div style={{color:isDeactivated?'#666':'var(--text-primary)',fontSize:'14px',fontWeight:600}}>{member.fullName}</div>
                        <div style={{fontSize:'11px',color:tier.color,fontWeight:600,marginTop:'2px'}}>{tier.title}</div>
                      </div>
                      <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                        {memberId===group.adminId&&<span className="badge badge-yellow">Admin</span>}
                        {isDeactivated&&<span style={{background:'rgba(239,68,68,0.15)',color:'#f87171',fontSize:'10px',padding:'2px 8px',borderRadius:'999px',fontWeight:700}}>DEACTIVATED</span>}
                      </div>
                    </div>
                    {isAdmin&&memberId!==(user?.id??user?._id)&&(
                      <div style={{display:'flex',gap:'8px'}}>
                        {isDeactivated
                          ?<button onClick={()=>handleReactivateMember(member)} style={{background:'none',border:'none',color:'#34d399',cursor:'pointer',fontSize:'12px',fontWeight:600}}>Reactivate</button>
                          :<button onClick={()=>handleDeactivateMember(member)} style={{background:'none',border:'none',color:'#f5c518',cursor:'pointer',fontSize:'12px',fontWeight:600}}>Deactivate</button>
                        }
                        <button onClick={()=>handleRemoveMember(member)} style={{background:'none',border:'none',color:'#ef4444',cursor:'pointer',fontSize:'12px',fontWeight:600}}>Remove</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {isAdmin&&(
            <div className="card" style={{padding:'24px'}}>
              <h2 style={{fontSize:'16px',fontWeight:700,marginBottom:'4px'}}>📧 Invite by Email</h2>
              <p style={{color:'var(--text-muted)',fontSize:'12px',marginBottom:'16px'}}>An invite link will be sent to their email.</p>
              <form onSubmit={handleInvite} style={{display:'flex',gap:'10px'}}>
                <input className="input" type="email" placeholder="member@example.com" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} required style={{flex:1}}/>
                <button className="btn-primary" type="submit" style={{whiteSpace:'nowrap'}}>Send Invite</button>
              </form>
            </div>
          )}

          <div style={{display:'flex',justifyContent:'flex-end'}}>
            {!isAdmin&&<button className="btn-outline" onClick={handleLeaveGroup} style={{color:'#ef4444',borderColor:'#ef4444'}}>🚪 Leave Group</button>}
            {isAdmin&&<button className="btn-outline" onClick={handleDeleteGroup} style={{color:'#ef4444',borderColor:'#ef4444'}}>🗑️ Delete Group</button>}
          </div>
        </div>
      )}

      {activeTab==='ANALYTICS' && (
        <MemberAnalyticsTab groupId={groupId} currentUserId={user?.id} adminId={group?.adminId}/>
      )}

      {activeTab==='HALL_OF_FAME' && (
        <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
          {hallOfFame.map(({tier,holders}) => (
            <div key={tier.frame} style={{background:'var(--bg-card)',borderRadius:'16px',border:`1px solid ${tier.color}44`,padding:'20px 24px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'14px'}}>
                <div style={{width:'34px',height:'34px',borderRadius:'50%',background:`${tier.color}22`,border:`2px solid ${tier.color}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',color:tier.color,fontWeight:800}}>
                  {tier.frame==='elite'?'👑':tier.frame==='purple'?'💜':tier.frame==='gold'?'🌟':tier.frame==='silver'?'🥈':'🥉'}
                </div>
                <div>
                  <div style={{fontWeight:800,fontSize:'14px',color:tier.color}}>{tier.title}</div>
                  <div style={{fontSize:'11px',color:'var(--text-muted)'}}>Level {tier.minLevel}+ required</div>
                </div>
              </div>
              {holders.length===0
                ?<div style={{color:'var(--text-muted)',fontSize:'13px',fontStyle:'italic'}}>Nobody yet — be the first to reach Level {tier.minLevel}! 🐝</div>
                :<div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                  {holders.map(({member,level}) => {
                    const isMe=(member.id??member._id)===(user?.id??user?._id);
                    return (
                      <div key={member.id??member._id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 12px',background:'var(--bg-elevated)',borderRadius:'8px'}}>
                        <div style={{width:'28px',height:'28px',borderRadius:'50%',background:`${tier.color}22`,border:`2px solid ${tier.color}`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'11px',color:tier.color}}>{member.fullName?.[0]?.toUpperCase()}</div>
                        <span style={{flex:1,fontSize:'13px',fontWeight:600,color:isMe?'#f5c518':'var(--text-primary)'}}>{member.fullName}{isMe?' (You)':''}</span>
                        <span style={{background:`${tier.color}22`,border:`1px solid ${tier.color}55`,borderRadius:'999px',padding:'2px 10px',fontSize:'11px',fontWeight:800,color:tier.color}}>Lv.{level}</span>
                      </div>
                    );
                  })}
                </div>
              }
            </div>
          ))}
        </div>
      )}

      {activeTab==='ACTIVITY' && (
        <div className="card" style={{padding:'24px'}}>
          <h2 style={{fontSize:'16px',fontWeight:700,marginBottom:'16px'}}>🔔 Group Activity</h2>
          {activities.length===0
            ?<div style={{color:'var(--text-muted)',textAlign:'center',padding:'32px',fontSize:'13px'}}>No activity yet. Start assigning tasks! 🐝</div>
            :<div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {activities.map((a,i) => (
                <div key={i} style={{display:'flex',alignItems:'flex-start',gap:'12px',padding:'12px',background:'var(--bg-elevated)',borderRadius:'10px'}}>
                  <span style={{fontSize:'18px',flexShrink:0}}>{activityIcon[a.type]||'📌'}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'13px',fontWeight:600}}>
                      <span style={{color:'var(--accent)'}}>{a.actorName}</span>
                      {a.targetName&&<> → <span style={{color:'var(--text-muted)'}}>{a.targetName}</span></>}
                    </div>
                    <div style={{fontSize:'12px',color:'var(--text-muted)',marginTop:'2px'}}>{a.detail}</div>
                    {a.coins!==0&&<div style={{fontSize:'11px',color:a.coins>0?'var(--accent)':'#ef4444',marginTop:'2px'}}>{a.coins>0?`+${a.coins}`:a.coins}🪙</div>}
                  </div>
                  <div style={{fontSize:'11px',color:'var(--text-muted)',flexShrink:0,textAlign:'right'}}>
                    {new Date(a.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}<br/>
                    {new Date(a.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          }
        </div>
      )}

      {activeTab==='REWARDS' && (
        <div className="card" style={{padding:'24px'}}>
          <h2 style={{fontSize:'16px',fontWeight:700,marginBottom:'16px'}}>🏆 Group Reward Redemptions</h2>
          {groupRewards.length===0
            ?<div style={{color:'var(--text-muted)',textAlign:'center',padding:'32px',fontSize:'13px'}}>No rewards redeemed yet.</div>
            :<div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {groupRewards.map((r,i) => (
                <div key={i} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px',background:'var(--bg-elevated)',borderRadius:'10px'}}>
                  <span style={{fontSize:'20px'}}>🎁</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'13px',fontWeight:600}}>{r.description}</div>
                    <div style={{fontSize:'11px',color:'var(--text-muted)'}}>{new Date(r.earnedAt).toLocaleDateString()}</div>
                  </div>
                  <span style={{color:'#ef4444',fontWeight:700}}>{r.coinsEarned}🪙</span>
                </div>
              ))}
            </div>
          }
        </div>
      )}
    </div>
  );
}
