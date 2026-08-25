import React from 'react';
import { BookOpen, Atom, Zap, CheckCircle2, Activity } from 'lucide-react';

export const TheorySection: React.FC = () => {
  return (
    <div className="bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-xl p-6 flex flex-col gap-6 shadow-xl text-zinc-200">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-4">
        <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-zinc-100">
            Theory & Mathematics of ESI Charge-State Deconvolution
          </h2>
          <p className="text-xs text-zinc-400">
            Solving unknown molecular masses, constructive interference, and harmonic alias structures
          </p>
        </div>
      </div>

      {/* 4 Core Educational Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: ESI Multiple Charging */}
        <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
            <Zap className="w-4 h-4" />
            <span>1. ESI Multiple Charging</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            In Electrospray Ionization (ESI), intact macromolecules accept multiple protons ($H^+$). A single species of unknown mass $M$ produces an envelope of ion peaks:
          </p>
          <div className="bg-zinc-900/90 p-2.5 rounded font-mono text-[11px] text-cyan-300 text-center border border-zinc-800">
            [M + zH]ᶻ⁺ with z = 10, 11, ... 25
          </div>
          <p className="text-[11px] text-zinc-400">
            Compresses heavy species (&gt;100 kDa) into standard mass analyzer ranges (800 - 3000 m/z).
          </p>
        </div>

        {/* Card 2: The Deconvolution Challenge */}
        <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
            <Atom className="w-4 h-4" />
            <span>2. The Unknown Mass Problem</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            The detector measures only m/z. To reconstruct the uncharged neutral mass M, we test trial candidate charge states z_test:
          </p>
          <div className="bg-zinc-900/90 p-2.5 rounded font-mono text-[11px] text-rose-300 text-center border border-zinc-800">
            Trial Mass = (m/z - 1.0078) × z_test
          </div>
          <p className="text-[11px] text-zinc-400">
            Since $z$ is unknown for an isolated peak, incorrect trials yield non-matching candidate masses.
          </p>
        </div>

        {/* Card 3: Constructive Interference */}
        <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>3. 100% True Mass Consensus</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            When all observed peaks in the envelope are evaluated across candidate charge states:
          </p>
          <div className="bg-zinc-900/90 p-2.5 rounded font-mono text-[11px] text-amber-300 text-center border border-zinc-800">
            True Mass (24,000 Da) = 100% Co-Resonance
          </div>
          <p className="text-[11px] text-zinc-400">
            All 16 observed peaks reinforce constructively at the exact molecular mass.
          </p>
        </div>

        {/* Card 4: Harmonic Aliasing (1/2 and 2x) */}
        <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs">
            <Activity className="w-4 h-4" />
            <span>4. Harmonic Aliases (1/2 & 2×)</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            When testing all charge states without regularized priors, systematic harmonic sub-peaks arise:
          </p>
          <div className="bg-zinc-900/90 p-2 rounded font-mono text-[10px] text-sky-300 text-center border border-zinc-800">
            1/2 Harmonic: 12k Da (even z/2)<br />
            2× Harmonic: 48k Da (double 2z)
          </div>
          <p className="text-[11px] text-zinc-400">
            These produce secondary peaks at ~50% height, a classic signature in unregularized deconvolution algorithms.
          </p>
        </div>
      </div>

      {/* Step-by-Step Algebraic Derivation */}
      <div className="p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 flex flex-col gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
          Algebraic Solution for Adjacent Observed Peaks
        </h3>
        <p className="text-xs text-zinc-300 leading-relaxed">
          Suppose two adjacent peaks in the mass spectrum are recorded at $m_1$ and $m_2$, where $m_1 &gt; m_2$. If $m_1$ corresponds to charge state $z$, then $m_2$ corresponds to $z + 1$:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 rounded bg-zinc-900 border border-zinc-800">
            <span className="text-zinc-400 block mb-1">Peak 1 (Lower charge z):</span>
            <span className="text-cyan-300 font-semibold">m₁ = (M + z · m_H) / z</span>
            <span className="text-zinc-500 block mt-1">⇒ M = z · m₁ - z · m_H</span>
          </div>

          <div className="p-3 rounded bg-zinc-900 border border-zinc-800">
            <span className="text-zinc-400 block mb-1">Peak 2 (Higher charge z + 1):</span>
            <span className="text-cyan-300 font-semibold">m₂ = [M + (z + 1) · m_H] / (z + 1)</span>
            <span className="text-zinc-500 block mt-1">⇒ M = (z + 1) · m₂ - (z + 1) · m_H</span>
          </div>
        </div>

        <div className="p-3 rounded bg-zinc-900 border border-cyan-900/50 flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-300 font-semibold">Equating both expressions for M:</span>
          <span className="text-amber-300 font-bold text-sm bg-zinc-950 px-3 py-1 rounded border border-amber-500/40">
            z = (m₂ - 1.0078) / (m₁ - m₂)
          </span>
        </div>
      </div>
    </div>
  );
};
