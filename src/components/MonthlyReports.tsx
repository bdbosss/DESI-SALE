import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart as RePieChart, Pie, Legend, LineChart, Line
} from 'recharts';
import { db } from '../lib/db';
import { formatCurrency, cn } from '../lib/utils';
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, 
  startOfYear, eachMonthOfInterval, subMonths, addMonths, endOfYear 
} from 'date-fns';
import { ChevronLeft, ChevronRight, Download, BarChart3, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight, Activity, Calendar } from 'lucide-react';
import { exportCategorySummaryToPDF } from '../lib/pdf';

export default function MonthlyReports() {
  const { t, i18n } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const preferredCurrency = settings?.currency || 'USD';
  
  const categories = useLiveQuery(() => db.categories.toArray());
  
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const yearStart = startOfYear(selectedDate);
  const yearEnd = endOfYear(selectedDate);

  const monthTransactions = useLiveQuery(() => 
    db.transactions.where('date').between(monthStart, monthEnd).toArray(),
    [selectedDate]
  );

  const yearTransactions = useLiveQuery(() => 
    db.transactions.where('date').between(yearStart, yearEnd).toArray(),
    [selectedDate]
  );

  const stats = useMemo(() => {
    if (!monthTransactions) return { income: 0, expenses: 0, balance: 0 };
    return monthTransactions.reduce((acc, t) => {
      if (t.type === 'INCOME') acc.income += t.amount;
      else acc.expenses += t.amount;
      acc.balance = acc.income - acc.expenses;
      return acc;
    }, { income: 0, expenses: 0, balance: 0 });
  }, [monthTransactions]);

  const yearlyData = useMemo(() => {
    if (!yearTransactions) return [];
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
    
    return months.map(m => {
      const mTransactions = yearTransactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear();
      });
      
      return {
        name: format(m, 'MMM'),
        fullMonth: format(m, 'MMMM yyyy'),
        income: mTransactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0),
        expense: mTransactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [yearTransactions, yearStart, yearEnd]);

  const dailyData = useMemo(() => {
    if (!monthTransactions) return [];
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return days.map(day => {
      const dayTransactions = monthTransactions.filter(t => isSameDay(new Date(t.date), day));
      return {
        name: format(day, 'dd'),
        income: dayTransactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0),
        expense: dayTransactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [monthTransactions, monthStart, monthEnd]);

  const expenseByCategory = useMemo(() => {
    if (!monthTransactions || !categories) return [];
    const catMap: Record<string, number> = {};
    monthTransactions.forEach(t => {
      if (t.type === 'EXPENSE') {
        const cat = categories.find(c => c.id === t.categoryId);
        const name = cat ? cat.name : t.categoryId;
        catMap[name] = (catMap[name] || 0) + t.amount;
      }
    });
    return Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [monthTransactions, categories]);

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  const prevMonth = () => setSelectedDate(subMonths(selectedDate, 1));
  const nextMonth = () => setSelectedDate(addMonths(selectedDate, 1));

  const handleExport = () => {
    if (!monthTransactions || !categories) return;
    exportCategorySummaryToPDF(
      monthTransactions, 
      categories, 
      `${t('reports')} - ${format(selectedDate, 'MMMM yyyy')}`, 
      preferredCurrency
    );
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{t('reports')}</h2>
          <p className="text-sm text-slate-500 font-medium">Monthly Analytics & Insights</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-50 transition-colors border-r border-slate-100 text-slate-400 hover:text-slate-600">
              <ChevronLeft size={18} />
            </button>
            <div className="px-6 py-2 text-sm font-bold text-slate-700 min-w-[140px] text-center">
              {format(selectedDate, 'MMMM yyyy')}
            </div>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-50 transition-colors border-l border-slate-100 text-slate-400 hover:text-slate-600">
              <ChevronRight size={18} />
            </button>
          </div>
          
          <button
            onClick={handleExport}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
          >
            <Download size={16} />
            <span>PDF</span>
          </button>
        </div>
      </header>

      {/* Yearly Comparison Chart */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <Calendar size={18} className="text-primary" />
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">{format(selectedDate, 'yyyy')} Overview</h3>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                formatter={(value: number) => [formatCurrency(value, preferredCurrency), '']}
              />
              <Legend verticalAlign="top" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingBottom: '20px' }} />
              <Bar name={t('income')} dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar name={t('expense')} dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 bg-gradient-to-br from-white to-success/5">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-1">
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{t('income')}</span>
              <p className="text-2xl font-black tracking-tight text-slate-900">
                {formatCurrency(stats.income, preferredCurrency)}
              </p>
            </div>
            <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center text-success border border-success/20">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-success/60 bg-success/5 inline-block px-2 py-0.5 rounded uppercase tracking-tighter">
            Money In
          </p>
        </div>

        <div className="glass-card p-6 bg-gradient-to-br from-white to-danger/5">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-1">
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{t('expense')}</span>
              <p className="text-2xl font-black tracking-tight text-slate-900">
                {formatCurrency(stats.expenses, preferredCurrency)}
              </p>
            </div>
            <div className="w-10 h-10 bg-danger/10 rounded-xl flex items-center justify-center text-danger border border-danger/20">
              <ArrowDownRight size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-danger/60 bg-danger/5 inline-block px-2 py-0.5 rounded uppercase tracking-tighter">
            Money Out
          </p>
        </div>

        <div className="glass-card p-6 bg-gradient-to-br from-white to-primary/5">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-1">
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{t('profit')}</span>
              <p className="text-2xl font-black tracking-tight text-slate-900">
                {formatCurrency(stats.balance, preferredCurrency)}
              </p>
            </div>
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
              <Activity size={20} />
            </div>
          </div>
          <p className="text-[10px] font-bold text-primary/60 bg-primary/5 inline-block px-2 py-0.5 rounded uppercase tracking-tighter">
            Net Results
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Cashflow Chart */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 size={18} className="text-primary" />
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Daily Trend</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  formatter={(value: number) => [formatCurrency(value, preferredCurrency), '']}
                />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense by Category Chart */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon size={18} className="text-primary" />
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Expense Share</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={expenseByCategory}
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1000}
                >
                  {expenseByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  formatter={(value: number) => [formatCurrency(value, preferredCurrency), '']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category breakdown table */}
        <div className="glass-card p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Category Distribution</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-center">Share</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenseByCategory.map((cat, idx) => {
                  const percentage = stats.expenses > 0 ? (cat.value / stats.expenses) * 100 : 0;
                  return (
                    <tr key={cat.name} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                          <span className="text-sm font-bold text-slate-700">{cat.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden hidden md:block">
                            <div 
                              className="h-full rounded-full" 
                              style={{ width: `${percentage}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                            />
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-400">{percentage.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-black text-slate-900">{formatCurrency(cat.value, preferredCurrency)}</span>
                      </td>
                    </tr>
                  );
                })}
                {expenseByCategory.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-300 text-xs font-bold uppercase tracking-widest">
                      No expense data for this month
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
