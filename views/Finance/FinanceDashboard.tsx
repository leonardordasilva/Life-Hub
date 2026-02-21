import React, { useState, useMemo, useCallback } from 'react';
import { useFinanceData } from '../../hooks/useFinanceData';
import { useToast } from '../../components/Toast';
import { CategoryManager } from './CategoryManager';
import { TransactionManager } from './TransactionManager';
import { AnnualReport } from './AnnualReport';
import { ReserveManager } from './ReserveManager';
import { LayoutDashboard, Tag, FileText, Wallet, AlertTriangle } from 'lucide-react';
import { UserRole } from '../../types';

interface FinanceDashboardProps {
    role: UserRole;
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ role }) => {
  const { showToast } = useToast();
  const handleError = useCallback((msg: string) => showToast(msg, 'error'), [showToast]);
  const { 
    categories, 
    transactions, 
    addCategory, 
    editCategory,
    removeCategory, 
    addTransaction, 
    editTransaction,
    removeTransaction,
    updateReserve,
    getReserveForYear
  } = useFinanceData(role, handleError);

  const [activeTab, setActiveTab] = useState<'categories' | 'transactions' | 'report'>(role === 'ADMIN' ? 'categories' : 'report');
  const [year, setYear] = useState(2026);

  const initialReserve = getReserveForYear(year);

  const projectedBalance = useMemo(() => {
    let contribution = 0;
    const incomeCats = categories.filter(c => c.type === 'INCOME');
    const expenseCats = categories.filter(c => c.type === 'EXPENSE');

    for (let m = 0; m < 12; m++) {
      const monthIncome = transactions
        .filter(t => t.month === m && t.year === year && incomeCats.some(c => c.id === t.categoryId))
        .reduce((sum, t) => sum + t.amount, 0);

      const monthExpense = transactions
        .filter(t => t.month === m && t.year === year && expenseCats.some(c => c.id === t.categoryId))
        .reduce((sum, t) => sum + t.amount, 0);

      const balance = monthIncome - monthExpense;
      contribution += (balance > 0 ? balance / 2 : balance);
    }
    
    return initialReserve + contribution;
  }, [categories, transactions, year, initialReserve]);

  const isAdmin = role === 'ADMIN';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-12 pb-24">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <Wallet className="w-8 h-8 text-emerald-400" />
              Gestão Financeira
            </h2>
            <div className="flex items-center gap-2 mt-1">
                <p className="text-slate-400">Controle de receitas, despesas e fundo de reserva.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-white/5 p-2 rounded-xl border border-white/10">
            <span className="text-sm font-medium text-slate-400 ml-2">Ano Base:</span>
            <select 
              value={year} 
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2"
            >
              {Array.from({length: 5}, (_, i) => 2026 + i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </header>

        {/* Global Stats / Reserve Config */}
        <div className="relative">
            {!isAdmin && (
                <div className="absolute inset-0 z-10 bg-black/10 backdrop-blur-[1px] flex items-center justify-center rounded-xl border border-white/5">
                    <div className="bg-slate-900/90 p-3 rounded-lg border border-white/10 flex items-center gap-2 text-slate-400 text-sm shadow-xl">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        Edição de reserva bloqueada
                    </div>
                </div>
            )}
            <ReserveManager 
                year={year} 
                initialAmount={initialReserve} 
                currentBalance={projectedBalance}
                onSave={updateReserve}
            />
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1.5 mb-8 bg-slate-800/60 p-1.5 rounded-2xl border border-white/5 backdrop-blur-sm w-fit">
          {isAdmin && (
              <>
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
                    activeTab === 'categories' 
                        ? 'bg-amber-500/20 text-amber-300 shadow-lg shadow-amber-900/10 border border-amber-500/30' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                >
                    <Tag className="w-4 h-4" /> Itens
                </button>
                <button
                    onClick={() => setActiveTab('transactions')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
                    activeTab === 'transactions' 
                        ? 'bg-amber-500/20 text-amber-300 shadow-lg shadow-amber-900/10 border border-amber-500/30' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                >
                    <LayoutDashboard className="w-4 h-4" /> Lançamentos
                </button>
              </>
          )}
          
          <button
            onClick={() => setActiveTab('report')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
              activeTab === 'report' 
                ? 'bg-amber-500/20 text-amber-300 shadow-lg shadow-amber-900/10 border border-amber-500/30' 
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <FileText className="w-4 h-4" /> Relatório Anual
          </button>
        </div>

        {/* Content Area */}
        <div className="min-h-[500px]">
          {activeTab === 'categories' && isAdmin && (
            <CategoryManager 
              categories={categories} 
              onAdd={addCategory} 
              onEdit={editCategory}
              onRemove={removeCategory} 
            />
          )}
          
          {activeTab === 'transactions' && isAdmin && (
            <TransactionManager 
              categories={categories}
              transactions={transactions}
              year={year}
              onAdd={addTransaction}
              onEdit={editTransaction}
              onRemove={removeTransaction}
            />
          )}

          {activeTab === 'report' && (
            <AnnualReport 
              categories={categories}
              transactions={transactions}
              year={year}
              initialReserve={initialReserve}
            />
          )}
        </div>
      </div>
    </div>
  );
};