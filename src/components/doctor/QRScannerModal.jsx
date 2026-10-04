import React, { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  UploadCloud,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  QrCode,
  Sparkles,
  FileImage,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { parsePatientQRCode, DEMO_PATIENT_SESSIONS, generatePatientAccessQRDataUrl } from '../../lib/access-session';

export default function QRScannerModal({ initialMode = 'camera', onClose, onQRDecoded }) {
  const [activeTab, setActiveTab] = useState(initialMode); // 'camera', 'upload', 'test'
  const [cameraError, setCameraError] = useState(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [decodedData, setDecodedData] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [manualError, setManualError] = useState('');
  const [demoQRCodes, setDemoQRCodes] = useState({});

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);

  // Stop camera stream cleanly
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Frame scanner loop
  const scanVideoFrame = useCallback(() => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data) {
      try {
        const parsed = parsePatientQRCode(code.data);
        stopCamera();
        setDecodedData(parsed);
        setTimeout(() => {
          onQRDecoded(parsed);
        }, 500);
        return;
      } catch (err) {
        // Continue scanning if not matching format yet
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
  }, [stopCamera, onQRDecoded]);

  // Start Camera
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    setCameraLoading(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser environment.');
      }

      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS Safari
        await videoRef.current.play();
        setCameraLoading(false);
        setIsScanning(true);
        animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
      }
    } catch (err) {
      setCameraLoading(false);
      setIsScanning(false);
      console.warn('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera access in browser settings, or switch to Upload QR mode.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No video camera device detected. Please use the Upload QR or Demo QR mode.');
      } else {
        setCameraError(err.message || 'Unable to start camera. Please upload a QR code image instead.');
      }
    }
  }, [stopCamera, scanVideoFrame]);

  // Manage camera on tab change
  useEffect(() => {
    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab, startCamera, stopCamera]);

  // Pre-generate sample QR codes for demo inspection
  useEffect(() => {
    async function loadDemoQrs() {
      const qrs = {};
      for (const demo of DEMO_PATIENT_SESSIONS) {
        try {
          qrs[demo.sessionId] = await generatePatientAccessQRDataUrl(demo);
        } catch (e) {
          console.error(e);
        }
      }
      setDemoQRCodes(qrs);
    }
    loadDemoQrs();
  }, []);

  // Process uploaded image file for QR code
  const handleFileProcess = async (file) => {
    if (!file) return;
    setUploadError('');

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    try {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code && code.data) {
            try {
              const parsed = parsePatientQRCode(code.data);
              setDecodedData(parsed);
              setTimeout(() => {
                onQRDecoded(parsed);
              }, 400);
            } catch (parseErr) {
              setUploadError(parseErr.message || 'The QR code in this image is not a recognized Vital Diary access token.');
            }
          } else {
            setUploadError('Could not detect a readable QR code in this image. Please ensure the QR code is crisp and well-lit.');
          }
        };
        img.onerror = () => {
          setUploadError('Failed to decode the selected image file.');
        };
        img.src = e.target.result;
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setUploadError(err.message || 'Error reading QR image file.');
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    setManualError('');
    if (!manualCode.trim()) {
      setManualError('Please enter a session ID or access token.');
      return;
    }
    try {
      const parsed = parsePatientQRCode(manualCode);
      onQRDecoded(parsed);
    } catch (err) {
      setManualError(err.message || 'Invalid access session format.');
    }
  };

  const selectDemoSession = (demo) => {
    try {
      const parsed = parsePatientQRCode(demo.sessionId);
      parsed.patientName = demo.patient.name;
      parsed.testOtp = demo.otpCode;
      onQRDecoded(parsed);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 620, padding: 0, overflow: 'hidden' }}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 38,
                height: 38,
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
              <h3 style={{ fontSize: '1.15rem', color: 'var(--color-text-primary)', margin: 0 }}>
                Scan Patient QR Code
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                Temporary Authorized Clinical Access
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-outline btn-sm"
            style={{ padding: '0.4rem', borderRadius: 'var(--radius-md)', border: 'none' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Toggle Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-subtle)',
            padding: '0.35rem 0.75rem',
            gap: '0.5rem',
          }}
        >
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'camera' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('camera')}
            style={{ flex: 1, gap: '0.4rem' }}
          >
            <Camera size={15} />
            <span>Scan with Camera</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'upload' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('upload')}
            style={{ flex: 1, gap: '0.4rem' }}
          >
            <UploadCloud size={15} />
            <span>Upload QR Image</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'test' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('test')}
            style={{ flex: 1, gap: '0.4rem' }}
          >
            <Sparkles size={15} />
            <span>Demo Test Patients</span>
          </button>
        </div>

        {/* Body Area */}
        <div style={{ padding: '1.5rem', backgroundColor: '#ffffff' }}>
          {/* CAMERA TAB */}
          {activeTab === 'camera' && (
            <div>
              {cameraError ? (
                <div
                  style={{
                    padding: '1.5rem',
                    textAlign: 'center',
                    backgroundColor: '#fffbeb',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid #fde68a',
                  }}
                >
                  <ShieldAlert size={36} style={{ color: '#d97706', margin: '0 auto 0.75rem' }} />
                  <h4 style={{ color: '#92400e', marginBottom: '0.4rem', fontSize: '1rem' }}>
                    Camera Unavailable
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: '#78350f', marginBottom: '1.25rem' }}>
                    {cameraError}
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                    <button onClick={startCamera} className="btn btn-secondary btn-sm">
                      <RefreshCw size={14} />
                      <span>Retry Camera</span>
                    </button>
                    <button onClick={() => setActiveTab('upload')} className="btn btn-primary btn-sm">
                      <UploadCloud size={14} />
                      <span>Upload QR File Instead</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {/* Camera Viewport */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      maxWidth: '380px',
                      height: '280px',
                      backgroundColor: '#0f172a',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}
                  >
                    <video
                      ref={videoRef}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      muted
                    />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />

                    {cameraLoading && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: 'rgba(15, 23, 42, 0.85)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          gap: '0.75rem',
                        }}
                      >
                        <RefreshCw size={24} className="spin-animation" />
                        <span style={{ fontSize: '0.875rem' }}>Initializing camera...</span>
                      </div>
                    )}

                    {/* Viewfinder Target Frame & Animated Scan Line */}
                    {isScanning && (
                      <div
                        style={{
                          position: 'absolute',
                          width: '200px',
                          height: '200px',
                          border: '2px solid rgba(16, 185, 129, 0.9)',
                          borderRadius: '16px',
                          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                          pointerEvents: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {/* Scanning Laser Line */}
                        <div
                          style={{
                            width: '100%',
                            height: '2px',
                            backgroundColor: '#10b981',
                            boxShadow: '0 0 10px #10b981, 0 0 4px #34d399',
                            animation: 'scanLaser 2s infinite ease-in-out',
                          }}
                        />
                      </div>
                    )}

                    {decodedData && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: 'rgba(4, 120, 87, 0.92)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          gap: '0.5rem',
                          animation: 'fadeIn 0.2s',
                        }}
                      >
                        <CheckCircle2 size={42} />
                        <strong style={{ fontSize: '1.1rem' }}>Patient QR Detected!</strong>
                        <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                          Granting Direct Access...
                        </span>
                      </div>
                    )}
                  </div>

                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--color-text-secondary)',
                      marginTop: '1rem',
                      textAlign: 'center',
                    }}
                  >
                    Align the patient's Vital Diary QR code within the frame to scan.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* UPLOAD QR IMAGE TAB */}
          {activeTab === 'upload' && (
            <div>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileProcess(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => document.getElementById('qr-file-input').click()}
                style={{
                  border: isDragging ? '2px dashed var(--color-primary)' : '2px dashed var(--color-border)',
                  backgroundColor: isDragging ? 'var(--color-mint-50)' : 'var(--color-bg-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <input
                  id="qr-file-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileProcess(e.target.files[0]);
                    }
                  }}
                />

                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    backgroundColor: 'var(--color-mint-50)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                    border: '1px solid var(--color-mint-200)',
                  }}
                >
                  <FileImage size={28} />
                </div>

                <h4 style={{ fontSize: '1.05rem', color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
                  Choose a QR code image or drop here
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                  Supports PNG, JPG, or WebP exported by patient
                </p>

                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById('qr-file-input').click();
                  }}
                >
                  <UploadCloud size={15} />
                  <span>Browse Image File</span>
                </button>
              </div>

              {uploadError && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.85rem 1rem',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 'var(--radius-md)',
                    marginTop: '1rem',
                    fontSize: '0.85rem',
                    color: '#991b1b',
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Manual Session ID Input Fallback */}
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                  Or enter Access Session ID manually:
                </span>
                <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="e.g. vd_sess_eleanor_vance_2026"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn btn-secondary btn-sm" style={{ padding: '0.65rem 1.25rem' }}>
                    <span>Submit</span>
                    <ArrowRight size={14} />
                  </button>
                </form>
                {manualError && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-danger)', marginTop: '0.35rem' }}>
                    {manualError}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* DEMO TEST PATIENTS TAB */}
          {activeTab === 'test' && (
            <div>
              <div
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--color-mint-50)',
                  border: '1px solid var(--color-mint-200)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.25rem',
                  fontSize: '0.85rem',
                  color: 'var(--color-primary-dark)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                  <Sparkles size={16} />
                  <span>Instant Testing & Review Simulator</span>
                </div>
                Click any pre-generated patient below to simulate a real QR scan and access their complete clinical history directly.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {DEMO_PATIENT_SESSIONS.map((demo) => (
                  <div
                    key={demo.sessionId}
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#ffffff',
                      gap: '1rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      {demoQRCodes[demo.sessionId] ? (
                        <img
                          src={demoQRCodes[demo.sessionId]}
                          alt="QR Code"
                          style={{
                            width: 60,
                            height: 60,
                            borderRadius: 8,
                            border: '1px solid var(--color-border)',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 60,
                            height: 60,
                            borderRadius: 8,
                            backgroundColor: 'var(--color-bg-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <QrCode size={24} />
                        </div>
                      )}

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <strong style={{ fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                            {demo.patient.name}
                          </strong>
                          <span className="badge badge-mint">{demo.durationMinutes} min grant</span>
                        </div>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                          {demo.records.length} Medical Records &bull; Blood: {demo.patient.bloodGroup}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                          Session: {demo.sessionId}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => selectDemoSession(demo)}
                      style={{ gap: '0.4rem' }}
                    >
                      <span>Simulate Scan</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
