export interface Peak {
  id: string;
  z: number;
  mz: number;
  abundance: number; // 0 to 1
  label: string;
}

export type SceneId = 'scene1' | 'scene2' | 'scene3' | 'scene4';

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
  massAxisMax: number;
}
