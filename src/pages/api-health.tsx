import React from 'react';

export default function ApiHealth() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <h1 className="text-2xl md:text-3xl font-bold mb-4 text-[var(--text-primary)]">Health Check</h1>
      <p className="text-[var(--text-secondary)] mb-6">This is a basic health-check endpoint for deployment monitoring.</p>
      <div className="p-6 bg-[var(--bg-secondary)] rounded-xl shadow-lg border border-[hsl(var(--border))]">
        <span className="text-[var(--accent-success)] font-semibold">Status: OK</span>
      </div>
    </div>
  );
}
