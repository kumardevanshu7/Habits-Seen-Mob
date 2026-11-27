import React from 'react';
import { ChecklistItem } from '../../types/habit';
import { Check, Star } from 'lucide-react';
import clsx from 'clsx';

interface ChecklistPartsGroupProps {
  items: ChecklistItem[];
  completedItemIds: string[];
  onToggleItem?: (itemId: string) => void;
  showStarBadges?: boolean;
  readOnly?: boolean;
  compact?: boolean;
}

/**
 * Renders interactive multi-part (3-6+) task pills directly on Habit cards and details.
 * Completing all required parts completes the parent habit.
 */
export const ChecklistPartsGroup: React.FC<ChecklistPartsGroupProps> = ({
  items,
  completedItemIds,
  onToggleItem,
  showStarBadges = false,
  readOnly = false,
  compact = false,
}) => {
  const completedSet = new Set(completedItemIds);

  return (
    <div
      className={clsx(
        'grid gap-2',
        items.length >= 5 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'
      )}
    >
      {items.map((item, idx) => {
        const done = completedSet.has(item.id);

        return (
          <button
            key={item.id}
            type="button"
            disabled={readOnly}
            onClick={(e) => {
              e.stopPropagation();
              onToggleItem?.(item.id);
            }}
            className={clsx(
              'rounded-2xl border-2 flex items-center justify-between gap-2 text-left transition-all select-none min-w-0',
              compact ? 'px-2.5 py-2' : 'px-3 py-2.5',
              !readOnly && 'cursor-pointer active:scale-[0.98]',
              done
                ? 'bg-emerald-500 border-emerald-600 text-white shadow-xs'
                : 'bg-zinc-50 hover:bg-emerald-50/60 border-zinc-200 hover:border-emerald-300 text-zinc-800'
            )}
            title={done ? `${item.text} (Completed)` : `Tap to mark: ${item.text}`}
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span
                className={clsx(
                  'text-[10px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0',
                  done
                    ? 'bg-white/25 text-white'
                    : 'bg-zinc-200/80 text-zinc-600'
                )}
              >
                {idx + 1}
              </span>
              <span
                className={clsx(
                  'font-semibold leading-tight break-words min-w-0 flex-1',
                  compact ? 'text-xs' : 'text-xs sm:text-sm',
                  done && 'font-bold'
                )}
              >
                {item.text}
              </span>
              {showStarBadges && item.isStarred && (
                <Star
                  size={11}
                  className={clsx('shrink-0', done ? 'text-amber-200 fill-amber-200' : 'text-amber-500 fill-amber-500')}
                />
              )}
            </div>

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
      })}
    </div>
  );
};
