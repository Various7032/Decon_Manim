import React from 'react';
import { Play, Pause, RotateCcw, FastForward, Rewind } from 'lucide-react';
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
}) => {
  const scenes: Array<{ id: SceneId; label: string; start: number }> = [
    { id: 'scene1', label: '1. Raw Spectrum', start: 0.0 },
    { id: 'scene2', label: '2. Zoom & Formula', start: 0.14 },
    { id: 'scene3', label: '3. Charge Drop', start: 0.52 },
    { id: 'scene4', label: '4. Consensus & Harmonics', start: 0.80 },
  ];

  return (
    <div className="bg-[#121316] border border-zinc-800 rounded-xl p-3.5 flex flex-col gap-3 shadow-xl">
      {/* Scene Jump Pills */}
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
              className={`px-3 py-1.5 rounded-lg border text-left text-xs font-medium transition-all ${
                isActive
                  ? 'bg-sky-500/10 border-sky-500/50 text-sky-300'
                  : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              {scene.label}
            </button>
          );
        })}
      </div>

      {/* Scrub Timeline */}
      <div className="flex items-center gap-3">
        <input
          type="range"
          min="0"
          max="1"
          step="0.001"
          value={progress}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-400 focus:outline-none"
        />
        <span className="font-mono text-xs text-zinc-400 w-12 text-right">
          {(progress * 100).toFixed(0)}%
        </span>
      </div>

      {/* Play / Step / Speed Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onReset}
            title="Reset"
            className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => onStep('prev')}
            title="Step Back"
            className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            <Rewind className="w-4 h-4" />
          </button>

          <button
            onClick={onTogglePlay}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold transition-all text-xs"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play</span>
              </>
            )}
          </button>

          <button
            onClick={() => onStep('next')}
            title="Step Forward"
            className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            <FastForward className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Multipliers */}
        <div className="flex items-center gap-1 bg-zinc-950/60 p-1 rounded-md border border-zinc-800 text-xs">
          <span className="text-[11px] text-zinc-500 px-1.5 font-medium">Speed:</span>
          {[0.5, 0.75, 1.0, 1.5, 2.0].map((s) => (
            <button
              key={s}
              onClick={() => onChangeSpeed(s)}
              className={`px-2 py-0.5 rounded font-mono text-xs transition-all ${
                speed === s
                  ? 'bg-sky-500/20 text-sky-300 font-semibold'
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
