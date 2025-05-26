class InactiTabBackground {
  constructor() {
    this.INACTIVE_TIMEOUT = 5000; // 5 seconds for testing
    this.tabTimers = new Map();
    this.activeTabId = null;
    this.inactiveTabs = new Set();
    this.whitelist = [];
    this.settings = {
      timerValue: 5,
      timerUnit: "seconds",
      tabThreshold: 10,
      whitelistPinned: true,
      autoClose: false,
    };

    this.init();
  }

  init() {
    this.loadSettings();
    this.loadWhitelist();
    this.setupEventListeners();
    this.createContextMenu();
    this.initializeTabs();
  }

  async initializeTabs() {
    // Initialize - Get current active tab first
    const activeTabs = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (activeTabs.length > 0) {
      this.activeTabId = activeTabs[0].id;
      console.log(`🎯 Active tab:- "${activeTabs[0].title}"`);
    }

    // Initialize timers for all existing tabs
    const allTabs = await chrome.tabs.query({});
    allTabs.forEach((tab) => {
      console.log(`🔍 Tab found:- "${tab.title}"`);
      this.tabTimers.set(tab.id, {
        interval: null,
        startTime: null,
        elapsedTime: 0,
        isPaused: true,
      });
    });

    // Start timers for inactive tabs
    setTimeout(() => {
      if (this.activeTabId) {
        this.startAllInactiveTimers(this.activeTabId);
      }
    }, 1000);
  }

  setupEventListeners() {
    // Handle messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });

    // Tab events
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabActivated(activeInfo);
    });

    chrome.tabs.onCreated.addListener((tab) => {
      this.handleTabCreated(tab);
    });

    chrome.tabs.onRemoved.addListener((tabId) => {
      this.handleTabRemoved(tabId);
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdated(tabId, changeInfo, tab);
    });

    // Extension installed/startup
    chrome.runtime.onStartup.addListener(() => {
      this.createContextMenu();
    });

    chrome.runtime.onInstalled.addListener(() => {
      this.createContextMenu();
    });
  }

  createContextMenu() {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: "whitelist-tab",
        title: "🛡️ Whitelist this tab",
        contexts: ["page"],
        documentUrlPatterns: ["http://*/*", "https://*/*"],
      });

      chrome.contextMenus.create({
        id: "whitelist-current-tab",
        title: "🛡️ Whitelist current tab",
        contexts: ["action"],
      });
    });

    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (
        info.menuItemId === "whitelist-tab" ||
        info.menuItemId === "whitelist-current-tab"
      ) {
        this.whitelistTab(tab);
      }
    });
  }

  startAllInactiveTimers(exceptTabId) {
    console.log(
      `🌟 Starting/Resuming timers for inactive tabs except: ${exceptTabId}`
    );
    this.tabTimers.forEach((timer, tabId) => {
      if (tabId !== exceptTabId) {
        // Check if tab should be tracked before resuming timer
        chrome.tabs.get(tabId).then((tab) => {
          if (
            !this.isWhitelisted(tab.url) &&
            !this.isPinnedAndWhitelisted(tab)
          ) {
            this.resumeTimer(tabId);
            console.log(`▶️ Resumed timer for inactive tab: ${tabId}`);
          } else {
            console.log(
              `🛡️ Skipping whitelisted tab: ${tabId} - ${tab.url}`
            );
          }
        }).catch(() => {
          // Tab might not exist anymore
        });
      }
    });
  }

  markTabInactive(tabId) {
    this.inactiveTabs.add(tabId);

    // Check if auto-close is enabled
    if (this.settings.autoClose) {
      console.log(`🔥 Auto-closing inactive tab: ${tabId}`);
      chrome.tabs.remove(tabId);
      return;
    }

    // Only show inactive icon if auto-close is disabled
    chrome.scripting
      .executeScript({
        target: { tabId: tabId },
        func: () => {
          let inactiveIcon = document.getElementById("inactive-tab-icon");
          if (!inactiveIcon) {
            inactiveIcon = document.createElement("div");
            inactiveIcon.id = "inactive-tab-icon";
            inactiveIcon.innerHTML = "⚠️";
            inactiveIcon.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #ff4444;
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 14px;
            z-index: 10000;
            font-weight: bold;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          `;
            document.body.appendChild(inactiveIcon);
          }

          if (!document.title.includes("⚠️ INACTIVE")) {
            document.title = `⚠️ INACTIVE - ${document.title}`;
          }
        },
      })
      .catch((error) => {
        console.log(
          `❌ Could not inject inactive icon for tab ${tabId}:`,
          error
        );
      });

    console.log(`🚨 Marked tab ${tabId} as inactive`);
  }

  markTabActive(tabId) {
    if (this.inactiveTabs.has(tabId)) {
      this.inactiveTabs.delete(tabId);

      chrome.scripting
        .executeScript({
          target: { tabId: tabId },
          func: () => {
            const inactiveIcon = document.getElementById("inactive-tab-icon");
            if (inactiveIcon) {
              inactiveIcon.remove();
            }

            if (document.title.includes("⚠️ INACTIVE - ")) {
              document.title = document.title.replace("⚠️ INACTIVE - ", "");
            }
          },
        })
        .catch((error) => {
          console.log(
            `❌ Could not remove inactive icon for tab ${tabId}:`,
            error
          );
        });

      console.log(`✅ Marked tab ${tabId} as active (removed inactive icon)`);
    }
  }

  pauseAndResetTimer(tabId) {
    if (this.tabTimers.has(tabId)) {
      const timer = this.tabTimers.get(tabId);
      if (timer.interval) {
        clearInterval(timer.interval);
      }
      timer.elapsedTime = 0;
      timer.startTime = null;
      timer.interval = null;
      timer.isPaused = true;

      this.markTabActive(tabId);
      console.log(`⏸️🔄 Paused and reset timer for active tab ${tabId} to 0s`);
    }
  }

  resumeTimer(tabId) {
    if (this.tabTimers.has(tabId)) {
      const timer = this.tabTimers.get(tabId);

      if (timer.interval) {
        return;
      }

      timer.startTime = Date.now();
      timer.isPaused = false;

      const interval = setInterval(async () => {
        const currentElapsed =
          timer.elapsedTime + (Date.now() - timer.startTime);

        try {
          const tab = await chrome.tabs.get(tabId);

          if (this.isWhitelisted(tab.url) || this.isPinnedAndWhitelisted(tab)) {
            console.log(`🛡️ Tab ${tabId} is now whitelisted, stopping timer`);
            clearInterval(interval);
            timer.interval = null;
            this.markTabActive(tabId);
            return;
          }

          console.log(
            `⏱️ Tab "${tab.title}" (${tabId}) - Total elapsed: ${Math.floor(
              currentElapsed / 1000
            )}s`
          );
        } catch (error) {
          console.log(
            `⏱️ Tab ${tabId} - Total elapsed: ${Math.floor(
              currentElapsed / 1000
            )}s (Tab might be closed)`
          );
          clearInterval(interval);
          return;
        }

        if (currentElapsed >= this.getTimerDurationMs()) {
          console.log(`⚠️ Tab ${tabId} reached inactive timeout!`);
          this.markTabInactive(tabId);
          clearInterval(interval);
          timer.interval = null;
        }
      }, 1000);

      timer.interval = interval;
    }
  }

  async handleTabActivated(activeInfo) {
    const newActiveTabId = activeInfo.tabId;
    try {
      const tab = await chrome.tabs.get(newActiveTabId);
      console.log(`🔀 Tab switched to: "${tab.title}" (${newActiveTabId})`);
    } catch (error) {
      console.log(`🔀 Tab switched to: ${newActiveTabId}`);
    }

    console.log(`⏸️ Pausing all existing timers`);
    this.tabTimers.forEach((timer, tabId) => {
      if (timer.interval && !timer.isPaused && tabId !== newActiveTabId) {
        this.pauseTimer(tabId);
      }
    });

    this.pauseAndResetTimer(newActiveTabId);
    this.startAllInactiveTimers(newActiveTabId);

    this.activeTabId = newActiveTabId;
    console.log(`✅ Active tab updated to: ${newActiveTabId}`);
  }

  handleTabCreated(tab) {
    console.log(
      `➕ New tab created: ${tab.id} - "${tab.title || "Loading..."}"`
    );
    this.tabTimers.set(tab.id, {
      interval: null,
      startTime: null,
      elapsedTime: 0,
      isPaused: true,
    });
  }

  handleTabRemoved(tabId) {
    if (this.tabTimers.has(tabId)) {
      const timer = this.tabTimers.get(tabId);
      if (timer.interval) {
        clearInterval(timer.interval);
      }
      this.tabTimers.delete(tabId);
    }

    this.inactiveTabs.delete(tabId);
    console.log(`❌ Tab closed and timer removed: ${tabId}`);
  }

  handleTabUpdated(tabId, changeInfo, tab) {
    if (changeInfo.url) {
      if (this.isWhitelisted(tab.url) || this.isPinnedAndWhitelisted(tab)) {
        this.pauseAndResetTimer(tabId);
        this.markTabActive(tabId);
      }
    }
  }

  async whitelistTab(tab) {
    try {
      if (!tab || !tab.url) {
        const [activeTab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        tab = activeTab;
      }

      if (!tab || !tab.url) {
        console.error("No valid tab to whitelist");
        return;
      }

      const url = new URL(tab.url).origin;
      if (!this.whitelist.includes(url)) {
        this.whitelist.push(url);
        this.saveWhitelist();

        this.pauseAndResetTimer(tab.id);
        this.markTabActive(tab.id);

        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon48.png",
          title: "Tab Whitelisted",
          message: `${url} has been added to whitelist`,
        });
      } else {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon48.png",
          title: "Already Whitelisted",
          message: `${url} is already in whitelist`,
        });
      }
    } catch (error) {
      console.error("Error whitelisting tab:", error);
    }
  }

  handleMessage(message, sender, sendResponse) {
    switch (message.action) {
      case "updateSettings":
        this.settings = message.settings;
        this.saveSettings();
        this.INACTIVE_TIMEOUT = this.getTimerDurationMs();
        break;

      case "updateWhitelist":
        this.whitelist = message.whitelist;
        this.saveWhitelist();
        this.refreshAllTimers();
        break;

      case "whitelistTab":
        this.pauseAndResetTimer(message.tabId);
        break;

      case "keepTab":
        if (sender.tab) {
          this.pauseAndResetTimer(sender.tab.id);
        }
        break;

      case "getInactiveTime":
        if (sender.tab && this.tabTimers.has(sender.tab.id)) {
          const timer = this.tabTimers.get(sender.tab.id);
          const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
          sendResponse({ time: elapsed });
        }
        break;
    }
    return true;
  }

  refreshAllTimers() {
    this.tabTimers.forEach((timer, tabId) => {
      if (timer.interval) {
        clearInterval(timer.interval);
        timer.interval = null;
        timer.isPaused = true;
      }
    });

    if (this.activeTabId) {
      this.startAllInactiveTimers(this.activeTabId);
    }
  }

  isWhitelisted(url) {
    if (!url) return false;
    try {
      const origin = new URL(url).origin;
      return this.whitelist.includes(origin);
    } catch (error) {
      return false;
    }
  }

  isPinnedAndWhitelisted(tab) {
    return this.settings.whitelistPinned && tab.pinned;
  }

  getTimerDurationMs() {
    let duration = this.settings.timerValue;
    switch (this.settings.timerUnit) {
      case "minutes":
        duration *= 60;
        break;
      case "hours":
        duration *= 3600;
        break;
    }
    return duration * 1000;
  }

  pauseTimer(tabId) {
    if (this.tabTimers.has(tabId)) {
      const timer = this.tabTimers.get(tabId);
      if (timer.interval) {
        clearInterval(timer.interval);
        if (timer.startTime) {
          timer.elapsedTime += Date.now() - timer.startTime;
        }
        timer.isPaused = true;
        timer.interval = null;
        console.log(
          `⏸️ Paused timer for tab ${tabId} - Total elapsed: ${Math.floor(
            timer.elapsedTime / 1000
          )}s`
        );
      }
    }
  }

  loadSettings() {
    chrome.storage.local.get("inactiTabSettings", (data) => {
      if (data.inactiTabSettings) {
        this.settings = { ...this.settings, ...data.inactiTabSettings };
        this.INACTIVE_TIMEOUT = this.getTimerDurationMs();
      }
    });
  }

  saveSettings() {
    chrome.storage.local.set({ inactiTabSettings: this.settings });
  }

  loadWhitelist() {
    chrome.storage.local.get("inactiTabWhitelist", (data) => {
      if (data.inactiTabWhitelist) {
        this.whitelist = data.inactiTabWhitelist;
      }
    });
  }

  saveWhitelist() {
    chrome.storage.local.set({ inactiTabWhitelist: this.whitelist });
  }
}

// Initialize background script
new InactiTabBackground();
