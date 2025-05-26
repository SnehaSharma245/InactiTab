// Global variables
let INACTIVE_TIMEOUT = 5000; // 5 seconds for testing
let tabTimers = new Map();
let activeTabId = null;
let inactiveTabs = new Set();
let whitelist = [];
let settings = {
  timerValue: 5,
  timerUnit: "seconds",
  tabThreshold: 10,
  whitelistPinned: true,
  autoClose: false,
};

// Initialize the extension
function init() {
  loadSettings();
  loadWhitelist();
  setupEventListeners();
  createContextMenu();
  initializeTabs();
}

async function initializeTabs() {
  // Initialize - Get current active tab first
  const activeTabs = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (activeTabs.length > 0) {
    activeTabId = activeTabs[0].id;
    console.log(`🎯 Active tab:- "${activeTabs[0].title}"`);
  }

  // Initialize timers for all existing tabs
  const allTabs = await chrome.tabs.query({});
  allTabs.forEach((tab) => {
    console.log(`🔍 Tab found:- "${tab.title}"`);
    tabTimers.set(tab.id, {
      interval: null,
      startTime: null,
      elapsedTime: 0,
      isPaused: true,
    });
  });

  // Start timers for inactive tabs
  setTimeout(() => {
    if (activeTabId) {
      startAllInactiveTimers(activeTabId);
    }
  }, 1000);
}

function setupEventListeners() {
  // Handle messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message, sender, sendResponse);
    return true;
  });

  // Tab events
  chrome.tabs.onActivated.addListener((activeInfo) => {
    handleTabActivated(activeInfo);
  });

  chrome.tabs.onCreated.addListener((tab) => {
    handleTabCreated(tab);
  });

  chrome.tabs.onRemoved.addListener((tabId) => {
    handleTabRemoved(tabId);
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    handleTabUpdated(tabId, changeInfo, tab);
  });

  // Extension installed/startup
  chrome.runtime.onStartup.addListener(() => {
    createContextMenu();
  });

  chrome.runtime.onInstalled.addListener(() => {
    createContextMenu();
  });
}

function createContextMenu() {
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
      whitelistTab(tab);
    }
  });
}

function startAllInactiveTimers(exceptTabId) {
  console.log(
    `🌟 Starting/Resuming timers for inactive tabs except: ${exceptTabId}`
  );
  tabTimers.forEach((timer, tabId) => {
    if (tabId !== exceptTabId) {
      // Check if tab should be tracked before resuming timer
      chrome.tabs
        .get(tabId)
        .then((tab) => {
          // Only skip if URL is whitelisted OR (tab is pinned AND whitelistPinned setting is enabled)
          const isUrlWhitelisted = isWhitelisted(tab.url);
          const isPinnedAndProtected = settings.whitelistPinned && tab.pinned;

          if (!isUrlWhitelisted && !isPinnedAndProtected) {
            resumeTimer(tabId);
            console.log(
              `▶️ Resumed timer for inactive tab: ${tabId} (pinned: ${tab.pinned}, whitelistPinned: ${settings.whitelistPinned})`
            );
          } else {
            if (isUrlWhitelisted) {
              console.log(
                `🛡️ Skipping URL whitelisted tab: ${tabId} - ${tab.url}`
              );
            }
            if (isPinnedAndProtected) {
              console.log(
                `📌 Skipping pinned tab (protected): ${tabId} - ${tab.title}`
              );
            }
          }
        })
        .catch(() => {
          // Tab might not exist anymore
        });
    }
  });
}

function markTabInactive(tabId) {
  inactiveTabs.add(tabId);

  // Check if auto-close is enabled
  if (settings.autoClose) {
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
      console.log(`❌ Could not inject inactive icon for tab ${tabId}:`, error);
    });

  console.log(`🚨 Marked tab ${tabId} as inactive`);
}

function markTabActive(tabId) {
  if (inactiveTabs.has(tabId)) {
    inactiveTabs.delete(tabId);

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

function pauseAndResetTimer(tabId) {
  if (tabTimers.has(tabId)) {
    const timer = tabTimers.get(tabId);
    if (timer.interval) {
      clearInterval(timer.interval);
    }
    timer.elapsedTime = 0;
    timer.startTime = null;
    timer.interval = null;
    timer.isPaused = true;

    markTabActive(tabId);
    console.log(`⏸️🔄 Paused and reset timer for active tab ${tabId} to 0s`);
  }
}

function resumeTimer(tabId) {
  if (tabTimers.has(tabId)) {
    const timer = tabTimers.get(tabId);

    if (timer.interval) {
      return;
    }

    timer.startTime = Date.now();
    timer.isPaused = false;

    const interval = setInterval(async () => {
      const currentElapsed = timer.elapsedTime + (Date.now() - timer.startTime);

      try {
        const tab = await chrome.tabs.get(tabId);

        // Check if tab should be protected from tracking
        const isUrlWhitelisted = isWhitelisted(tab.url);
        const isPinnedAndProtected = settings.whitelistPinned && tab.pinned;

        if (isUrlWhitelisted || isPinnedAndProtected) {
          console.log(
            `🛡️ Tab ${tabId} is now protected, stopping timer (URL whitelisted: ${isUrlWhitelisted}, Pinned protected: ${isPinnedAndProtected})`
          );
          clearInterval(interval);
          timer.interval = null;
          markTabActive(tabId);
          return;
        }

        console.log(
          `⏱️ Tab "${tab.title}" (${tabId}) - Total elapsed: ${Math.floor(
            currentElapsed / 1000
          )}s (pinned: ${tab.pinned})`
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

      if (currentElapsed >= getTimerDurationMs()) {
        console.log(`⚠️ Tab ${tabId} reached inactive timeout!`);
        markTabInactive(tabId);
        clearInterval(interval);
        timer.interval = null;
      }
    }, 1000);

    timer.interval = interval;
  }
}

async function handleTabActivated(activeInfo) {
  const newActiveTabId = activeInfo.tabId;
  try {
    const tab = await chrome.tabs.get(newActiveTabId);
    console.log(`🔀 Tab switched to: "${tab.title}" (${newActiveTabId})`);
  } catch (error) {
    console.log(`🔀 Tab switched to: ${newActiveTabId}`);
  }

  console.log(`⏸️ Pausing all existing timers`);
  tabTimers.forEach((timer, tabId) => {
    if (timer.interval && !timer.isPaused && tabId !== newActiveTabId) {
      pauseTimer(tabId);
    }
  });

  pauseAndResetTimer(newActiveTabId);
  startAllInactiveTimers(newActiveTabId);

  activeTabId = newActiveTabId;
  console.log(`✅ Active tab updated to: ${newActiveTabId}`);
}

function handleTabCreated(tab) {
  console.log(`➕ New tab created: ${tab.id} - "${tab.title || "Loading..."}"`);
  tabTimers.set(tab.id, {
    interval: null,
    startTime: null,
    elapsedTime: 0,
    isPaused: true,
  });
}

function handleTabRemoved(tabId) {
  if (tabTimers.has(tabId)) {
    const timer = tabTimers.get(tabId);
    if (timer.interval) {
      clearInterval(timer.interval);
    }
    tabTimers.delete(tabId);
  }

  inactiveTabs.delete(tabId);
  console.log(`❌ Tab closed and timer removed: ${tabId}`);
}

function handleTabUpdated(tabId, changeInfo, tab) {
  if (changeInfo.url) {
    // Check if tab should be protected after URL change
    const isUrlWhitelisted = isWhitelisted(tab.url);
    const isPinnedAndProtected = settings.whitelistPinned && tab.pinned;

    if (isUrlWhitelisted || isPinnedAndProtected) {
      pauseAndResetTimer(tabId);
      markTabActive(tabId);
      console.log(
        `🔄 Tab ${tabId} updated - now protected (URL: ${isUrlWhitelisted}, Pinned: ${isPinnedAndProtected})`
      );
    }
  }

  // Handle pinned status change
  if (changeInfo.pinned !== undefined) {
    const isPinnedAndProtected = settings.whitelistPinned && changeInfo.pinned;
    const isUrlWhitelisted = isWhitelisted(tab.url);

    if (isPinnedAndProtected || isUrlWhitelisted) {
      pauseAndResetTimer(tabId);
      markTabActive(tabId);
      console.log(
        `📌 Tab ${tabId} pinned status changed - now protected: ${isPinnedAndProtected}`
      );
    } else if (
      !changeInfo.pinned &&
      !isUrlWhitelisted &&
      tabId !== activeTabId
    ) {
      // Tab was unpinned and not whitelisted, start tracking it
      resumeTimer(tabId);
      console.log(`📌 Tab ${tabId} unpinned - starting timer`);
    }
  }
}

async function whitelistTab(tab) {
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
    if (!whitelist.includes(url)) {
      whitelist.push(url);
      saveWhitelist();

      pauseAndResetTimer(tab.id);
      markTabActive(tab.id);

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

function handleMessage(message, sender, sendResponse) {
  switch (message.action) {
    case "updateSettings":
      settings = message.settings;
      saveSettings();
      INACTIVE_TIMEOUT = getTimerDurationMs();
      // Refresh timers when whitelistPinned setting changes
      refreshAllTimers();
      console.log(
        `⚙️ Settings updated - whitelistPinned: ${settings.whitelistPinned}`
      );
      break;

    case "updateWhitelist":
      whitelist = message.whitelist;
      saveWhitelist();
      refreshAllTimers();
      break;

    case "whitelistTab":
      pauseAndResetTimer(message.tabId);
      break;

    case "keepTab":
      if (sender.tab) {
        pauseAndResetTimer(sender.tab.id);
      }
      break;

    case "getInactiveTime":
      if (sender.tab && tabTimers.has(sender.tab.id)) {
        const timer = tabTimers.get(sender.tab.id);
        const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
        sendResponse({ time: elapsed });
      }
      break;
  }
  return true;
}

function refreshAllTimers() {
  tabTimers.forEach((timer, tabId) => {
    if (timer.interval) {
      clearInterval(timer.interval);
      timer.interval = null;
      timer.isPaused = true;
    }
  });

  if (activeTabId) {
    startAllInactiveTimers(activeTabId);
  }
}

function isWhitelisted(url) {
  if (!url) return false;
  try {
    const origin = new URL(url).origin;
    return whitelist.includes(origin);
  } catch (error) {
    return false;
  }
}

function isPinnedAndWhitelisted(tab) {
  // This method should only return true if BOTH conditions are met:
  // 1. The setting whitelistPinned is enabled
  // 2. The tab is actually pinned
  return settings.whitelistPinned && tab.pinned;
}

function getTimerDurationMs() {
  let duration = settings.timerValue;
  switch (settings.timerUnit) {
    case "minutes":
      duration *= 60;
      break;
    case "hours":
      duration *= 3600;
      break;
  }
  return duration * 1000;
}

function pauseTimer(tabId) {
  if (tabTimers.has(tabId)) {
    const timer = tabTimers.get(tabId);
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

function loadSettings() {
  chrome.storage.local.get("inactiTabSettings", (data) => {
    if (data.inactiTabSettings) {
      settings = { ...settings, ...data.inactiTabSettings };
      INACTIVE_TIMEOUT = getTimerDurationMs();
    }
  });
}

function saveSettings() {
  chrome.storage.local.set({ inactiTabSettings: settings });
}

function loadWhitelist() {
  chrome.storage.local.get("inactiTabWhitelist", (data) => {
    if (data.inactiTabWhitelist) {
      whitelist = data.inactiTabWhitelist;
    }
  });
}

function saveWhitelist() {
  chrome.storage.local.set({ inactiTabWhitelist: whitelist });
}

// Initialize the extension when script loads
init();
