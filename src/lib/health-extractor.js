/**
 * Deterministic Clinical Medical Data Extractor
 * 
 * Extracts medical parameters, test values, units, reference intervals,
 * statuses, and report dates from raw OCR or PDF text layers using
 * Document-First Discovery and Row-Aware Spatial Extraction.
 * 
 * 100% Deterministic & Client-Side.
 */

import {
  matchCanonicalParameter,
  normalizeUnit,
  disambiguateNumericString,
  parseReferenceInterval,
  parseStatusToken,
  CANONICAL_MEDICAL_VOCABULARY,
} from './ocr-medical-vocab.js';
import {
  validateMetricSanity,
  isCorruptedReferenceRange,
} from './medical-document-validator.js';

/**
 * Checks if a line contains administrative metadata rather than clinical measurement data.
 */
export function isAdministrativeOrMetadataLine(line) {
  if (!line || typeof line !== 'string') return true;
  const clean = line.trim().toLowerCase();

  // Common administrative headers/footers in lab reports
  const adminPatterns = [
    /^(patient|name|age|gender|sex|ref by|referred by|sample|specimen|collected|received|reported|printed)\s*:/i,
    /^(hospital|clinic|diagnostic|pathology|laboratory|dr\.|doctor|m\.d\.|mbbs|reg\.? no|bill no|sid|bar code|page \d+)/i,
    /^(department|end of report|verified by|pathologist|biochemist|technologist|authorized signatory)/i,
    /^(interpretation|clinical notes|methodology|please correlate clinically|note\s*:)/i,
    /^[-=_*#\s]{4,}$/, // Decorative divider lines
  ];

  for (const pattern of adminPatterns) {
    if (pattern.test(clean)) return true;
  }

  return false;
}

/**
 * Segments raw OCR text into clinical sections.
 */
export function segmentDocumentSections(ocrText) {
  if (!ocrText) return [];
  const lines = ocrText.split('\n').map((l) => l.trim()).filter(Boolean);
  const sections = [];
  let currentSection = { name: 'General Diagnostics', lines: [] };

  const sectionHeaderPattern = /^(complete blood count|cbc|hematology|lipid profile|lipid panel|liver function test|lft|hepatic panel|renal function test|rft|kidney function test|kft|thyroid profile|thyroid panel|iron profile|diabetic panel|biochemistry|urinalysis|urine examination|electrolytes|immunology)/i;

  for (const line of lines) {
    const match = line.match(sectionHeaderPattern);
    if (match) {
      if (currentSection.lines.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { name: match[1], lines: [] };
    } else {
      currentSection.lines.push(line);
    }
  }

  if (currentSection.lines.length > 0) {
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Custom parser for Blood Pressure lines (e.g. "Blood Pressure: 120/80 mmHg").
 */
export function parseBloodPressureLine(line) {
  const match = line.match(/(?:blood\s*pressure|bp|b\.p\.)\s*[:=\-]?\s*(\d{2,3})\s*[\/|\\]\s*(\d{2,3})(?:\s*(?:mm\s*hg|mmhg))?/i);
  if (!match) return null;

  const systolic = parseInt(match[1], 10);
  const diastolic = parseInt(match[2], 10);

  if (isNaN(systolic) || isNaN(diastolic) || systolic < 50 || systolic > 260 || diastolic < 30 || diastolic > 160) {
    return null;
  }

  let status = 'normal';
  if (systolic >= 140 || diastolic >= 90) status = 'high';
  else if (systolic < 90 || diastolic < 60) status = 'low';

  return {
    name: 'Blood Pressure',
    rawName: 'Blood Pressure',
    value: `${systolic}/${diastolic}`,
    unit: 'mmHg',
    displayValue: `${systolic}/${diastolic} mmHg`,
    referenceRange: { low: 90, high: 120, rawText: '90-120 / 60-80' },
    status,
    ocrStatus: status,
    needsVerification: false,
  };
}

/**
 * Parses a single clinical measurement line into an ExtractedMetric object.
 */
export function parseGenericClinicalRow(line, sectionName = 'general', nextLines = []) {
  if (!line || typeof line !== 'string') return null;
  const clean = line.trim();
  if (clean.length < 3 || isAdministrativeOrMetadataLine(clean)) return null;

  // 1. Blood Pressure check
  if (/(?:blood\s*pressure|bp|b\.p\.)\s*[:=\-]?\s*\d{2,3}\s*[\/|\\]\s*\d{2,3}/i.test(clean)) {
    return parseBloodPressureLine(clean);
  }

  // 2. Extract numeric tokens
  const numberRegex = /(?:^|\s+)([><≤≥]?\s*(?:\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?))(?:\s+|$)/g;
  const matches = Array.from(clean.matchAll(numberRegex));
  if (matches.length === 0) return null;

  const scoredCandidates = [];

  for (const match of matches) {
    if (match.index === undefined) continue;
    const numMatchStr = match[1];
    const offset = match[0].indexOf(numMatchStr);
    const valStartIndex = match.index + offset;
    const valEndIndex = valStartIndex + numMatchStr.length;

    const paramNameCandidate = clean.slice(0, valStartIndex).trim();
    const remainder = clean.slice(valEndIndex).trim();

    if (!paramNameCandidate || paramNameCandidate.length < 2) continue;

    const canonicalMatch = matchCanonicalParameter(paramNameCandidate);
    if (!canonicalMatch) continue;

    // Disambiguate numeric value
    const disambiguation = disambiguateNumericString(numMatchStr, canonicalMatch);
    if (!disambiguation) continue;

    const numericVal = disambiguation.numericValue;

    // Parse remainder tokens (Unit, Ref Range, Status)
    const tokens = remainder.split(/\s+/).filter(Boolean);
    let rawUnitStr = '';
    let unitTokenIdx = -1;

    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      const normalized = normalizeUnit(tok);
      if (normalized && normalized !== tok) {
        rawUnitStr = tok;
        unitTokenIdx = i;
        break;
      }
    }

    const cleanTail = remainder;
    let refRange = null;

    // Extract reference range from tail or next lines
    const parsedInterval = parseReferenceInterval(cleanTail);
    if (parsedInterval) {
      refRange = parsedInterval;
    } else if (nextLines && nextLines.length > 0) {
      // Lookahead in subsequent lines if reference range was printed on next line
      for (const nextLine of nextLines.slice(0, 2)) {
        const nextInt = parseReferenceInterval(nextLine);
        if (nextInt && !matchCanonicalParameter(nextLine)) {
          refRange = nextInt;
          break;
        }
      }
    }

    // Status parsing
    let ocrStatus = 'unknown';
    if (/\b(critical|abnormal|\+)\b/i.test(cleanTail)) ocrStatus = 'high';
    else if (/\bnormal\b/i.test(cleanTail)) ocrStatus = 'normal';
    else if (/\bhigh\b/i.test(cleanTail)) ocrStatus = 'high';
    else if (/\blow\b/i.test(cleanTail)) ocrStatus = 'low';

    const normalizedUnit = rawUnitStr ? normalizeUnit(rawUnitStr) : canonicalMatch.defaultUnit;

    let finalRefRange = refRange;
    if (finalRefRange && isCorruptedReferenceRange(canonicalMatch.canonicalName, finalRefRange, normalizedUnit)) {
      finalRefRange = null;
    }

    const sanity = validateMetricSanity(
      canonicalMatch.canonicalName,
      numericVal,
      normalizedUnit,
      finalRefRange,
      { min: canonicalMatch.expectedMin, max: canonicalMatch.expectedMax },
      ocrStatus === 'unknown' ? undefined : ocrStatus
    );

    let status = ocrStatus;
    if (status === 'unknown' && finalRefRange) {
      if (typeof finalRefRange.low === 'number' && typeof finalRefRange.high === 'number') {
        if (numericVal < finalRefRange.low) status = 'low';
        else if (numericVal > finalRefRange.high) status = 'high';
        else status = 'normal';
      } else if (finalRefRange.threshold !== undefined && finalRefRange.operator) {
        if (finalRefRange.operator === '<' || finalRefRange.operator === '<=') {
          status = numericVal > finalRefRange.threshold ? 'high' : 'normal';
        } else if (finalRefRange.operator === '>' || finalRefRange.operator === '>=') {
          status = numericVal < finalRefRange.threshold ? 'low' : 'normal';
        }
      }
    }

    const metric = {
      name: canonicalMatch.canonicalName,
      rawName: paramNameCandidate,
      value: numericVal,
      unit: normalizedUnit,
      displayValue: `${numericVal} ${normalizedUnit}`.trim(),
      referenceRange: finalRefRange || undefined,
      status,
      ocrStatus: ocrStatus !== 'unknown' ? ocrStatus : undefined,
      needsVerification: sanity.needsVerification || disambiguation.confidenceScore < 0.8,
      verificationReason: sanity.verificationReason,
    };

    let score = 100;
    if (rawUnitStr) score += 30;
    if (refRange) score += 40;
    if (ocrStatus !== 'unknown') score += 20;

    scoredCandidates.push({ metric, score });
  }

  if (scoredCandidates.length === 0) return null;
  scoredCandidates.sort((a, b) => b.score - a.score);
  return scoredCandidates[0].metric;
}

/**
 * Extracts a clinical collection or reporting date from OCR text and normalizes to YYYY-MM-DD.
 */
export function extractReportDateFromText(ocrText) {
  if (!ocrText || typeof ocrText !== 'string') return null;

  // Patterns for dates commonly present in medical reports
  // 1. Date: 12/04/2025 or 12-04-2025
  const dateWithContextRegex = /(?:date|collected|reported|sample\s*date|reg\.?\s*date)\s*[:=\-]?\s*([0-3]?\d[\/\-\.][0-1]?\d[\/\-\.](?:20|19)\d{2})/i;
  const matchContext = ocrText.match(dateWithContextRegex);
  if (matchContext && matchContext[1]) {
    const parsed = normalizeDateString(matchContext[1]);
    if (parsed) return parsed;
  }

  // 2. Standalone dates: DD/MM/YYYY or YYYY-MM-DD
  const standaloneIsoRegex = /\b((?:20|19)\d{2}[-\/\.][0-1]?\d[-\/\.][0-3]?\d)\b/;
  const isoMatch = ocrText.match(standaloneIsoRegex);
  if (isoMatch && isoMatch[1]) {
    const parsed = normalizeDateString(isoMatch[1]);
    if (parsed) return parsed;
  }

  const standaloneDmyRegex = /\b([0-3]?\d[\/\-\.][0-1]?\d[\/\-\.](?:20|19)\d{2})\b/;
  const dmyMatch = ocrText.match(standaloneDmyRegex);
  if (dmyMatch && dmyMatch[1]) {
    const parsed = normalizeDateString(dmyMatch[1]);
    if (parsed) return parsed;
  }

  // 3. Textual month dates: "18-Oct-2025", "15 Oct 2025", "15/Oct/2025"
  const monthTextRegex = /\b([0-3]?\d)[-\/\s]+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[-\/\s]+((?:20|19)\d{2})\b/i;
  const monthMatch = ocrText.match(monthTextRegex);
  if (monthMatch) {
    const day = parseInt(monthMatch[1], 10);
    const monthStr = monthMatch[2].toLowerCase().slice(0, 3);
    const year = parseInt(monthMatch[3], 10);
    const months = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
    const month = months[monthStr];
    if (month && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  return null;
}

function normalizeDateString(rawDateStr) {
  const parts = rawDateStr.split(/[\/\-\.]/);
  if (parts.length !== 3) return null;

  // Case 1: YYYY-MM-DD
  if (parts[0].length === 4) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  // Case 2: DD/MM/YYYY or MM/DD/YYYY
  const p1 = parseInt(parts[0], 10);
  const p2 = parseInt(parts[1], 10);
  const y = parseInt(parts[2], 10);

  if (p1 > 12 && p1 <= 31 && p2 >= 1 && p2 <= 12) {
    // Definitely DD/MM/YYYY
    return `${y}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
  } else if (p2 > 12 && p2 <= 31 && p1 >= 1 && p1 <= 12) {
    // Definitely MM/DD/YYYY
    return `${y}-${String(p1).padStart(2, '0')}-${String(p2).padStart(2, '0')}`;
  } else if (p1 >= 1 && p1 <= 31 && p2 >= 1 && p2 <= 12) {
    // Default to DD/MM/YYYY
    return `${y}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
  }

  return null;
}

/**
 * Extracts all clinical measurements and metadata from raw OCR or PDF text.
 */
export function extractHealthData(ocrText, options = {}) {
  const source = options.source || 'ocr';

  if (!ocrText || typeof ocrText !== 'string') {
    return {
      title: 'Medical Record',
      reportType: 'general',
      metrics: [],
      results: {},
      summary: 'No readable text content provided.',
      source,
    };
  }

  const sections = segmentDocumentSections(ocrText);
  const extractedMetrics = [];
  const extractedResultsMap = {};
  const processedKeys = new Set();

  for (const sec of sections) {
    for (let i = 0; i < sec.lines.length; i++) {
      const line = sec.lines[i];
      if (isAdministrativeOrMetadataLine(line)) continue;

      const nextLines = sec.lines.slice(i + 1, Math.min(sec.lines.length, i + 4));
      const parsedMetric = parseGenericClinicalRow(line, sec.name, nextLines);

      if (parsedMetric && !processedKeys.has(parsedMetric.name)) {
        processedKeys.add(parsedMetric.name);
        extractedMetrics.push(parsedMetric);
        extractedResultsMap[parsedMetric.name] = parsedMetric.displayValue;
      }
    }
  }

  // Determine Report Title and Category
  const hasCbc = extractedMetrics.some((m) => ['Hemoglobin', 'Total RBC', 'WBC', 'Platelets', 'Hematocrit'].includes(m.name));
  const hasLipid = extractedMetrics.some((m) => ['Total Cholesterol', 'HDL Cholesterol', 'LDL Cholesterol', 'Triglycerides'].includes(m.name));
  const hasHepatic = extractedMetrics.some((m) => ['SGOT', 'SGPT', 'Total Bilirubin', 'Alkaline Phosphatase'].includes(m.name));
  const hasThyroid = extractedMetrics.some((m) => ['TSH', 'Total T3', 'Free T3', 'Total T4', 'Free T4'].includes(m.name));
  const hasIron = extractedMetrics.some((m) => ['Serum Iron', 'Ferritin', 'TIBC'].includes(m.name));
  const hasHbA1c = extractedMetrics.some((m) => m.name === 'HbA1c' || m.name === 'Estimated Average Glucose');
  const hasGlucose = extractedMetrics.some((m) => ['Fasting Glucose', 'Postprandial Glucose', 'Blood Glucose'].includes(m.name));

  let reportType = 'general';
  let title = 'General Health Report';

  if (hasCbc && (hasHepatic || hasIron || hasLipid || hasHbA1c || hasGlucose || extractedMetrics.length >= 6)) {
    reportType = 'cbc';
    title = 'Comprehensive Multi-Panel Health Report';
  } else if (hasCbc) {
    reportType = 'cbc';
    title = 'Complete Blood Count (CBC)';
  } else if (hasLipid) {
    reportType = 'cardiology';
    title = 'Lipid Profile Report';
  } else if (hasHepatic) {
    reportType = 'general';
    title = 'Liver Function Test (LFT)';
  } else if (hasThyroid) {
    reportType = 'general';
    title = 'Thyroid Function Panel (TSH)';
  } else if (hasHbA1c || hasGlucose) {
    reportType = 'general';
    title = 'Glycemic Control & Diabetes Panel';
  } else if (hasIron) {
    reportType = 'general';
    title = 'Iron Profile Report';
  }

  const extractedDate = extractReportDateFromText(ocrText);

  const summary = extractedMetrics.length > 0
    ? `Extracted ${extractedMetrics.length} clinical measurement(s): ${extractedMetrics.map((m) => m.displayValue).join(', ')}.`
    : 'No quantitative clinical metrics detected in document.';

  return {
    title,
    reportType,
    metrics: extractedMetrics,
    results: extractedResultsMap,
    summary,
    extractedDate,
    source,
  };
}
