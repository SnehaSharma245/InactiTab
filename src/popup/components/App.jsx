import React, { useState, useEffect } from "react";
import Header from "./Header";
import Navigation from "./Navigation";
import WhitelistSection from "./WhitelistSection";
import AutoclosedSection from "./AutoclosedSection";
import SettingsSection from "./SettingsSection";

import { useTheme } from "../hooks/useTheme";
import { useSettings } from "../hooks/useSettings";
import { useWhitelist } from "../hooks/useWhitelist";

const App = () => {
  const [currentSection, setCurrentSection] = useState("whitelist");

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
  }, []);

  const handleSectionChange = (section) => {
    setCurrentSection(section);
  };

  return (
    <div
      className={`w-96 min-h-96 text-xs leading-relaxed transition-all duration-300 ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-800"
      }`}
    >
      <Header theme={theme} onToggleTheme={toggleTheme} />
      <Navigation
        currentSection={currentSection}
        onSectionChange={handleSectionChange}
      />

      <div className="p-4">
        {currentSection === "whitelist" && (
          <WhitelistSection
            whitelist={whitelist}
            onAddToWhitelist={addToWhitelist}
            onRemoveFromWhitelist={removeFromWhitelist}
            onWhitelistCurrentTab={whitelistCurrentTab}
          />
        )}

        {currentSection === "manage" && <AutoclosedSection />}

        {currentSection === "settings" && (
          <SettingsSection
            settings={settings}
            onUpdateSettings={updateSettings}
            onSaveSettings={saveSettings}
          />
        )}
      </div>
    </div>
  );
};

export default App;
