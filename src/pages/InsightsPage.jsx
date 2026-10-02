import React from 'react';
import {
  TrendingUp,
  UploadCloud,
} from 'lucide-react';
import { useRecords } from '../context/RecordsContext';

export default function InsightsPage({ onNavigateTab }) {
  const { records } = useRecords();

  // Dynamic category breakdown from real records
  const categoryCounts = records.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {});

  const categoryList = Object.entries(categoryCounts);

  return (
    <div className="insights-page-container">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span className="badge badge-mint">Deterministic Health Analytics</span>
        </div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, marginBottom: '0.35rem' }}>
          Health Insights & Long-term Analytics
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)' }}>
          Clinical distribution and categorized summaries derived directly from your medical diary.
        </p>
      </div>

      {records.length === 0 ? (
        /* Clean Empty State */
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
            No Health Insights Available Yet
          </h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
            Upload medical reports, blood tests, or clinical summaries to generate personalized category distributions and analytics.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => onNavigateTab('upload')}
          >
            <UploadCloud size={16} />
            <span>Upload Your First Record</span>
          </button>
        </div>
      ) : (
        <>
          {/* Summary Banner */}
          <div className="insights-hero-card">
            <div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Archive Summary
              </span>
              <h2 style={{ fontSize: '1.45rem', marginTop: '0.25rem', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
                {records.length} Stored Medical Document{records.length === 1 ? '' : 's'}
              </h2>
              <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)', maxWidth: '640px' }}>
                Your vault currently holds records across {categoryList.length} distinct clinical category areas.
              </p>
            </div>

            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                {records.length}
              </div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                Verified Records
              </span>
            </div>
          </div>

          {/* Real Category Distribution */}
          <div className="vital-card" style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--color-text-primary)' }}>
                  Records by Medical Category
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  Breakdown of documents stored in your vault
                </p>
              </div>
              <span className="badge badge-mint">{categoryList.length} Categories</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {categoryList.map(([cat, count]) => (
                <div
                  key={cat}
                  style={{
                    padding: '1rem',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-bg-subtle)',
                  }}
                >
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', display: 'block' }}>
                    {cat}
                  </span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '0.25rem' }}>
                    {count} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>{count === 1 ? 'file' : 'files'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
