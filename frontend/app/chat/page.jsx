'use client';

import { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getMyConversations,
  getDmMessages,
  sendDirectMessage,
  startConversation,
  markConversationRead,
  getMyGroups,
  getGroupDetail,
} from '@/lib/api';

const POLL_MS = 4000;
const AVATAR_COLORS = ['var(--accent)', 'var(--info)', 'var(--purple)', 'var(--success)', 'var(--warning)', 'var(--danger)'];

function colorForId(id) {
  if (!id) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatBubbleTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatListTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function dayLabel(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
}

function groupMessagesByDay(messages) {
  const groups = [];
  let lastDay = null;
  messages.forEach((m) => {
    const day = new Date(m.sentAt).toDateString();
    if (day !== lastDay) {
      groups.push({ type: 'day', key: `day-${day}`, label: dayLabel(m.sentAt) });
      lastDay = day;
    }
    groups.push({ type: 'msg', key: m.id, data: m });
  });
  return groups;
}

function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

function ChatPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const me = getCurrentUser();

  const [conversations, setConversations] = useState([]);
  const [memberMap, setMemberMap] = useState({});
  const [activeId, setActiveId] = useState(searchParams.get('c') || null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  const threadEndRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    getMyGroups()
      .then(async (res) => {
        const groups = res.data;
        if (!groups?.length) return;
        const details = await Promise.all(
          groups.map((g) => getGroupDetail(g.id).catch(() => null))
        );
        const map = {};
        details.forEach((detail) => {
          if (!detail) return;
          const members = detail.data.members || detail.data.memberList || [];
          members.forEach((m) => {
            map[m.id] = { fullName: m.fullName, avatarColor: m.avatarColor, email: m.email };
          });
        });
        setMemberMap(map);
      })
      .catch(() => setError('Could not load group members.'));
  }, []);

  const otherIdOf = (convo) => convo.otherUserId;

  const loadConversations = useCallback(async () => {
    try {
      const res = await getMyConversations();
      setConversations(res.data);
    } catch {
      setError('Could not load conversations.');
    }
  }, []);

  useEffect(() => {
    loadConversations();
    const id = setInterval(loadConversations, POLL_MS);
    return () => clearInterval(id);
  }, [loadConversations]);

  const loadThread = useCallback(async (conversationId) => {
    if (!conversationId) return;
    try {
      const res = await getDmMessages(conversationId);
      setMessages(res.data);
    } catch {
      setError('Could not load this conversation.');
    }
  }, []);

  useEffect(() => {
    if (!activeId) return;
    setLoadingThread(true);
    loadThread(activeId).finally(() => setLoadingThread(false));
    markConversationRead(activeId).catch(() => {});

    clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadThread(activeId), POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [activeId, loadThread]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openConversation = (id) => {
    setActiveId(id);
    router.replace(`/chat?c=${id}`);
  };

  const startConversationWith = async (memberId) => {
    try {
      const res = await startConversation(memberId);
      setPickerOpen(false);
      await loadConversations();
      openConversation(res.data.id);
    } catch {
      setError('Could not start conversation.');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !activeId || sending) return;
    setSending(true);
    setDraft('');
    try {
      const res = await sendDirectMessage(activeId, text);
      setMessages((prev) => [...prev, res.data]);
      loadConversations();
    } catch {
      setError('Message failed to send.');
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  const activeConvo = conversations.find((c) => c.conversationId === activeId);
  const activeOther = activeConvo ? memberMap[otherIdOf(activeConvo)] : null;
  const activeOtherName = activeConvo?.otherUserName || activeOther?.fullName || 'Conversation';
  const activeOtherColor = activeOther?.avatarColor || colorForId(activeConvo ? otherIdOf(activeConvo) : null);
  const grouped = groupMessagesByDay(messages);

  return (
    <div className="animate-fadeSlideUp" style={styles.wrapper}>
      <aside className="card" style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>💬 Messages</h2>
          <button className="btn-primary" style={styles.newBtn} onClick={() => setPickerOpen(true)} title="New message">
            +
          </button>
        </div>

        {conversations.length === 0 && (
          <div className="empty-state" style={{ margin: '16px' }}>
            <div className="empty-state-icon">💬</div>
            <div className="empty-state-title">No conversations yet</div>
            <div className="empty-state-desc">Start one from the + button above.</div>
          </div>
        )}

        <ul style={styles.convoList}>
          {conversations.map((c) => {
            const other = memberMap[otherIdOf(c)];
            const name = c.otherUserName || other?.fullName || 'Unknown';
            const color = other?.avatarColor || colorForId(otherIdOf(c));
            const isActive = c.conversationId === activeId;
            const isHovered = hoveredId === c.conversationId;
            const unread = c.unreadCount > 0;
            return (
              <li
                key={c.conversationId}
                onClick={() => openConversation(c.conversationId)}
                onMouseEnter={() => setHoveredId(c.conversationId)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  ...styles.convoItem,
                  ...(isActive ? styles.convoItemActive : isHovered ? styles.convoItemHover : {}),
                }}
              >
                <div style={{ ...styles.avatar, backgroundColor: color, boxShadow: isActive ? '0 0 0 2px var(--accent)' : 'none' }}>
                  {name?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={styles.convoMeta}>
                  <div style={styles.convoTopRow}>
                    <span style={{ ...styles.convoName, color: isActive ? 'var(--accent)' : 'var(--text-primary)', fontWeight: unread ? 800 : 600 }}>
                      {name}
                    </span>
                    <span style={styles.convoTime}>{formatListTime(c.lastMessageAt)}</span>
                  </div>
                  <div style={styles.convoBottomRow}>
                    <span style={{ ...styles.convoPreview, fontWeight: unread ? 700 : 400, color: unread ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {c.lastMessagePreview || 'Say hello 👋'}
                    </span>
                    {unread && <span className="badge badge-yellow" style={{ flexShrink: 0 }}>{c.unreadCount}</span>}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </aside>

      <main className="card" style={styles.thread}>
        {!activeId && (
          <div className="empty-state" style={{ margin: 'auto' }}>
            <div className="empty-state-icon">🐝</div>
            <div className="empty-state-title">Pick a conversation</div>
            <div className="empty-state-desc">Or start a new one from the sidebar.</div>
          </div>
        )}

        {activeId && (
          <>
            <div style={styles.threadHeader}>
              <div style={{ ...styles.avatar, backgroundColor: activeOtherColor }}>
                {activeOtherName?.[0]?.toUpperCase() || '?'}
              </div>
              <span style={styles.threadName}>{activeOtherName}</span>
            </div>

            <div style={styles.threadBody}>
              {loadingThread && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
                  <div style={{ width: 20, height: 20, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</span>
                </div>
              )}
              {!loadingThread && messages.length === 0 && (
                <div className="empty-state" style={{ margin: 'auto', border: 'none', background: 'transparent' }}>
                  <div className="empty-state-icon">👋</div>
                  <div className="empty-state-title">Say hello</div>
                  <div className="empty-state-desc">This is the start of your conversation with {activeOtherName}.</div>
                </div>
              )}
              {!loadingThread &&
                grouped.map((item) => {
                  if (item.type === 'day') {
                    return (
                      <div key={item.key} style={styles.dayDivider}>
                        <span className="chip" style={{ cursor: 'default', pointerEvents: 'none' }}>{item.label}</span>
                      </div>
                    );
                  }
                  const m = item.data;
                  const mine = m.senderId === me?.id;
                  return (
                    <div key={item.key} style={{ ...styles.bubbleRow, justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                      <div style={{ ...styles.bubbleCol, alignItems: mine ? 'flex-end' : 'flex-start' }}>
                        <div style={{ ...styles.bubble, ...(mine ? styles.bubbleMine : styles.bubbleTheirs) }}>
                          {m.content}
                        </div>
                        <span style={styles.bubbleTime}>{formatBubbleTime(m.sentAt)}</span>
                      </div>
                    </div>
                  );
                })}
              <div ref={threadEndRef} />
            </div>

            <form style={styles.composer} onSubmit={handleSend}>
              <input
                className="input"
                style={styles.input}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message…"
              />
              <button className="btn-primary" style={styles.sendBtn} type="submit" disabled={sending || !draft.trim()}>
                {sending ? '…' : '➤'}
              </button>
            </form>
          </>
        )}
      </main>

      {pickerOpen && (
        <div className="modal-overlay" onClick={() => setPickerOpen(false)}>
          <div className="modal-box" style={{ width: 360, maxHeight: '70vh', overflowY: 'auto', padding: 20 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.sidebarTitle}>New message</h3>
            <ul style={styles.convoList}>
              {Object.entries(memberMap)
                .filter(([id]) => id !== me?.id)
                .map(([id, m]) => (
                  <li key={id} style={styles.convoItem} onClick={() => startConversationWith(id)}>
                    <div style={{ ...styles.avatar, backgroundColor: m.avatarColor || colorForId(id) }}>
                      {m.fullName?.[0]?.toUpperCase()}
                    </div>
                    <div style={styles.convoMeta}>
                      <div style={styles.convoName}>{m.fullName}</div>
                      <div style={styles.convoPreview}>{m.email}</div>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      )}

      {error && <div className="toast toast-error">{error}</div>}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatPageInner />
    </Suspense>
  );
}

const styles = {
  wrapper: { display: 'flex', height: 'calc(100vh - 64px)', gap: 16, padding: 16, boxSizing: 'border-box' },
  sidebar: { width: 320, display: 'flex', flexDirection: 'column', padding: 0, flexShrink: 0 },
  sidebarHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', borderBottom: '1px solid var(--border)' },
  sidebarTitle: { fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' },
  newBtn: { width: 32, height: 32, borderRadius: '50%', padding: 0, justifyContent: 'center', fontSize: 18 },
  convoList: { listStyle: 'none', margin: 0, padding: 0, overflowY: 'auto' },
  convoItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', cursor: 'pointer', transition: 'background 0.2s', borderLeft: '3px solid transparent' },
  convoItemActive: { background: 'var(--accent-dim)', borderLeft: '3px solid var(--accent)' },
  convoItemHover: { background: 'var(--bg-elevated)' },
  avatar: { width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 800, flexShrink: 0, fontSize: 15 },
  convoMeta: { minWidth: 0, flex: 1 },
  convoTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  convoBottomRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 2 },
  convoName: { fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  convoTime: { fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 },
  convoPreview: { fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 },
  thread: { flex: 1, display: 'flex', flexDirection: 'column', padding: 0 },
  threadHeader: { display: 'flex', alignItems: 'center', gap: 12, padding: '16px 22px', borderBottom: '1px solid var(--border)' },
  threadName: { fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' },
  threadBody: { flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 2 },
  dayDivider: { display: 'flex', justifyContent: 'center', margin: '14px 0' },
  bubbleRow: { display: 'flex', marginTop: 6 },
  bubbleCol: { display: 'flex', flexDirection: 'column', maxWidth: '58%' },
  bubble: { padding: '10px 15px', borderRadius: 16, fontSize: 14, lineHeight: 1.45, wordBreak: 'break-word' },
  bubbleMine: { background: 'linear-gradient(135deg, var(--accent), #ffdd57)', color: '#000', fontWeight: 600, borderBottomRightRadius: 4 },
  bubbleTheirs: { background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderBottomLeftRadius: 4 },
  bubbleTime: { fontSize: 10, color: 'var(--text-muted)', marginTop: 4, padding: '0 4px' },
  composer: { display: 'flex', gap: 10, padding: 18, borderTop: '1px solid var(--border)', alignItems: 'center' },
  input: { flex: 1, borderRadius: 24, padding: '12px 18px' },
  sendBtn: { width: 42, height: 42, borderRadius: '50%', padding: 0, justifyContent: 'center', fontSize: 16 },
};
