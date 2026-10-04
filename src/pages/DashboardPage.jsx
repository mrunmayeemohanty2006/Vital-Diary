import React, { useState } from 'react';
import {
  FileText,
  ChevronRight,
  UploadCloud,
  QrCode,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRecords } from '../context/RecordsContext';
import HealthTrendChart from '../components/common/HealthTrendChart';
import RecordCard from '../components/common/RecordCard';
import RecordDetailModal from '../components/common/RecordDetailModal';
import { getPatientActiveSession } from '../lib/access-session';

export default function DashboardPage({ onNavigateTab }) {
  const { user } = useAuth();
  const { records } = useRecords();
  const [selectedRecord, setSelectedRecord] = useState(null);
  const activeSession = getPatientActiveSession(user?.id);

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
      {/* Personalized Greeting Header */}
      <div className="greeting-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
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

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => onNavigateTab('qr')}
          style={{ gap: '0.45rem', padding: '0.6rem 1.15rem', boxShadow: '0 2px 8px rgba(4, 120, 87, 0.25)' }}
        >
          <QrCode size={16} />
          <span>{activeSession?.status === 'active' ? 'Active Doctor Access' : activeSession ? 'View QR Session' : 'Generate QR Access'}</span>
        </button>
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
