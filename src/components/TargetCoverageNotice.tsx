// src/components/TargetCoverageNotice.tsx
//
// Shown above the guide table when no candidate guide puts the target base inside the editing window.
// A ranked list that looks normal but cannot make the intended edit is the failure this prevents.

import { ToolButton } from './ui/controls';
import type { CoverageOption } from '../engines/crispr/targetCoverage';
import './TargetCoverageNotice.css';

interface TargetCoverageNoticeProps {
  /** Editor and PAM the guides were scanned with */
  editor: string;
  pam: string;
  /** Every editor x PAM combination for this target, with its on-target guide count */
  options: readonly CoverageOption[];
  onApply: (editor: CoverageOption['editor'], pam: CoverageOption['pam']) => void;
}

const shortEditor = (editor: string): string => editor.split(' (')[0];

export function TargetCoverageNotice({ editor, pam, options, onApply }: TargetCoverageNoticeProps) {
  const covering = options
    .filter((option) => option.onTarget > 0)
    .sort((a, b) => b.onTarget - a.onTarget)
    .slice(0, 4);

  return (
    <div className="tcn" role="status">
      <p className="tcn__text">
        <strong>
          No candidate guide covers the target base with {shortEditor(editor)} and {pam}.
        </strong>{' '}
        The guides below edit other bases, so none of them makes the intended edit.
      </p>
      {covering.length > 0 ? (
        <div className="tcn__options">
          <span className="tcn__label">These settings do cover it</span>
          {covering.map((option) => (
            <ToolButton
              key={`${option.editor}|${option.pam}`}
              onClick={() => onApply(option.editor, option.pam)}
              title={`Switch to ${option.editor} with ${option.pam}`}
            >
              {shortEditor(option.editor)} + {option.pam}
              <span className="tcn__count">{option.onTarget}</span>
            </ToolButton>
          ))}
        </div>
      ) : (
        <p className="tcn__text">
          No editor and PAM combination in this app covers it. Check the target position, or use a different editor
          type.
        </p>
      )}
    </div>
  );
}
