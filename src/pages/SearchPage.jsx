import React, { useState } from 'react';
import {
  Search as SearchIcon,
  X,
  Tag,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRecords } from '../context/RecordsContext';
import RecordCard from '../components/common/RecordCard';
import RecordDetailModal from '../components/common/RecordDetailModal';

export default function SearchPage() {
  const { user } = useAuth();
  const { searchRecords, records } = useRecords();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  const categories = [
    'All',
    'Lab Results',
    'Imaging',
    'Cardiology',
    "Doctor's Note",
    'Vaccination',
  ];

  // Extract dynamic tags from user's records
  const dynamicTags = Array.from(
    new Set(records.flatMap((r) => r.tags || []).filter(Boolean))
  );

  // Perform deterministic search
  const filteredRecords = searchRecords(query, {
    category: selectedCategory,
    tag: selectedTag,
  });

  const clearSearch = () => {
    setQuery('');
    setSelectedCategory('All');
    setSelectedTag('');
  };

  return (
    <div className="search-page-container">
      {/* Search Header and Input */}
      <div className="search-header-box">
        <div style={{ marginBottom: '1.25rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, marginBottom: '0.35rem' }}>
            Deterministic Medical Records Search
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)', margin: 0 }}>
            Search diagnoses, biomarkers, physicians, clinical notes, and cataloged file titles with exact matching.
          </p>
        </div>

        {/* Search Input Box */}
        <div className="search-input-wrap">
          <SearchIcon size={20} className="search-input-icon" />
          <input
            type="text"
            className="search-main-input"
            placeholder="Search keywords (e.g., 'Glucose', 'Quest', 'ECG', '118/76', 'Radiology')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="search-clear-btn"
              title="Clear text"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Filter by Category:
          </div>
          <div className="filter-pills-row">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`filter-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Tags Row */}
        {dynamicTags.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <Tag size={12} />
              <span>Filter by Medical Tag:</span>
            </div>
            <div className="filter-pills-row" style={{ flexWrap: 'wrap' }}>
              {dynamicTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`filter-pill ${selectedTag === tag ? 'active' : ''}`}
                  onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                  style={{ fontSize: '0.78rem' }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search Result Count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.5rem 0 1rem' }}>
        <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          Showing {filteredRecords.length} of {records.length} record{records.length === 1 ? '' : 's'}
        </div>
        {(query || selectedCategory !== 'All' || selectedTag) && (
          <button
            onClick={clearSearch}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Records Grid */}
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
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            No medical records matched your query
          </h3>
          <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)', maxWidth: '440px', margin: '0 auto 1.5rem' }}>
            Try adjusting your search keywords, clear active category filters, or upload a new record to your vault.
          </p>
          <button onClick={clearSearch} className="btn btn-primary btn-sm">
            Clear Filters & View All
          </button>
        </div>
      ) : (
        <div className="records-grid">
          {filteredRecords.map((rec) => (
            <RecordCard
              key={rec.id}
              record={rec}
              onSelectRecord={setSelectedRecord}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <RecordDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
}
