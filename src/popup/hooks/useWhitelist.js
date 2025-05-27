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
      const origin =
        typeof url === "string" && url.startsWith("http")
          ? new URL(url).origin
          : url; // url is already an origin

      if (!whitelist.includes(origin)) {
        const newWhitelist = [...whitelist, origin];
        setWhitelist(newWhitelist);
        await saveWhitelist(newWhitelist);
        return true;
      }
      return false;
    } catch (e) {
      console.error("Invalid URL:", url);
      return false;
    }
  };

  const removeFromWhitelist = async (url) => {
    const origin =
      typeof url === "string" && url.startsWith("http")
        ? new URL(url).origin
        : url; // url is already an origin

    const newWhitelist = whitelist.filter((item) => item !== origin);
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
