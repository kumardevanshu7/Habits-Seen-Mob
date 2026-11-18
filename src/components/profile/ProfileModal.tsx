import React, { useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CustomSelect } from '../ui/CustomSelect';
import { logOut } from '../../services/firebase';
import {
  Heart,
  Zap,
  Award,
  LogOut,
  Shield,
  User,
  Lock,
  KeyRound,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Skull,
  Download,
  RefreshCw,
  Sparkles,
  ArrowUpCircle,
  MessageSquarePlus,
  ExternalLink,
} from 'lucide-react';
import { APP_CONFIG } from '../../constants/appConfig';
import { SecurityModal } from '../security/SecurityModal';
import { getNextHeartsUpgrade, GAME_RULES } from '../../constants/gamification';
import { verifySecurityAnswer, normalizeSecurityAnswer } from '../../utils/cryptoUtils';
import clsx from 'clsx';
import {
  checkForAppUpdate,
  downloadLiveUpdate,
  restartApp,
  CURRENT_APP_VERSION,
  GITHUB_REPO,
  AppReleaseInfo,
} from '../../services/updateService';

import { Trophy, ChevronRight, RotateCcw, ArrowDownCircle } from 'lucide-react';
import { BrandLegalTab } from '../brand/BrandLegalModal';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAchievements?: () => void;
  onOpenBrandLegal?: (tab: BrandLegalTab) => void;
}

const PRESET_QUESTIONS = [
  'What was the name of your first school?',
  "What is your mother's maiden name?",
  'What was the name of your first pet?',
  'What city were you born in?',
  'What is your favorite book or movie?',
  'Custom Question...',
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenAchievements,
  onOpenBrandLegal,
}) => {
  const { user, currentUser, habits, setSecurityQuestion, resetEntireAccount } =
    useAppStore();

  const [isEditingSecurity, setIsEditingSecurity] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(PRESET_QUESTIONS[0]);
  const [customQuestion, setCustomQuestion] = useState('');
  const [previousAnswerInput, setPreviousAnswerInput] = useState('');
  const [answerInput, setAnswerInput] = useState('');
  const [showPasswordToggle, setShowPasswordToggle] = useState(false);
  const [securitySuccessMsg, setSecuritySuccessMsg] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);

  // Danger Zone Reset State
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);

  // In-App Updates from GitHub Releases & Live OTA
  const [updateStatus, setUpdateStatus] = useState<
    'idle' | 'checking' | 'available' | 'downloading' | 'ready-to-restart' | 'latest' | 'error'
  >('idle');
  const [updateInfo, setUpdateInfo] = useState<AppReleaseInfo | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [isRestartModalOpen, setIsRestartModalOpen] = useState<boolean>(false);

  const handleCheckForUpdates = async () => {
    setUpdateStatus('checking');
    setUpdateError(null);
    try {
      const release = await checkForAppUpdate();
      setUpdateInfo(release);
      if (release.hasUpdate) {
        setUpdateStatus('available');
      } else {
        setUpdateStatus('latest');
      }
    } catch (err: any) {
      setUpdateStatus('error');
      setUpdateError(err?.message || 'Could not connect to GitHub. Please check internet connection.');
    }
  };

  const handleStartLiveDownload = async () => {
    if (!updateInfo) return;

    if (!updateInfo.bundleUrl) {
      if (updateInfo.apkDownloadUrl) {
        window.open(updateInfo.apkDownloadUrl, '_system');
      } else {
        window.open(`https://github.com/${GITHUB_REPO}/releases`, '_system');
      }
      return;
    }

    setUpdateStatus('downloading');
    setDownloadProgress(0);
    setUpdateError(null);

    const res = await downloadLiveUpdate(
      updateInfo.bundleUrl,
      updateInfo.version,
      (percent) => {
        setDownloadProgress(percent);
      }
    );

    if (res.success) {
      setUpdateStatus('ready-to-restart');
      setIsRestartModalOpen(true);
    } else {
      setUpdateStatus('available');
      setUpdateError(res.error || 'Live bundle update failed. You can still download the full APK.');
    }
  };

  const handleRestartNow = async () => {
    await restartApp();
  };

  const handleDownloadFullApk = () => {
    if (!updateInfo?.apkDownloadUrl) return;
    window.open(updateInfo.apkDownloadUrl, '_system');
  };

  if (!user || !currentUser) return null;

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      onClose();
      await logOut();
    }
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError('');
    setSecuritySuccessMsg('');

    // If an existing security question/password is set, MUST verify previous answer first
    if (user.security && (user.security.answerHash || user.security.answer)) {
      if (!previousAnswerInput.trim()) {
        setSecurityError('Please enter your previous secret answer / password to verify identity');
        return;
      }
      let isValid = false;
      const normalizedPreviousInput = normalizeSecurityAnswer(previousAnswerInput);
      if (user.security.answerHash && user.security.salt) {
        isValid = await verifySecurityAnswer(
          normalizedPreviousInput,
          user.security.answerHash,
          user.security.salt
        );
      } else if (user.security.answer) {
        isValid =
          normalizedPreviousInput ===
          normalizeSecurityAnswer(user.security.answer);
      }

      if (!isValid) {
        setSecurityError(
          'Incorrect previous secret answer / password. Security check failed.'
        );
        return;
      }
    }

    const finalQuestion =
      selectedPreset === 'Custom Question...'
        ? customQuestion.trim()
        : selectedPreset;

    if (!finalQuestion) {
      setSecurityError('Please select or write a security question');
      return;
    }

    if (!answerInput.trim() || answerInput.trim().length < 2) {
      setSecurityError('New answer must be at least 2 characters long');
      return;
    }

    setIsSavingSecurity(true);
    try {
      await setSecurityQuestion(finalQuestion, normalizeSecurityAnswer(answerInput));
      setSecuritySuccessMsg('Security question & password updated successfully!');
      setIsEditingSecurity(false);
      setPreviousAnswerInput('');
      setAnswerInput('');
      setCustomQuestion('');
    } catch (err: any) {
      setSecurityError(err.message || 'Failed to save security question');
    } finally {
      setIsSavingSecurity(false);
    }
  };

  const handleExecuteReset = async () => {
    await resetEntireAccount();
    setIsConfirmResetOpen(false);
    onClose();
  };

  const hearts = user.gamification?.hearts ?? 5;
  const maxHearts = user.gamification?.maxHearts ?? 5;
  const totalXp = user.gamification?.totalXp ?? 0;
  const heartsUpgrade = getNextHeartsUpgrade(totalXp);
  const levelTitle = user.gamification?.levelTitle ?? GAME_RULES.DEFAULT_LEVEL_TITLE;
  const existingSecurity = user.security;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Discipline Profile & Settings"
        subtitle="Your vitality, willpower rank, security guard, and account controls"
        maxWidth="md"
      >
        <div className="space-y-5 pt-1">
          {/* USER CARD */}
          <div className="p-4 bg-surface-bone rounded-2xl border border-hairline flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
              <User size={24} />
            </div>
            <div className="truncate flex-1">
              <h4 className="font-display font-bold text-ink text-base truncate">
                {user.name || 'Discipline Seeker'}
              </h4>
              <p className="text-xs text-charcoal truncate">
                {currentUser.email || 'Cloud Firestore User'}
              </p>
            </div>
          </div>

          {/* QUICK LINKS: ACHIEVEMENTS & EXPLORE ARIGATO LABS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {onOpenAchievements && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAchievements();
                }}
                className="flex items-center justify-between p-3 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-300/70 rounded-xl transition-all text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Trophy size={16} />
                  </div>
                  <div>
                    <span className="font-display font-bold text-xs text-ink block">
                      100 Achievements
                    </span>
                    <span className="text-[10px] text-amber-800 font-medium">
                      Trophy Hall & Progress
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-amber-700 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            {onOpenBrandLegal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBrandLegal('explore');
                }}
                className="flex items-center justify-between p-3 bg-surface-card hover:bg-surface-bone border border-hairline rounded-xl transition-all text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-surface-bone border border-hairline flex items-center justify-center shrink-0">
                    <img
                      src="/arigato-single-logo.png"
                      alt="Arigato Labs"
                      className="w-4 h-4 object-contain"
                    />
                  </div>
                  <div>
                    <span className="font-display font-bold text-xs text-ink block">
                      Arigato Labs
                    </span>
                    <span className="text-[10px] text-stone font-medium">
                      Explore Company & Legal
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-stone group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>

          {/* VITALITY & WILLPOWER STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Hearts / Health */}
            <div className="p-4 bg-surface-card rounded-2xl border border-red-200/80 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-charcoal">
                <span className="font-bold">Vitality (Hearts)</span>
                <Heart size={16} className="text-red-500 fill-red-500" />
              </div>
              <div className="flex items-baseline justify-between gap-1">
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-2xl font-black text-red-600">{hearts}</span>
                  <span className="text-xs font-medium text-charcoal">/ {maxHearts}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                  {Math.round((hearts / Math.max(1, maxHearts)) * 100)}%
                </span>
              </div>

              {/* Health Bar */}
              <div className="w-full bg-red-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-red-500 to-rose-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, (hearts / Math.max(1, maxHearts)) * 100))}%` }}
                />
              </div>

              {/* Scaled Vitality Hearts (5-heart clean meter, never congested) */}
              <div className="flex items-center justify-between gap-2 px-3 py-2 bg-red-50/80 rounded-xl border border-red-100">
                <div className="flex items-center gap-1.5 shrink-0">
                  {[0, 1, 2, 3, 4].map((step) => {
                    const threshold = (step + 1) / 5;
                    const prevThreshold = step / 5;
                    const ratio = hearts / Math.max(1, maxHearts);
                    const isFull = ratio >= threshold;
                    const isPartial = ratio > prevThreshold && ratio < threshold;
                    return (
                      <Heart
                        key={step}
                        size={17}
                        className={`transition-all duration-300 ${
                          isFull
                            ? 'text-red-500 fill-red-500 drop-shadow-xs'
                            : isPartial
                            ? 'text-red-400 fill-red-200'
                            : 'text-stone/30 fill-stone/10'
                        }`}
                      />
                    );
                  })}
                </div>
                <span className="text-xs font-bold text-red-700 font-mono tracking-tight shrink-0 whitespace-nowrap">
                  {hearts} / {maxHearts} Lives
                </span>
              </div>

              {/* Next Milestone info */}
              <div className="pt-2 border-t border-hairline/60 text-[11px] space-y-1.5">
                {heartsUpgrade.nextThreshold ? (
                  <div className="text-red-700 font-semibold flex items-center justify-between gap-2 flex-wrap">
                    <span>Next: +5 Lives</span>
                    <span className="font-mono font-bold">{heartsUpgrade.xpNeeded} XP to {heartsUpgrade.nextThreshold} XP</span>
                  </div>
                ) : (
                  <p className="text-emerald-700 font-bold">Max 50 Lives Unlocked! 🛡️</p>
                )}
                <p className="text-charcoal leading-snug">
                  <span className="text-red-600 font-bold">⚠️ Sudden Death:</span> 0 lives triggers a 10s countdown to full fresh start wipe.
                </p>
              </div>
            </div>

            {/* Willpower XP */}
            <div className="p-4 bg-surface-card rounded-2xl border border-amber-200/80 shadow-2xs space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-charcoal mb-1">
                  <span className="font-bold">Willpower XP</span>
                  <Zap size={16} className="text-amber-500 fill-amber-500" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-2xl font-black text-amber-600">{totalXp}</span>
                  <span className="text-xs font-medium text-charcoal">XP</span>
                </div>
                <div className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-700 text-[11px] font-bold px-2.5 py-1 rounded-full mt-2">
                  <Award size={13} /> {levelTitle}
                </div>
              </div>

              <div className="pt-2 border-t border-hairline/60 text-[11px] text-charcoal">
                <p className="leading-snug">
                  <strong>100% Perfect Days</strong> award <span className="font-mono font-bold text-amber-600">+100</span> bonus Willpower XP.
                </p>
              </div>
            </div>
          </div>

          {/* SECURITY QUESTION SETTINGS */}
          <div className="p-4 bg-surface-card rounded-2xl border border-hairline space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound size={17} className="text-primary" />
                <h4 className="font-display font-bold text-sm text-ink">
                  Security Guard & Question
                </h4>
              </div>

              {existingSecurity ? (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 size={12} /> Active
                </span>
              ) : (
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle size={12} /> Not Configured
                </span>
              )}
            </div>

            <p className="text-xs text-charcoal leading-relaxed">
              Required to edit tasks, delete habits, and authorize complete application data resets.
            </p>

            {securitySuccessMsg && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-1.5">
                <CheckCircle2 size={14} /> {securitySuccessMsg}
              </div>
            )}

            {!isEditingSecurity ? (
              <div className="pt-1 flex items-center justify-between gap-2">
                {existingSecurity ? (
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] text-charcoal block">Current Question:</span>
                    <p className="text-xs font-bold text-ink truncate">
                      "{existingSecurity.question}"
                    </p>
                  </div>
                ) : (
                  <span className="text-xs text-stone italic">No question set yet</span>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditingSecurity(true);
                    setPreviousAnswerInput('');
                    setAnswerInput('');
                    setCustomQuestion('');
                    setSecuritySuccessMsg('');
                    setSecurityError('');
                  }}
                >
                  {existingSecurity ? 'Change Question & Password' : 'Set Question Now'}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSaveSecurity} className="space-y-3.5 pt-2">
                {securityError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertTriangle size={15} className="shrink-0 text-red-600" />
                    <span>{securityError}</span>
                  </div>
                )}

                {/* CURRENT / PREVIOUS PASSWORD VERIFICATION (REQUIRED IF ALREADY CONFIGURED) */}
                {existingSecurity && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-1.5 text-amber-900 font-semibold text-xs">
                      <Lock size={13} className="text-amber-600" />
                      <span>Security Verification</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-snug">
                      Enter your current secret answer / password to verify authorization before changing credentials.
                    </p>
                    <Input
                      label="Current / Previous Secret Answer"
                      placeholder="Enter current answer to authorize change"
                      type={showPasswordToggle ? 'text' : 'password'}
                      value={previousAnswerInput}
                      onChange={(e) => setPreviousAnswerInput(e.target.value)}
                      required
                    />
                  </div>
                )}

                <CustomSelect
                  label="Select New Question:"
                  value={selectedPreset}
                  options={PRESET_QUESTIONS.map((q) => ({ value: q, label: q }))}
                  onChange={(val) => setSelectedPreset(val)}
                />

                {selectedPreset === 'Custom Question...' && (
                  <div>
                    <Input
                      label="Your Custom Security Question"
                      placeholder="e.g. What is my private childhood nickname?"
                      value={customQuestion}
                      onChange={(e) => setCustomQuestion(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div>
                  <Input
                    label={existingSecurity ? "New Secret Answer / Password" : "Your Secret Answer"}
                    placeholder="Enter new secret answer (case-insensitive)"
                    type={showPasswordToggle ? 'text' : 'password'}
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    required
                  />
                  <div className="flex items-center justify-between mt-1 px-0.5">
                    <span className="text-[11px] text-stone">
                      Case-insensitive (answers match regardless of caps)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPasswordToggle(!showPasswordToggle)}
                      className="text-[11px] text-primary hover:underline font-semibold"
                    >
                      {showPasswordToggle ? 'Hide Characters' : 'Show Characters'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-hairline/60">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditingSecurity(false);
                      setPreviousAnswerInput('');
                      setAnswerInput('');
                      setSecurityError('');
                    }}
                    disabled={isSavingSecurity}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSavingSecurity}
                  >
                    {isSavingSecurity ? 'Saving...' : 'Save Security Question'}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* APP VERSION & IN-APP UPDATE CENTER (GITHUB RELEASES & LIVE OTA) */}
          <div className="p-4 bg-surface-card border border-hairline rounded-2xl shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <ArrowUpCircle size={18} />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-ink">
                    App Updates
                  </h4>
                  <p className="text-[11px] text-mute">
                    Live OTA & GitHub Releases
                  </p>
                </div>
              </div>

              <span className="font-mono text-xs font-bold text-charcoal bg-surface-bone px-2.5 py-1 rounded-full border border-hairline shrink-0">
                v{CURRENT_APP_VERSION}
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCheckForUpdates}
              disabled={updateStatus === 'checking' || updateStatus === 'downloading'}
              className="w-full text-xs font-bold gap-1.5 shadow-2xs h-9 cursor-pointer justify-center"
            >
              <RefreshCw size={13} className={clsx(updateStatus === 'checking' && 'animate-spin text-primary')} />
              <span>{updateStatus === 'checking' ? 'Checking GitHub for Updates...' : 'Check for Updates'}</span>
            </Button>

            {/* STATUS: UPDATE AVAILABLE */}
            {updateStatus === 'available' && updateInfo && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2.5 animate-in fade-in duration-300">
                <div className="flex items-center justify-between text-xs text-emerald-900 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={14} className="text-emerald-600" />
                    New Version: {updateInfo.version}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-mono">
                    {updateInfo.publishedAt.slice(0, 10)}
                  </span>
                </div>
                {updateInfo.notes && (
                  <p className="text-xs text-emerald-800 leading-relaxed font-normal bg-white/70 p-2.5 rounded-lg border border-emerald-200/60 whitespace-pre-line">
                    {updateInfo.notes}
                  </p>
                )}

                {updateError && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800">
                    <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                    <span>{updateError}</span>
                  </div>
                )}

                {/* PRIMARY ACTION */}
                {updateInfo.bundleUrl ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleStartLiveDownload}
                    className="w-full gap-2 font-bold shadow-xs cursor-pointer"
                  >
                    <Zap size={14} className="fill-current" /> Download & Apply Live Update (OTA)
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleDownloadFullApk}
                    className="w-full gap-2 font-bold shadow-xs cursor-pointer"
                  >
                    <Download size={14} /> Download APK from GitHub Releases
                  </Button>
                )}

                {/* OPTIONAL FULL APK DOWNLOAD FALLBACK */}
                {updateInfo.bundleUrl && updateInfo.apkDownloadUrl && (
                  <button
                    type="button"
                    onClick={handleDownloadFullApk}
                    className="w-full text-center text-[11px] text-emerald-700 font-semibold hover:underline pt-0.5 cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Download size={11} /> Or download full APK package
                  </button>
                )}
              </div>
            )}

            {/* STATUS: DOWNLOADING LIVE ANIMATION */}
            {updateStatus === 'downloading' && (
              <div className="p-4 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent border border-primary/20 rounded-xl space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <ArrowDownCircle size={16} className="animate-bounce" />
                    <span>Downloading Live Update Bundle...</span>
                  </div>
                  <span className="font-mono text-xs font-black text-primary">
                    {downloadProgress}%
                  </span>
                </div>

                {/* Glowing Animated Progress Bar */}
                <div className="w-full bg-surface-bone rounded-full h-2.5 overflow-hidden p-0.5 border border-hairline">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary via-rose-500 to-amber-400 transition-all duration-300 shadow-sm"
                    style={{ width: `${Math.max(6, downloadProgress)}%` }}
                  />
                </div>

                <p className="text-[10px] text-mute text-center italic">
                  Fetching updated web bundle from GitHub... Please do not close the app.
                </p>
              </div>
            )}

            {/* STATUS: READY TO RESTART */}
            {updateStatus === 'ready-to-restart' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>Update downloaded and ready to apply!</span>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setIsRestartModalOpen(true)}
                  className="w-full font-bold gap-2 shadow-xs cursor-pointer"
                >
                  <RotateCcw size={14} /> Restart Application to Apply
                </Button>
              </div>
            )}

            {/* STATUS: ALREADY UP TO DATE */}
            {updateStatus === 'latest' && (
              <div className="p-2.5 bg-zinc-100 border border-zinc-200 rounded-xl flex items-center gap-2 text-xs text-zinc-700 animate-in fade-in duration-300">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span>You're on the latest build (v{CURRENT_APP_VERSION})! All up to date.</span>
              </div>
            )}

            {/* STATUS: ERROR */}
            {updateStatus === 'error' && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2 text-xs text-amber-800 animate-in fade-in duration-300">
                <div className="flex items-center gap-1.5 min-w-0">
                  <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                  <span className="truncate">{updateError || 'GitHub check failed.'}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCheckForUpdates}
                  className="text-primary font-bold hover:underline shrink-0 text-[11px] ml-2"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* USER FEEDBACK & VULNERABILITY / CORRECTION FORM */}
          <div className="p-4 bg-surface-card border border-hairline rounded-2xl shadow-2xs space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <MessageSquarePlus size={17} />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-ink">
                  Feedback & Bug Reports
                </h4>
                <p className="text-[11px] text-mute">
                  Report bugs, vulnerabilities, or suggest new features
                </p>
              </div>
            </div>

            <a
              href={APP_CONFIG.feedbackFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-surface-bone hover:bg-stone/20 text-ink text-xs font-bold border border-hairline transition-all active:scale-98"
            >
              <span>Submit Google Form</span>
              <ExternalLink size={13} />
            </a>
          </div>

          {/* DANGER ZONE: FRESH START & FULL RESET */}
          <div className="p-4 bg-red-50/70 border border-red-200 rounded-2xl space-y-2.5">
            <div className="flex items-center gap-2 text-red-900">
              <AlertTriangle size={17} className="text-red-600 shrink-0" />
              <h4 className="font-display font-bold text-sm">
                Danger Zone: Fresh Start / Reset Account
              </h4>
            </div>
            <p className="text-xs text-red-800 leading-relaxed">
              Permanently wipes all habits, history logs, breaks, and categories from Cloud Firestore. Restarts onboarding from scratch for a fresh beginning.
            </p>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setIsConfirmResetOpen(true)}
              className="w-full gap-2 mt-1"
            >
              <Trash2 size={14} /> Reset All Data & Start Fresh
            </Button>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="pt-2 border-t border-hairline flex items-center justify-between gap-3">
            <span className="text-xs text-charcoal font-medium flex items-center gap-1.5">
              <Shield size={14} className="text-primary" /> {habits.length} Active Habits
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 gap-1.5"
            >
              <LogOut size={14} /> Sign Out
            </Button>
          </div>
        </div>
      </Modal>

      {/* SECURITY VERIFICATION MODAL FOR FULL ACCOUNT RESET */}
      <SecurityModal
        isOpen={isConfirmResetOpen}
        onClose={() => setIsConfirmResetOpen(false)}
        title="Authorize Complete Account Reset"
        actionTitle="Permanently wipe all habits, logs, breaks, and restart onboarding from scratch."
        isDanger={true}
        onSuccess={handleExecuteReset}
      />

      {/* LIVE RESTART CONFIRMATION POPUP */}
      <Modal
        isOpen={isRestartModalOpen}
        onClose={() => setIsRestartModalOpen(false)}
        title="Apply Live Update"
        maxWidth="sm"
      >
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg animate-bounce">
            <Sparkles size={32} />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-display font-extrabold text-lg text-ink">
              Update Downloaded Successfully! 🎉
            </h3>
            <p className="text-xs text-mute max-w-xs mx-auto leading-relaxed">
              All new features and enhancements have been downloaded. Restart the application now to launch the updated version.
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={handleRestartNow}
              className="w-full font-bold shadow-md gap-2"
            >
              <RotateCcw size={16} /> Restart Application Now
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsRestartModalOpen(false)}
              className="w-full text-xs text-mute"
            >
              Apply on Next App Launch
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
