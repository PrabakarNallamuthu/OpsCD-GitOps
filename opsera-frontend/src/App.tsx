import type { ReactElement } from 'react';

export default function App(): ReactElement {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'system-ui, sans-serif',
        background: '#0f1117',
        color: '#e2e8f0',
      }}
    >
      <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>Opsera Voyage</h1>
      <p style={{ marginTop: '0.5rem', color: '#94a3b8' }}>
        Delivery intelligence platform — scaffold ready.
      </p>
    </main>
  );
}
