import { describe, it, expect } from 'vitest';
import {
  computeReportHealthScore,
  computeOverallHealthTrend,
} from '../overall-health-trends.js';

describe('Vital Diary — Overall Health Trend Engine Across All Reports', () => {
  const sampleReports = [
    {
      id: 'rec_1',
      title: 'Initial Health Check',
      date: '2026-01-10',
      category: 'Lab Results',
      extractedMetrics: [
        { name: 'Hemoglobin', value: '11.0', status: 'low' },
        { name: 'Total Cholesterol', value: '230', status: 'high' },
        { name: 'Glucose', value: '115', status: 'high' },
      ],
    },
    {
      id: 'rec_2',
      title: 'Follow-up Comprehensive Panel',
      date: '2026-06-15',
      category: 'Lab Results',
      extractedMetrics: [
        { name: 'Hemoglobin', value: '14.0', status: 'normal' },
        { name: 'Total Cholesterol', value: '185', status: 'normal' },
        { name: 'Glucose', value: '92', status: 'normal' },
      ],
    },
  ];

  it('should compute average health improvement across all reports', () => {
    const trend = computeOverallHealthTrend(sampleReports);
    expect(trend.hasData).toBe(true);
    expect(trend.points.length).toBe(2);
    expect(trend.isImprovement).toBe(true);
    expect(trend.label).toContain('Health improved by');
  });

  it('should compute average health decrease across deteriorating reports', () => {
    const deteriorating = [
      {
        id: 'rec_1',
        title: 'Good Baseline',
        date: '2026-01-10',
        extractedMetrics: [{ name: 'Hemoglobin', value: '14.2', status: 'normal' }],
      },
      {
        id: 'rec_2',
        title: 'Abnormal Followup',
        date: '2026-06-15',
        extractedMetrics: [{ name: 'Hemoglobin', value: '8.5', status: 'low' }],
      },
    ];

    const trend = computeOverallHealthTrend(deteriorating);
    expect(trend.hasData).toBe(true);
    expect(trend.isDeterioration).toBe(true);
    expect(trend.label).toContain('Health decreased by');
  });
});
