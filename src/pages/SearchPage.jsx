import React, { useState, useMemo } from 'react';
import {
  Search as SearchIcon,
  X,
  FileText,
  Calendar,
  Building2,
  Activity,
  Eye,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRecords } from '../context/RecordsContext';
import RecordDetailModal from '../components/common/RecordDetailModal';
import {
  highlightMatch,
  getRecordSearchInsights,
  filterMedicalRecords,
} from '../lib/record-search';

export default function SearchPage() {
  const { user } = useAuth();
  const { records } = useRecords();
  const [query, setQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Deterministic local filtering across stored user medical data
  const filteredRecords = useMemo(() => {
    return filterMedicalRecords(records, query);
  }, [records, query]);

  const clearSearch = () => {
    setQuery('');
  };

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
      case 'Prescription':
        return 'badge-blue';
      default:
        return 'badge-gray';
    }
  };

  return (
    <div className="search-page-container">
      {/* Search Header and Main Search Bar */}
      <div className="search-header-box">
        <div style={{ marginBottom: '1.25rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--color-text-primary)' }}>
            Search Records
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)', margin: 0 }}>
            Search across your stored medical reports, clinical notes, physicians, and PDF documents.
          </p>
        </div>

        {/* Search Input Box */}
        <div className="search-input-wrap" style={{ marginBottom: 0 }}>
          <SearchIcon size={20} className="search-input-icon" />
          <input
            type="text"
            className="search-main-input"
            placeholder="Search keywords (e.g., 'Hemoglobin', 'Glucose', 'Quest', 'Dr. Smith', 'ECG')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button
              onClick={clearSearch}
              className="search-clear-btn"
              title="Clear search text"
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Search Result Count and Reset */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.5rem 0 1rem' }}>
        <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          Showing {filteredRecords.length} of {records.length} record{records.length === 1 ? '' : 's'}
          {query.trim() && (
            <span style={{ marginLeft: '0.5rem', fontWeight: 400, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              for "<strong style={{ color: 'var(--color-primary-dark)' }}>{query}</strong>"
            </span>
          )}
        </div>
        {query && (
          <button
            onClick={clearSearch}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
          >
            Clear Search
          </button>
        )}
      </div>

      {/* Records Results List */}
      {filteredRecords.length === 0 ? (
        <div
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
          }}
        >
          <SearchIcon size={40} style={{ color: 'var(--color-text-muted)', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
            No medical records matched your query
          </h3>
          <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)', maxWidth: '440px', margin: '0 auto 1.5rem' }}>
            {query
              ? `No stored reports matched "${query}". Try searching for a biomarker name, doctor, or test type.`
              : 'Your medical vault currently has no records. Upload a report to get started.'}
          </p>
          {query && (
            <button onClick={clearSearch} className="btn btn-primary btn-sm">
              Clear Search & View All
            </button>
          )}
        </div>
      ) : (
        <div className="search-results-list">
          {filteredRecords.map((rec) => {
            const insights = getRecordSearchInsights(rec, query);
            const isSearching = Boolean(query.trim());

            return (
              <div
                key={rec.id}
                className="search-result-card"
                onClick={() => setSelectedRecord(rec)}
              >
                {/* Header: Category Badge, Match Badge, Timeline Date */}
                <div className="search-result-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className={`badge ${getCategoryBadgeClass(rec.category)}`}>
                      {highlightMatch(rec.category || 'General Record', query)}
                    </span>

                    {/* Show match reason badge if searching */}
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
                            : insights.matchedFields.includes('tags')
                            ? 'Tag Match'
                            : 'Matched'}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Report Date / Timeline */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    <Calendar size={13} />
                    <span>{rec.date || 'Undated'}</span>
                  </div>
                </div>

                {/* Report Title */}
                <h3 className="search-result-title">
                  {highlightMatch(rec.title || 'Untitled Medical Report', query)}
                </h3>

                {/* Matched Content / Notes Snippet */}
                {insights.matchedSnippet && (
                  <div className="search-snippet-box">
                    <strong>Report Extract: </strong>
                    <span>{highlightMatch(insights.matchedSnippet, query)}</span>
                  </div>
                )}

                {/* Tags if available */}
                {rec.tags && rec.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', margin: '0.5rem 0' }}>
                    {rec.tags.map((tag, idx) => (
                      <span key={idx} className="record-tag-pill">
                        #{highlightMatch(tag, query)}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer: Relevant Report / PDF Info and Open Action */}
                <div className="search-result-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    {/* Relevant Attached Report/PDF */}
                    <div className="search-pdf-info">
                      <FileText size={15} className="text-emerald" />
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {highlightMatch(rec.fileName || 'medical_report.pdf', query)}
                      </span>
                      {rec.fileSize && (
                        <span style={{ color: 'var(--color-text-muted)' }}>({rec.fileSize})</span>
                      )}
                    </div>

                    {/* Attending Provider / Doctor */}
                    {(rec.doctor || rec.provider) && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                        <Building2 size={13} />
                        <span>{highlightMatch(rec.doctor || rec.provider, query)}</span>
                      </div>
                    )}
                  </div>

                  {/* Open Report Button */}
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', gap: '0.35rem' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRecord(rec);
                    }}
                  >
                    <Eye size={14} />
                    <span>Open Report</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Record Detail Modal */}
      <RecordDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
}
