import React from 'react';
import { ShieldCheck, GraduationCap, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentView: 'student' | 'admin';
  onViewChange: (view: 'student' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onViewChange }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top micro-bar: responsive text */}
      <div className="bg-emerald-800 text-emerald-100 text-[11px] sm:text-xs py-1.5 px-3 sm:px-4 text-center font-medium flex items-center justify-center gap-1.5 sm:gap-2">
        <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-300 shrink-0" />
        <span className="truncate">
          <span className="hidden sm:inline">DeptPay • Ladoke Akintola University of Technology (LAUTECH) </span>
          <span>Chemical Engineering • CHE 300L</span>
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <div 
          className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0" 
          onClick={() => onViewChange('student')}
        >
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white p-1 border border-slate-200/80 shadow-xs flex items-center justify-center shrink-0">
            <img 
              src="/lautech-logo.png" 
              alt="LAUTECH Crest" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900">
                Dept<span className="text-emerald-600">Pay</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden md:block">Receipt Verification & Bookkeeping</p>
          </div>
        </div>

        {/* View Switcher: Touch-friendly and compact on mobile */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
          <button
            onClick={() => onViewChange('student')}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer ${
              currentView === 'student'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
            <span>Student<span className="hidden sm:inline"> Portal</span></span>
          </button>
          <button
            onClick={() => onViewChange('admin')}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer ${
              currentView === 'admin'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Class Rep<span className="hidden sm:inline"> Portal</span></span>
          </button>
        </div>
      </div>
    </header>
  );
};
