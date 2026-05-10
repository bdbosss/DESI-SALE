import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, INITIAL_CATEGORIES } from '../lib/db';
import { Repeat, Plus, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { cn, formatCurrency } from '../lib/utils';
import { RecurringRule } from '../types';

export default function RecurringManager() {
  const { t } = useTranslation();
  const [showAdd, setShowAdd] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const rules = useLiveQuery(() => db.recurringRules.toArray());
  const categories = useLiveQuery(() => db.categories.orderBy('order').toArray());

  const [newRule, setNewRule] = useState<Partial<RecurringRule>>({
    type: 'EXPENSE',
    frequency: 'MONTHLY',
    amount: 0,
    currency: 'USD',
    categoryId: 'others',
    note: '',
    startDate: new Date(),
    isActive: true,
  });

  const handleCreate = async () => {
    if (!newRule.amount || !newRule.categoryId) return;
    await db.recurringRules.add(newRule as RecurringRule);
    setShowAdd(false);
    setNewRule({
      type: 'EXPENSE',
      frequency: 'MONTHLY',
      amount: 0,
      currency: 'USD',
      categoryId: 'others',
      note: '',
      startDate: new Date(),
      isActive: true,
    });
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (deletingId === id) {
      await db.recurringRules.delete(id);
      setDeletingId(null);
    } else {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{t('recurring')}</h2>
          <p className="text-sm font-medium text-slate-500">Automate your regular accounting</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-primary-dark transition-all flex items-center gap-2"
        >
          <Plus size={16} />
          {t('addRecurring')}
        </button>
      </header>

      {showAdd && (
        <div className="glass-card p-6 space-y-6 animate-in slide-in-from-top duration-300 mb-8">
           <div className="flex gap-4 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setNewRule({ ...newRule, type: 'EXPENSE' })}
              className={cn(
                "flex-1 py-2 px-4 rounded-md font-bold text-xs transition-all",
                newRule.type === 'EXPENSE' ? "bg-danger text-white shadow-sm" : "text-slate-500 hover:bg-slate-200/50"
              )}
            >
              {t('expense')}
            </button>
            <button
              onClick={() => setNewRule({ ...newRule, type: 'INCOME' })}
              className={cn(
                "flex-1 py-2 px-4 rounded-md font-bold text-xs transition-all",
                newRule.type === 'INCOME' ? "bg-success text-white shadow-sm" : "text-slate-500 hover:bg-slate-200/50"
              )}
            >
              {t('income')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <input
              type="number"
              placeholder={t('amount')}
              className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/10"
              value={newRule.amount || ''}
              onChange={(e) => setNewRule({ ...newRule, amount: Number(e.target.value) })}
            />
            <select
              className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-sm outline-none"
              value={newRule.frequency}
              onChange={(e) => setNewRule({ ...newRule, frequency: e.target.value as any })}
            >
              <option value="DAILY">{t('daily')}</option>
              <option value="WEEKLY">{t('weekly')}</option>
              <option value="MONTHLY">{t('monthly')}</option>
            </select>
            <select
              className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-sm outline-none"
              value={newRule.categoryId}
              onChange={(e) => setNewRule({ ...newRule, categoryId: e.target.value })}
            >
              {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input
              type="text"
              placeholder={t('note')}
              className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-sm outline-none"
              value={newRule.note || ''}
              onChange={(e) => setNewRule({ ...newRule, note: e.target.value })}
            />
          </div>

          <div className="flex gap-4">
            <button onClick={() => setShowAdd(false)} className="flex-1 text-slate-500 text-sm font-bold py-2">{t('cancel')}</button>
            <button onClick={handleCreate} className="flex-1 bg-primary text-white rounded-lg text-sm font-bold py-2 shadow-sm">{t('save')}</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rules?.map((rule) => (
          <div key={rule.id} className="glass-card p-5 flex justify-between items-start transition-transform hover:scale-[1.01]">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center">
                <Repeat size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  {rule.note || rule.categoryId}
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest",
                    rule.type === 'INCOME' ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                  )}>
                    {t(rule.type.toLowerCase())}
                  </span>
                </h4>
                <p className="text-slate-400 text-xs font-semibold">{t(rule.frequency.toLowerCase())} • {formatCurrency(rule.amount, rule.currency)}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                  <Calendar size={12} />
                  <span>Starts: {format(new Date(rule.startDate), 'MMM dd, yyyy')}</span>
                </div>
              </div>
            </div>
            <button
               onClick={() => handleDelete(rule.id)}
               className={cn(
                 "transition-all flex items-center justify-center gap-1 whitespace-nowrap",
                 deletingId === rule.id 
                   ? "bg-danger text-white text-[10px] px-2 py-1 rounded font-bold" 
                   : "text-slate-300 hover:text-danger p-1.5"
               )}
            >
              {deletingId === rule.id ? "CONFIRM" : <Trash2 size={16} />}
            </button>
          </div>
        ))}

        {(!rules || rules.length === 0) && !showAdd && (
          <div className="col-span-full py-20 text-center text-gray-400 space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto opacity-50">
              <Repeat size={32} />
            </div>
            <p>No recurring rules set up yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
