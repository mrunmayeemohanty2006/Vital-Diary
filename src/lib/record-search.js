/**
 * Deterministic Medical Records Search Engine
 * 
 * 100% Client-Side & Local to authenticated user's stored data.
 * Zero AI, LLM, or external API dependencies.
 * Searches across medical report titles, categories, clinical notes, OCR text,
 * physicians, providers, tags, filenames, and extracted clinical biomarkers/metrics.
 */

import React from 'react';

/**
 * Escapes regex special characters in a string.
 */
export function escapeRegex(string) {
  if (!string || typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Highlights occurrences of query terms within a text string using React JSX.
 * 
 * @param {string} text - The input text to highlight.
 * @param {string} query - The search query.
 * @param {string} highlightClass - CSS class for highlight wrapper.
 * @returns {React.ReactNode} - Formatted JSX with highlighted marks.
 */
export function highlightMatch(text, query, highlightClass = 'search-highlight') {
  if (!text || typeof text !== 'string') return text || '';
  if (!query || typeof query !== 'string' || !query.trim()) return text;

  const terms = query
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .map(escapeRegex);

  if (terms.length === 0) return text;

  try {
    const regex = new RegExp(`(${terms.join('|')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (regex.test(part)) {
        return React.createElement(
          'mark',
          { key: index, className: highlightClass },
          part
        );
      }
      return part;
    });
  } catch (e) {
    return text;
  }
}

/**
 * Extracts a contextual snippet around the first occurrence of query terms in a long string (e.g. notes/OCR).
 * 
 * @param {string} text - The full text content.
 * @param {string} query - The search query.
 * @param {number} snippetRadius - Number of characters before and after match to include.
 * @returns {string|null} - Contextual snippet with ellipsis, or null if no match.
 */
export function extractTextSnippet(text, query, snippetRadius = 60) {
  if (!text || typeof text !== 'string' || !query || !query.trim()) return null;

  const terms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (terms.length === 0) return null;

  const lowerText = text.toLowerCase();
  let firstMatchIndex = -1;
  let matchedTermLength = 0;

  for (const term of terms) {
    const idx = lowerText.indexOf(term);
    if (idx !== -1 && (firstMatchIndex === -1 || idx < firstMatchIndex)) {
      firstMatchIndex = idx;
      matchedTermLength = term.length;
    }
  }

  if (firstMatchIndex === -1) return null;

  const start = Math.max(0, firstMatchIndex - snippetRadius);
  const end = Math.min(text.length, firstMatchIndex + matchedTermLength + snippetRadius);

  let snippet = text.slice(start, end).trim();
  if (start > 0) snippet = `... ${snippet}`;
  if (end < text.length) snippet = `${snippet} ...`;

  return snippet;
}

/**
 * Extracts detailed match insight metadata for a specific record given a search query.
 * 
 * @param {Object} record - The medical record object.
 * @param {string} query - The search query.
 * @returns {Object} Match details including matched metrics, snippets, tags, and summary.
 */
export function getRecordSearchInsights(record, query) {
  if (!record) {
    return {
      hasMatch: false,
      matchedKeywords: [],
      matchedMetrics: [],
      matchedSnippet: null,
      matchedFields: [],
      primaryValue: null,
    };
  }

  const q = (query || '').toLowerCase().trim();
  if (!q) {
    return {
      hasMatch: true,
      matchedKeywords: [],
      matchedMetrics: record.extractedMetrics || [],
      matchedSnippet: null,
      matchedFields: [],
      primaryValue: null,
    };
  }

  const terms = q.split(/\s+/).filter(Boolean);
  const matchedKeywords = new Set();
  const matchedFields = [];
  const matchedMetrics = [];

  // Helper to test if a string contains any search term
  const testTerms = (str) => {
    if (!str || typeof str !== 'string') return false;
    const lower = str.toLowerCase();
    let found = false;
    for (const term of terms) {
      if (lower.includes(term)) {
        matchedKeywords.add(term);
        found = true;
      }
    }
    return found;
  };

  // 1. Check Extracted Clinical Metrics / Biomarkers
  if (Array.isArray(record.extractedMetrics)) {
    for (const metric of record.extractedMetrics) {
      const nameMatch = testTerms(metric.name) || testTerms(metric.rawName);
      const valueMatch = testTerms(String(metric.value)) || testTerms(metric.displayValue);
      const unitMatch = testTerms(metric.unit);
      const statusMatch = testTerms(metric.status);
      const refMatch = metric.referenceRange && (
        testTerms(metric.referenceRange.rawText) ||
        testTerms(String(metric.referenceRange.low)) ||
        testTerms(String(metric.referenceRange.high))
      );
      const interpMatch = testTerms(metric.interpretation);

      if (nameMatch || valueMatch || unitMatch || statusMatch || refMatch || interpMatch) {
        matchedMetrics.push({
          ...metric,
          matchType: nameMatch ? 'name' : valueMatch ? 'value' : 'context',
        });
        if (!matchedFields.includes('biomarker')) matchedFields.push('biomarker');
      }
    }
  }

  // 2. Check Results dictionary
  if (record.results && typeof record.results === 'object') {
    for (const [key, val] of Object.entries(record.results)) {
      if (testTerms(key) || testTerms(String(val))) {
        if (!matchedMetrics.some((m) => m.name?.toLowerCase() === key.toLowerCase())) {
          matchedMetrics.push({
            name: key,
            value: val,
            displayValue: String(val),
            matchType: 'result_field',
          });
        }
        if (!matchedFields.includes('result_field')) matchedFields.push('result_field');
      }
    }
  }

  // 3. Check Title
  const titleMatch = testTerms(record.title);
  if (titleMatch && !matchedFields.includes('title')) matchedFields.push('title');

  // 4. Check Clinical Notes / OCR Text
  const notesSnippet = extractTextSnippet(record.notes, query);
  if (notesSnippet && !matchedFields.includes('notes')) matchedFields.push('notes');

  // 5. Check Category / Report Type
  const categoryMatch = testTerms(record.category);
  if (categoryMatch && !matchedFields.includes('category')) matchedFields.push('category');

  // 6. Check Attending Physician / Provider
  const doctorMatch = testTerms(record.doctor);
  const providerMatch = testTerms(record.provider);
  if (doctorMatch && !matchedFields.includes('doctor')) matchedFields.push('doctor');
  if (providerMatch && !matchedFields.includes('provider')) matchedFields.push('provider');

  // 7. Check Tags
  const matchedTags = (record.tags || []).filter((t) => testTerms(t));
  if (matchedTags.length > 0 && !matchedFields.includes('tags')) matchedFields.push('tags');

  // 8. Check File Name / Path
  const fileMatch = testTerms(record.fileName) || testTerms(record.folderName);
  if (fileMatch && !matchedFields.includes('file')) matchedFields.push('file');

  const hasMatch =
    matchedMetrics.length > 0 ||
    titleMatch ||
    Boolean(notesSnippet) ||
    categoryMatch ||
    doctorMatch ||
    providerMatch ||
    matchedTags.length > 0 ||
    fileMatch;

  // Primary value extraction (e.g. "14.2 g/dL" for Hemoglobin)
  let primaryValue = null;
  if (matchedMetrics.length > 0) {
    const first = matchedMetrics[0];
    primaryValue = {
      label: first.name || first.rawName || 'Measured Value',
      value: first.displayValue || `${first.value} ${first.unit || ''}`.trim(),
      status: first.status || 'normal',
      referenceRange: first.referenceRange?.rawText || (first.referenceRange?.low && first.referenceRange?.high ? `${first.referenceRange.low} - ${first.referenceRange.high} ${first.unit || ''}`.trim() : null),
    };
  }

  return {
    hasMatch,
    matchedKeywords: Array.from(matchedKeywords),
    matchedMetrics,
    matchedSnippet: notesSnippet,
    matchedFields,
    matchedTags,
    primaryValue,
  };
}

/**
 * Pure deterministic filter function for medical records.
 * 
 * @param {Array} records - Array of medical record objects.
 * @param {string} query - Free text search query.
 * @param {Object} filters - Optional category, provider, tag, folder, dateFrom, dateTo.
 * @returns {Array} - Filtered records.
 */
export function filterMedicalRecords(records = [], query = '', filters = {}) {
  if (!Array.isArray(records)) return [];

  const { category, provider, dateFrom, dateTo, tag, folder } = filters || {};
  const q = (query || '').trim();

  return records.filter((rec) => {
    if (!rec) return false;

    if (category && category !== 'All' && rec.category !== category) {
      return false;
    }

    if (provider && provider !== 'All' && rec.provider !== provider) {
      return false;
    }

    if (folder && folder !== 'All' && rec.folderName !== folder) {
      return false;
    }

    if (tag && !rec.tags?.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      return false;
    }

    if (dateFrom && rec.date && rec.date < dateFrom) {
      return false;
    }

    if (dateTo && rec.date && rec.date > dateTo) {
      return false;
    }

    if (q) {
      const insights = getRecordSearchInsights(rec, q);
      return insights.hasMatch;
    }

    return true;
  });
}
