import React from 'react';
import {
  Search,
  X,
  Filter,
  SlidersHorizontal,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Lab Results',
  'Imaging',
  'Cardiology',
  "Doctor's Note",
  'Prescription',
];

export default function PatientRecordSearch({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  totalResults,
  totalRecords,
}) {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Search Input Bar */}
      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <div
          style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'none',
          }}
        >
          <Search size={19} />
        </div>

        <input
          type="text"
          placeholder="Search test names (e.g. Glucose, CBC), lab values (e.g. 120), report types, dates, keywords..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            padding: '0.8rem 2.8rem 0.8rem 2.8rem',
            fontSize: '0.9375rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-subtle)',
          }}
        />

        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            style={{
              position: 'absolute',
              right: '0.85rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.25rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: '#e2e8f0',
            }}
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter Category Chips & Results Count */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)', marginRight: '0.25rem' }}>
            Filter Category:
          </span>

          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                className={`badge ${isActive ? 'badge-emerald' : 'badge-gray'}`}
                onClick={() => onCategoryChange(cat)}
                style={{
                  cursor: 'pointer',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8125rem',
                  borderRadius: 'var(--radius-full)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Results Counter */}
        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          Showing <strong>{totalResults}</strong> of {totalRecords} records
        </div>
      </div>
    </div>
  );
}
