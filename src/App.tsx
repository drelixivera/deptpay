import { useState, useEffect, lazy, Suspense } from 'react';
import { Navbar } from './components/Navbar';
import { StudentPortal } from './components/StudentPortal';
import { SplashScreen } from './components/SplashScreen';
import { isSupabaseConfigured } from './lib/supabase';

const AdminPortal = lazy(() => import('./components/AdminPortal').then(m => ({ default: m.AdminPortal })));

export function App() {
  const [currentView, setCurrentView] = useState<'student' | 'admin'>('student');
  const [showSplash, setShowSplash] = useState(true);
  const [splashFade, setSplashFade] = useState(false);

  useEffect(() => {
    // Show branded splash screen on initial entrance
    const timer = setTimeout(() => {
      setSplashFade(true);
      const closeTimer = setTimeout(() => {
        setShowSplash(false);
      }, 500); // Wait for fade-out transition
      return () => clearTimeout(closeTimer);
    }, 900);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* Branded Native-App Style Splash Screen */}
      {showSplash && <SplashScreen fadeOut={splashFade} />}

      {/* Header */}
      <Navbar currentView={currentView} onViewChange={setCurrentView} />

      {/* Supabase Status Banner (Only displays if running in Demo Mode) */}
      {!isSupabaseConfigured && (
        <aside aria-label="Supabase Demo Mode Notification" className="bg-amber-50 border-b border-amber-200/80 px-4 py-2 text-xs text-amber-900">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-center">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
            <p>
              <strong>Running in Demo Mode:</strong> Actions are currently saved locally.
            </p>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentView === 'student' ? (
          <StudentPortal />
        ) : (
          <Suspense fallback={
            <div className="min-h-[60vh] flex items-center justify-center text-xs text-slate-400">
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          }>
            <AdminPortal />
          </Suspense>
        )}
      </main>

      {/* University & Departmental Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 sm:py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <p className="font-bold text-slate-800">
              Department of Chemical Engineering • 300 Level
            </p>
            <p className="text-slate-400 mt-0.5">
              Ladoke Akintola University of Technology (LAUTECH), Ogbomoso
            </p>
          </div>

          <div className="text-slate-400 font-medium">
            DeptPay • Class Receipt Verification Portal
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
