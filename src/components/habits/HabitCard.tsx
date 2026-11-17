import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Habit } from '../../types/habit';
import { useAppStore } from '../../stores/useAppStore';
import { CATEGORY_ICONS } from '../../constants/iconsAndColors';
import { format, parseISO } from 'date-fns';
import { useTodayKey } from '../../hooks/useTodayKey';
import { hasSecurityGuard } from '../../utils/cryptoUtils';
import {
  Check,
  Flame,
  MoreVertical,
  Flag,
  Calendar,
  Edit2,
  Copy,
  Archive,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import clsx from 'clsx';
import confetti from 'canvas-confetti';
import { computeHabitStreaks } from '../../utils/streakEngine';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { SecurityModal } from '../security/SecurityModal';

interface HabitCardProps {
  habit: Habit;
  dateKey: string;
  onOpenDetails: (habit: Habit) => void;
  variant?: 'grid' | 'list';
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  dateKey,
  onOpenDetails,
  variant = 'grid',
}) => {
  const { categories, logs, logHabit, addHabit, toggleArchiveHabit, deleteHabit, user } = useAppStore();

  const category = categories.find((c) => c.id === habit.categoryId);
  const CategoryIcon =
    CATEGORY_ICONS.find((i) => i.id === category?.icon)?.icon || CATEGORY_ICONS[0].icon;

  const logKey = `${habit.id}_${dateKey}`;
  const dayLog = logs[logKey];
  const isCompleted = dayLog?.status === 'COMPLETED';

  const todayKey = useTodayKey();
  const isFutureDate = dateKey > todayKey;
  const isDateLocked = isFutureDate;

  const [lockedNotice, setLockedNotice] = useState<string | null>(null);

  const showLockedNotice = () => {
    setLockedNotice(`🔒 Future date (${dateKey}) cannot be marked in advance.`);
    setTimeout(() => setLockedNotice(null), 3500);
  };

  const showCompletedLockedNotice = () => {
    setLockedNotice(`🔒 Completed task is locked — cannot be unchecked!`);
    setTimeout(() => setLockedNotice(null), 3000);
  };

  const streakInfo = computeHabitStreaks(habit, logs);
  const currentStreak = streakInfo.currentStreak;

  // Options Menu & Modal States
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  // Touch-hold (450ms) Detection
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);

  const handlePressStart = () => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(45);
        } catch {
          // ignore
        }
      }
      setIsOptionsMenuOpen(true);
    }, 450);
  };

  const handlePressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleCardClick = () => {
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      return;
    }
    onOpenDetails(habit);
  };

  // State for Numeric Value
  const [currentNum, setCurrentNum] = useState<number>(dayLog?.valueNumeric ?? 0);

  // State for Timer Logging
  const targetSeconds = habit.config.timer?.targetSeconds || 1500;
  const currentLoggedSeconds = dayLog?.valueTimerSeconds ?? 0;

  useEffect(() => {
    if (dayLog) {
      if (typeof dayLog.valueNumeric === 'number') setCurrentNum(dayLog.valueNumeric);
    } else {
      setCurrentNum(0);
    }
  }, [dayLog]);

  // YES / NO TOGGLE
  const handleToggleYesNo = () => {
    if (isDateLocked) {
      showLockedNotice();
      return;
    }
    if (isCompleted) {
      showCompletedLockedNotice();
      return;
    }
    confetti({ particleCount: 45, spread: 60, origin: { y: 0.7 } });
    logHabit(habit.id, dateKey, { valueYesNo: true });
  };

  // DUPLICATE ACTION
  const handleDuplicate = async () => {
    try {
      const { id, createdAt, updatedAt, stats, ...habitData } = habit;
      await addHabit({
        ...habitData,
        name: `${habit.name} (Copy)`,
      });
      confetti({ particleCount: 35, spread: 55, origin: { y: 0.7 } });
      setIsOptionsMenuOpen(false);
    } catch (err) {
      console.error('Failed to duplicate habit', err);
    }
  };

  // ARCHIVE ACTION
  const handleArchive = async () => {
    try {
      await toggleArchiveHabit(habit.id);
      setIsOptionsMenuOpen(false);
    } catch (err) {
      console.error('Failed to archive habit', err);
    }
  };

  // DELETE ACTION
  const handleDeleteRequest = () => {
    setIsOptionsMenuOpen(false);
    if (hasSecurityGuard(user)) {
      setIsSecurityModalOpen(true);
    } else {
      setIsConfirmDeleteOpen(true);
    }
  };

  const handleSecuritySuccess = async () => {
    setIsSecurityModalOpen(false);
    await deleteHabit(habit.id);
  };

  const handleConfirmDelete = async () => {
    setIsConfirmDeleteOpen(false);
    await deleteHabit(habit.id);
  };

  // Calculate Progress Percentage for Progress Bar
  const progressPercent = useMemo(() => {
    if (isCompleted) return 100;
    if (habit.type === 'NUMERIC') {
      const goal = habit.config.numeric?.goal || 1;
      return Math.min(100, Math.round((currentNum / goal) * 100));
    }
    if (habit.type === 'TIMER') {
      return Math.min(100, Math.round((currentLoggedSeconds / targetSeconds) * 100));
    }
    if (habit.type === 'CHECKLIST') {
      const total = habit.config.checklist?.items.length || 1;
      const done = (dayLog?.valueChecklistCompletedItemIds || []).length;
      return Math.min(100, Math.round((done / total) * 100));
    }
    return 0;
  }, [isCompleted, habit.type, currentNum, habit.config, currentLoggedSeconds, targetSeconds, dayLog]);

  const priorityLabel = habit.schedule.priority >= 70 ? 'High' : habit.schedule.priority >= 40 ? 'Medium' : 'Low';
  const priorityBg =
    priorityLabel === 'High'
      ? 'bg-[#e0d7ff] text-[#18181b]'
      : priorityLabel === 'Medium'
      ? 'bg-[#fde68a] text-[#18181b]'
      : 'bg-[#d2f1e4] text-[#18181b]';

  return (
    <>
      <div
        onClick={handleCardClick}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onTouchMove={handlePressEnd}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onContextMenu={(e) => {
          e.preventDefault();
          setIsOptionsMenuOpen(true);
        }}
        className={clsx(
          'group relative transition-all duration-200 border cursor-pointer select-none active:scale-[0.99]',
          variant === 'grid'
            ? 'rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between h-full'
            : 'rounded-3xl p-4 sm:p-5 flex flex-col',
          isCompleted
            ? 'bg-[#f4f6fa]/60 border-emerald-200/60'
            : 'bg-white border-zinc-200/80 hover:border-zinc-300 shadow-xs hover:shadow-md'
        )}
      >
        {lockedNotice && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-black text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg border border-white/20 whitespace-nowrap">
            {lockedNotice}
          </div>
        )}

        {/* -------------------- GRID VIEW (COMPACT 2-COLUMN TILE) -------------------- */}
        {variant === 'grid' ? (
          <>
            <div>
              {/* TOP ROW: CATEGORY ICON + PRIORITY + OPTIONS MENU */}
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200/60 shadow-2xs">
                  <CategoryIcon size={16} strokeWidth={2.2} />
                </div>

                <div className="flex items-center gap-1">
                  <span className={clsx('inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold', priorityBg)}>
                    <Flag size={9} className="fill-current" />
                    {priorityLabel}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOptionsMenuOpen(true);
                    }}
                    className="w-7 h-7 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-800 flex items-center justify-center transition-colors shrink-0"
                    title="Habit Options"
                  >
                    <MoreVertical size={14} />
                  </button>
                </div>
              </div>

              {/* TITLE */}
              <h3
                className={clsx(
                  'font-display font-bold text-xs sm:text-sm text-zinc-900 tracking-tight line-clamp-2 leading-snug mb-2 min-h-[2rem]',
                  isCompleted && 'line-through text-zinc-400'
                )}
                title={habit.name}
              >
                {habit.name}
              </h3>
            </div>

            <div>
              {/* PROGRESS BAR */}
              <div className="w-full bg-zinc-100 rounded-full h-1.5 mb-2.5 overflow-hidden p-0.5 border border-zinc-200/40">
                <div
                  className={clsx(
                    'h-full rounded-full transition-all duration-500',
                    isCompleted ? 'bg-emerald-500' : progressPercent > 50 ? 'bg-[#cbbafd]' : 'bg-amber-300'
                  )}
                  style={{ width: `${Math.max(5, progressPercent)}%` }}
                />
              </div>

              {/* BOTTOM ROW: STREAK PILL + CHECK BUTTON */}
              <div className="flex items-center justify-between gap-1.5 pt-0.5">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 text-[10px] font-bold shrink-0">
                  <Flame size={11} className="text-amber-500 fill-amber-500" />
                  <span>{currentStreak > 0 ? `${currentStreak}d` : 'Day 1'}</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleYesNo();
                  }}
                  className={clsx(
                    'w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-xs shrink-0',
                    isCompleted
                      ? 'bg-emerald-500 text-white cursor-default'
                      : 'bg-zinc-900 text-white hover:bg-zinc-700 active:scale-90'
                  )}
                  title={isCompleted ? 'Done' : 'Mark done'}
                >
                  <Check size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* -------------------- LIST VIEW (RICH HORIZONTAL ROW) -------------------- */
          <>
            {/* TOP ROW: CATEGORY ICON + TITLE + ACTIONS */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200/60 shadow-2xs">
                  <CategoryIcon size={18} strokeWidth={2.2} />
                </div>
                <h3 className={clsx('font-display font-bold text-base text-zinc-900 tracking-tight truncate', isCompleted && 'line-through text-zinc-400')}>
                  {habit.name}
                </h3>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDetails(habit);
                  }}
                  className="w-8 h-8 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-800 flex items-center justify-center transition-colors shrink-0"
                  title="Edit Habit"
                >
                  <Edit2 size={15} />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOptionsMenuOpen(true);
                  }}
                  className="w-8 h-8 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-800 flex items-center justify-center transition-colors shrink-0"
                  title="Habit Options (Hold card to open)"
                >
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>

            {/* TAGS ROW: ONGOING STATUS + PRIORITY BADGE */}
            <div className="flex items-center gap-2 mb-3.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-600 text-xs font-semibold">
                <span className={clsx('w-1.5 h-1.5 rounded-full', isCompleted ? 'bg-emerald-500' : 'bg-amber-500')} />
                {isCompleted ? 'Completed' : 'Ongoing'}
              </span>

              <span className={clsx('inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold', priorityBg)}>
                <Flag size={11} className="fill-current" />
                {priorityLabel}
              </span>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-100 text-zinc-600 text-xs font-medium">
                {category?.name || 'General'}
              </span>
            </div>

            {/* PROGRESS BAR */}
            <div className="w-full bg-zinc-100 rounded-full h-2 mb-4 overflow-hidden p-0.5 border border-zinc-200/40">
              <div
                className={clsx(
                  'h-full rounded-full transition-all duration-500',
                  isCompleted ? 'bg-emerald-500' : progressPercent > 50 ? 'bg-[#cbbafd]' : 'bg-amber-300'
                )}
                style={{ width: `${Math.max(5, progressPercent)}%` }}
              />
            </div>

            {/* FOOTER ROW: STREAK BADGE + DATE + CHECK ACTION */}
            <div className="flex items-center justify-between gap-3 pt-1">
              {/* Dynamic Streak Badge (Replaced dummy avatars) */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 text-xs font-bold shrink-0">
                <Flame size={13} className="text-amber-500 fill-amber-500" />
                <span>{currentStreak > 0 ? `${currentStreak}d Streak` : 'Day 1'}</span>
              </div>

              {/* Right side: Date + Action */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-100 text-zinc-600 text-xs font-medium">
                  <Calendar size={13} />
                  <span>{format(parseISO(dateKey), 'dd MMMM')}</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleYesNo();
                  }}
                  className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-xs shrink-0',
                    isCompleted
                      ? 'bg-emerald-500 text-white cursor-default'
                      : 'bg-zinc-900 text-white hover:bg-zinc-700 active:scale-95'
                  )}
                  title={isCompleted ? 'Done' : 'Mark done'}
                >
                  <Check size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* -------------------- HABIT HOLD ACTIONS MODAL -------------------- */}
      <Modal
        isOpen={isOptionsMenuOpen}
        onClose={() => setIsOptionsMenuOpen(false)}
        title="Habit Actions"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-2xl border border-zinc-200/60">
            <div className="w-10 h-10 rounded-xl bg-white text-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200/80 shadow-2xs">
              <CategoryIcon size={20} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-display font-bold text-sm text-zinc-900 truncate">
                {habit.name}
              </h4>
              <p className="text-xs text-zinc-500">
                {category?.name || 'Habit'} · {currentStreak > 0 ? `${currentStreak}d Streak` : 'Day 1'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleDuplicate}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-50 hover:bg-zinc-100 text-zinc-800 font-semibold text-sm transition-colors text-left border border-zinc-200/50"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <Copy size={16} />
              </div>
              <div className="flex-1">
                <span className="block font-bold">Duplicate Habit</span>
                <span className="block text-xs text-zinc-500 font-normal">
                  Create a copy with same schedule & tracking rules
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOptionsMenuOpen(false);
                onOpenDetails(habit);
              }}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-50 hover:bg-zinc-100 text-zinc-800 font-semibold text-sm transition-colors text-left border border-zinc-200/50"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Edit2 size={16} />
              </div>
              <div className="flex-1">
                <span className="block font-bold">Edit Habit Details</span>
                <span className="block text-xs text-zinc-500 font-normal">
                  Modify title, reminders, and target frequency
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleArchive}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-50 hover:bg-zinc-100 text-zinc-800 font-semibold text-sm transition-colors text-left border border-zinc-200/50"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Archive size={16} />
              </div>
              <div className="flex-1">
                <span className="block font-bold">
                  {habit.isArchived ? 'Unarchive Habit' : 'Archive Habit'}
                </span>
                <span className="block text-xs text-zinc-500 font-normal">
                  {habit.isArchived
                    ? 'Restore habit to active dashboard'
                    : 'Hide from dashboard while preserving streak logs'}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleDeleteRequest}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-sm transition-colors text-left border border-rose-200/50"
            >
              <div className="w-8 h-8 rounded-xl bg-rose-200 text-rose-800 flex items-center justify-center shrink-0">
                <Trash2 size={16} />
              </div>
              <div className="flex-1">
                <span className="block font-bold">Delete Habit</span>
                <span className="block text-xs text-rose-600 font-normal">
                  Permanently remove this habit and all history
                </span>
              </div>
            </button>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsOptionsMenuOpen(false)}
          >
            Cancel
          </Button>
        </div>
      </Modal>

      {/* -------------------- CONFIRM DELETE MODAL -------------------- */}
      <Modal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        title="Delete Habit"
      >
        <div className="space-y-4">
          <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-rose-800 flex items-start gap-3">
            <AlertTriangle size={20} className="shrink-0 text-rose-600 mt-0.5" />
            <p className="text-sm">
              Are you sure you want to permanently delete <strong>{habit.name}</strong>? This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsConfirmDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* -------------------- SECURITY GUARD MODAL -------------------- */}
      {isSecurityModalOpen && (
        <SecurityModal
          isOpen={isSecurityModalOpen}
          onClose={() => setIsSecurityModalOpen(false)}
          onSuccess={handleSecuritySuccess}
          title="Security Authorization Required"
          actionTitle={`Delete Habit: ${habit.name}`}
          isDanger
        />
      )}
    </>
  );
};
