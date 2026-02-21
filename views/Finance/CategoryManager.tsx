import React, { useState } from 'react';
import { FinanceCategory, TransactionType } from '../../types';
import { Plus, Trash2, Tag, Pencil, Check, X, Loader2 } from 'lucide-react';

interface CategoryManagerProps {
  categories: FinanceCategory[];
  onAdd: (name: string, type: TransactionType) => Promise<void>;
  onEdit: (id: string, name: string, type: TransactionType) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, onAdd, onEdit, onRemove }) => {
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<TransactionType>('EXPENSE');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      setSubmitting(true);
      try {
        if (editingId) {
          await onEdit(editingId, newName, newType);
          setEditingId(null);
        } else {
          await onAdd(newName, newType);
        }
        setNewName('');
        setNewType('EXPENSE'); // Reset default
      } finally {
        setSubmitting(false);
      }
    }
  };

  const startEdit = (cat: FinanceCategory) => {
    setEditingId(cat.id);
    setNewName(cat.name);
    setNewType(cat.type);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewName('');
    setNewType('EXPENSE');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Form */}
      <div className={`border border-white/10 rounded-xl p-6 h-fit transition-colors ${editingId ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-white/5'}`}>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          {editingId ? <Pencil className="w-4 h-4 text-indigo-400" /> : <Tag className="w-4 h-4" />}
          {editingId ? 'Editar Categoria' : 'Nova Categoria'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-amber-400/80 uppercase tracking-wider mb-2">Nome do Item</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={submitting}
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50 transition-all duration-200 backdrop-blur-sm hover:border-white/20"
              placeholder="Ex: Aluguel, Salário, Dividendos..."
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-amber-400/80 uppercase tracking-wider mb-2">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setNewType('INCOME')}
                className={`py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 ${
                  newType === 'INCOME' 
                    ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/50 shadow-lg shadow-emerald-900/20' 
                    : 'bg-slate-900/80 text-slate-400 border border-white/10 hover:border-white/20 hover:text-slate-300'
                }`}
              >
                Receita
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setNewType('EXPENSE')}
                className={`py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 ${
                  newType === 'EXPENSE' 
                    ? 'bg-rose-500/20 text-rose-400 border-2 border-rose-500/50 shadow-lg shadow-rose-900/20' 
                    : 'bg-slate-900/80 text-slate-400 border border-white/10 hover:border-white/20 hover:text-slate-300'
                }`}
              >
                Despesa
              </button>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              disabled={submitting}
              className={`btn btn-md flex-1 ${editingId ? 'btn-amber' : 'btn-success'}`}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
              {submitting ? 'Salvando...' : (editingId ? 'Salvar Alteração' : 'Adicionar Item')}
            </button>

            {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={submitting}
                  className="btn btn-md btn-ghost"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
          </div>
        </form>
      </div>

      {/* List */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Itens Cadastrados</h3>
        
        <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {/* Receitas */}
          <div>
            <h4 className="text-sm font-medium text-emerald-400 mb-3 border-b border-emerald-500/20 pb-1">Receitas</h4>
            <div className="space-y-2">
              {categories.filter(c => c.type === 'INCOME').length === 0 && (
                <p className="text-slate-500 text-xs italic">Nenhuma receita cadastrada.</p>
              )}
              {categories.filter(c => c.type === 'INCOME').map((cat) => (
                <div key={cat.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${editingId === cat.id ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-slate-200">{cat.name}</span>
                  </div>
                  <div className="flex gap-1">
                     <button
                        onClick={() => startEdit(cat)}
                        disabled={submitting}
                        className="btn-icon btn-icon-edit"
                        title="Editar"
                     >
                        <Pencil className="w-4 h-4" />
                     </button>
                     <button
                        onClick={() => onRemove(cat.id)}
                        disabled={submitting}
                        className="btn-icon btn-icon-delete"
                        title="Remover"
                     >
                        <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Despesas */}
          <div>
            <h4 className="text-sm font-medium text-rose-400 mb-3 border-b border-rose-500/20 pb-1">Despesas</h4>
            <div className="space-y-2">
              {categories.filter(c => c.type === 'EXPENSE').length === 0 && (
                <p className="text-slate-500 text-xs italic">Nenhuma despesa cadastrada.</p>
              )}
              {categories.filter(c => c.type === 'EXPENSE').map((cat) => (
                <div key={cat.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${editingId === cat.id ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-rose-400" />
                    <span className="text-slate-200">{cat.name}</span>
                  </div>
                  <div className="flex gap-1">
                     <button
                        onClick={() => startEdit(cat)}
                        disabled={submitting}
                        className="btn-icon btn-icon-edit"
                        title="Editar"
                     >
                        <Pencil className="w-4 h-4" />
                     </button>
                     <button
                        onClick={() => onRemove(cat.id)}
                        disabled={submitting}
                        className="btn-icon btn-icon-delete"
                        title="Remover"
                     >
                        <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};