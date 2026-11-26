import React from 'react';
import { HabitPair } from '../../types/habit';
import { Check } from 'lucide-react';
import clsx from 'clsx';

interface PairSlotsGroupProps {
  pairs: HabitPair[];
  completedSlotIds: string[];
  onToggleSlot?: (slotId: string) => void;
  readOnly?: boolean;
  compact?: boolean;
}

/**
 * Renders linked Left o—|—o Right pair slots for a PAIR habit.
 * Both slots in every pair must be checked to complete the overall habit.
 */
export const PairSlotsGroup: React.FC<PairSlotsGroupProps> = ({
  pairs,
  completedSlotIds,
  onToggleSlot,
  readOnly = false,
  compact = false,
}) => {
  const completedSet = new Set(completedSlotIds);

  return (
    <div className={clsx('flex flex-col', compact ? 'gap-2' : 'gap-2.5')}>
      {pairs.map((pair) => {
        const leftId = `${pair.id}:left`;
        const rightId = `${pair.id}:right`;
        const leftDone = completedSet.has(leftId);
        const rightDone = completedSet.has(rightId);
        const bothDone = leftDone && rightDone;
        const partialDone = (leftDone || rightDone) && !bothDone;

        const connectorDotColor = (done: boolean) =>
          done
            ? 'border-emerald-500 bg-emerald-500'
            : partialDone
            ? 'border-amber-400 bg-white'
            : 'border-rose-400 bg-white';

        const connectorLineColor = bothDone
          ? 'bg-emerald-500'
          : partialDone
          ? 'bg-amber-400'
          : 'bg-rose-400';

        const renderSlotButton = (slotId: string, title: string, done: boolean) => (
          <button
            type="button"
            disabled={readOnly}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSlot?.(slotId);
            }}
            className={clsx(
              'flex-1 min-w-0 rounded-2xl border-2 flex items-center justify-between gap-2 text-left transition-all select-none',
              compact ? 'px-2.5 py-2' : 'px-3 py-2.5',
              !readOnly && 'cursor-pointer active:scale-[0.98]',
              done
                ? 'bg-emerald-500 border-emerald-600 text-white shadow-xs'
                : 'bg-zinc-50 hover:bg-purple-50/70 border-zinc-200 hover:border-purple-300 text-zinc-800'
            )}
            title={done ? `${title} (Completed)` : `Tap to complete: ${title}`}
          >
            <span
              className={clsx(
                'font-semibold leading-tight break-words min-w-0 flex-1',
                compact ? 'text-xs' : 'text-xs sm:text-sm',
                done && 'font-bold'
              )}
            >
              {title}
            </span>

            <span
              className={clsx(
                'rounded-full flex items-center justify-center shrink-0 transition-all border',
                compact ? 'w-5 h-5' : 'w-5 h-5 sm:w-6 sm:h-6',
                done
                  ? 'bg-white text-emerald-600 border-white shadow-2xs'
                  : 'bg-white text-transparent border-zinc-300'
              )}
            >
              <Check size={compact ? 11 : 12} strokeWidth={3} />
            </span>
          </button>
        );

        return (
          <div key={pair.id} className="flex items-center gap-0.5 w-full">
            {renderSlotButton(leftId, pair.leftTitle, leftDone)}

            {/* o—|—o link divider matching Left <-> Right pair visual */}
            <div className="flex items-center shrink-0 px-0.5" aria-hidden="true">
              <span className={clsx('w-2 h-2 rounded-full border-2 transition-colors', connectorDotColor(leftDone))} />
              <span className={clsx('w-2 h-0.5 transition-colors', connectorLineColor)} />
              <span className={clsx('w-0.5 h-6 rounded-full transition-colors', connectorLineColor)} />
              <span className={clsx('w-2 h-0.5 transition-colors', connectorLineColor)} />
              <span className={clsx('w-2 h-2 rounded-full border-2 transition-colors', connectorDotColor(rightDone))} />
            </div>

            {renderSlotButton(rightId, pair.rightTitle, rightDone)}
          </div>
        );
      })}
    </div>
  );
};
