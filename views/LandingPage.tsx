import React from 'react';
import { Wallet, Plane, Film, Gamepad2, ArrowRight, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onGoToLogin: () => void;
  onGoToSignUp: () => void;
}

const features = [
  { icon: <Wallet className="w-7 h-7" />, title: 'Financeiro', desc: 'Controle completo de receitas, despesas e reservas anuais.' },
  { icon: <Plane className="w-7 h-7" />, title: 'Férias', desc: 'Organize viagens com voos, hotéis e passeios em um só lugar.' },
  { icon: <Film className="w-7 h-7" />, title: 'Entretenimento', desc: 'Acompanhe séries, filmes, animes e livros que você consome.' },
  { icon: <Gamepad2 className="w-7 h-7" />, title: 'Jogos', desc: 'Gerencie sua biblioteca de jogos e acompanhe seu progresso.' },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onGoToLogin, onGoToSignUp }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-auto">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] bg-emerald-900/15 rounded-full blur-[100px] pointer-events-none" />

        <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            Live Hub
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={onGoToLogin}
              className="px-5 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Entrar
            </button>
            <button
              onClick={onGoToSignUp}
              className="px-5 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-lg shadow-indigo-900/30"
            >
              Criar Conta
            </button>
          </div>
        </header>

        <section className="relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-24 md:pt-24 md:pb-32">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-medium mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            Seu hub pessoal de organização
          </div>
          <h2 className="text-4xl md:text-6xl font-bold leading-tight max-w-3xl">
            Tudo o que importa,{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">
              em um só lugar
            </span>
          </h2>
          <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-xl leading-relaxed">
            Finanças, viagens, entretenimento e jogos — organize sua vida com simplicidade e estilo.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-10">
            <button
              onClick={onGoToSignUp}
              className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/30 text-base"
            >
              Começar Agora <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onGoToLogin}
              className="px-8 py-3.5 text-slate-400 hover:text-white font-medium transition-colors text-base"
            >
              Já tenho uma conta
            </button>
          </div>
        </section>
      </div>

      {/* Features */}
      <section className="relative px-6 md:px-12 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((f) => (
            <div
              key={f.title}
              className="group p-6 bg-slate-900/80 border border-white/5 rounded-2xl hover:border-indigo-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)]"
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 mb-4 group-hover:bg-indigo-500/20 transition-colors">
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} Live Hub. Todos os direitos reservados.
      </footer>
    </div>
  );
};
