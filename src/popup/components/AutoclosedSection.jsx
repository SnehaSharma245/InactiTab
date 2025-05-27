import React, { useState, useEffect } from "react";
import {
  Trash2,
  RotateCcw,
  X,
  ExternalLink,
  FileText,
  RefreshCw,
} from "lucide-react";

const AutoclosedSection = () => {
  const [autoclosedTabs, setAutoclosedTabs] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTabs, setSelectedTabs] = useState(new Set());
  const [selectMode, setSelectMode] = useState(false);

  useEffect(() => {
    loadAutoclosedTabs();
  }, []);

  const loadAutoclosedTabs = async () => {
    try {
      setIsRefreshing(true);
      const data = await chrome.storage.local.get([
        "autoclosedTabs",
        "inactiTabSettings",
      ]);
      const settings = data.inactiTabSettings || { historyLimit: 10 };
      const openedTabs = await chrome.tabs.query({});
      const openedUrls = new Set(openedTabs.map((tab) => tab.url));

      // Remove duplicates and already opened tabs, also clean titles
      const filteredTabs = (data.autoclosedTabs || []).reduce((acc, tab) => {
        if (!openedUrls.has(tab.url) && !acc.some((t) => t.url === tab.url)) {
          // Clean title from sleep and lock icons
          const cleanTitle = tab.title
            .replace(/^💤\s*/, "")
            .replace(/^🔒\s*/, "")
            .trim();
          acc.push({
            ...tab,
            title: cleanTitle,
          });
        }
        return acc;
      }, []);

      // Store trimmed list back to storage and update state
      const trimmedTabs = filteredTabs.slice(0, settings.historyLimit);
      await chrome.storage.local.set({ autoclosedTabs: trimmedTabs });
      setAutoclosedTabs(trimmedTabs);
    } catch (error) {
      console.error("Error loading autoclosed tabs:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDelete = async (tabToDelete) => {
    const updatedTabs = autoclosedTabs.filter(
      (tab) => tab.url !== tabToDelete.url
    );
    await chrome.storage.local.set({ autoclosedTabs: updatedTabs });
    setAutoclosedTabs(updatedTabs);
  };

  const handleDeleteSelected = async () => {
    const updatedTabs = autoclosedTabs.filter(
      (tab) => !selectedTabs.has(tab.url)
    );
    await chrome.storage.local.set({ autoclosedTabs: updatedTabs });
    setAutoclosedTabs(updatedTabs);
    setSelectedTabs(new Set());
    setSelectMode(false);
  };

  const toggleSelectAll = () => {
    if (selectedTabs.size === autoclosedTabs.length) {
      setSelectedTabs(new Set());
    } else {
      setSelectedTabs(new Set(autoclosedTabs.map((tab) => tab.url)));
    }
  };

  const handleReopen = async (tab) => {
    try {
      await chrome.tabs.create({ url: tab.url });
      // Remove reopened tab from history
      handleDelete(tab);
    } catch (error) {
      console.error("Error reopening tab:", error);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="gradient-text text-base font-medium flex items-center">
          <Trash2 className="mr-2 w-4 h-4" />
          Auto-closed Tabs
        </h3>
        <div className="flex items-center space-x-2">
          {autoclosedTabs.length > 0 && (
            <button
              onClick={() => setSelectMode(!selectMode)}
              className="modern-button !py-1 !px-2"
            >
              {selectMode ? "Cancel" : "Select"}
            </button>
          )}
          <button
            onClick={loadAutoclosedTabs}
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

      {selectMode && autoclosedTabs.length > 0 && (
        <div className="mb-3 flex justify-between items-center">
          <button
            onClick={toggleSelectAll}
            className="text-xs px-2 py-1 text-primary-600 hover:text-primary-700"
          >
            {selectedTabs.size === autoclosedTabs.length
              ? "Deselect All"
              : "Select All"}
          </button>
          {selectedTabs.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="text-xs px-2 py-1 text-danger-600 hover:text-danger-700"
            >
              Delete Selected ({selectedTabs.size})
            </button>
          )}
        </div>
      )}

      <div>
        {autoclosedTabs.length === 0 ? (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">
            <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium dark:text-white">
              No auto-closed tabs
            </p>
            <p className="text-xs mt-1 opacity-75">
              Auto-closed tabs will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {autoclosedTabs.map((tab) => (
              <div key={tab.url} className="modern-card p-2 group">
                {selectMode && (
                  <input
                    type="checkbox"
                    checked={selectedTabs.has(tab.url)}
                    onChange={() => {
                      const newSelected = new Set(selectedTabs);
                      if (newSelected.has(tab.url)) {
                        newSelected.delete(tab.url);
                      } else {
                        newSelected.add(tab.url);
                      }
                      setSelectedTabs(newSelected);
                    }}
                    className="mr-2 w-3 h-3"
                  />
                )}
                <div
                  className="flex items-center flex-1 min-w-0"
                  onClick={() => handleReopen(tab)}
                >
                  <div className="relative mr-2 flex-shrink-0">
                    {tab.favIconUrl ? (
                      <img
                        src={tab.favIconUrl}
                        alt=""
                        className="w-4 h-4 rounded"
                      />
                    ) : (
                      <div className="w-4 h-4 bg-gray-300 rounded flex items-center justify-center">
                        <span className="text-xs">🌐</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer">
                    <div className="text-xs font-medium text-gray-800 dark:text-white truncate">
                      {tab.title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {tab.url}
                    </div>
                  </div>
                </div>
                {!selectMode && (
                  <div className="flex items-center space-x-2 ml-2">
                    <button
                      onClick={() => handleReopen(tab)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-blue-500/20 rounded"
                      title="Reopen tab"
                    >
                      <ExternalLink className="w-3 h-3 text-blue-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(tab)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
                      title="Remove from history"
                    >
                      <X className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AutoclosedSection;
