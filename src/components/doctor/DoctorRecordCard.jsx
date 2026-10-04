import React from 'react';
import {
  FileText,
  Calendar,
  Building2,
  UserCheck,
  ArrowRight,
} from 'lucide-react';

export default function DoctorRecordCard({ record, onSelectRecord }) {
  const getCategoryColor = (category) => {
    switch (category) {
      case 'Lab Results':
        return 'badge-mint';
      case 'Cardiology':
        return 'badge-emerald';
      case 'Imaging':
        return 'badge-mint';
      case "Doctor's Note":
        return 'badge-gray';
      case 'Prescription':
        return 'badge-mint';
      default:
        return 'badge-gray';
    }
  };

  const metrics = Array.isArray(record.extractedMetrics) ? record.extractedMetrics : [];
  const previewMetrics = metrics.slice(0, 3);
  const remainingMetricsCount = Math.max(0, metrics.length - 3);

  const formattedDate = record.date
    ? new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '04 Oct 2026';

  return (
    <div
      className="vital-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-card)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      <div>
        {/* Top Header: Category & Date */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.85rem',
          }}
        >
          <span className={`badge ${getCategoryColor(record.category)}`}>
            {record.category || 'Medical Report'}
          </span>

          <span
            style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontWeight: 500,
            }}
          >
            <Calendar size={13} className="text-emerald" />
            {formattedDate}
          </span>
        </div>

        {/* Record Title */}
        <h3
          style={{
            fontSize: '1.2rem',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            marginBottom: '0.5rem',
            lineHeight: 1.35,
          }}
        >
          {record.title}
        </h3>

        {/* Provider & Attending Doctor Info */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            marginBottom: '0.85rem',
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)',
          }}
        >
          {record.provider && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Building2 size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {record.provider}
              </span>
            </div>
          )}
          {record.doctor && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <UserCheck size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {record.doctor}
              </span>
            </div>
          )}
        </div>

        {/* Clinical Notes / Findings Snippet */}
        {record.notes && (
          <p
            style={{
              fontSize: '0.825rem',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.5,
              marginBottom: '1rem',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              backgroundColor: 'var(--color-bg-subtle)',
              padding: '0.55rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-light)',
            }}
          >
            {record.notes}
          </p>
        )}

        {/* Extracted Biomarker / Lab Measurement Badges */}
        {previewMetrics.length > 0 && (
          <div style={{ marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              Key Measurements:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {previewMetrics.map((m, idx) => (
                <span
                  key={idx}
                  className="badge"
                  style={{
                    backgroundColor: m.status === 'high' ? '#fee2e2' : m.status === 'low' ? '#e0f2fe' : 'var(--color-mint-50)',
                    color: m.status === 'high' ? '#b91c1c' : m.status === 'low' ? '#0369a1' : 'var(--color-primary-dark)',
                    border: `1px solid ${m.status === 'high' ? '#fecaca' : m.status === 'low' ? '#bae6fd' : 'var(--color-mint-200)'}`,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  {m.name}: {m.value} {m.unit}
                </span>
              ))}
              {remainingMetricsCount > 0 && (
                <span className="badge badge-gray" style={{ fontSize: '0.725rem' }}>
                  +{remainingMetricsCount} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Card Action Button: View PDF */}
      <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '1rem', marginTop: 'auto' }}>
        <button
          type="button"
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.65rem 1rem', fontSize: '0.9rem', justifyContent: 'center', gap: '0.5rem' }}
          onClick={() => onSelectRecord(record)}
        >
          <FileText size={16} />
          <span>View PDF</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
