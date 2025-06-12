/**
 * Script injection utility functions for InactiTab extension
 */

/**
 * Inject sleep mode indicator into tab
 * @param {number} tabId - Tab ID
 */
export async function injectSleepIndicator(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        try {
          let sleepIcon = document.getElementById("sleep-tab-icon");
          if (!sleepIcon) {
            sleepIcon = document.createElement("div");
            sleepIcon.id = "sleep-tab-icon";
            sleepIcon.innerHTML = "💤";
            sleepIcon.style.cssText = `
              position: fixed;
              top: 10px;
              right: 10px;
              background: linear-gradient(135deg, #4a90e2, #357abd);
              color: white;
              padding: 8px 12px;
              border-radius: 20px;
              font-size: 16px;
              z-index: 10000;
              font-weight: bold;
              box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
              border: 2px solid #357abd;
              animation: sleepPulse 2s ease-in-out infinite;
            `;

            const style = document.createElement("style");
            style.textContent = `
              @keyframes sleepPulse {
                0%, 100% { opacity: 0.8; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.05); }
              }
            `;
            document.head.appendChild(style);
            document.body.appendChild(sleepIcon);
          }

          if (!document.title.startsWith("💤")) {
            document.title = `💤${document.title}`;
          }
        } catch (err) {
          console.error("Error adding sleep mode icon:", err);
        }
      },
    });
  } catch (error) {
    // Silent fail
  }
}

/**
 * Remove sleep mode indicators from tab
 * @param {number} tabId - Tab ID
 */
export async function removeSleepIndicator(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        try {
          const sleepIcon = document.getElementById("sleep-tab-icon");
          if (sleepIcon && sleepIcon.parentNode) {
            sleepIcon.remove();
          }

          const inactiveIcon = document.getElementById("inactive-tab-icon");
          if (inactiveIcon && inactiveIcon.parentNode) {
            inactiveIcon.remove();
          }

          if (document.title.startsWith("💤")) {
            document.title = document.title.replace(/^💤\s*/, "");
          }
        } catch (err) {
          console.error("Error removing sleep mode icon:", err);
        }
      },
    });
  } catch (error) {
    // Silent fail
  }
}

/**
 * Inject whitelist indicator into tab
 * @param {number} tabId - Tab ID
 */
export async function injectWhitelistIndicator(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        try {
          const sleepIcon = document.getElementById("sleep-tab-icon");
          if (sleepIcon && sleepIcon.parentNode) {
            sleepIcon.remove();
          }

          const inactiveIcon = document.getElementById("inactive-tab-icon");
          if (inactiveIcon && inactiveIcon.parentNode) {
            inactiveIcon.remove();
          }

          if (!document.title.startsWith("🔒")) {
            document.title = `🔒${document.title}`;
          }

          if (document.title.includes("💤")) {
            document.title = document.title.replace(/💤\s*/, "");
          }
        } catch (err) {
          console.error("Error updating tab icon:", err);
        }
      },
    });
  } catch (error) {
    // Silent fail
  }
}

/**
 * Remove whitelist indicators from tab
 * @param {number} tabId - Tab ID
 */
export async function removeWhitelistIndicator(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        if (document.title.startsWith("🔒")) {
          document.title = document.title.replace(/^🔒\s*/, "");
        }
      },
    });
  } catch (error) {
    // Silent fail
  }
}

/**
 * Refresh tab content to ensure proper functionality
 * @param {number} tabId - Tab ID
 */
export async function refreshTabContent(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        try {
          const tempElement = document.createElement("div");
          tempElement.id = "inactitab-refresh-trigger";
          document.body.appendChild(tempElement);
          setTimeout(() => {
            if (tempElement && tempElement.parentNode) {
              tempElement.remove();
            }
          }, 100);

          const sleepIcon = document.getElementById("sleep-tab-icon");
          if (sleepIcon && sleepIcon.parentNode) {
            sleepIcon.remove();
          }

          const inactiveIcon = document.getElementById("inactive-tab-icon");
          if (inactiveIcon && inactiveIcon.parentNode) {
            inactiveIcon.remove();
          }

          if (document.title.startsWith("💤")) {
            document.title = document.title.replace(/^💤\s*/, "");
          }
        } catch (err) {
          console.error("Error refreshing tab content:", err);
        }
      },
    });
  } catch (error) {
    // Silent fail
  }
}
