import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/App";
import ProtectedSection from "./components/ProtectedSection.jsx";
import "./styles/index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

const renderSection = () => {
  switch (currentSection) {
    case "whitelist":
      return (
        <WhitelistSection
          whitelist={whitelist}
          onAddToWhitelist={handleAddToWhitelist}
          onRemoveFromWhitelist={handleRemoveFromWhitelist}
          onWhitelistCurrentTab={handleWhitelistCurrentTab}
        />
      );
    case "protected":
      return <ProtectedSection />;
    case "inactive":
      return <InactiveSection />;
    case "manage":
      return <AutoclosedSection />;
    case "settings":
      return (
        <SettingsSection
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onSaveSettings={handleSaveSettings}
        />
      );
    default:
      return <div className="text-white p-4">Select a section</div>;
  }
};
