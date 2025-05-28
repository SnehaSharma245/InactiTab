import React from "react";

const Navigation = ({
  currentSection,
  showInactiveSection,
  onSectionChange,
}) => {
  const getNavBtnClasses = (section) => {
    const baseClasses = `
      nav-item relative overflow-hidden
      flex items-center justify-center gap-2
      transition-all duration-300
    `;

    return currentSection === section
      ? `${baseClasses} active`
      : `${baseClasses}`;
  };

  return (
    <div className="bg-gradient-to-r from-cyan-800/10 to-cyan-500/10 border-b border-cyan-200 dark:border-cyan-800">
      <nav className="flex">
        <button
          className={getNavBtnClasses("whitelist")}
          onClick={() => onSectionChange("whitelist")}
        >
          Whitelist
        </button>

        <button
          className={getNavBtnClasses("protected")}
          onClick={() => onSectionChange("protected")}
        >
          Playing
        </button>

        <button
          className={getNavBtnClasses("inactive")}
          onClick={() => onSectionChange("inactive")}
        >
          Inactive
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
