import React, { useMemo, useRef, useState } from 'react';
import { Habit } from '../../types/habit';
import { useAppStore } from '../../stores/useAppStore';
import { CATEGORY_ICONS } from '../../constants/iconsAndColors';
import { useTodayKey } from '../../hooks/useTodayKey';
import { boostVibrancy, getContrastIconColor } from '../../utils/colorUtils';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isSameMonth,
  parseISO,
} from 'date-fns';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Flag,
  MoreVertical,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import clsx from 'clsx';
import confetti from 'canvas-confetti';
import { getPairSlotIds } from '../../utils/streakEngine';
import { HabitActionsModal } from './HabitActionsModal';

interface JustTrackingMonthCardProps {
  habit: Habit;
  onOpenDetails: (habit: Habit) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

const WEEKDAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Interactive monthly calendar card for a Just Tracking habit. */
export const JustTrackingMonthCard: React.FC<JustTrackingMonthCardProps> = ({
  habit,
  onOpenDetails,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}) => {
  const { categories, logs, logHabit } = useAppStore();
  const todayKey = useTodayKey();
  const todayDate = useMemo(() => parseISO(todayKey), [todayKey]);

  const [viewMonth, setViewMonth] = useState<Date>(() => parseISO(todayKey));
  const [notice, setNotice] = useState<string | null>(null);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const category = categories.find((c) => c.id === habit.categoryId);
  const CategoryIcon =
    CATEGORY_ICONS.find((i) => i.id === category?.icon)?.icon || CATEGORY_ICONS[0].icon;
  const catColor = boostVibrancy(category?.color || '#7c3aed');
  const catIconText = getContrastIconColor(catColor);

  const showToastNotice = (msg: string) => {
    setNotice(msg);
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => setNotice(null), 2800);
  };

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const daysInMonth = useMemo(
    () => eachDayOfInterval({ start: monthStart, end: monthEnd }),
    [monthStart, monthEnd]
  );
  const leadingEmptyCount = daysInMonth[0] ? getDay(daysInMonth[0]) : 0;

  const totalCompletedAllTime = useMemo(
    () =>
      Object.values(logs || {}).filter(
        (l) => l && l.habitId === habit.id && l.status === 'COMPLETED'
      ).length,
    [logs, habit.id]
  );

  const monthCompletedCount = useMemo(
    () =>
      daysInMonth.filter((day) => {
        const dKey = format(day, 'yyyy-MM-dd');
        return logs?.[`${habit.id}_${dKey}`]?.status === 'COMPLETED';
      }).length,
    [daysInMonth, logs, habit.id]
  );

  const isCurrentMonth = isSameMonth(viewMonth, todayDate);
  const isTodayCompleted = logs?.[`${habit.id}_${todayKey}`]?.status === 'COMPLETED';

  const handleLogDate = async (dateKey: string) => {
    if (dateKey > todayKey) {
      showToastNotice(`🔒 Future date (${format(parseISO(dateKey), 'dd MMM')}) cannot be marked in advance.`);
      return;
    }

    const existing = logs?.[`${habit.id}_${dateKey}`];
    if (existing?.status === 'COMPLETED') {
      showToastNotice('🔒 Completed day is locked — cannot be unchecked!');
      return;
    }

    confetti({ particleCount: 40, spread: 55, origin: { y: 0.7 } });

    if (habit.type === 'NUMERIC') {
      await logHabit(habit.id, dateKey, {
        valueNumeric: habit.config.numeric?.goal ?? 1,
        forceStatus: 'COMPLETED',
      });
    } else if (habit.type === 'TIMER') {
      await logHabit(habit.id, dateKey, {
        valueTimerSeconds: habit.config.timer?.targetSeconds ?? 60,
        forceStatus: 'COMPLETED',
      });
    } else if (habit.type === 'CHECKLIST') {
      await logHabit(habit.id, dateKey, {
        valueChecklistCompletedItemIds: (habit.config.checklist?.items || []).map((i) => i.id),
        forceStatus: 'COMPLETED',
      });
    } else if (habit.type === 'PAIR') {
      await logHabit(habit.id, dateKey, {
        valuePairCompletedSlotIds: getPairSlotIds(habit.config.pair?.pairs),
        forceStatus: 'COMPLETED',
      });
    } else {
      await logHabit(habit.id, dateKey, { valueYesNo: true });
    }
  };

  const handleHeaderPressStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(40);
        } catch {
          // ignore
        }
      }
      setIsOptionsMenuOpen(true);
    }, 450);
  };

  const handleHeaderPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const priorityLabel =
    habit.schedule.priority >= 70 ? 'High' : habit.schedule.priority >= 40 ? 'Medium' : 'Low';
  const priorityBg =
    priorityLabel === 'High'
      ? 'bg-[#e0d7ff] text-[#18181b]'
      : priorityLabel === 'Medium'
      ? 'bg-[#fde68a] text-[#18181b]'
      : 'bg-[#d2f1e4] text-[#18181b]';

  return (
    <>
      <div
        onContextMenu={(e) => {
          e.preventDefault();
          setIsOptionsMenuOpen(true);
        }}
        className="relative bg-white border border-zinc-200/80 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5"
      >
        {notice && (
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-30 bg-black text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg border border-white/20 whitespace-nowrap">
            {notice}
          </div>
        )}

        {/* TOP HEADER ROW */}
        <div
          onTouchStart={handleHeaderPressStart}
          onTouchEnd={handleHeaderPressEnd}
          onTouchMove={handleHeaderPressEnd}
          className="flex items-start justify-between gap-2.5"
        >
          <button
            type="button"
            onClick={() => onOpenDetails(habit)}
            className="flex items-center gap-3 min-w-0 flex-1 text-left group cursor-pointer"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
              style={{ backgroundColor: catColor, color: catIconText }}
            >
              <CategoryIcon size={18} strokeWidth={2.4} />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-display font-bold text-base text-zinc-900 tracking-tight truncate group-hover:text-purple-700 transition-colors">
                {habit.name}
              </h3>

              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                {category && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                    style={{
                      backgroundColor: `${catColor}15`,
                      color: catColor,
                      borderColor: `${catColor}35`,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: catColor }}
                    />
                    {category.name}
                  </span>
                )}

                <span
                  className={clsx(
                    'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold',
                    priorityBg
                  )}
                >
                  <Flag size={9} className="fill-current" />
                  {priorityLabel}
                </span>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                  <Sparkles size={9} />
                  {totalCompletedAllTime} total
                </span>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setIsOptionsMenuOpen(true)}
            className="w-8 h-8 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-800 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            title="Habit Options"
          >
            <MoreVertical size={16} />
          </button>
        </div>

        {/* MONTH NAVIGATOR (CLEAN PIC-2 STYLE: <   November 2026   >) */}
        <div className="pt-1 space-y-3">
          <div className="flex items-center justify-between gap-2 px-1">
            <button
              type="button"
              aria-label="Previous Month"
              onClick={() => setViewMonth(subMonths(viewMonth, 1))}
              className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <span className="font-display font-bold text-base text-zinc-900 text-center">
                {format(viewMonth, 'MMMM yyyy')}
              </span>
              {!isCurrentMonth && (
                <button
                  type="button"
                  onClick={() => setViewMonth(todayDate)}
                  className="px-2 py-0.5 rounded-full bg-zinc-900 text-white hover:bg-zinc-700 text-[10px] font-bold transition-colors cursor-pointer"
                >
                  Today
                </button>
              )}
            </div>

            <button
              type="button"
              aria-label="Next Month"
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
              className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* FULL MONTH INTERACTIVE DATE GRID (S M T W T F S CIRCULAR PILLS) */}
          <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center">
            {WEEKDAY_HEADERS.map((weekday, idx) => (
              <div
                key={`${weekday}-${idx}`}
                className="text-xs font-semibold text-zinc-400 py-1"
              >
                {weekday}
              </div>
            ))}

            {Array.from({ length: leadingEmptyCount }).map((_, idx) => (
              <div key={`pad-${idx}`} className="h-9 sm:h-10" />
            ))}

            {daysInMonth.map((day) => {
              const dKey = format(day, 'yyyy-MM-dd');
              const isCompleted = logs?.[`${habit.id}_${dKey}`]?.status === 'COMPLETED';
              const isToday = dKey === todayKey;
              const isFuture = dKey > todayKey;

              return (
                <button
                  key={dKey}
                  type="button"
                  onClick={() => handleLogDate(dKey)}
                  aria-label={`${format(day, 'd MMMM yyyy')}${isCompleted ? ' completed' : ''}`}
                  title={`${format(day, 'EEE, dd MMM yyyy')}: ${
                    isCompleted ? 'Completed ✓' : isFuture ? 'Future date' : 'Tap to mark done'
                  }`}
                  className={clsx(
                    'w-9 h-9 sm:w-10 sm:h-10 mx-auto rounded-full flex items-center justify-center text-sm transition-all select-none relative cursor-pointer',
                    isCompleted
                      ? clsx(
                          'bg-emerald-500 text-white font-bold shadow-xs',
                          isToday && 'ring-2 ring-zinc-900 ring-offset-2'
                        )
                      : isFuture
                      ? 'text-zinc-300 font-medium'
                      : isToday
                      ? 'bg-zinc-950 text-white font-bold shadow-sm hover:bg-zinc-800 active:scale-95'
                      : 'text-zinc-800 font-semibold hover:bg-rose-50 hover:text-rose-700 active:scale-95'
                  )}
                >
                  <span>{format(day, 'd')}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* BOTTOM FOOTER: LEGEND / MONTH COUNT / QUICK LOG TODAY / DETAILS */}
        <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between gap-2 flex-wrap text-[11px] text-zinc-500">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Done ({monthCompletedCount}/{daysInMonth.length})
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-950 inline-block" />
              Today
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {isCurrentMonth && !isTodayCompleted && (
              <button
                type="button"
                onClick={() => handleLogDate(todayKey)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-700 text-white font-bold text-[11px] transition-all active:scale-95 cursor-pointer"
              >
                <Check size={11} strokeWidth={2.8} />
                Mark Today
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenDetails(habit)}
              className="inline-flex items-center gap-0.5 font-bold text-purple-700 hover:text-purple-900 cursor-pointer"
            >
              Details <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>

      <HabitActionsModal
        habit={habit}
        subtitle={`${totalCompletedAllTime} times tracked`}
        isOpen={isOptionsMenuOpen}
        onClose={() => setIsOptionsMenuOpen(false)}
        onOpenDetails={onOpenDetails}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        isFirst={isFirst}
        isLast={isLast}
      />
    </>
  );
};
