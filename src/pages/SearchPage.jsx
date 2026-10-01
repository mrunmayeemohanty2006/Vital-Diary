import React, { useState } from 'react';
import {
  Search as SearchIcon,
  X,
  Filter,
  FileText,
  Calendar,
  Building2,
  Tag,
  AlertCircle,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { useRecords } from '../context/RecordsContext';
import RecordCard from '../components/common/RecordCard';
import RecordDetailModal from '../components/common/RecordDetailModal';

export default function SearchPage() {
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
          <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)' }}>
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

        {/* Quick Search Tag Pills from User Records */}
        {dynamicTags.length > 0 && (
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Indexed Record Tags:
            </div>
            <div className="filter-pills-row">
              {dynamicTags.map((tag) => {
                const isSelected = selectedTag.toLowerCase() === tag.toLowerCase();
                return (
                  <button
                    key={tag}
                    type="button"
                    className={`badge ${isSelected ? 'badge-emerald' : 'badge-mint'}`}
                    style={{ cursor: 'pointer', padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                    onClick={() => setSelectedTag(isSelected ? '' : tag)}
                  >
                    <Tag size={11} />
                    <span>{tag}</span>
                    {isSelected && <X size={12} style={{ marginLeft: 3 }} />}
                  </button>
                );
              })}

              {(query || selectedCategory !== 'All' || selectedTag) && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '0.78rem', padding: '0.2rem 0.6rem' }}
                >
                  Reset All Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Found {filteredRecords.length} {filteredRecords.length === 1 ? 'Record' : 'Records'}
          </span>
          {query && (
            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginLeft: '0.5rem' }}>
              matching "{query}"
            </span>
          )}
        </div>

        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          Total Vault Records: {records.length}
        </span>
      </div>

      {/* Results Grid */}
      {filteredRecords.length === 0 ? (
        <div
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            border: '1px dashed var(--color-border)',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          <SearchIcon size={40} style={{ color: 'var(--color-text-muted)', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
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
