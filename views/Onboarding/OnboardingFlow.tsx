import React, { useState } from 'react';
import { ProfileStep } from './ProfileStep';
import { ModulesStep } from './ModulesStep';
import { ConfirmationStep } from './ConfirmationStep';
import { useToast } from '../../components/Toast';
import { ArrowRight, ArrowLeft, Check, Loader2, Sparkles } from 'lucide-react';

interface OnboardingFlowProps {
  email: string;
  onComplete: (data: OnboardingData) => Promise<void>;
}

export interface OnboardingData {
  displayName: string;
  dateOfBirth: string;
  avatarFile: File | null;
  modules: {
    finance: boolean;
    vacation: boolean;
    entertainment: boolean;
    games: boolean;
  };
  entSubTypes: {
    series: boolean;
    movies: boolean;
    animes: boolean;
    books: boolean;
  };
  community: {
    finance: boolean;
    vacation: boolean;
    games: boolean;
    series: boolean;
    movies: boolean;
    animes: boolean;
    books: boolean;
  };
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ email, onComplete }) => {
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Profile
  const [displayName, setDisplayName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Step 2: Modules
  const [finance, setFinance] = useState({ enabled: false, community: false });
  const [vacation, setVacation] = useState({ enabled: false, community: false });
  const [entertainment, setEntertainment] = useState(false);
  const [entSubTypes, setEntSubTypes] = useState({
    series: { enabled: false, community: false },
    movies: { enabled: false, community: false },
    animes: { enabled: false, community: false },
    books: { enabled: false, community: false },
  });
  const [games, setGames] = useState({ enabled: false, community: false });

  const handleAvatarSelect = (file: File) => {
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const canAdvanceStep1 = displayName.trim().length >= 2 && dateOfBirth;
  const hasAnyModule = finance.enabled || vacation.enabled || entertainment || games.enabled;
  const hasEntSubType = !entertainment || Object.values(entSubTypes).some(v => v.enabled);
  const canAdvanceStep2 = hasAnyModule && hasEntSubType;

  const handleNext = () => {
    if (step === 1) {
      if (!canAdvanceStep1) {
        showToast('Preencha nome (mín. 2 caracteres) e data de nascimento.', 'error');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!canAdvanceStep2) {
        if (!hasAnyModule) showToast('Selecione pelo menos 1 módulo.', 'error');
        else showToast('Selecione pelo menos 1 tipo de entretenimento.', 'error');
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onComplete({
        displayName: displayName.trim(),
        dateOfBirth,
        avatarFile,
        modules: {
          finance: finance.enabled,
          vacation: vacation.enabled,
          entertainment,
          games: games.enabled,
        },
        entSubTypes: {
          series: entSubTypes.series.enabled,
          movies: entSubTypes.movies.enabled,
          animes: entSubTypes.animes.enabled,
          books: entSubTypes.books.enabled,
        },
        community: {
          finance: finance.community,
          vacation: vacation.community,
          games: games.community,
          series: entSubTypes.series.community,
          movies: entSubTypes.movies.community,
          animes: entSubTypes.animes.community,
          books: entSubTypes.books.community,
        },
      });
    } catch (e: any) {
      showToast(e.message || 'Erro ao salvar perfil.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = ['Perfil', 'Módulos', 'Confirmação'];

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[400px] h-[400px] bg-purple-900/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-lg z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Configuração Inicial
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Bem-vindo ao Live Hub</h1>
          <p className="text-sm text-slate-400">Vamos personalizar seu hub em poucos passos</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((label, i) => (
            <React.Fragment key={label}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > i + 1 ? 'bg-emerald-600 text-white' : step === i + 1 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'
                }`}>
                  {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${step === i + 1 ? 'text-white' : 'text-slate-500'}`}>{label}</span>
              </div>
              {i < steps.length - 1 && <div className={`w-8 h-px ${step > i + 1 ? 'bg-emerald-600' : 'bg-slate-700'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
          {step === 1 && (
            <ProfileStep
              displayName={displayName}
              setDisplayName={setDisplayName}
              email={email}
              dateOfBirth={dateOfBirth}
              setDateOfBirth={setDateOfBirth}
              avatarPreview={avatarPreview}
              onAvatarSelect={handleAvatarSelect}
            />
          )}
          {step === 2 && (
            <ModulesStep
              finance={finance}
              setFinance={setFinance}
              vacation={vacation}
              setVacation={setVacation}
              entertainment={entertainment}
              setEntertainment={setEntertainment}
              entSubTypes={entSubTypes}
              setEntSubTypes={setEntSubTypes}
              games={games}
              setGames={setGames}
            />
          )}
          {step === 3 && (
            <ConfirmationStep
              displayName={displayName}
              email={email}
              dateOfBirth={dateOfBirth}
              avatarPreview={avatarPreview}
              modules={{ finance, vacation, entertainment, entSubTypes, games }}
            />
          )}

          <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/5">
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
            ) : <div />}

            {step < 3 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-900/30 text-sm"
              >
                Próximo <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-900/30 text-sm disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Confirmar e Entrar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
