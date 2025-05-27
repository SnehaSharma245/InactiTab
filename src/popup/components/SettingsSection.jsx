import React, { useState, useEffect } from "react";

const SettingsSection = ({ settings, onUpdateSettings, onSaveSettings }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    // Initialize local settings when props.settings change
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (key, value) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onUpdateSettings(newSettings);
  };

  const handleSave = async () => {
    await onSaveSettings(localSettings);
    setSaveStatus("✓ Saved!");
    setTimeout(() => setSaveStatus(""), 2000);
  };

  const handleHistoryLimitChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= 20) {
      const newSettings = {
        ...localSettings,
        historyLimit: value,
      };
      setLocalSettings(newSettings);
      onUpdateSettings(newSettings);
    }
  };

  return (
    <div className="animate-fade-in">
      <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-800 dark:text-white">
        <span className="mr-2 text-base">⚙️</span>Settings
      </h3>

      <div className="mb-5 p-4 bg-gray-50 rounded-lg border border-gray-200 dark:bg-dark-card dark:border-dark-border">
        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
          Inactive Timer
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            min="1"
            max="999"
            value={localSettings.timerValue}
            onChange={(e) =>
              handleChange("timerValue", parseInt(e.target.value))
            }
            className="flex-1 p-2.5 border border-gray-300 rounded-md text-sm bg-white text-gray-800 transition-all duration-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:bg-dark-input dark:text-white dark:border-dark-border"
          />
          <select
            value={localSettings.timerUnit}
            onChange={(e) => handleChange("timerUnit", e.target.value)}
            className="flex-[1.2] p-2.5 border border-gray-300 rounded-md text-sm bg-white text-gray-800 transition-all duration-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:bg-dark-input dark:text-white dark:border-dark-border"
          >
            <option value="seconds">Seconds</option>
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
          </select>
        </div>
      </div>

      <div className="mb-5 p-4 bg-gray-50 rounded-lg border border-gray-200 dark:bg-dark-card dark:border-dark-border">
        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
          Tab Threshold
        </label>
        <p className="text-xs text-gray-500 mb-2 dark:text-gray-400">
          Start tracking when tab count exceeds:
        </p>
        <input
          type="number"
          min="1"
          max="100"
          value={localSettings.tabThreshold}
          onChange={(e) =>
            handleChange("tabThreshold", parseInt(e.target.value))
          }
          className="w-full p-2.5 border border-gray-300 rounded-md text-sm bg-white text-gray-800 transition-all duration-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:bg-dark-input dark:text-white dark:border-dark-border"
        />
      </div>

      <div className="mb-5 p-4 bg-gray-50 rounded-lg border border-gray-200 dark:bg-dark-card dark:border-dark-border">
        <label className="flex items-center cursor-pointer text-sm mb-2">
          <input
            type="checkbox"
            checked={localSettings.whitelistPinned}
            onChange={(e) => handleChange("whitelistPinned", e.target.checked)}
            className="mr-3 w-4 h-4 cursor-pointer text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 dark:bg-dark-input dark:border-dark-border"
          />
          <span className="text-gray-800 font-medium dark:text-white">
            Whitelist pinned tabs
          </span>
        </label>
        <p className="text-xs text-gray-500 ml-6 dark:text-gray-400">
          Pinned tabs won't be closed automatically
        </p>
      </div>

      <div className="mb-5 p-4 bg-gray-50 rounded-lg border border-gray-200 dark:bg-dark-card dark:border-dark-border">
        <label className="flex items-center cursor-pointer text-sm mb-2">
          <input
            type="checkbox"
            checked={localSettings.autoClose}
            onChange={(e) => handleChange("autoClose", e.target.checked)}
            className="mr-3 w-4 h-4 cursor-pointer text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 dark:bg-dark-input dark:border-dark-border"
          />
          <span className="text-gray-800 font-medium dark:text-white">
            Auto-close inactive tabs
          </span>
        </label>
        <p className="text-xs text-gray-500 ml-6 dark:text-gray-400">
          Automatically close tabs without showing popup
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
          History Size
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            min="1"
            max="20"
            value={localSettings.historyLimit || 10}
            onChange={handleHistoryLimitChange}
            className="w-20 p-1.5 border border-gray-300 rounded text-xs bg-white text-gray-800 transition-all duration-300 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 dark:bg-dark-input dark:text-white dark:border-dark-border"
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            tabs (1-20)
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Number of auto-closed tabs to keep in history
        </p>
      </div>

      <button
        onClick={handleSave}
        className={`w-full px-4 py-2.5 border-none rounded-md text-sm font-medium cursor-pointer transition-all duration-300 inline-flex items-center justify-center relative overflow-hidden hover:-translate-y-0.5 shimmer ${
          saveStatus
            ? "bg-success-500 text-white hover:bg-success-600 hover:shadow-success"
            : "bg-primary-500 text-white hover:bg-primary-600 hover:shadow-primary"
        }`}
      >
        {saveStatus || "Save Settings"}
      </button>
    </div>
  );
};

export default SettingsSection;
