import React from "react";

const Navigation = ({
  currentSection,
  showInactiveSection,
  onSectionChange,
}) => {
  const navBtnClass = (section) => `
    px-4 py-3 border-none bg-transparent text-sm font-medium cursor-pointer 
    border-b-2 transition-all duration-200 flex-1
    ${
      currentSection === section
        ? "text-primary-600 border-primary-500 bg-gray-100 dark:text-primary-500 dark:bg-primary-500/10"
        : "border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
    }
  `;

  return (
    <div className="bg-gray-50 border-b border-gray-200 dark:bg-dark-card dark:border-dark-border">
      <nav className="flex">
        {showInactiveSection && (
          <button
            className={navBtnClass("inactive")}
            onClick={() => onSectionChange("inactive")}
          >
            Inactive Tab
          </button>
        )}
        <button
          className={navBtnClass("whitelist")}
          onClick={() => onSectionChange("whitelist")}
        >
          Whitelist
        </button>
        <button
          className={navBtnClass("settings")}
          onClick={() => onSectionChange("settings")}
        >
          Settings
        </button>
      </nav>
    </div>
  );
};

export default Navigation;
