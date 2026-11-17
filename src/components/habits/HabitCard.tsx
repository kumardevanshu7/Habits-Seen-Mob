import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Habit, HabitLog } from '../../types/habit';
import { useAppStore } from '../../stores/useAppStore';
import { CATEGORY_ICONS } from '../../constants/iconsAndColors';
import { boostVibrancy, getContrastIconColor } from '../../utils/colorUtils';
import {
  formatSecondsToHMS,
  parseHMSToSeconds,
  isDateInThisWeek,
  isDateInThisMonth,
  getTodayKey,
} from '../../utils/dateMath';
import {
  format,
  parseISO,
  startOfWeek,
  addDays,
  isValid,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
} from 'date-fns';
import { useTodayKey } from '../../hooks/useTodayKey';
import { hasSecurityGuard } from '../../utils/cryptoUtils';
import {
  Check,
  Flame,
  Minus,
  Plus,
  Star,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Lock,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  MoreVertical,
  Flag,
  Calendar,
  MessageSquare,
  Edit2,
  CheckCircle2,
} from 'lucide-react';
import clsx from 'clsx';
import confetti from 'canvas-confetti';
import { computeHabitStreaks } from '../../utils/streakEngine';
import { getFlameTier } from '../../constants/gamification';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
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

  const isJustTracking = habit.frequency?.type === 'JUST_TRACKING';

  const category = categories.find((c) => c.id === habit.categoryId);
  const CategoryIcon =
    CATEGORY_ICONS.find((i) => i.id === category?.icon)?.icon || CATEGORY_ICONS[0].icon;

  const logKey = `${habit.id}_${dateKey}`;
  const dayLog = logs[logKey];
  const isCompleted = dayLog?.status === 'COMPLETED';
  const isSkipped = dayLog?.status === 'SKIPPED';
  const isExcused = dayLog?.status === 'EXCUSED';
  const isMissed = dayLog?.status === 'MISSED' || dayLog?.status === 'FAILED';

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

  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [duplicateName, setDuplicateName] = useState('');

  // State for Numeric Value
  const [currentNum, setCurrentNum] = useState<number>(dayLog?.valueNumeric ?? 0);

  // State for Timer Logging
  const targetSeconds = habit.config.timer?.targetSeconds || 1500;
  const currentLoggedSeconds = dayLog?.valueTimerSeconds ?? 0;

  // Sync state when dayLog changes
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

  // NUMERIC HANDLER
  const handleToggleNumericComplete = () => {
    if (isDateLocked) {
      showLockedNotice();
      return;
    }
    if (isCompleted) {
      showCompletedLockedNotice();
      return;
    }
    const goal = habit.config.numeric?.goal || 1;
    const finalVal = currentNum > 0 ? currentNum : goal;
    setCurrentNum(finalVal);
    confetti({ particleCount: 45, spread: 60, origin: { y: 0.7 } });
    logHabit(habit.id, dateKey, {
      valueNumeric: finalVal,
      forceStatus: 'COMPLETED',
    });
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
  const priorityBg = priorityLabel === 'High' ? 'bg-[#e0d7ff] text-[#18181b]' : priorityLabel === 'Medium' ? 'bg-[#fde68a] text-[#18181b]' : 'bg-[#d2f1e4] text-[#18181b]';

  return (
    <div
      onClick={() => onOpenDetails(habit)}
      className={clsx(
        'group relative rounded-3xl p-4 sm:p-5 transition-all duration-200 border cursor-pointer select-none',
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

      {/* TOP ROW: CATEGORY ICON + TITLE + EDIT BUTTON */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200/60 shadow-2xs">
            <CategoryIcon size={18} strokeWidth={2.2} />
          </div>
          <h3 className={clsx('font-display font-bold text-base text-zinc-900 tracking-tight truncate', isCompleted && 'line-through text-zinc-400')}>
            {habit.name}
          </h3>
        </div>

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
      </div>

      {/* PROGRESS BAR (SLEEK ROUNDED PILL MATCHING MOCKUP) */}
      <div className="w-full bg-zinc-100 rounded-full h-2 mb-4 overflow-hidden p-0.5 border border-zinc-200/40">
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-500',
            isCompleted ? 'bg-emerald-500' : progressPercent > 50 ? 'bg-[#cbbafd]' : 'bg-amber-300'
          )}
          style={{ width: `${Math.max(5, progressPercent)}%` }}
        />
      </div>

      {/* FOOTER ROW: AVATARS + DATE + COMMENT COUNT + CHECK ACTION */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {/* Avatars */}
        <div className="flex items-center -space-x-2 shrink-0">
          <div className="w-7 h-7 rounded-full bg-rose-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-rose-800">
            {user?.onboarding?.name?.[0] || 'E'}
          </div>
          <div className="w-7 h-7 rounded-full bg-amber-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-amber-800">
            A
          </div>
          <div className="w-7 h-7 rounded-full bg-purple-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-purple-800">
            M
          </div>
          <span className="text-[11px] font-semibold text-zinc-500 ml-3">
            +{currentStreak > 0 ? currentStreak : 3}
          </span>
        </div>

        {/* Right side: Date + Action */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-100 text-zinc-600 text-xs font-medium">
            <Calendar size={13} />
            <span>{format(parseISO(dateKey), 'dd MMMM')}</span>
          </div>

          {/* Action Check Button */}
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
    </div>
  );
};
