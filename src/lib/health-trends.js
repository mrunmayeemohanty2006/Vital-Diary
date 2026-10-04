/**
 * Deterministic Health Metric Trend Engine
 * 
 * Compares the same health metric across two or more reports over time.
 * Calculates exact percentage change and clinical direction (Improvement vs Deterioration).
 * 100% Client-Side & Deterministic — Zero AI or external medical APIs.
 */

/**
 * Standard biomarker definitions with clinical targets and normalization rules.
 */
export const BIOMARKER_PROFILES = {
  hemoglobin: {
    key: 'hemoglobin',
    name: 'Hemoglobin',
    unit: 'g/dL',
    category: 'Hematology',
    clinicalGoal: 'normal_range', // Closer to normal midpoint is better
    normalRange: { low: 12.0, high: 16.5, midpoint: 14.25 },
    aliases: ['hemoglobin', 'hgb', 'hb', 'haemoglobin', 'hemoglobin (hgb)'],
  },
  glucose: {
    key: 'glucose',
    name: 'Fasting Blood Glucose',
    unit: 'mg/dL',
    category: 'Metabolic',
    clinicalGoal: 'lower_is_better_in_range', // Lower within normal range (< 100) is better
    normalRange: { low: 70, high: 99, midpoint: 85 },
    aliases: ['glucose', 'fasting glucose', 'fasting blood glucose', 'fbs', 'blood sugar', 'glucose (fasting)'],
  },
  total_cholesterol: {
    key: 'total_cholesterol',
    name: 'Total Cholesterol',
    unit: 'mg/dL',
    category: 'Lipid Panel',
    clinicalGoal: 'lower_is_better', // Lower (< 200) is better
    normalRange: { low: 120, high: 199, midpoint: 160 },
    aliases: ['total cholesterol', 'cholesterol', 'serum cholesterol', 'cholesterol, total'],
  },
  ldl_cholesterol: {
    key: 'ldl_cholesterol',
    name: 'LDL Cholesterol',
    unit: 'mg/dL',
    category: 'Lipid Panel',
    clinicalGoal: 'lower_is_better', // Lower (< 100) is better
    normalRange: { low: 50, high: 99, midpoint: 75 },
    aliases: ['ldl', 'ldl cholesterol', 'ldl-c', 'low density lipoprotein'],
  },
  hdl_cholesterol: {
    key: 'hdl_cholesterol',
    name: 'HDL Cholesterol',
    unit: 'mg/dL',
    category: 'Lipid Panel',
    clinicalGoal: 'higher_is_better', // Higher (> 40 / > 50) is better
    normalRange: { low: 40, high: 90, midpoint: 65 },
    aliases: ['hdl', 'hdl cholesterol', 'hdl-c', 'high density lipoprotein'],
  },
  triglycerides: {
    key: 'triglycerides',
    name: 'Triglycerides',
    unit: 'mg/dL',
    category: 'Lipid Panel',
    clinicalGoal: 'lower_is_better', // Lower (< 150) is better
    normalRange: { low: 50, high: 149, midpoint: 100 },
    aliases: ['triglycerides', 'triglyceride', 'tg'],
  },
  hba1c: {
    key: 'hba1c',
    name: 'HbA1c',
    unit: '%',
    category: 'Glycemic Control',
    clinicalGoal: 'lower_is_better', // Lower (< 5.7%) is better
    normalRange: { low: 4.0, high: 5.6, midpoint: 4.8 },
    aliases: ['hba1c', 'a1c', 'glycated hemoglobin', 'hemoglobin a1c'],
  },
  blood_pressure_systolic: {
    key: 'blood_pressure_systolic',
    name: 'Blood Pressure (Systolic)',
    unit: 'mmHg',
    category: 'Cardiovascular',
    clinicalGoal: 'lower_is_better_in_range', // Lower towards 115-120 is better
    normalRange: { low: 95, high: 120, midpoint: 110 },
    aliases: ['systolic', 'systolic bp', 'blood pressure systolic'],
  },
  blood_pressure_diastolic: {
    key: 'blood_pressure_diastolic',
    name: 'Blood Pressure (Diastolic)',
    unit: 'mmHg',
    category: 'Cardiovascular',
    clinicalGoal: 'lower_is_better_in_range', // Lower towards 75-80 is better
    normalRange: { low: 60, high: 80, midpoint: 70 },
    aliases: ['diastolic', 'diastolic bp', 'blood pressure diastolic'],
  },
  platelets: {
    key: 'platelets',
    name: 'Platelet Count',
    unit: 'K/uL',
    category: 'Hematology',
    clinicalGoal: 'normal_range',
    normalRange: { low: 150, high: 450, midpoint: 300 },
    aliases: ['platelets', 'platelet count', 'plt'],
  },
  creatinine: {
    key: 'creatinine',
    name: 'Serum Creatinine',
    unit: 'mg/dL',
    category: 'Renal Panel',
    clinicalGoal: 'lower_is_better_in_range',
    normalRange: { low: 0.6, high: 1.2, midpoint: 0.9 },
    aliases: ['creatinine', 'serum creatinine', 'creat'],
  },
  heart_rate: {
    key: 'heart_rate',
    name: 'Resting Heart Rate',
    unit: 'bpm',
    category: 'Cardiovascular',
    clinicalGoal: 'normal_range',
    normalRange: { low: 60, high: 100, midpoint: 72 },
    aliases: ['heart rate', 'pulse', 'pulse rate', 'hr', 'resting heart rate'],
  },
};

/**
 * Normalizes a metric name string to match a canonical biomarker key.
 */
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

  // Generic key generation for arbitrary biomarkers
  return clean.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

/**
 * Parses numeric value from a string or number safely.
 */
export function parseNumericValue(val) {
  if (typeof val === 'number') {
    return isNaN(val) ? null : val;
  }
  if (!val || typeof val !== 'string') return null;

  // Check for blood pressure pair like "120/80"
  const bpMatch = val.match(/(\d{2,3})\s*[\/|\\]\s*(\d{2,3})/);
  if (bpMatch) {
    return {
      systolic: parseFloat(bpMatch[1]),
      diastolic: parseFloat(bpMatch[2]),
    };
  }

  // Clean numeric string
  const clean = val.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Extracts all valid numeric health metric readings from a single medical record.
 * 
 * @param {Object} record - Medical record
 * @returns {Array<Object>} List of extracted metric readings
 */
export function extractRecordMetricReadings(record) {
  if (!record) return [];

  const readings = [];
  const dateStr = record.date || (record.uploadedAt ? record.uploadedAt.split('T')[0] : '');
  if (!dateStr) return [];

  const seenKeys = new Set();

  // 1. Process extractedMetrics array
  if (Array.isArray(record.extractedMetrics)) {
    for (const metric of record.extractedMetrics) {
      if (!metric) continue;
      const rawName = metric.name || metric.rawName || '';
      if (!rawName) continue;

      // Handle Blood Pressure composite string
      if (rawName.toLowerCase().includes('blood pressure') || rawName.toLowerCase() === 'bp') {
        const bp = parseNumericValue(metric.value || metric.displayValue);
        if (bp && typeof bp === 'object') {
          if (!seenKeys.has('blood_pressure_systolic')) {
            readings.push({
              metricKey: 'blood_pressure_systolic',
              metricName: 'Blood Pressure (Systolic)',
              value: bp.systolic,
              unit: 'mmHg',
              status: bp.systolic > 120 ? 'high' : bp.systolic < 90 ? 'low' : 'normal',
              referenceRange: { rawText: '< 120 mmHg', low: 90, high: 120 },
              reportId: record.id,
              reportTitle: record.title || 'Medical Report',
              reportDate: dateStr,
              category: record.category || 'Cardiology',
            });
            seenKeys.has('blood_pressure_systolic');
          }
          if (!seenKeys.has('blood_pressure_diastolic')) {
            readings.push({
              metricKey: 'blood_pressure_diastolic',
              metricName: 'Blood Pressure (Diastolic)',
              value: bp.diastolic,
              unit: 'mmHg',
              status: bp.diastolic > 80 ? 'high' : bp.diastolic < 60 ? 'low' : 'normal',
              referenceRange: { rawText: '< 80 mmHg', low: 60, high: 80 },
              reportId: record.id,
              reportTitle: record.title || 'Medical Report',
              reportDate: dateStr,
              category: record.category || 'Cardiology',
            });
            seenKeys.add('blood_pressure_diastolic');
          }
          continue;
        }
      }

      const numVal = parseNumericValue(metric.value ?? metric.displayValue);
      if (typeof numVal === 'number' && !isNaN(numVal)) {
        const key = matchBiomarkerKey(rawName);
        if (key && !seenKeys.has(key)) {
          const profile = BIOMARKER_PROFILES[key];
          readings.push({
            metricKey: key,
            metricName: profile ? profile.name : rawName,
            value: numVal,
            unit: metric.unit || profile?.unit || '',
            status: metric.status || 'normal',
            referenceRange: metric.referenceRange || (profile ? { rawText: `${profile.normalRange.low} - ${profile.normalRange.high} ${profile.unit}`, low: profile.normalRange.low, high: profile.normalRange.high } : null),
            reportId: record.id,
            reportTitle: record.title || 'Medical Report',
            reportDate: dateStr,
            category: record.category || 'Lab Results',
          });
          seenKeys.add(key);
        }
      }
    }
  }

  // 2. Process record.results dictionary if not already added
  if (record.results && typeof record.results === 'object') {
    for (const [keyName, rawVal] of Object.entries(record.results)) {
      const matchedKey = matchBiomarkerKey(keyName);
      if (matchedKey && !seenKeys.has(matchedKey)) {
        const numVal = parseNumericValue(rawVal);
        if (typeof numVal === 'number' && !isNaN(numVal)) {
          const profile = BIOMARKER_PROFILES[matchedKey];
          readings.push({
            metricKey: matchedKey,
            metricName: profile ? profile.name : keyName,
            value: numVal,
            unit: profile?.unit || '',
            status: 'normal',
            referenceRange: profile ? { rawText: `${profile.normalRange.low} - ${profile.normalRange.high} ${profile.unit}`, low: profile.normalRange.low, high: profile.normalRange.high } : null,
            reportId: record.id,
            reportTitle: record.title || 'Medical Report',
            reportDate: dateStr,
            category: record.category || 'Lab Results',
          });
          seenKeys.add(matchedKey);
        }
      }
    }
  }

  // 3. Fallback extraction from notes / title text if structured metrics were missing
  const fullText = `${record.title || ''} ${record.notes || ''}`;
  for (const [key, profile] of Object.entries(BIOMARKER_PROFILES)) {
    if (seenKeys.has(key)) continue;

    if (key === 'blood_pressure_systolic' || key === 'blood_pressure_diastolic') {
      const bpMatch = fullText.match(/(?:bp|blood\s*pressure)[\s:=]+(\d{2,3})\s*[\/|\\]\s*(\d{2,3})/i) || fullText.match(/\b(\d{2,3})\s*[\/|\\]\s*(\d{2,3})\s*(?:mmhg)?\b/i);
      if (bpMatch) {
        const s = parseFloat(bpMatch[1]);
        const d = parseFloat(bpMatch[2]);
        if (s >= 50 && s <= 260 && d >= 30 && d <= 160) {
          if (key === 'blood_pressure_systolic') {
            readings.push({
              metricKey: 'blood_pressure_systolic',
              metricName: 'Blood Pressure (Systolic)',
              value: s,
              unit: 'mmHg',
              status: s > 120 ? 'high' : s < 90 ? 'low' : 'normal',
              referenceRange: { rawText: '< 120 mmHg', low: 90, high: 120 },
              reportId: record.id,
              reportTitle: record.title || 'Medical Report',
              reportDate: dateStr,
              category: record.category || 'Cardiology',
            });
            seenKeys.add('blood_pressure_systolic');
          } else {
            readings.push({
              metricKey: 'blood_pressure_diastolic',
              metricName: 'Blood Pressure (Diastolic)',
              value: d,
              unit: 'mmHg',
              status: d > 80 ? 'high' : d < 60 ? 'low' : 'normal',
              referenceRange: { rawText: '< 80 mmHg', low: 60, high: 80 },
              reportId: record.id,
              reportTitle: record.title || 'Medical Report',
              reportDate: dateStr,
              category: record.category || 'Cardiology',
            });
            seenKeys.add('blood_pressure_diastolic');
          }
        }
      }
      continue;
    }

    for (const alias of profile.aliases) {
      const pattern = new RegExp(`(?:${alias})[\\s:=]+(\\d+(?:\\.\\d+)?)`, 'i');
      const match = fullText.match(pattern);
      if (match) {
        const numVal = parseFloat(match[1]);
        if (!isNaN(numVal)) {
          readings.push({
            metricKey: key,
            metricName: profile.name,
            value: numVal,
            unit: profile.unit,
            status: 'normal',
            referenceRange: { rawText: `${profile.normalRange.low} - ${profile.normalRange.high} ${profile.unit}`, low: profile.normalRange.low, high: profile.normalRange.high },
            reportId: record.id,
            reportTitle: record.title || 'Medical Report',
            reportDate: dateStr,
            category: record.category || 'Lab Results',
          });
          seenKeys.add(key);
          break;
        }
      }
    }
  }

  return readings;
}

/**
 * Evaluates whether a change in metric value represents clinical improvement, deterioration, or stability.
 * 
 * @param {string} metricKey - Key of the biomarker
 * @param {number} initialVal - Baseline reading
 * @param {number} latestVal - Latest reading
 * @param {Object} referenceRange - Reference range if available
 * @returns {Object} Trend evaluation
 */
export function evaluateMetricTrend(metricKey, initialVal, latestVal, referenceRange = null) {
  if (typeof initialVal !== 'number' || typeof latestVal !== 'number' || isNaN(initialVal) || isNaN(latestVal)) {
    return {
      status: 'insufficient',
      direction: 'stable',
      percentageChange: 0,
      label: 'Insufficient Data',
      isImprovement: false,
      isDeterioration: false,
    };
  }

  if (initialVal === 0) {
    return {
      status: 'stable',
      direction: 'stable',
      percentageChange: 0,
      label: 'Health stable (0.0% change)',
      isImprovement: false,
      isDeterioration: false,
    };
  }

  const rawChange = ((latestVal - initialVal) / initialVal) * 100;
  const absChange = Math.abs(rawChange);
  const formattedPct = Math.round(absChange * 10) / 10;

  // If change is negligible (< 0.1%)
  if (formattedPct < 0.1) {
    return {
      status: 'stable',
      direction: 'stable',
      percentageChange: 0,
      label: 'Health stable (0.0% change)',
      isImprovement: false,
      isDeterioration: false,
      rawDiff: latestVal - initialVal,
    };
  }

  const profile = BIOMARKER_PROFILES[metricKey];
  const goal = profile?.clinicalGoal || 'normal_range';
  let isImprovement = false;

  if (goal === 'lower_is_better') {
    // Lower is better (Total Cholesterol, LDL, Triglycerides, HbA1c)
    isImprovement = latestVal < initialVal;
  } else if (goal === 'higher_is_better') {
    // Higher is better (HDL Cholesterol)
    isImprovement = latestVal > initialVal;
  } else if (goal === 'lower_is_better_in_range') {
    // Lower towards normal range is better (Fasting Glucose, Blood Pressure, Creatinine)
    const mid = profile?.normalRange?.midpoint || (referenceRange?.low && referenceRange?.high ? (referenceRange.low + referenceRange.high) / 2 : 100);
    // If baseline was elevated, decreasing towards midpoint is improvement
    if (initialVal > mid) {
      isImprovement = latestVal < initialVal;
    } else {
      isImprovement = Math.abs(latestVal - mid) <= Math.abs(initialVal - mid);
    }
  } else {
    // Normal range centered (Hemoglobin, Platelets, Heart Rate, WBC)
    const midpoint = profile?.normalRange?.midpoint || (referenceRange?.low && referenceRange?.high ? (referenceRange.low + referenceRange.high) / 2 : (initialVal + latestVal) / 2);
    const distInitial = Math.abs(initialVal - midpoint);
    const distLatest = Math.abs(latestVal - midpoint);
    isImprovement = distLatest < distInitial;
  }

  const label = isImprovement
    ? `Health improved by ${formattedPct.toFixed(1)}%`
    : `Health decreased by ${formattedPct.toFixed(1)}%`;

  return {
    status: isImprovement ? 'improved' : 'decreased',
    direction: isImprovement ? 'positive' : 'negative',
    percentageChange: formattedPct,
    label,
    isImprovement,
    isDeterioration: !isImprovement,
    rawDiff: Math.round((latestVal - initialVal) * 100) / 100,
  };
}

/**
 * Extracts and groups all valid longitudinal health trends across a user's medical reports.
 * 
 * @param {Array<Object>} records - Array of user medical records
 * @returns {Array<Object>} Array of health trend series (only metrics with 2+ reports)
 */
export function extractHealthTrends(records = []) {
  if (!Array.isArray(records) || records.length === 0) return [];

  // Filter approved/verified records and sort chronologically (oldest first to newest last)
  const validRecords = records
    .filter((r) => Boolean(r && (r.date || r.uploadedAt)))
    .sort((a, b) => {
      const dateA = new Date(a.date || a.uploadedAt).getTime() || 0;
      const dateB = new Date(b.date || b.uploadedAt).getTime() || 0;
      return dateA - dateB;
    });

  // Group readings by metricKey
  const metricsMap = new Map();

  for (const record of validRecords) {
    const readings = extractRecordMetricReadings(record);
    for (const reading of readings) {
      if (!metricsMap.has(reading.metricKey)) {
        metricsMap.set(reading.metricKey, {
          metricKey: reading.metricKey,
          metricName: reading.metricName,
          unit: reading.unit,
          referenceRange: reading.referenceRange,
          points: [],
        });
      }
      const metricGroup = metricsMap.get(reading.metricKey);
      metricGroup.points.push(reading);
    }
  }

  const resultTrends = [];

  for (const [key, group] of metricsMap.entries()) {
    // Only include metrics with 2 or more reports over time
    if (group.points.length >= 2) {
      const firstPoint = group.points[0];
      const lastPoint = group.points[group.points.length - 1];

      const evaluation = evaluateMetricTrend(
        key,
        firstPoint.value,
        lastPoint.value,
        group.referenceRange
      );

      resultTrends.push({
        metricKey: key,
        metricName: group.metricName,
        unit: group.unit,
        referenceRange: group.referenceRange,
        points: group.points,
        dataPointsCount: group.points.length,
        firstValue: firstPoint.value,
        latestValue: lastPoint.value,
        firstDate: firstPoint.reportDate,
        latestDate: lastPoint.reportDate,
        evaluation,
      });
    }
  }

  // Sort series: metrics with most points first, then alphabetically
  return resultTrends.sort((a, b) => b.points.length - a.points.length || a.metricName.localeCompare(b.metricName));
}

/**
 * Discovers all single-point metrics (found in only 1 report) to inform user what's needed for future trends.
 */
export function getSinglePointMetrics(records = []) {
  if (!Array.isArray(records) || records.length === 0) return [];
  const validRecords = records.filter((r) => Boolean(r && (r.date || r.uploadedAt)));

  const countMap = new Map();
  for (const rec of validRecords) {
    const readings = extractRecordMetricReadings(rec);
    for (const r of readings) {
      if (!countMap.has(r.metricKey)) {
        countMap.set(r.metricKey, { name: r.metricName, count: 0, latestValue: r.value, unit: r.unit, date: r.reportDate });
      }
      countMap.get(r.metricKey).count += 1;
    }
  }

  const singles = [];
  for (const [k, v] of countMap.entries()) {
    if (v.count === 1) {
      singles.push(v);
    }
  }
  return singles;
}
