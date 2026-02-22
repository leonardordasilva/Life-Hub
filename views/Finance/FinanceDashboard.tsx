import React, { useState, useMemo, useCallback } from 'react';
import { useFinanceData } from '../../hooks/useFinanceData';
import { useToast } from '../../components/Toast';
import { CategoryManager } from './CategoryManager';
import { TransactionManager } from './TransactionManager';
import { AnnualReport } from './AnnualReport';
import { ReserveManager } from './ReserveManager';
import { LayoutDashboard, Tag, FileText, Wallet, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

interface FinanceDashboardProps {}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = () => {
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
  } = useFinanceData(handleError);

  const [activeTab, setActiveTab] = useState<'categories' | 'transactions' | 'report'>('categories');
  const [year, setYear] = useState(new Date().getFullYear());

  // Compute years that have transactions
  const yearsWithData = useMemo(() => {
    return new Set(transactions.map(t => t.year));
  }, [transactions]);

  // Visible years: range centered on selected + all years with data
  const visibleYears = useMemo(() => {
    const range = new Set<number>();
    for (let i = year - 2; i <= year + 2; i++) range.add(i);
    yearsWithData.forEach(y => range.add(y));
    return Array.from(range).sort((a, b) => a - b);
  }, [year, yearsWithData]);

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

  // All users can manage their own data (RLS handles isolation)

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
          
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-1.5 rounded-xl">
            <button
              onClick={() => setYear(prev => prev - 1)}
              className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-1 overflow-x-auto custom-scrollbar px-1">
              {visibleYears.map(y => {
                const hasData = yearsWithData.has(y);
                const isSelected = y === year;
                return (
                  <button
                    key={y}
                    onClick={() => setYear(y)}
                    className={`relative px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                      isSelected
                        ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/30'
                        : hasData
                          ? 'bg-amber-800/40 text-amber-200 border border-amber-500/40 hover:bg-amber-700/50'
                          : 'text-slate-500 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setYear(prev => prev + 1)}
              className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Global Stats / Reserve Config */}
        <div className="relative">
            {false && (
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
          {activeTab === 'categories' && (
            <CategoryManager 
              categories={categories} 
              onAdd={addCategory} 
              onEdit={editCategory}
              onRemove={removeCategory} 
            />
          )}
          
          {activeTab === 'transactions' && (
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