import React, { useState, useEffect } from "react";
import { Settings, Clock, Users, Pin, X, Archive } from "lucide-react";

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
      <h3 className="gradient-text text-lg font-semibold mb-3 flex items-center">
        <Settings className="mr-2 w-4 h-4" />
        Settings
      </h3>

      <div className="modern-card p-4 mb-4">
        <label className=" text-sm font-semibold mb-2 text-gray-100 flex items-center">
          <Clock className="mr-2 w-4 h-4 text-blue-400" />
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
            className="modern-input flex-1"
          />
          <select
            value={localSettings.timerUnit}
            onChange={(e) => handleChange("timerUnit", e.target.value)}
            className="modern-input flex-[1.2]"
          >
            <option value="seconds">Seconds</option>
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
          </select>
        </div>
      </div>

      <div className="modern-card p-4 mb-4">
        <label className=" text-sm font-semibold mb-2 text-gray-100 flex items-center">
          <Users className="mr-2 w-4 h-4 text-blue-400" />
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
          className="w-full modern-input"
        />
      </div>

      <div className="modern-card p-4 mb-4">
        <label className="flex items-center cursor-pointer text-sm mb-2">
          <input
            type="checkbox"
            checked={localSettings.whitelistPinned}
            onChange={(e) => handleChange("whitelistPinned", e.target.checked)}
            className="mr-3 w-4 h-4"
          />
          <div className="flex items-center justify-between w-full">
            <span className="text-gray-100 font-medium">
              Whitelist pinned tabs
            </span>
            <Pin className="mr-2 w-4 h-4 text-blue-400" />
          </div>
        </label>
        <p className="text-xs text-gray-500 ml-6 dark:text-gray-400">
          Pinned tabs won't be closed automatically
        </p>
      </div>

      <div className="modern-card p-4 mb-4">
        <label className="flex items-center cursor-pointer text-sm mb-2 ">
          <input
            type="checkbox"
            checked={localSettings.autoClose}
            onChange={(e) => handleChange("autoClose", e.target.checked)}
            className="mr-3 w-4 h-4"
          />
          <div className="flex items-center justify-between w-full">
            <span className="text-gray-100 font-medium">
              Auto-close inactive tabs
            </span>
            <X className="mr-2 w-4 h-4 text-blue-400" />
          </div>
        </label>
        <p className="text-xs text-gray-500 ml-6 dark:text-gray-400">
          Automatically close tabs without showing popup
        </p>
      </div>

      <div className="modern-card p-4">
        <label className=" text-sm font-semibold mb-2 text-gray-100 flex items-center">
          <Archive className="mr-2 w-4 h-4 text-blue-400" />
          History Size
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            min="1"
            max="20"
            value={localSettings.historyLimit || 10}
            onChange={handleHistoryLimitChange}
            className="modern-input w-20"
          />
          <span className="text-sm text-gray-300">tabs (1-20)</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Number of auto-closed tabs to keep in history
        </p>
      </div>

      <button onClick={handleSave} className="modern-button w-full mt-4">
        {saveStatus || "Save Settings"}
      </button>
    </div>
  );
};

export default SettingsSection;
