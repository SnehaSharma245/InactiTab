import React from "react";

const Header = ({ theme, onToggleTheme }) => {
  return (
    <div
      className={`px-5 py-4 flex justify-between items-center bg-primary-500 border-b ${
        theme === "dark" ? "bg-dark-card border-dark-border" : "border-gray-200"
      }`}
    >
      <h1 className="text-base font-semibold text-white">InactiTab Manager</h1>
      <button
        className="bg-white/20 border border-white/30 rounded-full px-3 py-1.5 cursor-pointer transition-all duration-300 text-xs text-white hover:bg-white/30 hover:-translate-y-0.5"
        onClick={onToggleTheme}
      >
        {theme === "light" ? "🌙 Dark" : "☀️ Light"}
      </button>
    </div>
  );
};

export default Header;
