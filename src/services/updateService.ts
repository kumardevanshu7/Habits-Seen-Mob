// Service to check and trigger GitHub Live Updates (OTA) & Releases for HabitSeen

import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';

export interface AppReleaseInfo {
  version: string;
  name: string;
  notes: string;
  bundleUrl?: string; // Direct OTA bundle zip URL (for live update without installing APK)
  bundleSizeBytes?: number; // Byte size of bundle.zip for transparent mobile UX
  checksum?: string; // SHA-256 checksum of bundle.zip required by CapgoUpdater
  apkDownloadUrl?: string; // Fallback direct APK link
  publishedAt: string;
  hasUpdate: boolean;
  isLiveUpdate?: boolean; // True if OTA live update bundle is available
}

export interface ParsedReleaseDetails {
  title: string;
  commitSha?: string;
  message: string;
}

/**
 * Strips raw markdown syntax and cleanly formats release notes for mobile display
 */
export function parseReleaseNotes(rawNotes: string, version?: string): ParsedReleaseDetails {
  if (!rawNotes) {
    return {
      title: 'Update Highlights',
      commitSha: version?.includes('-') ? version.split('-').slice(1).join('-') : undefined,
      message: 'Includes stability and performance improvements.',
    };
  }

  const commitMatch = rawNotes.match(/Commit[\*:`\s]+([a-f0-9]{7,40})/i);
  const commitSha = commitMatch
    ? commitMatch[1]
    : version?.includes('-')
    ? version.split('-').slice(1).join('-')
    : undefined;

  const messageMatch = rawNotes.match(/Message[\*:`\s]+([^\n\r]+)/i);
  let cleanMessage = messageMatch ? messageMatch[1].trim() : '';

  if (!cleanMessage) {
    cleanMessage = rawNotes
      .replace(/###\s*[^\n\r]+/g, '')
      .replace(/\*\s*\*\*Commit\*\*[^\n\r]+/gi, '')
      .replace(/\*\s*\*\*Built by\*\*[^\n\r]+/gi, '')
      .replace(/Download the attached[^\n\r]+/gi, '')
      .replace(/[\*`#_]/g, '')
      .trim();
  }

  cleanMessage = cleanMessage.replace(/^["'`]+|["'`]+$/g, '').trim();

  return {
    title: 'Update Highlights',
    commitSha,
    message: cleanMessage || 'Bug fixes, UI enhancements, and stability improvements.',
  };
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

function formatDownloadError(rawMessage?: string): string {
  const msg = rawMessage || '';
  if (/insufficient_disk_space/i.test(msg)) {
    return 'Not enough phone storage space (~50 MB free space needed). Free up some space or download the full APK.';
  }
  if (/checksum/i.test(msg)) {
    return 'Update security verification failed. Please retry or download the full APK.';
  }
  if (/timeout|timed out|socket/i.test(msg)) {
    return 'Download timed out due to slow network. Please try again on Wi-Fi or download the full APK.';
  }
  if (/low_mem_fail/i.test(msg)) {
    return 'Device memory ran low during download. Close other apps and retry.';
  }
  return msg || 'Download failed. You can still download the full APK.';
}

async function getEffectiveBuildCommit(): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    try {
      const cur = await CapacitorUpdater.current();
      const bundleId = cur?.bundle?.id;
      const bundleVersion = cur?.bundle?.version || '';
      if (bundleId && bundleId !== 'builtin' && bundleVersion.includes('-')) {
        const otaCommit = bundleVersion.split('-').slice(1).join('-').trim();
        if (otaCommit) return otaCommit;
      }
    } catch {
      // Fallback to compile-time commit
    }
  }
  return CURRENT_BUILD_COMMIT;
}

/**
 * Checks GitHub Releases & Commits for the latest HabitSeen Live Updates and APKs
 */
export async function checkForAppUpdate(): Promise<AppReleaseInfo> {
  try {
    const activeCommit = await getEffectiveBuildCommit();

    // 1. Check recent official GitHub Releases (no-store + cache-buster) so skipped intermediate
    // updates are bypassed cleanly and the newest complete release is always selected.
    let latestRelease: any = null;
    let releaseCheckError: string | null = null;
    const cacheBust = Date.now();
    try {
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=5&_ts=${cacheBust}`,
        {
          cache: 'no-store',
          headers: {
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );
      if (res.ok) {
        const releases = await res.json();
        if (Array.isArray(releases)) {
          const validReleases = releases.filter((r: any) => !r.draft && !r.prerelease);
          latestRelease =
            validReleases.find(
              (r: any) =>
                Array.isArray(r.assets) &&
                r.assets.some((a: any) => a.name?.toLowerCase() === 'bundle.zip')
            ) ||
            validReleases.find(
              (r: any) => Array.isArray(r.assets) && r.assets.length > 0
            ) ||
            validReleases[0] ||
            null;
        }
      } else if (res.status !== 404) {
        releaseCheckError =
          res.status === 403 || res.status === 429
            ? 'GitHub API rate limit reached. Please try again in a few minutes.'
            : `GitHub Releases returned HTTP ${res.status}.`;
      }
    } catch (err: any) {
      releaseCheckError = err?.message || 'Could not reach GitHub Releases.';
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

      // Extract sha256 checksum from asset digest (GitHub API provides sha256:...) or release body
      const rawDigest: string = (bundleAsset as any)?.digest || '';
      let bundleChecksum = rawDigest ? rawDigest.replace(/^sha256:/i, '').trim().toLowerCase() : '';
      if (!bundleChecksum && latestRelease.body) {
        const match = latestRelease.body.match(/Checksum[\*:`\s]+([a-f0-9]{64})/i);
        if (match) {
          bundleChecksum = match[1].trim().toLowerCase();
        }
      }

      // Look for HabitSeen.apk (full installer)
      const apkAsset = Array.isArray(latestRelease.assets)
        ? latestRelease.assets.find(
            (a: { name?: string; content_type?: string }) =>
              a.name?.toLowerCase().endsWith('.apk') ||
              a.content_type === 'application/vnd.android.package-archive'
          )
        : undefined;

      const hasNewerVersion = isReleaseNewer(latestTag, CURRENT_APP_VERSION, activeCommit);

      if (hasNewerVersion) {
        return {
          version: latestTag || CURRENT_APP_VERSION,
          name: latestRelease.name || `HabitSeen v${latestTag}`,
          notes: latestRelease.body || 'Includes new features, UI enhancements, and stability improvements.',
          bundleUrl: bundleAsset?.browser_download_url,
          bundleSizeBytes: typeof bundleAsset?.size === 'number' ? bundleAsset.size : undefined,
          checksum: bundleChecksum || undefined,
          apkDownloadUrl: apkAsset?.browser_download_url || latestRelease.html_url,
          publishedAt: latestRelease.published_at || new Date().toISOString(),
          hasUpdate: true,
          isLiveUpdate: Boolean(bundleAsset),
        };
      }
    }

    // 2. Check live GitHub Commits on main branch to detect pushed updates that are still building
    const commitRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/commits?per_page=1&_ts=${cacheBust}`,
      {
        cache: 'no-store',
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (commitRes.ok) {
      const commits = await commitRes.json();
      if (Array.isArray(commits) && commits.length > 0) {
        const latestCommit = commits[0];
        const shortSha = (latestCommit.sha || '').slice(0, 7);
        const commitMsg = latestCommit.commit?.message?.split('\n')[0] || 'Latest updates pushed to GitHub';
        const commitDate = latestCommit.commit?.author?.date || new Date().toISOString();

        if (shortSha && shortSha.toLowerCase() !== activeCommit.toLowerCase()) {
          return {
            version: CURRENT_APP_VERSION,
            name: `HabitSeen v${CURRENT_APP_VERSION} (${activeCommit})`,
            notes: `New code was recently pushed: "${commitMsg}". GitHub Actions is currently compiling the in-app live update bundle (~2 mins). Tap Check Updates in a moment to apply it instantly!`,
            hasUpdate: false,
            publishedAt: commitDate,
            isLiveUpdate: false,
          };
        }
      }
    } else if (!latestRelease) {
      // Neither GitHub Releases nor Commits succeeded — surface an error instead of falsely reporting up to date
      const commitErr =
        commitRes.status === 403 || commitRes.status === 429
          ? 'GitHub API rate limit reached. Please try again in a few minutes.'
          : `GitHub check failed (HTTP ${commitRes.status}).`;
      throw new Error(releaseCheckError || commitErr);
    }

    // 3. App is genuinely up to date
    return {
      version: CURRENT_APP_VERSION,
      name: `HabitSeen v${CURRENT_APP_VERSION} (${activeCommit})`,
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
  checksum?: string,
  onProgress?: (percent: number) => void
): Promise<{ success: boolean; bundleId?: string; error?: string }> {
  let downloadListener: any = null;
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

    if (!checksum) {
      return {
        success: false,
        error: 'Update security checksum is missing. Please download the full APK package.',
      };
    }

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

    // Download the bundle from GitHub Releases with mandatory checksum
    const bundle = await CapacitorUpdater.download({
      url: bundleUrl,
      version: version || 'latest',
      checksum,
    });

    // Stage bundle to be activated cleanly upon next restart
    await CapacitorUpdater.next({ id: bundle.id });

    onProgress?.(100);
    return { success: true, bundleId: bundle.id };
  } catch (err: any) {
    console.error('Failed to download live update bundle:', err);
    return { success: false, error: formatDownloadError(err?.message) };
  } finally {
    if (downloadListener && typeof downloadListener.remove === 'function') {
      Promise.resolve(downloadListener.remove()).catch(() => {});
    }
  }
}

/**
 * Restarts the application to apply the downloaded Live Update.
 * Uses CapacitorUpdater.set({ id }) when bundleId is provided for reliable activation.
 */
export async function restartApp(bundleId?: string | null): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    if ('serviceWorker' in navigator) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
      } catch {}
    }
    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        // Keep cached motivational reels across code-only OTA updates so unchanged videos never re-download
        await Promise.all(
          keys
            .filter((k) => !k.startsWith('habitseen-reels-'))
            .map((k) => caches.delete(k).catch(() => false))
        );
      } catch {}
    }
    if (bundleId) {
      await CapacitorUpdater.set({ id: bundleId });
    } else {
      await CapacitorUpdater.reload();
    }
  } else {
    window.location.reload();
  }
}

