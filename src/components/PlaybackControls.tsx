import React from 'react';
import { Play, Pause, RotateCcw, FastForward, Rewind, Layers, Sparkles, Sliders } from 'lucide-react';
import { SceneId } from '../types';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  progress: number;
  onSeek: (progress: number) => void;
  speed: number;
  onChangeSpeed: (speed: number) => void;
  onReset: () => void;
  onStep: (direction: 'prev' | 'next') => void;
  activeScene: SceneId;
  onSelectScene: (sceneId: SceneId) => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  onTogglePlay,
  progress,
  onSeek,
  speed,
  onChangeSpeed,
  onReset,
  onStep,
  activeScene,
  onSelectScene,
}) => {
  const scenes: Array<{ id: SceneId; label: string; start: number; tag: string }> = [
    { id: 'scene1', label: '1. Raw Spectrum', start: 0.0, tag: 'm/z Envelope' },
    { id: 'scene2', label: '2. Zoom & Color Math', start: 0.14, tag: 'z=5,6,7..32' },
    { id: 'scene3', label: '3. All Charge Drops', start: 0.52, tag: 'Co-Resonance' },
    { id: 'scene4', label: '4. Discovery & Harmonics', start: 0.80, tag: 'True Mass + Harmonics' },
  ];

  return (
    <div className="bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-xl p-4 flex flex-col gap-3 shadow-xl">
      {/* Top Scene Jump Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {scenes.map((scene) => {
          const isActive =
            (scene.id === 'scene1' && progress < 0.14) ||
            (scene.id === 'scene2' && progress >= 0.14 && progress < 0.52) ||
            (scene.id === 'scene3' && progress >= 0.52 && progress < 0.80) ||
            (scene.id === 'scene4' && progress >= 0.80);

          return (
            <button
              key={scene.id}
              onClick={() => onSeek(scene.start)}
              className={`flex flex-col items-start px-3 py-2 rounded-lg border text-left transition-all ${
                isActive
                  ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                  : 'bg-zinc-950/40 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-semibold">{scene.label}</span>
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400">
                  {scene.tag}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Scrubbable Timeline */}
      <div className="flex flex-col gap-1">
        <div className="relative flex items-center group">
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={progress}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="w-full h-2.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 transition-all focus:outline-none"
          />
          {/* Visual Scene Markers along scrubber */}
          <div className="absolute left-[14%] top-0 w-0.5 h-2.5 bg-cyan-500/60 pointer-events-none" />
          <div className="absolute left-[52%] top-0 w-0.5 h-2.5 bg-zinc-500 pointer-events-none" />
          <div className="absolute left-[80%] top-0 w-0.5 h-2.5 bg-amber-500/60 pointer-events-none" />
        </div>
      </div>

      {/* Action Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Left Play/Pause & Step Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            title="Reset Animation"
            className="p-2 rounded-lg bg-zinc-800/70 hover:bg-zinc-700 text-zinc-300 transition-colors border border-zinc-700/50"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => onStep('prev')}
            title="Step Backward"
            className="p-2 rounded-lg bg-zinc-800/70 hover:bg-zinc-700 text-zinc-300 transition-colors border border-zinc-700/50"
          >
            <Rewind className="w-4 h-4" />
          </button>

          <button
            onClick={onTogglePlay}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold transition-all shadow-[0_0_16px_rgba(6,182,212,0.3)]"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span className="text-xs">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span className="text-xs">Play</span>
              </>
            )}
          </button>

          <button
            onClick={() => onStep('next')}
            title="Step Forward"
            className="p-2 rounded-lg bg-zinc-800/70 hover:bg-zinc-700 text-zinc-300 transition-colors border border-zinc-700/50"
          >
            <FastForward className="w-4 h-4" />
          </button>
        </div>

        {/* Playback Speed Toggles */}
        <div className="flex items-center gap-1.5 bg-zinc-950/60 p-1 rounded-lg border border-zinc-800">
          <span className="text-[11px] text-zinc-500 px-2 font-medium">Pacing:</span>
          {[0.5, 0.75, 1.0, 1.5, 2.0].map((s) => (
            <button
              key={s}
              onClick={() => onChangeSpeed(s)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all ${
                speed === s
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
