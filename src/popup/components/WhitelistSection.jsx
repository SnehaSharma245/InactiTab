import React, { useState } from "react";

const WhitelistSection = ({
  whitelist,
  onAddToWhitelist,
  onRemoveFromWhitelist,
  onWhitelistCurrentTab,
}) => {
  const [urlInput, setUrlInput] = useState("");
  const [feedback, setFeedback] = useState("");

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
      <div className="mb-5">
        <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-800 dark:text-white">
          <span className="mr-2 text-base">🛡️</span>Whitelisted URLs
        </h3>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-5 border border-gray-200 dark:bg-dark-card dark:border-dark-border">
        <button
          className={`w-full mt-0 mb-3 px-4 py-2.5 border-none rounded-md text-sm font-medium cursor-pointer transition-all duration-300 inline-flex items-center justify-center relative overflow-hidden hover:-translate-y-0.5 shimmer ${
            feedback
              ? "bg-success-500 text-white hover:bg-success-600 hover:shadow-success"
              : "bg-success-500 text-white hover:bg-success-600 hover:shadow-success"
          }`}
          onClick={handleWhitelistCurrent}
        >
          <span className="mr-1.5 text-sm">🛡️</span>
          {feedback || "Whitelist Current Tab"}
        </button>

        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter URL to whitelist (e.g., https://example.com)"
          className="w-full p-2.5 border border-gray-300 rounded-md text-sm bg-white text-gray-800 transition-all duration-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:bg-dark-input dark:text-white dark:border-dark-border"
        />
        <button
          onClick={handleAddUrl}
          className="w-full mt-3 px-4 py-2.5 border-none rounded-md text-sm font-medium cursor-pointer transition-all duration-300 inline-flex items-center justify-center relative overflow-hidden hover:-translate-y-0.5 bg-primary-500 text-white hover:bg-primary-600 hover:shadow-primary shimmer"
        >
          Add to Whitelist
        </button>
      </div>

      <div>
        {whitelist.length === 0 ? (
          <div className="text-center py-5 text-gray-600 dark:text-gray-400">
            <p className="text-sm m-0 text-gray-800 font-medium dark:text-white">
              No tabs to display
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {whitelist.map((url, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200 transition-all duration-200 hover:border-primary-500 hover:bg-gray-100 dark:bg-dark-card dark:border-dark-border dark:hover:bg-dark-hover"
              >
                <span
                  className="text-sm text-gray-800 overflow-hidden text-ellipsis whitespace-nowrap flex-1 mr-3 dark:text-white"
                  title={url}
                >
                  {url}
                </span>
                <button
                  className="text-danger-500 bg-none border-none cursor-pointer px-2 py-1 rounded text-xs transition-all duration-200 hover:bg-danger-500/10 hover:text-danger-600"
                  onClick={() => onRemoveFromWhitelist(url)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WhitelistSection;
