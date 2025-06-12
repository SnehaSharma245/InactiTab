import React, { useState, useEffect } from "react";
import {
  Moon,
  ExternalLink,
  Globe,
  RefreshCw,
  Clock,
  X,
  CheckSquare,
  Square,
  Cpu,
  TrendingUp,
} from "lucide-react";

const InactiveSection = () => {
  const [inactiveTabs, setInactiveTabs] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTabs, setSelectedTabs] = useState(new Set());
  const [selectMode, setSelectMode] = useState(false);

  useEffect(() => {
    loadInactiveTabsWithMemory();
  }, []);

  // Request memory data from background script
  const requestMemoryData = async () => {
    return new Promise((resolve) => {
      console.log("Popup: Requesting CPU data...");
      chrome.runtime.sendMessage({ action: "getMemoryUsage" }, (response) => {
        console.log("Popup: CPU response received:", response);
        if (response && response.memoryData) {
          resolve(response.memoryData);
        } else if (response && response.error) {
          console.error("CPU data error:", response.error);
          resolve({});
        } else {
          resolve({});
        }
      });
    });
  };

  // Add test function for processes API
  const testProcessesAPI = async () => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "testProcesses" }, (response) => {
        console.log("Processes API test result:", response);
        resolve(response);
      });
    });
  };

  // Enhanced function to load tabs with memory data
  const loadInactiveTabsWithMemory = async () => {
    try {
      setIsRefreshing(true);

      // Test processes API first
      const testResult = await testProcessesAPI();
      console.log("Processes API test:", testResult);

      // Get inactive tabs from storage
      const { inactiveTabs = [] } = await chrome.storage.local.get(
        "inactiveTabs"
      );

      // Get memory usage data from background
      const memoryData = await requestMemoryData();
      console.log("Memory data received:", memoryData); // Debug log

      // Get all tabs and filter by inactive ones
      const tabs = await chrome.tabs.query({});

      const inactiveTabsData = tabs
        .filter((tab) => inactiveTabs.includes(tab.id))
        .map((tab) => {
          // Get original favicon URL
          let originalFavicon = tab.favIconUrl;
          if (tab.favIconUrl && tab.favIconUrl.startsWith("data:")) {
            try {
              const url = new URL(tab.url);
              originalFavicon = `${url.protocol}//${url.hostname}/favicon.ico`;
            } catch (e) {
              originalFavicon = null;
            }
          }

          // Get memory info for this tab - now it's a plain object
          const memoryInfo = memoryData[tab.id];
          console.log(`Tab ${tab.id} (${tab.title}) CPU data:`, memoryInfo);

          return {
            id: tab.id,
            title: tab.title.replace(/^💤\s*/, "").replace(/^🔒\s*/, ""),
            url: tab.url,
            favIconUrl: originalFavicon,
            origin: new URL(tab.url).origin,
            isWhitelisted: false,
            isSleeping: true,
            memory: memoryInfo || { memory: 0, cpu: 0.1, estimated: true },
          };
        })
        .sort((a, b) => (b.memory?.cpu || 0) - (a.memory?.cpu || 0)); // Sort by CPU usage (highest first)

      console.log("Final inactive tabs data:", inactiveTabsData); // Debug log
      setInactiveTabs(inactiveTabsData);
    } catch (error) {
      console.error("Error loading inactive tabs with memory:", error);
      // Fallback to original function
      loadInactiveTabs();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Original loadInactiveTabs function (unchanged)
  const loadInactiveTabs = async () => {
    try {
      setIsRefreshing(true);

      const { inactiveTabs = [] } = await chrome.storage.local.get(
        "inactiveTabs"
      );
      const tabs = await chrome.tabs.query({});

      const inactiveTabsData = tabs
        .filter((tab) => inactiveTabs.includes(tab.id))
        .map((tab) => {
          let originalFavicon = tab.favIconUrl;
          if (tab.favIconUrl && tab.favIconUrl.startsWith("data:")) {
            try {
              const url = new URL(tab.url);
              originalFavicon = `${url.protocol}//${url.hostname}/favicon.ico`;
            } catch (e) {
              originalFavicon = null;
            }
          }

          return {
            id: tab.id,
            title: tab.title.replace(/^💤\s*/, "").replace(/^🔒\s*/, ""),
            url: tab.url,
            favIconUrl: originalFavicon,
            origin: new URL(tab.url).origin,
            isWhitelisted: false,
            isSleeping: true,
          };
        });

      setInactiveTabs(inactiveTabsData);
    } catch (error) {
      console.error("Error loading inactive tabs:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate total CPU for selected tabs
  const selectedCpu = Array.from(selectedTabs).reduce((total, tabId) => {
    const tab = inactiveTabs.find((t) => t.id === tabId);
    return total + (tab?.memory?.cpu || 0);
  }, 0);

  const handleVisitTab = async (tab) => {
    try {
      await chrome.tabs.update(tab.id, { active: true });
      const tabInfo = await chrome.tabs.get(tab.id);
      await chrome.windows.update(tabInfo.windowId, { focused: true });
    } catch (error) {
      console.error("Error visiting tab:", error);
    }
  };

  const handleCloseTab = async (e, tabId) => {
    e.stopPropagation();
    try {
      await chrome.tabs.remove(tabId);
      setInactiveTabs((prevTabs) => prevTabs.filter((tab) => tab.id !== tabId));
    } catch (error) {
      console.error("Error closing tab:", error);
    }
  };

  const handleSelectAll = () => {
    if (selectedTabs.size === inactiveTabs.length) {
      setSelectedTabs(new Set());
    } else {
      setSelectedTabs(new Set(inactiveTabs.map((tab) => tab.id)));
    }
  };

  const handleTabSelection = (tabId) => {
    const newSelected = new Set(selectedTabs);
    if (newSelected.has(tabId)) {
      newSelected.delete(tabId);
    } else {
      newSelected.add(tabId);
    }
    setSelectedTabs(newSelected);
  };

  const handleCloseSelected = async () => {
    try {
      const tabsToClose = Array.from(selectedTabs);
      await Promise.all(tabsToClose.map((tabId) => chrome.tabs.remove(tabId)));
      setInactiveTabs((prevTabs) =>
        prevTabs.filter((tab) => !selectedTabs.has(tab.id))
      );
      setSelectedTabs(new Set());
      setSelectMode(false);
    } catch (error) {
      console.error("Error closing selected tabs:", error);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="gradient-text text-base font-medium flex items-center">
          <Moon className="mr-2 w-4 h-4" />
          Inactive Tabs ({inactiveTabs.length})
        </h3>
        <div className="flex items-center gap-2">
          {selectedTabs.size > 0 && (
            <div className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-lg flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                {selectedCpu.toFixed(1)}% CPU
              </div>
              <span className="text-gray-400">selected</span>
            </div>
          )}
          {inactiveTabs.length > 0 && (
            <button
              onClick={() => {
                setSelectMode(!selectMode);
                setSelectedTabs(new Set());
              }}
              className="modern-button !py-1 !px-2 text-xs"
              title={selectMode ? "Cancel selection" : "Select tabs"}
            >
              {selectMode ? "Cancel" : "Select"}
            </button>
          )}
          <button
            onClick={loadInactiveTabsWithMemory}
            disabled={isRefreshing}
            className="modern-button !py-1 !px-2"
            title="Refresh list"
          >
            <RefreshCw
              className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {selectMode && inactiveTabs.length > 0 && (
        <div className="mb-3 flex justify-between items-center p-2 bg-dark-surface/30 rounded-lg border border-dark-border/50">
          <button
            onClick={handleSelectAll}
            className="text-xs px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center gap-1"
          >
            {selectedTabs.size === inactiveTabs.length ? (
              <>
                <CheckSquare className="w-3 h-3" />
                Deselect All
              </>
            ) : (
              <>
                <Square className="w-3 h-3" />
                Select All
              </>
            )}
          </button>

          {selectedTabs.size > 0 && (
            <button
              onClick={handleCloseSelected}
              className="text-xs px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Close Selected ({selectedTabs.size})
            </button>
          )}
        </div>
      )}

      <div>
        {inactiveTabs.length === 0 ? (
          <div className="modern-card p-6">
            <div className="text-center text-gray-400">
              <Moon className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-medium">No inactive tabs</p>
              <p className="text-xs mt-1 opacity-75">
                Tabs that become inactive will appear here
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {inactiveTabs.map((tab) => (
              <div
                key={tab.id}
                className={`modern-card p-3 group transition-all duration-200 ${
                  selectMode ? "cursor-default" : "cursor-pointer"
                } ${
                  selectedTabs.has(tab.id)
                    ? "bg-blue-500/10 border-blue-500/30"
                    : ""
                }`}
                onClick={() => {
                  if (selectMode) {
                    handleTabSelection(tab.id);
                  } else {
                    handleVisitTab(tab);
                  }
                }}
              >
                <div className="flex items-center">
                  {selectMode && (
                    <div className="mr-3 flex-shrink-0">
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          selectedTabs.has(tab.id)
                            ? "bg-blue-500 border-blue-500"
                            : "border-gray-400 hover:border-blue-400"
                        }`}
                      >
                        {selectedTabs.has(tab.id) && (
                          <CheckSquare className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </div>
                  )}

                  <div className="relative mr-3 flex-shrink-0">
                    {tab.favIconUrl ? (
                      <img
                        src={tab.favIconUrl}
                        alt=""
                        className="w-4 h-4 rounded"
                        onError={(e) => {
                          e.target.src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%23999' d='M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 14c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z'/%3E%3C/svg%3E";
                        }}
                      />
                    ) : (
                      <Globe className="w-4 h-4 text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-100 truncate">
                        {tab.title}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-400 truncate">
                        {tab.origin}
                      </p>
                      <div className="flex items-center gap-2">
                        {tab.isSleeping && (
                          <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">
                            Sleeping
                          </span>
                        )}
                        {/* CPU usage display only */}
                        {tab.memory && (
                          <div
                            className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${
                              tab.memory.cpu > 5
                                ? "bg-red-500/20 text-red-300"
                                : tab.memory.cpu > 2
                                ? "bg-yellow-500/20 text-yellow-300"
                                : "bg-green-500/20 text-green-300"
                            }`}
                          >
                            <Cpu className="w-3 h-3" />
                            {tab.memory.cpu.toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {!selectMode && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVisitTab(tab);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-blue-500/20 rounded"
                        title="Visit tab"
                      >
                        <ExternalLink className="w-4 h-4 text-blue-400" />
                      </button>

                      <button
                        onClick={(e) => handleCloseTab(e, tab.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
                        title="Close tab"
                      >
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InactiveSection;
