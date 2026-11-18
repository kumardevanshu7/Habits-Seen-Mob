// Service to check and trigger GitHub In-App Updates for HabitSeen

export interface AppReleaseInfo {
  version: string;
  name: string;
  notes: string;
  apkDownloadUrl?: string;
  publishedAt: string;
  hasUpdate: boolean;
}

import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';

// Service to check and trigger GitHub Live Updates (OTA) & Releases for HabitSeen

export interface AppReleaseInfo {
  version: string;
  name: string;
  notes: string;
  bundleUrl?: string; // Direct OTA bundle zip URL (for live update without installing APK)
  apkDownloadUrl?: string; // Fallback direct APK link
  publishedAt: string;
  hasUpdate: boolean;
  isLiveUpdate?: boolean; // True if OTA live update bundle is available
}

export const CURRENT_APP_VERSION = '1.0.0';
export const CURRENT_BUILD_COMMIT =
  ((import.meta as any).env?.VITE_COMMIT_SHA as string) || '1ea0fa4'; // Injected build commit SHA
export const GITHUB_REPO = 'kumardevanshu7/Habits-Seen-Mob';

/**
 * Checks if a release tag represents a newer version than currently installed
 */
export function isReleaseNewer(
  releaseTag: string,
  currentVersion: string,
  currentCommit: string
): boolean {
  const cleanTag = releaseTag.replace(/^v/i, '').trim();
  const cleanCurrent = currentVersion.replace(/^v/i, '').trim();

  // If the release tag directly contains or matches the current build commit, it's the exact same build
  if (currentCommit && cleanTag.toLowerCase().includes(currentCommit.toLowerCase())) {
    return false;
  }

  // Check semantic version difference (e.g. "1.1.0" vs "1.0.0")
  const tagBase = cleanTag.split('-')[0];
  const currentBase = cleanCurrent.split('-')[0];
  const semverComp = compareVersions(tagBase, currentBase);

  if (semverComp > 0) return true;
  if (semverComp < 0) return false;

  // If base versions are equal (e.g. 1.0.0 vs 1.0.0):
  // If the release has a commit suffix and it's different from our current commit, it's newer
  const tagCommit = cleanTag.includes('-') ? cleanTag.split('-').slice(1).join('-') : '';
  if (tagCommit && currentCommit && tagCommit.toLowerCase() !== currentCommit.toLowerCase()) {
    return true;
  }

  return false;
}

/**
 * Compares two semantic version strings (e.g. "1.0.1" vs "1.0.0")
 * Returns:
 *   1 if v1 > v2 (v1 is newer)
 *  -1 if v1 < v2 (v1 is older)
 *   0 if equal
 */
export function compareVersions(v1: string, v2: string): number {
  const clean1 = v1.replace(/^v/i, '').trim();
  const clean2 = v2.replace(/^v/i, '').trim();

  const parts1 = clean1.split('.').map((p) => parseInt(p, 10) || 0);
  const parts2 = clean2.split('.').map((p) => parseInt(p, 10) || 0);

  const len = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < len; i++) {
    const p1 = parts1[i] ?? 0;
    const p2 = parts2[i] ?? 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

/**
 * Checks GitHub Releases & Commits for the latest HabitSeen Live Updates and APKs
 */
export async function checkForAppUpdate(): Promise<AppReleaseInfo> {
  try {
    // 1. Check official GitHub Releases first for compiled assets
    let latestRelease: any = null;
    try {
      const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
      });
      if (res.ok) {
        latestRelease = await res.json();
      }
    } catch {
      // Release check failed, fallback to commits
    }

    if (latestRelease) {
      const latestTag = (latestRelease.tag_name || '').replace(/^v/i, '').trim();

      // Look for bundle.zip (live OTA update)
      const bundleAsset = Array.isArray(latestRelease.assets)
        ? latestRelease.assets.find(
            (a: { name?: string }) =>
              a.name?.toLowerCase() === 'bundle.zip' ||
              a.name?.toLowerCase().endsWith('.zip')
          )
        : undefined;

      // Look for HabitSeen.apk (full installer)
      const apkAsset = Array.isArray(latestRelease.assets)
        ? latestRelease.assets.find(
            (a: { name?: string; content_type?: string }) =>
              a.name?.toLowerCase().endsWith('.apk') ||
              a.content_type === 'application/vnd.android.package-archive'
          )
        : undefined;

      const hasNewerVersion = isReleaseNewer(latestTag, CURRENT_APP_VERSION, CURRENT_BUILD_COMMIT);

      if (hasNewerVersion) {
        return {
          version: latestTag || CURRENT_APP_VERSION,
          name: latestRelease.name || `HabitSeen v${latestTag}`,
          notes: latestRelease.body || 'Includes new features, UI enhancements, and stability improvements.',
          bundleUrl: bundleAsset?.browser_download_url,
          apkDownloadUrl: apkAsset?.browser_download_url || latestRelease.html_url,
          publishedAt: latestRelease.published_at || new Date().toISOString(),
          hasUpdate: true,
          isLiveUpdate: Boolean(bundleAsset),
        };
      }
    }

    // 2. Check live GitHub Commits on main branch to detect pushed updates that are still building
    const commitRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/commits?per_page=1`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (commitRes.ok) {
      const commits = await commitRes.json();
      if (Array.isArray(commits) && commits.length > 0) {
        const latestCommit = commits[0];
        const shortSha = (latestCommit.sha || '').slice(0, 7);
        const commitMsg = latestCommit.commit?.message?.split('\n')[0] || 'Latest updates pushed to GitHub';
        const commitDate = latestCommit.commit?.author?.date || new Date().toISOString();

        if (shortSha && shortSha.toLowerCase() !== CURRENT_BUILD_COMMIT.toLowerCase()) {
          return {
            version: CURRENT_APP_VERSION,
            name: `HabitSeen v${CURRENT_APP_VERSION} (${CURRENT_BUILD_COMMIT})`,
            notes: `New code was recently pushed: "${commitMsg}". GitHub Actions is currently compiling the in-app live update bundle (~2 mins). Tap Check Updates in a moment to apply it instantly!`,
            hasUpdate: false,
            publishedAt: commitDate,
            isLiveUpdate: false,
          };
        }
      }
    }

    // 3. App is genuinely up to date
    return {
      version: CURRENT_APP_VERSION,
      name: `HabitSeen v${CURRENT_APP_VERSION} (${CURRENT_BUILD_COMMIT})`,
      notes: 'Your app is fully synchronized with the latest GitHub code and releases.',
      hasUpdate: false,
      publishedAt: new Date().toISOString(),
      isLiveUpdate: false,
    };
  } catch (error) {
    console.error('Failed to check for updates:', error);
    throw error;
  }
}

/**
 * Downloads and applies a Live OTA Update bundle without installing an APK.
 * Reports download progress via onProgress callback (0-100).
 */
export async function downloadLiveUpdate(
  bundleUrl: string,
  version: string,
  onProgress?: (percent: number) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    // If running in browser (non-native), simulate progress for testing
    if (!Capacitor.isNativePlatform()) {
      for (let p = 10; p <= 100; p += 15) {
        onProgress?.(p);
        await new Promise((r) => setTimeout(r, 150));
      }
      return { success: true };
    }

    if (!bundleUrl || !bundleUrl.toLowerCase().endsWith('.zip')) {
      return {
        success: false,
        error: 'Live update bundle (.zip) is not yet available in the latest release.',
      };
    }

    let downloadListener: any = null;
    if (onProgress) {
      try {
        downloadListener = await CapacitorUpdater.addListener('download', (event: any) => {
          if (typeof event?.percent === 'number') {
            onProgress(Math.min(100, Math.max(0, Math.round(event.percent))));
          }
        });
      } catch (e) {
        console.warn('Could not register download listener:', e);
      }
    }

    // Download the bundle from GitHub Releases
    const bundle = await CapacitorUpdater.download({
      url: bundleUrl,
      version: version || 'latest',
    });

    // Set bundle as active
    await CapacitorUpdater.set({ id: bundle.id });

    if (downloadListener && typeof downloadListener.remove === 'function') {
      downloadListener.remove();
    }

    onProgress?.(100);
    return { success: true };
  } catch (err: any) {
    console.error('Failed to download live update bundle:', err);
    return { success: false, error: err?.message || 'Download failed' };
  }
}

/**
 * Restarts the application to apply the downloaded Live Update.
 */
export async function restartApp(): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      await CapacitorUpdater.reload();
    } else {
      window.location.reload();
    }
  } catch {
    window.location.reload();
  }
}

