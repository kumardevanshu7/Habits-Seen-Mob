import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { Button } from '../ui/Button';
import { logOut } from '../../services/firebase';
import { Plus, Bell, Search, Heart, Zap, Flame, CheckSquare, Clock, BarChart2, Info, Sparkles, User as UserIcon, Play } from 'lucide-react';
import clsx from 'clsx';
import { PointsSystemModal } from './PointsSystemModal';
import { ProfileModal } from '../profile/ProfileModal';
import { GAME_RULES } from '../../constants/gamification';
import { isChallengeActive } from '../../utils/challengeState';

interface NavbarProps {
  activeTab: 'habits' | 'challenges' | 'tracking' | 'breaks' | 'analytics';
  onSelectTab: (tab: 'habits' | 'challenges' | 'tracking' | 'breaks' | 'analytics') => void;
  onOpenCreateHabit: () => void;
  onOpenProfile?: () => void;
  onOpenReels?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenCreateHabit,
  onOpenProfile,
  onOpenReels,
}) => {
  const { user, currentUser, challenges } = useAppStore();
  const [isPointsInfoOpen, setIsPointsInfoOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleOpenProfile = () => {
    if (onOpenProfile) {
      onOpenProfile();
    } else {
      setIsProfileModalOpen(true);
    }
  };

  const hearts = user?.gamification?.hearts ?? 5;
  const maxHearts = user?.gamification?.maxHearts ?? 5;
  const totalXp = user?.gamification?.totalXp ?? 0;
  const userName = user?.onboarding?.name || currentUser?.displayName || 'Esther Howard';
  const avatarUrl = user?.avatarUrl || currentUser?.photoURL;
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  useEffect(() => {
    setAvatarLoadError(false);
  }, [avatarUrl]);

  const userInitials = userName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  return (
    <>
      <header className="sticky top-0 z-40 bg-canvas/90 backdrop-blur-md safe-top pt-3 sm:pt-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          {/* LEFT: USER PROFILE AVATAR + NAME (MATCHING FIGMA TOP LEFT) */}
          <button
            type="button"
            onClick={handleOpenProfile}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity cursor-pointer text-left"
          >
            {avatarUrl && !avatarLoadError ? (
              <img
                src={avatarUrl}
                alt={userName}
                referrerPolicy="no-referrer"
                onError={() => setAvatarLoadError(true)}
                className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-200 to-rose-200 text-ink flex items-center justify-center font-display font-bold text-sm border-2 border-white shadow-sm shrink-0">
                {userInitials || <UserIcon size={20} className="text-zinc-700" />}
              </div>
            )}
            <div>
              <h2 className="font-display font-bold text-base sm:text-lg text-ink tracking-tight">
                {userName}
              </h2>
              <div className="flex items-center gap-2 text-xs text-charcoal">
                <span className="flex items-center gap-1 font-semibold text-rose-500">
                  <Heart size={12} className="fill-rose-500" /> {hearts}/{maxHearts}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-semibold text-amber-600">
                  <Zap size={12} className="fill-amber-500" /> {totalXp} XP
                </span>
              </div>
            </div>
          </button>

          {/* RIGHT: NOTIFICATION BELL + SEARCH BUTTON + ADD HABIT CTA */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Motivational Reels (47 Videos) Button */}
            {onOpenReels && (
              <button
                type="button"
                onClick={onOpenReels}
                className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 via-primary to-amber-500 p-[1.5px] shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer group"
                title="Watch Motivational Reels (47 Videos)"
              >
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-primary group-hover:bg-rose-50 transition-colors">
                  <Play size={14} className="fill-primary translate-x-0.5" />
                </div>
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-mono text-[9px] font-black shadow-xs animate-pulse">
                  47
                </span>
              </button>
            )}

            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => setIsPointsInfoOpen(true)}
              className="relative w-10 h-10 rounded-full bg-white flex items-center justify-center text-zinc-700 hover:bg-zinc-100 shadow-2xs border border-hairline transition-all active:scale-95"
              title="Notifications & Game Guide"
            >
              <Bell size={18} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

            {/* Search Icon */}
            <button
              type="button"
              onClick={() => onSelectTab('analytics')}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-zinc-700 hover:bg-zinc-100 shadow-2xs border border-hairline transition-all active:scale-95"
              title="Search & Analytics"
            >
              <Search size={18} />
            </button>

            {/* Desktop Add Button */}
            <Button
              onClick={onOpenCreateHabit}
              variant="primary"
              size="md"
              className="hidden sm:flex gap-1.5 text-xs sm:text-sm bg-black text-white hover:bg-zinc-800 rounded-full px-5 py-2.5"
            >
              <Plus size={16} /> <span>New Habit</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Points & Rules Info Modal */}
      <PointsSystemModal
        isOpen={isPointsInfoOpen}
        onClose={() => setIsPointsInfoOpen(false)}
      />

      {/* Fallback Profile Modal */}
      {!onOpenProfile && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}
    </>
  );
};
