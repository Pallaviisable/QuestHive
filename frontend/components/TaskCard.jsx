'use client';
import { useState } from 'react';

const PRIORITY_COLOR = { LOW: 'var(--success)', MEDIUM: 'var(--accent)', HIGH: 'var(--danger)' };
const STATUS_BADGE = { PENDING: 'badge-gray', IN_PROGRESS: 'badge-blue', PENDING_REVIEW: 'badge-purple', COMPLETED: 'badge-green' };

export default function TaskCard({
  task,
  user,
  isAdmin = false,
  assigneeName,
  assigneeXp,
  onOpenDetails,
  onStart,
  onComplete,
  onSubmitProof,
  onApprove,
  onReject,
  onClaim,
  onDeny,
  onEdit,
  onDelete,
  onPriorityChange,
}) {
  const [proofFile, setProofFile] = useState(null);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [approving, setApproving] = useState(false);

  const isOpenTask     = !task.assignedToId && !task.personal;
  const isAssignedToMe = task.assignedToId === user?.id;
  const isCreator      = task.assignedById === user?.id;
  const isOverdue       = task.status !== 'COMPLETED' && task.deadline && new Date(task.deadline) < new Date();
  const subtasks        = task.subtasks || [];
  const comments         = task.comments || [];
  const completedSub    = subtasks.filter(s => s.completed).length;

  const handleProofFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProofFile(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  };

  const handleSubmitProof = async () => {
    if (!proofFile || !onSubmitProof) return;
    setSubmittingProof(true);
    try {
      await onSubmitProof(task.id, proofFile);
      setProofFile(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingProof(false);
    }
  };

  const handleApprove = async () => {
    if (!onApprove) return;
    setApproving(true);
    try { await onApprove(task.id); } finally { setApproving(false); }
  };

  const handleReject = async () => {
    if (!onReject) return;
    const reason = window.prompt('Reason for rejecting (optional):') || undefined;
    setRejecting(true);
    try { await onReject(task.id, reason); } finally { setRejecting(false); }
  };

  return (
    <div className="card" style={{ overflow: 'hidden', borderColor: isOpenTask ? 'rgba(245,197,24,0.4)' : undefined }}>
      {isOpenTask && (
        <div style={{ background: 'linear-gradient(90deg,rgba(245,197,24,0.2),rgba(245,197,24,0.05))', padding: '5px 18px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(245,197,24,0.15)' }}>
          <span style={{ fontSize: '12px' }}>🔓</span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)' }}>Open Task — Anyone can claim!</span>
          {task.openTaskBonus && <span className="badge badge-green" style={{ marginLeft: 'auto' }}>⭐ Bonus</span>}
        </div>
      )}

      <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0, background: isOverdue ? 'var(--danger)' : PRIORITY_COLOR[task.priority] }} />
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{task.title}</h3>
            {task.personal && <span className="badge badge-green">NEST</span>}

            {isAdmin && onPriorityChange && task.status !== 'COMPLETED' ? (
              <select
                value={task.priority}
                onChange={e => onPriorityChange(task.id, e.target.value)}
                style={{ background: `${PRIORITY_COLOR[task.priority]}22`, border: `1px solid ${PRIORITY_COLOR[task.priority]}66`, borderRadius: '999px', color: PRIORITY_COLOR[task.priority], fontSize: '11px', fontWeight: 700, padding: '2px 8px', cursor: 'pointer', outline: 'none' }}
              >
                <option value="LOW">🟢 LOW</option>
                <option value="MEDIUM">🟡 MEDIUM</option>
                <option value="HIGH">🔴 HIGH</option>
              </select>
            ) : (
              <span className="badge" style={{ background: `${PRIORITY_COLOR[task.priority]}22`, color: PRIORITY_COLOR[task.priority] }}>{task.priority}</span>
            )}
            <span className={`badge ${STATUS_BADGE[task.status]}`}>{task.status.replace('_', ' ')}</span>
          </div>

          {task.description && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px', lineHeight: 1.4 }}>{task.description}</p>
          )}

          {task.status === 'PENDING_REVIEW' && task.proofPhotoBase64 && (
            <img
              src={`data:image/jpeg;base64,${task.proofPhotoBase64}`}
              alt="submitted proof"
              style={{ maxWidth: '90px', maxHeight: '90px', borderRadius: '8px', marginBottom: '8px', border: '1px solid rgba(245,197,24,0.3)', objectFit: 'cover' }}
            />
          )}

          <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: 'var(--text-muted)', flexWrap: 'wrap', alignItems: 'center' }}>
            {assigneeName && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                👤 {assigneeName}
                {assigneeXp?.tier?.frame && assigneeXp.tier.frame !== 'none' && (
                  <span className="badge" style={{ background: `${assigneeXp.tier.color}22`, color: assigneeXp.tier.color }}>
                    {assigneeXp.tier.title} Lv.{assigneeXp.level}
                  </span>
                )}
              </span>
            )}
            <span>📂 {task.category}</span>
            {task.deadline && (
              <span style={{ color: isOverdue ? 'var(--danger)' : undefined }}>
                ⏰ {isOverdue ? 'Overdue · ' : ''}
                {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
            {task.coinsReward != null && <span style={{ color: 'var(--accent)', fontWeight: 700 }}>🪙 {task.coinsReward}</span>}
          </div>

          <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
            {subtasks.length > 0 && <span className="badge badge-blue">📝 {completedSub}/{subtasks.length} subtasks</span>}
            {comments.length > 0 && <span className="badge badge-green">💬 {comments.length}</span>}
            {task.pledgeMessage && <span className="badge badge-purple">🤝 pledged</span>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
          {onOpenDetails && (
            <button className="btn-ghost" onClick={() => onOpenDetails(task)}>Details</button>
          )}
          {isOpenTask && !isCreator && onClaim && (
            <button className="btn-primary" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => onClaim(task.id)}>🙋 Claim</button>
          )}
          {isAssignedToMe && task.status === 'PENDING' && onStart && (
            <button className="btn-outline" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => onStart(task.id)}>Start</button>
          )}

          {isAssignedToMe && task.status === 'IN_PROGRESS' && !task.requiresPhotoProof && onComplete && (
            <button className="btn-primary" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => onComplete(task.id)}>Done ✅</button>
          )}

          {isAssignedToMe && task.status === 'IN_PROGRESS' && task.requiresPhotoProof && onSubmitProof && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input type="file" accept="image/*" onChange={handleProofFile} style={{ fontSize: '11px', maxWidth: '110px' }} />
              <button
                className="btn-primary"
                style={{ fontSize: '12px', padding: '6px 12px' }}
                disabled={!proofFile || submittingProof}
                onClick={handleSubmitProof}
              >
                {submittingProof ? 'Submitting…' : 'Submit Proof 📸'}
              </button>
            </div>
          )}

          {isAssignedToMe && task.status === 'PENDING_REVIEW' && (
            <span className="badge badge-purple">⏳ Awaiting review</span>
          )}

          {(isCreator || isAdmin) && task.status === 'PENDING_REVIEW' && (onApprove || onReject) && (
            <div style={{ display: 'flex', gap: '6px' }}>
              {onApprove && (
                <button className="btn-primary" style={{ fontSize: '12px', padding: '6px 12px' }} disabled={approving} onClick={handleApprove}>
                  {approving ? 'Approving…' : 'Approve ✅'}
                </button>
              )}
              {onReject && (
                <button className="btn-danger" style={{ fontSize: '12px', padding: '6px 10px' }} disabled={rejecting} onClick={handleReject}>
                  {rejecting ? '…' : 'Reject ❌'}
                </button>
              )}
            </div>
          )}

          {isAssignedToMe && task.status !== 'COMPLETED' && !task.personal && onDeny && (
            <button className="btn-danger" style={{ padding: '6px 10px' }} onClick={() => onDeny(task.id)}>❌</button>
          )}
          {(isCreator || isAdmin) && task.status !== 'COMPLETED' && onEdit && (
            <button className="btn-ghost" style={{ padding: '6px 8px' }} onClick={() => onEdit(task)}>✏️</button>
          )}
          {(task.personal || isCreator || isAdmin) && onDelete && (
            <button className="btn-danger" style={{ padding: '6px 8px' }} onClick={() => onDelete(task.id)}>🗑️</button>
          )}
        </div>
      </div>
    </div>
  );
}
