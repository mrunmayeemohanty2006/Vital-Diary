import { describe, it, expect } from 'vitest';
import {
  filterMedicalRecords,
  getRecordSearchInsights,
  highlightMatch,
} from '../record-search.js';
import {
  createPatientAccessSession,
  grantDoctorDirectQRAccess,
  getAuthorizedPatientData,
  endDoctorAccessSession,
} from '../access-session.js';

describe('Vital Diary — Doctor Portal Deterministic Search Records', () => {
  const patientMedicalRecords = [
    {
      id: 'doc_rec_01',
      title: 'Comprehensive Metabolic & Lipid Profile',
      category: 'Lab Results',
      provider: 'Quest Diagnostics Regional Lab',
      doctor: 'Dr. Sarah Jenkins, MD',
      date: '2026-08-20',
      fileName: 'metabolic_lipid_aug2026.pdf',
      fileSize: '1.4 MB',
      fileType: 'pdf',
      tags: ['glucose', 'cholesterol', 'fasting'],
      notes: 'Fasting patient panel. Fasting blood glucose is well controlled. Total cholesterol within target reference range.',
      extractedMetrics: [
        {
          name: 'Fasting Blood Glucose',
          rawName: 'Glucose',
          value: '88',
          displayValue: '88 mg/dL',
          unit: 'mg/dL',
          status: 'normal',
          referenceRange: { rawText: '70 - 99 mg/dL', low: 70, high: 99 },
        },
        {
          name: 'Total Cholesterol',
          rawName: 'Cholesterol, Total',
          value: '175',
          displayValue: '175 mg/dL',
          unit: 'mg/dL',
          status: 'normal',
          referenceRange: { rawText: '< 200 mg/dL', low: 120, high: 199 },
        },
        {
          name: 'Hemoglobin',
          rawName: 'Hemoglobin (Hgb)',
          value: '13.8',
          displayValue: '13.8 g/dL',
          unit: 'g/dL',
          status: 'normal',
          referenceRange: { rawText: '12.0 - 16.5 g/dL', low: 12.0, high: 16.5 },
        },
      ],
    },
    {
      id: 'doc_rec_02',
      title: 'Cardiology 12-Lead ECG Report',
      category: 'Cardiology',
      provider: 'Metro Heart Institute',
      doctor: 'Dr. Michael Chang, FACC',
      date: '2026-07-15',
      fileName: 'resting_ecg_trace_july2026.pdf',
      fileSize: '2.1 MB',
      fileType: 'pdf',
      tags: ['ecg', 'cardiology', 'blood-pressure'],
      notes: 'Normal sinus rhythm. Resting blood pressure recorded at 118/76 mmHg. No acute ischemic changes noted.',
      extractedMetrics: [
        {
          name: 'Blood Pressure',
          rawName: 'Blood Pressure',
          value: '118/76',
          displayValue: '118/76 mmHg',
          unit: 'mmHg',
          status: 'normal',
          referenceRange: { rawText: '< 120/80 mmHg' },
        },
        {
          name: 'Heart Rate',
          rawName: 'Pulse',
          value: '68',
          displayValue: '68 bpm',
          unit: 'bpm',
          status: 'normal',
          referenceRange: { rawText: '60 - 100 bpm' },
        },
      ],
    },
  ];

  it('allows doctor to search authorized patient records by keyword (e.g. "hemoglobin")', () => {
    const results = filterMedicalRecords(patientMedicalRecords, 'hemoglobin');
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('doc_rec_01');
    expect(results[0].title).toBe('Comprehensive Metabolic & Lipid Profile');

    const insights = getRecordSearchInsights(results[0], 'hemoglobin');
    expect(insights.hasMatch).toBe(true);
    expect(insights.matchedMetrics.length).toBe(1);
    expect(insights.matchedMetrics[0].name).toBe('Hemoglobin');
    expect(insights.matchedMetrics[0].displayValue).toBe('13.8 g/dL');
    expect(insights.matchedMetrics[0].status).toBe('normal');
  });

  it('allows doctor to search authorized patient records by biomarker value (e.g. "118/76" or "88")', () => {
    const bpResults = filterMedicalRecords(patientMedicalRecords, '118/76');
    expect(bpResults.length).toBe(1);
    expect(bpResults[0].id).toBe('doc_rec_02');

    const glucoseResults = filterMedicalRecords(patientMedicalRecords, '88');
    expect(glucoseResults.length).toBe(1);
    expect(glucoseResults[0].id).toBe('doc_rec_01');
  });

  it('allows doctor to search clinical notes and report categories', () => {
    const notesResults = filterMedicalRecords(patientMedicalRecords, 'sinus rhythm');
    expect(notesResults.length).toBe(1);
    expect(notesResults[0].id).toBe('doc_rec_02');

    const categoryResults = filterMedicalRecords(patientMedicalRecords, 'Cardiology', { category: 'Cardiology' });
    expect(categoryResults.length).toBe(1);
    expect(categoryResults[0].id).toBe('doc_rec_02');
  });

  it('strictly blocks search and clears records when doctor access session is expired or revoked', async () => {
    const patientUser = {
      id: 'patient-test-search-99',
      name: 'Alice Henderson',
      email: 'alice.henderson@example.com',
    };

    const session = await createPatientAccessSession({
      patient: patientUser,
      records: patientMedicalRecords,
      durationMinutes: 30,
    });

    const doctorUser = {
      id: 'doc-search-77',
      name: 'Dr. Gregory House, MD',
    };

    // Doctor scans and gains active access
    await grantDoctorDirectQRAccess(session.sessionId, doctorUser);
    const authorized = await getAuthorizedPatientData(session.sessionId);
    expect(authorized.patient.name).toBe('Alice Henderson');
    expect(authorized.records.length).toBe(2);

    // Doctor can search while authorized
    const searchDuringSession = filterMedicalRecords(authorized.records, 'glucose');
    expect(searchDuringSession.length).toBe(1);
    expect(searchDuringSession[0].title).toBe('Comprehensive Metabolic & Lipid Profile');

    // End / expire session
    await endDoctorAccessSession(session.sessionId);

    // Verification after session end: querying patient data should throw or return unauthorized/empty
    await expect(getAuthorizedPatientData(session.sessionId)).rejects.toThrow();
  });
});
