import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MoleculePreset, Peak, SceneId } from './types';
import { MOLECULE_PRESETS, PROTON_MASS, generatePeaksForPreset } from './utils/massSpec';
import { AnimationCanvas } from './components/AnimationCanvas';
import { PlaybackControls } from './components/PlaybackControls';
import { PeakInspector } from './components/PeakInspector';
import { ParameterPanel } from './components/ParameterPanel';
import { ManimScriptModal } from './components/ManimScriptModal';
import { Activity, Sliders, Code2 } from 'lucide-react';

export default function App() {
  // Active Preset Selection & Calibration State
  const [activePreset, setActivePreset] = useState<MoleculePreset>(MOLECULE_PRESETS[0]);
  const [customMass, setCustomMass] = useState<number>(MOLECULE_PRESETS[0].mass);
  const adductMass = PROTON_MASS;
  const [zMin, setZMin] = useState<number>(MOLECULE_PRESETS[0].defaultZMin);
  const [zMax, setZMax] = useState<number>(MOLECULE_PRESETS[0].defaultZMax);
  const [centerZ, setCenterZ] = useState<number>(MOLECULE_PRESETS[0].centerZ);
  const [sigmaZ, setSigmaZ] = useState<number>(MOLECULE_PRESETS[0].sigmaZ);
  const [mzMin, setMzMin] = useState<number>(MOLECULE_PRESETS[0].mzMin);
  const [mzMax, setMzMax] = useState<number>(MOLECULE_PRESETS[0].mzMax);

  // UI state
  const [showParameters, setShowParameters] = useState<boolean>(false);
  const [showManimModal, setShowManimModal] = useState<boolean>(false);

  // Animation Playback State
  const [progress, setProgress] = useState<number>(0.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1.0);
  const [selectedPeak, setSelectedPeak] = useState<Peak | null>(null);

  // Generate dynamic centroid peaks based on active parameters
  const peaks = useMemo(() => {
    return generatePeaksForPreset(customMass, adductMass, zMin, zMax, centerZ, sigmaZ);
  }, [customMass, adductMass, zMin, zMax, centerZ, sigmaZ]);

  // Keep selectedPeak valid when peaks change
  useEffect(() => {
    if (selectedPeak && !peaks.some((p) => p.id === selectedPeak.id)) {
      setSelectedPeak(peaks[0] || null);
    }
  }, [peaks, selectedPeak]);

  // Animation Loop using requestAnimationFrame
  const lastTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const loop = useCallback(
    (time: number) => {
      if (lastTimeRef.current !== null && isPlaying) {
        const delta = (time - lastTimeRef.current) / 1000;
        const duration = 36.0 / speed;
        setProgress((prev) => {
          const next = prev + delta / duration;
          if (next >= 1.0) {
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

  const currentSceneId: SceneId = useMemo(() => {
    if (progress < 0.14) return 'scene1';
    if (progress < 0.52) return 'scene2';
    if (progress < 0.80) return 'scene3';
    return 'scene4';
  }, [progress]);

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
    setCenterZ(p.centerZ);
    setSigmaZ(p.sigmaZ);
    setMzMin(p.mzMin);
    setMzMax(p.mzMax);
    setProgress(0.0);
  };

  const handleResetToDefault = () => {
    handleSelectPreset(MOLECULE_PRESETS[0]);
  };

  return (
    <div className="min-h-screen bg-[#0a0b0e] text-zinc-100 font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Top Header */}
      <header className="border-b border-zinc-800/80 bg-[#101116]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white tracking-tight">
                  ESI Charge-State Deconvolution
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-amber-300 border border-zinc-700">
                  {activePreset.name}: {customMass.toLocaleString()} Da
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowParameters(!showParameters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                showParameters
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-sm'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Parameters & Standards</span>
            </button>

            <button
              onClick={() => setShowManimModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-zinc-300 border border-zinc-800 hover:border-zinc-700 hover:text-white transition-all"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Manim Script</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Single-View Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col gap-4">
        {/* Optional Parameter & Standards Panel (Togglable) */}
        {showParameters && (
          <ParameterPanel
            preset={activePreset}
            onSelectPreset={handleSelectPreset}
            customMass={customMass}
            onChangeCustomMass={(m) => {
              setCustomMass(m);
              setProgress(0.0);
            }}
            zMin={zMin}
            zMax={zMax}
            onChangeZRange={(min, max) => {
              setZMin(min);
              setZMax(max);
              setProgress(0.0);
            }}
            centerZ={centerZ}
            onChangeCenterZ={(c) => {
              setCenterZ(c);
              setProgress(0.0);
            }}
            sigmaZ={sigmaZ}
            onChangeSigmaZ={(s) => {
              setSigmaZ(s);
              setProgress(0.0);
            }}
            mzMin={mzMin}
            mzMax={mzMax}
            onChangeMzRange={(min, max) => {
              setMzMin(min);
              setMzMax(max);
              setProgress(0.0);
            }}
            onResetToDefault={handleResetToDefault}
          />
        )}

        {/* Front & Center: Mass Spectrum & Animation Canvas */}
        <AnimationCanvas
          progress={progress}
          mass={customMass}
          centerZ={centerZ}
          sigmaZ={sigmaZ}
          zMin={zMin}
          zMax={zMax}
          mzMin={mzMin}
          mzMax={mzMax}
          peaks={peaks}
          adductMass={adductMass}
          selectedPeak={selectedPeak}
          onSelectPeak={setSelectedPeak}
          speed={speed}
        />

        {/* Minimal Playback Controls */}
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
        />

        {/* Charge-State Deconvolution Inspector */}
        <PeakInspector
          peaks={peaks}
          selectedPeak={selectedPeak}
          onSelectPeak={setSelectedPeak}
          mass={customMass}
          adductMass={adductMass}
          zMin={zMin}
          zMax={zMax}
        />
      </main>

      {/* Python Manim Script Modal */}
      <ManimScriptModal
        isOpen={showManimModal}
        onClose={() => setShowManimModal(false)}
      />
    </div>
  );
}
