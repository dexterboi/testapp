import { Capacitor } from '@capacitor/core';

export interface VersionData {
  version: string;
  latest_version: string;
  build: number;
  download_url: string;
  notes: string;
  ios?: {
    version: string;
    build: number;
    release_notes: string;
  };
  android?: {
    version: string;
    build: number;
    release_notes: string;
  };
}

export interface VersionCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  downloadUrl: string;
  releaseNotes: string;
  skippedVersion: string | null;
}

/**
 * Parse semantic version string (e.g., "1.1.12") into comparable array
 */
const parseVersion = (version: string): number[] => {
  const clean = version.trim().replace(/^v/, '');
  return clean.split('.').map(v => parseInt(v, 10) || 0);
};

/**
 * Compare two semantic versions
 * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
const compareVersions = (v1: string, v2: string): number => {
  const parts1 = parseVersion(v1);
  const parts2 = parseVersion(v2);
  
  const maxLen = Math.max(parts1.length, parts2.length);
  
  for (let i = 0; i < maxLen; i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 < part2) return -1;
    if (part1 > part2) return 1;
  }
  
  return 0;
};

/**
 * Check if current version is older than latest version
 */
export const isVersionOutdated = (current: string, latest: string): boolean => {
  return compareVersions(current, latest) < 0;
};

/**
 * Get the version to check against based on platform
 */
const getPlatformVersion = (data: VersionData): { version: string; releaseNotes: string } => {
  const platform = Capacitor.getPlatform();
  
  if (platform === 'ios' && data.ios) {
    return {
      version: data.ios.version || data.latest_version,
      releaseNotes: data.ios.release_notes || data.notes || 'New version available!'
    };
  }
  
  if (platform === 'android' && data.android) {
    return {
      version: data.android.version || data.latest_version,
      releaseNotes: data.android.release_notes || data.notes || 'New version available!'
    };
  }
  
  // Fallback to generic version
  return {
    version: data.latest_version,
    releaseNotes: data.notes || 'New version available!'
  };
};

/**
 * Get skipped version from localStorage
 */
const getSkippedVersion = (): string | null => {
  try {
    return localStorage.getItem('app_skipped_version');
  } catch {
    return null;
  }
};

/**
 * Skip a specific version
 */
export const skipVersion = (version: string): void => {
  try {
    localStorage.setItem('app_skipped_version', version);
    localStorage.setItem('app_skip_timestamp', Date.now().toString());
    console.log(`📱 [Version] User skipped version ${version}`);
  } catch (e) {
    console.error('Failed to save skipped version:', e);
  }
};

/**
 * Clear skipped version (for testing or reset)
 */
export const clearSkippedVersion = (): void => {
  try {
    localStorage.removeItem('app_skipped_version');
    localStorage.removeItem('app_skip_timestamp');
    console.log('📱 [Version] Cleared skipped version');
  } catch (e) {
    console.error('Failed to clear skipped version:', e);
  }
};

/**
 * Check for app updates with robust version comparison
 */
export const checkForUpdatesRobust = async (
  currentVersion: string,
  githubRepo: string = 'dexterboi/testapp'
): Promise<VersionCheckResult | null> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    console.log(`📱 [Version] Starting check...`);
    console.log(`📱 [Version] Current (local): ${currentVersion}`);
    console.log(`📱 [Version] Platform: ${Capacitor.getPlatform()}`);

    // Fetch version.json from GitHub
    const url = `https://raw.githubusercontent.com/${githubRepo}/main/version.json?t=${Date.now()}`;
    console.log(`📱 [Version] Fetching from: ${url}`);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`📱 [Version] Fetch failed: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: VersionData = await response.json();
    console.log(`📱 [Version] Remote data:`, JSON.stringify(data, null, 2));

    // Get platform-specific version
    const platformData = getPlatformVersion(data);
    const latestVersion = platformData.version;
    const downloadUrl = data.download_url;
    const releaseNotes = platformData.releaseNotes;

    console.log(`📱 [Version] Platform latest: ${latestVersion}`);
    console.log(`📱 [Version] Current local: ${currentVersion}`);

    // Check if user has skipped this version
    const skippedVersion = getSkippedVersion();
    console.log(`📱 [Version] Skipped version: ${skippedVersion || 'none'}`);

    // Compare versions using semantic versioning
    const isOutdated = isVersionOutdated(currentVersion, latestVersion);
    const isSkipped = skippedVersion === latestVersion;

    console.log(`📱 [Version] Is outdated: ${isOutdated}`);
    console.log(`📱 [Version] Is skipped: ${isSkipped}`);

    // Determine if we should show update
    const hasUpdate = isOutdated && !isSkipped;

    console.log(`📱 [Version] Result: ${hasUpdate ? 'UPDATE AVAILABLE' : 'NO UPDATE'}`);

    return {
      hasUpdate,
      currentVersion,
      latestVersion,
      downloadUrl,
      releaseNotes,
      skippedVersion
    };

  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn('📱 [Version] Request timeout');
      } else {
        console.error('📱 [Version] Check failed:', error.message);
      }
    }
    
    return null;
  }
};

/**
 * Format version for display
 */
export const formatVersion = (version: string): string => {
  return version.startsWith('v') ? version : `v${version}`;
};
