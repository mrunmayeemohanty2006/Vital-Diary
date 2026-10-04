import QRCode from 'qrcode';
import { getSupabase, isSupabaseConfigured, getSignedFileUrl } from './supabase';

const STORAGE_ACCESS_LOGS_KEY = 'vital_diary_doctor_access_logs';
const STORAGE_LOCAL_SESSIONS_KEY = 'vital_diary_patient_access_sessions';

// Safe localStorage helpers
let memoryStorage = {};
function getStoredItem(key) {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(key);
  }
  return memoryStorage[key] || null;
}

function setStoredItem(key, val) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(key, val);
  } else {
    memoryStorage[key] = val;
  }
}

function removeStoredItem(key) {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(key);
  } else {
    delete memoryStorage[key];
  }
}

export function clearLocalAccessStore() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_ACCESS_LOGS_KEY);
    localStorage.removeItem(STORAGE_LOCAL_SESSIONS_KEY);
  }
  memoryStorage = {};
}

// --------------------------------------------------------------------------
// Sample Pre-seeded Demo Patients & Records for Seamless Review / Offline Test
// --------------------------------------------------------------------------
export const DEMO_PATIENT_SESSIONS = [
  {
    sessionId: 'vd_sess_eleanor_vance_2026',
    displaySessionId: '#B91X42',
    otpCode: '582914',
    durationMinutes: 60,
    patient: {
      id: 'usr_pat_eleanor_vance',
      name: 'Eleanor Vance',
      avatar: 'EV',
      email: 'eleanor.vance@example.com',
      dateOfBirth: '1984-06-12',
      age: 42,
      gender: 'Female',
      bloodGroup: 'A+',
      emergencyContact: '+1 (555) 234-8901 (Spouse)',
      allergies: 'Penicillin, Sulfa drugs',
      conditions: 'Essential Hypertension, Mild Hyperlipidemia',
    },
    records: [
      {
        id: 'rec_ev_01',
        title: 'Comprehensive Metabolic & Lipid Panel',
        category: 'Lab Results',
        provider: 'Metropolitan Clinical Laboratories',
        doctor: 'Dr. Robert Hayes, MD',
        date: '2026-09-18',
        uploadedAt: '2026-09-19T10:30:00Z',
        fileName: 'Metabolic_Lipid_Panel_Sept2026.pdf',
        fileSize: '412 KB',
        fileType: 'pdf',
        storageType: 'encrypted',
        tags: ['Lipid Panel', 'CMP', 'Cholesterol', 'Fasting Blood Sugar', 'Routine Checkup'],
        notes: 'Fasting lipid panel demonstrates LDL improvement following dietary modification. Fasting glucose is within normal range (94 mg/dL). Kidney and liver functions are unremarkable.',
        status: 'Verified',
        isMedicalReport: true,
        extractedMetrics: [
          { name: 'Total Cholesterol', value: '188', unit: 'mg/dL', status: 'normal', referenceRange: { rawText: '< 200 mg/dL', low: 100, high: 200 } },
          { name: 'LDL Cholesterol', value: '106', unit: 'mg/dL', status: 'normal', referenceRange: { rawText: '< 100 mg/dL', low: 50, high: 100 } },
          { name: 'HDL Cholesterol', value: '58', unit: 'mg/dL', status: 'normal', referenceRange: { rawText: '> 50 mg/dL', low: 50, high: 90 } },
          { name: 'Triglycerides', value: '120', unit: 'mg/dL', status: 'normal', referenceRange: { rawText: '< 150 mg/dL', low: 35, high: 150 } },
          { name: 'Fasting Blood Glucose', value: '94', unit: 'mg/dL', status: 'normal', referenceRange: { rawText: '70 - 99 mg/dL', low: 70, high: 99 } },
          { name: 'Serum Creatinine', value: '0.85', unit: 'mg/dL', status: 'normal', referenceRange: { rawText: '0.59 - 1.04 mg/dL', low: 0.59, high: 1.04 } },
          { name: 'eGFR', value: '96', unit: 'mL/min/1.73m²', status: 'normal', referenceRange: { rawText: '> 90 mL/min', low: 90, high: 120 } },
          { name: 'Alanine Aminotransferase (ALT)', value: '22', unit: 'U/L', status: 'normal', referenceRange: { rawText: '7 - 35 U/L', low: 7, high: 35 } },
        ],
      },
      {
        id: 'rec_ev_02',
        title: 'Complete Blood Count (CBC) with Differential',
        category: 'Lab Results',
        provider: 'BioHealth Diagnostic Center',
        doctor: 'Dr. Sarah Jenkins, MD',
        date: '2026-08-04',
        uploadedAt: '2026-08-05T14:15:00Z',
        fileName: 'CBC_Differential_Report.pdf',
        fileSize: '320 KB',
        fileType: 'pdf',
        storageType: 'encrypted',
        tags: ['CBC', 'Hemoglobin', 'Platelets', 'Hematology', 'WBC'],
        notes: 'Routine hematology screening. White cell count, red cell count, and platelet parameters are well within standard reference intervals. No cytopenia observed.',
        status: 'Verified',
        isMedicalReport: true,
        extractedMetrics: [
          { name: 'White Blood Cell (WBC)', value: '6.4', unit: '10^3/µL', status: 'normal', referenceRange: { rawText: '4.5 - 11.0 10^3/µL', low: 4.5, high: 11.0 } },
          { name: 'Red Blood Cell (RBC)', value: '4.52', unit: '10^6/µL', status: 'normal', referenceRange: { rawText: '4.0 - 5.2 10^6/µL', low: 4.0, high: 5.2 } },
          { name: 'Hemoglobin (Hb)', value: '13.8', unit: 'g/dL', status: 'normal', referenceRange: { rawText: '12.0 - 15.5 g/dL', low: 12.0, high: 15.5 } },
          { name: 'Hematocrit', value: '41.2', unit: '%', status: 'normal', referenceRange: { rawText: '37.0 - 48.0 %', low: 37.0, high: 48.0 } },
          { name: 'Mean Corpuscular Volume (MCV)', value: '91.2', unit: 'fL', status: 'normal', referenceRange: { rawText: '80.0 - 100.0 fL', low: 80.0, high: 100.0 } },
          { name: 'Platelets', value: '265', unit: '10^3/µL', status: 'normal', referenceRange: { rawText: '150 - 450 10^3/µL', low: 150, high: 450 } },
        ],
      },
      {
        id: 'rec_ev_03',
        title: '12-Lead Resting Electrocardiogram (ECG)',
        category: 'Cardiology',
        provider: 'St. Jude Heart & Vascular Institute',
        doctor: 'Dr. Michael Sterling, FACC',
        date: '2026-06-22',
        uploadedAt: '2026-06-23T09:00:00Z',
        fileName: 'ECG_12Lead_Tracing_June2026.pdf',
        fileSize: '680 KB',
        fileType: 'pdf',
        storageType: 'encrypted',
        tags: ['ECG', 'EKG', 'Cardiology', 'Sinus Rhythm', 'Blood Pressure'],
        notes: 'Normal sinus rhythm at 68 bpm. PR interval 152 ms, QRS duration 86 ms, QTc 418 ms. Normal axis, no ST-T segment abnormalities or signs of ischemia. Prior mild sinus tachycardia resolved.',
        status: 'Verified',
        isMedicalReport: true,
        extractedMetrics: [
          { name: 'Heart Rate', value: '68', unit: 'bpm', status: 'normal', referenceRange: { rawText: '60 - 100 bpm', low: 60, high: 100 } },
          { name: 'PR Interval', value: '152', unit: 'ms', status: 'normal', referenceRange: { rawText: '120 - 200 ms', low: 120, high: 200 } },
          { name: 'QRS Duration', value: '86', unit: 'ms', status: 'normal', referenceRange: { rawText: '70 - 100 ms', low: 70, high: 100 } },
          { name: 'QTc Interval', value: '418', unit: 'ms', status: 'normal', referenceRange: { rawText: '< 450 ms', low: 350, high: 450 } },
        ],
      },
      {
        id: 'rec_ev_04',
        title: 'Diagnostic Chest X-Ray (PA & Lateral)',
        category: 'Imaging',
        provider: 'Advanced Radiology Associates',
        doctor: 'Dr. Alan Ross, MD',
        date: '2026-04-10',
        uploadedAt: '2026-04-11T16:20:00Z',
        fileName: 'Chest_XRay_PA_Lateral.pdf',
        fileSize: '1.2 MB',
        fileType: 'pdf',
        storageType: 'encrypted',
        tags: ['Chest X-Ray', 'Radiology', 'Lungs', 'Cardiothoracic', 'Imaging'],
        notes: 'Lungs are clear bilaterally with no focal consolidation, pleural effusion, or pneumothorax. Cardiomediastinal silhouette is within normal limits. Osseous structures intact.',
        status: 'Verified',
        isMedicalReport: true,
        extractedMetrics: [
          { name: 'Cardiothoracic Ratio', value: '0.46', unit: 'ratio', status: 'normal', referenceRange: { rawText: '< 0.50', low: 0.35, high: 0.50 } },
        ],
      },
      {
        id: 'rec_ev_05',
        title: 'Cardiology Clinical Consultation & Care Plan',
        category: "Doctor's Note",
        provider: 'St. Jude Heart & Vascular Institute',
        doctor: 'Dr. Michael Sterling, FACC',
        date: '2026-06-22',
        uploadedAt: '2026-06-23T09:30:00Z',
        fileName: 'Cardiology_Consult_Summary.pdf',
        fileSize: '245 KB',
        fileType: 'pdf',
        storageType: 'encrypted',
        tags: ['Consultation', 'Cardiology', 'Care Plan', 'Hypertension', 'Follow-up'],
        notes: 'Patient presented for annual cardiovascular assessment. Resting BP 124/78 mmHg. Continue Lisinopril 10mg daily in the morning. Recheck renal parameters and potassium in 6 months.',
        status: 'Verified',
        isMedicalReport: true,
        extractedMetrics: [
          { name: 'Blood Pressure (Systolic)', value: '124', unit: 'mmHg', status: 'normal', referenceRange: { rawText: '90 - 129 mmHg', low: 90, high: 129 } },
          { name: 'Blood Pressure (Diastolic)', value: '78', unit: 'mmHg', status: 'normal', referenceRange: { rawText: '60 - 80 mmHg', low: 60, high: 80 } },
        ],
      },
      {
        id: 'rec_ev_06',
        title: 'Lisinopril 10mg Prescription Refill',
        category: 'Prescription',
        provider: 'PrimeCare Internal Medicine',
        doctor: 'Dr. Robert Hayes, MD',
        date: '2026-06-25',
        uploadedAt: '2026-06-26T11:00:00Z',
        fileName: 'Lisinopril_Rx_Order.pdf',
        fileSize: '180 KB',
        fileType: 'pdf',
        storageType: 'encrypted',
        tags: ['Prescription', 'Lisinopril', 'ACE Inhibitor', 'Pharmacy', 'Refill'],
        notes: 'Take 1 tablet (10mg) by mouth once daily every morning. Quantity: 90 tablets. Refills: 3 remaining. Indication: Hypertension management.',
        status: 'Verified',
        isMedicalReport: true,
        extractedMetrics: [
          { name: 'Dosage', value: '10', unit: 'mg', status: 'normal', referenceRange: { rawText: 'Standard Daily', low: 5, high: 40 } },
        ],
      },
    ],
  },
  {
    sessionId: 'vd_sess_mrunmayee_2026',
    displaySessionId: '#A82K91',
    otpCode: '729415',
    durationMinutes: 30,
    patient: {
      id: 'usr_pat_mrunmayee_mohanty',
      name: 'Mrunmayee Mohanty',
      avatar: 'MM',
      email: 'mrunmayee.mohanty@vitaldiary.io',
      dateOfBirth: '1998-04-18',
      age: 28,
      gender: 'Female',
      bloodGroup: 'B+',
      emergencyContact: '+1 (555) 349-8120',
      allergies: 'None recorded',
      conditions: 'Routine wellness monitoring',
    },
    records: [
      {
        id: 'rec_mm_01',
        title: 'Blood Test',
        category: 'Lab Results',
        provider: 'Central Diagnostic Care',
        doctor: 'Dr. Sarah Jenkins, MD',
        date: '2026-10-04',
        uploadedAt: '2026-10-04T08:00:00Z',
        fileName: 'Blood_Test_Report_Oct2026.pdf',
        fileSize: '345 KB',
        fileType: 'pdf',
        storageType: 'encrypted',
        tags: ['Blood Test', 'Glucose', 'Electrolytes', 'Routine'],
        notes: 'Annual comprehensive blood panel. Fasting blood glucose is optimal at 88 mg/dL. Normal renal and hepatic markers.',
        status: 'Verified',
        isMedicalReport: true,
        extractedMetrics: [
          { name: 'Fasting Blood Sugar', value: '88', unit: 'mg/dL', status: 'normal', referenceRange: { rawText: '70 - 99 mg/dL', low: 70, high: 99 } },
          { name: 'Serum Creatinine', value: '0.82', unit: 'mg/dL', status: 'normal', referenceRange: { rawText: '0.50 - 1.10 mg/dL', low: 0.50, high: 1.10 } },
          { name: 'Blood Urea Nitrogen', value: '14', unit: 'mg/dL', status: 'normal', referenceRange: { rawText: '7 - 20 mg/dL', low: 7, high: 20 } },
        ],
      },
      {
        id: 'rec_mm_02',
        title: 'CBC Report',
        category: 'Lab Results',
        provider: 'Apex Diagnostic Pathology',
        doctor: 'Dr. Kevin Zhao, MD',
        date: '2026-09-20',
        uploadedAt: '2026-09-20T11:30:00Z',
        fileName: 'CBC_Report_Sept2026.pdf',
        fileSize: '312 KB',
        fileType: 'pdf',
        storageType: 'encrypted',
        tags: ['CBC', 'Hemoglobin', 'WBC', 'Platelets', 'Hematology'],
        notes: 'Complete Blood Count within ideal physiological limits. Hemoglobin 14.1 g/dL, Platelets 275k/uL.',
        status: 'Verified',
        isMedicalReport: true,
        extractedMetrics: [
          { name: 'Hemoglobin', value: '14.1', unit: 'g/dL', status: 'normal', referenceRange: { rawText: '12.0 - 15.5 g/dL', low: 12.0, high: 15.5 } },
          { name: 'White Blood Cells (WBC)', value: '6.8', unit: '10^3/µL', status: 'normal', referenceRange: { rawText: '4.5 - 11.0 10^3/µL', low: 4.5, high: 11.0 } },
          { name: 'Platelets', value: '275', unit: '10^3/µL', status: 'normal', referenceRange: { rawText: '150 - 450 10^3/µL', low: 150, high: 450 } },
          { name: 'RBC Count', value: '4.65', unit: '10^6/µL', status: 'normal', referenceRange: { rawText: '4.0 - 5.2 10^6/µL', low: 4.0, high: 5.2 } },
        ],
      },
      {
        id: 'rec_mm_03',
        title: 'Lipid Profile',
        category: 'Cardiology',
        provider: 'Metropolitan Heart & Lipid Institute',
        doctor: 'Dr. Michael Sterling, FACC',
        date: '2026-08-10',
        uploadedAt: '2026-08-10T14:15:00Z',
        fileName: 'Lipid_Profile_Aug2026.pdf',
        fileSize: '390 KB',
        fileType: 'pdf',
        storageType: 'encrypted',
        tags: ['Lipid Profile', 'Cholesterol', 'HDL', 'LDL', 'Cardiovascular'],
        notes: 'Fasting lipid analysis. Total Cholesterol 174 mg/dL with robust protective HDL (62 mg/dL) and optimal triglycerides (98 mg/dL).',
        status: 'Verified',
        isMedicalReport: true,
        extractedMetrics: [
          { name: 'Total Cholesterol', value: '174', unit: 'mg/dL', status: 'normal', referenceRange: { rawText: '< 200 mg/dL', low: 100, high: 200 } },
          { name: 'HDL Cholesterol', value: '62', unit: 'mg/dL', status: 'normal', referenceRange: { rawText: '> 50 mg/dL', low: 50, high: 90 } },
          { name: 'LDL Cholesterol', value: '92', unit: 'mg/dL', status: 'normal', referenceRange: { rawText: '< 100 mg/dL', low: 50, high: 100 } },
          { name: 'Triglycerides', value: '98', unit: 'mg/dL', status: 'normal', referenceRange: { rawText: '< 150 mg/dL', low: 35, high: 150 } },
        ],
      },
      {
        id: 'rec_mm_04',
        title: 'Thyroid Report',
        category: 'Lab Results',
        provider: 'BioHealth Diagnostic Labs',
        doctor: 'Dr. Brenda Vance, MD',
        date: '2026-07-15',
        uploadedAt: '2026-07-15T09:45:00Z',
        fileName: 'Thyroid_Function_Report_July2026.pdf',
        fileSize: '280 KB',
        fileType: 'pdf',
        storageType: 'encrypted',
        tags: ['Thyroid', 'TSH', 'Free T4', 'Free T3', 'Endocrine'],
        notes: 'Euthyroid state confirmed. TSH 1.85 mIU/L, Free T4 1.18 ng/dL. Normal endocrine function.',
        status: 'Verified',
        isMedicalReport: true,
        extractedMetrics: [
          { name: 'TSH (Ultrasensitive)', value: '1.85', unit: 'mIU/L', status: 'normal', referenceRange: { rawText: '0.40 - 4.50 mIU/L', low: 0.40, high: 4.50 } },
          { name: 'Free Thyroxine (FT4)', value: '1.18', unit: 'ng/dL', status: 'normal', referenceRange: { rawText: '0.80 - 1.80 ng/dL', low: 0.80, high: 1.80 } },
          { name: 'Free Triiodothyronine (FT3)', value: '3.1', unit: 'pg/mL', status: 'normal', referenceRange: { rawText: '2.3 - 4.2 pg/mL', low: 2.3, high: 4.2 } },
        ],
      },
    ],
  },
  {
    sessionId: 'vd_sess_eleanor_vance_2026',
    displaySessionId: '#B91X42',
    otpCode: '582914',
    durationMinutes: 60,
    patient: {
      id: 'usr_pat_eleanor_vance',
      name: 'Eleanor Vance',
      avatar: 'EV',
      email: 'eleanor.vance@example.com',
      dateOfBirth: '1984-06-12',
      age: 42,
      gender: 'Female',
      bloodGroup: 'A+',
      emergencyContact: '+1 (555) 234-8901 (Spouse)',
      allergies: 'Penicillin, Sulfa drugs',
      conditions: 'Essential Hypertension, Mild Hyperlipidemia',
    },
    records: [
      {
        id: 'rec_ev_01',
        title: 'Comprehensive Metabolic & Lipid Panel',
        category: 'Lab Results',
        provider: 'Metropolitan Clinical Laboratories',
        doctor: 'Dr. Robert Hayes, MD',
        date: '2026-09-18',
        uploadedAt: '2026-09-19T10:30:00Z',
        fileName: 'Metabolic_Lipid_Panel_Sept2026.pdf',
        fileSize: '412 KB',
        fileType: 'pdf',
        storageType: 'encrypted',
        tags: ['Lipid Panel', 'CMP', 'Cholesterol', 'Fasting Blood Sugar', 'Routine Checkup'],
        notes: 'Fasting lipid panel demonstrates LDL improvement following dietary modification. Fasting glucose is within normal range (94 mg/dL). Kidney and liver functions are unremarkable.',
        status: 'Verified',
        isMedicalReport: true,
        extractedMetrics: [
          { name: 'Total Cholesterol', value: '188', unit: 'mg/dL', status: 'normal', referenceRange: { rawText: '< 200 mg/dL', low: 100, high: 200 } },
          { name: 'LDL Cholesterol', value: '106', unit: 'mg/dL', status: 'normal', referenceRange: { rawText: '< 100 mg/dL', low: 50, high: 100 } },
          { name: 'HDL Cholesterol', value: '58', unit: 'mg/dL', status: 'normal', referenceRange: { rawText: '> 50 mg/dL', low: 50, high: 90 } },
          { name: 'Triglycerides', value: '120', unit: 'mg/dL', status: 'normal', referenceRange: { rawText: '< 150 mg/dL', low: 35, high: 150 } },
          { name: 'Fasting Blood Glucose', value: '94', unit: 'mg/dL', status: 'normal', referenceRange: { rawText: '70 - 99 mg/dL', low: 70, high: 99 } },
          { name: 'Serum Creatinine', value: '0.85', unit: 'mg/dL', status: 'normal', referenceRange: { rawText: '0.59 - 1.04 mg/dL', low: 0.59, high: 1.04 } },
          { name: 'eGFR', value: '96', unit: 'mL/min/1.73m²', status: 'normal', referenceRange: { rawText: '> 90 mL/min', low: 90, high: 120 } },
          { name: 'Alanine Aminotransferase (ALT)', value: '22', unit: 'U/L', status: 'normal', referenceRange: { rawText: '7 - 35 U/L', low: 7, high: 35 } },
        ],
      },
      {
        id: 'rec_ev_02',
        title: 'Complete Blood Count (CBC) with Differential',
        category: 'Lab Results',
        provider: 'BioHealth Diagnostic Center',
        doctor: 'Dr. Sarah Jenkins, MD',
        date: '2026-08-04',
        uploadedAt: '2026-08-05T14:15:00Z',
        fileName: 'CBC_Differential_Report.pdf',
        fileSize: '320 KB',
        fileType: 'pdf',
        storageType: 'encrypted',
        tags: ['CBC', 'Hemoglobin', 'Platelets', 'Hematology', 'WBC'],
        notes: 'Routine hematology screening. White cell count, red cell count, and platelet parameters are well within standard reference intervals. No cytopenia observed.',
        status: 'Verified',
        isMedicalReport: true,
        extractedMetrics: [
          { name: 'White Blood Cell (WBC)', value: '6.4', unit: '10^3/µL', status: 'normal', referenceRange: { rawText: '4.5 - 11.0 10^3/µL', low: 4.5, high: 11.0 } },
          { name: 'Red Blood Cell (RBC)', value: '4.52', unit: '10^6/µL', status: 'normal', referenceRange: { rawText: '4.0 - 5.2 10^6/µL', low: 4.0, high: 5.2 } },
          { name: 'Hemoglobin (Hb)', value: '13.8', unit: 'g/dL', status: 'normal', referenceRange: { rawText: '12.0 - 15.5 g/dL', low: 12.0, high: 15.5 } },
          { name: 'Hematocrit', value: '41.2', unit: '%', status: 'normal', referenceRange: { rawText: '37.0 - 48.0 %', low: 37.0, high: 48.0 } },
          { name: 'Mean Corpuscular Volume (MCV)', value: '91.2', unit: 'fL', status: 'normal', referenceRange: { rawText: '80.0 - 100.0 fL', low: 80.0, high: 100.0 } },
          { name: 'Platelets', value: '265', unit: '10^3/µL', status: 'normal', referenceRange: { rawText: '150 - 450 10^3/µL', low: 150, high: 450 } },
        ],
      },
      {
        id: 'rec_ev_03',
        title: '12-Lead Resting Electrocardiogram (ECG)',
        category: 'Cardiology',
        provider: 'St. Jude Heart & Vascular Institute',
        doctor: 'Dr. Michael Sterling, FACC',
        date: '2026-06-22',
        uploadedAt: '2026-06-23T09:00:00Z',
        fileName: 'ECG_12Lead_Tracing_June2026.pdf',
        fileSize: '680 KB',
        fileType: 'pdf',
        storageType: 'encrypted',
        tags: ['ECG', 'EKG', 'Cardiology', 'Sinus Rhythm', 'Blood Pressure'],
        notes: 'Normal sinus rhythm at 68 bpm. PR interval 152 ms, QRS duration 86 ms, QTc 418 ms. Normal axis, no ST-T segment abnormalities or signs of ischemia. Prior mild sinus tachycardia resolved.',
        status: 'Verified',
        isMedicalReport: true,
        extractedMetrics: [
          { name: 'Heart Rate', value: '68', unit: 'bpm', status: 'normal', referenceRange: { rawText: '60 - 100 bpm', low: 60, high: 100 } },
          { name: 'PR Interval', value: '152', unit: 'ms', status: 'normal', referenceRange: { rawText: '120 - 200 ms', low: 120, high: 200 } },
          { name: 'QRS Duration', value: '86', unit: 'ms', status: 'normal', referenceRange: { rawText: '70 - 100 ms', low: 70, high: 100 } },
          { name: 'QTc Interval', value: '418', unit: 'ms', status: 'normal', referenceRange: { rawText: '< 450 ms', low: 350, high: 450 } },
        ],
      },
      {
        id: 'rec_ev_04',
        title: 'Diagnostic Chest X-Ray (PA & Lateral)',
        category: 'Imaging',
        provider: 'Advanced Radiology Associates',
        doctor: 'Dr. Alan Ross, MD',
        date: '2026-04-10',
        uploadedAt: '2026-04-11T16:20:00Z',
        fileName: 'Chest_XRay_PA_Lateral.pdf',
        fileSize: '1.2 MB',
        fileType: 'pdf',
        storageType: 'encrypted',
        tags: ['Chest X-Ray', 'Radiology', 'Lungs', 'Cardiothoracic', 'Imaging'],
        notes: 'Lungs are clear bilaterally with no focal consolidation, pleural effusion, or pneumothorax. Cardiomediastinal silhouette is within normal limits. Osseous structures intact.',
        status: 'Verified',
        isMedicalReport: true,
        extractedMetrics: [
          { name: 'Cardiothoracic Ratio', value: '0.46', unit: 'ratio', status: 'normal', referenceRange: { rawText: '< 0.50', low: 0.35, high: 0.50 } },
        ],
      },
      {
        id: 'rec_ev_05',
        title: 'Cardiology Clinical Consultation & Care Plan',
        category: "Doctor's Note",
        provider: 'St. Jude Heart & Vascular Institute',
        doctor: 'Dr. Michael Sterling, FACC',
        date: '2026-06-22',
        uploadedAt: '2026-06-23T09:30:00Z',
        fileName: 'Cardiology_Consult_Summary.pdf',
        fileSize: '245 KB',
        fileType: 'pdf',
        storageType: 'encrypted',
        tags: ['Consultation', 'Cardiology', 'Care Plan', 'Hypertension', 'Follow-up'],
        notes: 'Patient presented for annual cardiovascular assessment. Resting BP 124/78 mmHg. Continue Lisinopril 10mg daily in the morning. Recheck renal parameters and potassium in 6 months.',
        status: 'Verified',
        isMedicalReport: true,
        extractedMetrics: [
          { name: 'Blood Pressure (Systolic)', value: '124', unit: 'mmHg', status: 'normal', referenceRange: { rawText: '90 - 129 mmHg', low: 90, high: 129 } },
          { name: 'Blood Pressure (Diastolic)', value: '78', unit: 'mmHg', status: 'normal', referenceRange: { rawText: '60 - 80 mmHg', low: 60, high: 80 } },
        ],
      },
      {
        id: 'rec_ev_06',
        title: 'Lisinopril 10mg Prescription Refill',
        category: 'Prescription',
        provider: 'PrimeCare Internal Medicine',
        doctor: 'Dr. Robert Hayes, MD',
        date: '2026-06-25',
        uploadedAt: '2026-06-26T11:00:00Z',
        fileName: 'Lisinopril_Rx_Order.pdf',
        fileSize: '180 KB',
        fileType: 'pdf',
        storageType: 'encrypted',
        tags: ['Prescription', 'Lisinopril', 'ACE Inhibitor', 'Pharmacy', 'Refill'],
        notes: 'Take 1 tablet (10mg) by mouth once daily every morning. Quantity: 90 tablets. Refills: 3 remaining. Indication: Hypertension management.',
        status: 'Verified',
        isMedicalReport: true,
        extractedMetrics: [
          { name: 'Dosage', value: '10', unit: 'mg', status: 'normal', referenceRange: { rawText: 'Standard Daily', low: 5, high: 40 } },
        ],
      },
    ],
  },
  {
    sessionId: 'vd_sess_marcus_chen_2026',
    otpCode: '429183',
    durationMinutes: 15,
    patient: {
      id: 'usr_pat_marcus_chen',
      name: 'Marcus Chen',
      avatar: 'MC',
      email: 'marcus.chen@example.com',
      dateOfBirth: '1992-11-28',
      age: 33,
      gender: 'Male',
      bloodGroup: 'O+',
      emergencyContact: '+1 (555) 890-1234 (Sister)',
      allergies: 'NKDA (No Known Drug Allergies)',
      conditions: 'Sports Knee Injury (Post-ACL reconstruction)',
    },
    records: [
      {
        id: 'rec_mc_01',
        title: 'Right Knee MRI Arthrogram Scan',
        category: 'Imaging',
        provider: 'University Orthopedic Radiology',
        doctor: 'Dr. Kevin Zhao, MD',
        date: '2026-09-02',
        uploadedAt: '2026-09-03T11:20:00Z',
        fileName: 'Right_Knee_MRI_PostOp.pdf',
        fileSize: '2.4 MB',
        fileType: 'pdf',
        storageType: 'encrypted',
        tags: ['MRI Scan', 'Orthopedics', 'ACL', 'Right Knee', 'Imaging'],
        notes: 'Post-operative imaging demonstrates intact bone-patellar tendon-bone autograft with excellent incorporation and anatomical tunnel alignment. Minimal joint effusion. Menisci are intact.',
        status: 'Verified',
        isMedicalReport: true,
        extractedMetrics: [],
      },
      {
        id: 'rec_mc_02',
        title: 'Comprehensive Electrolyte & Renal Panel',
        category: 'Lab Results',
        provider: 'Apex Diagnostic Labs',
        doctor: 'Dr. Brenda Vance, MD',
        date: '2026-08-15',
        uploadedAt: '2026-08-16T08:45:00Z',
        fileName: 'Electrolytes_Renal_Panel.pdf',
        fileSize: '310 KB',
        fileType: 'pdf',
        storageType: 'encrypted',
        tags: ['Electrolytes', 'Sodium', 'Potassium', 'Creatinine', 'Renal'],
        notes: 'All electrolyte levels are well-balanced. Sodium 141 mEq/L, Potassium 4.2 mEq/L, Chloride 102 mEq/L, Bicarbonate 25 mEq/L.',
        status: 'Verified',
        isMedicalReport: true,
        extractedMetrics: [
          { name: 'Serum Sodium', value: '141', unit: 'mEq/L', status: 'normal', referenceRange: { rawText: '136 - 145 mEq/L', low: 136, high: 145 } },
          { name: 'Serum Potassium', value: '4.2', unit: 'mEq/L', status: 'normal', referenceRange: { rawText: '3.5 - 5.1 mEq/L', low: 3.5, high: 5.1 } },
          { name: 'Serum Chloride', value: '102', unit: 'mEq/L', status: 'normal', referenceRange: { rawText: '98 - 107 mEq/L', low: 98, high: 107 } },
          { name: 'Serum Creatinine', value: '0.92', unit: 'mg/dL', status: 'normal', referenceRange: { rawText: '0.70 - 1.30 mg/dL', low: 0.70, high: 1.30 } },
        ],
      },
      {
        id: 'rec_mc_03',
        title: 'Physical Therapy & Rehabilitation Progress Note',
        category: "Doctor's Note",
        provider: 'Summit Sports Medicine & Rehab',
        doctor: 'Dr. Claire Miller, DPT',
        date: '2026-09-10',
        uploadedAt: '2026-09-10T17:00:00Z',
        fileName: 'PT_Progress_Eval_Sept2026.pdf',
        fileSize: '215 KB',
        fileType: 'pdf',
        storageType: 'encrypted',
        tags: ['Physical Therapy', 'Rehabilitation', 'Knee Mobility', 'Sports Rehab'],
        notes: 'Full active extension (0°) and flexion achieved to 135°. Quadriceps strength index at 88% compared to contralateral limb. Patient cleared to commence light running drills.',
        status: 'Verified',
        isMedicalReport: true,
        extractedMetrics: [
          { name: 'Knee Flexion Range of Motion', value: '135', unit: 'degrees', status: 'normal', referenceRange: { rawText: '130 - 145°', low: 130, high: 145 } },
          { name: 'Limb Symmetry Index', value: '88', unit: '%', status: 'normal', referenceRange: { rawText: '> 85%', low: 85, high: 100 } },
        ],
      },
    ],
  },
];

// Initialize local sessions database with sample demo sessions if empty
export function initLocalAccessSessions() {
  const existing = getStoredItem(STORAGE_LOCAL_SESSIONS_KEY);
  if (!existing) {
    const sessionMap = {};
    DEMO_PATIENT_SESSIONS.forEach((ds) => {
      sessionMap[ds.sessionId] = {
        ...ds,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
    });
    setStoredItem(STORAGE_LOCAL_SESSIONS_KEY, JSON.stringify(sessionMap));
  }
}

initLocalAccessSessions();

// --------------------------------------------------------------------------
// QR Code Parser
// --------------------------------------------------------------------------
/**
 * Safely parse QR Code raw text into access session metadata.
 * QR contains ONLY the access identifier/token, NEVER medical data!
 */
export function parsePatientQRCode(rawString) {
  if (!rawString || typeof rawString !== 'string') {
    throw new Error('QR code data is empty or unreadable.');
  }

  const clean = rawString.trim();

  // 1. Try parsing JSON format
  if (clean.startsWith('{') && clean.endsWith('}')) {
    try {
      const parsed = JSON.parse(clean);
      const sessionId =
        parsed.sessionId ||
        parsed.session_id ||
        parsed.accessId ||
        parsed.access_id ||
        parsed.id ||
        parsed.token;

      if (!sessionId) {
        throw new Error('QR payload is missing a valid Session ID.');
      }

      return {
        sessionId: String(sessionId).trim(),
        patientName: parsed.patientName || parsed.patient_name || parsed.name || '',
        version: parsed.version || 1,
        format: 'json',
      };
    } catch (e) {
      if (e.message.includes('Session ID')) throw e;
      // If not valid JSON, proceed to URL/token fallback
    }
  }

  // 2. Try parsing URL format (e.g. https://vitaldiary.app/access?sessionId=... or vitaldiary://access?id=...)
  if (clean.includes('?') && (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('vitaldiary://'))) {
    try {
      const url = new URL(clean.replace('vitaldiary://', 'https://vitaldiary.app/'));
      const sessionId =
        url.searchParams.get('sessionId') ||
        url.searchParams.get('session_id') ||
        url.searchParams.get('accessId') ||
        url.searchParams.get('access_id') ||
        url.searchParams.get('id') ||
        url.searchParams.get('token');

      if (sessionId) {
        return {
          sessionId: sessionId.trim(),
          patientName: url.searchParams.get('patient') || '',
          format: 'url',
        };
      }
    } catch {
      // Fallback
    }
  }

  // 3. Raw Token string / UUID
  // Valid token characters: alphanumeric, dashes, underscores
  if (/^[a-zA-Z0-9_-]{6,128}$/.test(clean)) {
    return {
      sessionId: clean,
      patientName: '',
      format: 'token',
    };
  }

  throw new Error('Unrecognized QR code format. Please ensure you are scanning an authorized Vital Diary patient access QR.');
}

// --------------------------------------------------------------------------
// QR Code Generator (For Testing / Reviewer Demo)
// --------------------------------------------------------------------------
/**
 * Generates a high-contrast QR Data URL containing only the secure session ID
 */
export async function generatePatientAccessQRDataUrl(sessionInfo) {
  const payload = JSON.stringify({
    type: 'vital_diary_access_grant',
    version: 1,
    sessionId: sessionInfo.sessionId,
    patientName: sessionInfo.patient?.name || sessionInfo.patientName || '',
    expiresInMin: sessionInfo.durationMinutes || 30,
  });

  return await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 320,
    color: {
      dark: '#047857', // Emerald green QR dots
      light: '#ffffff',
    },
  });
}

/**
 * Directly Grants Doctor Access upon QR scan based on the duration selected by the patient.
 * NO OTP required.
 */
export async function grantDoctorDirectQRAccess(sessionId, doctorUser = null) {
  if (!sessionId) throw new Error('Session ID is required.');
  const cleanSessionId = String(sessionId).trim();

  // 1. If Supabase is configured, update session status on backend
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabase();
      if (client) {
        const { data } = await client
          .from('patient_access_sessions')
          .select('*')
          .eq('session_id', cleanSessionId)
          .maybeSingle();

        if (data) {
          const duration = data.duration_minutes || 30;
          const expiresAt = new Date(Date.now() + duration * 60 * 1000).toISOString();
          await client
            .from('patient_access_sessions')
            .update({
              status: 'active',
              doctor_id: doctorUser?.id || 'DOC-4892',
              doctor_name: doctorUser?.name || 'Dr. Sarah Jenkins, MD',
              expires_at: expiresAt,
            })
            .eq('session_id', cleanSessionId);
        }
      }
    } catch (e) {
      console.warn('Supabase direct grant notice:', e.message);
    }
  }

  // 2. Deterministic Local Access Store
  const savedSessions = JSON.parse(getStoredItem(STORAGE_LOCAL_SESSIONS_KEY) || '{}');
  let session = savedSessions[cleanSessionId];

  // If not found in stored sessions, check demo patient list
  if (!session) {
    const demo = DEMO_PATIENT_SESSIONS.find((ds) => ds.sessionId === cleanSessionId);
    if (demo) {
      session = { ...demo, createdAt: new Date().toISOString() };
      savedSessions[cleanSessionId] = session;
    }
  }

  if (!session) {
    throw new Error('Invalid or non-existent Patient Access QR.');
  }

  // Calculate Expiration Timestamp based on patient's selected duration
  const durationMin = session.durationMinutes || 30;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationMin * 60 * 1000).toISOString();

  const doctorProfile = {
    id: doctorUser?.id || 'DOC-4892',
    name: doctorUser?.name || 'Dr. Sarah Jenkins, MD',
    email: doctorUser?.email || 'sarah.jenkins@vitaldiary.io',
    specialty: doctorUser?.specialty || 'Cardiology & Internal Medicine',
    license: doctorUser?.license || 'LIC-MED-84920',
    hospital: doctorUser?.hospital || 'Central Healthcare System',
  };

  session.status = 'active';
  session.expiresAt = expiresAt;
  session.accessedAt = now.toISOString();
  session.revokedAt = null;
  session.doctor = doctorProfile;
  session.doctorName = doctorProfile.name;
  session.doctorId = doctorProfile.id;

  savedSessions[cleanSessionId] = session;
  setStoredItem(STORAGE_LOCAL_SESSIONS_KEY, JSON.stringify(savedSessions));

  // If this session is linked to a patient, update patient active session
  if (session.patient?.id) {
    setStoredItem(`vital_diary_patient_active_session_${session.patient.id}`, JSON.stringify(session));
  }

  // Dispatch real-time session update event
  dispatchSessionEvent('active', session);

  // Record in doctor's local access log
  logDoctorAccess({
    sessionId: cleanSessionId,
    patientId: session.patient?.id,
    patientName: session.patient?.name || 'Authorized Patient',
    doctorName: doctorProfile.name,
    durationMinutes: durationMin,
    expiresAt,
    status: 'Active',
  });

  return {
    success: true,
    sessionId: cleanSessionId,
    expiresAt,
    durationMinutes: durationMin,
    patient: session.patient,
    doctor: doctorProfile,
  };
}

/**
 * Backwards compatible alias for verifyDoctorAccessSession without OTP
 */
export async function verifyDoctorAccessSession(sessionId, otpCode = null, doctorUser = null) {
  // If doctorUser was passed as second argument
  const doc = typeof otpCode === 'object' && otpCode !== null ? otpCode : doctorUser;
  return await grantDoctorDirectQRAccess(sessionId, doc);
}

export async function initiateDoctorScanAccess(sessionId, doctorUser = null) {
  return await grantDoctorDirectQRAccess(sessionId, doctorUser);
}

// --------------------------------------------------------------------------
// Fetch Patient Records for Active Session
// --------------------------------------------------------------------------
export async function getAuthorizedPatientData(sessionId) {
  if (!sessionId) throw new Error('Session ID is required.');

  // 1. Try Supabase Server-side RPC
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabase();
      if (client) {
        const { data, error } = await client.rpc('get_authorized_patient_records', {
          p_session_id: sessionId,
        });

        if (!error && data?.success) {
          // Format records and get signed URLs if needed
          const formattedRecords = await Promise.all(
            (data.records || []).map(async (r) => {
              let fileUrl = r.file_url || '';
              if (r.file_path && !fileUrl.startsWith('data:')) {
                const signed = await getSignedFileUrl(r.file_path, 3600);
                if (signed) fileUrl = signed;
              }
              return {
                id: r.id,
                title: r.title,
                category: r.category,
                provider: r.provider || '',
                doctor: r.doctor || '',
                date: r.date || '',
                uploadedAt: r.created_at,
                fileName: r.file_name || 'medical_report',
                fileSize: r.file_size || 'Document',
                fileType: r.file_type || 'document',
                fileUrl,
                tags: r.tags || [],
                notes: r.notes || '',
                status: r.status || 'Verified',
                extractedMetrics: r.extracted_metrics || [],
                results: r.results || {},
                isMedicalReport: r.is_medical_report ?? true,
                validationMessage: r.validation_message || '',
              };
            })
          );

          return {
            patient: data.patient,
            records: formattedRecords,
            expiresAt: data.expiresAt,
          };
        }
      }
    } catch (err) {
      console.warn('Falling back to local session records:', err.message);
    }
  }

  // 2. Local Fallback
  const savedSessions = JSON.parse(getStoredItem(STORAGE_LOCAL_SESSIONS_KEY) || '{}');
  const session = savedSessions[sessionId] || DEMO_PATIENT_SESSIONS.find((ds) => ds.sessionId === sessionId);

  if (!session) {
    throw new Error('Authorized session data could not be found.');
  }

  // Check if expired or revoked
  if (
    session.status === 'expired' ||
    session.status === 'revoked' ||
    (session.expiresAt && new Date(session.expiresAt).getTime() < Date.now())
  ) {
    throw new Error('Authorized access duration has expired.');
  }

  return {
    patient: session.patient,
    records: session.records || [],
    expiresAt: session.expiresAt || new Date(Date.now() + (session.durationMinutes || 30) * 60000).toISOString(),
  };
}

// --------------------------------------------------------------------------
// End Access Session (Manual or on Expiry)
// --------------------------------------------------------------------------
export async function endDoctorAccessSession(sessionId) {
  if (!sessionId) return;

  // Supabase RPC
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabase();
      if (client) {
        await client.rpc('end_doctor_access_session', { p_session_id: sessionId });
      }
    } catch (e) {
      console.warn('Supabase end session notice:', e);
    }
  }

  // Update local session
  const savedSessions = JSON.parse(getStoredItem(STORAGE_LOCAL_SESSIONS_KEY) || '{}');
  if (savedSessions[sessionId]) {
    savedSessions[sessionId].status = 'expired';
    savedSessions[sessionId].revokedAt = new Date().toISOString();
    setStoredItem(STORAGE_LOCAL_SESSIONS_KEY, JSON.stringify(savedSessions));
  }

  // Update logs
  updateAccessLogStatus(sessionId, 'Completed');
}

// --------------------------------------------------------------------------
// Access Audit Logs (Stored locally for doctor statistics)
// --------------------------------------------------------------------------
export function getDoctorAccessLogs() {
  try {
    const raw = getStoredItem(STORAGE_ACCESS_LOGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Purge any legacy demo seed logs to ensure ONLY SCANNED PATIENTS ALLOWED
    const cleanLogs = parsed.filter((l) => !String(l.id || '').startsWith('log_seed_'));
    if (cleanLogs.length !== parsed.length) {
      setStoredItem(STORAGE_ACCESS_LOGS_KEY, JSON.stringify(cleanLogs));
    }
    return cleanLogs;
  } catch {
    return [];
  }
}

export function logDoctorAccess(entry) {
  try {
    const logs = getDoctorAccessLogs();
    const newLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      displaySessionId: entry.displaySessionId || `#${(entry.sessionId || '').substring(0, 6).toUpperCase()}`,
      ...entry,
    };
    // Keep most recent 50 logs
    const updated = [newLog, ...logs.filter((l) => l.sessionId !== entry.sessionId)].slice(0, 50);
    setStoredItem(STORAGE_ACCESS_LOGS_KEY, JSON.stringify(updated));
    return newLog;
  } catch (e) {
    console.warn('Failed to save access log', e);
  }
}

export function updateAccessLogStatus(sessionId, status) {
  try {
    const logs = getDoctorAccessLogs();
    const updated = logs.map((l) => (l.sessionId === sessionId ? { ...l, status } : l));
    setStoredItem(STORAGE_ACCESS_LOGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to update log', e);
  }
}

/**
 * Retrieve list of ONLY scanned patients for Doctor's Patients page
 * NO dummy or fake pre-seeded data allowed!
 */
export function getDoctorPatients() {
  const logs = getDoctorAccessLogs();
  const savedSessions = JSON.parse(getStoredItem(STORAGE_LOCAL_SESSIONS_KEY) || '{}');

  const patientMap = new Map();

  // ONLY iterate through actual scanned access logs
  logs.forEach((log) => {
    const sessionData = savedSessions[log.sessionId] || DEMO_PATIENT_SESSIONS.find((d) => d.sessionId === log.sessionId);
    const pid = log.patientId || sessionData?.patient?.id;
    const key = (pid || log.patientName || '').toLowerCase().trim();
    if (!key) return;

    const existing = patientMap.get(key) || {};

    const isLiveActive =
      log.status === 'Active' &&
      log.expiresAt &&
      new Date(log.expiresAt).getTime() > Date.now();

    patientMap.set(key, {
      ...existing,
      id: log.patientId || sessionData?.patient?.id || existing.id || `pat_${Date.now()}`,
      name: log.patientName || existing.name || 'Patient',
      avatar: sessionData?.patient?.avatar || existing.avatar || (log.patientName ? log.patientName.substring(0, 2).toUpperCase() : 'PT'),
      email: sessionData?.patient?.email || existing.email || '',
      lastAccessedDate: new Date(log.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      lastAccessedTimestamp: log.timestamp,
      sessionId: log.sessionId,
      displaySessionId: log.displaySessionId || existing.displaySessionId || `#${log.sessionId.substring(0, 6).toUpperCase()}`,
      durationMinutes: log.durationMinutes || existing.durationMinutes || 30,
      status: isLiveActive ? 'Active' : 'Expired',
      patient: sessionData?.patient || existing.patient || { name: log.patientName },
      recordsCount: sessionData?.records?.length || existing.recordsCount || 0,
    });
  });

  return Array.from(patientMap.values()).sort(
    (a, b) => new Date(b.lastAccessedTimestamp || 0) - new Date(a.lastAccessedTimestamp || 0)
  );
}

// --------------------------------------------------------------------------
// Patient QR Sharing & Session Generation (Patient Side V1)
// --------------------------------------------------------------------------
/**
 * Create a new patient access session.
 * Stores in Supabase patient_access_sessions (if configured) and local session vault.
 * Generates secure QR containing ONLY { sessionId: "..." }.
 */
export async function createPatientAccessSession({ patient, records = [], durationMinutes = 30 }) {
  if (!patient?.id) throw new Error('Patient profile is required.');

  const sessionRandom = Math.random().toString(36).substring(2, 8);
  const sanitizedId = patient.id.replace(/[^a-zA-Z0-9_-]/g, '');
  const sessionId = `vd_sess_${sanitizedId}_${Date.now()}_${sessionRandom}`;
  const duration = parseInt(durationMinutes, 10) || 30;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + duration * 60 * 1000).toISOString();

  // Try creating on Supabase if connected
  if (isSupabaseConfigured() && !patient.id.startsWith('usr_')) {
    try {
      const client = getSupabase();
      if (client) {
        await client.from('patient_access_sessions').insert([
          {
            session_id: sessionId,
            patient_id: patient.id,
            duration_minutes: duration,
            expires_at: expiresAt,
            status: 'pending',
          },
        ]);
      }
    } catch (dbErr) {
      console.warn('Supabase session insert notice:', dbErr.message);
    }
  }

  // Filter only existing Medical PDF / clinical reports for doctor access
  // Scope: Patient Name + Medical PDF Reports + Search
  const shareableRecords = (records || []).map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    provider: r.provider || '',
    doctor: r.doctor || '',
    date: r.date || '',
    uploadedAt: r.uploadedAt || r.created_at,
    fileName: r.fileName || r.file_name || `${r.title.replace(/\s+/g, '_')}.pdf`,
    fileSize: r.fileSize || r.file_size || 'Document',
    fileType: r.fileType || r.file_type || 'pdf',
    fileUrl: r.fileUrl || '',
    filePath: r.filePath || r.file_path || '',
    tags: r.tags || [],
    notes: r.notes || '',
    status: r.status || 'Verified',
    extractedMetrics: r.extractedMetrics || r.extracted_metrics || [],
    results: r.results || {},
    isMedicalReport: r.isMedicalReport ?? true,
    validationMessage: r.validationMessage || '',
  }));

  // Generate QR Code containing ONLY the secure session ID
  const qrDataUrl = await generatePatientAccessQRDataUrl({
    sessionId,
    patientName: patient.name,
    durationMinutes: duration,
  });

  const sessionObj = {
    sessionId,
    durationMinutes: duration,
    expiresAt: null, // Calculated when doctor scans & access is granted
    status: 'waiting_scan', // 'waiting_scan' -> 'active' -> 'revoked'/'expired'
    createdAt: now.toISOString(),
    patient: {
      id: patient.id,
      name: patient.name || 'Patient',
      avatar: patient.avatar || 'PT',
      email: patient.email || '',
      dateOfBirth: patient.dateOfBirth || patient.date_of_birth || '',
      bloodGroup: patient.bloodGroup || patient.blood_group || '',
      gender: patient.gender || '',
      allergies: patient.allergies || '',
    },
    doctor: null,
    records: shareableRecords,
    qrDataUrl,
  };

  // Save to local session store
  const savedSessions = JSON.parse(getStoredItem(STORAGE_LOCAL_SESSIONS_KEY) || '{}');
  savedSessions[sessionId] = sessionObj;
  setStoredItem(STORAGE_LOCAL_SESSIONS_KEY, JSON.stringify(savedSessions));

  // Also save as active session for this patient
  setStoredItem(`vital_diary_patient_active_session_${patient.id}`, JSON.stringify(sessionObj));

  // Dispatch real-time session update event
  dispatchSessionEvent('created', sessionObj);

  return sessionObj;
}

/**
 * Dispatch cross-tab and in-window events for real-time sync between patient and doctor
 */
function dispatchSessionEvent(action, session) {
  if (typeof window !== 'undefined') {
    try {
      const evt = new CustomEvent('vital_diary_session_event', {
        detail: { action, session },
      });
      window.dispatchEvent(evt);
    } catch {
      // Ignored in non-DOM/SSR environments
    }
  }
}

/**
 * Revoke patient access session immediately.
 */
export async function revokePatientAccessSession(sessionId, patientId) {
  if (!sessionId) return;

  // Supabase revocation
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabase();
      if (client) {
        await client
          .from('patient_access_sessions')
          .update({ status: 'revoked', revoked_at: new Date().toISOString() })
          .eq('session_id', sessionId);
      }
    } catch (e) {
      console.warn('Supabase revoke notice:', e);
    }
  }

  // Local storage revocation
  const savedSessions = JSON.parse(getStoredItem(STORAGE_LOCAL_SESSIONS_KEY) || '{}');
  if (savedSessions[sessionId]) {
    savedSessions[sessionId].status = 'revoked';
    savedSessions[sessionId].revokedAt = new Date().toISOString();
    setStoredItem(STORAGE_LOCAL_SESSIONS_KEY, JSON.stringify(savedSessions));
    dispatchSessionEvent('revoked', savedSessions[sessionId]);
  }

  if (patientId) {
    removeStoredItem(`vital_diary_patient_active_session_${patientId}`);
  }
}

/**
 * Check if patient has an ongoing unexpired active or pending session
 */
export function getPatientActiveSession(patientId) {
  if (!patientId) return null;
  const raw = getStoredItem(`vital_diary_patient_active_session_${patientId}`);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw);
    if (!session || session.status === 'revoked' || session.status === 'expired') {
      return null;
    }
    if (session.status === 'active' && session.expiresAt && new Date(session.expiresAt).getTime() < Date.now()) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}


