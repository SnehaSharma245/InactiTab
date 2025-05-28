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
  historyLimit: 10, // Add this line
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
  }

  // Initialize timers for all existing tabs
  const allTabs = await chrome.tabs.query({});
  allTabs.forEach((tab) => {
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
    // Initialize protected tabs storage
    updateProtectedTabsStorage();
  }, 1000);
}

function setupEventListeners() {
  // Handle messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message, sender, sendResponse);
    return true;
  });

  // Tab events
  chrome.tabs.onActivated.addListener(handleTabActivated);
  chrome.tabs.onCreated.addListener(handleTabCreated);
  chrome.tabs.onRemoved.addListener(handleTabRemoved);
  chrome.tabs.onUpdated.addListener(handleTabUpdated);

  // Extension installed/startup - remove context menu listeners
  chrome.runtime.onStartup.addListener(() => {});
  chrome.runtime.onInstalled.addListener(() => {});
}

async function handleTabActivated(activeInfo) {
  const newActiveTabId = activeInfo.tabId;

  // Update inactive state and refresh content
  await refreshTabContent(newActiveTabId);

  tabTimers.forEach((timer, tabId) => {
    if (timer.interval && !timer.isPaused && tabId !== newActiveTabId) {
      pauseTimer(tabId);
    }
  });

  pauseAndResetTimer(newActiveTabId);
  startAllInactiveTimers(newActiveTabId);

  activeTabId = newActiveTabId;

  // Update protected tabs storage when active tab changes
  setTimeout(() => updateProtectedTabsStorage(), 500);
}

function handleTabCreated(tab) {
  tabTimers.set(tab.id, {
    interval: null,
    startTime: null,
    elapsedTime: 0,
    isPaused: true,
  });

  // Check if we should start tracking based on tab count
  chrome.tabs.query({}, (allTabs) => {
    if (allTabs.length > settings.tabThreshold) {
      // Check for whitelisted status after a brief delay
      setTimeout(() => {
        chrome.tabs
          .get(tab.id)
          .then((updatedTab) => {
            const isUrlWhitelisted = isWhitelisted(updatedTab.url);
            const hasActiveMedia = hasMediaActivity(updatedTab);
            const shouldNeverTrackTab = shouldNeverTrack(updatedTab);

            if (isUrlWhitelisted) {
              updateTabIcon(tab.id, true);
            } else if (
              tab.id !== activeTabId &&
              !hasActiveMedia &&
              !shouldNeverTrackTab
            ) {
              // Start timer for this new tab if it's not active, not whitelisted, has no active media, and should be tracked
              resumeTimer(tab.id);
            }

            // Update protected tabs storage after new tab is processed
            updateProtectedTabsStorage();
          })
          .catch(() => {});
      }, 1000);
    }
  });
}

function handleTabUpdated(tabId, changeInfo, tab) {
  console.log("Tab updated:", tabId, changeInfo, tab.audible, tab.url);

  if (changeInfo.url) {
    const isUrlWhitelisted = isWhitelisted(tab.url);
    const isPinnedAndProtected = settings.whitelistPinned && tab.pinned;

    updateTabIcon(tabId, isUrlWhitelisted);

    if (isUrlWhitelisted || isPinnedAndProtected) {
      pauseAndResetTimer(tabId);
      markTabActive(tabId);
    }
  }

  if (changeInfo.pinned !== undefined) {
    const isPinnedAndProtected = settings.whitelistPinned && changeInfo.pinned;
    const isUrlWhitelisted = isWhitelisted(tab.url);

    if (isPinnedAndProtected || isUrlWhitelisted) {
      pauseAndResetTimer(tabId);
      markTabActive(tabId);
    } else if (
      !changeInfo.pinned &&
      !isUrlWhitelisted &&
      tabId !== activeTabId
    ) {
      resumeTimer(tabId);
    }
  }

  // Handle media state changes (audio, video, camera)
  if (
    changeInfo.audible !== undefined ||
    changeInfo.mutedInfo !== undefined ||
    changeInfo.url
  ) {
    console.log(
      "Media state change detected for tab:",
      tabId,
      "audible:",
      tab.audible
    );

    const hasActiveMedia = hasMediaActivity(tab);
    console.log("Has active media:", hasActiveMedia);

    if (hasActiveMedia) {
      // Tab has active media - pause tracking
      pauseAndResetTimer(tabId);
      console.log("Paused tracking for tab with active media:", tabId);
    } else if (tabId !== activeTabId) {
      // Tab no longer has active media and is not the active tab
      const isUrlWhitelisted = isWhitelisted(tab.url);
      const isPinnedAndProtected = settings.whitelistPinned && tab.pinned;

      if (!isUrlWhitelisted && !isPinnedAndProtected) {
        resumeTimer(tabId);
      }
    }
  }

  // Update protected tabs storage whenever tab changes
  setTimeout(() => updateProtectedTabsStorage(), 500); // Small delay to ensure tab state is updated
}

// Enhanced helper function to check if tab has any media activity
function hasMediaActivity(tab) {
  // Check for audio (this works fine for YouTube music)
  if (tab.audible === true) {
    console.log("Tab has audible audio:", tab.id, tab.url);
    return true;
  }

  // Check for camera/microphone indicators using multiple methods
  if (tab.mutedInfo) {
    // If tab is using camera or microphone (even if muted)
    if (tab.mutedInfo.reason === "capture") {
      console.log("Tab has capture media:", tab.id);
      return true;
    }
    // Additional check for extension muting
    if (tab.mutedInfo.extensionId && !tab.mutedInfo.muted) {
      console.log("Tab has extension media:", tab.id);
      return true;
    }
  }

  // Check for active media using tab URL patterns (common video call sites)
  if (tab.url) {
    const videoCallDomains = [
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

    try {
      const url = new URL(tab.url);
      if (videoCallDomains.some((domain) => url.hostname.includes(domain))) {
        console.log("Tab is video call site:", tab.id, url.hostname);
        // Return true for video call sites by default
        return true;
      }
    } catch (e) {
      // URL parsing failed, continue with other checks
    }
  }

  // Additional check for media indicators (Chrome 88+)
  if (tab.mutedInfo && tab.mutedInfo.reason) {
    console.log("Tab has mutedInfo reason:", tab.id, tab.mutedInfo.reason);
    return true;
  }

  return false;
}

// Add a more specific check for tabs that should never be tracked
function shouldNeverTrack(tab) {
  if (!tab.url) return false;

  // Video call sites should never be tracked when active
  const neverTrackDomains = [
    "meet.google.com",
    "zoom.us",
    "teams.microsoft.com",
    "discord.com/channels",
    "webex.com",
    "whereby.com",
  ];

  try {
    const url = new URL(tab.url);
    return neverTrackDomains.some((domain) => url.hostname.includes(domain));
  } catch (e) {
    return false;
  }
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

  // Check if we should stop tracking due to tab count dropping below threshold
  chrome.tabs.query({}, (allTabs) => {
    if (allTabs.length <= settings.tabThreshold) {
      // Stop all timers
      tabTimers.forEach((timer, tabId) => {
        if (timer.interval) {
          clearInterval(timer.interval);
          timer.interval = null;
          timer.isPaused = true;
        }
      });
    }
  });

  // Update protected tabs storage after tab removal
  updateProtectedTabsStorage();
}

function createContextMenu() {
  // Remove any existing context menus
  chrome.contextMenus.removeAll();
}

function startAllInactiveTimers(exceptTabId) {
  // Check tab threshold first
  chrome.tabs.query({}, (allTabs) => {
    if (allTabs.length <= settings.tabThreshold) {
      return;
    }

    tabTimers.forEach((timer, tabId) => {
      if (tabId !== exceptTabId) {
        // Check if tab should be tracked before resuming timer
        chrome.tabs
          .get(tabId)
          .then((tab) => {
            // Check all protection conditions for tracking
            const isUrlWhitelisted = isWhitelisted(tab.url);
            const isPinnedAndProtected = settings.whitelistPinned && tab.pinned;
            const hasActiveMedia = hasMediaActivity(tab);
            const shouldNeverTrackTab = shouldNeverTrack(tab);

            if (
              !isUrlWhitelisted &&
              !isPinnedAndProtected &&
              !hasActiveMedia &&
              !shouldNeverTrackTab
            ) {
              resumeTimer(tabId);
            }
          })
          .catch(() => {
            // Tab might not exist anymore
          });
      }
    });
  });
}

function markTabInactive(tabId) {
  inactiveTabs.add(tabId);

  // Check if auto-close is enabled
  if (settings.autoClose) {
    // Save tab info before closing
    chrome.tabs.get(tabId, async (tab) => {
      try {
        const { autoclosedTabs = [] } = await chrome.storage.local.get(
          "autoclosedTabs"
        );

        // Add new tab to history
        const tabInfo = {
          url: tab.url,
          title: tab.title,
          favIconUrl: tab.favIconUrl,
          timestamp: Date.now(),
        };

        // Remove duplicates and trim to historyLimit
        const updatedTabs = [tabInfo, ...autoclosedTabs]
          .filter(
            (tab, index, self) =>
              index === self.findIndex((t) => t.url === tab.url)
          )
          .slice(0, settings.historyLimit);

        await chrome.storage.local.set({ autoclosedTabs: updatedTabs });
        chrome.tabs.remove(tabId);
      } catch (error) {
        console.error("Error saving tab to history:", error);
      }
    });
    return;
  }

  // Only show sleep mode indicator if auto-close is disabled
  chrome.scripting
    .executeScript({
      target: { tabId: tabId },
      func: () => {
        try {
          let sleepIcon = document.getElementById("sleep-tab-icon");
          if (!sleepIcon) {
            sleepIcon = document.createElement("div");
            sleepIcon.id = "sleep-tab-icon";
            sleepIcon.innerHTML = "💤";
            sleepIcon.style.cssText = `
              position: fixed;
              top: 10px;
              right: 10px;
              background: linear-gradient(135deg, #4a90e2, #357abd);
              color: white;
              padding: 8px 12px;
              border-radius: 20px;
              font-size: 16px;
              z-index: 10000;
              font-weight: bold;
              box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
              border: 2px solid #357abd;
              animation: sleepPulse 2s ease-in-out infinite;
            `;

            // Add sleep animation
            const style = document.createElement("style");
            style.textContent = `
              @keyframes sleepPulse {
                0%, 100% { opacity: 0.8; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.05); }
              }
            `;
            document.head.appendChild(style);

            document.body.appendChild(sleepIcon);
          }

          // Only add sleep icon to title if not already present
          if (!document.title.startsWith("💤")) {
            document.title = `💤${document.title}`;
          }
        } catch (err) {
          console.error("Error adding sleep mode icon:", err);
        }
      },
    })
    .catch((error) => {
      // Silent fail
    });
}

function markTabActive(tabId) {
  if (inactiveTabs.has(tabId)) {
    inactiveTabs.delete(tabId);

    chrome.scripting
      .executeScript({
        target: { tabId: tabId },
        func: () => {
          try {
            const sleepIcon = document.getElementById("sleep-tab-icon");
            if (sleepIcon && sleepIcon.parentNode) {
              sleepIcon.remove();
            }

            // Also remove old inactive icon if present
            const inactiveIcon = document.getElementById("inactive-tab-icon");
            if (inactiveIcon && inactiveIcon.parentNode) {
              inactiveIcon.remove();
            }

            // Clean up title - remove sleep icon
            if (document.title.startsWith("💤")) {
              document.title = document.title.replace(/^💤\s*/, "");
            }
          } catch (err) {
            console.error("Error removing sleep mode icon:", err);
          }
        },
      })
      .catch((error) => {
        // Silent fail
      });
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

        // Check if tab should be protected from tracking (ALL protections)
        const isUrlWhitelisted = isWhitelisted(tab.url);
        const isPinnedAndProtected = settings.whitelistPinned && tab.pinned;
        const hasActiveMedia = hasMediaActivity(tab);
        const shouldNeverTrackTab = shouldNeverTrack(tab);

        if (
          isUrlWhitelisted ||
          isPinnedAndProtected ||
          hasActiveMedia ||
          shouldNeverTrackTab
        ) {
          clearInterval(interval);
          timer.interval = null;
          markTabActive(tabId);
          return;
        }
      } catch (error) {
        clearInterval(interval);
        return;
      }

      if (currentElapsed >= getTimerDurationMs()) {
        markTabInactive(tabId);
        clearInterval(interval);
        timer.interval = null;
      }
    }, 1000);

    timer.interval = interval;
  }
}

function updateTabIcon(tabId, isWhitelisted) {
  try {
    if (isWhitelisted) {
      // Remove any existing sleep or inactive icons when whitelisting
      chrome.scripting
        .executeScript({
          target: { tabId: tabId },
          func: () => {
            try {
              // Remove sleep icon if present
              const sleepIcon = document.getElementById("sleep-tab-icon");
              if (sleepIcon && sleepIcon.parentNode) {
                sleepIcon.remove();
              }

              // Remove inactive icon if present
              const inactiveIcon = document.getElementById("inactive-tab-icon");
              if (inactiveIcon && inactiveIcon.parentNode) {
                inactiveIcon.remove();
              }

              // Update tab title to show lock - clean approach
              if (!document.title.startsWith("🔒")) {
                document.title = `🔒${document.title}`;
              }

              // Clean up title from sleep icon
              if (document.title.includes("💤")) {
                document.title = document.title.replace(/💤\s*/, "");
              }
            } catch (err) {
              console.error("Error updating tab icon:", err);
            }
          },
        })
        .catch((error) => {
          // Silent fail
        });
    } else {
      // Remove whitelist indicators
      chrome.scripting
        .executeScript({
          target: { tabId: tabId },
          func: () => {
            // Remove lock from title - clean approach
            if (document.title.startsWith("🔒")) {
              document.title = document.title.replace(/^🔒\s*/, "");
            }
          },
        })
        .catch((error) => {
          // Silent fail
        });
    }
  } catch (error) {
    // Silent fail
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

    // Use full URL instead of just origin
    const fullUrl = tab.url;
    if (!whitelist.includes(fullUrl)) {
      whitelist.push(fullUrl);
      saveWhitelist();

      pauseAndResetTimer(tab.id);
      markTabActive(tab.id);

      updateTabIcon(tab.id, true);

      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "Tab Whitelisted",
        message: `${fullUrl} has been added to whitelist`,
      });
    } else {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon48.png",
        title: "Already Whitelisted",
        message: `${fullUrl} is already in whitelist`,
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

  // Check tab threshold before restarting timers
  chrome.tabs.query({}, (allTabs) => {
    if (allTabs.length > settings.tabThreshold && activeTabId) {
      startAllInactiveTimers(activeTabId);
    }
  });
}

function isWhitelisted(url) {
  if (!url) return false;
  try {
    // Check both exact URL match and origin match
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

// Add function to update protected tabs in storage
function updateProtectedTabsStorage() {
  chrome.tabs.query({}, (allTabs) => {
    console.log(
      "Updating protected tabs storage...",
      allTabs.length,
      "total tabs"
    );

    const protectedTabsData = allTabs
      .filter((tab) => {
        if (tab.active) return false; // Skip active tab
        const isProtected = isTabCurrentlyProtected(tab);
        console.log(
          `Tab ${tab.id} (${tab.title}): protected=${isProtected}, audible=${tab.audible}, url=${tab.url}`
        );
        return isProtected;
      })
      .map((tab) => ({
        id: tab.id,
        title: tab.title
          .replace(/^💤\s*/, "")
          .replace(/^🔒\s*/, "")
          .trim(),
        url: tab.url,
        favIconUrl: tab.favIconUrl,
        origin: getTabOrigin(tab.url),
        protectionReason: getTabProtectionReason(tab),
        audible: tab.audible,
        pinned: tab.pinned,
      }));

    console.log(
      "Protected tabs found:",
      protectedTabsData.length,
      protectedTabsData
    );
    chrome.storage.local.set({ protectedTabs: protectedTabsData });
  });
}

function getTabOrigin(url) {
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
}

function isTabCurrentlyProtected(tab) {
  // Only include media-related and meeting protections
  const hasActiveMedia = hasMediaActivity(tab);
  const shouldNeverTrackTab = shouldNeverTrack(tab);

  const result = hasActiveMedia || shouldNeverTrackTab;

  console.log(`Protection check for tab ${tab.id}:`, {
    url: tab.url,
    audible: tab.audible,
    hasActiveMedia,
    shouldNeverTrackTab,
    result,
  });

  return result;
}

function getTabProtectionReason(tab) {
  // Check in same order as protection logic - only media/meeting related
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

// Initialize the extension when script loads
init();

// Before a tab is activated, check if we need to refresh its content
function refreshTabContent(tabId) {
  if (inactiveTabs.has(tabId)) {
    chrome.scripting
      .executeScript({
        target: { tabId: tabId },
        func: () => {
          // Force a minor DOM update to ensure scripts run properly
          try {
            // Create a temporary element and remove it
            const tempElement = document.createElement("div");
            tempElement.id = "inactitab-refresh-trigger";
            document.body.appendChild(tempElement);
            setTimeout(() => {
              if (tempElement && tempElement.parentNode) {
                tempElement.remove();
              }
            }, 100);

            // Clean up any broken sleep/inactive icons
            const sleepIcon = document.getElementById("sleep-tab-icon");
            if (sleepIcon && sleepIcon.parentNode) {
              sleepIcon.remove();
            }

            const inactiveIcon = document.getElementById("inactive-tab-icon");
            if (inactiveIcon && inactiveIcon.parentNode) {
              inactiveIcon.remove();
            }

            // Fix title if needed - clean approach
            if (document.title.startsWith("💤")) {
              document.title = document.title.replace(/^💤\s*/, "");
            }
          } catch (err) {
            console.error("Error refreshing tab content:", err);
          }
        },
      })
      .catch((error) => {
        // Silent fail
      });
  }
}
