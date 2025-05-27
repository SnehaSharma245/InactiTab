import React, { useState, useEffect } from "react";
import Header from "./Header";
import Navigation from "./Navigation";
import WhitelistSection from "./WhitelistSection";
import InactiveSection from "./InactiveSection";
import AutoclosedSection from "./AutoclosedSection";
import SettingsSection from "./SettingsSection";

import { useTheme } from "../hooks/useTheme";
import { useSettings } from "../hooks/useSettings";
import { useWhitelist } from "../hooks/useWhitelist";

const App = () => {
  const [currentSection, setCurrentSection] = useState("whitelist");
  const [showInactiveSection, setShowInactiveSection] = useState(false);

  const { theme, toggleTheme } = useTheme();
  const { settings, updateSettings, saveSettings } = useSettings();
  const {
    whitelist,
    addToWhitelist,
    removeFromWhitelist,
    whitelistCurrentTab,
  } = useWhitelist();

  useEffect(() => {
    // Check if popup was opened for an inactive tab
    const urlParams = new URLSearchParams(window.location.search);
    const isInactive = urlParams.get("inactive") === "true";
    setShowInactiveSection(isInactive);
    if (isInactive) {
      setCurrentSection("inactive");
    }
  }, []);

  const handleSectionChange = (section) => {
    setCurrentSection(section);
  };

  return (
    <div className="w-full h-full max-w-md mx-auto text-sm leading-relaxed bg-dark-base text-gray-100 font-display relative">
      <div className="flex flex-col h-full">
        <Header theme={theme} onToggleTheme={toggleTheme} />
        <Navigation
          currentSection={currentSection}
          showInactiveSection={showInactiveSection}
          onSectionChange={handleSectionChange}
        />

        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {currentSection === "whitelist" && (
              <div className="animate-fadeIn">
                <WhitelistSection
                  whitelist={whitelist}
                  onAddToWhitelist={addToWhitelist}
                  onRemoveFromWhitelist={removeFromWhitelist}
                  onWhitelistCurrentTab={whitelistCurrentTab}
                />
              </div>
            )}

            {currentSection === "inactive" && (
              <div className="animate-fadeIn">
                <InactiveSection />
              </div>
            )}

            {currentSection === "manage" && (
              <div className="animate-fadeIn">
                <AutoclosedSection />
              </div>
            )}

            {currentSection === "settings" && (
              <div className="animate-fadeIn">
                <SettingsSection
                  settings={settings}
                  onUpdateSettings={updateSettings}
                  onSaveSettings={saveSettings}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
