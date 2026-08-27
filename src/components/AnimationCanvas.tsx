import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Peak } from '../types';
import { calculateMassFromMz } from '../utils/massSpec';

interface AnimationCanvasProps {
  progress: number; // 0.0 to 1.0
  mass: number;
  centerZ: number;
  sigmaZ: number;
  zMin: number;
  zMax: number;
  mzMin: number;
  mzMax: number;
  peaks: Peak[];
  adductMass: number;
  selectedPeak: Peak | null;
  onSelectPeak: (peak: Peak | null) => void;
  speed: number;
}

export const AnimationCanvas: React.FC<AnimationCanvasProps> = ({
  progress,
  mass,
  centerZ,
  sigmaZ,
  zMin,
  zMax,
  mzMin,
  mzMax,
  peaks,
  adductMass,
  selectedPeak,
  onSelectPeak,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 960, height: 560 });
  const [hoveredPeak, setHoveredPeak] = useState<Peak | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          const h = Math.min(640, Math.max(420, Math.round(w * 0.54)));
          setDimensions({ width: Math.round(w), height: h });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute dynamic axes domains for any mass & charge range
  const { mzMinDomain, mzMaxDomain, massAxisMax } = useMemo(() => {
    // Mass domain: accommodates at least 2x harmonic and true mass
    const targetMaxMass = Math.max(mass * 2.15, mass + 20000);
    const dynamicMassMax = Math.ceil(targetMaxMass / 20000) * 20000;

    return {
      mzMinDomain: Math.max(50, mzMin),
      mzMaxDomain: Math.max(mzMin + 100, mzMax),
      massAxisMax: dynamicMassMax,
    };
  }, [mzMin, mzMax, mass]);

  // Compute trial charge drops for all peaks
  const animationData = useMemo(() => {
    const tokens: Array<{
      id: string;
      peakIndex: number;
      peak: Peak;
      trialZ: number;
      mass: number;
      category: 'true' | 'half_harmonic' | 'double_harmonic' | 'noise';
      spawnProg: number;
      dropProg: number;
      radius: number;
      stackLevel: number;
      scatterXOffset: number;
    }> = [];

    let trueMassStack = 0;
    let halfHarmonicStack = 0;
    let doubleHarmonicStack = 0;

    const firstPeak = peaks[0];
    const testZMin = Math.max(2, Math.min(zMin - 4, Math.floor(zMin / 2)));
    const testZMax = Math.min(90, Math.max(zMax + 6, zMin * 2));

    if (firstPeak) {
      // Step-by-step single-peak trials: start at the lowest candidate charge testZMin (e.g. z=6, 7, 8)
      const earlyZ = [testZMin, testZMin + 1, testZMin + 2].filter((zVal) => zVal <= testZMax);

      earlyZ.forEach((zVal, idx) => {
        const isTrue = zVal === firstPeak.z;
        const isHalf = firstPeak.z % 2 === 0 && zVal === firstPeak.z / 2;
        const isDouble = zVal === firstPeak.z * 2;

        let cat: 'true' | 'half_harmonic' | 'double_harmonic' | 'noise' = 'noise';
        let stack = 0;

        if (isTrue) {
          cat = 'true';
          trueMassStack += 1;
          stack = trueMassStack;
        } else if (isHalf) {
          cat = 'half_harmonic';
          halfHarmonicStack += 1;
          stack = halfHarmonicStack;
        } else if (isDouble) {
          cat = 'double_harmonic';
          doubleHarmonicStack += 1;
          stack = doubleHarmonicStack;
        }

        tokens.push({
          id: `p0-z${zVal}`,
          peakIndex: 0,
          peak: firstPeak,
          trialZ: zVal,
          mass: calculateMassFromMz(firstPeak.mz, zVal, adductMass),
          category: cat,
          spawnProg: 0.16 + idx * 0.08,
          dropProg: 0.16 + idx * 0.08,
          radius: 5.0,
          stackLevel: stack,
          scatterXOffset: 0,
        });
      });

      // Remaining trial charges for Peak 0
      for (let tz = testZMin; tz <= testZMax; tz++) {
        if (earlyZ.includes(tz)) continue;

        const isTrue = tz === firstPeak.z;
        const isHalf = firstPeak.z % 2 === 0 && tz === firstPeak.z / 2;
        const isDouble = tz === firstPeak.z * 2;

        let cat: 'true' | 'half_harmonic' | 'double_harmonic' | 'noise' = 'noise';
        let stack = 0;

        if (isTrue) {
          cat = 'true';
          trueMassStack += 1;
          stack = trueMassStack;
        } else if (isHalf) {
          cat = 'half_harmonic';
          halfHarmonicStack += 1;
          stack = halfHarmonicStack;
        } else if (isDouble) {
          cat = 'double_harmonic';
          doubleHarmonicStack += 1;
          stack = doubleHarmonicStack;
        }

        tokens.push({
          id: `p0-z${tz}`,
          peakIndex: 0,
          peak: firstPeak,
          trialZ: tz,
          mass: calculateMassFromMz(firstPeak.mz, tz, adductMass),
          category: cat,
          spawnProg: 0.40,
          dropProg: 0.40,
          radius: 5.0,
          stackLevel: stack,
          scatterXOffset: (tz % 4 - 1.5) * 0.35,
        });
      }
    }

    // Subsequent peaks: trial charges across progress 0.50 to 0.80 sequentially
    const remainingPeaks = peaks.slice(1);
    const N = remainingPeaks.length;
    remainingPeaks.forEach((peak, i) => {
      const pIdx = i + 1;
      const sliceStart = 0.50 + (i / Math.max(1, N)) * 0.30;
      const baseProg = sliceStart;

      for (let tz = testZMin; tz <= testZMax; tz++) {
        const mVal = calculateMassFromMz(peak.mz, tz, adductMass);
        if (mVal < 0 || mVal > massAxisMax * 1.05) continue;

        const isTrue = tz === peak.z;
        const isHalf = peak.z % 2 === 0 && tz === peak.z / 2;
        const isDouble = tz === peak.z * 2;

        let cat: 'true' | 'half_harmonic' | 'double_harmonic' | 'noise' = 'noise';
        let stack = 0;

        if (isTrue) {
          cat = 'true';
          trueMassStack += 1;
          stack = trueMassStack;
        } else if (isHalf) {
          cat = 'half_harmonic';
          halfHarmonicStack += 1;
          stack = halfHarmonicStack;
        } else if (isDouble) {
          cat = 'double_harmonic';
          doubleHarmonicStack += 1;
          stack = doubleHarmonicStack;
        }

        const pseudoScatter = Math.sin(pIdx * 13 + tz * 7) * 0.45;

        tokens.push({
          id: `p${pIdx}-z${tz}`,
          peakIndex: pIdx,
          peak,
          trialZ: tz,
          mass: mVal,
          category: cat,
          spawnProg: baseProg,
          dropProg: baseProg,
          radius: 5.0,
          stackLevel: stack,
          scatterXOffset: pseudoScatter,
        });
      }
    });

    return {
      tokens,
      totalTrueTokens: trueMassStack,
      totalHalfTokens: halfHarmonicStack,
      totalDoubleTokens: doubleHarmonicStack,
    };
  }, [peaks, adductMass, mass, zMin, zMax, massAxisMax]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = dimensions.width;
    const height = dimensions.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Canvas Background
    ctx.fillStyle = '#0f1015';
    ctx.fillRect(0, 0, width, height);

    // Subtle Grid
    ctx.strokeStyle = '#181a24';
    ctx.lineWidth = 1;
    for (let x = 50; x < width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 30; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const padL = 76;
    const padR = 40;
    const upperY0 = height * 0.09;
    const upperY1 = height * 0.38; // m/z baseline
    const lowerY0 = height * 0.65;
    const lowerY1 = height * 0.88; // mass baseline

    const mzToX = (mz: number) => {
      const min = mzMinDomain;
      const max = mzMaxDomain;
      return padL + ((mz - min) / Math.max(1, max - min)) * (width - padL - padR);
    };

    const abundanceToY = (ab: number) => {
      return upperY1 - ab * (upperY1 - upperY0);
    };

    const massToX = (mVal: number) => {
      return padL + (mVal / Math.max(1, massAxisMax)) * (width - padL - padR);
    };

    // Upper Axes (m/z)
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padL - 10, upperY1);
    ctx.lineTo(width - padR + 10, upperY1);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(padL, upperY1 + 6);
    ctx.lineTo(padL, upperY0 - 8);
    ctx.stroke();

    // Upper Y-Axis Scale (0, 50, 100 Relative Abundance %)
    const yTicks = [
      { val: 0, y: upperY1, label: '0' },
      { val: 50, y: (upperY0 + upperY1) / 2, label: '50' },
      { val: 100, y: upperY0, label: '100' },
    ];

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'right';
    yTicks.forEach((t) => {
      ctx.beginPath();
      ctx.moveTo(padL - 5, t.y);
      ctx.lineTo(padL, t.y);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillText(t.label, padL - 7, t.y + 3.5);
    });

    // Y-Axis Title "Relative Abundance %"
    ctx.save();
    ctx.translate(padL - 26, (upperY0 + upperY1) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('Relative Abundance %', 0, 0);
    ctx.restore();

    // m/z Ticks
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px ui-monospace, monospace';
    ctx.textAlign = 'center';

    const mzSpan = mzMaxDomain - mzMinDomain;
    let tickStep = 500;
    if (mzSpan <= 500) tickStep = 50;
    else if (mzSpan <= 1000) tickStep = 100;
    else if (mzSpan <= 2200) tickStep = 200;
    else if (mzSpan <= 4000) tickStep = 500;
    else tickStep = 1000;

    const firstTick = Math.ceil(mzMinDomain / tickStep) * tickStep;
    for (let m = firstTick; m <= mzMaxDomain; m += tickStep) {
      const x = mzToX(m);
      if (x >= padL && x <= width - padR) {
        ctx.beginPath();
        ctx.moveTo(x, upperY1);
        ctx.lineTo(x, upperY1 + 5);
        ctx.stroke();
        ctx.fillText(Math.round(m).toString(), x, upperY1 + 16);
      }
    }

    // Upper X-Axis Centered Title
    const spectrumCenterX = padL + (width - padL - padR) / 2;
    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Observed Spectrum: m/z', spectrumCenterX, upperY1 + 30);

    // Envelope Guide Curve
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    let started = false;
    const curveStep = (mzMaxDomain - mzMinDomain) / 120;
    for (let m = mzMinDomain; m <= mzMaxDomain; m += curveStep) {
      const zCont = mass / Math.max(0.1, m - adductMass);
      const ab = Math.exp(-Math.pow(zCont - centerZ, 2) / (2 * Math.pow(Math.max(0.5, sigmaZ), 2)));
      if (ab > 0.01) {
        const x = mzToX(m);
        const y = abundanceToY(ab);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Determine the single currently active peak undergoing trial charge evaluation
    let activePeakId: string | null = null;
    if (progress >= 0.14 && progress < 0.50 && peaks.length > 0) {
      activePeakId = peaks[0].id;
    } else if (progress >= 0.50 && progress < 0.80 && peaks.length > 1) {
      const remainingCount = peaks.length - 1;
      const fraction = (progress - 0.50) / 0.30;
      const idx = Math.min(remainingCount - 1, Math.max(0, Math.floor(fraction * remainingCount)));
      activePeakId = peaks[idx + 1].id;
    }

    // Centroid Peaks with Single-Peak Apex Indicator
    peaks.forEach((p) => {
      const x = mzToX(p.mz);
      if (x < padL - 10 || x > width - padR + 10) return;

      const topY = abundanceToY(p.abundance);
      const baseY = upperY1;
      const isActive = activePeakId === p.id;
      const isHovered = hoveredPeak?.id === p.id || selectedPeak?.id === p.id;

      if (isActive) {
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 14;
      } else if (isHovered) {
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
      }

      ctx.strokeStyle = isActive ? '#f43f5e' : isHovered ? '#7dd3fc' : '#38bdf8';
      ctx.lineWidth = isActive ? 2.6 : isHovered ? 2.4 : 1.8;
      ctx.beginPath();
      ctx.moveTo(x, baseY);
      ctx.lineTo(x, topY);
      ctx.stroke();

      // Apex highlight indicator (only for the single currently evaluated charge state)
      if (isActive) {
        // Pulsing target halo around apex
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.85)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(x, topY, 7 + Math.sin(progress * 80) * 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, topY, 4.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = isHovered ? '#ffffff' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(x, topY, isHovered ? 4.5 : 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Peak m/z label (measured m/z without pre-assigned charge state)
      ctx.textAlign = 'center';
      if (isActive) {
        ctx.fillStyle = '#fecdd3';
        ctx.font = '700 10px ui-monospace, monospace';
        ctx.fillText(`${p.mz.toFixed(1)}`, x, topY - 9);
      } else {
        ctx.fillStyle = isHovered ? '#ffffff' : '#94a3b8';
        ctx.font = '600 9px ui-monospace, monospace';
        ctx.fillText(`${p.mz.toFixed(1)}`, x, topY - 6);
      }
    });

    // Lower Axes (Mass Da)
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padL - 10, lowerY1);
    ctx.lineTo(width - padR + 10, lowerY1);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px ui-monospace, monospace';
    ctx.textAlign = 'center';

    const massStep = massAxisMax <= 80000 ? 10000 : massAxisMax <= 180000 ? 25000 : 50000;
    for (let m = 0; m <= massAxisMax; m += massStep) {
      const x = massToX(m);
      ctx.beginPath();
      ctx.moveTo(x, lowerY1);
      ctx.lineTo(x, lowerY1 + 5);
      ctx.stroke();
      const label = m > 0 ? `${(m / 1000).toFixed(0)}k` : '0';
      ctx.fillText(label, x, lowerY1 + 16);
    }

    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Deconvolved Molecular Mass (Da)', spectrumCenterX, lowerY1 + 30);

    // Zoom Inspection on First Peak (Scene 2: Progress 0.14 - 0.52)
    const firstPeak = peaks[0];
    if (firstPeak && progress >= 0.14 && progress < 0.52) {
      const p1X = mzToX(firstPeak.mz);
      const p1Y = abundanceToY(firstPeak.abundance);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p1X, p1Y, 10, 0, Math.PI * 2);
      ctx.stroke();

      // Inspection Card
      const cardW = Math.min(width - 40, 560);
      const cardH = 92;
      const cardX = width / 2 - cardW / 2;
      const cardY = (upperY1 + lowerY0) / 2 - cardH / 2 - 6;

      ctx.fillStyle = 'rgba(18, 20, 29, 0.98)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 8);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#7dd3fc';
      ctx.font = '700 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`Target Peak: m/z = ${firstPeak.mz.toFixed(2)}`, cardX + 16, cardY + 24);

      const testZMin = Math.max(2, Math.min(zMin - 4, Math.floor(zMin / 2)));
      const testZMax = Math.min(90, Math.max(zMax + 6, zMin * 2));
      const earlyZ = [testZMin, testZMin + 1, testZMin + 2].filter((zVal) => zVal <= testZMax);

      if (progress < 0.16) {
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '500 13px ui-monospace, monospace';
        ctx.fillText(`M = (${firstPeak.mz.toFixed(2)} - ${adductMass.toFixed(2)}) × z_test`, cardX + 16, cardY + 54);
      } else if (progress >= 0.16 && progress < 0.24 && earlyZ[0] !== undefined) {
        const zVal = earlyZ[0];
        const mVal = calculateMassFromMz(firstPeak.mz, zVal, adductMass);
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '600 14px ui-monospace, monospace';
        ctx.fillText(`z = ${zVal}:  (${firstPeak.mz.toFixed(2)} - ${adductMass.toFixed(2)}) × ${zVal} = ${mVal.toFixed(1)} Da`, cardX + 16, cardY + 56);
      } else if (progress >= 0.24 && progress < 0.32 && earlyZ[1] !== undefined) {
        const zVal = earlyZ[1];
        const mVal = calculateMassFromMz(firstPeak.mz, zVal, adductMass);
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '600 14px ui-monospace, monospace';
        ctx.fillText(`z = ${zVal}:  (${firstPeak.mz.toFixed(2)} - ${adductMass.toFixed(2)}) × ${zVal} = ${mVal.toFixed(1)} Da`, cardX + 16, cardY + 56);
      } else if (progress >= 0.32 && progress < 0.40 && earlyZ[2] !== undefined) {
        const zVal = earlyZ[2];
        const mVal = calculateMassFromMz(firstPeak.mz, zVal, adductMass);
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '600 14px ui-monospace, monospace';
        ctx.fillText(`z = ${zVal}:  (${firstPeak.mz.toFixed(2)} - ${adductMass.toFixed(2)}) × ${zVal} = ${mVal.toFixed(1)} Da`, cardX + 16, cardY + 56);
      } else {
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '600 13px ui-monospace, monospace';
        ctx.fillText(`Evaluating candidate array z_test ∈ [${testZMin}, ${testZMax}]`, cardX + 16, cardY + 54);
      }
    }

    // Token Physics & Trajectories
    const easeBounce = (t: number) => {
      const n1 = 7.5625;
      const d1 = 2.75;
      if (t < 1 / d1) return n1 * t * t;
      else if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
      else if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
      else return n1 * (t -= 2.625 / d1) * t + 0.984375;
    };

    const coralRGB: [number, number, number] = [244, 63, 94];     // #f43f5e
    const goldRGB: [number, number, number] = [234, 179, 8];      // #eab308
    const blueRGB: [number, number, number] = [56, 189, 248];     // #38bdf8

    const interpolateRgb = (c1: [number, number, number], c2: [number, number, number], f: number) => {
      const r = Math.round(c1[0] + (c2[0] - c1[0]) * f);
      const g = Math.round(c1[1] + (c2[1] - c1[1]) * f);
      const b = Math.round(c1[2] + (c2[2] - c1[2]) * f);
      return `rgb(${r}, ${g}, ${b})`;
    };

    const finalRevealFactor = progress >= 0.82 ? Math.min(1, (progress - 0.82) / 0.06) : 0;

    // Dynamic stacking height calculation so consensus mass rises prominently just below the raw MS spectrum
    const maxTokens = Math.max(animationData.totalTrueTokens, animationData.totalHalfTokens, animationData.totalDoubleTokens, 1);
    const availableStackHeight = Math.min(205, (lowerY1 - upperY1) * 0.67);
    const stackStep = Math.min(11.0, Math.max(2.2, (availableStackHeight - 10) / maxTokens));

    animationData.tokens.forEach((tok) => {
      if (progress < tok.spawnProg) return;

      const peakX = mzToX(tok.peak.mz);
      const startY = abundanceToY(tok.peak.abundance);

      let finalX = massToX(tok.mass);
      let stackOffset = 0;

      if (tok.category === 'true') {
        finalX = massToX(mass);
        stackOffset = tok.stackLevel * stackStep;
      } else if (tok.category === 'half_harmonic') {
        finalX = massToX(mass / 2);
        stackOffset = tok.stackLevel * stackStep;
      } else if (tok.category === 'double_harmonic') {
        finalX = massToX(mass * 2);
        stackOffset = tok.stackLevel * stackStep;
      } else {
        finalX += tok.scatterXOffset * 14;
      }

      const finalY = lowerY1 - (stackOffset > 0 ? stackOffset + 4 : 5 + Math.abs(tok.scatterXOffset) * 10);

      const dropDuration = 0.045;
      const dropProg = Math.min(1, Math.max(0, (progress - tok.dropProg) / dropDuration));

      const currX = peakX + (finalX - peakX) * Math.min(1, dropProg * 1.05);
      const currY = startY + (finalY - startY) * easeBounce(dropProg);

      // Trajectory Guide: ONLY during single step-by-step candidate trial testing (progress < 0.40)
      if (dropProg > 0 && dropProg < 1.0 && tok.peakIndex === 0 && progress < 0.40) {
        ctx.strokeStyle = `rgba(244, 63, 94, ${Math.max(0.2, (1 - dropProg) * 0.6)})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(peakX, startY);
        ctx.lineTo(currX, currY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      let tokenFill = '#f43f5e';
      if (finalRevealFactor > 0) {
        if (tok.category === 'true') {
          tokenFill = interpolateRgb(coralRGB, goldRGB, finalRevealFactor);
        } else if (tok.category === 'half_harmonic' || tok.category === 'double_harmonic') {
          tokenFill = interpolateRgb(coralRGB, blueRGB, finalRevealFactor);
        }
      }

      ctx.globalAlpha = tok.category === 'noise' ? 0.6 : 0.95;
      ctx.fillStyle = tokenFill;

      if (dropProg > 0 && dropProg < 1.0) {
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 10;
      } else if (finalRevealFactor > 0.2) {
        if (tok.category === 'true') {
          ctx.shadowColor = '#eab308';
          ctx.shadowBlur = 6 * finalRevealFactor;
        } else if (tok.category === 'half_harmonic' || tok.category === 'double_harmonic') {
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 5 * finalRevealFactor;
        }
      }

      ctx.beginPath();
      ctx.arc(currX, currY, tok.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Scene 4: Consensus Mass & Harmonic Callouts
    if (progress > 0.82) {
      const s4Alpha = Math.min(1, (progress - 0.82) / 0.08);
      ctx.globalAlpha = s4Alpha;

      // 1. True Mass Consensus
      const trueX = massToX(mass);
      const trueTopY = lowerY1 - (animationData.totalTrueTokens * stackStep + 10);
      const trueH = lowerY1 - trueTopY;

      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2;
      ctx.strokeRect(trueX - 14, trueTopY, 28, trueH);

      const pCardX = Math.min(width - 210, Math.max(padL, trueX - 95));
      const pCardY = Math.max(upperY1 + 38, trueTopY - 58);

      ctx.fillStyle = 'rgba(18, 20, 29, 0.98)';
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(pCardX, pCardY, 190, 52, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.font = '700 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Consensus True Mass', pCardX + 10, pCardY + 18);

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 15px ui-monospace, monospace';
      ctx.fillText(`${mass.toLocaleString()} Da`, pCardX + 10, pCardY + 38);

      // 2. 1/2 Harmonic
      const halfX = massToX(mass / 2);
      const halfTopY = lowerY1 - (animationData.totalHalfTokens * stackStep + 8);
      const halfH = lowerY1 - halfTopY;

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(halfX - 10, halfTopY, 20, halfH);

      const hCardX = Math.max(padL, halfX - 80);
      const hCardY = Math.max(upperY1 + 38, halfTopY - 44);
      ctx.fillStyle = 'rgba(18, 20, 29, 0.95)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(hCardX, hCardY, 160, 38, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#bae6fd';
      ctx.font = '600 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`1/2 Harmonic (${(mass / 2).toLocaleString()} Da)`, hCardX + 8, hCardY + 15);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px ui-monospace, monospace';
      ctx.fillText('Even charge state alias (z/2)', hCardX + 8, hCardY + 28);

      // 3. 2x Harmonic (if within axis domain)
      if (mass * 2 <= massAxisMax) {
        const doubleX = massToX(mass * 2);
        const doubleTopY = lowerY1 - (animationData.totalDoubleTokens * stackStep + 8);
        const doubleH = lowerY1 - doubleTopY;

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(doubleX - 10, doubleTopY, 20, doubleH);

        const dCardX = Math.min(width - 170, doubleX - 70);
        const dCardY = Math.max(upperY1 + 38, doubleTopY - 44);
        ctx.fillStyle = 'rgba(18, 20, 29, 0.95)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(dCardX, dCardY, 160, 38, 5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#bae6fd';
        ctx.font = '600 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`2× Harmonic (${(mass * 2).toLocaleString()} Da)`, dCardX + 8, dCardY + 15);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px ui-monospace, monospace';
        ctx.fillText('Double charge state alias (2z)', dCardX + 8, dCardY + 28);
      }
    }

    ctx.globalAlpha = 1.0;
  }, [progress, dimensions, mass, centerZ, sigmaZ, zMin, zMax, peaks, adductMass, animationData, hoveredPeak, selectedPeak, mzMinDomain, mzMaxDomain, massAxisMax]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const padL = 76;
    const padR = 40;
    const width = dimensions.width;

    const mzToX = (mz: number) => {
      const min = mzMinDomain;
      const max = mzMaxDomain;
      return padL + ((mz - min) / Math.max(1, max - min)) * (width - padL - padR);
    };

    if (mouseY < dimensions.height * 0.45) {
      const found = peaks.find((p) => Math.abs(mzToX(p.mz) - mouseX) < 14);
      setHoveredPeak(found || null);
    } else {
      setHoveredPeak(null);
    }
  };

  const handleClick = () => {
    if (hoveredPeak) {
      onSelectPeak(selectedPeak?.id === hoveredPeak.id ? null : hoveredPeak);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full rounded-xl bg-[#0f1015] border border-zinc-800 overflow-hidden shadow-xl">
      {/* Top Legend Overlay (No top-left banner, no percentage indicator) */}
      <div className="absolute top-2.5 right-3.5 flex items-center gap-2 pointer-events-none z-10">
        <div className="hidden sm:flex items-center gap-3 bg-zinc-900/90 backdrop-blur px-2.5 py-1 rounded-md border border-zinc-800 text-[11px] text-zinc-400">
          {progress >= 0.82 ? (
            <>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /><span className="text-zinc-200">Consensus Mass</span></span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-400" /><span className="text-zinc-200">Harmonics</span></span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /><span>Uncorrelated</span></span>
            </>
          ) : (
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /><span>Candidate Charge Hypotheses</span></span>
          )}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredPeak(null)}
        onClick={handleClick}
        style={{ width: dimensions.width, height: dimensions.height }}
        className="block cursor-crosshair"
      />
    </div>
  );
};
