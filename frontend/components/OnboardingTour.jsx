'use client';
import { useState, useEffect } from 'react';
import { completeTour } from '@/lib/api';

const steps = [
  {
    id: 'coins',
    title: 'Earn Coins',
    subtitle: 'Complete tasks, get rewarded',
    body: 'Every task you complete earns coins. Coins can be redeemed for real rewards set by your group admin — coffee, days off, anything.',
    color: '#f5c518',
    demo: 'coins',
  },
  {
    id: 'xp',
    title: 'Level Up with XP',
    subtitle: 'XP never resets',
    body: 'XP is permanent. Complete tasks to climb from Hive Newcomer all the way to Legendary Hive Master. Each level unlocks a new frame.',
    color: '#a855f7',
    demo: 'xp',
  },
  {
    id: 'streak',
    title: 'Build Streaks',
    subtitle: 'Consistency pays off',
    body: 'Complete tasks on consecutive days to build your streak. Longer streaks = bonus coins multiplier. Miss a day and it resets.',
    color: '#f97316',
    demo: 'streak',
  },
  {
    id: 'mynest',
    title: 'MyNest — Your Space',
    subtitle: 'Private personal tasks',
    body: 'MyNest is your private task space. Add personal goals, grocery lists, or anything only you can see. No one else in the group sees these.',
    color: '#22c55e',
    demo: 'mynest',
  },
  {
    id: 'open',
    title: 'Open Tasks',
    subtitle: 'First come, first served',
    body: 'Open tasks have no assigned member. Anyone can claim them — and they pay bonus coins. Move fast.',
    color: '#3b82f6',
    demo: 'open',
  },
  {
    id: 'leaderboard',
    title: 'Leaderboard',
    subtitle: 'Weekly glory awaits',
    body: 'The member with the most coins each week becomes Quest Master and earns a special bonus reward. Compete, win, repeat.',
    color: '#ef4444',
    demo: 'leaderboard',
  },
];

/* ── Demo panels ── */
function DemoCoins({ active }) {
  const [count, setCount] = useState(120);
  const [pop, setPop] = useState(false);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => {
      setCount(c => c + 10);
      setPop(true);
      setTimeout(() => setPop(false), 400);
    }, 1200);
    return () => clearInterval(t);
  }, [active]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div style={{
        width: '80px', height: '80px', borderRadius: '50%',
        background: 'rgba(245,197,24,0.12)', border: '2px solid rgba(245,197,24,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: pop ? 'scale(1.18)' : 'scale(1)',
        transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: pop ? '0 0 32px rgba(245,197,24,0.4)' : '0 0 0 rgba(245,197,24,0)',
      }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#f5c518" opacity="0.2"/>
          <circle cx="12" cy="12" r="8" stroke="#f5c518" strokeWidth="1.5"/>
          <text x="12" y="16" textAnchor="middle" fill="#f5c518" fontSize="9" fontWeight="800">C</text>
        </svg>
      </div>
      <div style={{ fontSize: '32px', fontWeight: 900, color: '#f5c518', letterSpacing: '-1px', transition: 'all 0.3s' }}>
        {count}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>COINS EARNED</div>
      <div style={{
        background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
        borderRadius: '8px', padding: '6px 14px',
        fontSize: '12px', color: '#22c55e', fontWeight: 700,
        transform: pop ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'transform 0.3s ease',
      }}>+10 task completed</div>
    </div>
  );
}

function DemoXP({ active }) {
  const levels = ['Newcomer', 'Apprentice', 'Explorer', 'Veteran', 'Elite', 'Champion', 'Legendary'];
  const [lvl, setLvl] = useState(2);
  const [pct, setPct] = useState(42);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => {
      setPct(p => {
        if (p >= 95) { setLvl(l => Math.min(l + 1, levels.length - 1)); return 10; }
        return p + 8;
      });
    }, 600);
    return () => clearInterval(t);
  }, [active]);
  const frameColor = ['#6b7280','#22c55e','#3b82f6','#a855f7','#f5c518'][Math.min(Math.floor(lvl/1.5), 4)];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%' }}>
      <div style={{
        width: '64px', height: '64px', borderRadius: '16px',
        background: `${frameColor}18`, border: `2px solid ${frameColor}50`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 20px ${frameColor}30`,
        transition: 'all 0.5s',
      }}>
        <span style={{ fontSize: '10px', color: frameColor, fontWeight: 700 }}>LVL</span>
        <span style={{ fontSize: '22px', fontWeight: 900, color: frameColor, lineHeight: 1 }}>{lvl + 1}</span>
      </div>
      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{levels[lvl]}</div>
      <div style={{ width: '100%', background: 'var(--bg-elevated)', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: '999px',
          background: `linear-gradient(90deg, ${frameColor}, ${frameColor}99)`,
          width: `${pct}%`, transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1)',
        }} />
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pct}% to next level</div>
    </div>
  );
}

function DemoStreak({ active }) {
  const [streak, setStreak] = useState(3);
  const days = ['M','T','W','T','F','S','S'];
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setStreak(s => s < 7 ? s + 1 : 1), 1000);
    return () => clearInterval(t);
  }, [active]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
      <div style={{ fontSize: '40px', fontWeight: 900, color: '#f97316' }}>{streak}<span style={{ fontSize: '20px' }}>🔥</span></div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>DAY STREAK</div>
      <div style={{ display: 'flex', gap: '6px' }}>
        {days.map((d, i) => (
          <div key={i} style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: i < streak ? 'rgba(249,115,22,0.2)' : 'var(--bg-elevated)',
            border: `1px solid ${i < streak ? 'rgba(249,115,22,0.4)' : 'var(--border)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 700,
            color: i < streak ? '#f97316' : 'var(--text-muted)',
            transition: 'all 0.3s',
            boxShadow: i < streak ? '0 0 10px rgba(249,115,22,0.2)' : 'none',
          }}>{d}</div>
        ))}
      </div>
      <div style={{ fontSize: '12px', color: '#f97316', fontWeight: 600 }}>
        {streak >= 5 ? `${streak}x multiplier active!` : `${5 - streak} more days for 5x bonus`}
      </div>
    </div>
  );
}

function DemoMyNest() {
  const tasks = [
    { title: 'Buy groceries', done: true },
    { title: 'Call dentist', done: false },
    { title: 'Read for 30 min', done: true },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#22c55e' }}>MyNest — Private</span>
      </div>
      {tasks.map((t, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 14px', borderRadius: '10px',
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          transition: 'all 0.2s',
        }}>
          <div style={{
            width: '16px', height: '16px', borderRadius: '5px', flexShrink: 0,
            background: t.done ? 'rgba(34,197,94,0.2)' : 'transparent',
            border: `1.5px solid ${t.done ? '#22c55e' : 'var(--border-hover)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {t.done && <svg width="9" height="9" fill="none" stroke="#22c55e" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>}
          </div>
          <span style={{ fontSize: '13px', color: t.done ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: t.done ? 'line-through' : 'none' }}>{t.title}</span>
          <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>private</span>
        </div>
      ))}
    </div>
  );
}

function DemoOpen({ active }) {
  const [claimed, setClaimed] = useState(false);
  useEffect(() => { if (!active) setClaimed(false); }, [active]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
      <div style={{
        padding: '16px', borderRadius: '12px',
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Fix homepage bug</span>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#f5c518' }}>+30 coins</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 6px #3b82f6' }} />
          <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 600 }}>OPEN — unclaimed</span>
        </div>
        <button
          onClick={() => setClaimed(true)}
          disabled={claimed}
          style={{
            width: '100%', padding: '8px', borderRadius: '8px',
            background: claimed ? 'rgba(34,197,94,0.15)' : 'rgba(245,197,24,0.1)',
            border: `1px solid ${claimed ? 'rgba(34,197,94,0.3)' : 'rgba(245,197,24,0.3)'}`,
            color: claimed ? '#22c55e' : '#f5c518',
            fontSize: '13px', fontWeight: 700, cursor: claimed ? 'default' : 'pointer',
            transition: 'all 0.3s',
          }}
        >
          {claimed ? '✓ Claimed by you!' : 'Claim this task →'}
        </button>
      </div>
    </div>
  );
}

function DemoLeaderboard() {
  const board = [
    { name: 'Priya S.', coins: 340, rank: 1 },
    { name: 'You',      coins: 280, rank: 2, isYou: true },
    { name: 'Aryan K.', coins: 210, rank: 3 },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      {board.map((u, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '10px 14px', borderRadius: '10px',
          background: u.isYou ? 'rgba(245,197,24,0.08)' : 'var(--bg-elevated)',
          border: `1px solid ${u.isYou ? 'rgba(245,197,24,0.25)' : 'var(--border)'}`,
        }}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0,
            background: i === 0 ? '#f5c518' : i === 1 ? '#6b7280' : '#cd7c2f',
            color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 900,
          }}>{u.rank}</div>
          <span style={{ flex: 1, fontSize: '13px', fontWeight: u.isYou ? 700 : 500, color: u.isYou ? 'var(--accent)' : 'var(--text-primary)' }}>{u.name}</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>{u.coins}</span>
        </div>
      ))}
    </div>
  );
}

const DEMOS = {
  coins:       DemoCoins,
  xp:          DemoXP,
  streak:      DemoStreak,
  mynest:      DemoMyNest,
  open:        DemoOpen,
  leaderboard: DemoLeaderboard,
};

export default function OnboardingTour({ onComplete }) {
  const [step, setStep]           = useState(0);
  const [dir, setDir]             = useState(1);
  const [animKey, setAnimKey]     = useState(0);
  const [completing, setCompleting] = useState(false);
  const [celebrate, setCelebrate]   = useState(false);

  const current = steps[step];
  const isLast  = step === steps.length - 1;
  const Demo    = DEMOS[current.demo];

  const go = (next) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
    setAnimKey(k => k + 1);
  };

  const handleFinish = async () => {
    setCelebrate(true);
    setTimeout(async () => {
      setCompleting(true);
      try { await completeTour(); } catch {}
      onComplete();
    }, 1200);
  };

  return (
    <>
      <style>{`
        @keyframes tourSlideIn {
          from { opacity: 0; transform: translateX(var(--slide-from)); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes tourPop {
          0%   { transform: scale(0.92); opacity: 0; }
          60%  { transform: scale(1.03); }
          100% { transform: scale(1);    opacity: 1; }
        }
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(200px) rotate(720deg); opacity: 0; }
        }
        @keyframes celebrateScale {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
      `}</style>

      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '20px',
      }}>

        {/* Confetti */}
        {celebrate && Array.from({ length: 18 }).map((_, i) => (
          <div key={i} style={{
            position: 'fixed',
            top: '30%',
            left: `${10 + i * 5}%`,
            width: '8px', height: '8px',
            borderRadius: i % 2 === 0 ? '50%' : '2px',
            background: ['#f5c518','#22c55e','#3b82f6','#a855f7','#ef4444'][i % 5],
            animation: `confettiFall ${0.8 + i * 0.1}s ease forwards`,
            animationDelay: `${i * 0.04}s`,
            pointerEvents: 'none',
            zIndex: 1001,
          }} />
        ))}

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-hover)',
          borderRadius: '24px',
          width: '100%', maxWidth: '480px',
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          animation: celebrate ? 'celebrateScale 0.4s ease' : 'tourPop 0.4s cubic-bezier(0.16,1,0.3,1)',
        }}>

          {/* Progress bar */}
          <div style={{ height: '3px', background: 'var(--bg-elevated)' }}>
            <div style={{
              height: '100%',
              background: `linear-gradient(90deg, ${current.color}, ${current.color}99)`,
              width: `${((step + 1) / steps.length) * 100}%`,
              transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1)',
              boxShadow: `0 0 8px ${current.color}60`,
            }} />
          </div>

          {/* Step dots nav */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', padding: '16px 0 0' }}>
            {steps.map((s, i) => (
              <button key={i} onClick={() => go(i)} style={{
                width: i === step ? '24px' : '7px',
                height: '7px', borderRadius: '999px',
                background: i === step ? s.color : i < step ? `${s.color}60` : 'var(--bg-elevated)',
                border: 'none', cursor: 'pointer',
                transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
                boxShadow: i === step ? `0 0 8px ${s.color}60` : 'none',
                padding: 0,
              }} />
            ))}
          </div>

          {/* Content */}
          <div
            key={animKey}
            style={{
              padding: '24px 32px 32px',
              '--slide-from': dir > 0 ? '40px' : '-40px',
              animation: 'tourSlideIn 0.35s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            {/* Step label */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: `${current.color}12`,
              border: `1px solid ${current.color}30`,
              borderRadius: '999px', padding: '4px 12px', marginBottom: '20px',
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: current.color, boxShadow: `0 0 6px ${current.color}` }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: current.color, letterSpacing: '0.3px' }}>
                {step + 1} of {steps.length} — {current.subtitle}
              </span>
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.4px' }}>
              {current.title}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '24px' }}>
              {current.body}
            </p>

            {/* Interactive demo */}
            <div style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '28px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              minHeight: '160px',
            }}>
              <Demo active={true} />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {step > 0 && (
                <button onClick={() => go(step - 1)} style={{
                  flex: '0 0 auto', padding: '11px 20px',
                  borderRadius: '10px', background: 'none',
                  border: '1px solid var(--border)', color: 'var(--text-muted)',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                  Back
                </button>
              )}
              <button
                onClick={isLast ? handleFinish : () => go(step + 1)}
                disabled={completing}
                style={{
                  flex: 1, padding: '11px 20px', borderRadius: '10px',
                  background: celebrate ? '#22c55e' : current.color,
                  border: 'none',
                  color: current.color === '#f5c518' || current.color === '#22c55e' ? '#000' : '#fff',
                  fontSize: '14px', fontWeight: 800,
                  cursor: completing ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'all 0.3s',
                  boxShadow: `0 4px 20px ${current.color}30`,
                }}
              >
                {celebrate ? 'Welcome to QuestHive!' : isLast ? 'Enter the Hive' : (
                  <>Next <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
                )}
              </button>
            </div>

            {!isLast && (
              <button onClick={handleFinish} style={{
                width: '100%', marginTop: '12px', background: 'none', border: 'none',
                color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer',
                padding: '4px',
              }}>
                Skip tour
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
