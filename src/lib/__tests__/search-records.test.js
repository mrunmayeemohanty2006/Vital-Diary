import { describe, it, expect } from 'vitest';
import {
  filterMedicalRecords,
  getRecordSearchInsights,
  extractTextSnippet,
  highlightMatch,
} from '../record-search.js';

describe('Vital Diary — Deterministic Search Records', () => {
  const sampleRecords = [
    {
      id: 'rec_cbc_01',
      title: 'Complete Blood Count (CBC) Panel',
      category: 'Lab Results',
      provider: 'Quest Diagnostics',
      doctor: 'Dr. Sarah Jenkins, MD',
      date: '2026-09-15',
      fileName: 'cbc_panel_sept2026.pdf',
      fileSize: '1.2 MB',
      fileType: 'pdf',
      tags: ['blood', 'routine', 'annual-checkup'],
      notes: 'Patient routine examination. Hemoglobin within expected physiological reference interval. White blood cell count stable.',
      extractedMetrics: [
        {
          name: 'Hemoglobin',
          rawName: 'Hemoglobin (Hgb)',
          value: '14.2',
          displayValue: '14.2 g/dL',
          unit: 'g/dL',
          status: 'normal',
          referenceRange: { rawText: '13.5 - 17.5 g/dL', low: 13.5, high: 17.5 },
        },
        {
          name: 'Platelets',
          rawName: 'Platelet Count',
          value: '260',
          displayValue: '260 K/uL',
          unit: 'K/uL',
          status: 'normal',
          referenceRange: { rawText: '150 - 450 K/uL', low: 150, high: 450 },
        },
        {
          name: 'Hematocrit',
          rawName: 'HCT',
          value: '42.1',
          displayValue: '42.1 %',
          unit: '%',
          status: 'normal',
          referenceRange: { rawText: '38.8 - 50.0 %', low: 38.8, high: 50.0 },
        },
      ],
      results: {
        'WBC': '6.4 K/uL',
        'RBC': '4.8 M/uL',
      },
    },
    {
      id: 'rec_lipid_02',
      title: 'Comprehensive Lipid & Metabolic Panel',
      category: 'Lab Results',
      provider: 'LabCorp Clinical',
      doctor: 'Dr. David Zhang, MD',
      date: '2026-08-10',
      fileName: 'lipid_metabolic_panel.pdf',
      fileSize: '850 KB',
      fileType: 'pdf',
      tags: ['cholesterol', 'fasting', 'metabolic'],
      notes: 'Fasting lipid profile. Elevated LDL cholesterol noted, lifestyle modification recommended. Fasting glucose is optimal.',
      extractedMetrics: [
        {
          name: 'Fasting Blood Glucose',
          rawName: 'Glucose',
          value: '92',
          displayValue: '92 mg/dL',
          unit: 'mg/dL',
          status: 'normal',
          referenceRange: { rawText: '70 - 99 mg/dL', low: 70, high: 99 },
        },
        {
          name: 'Total Cholesterol',
          rawName: 'Total Cholesterol',
          value: '215',
          displayValue: '215 mg/dL',
          unit: 'mg/dL',
          status: 'high',
          referenceRange: { rawText: '< 200 mg/dL', low: 0, high: 200 },
        },
        {
          name: 'HDL Cholesterol',
          rawName: 'HDL-C',
          value: '54',
          displayValue: '54 mg/dL',
          unit: 'mg/dL',
          status: 'normal',
          referenceRange: { rawText: '> 40 mg/dL', low: 40, high: 100 },
        },
      ],
    },
    {
      id: 'rec_cardio_03',
      title: '12-Lead Electrocardiogram (ECG) Report',
      category: 'Cardiology',
      provider: 'City Heart Center',
      doctor: 'Dr. Emily Watson, FACC',
      date: '2026-07-22',
      fileName: 'resting_ecg_trace.pdf',
      fileSize: '2.4 MB',
      fileType: 'pdf',
      tags: ['cardio', 'ecg', 'heart'],
      notes: 'Normal sinus rhythm, heart rate 72 bpm. Blood Pressure measured 120/80 mmHg in resting position.',
      extractedMetrics: [
        {
          name: 'Blood Pressure',
          rawName: 'Blood Pressure',
          value: '120/80',
          displayValue: '120/80 mmHg',
          unit: 'mmHg',
          status: 'normal',
          referenceRange: { rawText: '< 120/80 mmHg' },
        },
        {
          name: 'Heart Rate',
          rawName: 'Pulse Rate',
          value: '72',
          displayValue: '72 bpm',
          unit: 'bpm',
          status: 'normal',
          referenceRange: { rawText: '60 - 100 bpm', low: 60, high: 100 },
        },
      ],
    },
  ];

  it('should find records by extracted biomarker name (e.g. "hemoglobin")', () => {
    const results = filterMedicalRecords(sampleRecords, 'hemoglobin');
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('rec_cbc_01');
    expect(results[0].title).toBe('Complete Blood Count (CBC) Panel');

    const insights = getRecordSearchInsights(results[0], 'hemoglobin');
    expect(insights.hasMatch).toBe(true);
    expect(insights.matchedMetrics.length).toBe(1);
    expect(insights.matchedMetrics[0].name).toBe('Hemoglobin');
    expect(insights.matchedMetrics[0].displayValue).toBe('14.2 g/dL');
    expect(insights.matchedMetrics[0].status).toBe('normal');
    expect(insights.primaryValue?.value).toBe('14.2 g/dL');
  });

  it('should find records by biomarker measurement value (e.g. "120/80" or "215")', () => {
    const bpResults = filterMedicalRecords(sampleRecords, '120/80');
    expect(bpResults.length).toBe(1);
    expect(bpResults[0].id).toBe('rec_cardio_03');

    const bpInsights = getRecordSearchInsights(bpResults[0], '120/80');
    expect(bpInsights.matchedMetrics.some((m) => m.name === 'Blood Pressure')).toBe(true);

    const cholResults = filterMedicalRecords(sampleRecords, '215');
    expect(cholResults.length).toBe(1);
    expect(cholResults[0].id).toBe('rec_lipid_02');
  });

  it('should search across clinical notes and generate matched contextual snippet', () => {
    const results = filterMedicalRecords(sampleRecords, 'sinus rhythm');
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('rec_cardio_03');

    const insights = getRecordSearchInsights(results[0], 'sinus rhythm');
    expect(insights.matchedSnippet).toContain('Normal sinus rhythm');
  });

  it('should search across physician, provider, and category', () => {
    const docResults = filterMedicalRecords(sampleRecords, 'Sarah Jenkins');
    expect(docResults.length).toBe(1);
    expect(docResults[0].id).toBe('rec_cbc_01');

    const provResults = filterMedicalRecords(sampleRecords, 'LabCorp');
    expect(provResults.length).toBe(1);
    expect(provResults[0].id).toBe('rec_lipid_02');

    const catResults = filterMedicalRecords(sampleRecords, 'Cardiology');
    expect(catResults.length).toBe(1);
    expect(catResults[0].id).toBe('rec_cardio_03');
  });

  it('should search across PDF filenames and medical tags', () => {
    const pdfResults = filterMedicalRecords(sampleRecords, 'cbc_panel');
    expect(pdfResults.length).toBe(1);
    expect(pdfResults[0].fileName).toBe('cbc_panel_sept2026.pdf');

    const tagResults = filterMedicalRecords(sampleRecords, 'cholesterol');
    expect(tagResults.length).toBe(1);
    expect(tagResults[0].id).toBe('rec_lipid_02');
  });

  it('should combine keyword search with category filter', () => {
    // Both rec_cbc_01 and rec_lipid_02 are in 'Lab Results'
    const results = filterMedicalRecords(sampleRecords, 'Glucose', {
      category: 'Lab Results',
    });
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('rec_lipid_02');

    const mismatchCategory = filterMedicalRecords(sampleRecords, 'Glucose', {
      category: 'Cardiology',
    });
    expect(mismatchCategory.length).toBe(0);
  });

  it('should generate text snippets with ellipsis accurately', () => {
    const fullText = 'The patient presented for an annual checkup. Hemoglobin levels were assessed and determined to be normal.';
    const snippet = extractTextSnippet(fullText, 'Hemoglobin', 20);
    expect(snippet).toContain('Hemoglobin');
    expect(snippet.startsWith('...')).toBe(true);
  });

  it('should safely highlight matched keywords without throwing errors', () => {
    const highlighted = highlightMatch('Hemoglobin Test Result', 'hemoglobin');
    expect(highlighted).toBeDefined();
  });
});
