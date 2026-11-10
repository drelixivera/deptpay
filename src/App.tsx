import { Analytics } from "@vercel/analytics/react"
import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { StudentPortal } from './components/StudentPortal';
import { SplashScreen } from './components/SplashScreen';
import { isSupabaseConfigured } from './lib/supabase';
import { formatClassSlug, getClassInfoForMeta } from './lib/utils';

const AdminPortal = lazy(() => import('./components/AdminPortal').then(m => ({ default: m.AdminPortal })));

// A wrapper to read the URL parameter for the Student Portal
const StudentPortalWrapper = () => {
  const { classSlug } = useParams();
  // If no slug is provided, default to 'che-300l'
  return <StudentPortal classSlug={classSlug || 'che-300l'} />;
};

// We need a wrapper inside the Router to use useLocation
const AppContent = () => {
  const [currentView, setCurrentView] = useState<'student' | 'admin'>('student');
  const [showSplash, setShowSplash] = useState(true);
  const [splashFade, setSplashFade] = useState(false);
  const location = useLocation();

  // Extract the slug from the URL (e.g. "/che-300l" -> "che-300l")
  const pathParts = location.pathname.split('/');
  const currentSlug = pathParts[1] || 'che-300l';

    useEffect(() => {
    const timer = setTimeout(() => {
      setSplashFade(true);
      const closeTimer = setTimeout(() => {
        setShowSplash(false);
      }, 800); // Slower fade out
      return () => clearTimeout(closeTimer);
    }, 2500); // <-- Change 900 to 2500

    return () => clearTimeout(timer);
  }, []);

    // Update document title and standard meta description dynamically
  useEffect(() => {
    const titleString = formatClassSlug(currentSlug);
    const { deptName, level } = getClassInfoForMeta(currentSlug);
    
    // 1. Update the document title
    document.title = `DeptPay | ${titleString}`;

    // 2. Update the standard meta description
    const description = `The official payment portal for ${deptName} ${level} Level at LAUTECH. Upload your receipts, track your payment status, and get verified instantly.`;
    
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);
  }, [currentSlug]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-emerald-500 selection:text-white">
      {showSplash && <SplashScreen fadeOut={splashFade} classSlug={currentSlug} />}

      {/* Pass the slug to the Navbar */}
      <Navbar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        classSlug={currentSlug} 
      />

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

      <main className="flex-1 pb-16">
        {currentView === 'student' ? (
          <Routes>
            {/* Default route goes to CHE 300L */}
            <Route path="/" element={<Navigate to="/che-300l" replace />} />
            {/* Any class slug loads the Student Portal */}
            <Route path="/:classSlug" element={<StudentPortalWrapper />} />
          </Routes>
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

      <footer className="border-t border-slate-200 bg-white py-6 sm:py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <p className="font-bold text-slate-800">
              DeptPay • Class Receipt Verification Portal
            </p>
            <p className="text-slate-400 mt-0.5">
              Ladoke Akintola University of Technology (LAUTECH), Ogbomoso
            </p>
          </div>
          <div className="text-slate-400 font-medium">
            Built for Students, By Ojo Daniel Oluwaseunfunmi
          </div>
        </div>
      </footer>
      <Analytics/>
    </div>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;