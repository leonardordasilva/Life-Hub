import { useState, useEffect } from 'react';
import { FinanceCategory, FinanceTransaction, AnnualReserve, TransactionType } from '../types';
import { supabase } from '../services/supabaseClient';

export const useFinanceData = (onError?: (msg: string) => void) => {
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [reserves, setReserves] = useState<AnnualReserve[]>([]);
  const [loading, setLoading] = useState(true);

  const reportError = (msg: string) => { if (onError) onError(msg); };

  const fetchData = async () => {
    setLoading(true);

    try {
      const [catsResult, transResult, resResult] = await Promise.all([
        supabase.from('finance_categories').select('*'),
        supabase.from('finance_transactions').select('*'),
        supabase.from('finance_reserves').select('*'),
      ]);

      if (catsResult.error) throw catsResult.error;
      if (transResult.error) throw transResult.error;
      if (resResult.error) throw resResult.error;

      const catsData = catsResult.data;
      const transData = transResult.data;
      const resData = resResult.data;

      if (catsData) setCategories(catsData);
      
      if (transData) {
        setTransactions(transData.map((t: any) => ({
          id: t.id,
          categoryId: t.category_id,
          amount: t.amount,
          month: t.month,
          year: t.year,
          description: t.description
        })));
      }

      if (resData) {
        setReserves(resData.map((r: any) => ({
          year: r.year,
          initialAmount: r.initial_amount
        })));
      }

    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addCategory = async (name: string, type: TransactionType) => {
    const tempId = crypto.randomUUID();
    const newCat = { id: tempId, name, type };
    setCategories(prev => [...prev, newCat]);
    const { data, error } = await supabase.from('finance_categories').insert({ name, type }).select().single();
    if (error) {
      setCategories(prev => prev.filter(c => c.id !== tempId));
      reportError('Erro ao adicionar categoria');
    } else if (data) {
      setCategories(prev => prev.map(c => c.id === tempId ? data : c));
    }
  };

  const editCategory = async (id: string, name: string, type: TransactionType) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name, type } : c));
    await supabase.from('finance_categories').update({ name, type }).eq('id', id);
  };

  const removeCategory = async (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    await supabase.from('finance_categories').delete().eq('id', id);
  };

  const addTransaction = async (transaction: Omit<FinanceTransaction, 'id'>) => {
    const tempId = crypto.randomUUID();
    setTransactions(prev => [...prev, { ...transaction, id: tempId }]);
    const { data, error } = await supabase.from('finance_transactions').insert({
        category_id: transaction.categoryId,
        amount: transaction.amount,
        month: transaction.month,
        year: transaction.year,
        description: transaction.description
      }).select().single();
    if (error) {
      setTransactions(prev => prev.filter(t => t.id !== tempId));
      reportError('Erro ao adicionar transação');
    } else if (data) {
      setTransactions(prev => prev.map(t => t.id === tempId ? {
        id: data.id,
        categoryId: data.category_id,
        amount: data.amount,
        month: data.month,
        year: data.year,
        description: data.description
      } : t));
    }
  };

  const editTransaction = async (transaction: FinanceTransaction) => {
    setTransactions(prev => prev.map(t => t.id === transaction.id ? transaction : t));
    await supabase.from('finance_transactions').update({
        category_id: transaction.categoryId,
        amount: transaction.amount,
        month: transaction.month,
        year: transaction.year,
        description: transaction.description
      }).eq('id', transaction.id);
  };

  const removeTransaction = async (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    await supabase.from('finance_transactions').delete().eq('id', id);
  };

  const updateReserve = async (year: number, initialAmount: number) => {
    const existingIndex = reserves.findIndex(r => r.year === year);
    let newReserves = [...reserves];
    if (existingIndex >= 0) {
      newReserves[existingIndex].initialAmount = initialAmount;
    } else {
      newReserves.push({ year, initialAmount });
    }
    setReserves(newReserves);
    await supabase.from('finance_reserves').upsert({ year, initial_amount: initialAmount }, { onConflict: 'year' });
  };

  const getReserveForYear = (year: number) => reserves.find(r => r.year === year)?.initialAmount || 0;

  return { categories, transactions, loading, addCategory, editCategory, removeCategory, addTransaction, editTransaction, removeTransaction, updateReserve, getReserveForYear };
};
