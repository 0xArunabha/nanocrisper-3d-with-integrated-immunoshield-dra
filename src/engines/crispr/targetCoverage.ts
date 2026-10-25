// src/engines/crispr/targetCoverage.ts
//
// Does any candidate guide put the target base inside the editor's window? Whether it does depends on
// the editor (which base, which window) and on the PAM variant (where a guide may sit). A preset can
// look fine and still have no guide at all for its default settings; this module answers that question
// for every editor / PAM combination, using the same scanner the app uses.

import {
  BASE_EDITOR_DEFINITIONS,
  PAM_VARIANT_DEFINITIONS,
  type BaseEditorType,
  type GenePreset,
  type PamVariant,
} from '../types';
import { scanForGuides } from './guideScanner';

export interface CoverageOption {
  editor: BaseEditorType;
  pam: PamVariant;
  /** Candidate guides whose editing window contains the target base */
  onTarget: number;
}

export const EDITOR_TYPES = Object.keys(BASE_EDITOR_DEFINITIONS) as BaseEditorType[];
export const PAM_VARIANTS = Object.keys(PAM_VARIANT_DEFINITIONS) as PamVariant[];

/** Number of candidate guides that cover the target base for the preset's own editor and PAM. */
export function countOnTargetGuides(preset: GenePreset): number {
  return scanForGuides(preset).filter((guide) => guide.targetInWindow).length;
}

/** Every editor x PAM combination for this target, with how many guides cover the target base. */
export function coverageOptions(preset: GenePreset): CoverageOption[] {
  const options: CoverageOption[] = [];
  for (const editor of EDITOR_TYPES) {
    for (const pam of PAM_VARIANTS) {
      options.push({
        editor,
        pam,
        onTarget: countOnTargetGuides({ ...preset, editorType: editor, pamVariant: pam }),
      });
    }
  }
  return options;
}
