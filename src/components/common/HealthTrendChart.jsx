import React, { useState } from 'react';
import { Activity, Heart, Droplets, PieChart, Info, PlusCircle, UploadCloud } from 'lucide-react';
import { useRecords } from '../../context/RecordsContext';

export default function HealthTrendChart({ onUploadClick }) {
  const { vitals } = useRecords();
  const [selectedMetric, setSelectedMetric] = useState('bp');
  const [activePointIndex, setActivePointIndex] = useState(null);

  const metricsConfig = {
    bp: {
      title: 'Blood Pressure Trend',
      unit: 'mmHg',
      target: 'Target: <120 / <80 mmHg',
      primaryLabel: 'Systolic',
      secondaryLabel: 'Diastolic',
      icon: Activity,
      minY: 60,
      maxY: 160,
      targetMin: 70,
      targetMax: 120,
      getValue: (d) => ({ primary: d.bpSystolic || 0, secondary: d.bpDiastolic || 0 }),
      formatValue: (d) => (d.bpSystolic ? `${d.bpSystolic}/${d.bpDiastolic} mmHg` : 'No data'),
    },
    heartRate: {
      title: 'Resting Heart Rate',
      unit: 'bpm',
      target: 'Target: 60 – 100 bpm',
      primaryLabel: 'Resting BPM',
      icon: Heart,
      minY: 40,
      maxY: 120,
      targetMin: 60,
      targetMax: 80,
      getValue: (d) => ({ primary: d.heartRate || 0 }),
      formatValue: (d) => (d.heartRate ? `${d.heartRate} bpm` : 'No data'),
    },
    glucose: {
      title: 'Fasting Blood Glucose',
      unit: 'mg/dL',
      target: 'Target: 70 – 99 mg/dL',
      primaryLabel: 'Glucose',
      icon: Droplets,
      minY: 50,
      maxY: 160,
      targetMin: 70,
      targetMax: 99,
      getValue: (d) => ({ primary: d.glucose || 0 }),
      formatValue: (d) => (d.glucose ? `${d.glucose} mg/dL` : 'No data'),
    },
    cholesterol: {
      title: 'Total Cholesterol',
      unit: 'mg/dL',
      target: 'Target: <200 mg/dL',
      primaryLabel: 'Total Cholesterol',
      icon: PieChart,
      minY: 100,
      maxY: 260,
      targetMin: 120,
      targetMax: 199,
      getValue: (d) => ({ primary: d.cholesterol || 0 }),
      formatValue: (d) => (d.cholesterol ? `${d.cholesterol} mg/dL` : 'No data'),
    },
  };

  const currentConfig = metricsConfig[selectedMetric];
  const chartData = vitals.filter((d) => {
    const val = currentConfig.getValue(d);
    return val.primary > 0;
  });

  // SVG Chart Dimensions
  const width = 800;
  const height = 240;
  const paddingLeft = 55;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const getY = (val) => {
    const clamped = Math.max(currentConfig.minY, Math.min(currentConfig.maxY, val));
    const ratio = (clamped - currentConfig.minY) / (currentConfig.maxY - currentConfig.minY);
    return paddingTop + chartHeight - ratio * chartHeight;
  };

  const getX = (index) => {
    if (chartData.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (chartData.length - 1)) * chartWidth;
  };

  const primaryPoints = chartData.map((d, i) => {
    const val = currentConfig.getValue(d);
    return { x: getX(i), y: getY(val.primary), data: d, val: val.primary };
  });

  const secondaryPoints =
    selectedMetric === 'bp'
      ? chartData.map((d, i) => {
          const val = currentConfig.getValue(d);
          return { x: getX(i), y: getY(val.secondary), data: d, val: val.secondary };
        })
      : null;

  const createSmoothPath = (points) => {
    if (!points || points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
    return points.reduce((acc, point, i, arr) => {
      if (i === 0) return `M ${point.x},${point.y}`;
      const prev = arr[i - 1];
      const cx = (prev.x + point.x) / 2;
      return `${acc} C ${cx},${prev.y} ${cx},${point.y} ${point.x},${point.y}`;
    }, '');
  };

  const primaryPath = createSmoothPath(primaryPoints);
  const secondaryPath = secondaryPoints ? createSmoothPath(secondaryPoints) : '';

  const areaPath =
    primaryPoints.length > 1
      ? `${primaryPath} L ${primaryPoints[primaryPoints.length - 1].x},${paddingTop + chartHeight} L ${primaryPoints[0].x},${paddingTop + chartHeight} Z`
      : '';

  const targetTopY = getY(currentConfig.targetMax);
  const targetBottomY = getY(currentConfig.targetMin);
  const targetHeight = Math.abs(targetBottomY - targetTopY);

  const gridSteps = 4;
  const gridValues = Array.from({ length: gridSteps + 1 }, (_, i) => {
    const val = currentConfig.minY + (i / gridSteps) * (currentConfig.maxY - currentConfig.minY);
    return Math.round(val);
  });

  const activePoint =
    activePointIndex !== null ? chartData[activePointIndex] : chartData[chartData.length - 1];
  const activeFormatted = activePoint ? currentConfig.formatValue(activePoint) : null;

  return (
    <div className="trend-chart-card">
      {/* Header with Metric Selector */}
      <div className="chart-header">
        <div className="chart-title-area">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{currentConfig.title}</h3>
            <span className="badge badge-mint" style={{ fontSize: '0.75rem' }}>
              {currentConfig.target}
            </span>
          </div>
          {activeFormatted && (
            <p style={{ marginTop: '0.2rem' }}>
              Latest reading: <strong style={{ color: 'var(--color-primary-dark)', fontWeight: 700 }}>{activeFormatted}</strong>
            </p>
          )}
        </div>

        <div className="chart-controls">
          <button
            className={`metric-select-btn ${selectedMetric === 'bp' ? 'active' : ''}`}
            onClick={() => setSelectedMetric('bp')}
          >
            Blood Pressure
          </button>
          <button
            className={`metric-select-btn ${selectedMetric === 'heartRate' ? 'active' : ''}`}
            onClick={() => setSelectedMetric('heartRate')}
          >
            Heart Rate
          </button>
          <button
            className={`metric-select-btn ${selectedMetric === 'glucose' ? 'active' : ''}`}
            onClick={() => setSelectedMetric('glucose')}
          >
            Fasting Glucose
          </button>
          <button
            className={`metric-select-btn ${selectedMetric === 'cholesterol' ? 'active' : ''}`}
            onClick={() => setSelectedMetric('cholesterol')}
          >
            Cholesterol
          </button>
        </div>
      </div>

      {chartData.length === 0 ? (
        /* Clean Empty State */
        <div
          style={{
            padding: '3rem 1.5rem',
            textAlign: 'center',
            backgroundColor: 'var(--color-bg-subtle)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--color-border)',
            margin: '1rem 0',
          }}
        >
          <Activity size={36} style={{ color: 'var(--color-text-muted)', margin: '0 auto 0.75rem' }} />
          <h4 style={{ fontSize: '1.05rem', color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>
            No {currentConfig.title} Data Recorded
          </h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', maxWidth: '420px', margin: '0 auto 1.25rem' }}>
            Upload medical files or lab reports to automatically track and visualize your biomarker trends over time.
          </p>
          {onUploadClick && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={onUploadClick}
              style={{ gap: '0.4rem' }}
            >
              <UploadCloud size={14} />
              <span>Upload Medical Record</span>
            </button>
          )}
        </div>
      ) : (
        /* SVG Canvas Container */
        <div className="chart-svg-container">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="svg-chart"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#047857" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#047857" stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* Target Range Band */}
            <rect
              x={paddingLeft}
              y={Math.min(targetTopY, targetBottomY)}
              width={chartWidth}
              height={targetHeight}
              className="chart-target-range"
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
                    className="chart-grid-line"
                  />
                  <text x={paddingLeft - 10} y={y + 4} className="chart-y-label">
                    {val} {idx === gridValues.length - 1 ? currentConfig.unit : ''}
                  </text>
                </g>
              );
            })}

            {/* Area Fill */}
            {areaPath && <path d={areaPath} fill="url(#chartGradient)" />}

            {/* Secondary Line (e.g. Diastolic for BP) */}
            {secondaryPath && (
              <path d={secondaryPath} className="chart-secondary-line" />
            )}

            {/* Primary Trend Line */}
            {primaryPath && <path d={primaryPath} className="chart-main-line" />}

            {/* Secondary Line Points */}
            {secondaryPoints &&
              secondaryPoints.map((pt, i) => (
                <circle
                  key={`sec-${i}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={4}
                  fill="#ffffff"
                  stroke="#10b981"
                  strokeWidth={2.5}
                />
              ))}

            {/* Primary Line Points with hover interactions */}
            {primaryPoints.map((pt, i) => {
              const isActive = activePointIndex === i;
              return (
                <g key={`pri-${i}`}>
                  <rect
                    x={pt.x - 20}
                    y={paddingTop}
                    width={40}
                    height={chartHeight}
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setActivePointIndex(i)}
                    onMouseLeave={() => setActivePointIndex(null)}
                  />
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isActive ? 6 : 4.5}
                    className={`chart-dot ${isActive ? 'active' : ''}`}
                  />
                  {isActive && (
                    <g>
                      <rect
                        x={pt.x - 45}
                        y={pt.y - 32}
                        width={90}
                        height={24}
                        rx={5}
                        fill="#064e3b"
                      />
                      <text
                        x={pt.x}
                        y={pt.y - 16}
                        fill="#ffffff"
                        fontSize="11"
                        fontWeight="700"
                        textAnchor="middle"
                        fontFamily="sans-serif"
                      >
                        {currentConfig.formatValue(pt.data)}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* X Axis Labels (Dates) */}
            {chartData.map((d, i) => {
              const x = getX(i);
              return (
                <text
                  key={`date-${i}`}
                  x={x}
                  y={height - 10}
                  className="chart-label"
                >
                  {d.date || `Point ${i + 1}`}
                </text>
              );
            })}
          </svg>
        </div>
      )}

      {/* Chart Footer with Legend */}
      <div className="chart-footer-legend">
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-dot primary" />
            <span>{currentConfig.primaryLabel}</span>
          </div>
          {selectedMetric === 'bp' && (
            <div className="legend-item">
              <span className="legend-dot secondary" />
              <span>{currentConfig.secondaryLabel}</span>
            </div>
          )}
          <div className="legend-item">
            <span className="legend-dot target" />
            <span>Target Range</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)' }}>
          <Info size={14} />
          <span>Deterministic vitals data points</span>
        </div>
      </div>
    </div>
  );
}
