import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { authService } from '../services/authService';
import { Shield, User, ArrowRight, Lock, KeyRound, Loader2, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (role: UserRole) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Init no longer synchronous or strictly needed on mount for localStorage, 
    // but useful if we wanted to pre-fetch checks. Keeping simple.
    authService.init(); 
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
        const result = await authService.verify(password);
        if (result.success) {
            if (result.resetRequired) {
                setIsResetting(true);
                setLoading(false);
            } else {
                onLogin('ADMIN');
            }
        } else {
            setError('Senha incorreta.');
            setLoading(false);
        }
    } catch (err) {
        setError('Erro ao verificar credenciais.');
        setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      if (newPassword.length < 4) {
          setError('A senha deve ter pelo menos 4 caracteres.');
          return;
      }
      if (newPassword !== confirmPassword) {
          setError('As senhas não coincidem.');
          return;
      }
      
      setLoading(true);
      try {
          const success = await authService.changePassword(newPassword);
          if (success) {
              onLogin('ADMIN');
          } else {
              setError('Erro ao atualizar senha. Tente novamente.');
              setLoading(false);
          }
      } catch (err) {
          setError('Erro de conexão.');
          setLoading(false);
      }
  };

  const handleVisitorLogin = () => {
      onLogin('VISITOR');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Ambience */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-900/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-4xl z-10">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Bem-vindo ao Live Hub</h1>
                <p className="text-slate-400">Selecione como deseja acessar o sistema</p>
            </div>

            {!selectedRole ? (
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Admin Card */}
                    <button 
                        onClick={() => setSelectedRole('ADMIN')}
                        className="group relative bg-slate-900/50 border border-white/10 hover:border-indigo-500/50 rounded-2xl p-8 text-left transition-all hover:bg-slate-900/80 hover:scale-[1.02]"
                    >
                        <div className="mb-6 inline-block rounded-xl bg-indigo-500/20 p-4 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                            <Shield className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Administrador</h2>
                        <p className="text-slate-400 text-sm mb-6">Acesso total ao sistema. Requer senha de acesso.</p>
                        <div className="flex items-center text-indigo-400 font-medium text-sm group-hover:translate-x-1 transition-transform">
                            Entrar como Admin <ArrowRight className="w-4 h-4 ml-2" />
                        </div>
                    </button>

                    {/* Visitor Card */}
                    <button 
                        onClick={handleVisitorLogin}
                        className="group relative bg-slate-900/50 border border-white/10 hover:border-emerald-500/50 rounded-2xl p-8 text-left transition-all hover:bg-slate-900/80 hover:scale-[1.02]"
                    >
                        <div className="mb-6 inline-block rounded-xl bg-emerald-500/20 p-4 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                            <User className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Visitante</h2>
                        <p className="text-slate-400 text-sm mb-6">Acesso ao catálogo de Séries, Filmes, Animes, Livros e Jogos.</p>
                        <div className="flex items-center text-emerald-400 font-medium text-sm group-hover:translate-x-1 transition-transform">
                            Entrar como Visitante <ArrowRight className="w-4 h-4 ml-2" />
                        </div>
                    </button>
                </div>
            ) : (
                <div className="max-w-md mx-auto">
                    <button 
                        onClick={() => { setSelectedRole(null); setError(''); setPassword(''); setIsResetting(false); }}
                        className="text-slate-400 hover:text-white text-sm mb-6 flex items-center gap-1 transition-colors"
                    >
                        <ArrowRight className="w-4 h-4 rotate-180" /> Voltar para seleção
                    </button>

                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
                        <div className="flex justify-center mb-6">
                            <div className="p-4 bg-indigo-500/20 rounded-full text-indigo-400">
                                {isResetting ? <KeyRound className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
                            </div>
                        </div>
                        
                        <h2 className="text-2xl font-bold text-white text-center mb-2">
                            {isResetting ? 'Trocar Senha' : 'Acesso Restrito'}
                        </h2>
                        <p className="text-slate-400 text-center text-sm mb-6">
                            {isResetting 
                                ? 'Este é seu primeiro acesso. Por favor, defina uma nova senha.' 
                                : 'Digite sua senha de administrador para continuar.'}
                        </p>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        {isResetting ? (
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Nova Senha</label>
                                    <input 
                                        type="password"
                                        autoFocus
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Confirmar Senha</label>
                                    <input 
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <button 
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-900/20 mt-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Definir Senha e Entrar'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleAdminLogin} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Senha</label>
                                    <input 
                                        type="password"
                                        autoFocus
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <button 
                                    type="submit"
                                    disabled={!password || loading}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};