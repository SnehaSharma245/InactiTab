import React from "react";

const Navigation = ({
  currentSection,
  showInactiveSection,
  onSectionChange,
}) => {
  const getNavBtnClasses = (section, theme) => {
    const baseClasses = `
      px-3 py-2 border-none bg-transparent text-xs font-medium cursor-pointer 
      border-b-2 transition-all duration-200 flex-1
    `;

    if (currentSection === section) {
      return theme === "dark"
        ? `${baseClasses} text-blue-400 border-blue-400 bg-blue-400/10`
        : `${baseClasses} text-blue-600 border-blue-500 bg-blue-50`;
    }

    return theme === "dark"
      ? `${baseClasses} border-transparent text-gray-400 hover:bg-gray-700 hover:text-white`
      : `${baseClasses} border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-800`;
  };

  return (
    <div className="bg-gray-50 border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <nav className="flex">
        {showInactiveSection && (
          <button
            className={getNavBtnClasses("inactive")}
            onClick={() => onSectionChange("inactive")}
          >
            Inactive
          </button>
        )}
        <button
          className={getNavBtnClasses("whitelist")}
          onClick={() => onSectionChange("whitelist")}
        >
          Quick
        </button>
        <button
          className={getNavBtnClasses("manage")}
          onClick={() => onSectionChange("manage")}
        >
          History
        </button>
        <button
          className={getNavBtnClasses("settings")}
          onClick={() => onSectionChange("settings")}
        >
          Settings
        </button>
      </nav>
    </div>
  );
};

export default Navigation;
