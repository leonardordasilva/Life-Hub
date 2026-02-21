import React, { useState, useMemo } from 'react';
import { FinanceCategory, FinanceTransaction } from '../../types';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';

interface AnnualReportProps {
  categories: FinanceCategory[];
  transactions: FinanceTransaction[];
  year: number;
  initialReserve: number;
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const AnnualReport: React.FC<AnnualReportProps> = ({ categories, transactions, year, initialReserve }) => {
  
  // --- Data Processing ---
  const { monthlyData, annualTotals } = useMemo(() => {
    const incomeCats = categories.filter(c => c.type === 'INCOME');
    const expenseCats = categories.filter(c => c.type === 'EXPENSE');

    const mData = MONTHS.map((monthName, mIdx) => {
      // Calculate totals for this month
      const income = transactions
        .filter(t => t.month === mIdx && t.year === year && incomeCats.some(c => c.id === t.categoryId))
        .reduce((sum, t) => sum + t.amount, 0);

      const expense = transactions
        .filter(t => t.month === mIdx && t.year === year && expenseCats.some(c => c.id === t.categoryId))
        .reduce((sum, t) => sum + t.amount, 0);

      const balance = income - expense;
      // Reserve Logic: 50% of positive balance, or absorb 100% of negative balance
      const reserve = balance > 0 ? balance / 2 : balance;

      return { monthName, income, expense, balance, reserve };
    });

    const totals = mData.reduce((acc, curr) => ({
      income: acc.income + curr.income,
      expense: acc.expense + curr.expense,
      balance: acc.balance + curr.balance,
      reserve: acc.reserve + curr.reserve
    }), { income: 0, expense: 0, balance: 0, reserve: 0 });

    return { monthlyData: mData, annualTotals: totals };
  }, [categories, transactions, year]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatCompact = (val: number) => 
    new Intl.NumberFormat('pt-BR', { notation: "compact", compactDisplay: "short", maximumFractionDigits: 1 }).format(val);

  // --- Components ---

  const KPICard = ({ title, value, icon, colorClass, subText }: any) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between relative overflow-hidden group hover:border-white/20 transition-all">
      <div className={`absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-white tracking-tight">{formatCurrency(value)}</h3>
        <p className={`text-xs mt-1 ${value >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {subText}
        </p>
      </div>
      <div className={`p-3 rounded-xl bg-white/5 ${colorClass} bg-opacity-10 text-white`}>
        {React.cloneElement(icon, { className: "w-6 h-6" })}
      </div>
    </div>
  );

  const FinancialChart = () => {
    // Find max value for scaling
    const maxVal = Math.max(...monthlyData.map(d => Math.max(d.income, d.expense)));
    
    return (
      <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            Fluxo Anual
          </h3>
          <div className="flex gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Receitas
            </div>
            <div className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span> Despesas
            </div>
          </div>
        </div>
        
        {/* Chart Container */}
        <div className="h-64 flex items-end gap-2 md:gap-4">
          {monthlyData.map((d, idx) => {
            const incomeHeight = maxVal > 0 ? (d.income / maxVal) * 100 : 0;
            const expenseHeight = maxVal > 0 ? (d.expense / maxVal) * 100 : 0;
            
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 bg-slate-900 border border-slate-700 text-xs p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
                  <div className="font-bold text-slate-200 mb-1">{d.monthName}</div>
                  <div className="text-emerald-400">Rec: {formatCompact(d.income)}</div>
                  <div className="text-rose-400">Des: {formatCompact(d.expense)}</div>
                  <div className="text-indigo-400 border-t border-slate-700 mt-1 pt-1">Sal: {formatCompact(d.balance)}</div>
                  <div className={`${d.reserve >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                    Apo: {formatCompact(d.reserve)}
                  </div>
                </div>

                {/* Bars */}
                <div className="w-full flex gap-0.5 md:gap-1 items-end h-full">
                  <div 
                    style={{ height: `${Math.max(incomeHeight, 1)}%` }} 
                    className="flex-1 bg-emerald-500 rounded-t-sm opacity-80 group-hover:opacity-100 transition-all"
                  />
                  <div 
                    style={{ height: `${Math.max(expenseHeight, 1)}%` }} 
                    className="flex-1 bg-rose-500 rounded-t-sm opacity-80 group-hover:opacity-100 transition-all"
                  />
                </div>
                {/* Label */}
                <span className="text-[10px] uppercase text-slate-500 font-medium">{d.monthName}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const BreakdownTable = ({ title, type }: { title: string, type: 'INCOME' | 'EXPENSE' }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    // Filter categories
    const filteredCats = categories.filter(c => c.type === type);
    
    // Calculate row totals
    const rows = filteredCats.map(cat => {
      const amounts = MONTHS.map((_, mIdx) => 
        transactions
          .filter(t => t.categoryId === cat.id && t.month === mIdx && t.year === year)
          .reduce((sum, t) => sum + t.amount, 0)
      );
      const total = amounts.reduce((a, b) => a + b, 0);
      return { cat, amounts, total };
    }).sort((a, b) => b.total - a.total); // Sort by total amount desc

    const colorClass = type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400';
    const totalAmount = type === 'INCOME' ? annualTotals.income : annualTotals.expense;

    return (
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden mb-6">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-6 py-4 flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-lg bg-slate-900 ${colorClass}`}>
                {type === 'INCOME' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
             </div>
             <div className="text-left">
               <h3 className="font-semibold text-white">{title}</h3>
               <p className="text-xs text-slate-400">{filteredCats.length} categorias</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <span className={`text-lg font-bold ${colorClass}`}>{formatCurrency(totalAmount)}</span>
             {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </div>
        </button>

        {isOpen && (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-slate-900/50 text-slate-400 border-b border-white/5">
                  <th className="px-4 py-3 sticky left-0 bg-slate-900/90 backdrop-blur-sm z-10">Categoria</th>
                  {MONTHS.map(m => <th key={m} className="px-2 py-3 text-right font-medium text-xs">{m}</th>)}
                  <th className="px-4 py-3 text-right font-bold text-white">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.cat.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="px-4 py-2 font-medium text-slate-300 sticky left-0 bg-slate-900/50 group-hover:bg-slate-800/80 backdrop-blur-sm border-r border-white/5 z-10">
                        {row.cat.name}
                    </td>
                    {row.amounts.map((amount, idx) => (
                      <td key={idx} className="px-2 py-2 text-right text-slate-400 text-xs">
                        {amount > 0 ? (
                           <span className={type === 'INCOME' ? 'text-emerald-500/80' : 'text-rose-500/80'}>
                             {formatCompact(amount)}
                           </span>
                        ) : '-'}
                      </td>
                    ))}
                    <td className={`px-4 py-2 text-right font-bold bg-white/5 ${colorClass}`}>
                      {formatCurrency(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Receita Total" 
          value={annualTotals.income} 
          icon={<TrendingUp />} 
          colorClass="text-emerald-400"
          subText="Acumulado do ano"
        />
        <KPICard 
          title="Despesa Total" 
          value={annualTotals.expense} 
          icon={<TrendingDown />} 
          colorClass="text-rose-400"
          subText="Acumulado do ano"
        />
        <KPICard 
          title="Saldo Líquido" 
          value={annualTotals.balance} 
          icon={<Wallet />} 
          colorClass={annualTotals.balance >= 0 ? "text-indigo-400" : "text-orange-400"}
          subText={annualTotals.balance >= 0 ? "Superávit" : "Déficit"}
        />
        <KPICard 
          title="Aporte Reserva" 
          value={annualTotals.reserve} 
          icon={<PiggyBank />} 
          colorClass="text-blue-400"
          subText="Previsto para reserva"
        />
      </div>

      {/* Main Chart */}
      <FinancialChart />

      {/* Consolidated Data Tables */}
      <div>
         <BreakdownTable title="Detalhamento de Receitas" type="INCOME" />
         <BreakdownTable title="Detalhamento de Despesas" type="EXPENSE" />
      </div>

    </div>
  );
};