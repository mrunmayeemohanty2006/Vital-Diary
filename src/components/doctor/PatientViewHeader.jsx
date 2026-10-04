import React, { useState, useEffect } from 'react';
import {
  User,
  Clock,
  LogOut,
  Droplet,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  FileCheck,
  ArrowLeft,
  Lock,
  RefreshCw,
} from 'lucide-react';

export default function PatientViewHeader({
  patient,
  expiresAt,
  isExpired = false,
  onExpire,
  onEndSession,
  onBack,
  backLabel = 'Back to Access Activity',
  onReauthorize,
  totalRecords = 0,
}) {
  const [secondsRemaining, setSecondsRemaining] = useState(() => {
    if (isExpired || !expiresAt) return 0;
    const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });

  // Countdown timer effect
  useEffect(() => {
    if (isExpired || !expiresAt) {
      setSecondsRemaining(0);
      return;
    }

    const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
    setSecondsRemaining(Math.max(0, diff));

    const interval = setInterval(() => {
      const remaining = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
      if (remaining <= 0) {
        setSecondsRemaining(0);
        clearInterval(interval);
        if (onExpire) onExpire();
      } else {
        setSecondsRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, isExpired, onExpire]);

  // Format time MM:SS
  const formatTime = (totalSeconds) => {
    if (totalSeconds <= 0) return '00:00';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const isActuallyExpired = isExpired || secondsRemaining <= 0;
  const isUrgent = !isActuallyExpired && secondsRemaining < 60;
  const isWarning = !isActuallyExpired && secondsRemaining < 300;

  return (
    <div style={{ marginBottom: '1.75rem' }}>
      {/* Top Back Navigation Link */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: 'none',
            border: 'none',
            color: 'var(--color-primary)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            padding: '0.4rem 0',
            marginBottom: '1rem',
          }}
        >
          <ArrowLeft size={16} />
          <span>&larr; {backLabel}</span>
        </button>
      )}

      {/* Main Profile Card */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.75rem',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {/* Top Banner: Patient Info & Status / Expiry */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem',
            borderBottom: '1px solid var(--color-border-light)',
            paddingBottom: '1.25rem',
          }}
        >
          {/* Left: Patient Avatar & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 'var(--radius-full)',
                backgroundColor: isActuallyExpired ? '#f1f5f9' : 'var(--color-mint-100)',
                color: isActuallyExpired ? '#64748b' : 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.25rem',
                border: `2px solid ${isActuallyExpired ? '#cbd5e1' : 'var(--color-mint-300)'}`,
              }}
            >
              {patient?.avatar || (patient?.name ? patient.name.substring(0, 2).toUpperCase() : 'PT')}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                  {patient?.name || 'Patient Profile'}
                </h2>
                {isActuallyExpired ? (
                  <span
                    className="badge"
                    style={{
                      backgroundColor: '#f1f5f9',
                      color: '#64748b',
                      border: '1px solid #cbd5e1',
                      gap: '0.3rem',
                      fontWeight: 700,
                    }}
                  >
                    <Lock size={12} />
                    <span>Access Status: EXPIRED</span>
                  </span>
                ) : (
                  <span className="badge badge-emerald" style={{ gap: '0.3rem', fontWeight: 700 }}>
                    <ShieldCheck size={13} />
                    <span>Access Status: ACTIVE</span>
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem', margin: 0 }}>
                {isActuallyExpired
                  ? 'Session expired • Authorization required to view medical documents'
                  : 'Authorized Clinical Session • Read-only Medical Vault'}
              </p>
            </div>
          </div>

          {/* Right: Expiry Timer & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {!isActuallyExpired ? (
              <>
                {/* Active Live Timer */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.55rem 1rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: isUrgent ? '#fef2f2' : isWarning ? '#fffbeb' : 'var(--color-mint-50)',
                    border: `1px solid ${isUrgent ? '#fecaca' : isWarning ? '#fde68a' : 'var(--color-mint-200)'}`,
                    color: isUrgent ? '#dc2626' : isWarning ? '#b45309' : 'var(--color-primary-dark)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                  }}
                >
                  <Clock size={16} />
                  <span>Access Expires In:</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '0.04em' }}>
                    {formatTime(secondsRemaining)}
                  </span>
                </div>

                {onEndSession && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={onEndSession}
                    style={{
                      borderColor: '#fca5a5',
                      color: '#dc2626',
                      gap: '0.4rem',
                      padding: '0.55rem 0.95rem',
                    }}
                  >
                    <LogOut size={15} />
                    <span>End Session</span>
                  </button>
                )}
              </>
            ) : (
              onReauthorize && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={onReauthorize}
                  style={{ gap: '0.4rem', padding: '0.55rem 1.1rem' }}
                >
                  <RefreshCw size={14} />
                  <span>Scan QR to Re-Authorize</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Patient Details Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '1rem',
            paddingTop: '1.25rem',
          }}
        >
          {patient?.dateOfBirth && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Calendar size={18} style={{ color: 'var(--color-primary)' }} />
              <div>
                <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', display: 'block' }}>
                  DOB / Age
                </span>
                <strong style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                  {patient.dateOfBirth} {patient.age ? `(${patient.age} yrs)` : ''}
                </strong>
              </div>
            </div>
          )}

          {patient?.bloodGroup && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Droplet size={18} style={{ color: '#dc2626' }} />
              <div>
                <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', display: 'block' }}>
                  Blood Group
                </span>
                <strong style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                  {patient.bloodGroup}
                </strong>
              </div>
            </div>
          )}

          {patient?.gender && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <User size={18} style={{ color: 'var(--color-primary)' }} />
              <div>
                <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', display: 'block' }}>
                  Gender
                </span>
                <strong style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                  {patient.gender}
                </strong>
              </div>
            </div>
          )}

          {patient?.allergies && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <AlertTriangle size={18} style={{ color: '#d97706' }} />
              <div>
                <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', display: 'block' }}>
                  Allergies
                </span>
                <strong style={{ fontSize: '0.85rem', color: '#b45309' }}>
                  {patient.allergies}
                </strong>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <FileCheck size={18} style={{ color: 'var(--color-primary)' }} />
            <div>
              <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', display: 'block' }}>
                Medical Vault
              </span>
              <strong style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                {isActuallyExpired ? 'Locked' : `${totalRecords} Documents`}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
