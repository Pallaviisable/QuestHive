"use client";
import { useState } from "react";
import { submitFeedback } from "@/lib/api";

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("BUG");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!message.trim()) return;
    await submitFeedback({ type, message });
    setSent(true);
    setTimeout(() => { setOpen(false); setSent(false); setMessage(""); }, 2000);
  };

  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        position: "fixed", bottom: "24px", right: "24px", zIndex: 1000,
        background: "#f5c518", color: "#000", border: "none",
        borderRadius: "50px", padding: "10px 20px", cursor: "pointer",
        fontWeight: 700, fontSize: "13px", boxShadow: "0 2px 12px rgba(0,0,0,0.3)"
      }}>
        💬 Feedback
      </button>

      {open && (
        <div style={{
          position: "fixed", bottom: "80px", right: "24px", zIndex: 1001,
          background: "#1a1a1a", borderRadius: "14px", padding: "20px",
          width: "300px", boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
          border: "1px solid #2a2a2a"
        }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "15px", color: "#fff" }}>Send Feedback</h3>
          {sent ? (
            <p style={{ color: "#22c55e", fontWeight: 600 }}>✅ Thanks for your feedback!</p>
          ) : (
            <>
              <select value={type} onChange={e => setType(e.target.value)} style={{
                width: "100%", marginBottom: "10px", padding: "8px",
                borderRadius: "8px", border: "1px solid #333",
                background: "#111", color: "#fff", fontSize: "13px"
              }}>
                <option value="BUG">🐛 Bug Report</option>
                <option value="SUGGESTION">💡 Suggestion</option>
              </select>
              <textarea value={message} onChange={e => setMessage(e.target.value)}
                placeholder="Describe your feedback..." rows={4} style={{
                  width: "100%", padding: "8px", borderRadius: "8px",
                  border: "1px solid #333", background: "#111", color: "#fff",
                  resize: "none", marginBottom: "10px", fontSize: "13px",
                  boxSizing: "border-box"
                }} />
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={submit} style={{
                  flex: 1, background: "#f5c518", color: "#000", border: "none",
                  borderRadius: "8px", padding: "8px", cursor: "pointer", fontWeight: 700
                }}>Submit</button>
                <button onClick={() => setOpen(false)} style={{
                  flex: 1, background: "#2a2a2a", color: "#fff", border: "none",
                  borderRadius: "8px", padding: "8px", cursor: "pointer"
                }}>Cancel</button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
