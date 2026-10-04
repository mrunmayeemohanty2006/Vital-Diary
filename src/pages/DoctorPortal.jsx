import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Stethoscope,
  QrCode,
  UploadCloud,
  Camera,
  User,
  Users,
  ShieldCheck,
  FileText,
  Sparkles,
  ArrowRight,
  History,
  Search,
  Lock,
  Calendar,
  AlertCircle,
  LayoutDashboard,
  Clock,
  Eye,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import QRScannerModal from '../components/doctor/QRScannerModal';
import PatientViewHeader from '../components/doctor/PatientViewHeader';
import PatientRecordSearch from '../components/doctor/PatientRecordSearch';
import DoctorRecordCard from '../components/doctor/DoctorRecordCard';
import SessionExpiredModal from '../components/doctor/SessionExpiredModal';
import RecordDetailModal from '../components/common/RecordDetailModal';
import MetricCard from '../components/common/MetricCard';
import {
  getAuthorizedPatientData,
  endDoctorAccessSession,
  getDoctorAccessLogs,
  getDoctorPatients,
  grantDoctorDirectQRAccess,
  DEMO_PATIENT_SESSIONS,
} from '../lib/access-session';

export default function DoctorPortal({ onSwitchToPatientView, initialTab = 'dashboard' }) {
  const { user } = useAuth();

  // Navigation tab state: 'dashboard' | 'patients' | 'activity' | 'profile'
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      setViewingPatient(null);
    }
  }, [initialTab]);

  // Active Session & Patient View State
  const [activeSession, setActiveSession] = useState(null);
  const [viewingPatient, setViewingPatient] = useState(null); // When viewing a patient from list
  const [patientRecords, setPatientRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [previousTab, setPreviousTab] = useState('dashboard');

  // Search state for Patients & Activity pages
  const [patientsSearch, setPatientsSearch] = useState('');
  const [activitySearch, setActivitySearch] = useState('');
  const [activityStatusFilter, setActivityStatusFilter] = useState('All');

  // Modals
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState('camera'); // 'camera' | 'upload' | 'test'
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [expiredModalOpen, setExpiredModalOpen] = useState(false);
  const [expiredPatientName, setExpiredPatientName] = useState('');

  // Logs & Patients Data
  const [accessLogs, setAccessLogs] = useState(() => getDoctorAccessLogs());
  const [doctorPatients, setDoctorPatients] = useState(() => getDoctorPatients());

  const refreshData = useCallback(() => {
    setAccessLogs(getDoctorAccessLogs());
    setDoctorPatients(getDoctorPatients());
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData, activeSession]);

  // Compute Doctor Dashboard Statistics (Strictly based on scanned sessions)
  const stats = useMemo(() => {
    const totalScans = accessLogs.length;
    const uniquePatients = doctorPatients.length;
    const activeSessionsCount = activeSession ? 1 : 0;

    return {
      totalScans,
      uniquePatients,
      activeSessionsCount,
    };
  }, [accessLogs, doctorPatients, activeSession]);

  // Handle QR code decode from camera or upload -> Directly Grant Access (NO OTP)
  const handleQRDecoded = async (qrData) => {
    setScannerOpen(false);
    setLoadingRecords(true);

    try {
      const doctorProfile = user || {
        id: 'doc_sarah',
        name: 'Dr. Sarah Jenkins, MD',
        specialty: 'Cardiology & Internal Medicine',
      };

      // Step: Direct QR Scan Access Grant (Patient's pre-configured timer begins)
      const verifyResult = await grantDoctorDirectQRAccess(qrData, doctorProfile);
      const authorizedData = await getAuthorizedPatientData(verifyResult.sessionId);

      const sessionObj = {
        sessionId: verifyResult.sessionId,
        patient: authorizedData.patient || verifyResult.patient,
        expiresAt: authorizedData.expiresAt || verifyResult.expiresAt,
        isExpired: false,
      };

      setActiveSession(sessionObj);
      setViewingPatient(sessionObj);
      setPatientRecords(authorizedData.records || []);
      setPatientSearchQuery('');
      setSelectedCategory('All');
      refreshData();
    } catch (err) {
      alert(`QR Access Error: ${err.message}`);
    } finally {
      setLoadingRecords(false);
    }
  };

  // Handle access expiration
  const handleSessionExpire = useCallback(async () => {
    if (!activeSession) return;
    const patName = activeSession.patient?.name || 'Patient';
    setExpiredPatientName(patName);

    try {
      await endDoctorAccessSession(activeSession.sessionId);
    } catch (e) {
      console.warn(e);
    }

    if (viewingPatient && viewingPatient.sessionId === activeSession.sessionId) {
      setViewingPatient((prev) => (prev ? { ...prev, isExpired: true } : null));
      setPatientRecords([]);
    }

    setActiveSession(null);
    setSelectedRecord(null);
    setExpiredModalOpen(true);
    refreshData();
  }, [activeSession, viewingPatient, refreshData]);

  // Handle manual session termination
  const handleEndSession = async () => {
    if (!activeSession) return;
    if (window.confirm('Are you sure you want to end this clinical access session and lock the patient vault?')) {
      try {
        await endDoctorAccessSession(activeSession.sessionId);
      } catch (e) {
        console.warn(e);
      }
      setActiveSession(null);
      setViewingPatient(null);
      setPatientRecords([]);
      setSelectedRecord(null);
      refreshData();
    }
  };

  // Open Patient Record Page from Patients list or Recent Access table
  const handleViewPatient = async (patientEntry, originTab = 'dashboard') => {
    setPreviousTab(originTab);
    setLoadingRecords(true);

    const isPatientActive =
      patientEntry.status === 'Active' ||
      (activeSession && activeSession.sessionId === patientEntry.sessionId);

    if (isPatientActive) {
      try {
        const data = await getAuthorizedPatientData(patientEntry.sessionId);
        const sessionInfo = {
          sessionId: patientEntry.sessionId,
          displaySessionId: patientEntry.displaySessionId,
          patient: data.patient || patientEntry.patient || { name: patientEntry.name || patientEntry.patientName },
          expiresAt: data.expiresAt || new Date(Date.now() + 25 * 60 * 1000).toISOString(),
          isExpired: false,
        };
        setActiveSession(sessionInfo);
        setViewingPatient(sessionInfo);
        setPatientRecords(data.records || []);
      } catch (err) {
        console.warn('Authorized data fetch notice:', err.message);
        // If expired or error, show expired state
        const demo = DEMO_PATIENT_SESSIONS.find((d) => d.sessionId === patientEntry.sessionId);
        setViewingPatient({
          sessionId: patientEntry.sessionId,
          displaySessionId: patientEntry.displaySessionId,
          patient: demo?.patient || patientEntry.patient || { name: patientEntry.name || patientEntry.patientName },
          expiresAt: null,
          isExpired: true,
        });
        setPatientRecords([]);
      }
    } else {
      // Expired patient view: records remain inaccessible server-side & client-side
      const demo = DEMO_PATIENT_SESSIONS.find((d) => d.sessionId === patientEntry.sessionId);
      setViewingPatient({
        sessionId: patientEntry.sessionId,
        displaySessionId: patientEntry.displaySessionId,
        patient: demo?.patient || patientEntry.patient || { name: patientEntry.name || patientEntry.patientName },
        expiresAt: null,
        isExpired: true,
      });
      setPatientRecords([]);
    }

    setPatientSearchQuery('');
    setSelectedCategory('All');
    setLoadingRecords(false);
  };

  // Filter patient records in Patient Record view
  const filteredRecords = useMemo(() => {
    if (!patientRecords || patientRecords.length === 0) return [];
    const q = patientSearchQuery.toLowerCase().trim();

    return patientRecords.filter((rec) => {
      if (selectedCategory !== 'All' && rec.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;

      const titleMatch = (rec.title || '').toLowerCase().includes(q);
      const categoryMatch = (rec.category || '').toLowerCase().includes(q);
      const doctorMatch = (rec.doctor || '').toLowerCase().includes(q);
      const providerMatch = (rec.provider || '').toLowerCase().includes(q);
      const dateMatch = (rec.date || '').toLowerCase().includes(q);
      const notesMatch = (rec.notes || '').toLowerCase().includes(q);
      const tagsMatch = (rec.tags || []).some((t) => t.toLowerCase().includes(q));
      const fileMatch = (rec.fileName || '').toLowerCase().includes(q);

      const metricMatch = (rec.extractedMetrics || []).some((m) => {
        const nameMatch = (m.name || '').toLowerCase().includes(q);
        const valMatch = String(m.value || '').toLowerCase().includes(q);
        const unitMatch = (m.unit || '').toLowerCase().includes(q);
        return nameMatch || valMatch || unitMatch;
      });

      return (
        titleMatch ||
        categoryMatch ||
        doctorMatch ||
        providerMatch ||
        dateMatch ||
        notesMatch ||
        tagsMatch ||
        fileMatch ||
        metricMatch
      );
    });
  }, [patientRecords, patientSearchQuery, selectedCategory]);

  // Filter patients list in Patients Page
  const filteredPatients = useMemo(() => {
    const q = patientsSearch.toLowerCase().trim();
    if (!q) return doctorPatients;

    return doctorPatients.filter((p) => {
      const nameMatch = (p.name || '').toLowerCase().includes(q);
      const emailMatch = (p.email || '').toLowerCase().includes(q);
      const conditionMatch = (p.patient?.conditions || '').toLowerCase().includes(q);
      return nameMatch || emailMatch || conditionMatch;
    });
  }, [doctorPatients, patientsSearch]);

  // Filter access activity logs
  const filteredLogs = useMemo(() => {
    const q = activitySearch.toLowerCase().trim();

    return accessLogs.filter((log) => {
      if (activityStatusFilter !== 'All' && log.status !== activityStatusFilter) {
        return false;
      }
      if (!q) return true;

      const nameMatch = (log.patientName || '').toLowerCase().includes(q);
      const sessionMatch = (log.sessionId || '').toLowerCase().includes(q);
      const displayMatch = (log.displaySessionId || '').toLowerCase().includes(q);
      return nameMatch || sessionMatch || displayMatch;
    });
  }, [accessLogs, activitySearch, activityStatusFilter]);

  // Back button label
  const backLabel =
    previousTab === 'patients'
      ? 'Back to Patients'
      : previousTab === 'activity'
      ? 'Back to Access Activity'
      : 'Back to Doctor Dashboard';

  return (
    <div className="dashboard-content-area" style={{ maxWidth: '1240px', margin: '0 auto' }}>
      {/* ------------------------------------------------------------------ */}
      {/* DOCTOR PORTAL TOP SUB-NAVIGATION BAR                               */}
      {/* ------------------------------------------------------------------ */}
      {!viewingPatient && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid var(--color-border)',
            marginBottom: '2rem',
            paddingBottom: '0.25rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              style={{ padding: '0.55rem 1.1rem', fontSize: '0.9rem', gap: '0.45rem' }}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              className={`btn ${activeTab === 'patients' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              style={{ padding: '0.55rem 1.1rem', fontSize: '0.9rem', gap: '0.45rem' }}
              onClick={() => setActiveTab('patients')}
            >
              <Users size={16} />
              <span>Patients</span>
              {doctorPatients.length > 0 && (
                <span
                  style={{
                    backgroundColor: activeTab === 'patients' ? 'rgba(255,255,255,0.25)' : 'var(--color-mint-100)',
                    color: activeTab === 'patients' ? '#ffffff' : 'var(--color-primary)',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '10px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  {doctorPatients.length}
                </span>
              )}
            </button>

            <button
              type="button"
              className={`btn ${activeTab === 'activity' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              style={{ padding: '0.55rem 1.1rem', fontSize: '0.9rem', gap: '0.45rem' }}
              onClick={() => setActiveTab('activity')}
            >
              <History size={16} />
              <span>Access Activity</span>
            </button>

            <button
              type="button"
              className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              style={{ padding: '0.55rem 1.1rem', fontSize: '0.9rem', gap: '0.45rem' }}
              onClick={() => setActiveTab('profile')}
            >
              <User size={16} />
              <span>Doctor Profile</span>
            </button>
          </div>

          {onSwitchToPatientView && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onSwitchToPatientView}
              style={{ gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <User size={14} />
              <span>My Patient Vault</span>
            </button>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 1. PATIENT RECORD VIEW (When Viewing a Patient's Medical Vault)    */}
      {/* ------------------------------------------------------------------ */}
      {viewingPatient ? (
        <div>
          {/* Patient Profile Header with Live Expiry Timer & Back Link */}
          <PatientViewHeader
            patient={viewingPatient.patient}
            expiresAt={viewingPatient.expiresAt}
            isExpired={viewingPatient.isExpired}
            onExpire={handleSessionExpire}
            onEndSession={handleEndSession}
            onBack={() => setViewingPatient(null)}
            backLabel={backLabel}
            onReauthorize={() => {
              setScannerMode('camera');
              setScannerOpen(true);
            }}
            totalRecords={patientRecords.length}
          />

          {viewingPatient.isExpired ? (
            /* Expired Patient Locked State */
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1.5px dashed var(--color-border)',
                borderRadius: 'var(--radius-xl)',
                padding: '3.5rem 2rem',
                textAlign: 'center',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}
              >
                <Lock size={30} />
              </div>

              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                Access expired — new patient authorization required.
              </h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', maxWidth: '520px', margin: '0 auto 1.75rem', lineHeight: 1.5 }}>
                Medical records for <strong>{viewingPatient.patient?.name}</strong> are locked. To protect patient privacy, a new temporary QR code scan is required to open this patient's medical vault.
              </p>

              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', gap: '0.5rem' }}
                onClick={() => {
                  setScannerMode('camera');
                  setScannerOpen(true);
                }}
              >
                <Camera size={18} />
                <span>Scan New Patient QR</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            /* Active Patient Authorized Records View */
            <div>
              {/* Deterministic Search & Category Filter Bar */}
              <PatientRecordSearch
                searchQuery={patientSearchQuery}
                onSearchChange={setPatientSearchQuery}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                totalResults={filteredRecords.length}
                totalRecords={patientRecords.length}
              />

              {/* Medical Reports Clinical Grid */}
              {loadingRecords ? (
                <div
                  style={{
                    padding: '4rem 2rem',
                    textAlign: 'center',
                    backgroundColor: '#ffffff',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <FileText size={36} className="spin-animation" style={{ color: 'var(--color-primary)', margin: '0 auto 1rem' }} />
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--color-text-primary)' }}>
                    Loading Authorized Medical Vault...
                  </h3>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div
                  style={{
                    padding: '3.5rem 2rem',
                    textAlign: 'center',
                    backgroundColor: '#ffffff',
                    border: '1px dashed var(--color-border)',
                    borderRadius: 'var(--radius-xl)',
                  }}
                >
                  <FileText size={40} style={{ color: 'var(--color-text-muted)', margin: '0 auto 1rem' }} />
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
                    {patientSearchQuery || selectedCategory !== 'All'
                      ? 'No matching clinical records found'
                      : 'No medical documents found in patient vault'}
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', maxWidth: '420px', margin: '0 auto' }}>
                    {patientSearchQuery || selectedCategory !== 'All'
                      ? 'Try adjusting your search terms or selecting "All" categories to view the full clinical record.'
                      : 'The patient has not yet archived any diagnostic reports in their private vault.'}
                  </p>
                  {(patientSearchQuery || selectedCategory !== 'All') && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: '1.25rem' }}
                      onClick={() => {
                        setPatientSearchQuery('');
                        setSelectedCategory('All');
                      }}
                    >
                      Clear Search Filters
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                      MEDICAL REPORTS ({filteredRecords.length})
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      Authorized Patient Documents
                    </span>
                  </div>

                  <div className="records-grid">
                    {filteredRecords.map((rec) => (
                      <DoctorRecordCard
                        key={rec.id}
                        record={rec}
                        onSelectRecord={setSelectedRecord}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : activeTab === 'dashboard' ? (
        /* ------------------------------------------------------------------ */
        /* 2. DOCTOR DASHBOARD TAB                                            */
        /* ------------------------------------------------------------------ */
        <div>
          {/* Header Banner */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.75rem 2rem',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.5rem',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 16,
                  backgroundColor: 'var(--color-mint-50)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--color-mint-200)',
                }}
              >
                <Stethoscope size={30} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                    DOCTOR DASHBOARD
                  </h1>
                  <span className="badge badge-emerald" style={{ gap: '0.35rem' }}>
                    <ShieldCheck size={13} />
                    <span>Verified Physician</span>
                  </span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem', margin: 0 }}>
                  {user?.name || 'Dr. Healthcare Provider'} &bull; {user?.specialty || 'General Practitioner'} &bull; {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Primary & Secondary Action Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            {/* Primary Action: SCAN PATIENT QR */}
            <div
              className="vital-card"
              style={{
                backgroundColor: 'var(--color-mint-50)',
                border: '1.5px solid var(--color-mint-300)',
                borderRadius: 'var(--radius-xl)',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 12,
                    backgroundColor: 'var(--color-primary)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                  }}
                >
                  <Camera size={24} />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: '0.35rem' }}>
                  SCAN PATIENT QR
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                  Use device camera to instantly scan the patient's temporary QR token for clinical review.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem', gap: '0.5rem' }}
                onClick={() => {
                  setScannerMode('camera');
                  setScannerOpen(true);
                }}
              >
                <Camera size={17} />
                <span>Scan Patient QR</span>
                <ArrowRight size={15} />
              </button>
            </div>

            {/* Secondary Action: UPLOAD QR FILE */}
            <div
              className="vital-card"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-xl)',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 12,
                    backgroundColor: 'var(--color-bg-subtle)',
                    color: 'var(--color-text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <UploadCloud size={24} />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
                  UPLOAD QR FILE
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                  Import a saved QR code image file (PNG, JPG, WebP) or enter an access token manually.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem', gap: '0.5rem' }}
                onClick={() => {
                  setScannerMode('upload');
                  setScannerOpen(true);
                }}
              >
                <UploadCloud size={17} />
                <span>Upload QR File</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>

          {/* Simple Statistics Cards */}
          <div className="stats-grid" style={{ marginBottom: '2rem' }}>
            <MetricCard
              label="QR SCANS"
              value={stats.totalScans}
              subtext="Total authorized scan sessions"
              icon={QrCode}
            />
            <MetricCard
              label="PATIENTS ACCESSED"
              value={stats.uniquePatients}
              subtext="Unique patient connections"
              icon={Users}
            />
          </div>

          {/* Quick Demo Test Simulator */}
          <div
            style={{
              padding: '1.15rem 1.5rem',
              backgroundColor: '#ffffff',
              border: '1px dashed var(--color-mint-300)',
              borderRadius: 'var(--radius-xl)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: 'var(--color-mint-100)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '0.925rem', color: 'var(--color-text-primary)', display: 'block' }}>
                  Demo Patient QR Simulator
                </strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  Test complete QR Scan &rarr; Instant Patient PDF Vault flow with sample patients
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setScannerMode('test');
                setScannerOpen(true);
              }}
              style={{ gap: '0.4rem' }}
            >
              <Sparkles size={14} />
              <span>Open Demo QR Library</span>
            </button>
          </div>

          {/* RECENT ACCESS ACTIVITY Section */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <History size={18} className="text-emerald" />
                RECENT ACCESS ACTIVITY
              </h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveTab('activity')}
                style={{ fontSize: '0.8rem' }}
              >
                View Full Activity Log &rarr;
              </button>
            </div>

            {accessLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border)' }}>
                <QrCode size={38} style={{ color: 'var(--color-primary)', margin: '0 auto 0.75rem' }} />
                <h4 style={{ color: 'var(--color-text-primary)', marginBottom: '0.35rem', fontSize: '1.1rem', fontWeight: 700 }}>
                  No Scanned Patient Access Yet
                </h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', maxWidth: '420px', margin: '0 auto 1.25rem' }}>
                  Only patients whose QR tokens have been scanned and verified will appear in your activity log.
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setScannerMode('camera');
                    setScannerOpen(true);
                  }}
                  style={{ gap: '0.4rem' }}
                >
                  <Camera size={15} />
                  <span>Scan Patient QR Now</span>
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Patient</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Session ID</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Duration</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Status</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--color-text-secondary)', textAlign: 'right' }}>View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accessLogs.slice(0, 5).map((log) => {
                      const isRowActive = log.status === 'Active';
                      return (
                        <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                            {log.patientName}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: 'var(--color-text-muted)', fontSize: '0.825rem' }}>
                            {log.displaySessionId || `#${(log.sessionId || '').substring(0, 6).toUpperCase()}`}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--color-text-secondary)' }}>
                            {log.durationMinutes} min
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span
                              className="badge"
                              style={{
                                backgroundColor: isRowActive ? 'var(--color-mint-100)' : '#f1f5f9',
                                color: isRowActive ? 'var(--color-primary-dark)' : '#64748b',
                                border: `1px solid ${isRowActive ? 'var(--color-mint-300)' : '#cbd5e1'}`,
                                fontWeight: 700,
                                fontSize: '0.75rem',
                              }}
                            >
                              {log.status || 'Expired'}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', gap: '0.35rem' }}
                              onClick={() => handleViewPatient(log, 'dashboard')}
                            >
                              <span>View</span>
                              <ArrowRight size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'patients' ? (
        /* ------------------------------------------------------------------ */
        /* 3. DEDICATED PATIENTS PAGE                                         */
        /* ------------------------------------------------------------------ */
        <div>
          {/* Header & Search Bar */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.75rem',
              marginBottom: '1.5rem',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                  PATIENTS
                </h1>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem', margin: 0 }}>
                  Directory of previously accessed patient records and authorization statuses
                </p>
              </div>

              <span className="badge badge-mint" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                {filteredPatients.length} Patients Listed
              </span>
            </div>

            {/* Search Patients Input */}
            <div className="search-bar" style={{ maxWidth: '100%' }}>
              <Search className="search-icon" size={18} />
              <input
                type="text"
                className="search-input"
                placeholder="🔍 Search patients by name, email, or health conditions..."
                value={patientsSearch}
                onChange={(e) => setPatientsSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Patients Table */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            {filteredPatients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border)' }}>
                <Users size={38} style={{ color: 'var(--color-primary)', margin: '0 auto 0.75rem' }} />
                <h4 style={{ color: 'var(--color-text-primary)', marginBottom: '0.35rem', fontSize: '1.1rem', fontWeight: 700 }}>
                  {patientsSearch ? 'No matching patients found' : 'No Scanned Patients Yet'}
                </h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
                  {patientsSearch
                    ? 'Try adjusting your search query.'
                    : 'Only patients whose QR tokens have been scanned and authorized will appear here. No dummy data.'}
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setScannerMode('camera');
                    setScannerOpen(true);
                  }}
                  style={{ gap: '0.4rem' }}
                >
                  <Camera size={15} />
                  <span>Scan Patient QR</span>
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Patient Name</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Last Accessed</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Status</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--color-text-secondary)', textAlign: 'right' }}>View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map((patient) => {
                      const isActive = patient.status === 'Active';
                      return (
                        <tr key={patient.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 'var(--radius-full)',
                                  backgroundColor: isActive ? 'var(--color-mint-100)' : '#f1f5f9',
                                  color: isActive ? 'var(--color-primary)' : '#64748b',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: '0.85rem',
                                }}
                              >
                                {patient.avatar || patient.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <strong style={{ color: 'var(--color-text-primary)', display: 'block' }}>
                                  {patient.name}
                                </strong>
                                {patient.email && (
                                  <span style={{ fontSize: '0.775rem', color: 'var(--color-text-muted)' }}>
                                    {patient.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--color-text-secondary)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Calendar size={13} className="text-emerald" />
                              {patient.lastAccessedDate}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span
                              className="badge"
                              style={{
                                backgroundColor: isActive ? 'var(--color-mint-100)' : '#f1f5f9',
                                color: isActive ? 'var(--color-primary-dark)' : '#64748b',
                                border: `1px solid ${isActive ? 'var(--color-mint-300)' : '#cbd5e1'}`,
                                fontWeight: 700,
                                fontSize: '0.75rem',
                              }}
                            >
                              {patient.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.4rem 0.95rem', fontSize: '0.825rem', gap: '0.35rem' }}
                              onClick={() => handleViewPatient(patient, 'patients')}
                            >
                              <span>View</span>
                              <ArrowRight size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'activity' ? (
        /* ------------------------------------------------------------------ */
        /* 4. DEDICATED ACCESS ACTIVITY PAGE                                  */
        /* ------------------------------------------------------------------ */
        <div>
          {/* Header & Filters */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.75rem',
              marginBottom: '1.5rem',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                  ACCESS ACTIVITY
                </h1>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem', margin: 0 }}>
                  Complete audit log of authorized patient QR sessions and clinical reviews
                </p>
              </div>

              {/* Status Filter Chips */}
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {['All', 'Active', 'Expired'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={`btn ${activityStatusFilter === st ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
                    onClick={() => setActivityStatusFilter(st)}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Activity Input */}
            <div className="search-bar" style={{ maxWidth: '100%' }}>
              <Search className="search-icon" size={18} />
              <input
                type="text"
                className="search-input"
                placeholder="🔍 Search access activity by patient name or session ID..."
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
              />
            </div>
          </div>

          {/* Activity Table */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            {filteredLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border)' }}>
                <History size={38} style={{ color: 'var(--color-primary)', margin: '0 auto 0.75rem' }} />
                <h4 style={{ color: 'var(--color-text-primary)', marginBottom: '0.35rem', fontSize: '1.1rem', fontWeight: 700 }}>
                  {activitySearch ? 'No matching activity records found' : 'No Access Logs Yet'}
                </h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
                  {activitySearch
                    ? 'Try adjusting your search filter.'
                    : 'Authorized patient access records will be logged here automatically once you scan a patient QR token.'}
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setScannerMode('camera');
                    setScannerOpen(true);
                  }}
                  style={{ gap: '0.4rem' }}
                >
                  <Camera size={15} />
                  <span>Scan Patient QR</span>
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Patient</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Session ID</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Duration</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Timestamp</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Status</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--color-text-secondary)', textAlign: 'right' }}>View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => {
                      const isActive = log.status === 'Active';
                      return (
                        <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                            {log.patientName}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: 'var(--color-text-muted)', fontSize: '0.825rem' }}>
                            {log.displaySessionId || `#${(log.sessionId || '').substring(0, 6).toUpperCase()}`}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--color-text-secondary)' }}>
                            {log.durationMinutes} min
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span
                              className="badge"
                              style={{
                                backgroundColor: isActive ? 'var(--color-mint-100)' : '#f1f5f9',
                                color: isActive ? 'var(--color-primary-dark)' : '#64748b',
                                border: `1px solid ${isActive ? 'var(--color-mint-300)' : '#cbd5e1'}`,
                                fontWeight: 700,
                                fontSize: '0.75rem',
                              }}
                            >
                              {log.status || 'Expired'}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', gap: '0.35rem' }}
                              onClick={() => handleViewPatient(log, 'activity')}
                            >
                              <span>View</span>
                              <ArrowRight size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ------------------------------------------------------------------ */
        /* 5. DOCTOR PROFILE TAB                                              */
        /* ------------------------------------------------------------------ */
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '2.5rem',
            boxShadow: 'var(--shadow-card)',
            maxWidth: '800px',
            margin: '0 auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-mint-100)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.75rem',
                border: '3px solid var(--color-mint-300)',
              }}
            >
              {user?.avatar || (user?.name ? user.name.substring(0, 2).toUpperCase() : 'DR')}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                  {user?.name || 'Dr. Healthcare Provider'}
                </h2>
                <span className="badge badge-emerald">
                  <ShieldCheck size={13} />
                  <span>Licensed Medical Practitioner</span>
                </span>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem', margin: 0 }}>
                {user?.specialty || 'General Practitioner'} &bull; {user?.email}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            <div style={{ padding: '1.25rem', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-light)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Medical License ID</span>
              <strong style={{ fontSize: '1rem', color: 'var(--color-text-primary)' }}>NMC-2026-89410</strong>
            </div>
            <div style={{ padding: '1.25rem', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-light)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Total Patients Consulted</span>
              <strong style={{ fontSize: '1rem', color: 'var(--color-primary)' }}>{doctorPatients.length} Active Records</strong>
            </div>
            <div style={{ padding: '1.25rem', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-light)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Verification Standard</span>
              <strong style={{ fontSize: '1rem', color: 'var(--color-text-primary)' }}>HIPAA / GDPR Ready</strong>
            </div>
          </div>

          <div style={{ padding: '1.25rem', backgroundColor: 'var(--color-mint-50)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-mint-200)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: '0.35rem' }}>
              Zero Data Duplication & Decentralized Privacy
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
              All medical PDFs remain strictly stored in the patient's private encrypted vault. Your clinical view is granted through cryptographic temporary access tokens and revoked automatically upon expiration.
            </p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODALS                                                             */}
      {/* ------------------------------------------------------------------ */}

      {/* 1. QR Scanner / Uploader Modal */}
      {scannerOpen && (
        <QRScannerModal
          initialMode={scannerMode}
          onClose={() => setScannerOpen(false)}
          onQRDecoded={handleQRDecoded}
        />
      )}

      {/* 3. Read-Only Record Detail / PDF Modal */}
      {selectedRecord && (
        <RecordDetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          isReadOnly={true}
        />
      )}

      {/* 4. Session Expired Lockout Modal */}
      {expiredModalOpen && (
        <SessionExpiredModal
          patientName={expiredPatientName}
          onReturnToDashboard={() => {
            setExpiredModalOpen(false);
            setViewingPatient(null);
          }}
        />
      )}
    </div>
  );
}
