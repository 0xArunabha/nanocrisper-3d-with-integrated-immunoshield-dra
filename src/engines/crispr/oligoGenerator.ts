// src/engines/crispr/oligoGenerator.ts
import type { CloningOligos } from '../types';
import { reverseComplement } from './guideScanner';

/**
 * Oligo synthesis order generator for BsmBI / BpiI (Esp3I) Golden Gate cloning.
 * Appends 5'-CACC overhang to forward strand (ensuring a 5'-G for human U6 promoter transcription initiation),
 * and complementary 5'-AAAC overhang to reverse strand.
 */
export function generateCloningOligos(spacer: string): CloningOligos {
  const needsG = spacer[0] !== 'G';
  const fwdCore = (needsG ? 'G' : '') + spacer;
  const forwardOligo = `CACC${fwdCore}`;
  const reverseOligo = `AAAC${reverseComplement(fwdCore)}`;

  return {
    forwardOligo: `5'-${forwardOligo}-3'`,
    reverseOligo: `5'-${reverseOligo}-3'`,
    overhangSystem: 'BsmBI / BpiI (Esp3I)'
  };
}
