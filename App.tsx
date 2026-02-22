import React, { useState, useEffect } from 'react';
import { Home } from './views/Home';
import { FinanceDashboard } from './views/Finance/FinanceDashboard';
import { VacationDashboard } from './views/Vacation/VacationDashboard';
import { EntertainmentDashboard } from './views/Entertainment/EntertainmentDashboard';
import { GamesDashboard } from './views/Games/GamesDashboard';
import { SetupScreen } from './views/SetupScreen';
import { LoginScreen } from './views/LoginScreen';
import { LandingPage } from './views/LandingPage';
import { ForgotPassword } from './views/ForgotPassword';
import { ResetPassword } from './views/ResetPassword';
import { OnboardingFlow, OnboardingData } from './views/Onboarding/OnboardingFlow';
import { ProfilePage } from './views/Profile/ProfilePage';
import { AppSection } from './types';
import { 
  LayoutDashboard, Wallet, Plane, Film, Gamepad2, Loader2, Menu, X, User, LogOut
} from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useProfile } from './hooks/useProfile';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [currentSection, setCurrentSection] = useState<AppSection | 'PROFILE'>(AppSection.HOME);
  const [isDbReady, setIsDbReady] = useState<boolean | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [authView, setAuthView] = useState<'landing' | 'login' | 'signup'>('landing');
  
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const { profile, loading: profileLoading, updateProfile, uploadAvatar, refetch: refetchProfile } = useProfile(user?.id ?? null);

  useEffect(() => {
    if (!user || !profile?.onboarding_completed) return;
    
    const checkDatabase = async () => {
      try {
        const { error: entError } = await supabase.from('ent_series').select('title').limit(1);
        if (entError) throw entError;
        setIsDbReady(true);
      } catch (e: any) {
        console.error("DB Check Exception:", e);
        setDbError(e.message || "Erro desconhecido.");
        setIsDbReady(false);
      }
    };
    checkDatabase();
  }, [retryTrigger, user, profile?.onboarding_completed]);

  const handleRetry = () => {
    setIsDbReady(null);
    setDbError(null);
    setRetryTrigger(prev => prev + 1);
  };

  const handleLogout = async () => {
    await signOut();
    setCurrentSection(AppSection.HOME);
    setAuthView('landing');
  };

  const handleOnboardingComplete = async (data: OnboardingData) => {
    if (!user) return;
    
    let avatarUrl: string | null = null;
    if (data.avatarFile) {
      avatarUrl = await uploadAvatar(data.avatarFile);
    }

    await updateProfile({
      display_name: data.displayName,
      date_of_birth: data.dateOfBirth,
      avatar_url: avatarUrl,
      onboarding_completed: true,
      module_finance: data.modules.finance,
      module_vacation: data.modules.vacation,
      module_entertainment: data.modules.entertainment,
      module_games: data.modules.games,
      ent_series: data.entSubTypes.series,
      ent_movies: data.entSubTypes.movies,
      ent_animes: data.entSubTypes.animes,
      ent_books: data.entSubTypes.books,
      community_finance: data.community.finance,
      community_vacation: data.community.vacation,
      community_games: data.community.games,
      community_series: data.community.series,
      community_movies: data.community.movies,
      community_animes: data.community.animes,
      community_books: data.community.books,
    } as any);

    await refetchProfile();
  };

  // Check for reset-password route
  useEffect(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path === '/reset-password' || hash.includes('type=recovery')) {
      setShowResetPassword(true);
    }
  }, []);

  if (authLoading || profileLoading) {
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

  if (!user) {
    if (showForgotPassword) {
      return <ForgotPassword onBack={() => { setShowForgotPassword(false); setAuthView('login'); }} />;
    }
    if (authView === 'login' || authView === 'signup') {
      return (
        <LoginScreen 
          onSignIn={signIn} 
          onSignUp={signUp} 
          onForgotPassword={() => setShowForgotPassword(true)}
          defaultSignUp={authView === 'signup'}
          onBack={() => setAuthView('landing')}
        />
      );
    }
    return <LandingPage onGoToLogin={() => setAuthView('login')} onGoToSignUp={() => setAuthView('signup')} />;
  }

  // Onboarding check
  if (profile && !profile.onboarding_completed) {
    return <OnboardingFlow email={user.email || ''} onComplete={handleOnboardingComplete} />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
      </div>
    );
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
        return <Home onNavigate={(s) => setCurrentSection(s)} profile={profile} />;
      case AppSection.FINANCE:
        return profile.module_finance ? <FinanceDashboard /> : <Home onNavigate={(s) => setCurrentSection(s)} profile={profile} />;
      case AppSection.VACATION:
        return profile.module_vacation ? <VacationDashboard /> : <Home onNavigate={(s) => setCurrentSection(s)} profile={profile} />;
      case AppSection.ENTERTAINMENT:
        return profile.module_entertainment ? <EntertainmentDashboard profile={profile} /> : <Home onNavigate={(s) => setCurrentSection(s)} profile={profile} />;
      case AppSection.GAMES:
        return profile.module_games ? <GamesDashboard /> : <Home onNavigate={(s) => setCurrentSection(s)} profile={profile} />;
      case 'PROFILE':
        return <ProfilePage userId={user.id} profile={profile} onUpdate={refetchProfile} />;
      default:
        return <Home onNavigate={(s) => setCurrentSection(s)} profile={profile} />;
    }
  };

  const navItems = [
    { id: AppSection.HOME, label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, visible: true },
    { id: AppSection.FINANCE, label: 'Financeiro', icon: <Wallet className="w-5 h-5" />, visible: profile.module_finance },
    { id: AppSection.VACATION, label: 'Férias', icon: <Plane className="w-5 h-5" />, visible: profile.module_vacation },
    { id: AppSection.ENTERTAINMENT, label: 'Entretenimento', icon: <Film className="w-5 h-5" />, visible: profile.module_entertainment },
    { id: AppSection.GAMES, label: 'Jogos', icon: <Gamepad2 className="w-5 h-5" />, visible: profile.module_games },
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
           <h1 className="text-2xl font-bold text-white">Live Hub</h1>
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
            <button
              onClick={() => { setCurrentSection('PROFILE'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                currentSection === 'PROFILE'
                  ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-white border border-indigo-500/30' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center border border-white/10">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-3.5 h-3.5 text-slate-500" />
                )}
              </div>
              {profile.display_name || 'Perfil'}
            </button>
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
