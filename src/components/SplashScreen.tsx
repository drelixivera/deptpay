import React from 'react';
import { formatClassSlug } from '../lib/utils'; // <-- Import the helper

interface SplashScreenProps {
  fadeOut?: boolean;
  classSlug: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ fadeOut, classSlug }) => {
  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0f172a] text-white transition-opacity duration-700 ease-in-out ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center justify-center px-6 w-full max-w-sm">
        
        {/* Logo */}
        <div className="w-20 h-20 rounded-2xl bg-white p-3 flex items-center justify-center shadow-2xl shadow-emerald-500/10 mb-6 animate-in zoom-in-95 duration-700 ease-out fill-mode-both">
          <img 
            src="/lautech-logo.png" 
            alt="LAUTECH Crest" 
            className="w-full h-full object-contain" 
          />
        </div>

        {/* Brand Text */}
        <h1 className="text-3xl font-black tracking-tight text-white mb-2 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200 fill-mode-both">
          Dept<span className="text-emerald-400">Pay</span>
        </h1>
        
        <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase mb-10 animate-in fade-in duration-700 delay-300 fill-mode-both">
          Secure Payment Portal
        </p>

        {/* Loading Bar Container */}
        <div className="w-full max-w-[200px] h-1.5 bg-slate-800 rounded-full overflow-hidden relative mb-4 animate-in fade-in duration-500 delay-500 fill-mode-both">
          {/* The Filling Bar */}
          <div className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full animate-[fill-bar_2s_ease-in-out_forwards]" />
        </div>

        {/* Dynamic Subtitle (Appears as bar fills) */}
        <p className="text-xs font-semibold text-emerald-300/80 tracking-widest uppercase animate-in fade-in duration-1000 delay-1000 fill-mode-both">
          {formatClassSlug(classSlug)} {/* <-- Use the helper here */}
        </p>
      </div>
    </div>
  );
};