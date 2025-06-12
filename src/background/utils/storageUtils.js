/**
 * Storage utility functions for InactiTab extension
 */

// Default settings configuration
export const DEFAULT_SETTINGS = {
  timerValue: 5,
  timerUnit: "seconds",
  tabThreshold: 10,
  whitelistPinned: true,
  autoClose: false,
  historyLimit: 10,
};

/**
 * Load settings from chrome storage
 * @returns {Promise<Object>} Settings object
 */
export async function loadSettings() {
  try {
    const data = await chrome.storage.local.get("inactiTabSettings");
    return data.inactiTabSettings
      ? { ...DEFAULT_SETTINGS, ...data.inactiTabSettings }
      : DEFAULT_SETTINGS;
  } catch (error) {
    console.error("Error loading settings:", error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save settings to chrome storage
 * @param {Object} settings - Settings to save
 */
export async function saveSettings(settings) {
  try {
    await chrome.storage.local.set({ inactiTabSettings: settings });
  } catch (error) {
    console.error("Error saving settings:", error);
  }
}

/**
 * Load whitelist from chrome storage
 * @returns {Promise<Array>} Whitelist array
 */
export async function loadWhitelist() {
  try {
    const data = await chrome.storage.local.get("inactiTabWhitelist");
    return data.inactiTabWhitelist || [];
  } catch (error) {
    console.error("Error loading whitelist:", error);
    return [];
  }
}

/**
 * Save whitelist to chrome storage
 * @param {Array} whitelist - Whitelist to save
 */
export async function saveWhitelist(whitelist) {
  try {
    await chrome.storage.local.set({ inactiTabWhitelist: whitelist });
  } catch (error) {
    console.error("Error saving whitelist:", error);
  }
}

/**
 * Save auto-closed tab to history
 * @param {Object} tabInfo - Tab information
 * @param {number} historyLimit - Maximum number of tabs to keep
 */
export async function saveAutoClosedTab(tabInfo, historyLimit) {
  try {
    const { autoclosedTabs = [] } = await chrome.storage.local.get(
      "autoclosedTabs"
    );

    const updatedTabs = [tabInfo, ...autoclosedTabs]
      .filter(
        (tab, index, self) => index === self.findIndex((t) => t.url === tab.url)
      )
      .slice(0, historyLimit);

    await chrome.storage.local.set({ autoclosedTabs: updatedTabs });
  } catch (error) {
    console.error("Error saving auto-closed tab:", error);
  }
}

/**
 * Save protected tabs to storage
 * @param {Array} protectedTabs - Protected tabs data
 */
export async function saveProtectedTabs(protectedTabs) {
  try {
    await chrome.storage.local.set({ protectedTabs });
  } catch (error) {
    console.error("Error saving protected tabs:", error);
  }
}
