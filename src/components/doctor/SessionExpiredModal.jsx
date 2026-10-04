import React from 'react';
import { ShieldAlert, Clock, ArrowRight, Lock } from 'lucide-react';

export default function SessionExpiredModal({ patientName, onReturnToDashboard }) {
  return (
    <div className="modal-overlay">
      <div
        className="modal-content"
        style={{
          maxWidth: 460,
          textAlign: 'center',
          padding: '2.5rem 2rem',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--radius-full)',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            border: '2px solid #fecaca',
          }}
        >
          <Lock size={32} />
        </div>

        <h3 style={{ fontSize: '1.4rem', color: 'var(--color-text-primary)', marginBottom: '0.65rem' }}>
          Access Session Expired
        </h3>

        <p style={{ fontSize: '0.925rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '1.75rem' }}>
          The temporary authorized access window for <strong>{patientName || 'this patient'}</strong> has concluded. Patient records have been locked and removed from view in compliance with healthcare privacy & security policies.
        </p>

        <button
          type="button"
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.8rem', gap: '0.5rem' }}
          onClick={onReturnToDashboard}
        >
          <span>Return to Doctor Dashboard</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
