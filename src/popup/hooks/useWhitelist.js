import { useState, useEffect } from "react";

export const useWhitelist = () => {
  const [whitelist, setWhitelist] = useState([]);

  useEffect(() => {
    chrome.storage.local.get("inactiTabWhitelist", (data) => {
      if (data.inactiTabWhitelist) {
        setWhitelist(data.inactiTabWhitelist);
      }
    });
  }, []);

  const saveWhitelist = async (newWhitelist) => {
    await chrome.storage.local.set({ inactiTabWhitelist: newWhitelist });
    chrome.runtime.sendMessage({
      action: "updateWhitelist",
      whitelist: newWhitelist,
    });
  };

  const addToWhitelist = async (url) => {
    try {
      const origin = new URL(url).origin;
      if (!whitelist.includes(origin)) {
        const newWhitelist = [...whitelist, origin];
        setWhitelist(newWhitelist);
        await saveWhitelist(newWhitelist);
      }
    } catch (e) {
      console.error("Invalid URL:", url);
    }
  };

  const removeFromWhitelist = async (url) => {
    const newWhitelist = whitelist.filter((item) => item !== url);
    setWhitelist(newWhitelist);
    await saveWhitelist(newWhitelist);
  };

  const whitelistCurrentTab = async () => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab || !tab.url) {
        console.error("No active tab found");
        return false;
      }

      const url = new URL(tab.url).origin;
      await addToWhitelist(url);

      chrome.runtime.sendMessage({
        action: "whitelistTab",
        tabId: tab.id,
        url: url,
      });

      return true;
    } catch (error) {
      console.error("Error whitelisting current tab:", error);
      return false;
    }
  };

  return {
    whitelist,
    addToWhitelist,
    removeFromWhitelist,
    whitelistCurrentTab,
  };
};
