import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Peak, MoleculePreset } from '../types';
import { calculateMassFromMz } from '../utils/massSpec';
import { Sparkles, Info, CheckCircle2, Layers, AlertCircle } from 'lucide-react';

interface AnimationCanvasProps {
  progress: number; // 0.0 to 1.0
  preset: MoleculePreset;
  peaks: Peak[];
  adductMass: number;
  selectedPeak: Peak | null;
  onSelectPeak: (peak: Peak | null) => void;
  speed: number;
}

export const AnimationCanvas: React.FC<AnimationCanvasProps> = ({
  progress,
  preset,
  peaks,
  adductMass,
  selectedPeak,
  onSelectPeak,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 960, height: 580 });
  const [hoveredPeak, setHoveredPeak] = useState<Peak | null>(null);

  // Responsive container observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          const h = Math.min(680, Math.max(440, Math.round(w * 0.56)));
          setDimensions({ width: Math.round(w), height: h });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Precompute tokens for ALL peaks across ALL candidate charge states (z_test = 4 to 32)
  // This physically produces the true mass co-resonance at 24,000 Da AND the 1/2 harmonic (12,000 Da) and 2x harmonic (48,000 Da)!
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
      color: string;
      radius: number;
      stackLevel: number;
      label?: string;
      scatterXOffset: number;
    }> = [];

    let trueMassStack = 0;
    let halfHarmonicStack = 0;
    let doubleHarmonicStack = 0;

    const firstPeak = peaks[0];

    // Explicit First Peak Tokens: z=5, 6, 7 (Slowed pedagogical zoom sequence)
    if (firstPeak) {
      // z=5
      tokens.push({
        id: 'p0-z5',
        peakIndex: 0,
        peak: firstPeak,
        trialZ: 5,
        mass: calculateMassFromMz(firstPeak.mz, 5, adductMass),
        category: 'noise',
        spawnProg: 0.16,
        dropProg: 0.20,
        color: '#f43f5e',
        radius: 5.0,
        stackLevel: 0,
        label: 'z=5: 4.8k',
        scatterXOffset: 0,
      });

      // z=6
      tokens.push({
        id: 'p0-z6',
        peakIndex: 0,
        peak: firstPeak,
        trialZ: 6,
        mass: calculateMassFromMz(firstPeak.mz, 6, adductMass),
        category: 'noise',
        spawnProg: 0.24,
        dropProg: 0.28,
        color: '#f43f5e',
        radius: 5.0,
        stackLevel: 0,
        label: 'z=6: 5.76k',
        scatterXOffset: 0,
      });

      // z=7
      tokens.push({
        id: 'p0-z7',
        peakIndex: 0,
        peak: firstPeak,
        trialZ: 7,
        mass: calculateMassFromMz(firstPeak.mz, 7, adductMass),
        category: 'noise',
        spawnProg: 0.32,
        dropProg: 0.36,
        color: '#f43f5e',
        radius: 5.0,
        stackLevel: 0,
        label: 'z=7: 6.72k',
        scatterXOffset: 0,
      });

      // Remaining trial charges for Peak 0 (z=4..32) dropped during pan out (prog 0.40 to 0.52)
      for (let tz = 4; tz <= 32; tz++) {
        if (tz === 5 || tz === 6 || tz === 7) continue;

        const isTrue = tz === firstPeak.z;
        const isHalf = Math.abs(calculateMassFromMz(firstPeak.mz, tz, adductMass) - 12000) < 600;

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
        }

        tokens.push({
          id: `p0-z${tz}`,
          peakIndex: 0,
          peak: firstPeak,
          trialZ: tz,
          mass: calculateMassFromMz(firstPeak.mz, tz, adductMass),
          category: cat,
          spawnProg: 0.40,
          dropProg: 0.44,
          color: '#f43f5e',
          radius: isTrue ? 5.2 : isHalf ? 4.6 : 4.0,
          stackLevel: stack,
          scatterXOffset: (tz % 4 - 1.5) * 0.35,
        });
      }
    }

    // Subsequent peaks: ALL trial charges z_test in [4, 32] dropped across progress 0.52 to 0.82
    peaks.slice(1).forEach((peak, i) => {
      const pIdx = i + 1;
      const baseProg = 0.52 + (i / (peaks.length - 1)) * 0.30;

      for (let tz = 4; tz <= 32; tz++) {
        const mass = calculateMassFromMz(peak.mz, tz, adductMass);
        if (mass < 0 || mass > 75000) continue;

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
          mass,
          category: cat,
          spawnProg: baseProg,
          dropProg: baseProg + 0.02,
          color: '#f43f5e',
          radius: isTrue ? 5.2 : isHalf || isDouble ? 4.6 : 3.8,
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
  }, [peaks, adductMass]);

  // Main Canvas Render
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

    // Background Canvas
    ctx.fillStyle = '#121316';
    ctx.fillRect(0, 0, width, height);

    // Subtle Grid lines
    ctx.strokeStyle = '#1e2029';
    ctx.lineWidth = 1;
    for (let x = 40; x < width; x += 60) {
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

    // Geometry layout
    const padL = 70;
    const padR = 40;
    const upperY0 = height * 0.08;
    const upperY1 = height * 0.38; // m/z plot baseline
    const lowerY0 = height * 0.65;
    const lowerY1 = height * 0.88; // mass plot baseline

    const mzToX = (mz: number) => {
      const min = preset.mzMin;
      const max = preset.mzMax;
      return padL + ((mz - min) / (max - min)) * (width - padL - padR);
    };

    const abundanceToY = (ab: number) => {
      return upperY1 - ab * (upperY1 - upperY0);
    };

    const massToX = (mass: number) => {
      const min = 0;
      const max = preset.massAxisMax || 75000;
      return padL + ((mass - min) / (max - min)) * (width - padL - padR);
    };

    // ==============================================================
    // SCENE 1: Upper Spectrum (Observed m/z Detector Sticks)
    // ==============================================================
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padL - 10, upperY1);
    ctx.lineTo(width - padR + 10, upperY1);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(padL, upperY1 + 10);
    ctx.lineTo(padL, upperY0 - 10);
    ctx.stroke();

    // Ticks & Labels for m/z Axis
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';

    const mzStep = (preset.mzMax - preset.mzMin) / 6;
    for (let m = preset.mzMin; m <= preset.mzMax; m += mzStep) {
      const x = mzToX(m);
      ctx.beginPath();
      ctx.moveTo(x, upperY1);
      ctx.lineTo(x, upperY1 + 5);
      ctx.stroke();
      ctx.fillText(Math.round(m).toString(), x, upperY1 + 18);
    }

    ctx.fillStyle = '#67e8f9';
    ctx.font = '700 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Observed Detector Data: m/z (Th)', width - padR, upperY1 + 32);

    // Y Axis Label
    ctx.save();
    ctx.translate(padL - 36, (upperY0 + upperY1) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Relative Abundance (%)', 0, 0);
    ctx.restore();

    // Gaussian Envelope outline
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    let started = false;
    for (let m = preset.mzMin; m <= preset.mzMax; m += 10) {
      const zCont = preset.mass / Math.max(m - adductMass, 1.0);
      const ab = Math.exp(-Math.pow(zCont - preset.centerZ, 2) / (2 * Math.pow(preset.sigmaZ, 2)));
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

    // Draw Centroid Sticks (Labeled with observed m/z values)
    peaks.forEach((p) => {
      const x = mzToX(p.mz);
      const topY = abundanceToY(p.abundance);
      const baseY = upperY1;
      const isHovered = hoveredPeak?.id === p.id || selectedPeak?.id === p.id;

      if (isHovered) {
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 12;
      }

      ctx.strokeStyle = isHovered ? '#67e8f9' : '#06b6d4';
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(x, baseY);
      ctx.lineTo(x, topY);
      ctx.stroke();

      ctx.fillStyle = isHovered ? '#ffffff' : '#67e8f9';
      ctx.beginPath();
      ctx.arc(x, topY, isHovered ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = isHovered ? '#ffffff' : '#67e8f9';
      ctx.font = '600 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${p.mz.toFixed(1)}`, x, topY - 7);
    });

    // ==============================================================
    // LOWER AXES: Reconstructed Molecular Mass Search Space (0 - 75,000 Da)
    // (NO predetermined 24,000 Da target marker - mass is UNKNOWN!)
    // ==============================================================
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padL - 10, lowerY1);
    ctx.lineTo(width - padR + 10, lowerY1);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';

    const massStep = 10000;
    for (let m = 0; m <= 75000; m += massStep) {
      const x = massToX(m);
      ctx.beginPath();
      ctx.moveTo(x, lowerY1);
      ctx.lineTo(x, lowerY1 + 5);
      ctx.stroke();
      const labelK = m > 0 ? `${m / 1000}k` : '0';
      ctx.fillText(labelK, x, lowerY1 + 18);
    }

    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Reconstructed Molecular Mass (Da) [Search Space]', width - padR, lowerY1 + 32);

    // ==============================================================
    // SCENE 2: ZOOM ON PEAK #1 & PROMINENT COLOR-COORDINATED MATH
    // (Progress 0.14 to 0.52)
    // ==============================================================
    const firstPeak = peaks[0];
    if (firstPeak && progress >= 0.14 && progress < 0.52) {
      const p1X = mzToX(firstPeak.mz);
      const p1Y = abundanceToY(firstPeak.abundance);

      // Focus Spotlight on Peak 1
      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(p1X, p1Y, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Prominent Inspection Card
      const cardW = Math.min(width - 32, 600);
      const cardH = 112;
      const cardX = width / 2 - cardW / 2;
      const cardY = (upperY1 + lowerY0) / 2 - cardH / 2 - 8;

      ctx.fillStyle = 'rgba(24, 25, 31, 0.98)';
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(6, 182, 212, 0.25)';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 10);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Card Header
      ctx.fillStyle = '#67e8f9';
      ctx.font = '800 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`🔍 ZOOM INSPECTION: Observed Peak at m/z = ${firstPeak.mz.toFixed(2)}`, cardX + 20, cardY + 26);

      // Render Dynamic Phase with High-Contrast Color Coordination
      ctx.textAlign = 'left';

      if (progress < 0.16) {
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('Because charge z is unknown, we test candidate hypotheses z_test ∈ [4, 32]:', cardX + 20, cardY + 54);

        // General formula
        ctx.font = '700 14px ui-monospace, SFMono-Regular, monospace';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText('Mass = (', cardX + 20, cardY + 84);
        ctx.fillStyle = '#06b6d4';
        ctx.fillText('961.01', cardX + 88, cardY + 84);
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(' - 1.01) × ', cardX + 144, cardY + 84);
        ctx.fillStyle = '#facc15';
        ctx.fillText('z_test', cardX + 236, cardY + 84);
        ctx.fillStyle = '#f43f5e';
        ctx.fillText(' → Trial Mass', cardX + 290, cardY + 84);
      } else if (progress >= 0.16 && progress < 0.24) {
        // Step 1: z = 5
        ctx.fillStyle = '#fda4af';
        ctx.font = '800 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('Hypothesis 1: Assume charge state z_test = 5', cardX + 20, cardY + 54);

        // Color-coordinated equation: (961.01 - 1.01) * 5 = 4,800 Da
        ctx.font = '800 16px ui-monospace, SFMono-Regular, monospace';
        let tx = cardX + 20;
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText('(', tx, cardY + 88);
        tx += 10;
        ctx.fillStyle = '#06b6d4';
        ctx.fillText('961.01', tx, cardY + 88);
        tx += 66;
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(' - 1.01) × ', tx, cardY + 88);
        tx += 90;
        ctx.fillStyle = '#facc15';
        ctx.fillText('5', tx, cardY + 88);
        tx += 16;
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(' = ', tx, cardY + 88);
        tx += 22;
        ctx.fillStyle = '#f43f5e';
        ctx.fillText('4,800 Da', tx, cardY + 88);
        tx += 88;
        ctx.fillStyle = '#fda4af';
        ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('→ Drops coral trial ball to 4,800 Da', tx, cardY + 86);
      } else if (progress >= 0.24 && progress < 0.32) {
        // Step 2: z = 6
        ctx.fillStyle = '#fda4af';
        ctx.font = '800 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('Hypothesis 2: Assume charge state z_test = 6', cardX + 20, cardY + 54);

        ctx.font = '800 16px ui-monospace, SFMono-Regular, monospace';
        let tx = cardX + 20;
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText('(', tx, cardY + 88);
        tx += 10;
        ctx.fillStyle = '#06b6d4';
        ctx.fillText('961.01', tx, cardY + 88);
        tx += 66;
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(' - 1.01) × ', tx, cardY + 88);
        tx += 90;
        ctx.fillStyle = '#facc15';
        ctx.fillText('6', tx, cardY + 88);
        tx += 16;
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(' = ', tx, cardY + 88);
        tx += 22;
        ctx.fillStyle = '#f43f5e';
        ctx.fillText('5,760 Da', tx, cardY + 88);
        tx += 88;
        ctx.fillStyle = '#fda4af';
        ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('→ Drops coral trial ball to 5,760 Da', tx, cardY + 86);
      } else if (progress >= 0.32 && progress < 0.40) {
        // Step 3: z = 7
        ctx.fillStyle = '#fda4af';
        ctx.font = '800 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('Hypothesis 3: Assume charge state z_test = 7', cardX + 20, cardY + 54);

        ctx.font = '800 16px ui-monospace, SFMono-Regular, monospace';
        let tx = cardX + 20;
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText('(', tx, cardY + 88);
        tx += 10;
        ctx.fillStyle = '#06b6d4';
        ctx.fillText('961.01', tx, cardY + 88);
        tx += 66;
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(' - 1.01) × ', tx, cardY + 88);
        tx += 90;
        ctx.fillStyle = '#facc15';
        ctx.fillText('7', tx, cardY + 88);
        tx += 16;
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(' = ', tx, cardY + 88);
        tx += 22;
        ctx.fillStyle = '#f43f5e';
        ctx.fillText('6,720 Da', tx, cardY + 88);
        tx += 88;
        ctx.fillStyle = '#fda4af';
        ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('→ Drops coral trial ball to 6,720 Da', tx, cardY + 86);
      } else {
        // Step 4: Pan out to evaluate candidate array z ∈ [4, 32]
        ctx.fillStyle = '#67e8f9';
        ctx.font = '800 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('PAN OUT: Evaluating full candidate range z_test ∈ [4, 32]', cardX + 20, cardY + 54);

        ctx.font = '700 14px ui-monospace, SFMono-Regular, monospace';
        let tx = cardX + 20;
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText('(961.01 - 1.01) × ', tx, cardY + 88);
        tx += 134;
        ctx.fillStyle = '#facc15';
        ctx.fillText('z_test', tx, cardY + 88);
        tx += 48;
        ctx.fillStyle = '#f43f5e';
        ctx.fillText(' → Drops coral trial spheres for every candidate charge', tx, cardY + 88);
      }
    }

    // ==============================================================
    // SCENE 3: SUBSEQUENT PEAKS BANNER (Progress 0.52 to 0.82)
    // ==============================================================
    if (progress >= 0.52 && progress < 0.82) {
      const activeIdx = Math.min(
        peaks.length - 1,
        Math.max(1, Math.floor(((progress - 0.52) / 0.30) * (peaks.length - 1)) + 1)
      );
      const activePeak = peaks[activeIdx];

      if (activePeak) {
        const pX = mzToX(activePeak.mz);
        const pY = abundanceToY(activePeak.abundance);

        ctx.strokeStyle = '#67e8f9';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pX, pY, 9, 0, Math.PI * 2);
        ctx.stroke();

        const bannerW = Math.min(width - 32, 540);
        const bannerH = 46;
        const bannerX = width / 2 - bannerW / 2;
        const bannerY = (upperY1 + lowerY0) / 2 - bannerH / 2;

        ctx.fillStyle = 'rgba(24, 25, 31, 0.96)';
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          `Deconvolving Peak m/z ${activePeak.mz.toFixed(1)}: Testing all candidate charge states z_test ∈ [4, 32]`,
          width / 2,
          bannerY + 28
        );
      }
    }

    // ==============================================================
    // TOKENS DROPPING, TRAJECTORY LINES & STACKING
    // (All tokens are Coral until Scene 4 where True Mass becomes Gold and Harmonics Blue)
    // ==============================================================
    const easeBounce = (t: number) => {
      const n1 = 7.5625;
      const d1 = 2.75;
      if (t < 1 / d1) return n1 * t * t;
      else if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
      else if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
      else return n1 * (t -= 2.625 / d1) * t + 0.984375;
    };

    // Color interpolation helper
    const interpolateRgb = (c1: [number, number, number], c2: [number, number, number], f: number) => {
      const r = Math.round(c1[0] + (c2[0] - c1[0]) * f);
      const g = Math.round(c1[1] + (c2[1] - c1[1]) * f);
      const b = Math.round(c1[2] + (c2[2] - c1[2]) * f);
      return `rgb(${r}, ${g}, ${b})`;
    };

    const coralRGB: [number, number, number] = [244, 63, 94];     // #f43f5e
    const goldRGB: [number, number, number] = [234, 179, 8];      // #eab308
    const blueRGB: [number, number, number] = [56, 189, 248];     // #38bdf8 (Sky Blue)

    const finalRevealFactor = progress >= 0.82 ? Math.min(1, (progress - 0.82) / 0.06) : 0;

    animationData.tokens.forEach((tok) => {
      if (progress < tok.spawnProg) return;

      const peakX = mzToX(tok.peak.mz);
      // Start directly from the apex of the peak stick in the upper spectrum
      const startY = abundanceToY(tok.peak.abundance);

      let finalX = massToX(tok.mass);
      let stackOffset = 0;

      if (tok.category === 'true') {
        finalX = massToX(preset.mass);
        stackOffset = tok.stackLevel * 8.5;
      } else if (tok.category === 'half_harmonic') {
        finalX = massToX(preset.mass / 2);
        stackOffset = tok.stackLevel * 8.5;
      } else if (tok.category === 'double_harmonic') {
        finalX = massToX(preset.mass * 2);
        stackOffset = tok.stackLevel * 8.5;
      } else {
        finalX += tok.scatterXOffset * 16;
      }

      const finalY = lowerY1 - (stackOffset > 0 ? stackOffset + 4 : 6 + Math.abs(tok.scatterXOffset) * 12);

      const dropDuration = 0.045;
      const dropProg = Math.min(1, Math.max(0, (progress - tok.dropProg) / dropDuration));

      const currX = peakX + (finalX - peakX) * Math.min(1, dropProg * 1.05);
      const currY = startY + (finalY - startY) * easeBounce(dropProg);

      // Trajectory Guideline for early verbose drops
      if (dropProg > 0 && dropProg < 1.0 && tok.peakIndex === 0 && (tok.trialZ === 5 || tok.trialZ === 6 || tok.trialZ === 7)) {
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(peakX, startY);
        ctx.lineTo(finalX, finalY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Compute dynamic color: All coral initially; in Scene 4, True Mass -> Gold, Harmonics -> Sky Blue
      let tokenFill = '#f43f5e';
      if (finalRevealFactor > 0) {
        if (tok.category === 'true') {
          tokenFill = interpolateRgb(coralRGB, goldRGB, finalRevealFactor);
        } else if (tok.category === 'half_harmonic' || tok.category === 'double_harmonic') {
          tokenFill = interpolateRgb(coralRGB, blueRGB, finalRevealFactor);
        }
      }

      // Draw Token
      ctx.globalAlpha = tok.category === 'noise' ? 0.65 : 0.95;
      ctx.fillStyle = tokenFill;

      if (finalRevealFactor > 0.2) {
        if (tok.category === 'true') {
          ctx.shadowColor = '#eab308';
          ctx.shadowBlur = 8 * finalRevealFactor;
        } else if (tok.category === 'half_harmonic' || tok.category === 'double_harmonic') {
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 7 * finalRevealFactor;
        }
      }

      ctx.beginPath();
      ctx.arc(currX, currY, tok.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Small label for explicit early drops
      if (tok.label && dropProg > 0.8 && progress < 0.40) {
        ctx.fillStyle = '#fda4af';
        ctx.font = '700 11px ui-monospace, SFMono-Regular, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(tok.label, currX, currY - 8);
      }
    });

    // ==============================================================
    // SCENE 4: FINAL CONVERGENCE & EDUCATIONAL HARMONIC CALLOUTS
    // (Progress > 0.82 - True Mass in Gold, Harmonics in Blue)
    // ==============================================================
    if (progress > 0.82) {
      const s4Alpha = Math.min(1, (progress - 0.82) / 0.08);
      ctx.globalAlpha = s4Alpha;

      // 1. Primary Consensus Peak (24,000 Da)
      const trueX = massToX(preset.mass);
      const trueTopY = lowerY1 - (animationData.totalTrueTokens * 8.5 + 14);
      const trueH = lowerY1 - trueTopY;

      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 14;
      ctx.strokeRect(trueX - 16, trueTopY, 32, trueH);
      ctx.shadowBlur = 0;

      // Primary Peak Callout Card
      const pCardX = Math.min(width - 240, Math.max(padL, trueX - 110));
      const pCardY = Math.max(upperY1 + 10, trueTopY - 76);

      ctx.fillStyle = 'rgba(24, 25, 31, 0.98)';
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(pCardX, pCardY, 220, 68, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.font = '800 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('DISCOVERED TRUE MASS (100%)', pCardX + 12, pCardY + 18);

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 16px ui-monospace, SFMono-Regular, monospace';
      ctx.fillText(`${preset.mass.toFixed(1)} Da`, pCardX + 12, pCardY + 40);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('All 16 peaks reinforce at this exact mass', pCardX + 12, pCardY + 58);

      // 2. 1/2 Sub-Harmonic Callout (12,000 Da) - In Blue
      const halfX = massToX(preset.mass / 2);
      const halfTopY = lowerY1 - (animationData.totalHalfTokens * 8.5 + 10);
      const halfH = lowerY1 - halfTopY;

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(halfX - 12, halfTopY, 24, halfH);

      const hCardX = Math.max(padL, halfX - 100);
      const hCardY = halfTopY - 54;
      ctx.fillStyle = 'rgba(24, 25, 31, 0.95)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(hCardX, hCardY, 180, 48, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#bae6fd';
      ctx.font = '700 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('1/2 Sub-Harmonic (12,000 Da)', hCardX + 10, hCardY + 16);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('~50% Height (even charges z/2 alias)', hCardX + 10, hCardY + 34);

      // 3. 2x Harmonic Callout (48,000 Da) - In Blue
      if (preset.mass * 2 <= (preset.massAxisMax || 75000)) {
        const doubleX = massToX(preset.mass * 2);
        const doubleTopY = lowerY1 - (animationData.totalDoubleTokens * 8.5 + 10);
        const doubleH = lowerY1 - doubleTopY;

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(doubleX - 12, doubleTopY, 24, doubleH);

        const dCardX = Math.min(width - 190, doubleX - 80);
        const dCardY = doubleTopY - 54;
        ctx.fillStyle = 'rgba(24, 25, 31, 0.95)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(dCardX, dCardY, 170, 48, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#bae6fd';
        ctx.font = '700 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('2x Harmonic (48,000 Da)', dCardX + 10, dCardY + 16);
        ctx.fillStyle = '#38bdf8';
        ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('~50% Height (double charges 2z alias)', dCardX + 10, dCardY + 34);
      }
    }

    ctx.globalAlpha = 1.0;
  }, [progress, dimensions, preset, peaks, adductMass, animationData, hoveredPeak, selectedPeak]);

  // Mouse Interactivity
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const padL = 70;
    const padR = 40;
    const width = dimensions.width;

    const mzToX = (mz: number) => {
      const min = preset.mzMin;
      const max = preset.mzMax;
      return padL + ((mz - min) / (max - min)) * (width - padL - padR);
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
    <div ref={containerRef} className="relative w-full rounded-xl bg-[#121316] border border-zinc-800/80 overflow-hidden shadow-2xl">
      {/* Top Banner with Pedagogical Status */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2 bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-700/60 shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-medium text-zinc-300">
            {progress < 0.14 && 'Scene 1: Observed ESI-MS Spectrum (Unknown Mass Analyte)'}
            {progress >= 0.14 && progress < 0.18 && 'Scene 2A: Zoom in on Peak #1 (m/z = 961.01)'}
            {progress >= 0.18 && progress < 0.40 && 'Scene 2B-D: Trial Arithmetic for Charges z=5, 6, 7'}
            {progress >= 0.40 && progress < 0.52 && 'Scene 2E: Pan Out & Full Candidate Evaluation (z=4..32)'}
            {progress >= 0.52 && progress < 0.82 && 'Scene 3: All Charge States Dropped (Pillars Accumulate)'}
            {progress >= 0.82 && 'Scene 4: Resolved True Mass (Gold) & Harmonics (Blue)'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Legend Pill */}
          <div className="hidden lg:flex items-center gap-3 bg-zinc-900/90 backdrop-blur-md px-3 py-1 rounded-lg border border-zinc-700/60 text-[11px] text-zinc-300">
            {progress < 0.82 ? (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Coral = Candidate Charge Trials (z_test ∈ [4..32])</span>
              </span>
            ) : (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Coral = Noise</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <span>Blue = Harmonics (12k / 48k)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Gold = True Mass (24,000 Da)</span>
                </span>
              </>
            )}
          </div>

          <div className="bg-zinc-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-zinc-700/60 text-[11px] font-mono text-zinc-400">
            {(progress * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredPeak(null)}
        onClick={handleClick}
        style={{ width: dimensions.width, height: dimensions.height }}
        className="block cursor-crosshair transition-all"
      />

      {/* Bottom Educational Hint */}
      <div className="absolute bottom-2 left-4 right-4 flex items-center justify-between text-[11px] text-zinc-400 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>Every charge hypothesis is evaluated: Mass = (m/z - 1.01) × z_test. Even charges create 1/2 harmonics at 12,000 Da!</span>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-zinc-500">
          <span>Click any centroid stick to inspect exact arithmetic</span>
        </div>
      </div>
    </div>
  );
};
