'use client';
import { useState } from 'react';
import { completeTour } from '@/lib/api';

const steps = [
  { icon: '🪙', title: 'Coins', body: 'Earn coins by completing tasks. Coins can be redeemed for real rewards set by your Family Admin.' },
  { icon: '⚡', title: 'XP & Levels', body: 'XP is permanent and never resets. Complete tasks to level up from Hive Newcomer all the way to Legendary Hive Master.' },
  { icon: '🔥', title: 'Streaks', body: 'Complete tasks on consecutive days to build your streak. The longer the streak, the more bonus coins you earn.' },
  { icon: '🪺', title: 'MyNest', body: 'MyNest is your personal task space. Add private tasks only you can see — grocery lists, personal goals, anything.' },
  { icon: '🔓', title: 'Open Tasks', body: 'Open tasks have no assigned member. Anyone in the group can claim them. First come, first served — and they pay bonus coins!' },
  { icon: '🏆', title: 'Leaderboard', body: 'The member with the most coins at the end of each week becomes Quest Master and earns a special bonus reward.' },
];

export default function OnboardingTour({ onComplete }) {
  const [step, setStep] = useState(0);
  const [completing, setCompleting] = useState(false);

  const handleFinish = async () => {
    setCompleting(true);
    try { await completeTour(); } catch {}
    onComplete();
  };

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: '24px', width: '100%', maxWidth: '440px', overflow: 'hidden' }}>

        {/* Progress bar */}
        <div style={{ height: '4px', background: '#222' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg,#f5c518,#ffdd57)', width: `${((step + 1) / steps.length) * 100}%`, transition: 'width 0.4s ease' }} />
        </div>

        <div style={{ padding: '40px 36px' }}>
          {/* Icon */}
          <div style={{ fontSize: '56px', textAlign: 'center', marginBottom: '20px' }}>{current.icon}</div>

          {/* Step counter */}
          <div style={{ textAlign: 'center', fontSize: '12px', color: '#555', marginBottom: '10px', fontWeight: 600 }}>
            {step + 1} of {steps.length}
          </div>

          {/* Title */}
          <h2 style={{ fontSize: '22px', fontWeight: 800, textAlign: 'center', marginBottom: '12px', color: '#fff' }}>{current.title}</h2>

          {/* Body */}
          <p style={{ color: '#a0a0a0', fontSize: '15px', textAlign: 'center', lineHeight: 1.7, marginBottom: '36px' }}>{current.body}</p>

          {/* Dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '28px' }}>
            {steps.map((_, i) => (
              <div key={i} onClick={() => setStep(i)} style={{ width: i === step ? '20px' : '6px', height: '6px', borderRadius: '999px', background: i === step ? '#f5c518' : '#333', transition: 'all 0.3s', cursor: 'pointer' }} />
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#222', border: '1px solid #333', color: '#a0a0a0', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>← Back</button>
            )}
            <button onClick={isLast ? handleFinish : () => setStep(s => s + 1)} disabled={completing}
              style={{ flex: 2, padding: '12px', borderRadius: '12px', background: '#f5c518', border: 'none', color: '#000', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}>
              {isLast ? (completing ? 'Starting...' : '🐝 Enter the Hive!') : 'Next →'}
            </button>
          </div>

          {/* Skip */}
          {!isLast && (
            <button onClick={handleFinish} style={{ width: '100%', marginTop: '12px', background: 'none', border: 'none', color: '#444', fontSize: '12px', cursor: 'pointer' }}>Skip tour</button>
          )}
        </div>
      </div>
    </div>
  );
}
