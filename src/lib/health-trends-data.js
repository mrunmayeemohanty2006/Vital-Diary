/**
 * Standard Biomarker Definitions and Parsing Helpers
 */

export const BIOMARKER_PROFILES = {
  hemoglobin: {
    key: 'hemoglobin',
    name: 'Hemoglobin',
    unit: 'g/dL',
    category: 'Hematology',
    normalRange: { low: 12.0, high: 16.5, midpoint: 14.25 },
    aliases: ['hemoglobin', 'hgb', 'hb', 'haemoglobin', 'hemoglobin (hgb)'],
  },
  glucose: {
    key: 'glucose',
    name: 'Fasting Blood Glucose',
    unit: 'mg/dL',
    category: 'Metabolic',
    normalRange: { low: 70, high: 99, midpoint: 85 },
    aliases: ['glucose', 'fasting glucose', 'fasting blood glucose', 'fbs', 'blood sugar', 'glucose (fasting)'],
  },
  total_cholesterol: {
    key: 'total_cholesterol',
    name: 'Total Cholesterol',
    unit: 'mg/dL',
    category: 'Lipid Panel',
    normalRange: { low: 120, high: 199, midpoint: 160 },
    aliases: ['total cholesterol', 'cholesterol', 'serum cholesterol', 'cholesterol, total'],
  },
  ldl_cholesterol: {
    key: 'ldl_cholesterol',
    name: 'LDL Cholesterol',
    unit: 'mg/dL',
    category: 'Lipid Panel',
    normalRange: { low: 50, high: 99, midpoint: 75 },
    aliases: ['ldl', 'ldl cholesterol', 'ldl-c', 'low density lipoprotein'],
  },
  hdl_cholesterol: {
    key: 'hdl_cholesterol',
    name: 'HDL Cholesterol',
    unit: 'mg/dL',
    category: 'Lipid Panel',
    normalRange: { low: 40, high: 90, midpoint: 65 },
    aliases: ['hdl', 'hdl cholesterol', 'hdl-c', 'high density lipoprotein'],
  },
  triglycerides: {
    key: 'triglycerides',
    name: 'Triglycerides',
    unit: 'mg/dL',
    category: 'Lipid Panel',
    normalRange: { low: 50, high: 149, midpoint: 100 },
    aliases: ['triglycerides', 'triglyceride', 'tg'],
  },
  hba1c: {
    key: 'hba1c',
    name: 'HbA1c',
    unit: '%',
    category: 'Glycemic Control',
    normalRange: { low: 4.0, high: 5.6, midpoint: 4.8 },
    aliases: ['hba1c', 'a1c', 'glycated hemoglobin', 'hemoglobin a1c'],
  },
  blood_pressure_systolic: {
    key: 'blood_pressure_systolic',
    name: 'Blood Pressure (Systolic)',
    unit: 'mmHg',
    category: 'Cardiovascular',
    normalRange: { low: 95, high: 120, midpoint: 110 },
    aliases: ['systolic', 'systolic bp', 'blood pressure systolic'],
  },
  blood_pressure_diastolic: {
    key: 'blood_pressure_diastolic',
    name: 'Blood Pressure (Diastolic)',
    unit: 'mmHg',
    category: 'Cardiovascular',
    normalRange: { low: 60, high: 80, midpoint: 70 },
    aliases: ['diastolic', 'diastolic bp', 'blood pressure diastolic'],
  },
  platelets: {
    key: 'platelets',
    name: 'Platelet Count',
    unit: 'K/uL',
    category: 'Hematology',
    normalRange: { low: 150, high: 450, midpoint: 300 },
    aliases: ['platelets', 'platelet count', 'plt'],
  },
  creatinine: {
    key: 'creatinine',
    name: 'Serum Creatinine',
    unit: 'mg/dL',
    category: 'Renal Panel',
    normalRange: { low: 0.6, high: 1.2, midpoint: 0.9 },
    aliases: ['creatinine', 'serum creatinine', 'creat'],
  },
  heart_rate: {
    key: 'heart_rate',
    name: 'Resting Heart Rate',
    unit: 'bpm',
    category: 'Cardiovascular',
    normalRange: { low: 60, high: 100, midpoint: 72 },
    aliases: ['heart rate', 'pulse', 'pulse rate', 'hr', 'resting heart rate'],
  },
};

export function parseNumericValue(val) {
  if (typeof val === 'number') {
    return isNaN(val) ? null : val;
  }
  if (!val || typeof val !== 'string') return null;

  const bpMatch = val.match(/(\d{2,3})\s*[\/|\\]\s*(\d{2,3})/);
  if (bpMatch) {
    return {
      systolic: parseFloat(bpMatch[1]),
      diastolic: parseFloat(bpMatch[2]),
    };
  }

  const clean = val.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? null : parsed;
}

export function matchBiomarkerKey(rawName) {
  if (!rawName || typeof rawName !== 'string') return null;
  const clean = rawName.trim().toLowerCase().replace(/[:=]/g, '').trim();

  for (const [key, profile] of Object.entries(BIOMARKER_PROFILES)) {
    if (clean === key || clean === profile.name.toLowerCase()) {
      return key;
    }
    for (const alias of profile.aliases) {
      if (clean === alias || clean.startsWith(`${alias} `) || clean.endsWith(` ${alias}`)) {
        return key;
      }
    }
  }

  return clean.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}
