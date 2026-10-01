import React, { useState } from 'react';
import {
  ShieldCheck,
  UploadCloud,
  Search,
  FileText,
  Activity,
  ChevronRight,
  Database,
  Building2,
  HeartPulse,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRecords } from '../context/RecordsContext';
import MetricCard from '../components/common/MetricCard';
import HealthTrendChart from '../components/common/HealthTrendChart';
import RecordCard from '../components/common/RecordCard';
import RecordDetailModal from '../components/common/RecordDetailModal';

export default function DashboardPage({ onNavigateTab }) {
  const { user } = useAuth();
  const { records, stats, vitals } = useRecords();
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Dynamic greeting based on current time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Recent 3 records
  const recentRecords = records.slice(0, 3);

  return (
    <div className="dashboard-content-area">
      {/* Large Personalized Greeting */}
      <div className="greeting-section">
        <div>
          <h1 className="greeting-title">
            {getGreeting()}, {user?.name || 'User'}
          </h1>
          <p className="greeting-subtitle">
            {records.length > 0
              ? `You have ${records.length} medical record${records.length === 1 ? '' : 's'} stored securely in your vault.`
              : 'Welcome to your private health diary. Keep your medical files secure and organized in one place.'}
          </p>
        </div>

        <div className="greeting-actions">
          <button
            className="btn btn-primary"
            onClick={() => onNavigateTab('upload')}
          >
            <UploadCloud size={17} />
            <span>Upload New Record</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => onNavigateTab('search')}
          >
            <Search size={16} />
            <span>Search Vault</span>
          </button>
        </div>
      </div>

      {/* Health-related Message / Status Banner */}
      <div className="health-message-banner">
        <div className="health-message-content">
          <div className="health-message-icon">
            <HeartPulse size={20} />
          </div>
          <div className="health-message-text">
            {records.length > 0 ? (
              <span>
                <strong>Vault Status:</strong> All {records.length} cataloged record{records.length === 1 ? ' is' : 's are'} encrypted and indexed for instant retrieval.
              </span>
            ) : (
              <span>
                <strong>Vault Ready:</strong> Start building your lifelong health archive by uploading your diagnostic reports, prescriptions, or doctor notes.
              </span>
            )}
          </div>
        </div>

        <button
          className="btn btn-outline btn-sm"
          style={{ whiteSpace: 'nowrap', backgroundColor: '#ffffff' }}
          onClick={() => onNavigateTab(records.length > 0 ? 'insights' : 'upload')}
        >
          <span>{records.length > 0 ? 'View Insights' : 'Upload First File'}</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Quick Metrics / Stats Grid */}
      <div className="stats-grid">
        <MetricCard
          label="Total Medical Files"
          value={stats.totalRecords}
          subtext="Stored in encrypted vault"
          icon={FileText}
        />
        <MetricCard
          label="Biomarker Logs"
          value={vitals.length > 0 ? `${vitals.length} Logs` : '0 Logs'}
          subtext="Vitals & lab markers"
          icon={Activity}
        />
        <MetricCard
          label="Care Providers"
          value={stats.providersCount}
          subtext="Documented clinics & labs"
          icon={Building2}
        />
        <MetricCard
          label="Vault Storage"
          value={stats.storageUsedMB}
          subtext="Cloud & Local Storage"
          icon={Database}
        />
      </div>

      {/* Large Health Trend Graph Across Main Screen */}
      <HealthTrendChart onUploadClick={() => onNavigateTab('upload')} />

      {/* Recently Added Medical Records */}
      <div style={{ marginTop: '2.5rem' }}>
        <div className="records-section-header">
          <div>
            <h3>Recently Added Records</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Recent clinical lab reports, consultations, and diagnostic imaging
            </p>
          </div>

          {records.length > 0 && (
            <button
              className="btn btn-outline btn-sm"
              onClick={() => onNavigateTab('search')}
            >
              <span>View All ({records.length})</span>
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        {recentRecords.length === 0 ? (
          <div
            style={{
              padding: '3rem 2rem',
              textAlign: 'center',
              backgroundColor: '#ffffff',
              border: '1px dashed var(--color-border)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <FileText size={36} style={{ color: 'var(--color-text-muted)', margin: '0 auto 1rem' }} />
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No records uploaded yet</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
              Upload your first lab test, doctor prescription, or medical summary to get started.
            </p>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onNavigateTab('upload')}
            >
              <UploadCloud size={15} />
              <span>Upload Record Now</span>
            </button>
          </div>
        ) : (
          <div className="records-grid">
            {recentRecords.map((rec) => (
              <RecordCard
                key={rec.id}
                record={rec}
                onSelectRecord={setSelectedRecord}
              />
            ))}
          </div>
        )}
      </div>

      {/* Record Inspection Modal */}
      <RecordDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
}
