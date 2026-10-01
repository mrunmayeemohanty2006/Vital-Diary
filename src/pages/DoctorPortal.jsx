import React, { useState } from 'react';
import {
  Stethoscope,
  User,
  ShieldCheck,
  FileText,
  Calendar,
  Building2,
  Search,
  CheckCircle2,
  UploadCloud,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRecords } from '../context/RecordsContext';
import RecordCard from '../components/common/RecordCard';
import RecordDetailModal from '../components/common/RecordDetailModal';
import MetricCard from '../components/common/MetricCard';

export default function DoctorPortal({ onSwitchToPatientView }) {
  const { user } = useAuth();
  const { records, stats } = useRecords();
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const patientRecords = records.filter(
    (r) =>
      (r.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.doctor || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-content-area" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Doctor Header Banner */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: 56,
              height: 56,
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                {user?.name || 'Healthcare Provider'}
              </h1>
              <span className="badge badge-emerald">Verified Physician</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
              Signed in as: {user?.email} &bull; Member since: {user?.memberSince || 'Active'}
            </p>
          </div>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={onSwitchToPatientView}
        >
          <User size={15} />
          <span>Patient Portal View</span>
        </button>
      </div>

      {/* Doctor Stats Grid */}
      <div className="stats-grid">
        <MetricCard
          label="Accessible Records"
          value={records.length}
          subtext="Available for clinical review"
          icon={FileText}
        />
        <MetricCard
          label="Categories"
          value={stats.categoriesCount}
          subtext="Documented domains"
          icon={CheckCircle2}
        />
        <MetricCard
          label="Care Facilities"
          value={stats.providersCount}
          subtext="Documented clinics & labs"
          icon={Building2}
        />
      </div>

      {/* Patient Records Filter & Grid */}
      <div style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>
              Patient Diagnostic & Clinical Records
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Review diagnostic imaging scans, biochemical lab panels, and clinical progress notes
            </p>
          </div>

          {records.length > 0 && (
            <div style={{ width: '280px' }}>
              <input
                type="text"
                placeholder="Filter records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.85rem' }}
              />
            </div>
          )}
        </div>

        {patientRecords.length === 0 ? (
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
              No medical records available for review
            </h3>
            <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)', maxWidth: '440px', margin: '0 auto' }}>
              When patients upload medical records or grant access, their clinical test histories will appear here.
            </p>
          </div>
        ) : (
          <div className="records-grid">
            {patientRecords.map((rec) => (
              <RecordCard
                key={rec.id}
                record={rec}
                onSelectRecord={setSelectedRecord}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <RecordDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
}
