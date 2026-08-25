import { MoleculePreset, Peak } from '../types';

export const PROTON_MASS = 1.007825; // Da
export const SODIUM_MASS = 22.989769; // Da

export const MOLECULE_PRESETS: MoleculePreset[] = [
  {
    id: 'antibody_lc',
    name: 'Reduced Antibody Light Chain (Prompt Target)',
    description: 'Target molecule from prompt (~24,000 Da), ideal for showing high-charge state ESI envelopes.',
    mass: 24000.0,
    defaultZMin: 10,
    defaultZMax: 25,
    centerZ: 17,
    sigmaZ: 3.0,
    mzMin: 800,
    mzMax: 2600,
    massAxisMin: 5000,
    massAxisMax: 75000,
  },
  {
    id: 'myoglobin',
    name: 'Horse Heart Myoglobin',
    description: 'Standard ESI calibration protein with intact heme (16,951.5 Da).',
    mass: 16951.5,
    defaultZMin: 12,
    defaultZMax: 24,
    centerZ: 18,
    sigmaZ: 2.5,
    mzMin: 650,
    mzMax: 1600,
    massAxisMin: 4000,
    massAxisMax: 50000,
  },
  {
    id: 'bsa',
    name: 'Bovine Serum Albumin (BSA)',
    description: 'Medium protein (~66,430 Da) with broad charge envelope spanning 35+ charge states.',
    mass: 66430.0,
    defaultZMin: 35,
    defaultZMax: 60,
    centerZ: 47,
    sigmaZ: 4.5,
    mzMin: 1000,
    mzMax: 2000,
    massAxisMin: 20000,
    massAxisMax: 150000,
  },
  {
    id: 'ubiquitin',
    name: 'Ubiquitin',
    description: 'Small regulatory protein (~8,565 Da) commonly used in structural biology.',
    mass: 8565.0,
    defaultZMin: 6,
    defaultZMax: 13,
    centerZ: 9,
    sigmaZ: 1.6,
    mzMin: 600,
    mzMax: 1600,
    massAxisMin: 2000,
    massAxisMax: 30000,
  },
  {
    id: 'intact_igg',
    name: 'Intact Monoclonal Antibody (IgG1)',
    description: 'Large therapeutic antibody (~148,000 Da) in native or denaturing conditions.',
    mass: 148000.0,
    defaultZMin: 40,
    defaultZMax: 65,
    centerZ: 52,
    sigmaZ: 5.0,
    mzMin: 2200,
    mzMax: 3800,
    massAxisMin: 50000,
    massAxisMax: 300000,
  }
];

export function calculateObservedMz(mass: number, z: number, adductMass: number = PROTON_MASS): number {
  return (mass + z * adductMass) / z;
}

export function calculateMassFromMz(mz: number, z: number, adductMass: number = PROTON_MASS): number {
  return (mz - adductMass) * z;
}

export function calculateChargeFromAdjacent(mz1: number, mz2: number, adductMass: number = PROTON_MASS): number {
  // Assuming mz1 > mz2, so z1 = z2 - 1
  // z2 = (mz1 - adductMass) / (mz1 - mz2)
  const z = (mz1 - adductMass) / (mz1 - mz2);
  return Math.round(z);
}

export function generatePeaksForPreset(
  preset: MoleculePreset,
  adductMass: number = PROTON_MASS,
  zMin: number = preset.defaultZMin,
  zMax: number = preset.defaultZMax
): Peak[] {
  const peaks: Peak[] = [];
  for (let z = zMin; z <= zMax; z++) {
    const mz = calculateObservedMz(preset.mass, z, adductMass);
    // Gaussian envelope abundance
    const abundance = Math.exp(-Math.pow(z - preset.centerZ, 2) / (2 * Math.pow(preset.sigmaZ, 2)));
    peaks.push({
      id: `peak-z${z}`,
      z,
      mz,
      abundance: Math.max(0.05, abundance),
      label: `+${z}`,
    });
  }
  return peaks.sort((a, b) => a.mz - b.mz);
}
