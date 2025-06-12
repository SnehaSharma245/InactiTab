import React, { useState, useEffect } from "react";
import {
  Shield,
  Plus,
  Minus,
  Globe,
  FileText,
  ArrowUpDown,
} from "lucide-react";

const WhitelistSection = ({
  whitelist,
  onAddToWhitelist,
  onRemoveFromWhitelist,
  onWhitelistCurrentTab,
}) => {
  const [urlInput, setUrlInput] = useState("");
  const [feedback, setFeedback] = useState("");
  const [openedTabs, setOpenedTabs] = useState([]);
  const [sortWhitelistedFirst, setSortWhitelistedFirst] = useState(false);

  useEffect(() => {
    loadOpenedTabs();
  }, [whitelist]);

  const loadOpenedTabs = async () => {
    try {
      const tabs = await chrome.tabs.query({});
      const tabsData = tabs.map((tab) => {
        // Clean title properly - remove ALL emoji indicators
        let cleanTitle = tab.title
          .replace(/^[💤🔒🎵]\s*/, "") // Remove emoji at start
          .replace(/[💤🔒🎵]/g, "") // Remove any remaining emojis
          .trim(); // Remove extra spaces

        // Fallback if title becomes empty
        if (!cleanTitle) {
          try {
            const hostname = new URL(tab.url).hostname;
            cleanTitle = hostname.replace("www.", "") || "Untitled Tab";
          } catch {
            cleanTitle = "Untitled Tab";
          }
        }

        return {
          id: tab.id,
          title: cleanTitle, // Always show clean title
          url: tab.url,
          favIconUrl: tab.favIconUrl,
          origin: new URL(tab.url).origin,
          isWhitelisted: isTabWhitelisted(tab.url),
        };
      });

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
    try {
      // Immediately update the local state to reflect the change
      setOpenedTabs((prevTabs) =>
        prevTabs.map((t) =>
          t.id === tab.id ? { ...t, isWhitelisted: isChecked } : t
        )
      );

      if (isChecked) {
        await onAddToWhitelist(tab.url);
      } else {
        await onRemoveFromWhitelist(tab.url);
      }
    } catch (error) {
      console.error("Error toggling whitelist:", error);
      // Revert the optimistic update on error
      setOpenedTabs((prevTabs) =>
        prevTabs.map((t) =>
          t.id === tab.id ? { ...t, isWhitelisted: !isChecked } : t
        )
      );
    }
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

  const handleTabClick = async (tab) => {
    try {
      // Switch to the clicked tab
      await chrome.tabs.update(tab.id, { active: true });
      // Close the extension popup after switching tabs
      window.close();
    } catch (error) {
      console.error("Error switching to tab:", error);
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

  const getSortedTabs = () => {
    if (!sortWhitelistedFirst) return openedTabs;

    return [...openedTabs].sort((a, b) => {
      if (a.isWhitelisted && !b.isWhitelisted) return -1;
      if (!a.isWhitelisted && b.isWhitelisted) return 1;
      return 0;
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h3 className="gradient-text text-base font-medium mb-2 flex items-center">
          <Shield className="mr-2 w-4 h-4" />
          Quick Whitelist
        </h3>
      </div>

      <div className="flex justify-center">
        <button
          className="modern-button w-[60%] mb-4 flex items-center justify-center"
          onClick={handleWhitelistCurrent}
        >
          <Shield className="mr-2 w-4 h-4 inline" />
          {feedback || "Whitelist Current Tab"}
        </button>
      </div>

      <div className="modern-card p-4 mb-4">
        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter URL to whitelist"
          className="modern-input w-full mb-2"
        />
        <button onClick={handleAddUrl} className="modern-button w-full">
          Add to Whitelist
        </button>
      </div>

      {/* Opened Tabs List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-300 flex items-center">
            <FileText className="mr-2 w-4 h-4" />
            Opened Tabs
          </h4>
          {openedTabs.length > 0 && (
            <button
              onClick={() => setSortWhitelistedFirst(!sortWhitelistedFirst)}
              className={`text-xs px-2 py-1 rounded-lg transition-all duration-200 flex items-center gap-1
                         ${
                           sortWhitelistedFirst
                             ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                             : "bg-gray-600/20 text-gray-400 border border-gray-600/30 hover:bg-gray-600/30"
                         }`}
              title="Sort whitelisted tabs first"
            >
              <ArrowUpDown className="w-3 h-3" />
              Sort
            </button>
          )}
        </div>
        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded dark:border-dark-border">
          {openedTabs.length === 0 ? (
            <div className="p-3 text-center text-gray-500 dark:text-gray-400">
              <FileText className="w-6 h-6 mx-auto mb-2 text-gray-400" />
              <p className="text-xs">No tabs found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {getSortedTabs().map((tab) => (
                <div
                  key={tab.id}
                  className={`p-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer
                             ${
                               tab.isWhitelisted
                                 ? "bg-emerald-500/5 border-l-2 border-emerald-500/30"
                                 : ""
                             }`}
                  onClick={() => handleTabClick(tab)}
                  title="Click to switch to this tab"
                >
                  <div className="flex items-center">
                    <div className="flex items-center flex-1 min-w-0">
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
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTabWhitelistToggle(
                                  tab,
                                  !tab.isWhitelisted
                                );
                              }}
                              className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                                tab.isWhitelisted
                                  ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                  : "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
                              }`}
                            >
                              {tab.isWhitelisted ? "Remove" : "Add"}
                            </button>
                          </div>
                        </div>
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
