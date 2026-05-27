'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { getChatMessages } from '@/lib/api';
import axios from 'axios';

export default function ChatPage() {
  const { groupId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState(null);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    fetchMessages();
    // Poll every 3 seconds for new messages
    pollRef.current = setInterval(fetchMessages, 3000);
    return () => clearInterval(pollRef.current);
  }, [groupId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', maxWidth: '700px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '16px' }}>💬 Group Chat</h1>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', padding: '4px 0', marginBottom: '16px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#a0a0a0', padding: '60px', fontSize: '14px' }}>No messages yet. Say hello! 👋</div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.userId === user?.id;
          return (
            <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '70%', padding: '10px 14px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: isMe ? 'rgba(245,197,24,0.15)' : '#1a1a1a',
                border: isMe ? '1px solid rgba(245,197,24,0.3)' : '1px solid #2a2a2a',
              }}>
                {!isMe && <div style={{ fontSize: '11px', color: '#f5c518', fontWeight: 700, marginBottom: '4px' }}>{msg.authorName}</div>}
                <div style={{ fontSize: '14px', color: '#fff', lineHeight: '1.5' }}>{msg.content}</div>
                <div style={{ fontSize: '10px', color: '#555', marginTop: '4px', textAlign: 'right' }}>
                  {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a message... (Enter to send)"
          rows={2}
          style={{
            flex: 1, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px',
            color: '#fff', padding: '12px 14px', fontSize: '14px', resize: 'none', outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <button onClick={sendMessage} disabled={sending || !input.trim()} style={{
          background: input.trim() ? '#f5c518' : '#2a2a2a', color: input.trim() ? '#000' : '#555',
          border: 'none', borderRadius: '12px', padding: '12px 18px', fontWeight: 700,
          cursor: input.trim() ? 'pointer' : 'not-allowed', fontSize: '16px', height: '52px',
          transition: 'all 0.2s',
        }}>➤</button>
      </div>
    </div>
  );
}
