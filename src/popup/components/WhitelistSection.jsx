import React, { useState, useEffect } from "react";

const WhitelistSection = ({
  whitelist,
  onAddToWhitelist,
  onRemoveFromWhitelist,
  onWhitelistCurrentTab,
}) => {
  const [urlInput, setUrlInput] = useState("");
  const [feedback, setFeedback] = useState("");
  const [openedTabs, setOpenedTabs] = useState([]);

  useEffect(() => {
    loadOpenedTabs();
  }, [whitelist]);

  const loadOpenedTabs = async () => {
    try {
      const tabs = await chrome.tabs.query({});
      const tabsData = tabs.map((tab) => ({
        id: tab.id,
        title: tab.title.replace(/^💤\s*/, "").replace(/^🔒\s*/, ""), // Clean sleep and lock icons from title
        url: tab.url,
        favIconUrl: tab.favIconUrl,
        origin: new URL(tab.url).origin,
        isWhitelisted: isTabWhitelisted(tab.url),
      }));

      setOpenedTabs(tabsData);
    } catch (error) {
      console.error("Error loading tabs:", error);
    }
  };

  const isTabWhitelisted = (url) => {
    if (!url) return false;
    try {
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
  };

  const handleTabWhitelistToggle = async (tab, isChecked) => {
    if (isChecked) {
      await onAddToWhitelist(tab.url); // Use full URL instead of origin
    } else {
      await onRemoveFromWhitelist(tab.url);
    }
    setTimeout(loadOpenedTabs, 100);
  };

  const handleAddUrl = () => {
    if (urlInput.trim() && isValidUrl(urlInput.trim())) {
      onAddToWhitelist(urlInput.trim());
      setUrlInput("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleAddUrl();
    }
  };

  const handleWhitelistCurrent = async () => {
    const success = await onWhitelistCurrentTab();
    if (success) {
      setFeedback("Added to Whitelist!");
      setTimeout(() => setFeedback(""), 2000);
    }
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h3 className="text-base font-medium mb-2 flex items-center text-gray-800 dark:text-white">
          <span className="mr-2 text-sm">🛡️</span>Quick Whitelist
        </h3>
      </div>

      <div className="bg-gray-50 rounded-md p-3 mb-4 border border-gray-200 dark:bg-dark-card dark:border-dark-border">
        <button
          className={`w-full mb-2 px-3 py-2 border-none rounded text-xs font-medium cursor-pointer transition-all duration-300 inline-flex items-center justify-center relative overflow-hidden hover:-translate-y-0.5 shimmer ${
            feedback
              ? "bg-success-500 text-white hover:bg-success-600"
              : "bg-success-500 text-white hover:bg-success-600"
          }`}
          onClick={handleWhitelistCurrent}
        >
          <span className="mr-1 text-xs">🛡️</span>
          {feedback || "Whitelist Current Tab"}
        </button>

        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter URL to whitelist"
          className="w-full p-2 border border-gray-300 rounded text-xs bg-white text-gray-800 transition-all duration-300 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 dark:bg-dark-input dark:text-white dark:border-dark-border"
        />
        <button
          onClick={handleAddUrl}
          className="w-full mt-2 px-3 py-2 border-none rounded text-xs font-medium cursor-pointer transition-all duration-300 inline-flex items-center justify-center relative overflow-hidden hover:-translate-y-0.5 bg-primary-500 text-white hover:bg-primary-600 shimmer"
        >
          Add to Whitelist
        </button>
      </div>

      {/* Opened Tabs List */}
      <div>
        <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          <span className="mr-1 text-xs">📑</span>Opened Tabs
        </h4>
        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded dark:border-dark-border">
          {openedTabs.length === 0 ? (
            <div className="p-3 text-center text-gray-500 dark:text-gray-400">
              <p className="text-xs">No tabs found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {openedTabs.map((tab) => (
                <div
                  key={tab.id}
                  className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={tab.isWhitelisted}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleTabWhitelistToggle(tab, e.target.checked);
                      }}
                      className="mr-2 w-3 h-3 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-1 dark:bg-dark-input dark:border-dark-border"
                    />
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="relative mr-2 flex-shrink-0">
                        {tab.favIconUrl ? (
                          <img
                            src={tab.favIconUrl}
                            alt=""
                            className={`w-3 h-3 rounded-full ${
                              tab.isWhitelisted
                                ? "ring-1 ring-green-500 ring-offset-1 ring-offset-white dark:ring-offset-gray-800"
                                : ""
                            }`}
                          />
                        ) : (
                          <div
                            className={`w-3 h-3 bg-gray-300 rounded-full flex items-center justify-center ${
                              tab.isWhitelisted
                                ? "ring-1 ring-green-500 ring-offset-1 ring-offset-white dark:ring-offset-gray-800"
                                : ""
                            }`}
                          >
                            <span className="text-xs">🌐</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs font-medium truncate ${
                            tab.isWhitelisted
                              ? "text-green-600 dark:text-green-400"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {tab.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate opacity-75">
                          {tab.origin}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhitelistSection;
