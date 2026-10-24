import React from 'react';
import { GraduationCap } from 'lucide-react';

interface SplashScreenProps {
  fadeOut?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ fadeOut }) => {
  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 text-white transition-opacity duration-500 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background ambient glow */}
      <div className="absolute w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>

      {/* Spinning Ring & Logo Container */}
      <div className="relative flex items-center justify-center mb-6">
        {/* Outer Animated Spinning Ring */}
        <div className="w-24 h-24 rounded-full border-3 border-emerald-500/20 border-t-emerald-400 animate-spin"></div>
        
        {/* Center Glowing Brand Icon */}
        <div className="absolute w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30">
          <GraduationCap className="w-9 h-9 animate-bounce duration-1000" />
        </div>
      </div>

      {/* Brand Title */}
      <div className="text-center space-y-1.5 px-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          Dept<span className="text-emerald-400">Pay</span>
        </h1>
        <p className="text-xs font-semibold text-emerald-300/90 tracking-wide uppercase">
          Chemical Engineering • 300 Level
        </p>
        <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
          Ladoke Akintola University of Technology (LAUTECH)
        </p>
      </div>

      {/* Subtle loader bar at bottom */}
      <div className="w-36 h-1 bg-slate-800 rounded-full mt-8 overflow-hidden relative">
        <div className="w-1/2 h-full bg-gradient-to-r from-emerald-500 to-teal-300 rounded-full absolute animate-[loader_1.2s_ease-in-out_infinite]"></div>
      </div>
    </div>
  );
};
