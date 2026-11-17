// Service to check and trigger GitHub In-App Updates for HabitSeen

export interface AppReleaseInfo {
  version: string;
  name: string;
  notes: string;
  apkDownloadUrl?: string;
  publishedAt: string;
  hasUpdate: boolean;
}

export const CURRENT_APP_VERSION = '1.0.0';
export const GITHUB_REPO = 'kumardevanshu7/Habits-Seen-Mob';

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
 * Checks GitHub Releases for the latest HabitSeen APK
 */
export async function checkForAppUpdate(): Promise<AppReleaseInfo> {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (res.status === 404) {
      // No GitHub releases published yet
      return {
        version: CURRENT_APP_VERSION,
        name: 'HabitSeen v1.0.0 (Latest)',
        notes: 'Initial release. No newer releases published yet on GitHub.',
        hasUpdate: false,
        publishedAt: new Date().toISOString(),
      };
    }

    if (!res.ok) {
      throw new Error(`GitHub check failed with status ${res.status}`);
    }

    const data = await res.json();
    const latestTag = (data.tag_name || '').replace(/^v/i, '').trim();

    // Look for an attached .apk file in the release assets
    const apkAsset = Array.isArray(data.assets)
      ? data.assets.find(
          (a: { name?: string; content_type?: string }) =>
            a.name?.toLowerCase().endsWith('.apk') ||
            a.content_type === 'application/vnd.android.package-archive'
        )
      : undefined;

    const isNewer = compareVersions(latestTag, CURRENT_APP_VERSION) > 0;

    return {
      version: latestTag || CURRENT_APP_VERSION,
      name: data.name || `HabitSeen v${latestTag}`,
      notes: data.body || 'Includes new features, UI enhancements, and stability improvements.',
      apkDownloadUrl: apkAsset?.browser_download_url || data.html_url,
      publishedAt: data.published_at || new Date().toISOString(),
      hasUpdate: isNewer,
    };
  } catch (error) {
    console.error('Failed to check for updates:', error);
    throw error;
  }
}
