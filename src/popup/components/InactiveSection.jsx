import React, { useState, useEffect } from "react";
import { Moon, ExternalLink, Globe, RefreshCw, Clock } from "lucide-react";

const InactiveSection = () => {
  const [inactiveTabs, setInactiveTabs] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadInactiveTabs();
  }, []);

  const loadInactiveTabs = async () => {
    try {
      setIsRefreshing(true);
      const tabs = await chrome.tabs.query({});

      // Get inactive tabs by checking their titles for sleep indicators
      const inactiveTabsData = tabs
        .filter(
          (tab) =>
            tab.title &&
            (tab.title.startsWith("💤") || tab.title.startsWith("🔒"))
        )
        .map((tab) => ({
          id: tab.id,
          title: tab.title.replace(/^💤\s*/, "").replace(/^🔒\s*/, ""),
          url: tab.url,
          favIconUrl: tab.favIconUrl,
          origin: new URL(tab.url).origin,
          isWhitelisted: tab.title.startsWith("🔒"),
          isSleeping: tab.title.startsWith("💤"),
        }));

      setInactiveTabs(inactiveTabsData);
    } catch (error) {
      console.error("Error loading inactive tabs:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleVisitTab = async (tab) => {
    try {
      await chrome.tabs.update(tab.id, { active: true });
      // Also focus the window containing this tab
      const tabInfo = await chrome.tabs.get(tab.id);
      await chrome.windows.update(tabInfo.windowId, { focused: true });
    } catch (error) {
      console.error("Error visiting tab:", error);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="gradient-text text-base font-medium flex items-center">
          <Moon className="mr-2 w-4 h-4" />
          Inactive Tabs
        </h3>
        <button
          onClick={loadInactiveTabs}
          disabled={isRefreshing}
          className="modern-button !py-1 !px-2"
          title="Refresh list"
        >
          <RefreshCw
            className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

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
                className="modern-card p-3 group cursor-pointer"
                onClick={() => handleVisitTab(tab)}
              >
                <div className="flex items-center">
                  <div className="relative mr-3 flex-shrink-0">
                    {tab.favIconUrl ? (
                      <img
                        src={tab.favIconUrl}
                        alt=""
                        className="w-4 h-4 rounded"
                      />
                    ) : (
                      <Globe className="w-4 h-4 text-gray-400" />
                    )}
                    {/* Status indicator */}
                    <div
                      className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                        tab.isWhitelisted ? "bg-blue-500" : "bg-orange-500"
                      }`}
                    />
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
                      <div className="flex items-center">
                        {tab.isWhitelisted && (
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded mr-2">
                            Protected
                          </span>
                        )}
                        {tab.isSleeping && (
                          <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">
                            Sleeping
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVisitTab(tab);
                    }}
                    className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-blue-500/20 rounded"
                    title="Visit tab"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-400" />
                  </button>
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
