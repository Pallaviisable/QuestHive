'use client';

import { Suspense } from 'react';
import RegisterContent from './RegisterContent';

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            background: '#0f0f0f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid #f5c518',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
                margin: '0 auto 16px',
              }}
            />
            <p style={{ color: '#f5c518' }}>Loading...</p>
          </div>
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}