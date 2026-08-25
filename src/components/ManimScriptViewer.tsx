import React, { useState } from 'react';
import { Copy, Check, Download, Terminal, PlayCircle, FileCode, ExternalLink, Sparkles } from 'lucide-react';
import { MANIM_CODE } from '../data/manimCodeSource';

export const ManimScriptViewer: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'script' | 'cli' | 'architecture'>('script');

  const handleCopy = () => {
    navigator.clipboard.writeText(MANIM_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([MANIM_CODE], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = 'deconvolution_animation.py';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-xl p-5 flex flex-col gap-4 shadow-xl text-zinc-200">
      {/* Header with Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-100">Production Python Manim (v0.20+) Script</h3>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50 text-[10px] font-mono">
                Verified Self-Contained
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Complete Manim Community script for 2D Infographic scientific animation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700 transition-all shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Python Code'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-zinc-950 transition-all shadow-[0_0_12px_rgba(6,182,212,0.25)]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .py</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab('script')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'script'
              ? 'bg-zinc-800 text-cyan-300 border border-zinc-700'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          deconvolution_animation.py
        </button>
        <button
          onClick={() => setActiveTab('cli')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'cli'
              ? 'bg-zinc-800 text-cyan-300 border border-zinc-700'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          CLI Render Instructions
        </button>
        <button
          onClick={() => setActiveTab('architecture')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'architecture'
              ? 'bg-zinc-800 text-cyan-300 border border-zinc-700'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Math & Vector Architecture
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'script' && (
        <div className="relative rounded-lg bg-[#0d0e11] border border-zinc-800/80 p-4 font-mono text-xs text-zinc-300 overflow-x-auto max-h-[520px] leading-relaxed scrollbar-thin">
          <pre className="select-text whitespace-pre">
            <code>{MANIM_CODE}</code>
          </pre>
        </div>
      )}

      {activeTab === 'cli' && (
        <div className="flex flex-col gap-3 text-xs">
          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 flex flex-col gap-2">
            <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-cyan-400" />
              1. Prerequisites & Installation
            </span>
            <div className="bg-zinc-900 px-3 py-2 rounded font-mono text-cyan-300">
              pip install manim numpy
            </div>
            <p className="text-zinc-400 text-[11px]">
              Requires Python 3.9+ and FFmpeg (for video rendering). LaTeX / texlive is optional if using Text or MathTex.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 flex flex-col gap-2">
            <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
              <PlayCircle className="w-4 h-4 text-cyan-400" />
              2. Render Commands
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                <span className="text-[11px] text-zinc-400 font-semibold block mb-1">Fast Low Quality Preview (480p):</span>
                <code className="font-mono text-cyan-300 block bg-zinc-950 p-1.5 rounded">
                  manim -pql deconvolution_animation.py ESIDeconvolutionScene
                </code>
              </div>

              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                <span className="text-[11px] text-zinc-400 font-semibold block mb-1">Full HD 1080p 60fps (Recommended):</span>
                <code className="font-mono text-emerald-300 block bg-zinc-950 p-1.5 rounded">
                  manim -pqh deconvolution_animation.py ESIDeconvolutionScene
                </code>
              </div>

              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                <span className="text-[11px] text-zinc-400 font-semibold block mb-1">Ultra 4K 60fps Master:</span>
                <code className="font-mono text-amber-300 block bg-zinc-950 p-1.5 rounded">
                  manim -pqk deconvolution_animation.py ESIDeconvolutionScene
                </code>
              </div>

              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                <span className="text-[11px] text-zinc-400 font-semibold block mb-1">Transparent Alpha Video (.mov):</span>
                <code className="font-mono text-purple-300 block bg-zinc-950 p-1.5 rounded">
                  manim -pqh -t deconvolution_animation.py ESIDeconvolutionScene
                </code>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'architecture' && (
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-zinc-300">
          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 flex flex-col gap-2">
            <span className="font-bold text-cyan-300 text-sm">Exact Coordinate Vector Transformations:</span>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-400 pl-1">
              <li>
                <strong className="text-zinc-200">Raw m/z Axes:</strong> Uses Manim's native <code className="font-mono text-cyan-300">axes_mz.c2p(mz, abundance)</code> to pin peak line segments and centroid tops mathematically without hardcoded visual offsets.
              </li>
              <li>
                <strong className="text-zinc-200">Lower Mass Axis:</strong> Uses <code className="font-mono text-amber-300">axes_mass.c2p(calculated_mass, stack_level)</code> to ensure tokens drop precisely onto the continuous Da number line.
              </li>
              <li>
                <strong className="text-zinc-200">Stacking Physics:</strong> For matching trials ($z_{'{test}'} = z_{'{actual}'}$), the target y-coordinate is incremented sequentially (<code className="font-mono text-amber-300">stacked_count * 0.9</code>), creating a neat vertical column. For non-matching candidate trials, values are scattered with a deterministic low-height baseline offset.
              </li>
              <li>
                <strong className="text-zinc-200">Easing Curves:</strong> Applies <code className="font-mono text-cyan-300">rate_functions.ease_out_bounce</code> for single detailed tokens and <code className="font-mono text-cyan-300">LaggedStart</code> with <code className="font-mono text-cyan-300">ease_in_out_quad</code> for the accelerated mass convergence sweep.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
