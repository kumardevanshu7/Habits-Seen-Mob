import React, { useState } from 'react';
import { Habit } from '../../types/habit';
import { useAppStore } from '../../stores/useAppStore';
import { CATEGORY_ICONS } from '../../constants/iconsAndColors';
import { hasSecurityGuard } from '../../utils/cryptoUtils';
import {
  MoreVertical,
  Edit2,
  Copy,
  Archive,
  Trash2,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { SecurityModal } from '../security/SecurityModal';

export interface HabitActionsModalProps {
  habit: Habit;
  subtitle: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenDetails: (habit: Habit) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export { MoreVertical };

/** Shared habit actions, confirmation, and security guard modals for habit cards. */
export const HabitActionsModal: React.FC<HabitActionsModalProps> = ({
  habit,
  subtitle,
  isOpen,
  onClose,
  onOpenDetails,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}) => {
  const { categories, addHabit, toggleArchiveHabit, deleteHabit, user } = useAppStore();
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  const category = categories.find((c) => c.id === habit.categoryId);
  const CategoryIcon =
    CATEGORY_ICONS.find((i) => i.id === category?.icon)?.icon || CATEGORY_ICONS[0].icon;

  const handleDuplicate = async () => {
    try {
      const { id, createdAt, updatedAt, stats, ...habitData } = habit;
      await addHabit({
        ...habitData,
        name: `${habit.name} (Copy)`,
      });
      confetti({ particleCount: 35, spread: 55, origin: { y: 0.7 } });
      onClose();
    } catch (err) {
      console.error('Failed to duplicate habit', err);
    }
  };

  const handleArchive = async () => {
    try {
      await toggleArchiveHabit(habit.id);
      onClose();
    } catch (err) {
      console.error('Failed to archive habit', err);
    }
  };

  const handleDeleteRequest = () => {
    onClose();
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

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Habit Actions">
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
                {category?.name || 'Habit'} · {subtitle}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {onMoveUp && !isFirst && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onMoveUp();
                }}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-50 hover:bg-zinc-100 text-zinc-800 font-semibold text-sm transition-colors text-left border border-zinc-200/50"
              >
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                  <ArrowUp size={16} />
                </div>
                <div className="flex-1">
                  <span className="block font-bold">Move Up</span>
                  <span className="block text-xs text-zinc-500 font-normal">
                    Shift habit higher in your daily order
                  </span>
                </div>
              </button>
            )}

            {onMoveDown && !isLast && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onMoveDown();
                }}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-50 hover:bg-zinc-100 text-zinc-800 font-semibold text-sm transition-colors text-left border border-zinc-200/50"
              >
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                  <ArrowDown size={16} />
                </div>
                <div className="flex-1">
                  <span className="block font-bold">Move Down</span>
                  <span className="block text-xs text-zinc-500 font-normal">
                    Shift habit lower in your daily order
                  </span>
                </div>
              </button>
            )}

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
                onClose();
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

          <Button variant="outline" className="w-full" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        title="Delete Habit"
      >
        <div className="space-y-4">
          <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-rose-800 flex items-start gap-3">
            <AlertTriangle size={20} className="shrink-0 text-rose-600 mt-0.5" />
            <p className="text-sm">
              Are you sure you want to permanently delete <strong>{habit.name}</strong>? This action
              cannot be undone.
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
            <Button variant="danger" className="flex-1" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

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
