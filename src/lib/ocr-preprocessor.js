/**
 * Deterministic Local Image Preprocessing Pipeline for Medical OCR
 * 
 * 100% Client-Side / Local Canvas & Pixel-Buffer Algorithms:
 * 1. Grayscale conversion (Luminance mapping)
 * 2. High-DPI Upscaling (2x, 3x bicubic/bilinear)
 * 3. Dynamic Contrast Optimization (S-Curve & Histogram stretching preserving decimal dots)
 * 4. Conditional Denoising (3x3 median filter)
 * 5. Edge Sharpening (Laplacian convolution filter)
 * 6. Adaptive & Otsu Threshold Binarization
 * 7. Deskew Angle Detection & Rotational Correction
 * 8. Margin & Tabular Border Cleanup
 */

export const DEFAULT_PREPROCESSING_CONFIG = {
  scaleFactor: 3.0,
  grayscale: true,
  contrastEnhancement: true,
  sharpen: true,
  denoise: false,
  binarization: 'none', // 'none' | 'adaptive' | 'otsu' - Default to smooth high-contrast grayscale to preserve anti-aliased decimal dots
  deskew: true,
  marginCleanup: true,
};

/**
 * Converts canvas pixel buffer to luminance grayscale.
 * Standard Rec. 601 / 709 luminance formula: Y = 0.299*R + 0.587*G + 0.114*B
 */
export function applyGrayscale(data) {
  const len = data.length;
  const luminances = new Float32Array(len / 4);
  let lumIdx = 0;

  for (let i = 0; i < len; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    luminances[lumIdx++] = lum;
    const rounded = Math.round(lum);
    data[i] = rounded;
    data[i + 1] = rounded;
    data[i + 2] = rounded;
  }
  return luminances;
}

/**
 * Dynamic Contrast Optimization with S-Curve expansion.
 * Stretches luminance range from 5th to 95th percentile to maximize
 * legibility of faint medical dot-matrix printouts without blowing out decimal points.
 */
export function applyContrastEnhancement(data, precalculatedLuminances) {
  const pixelCount = data.length / 4;
  if (pixelCount === 0) return;

  // Build histogram
  const hist = new Uint32Array(256);
  for (let i = 0; i < data.length; i += 4) {
    hist[data[i]]++;
  }

  // Find 2nd and 98th percentile cutoffs for robust histogram stretching
  const p2Count = Math.floor(pixelCount * 0.02);
  const p98Count = Math.floor(pixelCount * 0.98);

  let accumulated = 0;
  let minLum = 0;
  let maxLum = 255;

  for (let v = 0; v < 256; v++) {
    accumulated += hist[v];
    if (accumulated >= p2Count && minLum === 0) {
      minLum = v;
    }
    if (accumulated >= p98Count) {
      maxLum = v;
      break;
    }
  }

  if (maxLum <= minLum) {
    minLum = 0;
    maxLum = 255;
  }

  const range = maxLum - minLum;
  // Precompute 256-entry lookup table with mild S-curve sigmoidal contrast
  const lut = new Uint8Array(256);
  for (let v = 0; v < 256; v++) {
    // 1. Linear stretch
    let normalized = (v - minLum) / range;
    if (normalized < 0) normalized = 0;
    if (normalized > 1) normalized = 1;

    // 2. Smooth S-curve transition
    const sCurved = normalized * normalized * (3 - 2 * normalized);
    lut[v] = Math.round(sCurved * 255);
  }

  for (let i = 0; i < data.length; i += 4) {
    const val = lut[data[i]];
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
  }
}

/**
 * 3x3 Median Denoising Filter.
 * Removes salt-and-pepper noise and scanner speckles without blurring sharp text edges.
 */
export function applyDenoise(data, width, height) {
  const copy = new Uint8Array(data.length / 4);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    copy[j] = data[i];
  }

  const neighborhood = new Uint8Array(9);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          neighborhood[n++] = copy[(y + dy) * width + (x + dx)];
        }
      }

      // Simple insertion sort on 9 items to find median (index 4)
      for (let i = 1; i < 9; i++) {
        const key = neighborhood[i];
        let j = i - 1;
        while (j >= 0 && neighborhood[j] > key) {
          neighborhood[j + 1] = neighborhood[j];
          j--;
        }
        neighborhood[j + 1] = key;
      }

      const median = neighborhood[4];
      const targetIdx = (y * width + x) * 4;
      data[targetIdx] = median;
      data[targetIdx + 1] = median;
      data[targetIdx + 2] = median;
    }
  }
}

/**
 * 3x3 Laplacian Edge Sharpening Convolution.
 * Kernel:
 * [  0, -1,  0 ]
 * [ -1,  5, -1 ]
 * [  0, -1,  0 ]
 */
export function applySharpen(data, width, height) {
  const copy = new Uint8Array(data.length / 4);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    copy[j] = data[i];
  }

  for (let y = 1; y < height - 1; y++) {
    const yWidth = y * width;
    const yAbove = (y - 1) * width;
    const yBelow = (y + 1) * width;

    for (let x = 1; x < width - 1; x++) {
      const center = copy[yWidth + x];
      const top = copy[yAbove + x];
      const bottom = copy[yBelow + x];
      const left = copy[yWidth + (x - 1)];
      const right = copy[yWidth + (x + 1)];

      const sharpVal = 5 * center - top - bottom - left - right;
      const clamped = sharpVal < 0 ? 0 : sharpVal > 255 ? 255 : sharpVal;

      const targetIdx = (yWidth + x) * 4;
      data[targetIdx] = clamped;
      data[targetIdx + 1] = clamped;
      data[targetIdx + 2] = clamped;
    }
  }
}

/**
 * Global Otsu Thresholding.
 * Calculates optimal binarization threshold minimizing intra-class luminance variance.
 */
export function applyOtsuThreshold(data) {
  const hist = new Uint32Array(256);
  const pixelCount = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    hist[data[i]]++;
  }

  let sum = 0;
  for (let t = 0; t < 256; t++) {
    sum += t * hist[t];
  }

  let sumB = 0;
  let weightB = 0;
  let maxVariance = 0;
  let threshold = 128;

  for (let t = 0; t < 256; t++) {
    weightB += hist[t];
    if (weightB === 0) continue;

    const weightF = pixelCount - weightB;
    if (weightF === 0) break;

    sumB += t * hist[t];
    const meanB = sumB / weightB;
    const meanF = (sum - sumB) / weightF;

    const varianceBetween = weightB * weightF * (meanB - meanF) * (meanB - meanF);
    if (varianceBetween > maxVariance) {
      maxVariance = varianceBetween;
      threshold = t;
    }
  }

  for (let i = 0; i < data.length; i += 4) {
    const bin = data[i] < threshold ? 0 : 255;
    data[i] = bin;
    data[i + 1] = bin;
    data[i + 2] = bin;
  }
}

/**
 * Sauvola Local Adaptive Thresholding.
 * Handles uneven shadows, gradients, and low-light mobile photos of lab documents.
 * T(x,y) = m(x,y) * (1 + k * (s(x,y) / R - 1))
 */
export function applyAdaptiveThreshold(data, width, height, windowSize = 25, k = 0.2, R = 128) {
  const halfWin = Math.floor(windowSize / 2);
  const integral = new Float64Array((width + 1) * (height + 1));
  const integralSq = new Float64Array((width + 1) * (height + 1));

  // Compute 2D Integral Images for O(1) box window queries
  for (let y = 0; y < height; y++) {
    let sum = 0;
    let sumSq = 0;
    for (let x = 0; x < width; x++) {
      const val = data[(y * width + x) * 4];
      sum += val;
      sumSq += val * val;

      const idx = (y + 1) * (width + 1) + (x + 1);
      const idxAbove = y * (width + 1) + (x + 1);

      integral[idx] = integral[idxAbove] + sum;
      integralSq[idx] = integralSq[idxAbove] + sumSq;
    }
  }

  // Apply Sauvola threshold
  for (let y = 0; y < height; y++) {
    const y0 = Math.max(0, y - halfWin);
    const y1 = Math.min(height, y + halfWin + 1);

    for (let x = 0; x < width; x++) {
      const x0 = Math.max(0, x - halfWin);
      const x1 = Math.min(width, x + halfWin + 1);

      const area = (x1 - x0) * (y1 - y0);

      const a = y0 * (width + 1) + x0;
      const b = y0 * (width + 1) + x1;
      const c = y1 * (width + 1) + x0;
      const d = y1 * (width + 1) + x1;

      const sum = integral[d] - integral[b] - integral[c] + integral[a];
      const sumSq = integralSq[d] - integralSq[b] - integralSq[c] + integralSq[a];

      const mean = sum / area;
      const variance = (sumSq - (sum * sum) / area) / area;
      const stdDev = Math.sqrt(Math.max(0, variance));

      const threshold = mean * (1 + k * (stdDev / R - 1));
      const targetIdx = (y * width + x) * 4;
      const bin = data[targetIdx] < threshold ? 0 : 255;

      data[targetIdx] = bin;
      data[targetIdx + 1] = bin;
      data[targetIdx + 2] = bin;
    }
  }
}

/**
 * Estimates skew angle using horizontal projection variance across [-15, +15] degrees.
 */
export function estimateSkewAngle(data, width, height) {
  // Subsample document to fast 400x400 grid for rapid angle search
  const step = Math.max(1, Math.floor(Math.min(width, height) / 400));
  const sampleW = Math.floor(width / step);
  const sampleH = Math.floor(height / step);

  let bestAngle = 0;
  let maxVariance = -1;

  // Search angles from -15 to +15 with 0.5 degree steps
  for (let angle = -15; angle <= 15; angle += 0.5) {
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const rowSums = new Float64Array(sampleH);
    const counts = new Uint32Array(sampleH);

    for (let y = 0; y < sampleH; y++) {
      const origY = y * step;
      for (let x = 0; x < sampleW; x++) {
        const origX = x * step;
        // Rotated Y coordinate
        const rotY = Math.round(origY * cos - origX * sin);
        const rotRow = Math.floor(rotY / step);

        if (rotRow >= 0 && rotRow < sampleH) {
          const pixelVal = data[(origY * width + origX) * 4];
          rowSums[rotRow] += pixelVal;
          counts[rotRow]++;
        }
      }
    }

    // Calculate projection variance
    let sum = 0;
    let sumSq = 0;
    let totalRows = 0;
    for (let r = 0; r < sampleH; r++) {
      if (counts[r] > 0) {
        const avg = rowSums[r] / counts[r];
        sum += avg;
        sumSq += avg * avg;
        totalRows++;
      }
    }

    if (totalRows > 0) {
      const mean = sum / totalRows;
      const variance = sumSq / totalRows - mean * mean;
      if (variance > maxVariance) {
        maxVariance = variance;
        bestAngle = angle;
      }
    }
  }

  return bestAngle;
}

/**
 * Margin and Border Cleanup.
 * Cleans scanner shadow borders and edge artifacts by whitening the outer perimeter.
 */
export function applyMarginCleanup(data, width, height, marginPixels = 15) {
  const m = Math.min(marginPixels, Math.floor(Math.min(width, height) * 0.05));
  if (m <= 0) return;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (x < m || x >= width - m || y < m || y >= height - m) {
        const idx = (y * width + x) * 4;
        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
      }
    }
  }
}

/**
 * Complete Preprocessing Pipeline Execution on an HTML5 Canvas.
 */
export function preprocessCanvas(canvas, config = DEFAULT_PREPROCESSING_CONFIG) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. High-DPI Rescaling if requested
  if (config.scaleFactor && config.scaleFactor !== 1.0) {
    const origW = canvas.width;
    const origH = canvas.height;
    const newW = Math.round(origW * config.scaleFactor);
    const newH = Math.round(origH * config.scaleFactor);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = origW;
    tempCanvas.height = origH;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.drawImage(canvas, 0, 0);

      canvas.width = newW;
      canvas.height = newH;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(tempCanvas, 0, 0, newW, newH);
    }
  }

  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // 2. Grayscale
  let luminances;
  if (config.grayscale !== false) {
    luminances = applyGrayscale(data);
  }

  // 3. Contrast Enhancement
  if (config.contrastEnhancement !== false) {
    applyContrastEnhancement(data, luminances);
  }

  // 4. Denoising
  if (config.denoise) {
    applyDenoise(data, width, height);
  }

  // 5. Sharpening
  if (config.sharpen !== false) {
    applySharpen(data, width, height);
  }

  // 6. Margin Cleanup
  if (config.marginCleanup !== false) {
    applyMarginCleanup(data, width, height, Math.round(width * 0.015));
  }

  // 7. Binarization
  if (config.binarization === 'otsu') {
    applyOtsuThreshold(data);
  } else if (config.binarization === 'adaptive') {
    applyAdaptiveThreshold(data, width, height);
  }

  ctx.putImageData(imageData, 0, 0);

  // 8. Deskew if requested and non-zero angle detected
  if (config.deskew) {
    const angle = estimateSkewAngle(data, width, height);
    if (Math.abs(angle) >= 0.5 && Math.abs(angle) <= 15) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(canvas, 0, 0);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.rotate((-angle * Math.PI) / 180);
        ctx.drawImage(tempCanvas, -width / 2, -height / 2);
        ctx.restore();
      }
    }
  }
}
