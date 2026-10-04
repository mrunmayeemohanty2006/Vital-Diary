/**
 * Canonical Medical Vocabulary & Deterministic Disambiguation Engine
 * 
 * 100% Deterministic & Local:
 * 1. Canonical Biomarker Aliases & Controlled Levenshtein Fuzzy Matching
 * 2. Canonical Unit Dictionary & OCR Typo Normalization
 * 3. Context-Guarded Multi-Candidate Numeric Disambiguation
 * 4. Structured Reference Interval Syntax Parser
 * 5. Strict Status Marker Classifier
 */

export const CANONICAL_MEDICAL_VOCABULARY = [
  // CBC
  {
    canonicalName: 'Hemoglobin',
    aliases: ['hemoglobin', 'haemoglobin', 'hb', 'hgb', 'hemoglobin (hb)', 'haemoglobin (hb)', 'hemoglohin', 'hernoglobin', 'hemoglobln'],
    category: 'cbc',
    defaultUnit: 'g/dL',
    expectedMin: 5.0,
    expectedMax: 22.0,
    allowDecimals: true,
  },
  {
    canonicalName: 'Total RBC',
    aliases: ['total rbc count', 'rbc count', 'rbc', 'red blood cell count', 'erythrocyte count', 'total r.b.c.', 'total red blood cells', 'rbc total'],
    category: 'cbc',
    defaultUnit: 'mil/uL',
    expectedMin: 2.0,
    expectedMax: 8.0,
    allowDecimals: true,
  },
  {
    canonicalName: 'Hematocrit',
    aliases: ['hematocrit', 'haematocrit', 'pcv', 'packed cell volume', 'hct', 'hematocrit (pcv)', 'haematocrit (pcv)', 'packed cell vol'],
    category: 'cbc',
    defaultUnit: '%',
    expectedMin: 15.0,
    expectedMax: 65.0,
    allowDecimals: true,
  },
  {
    canonicalName: 'MCV',
    aliases: ['mean corpuscular volume', 'mcv', 'mean cell volume'],
    category: 'cbc',
    defaultUnit: 'fL',
    expectedMin: 50.0,
    expectedMax: 130.0,
    allowDecimals: true,
  },
  {
    canonicalName: 'MCH',
    aliases: ['mean corpuscular hemoglobin', 'mch', 'mean cell hemoglobin', 'mean corpuscular haemoglobin'],
    category: 'cbc',
    defaultUnit: 'pg',
    expectedMin: 15.0,
    expectedMax: 45.0,
    allowDecimals: true,
  },
  {
    canonicalName: 'MCHC',
    aliases: ['mean corpuscular hemoglobin concentration', 'mchc', 'mean cell hemoglobin concentration', 'mean corpuscular haemoglobin concentration'],
    category: 'cbc',
    defaultUnit: 'g/dL',
    expectedMin: 25.0,
    expectedMax: 40.0,
    allowDecimals: true,
  },
  {
    canonicalName: 'Platelets',
    aliases: ['platelet count', 'platelets', 'total platelet count', 'plt count', 'plt', 'thrombocyte count'],
    category: 'cbc',
    defaultUnit: 'cells/uL',
    expectedMin: 20000,
    expectedMax: 1000000,
    allowDecimals: false,
  },
  {
    canonicalName: 'RDW',
    aliases: ['red cell distribution width', 'rdw', 'rdw-cv', 'rdw cv', 'rdw (cv)', 'red cell distribution width (rdw)', 'red cell distribution width (rdw-cv)', 'erythrocyte distribution width', 'rdw-sd'],
    category: 'cbc',
    defaultUnit: '%',
    expectedMin: 9.0,
    expectedMax: 25.0,
    allowDecimals: true,
  },
  {
    canonicalName: 'WBC',
    aliases: ['total wbc count', 'total leukocyte count', 'tlc', 'wbc count', 'wbc', 'total wbc', 'total leucocyte count', 'total leucocyte count (tlc)', 'leukocyte count', 'white blood cells'],
    category: 'cbc',
    defaultUnit: 'cells/uL',
    expectedMin: 1000,
    expectedMax: 50000,
    allowDecimals: false,
  },
  {
    canonicalName: 'Neutrophils',
    aliases: ['neutrophils', 'neutrophil', 'polymorphs', 'segs', 'neutrophils %', 'absolute neutrophil count', 'anc'],
    category: 'cbc',
    defaultUnit: '%',
    expectedMin: 10.0,
    expectedMax: 90.0,
    allowDecimals: true,
  },
  {
    canonicalName: 'Lymphocytes',
    aliases: ['lymphocytes', 'lymphocyte', 'lymphs', 'lymphocytes %', 'absolute lymphocyte count', 'alc'],
    category: 'cbc',
    defaultUnit: '%',
    expectedMin: 5.0,
    expectedMax: 80.0,
    allowDecimals: true,
  },
  {
    canonicalName: 'Monocytes',
    aliases: ['monocytes', 'monocyte', 'monocytes %'],
    category: 'cbc',
    defaultUnit: '%',
    expectedMin: 0.0,
    expectedMax: 25.0,
    allowDecimals: true,
  },
  {
    canonicalName: 'Eosinophils',
    aliases: ['eosinophils', 'eosinophil', 'eos', 'eosinophils %', 'absolute eosinophil count', 'aec'],
    category: 'cbc',
    defaultUnit: '%',
    expectedMin: 0.0,
    expectedMax: 25.0,
    allowDecimals: true,
  },
  {
    canonicalName: 'Basophils',
    aliases: ['basophils', 'basophil', 'baso', 'basophils %'],
    category: 'cbc',
    defaultUnit: '%',
    expectedMin: 0.0,
    expectedMax: 10.0,
    allowDecimals: true,
  },

  // Glucose & Diabetes
  {
    canonicalName: 'Fasting Glucose',
    aliases: ['fasting blood sugar', 'fbs', 'fasting glucose', 'fasting blood glucose', 'glucose fasting', 'plasma glucose fasting', 'blood sugar fasting'],
    category: 'metabolic',
    defaultUnit: 'mg/dL',
    expectedMin: 40,
    expectedMax: 500,
    allowDecimals: true,
  },
  {
    canonicalName: 'Postprandial Glucose',
    aliases: ['post prandial blood sugar', 'ppbs', 'postprandial glucose', 'glucose post prandial', 'blood sugar post prandial', '2hr post glucose'],
    category: 'metabolic',
    defaultUnit: 'mg/dL',
    expectedMin: 50,
    expectedMax: 600,
    allowDecimals: true,
  },
  {
    canonicalName: 'Blood Glucose',
    aliases: ['blood glucose', 'random blood sugar', 'rbs', 'glucose random', 'glucose', 'serum glucose', 'plasma glucose'],
    category: 'metabolic',
    defaultUnit: 'mg/dL',
    expectedMin: 40,
    expectedMax: 600,
    allowDecimals: true,
  },
  {
    canonicalName: 'HbA1c',
    aliases: ['glycated hemoglobin', 'glycosylated hemoglobin', 'hba1c', 'hb a1c', 'glyco hemoglobin', 'hemoglobin a1c', 'hba1c (glycated hemoglobin)'],
    category: 'metabolic',
    defaultUnit: '%',
    expectedMin: 3.5,
    expectedMax: 18.0,
    allowDecimals: true,
  },
  {
    canonicalName: 'Estimated Average Glucose',
    aliases: ['estimated average glucose', 'eag', 'estimated avg glucose'],
    category: 'metabolic',
    defaultUnit: 'mg/dL',
    expectedMin: 50,
    expectedMax: 450,
    allowDecimals: true,
  },
  {
    canonicalName: 'Insulin',
    aliases: ['fasting insulin', 'serum insulin', 'insulin fasting', 'insulin'],
    category: 'metabolic',
    defaultUnit: 'uIU/mL',
    expectedMin: 0.5,
    expectedMax: 100.0,
    allowDecimals: true,
  },

  // Lipid Panel
  {
    canonicalName: 'Total Cholesterol',
    aliases: ['total cholesterol', 'cholesterol total', 'cholesterol', 'serum cholesterol'],
    category: 'metabolic',
    defaultUnit: 'mg/dL',
    expectedMin: 50,
    expectedMax: 600,
    allowDecimals: true,
  },
  {
    canonicalName: 'HDL Cholesterol',
    aliases: ['hdl cholesterol', 'hdl', 'high density lipoprotein', 'cholesterol hdl', 'hdl-c'],
    category: 'metabolic',
    defaultUnit: 'mg/dL',
    expectedMin: 10,
    expectedMax: 150,
    allowDecimals: true,
  },
  {
    canonicalName: 'LDL Cholesterol',
    aliases: ['ldl cholesterol', 'ldl', 'low density lipoprotein', 'cholesterol ldl', 'ldl-c', 'calculated ldl'],
    category: 'metabolic',
    defaultUnit: 'mg/dL',
    expectedMin: 20,
    expectedMax: 400,
    allowDecimals: true,
  },
  {
    canonicalName: 'Triglycerides',
    aliases: ['triglycerides', 'serum triglycerides', 'tg', 'triglyceride'],
    category: 'metabolic',
    defaultUnit: 'mg/dL',
    expectedMin: 20,
    expectedMax: 1500,
    allowDecimals: true,
  },
  {
    canonicalName: 'VLDL Cholesterol',
    aliases: ['vldl cholesterol', 'vldl', 'very low density lipoprotein', 'vldl-c'],
    category: 'metabolic',
    defaultUnit: 'mg/dL',
    expectedMin: 2,
    expectedMax: 150,
    allowDecimals: true,
  },

  // Thyroid Panel
  {
    canonicalName: 'TSH',
    aliases: ['thyroid stimulating hormone', 'tsh', 'tsh ultra sensitive', 'tsh 3rd generation', 'thyrotropin', 's-tsh', 'serum tsh'],
    category: 'thyroid',
    defaultUnit: 'uIU/mL',
    expectedMin: 0.01,
    expectedMax: 100.0,
    allowDecimals: true,
  },
  {
    canonicalName: 'Total T3',
    aliases: ['triiodothyronine total', 'total t3', 't3 total', 'triiodothyronine', 't3'],
    category: 'thyroid',
    defaultUnit: 'ng/dL',
    expectedMin: 20,
    expectedMax: 400,
    allowDecimals: true,
  },
  {
    canonicalName: 'Free T3',
    aliases: ['free triiodothyronine', 'free t3', 'ft3', 't3 free'],
    category: 'thyroid',
    defaultUnit: 'pg/mL',
    expectedMin: 0.5,
    expectedMax: 15.0,
    allowDecimals: true,
  },
  {
    canonicalName: 'Total T4',
    aliases: ['thyroxine total', 'total t4', 't4 total', 'thyroxine', 't4'],
    category: 'thyroid',
    defaultUnit: 'ug/dL',
    expectedMin: 1.0,
    expectedMax: 25.0,
    allowDecimals: true,
  },
  {
    canonicalName: 'Free T4',
    aliases: ['free thyroxine', 'free t4', 'ft4', 't4 free'],
    category: 'thyroid',
    defaultUnit: 'ng/dL',
    expectedMin: 0.1,
    expectedMax: 6.0,
    allowDecimals: true,
  },

  // Iron Profile
  {
    canonicalName: 'Serum Iron',
    aliases: ['iron', 'serum iron', 'fe', 'iron serum'],
    category: 'iron',
    defaultUnit: 'ug/dL',
    expectedMin: 10,
    expectedMax: 350,
    allowDecimals: true,
  },
  {
    canonicalName: 'Ferritin',
    aliases: ['serum ferritin', 'ferritin', 'ferritin serum', 's. ferritin'],
    category: 'iron',
    defaultUnit: 'ng/mL',
    expectedMin: 2.0,
    expectedMax: 1500,
    allowDecimals: true,
  },
  {
    canonicalName: 'TIBC',
    aliases: ['total iron binding capacity', 'tibc'],
    category: 'iron',
    defaultUnit: 'ug/dL',
    expectedMin: 100,
    expectedMax: 600,
    allowDecimals: true,
  },
  {
    canonicalName: 'Transferrin Saturation',
    aliases: ['transferrin saturation', 'transferrin sat', '% transferrin saturation', 'iron saturation'],
    category: 'iron',
    defaultUnit: '%',
    expectedMin: 5.0,
    expectedMax: 80.0,
    allowDecimals: true,
  },

  // Renal Panel
  {
    canonicalName: 'Creatinine',
    aliases: ['serum creatinine', 'creatinine', 'sr. creatinine', 's. creatinine', 'creatinine serum'],
    category: 'renal',
    defaultUnit: 'mg/dL',
    expectedMin: 0.2,
    expectedMax: 15.0,
    allowDecimals: true,
  },
  {
    canonicalName: 'Blood Urea Nitrogen',
    aliases: ['blood urea nitrogen', 'bun', 'urea nitrogen'],
    category: 'renal',
    defaultUnit: 'mg/dL',
    expectedMin: 3.0,
    expectedMax: 120.0,
    allowDecimals: true,
  },
  {
    canonicalName: 'Urea',
    aliases: ['serum urea', 'urea', 'blood urea'],
    category: 'renal',
    defaultUnit: 'mg/dL',
    expectedMin: 5.0,
    expectedMax: 200.0,
    allowDecimals: true,
  },
  {
    canonicalName: 'Uric Acid',
    aliases: ['serum uric acid', 'uric acid', 'sr. uric acid'],
    category: 'renal',
    defaultUnit: 'mg/dL',
    expectedMin: 1.0,
    expectedMax: 20.0,
    allowDecimals: true,
  },
  {
    canonicalName: 'eGFR',
    aliases: ['estimated glomerular filtration rate', 'egfr', 'gfr estimated'],
    category: 'renal',
    defaultUnit: 'mL/min/1.73m2',
    expectedMin: 5,
    expectedMax: 160,
    allowDecimals: true,
  },
  {
    canonicalName: 'Sodium',
    aliases: ['serum sodium', 'sodium', 'na+', 'na'],
    category: 'renal',
    defaultUnit: 'mEq/L',
    expectedMin: 110,
    expectedMax: 170,
    allowDecimals: true,
  },
  {
    canonicalName: 'Potassium',
    aliases: ['serum potassium', 'potassium', 'k+', 'k'],
    category: 'renal',
    defaultUnit: 'mEq/L',
    expectedMin: 1.5,
    expectedMax: 9.0,
    allowDecimals: true,
  },
  {
    canonicalName: 'Chloride',
    aliases: ['serum chloride', 'chloride', 'cl-', 'cl'],
    category: 'renal',
    defaultUnit: 'mEq/L',
    expectedMin: 70,
    expectedMax: 130,
    allowDecimals: true,
  },

  // Hepatic (LFT)
  {
    canonicalName: 'Total Bilirubin',
    aliases: ['total bilirubin', 'bilirubin total', 'serum bilirubin total', 't. bilirubin'],
    category: 'hepatic',
    defaultUnit: 'mg/dL',
    expectedMin: 0.1,
    expectedMax: 30.0,
    allowDecimals: true,
  },
  {
    canonicalName: 'Direct Bilirubin',
    aliases: ['direct bilirubin', 'bilirubin direct', 'conjugated bilirubin', 'd. bilirubin'],
    category: 'hepatic',
    defaultUnit: 'mg/dL',
    expectedMin: 0.0,
    expectedMax: 20.0,
    allowDecimals: true,
  },
  {
    canonicalName: 'SGOT',
    aliases: ['sgot', 'ast', 'aspartate aminotransferase', 'sgot (ast)', 'sgot/ast', 'ast (sgot)'],
    category: 'hepatic',
    defaultUnit: 'U/L',
    expectedMin: 5,
    expectedMax: 1000,
    allowDecimals: true,
  },
  {
    canonicalName: 'SGPT',
    aliases: ['sgpt', 'alt', 'alanine aminotransferase', 'sgpt (alt)', 'sgpt/alt', 'alt (sgpt)'],
    category: 'hepatic',
    defaultUnit: 'U/L',
    expectedMin: 5,
    expectedMax: 1000,
    allowDecimals: true,
  },
  {
    canonicalName: 'Alkaline Phosphatase',
    aliases: ['alkaline phosphatase', 'alp', 'alk phos', 'alkaline phosphatase (alp)'],
    category: 'hepatic',
    defaultUnit: 'U/L',
    expectedMin: 20,
    expectedMax: 1200,
    allowDecimals: true,
  },
  {
    canonicalName: 'Total Protein',
    aliases: ['total protein', 'protein total', 'serum total protein'],
    category: 'hepatic',
    defaultUnit: 'g/dL',
    expectedMin: 3.0,
    expectedMax: 12.0,
    allowDecimals: true,
  },
  {
    canonicalName: 'Albumin',
    aliases: ['serum albumin', 'albumin', 'alb'],
    category: 'hepatic',
    defaultUnit: 'g/dL',
    expectedMin: 1.5,
    expectedMax: 7.0,
    allowDecimals: true,
  },
  {
    canonicalName: 'Globulin',
    aliases: ['serum globulin', 'globulin'],
    category: 'hepatic',
    defaultUnit: 'g/dL',
    expectedMin: 1.0,
    expectedMax: 7.0,
    allowDecimals: true,
  },
  {
    canonicalName: 'GGT',
    aliases: ['gamma glutamyl transferase', 'ggt', 'ggtp', 'gamma gt'],
    category: 'hepatic',
    defaultUnit: 'U/L',
    expectedMin: 3,
    expectedMax: 800,
    allowDecimals: true,
  },

  // Vitamins & Minerals
  {
    canonicalName: 'Vitamin D',
    aliases: ['25-hydroxy vitamin d', 'vitamin d (25-oh)', '25 oh vitamin d', 'vitamin d total', 'vitamin d3', 'vit d', 'vitamin d'],
    category: 'vitamins',
    defaultUnit: 'ng/mL',
    expectedMin: 3.0,
    expectedMax: 200.0,
    allowDecimals: true,
  },
  {
    canonicalName: 'Vitamin B12',
    aliases: ['vitamin b12', 'vitamin b-12', 'vit b12', 'cyanocobalamin', 'b12'],
    category: 'vitamins',
    defaultUnit: 'pg/mL',
    expectedMin: 50,
    expectedMax: 2500,
    allowDecimals: true,
  },
  {
    canonicalName: 'Folate',
    aliases: ['folate', 'folic acid', 'serum folate'],
    category: 'vitamins',
    defaultUnit: 'ng/mL',
    expectedMin: 1.0,
    expectedMax: 35.0,
    allowDecimals: true,
  },
  {
    canonicalName: 'Calcium',
    aliases: ['serum calcium', 'calcium', 'total calcium', 'ca++'],
    category: 'vitamins',
    defaultUnit: 'mg/dL',
    expectedMin: 4.0,
    expectedMax: 18.0,
    allowDecimals: true,
  },
  {
    canonicalName: 'Phosphorus',
    aliases: ['serum phosphorus', 'phosphorus', 'inorganic phosphorus'],
    category: 'vitamins',
    defaultUnit: 'mg/dL',
    expectedMin: 1.0,
    expectedMax: 12.0,
    allowDecimals: true,
  },
  {
    canonicalName: 'Magnesium',
    aliases: ['serum magnesium', 'magnesium', 'mg++'],
    category: 'vitamins',
    defaultUnit: 'mg/dL',
    expectedMin: 0.5,
    expectedMax: 6.0,
    allowDecimals: true,
  },

  // Inflammatory
  {
    canonicalName: 'CRP',
    aliases: ['c-reactive protein', 'c reactive protein', 'crp', 'crp quantitative'],
    category: 'general',
    defaultUnit: 'mg/L',
    expectedMin: 0.05,
    expectedMax: 300.0,
    allowDecimals: true,
  },
  {
    canonicalName: 'hs-CRP',
    aliases: ['high sensitivity crp', 'hs-crp', 'hscrp', 'cardiac crp'],
    category: 'general',
    defaultUnit: 'mg/L',
    expectedMin: 0.01,
    expectedMax: 50.0,
    allowDecimals: true,
  },
  {
    canonicalName: 'ESR',
    aliases: ['erythrocyte sedimentation rate', 'esr', 'westergren esr'],
    category: 'general',
    defaultUnit: 'mm/hr',
    expectedMin: 0,
    expectedMax: 150,
    allowDecimals: false,
  },
];

/**
 * Standard Canonical Unit Dictionary and Typo Corrections
 */
export const CANONICAL_UNIT_MAP = {
  'g/dl': 'g/dL',
  'g/l': 'g/L',
  'mg/dl': 'mg/dL',
  'mg/l': 'mg/L',
  'ug/dl': 'ug/dL',
  'ug/l': 'ug/L',
  'mcg/dl': 'ug/dL',
  'mcg/l': 'ug/L',
  'ng/ml': 'ng/mL',
  'ng/dl': 'ng/dL',
  'pg/ml': 'pg/mL',
  'pg': 'pg',
  'fl': 'fL',
  '%': '%',
  'cells/ul': 'cells/uL',
  'cells/cumm': 'cells/uL',
  'cells/mm3': 'cells/uL',
  '/cumm': 'cells/uL',
  '/ul': 'cells/uL',
  '/mm3': 'cells/uL',
  'mil/ul': 'mil/uL',
  'mil/cumm': 'mil/uL',
  '10^6/ul': 'mil/uL',
  '10^3/ul': '10^3/uL',
  'u/l': 'U/L',
  'iu/l': 'IU/L',
  'uiu/ml': 'uIU/mL',
  'miu/l': 'uIU/mL',
  'uu/ml': 'uIU/mL',
  'meq/l': 'mEq/L',
  'mmol/l': 'mmol/L',
  'umol/l': 'umol/L',
  'mm/hr': 'mm/hr',
  'mm/1st hr': 'mm/hr',
  'ml/min': 'mL/min',
  'ml/min/1.73m2': 'mL/min/1.73m2',
};

/**
 * Normalizes a unit string to canonical format.
 */
export function normalizeUnit(rawUnit) {
  if (!rawUnit) return '';
  const clean = rawUnit.trim().toLowerCase().replace(/^[([<{]|[)\]>}]$/g, '');
  return CANONICAL_UNIT_MAP[clean] || rawUnit.trim();
}

/**
 * Levenshtein distance between two strings.
 */
export function computeLevenshtein(s1, s2) {
  const m = s1.length;
  const n = s2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}

/**
 * Controlled Fuzzy / Exact Match of raw parameter text to Canonical Medical Vocabulary.
 */
export function matchCanonicalParameter(rawText) {
  if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) return null;
  const normalized = rawText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (normalized.length === 0) return null;

  // 1. Direct Alias Exact Match
  for (const item of CANONICAL_MEDICAL_VOCABULARY) {
    if (item.canonicalName.toLowerCase() === normalized) return item;
    for (const rawAlias of item.aliases) {
      const alias = rawAlias.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
      if (alias === normalized) return item;
    }
  }

  // 2. Prefix / Suffix Alias Match for method qualifiers (e.g. "TSH 3rd Generation", "Serum Creatinine (Jaffe)")
  for (const item of CANONICAL_MEDICAL_VOCABULARY) {
    for (const rawAlias of item.aliases) {
      const alias = rawAlias.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
      if (alias.length >= 3) {
        if (normalized.startsWith(alias + ' ') || normalized.endsWith(' ' + alias)) {
          const remainder = normalized.startsWith(alias + ' ')
            ? normalized.slice(alias.length + 1).trim()
            : normalized.slice(0, normalized.length - alias.length).trim();
          // Ensure remainder is not a measurement value
          if (!/^([><≤≥]?\s*\d)/.test(remainder)) {
            return item;
          }
        }
      }
    }
  }
  let bestMatch = null;
  let bestDistance = Infinity;

  for (const item of CANONICAL_MEDICAL_VOCABULARY) {
    for (const rawAlias of item.aliases) {
      const alias = rawAlias.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
      // Threshold: max 1 edit per 5 characters, capped at 2 edits
      const maxAllowedDistance = Math.min(2, Math.floor(alias.length / 5));
      if (maxAllowedDistance === 0) continue; // No fuzzy matching on short acronyms like 'hb', 'tsh', 'bun'

      const dist = computeLevenshtein(normalized, alias);
      if (dist <= maxAllowedDistance && dist < bestDistance) {
        bestDistance = dist;
        bestMatch = item;
      }
    }
  }

  return bestMatch;
}

/**
 * Context-Guarded Multi-Candidate Numeric Disambiguation.
 * Fixes typical OCR confusion (O -> 0, l/I/| -> 1, S -> 5, comma decimal separator).
 */
export function disambiguateNumericString(rawToken, canonicalParam) {
  if (!rawToken) return null;

  let clean = rawToken.trim();
  // Strip peripheral symbols
  clean = clean.replace(/^[^\d\w><≤≥.-]+|[^\d\w.-]+$/g, '');

  // Handle leading comparison operators
  let prefix = '';
  if (/^[><≤≥]/.test(clean)) {
    prefix = clean[0];
    clean = clean.slice(1).trim();
  }

  // Common OCR character substitutions in numeric context
  let fixed = clean
    .replace(/,/g, '.')        // Indian / European comma decimals -> '.'
    .replace(/[Oo]/g, '0')     // Capital O or lower o -> 0
    .replace(/[lI|]/g, '1')    // lower l, capital I, pipe | -> 1
    .replace(/[S]/g, '5')      // Capital S -> 5
    .replace(/[B]/g, '8');     // Capital B -> 8

  // Clean trailing punctuation or non-digits except single dot
  const dotCount = (fixed.match(/\./g) || []).length;
  if (dotCount > 1) {
    // If multiple dots like 12.4.5, take first dot
    const firstDot = fixed.indexOf('.');
    fixed = fixed.slice(0, firstDot + 1) + fixed.slice(firstDot + 1).replace(/\./g, '');
  }

  const parsed = parseFloat(fixed);
  if (isNaN(parsed)) return null;

  let confidence = 0.95;
  if (fixed !== clean) {
    confidence = 0.85; // Disambiguation applied
  }

  // Plausibility verification if canonical parameter metadata is provided
  if (canonicalParam) {
    if (parsed < canonicalParam.expectedMin * 0.4 || parsed > canonicalParam.expectedMax * 2.5) {
      confidence = 0.50; // Suspicious value outside physiological bounds
    }
  }

  return {
    rawString: rawToken,
    disambiguatedString: prefix ? `${prefix}${parsed}` : `${parsed}`,
    numericValue: parsed,
    confidenceScore: confidence,
  };
}

/**
 * Parses structured reference interval strings:
 * Examples: '12.0 - 15.5', '12 to 16', '< 100', '<= 50', '> 20', '[M: 13-17, F: 12-15]'
 */
export function parseReferenceInterval(rawText) {
  if (!rawText) return null;
  const clean = rawText.trim();

  // Pattern 1: Range Interval '12.0 - 15.0' or '12 to 16'
  const rangeMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:[-–—]|to)\s*(\d+(?:\.\d+)?)/i);
  if (rangeMatch && rangeMatch[1] && rangeMatch[2]) {
    const low = parseFloat(rangeMatch[1]);
    const high = parseFloat(rangeMatch[2]);
    if (!isNaN(low) && !isNaN(high) && low <= high) {
      return {
        rawText: clean,
        low,
        high,
      };
    }
  }

  // Pattern 2: Threshold Operator '< 100', '<= 50', '> 20'
  const threshMatch = clean.match(/(?:^|\s+)([<>]=?|≤|≥)\s*(\d+(?:\.\d+)?)/);
  if (threshMatch && threshMatch[1] && threshMatch[2]) {
    let operator = threshMatch[1];
    if (operator === '≤') operator = '<=';
    if (operator === '≥') operator = '>=';
    const threshold = parseFloat(threshMatch[2]);
    if (!isNaN(threshold)) {
      return {
        rawText: clean,
        operator,
        threshold,
      };
    }
  }

  // Pattern 3: Gender / Age stratified (e.g. '[M: 13-17, F: 12-15]')
  if (/\[.*[MF]:.*\]/i.test(clean) || /\b(male|female|adult|pediatric)\b/i.test(clean)) {
    return {
      rawText: clean,
      isStratified: true,
    };
  }

  return null;
}

/**
 * Parses and categorizes status tokens (High / Low / Normal / Critical / Abnormal).
 */
export function parseStatusToken(text) {
  if (!text) return 'unknown';
  const clean = text.trim().toLowerCase();
  if (/^(high|h|critical|abnormal|\+)\b/i.test(clean)) return 'high';
  if (/^(low|l|-)\b/i.test(clean)) return 'low';
  if (/^(normal|n|borderline|desirable|acceptable)\b/i.test(clean)) return 'normal';
  return 'unknown';
}
