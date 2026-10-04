import React, { useState, useEffect, useCallback } from 'react';
import {
  QrCode,
  ShieldCheck,
  Clock,
  Lock,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  User,
  Stethoscope,
  RefreshCw,
  XCircle,
  Sparkles,
  ArrowRight,
  Radio,
  FileCheck,
  ScanLine,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRecords } from '../context/RecordsContext';
import { useNotification } from '../context/NotificationContext';
import {
  createPatientAccessSession,
  grantDoctorDirectQRAccess,
  revokePatientAccessSession,
  getPatientActiveSession,
  fetchPatientActiveSession,
  subscribeToPatientAccessSession,
  generatePatientAccessQRDataUrl,
} from '../lib/access-session';

export default function GenerateQRPage({ onNavigateTab }) {
  const { user } = useAuth();
  const { records } = useRecords();
  const notify = useNotification();

  const [activeSession, setActiveSession] = useState(() => getPatientActiveSession(user?.id));
  const [durationOption, setDurationOption] = useState('30'); // '15', '30', '60', 'custom'
  const [customMinutes, setCustomMinutes] = useState('45');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);
  const [copiedSessionId, setCopiedSessionId] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [totalDurationSeconds, setTotalDurationSeconds] = useState(1800);
  const [qrImageSrc, setQrImageSrc] = useState(activeSession?.qrDataUrl || '');

  // Synchronize state with Supabase database & local storage in real time
  const syncSession = useCallback(async () => {
    if (!user?.id) return;
    const current = await fetchPatientActiveSession(user.id);
    if (current) {
      setActiveSession(current);
      if (!current.qrDataUrl) {
        try {
          const url = await generatePatientAccessQRDataUrl(current);
          setQrImageSrc(url);
        } catch (e) {
          console.warn('QR gen error:', e);
        }
      } else {
        setQrImageSrc(current.qrDataUrl);
      }
    } else {
      setActiveSession(null);
      setQrImageSrc('');
    }
  }, [user?.id]);

  useEffect(() => {
    syncSession();

    // 1. Supabase Real-time database subscription
    const dbSub = subscribeToPatientAccessSession(user?.id, (updated) => {
      if (updated) {
        setActiveSession(updated);
        if (updated.qrDataUrl) setQrImageSrc(updated.qrDataUrl);
      } else {
        setActiveSession(null);
        setQrImageSrc('');
      }
    });

    // 2. Custom window events dispatched when doctor scans QR
    const handleSessionEvent = (e) => {
      if (e?.detail?.session) {
        if (!user || e.detail.session.patient?.id === user.id || e.detail.session.sessionId === activeSession?.sessionId) {
          syncSession();
        }
      }
    };

    // 3. Storage event for multi-tab synchronization
    const handleStorage = (e) => {
      if (e.key?.startsWith('vital_diary_patient_active_session_') || e.key === 'vital_diary_patient_access_sessions') {
        syncSession();
      }
    };

    window.addEventListener('vital_diary_session_event', handleSessionEvent);
    window.addEventListener('storage', handleStorage);

    // 4. Polling timer for robust cross-device syncing
    const pollTimer = setInterval(syncSession, 1500);

    return () => {
      dbSub.unsubscribe();
      window.removeEventListener('vital_diary_session_event', handleSessionEvent);
      window.removeEventListener('storage', handleStorage);
      clearInterval(pollTimer);
    };
  }, [user, activeSession?.sessionId, syncSession]);

  // Ensure QR image is generated whenever activeSession changes
  useEffect(() => {
    if (activeSession?.sessionId && !qrImageSrc) {
      generatePatientAccessQRDataUrl(activeSession)
        .then((url) => setQrImageSrc(url))
        .catch((e) => console.warn(e));
    }
  }, [activeSession, qrImageSrc]);

  // Handle countdown timer when session is active
  useEffect(() => {
    if (!activeSession?.expiresAt || activeSession.status !== 'active') {
      setSecondsRemaining(0);
      return;
    }

    const durationMin = activeSession.durationMinutes || 30;
    setTotalDurationSeconds(durationMin * 60);

    const checkTimer = () => {
      const diff = Math.floor((new Date(activeSession.expiresAt).getTime() - Date.now()) / 1000);
      if (diff <= 0) {
        setSecondsRemaining(0);
        handleRevoke();
      } else {
        setSecondsRemaining(diff);
      }
    };

    checkTimer();
    const interval = setInterval(checkTimer, 1000);

    return () => clearInterval(interval);
  }, [activeSession?.expiresAt, activeSession?.status]);

  // Format mm:ss
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Step: Patient Clicks "Generate QR"
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
      setQrImageSrc(session.qrDataUrl);
      notify.success('Temporary doctor access QR generated successfully.');
    } catch (err) {
      notify.error(`Failed to generate QR: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Direct Doctor Scan Simulation -> Immediately Grants Access
  const handleSimulateDoctorScan = async () => {
    if (!activeSession) return;
    setIsSimulatingScan(true);
    try {
      const doctorUser = {
        id: 'DOC-4892',
        name: 'Dr. Sarah Jenkins, MD',
        email: 'sarah.jenkins@vitaldiary.io',
        specialty: 'Cardiology & Internal Medicine',
        hospital: 'Central Healthcare System',
      };
      const result = await grantDoctorDirectQRAccess(activeSession.sessionId, doctorUser);
      setActiveSession((prev) => ({
        ...prev,
        ...result,
        status: 'active',
        doctor: result.doctor,
      }));
      notify.success('Doctor connected and granted clinical records access.');
    } catch (err) {
      notify.error(`Scan access error: ${err.message}`);
    } finally {
      setIsSimulatingScan(false);
    }
  };

  // Revoke / End Access
  const handleRevoke = async () => {
    if (!activeSession) return;
    const confirmed = await notify.confirm({
      title: 'Revoke Doctor Access',
      message: 'Are you sure you want to revoke doctor access immediately? All temporary access will terminate.',
      confirmText: 'Revoke Access',
      cancelText: 'Keep Active',
      type: 'danger',
    });
    if (!confirmed) return;

    try {
      await revokePatientAccessSession(activeSession.sessionId, user?.id);
      setActiveSession(null);
      setQrImageSrc('');
      notify.info('Doctor access has been revoked.');
    } catch (err) {
      console.warn('Revoke notice:', err);
      setActiveSession(null);
      setQrImageSrc('');
      notify.info('Doctor access session terminated.');
    }
  };

  const copySessionId = () => {
    if (activeSession?.sessionId) {
      navigator.clipboard.writeText(activeSession.sessionId);
      setCopiedSessionId(true);
      setTimeout(() => setCopiedSessionId(false), 2000);
    }
  };

  const progressPercent =
    totalDurationSeconds > 0
      ? Math.max(0, Math.min(100, (secondsRemaining / totalDurationSeconds) * 100))
      : 0;

  return (
    <div className="dashboard-content-area" style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'var(--color-primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)',
            }}
          >
            <QrCode size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 800, margin: 0, color: 'var(--color-text-primary)' }}>
              Patient QR Access
            </h1>
            <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              Generate a temporary QR code to grant physicians direct access to your medical reports for a chosen duration.
            </p>
          </div>
        </div>
      </div>

      {/* FLOW STEP TRACKER */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          backgroundColor: '#ffffff',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: activeSession ? 'var(--color-primary)' : 'var(--color-primary-light)',
              color: activeSession ? '#ffffff' : 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            1
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Select Time & Generate QR
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Temporary access session
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor:
                activeSession?.status === 'active'
                  ? 'var(--color-primary)'
                  : activeSession
                  ? '#fef3c7'
                  : 'var(--color-bg-alt)',
              color:
                activeSession?.status === 'active'
                  ? '#ffffff'
                  : activeSession
                  ? '#92400e'
                  : 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            2
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Doctor Scans QR
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Camera or file upload
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: activeSession?.status === 'active' ? '#10b981' : 'var(--color-bg-alt)',
              color: activeSession?.status === 'active' ? '#ffffff' : 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            3
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Direct Access Active
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Auto-expires with timer
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER CARDS */}
      {!activeSession ? (
        /* ====================================================================== */
        /* STATE 1: GENERATE QR FORM                                              */
        /* ====================================================================== */
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            padding: '2.5rem',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}
              >
                <QrCode size={36} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                Create Doctor Access QR
              </h2>
              <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                Select a time duration and generate a QR code. When your doctor scans the QR, they will directly receive read-only access to your medical records for that duration.
              </p>
            </div>

            {/* Duration Selector */}
            <div style={{ marginBottom: '2rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  marginBottom: '0.75rem',
                }}
              >
                Select Access Duration
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                }}
              >
                {[
                  { val: '15', label: '15 min', desc: 'Quick check' },
                  { val: '30', label: '30 min', desc: 'Standard consult' },
                  { val: '60', label: '1 hour', desc: 'Detailed review' },
                  { val: 'custom', label: 'Custom', desc: 'Custom minutes' },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setDurationOption(opt.val)}
                    style={{
                      padding: '0.875rem 0.5rem',
                      borderRadius: 'var(--radius-md)',
                      border:
                        durationOption === opt.val
                          ? '2px solid var(--color-primary)'
                          : '1px solid var(--color-border)',
                      backgroundColor:
                        durationOption === opt.val
                          ? 'var(--color-primary-light)'
                          : '#ffffff',
                      color:
                        durationOption === opt.val
                          ? 'var(--color-primary)'
                          : 'var(--color-text-primary)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{opt.label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                      {opt.desc}
                    </div>
                  </button>
                ))}
              </div>

              {durationOption === 'custom' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <input
                    type="number"
                    min="5"
                    max="1440"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    style={{
                      width: '120px',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.95rem',
                    }}
                  />
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    Minutes (between 5 and 1,440 mins)
                  </span>
                </div>
              )}
            </div>

            {/* Generate Action Button */}
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleGenerateQR}
              disabled={isGenerating}
              style={{
                width: '100%',
                padding: '0.9rem 1.5rem',
                fontSize: '1.05rem',
                fontWeight: 700,
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(4, 120, 87, 0.25)',
              }}
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Generating Secure QR...</span>
                </>
              ) : (
                <>
                  <QrCode size={20} />
                  <span>Generate QR</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : activeSession.status === 'active' ? (
        /* ====================================================================== */
        /* STATE 3: ACTIVE ACCESS STATUS CARD (DIRECT ACCESS GRANTED)             */
        /* ====================================================================== */
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            padding: '2.5rem',
            border: '2px solid var(--color-primary)',
            boxShadow: '0 10px 30px rgba(4, 120, 87, 0.1)',
          }}
        >
          {/* Header Status Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              paddingBottom: '1.5rem',
              borderBottom: '1px solid var(--color-border)',
              marginBottom: '2rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Stethoscope size={26} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
                    QR Scanned — Access Active
                  </h2>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '999px',
                      backgroundColor: '#d1fae5',
                      color: '#065f46',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        display: 'inline-block',
                      }}
                    />
                    Active
                  </span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: '0.2rem 0 0 0' }}>
                  Doctor is currently authorized to view your medical reports.
                </p>
              </div>
            </div>

            {/* Revoke Action */}
            <button
              type="button"
              onClick={handleRevoke}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.65rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#fef2f2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <XCircle size={16} />
              <span>Revoke Access</span>
            </button>
          </div>

          {/* Grid: Doctor Profile & Live Expiration Timer */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            {/* Doctor Profile Details Card */}
            <div
              style={{
                backgroundColor: 'var(--color-bg-alt)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                border: '1px solid var(--color-border)',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                Authorized Physician
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1rem' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                  }}
                >
                  {activeSession.doctor?.name
                    ? activeSession.doctor.name
                        .replace(/^Dr\.\s*/i, '')
                        .substring(0, 2)
                        .toUpperCase()
                    : 'DR'}
                </div>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                    {activeSession.doctor?.name || activeSession.doctorName || 'Dr. Sarah Jenkins, MD'}
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)' }}>
                    {activeSession.doctor?.specialty || 'Cardiology & Internal Medicine'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.825rem', color: 'var(--color-text-secondary)', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Doctor ID:</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {activeSession.doctor?.id || activeSession.doctorId || 'DOC-4892'}
                  </span>
                </div>
                {activeSession.doctor?.hospital && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Hospital / Clinic:</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {activeSession.doctor.hospital}
                    </span>
                  </div>
                )}
                {activeSession.doctor?.email && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Verified Email:</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {activeSession.doctor.email}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Access Expires In Countdown Timer Card */}
            <div
              style={{
                backgroundColor: 'var(--color-bg-alt)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  Access Expires In
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div
                    style={{
                      fontSize: '2.5rem',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      color: secondsRemaining < 300 ? '#dc2626' : 'var(--color-primary)',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {formatTime(secondsRemaining)}
                  </div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    remaining
                  </span>
                </div>

                {/* Progress Bar */}
                <div
                  style={{
                    height: '8px',
                    borderRadius: '4px',
                    backgroundColor: '#e5e7eb',
                    overflow: 'hidden',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${progressPercent}%`,
                      backgroundColor: secondsRemaining < 300 ? '#ef4444' : 'var(--color-primary)',
                      transition: 'width 1s linear',
                    }}
                  />
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Duration: {activeSession.durationMinutes || 30} mins</span>
                <span style={{ color: 'var(--color-text-muted)' }}>Auto-locks when timer expires</span>
              </div>
            </div>
          </div>

          {/* Records Being Shared */}
          <div
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: 'var(--color-bg-alt)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              <FileCheck size={18} style={{ color: 'var(--color-primary)' }} />
              <span>
                Sharing <strong>{records.length} existing medical reports</strong> with Dr. {activeSession.doctor?.name?.replace(/^Dr\.\s*/i, '') || 'Provider'}
              </span>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => onNavigateTab && onNavigateTab('search')}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              View Reports
            </button>
          </div>
        </div>
      ) : (
        /* ====================================================================== */
        /* STATE 2: QR GENERATED -> WAITING FOR DOCTOR TO SCAN (DIRECT ACCESS)    */
        /* ====================================================================== */
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            padding: '2.5rem',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                backgroundColor: '#fef3c7',
                color: '#92400e',
                fontSize: '0.8125rem',
                fontWeight: 700,
                border: '1px solid #fde68a',
                marginBottom: '1rem',
              }}
            >
              <Radio size={14} className="animate-pulse" />
              Waiting for Doctor to Scan QR
            </span>

            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Present QR to Your Doctor
            </h2>
            <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)', marginBottom: '1.75rem' }}>
              Have your physician scan this code with their Doctor Portal. Scanning directly activates access for <strong>{activeSession.durationMinutes || 30} minutes</strong>.
            </p>

            {/* QR CODE BOX */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '2px solid var(--color-primary)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                display: 'inline-block',
                boxShadow: '0 8px 24px rgba(4, 120, 87, 0.12)',
                marginBottom: '1.5rem',
              }}
            >
              {qrImageSrc ? (
                <img
                  src={qrImageSrc}
                  alt="Patient Access QR"
                  style={{ width: '240px', height: '240px', display: 'block', margin: '0 auto' }}
                />
              ) : (
                <div style={{ width: '240px', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RefreshCw className="animate-spin" size={32} />
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={handleRevoke}
                className="btn btn-outline btn-sm"
                style={{ color: '#dc2626', borderColor: '#fca5a5', padding: '0.5rem 1.25rem' }}
              >
                Cancel / Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
