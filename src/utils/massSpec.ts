import { MoleculePreset, Peak } from '../types';

export const PROTON_MASS = 1.007825; // Da

export const MOLECULE_PRESETS: MoleculePreset[] = [
  {
    id: 'nist_mab_lc',
    name: 'NIST mAb Light Chain',
    description: 'Reduced NISTmAb light chain standard (23,126 Da, +10 to +25 charge envelope).',
    mass: 23126.0,
    defaultZMin: 10,
    defaultZMax: 25,
    centerZ: 18,
    sigmaZ: 2.8,
    mzMin: 800,
    mzMax: 4000,
    massAxisMax: 60000,
  },
  {
    id: 'nist_mab_hc',
    name: 'NIST mAb Heavy Chain',
    description: 'Reduced NISTmAb heavy chain standard (50,599 Da, +15 to +45 charge envelope).',
    mass: 50599.0,
    defaultZMin: 15,
    defaultZMax: 45,
    centerZ: 30,
    sigmaZ: 4.5,
    mzMin: 800,
    mzMax: 4000,
    massAxisMax: 120000,
  },
  {
    id: 'nist_mab_intact',
    name: 'NIST mAb Intact',
    description: 'Intact therapeutic IgG1 monoclonal antibody (148,199 Da, +40 to +80 charge envelope).',
    mass: 148199.0,
    defaultZMin: 40,
    defaultZMax: 80,
    centerZ: 60,
    sigmaZ: 6.5,
    mzMin: 800,
    mzMax: 4000,
    massAxisMax: 320000,
  },
];

export function calculateObservedMz(mass: number, z: number, adductMass: number = PROTON_MASS): number {
  return (mass + z * adductMass) / z;
}

export function calculateMassFromMz(mz: number, z: number, adductMass: number = PROTON_MASS): number {
  return (mz - adductMass) * z;
}

export function calculateChargeFromAdjacent(mz1: number, mz2: number, adductMass: number = PROTON_MASS): number {
  // Assuming mz1 > mz2 (so z1 = z2 - 1)
  // z2 = (mz1 - adductMass) / (mz1 - mz2)
  const z = (mz1 - adductMass) / (mz1 - mz2);
  return Math.round(z);
}

export function generatePeaksForPreset(
  mass: number,
  adductMass: number = PROTON_MASS,
  zMin: number = 10,
  zMax: number = 25,
  centerZ: number = 17,
  sigmaZ: number = 3.0
): Peak[] {
  const peaks: Peak[] = [];
  const safeSigma = Math.max(0.5, sigmaZ);
  
  for (let z = zMin; z <= zMax; z++) {
    const mz = calculateObservedMz(mass, z, adductMass);
    const exponent = -Math.pow(z - centerZ, 2) / (2 * Math.pow(safeSigma, 2));
    const abundance = Math.exp(Math.max(-20, exponent));
    peaks.push({
      id: `peak-z${z}`,
      z,
      mz,
      abundance: Math.max(0.04, Math.min(1.0, abundance)),
      label: `+${z}`,
    });
  }
  return peaks.sort((a, b) => a.mz - b.mz);
}
