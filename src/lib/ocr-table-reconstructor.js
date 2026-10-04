/**
 * Spatial Geometry & Medical Table Reconstructor
 * 
 * Reconstructs tabular medical reports from 2D OCR word bounding boxes (x0, y0, x1, y1)
 * with robust Column-Shift Protection and Multi-Line grouping.
 * 
 * 2D Column Classification:
 * [ Parameter Name ] -> [ Result Value ] -> [ Unit ] -> [ Reference Range ] -> [ Status ]
 */

import {
  matchCanonicalParameter,
  normalizeUnit,
  disambiguateNumericString,
  parseReferenceInterval,
  parseStatusToken,
  CANONICAL_UNIT_MAP,
} from './ocr-medical-vocab.js';

/**
 * Clusters OCR tokens into horizontal line rows based on Y-axis bounding boxes.
 */
export function clusterTokensIntoRows(tokens, yTolerance = 14) {
  if (!tokens || tokens.length === 0) return [];

  // Sort tokens primarily by Y (top to bottom), secondarily by X (left to right)
  const sorted = [...tokens].sort((a, b) => {
    const yCenterA = (a.bbox.y0 + a.bbox.y1) / 2;
    const yCenterB = (b.bbox.y0 + b.bbox.y1) / 2;
    if (Math.abs(yCenterA - yCenterB) > yTolerance) {
      return yCenterA - yCenterB;
    }
    return a.bbox.x0 - b.bbox.x0;
  });

  const clusters = [];

  for (const token of sorted) {
    const yCenter = (token.bbox.y0 + token.bbox.y1) / 2;
    let matchedCluster = null;

    for (const cluster of clusters) {
      if (Math.abs(cluster.yCenter - yCenter) <= yTolerance) {
        matchedCluster = cluster;
        break;
      }
    }

    if (matchedCluster) {
      matchedCluster.tokens.push(token);
      // Update running average of yCenter
      const count = matchedCluster.tokens.length;
      matchedCluster.yCenter = (matchedCluster.yCenter * (count - 1) + yCenter) / count;
      matchedCluster.yMin = Math.min(matchedCluster.yMin, token.bbox.y0);
      matchedCluster.yMax = Math.max(matchedCluster.yMax, token.bbox.y1);
    } else {
      clusters.push({
        yCenter,
        yMin: token.bbox.y0,
        yMax: token.bbox.y1,
        tokens: [token],
      });
    }
  }

  // Ensure each row's tokens are sorted left-to-right by X coordinate
  for (const cluster of clusters) {
    cluster.tokens.sort((a, b) => a.bbox.x0 - b.bbox.x0);
  }

  // Sort clusters from top to bottom
  clusters.sort((a, b) => a.yCenter - b.yCenter);

  return clusters;
}

/**
 * Reconstructs structured tabular medical rows from 2D token bounding boxes.
 */
export function reconstructMedicalTable(tokens, pageWidth = 1000, pageHeight = 1500) {
  if (!tokens || tokens.length === 0) {
    return {
      rows: [],
      pageWidth,
      pageHeight,
    };
  }

  const clusters = clusterTokensIntoRows(tokens, 14);
  const reconstructedRows = [];

  let rowIndex = 0;

  for (let cIdx = 0; cIdx < clusters.length; cIdx++) {
    const cluster = clusters[cIdx];
    const rowTokens = cluster.tokens;
    if (rowTokens.length === 0) continue;

    const rowText = rowTokens.map((t) => t.text).join(' ');

    // Check if this row contains a medical parameter name
    let paramMatch = null;
    let paramTokenEndIdx = -1;

    // Find the longest valid medical parameter prefix before any numeric result
    for (let len = 1; len <= Math.min(6, rowTokens.length); len++) {
      if (len > 1 && /^([><≤≥]?\s*\d)/.test(rowTokens[len - 1].text.trim())) {
        break;
      }
      const candidateStr = rowTokens.slice(0, len).map((t) => t.text).join(' ');
      const match = matchCanonicalParameter(candidateStr);
      if (match) {
        paramMatch = match;
        paramTokenEndIdx = len;
      }
    }

    if (paramMatch && paramTokenEndIdx > 0) {
      rowIndex++;
      const paramTokens = rowTokens.slice(0, paramTokenEndIdx);
      const remainingTokens = rowTokens.slice(paramTokenEndIdx);

      let resultToken = null;
      let unitToken = null;
      const refRangeTokens = [];
      let statusToken = null;

      // Classify remaining tokens into Result, Unit, Ref Range, Status
      let resultFound = false;

      for (let i = 0; i < remainingTokens.length; i++) {
        const token = remainingTokens[i];
        const cleanText = token.text.trim();

        // 1. Result Value Token Candidate
        if (!resultFound && /^([><≤≥]?\s*\d{1,3}(?:,\d{3})+|[><≤≥]?\s*\d+(?:\.\d+)?)$/.test(cleanText)) {
          resultToken = token;
          resultFound = true;
          continue;
        }

        // 2. Unit Token Candidate
        const cleanUnit = cleanText.toLowerCase().replace(/^[([<{]|[)\]>}]$/g, '');
        if (resultFound && !unitToken && (CANONICAL_UNIT_MAP[cleanUnit] || normalizeUnit(cleanText))) {
          unitToken = token;
          continue;
        }

        // 3. Status Token Candidate
        const statusType = parseStatusToken(cleanText);
        if (statusType !== 'unknown' && i >= remainingTokens.length - 2) {
          statusToken = token;
          continue;
        }

        // 4. Reference Interval Tokens
        refRangeTokens.push(token);
      }

      // Disambiguate numeric value
      let parsedNum = null;
      let disambiguation = null;
      if (resultToken) {
        disambiguation = disambiguateNumericString(resultToken.text, paramMatch);
        if (disambiguation) {
          parsedNum = disambiguation.numericValue;
        }
      }

      const parsedUnit = unitToken ? normalizeUnit(unitToken.text) : paramMatch.defaultUnit;
      const refRangeStr = refRangeTokens.map((t) => t.text).join(' ');
      const structuredRef = refRangeStr ? parseReferenceInterval(refRangeStr) || undefined : undefined;

      let parsedStatus = 'unknown';
      if (statusToken) {
        parsedStatus = parseStatusToken(statusToken.text);
      } else if (parsedNum !== null && structuredRef) {
        if (structuredRef.low !== undefined && parsedNum < structuredRef.low) parsedStatus = 'low';
        else if (structuredRef.high !== undefined && parsedNum > structuredRef.high) parsedStatus = 'high';
        else if (structuredRef.low !== undefined && structuredRef.high !== undefined) parsedStatus = 'normal';
      }

      // Row Association Confidence
      let rowConf = 0.95;
      let needsVerification = false;

      if (resultToken && unitToken) {
        rowConf = 0.99;
      } else if (!resultToken) {
        rowConf = 0.40;
        needsVerification = true;
      } else if (disambiguation && disambiguation.confidenceScore < 0.80) {
        rowConf = 0.65;
        needsVerification = true;
      }

      reconstructedRows.push({
        rowIndex,
        yCenter: cluster.yCenter,
        rawText: rowText,
        canonicalParameter: paramMatch,
        parsedValue: parsedNum,
        normalizedUnit: parsedUnit,
        parsedReferenceRange: refRangeStr || undefined,
        structuredReferenceRange: structuredRef,
        parsedStatus,
        rowAssociationConfidence: rowConf,
        needsVerification,
      });
    }
  }

  return {
    rows: reconstructedRows,
    pageWidth,
    pageHeight,
  };
}
