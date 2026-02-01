
import React from 'react';

interface HeaderProps {
  onLogoClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogoClick }) => {
  return (
    <header className="w-full bg-white border-b border-slate-200 py-4 px-6 flex items-center justify-between sticky top-0 z-40">
      <div 
        className="flex items-center gap-3 cursor-pointer group"
        onClick={onLogoClick}
      >
        <div className="bg-red-600 text-white w-10 h-10 flex items-center justify-center rounded-lg font-bold text-xl shadow-sm group-hover:bg-red-700 transition-colors">
          AT
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">ABDY TAH</h1>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">OSU Precision Platform</p>
        </div>
      </div>
      
      <div className="hidden sm:flex items-center gap-6">
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          v1.0 Ready
        </span>
      </div>
    </header>
  );
};

export default Header;
