import React, { useState, useEffect } from "react";
import {
  Shield,
  Volume2,
  Video,
  Globe,
  RefreshCw,
  Pin,
  FileText,
} from "lucide-react";

const ProtectedSection = () => {
  const [protectedTabs, setProtectedTabs] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadProtectedTabs();

    // Set up auto-refresh every 2 seconds to catch changes
    const interval = setInterval(loadProtectedTabs, 2000);

    return () => clearInterval(interval);
  }, []);

  const loadProtectedTabs = async () => {
    try {
      setIsRefreshing(true);

      // Read protected tabs from storage (updated by background.js)
      const { protectedTabs = [] } = await chrome.storage.local.get(
        "protectedTabs"
      );

      console.log("Protected tabs from storage:", protectedTabs);
      setProtectedTabs(protectedTabs);
    } catch (error) {
      console.error("Error loading protected tabs:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTabClick = async (tab) => {
    try {
      await chrome.tabs.update(tab.id, { active: true });
      window.close();
    } catch (error) {
      console.error("Error switching to tab:", error);
    }
  };

  const getProtectionIcon = (reason) => {
    const iconMap = {
      audio: Volume2,
      video: Video,
      "video-call": Video,
      "never-track": Shield,
      whitelist: Shield,
      pinned: Pin,
      unknown: Shield,
    };

    const colorMap = {
      audio: "text-green-400",
      video: "text-blue-400",
      "video-call": "text-purple-400",
      "never-track": "text-cyan-400",
      whitelist: "text-yellow-400",
      pinned: "text-orange-400",
      unknown: "text-gray-400",
    };

    const IconComponent = iconMap[reason?.type] || Shield;
    return (
      <IconComponent
        className={`w-4 h-4 ${colorMap[reason?.type] || "text-gray-400"}`}
      />
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-base font-medium flex items-center text-white">
          <Shield className="mr-2 w-4 h-4" />
          Protected Tabs ({protectedTabs.length})
        </h3>
        <button
          onClick={loadProtectedTabs}
          disabled={isRefreshing}
          className="modern-button !py-1 !px-2"
          title="Refresh list"
        >
          <RefreshCw
            className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto border border-dark-border rounded-lg">
        {protectedTabs.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            <Shield className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium">No protected tabs found</p>
            <p className="text-xs mt-1 opacity-75">
              Tabs with media activity will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-dark-border">
            {protectedTabs.map((tab, index) => (
              <div
                key={`${tab.id}-${index}`}
                className="p-3 hover:bg-dark-surface/50 transition-colors cursor-pointer
                          bg-emerald-500/5 border-l-2 border-emerald-500/30"
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
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "block";
                          }}
                        />
                      ) : null}
                      <Globe
                        className="w-4 h-4 text-gray-400"
                        style={{ display: tab.favIconUrl ? "none" : "block" }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-white hover:text-blue-400 transition-colors">
                        {tab.title || "Unknown Tab"}
                      </p>
                      <p className="text-xs text-gray-400 truncate opacity-75">
                        {tab.origin || tab.url}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <div
                      className="flex items-center gap-1"
                      title={tab.protectionReason?.text || "Protected"}
                    >
                      {getProtectionIcon(tab.protectionReason)}
                      <span className="text-xs text-gray-400 hidden sm:inline">
                        {tab.protectionReason?.text || "Protected"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-blue-400">
            Media Protection Types
          </span>
        </div>
        <div className="space-y-1 text-xs text-gray-300">
          <div className="flex items-center gap-2">
            <Volume2 className="w-3 h-3 text-green-400" />
            <span>Audio playing</span>
          </div>
          <div className="flex items-center gap-2">
            <Video className="w-3 h-3 text-blue-400" />
            <span>Video/Camera active</span>
          </div>
          <div className="flex items-center gap-2">
            <Video className="w-3 h-3 text-purple-400" />
            <span>Video call sites (Meet, Zoom, Teams)</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-blue-500/20">
          <p className="text-xs text-gray-400">
            Only tabs with active media or on video call sites are shown here
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProtectedSection;
