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
export const CURRENT_BUILD_COMMIT = '0a9ae4e'; // Previous build commit SHA
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
 * Checks GitHub Releases & Commits for the latest HabitSeen APK updates
 */
export async function checkForAppUpdate(): Promise<AppReleaseInfo> {
  try {
    // 1. Check official GitHub Releases first for compiled APK assets
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
      const apkAsset = Array.isArray(latestRelease.assets)
        ? latestRelease.assets.find(
            (a: { name?: string; content_type?: string }) =>
              a.name?.toLowerCase().endsWith('.apk') ||
              a.content_type === 'application/vnd.android.package-archive'
          )
        : undefined;

      const isNewerTag = compareVersions(latestTag, CURRENT_APP_VERSION) > 0 || latestTag.includes('-');
      if (isNewerTag || apkAsset) {
        return {
          version: latestTag || CURRENT_APP_VERSION,
          name: latestRelease.name || `HabitSeen v${latestTag}`,
          notes: latestRelease.body || 'Includes new features, UI enhancements, and stability improvements.',
          apkDownloadUrl: apkAsset?.browser_download_url || latestRelease.html_url,
          publishedAt: latestRelease.published_at || new Date().toISOString(),
          hasUpdate: true,
        };
      }
    }

    // 2. Check live GitHub Commits on main branch to detect pushed updates
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

        if (shortSha && shortSha !== CURRENT_BUILD_COMMIT) {
          return {
            version: `${CURRENT_APP_VERSION}-${shortSha}`,
            name: `GitHub Update Available (${shortSha})`,
            notes: `New code update pushed to repository:\n"${commitMsg}"\n\nGitHub Actions is building the updated APK package or you can download directly from GitHub Releases.`,
            apkDownloadUrl: `https://github.com/${GITHUB_REPO}/releases`,
            publishedAt: commitDate,
            hasUpdate: true,
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
    };
  } catch (error) {
    console.error('Failed to check for updates:', error);
    throw error;
  }
}
