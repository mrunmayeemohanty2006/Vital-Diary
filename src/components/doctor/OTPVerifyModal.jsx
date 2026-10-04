import React, { useState, useRef, useEffect } from 'react';
import {
  KeyRound,
  X,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Clock,
  User,
  Info,
} from 'lucide-react';
import { verifyDoctorAccessSession } from '../../lib/access-session';

export default function OTPVerifyModal({ qrData, doctorUser, onClose, onSuccess }) {
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  const sessionId = qrData?.sessionId || '';
  const patientName = qrData?.patientName || 'Authorized Patient';

  useEffect(() => {
    // If QR data came with a pre-filled test OTP (from simulator), auto-populate for convenience
    if (qrData?.testOtp && qrData.testOtp.length === 6) {
      setOtpDigits(qrData.testOtp.split(''));
    } else {
      // Focus first input
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }
  }, [qrData]);

  const handleDigitChange = (index, value) => {
    // Keep only numbers
    const cleanVal = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);
    setError('');

    // Advance to next input if filled
    if (cleanVal && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < pasted.length; i++) {
        newDigits[i] = pasted[i];
      }
      setOtpDigits(newDigits);
      const nextFocus = Math.min(pasted.length, 5);
      if (inputRefs.current[nextFocus]) {
        inputRefs.current[nextFocus].focus();
      }
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const fullOtp = otpDigits.join('');

    if (fullOtp.length !== 6) {
      setError('Please enter all 6 digits of the Patient OTP code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await verifyDoctorAccessSession(sessionId, fullOtp, doctorUser);
      setLoading(false);
      onSuccess(result);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'OTP verification failed. Please try again.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 480, padding: 0, overflow: 'hidden' }}
      >
        {/* Modal Header */}
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
              <KeyRound size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text-primary)', margin: 0 }}>
                Enter Patient OTP
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                Verification required for clinical vault access
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-outline btn-sm"
            style={{ padding: '0.35rem', border: 'none' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', backgroundColor: '#ffffff' }}>
          {/* Patient Reference Card */}
          <div
            style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--color-mint-50)',
              border: '1px solid var(--color-mint-200)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
              >
                <User size={16} />
              </div>
              <div>
                <strong style={{ fontSize: '0.925rem', color: 'var(--color-text-primary)', display: 'block' }}>
                  {patientName}
                </strong>
                <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                  Session: {sessionId.length > 24 ? `${sessionId.substring(0, 24)}...` : sessionId}
                </span>
              </div>
            </div>

            <div className="badge badge-mint" style={{ fontSize: '0.75rem', gap: '0.25rem' }}>
              <Clock size={12} />
              <span>Temporary</span>
            </div>
          </div>

          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--color-text-secondary)',
              marginBottom: '1.25rem',
              textAlign: 'center',
            }}
          >
            Please enter the <strong>6-digit OTP code</strong> displayed on the patient's screen to authenticate and unlock their medical record history.
          </p>

          {/* 6 Segmented OTP Input Boxes */}
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                justifyContent: 'center',
                marginBottom: '1.25rem',
              }}
              onPaste={handlePaste}
            >
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  style={{
                    width: '52px',
                    height: '58px',
                    fontSize: '1.6rem',
                    fontWeight: 700,
                    textAlign: 'center',
                    borderRadius: 'var(--radius-md)',
                    border: digit ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    backgroundColor: digit ? 'var(--color-mint-50)' : '#ffffff',
                    color: 'var(--color-text-primary)',
                    boxShadow: digit ? '0 0 0 3px rgba(4, 120, 87, 0.12)' : 'none',
                    transition: 'all var(--transition-fast)',
                  }}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.25rem',
                  fontSize: '0.85rem',
                  color: '#991b1b',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Test Helper for Demo */}
            {qrData?.testOtp && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  fontSize: '0.8rem',
                  color: 'var(--color-primary-dark)',
                  backgroundColor: 'var(--color-mint-100)',
                  padding: '0.4rem 0.8rem',
                  borderRadius: 'var(--radius-full)',
                  marginBottom: '1.25rem',
                }}
              >
                <Info size={13} />
                <span>Demo Test OTP: <strong>{qrData.testOtp}</strong></span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || otpDigits.join('').length !== 6}
              style={{
                width: '100%',
                padding: '0.8rem',
                fontSize: '0.95rem',
                gap: '0.5rem',
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="spin-animation" />
                  <span>Verifying Authorization...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Verify & Open Patient Vault</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
