/**
 * Script injection utility functions for InactiTab extension
 */

/**
 * Inject sleep mode indicator in tab title
 * @param {number} tabId - Tab ID
 */
export async function injectSleepIndicator(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // Add sleep emoji to title if not already present
        if (!document.title.startsWith("💤")) {
          document.title = "💤 " + document.title;
        }
      },
    });
  } catch (error) {
    console.error("Error injecting sleep indicator:", error);
  }
}

/**
 * Remove sleep mode indicators from tab title
 * @param {number} tabId - Tab ID
 */
export async function removeSleepIndicator(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // Remove sleep emoji from title
        document.title = document.title.replace(/^💤\s*/, "");
      },
    });
  } catch (error) {
    console.error("Error removing sleep indicator:", error);
  }
}

/**
 * Inject whitelist indicator in tab title
 * @param {number} tabId - Tab ID
 */
export async function injectWhitelistIndicator(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // Add lock emoji to title if not already present
        if (
          !document.title.startsWith("🔒") &&
          !document.title.startsWith("💤")
        ) {
          document.title = "🔒 " + document.title;
        }
      },
    });
  } catch (error) {
    console.error("Error injecting whitelist indicator:", error);
  }
}

/**
 * Remove whitelist indicators from tab title
 * @param {number} tabId - Tab ID
 */
export async function removeWhitelistIndicator(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // Remove lock emoji from title
        document.title = document.title.replace(/^🔒\s*/, "");
      },
    });
  } catch (error) {
    console.error("Error removing whitelist indicator:", error);
  }
}

/**
 * Inject media activity indicator in tab title
 * @param {number} tabId - Tab ID
 */
export async function injectMediaIndicator(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // Add music emoji to title if not already present
        if (
          !document.title.startsWith("🎵") &&
          !document.title.startsWith("💤") &&
          !document.title.startsWith("🔒")
        ) {
          document.title = "🎵 " + document.title;
        }
      },
    });
  } catch (error) {
    console.error("Error injecting media indicator:", error);
  }
}

/**
 * Refresh tab content to ensure proper functionality
 * @param {number} tabId - Tab ID
 */
export async function refreshTabContent(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // Clean up sleep indicator specifically when tab becomes active
        document.title = document.title.replace(/^💤\s*/, "");
      },
    });
  } catch (error) {
    console.error("Error refreshing tab content:", error);
  }
}

/**
 * Clean all indicators from tab title
 * @param {number} tabId - Tab ID
 */
export async function cleanAllIndicators(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // Remove all emoji indicators
        document.title = document.title.replace(/^[💤🔒🎵]\s*/, "");
      },
    });
  } catch (error) {
    console.error("Error cleaning indicators:", error);
  }
}
