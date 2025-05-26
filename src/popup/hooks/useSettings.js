import { useState, useEffect } from "react";

export const useSettings = () => {
  const [settings, setSettings] = useState({
    timerValue: 5,
    timerUnit: "seconds",
    tabThreshold: 10,
    whitelistPinned: true,
    autoClose: false,
  });

  useEffect(() => {
    chrome.storage.local.get("inactiTabSettings", (data) => {
      if (data.inactiTabSettings) {
        setSettings({ ...settings, ...data.inactiTabSettings });
      }
    });
  }, []);

  const updateSettings = (newSettings) => {
    setSettings(newSettings);
  };

  const saveSettings = async (settingsToSave) => {
    await chrome.storage.local.set({ inactiTabSettings: settingsToSave });
    chrome.runtime.sendMessage({
      action: "updateSettings",
      settings: settingsToSave,
    });
  };

  return { settings, updateSettings, saveSettings };
};
