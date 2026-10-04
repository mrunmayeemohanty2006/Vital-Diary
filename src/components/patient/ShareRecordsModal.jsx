import React, { useState, useEffect } from 'react';
import {
  QrCode,
  X,
  Clock,
  ShieldCheck,
  KeyRound,
  AlertTriangle,
  RefreshCw,
  Download,
  Copy,
  Check,
  Lock,
  FileText,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRecords } from '../../context/RecordsContext';
import { useNotification } from '../../context/NotificationContext';
import {
  createPatientAccessSession,
  revokePatientAccessSession,
  getPatientActiveSession,
} from '../../lib/access-session';

export default function ShareRecordsModal({ onClose }) {
  const { user } = useAuth();
  const { records } = useRecords();
  const notify = useNotification();

  const [activeSession, setActiveSession] = useState(() => getPatientActiveSession(user?.id));
  const [durationOption, setDurationOption] = useState('30'); // '15', '30', '60', 'custom'
  const [customMinutes, setCustomMinutes] = useState('45');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  // Initialize timer if active session exists
  useEffect(() => {
    if (activeSession?.expiresAt) {
      const diff = Math.floor((new Date(activeSession.expiresAt).getTime() - Date.now()) / 1000);
      setSecondsRemaining(Math.max(0, diff));
    }
  }, [activeSession]);

  // Live countdown timer effect
  useEffect(() => {
    if (!activeSession?.expiresAt) return;

    const interval = setInterval(() => {
      const diff = Math.floor((new Date(activeSession.expiresAt).getTime() - Date.now()) / 1000);
      if (diff <= 0) {
        setSecondsRemaining(0);
        setActiveSession(null);
        if (user?.id) {
          revokePatientAccessSession(activeSession.sessionId, user.id);
        }
        clearInterval(interval);
      } else {
        setSecondsRemaining(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession, user?.id]);

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleGenerateQR = async () => {
    if (!user) return;
    setIsGenerating(true);

    let finalDuration = 30;
    if (durationOption === '15') finalDuration = 15;
    else if (durationOption === '30') finalDuration = 30;
    else if (durationOption === '60') finalDuration = 60;
    else if (durationOption === 'custom') {
      finalDuration = Math.max(5, Math.min(1440, parseInt(customMinutes, 10) || 30));
    }

    try {
      const session = await createPatientAccessSession({
        patient: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          bloodGroup: user.bloodGroup || user.blood_group,
          dateOfBirth: user.dateOfBirth || user.date_of_birth,
          gender: user.gender,
          allergies: user.allergies,
        },
        records,
        durationMinutes: finalDuration,
      });

      setActiveSession(session);
      const diff = Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000);
      setSecondsRemaining(Math.max(0, diff));
      notify.success('Temporary doctor access QR generated successfully.');
    } catch (err) {
      notify.error(`Failed to generate access QR: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevoke = async () => {
    if (!activeSession) return;
    const confirmed = await notify.confirm({
      title: 'Revoke Doctor Access',
      message: 'Are you sure you want to revoke doctor access immediately? All temporary access will terminate.',
      confirmText: 'Revoke Access',
      cancelText: 'Keep Active',
      type: 'danger',
    });

    if (confirmed) {
      await revokePatientAccessSession(activeSession.sessionId, user?.id);
      setActiveSession(null);
      setSecondsRemaining(0);
      notify.info('Doctor access has been revoked.');
    }
  };

  const handleCopyOtp = () => {
    if (!activeSession?.otpCode) return;
    navigator.clipboard.writeText(activeSession.otpCode);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!activeSession?.qrDataUrl) return;
    const a = document.createElement('a');
    a.href = activeSession.qrDataUrl;
    a.download = `VitalDiary_Access_QR_${user?.name?.replace(/\s+/g, '_') || 'Patient'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isUrgent = secondsRemaining < 60;
  const isWarning = secondsRemaining < 300;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 480, padding: 0, overflow: 'hidden' }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: 'var(--color-mint-50)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--color-mint-200)',
              }}
            >
              <QrCode size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text-primary)', margin: 0 }}>
                SHARE HEALTH RECORDS
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                Temporary Doctor Access &bull; Vital Diary
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline btn-sm"
            style={{ padding: '0.35rem', border: 'none' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '1.5rem', backgroundColor: '#ffffff' }}>
          {!activeSession ? (
            /* ========================================================== */
            /* SCREEN 1: DURATION SELECTION & GENERATE BUTTON             */
            /* ========================================================== */
            <div>
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--color-mint-50)',
                  border: '1px solid var(--color-mint-200)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                }}
              >
                <ShieldCheck size={20} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: '0.84rem', color: 'var(--color-primary-dark)', lineHeight: 1.45 }}>
                  <strong>Controlled Doctor Access:</strong> Generates a secure, temporary QR token. The doctor must enter your 6-digit OTP code to view your existing PDF records.
                </div>
              </div>

              {/* Access Duration Options */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                    display: 'block',
                    marginBottom: '0.75rem',
                  }}
                >
                  Select Access Duration:
                </label>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1rem',
                      border: durationOption === '15' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: durationOption === '15' ? 'var(--color-mint-50)' : '#ffffff',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                    }}
                  >
                    <input
                      type="radio"
                      name="duration"
                      value="15"
                      checked={durationOption === '15'}
                      onChange={() => setDurationOption('15')}
                    />
                    <span>15 minutes</span>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1rem',
                      border: durationOption === '30' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: durationOption === '30' ? 'var(--color-mint-50)' : '#ffffff',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                    }}
                  >
                    <input
                      type="radio"
                      name="duration"
                      value="30"
                      checked={durationOption === '30'}
                      onChange={() => setDurationOption('30')}
                    />
                    <span>30 minutes</span>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1rem',
                      border: durationOption === '60' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: durationOption === '60' ? 'var(--color-mint-50)' : '#ffffff',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                    }}
                  >
                    <input
                      type="radio"
                      name="duration"
                      value="60"
                      checked={durationOption === '60'}
                      onChange={() => setDurationOption('60')}
                    />
                    <span>1 hour</span>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1rem',
                      border: durationOption === 'custom' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: durationOption === 'custom' ? 'var(--color-mint-50)' : '#ffffff',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                    }}
                  >
                    <input
                      type="radio"
                      name="duration"
                      value="custom"
                      checked={durationOption === 'custom'}
                      onChange={() => setDurationOption('custom')}
                    />
                    <span>Custom</span>
                  </label>
                </div>

                {durationOption === 'custom' && (
                  <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      Enter duration:
                    </span>
                    <input
                      type="number"
                      min="5"
                      max="1440"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(e.target.value)}
                      style={{ width: '100px', padding: '0.4rem 0.65rem', textAlign: 'center', fontWeight: 600 }}
                    />
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      minutes
                    </span>
                  </div>
                )}
              </div>

              {/* Records count summary */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.5rem',
                  fontSize: '0.85rem',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileText size={16} className="text-emerald" />
                  <span>Medical PDF Reports to Share:</span>
                </div>
                <strong style={{ color: 'var(--color-text-primary)' }}>
                  {records.length} {records.length === 1 ? 'Report' : 'Reports'}
                </strong>
              </div>

              {/* Generate QR Button */}
              <button
                type="button"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', gap: '0.65rem' }}
                onClick={handleGenerateQR}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={18} className="spin-animation" />
                    <span>Generating Secure Token...</span>
                  </>
                ) : (
                  <>
                    <QrCode size={20} />
                    <span>GENERATE QR</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* ========================================================== */
            /* SCREEN 2: QR GENERATED WITH OTP, TIMER & REVOKE BUTTON     */
            /* ========================================================== */
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <span className="badge badge-emerald">QR GENERATED</span>
              </div>

              {/* High-Resolution QR Display */}
              <div
                style={{
                  display: 'inline-block',
                  padding: '0.75rem',
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  border: '2px solid var(--color-mint-300)',
                  boxShadow: 'var(--shadow-md)',
                  margin: '0.5rem auto 1rem',
                }}
              >
                {activeSession.qrDataUrl && (
                  <img
                    src={activeSession.qrDataUrl}
                    alt="Patient Access QR"
                    style={{ width: 200, height: 200, display: 'block' }}
                  />
                )}
              </div>

              {/* OTP Code Box */}
              <div
                style={{
                  backgroundColor: 'var(--color-mint-50)',
                  border: '1.5px dashed var(--color-mint-300)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary-dark)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                  Patient 6-Digit OTP Code
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '0.25em', color: 'var(--color-primary-dark)', fontFamily: 'monospace' }}>
                    {activeSession.otpCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyOtp}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.35rem 0.6rem' }}
                    title="Copy OTP"
                  >
                    {copiedOtp ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
                  </button>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginTop: '0.25rem' }}>
                  Provide this OTP to your doctor when they scan your QR code.
                </span>
              </div>

              {/* Live Expiration Countdown */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 1rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: isUrgent ? '#fef2f2' : isWarning ? '#fffbeb' : 'var(--color-mint-50)',
                  border: `1px solid ${isUrgent ? '#fecaca' : isWarning ? '#fde68a' : 'var(--color-mint-200)'}`,
                  color: isUrgent ? '#dc2626' : isWarning ? '#b45309' : 'var(--color-primary-dark)',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  marginBottom: '1.25rem',
                }}
              >
                <Clock size={16} />
                <span>Expires in:</span>
                <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '0.04em' }}>
                  {formatTime(secondsRemaining)}
                </span>
              </div>

              {/* Actions: Download QR & Revoke Access */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleDownloadQR}
                  style={{ gap: '0.35rem', flex: 1 }}
                >
                  <Download size={14} />
                  <span>Save QR Image</span>
                </button>

                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleRevoke}
                  style={{
                    color: 'var(--color-danger)',
                    borderColor: '#fca5a5',
                    backgroundColor: '#fff5f5',
                    gap: '0.35rem',
                    flex: 1,
                  }}
                >
                  <Lock size={14} />
                  <span>Revoke Access</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
