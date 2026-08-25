import React from 'react';
import { MoleculePreset } from '../types';
import { MOLECULE_PRESETS, PROTON_MASS, SODIUM_MASS } from '../utils/massSpec';
import { Sliders, Dna, Atom, RefreshCw } from 'lucide-react';

interface DeconvolutionLabProps {
  preset: MoleculePreset;
  onSelectPreset: (preset: MoleculePreset) => void;
  customMass: number;
  onChangeCustomMass: (mass: number) => void;
  adductMass: number;
  onChangeAdductMass: (mass: number) => void;
  zMin: number;
  zMax: number;
  onChangeZRange: (min: number, max: number) => void;
  onResetToPromptTarget: () => void;
}

export const DeconvolutionLab: React.FC<DeconvolutionLabProps> = ({
  preset,
  onSelectPreset,
  customMass,
  onChangeCustomMass,
  adductMass,
  onChangeAdductMass,
  zMin,
  zMax,
  onChangeZRange,
  onResetToPromptTarget,
}) => {
  return (
    <div className="bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-xl p-5 flex flex-col gap-4 shadow-xl text-zinc-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Mass Spectrometry Parameters</h3>
            <p className="text-xs text-zinc-400">Configure target molecule, adduct chemistry, and charge limits</p>
          </div>
        </div>

        <button
          onClick={onResetToPromptTarget}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-cyan-300 border border-zinc-700 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Prompt Preset (24k Light Chain)</span>
        </button>
      </div>

      {/* Preset Selector Buttons */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-zinc-300">Biomolecule Presets:</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {MOLECULE_PRESETS.map((p) => {
            const isSel = preset.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPreset(p)}
                className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  isSel
                    ? 'bg-cyan-950/40 border-cyan-500/80 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                    : 'bg-zinc-950/50 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isSel ? 'text-cyan-300' : 'text-zinc-200'}`}>
                    {p.name}
                  </span>
                  <span className="font-mono text-[11px] text-amber-300 font-semibold">
                    {p.mass.toLocaleString()} Da
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                  {p.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-zinc-800/80">
        {/* Target Mass Slider / Input */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300 font-medium">True Molecular Mass:</span>
            <span className="font-mono text-amber-300 font-bold">{customMass.toLocaleString()} Da</span>
          </div>
          <input
            type="range"
            min="5000"
            max="160000"
            step="500"
            value={customMass}
            onChange={(e) => onChangeCustomMass(parseFloat(e.target.value))}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
            <span>5,000 Da</span>
            <span>24,000 Da</span>
            <span>160,000 Da</span>
          </div>
        </div>

        {/* Adduct Species */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300 font-medium">Ionization Adduct:</span>
            <span className="font-mono text-cyan-300 text-[11px]">+{adductMass.toFixed(4)} Da</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onChangeAdductMass(PROTON_MASS)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border text-center transition-all ${
                Math.abs(adductMass - PROTON_MASS) < 0.01
                  ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              [M+zH]ᶻ⁺ Proton (1.0078)
            </button>

            <button
              onClick={() => onChangeAdductMass(SODIUM_MASS)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border text-center transition-all ${
                Math.abs(adductMass - SODIUM_MASS) < 0.01
                  ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              [M+zNa]ᶻ⁺ Sodium (22.989)
            </button>
          </div>
        </div>

        {/* Charge Envelope Limits */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300 font-medium">Charge Range (z):</span>
            <span className="font-mono text-zinc-200 font-bold">+{zMin} to +{zMax}</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="3"
              max={zMax - 1}
              value={zMin}
              onChange={(e) => onChangeZRange(parseInt(e.target.value) || 5, zMax)}
              className="w-1/2 px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-center text-zinc-200 focus:outline-none focus:border-cyan-500"
            />
            <span className="text-zinc-500 font-bold">→</span>
            <input
              type="number"
              min={zMin + 1}
              max="70"
              value={zMax}
              onChange={(e) => onChangeZRange(zMin, parseInt(e.target.value) || 30)}
              className="w-1/2 px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-center text-zinc-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
