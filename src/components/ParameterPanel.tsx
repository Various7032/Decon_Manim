import React from 'react';
import { MoleculePreset } from '../types';
import { MOLECULE_PRESETS } from '../utils/massSpec';
import { Sliders, RotateCcw } from 'lucide-react';

interface ParameterPanelProps {
  preset: MoleculePreset;
  onSelectPreset: (preset: MoleculePreset) => void;
  customMass: number;
  onChangeCustomMass: (mass: number) => void;
  zMin: number;
  zMax: number;
  onChangeZRange: (min: number, max: number) => void;
  centerZ: number;
  onChangeCenterZ: (center: number) => void;
  sigmaZ: number;
  onChangeSigmaZ: (sigma: number) => void;
  mzMin: number;
  mzMax: number;
  onChangeMzRange: (min: number, max: number) => void;
  onResetToDefault: () => void;
}

export const ParameterPanel: React.FC<ParameterPanelProps> = ({
  preset,
  onSelectPreset,
  customMass,
  onChangeCustomMass,
  zMin,
  zMax,
  onChangeZRange,
  centerZ,
  onChangeCenterZ,
  sigmaZ,
  onChangeSigmaZ,
  mzMin,
  mzMax,
  onChangeMzRange,
  onResetToDefault,
}) => {
  return (
    <div className="bg-[#121316] border border-zinc-800 rounded-xl p-4 flex flex-col gap-4 shadow-xl text-zinc-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Mass Spectrometry Simulation Parameters</h3>
            <p className="text-xs text-zinc-400">Select antibody standards or calibrate custom mass and charge envelope distribution</p>
          </div>
        </div>

        <button
          onClick={onResetToDefault}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Default</span>
        </button>
      </div>

      {/* Analytical Reference Presets */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-zinc-300">NIST Antibody Reference Standards:</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {MOLECULE_PRESETS.map((p) => {
            const isSel = preset.id === p.id && customMass === p.mass;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPreset(p)}
                className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  isSel
                    ? 'bg-sky-950/40 border-sky-500 text-sky-200 shadow-sm'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold truncate">{p.name}</span>
                  <span className="font-mono text-xs font-semibold text-amber-300">
                    {p.mass.toLocaleString()} Da
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  {p.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Parameters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-zinc-800">
        {/* Molecular Mass */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300 font-medium">Molecular Mass (M):</span>
            <span className="font-mono text-amber-300 font-bold">{customMass.toLocaleString()} Da</span>
          </div>
          <input
            type="range"
            min="5000"
            max="180000"
            step="1"
            value={customMass}
            onChange={(e) => onChangeCustomMass(parseFloat(e.target.value))}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
            <span>5 kDa</span>
            <span>23.1 kDa</span>
            <span>180 kDa</span>
          </div>
        </div>

        {/* Charge Envelope Bounds (zMin to zMax) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300 font-medium">Charge Envelope (z):</span>
            <span className="font-mono text-zinc-200 font-bold">+{zMin} to +{zMax}</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="2"
              max={zMax - 1}
              value={zMin}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 2;
                onChangeZRange(Math.min(val, zMax - 1), zMax);
              }}
              className="w-1/2 px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-center text-zinc-200 focus:outline-none focus:border-sky-500"
            />
            <span className="text-zinc-500 font-bold">→</span>
            <input
              type="number"
              min={zMin + 1}
              max="90"
              value={zMax}
              onChange={(e) => {
                const val = parseInt(e.target.value) || zMin + 1;
                onChangeZRange(zMin, Math.max(val, zMin + 1));
              }}
              className="w-1/2 px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-center text-zinc-200 focus:outline-none focus:border-sky-500"
            />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
            <span>z_min</span>
            <span>z_max</span>
          </div>
        </div>

        {/* Charge Distribution: Center (z_center) & Width (sigma_z) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300 font-medium">Envelope Distribution:</span>
            <span className="font-mono text-sky-300 text-xs">z₀ = +{centerZ}, σ = {sigmaZ.toFixed(1)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 mb-0.5">Center (z₀)</span>
              <input
                type="number"
                min="3"
                max="85"
                step="1"
                value={centerZ}
                onChange={(e) => onChangeCenterZ(parseInt(e.target.value) || 15)}
                className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-center text-zinc-200 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 mb-0.5">Width (σ_z)</span>
              <input
                type="number"
                min="0.5"
                max="15.0"
                step="0.1"
                value={sigmaZ}
                onChange={(e) => onChangeSigmaZ(parseFloat(e.target.value) || 2.5)}
                className="w-full px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-center text-zinc-200 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Observed Spectrum Range (mzMin to mzMax) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300 font-medium">Observed Spectrum Range:</span>
            <span className="font-mono text-sky-300 text-xs">{mzMin} – {mzMax} m/z</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="200"
              max={mzMax - 100}
              step="50"
              value={mzMin}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 500;
                onChangeMzRange(Math.min(val, mzMax - 100), mzMax);
              }}
              className="w-1/2 px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-center text-zinc-200 focus:outline-none focus:border-sky-500"
            />
            <span className="text-zinc-500 font-bold">→</span>
            <input
              type="number"
              min={mzMin + 100}
              max="15000"
              step="50"
              value={mzMax}
              onChange={(e) => {
                const val = parseInt(e.target.value) || mzMin + 100;
                onChangeMzRange(mzMin, Math.max(val, mzMin + 100));
              }}
              className="w-1/2 px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-center text-zinc-200 focus:outline-none focus:border-sky-500"
            />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
            <span>m/z_min</span>
            <span>m/z_max</span>
          </div>
        </div>
      </div>
    </div>
  );
};
