/**
 * Main tab management class for InactiTab extension
 */

import { TabTimer, getTimerDurationMs } from "../utils/timerUtils.js";
import {
  hasMediaActivity,
  shouldNeverTrack,
  isWhitelisted,
  isTabProtected,
  getTabOrigin,
  getTabProtectionReason,
  cleanTabTitle,
} from "../utils/tabUtils.js";
import { saveAutoClosedTab, saveProtectedTabs } from "../utils/storageUtils.js";
import {
  injectSleepIndicator,
  removeSleepIndicator,
  injectWhitelistIndicator,
  removeWhitelistIndicator,
  refreshTabContent,
} from "../utils/scriptUtils.js";

export class TabManager {
  constructor() {
    this.tabTimers = new Map();
    this.activeTabId = null;
    this.inactiveTabs = new Set();
    this.whitelist = [];
    this.settings = {};
  }

  /**
   * Initialize the tab manager
   * @param {Object} settings - Extension settings
   * @param {Array} whitelist - Whitelist array
   */
  async initialize(settings, whitelist) {
    this.settings = settings;
    this.whitelist = whitelist;

    // Get current active tab
    const activeTabs = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (activeTabs.length > 0) {
      this.activeTabId = activeTabs[0].id;
    }

    // Initialize timers for all existing tabs
    const allTabs = await chrome.tabs.query({});
    allTabs.forEach((tab) => {
      this.tabTimers.set(tab.id, new TabTimer());
    });

    // Start timers for inactive tabs after delay
    setTimeout(() => {
      if (this.activeTabId) {
        this.startAllInactiveTimers(this.activeTabId);
      }
      this.updateProtectedTabsStorage();
    }, 1000);
  }

  /**
   * Handle tab activation
   * @param {Object} activeInfo - Tab activation info
   */
  async handleTabActivated(activeInfo) {
    const newActiveTabId = activeInfo.tabId;

    await refreshTabContent(newActiveTabId);

    // Pause all other timers
    this.tabTimers.forEach((timer, tabId) => {
      if (timer.interval && !timer.isPaused && tabId !== newActiveTabId) {
        timer.pause();
      }
    });

    this.pauseAndResetTimer(newActiveTabId);
    this.startAllInactiveTimers(newActiveTabId);

    this.activeTabId = newActiveTabId;
    setTimeout(() => this.updateProtectedTabsStorage(), 500);
  }

  /**
   * Handle tab creation
   * @param {Object} tab - Created tab
   */
  handleTabCreated(tab) {
    this.tabTimers.set(tab.id, new TabTimer());

    chrome.tabs.query({}, (allTabs) => {
      if (allTabs.length > this.settings.tabThreshold) {
        setTimeout(() => {
          chrome.tabs
            .get(tab.id)
            .then((updatedTab) => {
              const isUrlWhitelisted = isWhitelisted(
                updatedTab.url,
                this.whitelist
              );

              if (isUrlWhitelisted) {
                this.updateTabIcon(tab.id, true);
              } else if (
                !isTabProtected(updatedTab, this.whitelist, this.settings) &&
                tab.id !== this.activeTabId
              ) {
                this.resumeTimer(tab.id);
              }

              this.updateProtectedTabsStorage();
            })
            .catch(() => {});
        }, 1000);
      }
    });
  }

  /**
   * Handle tab updates
   * @param {number} tabId - Tab ID
   * @param {Object} changeInfo - Change information
   * @param {Object} tab - Updated tab
   */
  handleTabUpdated(tabId, changeInfo, tab) {
    console.log("Tab updated:", tabId, changeInfo, tab.audible, tab.url);

    if (changeInfo.url) {
      const isUrlWhitelisted = isWhitelisted(tab.url, this.whitelist);
      this.updateTabIcon(tabId, isUrlWhitelisted);

      if (isTabProtected(tab, this.whitelist, this.settings)) {
        this.pauseAndResetTimer(tabId);
        this.markTabActive(tabId);
      }
    }

    if (changeInfo.pinned !== undefined) {
      if (isTabProtected(tab, this.whitelist, this.settings)) {
        this.pauseAndResetTimer(tabId);
        this.markTabActive(tabId);
      } else if (
        !changeInfo.pinned &&
        !isWhitelisted(tab.url, this.whitelist) &&
        tabId !== this.activeTabId
      ) {
        this.resumeTimer(tabId);
      }
    }

    // Handle media state changes
    if (
      changeInfo.audible !== undefined ||
      changeInfo.mutedInfo !== undefined ||
      changeInfo.url
    ) {
      const hasActiveMedia = hasMediaActivity(tab);

      if (hasActiveMedia) {
        this.pauseAndResetTimer(tabId);
      } else if (
        tabId !== this.activeTabId &&
        !isTabProtected(tab, this.whitelist, this.settings)
      ) {
        this.resumeTimer(tabId);
      }
    }

    setTimeout(() => this.updateProtectedTabsStorage(), 500);
  }

  /**
   * Handle tab removal
   * @param {number} tabId - Removed tab ID
   */
  handleTabRemoved(tabId) {
    if (this.tabTimers.has(tabId)) {
      const timer = this.tabTimers.get(tabId);
      timer.stop();
      this.tabTimers.delete(tabId);
    }

    this.inactiveTabs.delete(tabId);

    // Update storage
    chrome.storage.local.set({
      inactiveTabs: Array.from(this.inactiveTabs),
    });

    chrome.tabs.query({}, (allTabs) => {
      if (allTabs.length <= this.settings.tabThreshold) {
        this.tabTimers.forEach((timer) => {
          timer.stop();
        });
      }
    });

    this.updateProtectedTabsStorage();
  }

  /**
   * Start timers for all inactive tabs
   * @param {number} exceptTabId - Tab ID to exclude
   */
  startAllInactiveTimers(exceptTabId) {
    chrome.tabs.query({}, (allTabs) => {
      if (allTabs.length <= this.settings.tabThreshold) {
        return;
      }

      this.tabTimers.forEach((timer, tabId) => {
        if (tabId !== exceptTabId) {
          chrome.tabs
            .get(tabId)
            .then((tab) => {
              if (!isTabProtected(tab, this.whitelist, this.settings)) {
                this.resumeTimer(tabId);
              }
            })
            .catch(() => {});
        }
      });
    });
  }

  /**
   * Mark tab as inactive and handle accordingly
   * @param {number} tabId - Tab ID
   */
  async markTabInactive(tabId) {
    this.inactiveTabs.add(tabId);

    // Store inactive tabs in chrome storage for popup access
    await chrome.storage.local.set({
      inactiveTabs: Array.from(this.inactiveTabs),
    });

    if (this.settings.autoClose) {
      try {
        const tab = await chrome.tabs.get(tabId);
        const tabInfo = {
          url: tab.url,
          title: cleanTabTitle(tab.title), // Use cleaned title
          favIconUrl: tab.favIconUrl,
          timestamp: Date.now(),
        };

        await saveAutoClosedTab(tabInfo, this.settings.historyLimit);
        chrome.tabs.remove(tabId);
      } catch (error) {
        console.error("Error saving tab to history:", error);
      }
    } else {
      // Only add favicon badge, no title modification
      await injectSleepIndicator(tabId);
    }
  }

  /**
   * Mark tab as active
   * @param {number} tabId - Tab ID
   */
  async markTabActive(tabId) {
    if (this.inactiveTabs.has(tabId)) {
      this.inactiveTabs.delete(tabId);

      // Update storage
      await chrome.storage.local.set({
        inactiveTabs: Array.from(this.inactiveTabs),
      });

      await removeSleepIndicator(tabId);
    }
  }

  /**
   * Pause and reset timer for tab
   * @param {number} tabId - Tab ID
   */
  pauseAndResetTimer(tabId) {
    if (this.tabTimers.has(tabId)) {
      const timer = this.tabTimers.get(tabId);
      timer.stop();
      this.markTabActive(tabId);
    }
  }

  /**
   * Resume timer for tab
   * @param {number} tabId - Tab ID
   */
  resumeTimer(tabId) {
    if (!this.tabTimers.has(tabId)) return;

    const timer = this.tabTimers.get(tabId);
    const duration = getTimerDurationMs(this.settings);

    timer.start(
      () => this.markTabInactive(tabId),
      duration,
      async () => {
        try {
          const tab = await chrome.tabs.get(tabId);
          return isTabProtected(tab, this.whitelist, this.settings);
        } catch {
          return true; // Assume protected if tab doesn't exist
        }
      }
    );
  }

  /**
   * Update tab icon based on whitelist status
   * @param {number} tabId - Tab ID
   * @param {boolean} isWhitelisted - Whether tab is whitelisted
   */
  async updateTabIcon(tabId, isWhitelisted) {
    if (isWhitelisted) {
      await injectWhitelistIndicator(tabId);
    } else {
      await removeWhitelistIndicator(tabId);
    }
  }

  /**
   * Update settings and refresh timers
   * @param {Object} newSettings - New settings
   */
  updateSettings(newSettings) {
    this.settings = newSettings;
    this.refreshAllTimers();
  }

  /**
   * Update whitelist and refresh timers
   * @param {Array} newWhitelist - New whitelist
   */
  updateWhitelist(newWhitelist) {
    this.whitelist = newWhitelist;
    this.refreshAllTimers();
  }

  /**
   * Refresh all timers
   */
  refreshAllTimers() {
    this.tabTimers.forEach((timer) => {
      timer.stop();
    });

    chrome.tabs.query({}, (allTabs) => {
      if (allTabs.length > this.settings.tabThreshold && this.activeTabId) {
        this.startAllInactiveTimers(this.activeTabId);
      }
    });
  }

  /**
   * Update protected tabs storage
   */
  async updateProtectedTabsStorage() {
    try {
      const allTabs = await chrome.tabs.query({});

      const protectedTabsData = allTabs
        .filter((tab) => {
          if (tab.active) return false;
          return hasMediaActivity(tab) || shouldNeverTrack(tab);
        })
        .map((tab) => ({
          id: tab.id,
          title: cleanTabTitle(tab.title),
          url: tab.url,
          favIconUrl: tab.favIconUrl,
          origin: getTabOrigin(tab.url),
          protectionReason: getTabProtectionReason(tab),
          audible: tab.audible,
          pinned: tab.pinned,
        }));

      await saveProtectedTabs(protectedTabsData);
    } catch (error) {
      console.error("Error updating protected tabs storage:", error);
    }
  }

  /**
   * Get elapsed time for a tab
   * @param {number} tabId - Tab ID
   * @returns {number} Elapsed time in seconds
   */
  getTabElapsedTime(tabId) {
    if (this.tabTimers.has(tabId)) {
      return this.tabTimers.get(tabId).getElapsedTime();
    }
    return 0;
  }
}
