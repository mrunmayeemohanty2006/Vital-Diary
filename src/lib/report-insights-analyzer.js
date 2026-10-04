/**
 * Deterministic Report Insights Analyzer
 * 
 * Analyzes uploaded medical report lab values, compares with report reference ranges,
 * flags abnormal (High / Low) results, and attaches authoritative medical evidence-based
 * insights (meaning, causes, general management, doctor consultation criteria, and sources).
 * 
 * 100% Deterministic & Local. No AI / LLM inference.
 */

import { matchBiomarkerKey, BIOMARKER_PROFILES, parseNumericValue } from './health-trends-data';
import {
  CLINICAL_INSIGHTS_KB,
  getGenericBiomarkerInsight,
  getNormalBiomarkerInsight,
} from './clinical-insights-kb';
import { extractHealthData } from './health-extractor';

/**
 * Normalizes and extracts all individual test results from a report record.
 */
export function extractReportTestItems(record) {
  if (!record) return [];

  const items = [];
  const seenKeys = new Set();

  // 1. Direct extractedMetrics array
  if (Array.isArray(record.extractedMetrics) && record.extractedMetrics.length > 0) {
    for (const metric of record.extractedMetrics) {
      if (!metric || !metric.name) continue;
      const key = matchBiomarkerKey(metric.name) || metric.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);

      const parsedVal = parseNumericValue(metric.value ?? metric.displayValue);
      let numVal = typeof parsedVal === 'number' ? parsedVal : null;
      let displayVal = metric.displayValue || `${metric.value ?? ''} ${metric.unit ?? ''}`.trim();

      // Handle Blood Pressure special object
      if (parsedVal && typeof parsedVal === 'object' && parsedVal.systolic !== undefined) {
        displayVal = `${parsedVal.systolic}/${parsedVal.diastolic} mmHg`;
      }

      items.push({
        rawName: metric.rawName || metric.name,
        name: metric.name,
        key,
        value: numVal ?? metric.value,
        numericValue: numVal,
        unit: metric.unit || '',
        displayValue: displayVal,
        referenceRange: metric.referenceRange || null,
        status: metric.status || null,
      });
    }
  }

  // 2. Extracted results map (e.g. { 'Hemoglobin': '13.5 g/dL' })
  if (record.results && typeof record.results === 'object') {
    for (const [rawKey, rawVal] of Object.entries(record.results)) {
      const key = matchBiomarkerKey(rawKey) || rawKey.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);

      const parsedVal = parseNumericValue(rawVal);
      const numVal = typeof parsedVal === 'number' ? parsedVal : null;
      let displayVal = String(rawVal);

      if (parsedVal && typeof parsedVal === 'object' && parsedVal.systolic !== undefined) {
        displayVal = `${parsedVal.systolic}/${parsedVal.diastolic} mmHg`;
      }

      items.push({
        rawName: rawKey,
        name: rawKey,
        key,
        value: numVal ?? rawVal,
        numericValue: numVal,
        unit: '',
        displayValue: displayVal,
        referenceRange: null,
        status: null,
      });
    }
  }

  // 3. Fallback: Parse notes or OCR text if items list is empty
  if (items.length === 0 && (record.notes || record.rawOcrText)) {
    try {
      const fallbackData = extractHealthData(record.rawOcrText || record.notes);
      if (Array.isArray(fallbackData.metrics) && fallbackData.metrics.length > 0) {
        for (const metric of fallbackData.metrics) {
          const key = matchBiomarkerKey(metric.name) || metric.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
          if (seenKeys.has(key)) continue;
          seenKeys.add(key);

          const parsedVal = parseNumericValue(metric.value);
          const numVal = typeof parsedVal === 'number' ? parsedVal : null;

          items.push({
            rawName: metric.rawName || metric.name,
            name: metric.name,
            key,
            value: numVal ?? metric.value,
            numericValue: numVal,
            unit: metric.unit || '',
            displayValue: metric.displayValue || `${metric.value} ${metric.unit}`,
            referenceRange: metric.referenceRange || null,
            status: metric.status || null,
          });
        }
      }
    } catch {
      // Fallback ignore
    }
  }

  return items;
}

/**
 * Evaluates a single lab item against its reference interval
 */
export function evaluateItemStatus(item) {
  let status = item.status;
  const numVal = item.numericValue;
  const profile = BIOMARKER_PROFILES[item.key] || null;
  const kbProfile = CLINICAL_INSIGHTS_KB[item.key] || null;
  const ref = item.referenceRange || 
    (profile ? { low: profile.normalRange.low, high: profile.normalRange.high } : (kbProfile?.defaultRange ? kbProfile.defaultRange : null));

  // Check blood pressure
  if (item.key === 'blood_pressure' || item.name.toLowerCase().includes('blood pressure')) {
    if (typeof item.value === 'string') {
      const bpMatch = item.value.match(/(\d{2,3})\s*[\/|\\]\s*(\d{2,3})/);
      if (bpMatch) {
        const sys = parseInt(bpMatch[1], 10);
        const dia = parseInt(bpMatch[2], 10);
        if (sys >= 130 || dia >= 85) return 'high';
        if (sys < 90 || dia < 60) return 'low';
        return 'normal';
      }
    }
  }

  if (numVal !== null && ref) {
    if (typeof ref.low === 'number' && typeof ref.high === 'number') {
      if (numVal < ref.low) status = 'low';
      else if (numVal > ref.high) status = 'high';
      else status = 'normal';
    } else if (ref.threshold !== undefined && ref.operator) {
      if (ref.operator === '<' || ref.operator === '<=') {
        status = numVal > ref.threshold ? 'high' : 'normal';
      } else if (ref.operator === '>' || ref.operator === '>=') {
        status = numVal < ref.threshold ? 'low' : 'normal';
      }
    }
  }

  if (!status || status === 'unknown') {
    status = 'normal';
  }

  return status;
}

/**
 * Formats a clean, readable reference interval string
 */
export function formatReferenceRangeString(item) {
  const profile = BIOMARKER_PROFILES[item.key];
  const kbProfile = CLINICAL_INSIGHTS_KB[item.key];
  const ref = item.referenceRange || 
    (profile ? { low: profile.normalRange.low, high: profile.normalRange.high } : (kbProfile?.defaultRange ? kbProfile.defaultRange : null));
  const unit = item.unit || (profile ? profile.unit : (kbProfile ? kbProfile.unit : ''));

  if (!ref) {
    return 'Standard Clinical Baseline';
  }

  if (typeof ref.low === 'number' && typeof ref.high === 'number') {
    return `${ref.low} – ${ref.high} ${unit}`.trim();
  }

  if (ref.rawText) {
    return `${ref.rawText} ${unit}`.trim();
  }

  if (ref.operator && ref.threshold !== undefined) {
    return `${ref.operator} ${ref.threshold} ${unit}`.trim();
  }

  return 'Standard Reference Range';
}

/**
 * Analyzes a full medical record and produces structured clinical insights.
 */
export function analyzeReportInsights(record) {
  if (!record) return null;

  const testItems = extractReportTestItems(record);
  const analyzedFindings = [];

  let abnormalCount = 0;
  let normalCount = 0;
  let highCount = 0;
  let lowCount = 0;

  for (const rawItem of testItems) {
    const status = evaluateItemStatus(rawItem);
    const isAbnormal = status === 'high' || status === 'low';
    const profile = BIOMARKER_PROFILES[rawItem.key];
    const unit = rawItem.unit || (profile ? profile.unit : '');
    const refRangeStr = formatReferenceRangeString(rawItem);

    // Retrieve knowledge base content
    const kbEntry = CLINICAL_INSIGHTS_KB[rawItem.key];
    let insightData = null;

    if (isAbnormal) {
      if (kbEntry && kbEntry[status]) {
        insightData = {
          ...kbEntry[status],
          displayName: kbEntry.name || rawItem.name,
          category: kbEntry.category || record.category || 'Clinical Laboratory',
        };
      } else {
        const fallback = getGenericBiomarkerInsight(rawItem.name, status, rawItem.value, unit, rawItem.referenceRange);
        insightData = {
          ...fallback,
          displayName: rawItem.name,
          category: record.category || 'Clinical Laboratory',
        };
      }
      abnormalCount++;
      if (status === 'high') highCount++;
      if (status === 'low') lowCount++;
    } else {
      normalCount++;
      if (kbEntry && kbEntry.normal) {
        insightData = {
          ...kbEntry.normal,
          displayName: kbEntry.name || rawItem.name,
          category: kbEntry.category || record.category || 'Clinical Laboratory',
        };
      } else {
        const normalFallback = getNormalBiomarkerInsight(rawItem.name, rawItem.value, unit, rawItem.referenceRange);
        insightData = {
          ...normalFallback,
          displayName: rawItem.name,
          category: record.category || 'Clinical Laboratory',
        };
      }
    }

    analyzedFindings.push({
      itemKey: rawItem.key,
      name: rawItem.name,
      displayName: insightData?.displayName || rawItem.name,
      rawName: rawItem.rawName,
      value: rawItem.value,
      numericValue: rawItem.numericValue,
      unit,
      displayValue: rawItem.displayValue,
      referenceRangeString: refRangeStr,
      status, // 'high', 'low', 'normal'
      isAbnormal,
      meaning: insightData.meaning,
      commonCauses: insightData.commonCauses || [],
      management: insightData.management || [],
      whenToConsultDoctor: insightData.whenToConsultDoctor || [],
      sources: insightData.sources || [],
      statusLabel: insightData.statusLabel || `${rawItem.name}: ${status.toUpperCase()}`,
      category: insightData.category || record.category || 'General Diagnostics',
    });
  }

  // Sort abnormal items to the top
  const sortedFindings = [...analyzedFindings].sort((a, b) => {
    if (a.isAbnormal && !b.isAbnormal) return -1;
    if (!a.isAbnormal && b.isAbnormal) return 1;
    return 0;
  });

  const abnormalItems = sortedFindings.filter((f) => f.isAbnormal);
  const normalItems = sortedFindings.filter((f) => !f.isAbnormal);

  return {
    reportId: record.id,
    reportTitle: record.title || record.fileName || 'Medical Document',
    reportCategory: record.category || 'General',
    reportDate: record.date || (record.uploadedAt ? record.uploadedAt.split('T')[0] : 'Undated'),
    provider: record.provider || record.doctor || 'Healthcare Provider',
    fileUrl: record.fileUrl || '',
    filePath: record.filePath || '',
    fileName: record.fileName || 'report.pdf',
    totalTested: testItems.length,
    abnormalCount,
    normalCount,
    highCount,
    lowCount,
    findings: sortedFindings,
    abnormalItems,
    normalItems,
    hasAbnormalities: abnormalCount > 0,
  };
}

/**
 * Analyzes all records in the user's vault to generate a comprehensive insights summary.
 */
export function analyzeAllUserReports(records) {
  if (!Array.isArray(records) || records.length === 0) {
    return {
      reportsCount: 0,
      totalParametersTested: 0,
      totalAbnormalFindings: 0,
      totalNormalFindings: 0,
      reportAnalyses: [],
      allAbnormalFindings: [],
    };
  }

  const reportAnalyses = [];
  const allAbnormalFindings = [];
  let totalParametersTested = 0;
  let totalAbnormalFindings = 0;
  let totalNormalFindings = 0;

  for (const record of records) {
    const analysis = analyzeReportInsights(record);
    if (analysis) {
      reportAnalyses.push(analysis);
      totalParametersTested += analysis.totalTested;
      totalAbnormalFindings += analysis.abnormalCount;
      totalNormalFindings += analysis.normalCount;

      analysis.abnormalItems.forEach((item) => {
        allAbnormalFindings.push({
          ...item,
          reportId: analysis.reportId,
          reportTitle: analysis.reportTitle,
          reportDate: analysis.reportDate,
          provider: analysis.provider,
        });
      });
    }
  }

  return {
    reportsCount: records.length,
    totalParametersTested,
    totalAbnormalFindings,
    totalNormalFindings,
    reportAnalyses,
    allAbnormalFindings,
  };
}
