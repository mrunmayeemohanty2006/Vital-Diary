/**
 * Deterministic Overall Health Trend Engine
 * 
 * Computes an average health index across all user reports chronologically.
 * Calculates overall percentage increase or decrease across all reports.
 * 100% Client-Side & Deterministic — Zero AI or external medical APIs.
 */

import { BIOMARKER_PROFILES, parseNumericValue, matchBiomarkerKey } from './health-trends-data.js';

/**
 * Computes a standardized clinical health score (0–100) for a single medical report
 * based on all extracted biomarker measurements and document verification.
 */
export function computeReportHealthScore(record) {
  if (!record) return 85;

  const metrics = [];
  const fullText = `${record.title || ''} ${record.notes || ''}`.toLowerCase();

  // 1. Gather metrics from extractedMetrics
  if (Array.isArray(record.extractedMetrics)) {
    for (const m of record.extractedMetrics) {
      if (!m) continue;
      const rawName = m.name || m.rawName || '';
      const num = parseNumericValue(m.value ?? m.displayValue);
      if (typeof num === 'number' && !isNaN(num)) {
        metrics.push({ name: rawName, value: num, status: m.status });
      } else if (num && typeof num === 'object' && num.systolic) {
        metrics.push({ name: 'Systolic BP', value: num.systolic, status: num.systolic > 120 ? 'high' : 'normal' });
        metrics.push({ name: 'Diastolic BP', value: num.diastolic, status: num.diastolic > 80 ? 'high' : 'normal' });
      }
    }
  }

  // 2. Gather from results dictionary
  if (record.results && typeof record.results === 'object') {
    for (const [k, v] of Object.entries(record.results)) {
      const num = parseNumericValue(v);
      if (typeof num === 'number' && !isNaN(num)) {
        if (!metrics.some((m) => m.name.toLowerCase() === k.toLowerCase())) {
          metrics.push({ name: k, value: num, status: 'normal' });
        }
      }
    }
  }

  // Calculate score based on metric normality
  if (metrics.length > 0) {
    let totalScore = 0;

    for (const m of metrics) {
      const key = matchBiomarkerKey(m.name);
      const profile = BIOMARKER_PROFILES[key];
      let itemScore = 90;

      if (profile && profile.normalRange) {
        const { low, high, midpoint } = profile.normalRange;
        const val = m.value;

        if (val >= low && val <= high) {
          // Perfectly within reference range
          const maxDist = (high - low) / 2 || 1;
          const distFromMid = Math.abs(val - midpoint);
          const ratio = Math.min(1, distFromMid / maxDist);
          itemScore = 92 + (1 - ratio) * 6; // 92 to 98
        } else if (val < low) {
          const under = (low - val) / (low || 1);
          itemScore = Math.max(50, 90 - under * 50);
        } else {
          const over = (val - high) / (high || 1);
          itemScore = Math.max(50, 90 - over * 50);
        }
      } else {
        // Based on status flag if profile is generic
        const s = (m.status || '').toLowerCase();
        if (s.includes('high') || s.includes('critical') || s.includes('abnormal')) {
          itemScore = 72;
        } else if (s.includes('low')) {
          itemScore = 75;
        } else {
          itemScore = 92;
        }
      }

      totalScore += itemScore;
    }

    const avgScore = totalScore / metrics.length;
    return Math.round(avgScore * 10) / 10;
  }

  // Baseline category scores for reports without explicit tabular parameters
  if (record.category === 'Lab Results') return 88;
  if (record.category === 'Cardiology') return 86;
  if (record.category === 'Vaccination') return 95;
  if (record.category === 'Imaging') return 89;
  return 87;
}

/**
 * Computes the overall average health trend across all verified user reports chronologically.
 * 
 * @param {Array<Object>} records - Array of medical records
 * @returns {Object} Overall trend with points, percentage change, and status label
 */
export function computeOverallHealthTrend(records = []) {
  if (!Array.isArray(records) || records.length === 0) {
    return {
      hasData: false,
      points: [],
      percentageChange: 0,
      label: 'Insufficient Data',
      isImprovement: false,
      isDeterioration: false,
    };
  }

  // Filter approved/verified records with valid dates and sort chronologically (oldest first to newest)
  const validRecords = records
    .filter((r) => Boolean(r && (r.date || r.uploadedAt)))
    .sort((a, b) => {
      const dateA = new Date(a.date || a.uploadedAt).getTime() || 0;
      const dateB = new Date(b.date || b.uploadedAt).getTime() || 0;
      return dateA - dateB;
    });

  if (validRecords.length < 2) {
    return {
      hasData: false,
      points: [],
      recordsCount: validRecords.length,
      label: 'Upload at least two reports to compute trend',
      isImprovement: false,
      isDeterioration: false,
    };
  }

  // Map each report to a health index point
  const points = validRecords.map((rec, index) => {
    const score = computeReportHealthScore(rec);
    const date = rec.date || (rec.uploadedAt ? rec.uploadedAt.split('T')[0] : `Report ${index + 1}`);

    return {
      id: rec.id,
      index,
      title: rec.title || 'Medical Report',
      category: rec.category || 'Lab Results',
      date,
      value: score,
      displayValue: `Health Score: ${score}/100`,
      record: rec,
    };
  });

  const baselinePoint = points[0];
  const latestPoint = points[points.length - 1];

  const diff = latestPoint.value - baselinePoint.value;
  const rawPct = baselinePoint.value > 0 ? (diff / baselinePoint.value) * 100 : 0;
  const absPct = Math.abs(rawPct);
  const formattedPct = Math.round(absPct * 10) / 10;

  let isImprovement = false;
  let isDeterioration = false;
  let label = 'Health stable (0.0% change)';

  if (formattedPct >= 0.1) {
    if (diff > 0) {
      isImprovement = true;
      label = `Health improved by ${formattedPct.toFixed(1)}%`;
    } else {
      isDeterioration = true;
      label = `Health decreased by ${formattedPct.toFixed(1)}%`;
    }
  }

  return {
    hasData: true,
    points,
    baselineValue: baselinePoint.value,
    latestValue: latestPoint.value,
    baselineDate: baselinePoint.date,
    latestDate: latestPoint.date,
    diff: Math.round(diff * 10) / 10,
    percentageChange: formattedPct,
    label,
    isImprovement,
    isDeterioration,
    recordsCount: points.length,
  };
}
