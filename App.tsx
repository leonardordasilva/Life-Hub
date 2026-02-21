import React, { useState, useEffect } from 'react';
import { Home } from './views/Home';
import { FinanceDashboard } from './views/Finance/FinanceDashboard';
import { VacationDashboard } from './views/Vacation/VacationDashboard';
import { EntertainmentDashboard } from './views/Entertainment/EntertainmentDashboard';
import { GamesDashboard } from './views/Games/GamesDashboard';
import { SetupScreen } from './views/SetupScreen';
import { LoginScreen } from './views/LoginScreen';
import { ForgotPassword } from './views/ForgotPassword';
import { ResetPassword } from './views/ResetPassword';
import { AppSection } from './types';
import { 
  LayoutDashboard, 
  Wallet, 
  Plane, 
  Film, 
  Gamepad2, 
  Loader2, 
  Menu,
  X,
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [currentSection, setCurrentSection] = useState<AppSection>(AppSection.HOME);
  const [isDbReady, setIsDbReady] = useState<boolean | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  
  const { user, userRole, loading: authLoading, signIn, signUp, signOut } = useAuth();

  useEffect(() => {
    if (!user) return; // Don't check DB until authenticated
    
    const checkDatabase = async () => {
      try {
        const { error: financeError } = await supabase.from('finance_categories').select('id').limit(1);
        // For non-admin users, RLS will block this - that's OK
        if (financeError && !financeError.message.includes('row-level security')) throw financeError;

        const { error: entError } = await supabase.from('ent_series').select('title').limit(1);
        if (entError) throw entError;

        setIsDbReady(true);
      } catch (e: any) {
        console.error("DB Check Exception:", e);
        setDbError(e.message || "Erro desconhecido de conexão ou tabelas ausentes.");
        setIsDbReady(false);
      }
    };

    checkDatabase();
  }, [retryTrigger, user]);

  const handleRetry = () => {
    setIsDbReady(null);
    setDbError(null);
    setRetryTrigger(prev => prev + 1);
  };

  const handleLogout = async () => {
    await signOut();
    setCurrentSection(AppSection.HOME);
  };

  // Check for reset-password route
  useEffect(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path === '/reset-password' || hash.includes('type=recovery')) {
      setShowResetPassword(true);
    }
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (showResetPassword) {
    return <ResetPassword onDone={() => {
      setShowResetPassword(false);
      window.history.replaceState(null, '', '/');
    }} />;
  }

  if (!user || !userRole) {
    if (showForgotPassword) {
      return <ForgotPassword onBack={() => setShowForgotPassword(false)} />;
    }
    return <LoginScreen onSignIn={signIn} onSignUp={signUp} onForgotPassword={() => setShowForgotPassword(true)} />;
  }

  if (isDbReady === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (isDbReady === false) {
    return <SetupScreen error={dbError} onRetry={handleRetry} />;
  }

  const renderSection = () => {
    switch (currentSection) {
      case AppSection.HOME:
        return <Home onNavigate={setCurrentSection} role={userRole} />;
      case AppSection.FINANCE:
        return userRole === 'ADMIN' ? <FinanceDashboard role={userRole} /> : <Home onNavigate={setCurrentSection} role={userRole} />;
      case AppSection.VACATION:
        return userRole === 'ADMIN' ? <VacationDashboard role={userRole} /> : <Home onNavigate={setCurrentSection} role={userRole} />;
      case AppSection.ENTERTAINMENT:
        return <EntertainmentDashboard role={userRole} />;
      case AppSection.GAMES:
        return <GamesDashboard role={userRole} />;
      case AppSection.SETUP:
        return (
            <SetupScreen 
                error={null} 
                onRetry={() => { 
                    handleRetry(); 
                    setCurrentSection(AppSection.HOME); 
                }} 
            />
        );
      default:
        return <Home onNavigate={setCurrentSection} role={userRole} />;
    }
  };

  const navItems = [
    { id: AppSection.HOME, label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, visible: true },
    { id: AppSection.FINANCE, label: 'Financeiro', icon: <Wallet className="w-5 h-5" />, visible: userRole === 'ADMIN' },
    { id: AppSection.VACATION, label: 'Férias', icon: <Plane className="w-5 h-5" />, visible: userRole === 'ADMIN' },
    { id: AppSection.ENTERTAINMENT, label: 'Entretenimento', icon: <Film className="w-5 h-5" />, visible: userRole === 'ADMIN' },
    { id: AppSection.GAMES, label: 'Jogos', icon: <Gamepad2 className="w-5 h-5" />, visible: userRole === 'ADMIN' },
  ].filter(item => item.visible);

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans selection:bg-purple-500/30 overflow-hidden">
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-slate-800 rounded-lg border border-white/10 text-white shadow-lg backdrop-blur-md"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <aside className={`
        fixed md:relative z-40 h-full w-64 bg-slate-900 border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-white/5">
           <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
             Live Hub
           </h1>
           <div className="flex items-center gap-2 mt-1">
               <div className={`w-2 h-2 rounded-full ${userRole === 'ADMIN' ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
               <p className="text-xs text-slate-500">{userRole === 'ADMIN' ? 'Administrador' : 'Visitante'}</p>
           </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = currentSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentSection(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-white border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <span className={isActive ? 'text-indigo-400' : 'text-slate-500'}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
            {userRole === 'ADMIN' && (
                <button
                    onClick={() => {
                    setCurrentSection(AppSection.SETUP);
                    setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    currentSection === AppSection.SETUP
                        ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-white border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                >
                    <span className={currentSection === AppSection.SETUP ? 'text-indigo-400' : 'text-slate-500'}>
                    <Settings className="w-5 h-5" />
                    </span>
                    Configurações
                </button>
            )}
            <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent"
            >
                <LogOut className="w-5 h-5" />
                Sair
            </button>
        </div>
      </aside>

      <main className="flex-1 relative overflow-hidden flex flex-col bg-slate-950">
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/80 z-30 md:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        
        <div className="flex-1 overflow-y-auto custom-scrollbar relative scroll-smooth">
           {renderSection()}
        </div>
      </main>
    </div>
  );
};

export default App;
