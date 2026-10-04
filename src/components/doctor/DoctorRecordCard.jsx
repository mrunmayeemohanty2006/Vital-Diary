import React from 'react';
import {
  FileText,
  Calendar,
  Building2,
  UserCheck,
  ArrowRight,
  Activity,
  Eye,
} from 'lucide-react';
import {
  highlightMatch,
  getRecordSearchInsights,
} from '../../lib/record-search';

export default function DoctorRecordCard({ record, onSelectRecord, searchQuery = '' }) {
  const isSearching = Boolean(searchQuery && searchQuery.trim());
  const insights = getRecordSearchInsights(record, searchQuery);

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

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('high') || s.includes('critical') || s.includes('abnormal')) {
      return (
        <span
          className="badge"
          style={{
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            border: '1px solid #fecaca',
            fontSize: '0.725rem',
            padding: '0.15rem 0.45rem',
            fontWeight: 700,
          }}
        >
          High / Abnormal
        </span>
      );
    }
    if (s.includes('low')) {
      return (
        <span
          className="badge"
          style={{
            backgroundColor: '#fef3c7',
            color: '#b45309',
            border: '1px solid #fde68a',
            fontSize: '0.725rem',
            padding: '0.15rem 0.45rem',
            fontWeight: 700,
          }}
        >
          Low
        </span>
      );
    }
    return (
      <span
        className="badge"
        style={{
          backgroundColor: '#ecfdf5',
          color: '#047857',
          border: '1px solid #a7f3d0',
          fontSize: '0.725rem',
          padding: '0.15rem 0.45rem',
          fontWeight: 700,
        }}
      >
        Normal
      </span>
    );
  };

  const metrics = Array.isArray(record.extractedMetrics) ? record.extractedMetrics : [];
  const previewMetrics = metrics.slice(0, 3);
  const remainingMetricsCount = Math.max(0, metrics.length - 3);

  const formattedDate = record.date
    ? new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Undated';

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
        cursor: 'pointer',
      }}
      onClick={() => onSelectRecord(record)}
    >
      <div>
        {/* Top Header: Category, Match Reason Badge, Date */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span className={`badge ${getCategoryColor(record.category)}`}>
              {highlightMatch(record.category || 'Medical Report', searchQuery)}
            </span>

            {/* Match Reason Badge when searching */}
            {isSearching && insights.matchedFields.length > 0 && (
              <span className="search-match-badge">
                <Activity size={12} />
                <span>
                  {insights.matchedFields.includes('biomarker')
                    ? 'Biomarker Match'
                    : insights.matchedFields.includes('notes')
                    ? 'Report Content Match'
                    : insights.matchedFields.includes('title')
                    ? 'Title Match'
                    : insights.matchedFields.includes('doctor') || insights.matchedFields.includes('provider')
                    ? 'Provider Match'
                    : 'Matched'}
                </span>
              </span>
            )}
          </div>

          <span
            style={{
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontWeight: 600,
            }}
          >
            <Calendar size={13} className="text-emerald" />
            {formattedDate}
          </span>
        </div>

        {/* Record Title */}
        <h3
          style={{
            fontSize: '1.15rem',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            marginBottom: '0.5rem',
            lineHeight: 1.35,
          }}
        >
          {highlightMatch(record.title || 'Untitled Medical Report', searchQuery)}
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
                {highlightMatch(record.provider, searchQuery)}
              </span>
            </div>
          )}
          {record.doctor && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <UserCheck size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {highlightMatch(record.doctor, searchQuery)}
              </span>
            </div>
          )}
        </div>

        {/* Matched Biomarker Box (if searching and a biomarker matched) */}
        {isSearching && insights.matchedMetrics && insights.matchedMetrics.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.85rem' }}>
            {insights.matchedMetrics.slice(0, 2).map((m, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.55rem 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#065f46' }}>
                    {highlightMatch(m.name || m.rawName || 'Biomarker', searchQuery)}:{' '}
                  </span>
                  <strong style={{ fontSize: '0.9375rem', color: '#047857' }}>
                    {highlightMatch(m.displayValue || `${m.value} ${m.unit || ''}`.trim(), searchQuery)}
                  </strong>
                  {m.referenceRange?.rawText && (
                    <span style={{ fontSize: '0.7rem', color: '#065f46', marginLeft: '0.4rem' }}>
                      (Ref: {m.referenceRange.rawText})
                    </span>
                  )}
                </div>
                {getStatusBadge(m.status)}
              </div>
            ))}
          </div>
        )}

        {/* Clinical Notes / Findings Snippet */}
        {record.notes && (
          <p
            style={{
              fontSize: '0.825rem',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.5,
              marginBottom: '1rem',
              display: '-webkit-box',
              WebkitLineClamp: isSearching ? 3 : 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              backgroundColor: 'var(--color-bg-subtle)',
              padding: '0.55rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-light)',
            }}
          >
            {highlightMatch(
              isSearching && insights.matchedSnippet ? insights.matchedSnippet : record.notes,
              searchQuery
            )}
          </p>
        )}

        {/* Default Extracted Biomarker / Lab Measurement Badges (when not searching or no specific metric matched) */}
        {(!isSearching || insights.matchedMetrics.length === 0) && previewMetrics.length > 0 && (
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
                  {highlightMatch(`${m.name}: ${m.value} ${m.unit || ''}`.trim(), searchQuery)}
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

      {/* Card Action Button: Open Report / View PDF */}
      <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '0.85rem', marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          <FileText size={14} className="text-emerald" />
          <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {highlightMatch(record.fileName || 'medical_report.pdf', searchQuery)}
          </span>
          {record.fileSize && (
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>({record.fileSize})</span>
          )}
        </div>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', gap: '0.35rem' }}
          onClick={(e) => {
            e.stopPropagation();
            onSelectRecord(record);
          }}
        >
          <Eye size={14} />
          <span>Open Report</span>
        </button>
      </div>
    </div>
  );
}
