import { describe, it, expect } from 'vitest';
import {
  extractHealthTrends,
  evaluateMetricTrend,
  extractRecordMetricReadings,
  matchBiomarkerKey,
} from '../health-trends.js';

describe('Vital Diary — Deterministic Health Trend Graph Engine', () => {
  const userReports = [
    {
      id: 'rec_01',
      title: 'Baseline Blood Panel',
      date: '2026-05-10',
      category: 'Lab Results',
      extractedMetrics: [
        {
          name: 'Hemoglobin',
          value: '11.5',
          unit: 'g/dL',
          status: 'low',
          referenceRange: { low: 12.0, high: 16.5, rawText: '12.0 - 16.5 g/dL' },
        },
        {
          name: 'Total Cholesterol',
          value: '220',
          unit: 'mg/dL',
          status: 'high',
          referenceRange: { low: 120, high: 200, rawText: '< 200 mg/dL' },
        },
        {
          name: 'Fasting Blood Glucose',
          value: '115',
          unit: 'mg/dL',
          status: 'high',
          referenceRange: { low: 70, high: 99, rawText: '70 - 99 mg/dL' },
        },
        {
          name: 'HDL Cholesterol',
          value: '42',
          unit: 'mg/dL',
          status: 'normal',
          referenceRange: { low: 40, high: 90, rawText: '> 40 mg/dL' },
        },
      ],
    },
    {
      id: 'rec_02',
      title: 'Mid-Year Follow-up Panel',
      date: '2026-08-15',
      category: 'Lab Results',
      extractedMetrics: [
        {
          name: 'Hemoglobin',
          value: '13.2',
          unit: 'g/dL',
          status: 'normal',
          referenceRange: { low: 12.0, high: 16.5, rawText: '12.0 - 16.5 g/dL' },
        },
        {
          name: 'Total Cholesterol',
          value: '198',
          unit: 'mg/dL',
          status: 'normal',
          referenceRange: { low: 120, high: 200, rawText: '< 200 mg/dL' },
        },
        {
          name: 'Fasting Blood Glucose',
          value: '95',
          unit: 'mg/dL',
          status: 'normal',
          referenceRange: { low: 70, high: 99, rawText: '70 - 99 mg/dL' },
        },
        {
          name: 'HDL Cholesterol',
          value: '52',
          unit: 'mg/dL',
          status: 'normal',
          referenceRange: { low: 40, high: 90, rawText: '> 40 mg/dL' },
        },
      ],
    },
    {
      id: 'rec_03',
      title: 'Annual Comprehensive Health Check',
      date: '2026-10-01',
      category: 'Lab Results',
      extractedMetrics: [
        {
          name: 'Hemoglobin',
          value: '14.0',
          unit: 'g/dL',
          status: 'normal',
          referenceRange: { low: 12.0, high: 16.5, rawText: '12.0 - 16.5 g/dL' },
        },
        {
          name: 'Total Cholesterol',
          value: '185',
          unit: 'mg/dL',
          status: 'normal',
          referenceRange: { low: 120, high: 200, rawText: '< 200 mg/dL' },
        },
        {
          name: 'Fasting Blood Glucose',
          value: '90',
          unit: 'mg/dL',
          status: 'normal',
          referenceRange: { low: 70, high: 99, rawText: '70 - 99 mg/dL' },
        },
      ],
    },
  ];

  it('should extract metrics across reports and calculate positive improvement trends', () => {
    const trends = extractHealthTrends(userReports);

    // Should find Hemoglobin, Total Cholesterol, Fasting Glucose, HDL Cholesterol
    expect(trends.length).toBeGreaterThanOrEqual(3);

    // Check Hemoglobin: 11.5 -> 14.0 (recovering low towards normal midpoint ~14.25)
    const hgbTrend = trends.find((t) => t.metricKey === 'hemoglobin');
    expect(hgbTrend).toBeDefined();
    expect(hgbTrend.points.length).toBe(3);
    expect(hgbTrend.firstValue).toBe(11.5);
    expect(hgbTrend.latestValue).toBe(14.0);
    expect(hgbTrend.evaluation.isImprovement).toBe(true);
    // ((14 - 11.5) / 11.5) * 100 = 21.7%
    expect(hgbTrend.evaluation.percentageChange).toBe(21.7);
    expect(hgbTrend.evaluation.label).toBe('Health improved by 21.7%');

    // Check Total Cholesterol: 220 -> 185 (dropped by 15.9%)
    const cholTrend = trends.find((t) => t.metricKey === 'total_cholesterol');
    expect(cholTrend).toBeDefined();
    expect(cholTrend.firstValue).toBe(220);
    expect(cholTrend.latestValue).toBe(185);
    expect(cholTrend.evaluation.isImprovement).toBe(true);
    // ((220 - 185) / 220) * 100 = 15.9%
    expect(cholTrend.evaluation.percentageChange).toBe(15.9);
    expect(cholTrend.evaluation.label).toBe('Health improved by 15.9%');

    // Check Fasting Glucose: 115 -> 90 (dropped by 21.7%)
    const glucTrend = trends.find((t) => t.metricKey === 'glucose');
    expect(glucTrend).toBeDefined();
    expect(glucTrend.firstValue).toBe(115);
    expect(glucTrend.latestValue).toBe(90);
    expect(glucTrend.evaluation.isImprovement).toBe(true);
    expect(glucTrend.evaluation.percentageChange).toBe(21.7);
    expect(glucTrend.evaluation.label).toBe('Health improved by 21.7%');
  });

  it('should accurately detect health deterioration and display "Health decreased by X%"', () => {
    // Cholesterol rises from 180 to 225
    const evalResult = evaluateMetricTrend('total_cholesterol', 180, 225);
    expect(evalResult.isImprovement).toBe(false);
    expect(evalResult.isDeterioration).toBe(true);
    // ((225 - 180) / 180) * 100 = 25%
    expect(evalResult.percentageChange).toBe(25.0);
    expect(evalResult.label).toBe('Health decreased by 25.0%');
  });

  it('should evaluate HDL Cholesterol (higher is better) correctly', () => {
    // HDL increases from 40 to 52
    const hdlImproved = evaluateMetricTrend('hdl_cholesterol', 40, 52);
    expect(hdlImproved.isImprovement).toBe(true);
    expect(hdlImproved.label).toBe('Health improved by 30.0%');

    // HDL drops from 50 to 35
    const hdlDecreased = evaluateMetricTrend('hdl_cholesterol', 50, 35);
    expect(hdlDecreased.isImprovement).toBe(false);
    expect(hdlDecreased.label).toBe('Health decreased by 30.0%');
  });

  it('should evaluate Blood Pressure trends correctly', () => {
    // Systolic BP drops from 140 to 118 (Hypertensive to Normal)
    const bpSystolic = evaluateMetricTrend('blood_pressure_systolic', 140, 118);
    expect(bpSystolic.isImprovement).toBe(true);
    // ((140 - 118) / 140) * 100 = 15.7%
    expect(bpSystolic.percentageChange).toBe(15.7);
    expect(bpSystolic.label).toBe('Health improved by 15.7%');

    // Systolic BP increases from 120 to 144
    const bpWorse = evaluateMetricTrend('blood_pressure_systolic', 120, 144);
    expect(bpWorse.isImprovement).toBe(false);
    expect(bpWorse.label).toBe('Health decreased by 20.0%');
  });

  it('should only compare the same metric with valid values and not combine different metrics', () => {
    const singleMetricReports = [
      { id: '1', date: '2026-01-01', extractedMetrics: [{ name: 'Hemoglobin', value: '13.5', unit: 'g/dL' }] },
      { id: '2', date: '2026-03-01', extractedMetrics: [{ name: 'Platelets', value: '250', unit: 'K/uL' }] },
    ];
    // No single metric appears in 2+ reports
    const trends = extractHealthTrends(singleMetricReports);
    expect(trends.length).toBe(0);
  });

  it('should sort timeline chronologically by report date', () => {
    const unsortedReports = [
      { id: '2', date: '2026-09-01', extractedMetrics: [{ name: 'Hemoglobin', value: '14.5', unit: 'g/dL' }] },
      { id: '1', date: '2026-01-01', extractedMetrics: [{ name: 'Hemoglobin', value: '12.0', unit: 'g/dL' }] },
      { id: '3', date: '2026-10-01', extractedMetrics: [{ name: 'Hemoglobin', value: '14.2', unit: 'g/dL' }] },
    ];
    const trends = extractHealthTrends(unsortedReports);
    expect(trends.length).toBe(1);
    expect(trends[0].points[0].reportDate).toBe('2026-01-01');
    expect(trends[0].points[1].reportDate).toBe('2026-09-01');
    expect(trends[0].points[2].reportDate).toBe('2026-10-01');
  });
});
