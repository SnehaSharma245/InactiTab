import React from "react";

const Header = () => {
  return (
    <div className="bg-gradient-dark border-b border-dark-border relative overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-3 relative z-10">
        <img
          src="../../icons/favicon.png"
          alt="InactiTab"
          className="w-8 h-8"
        />
        <h1 className="brand-title">InactiTab</h1>
      </div>
      <div className="absolute inset-0 bg-gradient-shine animate-shimmer"></div>
    </div>
  );
};

export default Header;
