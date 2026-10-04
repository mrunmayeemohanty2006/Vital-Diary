import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Calendar,
  FileText,
  UploadCloud,
  CheckCircle2,
} from 'lucide-react';
import { useRecords } from '../../context/RecordsContext';
import { computeOverallHealthTrend } from '../../lib/overall-health-trends';

export default function HealthTrendChart({ onUploadClick }) {
  const { records } = useRecords();
  const [activePointIndex, setActivePointIndex] = useState(null);

  // Compute average health trend across all verified reports
  const trendData = useMemo(() => {
    return computeOverallHealthTrend(records);
  }, [records]);

  const trendPoints = trendData.points || [];

  // SVG Chart Dimensions
  const width = 800;
  const height = 240;
  const paddingLeft = 55;
  const paddingRight = 35;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const minY = 50;
  const maxY = 100;

  const getY = (val) => {
    const clamped = Math.max(minY, Math.min(maxY, val));
    const ratio = (clamped - minY) / (maxY - minY);
    return paddingTop + chartHeight - ratio * chartHeight;
  };

  const getX = (index) => {
    if (trendPoints.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (trendPoints.length - 1)) * chartWidth;
  };

  const plottedPoints = trendPoints.map((pt, i) => ({
    ...pt,
    x: getX(i),
    y: getY(pt.value),
  }));

  const createSmoothPath = (pts) => {
    if (!pts || pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`;
    return pts.reduce((acc, point, i, arr) => {
      if (i === 0) return `M ${point.x},${point.y}`;
      const prev = arr[i - 1];
      const cx = (prev.x + point.x) / 2;
      return `${acc} C ${cx},${prev.y} ${cx},${point.y} ${point.x},${point.y}`;
    }, '');
  };

  const linePath = createSmoothPath(plottedPoints);
  const areaPath =
    plottedPoints.length > 1
      ? `${linePath} L ${plottedPoints[plottedPoints.length - 1].x},${paddingTop + chartHeight} L ${plottedPoints[0].x},${paddingTop + chartHeight} Z`
      : '';

  const gridSteps = 4;
  const gridValues = Array.from({ length: gridSteps + 1 }, (_, i) => {
    const val = minY + (i / gridSteps) * (maxY - minY);
    return Math.round(val);
  });

  const activePoint =
    activePointIndex !== null && plottedPoints[activePointIndex]
      ? plottedPoints[activePointIndex]
      : plottedPoints[plottedPoints.length - 1];

  const isPositive = trendData.isImprovement;

  // Clean brand green for positive, neutral teal for neutral/decrease (no red)
  const strokeColor = isPositive ? '#059669' : '#0d9488';
  const fillColorId = isPositive ? 'overallPositiveGradient' : 'overallNeutralGradient';

  // Empty or Insufficient Data State
  if (!trendData.hasData || trendPoints.length < 2) {
    return (
      <div className="trend-chart-card">
        <div className="chart-header" style={{ marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              Overall Health Trend
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Average health trajectory computed across all your uploaded medical and lab reports
            </p>
          </div>
        </div>

        <div
          style={{
            padding: '3.5rem 1.5rem',
            textAlign: 'center',
            backgroundColor: 'var(--color-bg-subtle)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--color-border)',
          }}
        >
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: '50%',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#047857',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <Activity size={28} />
          </div>

          <h4 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            Upload at least two reports to compute average health trend
          </h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', maxWidth: '480px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
            Vital Diary analyzes your reports chronologically to compute your overall average health progress over time without estimating or inventing missing values.
          </p>

          {onUploadClick && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onUploadClick}
              style={{ gap: '0.45rem', padding: '0.6rem 1.25rem' }}
            >
              <UploadCloud size={16} />
              <span>Upload Medical Report</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="trend-chart-card">
      {/* Chart Header with Clear Average Health Increase/Decrease in Normal Text */}
      <div className="chart-header" style={{ alignItems: 'flex-start' }}>
        <div className="chart-title-area" style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
              Overall Health Trend
            </h3>

            {/* Average Health Trend Badge (Green if Improved, Normal Text if Decreased/Stable - No Red!) */}
            <span
              className="badge"
              style={{
                fontSize: '0.875rem',
                fontWeight: 700,
                padding: '0.35rem 0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: isPositive ? '#ecfdf5' : '#f8fafc',
                color: isPositive ? '#047857' : 'var(--color-text-primary)',
                border: `1.5px solid ${isPositive ? '#a7f3d0' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-full)',
              }}
            >
              {isPositive ? (
                <TrendingUp size={16} strokeWidth={2.5} />
              ) : (
                <TrendingDown size={16} strokeWidth={2.5} style={{ color: 'var(--color-text-secondary)' }} />
              )}
              <span>{trendData.label}</span>
            </span>
          </div>

          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.35rem', marginBottom: 0 }}>
            Average health progress calculated across all <strong>{trendData.recordsCount} verified reports</strong> (from baseline on {trendData.baselineDate} to latest on {trendData.latestDate}).
          </p>
        </div>

        {/* Selected / Latest Report Reading Card */}
        {activePoint && (
          <div
            style={{
              textAlign: 'right',
              padding: '0.55rem 1rem',
              backgroundColor: isPositive ? '#f0fdf4' : '#ffffff',
              border: `1px solid ${isPositive ? '#bbf7d0' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-md)',
              minWidth: '150px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
              {activePointIndex !== null ? 'Selected Report' : 'Latest Report'} ({activePoint.date})
            </span>
            <strong style={{ fontSize: '1.2rem', color: isPositive ? '#047857' : 'var(--color-text-primary)', display: 'block', marginTop: '0.15rem' }}>
              {activePoint.value}/100
            </strong>
            <span style={{ fontSize: '0.725rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              {activePoint.title?.length > 22 ? `${activePoint.title.slice(0, 20)}...` : activePoint.title}
            </span>
          </div>
        )}
      </div>

      {/* SVG Canvas Container */}
      <div className="chart-svg-container" style={{ marginTop: '1.25rem' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="svg-chart"
          preserveAspectRatio="none"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          <defs>
            {/* Positive Trend Gradient */}
            <linearGradient id="overallPositiveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.01" />
            </linearGradient>

            {/* Neutral Gradient (Normal styling for decrease / neutral) */}
            <linearGradient id="overallNeutralGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0d9488" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0d9488" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Normal Health Target Zone (75 - 98) */}
          <rect
            x={paddingLeft}
            y={getY(98)}
            width={chartWidth}
            height={Math.abs(getY(75) - getY(98))}
            fill="#ecfdf5"
            opacity={0.6}
          />

          {/* Y Axis Grid Lines and Labels */}
          {gridValues.map((val, idx) => {
            const y = getY(val);
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  className="chart-y-label"
                  textAnchor="end"
                  fontSize="11"
                  fill="#64748b"
                  fontWeight="600"
                >
                  {val} {idx === gridValues.length - 1 ? 'Score' : ''}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          {areaPath && <path d={areaPath} fill={`url(#${fillColorId})`} />}

          {/* Primary Smooth Trend Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={strokeColor}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points with Hover Interaction and Tooltips */}
          {plottedPoints.map((pt, i) => {
            const isActive = activePointIndex === i;
            return (
              <g key={pt.id || i}>
                {/* Hit Box */}
                <rect
                  x={pt.x - 30}
                  y={paddingTop}
                  width={60}
                  height={chartHeight}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setActivePointIndex(i)}
                  onMouseLeave={() => setActivePointIndex(null)}
                />

                {/* Point Outer Ring */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isActive ? 8 : 5.5}
                  fill="#ffffff"
                  stroke={strokeColor}
                  strokeWidth={isActive ? 3 : 2.5}
                  style={{ transition: 'all 0.15s ease' }}
                />

                {/* Point Inner Center */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isActive ? 4 : 2.5}
                  fill={strokeColor}
                />

                {/* Interactive Tooltip Popover */}
                {isActive && (
                  <g>
                    <rect
                      x={Math.max(15, Math.min(width - 190, pt.x - 90))}
                      y={Math.max(8, pt.y - 54)}
                      width={180}
                      height={46}
                      rx={8}
                      fill="#0f172a"
                      filter="drop-shadow(0 4px 10px rgba(0,0,0,0.25))"
                    />
                    <text
                      x={Math.max(15, Math.min(width - 190, pt.x - 90)) + 90}
                      y={Math.max(8, pt.y - 54) + 17}
                      fill="#f8fafc"
                      fontSize="11"
                      fontWeight="700"
                      textAnchor="middle"
                      fontFamily="system-ui, sans-serif"
                    >
                      {pt.title.length > 24 ? `${pt.title.slice(0, 22)}...` : pt.title}
                    </text>
                    <text
                      x={Math.max(15, Math.min(width - 190, pt.x - 90)) + 90}
                      y={Math.max(8, pt.y - 54) + 33}
                      fill={isPositive ? '#6ee7b7' : '#e2e8f0'}
                      fontSize="11.5"
                      fontWeight="800"
                      textAnchor="middle"
                      fontFamily="system-ui, sans-serif"
                    >
                      Score: {pt.value}/100 ({pt.date})
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* X Axis Timeline Labels (Report Dates) */}
          {plottedPoints.map((pt, i) => (
            <text
              key={`x-date-${i}`}
              x={pt.x}
              y={height - 12}
              className="chart-label"
              textAnchor="middle"
              fontSize="11.5"
              fill="#475569"
              fontWeight="600"
            >
              {pt.date}
            </text>
          ))}
        </svg>
      </div>

      {/* Footer Legend & Metadata */}
      <div className="chart-footer-legend" style={{ marginTop: '1rem', paddingTop: '0.85rem' }}>
        <div className="legend-items">
          <div className="legend-item">
            <span
              className="legend-dot"
              style={{ backgroundColor: strokeColor }}
            />
            <span>Overall Average Health Index</span>
          </div>
          <div className="legend-item">
            <span
              className="legend-dot"
              style={{ backgroundColor: '#10b981', border: '1px dashed #047857' }}
            />
            <span>Target Health Zone (75–98)</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
          <CheckCircle2 size={14} className="text-emerald" />
          <span>Average trajectory computed across all {trendPoints.length} verified reports</span>
        </div>
      </div>
    </div>
  );
}
