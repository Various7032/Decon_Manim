import React from 'react';
import { Peak } from '../types';
import { calculateMassFromMz, calculateChargeFromAdjacent } from '../utils/massSpec';
import { CheckCircle2, Activity, Target } from 'lucide-react';

interface PeakInspectorProps {
  peaks: Peak[];
  selectedPeak: Peak | null;
  onSelectPeak: (peak: Peak | null) => void;
  mass: number;
  adductMass: number;
  zMin: number;
  zMax: number;
}

export const PeakInspector: React.FC<PeakInspectorProps> = ({
  peaks,
  selectedPeak,
  onSelectPeak,
  mass,
  adductMass,
  zMin,
  zMax,
}) => {
  const activePeak = selectedPeak || peaks[0];
  if (!activePeak) return null;

  // Dynamic candidate charge range test encompassing harmonics for any envelope
  const testZMin = Math.max(2, Math.min(zMin - 4, Math.floor(zMin / 2)));
  const testZMax = Math.min(120, Math.max(zMax + 6, activePeak.z * 2 + 2));
  const testRange: number[] = [];
  for (let z = testZMin; z <= testZMax; z++) {
    testRange.push(z);
  }

  // Calculate full hypothesis enumeration for the active peak
  const trials = testRange.map((zTest) => {
    const calcMass = calculateMassFromMz(activePeak.mz, zTest, adductMass);
    const isMatch = zTest === activePeak.z;
    const isHalfHarmonic = activePeak.z % 2 === 0 && zTest === activePeak.z / 2;
    const isDoubleHarmonic = zTest === activePeak.z * 2;
    const delta = calcMass - mass;

    return {
      zTest,
      calcMass,
      isMatch,
      isHalfHarmonic,
      isDoubleHarmonic,
      delta,
    };
  });

  // Adjacent peak calculation for analytical validation
  const currentIndex = peaks.findIndex((p) => p.id === activePeak.id);
  const nextPeak = currentIndex < peaks.length - 1 ? peaks[currentIndex + 1] : peaks[currentIndex - 1] || null;
  const p1 = nextPeak && nextPeak.mz > activePeak.mz ? nextPeak : activePeak;
  const p2 = nextPeak && nextPeak.mz > activePeak.mz ? activePeak : nextPeak;

  const adjacentDerivedZ = p1 && p2 && Math.abs(p1.mz - p2.mz) > 0.01
    ? calculateChargeFromAdjacent(p1.mz, p2.mz, adductMass)
    : null;

  return (
    <div className="bg-[#121316] border border-zinc-800 rounded-xl p-4 flex flex-col gap-4 shadow-xl text-zinc-200">
      {/* Inspector Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Charge-State Deconvolution Inspector</h3>
            <p className="text-xs text-zinc-400 font-mono">
              Observed Centroid: m/z {activePeak.mz.toFixed(2)} | Target Neutral Mass: {mass.toLocaleString()} Da
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">Inspected Peak:</span>
          <span className="px-2 py-0.5 rounded bg-zinc-800 text-sky-300 font-mono text-xs font-semibold border border-zinc-700">
            m/z {activePeak.mz.toFixed(2)} (+{activePeak.z})
          </span>
        </div>
      </div>

      {/* Centroid Selector Pill Bar */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-zinc-400 font-medium">Select centroid peak to inspect:</span>
        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
          {peaks.map((p) => {
            const isSel = p.id === activePeak.id;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPeak(p)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                  isSel
                    ? 'bg-sky-500 text-zinc-950 font-bold shadow-sm'
                    : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                m/z {p.mz.toFixed(1)} (+{p.z})
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Arithmetic Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
        <div className="p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-800 flex flex-col">
          <span className="text-zinc-400 text-[11px]">Observed Centroid (m/z)</span>
          <span className="text-sky-300 font-bold text-sm mt-0.5">{activePeak.mz.toFixed(4)}</span>
          <span className="text-[10px] text-zinc-500">Detector recorded value</span>
        </div>

        <div className="p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-800 flex flex-col">
          <span className="text-zinc-400 text-[11px]">Adduct Correction & Formula</span>
          <span className="text-zinc-200 font-bold text-sm mt-0.5">M = (m/z - {adductMass.toFixed(4)}) × z</span>
          <span className="text-[10px] text-zinc-500">Proton adduct = {adductMass.toFixed(4)} Da</span>
        </div>

        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex flex-col">
          <span className="text-amber-300 text-[11px]">True Consensus Mass</span>
          <span className="text-amber-300 font-bold text-sm mt-0.5">{mass.toLocaleString()} Da</span>
          <span className="text-[10px] text-amber-400/80">Calculated at z = +{activePeak.z}</span>
        </div>
      </div>

      {/* Candidate Charge Hypothesis Enumeration Table */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-300">
            Full Charge Hypothesis Enumeration: <span className="font-mono text-zinc-400">M = (m/z - {adductMass.toFixed(2)}) × z_test</span>
          </span>
          <div className="flex items-center gap-3 text-[11px] font-medium">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /><span className="text-zinc-300">True Match</span></span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-400" /><span className="text-zinc-300">Harmonic Alias</span></span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 text-xs">
          {trials.map((t) => {
            let cardClass = 'bg-zinc-950/60 border-zinc-800/80 text-zinc-300';
            if (t.isMatch) {
              cardClass = 'bg-amber-500/15 border-amber-500/60 text-amber-200 shadow-sm';
            } else if (t.isHalfHarmonic || t.isDoubleHarmonic) {
              cardClass = 'bg-sky-500/15 border-sky-500/50 text-sky-200 shadow-sm';
            }

            return (
              <div key={t.zTest} className={`p-2 rounded-lg border flex flex-col font-mono ${cardClass}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold">z = +{t.zTest}</span>
                  {t.isMatch ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  ) : t.isHalfHarmonic || t.isDoubleHarmonic ? (
                    <Activity className="w-3.5 h-3.5 text-sky-400" />
                  ) : null}
                </div>
                <span className="text-xs font-bold mt-1">
                  {t.calcMass.toLocaleString(undefined, { maximumFractionDigits: 0 })} Da
                </span>
                <span className="text-[9px] text-zinc-400 mt-0.5 truncate">
                  {t.isMatch
                    ? 'Target Match'
                    : t.isHalfHarmonic
                    ? '1/2 harmonic'
                    : t.isDoubleHarmonic
                    ? '2× harmonic'
                    : `Δ ${(t.delta > 0 ? '+' : '') + (t.delta / 1000).toFixed(1)}k`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Direct Algebraic Pair Deconvolution */}
      {p1 && p2 && adjacentDerivedZ !== null && (
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
          <div className="text-zinc-400">
            Adjacent Centroids: m₁ = {p1.mz.toFixed(2)}, m₂ = {p2.mz.toFixed(2)}
          </div>
          <div className="text-sky-300">
            Direct Formula: z = (m₁ - {adductMass.toFixed(2)}) / (m₁ - m₂) = <span className="font-bold text-white">+{adjacentDerivedZ}</span>
          </div>
        </div>
      )}
    </div>
  );
};
