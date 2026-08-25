export interface Peak {
  id: string;
  z: number;
  mz: number;
  abundance: number; // 0 to 1
  label: string;
}

export interface TrialToken {
  id: string;
  sourcePeakZ: number;
  sourceMz: number;
  trialZ: number;
  calculatedMass: number;
  isMatch: boolean;
  color: string;
  radius: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
  progress: number;
  dropped: boolean;
}

export type SceneId = 'scene1' | 'scene2' | 'scene3' | 'scene4';

export interface SceneMeta {
  id: SceneId;
  title: string;
  subtitle: string;
  startProgress: number; // 0.0 to 1.0
  endProgress: number;
}

export interface MoleculePreset {
  id: string;
  name: string;
  description: string;
  mass: number;
  defaultZMin: number;
  defaultZMax: number;
  centerZ: number;
  sigmaZ: number;
  mzMin: number;
  mzMax: number;
  massAxisMin: number;
  massAxisMax: number;
}
