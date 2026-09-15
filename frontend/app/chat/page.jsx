'use client';

import { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getConversations,
  getMessages,
  sendDirectMessage,
  getOrCreateConversation,
  getGroupMembers, // used to populate the "new message" picker
} from '@/lib/api';

const POLL_MS = 4000;

function ChatPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(searchParams.get('c') || null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const threadEndRef = useRef(null);
  const pollRef = useRef(null);

  // ---- conversation list ----
  const loadConversations = useCallback(async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (e) {
      setError('Could not load conversations.');
    }
  }, []);

  useEffect(() => {
    loadConversations();
    const id = setInterval(loadConversations, POLL_MS);
    return () => clearInterval(id);
  }, [loadConversations]);

  // ---- active thread ----
  const loadThread = useCallback(async (conversationId) => {
    if (!conversationId) return;
    try {
      const data = await getMessages(conversationId);
      setMessages(data);
    } catch (e) {
      setError('Could not load this conversation.');
    }
  }, []);

  useEffect(() => {
    if (!activeId) return;
    setLoadingThread(true);
    loadThread(activeId).finally(() => setLoadingThread(false));

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

  // ---- new message picker ----
  const openPicker = async () => {
    setPickerOpen(true);
    if (members.length === 0) {
      try {
        const data = await getGroupMembers();
        setMembers(data);
      } catch (e) {
        setError('Could not load members.');
      }
    }
  };

  const startConversationWith = async (memberId) => {
    try {
      const convo = await getOrCreateConversation(memberId);
      setPickerOpen(false);
      await loadConversations();
      openConversation(convo.id);
    } catch (e) {
      setError('Could not start conversation.');
    }
  };

  // ---- send ----
  const handleSend = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !activeId || sending) return;
    setSending(true);
    setDraft('');
    try {
      const msg = await sendDirectMessage(activeId, text);
      setMessages((prev) => [...prev, msg]);
      loadConversations(); // refresh last-message preview / ordering
    } catch (e) {
      setError('Message failed to send.');
      setDraft(text); // put it back so nothing's lost
    } finally {
      setSending(false);
    }
  };

  const activeConvo = conversations.find((c) => c.id === activeId);

  return (
    <div style={styles.wrapper}>
      {/* ---- conversation list ---- */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>Messages</h2>
          <button style={styles.newBtn} onClick={openPicker} title="New message">
            +
          </button>
        </div>

        {conversations.length === 0 && (
          <p style={styles.emptyText}>No conversations yet.</p>
        )}

        <ul style={styles.convoList}>
          {conversations.map((c) => (
            <li
              key={c.id}
              onClick={() => openConversation(c.id)}
              style={{
                ...styles.convoItem,
                ...(c.id === activeId ? styles.convoItemActive : {}),
              }}
            >
              <div
                style={{
                  ...styles.avatar,
                  backgroundColor: c.otherMember?.avatarColor || '#999',
                }}
              >
                {c.otherMember?.fullName?.[0]?.toUpperCase() || '?'}
              </div>
              <div style={styles.convoMeta}>
                <div style={styles.convoName}>{c.otherMember?.fullName}</div>
                <div style={styles.convoPreview}>
                  {c.lastMessagePreview || 'Say hello 👋'}
                </div>
              </div>
              {c.unreadCount > 0 && (
                <span style={styles.unreadBadge}>{c.unreadCount}</span>
              )}
            </li>
          ))}
        </ul>
      </aside>

      {/* ---- thread ---- */}
      <main style={styles.thread}>
        {!activeId && (
          <div style={styles.threadEmpty}>
            Pick a conversation, or start a new one.
          </div>
        )}

        {activeId && (
          <>
            <div style={styles.threadHeader}>
              <div
                style={{
                  ...styles.avatar,
                  backgroundColor: activeConvo?.otherMember?.avatarColor || '#999',
                }}
              >
                {activeConvo?.otherMember?.fullName?.[0]?.toUpperCase() || '?'}
              </div>
              <span style={styles.threadName}>
                {activeConvo?.otherMember?.fullName || 'Conversation'}
              </span>
            </div>

            <div style={styles.threadBody}>
              {loadingThread && <p style={styles.emptyText}>Loading…</p>}
              {!loadingThread &&
                messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      ...styles.bubbleRow,
                      justifyContent: m.mine ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        ...styles.bubble,
                        ...(m.mine ? styles.bubbleMine : styles.bubbleTheirs),
                      }}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
              <div ref={threadEndRef} />
            </div>

            <form style={styles.composer} onSubmit={handleSend}>
              <input
                style={styles.input}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message…"
              />
              <button style={styles.sendBtn} type="submit" disabled={sending || !draft.trim()}>
                Send
              </button>
            </form>
          </>
        )}
      </main>

      {/* ---- new message picker ---- */}
      {pickerOpen && (
        <div style={styles.modalOverlay} onClick={() => setPickerOpen(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.sidebarTitle}>New message</h3>
            <ul style={styles.convoList}>
              {members.map((m) => (
                <li
                  key={m.id}
                  style={styles.convoItem}
                  onClick={() => startConversationWith(m.id)}
                >
                  <div style={{ ...styles.avatar, backgroundColor: m.avatarColor }}>
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

      {error && <div style={styles.errorToast}>{error}</div>}
    </div>
  );
}

const styles = {
  wrapper: { display: 'flex', height: 'calc(100vh - 64px)', background: '#f7f7fb' },
  sidebar: { width: 300, borderRight: '1px solid #e5e5ef', display: 'flex', flexDirection: 'column', background: '#fff' },
  sidebarHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' },
  sidebarTitle: { fontSize: 18, fontWeight: 700, margin: 0 },
  newBtn: { width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#6c5ce7', color: '#fff', fontSize: 18, cursor: 'pointer' },
  emptyText: { padding: '0 16px', color: '#888', fontSize: 14 },
  convoList: { listStyle: 'none', margin: 0, padding: 0, overflowY: 'auto' },
  convoItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', cursor: 'pointer' },
  convoItemActive: { background: '#f0edfe' },
  avatar: { width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, flexShrink: 0 },
  convoMeta: { minWidth: 0, flex: 1 },
  convoName: { fontWeight: 600, fontSize: 14 },
  convoPreview: { fontSize: 12, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  unreadBadge: { background: '#e74c3c', color: '#fff', fontSize: 11, borderRadius: 10, padding: '2px 7px' },
  thread: { flex: 1, display: 'flex', flexDirection: 'column' },
  threadEmpty: { margin: 'auto', color: '#888' },
  threadHeader: { display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid #e5e5ef', background: '#fff' },
  threadName: { fontWeight: 700 },
  threadBody: { flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 8 },
  bubbleRow: { display: 'flex' },
  bubble: { maxWidth: '60%', padding: '8px 14px', borderRadius: 16, fontSize: 14 },
  bubbleMine: { background: '#6c5ce7', color: '#fff', borderBottomRightRadius: 4 },
  bubbleTheirs: { background: '#fff', border: '1px solid #e5e5ef', borderBottomLeftRadius: 4 },
  composer: { display: 'flex', gap: 8, padding: 14, borderTop: '1px solid #e5e5ef', background: '#fff' },
  input: { flex: 1, padding: '10px 14px', borderRadius: 20, border: '1px solid #ddd', fontSize: 14 },
  sendBtn: { padding: '10px 18px', borderRadius: 20, border: 'none', background: '#6c5ce7', color: '#fff', fontWeight: 600, cursor: 'pointer' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { width: 360, maxHeight: '70vh', overflowY: 'auto', background: '#fff', borderRadius: 12, padding: 16 },
  errorToast: { position: 'fixed', bottom: 20, right: 20, background: '#e74c3c', color: '#fff', padding: '10px 16px', borderRadius: 8, fontSize: 14 },
};

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatPageInner />
    </Suspense>
  );
}
