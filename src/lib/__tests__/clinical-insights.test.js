import { describe, it, expect } from 'vitest';
import {
  extractReportTestItems,
  evaluateItemStatus,
  formatReferenceRangeString,
  analyzeReportInsights,
  analyzeAllUserReports,
} from '../report-insights-analyzer';
import { CLINICAL_INSIGHTS_KB } from '../clinical-insights-kb';

describe('Deterministic Report Insights Analyzer', () => {
  it('correctly identifies abnormal High and Low values based on report reference ranges', () => {
    const mockReport = {
      id: 'rep-001',
      title: 'Complete Blood & Metabolic Panel',
      date: '2026-03-15',
      category: 'Lab Results',
      provider: 'Metro Diagnostics',
      extractedMetrics: [
        {
          name: 'Hemoglobin',
          value: 10.2,
          unit: 'g/dL',
          referenceRange: { low: 12.0, high: 16.5 },
        },
        {
          name: 'Fasting Blood Glucose',
          value: 145,
          unit: 'mg/dL',
          referenceRange: { low: 70, high: 99 },
        },
        {
          name: 'Total Cholesterol',
          value: 175,
          unit: 'mg/dL',
          referenceRange: { low: 120, high: 199 },
        },
      ],
    };

    const analysis = analyzeReportInsights(mockReport);
    expect(analysis).not.toBeNull();
    expect(analysis.totalTested).toBe(3);
    expect(analysis.abnormalCount).toBe(2);
    expect(analysis.normalCount).toBe(1);
    expect(analysis.lowCount).toBe(1); // Hemoglobin
    expect(analysis.highCount).toBe(1); // Glucose

    // Check Hemoglobin low analysis
    const hbFinding = analysis.findings.find((f) => f.name === 'Hemoglobin');
    expect(hbFinding).toBeDefined();
    expect(hbFinding.status).toBe('low');
    expect(hbFinding.isAbnormal).toBe(true);
    expect(hbFinding.meaning).toContain('Hemoglobin is the iron-rich protein');
    expect(hbFinding.commonCauses.length).toBeGreaterThan(0);
    expect(hbFinding.management.length).toBeGreaterThan(0);
    expect(hbFinding.whenToConsultDoctor.length).toBeGreaterThan(0);
    expect(hbFinding.sources.some((s) => s.name.includes('NIH') || s.name.includes('Mayo'))).toBe(true);

    // Check Glucose high analysis
    const glucoseFinding = analysis.findings.find((f) => f.name === 'Fasting Blood Glucose');
    expect(glucoseFinding).toBeDefined();
    expect(glucoseFinding.status).toBe('high');
    expect(glucoseFinding.isAbnormal).toBe(true);
    expect(glucoseFinding.meaning).toContain('Fasting glucose levels above the reference range');
    expect(glucoseFinding.commonCauses.some((c) => c.toLowerCase().includes('prediabetes') || c.toLowerCase().includes('insulin'))).toBe(true);

    // Check Total Cholesterol normal analysis
    const cholFinding = analysis.findings.find((f) => f.name === 'Total Cholesterol');
    expect(cholFinding).toBeDefined();
    expect(cholFinding.status).toBe('normal');
    expect(cholFinding.isAbnormal).toBe(false);
  });

  it('correctly parses reports with results dictionary and evaluates reference ranges', () => {
    const mockReport = {
      id: 'rep-002',
      title: 'Renal & Liver Profile',
      date: '2026-04-01',
      category: 'Lab Results',
      provider: 'City Health Lab',
      results: {
        'Serum Creatinine': '1.8 mg/dL',
        'SGPT': '68 U/L',
        'Vitamin D': '18 ng/mL',
      },
    };

    const analysis = analyzeReportInsights(mockReport);
    expect(analysis.totalTested).toBe(3);
    expect(analysis.abnormalCount).toBe(3); // Creatinine (high), SGPT (high), Vit D (low)

    const creatFinding = analysis.findings.find((f) => f.name === 'Serum Creatinine');
    expect(creatFinding.status).toBe('high');
    expect(creatFinding.sources.length).toBeGreaterThan(0);

    const vitDFinding = analysis.findings.find((f) => f.name === 'Vitamin D');
    expect(vitDFinding.status).toBe('low');
    expect(vitDFinding.meaning).toContain('Vitamin D');
  });

  it('aggregates multiple reports across a patient vault correctly', () => {
    const records = [
      {
        id: 'r1',
        title: 'Report 1',
        extractedMetrics: [
          { name: 'Hemoglobin', value: 14.0, unit: 'g/dL', referenceRange: { low: 12.0, high: 16.5 } },
        ],
      },
      {
        id: 'r2',
        title: 'Report 2',
        extractedMetrics: [
          { name: 'Uric Acid', value: 8.5, unit: 'mg/dL', referenceRange: { low: 3.0, high: 7.0 } },
          { name: 'WBC', value: 14500, unit: 'cells/uL', referenceRange: { low: 4000, high: 11000 } },
        ],
      },
    ];

    const allSummary = analyzeAllUserReports(records);
    expect(allSummary.reportsCount).toBe(2);
    expect(allSummary.totalParametersTested).toBe(3);
    expect(allSummary.totalAbnormalFindings).toBe(2);
    expect(allSummary.totalNormalFindings).toBe(1);
    expect(allSummary.allAbnormalFindings.length).toBe(2);
  });

  it('provides fallback insights for uncommon or custom parameters without throwing', () => {
    const customReport = {
      id: 'r-custom',
      title: 'Specialized Immunology Report',
      extractedMetrics: [
        {
          name: 'Custom Peptide X',
          value: 95,
          unit: 'ng/mL',
          referenceRange: { low: 10, high: 50 },
        },
      ],
    };

    const analysis = analyzeReportInsights(customReport);
    expect(analysis.findings.length).toBe(1);
    const item = analysis.findings[0];
    expect(item.status).toBe('high');
    expect(item.meaning).toContain('Custom Peptide X was measured at 95 ng/mL');
    expect(item.commonCauses.length).toBeGreaterThan(0);
    expect(item.management.length).toBeGreaterThan(0);
    expect(item.whenToConsultDoctor.length).toBeGreaterThan(0);
  });
});
