'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { getChatMessages, getMyXP, getGroupDetail } from '@/lib/api';
import axios from 'axios';

const TITLE_TIERS = [
  { frame: 'none',   title: 'Newcomer',       minLevel: 1,  color: '#666' },
  { frame: 'bronze', title: 'Task Starter',   minLevel: 3,  color: '#cd7f32' },
  { frame: 'silver', title: 'Steady Worker',  minLevel: 6,  color: '#c0c0c0' },
  { frame: 'gold',   title: 'Dedicated Bee',  minLevel: 10, color: '#f5c518' },
  { frame: 'purple', title: 'Quest Champion', minLevel: 15, color: '#a855f7' },
  { frame: 'elite',  title: 'Elite Bee',      minLevel: 20, color: '#ef4444' },
];

function getTier(level = 1) {
  let tier = TITLE_TIERS[0];
  for (const t of TITLE_TIERS) { if (level >= t.minLevel) tier = t; }
  return tier;
}

export default function ChatPage() {
  const { groupId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState(null);
  const [xpMap, setXpMap] = useState({});
  const [levelUpBanner, setLevelUpBanner] = useState(null);
  const [prevLevel, setPrevLevel] = useState(null);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    fetchMessages();
    fetchGroupXp();
    pollRef.current = setInterval(fetchMessages, 3000);
    return () => clearInterval(pollRef.current);
  }, [groupId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchGroupXp = async () => {
    try {
      const token = localStorage.getItem('token');
      const groupRes = await getGroupDetail(groupId);
      const members = groupRes.data?.members || [];
      const results = {};
      await Promise.all(members.map(async (m) => {
        try {
          const res = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/xp/user/${m.id ?? m._id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          results[m.id ?? m._id] = res.data;
        } catch {}
      }));
      // My own XP via /xp/me (most accurate)
      try {
        const myXp = await getMyXP();
        const stored = localStorage.getItem('user');
        const me = stored ? JSON.parse(stored) : null;
        if (me) {
          const myId = me.id ?? me._id;
          const newLevel = myXp.data?.level || 1;
          // Check for level-up
          if (prevLevel && newLevel > prevLevel) {
            const tier = getTier(newLevel);
            setLevelUpBanner(`You reached Level ${newLevel} — ${tier.title}! 🎉`);
            setTimeout(() => setLevelUpBanner(null), 5000);
          }
          setPrevLevel(newLevel);
          results[myId] = myXp.data;
        }
      } catch {}
      setXpMap(results);
    } catch {}
  };

  const fetchMessages = async () => {
    try {
      const res = await getChatMessages(groupId);
      setMessages(res.data);
    } catch {}
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/chat/${groupId}/messages`,
        { content: input.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInput('');
      fetchMessages();
    } catch {}
    setSending(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const getXpInfo = (userId) => {
    const xp = xpMap[userId];
    if (!xp) return { level: 1, tier: TITLE_TIERS[0] };
    const level = xp.level || 1;
    return { level, tier: getTier(level) };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', maxWidth: '700px', position: 'relative' }}>

      {/* Level-up banner */}
      {levelUpBanner && (
        <div style={{ position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)', zIndex: 999, background: 'linear-gradient(135deg,#f5c518,#ff9500)', color: '#000', borderRadius: '12px', padding: '12px 24px', fontWeight: 800, fontSize: '14px', boxShadow: '0 8px 32px rgba(245,197,24,0.5)', whiteSpace: 'nowrap', animation: 'fadeSlideUp 0.4s ease' }}>
          🎉 {levelUpBanner}
        </div>
      )}

      <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '16px' }}>💬 Group Chat</h1>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', padding: '4px 0', marginBottom: '16px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#a0a0a0', padding: '60px', fontSize: '14px' }}>No messages yet. Say hello! 👋</div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.userId === user?.id;
          const { level, tier } = getXpInfo(msg.userId);
          const initial = (msg.authorName || '?')[0]?.toUpperCase();

          return (
            <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '8px' }}>
              {/* Other person's avatar */}
              {!isMe && (
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: '#2a2a2a', color: tier.color || '#a0a0a0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '13px',
                    boxShadow: tier.frame !== 'none' ? `0 0 0 2px ${tier.color}` : 'none',
                    flexShrink: 0,
                  }}>{initial}</div>
                  {level > 1 && (
                    <div style={{ position: 'absolute', bottom: '-3px', right: '-3px', background: '#111', border: `1px solid ${tier.color}`, borderRadius: '999px', fontSize: '7px', fontWeight: 800, color: tier.color, padding: '1px 3px', lineHeight: 1.4 }}>
                      {level}
                    </div>
                  )}
                </div>
              )}

              <div style={{ maxWidth: '70%' }}>
                {/* Name + title for others */}
                {!isMe && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', paddingLeft: '2px' }}>
                    <span style={{ fontSize: '11px', color: '#f5c518', fontWeight: 700 }}>{msg.authorName}</span>
                    {tier.frame !== 'none' && (
                      <span style={{ fontSize: '10px', color: tier.color, fontWeight: 600, background: `${tier.color}15`, borderRadius: '999px', padding: '1px 6px' }}>
                        {tier.title}
                      </span>
                    )}
                  </div>
                )}

                <div style={{
                  padding: '10px 14px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: isMe ? 'rgba(245,197,24,0.15)' : '#1a1a1a',
                  border: isMe ? '1px solid rgba(245,197,24,0.3)' : '1px solid #2a2a2a',
                }}>
                  <div style={{ fontSize: '14px', color: '#fff', lineHeight: '1.5' }}>{msg.content}</div>
                  <div style={{ fontSize: '10px', color: '#555', marginTop: '4px', textAlign: 'right' }}>
                    {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              {/* My avatar */}
              {isMe && (
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: '#f5c518', color: '#000',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '13px',
                    boxShadow: (() => { const { tier } = getXpInfo(user?.id); return tier.frame !== 'none' ? `0 0 0 2px ${tier.color}` : 'none'; })(),
                    flexShrink: 0,
                  }}>{(user?.fullName || user?.username || 'Y')[0]?.toUpperCase()}</div>
                  {getXpInfo(user?.id).level > 1 && (
                    <div style={{ position: 'absolute', bottom: '-3px', right: '-3px', background: '#111', border: `1px solid ${getXpInfo(user?.id).tier.color}`, borderRadius: '999px', fontSize: '7px', fontWeight: 800, color: getXpInfo(user?.id).tier.color, padding: '1px 3px', lineHeight: 1.4 }}>
                      {getXpInfo(user?.id).level}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
        <textarea
          value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
          placeholder="Type a message... (Enter to send)" rows={2}
          style={{ flex: 1, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', color: '#fff', padding: '12px 14px', fontSize: '14px', resize: 'none', outline: 'none', fontFamily: 'inherit' }}
        />
        <button onClick={sendMessage} disabled={sending || !input.trim()} style={{
          background: input.trim() ? '#f5c518' : '#2a2a2a', color: input.trim() ? '#000' : '#555',
          border: 'none', borderRadius: '12px', padding: '12px 18px', fontWeight: 700,
          cursor: input.trim() ? 'pointer' : 'not-allowed', fontSize: '16px', height: '52px', transition: 'all 0.2s',
        }}>➤</button>
      </div>
    </div>
  );
}
