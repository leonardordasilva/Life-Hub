import React, { useState, useEffect } from 'react';
import { Save, DollarSign, Pencil, X, TrendingUp, Loader2 } from 'lucide-react';

interface ReserveManagerProps {
  year: number;
  initialAmount: number;
  currentBalance: number; // New prop for the calculated total
  onSave: (year: number, amount: number) => Promise<void>;
}

export const ReserveManager: React.FC<ReserveManagerProps> = ({ year, initialAmount, currentBalance, onSave }) => {
  const [amount, setAmount] = useState(initialAmount.toString());
  const [isEditing, setIsEditing] = useState(initialAmount === 0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setAmount(initialAmount.toString());
    // Regra: Se o valor for 0, mostra o input (modo edição). Se for diferente de 0, mostra o valor salvo (modo visualização).
    setIsEditing(initialAmount === 0);
  }, [initialAmount, year]);

  const handleSave = async () => {
    const val = parseFloat(amount) || 0;
    setSubmitting(true);
    try {
        await onSave(year, val);
        // Se o valor salvo for diferente de zero, fechamos a edição.
        // Se for zero, o useEffect vai reabrir a edição (conforme a regra), o que é o comportamento esperado.
        if (val !== 0) {
          setIsEditing(false);
        }
    } finally {
        setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setAmount(initialAmount.toString());
    // Se cancelou e o valor original era 0, o useEffect manterá true.
    // Se era diferente de 0, voltamos para false.
    setIsEditing(initialAmount === 0);
  };

  const formattedInitial = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(initialAmount);

  const formattedCurrent = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(currentBalance);

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 transition-all duration-300 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-end">
        
        {/* Left Side: Display Current Projected Balance */}
        <div>
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <TrendingUp className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Saldo Projetado ({year})</h3>
          </div>
          
          <div className="flex items-baseline gap-3">
            <span className={`text-4xl font-bold ${currentBalance >= 0 ? 'text-white' : 'text-rose-400'}`}>
              {formattedCurrent}
            </span>
            <span className="text-xs text-slate-400 font-medium bg-slate-800 px-2 py-1 rounded">
              (Inicial + Aportes)
            </span>
          </div>
        </div>

        {/* Right Side: Edit Initial Balance */}
        <div className="w-full md:w-auto bg-slate-800/50 p-4 rounded-xl border border-white/5">
          {isEditing ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <label className="block text-xs text-slate-400 mb-1 font-medium">Editar Saldo Inicial (Ano Anterior)</label>
                <div className="flex gap-2">
                    <input
                        type="number"
                        value={amount}
                        disabled={submitting}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-32 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0.00"
                        autoFocus
                    />
                    <button
                        onClick={handleSave}
                        disabled={submitting}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Salvar"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </button>
                    {/* Botão Cancelar útil se o usuário clicou no lápis manualmente */}
                    <button
                        onClick={handleCancel}
                        disabled={submitting}
                        className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        title="Cancelar"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
               <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Saldo Inicial Definido</p>
                  <p className="text-lg font-medium text-slate-300">{formattedInitial}</p>
               </div>
                <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-white/5 rounded-lg transition-colors"
                    title="Editar Saldo Inicial"
                >
                    <Pencil className="w-4 h-4" />
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
