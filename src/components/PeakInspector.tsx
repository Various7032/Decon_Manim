import React, { useState } from 'react';
import { Peak, MoleculePreset } from '../types';
import { calculateMassFromMz, calculateChargeFromAdjacent } from '../utils/massSpec';
import { Calculator, CheckCircle2, Sparkles, Layers, Activity } from 'lucide-react';

interface PeakInspectorProps {
  peaks: Peak[];
  selectedPeak: Peak | null;
  onSelectPeak: (peak: Peak | null) => void;
  preset: MoleculePreset;
  adductMass: number;
}

export const PeakInspector: React.FC<PeakInspectorProps> = ({
  peaks,
  selectedPeak,
  onSelectPeak,
  preset,
  adductMass,
}) => {
  const [testRange] = useState<number[]>([5, 6, 7, 8, 10, 12, 14, 16, 17, 18, 20, 22, 25, 28]);
  const [selectedAdjacent] = useState<{ p1: Peak | null; p2: Peak | null }>({
    p1: peaks[7] || null,
    p2: peaks[8] || null,
  });

  const activePeak = selectedPeak || peaks[7] || peaks[0];

  if (!activePeak) return null;

  // Calculate trials for active peak
  const trials = testRange.map((zTest) => {
    const calcMass = calculateMassFromMz(activePeak.mz, zTest, adductMass);
    const isMatch = zTest === activePeak.z;
    const isHalfHarmonic = Math.abs(calcMass - preset.mass / 2) < 250;
    const isDoubleHarmonic = Math.abs(calcMass - preset.mass * 2) < 500;
    const diff = Math.abs(calcMass - preset.mass);
    return {
      zTest,
      calcMass,
      isMatch,
      isHalfHarmonic,
      isDoubleHarmonic,
      diff,
    };
  });

  // Adjacent calculation demo
  const p1 = selectedAdjacent.p1;
  const p2 = selectedAdjacent.p2;
  const adjacentDerivedZ =
    p1 && p2 && p1.mz !== p2.mz
      ? calculateChargeFromAdjacent(Math.max(p1.mz, p2.mz), Math.min(p1.mz, p2.mz), adductMass)
      : null;

  return (
    <div className="bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-xl p-5 flex flex-col gap-4 shadow-xl text-zinc-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Charge-State Deconvolution Inspector</h3>
            <p className="text-xs text-zinc-400">Discovering unknown molecular mass through multi-charge state consensus</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-400">Inspecting Peak:</span>
          <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono text-xs font-semibold border border-cyan-800/60">
            m/z {activePeak.mz.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Peak selector pill list */}
      <div className="flex flex-col gap-1.5">
        <div className="text-[11px] text-zinc-400 font-medium">Select Peak to Inspect Arithmetic:</div>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
          {peaks.map((p) => {
            const isSel = p.id === activePeak.id;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPeak(p)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                  isSel
                    ? 'bg-cyan-500 text-zinc-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700/50'
                }`}
              >
                m/z {p.mz.toFixed(1)} (+{p.z})
              </button>
            );
          })}
        </div>
      </div>

      {/* Formula & Active Peak Calculation Card */}
      <div className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-3.5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-400 font-medium">Color-Coordinated Deconvolution Formula:</span>
          <span className="font-mono text-xs bg-zinc-900 px-3 py-1 rounded border border-zinc-700 flex items-center gap-1.5">
            <span className="text-rose-400 font-bold">Mass</span>
            <span className="text-zinc-500">=</span>
            <span className="text-zinc-400">(</span>
            <span className="text-cyan-400 font-bold">m/z</span>
            <span className="text-zinc-500">-</span>
            <span className="text-zinc-400">1.0078)</span>
            <span className="text-zinc-500">×</span>
            <span className="text-amber-400 font-bold">z_test</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
          <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 flex flex-col">
            <span className="text-[11px] text-cyan-400 font-semibold">1. Observed Centroid (m/z)</span>
            <span className="font-mono text-cyan-300 font-bold text-sm">{activePeak.mz.toFixed(2)} Da/e</span>
            <span className="text-[10px] text-zinc-500">Detector recorded value</span>
          </div>

          <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 flex flex-col">
            <span className="text-[11px] text-zinc-400 font-medium">2. Subtract Proton Adduct</span>
            <span className="font-mono text-zinc-200 font-bold text-sm">-{adductMass.toFixed(4)} Da</span>
            <span className="text-[10px] text-zinc-500">Core ion = {(activePeak.mz - adductMass).toFixed(2)}</span>
          </div>

          <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30 flex flex-col">
            <span className="text-[11px] text-amber-300 font-semibold">3. True Consensus Mass</span>
            <span className="font-mono text-amber-300 font-bold text-sm">{preset.mass.toFixed(1)} Da</span>
            <span className="text-[10px] text-amber-400/80">Coincides at z_test = {activePeak.z}</span>
          </div>
        </div>
      </div>

      {/* Trial Charge State Matrix Table */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Candidate Charge Hypothesis Trials (z_test):
          </span>
          <span className="text-[11px] text-zinc-400 flex items-center gap-2">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Gold: True Match</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-400" /> Blue: Harmonics</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-xs">
          {trials.map((t) => {
            const isMatch = t.isMatch;
            const isHarmonic = t.isHalfHarmonic || t.isDoubleHarmonic;

            let borderStyle = 'border-zinc-800/80 bg-zinc-950/50 hover:border-zinc-700';
            if (isMatch) {
              borderStyle = 'bg-amber-500/15 border-amber-500/60 shadow-[0_0_12px_rgba(234,179,8,0.2)]';
            } else if (isHarmonic) {
              borderStyle = 'bg-sky-500/15 border-sky-500/50 shadow-[0_0_10px_rgba(56,189,248,0.15)]';
            }

            return (
              <div key={t.zTest} className={`p-2 rounded-lg border flex flex-col transition-all ${borderStyle}`}>
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono font-bold ${
                      isMatch ? 'text-amber-300' : isHarmonic ? 'text-sky-300' : 'text-zinc-300'
                    }`}
                  >
                    z = {t.zTest}
                  </span>
                  {isMatch ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  ) : isHarmonic ? (
                    <Activity className="w-3 h-3 text-sky-400" />
                  ) : (
                    <span className="text-[9px] text-rose-400 font-mono">Noise</span>
                  )}
                </div>
                <span
                  className={`font-mono text-xs mt-1 ${
                    isMatch ? 'text-amber-200 font-bold' : isHarmonic ? 'text-sky-200 font-semibold' : 'text-zinc-400'
                  }`}
                >
                  {t.calcMass.toFixed(0)} Da
                </span>
                <span className="text-[9px] text-zinc-500 mt-0.5">
                  {isMatch
                    ? '★ 100% Target'
                    : t.isHalfHarmonic
                    ? '1/2 harmonic'
                    : t.isDoubleHarmonic
                    ? '2x harmonic'
                    : 'Noise'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Adjacent Peak Direct Algebraic Solver */}
      <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-3.5 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Adjacent-Peak Deterministic Formula (No Guessing):
          </span>
          <span className="font-mono text-[11px] text-cyan-300">
            z = (m₂ - 1.0078) / (m₁ - m₂)
          </span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          In experimental mass spectrometry, when two consecutive peaks of the same charge envelope are observed with m₁ &gt; m₂, the charge state of m₂ is solved directly by dividing the net m/z by the peak-to-peak spacing Δ(m/z).
        </p>

        {p1 && p2 && (
          <div className="flex items-center justify-between bg-zinc-900/80 px-3 py-2 rounded border border-zinc-800 text-xs font-mono">
            <span className="text-zinc-400">
              m₁ = {Math.max(p1.mz, p2.mz).toFixed(2)} Da, m₂ = {Math.min(p1.mz, p2.mz).toFixed(2)} Da
            </span>
            <span className="text-cyan-300 font-bold">
              Derived Charge: z = {adjacentDerivedZ} ({adjacentDerivedZ === Math.max(p1.z, p2.z) ? 'Verified' : ''})
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
