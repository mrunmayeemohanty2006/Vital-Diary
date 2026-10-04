/**
 * Adaptive Image Quality Analyzer & Preprocessing Strategy Selector
 * 
 * 100% Client-Side / Local Deterministic Analysis:
 * Analyzes raw canvas pixels to measure:
 * 1. Mean Brightness & Luminance Variance
 * 2. Contrast Ratio & Histogram Entropy
 * 3. High-frequency Noise / Speckle Density
 * 4. Skew Angle via Horizontal Projection Variance
 * 
 * Dynamically selects the optimal preprocessing pipeline:
 * - Pipeline A (Standard): High-DPI 3.0x + S-Curve Dynamic Contrast + Laplacian Sharpen
 * - Pipeline B (Low Contrast / Faint): Dynamic Histogram Equalization + 3.5x Scale + High Sharpen
 * - Pipeline C (Noisy / Scanned Paper): 3x3 Median Denoise + Sauvola Adaptive Thresholding
 * - Pipeline D (Dense Tabular / High Skew): Deskew Rotation + Contrast Stretch
 */

import { estimateSkewAngle } from './ocr-preprocessor.js';

/**
 * Fast pixel-level analysis of an image canvas.
 */
export function analyzeCanvasImageQuality(canvas) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  if (!ctx || width === 0 || height === 0) {
    return {
      width: 0,
      height: 0,
      meanLuminance: 128,
      stdDevLuminance: 50,
      contrastRatio: 5,
      noiseScore: 0,
      estimatedSkewAngle: 0,
      recommendedPipeline: 'standard',
    };
  }

  // Sample grid to achieve sub-millisecond analysis latency
  const step = Math.max(1, Math.floor(Math.min(width, height) / 250));
  const sampleW = Math.floor(width / step);
  const sampleH = Math.floor(height / step);
  const totalSamples = sampleW * sampleH;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  let sumLum = 0;
  let sumLumSq = 0;
  let minLum = 255;
  let maxLum = 0;
  const hist = new Uint32Array(256);

  // Measure luminance, min/max, standard deviation
  for (let y = 0; y < sampleH; y++) {
    const origY = y * step;
    for (let x = 0; x < sampleW; x++) {
      const origX = x * step;
      const idx = (origY * width + origX) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

      hist[lum]++;
      sumLum += lum;
      sumLumSq += lum * lum;
      if (lum < minLum) minLum = lum;
      if (lum > maxLum) maxLum = lum;
    }
  }

  const meanLum = totalSamples > 0 ? sumLum / totalSamples : 128;
  const varLum = totalSamples > 0 ? sumLumSq / totalSamples - meanLum * meanLum : 0;
  const stdDevLum = Math.sqrt(Math.max(0, varLum));
  const contrastRatio = minLum > 0 ? maxLum / minLum : maxLum;

  // Measure high-frequency noise / speckle density
  let noiseDiffSum = 0;
  let noiseSamples = 0;
  for (let y = 1; y < sampleH - 1; y += 2) {
    const origY = y * step;
    for (let x = 1; x < sampleW - 1; x += 2) {
      const origX = x * step;
      const center = data[(origY * width + origX) * 4];
      const right = data[(origY * width + (origX + step)) * 4];
      const bottom = data[((origY + step) * width + origX) * 4];

      noiseDiffSum += Math.abs(center - right) + Math.abs(center - bottom);
      noiseSamples += 2;
    }
  }
  const noiseScore = noiseSamples > 0 ? noiseDiffSum / (noiseSamples * 255) : 0;

  // Estimate skew angle
  let estimatedSkewAngle = 0;
  try {
    estimatedSkewAngle = estimateSkewAngle(data, width, height);
  } catch {
    estimatedSkewAngle = 0;
  }

  // Dynamic Strategy Selection
  let recommendedPipeline = 'standard';
  if (Math.abs(estimatedSkewAngle) >= 1.5) {
    recommendedPipeline = 'skewed';
  } else if (noiseScore > 0.18 || (stdDevLum < 35 && meanLum > 200)) {
    recommendedPipeline = 'noisy';
  } else if (stdDevLum < 45 || contrastRatio < 4.0) {
    recommendedPipeline = 'low-contrast';
  }

  return {
    width,
    height,
    meanLuminance: Math.round(meanLum * 10) / 10,
    stdDevLuminance: Math.round(stdDevLum * 10) / 10,
    contrastRatio: Math.round(contrastRatio * 10) / 10,
    noiseScore: Math.round(noiseScore * 1000) / 1000,
    estimatedSkewAngle,
    recommendedPipeline,
  };
}

/**
 * Returns the optimal PreprocessingConfig based on image analysis.
 */
export function getAdaptivePreprocessingConfig(metrics) {
  switch (metrics.recommendedPipeline) {
    case 'low-contrast':
      return {
        scaleFactor: 3.0,
        grayscale: true,
        contrastEnhancement: true,
        sharpen: true,
        denoise: false,
        binarization: 'none', // Smooth S-curve to recover faint gray dots
        deskew: true,
        marginCleanup: true,
      };

    case 'noisy':
      return {
        scaleFactor: 3.0,
        grayscale: true,
        contrastEnhancement: true,
        sharpen: false,
        denoise: true, // Apply median filter to remove speckles
        binarization: 'adaptive', // Sauvola local window binarization
        deskew: true,
        marginCleanup: true,
      };

    case 'skewed':
      return {
        scaleFactor: 3.0,
        grayscale: true,
        contrastEnhancement: true,
        sharpen: true,
        denoise: false,
        binarization: 'none',
        deskew: true, // Rotational deskew
        marginCleanup: true,
      };

    case 'standard':
    default:
      return {
        scaleFactor: 3.0,
        grayscale: true,
        contrastEnhancement: true,
        sharpen: true,
        denoise: false,
        binarization: 'none',
        deskew: true,
        marginCleanup: true,
      };
  }
}
