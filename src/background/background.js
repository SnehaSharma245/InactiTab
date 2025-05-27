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
  try {
    const tab = await chrome.tabs.get(newActiveTabId);
    console.log(`🔀 Tab switched to: "${tab.title}" (${newActiveTabId})`);
  } catch (error) {
    console.log(`🔀 Tab switched to: ${newActiveTabId}`);
  }

  // Update inactive state and refresh content
  await refreshTabContent(newActiveTabId);

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

  // Check if we should start tracking based on tab count
  chrome.tabs.query({}, (allTabs) => {
    if (allTabs.length > settings.tabThreshold) {
      console.log(
        `📊 Tab threshold exceeded (${allTabs.length}/${settings.tabThreshold}). Starting tracking for new tab.`
      );

      // Check for whitelisted status after a brief delay
      setTimeout(() => {
        chrome.tabs
          .get(tab.id)
          .then((updatedTab) => {
            if (isWhitelisted(updatedTab.url)) {
              updateTabIcon(tab.id, true);
            } else if (tab.id !== activeTabId) {
              // Start timer for this new tab if it's not active and not whitelisted
              resumeTimer(tab.id);
            }
          })
          .catch(() => {});
      }, 1000);
    } else {
      console.log(
        `📊 Tab count (${allTabs.length}) is below threshold (${settings.tabThreshold}). Not tracking new tab.`
      );
    }
  });
}

function handleTabUpdated(tabId, changeInfo, tab) {
  if (changeInfo.url) {
    const isUrlWhitelisted = isWhitelisted(tab.url);
    const isPinnedAndProtected = settings.whitelistPinned && tab.pinned;

    updateTabIcon(tabId, isUrlWhitelisted);

    if (isUrlWhitelisted || isPinnedAndProtected) {
      pauseAndResetTimer(tabId);
      markTabActive(tabId);
      console.log(
        `🔄 Tab ${tabId} updated - now protected (URL: ${isUrlWhitelisted}, Pinned: ${isPinnedAndProtected})`
      );
    }
  }

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
      resumeTimer(tabId);
      console.log(`📌 Tab ${tabId} unpinned - starting timer`);
    }
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
  console.log(`❌ Tab closed and timer removed: ${tabId}`);

  // Check if we should stop tracking due to tab count dropping below threshold
  chrome.tabs.query({}, (allTabs) => {
    if (allTabs.length <= settings.tabThreshold) {
      console.log(
        `📊 Tab count dropped to ${allTabs.length} (threshold: ${settings.tabThreshold}). Stopping all timers.`
      );

      // Stop all timers
      tabTimers.forEach((timer, tabId) => {
        if (timer.interval) {
          clearInterval(timer.interval);
          timer.interval = null;
          timer.isPaused = true;
          console.log(`⏸️ Stopped timer for tab ${tabId} (below threshold)`);
        }
      });
    }
  });
}

function createContextMenu() {
  // Remove all context menu functionality
  chrome.contextMenus.removeAll();
}

function startAllInactiveTimers(exceptTabId) {
  console.log(
    `🌟 Starting/Resuming timers for inactive tabs except: ${exceptTabId}`
  );

  // Check tab threshold first
  chrome.tabs.query({}, (allTabs) => {
    if (allTabs.length <= settings.tabThreshold) {
      console.log(
        `📊 Tab count (${allTabs.length}) is below threshold (${settings.tabThreshold}). Not starting timers.`
      );
      return;
    }

    console.log(
      `📊 Tab count (${allTabs.length}) exceeds threshold (${settings.tabThreshold}). Starting timers.`
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
  });
}

function markTabInactive(tabId) {
  inactiveTabs.add(tabId);

  // Check if auto-close is enabled
  if (settings.autoClose) {
    console.log(`🔥 Auto-closing inactive tab: ${tabId}`);

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
      console.log(
        `❌ Could not inject sleep mode icon for tab ${tabId}:`,
        error
      );
    });

  console.log(`😴 Marked tab ${tabId} as sleeping`);
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
        console.log(
          `❌ Could not remove sleep mode icon for tab ${tabId}:`,
          error
        );
      });

    console.log(`✅ Marked tab ${tabId} as active (woke up from sleep)`);
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
          console.log(`❌ Could not update tab for whitelist ${tabId}:`, error);
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
          console.log(
            `❌ Could not remove whitelist indicators for tab ${tabId}:`,
            error
          );
        });
    }
  } catch (error) {
    console.log(`Could not update icon for tab ${tabId}:`, error);
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

  // Check tab threshold before restarting timers
  chrome.tabs.query({}, (allTabs) => {
    if (allTabs.length > settings.tabThreshold && activeTabId) {
      console.log(
        `📊 Refreshing timers. Tab count: ${allTabs.length}, Threshold: ${settings.tabThreshold}`
      );
      startAllInactiveTimers(activeTabId);
    } else {
      console.log(
        `📊 Not starting timers. Tab count: ${allTabs.length}, Threshold: ${settings.tabThreshold}`
      );
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
        console.log(`❌ Could not refresh tab content for ${tabId}:`, error);
      });
  }
}
