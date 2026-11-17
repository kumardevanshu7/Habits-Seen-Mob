import React, { useState } from 'react';
import { Home, Calendar, BarChart2, Plus, User, ShieldAlert, Sparkles, Flame } from 'lucide-react';
import clsx from 'clsx';
import { ProfileModal } from '../profile/ProfileModal';

interface BottomNavProps {
  activeTab: 'habits' | 'challenges' | 'tracking' | 'breaks' | 'analytics';
  onSelectTab: (tab: 'habits' | 'challenges' | 'tracking' | 'breaks' | 'analytics') => void;
  onOpenCreateHabit: () => void;
  onOpenProfile?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenCreateHabit,
  onOpenProfile,
}) => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleOpenProfile = () => {
    if (onOpenProfile) {
      onOpenProfile();
    } else {
      setIsProfileModalOpen(true);
    }
  };

  return (
    <>
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-[#111115] text-white rounded-2xl px-3 py-2 flex items-center gap-1.5 shadow-2xl border border-white/10 safe-bottom"
      >
        {/* 1. Habits (Home) */}
        <button
          type="button"
          aria-label="Habits View"
          aria-current={activeTab === 'habits' ? 'page' : undefined}
          onClick={() => onSelectTab('habits')}
          className={clsx(
            'p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer',
            activeTab === 'habits'
              ? 'bg-white text-black shadow-md scale-105'
              : 'text-zinc-400 hover:text-white hover:bg-white/10'
          )}
          title="Habits Home"
        >
          <Home size={19} strokeWidth={activeTab === 'habits' ? 2.5 : 2} />
        </button>

        {/* 2. Challenges / Calendar */}
        <button
          type="button"
          aria-label="Challenges View"
          aria-current={activeTab === 'challenges' ? 'page' : undefined}
          onClick={() => onSelectTab('challenges')}
          className={clsx(
            'p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer',
            activeTab === 'challenges'
              ? 'bg-white text-black shadow-md scale-105'
              : 'text-zinc-400 hover:text-white hover:bg-white/10'
          )}
          title="Challenges"
        >
          <Calendar size={19} strokeWidth={activeTab === 'challenges' ? 2.5 : 2} />
        </button>

        {/* 3. Analytics / Charts */}
        <button
          type="button"
          aria-label="Analytics View"
          aria-current={activeTab === 'analytics' ? 'page' : undefined}
          onClick={() => onSelectTab('analytics')}
          className={clsx(
            'p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer',
            activeTab === 'analytics'
              ? 'bg-white text-black shadow-md scale-105'
              : 'text-zinc-400 hover:text-white hover:bg-white/10'
          )}
          title="Analytics"
        >
          <BarChart2 size={19} strokeWidth={activeTab === 'analytics' ? 2.5 : 2} />
        </button>

        {/* 4. Profile */}
        <button
          type="button"
          aria-label="User Profile"
          onClick={handleOpenProfile}
          className={clsx(
            'p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer text-zinc-400 hover:text-white hover:bg-white/10'
          )}
          title="Profile"
        >
          <User size={19} strokeWidth={2} />
        </button>

        {/* 5. Quit Breaks / Shield */}
        <button
          type="button"
          aria-label="Timer Habit Break Hub"
          aria-current={activeTab === 'breaks' ? 'page' : undefined}
          onClick={() => onSelectTab('breaks')}
          className={clsx(
            'p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer',
            activeTab === 'breaks'
              ? 'bg-white text-black shadow-md scale-105'
              : 'text-zinc-400 hover:text-white hover:bg-white/10'
          )}
          title="Quit Breaks"
        >
          <ShieldAlert size={19} strokeWidth={activeTab === 'breaks' ? 2.5 : 2} />
        </button>

        {/* DIVIDER */}
        <div className="w-px h-5 bg-white/20 mx-0.5" />

        {/* 6. CENTER ADD ACTION BUTTON */}
        <button
          type="button"
          aria-label="Add Habit"
          onClick={onOpenCreateHabit}
          className="p-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white hover:text-black transition-all duration-200 flex items-center justify-center cursor-pointer active:scale-95"
          title="Add Habit"
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </nav>

      {/* Profile Modal Fallback */}
      {!onOpenProfile && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}
    </>
  );
};
