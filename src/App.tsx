import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { StudentPortal } from './components/StudentPortal';
import { AdminPortal } from './components/AdminPortal';
import { isSupabaseConfigured } from './lib/supabase';
import { Database, HelpCircle, CheckCircle2 } from 'lucide-react';

export function App() {
  const [currentView, setCurrentView] = useState<'student' | 'admin'>('student');
  const [showConfigGuide, setShowConfigGuide] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* Header */}
      <Navbar currentView={currentView} onViewChange={setCurrentView} />

      {/* Supabase Status Banner (Only displays if running in Demo Mode) */}
      {!isSupabaseConfigured && (
        <aside aria-label="Supabase Demo Mode Notification" className="bg-amber-50 border-b border-amber-200/80 px-4 py-2 text-xs text-amber-900">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
              <p>
                <strong>Running in Demo Mode:</strong> Actions are currently saved locally. Connect your free Supabase project to enable live PostgreSQL & image storage!
              </p>
            </div>
            <button
              onClick={() => setShowConfigGuide(true)}
              className="text-amber-800 underline hover:text-amber-950 font-semibold text-xs shrink-0 cursor-pointer"
            >
              How to connect Supabase &rarr;
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentView === 'student' ? <StudentPortal /> : <AdminPortal />}
      </main>

      {/* University & Departmental Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <p className="font-semibold text-slate-800">
              Department of Chemical Engineering • 300 Level
            </p>
            <p className="text-slate-400 mt-0.5">
              Ladoke Akintola University of Technology (LAUTECH), Ogbomoso
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowConfigGuide(true)}
              className="text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Supabase Setup Guide
            </button>
            <span className="text-slate-300">|</span>
            <span>Built with React + TypeScript</span>
          </div>
        </div>
      </footer>

      {/* Supabase Setup Modal */}
      {showConfigGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-lg">Connecting Live Supabase</h3>
              </div>
              <button
                onClick={() => setShowConfigGuide(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <p>
                To connect DeptPay to your own live database and file storage for your class:
              </p>

              <ol className="list-decimal pl-4 space-y-3 font-medium">
                <li>
                  Go to <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold underline">supabase.com</a> and create a free project.
                </li>
                <li>
                  Open the <strong>SQL Editor</strong> in Supabase, and copy-paste the contents of <code className="bg-slate-100 text-emerald-800 px-1 py-0.5 rounded font-mono">supabase/schema.sql</code>, then click <strong>Run</strong>.
                </li>
                <li>
                  In your Supabase project, go to <strong>Project Settings &gt; API</strong> and copy your <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">Project URL</code> and <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">anon public key</code>.
                </li>
                <li>
                  Create a <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">.env</code> file in your <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">deptpay</code> directory with:
                  <pre className="bg-slate-900 text-slate-100 p-3 rounded-xl mt-1.5 font-mono text-[11px] overflow-x-auto">
{`VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key`}
                  </pre>
                </li>
                <li>
                  Restart the Vite server (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono">npm run dev</code>). You are live!
                </li>
              </ol>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  The schema file already includes table definitions, security policies (RLS), image storage bucket configurations, and seed items.
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowConfigGuide(false)}
                className="py-2 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
