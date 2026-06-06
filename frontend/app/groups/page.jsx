'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getMyGroups, createGroup } from '@/lib/api';

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', template: '' });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await getMyGroups();
      setGroups(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createGroup(createForm);
      setShowCreate(false);
      setCreateForm({ name: '', description: '' });
      setSuccessMsg('Group created successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchGroups();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group.');
    }
  };



  return (
    <div className="animate-fadeSlideUp">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800 }}>My Groups</h1>

          <p
            style={{
              color: '#a0a0a0',
              marginTop: '4px',
              fontSize: '14px',
            }}
          >
            Manage and explore your hives
          </p>

          {typeof window !== 'undefined' &&
            document.cookie.includes('role=SUPER_ADMIN') && (
              <Link
                href="/superadmin"
                style={{
                  display: 'inline-block',
                  marginTop: '10px',
                  color: '#f5c518',
                  fontSize: '13px',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                🛡 Open Super Admin Dashboard →
              </Link>
            )}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn-primary"
            onClick={() => {
              setShowCreate(true);
              setError('');
            }}
          >
            + Create Group
          </button>

        </div>
      </div>

      {successMsg && (
        <div
          style={{
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid #22c55e',
            borderRadius: '10px',
            padding: '10px 16px',
            color: '#22c55e',
            fontSize: '13px',
            marginBottom: '16px',
          }}
        >
          ✓ {successMsg}
        </div>
      )}

      {error && (
        <div
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid #ef4444',
            borderRadius: '10px',
            padding: '10px 16px',
            color: '#ef4444',
            fontSize: '13px',
            marginBottom: '16px',
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              border: '3px solid #f5c518',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
            }}
          />

          <p style={{ color: '#f5c518', fontWeight: 600 }}>
            Loading groups...
          </p>
        </div>
      ) : groups.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '80px 20px',
            color: '#a0a0a0',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🐝</div>

          <p
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#fff',
              marginBottom: '6px',
            }}
          >
            No groups yet
          </p>

          <p style={{ fontSize: '14px' }}>
            Create or join a group to get started!
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {groups.map((group, i) => (
            <Link
              key={i}
              href={`/groups/${group.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div
                className="card"
                style={{
                  padding: '24px',
                  cursor: 'pointer',
                  height: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '10px',
                    }}
                  >
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        flexShrink: 0,
                        background: 'rgba(245,197,24,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                      }}
                    >
                      🐝
                    </div>

                    <div style={{ overflow: 'hidden' }}>
                      <h3
                        style={{
                          fontSize: '15px',
                          fontWeight: 700,
                          color: '#fff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {group.name}
                      </h3>

                      <p
                        style={{
                          color: '#a0a0a0',
                          fontSize: '12px',
                        }}
                      >
                        {group.memberIds?.length || 0} members
                      </p>
                    </div>
                  </div>

                  <p
                    style={{
                      color: '#a0a0a0',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {group.description || 'No description added.'}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    className="badge badge-yellow"
                    style={{ fontSize: '11px' }}
                  >
                    View Tasks →
                  </span>

                  <span style={{ fontSize: '11px', color: '#555' }}>
                    {group.taskIds?.length || 0} tasks
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && (
        <Modal
          title="Create Group"
          onClose={() => setShowCreate(false)}
        >
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Template picker — visual tiles */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Template
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { value: '', label: 'Blank', icon: '○' },
                  { value: 'FAMILY', label: 'Family', icon: '⌂' },
                  { value: 'STUDY', label: 'Study', icon: '◎' },
                  { value: 'FITNESS', label: 'Fitness', icon: '◈' },
                  { value: 'WORK', label: 'Work', icon: '◧' },
                  { value: 'CUSTOM', label: 'Custom', icon: '◉' },
                ].map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, template: t.value })}
                    style={{
                      background: createForm.template === t.value ? 'rgba(245,197,24,0.1)' : 'var(--bg-elevated)',
                      border: `1px solid ${createForm.template === t.value ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: '10px',
                      padding: '10px 8px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: '16px', color: createForm.template === t.value ? 'var(--accent)' : 'var(--text-muted)' }}>{t.icon}</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: createForm.template === t.value ? 'var(--accent)' : 'var(--text-secondary)' }}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ height: '1px', background: 'var(--border)' }} />

            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Group Name <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                className="input"
                placeholder="e.g. Study Squad"
                value={createForm.name}
                onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                required
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Description
              </label>
              <textarea
                className="input"
                placeholder="What's this group about? (optional)"
                value={createForm.description}
                onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                rows={2}
                style={{ resize: 'none' }}
              />
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
              <button type="button" onClick={() => setShowCreate(false)} style={{
                flex: 1, background: 'none', border: '1px solid var(--border)',
                color: 'var(--text-secondary)', borderRadius: '10px', padding: '11px',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}>
                Cancel
              </button>
              <button type="submit" style={{
                flex: 2, background: 'var(--accent)', color: '#000',
                border: 'none', borderRadius: '10px', padding: '11px',
                fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                transition: 'opacity 0.15s',
              }}>
                Create Group
              </button>
            </div>

          </form>
        </Modal>
      )}

    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.82)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      zIndex: 200,
      padding: '80px 16px 16px',
      overflowY: 'auto',
    }}>
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--border-hover)',
        width: '100%',
        maxWidth: '460px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        animation: 'scaleIn 0.2s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Modal header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            borderRadius: '6px',
            width: '28px', height: '28px',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', flexShrink: 0,
            transition: 'all 0.15s',
          }}>✕</button>
        </div>
        {/* Modal body */}
        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}