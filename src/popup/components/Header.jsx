import React, { useState } from "react";
import { Info, Shield } from "lucide-react";

const Header = () => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="bg-gradient-dark border-b border-dark-border relative overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <img
            src="../../icons/icon2.png"
            alt="InactiTab"
            className="w-5 h-5"
          />
          <h1 className="brand-title">InactiTab</h1>
        </div>

        <div className="relative">
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors duration-200"
          >
            <Info className="w-4 h-4 text-gray-400 hover:text-blue-400" />
          </button>

          {showTooltip && (
            <div className="fixed right-2 top-12 bg-dark-surface/95 backdrop-blur-sm border border-dark-border rounded-xl p-3 min-w-64 z-[9999] shadow-xl">
              <div className="text-xs space-y-2">
                <div className="flex items-center text-blue-500 font-semibold mb-3">
                  <Shield className="w-5 h-5 mr-2" />
                  <span className="text-lg hover:text-blue-600 transition-colors duration-200">
                    Protected Tabs
                  </span>
                </div>

                <div className="space-y-1 text-gray-300">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">•</span>
                    <span>Tabs with audio/video playing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">•</span>
                    <span>Video call sites (Meet, Zoom, Teams)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">•</span>
                    <span>Whitelisted URLs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">•</span>
                    <span>Pinned tabs (if enabled)</span>
                  </div>
                </div>

                <div className="border-t border-gray-600 pt-2 mt-2">
                  <span className="text-gray-400 text-xs">
                    These tabs are not tracked for inactivity
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-shine animate-shimmer"></div>
    </div>
  );
};

export default Header;
