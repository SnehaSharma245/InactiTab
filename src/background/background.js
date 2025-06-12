/**
 * InactiTab Background Script - Main Entry Point
 */

import { TabManager } from "./managers/TabManager.js";
import {
  loadSettings,
  saveSettings,
  loadWhitelist,
  saveWhitelist,
} from "./utils/storageUtils.js";
import {
  getTabsMemoryUsage,
  getMemoryStatistics,
  getChromeTaskManagerData,
  startRealTimeCpuMonitoring,
} from "./utils/memoryUtils.js";

// Global instances
let tabManager = null;
let currentSettings = {};
let currentWhitelist = [];

/**
 * Initialize the extension
 */
async function init() {
  try {
    // Load initial data
    currentSettings = await loadSettings();
    currentWhitelist = await loadWhitelist();

    // Initialize tab manager
    tabManager = new TabManager();
    await tabManager.initialize(currentSettings, currentWhitelist);

    // Setup event listeners
    setupEventListeners();
    createContextMenu();

    console.log("InactiTab initialized successfully");
  } catch (error) {
    console.error("Error initializing InactiTab:", error);
  }
}

/**
 * Setup Chrome extension event listeners
 */
function setupEventListeners() {
  // Message handling
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message, sender, sendResponse);
    return true;
  });

  // Tab events
  chrome.tabs.onActivated.addListener((activeInfo) => {
    tabManager?.handleTabActivated(activeInfo);
  });

  chrome.tabs.onCreated.addListener((tab) => {
    tabManager?.handleTabCreated(tab);
  });

  chrome.tabs.onRemoved.addListener((tabId) => {
    tabManager?.handleTabRemoved(tabId);
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    tabManager?.handleTabUpdated(tabId, changeInfo, tab);
  });

  // Extension lifecycle events
  chrome.runtime.onStartup.addListener(() => {
    console.log("InactiTab started");
  });

  chrome.runtime.onInstalled.addListener(() => {
    console.log("InactiTab installed");
  });
}

/**
 * Handle messages from popup and content scripts
 */
async function handleMessage(message, sender, sendResponse) {
  try {
    switch (message.action) {
      case "updateSettings":
        currentSettings = message.settings;
        await saveSettings(currentSettings);
        tabManager?.updateSettings(currentSettings);
        break;

      case "updateWhitelist":
        currentWhitelist = message.whitelist;
        await saveWhitelist(currentWhitelist);
        tabManager?.updateWhitelist(currentWhitelist);
        break;

      case "whitelistTab":
        tabManager?.pauseAndResetTimer(message.tabId);
        break;

      case "keepTab":
        if (sender.tab) {
          tabManager?.pauseAndResetTimer(sender.tab.id);
        }
        break;

      case "getInactiveTime":
        if (sender.tab) {
          const elapsed = tabManager?.getTabElapsedTime(sender.tab.id) || 0;
          sendResponse({ time: elapsed });
        }
        break;

      case "getMemoryUsage":
        console.log("Background: Fetching CPU data...");

        try {
          const cpuData = await getTabsMemoryUsage();

          // Convert Map to plain object
          const cpuObject = {};
          cpuData.forEach((value, key) => {
            cpuObject[key] = value;
          });

          console.log(
            `Background: CPU data retrieved for ${
              Object.keys(cpuObject).length
            } tabs`
          );
          sendResponse({ memoryData: cpuObject });
        } catch (error) {
          console.error("Error getting CPU data:", error);
          sendResponse({ memoryData: {}, error: error.message });
        }
        break;

      case "testProcesses":
        try {
          if (chrome.processes) {
            console.log("Processes API is available");
            sendResponse({
              status: "available",
              message: "Chrome processes API is accessible",
            });
          } else {
            console.log("Processes API not available");
            sendResponse({
              status: "unavailable",
              message:
                "Chrome processes API not found - using estimation fallback",
            });
          }
        } catch (error) {
          console.error("Error testing processes API:", error);
          sendResponse({
            status: "error",
            message: error.message,
          });
        }
        break;

      case "getMemoryStats":
        const stats = await getMemoryStatistics();
        sendResponse({ stats });
        break;

      case "getChromeTaskManager":
        const taskManagerData = await getChromeTaskManagerData();
        sendResponse({ taskManagerData });
        break;

      case "startCpuMonitoring":
        // This would be used for real-time monitoring if needed
        sendResponse({ status: "monitoring started" });
        break;

      default:
        console.warn("Unknown message action:", message.action);
    }
  } catch (error) {
    console.error("Error handling message:", error);
    sendResponse({ error: error.message });
  }
}

/**
 * Create context menu (if needed in future)
 */
function createContextMenu() {
  chrome.contextMenus.removeAll();
}

/**
 * Whitelist current tab
 */
async function whitelistCurrentTab() {
  try {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!activeTab || !activeTab.url) {
      console.error("No valid tab to whitelist");
      return;
    }

    const fullUrl = activeTab.url;
    if (!currentWhitelist.includes(fullUrl)) {
      currentWhitelist.push(fullUrl);
      await saveWhitelist(currentWhitelist);

      tabManager?.updateWhitelist(currentWhitelist);
      tabManager?.pauseAndResetTimer(activeTab.id);
      tabManager?.updateTabIcon(activeTab.id, true);

      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "Tab Whitelisted",
        message: `${fullUrl} has been added to whitelist`,
      });
    } else {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "Already Whitelisted",
        message: `${fullUrl} is already in whitelist`,
      });
    }
  } catch (error) {
    console.error("Error whitelisting tab:", error);
  }
}

// Initialize the extension when script loads
init();
