/**
 * Tab utility functions for InactiTab extension
 */

// Video call domains that should never be tracked
const VIDEO_CALL_DOMAINS = [
  "meet.google.com",
  "zoom.us",
  "teams.microsoft.com",
  "discord.com",
  "webex.com",
  "gotomeeting.com",
  "whereby.com",
  "jitsi.org",
  "skype.com",
  "hangouts.google.com",
];

const NEVER_TRACK_DOMAINS = [
  "meet.google.com",
  "zoom.us",
  "teams.microsoft.com",
  "discord.com/channels",
  "webex.com",
  "whereby.com",
];

/**
 * Check if tab has any media activity
 * @param {Object} tab - Chrome tab object
 * @returns {boolean} True if tab has active media
 */
export function hasMediaActivity(tab) {
  // Check for audio
  if (tab.audible === true) {
    console.log("Tab has audible audio:", tab.id, tab.url);
    return true;
  }

  // Check for camera/microphone indicators
  if (tab.mutedInfo) {
    if (tab.mutedInfo.reason === "capture") {
      console.log("Tab has capture media:", tab.id);
      return true;
    }
    if (tab.mutedInfo.extensionId && !tab.mutedInfo.muted) {
      console.log("Tab has extension media:", tab.id);
      return true;
    }
  }

  // Check for video call sites
  if (tab.url) {
    try {
      const url = new URL(tab.url);
      if (VIDEO_CALL_DOMAINS.some((domain) => url.hostname.includes(domain))) {
        console.log("Tab is video call site:", tab.id, url.hostname);
        return true;
      }
    } catch (e) {
      // URL parsing failed
    }
  }

  // Additional check for media indicators
  if (tab.mutedInfo && tab.mutedInfo.reason) {
    console.log("Tab has mutedInfo reason:", tab.id, tab.mutedInfo.reason);
    return true;
  }

  return false;
}

/**
 * Check if tab should never be tracked
 * @param {Object} tab - Chrome tab object
 * @returns {boolean} True if tab should never be tracked
 */
export function shouldNeverTrack(tab) {
  if (!tab.url) return false;

  try {
    const url = new URL(tab.url);
    return NEVER_TRACK_DOMAINS.some((domain) => url.hostname.includes(domain));
  } catch (e) {
    return false;
  }
}

/**
 * Check if URL is whitelisted
 * @param {string} url - URL to check
 * @param {Array} whitelist - Whitelist array
 * @returns {boolean} True if URL is whitelisted
 */
export function isWhitelisted(url, whitelist) {
  if (!url) return false;
  try {
    return (
      whitelist.includes(url) ||
      whitelist.some((whitelistedUrl) => {
        try {
          const whitelistedOrigin = new URL(whitelistedUrl).origin;
          return whitelistedOrigin === new URL(url).origin;
        } catch {
          return false;
        }
      })
    );
  } catch (error) {
    return false;
  }
}

/**
 * Check if tab is currently protected
 * @param {Object} tab - Chrome tab object
 * @param {Array} whitelist - Whitelist array
 * @param {Object} settings - Settings object
 * @returns {boolean} True if tab is protected
 */
export function isTabProtected(tab, whitelist, settings) {
  const isUrlWhitelisted = isWhitelisted(tab.url, whitelist);
  const isPinnedAndProtected = settings.whitelistPinned && tab.pinned;
  const hasActiveMedia = hasMediaActivity(tab);
  const shouldNeverTrackTab = shouldNeverTrack(tab);

  return (
    isUrlWhitelisted ||
    isPinnedAndProtected ||
    hasActiveMedia ||
    shouldNeverTrackTab
  );
}

/**
 * Get tab origin safely
 * @param {string} url - Tab URL
 * @returns {string} Tab origin or original URL
 */
export function getTabOrigin(url) {
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
}

/**
 * Get protection reason for a tab
 * @param {Object} tab - Chrome tab object
 * @returns {Object} Protection reason with type and text
 */
export function getTabProtectionReason(tab) {
  if (tab.audible === true) {
    return { type: "audio", text: "Playing audio" };
  }

  if (tab.mutedInfo && tab.mutedInfo.reason === "capture") {
    return { type: "video", text: "Using camera/microphone" };
  }

  if (tab.mutedInfo && tab.mutedInfo.extensionId && !tab.mutedInfo.muted) {
    return { type: "video", text: "Active media" };
  }

  if (shouldNeverTrack(tab)) {
    return { type: "never-track", text: "Video call site" };
  }

  return { type: "unknown", text: "Media protected" };
}

/**
 * Clean tab title from icons
 * @param {string} title - Tab title
 * @returns {string} Cleaned title
 */
export function cleanTabTitle(title) {
  return title
    .replace(/^💤\s*/, "")
    .replace(/^🔒\s*/, "")
    .trim();
}
