import React, { useState } from 'react';
import { FinanceCategory, FinanceTransaction } from '../../types';
import { Plus, Trash2, Calendar, Pencil, X, Check, Loader2 } from 'lucide-react';

interface TransactionManagerProps {
  categories: FinanceCategory[];
  transactions: FinanceTransaction[];
  year: number;
  onAdd: (t: Omit<FinanceTransaction, 'id'>) => Promise<void>;
  onEdit: (t: FinanceTransaction) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const TransactionManager: React.FC<TransactionManagerProps> = ({ 
  categories, 
  transactions, 
  year, 
  onAdd, 
  onEdit,
  onRemove 
}) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  
  // Form State
  const [selectedCatId, setSelectedCatId] = useState('');
  const [amount, setAmount] = useState('');
  
  // Edit Mode State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Filter categories for easy selection
  const incomeCategories = categories.filter(c => c.type === 'INCOME');
  const expenseCategories = categories.filter(c => c.type === 'EXPENSE');

  // Filter transactions for display (current month/year)
  const currentTransactions = transactions.filter(t => t.month === selectedMonth && t.year === year);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const startEdit = (t: FinanceTransaction) => {
    setEditingId(t.id);
    setSelectedCatId(t.categoryId);
    setAmount(t.amount.toString());
  };

  const cancelEdit = () => {
    setEditingId(null);
    setAmount('');
    setSelectedCatId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCatId && amount) {
      setSubmitting(true);
      try {
        if (editingId) {
          await onEdit({
            id: editingId,
            categoryId: selectedCatId,
            amount: parseFloat(amount),
            month: selectedMonth,
            year: year
          });
          setEditingId(null);
        } else {
          await onAdd({
            categoryId: selectedCatId,
            amount: parseFloat(amount),
            month: selectedMonth,
            year: year
          });
        }
        setAmount('');
        // If we were adding, maybe keep catId? For now clear all
        if (!editingId) setSelectedCatId(''); 
      } finally {
        setSubmitting(false);
      }
    }
  };

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Desconhecido';
  const getCategoryType = (id: string) => categories.find(c => c.id === id)?.type;

  return (
    <div className="space-y-8">
      {/* Month Selector */}
      <div className="flex overflow-x-auto pb-4 gap-2 custom-scrollbar border-b border-white/10">
        {MONTHS.map((m, idx) => (
          <button
            key={m}
            disabled={submitting}
            onClick={() => {
              setSelectedMonth(idx);
              cancelEdit(); // Cancel edit when changing months
            }}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all disabled:opacity-50 ${
              selectedMonth === idx 
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-900/20' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Entry Form */}
        <div className={`lg:col-span-1 border border-white/10 rounded-xl p-6 h-fit transition-colors ${editingId ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-white/5'}`}>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            {editingId ? <Pencil className="w-4 h-4 text-indigo-400" /> : <Plus className="w-4 h-4" />} 
            {editingId ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Item (Receita/Despesa)</label>
              <select
                value={selectedCatId}
                onChange={(e) => setSelectedCatId(e.target.value)}
                disabled={submitting}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
              >
                <option value="">Selecione um item...</option>
                {incomeCategories.length > 0 && (
                  <optgroup label="Receitas">
                    {incomeCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </optgroup>
                )}
                {expenseCategories.length > 0 && (
                  <optgroup label="Despesas">
                    {expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </optgroup>
                )}
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-slate-400 mb-1">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                disabled={submitting}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0.00"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!selectedCatId || !amount || submitting}
                className={`flex-1 flex justify-center items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium mt-4 ${
                  editingId 
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                    : 'bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                } ${submitting ? 'cursor-wait opacity-70' : ''}`}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
                {submitting ? 'Salvando...' : (editingId ? 'Salvar' : 'Lançar')}
              </button>
              
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={submitting}
                  className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Transactions List */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-xl p-6">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Movimentações de {MONTHS[selectedMonth]} / {year}
              </h3>
              <div className="text-sm text-slate-400">
                {currentTransactions.length} lançamentos
              </div>
           </div>

           <div className="space-y-8">
             {/* Receitas */}
             <div>
                <h4 className="text-sm font-medium text-emerald-400 mb-3 border-b border-emerald-500/20 pb-1">Receitas</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-white/10">
                        <th className="pb-2 pl-2 w-1/2">Item</th>
                        <th className="pb-2 text-right w-1/4">Valor</th>
                        <th className="pb-2 text-center w-1/4">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                        {currentTransactions.filter(t => getCategoryType(t.categoryId) === 'INCOME').length === 0 && (
                          <tr>
                            <td colSpan={3} className="py-4 text-center text-slate-500 italic text-xs">
                              Nenhuma receita neste mês.
                            </td>
                          </tr>
                        )}
                        {currentTransactions
                          .filter(t => getCategoryType(t.categoryId) === 'INCOME')
                          .map(t => {
                            const isEditingThis = editingId === t.id;
                            return (
                              <tr key={t.id} className={`border-b border-white/5 transition-colors ${isEditingThis ? 'bg-indigo-500/10' : 'hover:bg-white/5'}`}>
                                <td className="py-2 pl-2 text-slate-200 font-medium">{getCategoryName(t.categoryId)}</td>
                                <td className="py-2 text-right font-medium text-emerald-400">
                                  + {formatCurrency(t.amount)}
                                </td>
                                <td className="py-2 text-center">
                                  <div className="flex justify-center gap-2">
                                    <button
                                      onClick={() => startEdit(t)}
                                      disabled={submitting}
                                      className="text-slate-500 hover:text-indigo-400 transition-colors p-1 disabled:opacity-50"
                                      title="Editar"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                    <button 
                                      onClick={() => onRemove(t.id)}
                                      disabled={submitting}
                                      className="text-slate-500 hover:text-rose-400 transition-colors p-1 disabled:opacity-50"
                                      title="Remover"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                    </tbody>
                  </table>
                </div>
             </div>

             {/* Despesas */}
             <div>
                <h4 className="text-sm font-medium text-rose-400 mb-3 border-b border-rose-500/20 pb-1">Despesas</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-white/10">
                        <th className="pb-2 pl-2 w-1/2">Item</th>
                        <th className="pb-2 text-right w-1/4">Valor</th>
                        <th className="pb-2 text-center w-1/4">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                        {currentTransactions.filter(t => getCategoryType(t.categoryId) === 'EXPENSE').length === 0 && (
                          <tr>
                            <td colSpan={3} className="py-4 text-center text-slate-500 italic text-xs">
                              Nenhuma despesa neste mês.
                            </td>
                          </tr>
                        )}
                        {currentTransactions
                          .filter(t => getCategoryType(t.categoryId) === 'EXPENSE')
                          .map(t => {
                            const isEditingThis = editingId === t.id;
                            return (
                              <tr key={t.id} className={`border-b border-white/5 transition-colors ${isEditingThis ? 'bg-indigo-500/10' : 'hover:bg-white/5'}`}>
                                <td className="py-2 pl-2 text-slate-200 font-medium">{getCategoryName(t.categoryId)}</td>
                                <td className="py-2 text-right font-medium text-rose-400">
                                  - {formatCurrency(t.amount)}
                                </td>
                                <td className="py-2 text-center">
                                  <div className="flex justify-center gap-2">
                                    <button
                                      onClick={() => startEdit(t)}
                                      disabled={submitting}
                                      className="text-slate-500 hover:text-indigo-400 transition-colors p-1 disabled:opacity-50"
                                      title="Editar"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                    <button 
                                      onClick={() => onRemove(t.id)}
                                      disabled={submitting}
                                      className="text-slate-500 hover:text-rose-400 transition-colors p-1 disabled:opacity-50"
                                      title="Remover"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                    </tbody>
                  </table>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};