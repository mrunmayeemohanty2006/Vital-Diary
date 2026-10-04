/**
 * Medical Document & Metric Validation Engine
 * 
 * 100% Deterministic & Client-Side:
 * 1. Document-Level Validation Gate:
 *    Detects whether an uploaded document is a genuine, usable medical/diagnostic lab report
 *    or an unsupported document (e.g. invoices, receipts, general photos), providing clear feedback.
 * 
 * 2. Metric-Level Sanity & Integrity Validation:
 *    Detects decimal-drop errors, digit dropouts, scale errors, and contradictions between
 *    measured values, reference intervals, and OCR status markers.
 */

import { matchCanonicalParameter } from './ocr-medical-vocab.js';

export const CORE_MEDICAL_INDICATORS = [
  'hemoglobin', 'haemoglobin', 'rbc', 'wbc', 'platelet', 'hematocrit', 'haematocrit',
  'glucose', 'cholesterol', 'triglyceride', 'tsh', 'thyroid', 'creatinine', 'urea',
  'bilirubin', 'sgot', 'sgpt', 'alt', 'ast', 'albumin', 'calcium', 'vitamin',
  'reference range', 'ref range', 'reference interval', 'biological ref interval',
  'normal range', 'observed value', 'investigation', 'test name', 'specimen',
  'laboratory', 'pathology', 'diagnostic', 'patient', 'clinical', 'sample', 'result',
];

/**
 * Validates whether an extracted document is a supported medical/lab report.
 */
export function validateMedicalDocument(ocrText, options = {}) {
  if (!ocrText || typeof ocrText !== 'string' || ocrText.trim().length === 0) {
    return {
      isSupportedLabReport: false,
      confidence: 0,
      userMessage: 'The uploaded file contains no readable text or visual contents. Please upload a clear diagnostic lab report or medical document.',
      matchedMedicalTerms: [],
    };
  }

  const cleanText = ocrText.toLowerCase();
  const matchedTerms = [];

  for (const term of CORE_MEDICAL_INDICATORS) {
    if (cleanText.includes(term)) {
      matchedTerms.push(term);
    }
  }

  // Count structured measurement row patterns (e.g. Name ... 12.4 ... g/dL ... 11.5-16.0)
  const lines = ocrText.split('\n');
  let validMeasurementLines = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 5) continue;

    // Check if line contains a canonical medical parameter and at least one number
    const param = matchCanonicalParameter(trimmed);
    const hasNumber = /\b\d+(?:\.\d+)?\b/.test(trimmed);

    if (param && hasNumber) {
      validMeasurementLines++;
    }
  }

  // Scoring heuristic
  const termScore = matchedTerms.length;
  const isPDFSource = options.source === 'pdf-text';

  const isMedical =
    validMeasurementLines >= 1 ||
    termScore >= 3 ||
    (isPDFSource && termScore >= 2);

  if (!isMedical) {
    return {
      isSupportedLabReport: false,
      confidence: 0.1,
      userMessage: `The document "${options.fileName || 'file'}" does not appear to be a standard clinical diagnostic or laboratory report. Vital Diary requires medical test reports (CBC, Lipid, Metabolic, Thyroid, etc.) to securely extract vital metrics.`,
      matchedMedicalTerms: matchedTerms,
    };
  }

  return {
    isSupportedLabReport: true,
    confidence: Math.min(1.0, 0.5 + validMeasurementLines * 0.1 + termScore * 0.05),
    userMessage: 'Valid medical document recognized.',
    matchedMedicalTerms: matchedTerms,
  };
}

/**
 * Checks if a parsed reference range appears corrupted or misaligned.
 */
export function isCorruptedReferenceRange(canonicalName, refRange, unit) {
  if (!refRange) return false;

  // If low is greater than high
  if (typeof refRange.low === 'number' && typeof refRange.high === 'number') {
    if (refRange.low > refRange.high) return true;
    if (refRange.high <= 0) return true;
  }

  // Canonical range anomalies
  if (canonicalName === 'Hemoglobin' && (refRange.high > 30 || refRange.low < 3.0)) return true;
  if (canonicalName === 'Platelets' && refRange.high < 50000 && !['lakh', 'lac', '10^3/ul'].includes(unit?.toLowerCase())) return true;
  if (canonicalName === 'Total RBC' && refRange.high > 20) return true;
  if (canonicalName === 'RDW' && refRange.high > 50) return true;

  return false;
}

/**
 * Validates whether an extracted metric value is physiologically plausible or represents a likely OCR digit/decimal failure.
 */
export function validateMetricSanity(
  canonicalName,
  numericVal,
  unit,
  refRange,
  expectedRange,
  ocrStatus
) {
  const genericReason = 'OCR result appears inconsistent with the expected physiological/reference-range pattern; verify against the original report.';

  // 1. Critical Disagreement: Value contradicts both reference range and OCR status
  if (refRange && typeof refRange.low === 'number' && typeof refRange.high === 'number') {
    if (numericVal >= refRange.low && numericVal <= refRange.high && ocrStatus && ocrStatus !== 'normal' && ocrStatus !== 'unknown') {
      return {
        needsVerification: true,
        verificationReason: `Measured value ${numericVal} falls within reference range [${refRange.low} - ${refRange.high}], but OCR status indicates ${ocrStatus}.`,
      };
    }
  }

  // 2. Hemoglobin decimal drop check (e.g. 1.2 g/dL instead of 11.2, or 120 g/dL instead of 12.0)
  if (canonicalName === 'Hemoglobin' && (numericVal < 3.0 || numericVal > 30)) {
    return {
      needsVerification: true,
      verificationReason: `Hemoglobin value ${numericVal} ${unit || 'g/dL'} indicates a likely OCR decimal point misread or scale error.`,
    };
  }

  // 3. Total RBC count magnitude check (e.g. 48 mil/uL instead of 4.8)
  if (canonicalName === 'Total RBC' && (numericVal > 15 || numericVal < 1.0)) {
    return {
      needsVerification: true,
      verificationReason: `Total RBC value ${numericVal} suggests a misplaced decimal point (expected ~3.5 - 6.5 mil/uL).`,
    };
  }

  // 4. Platelet count magnitude check (e.g. 2.5 vs 250,000)
  if (canonicalName === 'Platelets') {
    if (numericVal > 0 && numericVal < 50) {
      return {
        needsVerification: true,
        verificationReason: 'Platelet count appears scaled in lacs/lakhs or dropped thousands separator; check unit.',
      };
    }
  }

  // 5. Fasting / Random Blood Sugar magnitude checks (e.g. 890 mg/dL or 8.9 mg/dL)
  if (['Fasting Glucose', 'Blood Glucose', 'Postprandial Glucose'].includes(canonicalName) && (numericVal < 20 || numericVal > 800)) {
    return {
      needsVerification: true,
      verificationReason: genericReason,
    };
  }

  // 6. Serum Calcium extreme multiplier check (e.g. 92 mg/dL vs 8.6-10.2 mg/dL)
  if (canonicalName === 'Calcium' && (numericVal > 25 || numericVal < 3.0)) {
    return {
      needsVerification: true,
      verificationReason: genericReason,
    };
  }

  // 7. Folate extreme multiplier check (e.g. 61 ng/mL vs 3.0-17.0 ng/mL)
  if (canonicalName === 'Folate' && numericVal > 40) {
    return {
      needsVerification: true,
      verificationReason: genericReason,
    };
  }

  // 8. Vitamin D extreme multiplier or contradiction check
  if (canonicalName === 'Vitamin D' && (numericVal > 250 || (numericVal > 100 && ocrStatus === 'low'))) {
    return {
      needsVerification: true,
      verificationReason: genericReason,
    };
  }

  // 9. TSH magnitude check
  if (canonicalName === 'TSH' && (numericVal > 250 || numericVal < 0.001)) {
    return {
      needsVerification: true,
      verificationReason: genericReason,
    };
  }

  // 10. General expected physiological range boundary check
  if (expectedRange && !['WBC', 'Platelets'].includes(canonicalName)) {
    if (numericVal < expectedRange.min * 0.4 || numericVal > expectedRange.max * 2.5) {
      return {
        needsVerification: true,
        verificationReason: genericReason,
      };
    }
  }

  return { needsVerification: false };
}
