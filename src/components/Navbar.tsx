import React from 'react';
import { ShieldCheck, GraduationCap, Sparkles, Database } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

interface NavbarProps {
  currentView: 'student' | 'admin';
  onViewChange: (view: 'student' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onViewChange }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top micro-bar */}
      <div className="bg-emerald-800 text-emerald-100 text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
        <span>DeptPay • Ladoke Akintola University of Technology (LAUTECH) Chemical Engineering</span>
        {!isSupabaseConfigured && (
          <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-950/60 text-emerald-300 px-2 py-0.5 rounded-full text-[11px]">
            <Database className="w-3 h-3" /> Demo Mode Active
          </span>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onViewChange('student')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-slate-900">Dept<span className="text-emerald-600">Pay</span></span>
              <span className="bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2 py-0.5 rounded-md border border-emerald-200/60">
                CHE 300L
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Receipt Verification & Bookkeeping Portal</p>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => onViewChange('student')}
            className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
              currentView === 'student'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            <span>Student Portal</span>
          </button>
          <button
            onClick={() => onViewChange('admin')}
            className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
              currentView === 'admin'
                ? 'bg-emerald-700 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Class Rep Portal</span>
          </button>
        </div>
      </div>
    </header>
  );
};
