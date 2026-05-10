import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2, Save } from 'lucide-react';
import { db } from '../lib/db';
import { Currency, TransactionType } from '../types';
import { cn } from '../lib/utils';

interface TransactionFormProps {
  onClose: () => void;
  initialData?: any;
}

import { useLiveQuery } from 'dexie-react-hooks';

export default function TransactionForm({ onClose, initialData }: TransactionFormProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const categories = useLiveQuery(() => db.categories.orderBy('order').toArray());
  const filteredCategories = categories?.filter(cat => cat.type === formData.type) || [];

  const [formData, setFormData] = useState({
    amount: initialData?.amount || '',
    currency: (initialData?.currency as Currency) || 'USD',
    type: (initialData?.type as TransactionType) || 'EXPENSE',
    categoryId: initialData?.categoryId || '',
    note: initialData?.note || '',
    date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  });

  // Set default category when type changes
  React.useEffect(() => {
    if (filteredCategories.length > 0 && !filteredCategories.find(c => c.id === formData.categoryId)) {
      setFormData(prev => ({ ...prev, categoryId: filteredCategories[0].id }));
    }
  }, [formData.type, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await db.transactions.add({
        ...formData,
        amount: Number(formData.amount),
        date: new Date(formData.date),
        isRecurring: false,
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-bold tracking-tight">{t('addTransaction')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex gap-4 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'EXPENSE' })}
              className={cn(
                "flex-1 py-2 px-4 rounded-md font-bold text-sm transition-all",
                formData.type === 'EXPENSE' ? "bg-danger text-white shadow-sm" : "text-slate-500 hover:bg-slate-200/50"
              )}
            >
              {t('expense')}
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'INCOME' })}
              className={cn(
                "flex-1 py-2 px-4 rounded-md font-bold text-sm transition-all",
                formData.type === 'INCOME' ? "bg-success text-white shadow-sm" : "text-slate-500 hover:bg-slate-200/50"
              )}
            >
              {t('income')}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('amount')}</label>
              <input
                type="number"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full bg-slate-50 border border-slate-100 rounded-lg p-3 text-2xl font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('currency')}</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value as Currency })}
                className="w-full bg-slate-50 border border-slate-100 rounded-lg p-3 font-bold focus:ring-2 focus:ring-primary/20 outline-none h-[58px]"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="NGN">NGN (₦)</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('categories')}</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-100 rounded-lg p-3 text-sm font-medium outline-none"
              >
                {filteredCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('date')}</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-slate-50 border border-slate-100 rounded-lg p-3 text-sm font-medium outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('note')}</label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="w-full bg-slate-50 border border-slate-100 rounded-lg p-3 text-sm font-medium outline-none h-20 resize-none"
                placeholder={t('note')}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <button
              onClick={onClose}
              type="button"
              className="flex-1 py-2.5 text-slate-500 text-sm font-bold hover:bg-slate-100 rounded-lg transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-white py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
