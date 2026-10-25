// src/components/HintLine.tsx
//
// A quiet, single-line hint bar positioned in a fixed spot directly below the status bar.
//
// Design principles:
// 1. Nothing pops up. Fixed height, never covers work, never animates, never shifts layout.
// 2. Only one hint shows at a time. A small "+N" button reveals or cycles through others.
// 3. Dismissing (×) is permanent for that situation (until conditionKey changes).
// 4. Amber is reserved strictly for "selected" only.
// 5. Plain, honest tone reporting model targets.

import { useState } from 'react';
import type { Hint } from '../engines/hints';
import { X, ChevronRight } from 'lucide-react';
import './ui/controls.css';

interface HintLineProps {
  hints: readonly Hint[];
  hintsEnabled: boolean;
  onDismiss: (conditionKey: string) => void;
  className?: string;
}

export function HintLine({
  hints,
  hintsEnabled,
  onDismiss,
  className = '',
}: HintLineProps) {
  const [activeHintIndex, setActiveHintIndex] = useState(0);

  // If hints are disabled or empty, keep fixed layout height to prevent layout shifts.
  if (!hintsEnabled || hints.length === 0) {
    return (
      <aside
        role="region"
        aria-label="Workbench hints"
        className={`h-7 px-4 border-b border-[#23272b] bg-[#121416] flex items-center justify-between text-[11px] text-[#70675c] select-none shrink-0 ${className}`}
      >
        <span className="text-[10px] uppercase font-mono tracking-wider opacity-40">
          Workbench hints idle
        </span>
      </aside>
    );
  }

  // Ensure active index is within bounds if hints count changed
  const safeIndex = activeHintIndex < hints.length ? activeHintIndex : 0;
  const currentHint = hints[safeIndex];
  const otherCount = hints.length - 1;

  const handleCycleNext = () => {
    setActiveHintIndex((prev) => (prev + 1) % hints.length);
  };

  return (
    <aside
      role="region"
      aria-label="Workbench hints"
      aria-live="polite"
      className={`h-7 px-4 border-b border-[#2a2f34] bg-[#14171a] flex items-center justify-between gap-3 text-xs text-[#c8c0b5] select-none shrink-0 ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <span
          className="text-[9.5px] uppercase font-mono font-semibold px-1.5 py-0.5 rounded-[2px] bg-[#22272c] text-[#98a1a6] border border-[#32383f] shrink-0"
          aria-hidden="true"
        >
          Hint #{currentHint.priority}
        </span>

        <span className="truncate text-[11px] text-[#d6cfc7] leading-tight">
          {currentHint.message}
        </span>

        {currentHint.action && (
          <button
            type="button"
            onClick={currentHint.action.run}
            className="ctl-btn h-[20px] px-2 text-[10.5px] font-medium text-[#38bdf8] border-[#2f4350] bg-[#1a2630] hover:bg-[#20313e] hover:text-[#7dd3fc] shrink-0 transition"
          >
            <span>{currentHint.action.label}</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {otherCount > 0 && (
          <button
            type="button"
            onClick={handleCycleNext}
            title={`View other active hints (${otherCount} more)`}
            className="h-[20px] px-1.5 text-[10px] font-mono rounded-[2px] bg-[#22272c] hover:bg-[#2c333a] text-[#98a1a6] hover:text-[#eae6df] border border-[#32383f] flex items-center gap-0.5 transition cursor-pointer"
          >
            <span>+{otherCount}</span>
            <ChevronRight className="w-2.5 h-2.5" />
          </button>
        )}

        <button
          type="button"
          onClick={() => onDismiss(currentHint.conditionKey)}
          title="Dismiss this hint for current settings (×)"
          aria-label="Dismiss hint"
          className="w-5 h-5 flex items-center justify-center rounded-[2px] text-[#70675c] hover:text-[#eae6df] hover:bg-[#252b31] transition cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </aside>
  );
}
