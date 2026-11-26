// Manages Motivational Reels via build-time manifest + incremental on-device caching.
// Keeping MP4s out of the Vite OTA bundle keeps live updates (~3 MB) super fast,
// and only new or changed videos are fetched from GitHub when reels change.

export interface MotivationalReel {
  id: string; // e.g. "reel-01"
  number: number;
  title: string;
  tagline?: string;
  url: string; // Stream/download URL
  cacheKey: string; // Stable CacheStorage key
  filename: string;
  hash: string;
  sizeBytes: number;
}

interface ManifestItem {
  number: number;
  filename: string;
  size: number;
  hash: string;
}

interface ReelsManifest {
  hash: string;
  items: ManifestItem[];
}

export const REELS_CACHE_NAME = 'habitseen-reels-v1';
const REELS_HASH_STORAGE_KEY = 'hs_reels_cached_hashes';
const REELS_PACK_STORAGE_KEY = 'hs_reels_pack_hash';
const GITHUB_REELS_BASE_URL =
  'https://raw.githubusercontent.com/kumardevanshu7/Habits-Seen-Mob/main/src/motiv-reels';

const TAGLINES = [
  'Conquer your inner resistance.',
  'Small daily disciplines create unstoppable momentum.',
  'Your future self is watching you right now.',
  'Pain of discipline vs. pain of regret.',
  'Don’t count the days, make the days count.',
  'Focus on what is within your control.',
  'Consistency beats talent when talent is lazy.',
  'One step, then another. Keep moving forward.',
  'Master your impulses, master your destiny.',
  'The body achieves what the mind believes.',
];

const RAW_MANIFEST: ReelsManifest =
  ((import.meta as any).env?.VITE_REELS_MANIFEST as ReelsManifest) || {
    hash: 'empty',
    items: [],
  };

export const REELS_PACK_HASH = RAW_MANIFEST.hash || 'empty';

export const MOTIVATIONAL_REELS: MotivationalReel[] = (RAW_MANIFEST.items || [])
  .map((item) => {
    const padded = String(item.number).padStart(2, '0');
    const encodedName = encodeURIComponent(item.filename);
    const isDev = Boolean((import.meta as any).env?.DEV);
    const remoteUrl = isDev
      ? `/src/motiv-reels/${encodedName}`
      : `${GITHUB_REELS_BASE_URL}/${encodedName}?v=${item.hash}`;

    return {
      id: `reel-${padded}`,
      number: item.number,
      title: `Discipline Fuel #${padded}`,
      tagline: TAGLINES[(item.number - 1) % TAGLINES.length],
      url: remoteUrl,
      cacheKey: `https://habitseen-reels.local/${encodedName}`,
      filename: item.filename,
      hash: item.hash,
      sizeBytes: item.size || 0,
    };
  })
  .sort((a, b) => a.number - b.number);

export const getReelByNumber = (num: number): MotivationalReel | undefined => {
  return MOTIVATIONAL_REELS.find((r) => r.number === num);
};

/**
 * Deterministically shuffles the reels every 2-hour window.
 */
export const getTwoHourShuffledReels = (): MotivationalReel[] => {
  const twoHourBlock = Math.floor(Date.now() / (2 * 60 * 60 * 1000));
  const shuffled = [...MOTIVATIONAL_REELS];

  let seed = (twoHourBlock * 9301 + 49297) % 233280;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }

  return shuffled;
};

function readCachedHashMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(REELS_HASH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeCachedHashMap(map: Record<string, string>) {
  try {
    localStorage.setItem(REELS_HASH_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage quota errors
  }
}

const inFlightReelDownloads = new Map<string, Promise<boolean>>();

/** Fetches and caches a single reel into CacheStorage if its hash changed or is missing. */
export async function cacheSingleReel(reel: MotivationalReel): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) return false;

  const stored = readCachedHashMap();
  if (stored[reel.filename] === reel.hash) {
    try {
      const cache = await caches.open(REELS_CACHE_NAME);
      const hit = await cache.match(reel.cacheKey);
      if (hit) return true;
    } catch {
      // continue to re-fetch
    }
  }

  const existingTask = inFlightReelDownloads.get(reel.filename);
  if (existingTask) return existingTask;

  const task = (async () => {
    try {
      const response = await fetch(reel.url, { mode: 'cors' });
      if (!response.ok) return false;
      const cache = await caches.open(REELS_CACHE_NAME);
      await cache.put(reel.cacheKey, response);
      const nextMap = readCachedHashMap();
      nextMap[reel.filename] = reel.hash;
      writeCachedHashMap(nextMap);
      return true;
    } catch {
      return false;
    } finally {
      inFlightReelDownloads.delete(reel.filename);
    }
  })();

  inFlightReelDownloads.set(reel.filename, task);
  return task;
}

/** Returns reels whose content hash differs from what is currently cached on device. */
export function getChangedReels(): MotivationalReel[] {
  const stored = readCachedHashMap();
  return MOTIVATIONAL_REELS.filter((r) => stored[r.filename] !== r.hash);
}

let isSyncingReels = false;

/**
 * Incrementally syncs ONLY newly added or modified reels when REELS_PACK_HASH changes.
 * Unchanged reels stay untouched in CacheStorage across all code-only OTA updates.
 */
export async function syncChangedReels(
  onProgress?: (completed: number, total: number) => void
): Promise<void> {
  if (isSyncingReels || typeof window === 'undefined' || !('caches' in window)) return;
  if (!MOTIVATIONAL_REELS.length) return;

  try {
    const savedPackHash = localStorage.getItem(REELS_PACK_STORAGE_KEY);
    const pending = getChangedReels();
    if (savedPackHash === REELS_PACK_HASH && pending.length === 0) {
      return;
    }

    isSyncingReels = true;
    const cache = await caches.open(REELS_CACHE_NAME);

    // Clean up any reels removed from repo
    const activeKeys = new Set(MOTIVATIONAL_REELS.map((r) => r.cacheKey));
    const existingRequests = await cache.keys();
    await Promise.all(
      existingRequests
        .filter((req) => !activeKeys.has(req.url))
        .map((req) => cache.delete(req))
    );

    const stored = readCachedHashMap();
    const cleanedMap: Record<string, string> = {};
    for (const r of MOTIVATIONAL_REELS) {
      if (stored[r.filename] === r.hash) {
        cleanedMap[r.filename] = r.hash;
      }
    }
    writeCachedHashMap(cleanedMap);

    let done = 0;
    const total = pending.length;
    for (const reel of pending) {
      await cacheSingleReel(reel);
      done += 1;
      onProgress?.(done, total);
    }

    if (getChangedReels().length === 0) {
      localStorage.setItem(REELS_PACK_STORAGE_KEY, REELS_PACK_HASH);
    }
  } catch (err) {
    console.warn('Reels incremental sync skipped:', err);
  } finally {
    isSyncingReels = false;
  }
}

/**
 * Returns a local Blob URL from CacheStorage if cached (instant/offline),
 * or falls back to streaming URL while caching in background for next view.
 */
export async function resolvePlayableReelUrl(
  reel: MotivationalReel
): Promise<{ src: string; isBlob: boolean }> {
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await caches.open(REELS_CACHE_NAME);
      const cachedRes = await cache.match(reel.cacheKey);
      if (cachedRes) {
        const blob = await cachedRes.blob();
        if (blob.size > 0) {
          return { src: URL.createObjectURL(blob), isBlob: true };
        }
      }
    } catch {
      // Fallback to network streaming
    }
    // Cache in background without blocking playback start
    void cacheSingleReel(reel);
  }
  return { src: reel.url, isBlob: false };
}
