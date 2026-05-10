import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart as RePieChart, Pie 
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp } from 'lucide-react';
import { db } from '../lib/db';
import { formatCurrency, cn } from '../lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

export default function Dashboard() {
  const { t, i18n } = useTranslation();

  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const preferredCurrency = settings?.currency || 'USD';
  
  const categories = useLiveQuery(() => db.categories.toArray());
  const transactions = useLiveQuery(() => 
    db.transactions.where('date').between(startOfMonth(new Date()), endOfMonth(new Date())).toArray()
  );

  const stats = useMemo(() => {
    if (!transactions) return { income: 0, expenses: 0, balance: 0 };
    return transactions.reduce((acc, t) => {
      // For simplicity, we sum amounts directly. 
      // In a multi-currency app, you'd usually convert to preferredCurrency first.
      if (t.type === 'INCOME') acc.income += t.amount;
      else acc.expenses += t.amount;
      acc.balance = acc.income - acc.expenses;
      return acc;
    }, { income: 0, expenses: 0, balance: 0 });
  }, [transactions]);

  const chartData = useMemo(() => {
    if (!transactions) return [];
    const days = eachDayOfInterval({
      start: startOfMonth(new Date()),
      end: new Date()
    });

    return days.map(day => {
      const dayTransactions = transactions.filter(t => isSameDay(new Date(t.date), day));
      return {
        name: format(day, 'dd'),
        income: dayTransactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0),
        expense: dayTransactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [transactions]);

  const categoryData = useMemo(() => {
    if (!transactions) return [];
    const catMap: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.type === 'EXPENSE') {
        catMap[t.categoryId] = (catMap[t.categoryId] || 0) + t.amount;
      }
    });
    return Object.entries(catMap).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{t('dashboard')}</h2>
          <p className="text-sm text-slate-500 font-medium">{format(new Date(), 'MMMM yyyy')}</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 font-medium text-sm">
          {t('totalBalance')}: <span className={stats.balance >= 0 ? "text-success" : "text-danger"}>
            {formatCurrency(stats.balance, preferredCurrency, i18n.language)}
          </span>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">{t('income')}</span>
            <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center text-success">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight">{formatCurrency(stats.income, preferredCurrency)}</p>
          <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="bg-success h-full w-[70%]" />
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">{t('expense')}</span>
            <div className="w-8 h-8 bg-danger/10 rounded-lg flex items-center justify-center text-danger">
              <ArrowDownRight size={18} />
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight">{formatCurrency(stats.expenses, preferredCurrency)}</p>
          <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="bg-danger h-full w-[30%]" />
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">{t('profit')}</span>
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <TrendingUp size={18} />
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight">{formatCurrency(stats.income - stats.expenses, preferredCurrency)}</p>
          <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="bg-primary h-full w-[50%]" />
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold">{t('dailySummary')}</h3>
          <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-success"></span> {t('income')}</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-danger"></span> {t('expense')}</div>
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="income" fill="#10b981" radius={[2, 2, 0, 0]} barSize={30} />
              <Bar dataKey="expense" fill="#f43f5e" radius={[2, 2, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold mb-6">{t('categories')}</h3>
          <div className="h-[250px] w-full">
             <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={categoryData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-bold mb-6">{t('recentTransactions')}</h3>
          <div className="space-y-4">
            {transactions?.slice(0, 5).reverse().map((t, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    t.type === 'INCOME' ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                  )}>
                    <Wallet size={18} />
                  </div>
                  <div>
                    <p className="font-medium">{t.note || t.categoryId}</p>
                    <p className="text-xs text-gray-400">{format(new Date(t.date), 'MMM dd, HH:mm')}</p>
                  </div>
                </div>
                <p className={cn("font-bold", t.type === 'INCOME' ? "text-success" : "text-danger")}>
                  {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount, t.currency)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
