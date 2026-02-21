import React, { useState } from 'react';
import { ArrowLeft, Loader2, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface ForgotPasswordProps {
  onBack: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Informe seu email.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar email de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-900/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Live Hub</h1>
          <p className="text-slate-400">Recuperar senha</p>
        </div>

        <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-indigo-500/20 rounded-full text-indigo-400">
              <Mail className="w-8 h-8" />
            </div>
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="w-12 h-12 text-emerald-400" />
              </div>
              <p className="text-white font-medium">Email enviado!</p>
              <p className="text-slate-400 text-sm">
                Verifique sua caixa de entrada e clique no link para redefinir sua senha.
              </p>
              <button
                onClick={onBack}
                className="mt-4 text-sm text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar ao login
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <p className="text-slate-400 text-sm mb-4 text-center">
                Informe seu email e enviaremos um link para redefinir sua senha.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="seu@email.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar link'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={onBack}
                  className="text-sm text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1 mx-auto"
                >
                  <ArrowLeft className="w-4 h-4" /> Voltar ao login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
