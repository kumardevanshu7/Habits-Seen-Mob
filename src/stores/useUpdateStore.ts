import { create } from 'zustand';
import {
  AppReleaseInfo,
  checkForAppUpdate,
  downloadLiveUpdate,
  restartApp,
} from '../services/updateService';

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'ready-to-restart'
  | 'latest'
  | 'error';

interface UpdateStoreState {
  updateStatus: UpdateStatus;
  updateInfo: AppReleaseInfo | null;
  updateError: string | null;
  downloadProgress: number;
  pendingBundleId: string | null;
  isRestarting: boolean;
  isRestartModalOpen: boolean;

  setRestartModalOpen: (open: boolean) => void;
  checkUpdates: () => Promise<void>;
  startLiveDownload: () => Promise<void>;
  restartToApply: () => Promise<void>;
}

export const useUpdateStore = create<UpdateStoreState>((set, get) => ({
  updateStatus: 'idle',
  updateInfo: null,
  updateError: null,
  downloadProgress: 0,
  pendingBundleId: null,
  isRestarting: false,
  isRestartModalOpen: false,

  setRestartModalOpen: (open: boolean) => set({ isRestartModalOpen: open }),

  checkUpdates: async () => {
    const { updateStatus } = get();
    if (updateStatus === 'checking' || updateStatus === 'downloading') return;

    set({ updateStatus: 'checking', updateError: null });
    try {
      const release = await checkForAppUpdate();
      set({
        updateInfo: release,
        updateStatus: release.hasUpdate ? 'available' : 'latest',
      });
    } catch (err: any) {
      set({
        updateStatus: 'error',
        updateError:
          err?.message || 'Could not connect to GitHub. Please check internet connection.',
      });
    }
  },

  startLiveDownload: async () => {
    const { updateInfo, updateStatus } = get();
    if (!updateInfo || !updateInfo.bundleUrl || updateStatus === 'downloading') return;

    set({
      updateStatus: 'downloading',
      downloadProgress: 0,
      updateError: null,
      pendingBundleId: null,
    });

    const res = await downloadLiveUpdate(
      updateInfo.bundleUrl,
      updateInfo.version,
      updateInfo.checksum,
      (percent) => {
        set({ downloadProgress: percent });
      }
    );

    if (res.success) {
      set({
        updateStatus: 'ready-to-restart',
        downloadProgress: 100,
        pendingBundleId: res.bundleId || null,
        isRestartModalOpen: true,
      });
    } else {
      set({
        updateStatus: 'available',
        updateError:
          res.error || 'Live bundle update failed. You can still download the full APK.',
      });
    }
  },

  restartToApply: async () => {
    const { pendingBundleId, isRestarting } = get();
    if (isRestarting) return;
    set({ isRestarting: true, updateError: null });
    try {
      await restartApp(pendingBundleId);
    } catch (err: any) {
      set({
        isRestarting: false,
        updateError:
          err?.message ||
          'Could not switch OTA bundle automatically. Try closing & reopening the app or install the APK directly.',
      });
    }
  },
}));
