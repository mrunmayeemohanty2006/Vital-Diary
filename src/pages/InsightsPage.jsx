import React, { useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Calendar,
  Building2,
  Download,
  Eye,
  ShieldCheck,
  TrendingUp,
  UploadCloud,
} from 'lucide-react';
import { useRecords } from '../context/RecordsContext';
import { useAuth } from '../context/AuthContext';
import { analyzeReportInsights } from '../lib/report-insights-analyzer';
import { exportReportInsightsPdf } from '../lib/export-insights-pdf';
import RecordDetailModal from '../components/common/RecordDetailModal';

export default function InsightsPage({ onNavigateTab }) {
  const { records } = useRecords();
  const { user } = useAuth();
  const [selectedRecord, setSelectedRecord] = useState(null);

  const getCategoryBadgeClass = (cat) => {
    switch (cat) {
      case 'Lab Results':
        return 'badge-mint';
      case 'Imaging':
        return 'badge-emerald';
      case 'Cardiology':
        return 'badge-mint';
      case 'Vaccination':
        return 'badge-mint';
      default:
        return 'badge-gray';
    }
  };

  const handleExportPdf = (record, e) => {
    if (e) e.stopPropagation();
    const analysis = analyzeReportInsights(record);
    if (analysis) {
      exportReportInsightsPdf(analysis, user);
    }
  };

  const handleViewRecord = (record, e) => {
    if (e) e.stopPropagation();
    setSelectedRecord(record);
  };

  return (
    <div className="insights-page-container">
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
          Get Insight
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)' }}>
          Recent clinical lab reports, consultations, and diagnostic imaging
        </p>
      </div>

      {records.length === 0 ? (
        /* Empty State */
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px dashed var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '3.5rem 2rem',
            textAlign: 'center',
            marginBottom: '2rem',
          }}
        >
          <TrendingUp size={44} style={{ color: 'var(--color-text-muted)', margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
            No Medical Reports Uploaded Yet
          </h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
            Upload medical reports or blood tests to generate evidence-based doctor summaries and clinical insights.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => onNavigateTab && onNavigateTab('upload')}
          >
            <UploadCloud size={16} />
            <span>Upload Medical Report</span>
          </button>
        </div>
      ) : (
        /* Vertical Stacked Cards (One Above Another) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '820px' }}>
          {records.map((record) => {
            const isImage = record.fileType === 'image';
            return (
              <div
                key={record.id}
                className="record-card"
                onClick={() => handleViewRecord(record)}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.35rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-xs)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div>
                  {/* Top: File Icon Left, Category Badge Right */}
                  <div className="record-card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                    <div className="record-file-icon">
                      {isImage ? (
                        <ImageIcon size={20} strokeWidth={2} />
                      ) : (
                        <FileText size={20} strokeWidth={2} />
                      )}
                    </div>
                    <span className={`badge ${getCategoryBadgeClass(record.category)}`}>
                      {record.category || 'General'}
                    </span>
                  </div>

                  {/* Body: Title, Meta Row, Tags */}
                  <div className="record-card-body">
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                      {record.title || record.fileName}
                    </h4>

                    <div className="record-meta-row" style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                      <span className="record-meta-item" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={14} className="text-emerald" />
                        <span>{record.date || 'Undated'}</span>
                      </span>
                      {(record.provider || record.doctor) && (
                        <span className="record-meta-item" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Building2 size={14} className="text-emerald" />
                          <span>{record.provider || record.doctor}</span>
                        </span>
                      )}
                    </div>

                    {record.tags && record.tags.length > 0 && (
                      <div className="record-tags-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.1rem' }}>
                        {record.tags.map((tag, idx) => (
                          <span key={idx} className="record-tag-pill">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div
                  className="record-card-actions"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '0.85rem',
                    borderTop: '1px solid var(--color-border-light)',
                    fontSize: '0.8125rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary-dark)', fontWeight: 600 }}>
                    <ShieldCheck size={15} className="text-emerald" />
                    <span>{record.doctor || record.provider || 'Verified Record'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      onClick={(e) => handleExportPdf(record, e)}
                      title="Export clinical findings and insights PDF"
                    >
                      <Download size={13} />
                      <span>Export PDF</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      onClick={(e) => handleViewRecord(record, e)}
                      title="View report details"
                    >
                      <Eye size={13} />
                      <span>View</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Record Inspection Modal */}
      {selectedRecord && (
        <RecordDetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
}
