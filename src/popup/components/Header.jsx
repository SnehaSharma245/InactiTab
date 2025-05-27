import React from "react";

const Header = ({ theme, onToggleTheme }) => {
  return (
    <div
      className={`px-4 py-3 flex justify-between items-center border-b ${
        theme === "dark"
          ? "bg-gray-800 border-gray-700"
          : "bg-blue-500 border-gray-200"
      }`}
    >
      <h1 className="text-sm font-semibold text-white">InactiTab Manager</h1>
      <button
        className="bg-white/20 border border-white/30 rounded-full px-2 py-1 cursor-pointer transition-all duration-300 text-xs text-white hover:bg-white/30 hover:-translate-y-0.5"
        onClick={onToggleTheme}
      >
        {theme === "light" ? "🌙" : "☀️"}
      </button>
    </div>
  );
};

export default Header;
