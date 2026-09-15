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
  const [memberMap, setMemberMap] = useState({}); // userId -> { fullName, avatarColor, email }
  const [activeId, setActiveId] = useState(searchParams.get('c') || null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const threadEndRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    getMyGroups()
      .then(async (res) => {
        const groups = res.data;
        if (!groups?.length) return;
        const detail = await getGroupDetail(groups[0].id);
        const members = detail.data.members || detail.data.memberList || [];
        const map = {};
        members.forEach((m) => {
          map[m.id] = { fullName: m.fullName, avatarColor: m.avatarColor, email: m.email };
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

  return (
    <div className="animate-fadeSlideUp" style={styles.wrapper}>
      {/* ---- conversation list ---- */}
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
            const isActive = c.conversationId === activeId;
            return (
              <li
                key={c.conversationId}
                onClick={() => openConversation(c.conversationId)}
                style={{
                  ...styles.convoItem,
                  ...(isActive ? styles.convoItemActive : {}),
                }}
              >
                <div style={{ ...styles.avatar, backgroundColor: other?.avatarColor || 'var(--accent)' }}>
                  {name?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={styles.convoMeta}>
                  <div style={{ ...styles.convoName, color: isActive ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {name}
                    {c.unreadCount > 0 && <span className="badge badge-yellow" style={{ marginLeft: 8 }}>{c.unreadCount}</span>}
                  </div>
                  <div style={styles.convoPreview}>
                    {c.lastMessagePreview || 'Say hello 👋'}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* ---- thread ---- */}
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
              <div style={{ ...styles.avatar, backgroundColor: activeOther?.avatarColor || 'var(--accent)' }}>
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
              {!loadingThread &&
                messages.map((m) => {
                  const mine = m.senderId === me?.id;
                  return (
                    <div
                      key={m.id}
                      style={{ ...styles.bubbleRow, justifyContent: mine ? 'flex-end' : 'flex-start' }}
                    >
                      <div style={{ ...styles.bubble, ...(mine ? styles.bubbleMine : styles.bubbleTheirs) }}>
                        {m.content}
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
              <button className="btn-primary" type="submit" disabled={sending || !draft.trim()}>
                Send
              </button>
            </form>
          </>
        )}
      </main>

      {/* ---- new message picker ---- */}
      {pickerOpen && (
        <div className="modal-overlay" onClick={() => setPickerOpen(false)}>
          <div className="modal-box" style={{ width: 360, maxHeight: '70vh', overflowY: 'auto', padding: 20 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.sidebarTitle}>New message</h3>
            <ul style={styles.convoList}>
              {Object.entries(memberMap)
                .filter(([id]) => id !== me?.id)
                .map(([id, m]) => (
                  <li key={id} style={styles.convoItem} onClick={() => startConversationWith(id)}>
                    <div style={{ ...styles.avatar, backgroundColor: m.avatarColor || 'var(--accent)' }}>
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
  sidebar: { width: 300, display: 'flex', flexDirection: 'column', padding: 0, flexShrink: 0 },
  sidebarHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', borderBottom: '1px solid var(--border)' },
  sidebarTitle: { fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' },
  newBtn: { width: 32, height: 32, borderRadius: '50%', padding: 0, justifyContent: 'center', fontSize: 18 },
  convoList: { listStyle: 'none', margin: 0, padding: 0, overflowY: 'auto' },
  convoItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', cursor: 'pointer', transition: 'background 0.2s' },
  convoItemActive: { background: 'var(--accent-dim)', borderLeft: '3px solid var(--accent)' },
  avatar: { width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 800, flexShrink: 0 },
  convoMeta: { minWidth: 0, flex: 1 },
  convoName: { fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center' },
  convoPreview: { fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  thread: { flex: 1, display: 'flex', flexDirection: 'column', padding: 0 },
  threadHeader: { display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid var(--border)' },
  threadName: { fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' },
  threadBody: { flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 8 },
  bubbleRow: { display: 'flex' },
  bubble: { maxWidth: '60%', padding: '9px 15px', borderRadius: 16, fontSize: 14 },
  bubbleMine: { background: 'var(--accent)', color: '#000', fontWeight: 600, borderBottomRightRadius: 4 },
  bubbleTheirs: { background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderBottomLeftRadius: 4 },
  composer: { display: 'flex', gap: 8, padding: 16, borderTop: '1px solid var(--border)' },
  input: { flex: 1, borderRadius: 20 },
  sendBtn: {},
};
