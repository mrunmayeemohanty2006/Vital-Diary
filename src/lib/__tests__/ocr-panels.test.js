import { describe, it, expect } from 'vitest';
import { extractHealthData } from '../health-extractor.js';
import { validateMedicalDocument } from '../medical-document-validator.js';

describe('Multi-Panel & Stress Test Suite for Vital Diary OCR System', () => {
  it('Panel Test 1: Comprehensive Lipid Profile Extraction', () => {
    const lipidReportText = `
CLINICAL BIOCHEMISTRY - LIPID PROFILE
Patient ID: 98421 | Date: 2025-11-04
Test Name               Observed Value  Units    Biological Ref Interval
Total Cholesterol       218.0           mg/dL    < 200.0 Desirable
Triglycerides           165.0           mg/dL    < 150.0 Normal
HDL Cholesterol         42.0            mg/dL    > 40.0 Desirable
LDL Cholesterol         143.0           mg/dL    < 100.0 Optimal
VLDL Cholesterol        33.0            mg/dL    < 30.0 Normal
`;

    const lipidExtracted = extractHealthData(lipidReportText, { source: 'pdf-text' });
    expect(lipidExtracted.title).toBe('Lipid Profile Report');
    expect(lipidExtracted.reportType).toBe('cardiology');
    expect(lipidExtracted.extractedDate).toBe('2025-11-04');
    expect(lipidExtracted.metrics.length).toBe(5);

    const tc = lipidExtracted.metrics.find((m) => m.name === 'Total Cholesterol');
    expect(tc && tc.value === 218 && tc.status === 'high').toBe(true);

    const hdl = lipidExtracted.metrics.find((m) => m.name === 'HDL Cholesterol');
    expect(hdl && hdl.value === 42 && hdl.status === 'normal').toBe(true);
  });

  it('Panel Test 2: Liver Function Test (LFT)', () => {
    const lftReportText = `
LIVER FUNCTION PANEL
Date of Collection: 18-Oct-2025
TEST                    RESULT  UNIT    REFERENCE
Total Bilirubin         1.40    mg/dL   0.20 - 1.20   High
Direct Bilirubin        0.45    mg/dL   0.00 - 0.30   High
SGPT (ALT)              58.0    U/L     10.0 - 40.0   High
SGOT (AST)              46.0    U/L     10.0 - 35.0   High
Alkaline Phosphatase    95.0    U/L     30.0 - 120.0  Normal
`;

    const lftExtracted = extractHealthData(lftReportText, { source: 'pdf-text' });
    expect(lftExtracted.title).toBe('Liver Function Test (LFT)');
    expect(lftExtracted.extractedDate).toBe('2025-10-18');
    expect(lftExtracted.metrics.length).toBe(5);

    const alt = lftExtracted.metrics.find((m) => m.name === 'SGPT');
    expect(alt && alt.value === 58 && alt.status === 'high').toBe(true);
  });

  it('Panel Test 3: Thyroid Function Panel', () => {
    const thyroidReportText = `
SPECIALIZED ENDOCRINE REPORT
Date: 2025-08-14
Investigation           Observed Value  Unit      Biological Reference Interval
TSH 3rd Generation      5.85            uIU/mL    0.35 - 4.94   High
Free T3                 3.10            pg/mL     2.00 - 4.40   Normal
Free T4                 1.25            ng/dL     0.93 - 1.70   Normal
`;

    const thyroidExtracted = extractHealthData(thyroidReportText, { source: 'pdf-text' });
    expect(thyroidExtracted.title).toBe('Thyroid Function Panel (TSH)');
    expect(thyroidExtracted.metrics.length).toBe(3);
    const tsh = thyroidExtracted.metrics.find((m) => m.name === 'TSH');
    expect(tsh && tsh.value === 5.85 && tsh.status === 'high').toBe(true);
  });

  it('Panel Test 4: Renal Function Panel', () => {
    const renalReportText = `
RENAL FUNCTION BIOCHEMISTRY
Report Date: 05/09/2025
Test Name           Result    Unit     Ref Range
Serum Creatinine    0.95      mg/dL    0.70 - 1.30
Blood Urea Nitrogen 16.0      mg/dL    7.0 - 20.0
Serum Uric Acid     6.2       mg/dL    3.5 - 7.2
`;

    const renalExtracted = extractHealthData(renalReportText, { source: 'pdf-text' });
    expect(renalExtracted.metrics.length).toBe(3);
    const creat = renalExtracted.metrics.find((m) => m.name === 'Creatinine');
    expect(creat && creat.value === 0.95 && creat.status === 'normal').toBe(true);
  });

  it('Panel Test 5: Multi-Page Document Page Boundary Preservation', () => {
    const multiPageText = `
--- Page 1 ---
COMPLETE BLOOD COUNT
Date: 2025-06-01
Hemoglobin: 13.8 g/dL (12.0 - 16.0)
Total WBC: 6500 cells/uL (4000 - 11000)

--- Page 2 ---
LIPID PROFILE
Total Cholesterol: 185 mg/dL (< 200)
Triglycerides: 130 mg/dL (< 150)
`;

    const multiExtracted = extractHealthData(multiPageText, { source: 'ocr' });
    expect(multiExtracted.title).toBe('Comprehensive Multi-Panel Health Report');
    expect(multiExtracted.metrics.length).toBe(4);
  });

  it('Panel Test 6: Non-Medical Document Validation Rejection', () => {
    const carInvoice = `
AUTO REPAIR INVOICE #9201
Brake pad replacement: $180.00
Oil change 5W-30: $45.00
Labor (2.5 hrs): $250.00
Total Due: $475.00
`;
    const rejection = validateMedicalDocument(carInvoice, { fileName: 'car_receipt.pdf' });
    expect(rejection.isSupportedLabReport).toBe(false);
    expect(rejection.userMessage).toContain('does not appear to be a standard clinical diagnostic');
  });
});
