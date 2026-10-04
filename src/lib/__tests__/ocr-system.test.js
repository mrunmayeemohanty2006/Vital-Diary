import { describe, it, expect } from 'vitest';
import {
  matchCanonicalParameter,
  normalizeUnit,
  disambiguateNumericString,
  parseReferenceInterval,
  computeLevenshtein,
} from '../ocr-medical-vocab.js';
import {
  validateMedicalDocument,
  validateMetricSanity,
} from '../medical-document-validator.js';
import { extractHealthData } from '../health-extractor.js';
import {
  applyGrayscale,
  applySharpen,
  applyDenoise,
  applyMarginCleanup,
} from '../ocr-preprocessor.js';

describe('Vital Diary OCR System Test Suite', () => {
  it('Test 1: Medical Vocabulary & Fuzzy Matching', () => {
    expect(computeLevenshtein('hemoglobin', 'hemoglobin')).toBe(0);
    expect(computeLevenshtein('hernoglobin', 'hemoglobin')).toBe(2);

    const hbMatch = matchCanonicalParameter('Hemoglobin');
    expect(hbMatch && hbMatch.canonicalName === 'Hemoglobin').toBe(true);

    const hbFuzzyMatch = matchCanonicalParameter('Hemoglohin (Hb)');
    expect(hbFuzzyMatch && hbFuzzyMatch.canonicalName === 'Hemoglobin').toBe(true);

    const wbcMatch = matchCanonicalParameter('Total Leucocyte Count (TLC)');
    expect(wbcMatch && wbcMatch.canonicalName === 'WBC').toBe(true);

    const tshMatch = matchCanonicalParameter('TSH - 3rd Generation Ultra');
    expect(tshMatch && tshMatch.canonicalName === 'TSH').toBe(true);
  });

  it('Test 2: Unit Normalization', () => {
    expect(normalizeUnit('g/dl')).toBe('g/dL');
    expect(normalizeUnit('mg/dl')).toBe('mg/dL');
    expect(normalizeUnit('cells/cumm')).toBe('cells/uL');
  });

  it('Test 3: OCR Numeric Disambiguation', () => {
    expect(disambiguateNumericString('l4.5', 'g/dL')?.disambiguatedString).toBe('14.5');
    expect(disambiguateNumericString('O.95', 'mg/dL')?.disambiguatedString).toBe('0.95');
    expect(disambiguateNumericString('1,250', 'cells/uL')?.disambiguatedString).toBe('1.25');
  });

  it('Test 4: Reference Interval Parser', () => {
    const range1 = parseReferenceInterval('12.0 - 16.0 g/dL');
    expect(range1 && range1.low === 12.0 && range1.high === 16.0).toBe(true);

    const range2 = parseReferenceInterval('< 200 mg/dL');
    expect(range2 && range2.threshold === 200 && range2.operator === '<').toBe(true);

    const range3 = parseReferenceInterval('> 40 mg/dL');
    expect(range3 && range3.threshold === 40 && range3.operator === '>').toBe(true);
  });

  it('Test 5: Document-Level Validation Gate', () => {
    const validReportText = `
METROPOLITAN CLINICAL LABORATORIES
Date of Collection: 12-May-2025
TEST NAME               RESULT    UNIT      BIOLOGICAL REF INTERVAL
Hemoglobin              14.5      g/dL      12.0 - 16.0
Total Leukocyte Count   7200      cells/uL  4000 - 11000
Fasting Glucose         92        mg/dL     70 - 100
`;
    const docValidation = validateMedicalDocument(validReportText, { fileName: 'blood_report.pdf' });
    expect(docValidation.isSupportedLabReport).toBe(true);

    const receiptText = 'Target Store Receipt #4921 Total $49.20 Card ending in 4920';
    const fakeValidation = validateMedicalDocument(receiptText, { fileName: 'receipt.pdf' });
    expect(fakeValidation.isSupportedLabReport).toBe(false);
  });

  it('Test 6: Metric-Level Sanity & Integrity Validation', () => {
    const hbSanity = validateMetricSanity('Hemoglobin', 1.4, 'g/dL', { low: 12.0, high: 16.0 }, { min: 5.0, max: 22.0 }, 'normal');
    expect(hbSanity.needsVerification).toBe(true);

    const sugarSanity = validateMetricSanity('Fasting Glucose', 890, 'mg/dL', { low: 70, high: 100 }, { min: 40, max: 500 }, 'high');
    expect(sugarSanity.needsVerification).toBe(true);
  });

  it('Test 7: Complete Health Data Extraction', () => {
    const validReportText = `
METROPOLITAN CLINICAL LABORATORIES
Date of Collection: 12-May-2025
TEST NAME               RESULT    UNIT      BIOLOGICAL REF INTERVAL
Hemoglobin              14.5      g/dL      12.0 - 16.0
Total Leukocyte Count   7200      cells/uL  4000 - 11000
Fasting Glucose         92        mg/dL     70 - 100
`;
    const extractedData = extractHealthData(validReportText, { source: 'pdf-text' });
    expect(extractedData.title).toBe('Comprehensive Multi-Panel Health Report');
    expect(extractedData.extractedDate).toBe('2025-05-12');
    expect(extractedData.metrics.length).toBeGreaterThanOrEqual(3);

    const hbExtracted = extractedData.metrics.find((m) => m.name === 'Hemoglobin');
    expect(hbExtracted && hbExtracted.value === 14.5).toBe(true);
  });

  it('Test 8: Image Preprocessing Kernel Operations', () => {
    const samplePixels = new Uint8ClampedArray(400 * 4); // 20x20 RGBA
    for (let i = 0; i < samplePixels.length; i += 4) {
      samplePixels[i] = 100;
      samplePixels[i + 1] = 150;
      samplePixels[i + 2] = 200;
      samplePixels[i + 3] = 255;
    }

    applyGrayscale(samplePixels);
    expect(samplePixels[0]).toBe(Math.round(0.299 * 100 + 0.587 * 150 + 0.114 * 200));

    applySharpen(samplePixels, 20, 20);
    applyDenoise(samplePixels, 20, 20);
    applyMarginCleanup(samplePixels, 20, 20, 2);
    expect(samplePixels[0]).toBe(255);
  });
});
