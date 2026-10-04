/**
 * Deterministic On-Device OCR Pipeline for Medical Documents
 * 
 * 100% Client-Side / Zero-Cloud / Zero-Knowledge:
 * 1. Dual-Path PDF Extraction:
 *    - Path 1: Native PDF.js embedded text layer inspection with Clinical Usability Gate
 *    - Path 2: High-DPI Canvas rasterization fallback with local OCR
 * 2. Multi-Page Sequential Canvas Processing (preserving page boundaries)
 * 3. Two-Pass Adaptive OCR Strategy with Spatial Table Reconstruction & Consensus Comparison
 * 4. Tesseract.js Worker lifecycle with PSM 6 and preserve_interword_spaces = 1
 */

import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import { preprocessCanvas, DEFAULT_PREPROCESSING_CONFIG } from './ocr-preprocessor.js';
import { analyzeCanvasImageQuality, getAdaptivePreprocessingConfig } from './ocr-image-analyzer.js';
import { reconstructMedicalTable } from './ocr-table-reconstructor.js';
import { matchCanonicalParameter } from './ocr-medical-vocab.js';

// Configure PDF.js worker URL for browser rendering
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/build/pdf.worker.min.mjs`;
}

/**
 * Supported image MIME types for local OCR.
 */
export const SUPPORTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/bmp',
  'image/tiff',
];

export function isSupportedImageFile(file) {
  if (!file) return false;
  if (SUPPORTED_IMAGE_TYPES.includes(file.type)) return true;
  const ext = file.name ? file.name.split('.').pop().toLowerCase() : '';
  return ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff'].includes(ext);
}

export function isPDFFile(file) {
  if (!file) return false;
  if (file.type === 'application/pdf') return true;
  const ext = file.name ? file.name.split('.').pop().toLowerCase() : '';
  return ext === 'pdf';
}

/**
 * Evaluates whether extracted direct PDF text contains valid medical measurements.
 */
export function evaluatePdfTextUsability(rawText) {
  if (!rawText || rawText.trim().length < 20) {
    return { isUsable: false, score: 0, reason: 'Empty or insufficient text length.' };
  }

  const lines = rawText.split('\n');
  let clinicalMeasurementRows = 0;
  let medicalKeywords = 0;

  const coreKeywords = [
    'hemoglobin', 'haemoglobin', 'rbc', 'wbc', 'platelet', 'hematocrit', 'glucose',
    'cholesterol', 'tsh', 'creatinine', 'urea', 'bilirubin', 'sgpt', 'sgot', 'alt', 'ast',
    'reference range', 'observed value', 'investigation', 'specimen', 'laboratory', 'diagnostic'
  ];

  const lower = rawText.toLowerCase();
  for (const kw of coreKeywords) {
    if (lower.includes(kw)) medicalKeywords++;
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 5) continue;
    const hasParam = matchCanonicalParameter(trimmed);
    const hasNum = /\b\d+(?:\.\d+)?\b/.test(trimmed);
    if (hasParam && hasNum) {
      clinicalMeasurementRows++;
    }
  }

  const isUsable = clinicalMeasurementRows >= 1 || medicalKeywords >= 3;
  return {
    isUsable,
    score: clinicalMeasurementRows * 2 + medicalKeywords,
    reason: isUsable ? 'Direct text stream has structured medical data.' : 'Direct text stream lacks tabular medical structure.',
  };
}

/**
 * Extracts native text directly from PDF.js document representation.
 */
export async function extractDirectPDFText(pdfDoc) {
  const pageResults = [];
  const fullTextParts = [];

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Group items by vertical Y coordinates
    const items = textContent.items.map((item) => {
      const tx = item.transform;
      return {
        str: item.str,
        x: tx[4],
        y: tx[5],
        width: item.width,
        height: item.height,
      };
    });

    // Sort top to bottom, left to right
    items.sort((a, b) => {
      if (Math.abs(a.y - b.y) > 4) {
        return b.y - a.y; // Higher Y is higher on page in PDF coordinates
      }
      return a.x - b.x;
    });

    // Assemble text lines
    const lines = [];
    let currentLine = [];
    let currentY = null;

    for (const item of items) {
      if (currentY === null || Math.abs(item.y - currentY) > 4) {
        if (currentLine.length > 0) {
          lines.push(currentLine.join(' '));
        }
        currentLine = [item.str];
        currentY = item.y;
      } else {
        currentLine.push(item.str);
      }
    }
    if (currentLine.length > 0) {
      lines.push(currentLine.join(' '));
    }

    const pageText = lines.join('\n');
    pageResults.push({
      pageNum,
      text: pageText,
      confidence: 100,
      source: 'pdf-text',
    });
    fullTextParts.push(`--- Page ${pageNum} ---\n${pageText}`);
  }

  return {
    text: fullTextParts.join('\n\n'),
    pageResults,
  };
}

/**
 * Converts a Canvas to a File/Blob object for Tesseract worker.
 */
export function canvasToFile(canvas, fileName = 'canvas-ocr-frame.png') {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create Blob from HTML5 Canvas.'));
        return;
      }
      const file = new File([blob], fileName, { type: 'image/png' });
      resolve(file);
    }, 'image/png');
  });
}

/**
 * Executes Targeted Two-Pass OCR on an HTML5 canvas.
 */
export async function performTargetedMultiPassOCR(
  canvas,
  language = 'eng',
  onProgress
) {
  // Analyze image quality
  const qualityMetrics = analyzeCanvasImageQuality(canvas);
  const adaptiveConfig = getAdaptivePreprocessingConfig(qualityMetrics);

  // PASS 1: Adaptive Preprocessed Canvas
  const pass1Canvas = document.createElement('canvas');
  pass1Canvas.width = canvas.width;
  pass1Canvas.height = canvas.height;
  const pass1Ctx = pass1Canvas.getContext('2d');
  if (!pass1Ctx) throw new Error('Could not create Pass 1 2D canvas context.');
  pass1Ctx.drawImage(canvas, 0, 0);

  preprocessCanvas(pass1Canvas, adaptiveConfig);
  const pass1File = await canvasToFile(pass1Canvas, 'pass1-preprocessed.png');

  // Initialize Tesseract Worker
  const worker = await createWorker(language);

  try {
    await worker.setParameters({
      preserve_interword_spaces: '1',
      tessedit_pageseg_mode: '6', // PSM 6: Uniform block of text / tabular
    });

    onProgress?.('Running Pass 1 Optical Character Recognition...');
    const result1 = await worker.recognize(pass1File);

    const text1 = result1.data.text || '';
    const confidence1 = result1.data.confidence || 0;

    // Extract word tokens with bounding boxes
    const tokens1 = (result1.data.words || []).map((w) => ({
      text: w.text,
      confidence: w.confidence,
      bbox: {
        x0: w.bbox.x0,
        y0: w.bbox.y0,
        x1: w.bbox.x1,
        y1: w.bbox.y1,
      },
    }));

    // Reconstruct table spatially
    const tableResult1 = reconstructMedicalTable(tokens1, pass1Canvas.width, pass1Canvas.height);

    // Determine if Pass 2 is required
    const hasUncertainRows = tableResult1.rows.some((r) => r.needsVerification || r.rowAssociationConfidence < 0.75);
    const lowOverallConfidence = confidence1 < 75;
    const shouldRunPass2 = hasUncertainRows || lowOverallConfidence;

    if (!shouldRunPass2) {
      return {
        text: text1,
        confidence: confidence1,
        source: 'ocr',
        qualityMetrics,
        tokens: tokens1,
        reconstructedTable: tableResult1,
        reconstructedRows: tableResult1.rows,
        consensusSummary: {
          totalPasses: 1,
          agreementCount: tableResult1.rows.length,
          conflictCount: 0,
        },
      };
    }

    // PASS 2: High-Contrast Binarized Canvas for targeted verification
    onProgress?.('Running Pass 2 High-Contrast Verification...');
    const pass2Canvas = document.createElement('canvas');
    pass2Canvas.width = canvas.width;
    pass2Canvas.height = canvas.height;
    const pass2Ctx = pass2Canvas.getContext('2d');
    if (!pass2Ctx) throw new Error('Could not create Pass 2 2D canvas context.');
    pass2Ctx.drawImage(canvas, 0, 0);

    preprocessCanvas(pass2Canvas, {
      scaleFactor: 3.0,
      grayscale: true,
      contrastEnhancement: true,
      sharpen: true,
      denoise: true,
      binarization: 'adaptive',
      deskew: false,
      marginCleanup: true,
    });

    const pass2File = await canvasToFile(pass2Canvas, 'pass2-preprocessed.png');
    const result2 = await worker.recognize(pass2File);

    const text2 = result2.data.text || '';
    const confidence2 = result2.data.confidence || 0;

    const tokens2 = (result2.data.words || []).map((w) => ({
      text: w.text,
      confidence: w.confidence,
      bbox: {
        x0: w.bbox.x0,
        y0: w.bbox.y0,
        x1: w.bbox.x1,
        y1: w.bbox.y1,
      },
    }));

    const tableResult2 = reconstructMedicalTable(tokens2, pass2Canvas.width, pass2Canvas.height);

    // Compare Pass 1 and Pass 2 results
    const finalRows = [];
    let agreements = 0;
    let conflicts = 0;

    const pass2Map = new Map();
    for (const r2 of tableResult2.rows) {
      if (r2.canonicalParameter) {
        pass2Map.set(r2.canonicalParameter.canonicalName, r2);
      }
    }

    for (const r1 of tableResult1.rows) {
      const paramName = r1.canonicalParameter?.canonicalName;
      const r2 = paramName ? pass2Map.get(paramName) : null;

      if (r2 && r1.parsedValue !== null && r2.parsedValue !== null) {
        if (r1.parsedValue === r2.parsedValue) {
          agreements++;
          finalRows.push({
            ...r1,
            rowAssociationConfidence: Math.min(1.0, r1.rowAssociationConfidence + 0.1),
            needsVerification: false,
          });
        } else {
          conflicts++;
          finalRows.push({
            ...r1,
            needsVerification: true,
            conflictDetails: `Pass 1 extracted ${r1.parsedValue}, Pass 2 extracted ${r2.parsedValue}. Requires verification.`,
          });
        }
      } else {
        finalRows.push(r1);
      }
    }

    const finalConfidence = Math.round((confidence1 + confidence2) / 2);
    const mergedText = `${text1}\n\n--- Pass 2 Verification Stream ---\n${text2}`;

    return {
      text: mergedText,
      confidence: finalConfidence,
      source: 'ocr',
      qualityMetrics,
      tokens: tokens1,
      reconstructedTable: {
        ...tableResult1,
        rows: finalRows,
      },
      reconstructedRows: finalRows,
      consensusSummary: {
        totalPasses: 2,
        agreementCount: agreements,
        conflictCount: conflicts,
      },
    };
  } finally {
    // Terminate worker safely
    await worker.terminate();
  }
}

/**
 * Performs local OCR on an image File.
 */
export async function performLocalImageOCR(
  file,
  language = 'eng',
  onProgress
) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const img = new Image();
        img.onload = async () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Failed to create Canvas 2D context.'));
              return;
            }
            ctx.drawImage(img, 0, 0);

            const result = await performTargetedMultiPassOCR(canvas, language, onProgress);
            resolve(result);
          } catch (ocrErr) {
            reject(ocrErr);
          }
        };
        img.onerror = () => reject(new Error('Failed to load image into DOM element.'));
        img.src = e.target.result;
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read image file from disk.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Performs local PDF OCR with 3x page rendering and sequential multi-page handling.
 */
export async function performLocalPDFOCR(
  pdfFile,
  language = 'eng',
  onProgress
) {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;

  const totalPages = pdfDoc.numPages;
  const pageResults = [];
  const fullTextParts = [];
  const allReconstructedRows = [];
  let totalConfidence = 0;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    onProgress?.(`Rendering & processing page ${pageNum} of ${totalPages}...`, pageNum, totalPages);
    const page = await pdfDoc.getPage(pageNum);

    // Render at 3.0x scale factor for crisp OCR resolution
    const viewport = page.getViewport({ scale: 3.0 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error(`Could not initialize canvas context for page ${pageNum}.`);

    await page.render({ canvasContext: ctx, viewport }).promise;

    const pageOcr = await performTargetedMultiPassOCR(
      canvas,
      language,
      (status) => onProgress?.(`[Page ${pageNum}/${totalPages}] ${status}`, pageNum, totalPages)
    );

    pageResults.push({
      pageNum,
      text: pageOcr.text,
      confidence: pageOcr.confidence,
      source: 'ocr',
      tokens: pageOcr.tokens,
      reconstructedTable: pageOcr.reconstructedTable,
    });

    if (pageOcr.reconstructedRows) {
      allReconstructedRows.push(...pageOcr.reconstructedRows);
    }

    fullTextParts.push(`--- Page ${pageNum} ---\n${pageOcr.text}`);
    totalConfidence += pageOcr.confidence;
  }

  const avgConfidence = totalPages > 0 ? Math.round(totalConfidence / totalPages) : 0;

  return {
    text: fullTextParts.join('\n\n'),
    confidence: avgConfidence,
    source: 'ocr',
    pageResults,
    reconstructedRows: allReconstructedRows,
  };
}

/**
 * Performs Dual-Path PDF extraction:
 * 1. Checks native text layer first.
 * 2. If missing/unusable, falls back to 3x canvas rasterization and OCR.
 */
export async function performLocalPDFExtraction(
  pdfFile,
  language = 'eng',
  onProgress
) {
  if (!pdfFile) throw new Error('No PDF file provided for extraction.');
  if (!isPDFFile(pdfFile)) throw new Error(`File "${pdfFile.name}" is not a valid PDF file.`);

  try {
    onProgress?.('Checking native PDF text stream...');
    const arrayBuffer = await pdfFile.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;

    if (pdfDoc.numPages === 0) throw new Error('PDF file has 0 pages.');

    const directTextResult = await extractDirectPDFText(pdfDoc);
    const evalRes = evaluatePdfTextUsability(directTextResult.text);

    if (evalRes.isUsable) {
      onProgress?.('Extracted text directly from PDF text layer.');
      return {
        text: directTextResult.text,
        confidence: 100,
        source: 'pdf-text',
        pageResults: directTextResult.pageResults,
      };
    }
  } catch (directTextError) {
    // Fall back to OCR rasterization
  }

  return performLocalPDFOCR(pdfFile, language, onProgress);
}

/**
 * Renders the first page of a PDF document to a data URL thumbnail image for card covers.
 */
export async function renderPdfFirstPageThumbnail(pdfFileOrBufferOrUrl, targetWidth = 450) {
  try {
    let source;
    if (pdfFileOrBufferOrUrl instanceof File || pdfFileOrBufferOrUrl instanceof Blob) {
      const arrayBuffer = await pdfFileOrBufferOrUrl.arrayBuffer();
      source = { data: arrayBuffer };
    } else if (typeof pdfFileOrBufferOrUrl === 'string') {
      if (pdfFileOrBufferOrUrl.startsWith('data:')) {
        const res = await fetch(pdfFileOrBufferOrUrl);
        const arrayBuffer = await res.arrayBuffer();
        source = { data: arrayBuffer };
      } else {
        source = pdfFileOrBufferOrUrl;
      }
    } else {
      source = { data: pdfFileOrBufferOrUrl };
    }

    const loadingTask = pdfjsLib.getDocument(source);
    const pdfDoc = await loadingTask.promise;
    if (pdfDoc.numPages === 0) return null;

    const page = await pdfDoc.getPage(1);
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const scale = Math.max(1.0, targetWidth / unscaledViewport.width);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch (err) {
    console.warn('PDF cover thumbnail generation notice:', err.message);
    return null;
  }
}

/**
 * Master entrypoint for on-device OCR extraction.
 */
export async function performLocalOCR(
  file,
  language = 'eng',
  onProgress
) {
  if (isPDFFile(file)) {
    return performLocalPDFExtraction(file, language, onProgress);
  } else if (isSupportedImageFile(file)) {
    return performLocalImageOCR(file, language, (status) => onProgress?.(status));
  } else {
    throw new Error(`Unsupported file type: "${file.name}". Please upload a PDF, PNG, JPG, or WebP document.`);
  }
}

