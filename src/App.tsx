/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MoleculePreset, Peak, SceneId } from './types';
import { MOLECULE_PRESETS, PROTON_MASS, generatePeaksForPreset } from './utils/massSpec';
import { AnimationCanvas } from './components/AnimationCanvas';
import { PlaybackControls } from './components/PlaybackControls';
import { PeakInspector } from './components/PeakInspector';
import { DeconvolutionLab } from './components/DeconvolutionLab';
import { ManimScriptViewer } from './components/ManimScriptViewer';
import { TheorySection } from './components/TheorySection';
import { 
  Play, 
  Pause, 
  Code2, 
  FlaskConical, 
  BookOpen, 
  Sparkles, 
  Download, 
  RotateCcw,
  Activity,
  Layers
} from 'lucide-react';

export default function App() {
  // Molecule Configuration State
  const [activePreset, setActivePreset] = useState<MoleculePreset>(MOLECULE_PRESETS[0]);
  const [customMass, setCustomMass] = useState<number>(MOLECULE_PRESETS[0].mass);
  const [adductMass, setAdductMass] = useState<number>(PROTON_MASS);
  const [zMin, setZMin] = useState<number>(MOLECULE_PRESETS[0].defaultZMin);
  const [zMax, setZMax] = useState<number>(MOLECULE_PRESETS[0].defaultZMax);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'animation' | 'code' | 'lab' | 'theory'>('animation');

  // Animation Playback State
  const [progress, setProgress] = useState<number>(0.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1.0);
  const [selectedPeak, setSelectedPeak] = useState<Peak | null>(null);

  // Generate dynamic peaks based on state
  const peaks = useMemo(() => {
    const presetCopy = {
      ...activePreset,
      mass: customMass,
    };
    return generatePeaksForPreset(presetCopy, adductMass, zMin, zMax);
  }, [activePreset, customMass, adductMass, zMin, zMax]);

  // Animation Loop using requestAnimationFrame
  const lastTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const loop = useCallback(
    (time: number) => {
      if (lastTimeRef.current !== null && isPlaying) {
        const delta = (time - lastTimeRef.current) / 1000;
        // Full animation length is ~40 seconds at 1.0x speed for clear, relaxed pedagogical pacing
        const duration = 40.0 / speed;
        setProgress((prev) => {
          const next = prev + delta / duration;
          if (next >= 1.0) {
            // Loop smoothly or pause at end
            return 0.0;
          }
          return next;
        });
      }
      lastTimeRef.current = time;
      if (isPlaying) {
        animFrameRef.current = requestAnimationFrame(loop);
      }
    },
    [isPlaying, speed]
  );

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();
      animFrameRef.current = requestAnimationFrame(loop);
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      lastTimeRef.current = null;
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, loop]);

  // Determine current scene ID based on progress
  const currentSceneId: SceneId = useMemo(() => {
    if (progress < 0.14) return 'scene1';
    if (progress < 0.52) return 'scene2';
    if (progress < 0.80) return 'scene3';
    return 'scene4';
  }, [progress]);

  // Handlers
  const handleSeek = (newProgress: number) => {
    setProgress(Math.max(0, Math.min(1, newProgress)));
  };

  const handleStep = (direction: 'prev' | 'next') => {
    const stepSize = 0.04;
    if (direction === 'prev') {
      setProgress((p) => Math.max(0, p - stepSize));
    } else {
      setProgress((p) => Math.min(1, p + stepSize));
    }
  };

  const handleReset = () => {
    setProgress(0.0);
    setIsPlaying(false);
  };

  const handleSelectPreset = (p: MoleculePreset) => {
    setActivePreset(p);
    setCustomMass(p.mass);
    setZMin(p.defaultZMin);
    setZMax(p.defaultZMax);
    setProgress(0.0);
  };

  const handleResetToPromptTarget = () => {
    handleSelectPreset(MOLECULE_PRESETS[0]);
  };

  return (
    <div className="min-h-screen bg-[#0d0e11] text-zinc-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation Bar */}
      <header className="border-b border-zinc-800/80 bg-[#121316]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-amber-500 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-zinc-950 rounded-[6px] flex items-center justify-center">
                <Activity className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight text-white">
                  ESI Charge-State Deconvolution
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
                  Manim 2D Animation
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Electrospray Ionization Multi-Charge Transformation into True Mass (24,000 Da)
              </p>
            </div>
          </div>

          {/* Tab Navigation Pill Group */}
          <nav className="flex items-center gap-1 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800/80">
            <button
              onClick={() => setActiveTab('animation')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'animation'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Animation Player</span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'code'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Python Manim Script</span>
            </button>

            <button
              onClick={() => setActiveTab('lab')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'lab'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Parameters</span>
            </button>

            <button
              onClick={() => setActiveTab('theory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'theory'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Theory</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Main Tab: Animation & Interactive Inspector */}
        {activeTab === 'animation' && (
          <div className="flex flex-col gap-5">
            {/* Canvas Stage */}
            <AnimationCanvas
              progress={progress}
              preset={activePreset}
              peaks={peaks}
              adductMass={adductMass}
              selectedPeak={selectedPeak}
              onSelectPeak={setSelectedPeak}
              speed={speed}
            />

            {/* Playback Controls */}
            <PlaybackControls
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              progress={progress}
              onSeek={handleSeek}
              speed={speed}
              onChangeSpeed={setSpeed}
              onReset={handleReset}
              onStep={handleStep}
              activeScene={currentSceneId}
              onSelectScene={(sceneId) => {
                if (sceneId === 'scene1') handleSeek(0.0);
                if (sceneId === 'scene2') handleSeek(0.14);
                if (sceneId === 'scene3') handleSeek(0.52);
                if (sceneId === 'scene4') handleSeek(0.80);
              }}
            />

            {/* Interactive Inspector & Calculation Breakdown */}
            <PeakInspector
              peaks={peaks}
              selectedPeak={selectedPeak}
              onSelectPeak={setSelectedPeak}
              preset={activePreset}
              adductMass={adductMass}
            />
          </div>
        )}

        {/* Tab 2: Complete Manim Python Code */}
        {activeTab === 'code' && (
          <div className="flex flex-col gap-5">
            <ManimScriptViewer />
          </div>
        )}

        {/* Tab 3: Deconvolution Lab & Parameter Tuning */}
        {activeTab === 'lab' && (
          <div className="flex flex-col gap-5">
            <DeconvolutionLab
              preset={activePreset}
              onSelectPreset={handleSelectPreset}
              customMass={customMass}
              onChangeCustomMass={(m) => {
                setCustomMass(m);
                setProgress(0.0);
              }}
              adductMass={adductMass}
              onChangeAdductMass={(a) => {
                setAdductMass(a);
                setProgress(0.0);
              }}
              zMin={zMin}
              zMax={zMax}
              onChangeZRange={(min, max) => {
                setZMin(min);
                setZMax(max);
                setProgress(0.0);
              }}
              onResetToPromptTarget={handleResetToPromptTarget}
            />

            {/* Mini Animation Preview under Lab */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-zinc-400">Live Preview with Active Parameters:</span>
              <AnimationCanvas
                progress={progress}
                preset={activePreset}
                peaks={peaks}
                adductMass={adductMass}
                selectedPeak={selectedPeak}
                onSelectPeak={setSelectedPeak}
                speed={speed}
              />
              <PlaybackControls
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying(!isPlaying)}
                progress={progress}
                onSeek={handleSeek}
                speed={speed}
                onChangeSpeed={setSpeed}
                onReset={handleReset}
                onStep={handleStep}
                activeScene={currentSceneId}
                onSelectScene={(sceneId) => {
                  if (sceneId === 'scene1') handleSeek(0.0);
                  if (sceneId === 'scene2') handleSeek(0.14);
                  if (sceneId === 'scene3') handleSeek(0.52);
                  if (sceneId === 'scene4') handleSeek(0.80);
                }}
              />
            </div>
          </div>
        )}

        {/* Tab 4: Scientific Theory */}
        {activeTab === 'theory' && (
          <div className="flex flex-col gap-5">
            <TheorySection />
          </div>
        )}
      </main>
    </div>
  );
}
