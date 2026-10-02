import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Filter,
  Layers,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import MedicalReportGalleryCard from './MedicalReportGalleryCard';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function parseDateInfo(record) {
  const rawDate = record.date || record.uploadedAt || '';
  let d = new Date(rawDate);

  if (isNaN(d.getTime())) {
    // If standard parse failed, try YYYY-MM-DD
    const parts = String(rawDate).split(/[-/]/);
    if (parts.length >= 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      d = new Date(year, month, day);
    } else {
      d = new Date();
    }
  }

  const year = d.getFullYear();
  const monthIndex = d.getMonth();
  const monthName = MONTH_NAMES[monthIndex] || 'Unknown Month';
  const day = d.getDate();
  const dateKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const formattedDate = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Calculate timestamp for sorting (fallback to uploadedAt timestamp)
  const uploadedTimestamp = record.uploadedAt ? new Date(record.uploadedAt).getTime() : 0;
  const sortScore = d.getTime() + (uploadedTimestamp % 86400000);

  return {
    year,
    monthIndex,
    monthName,
    dateKey,
    formattedDate,
    sortScore,
  };
}

export default function MedicalReportsGallery({ records, onSelectRecord }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [collapsedYears, setCollapsedYears] = useState({});
  const [collapsedMonths, setCollapsedMonths] = useState({});

  // Distinct categories available in current records
  const categories = useMemo(() => {
    const cats = new Set(records.map((r) => r.category).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [records]);

  // Filter records by selected category
  const filteredRecords = useMemo(() => {
    if (selectedCategory === 'All') return records;
    return records.filter((r) => r.category === selectedCategory);
  }, [records, selectedCategory]);

  // Group records by Year -> Month -> Specific Date
  // And ensure newest records appear first at every level
  const groupedGallery = useMemo(() => {
    const yearMap = {};

    filteredRecords.forEach((rec) => {
      const { year, monthIndex, monthName, dateKey, formattedDate, sortScore } = parseDateInfo(rec);

      if (!yearMap[year]) {
        yearMap[year] = {
          year,
          totalCount: 0,
          months: {},
        };
      }

      yearMap[year].totalCount += 1;

      if (!yearMap[year].months[monthIndex]) {
        yearMap[year].months[monthIndex] = {
          monthIndex,
          monthName,
          totalCount: 0,
          dates: {},
        };
      }

      yearMap[year].months[monthIndex].totalCount += 1;

      if (!yearMap[year].months[monthIndex].dates[dateKey]) {
        yearMap[year].months[monthIndex].dates[dateKey] = {
          dateKey,
          formattedDate,
          records: [],
          sortScore,
        };
      }

      yearMap[year].months[monthIndex].dates[dateKey].records.push({
        ...rec,
        _sortScore: sortScore,
      });
    });

    // Sort Years descending (e.g. 2026 -> 2025)
    const sortedYears = Object.values(yearMap).sort((a, b) => b.year - a.year);

    sortedYears.forEach((y) => {
      // Sort Months descending (e.g. Dec -> Nov -> Oct)
      const sortedMonths = Object.values(y.months).sort((a, b) => b.monthIndex - a.monthIndex);

      sortedMonths.forEach((m) => {
        // Sort Dates descending (e.g. Oct 28 -> Oct 02)
        const sortedDates = Object.values(m.dates).sort((a, b) => {
          return b.dateKey.localeCompare(a.dateKey);
        });

        sortedDates.forEach((d) => {
          // Sort Records within date descending
          d.records.sort((a, b) => (b._sortScore || 0) - (a._sortScore || 0));
        });

        m.sortedDates = sortedDates;
      });

      y.sortedMonths = sortedMonths;
    });

    return sortedYears;
  }, [filteredRecords]);

  const toggleYear = (year) => {
    setCollapsedYears((prev) => ({
      ...prev,
      [year]: !prev[year],
    }));
  };

  const toggleMonth = (yearMonthKey) => {
    setCollapsedMonths((prev) => ({
      ...prev,
      [yearMonthKey]: !prev[yearMonthKey],
    }));
  };

  if (!records || records.length === 0) {
    return (
      <div className="gallery-empty-state">
        <div className="gallery-empty-icon">
          <Layers size={36} />
        </div>
        <h3 className="gallery-empty-title">No Medical Reports Uploaded</h3>
        <p className="gallery-empty-desc">
          Your medical records gallery is currently clean. Drag and drop medical files or whole folders above to start cataloging your reports by Year, Month, and Date.
        </p>
      </div>
    );
  }

  return (
    <div className="medical-reports-gallery-section">
      {/* Section Header */}
      <div className="gallery-header-bar">
        <div>
          <div className="gallery-section-title-wrap">
            <h2 className="gallery-section-heading">Medical Reports</h2>
            <span className="badge badge-mint gallery-count-badge">
              {filteredRecords.length} {filteredRecords.length === 1 ? 'Report' : 'Reports'}
            </span>
          </div>
          <p className="gallery-section-subtitle">
            Timeline gallery organized chronologically by Year, Month, and specific date of service
          </p>
        </div>

        {/* Category Filters */}
        {categories.length > 2 && (
          <div className="gallery-filter-chips">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`gallery-filter-chip ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chronological Year Groups */}
      <div className="gallery-timeline-container">
        {groupedGallery.map((yearGroup) => {
          const isYearCollapsed = !!collapsedYears[yearGroup.year];

          return (
            <div key={yearGroup.year} className="gallery-year-block">
              {/* Year Heading Bar */}
              <div
                className="gallery-year-header"
                onClick={() => toggleYear(yearGroup.year)}
              >
                <div className="gallery-year-title">
                  <div className="gallery-year-pill">
                    <Calendar size={15} />
                    <span>{yearGroup.year}</span>
                  </div>
                  <span className="gallery-year-stats">
                    {yearGroup.totalCount} {yearGroup.totalCount === 1 ? 'record' : 'records'}
                  </span>
                </div>

                <button type="button" className="gallery-collapse-btn">
                  {isYearCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>

              {/* Month Subgroups */}
              {!isYearCollapsed && (
                <div className="gallery-months-wrapper">
                  {yearGroup.sortedMonths.map((monthGroup) => {
                    const monthKey = `${yearGroup.year}-${monthGroup.monthIndex}`;
                    const isMonthCollapsed = !!collapsedMonths[monthKey];

                    return (
                      <div key={monthKey} className="gallery-month-block">
                        {/* Month Header */}
                        <div
                          className="gallery-month-header"
                          onClick={() => toggleMonth(monthKey)}
                        >
                          <div className="gallery-month-title">
                            <span className="gallery-month-dot" />
                            <h4>{monthGroup.monthName}</h4>
                            <span className="gallery-month-count">
                              ({monthGroup.totalCount})
                            </span>
                          </div>

                          <div className="gallery-month-line" />

                          <button type="button" className="gallery-collapse-btn-subtle">
                            {isMonthCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                          </button>
                        </div>

                        {/* Date Groups */}
                        {!isMonthCollapsed && (
                          <div className="gallery-dates-wrapper">
                            {monthGroup.sortedDates.map((dateGroup) => (
                              <div key={dateGroup.dateKey} className="gallery-date-block">
                                <div className="gallery-date-badge-row">
                                  <div className="gallery-date-badge">
                                    <Clock size={12} className="text-emerald" />
                                    <span>{dateGroup.formattedDate}</span>
                                  </div>
                                  <span className="gallery-date-count">
                                    {dateGroup.records.length}{' '}
                                    {dateGroup.records.length === 1 ? 'document' : 'documents'}
                                  </span>
                                </div>

                                {/* Report Cards Grid */}
                                <div className="gallery-cards-grid">
                                  {dateGroup.records.map((record) => (
                                    <MedicalReportGalleryCard
                                      key={record.id}
                                      record={record}
                                      onSelectRecord={onSelectRecord}
                                    />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
