import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { format, startOfMonth } from 'date-fns';
import { FileText, Download, Trash2, Search, Filter } from 'lucide-react';
import { exportTransactionsToPDF, exportCategorySummaryToPDF } from '../lib/pdf';
import { formatCurrency } from '../lib/utils';
import { cn } from '../lib/utils';

export default function TransactionList() {
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL');
  const [dateRange, setDateRange] = useState({ 
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const preferredCurrency = settings?.currency || 'USD';

  const categories = useLiveQuery(() => db.categories.toArray());
  const transactions = useLiveQuery(
    () => db.transactions.toArray()
  );

  const filteredTransactions = transactions?.filter(t => {
    const matchesSearch = t.note?.toLowerCase().includes(searchTerm.toLowerCase()) || t.categoryId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || t.type === filterType;
    const itemDate = format(new Date(t.date), 'yyyy-MM-dd');
    const matchesDate = itemDate >= dateRange.start && itemDate <= dateRange.end;
    return matchesSearch && matchesType && matchesDate;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleExport = () => {
    if (!filteredTransactions) return;
    exportTransactionsToPDF(filteredTransactions, `${t('reports')} (${dateRange.start} - ${dateRange.end})`, preferredCurrency);
  };

  const handleExportSummary = () => {
    if (!filteredTransactions || !categories) return;
    exportCategorySummaryToPDF(
      filteredTransactions, 
      categories, 
      `${t('reports')} Summary (${dateRange.start} - ${dateRange.end})`, 
      preferredCurrency
    );
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (deletingId === id) {
      await db.transactions.delete(id);
      setDeletingId(null);
    } else {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{t('transactions')}</h2>
          <p className="text-sm font-medium text-slate-500">{filteredTransactions?.length || 0} items found</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportSummary}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:opacity-90 transition-all flex items-center gap-2"
          >
            <Download size={16} />
            Category Report
          </button>
          <button
            onClick={handleExport}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <Download size={16} />
            {t('exportPdf')}
          </button>
        </div>
      </header>

      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder={t('note') + '...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-lg py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <div className="flex gap-2">
          <input 
            type="date" 
            value={dateRange.start} 
            onChange={e => setDateRange({...dateRange, start: e.target.value})}
            className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-semibold outline-none"
          />
          <input 
            type="date" 
            value={dateRange.end} 
            onChange={e => setDateRange({...dateRange, end: e.target.value})}
            className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-semibold outline-none"
          />
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {(['ALL', 'EXPENSE', 'INCOME'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                filterType === type ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {type === 'ALL' ? 'All' : t(type.toLowerCase())}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">{t('date')}</th>
                <th className="px-6 py-4">{t('categories')}</th>
                <th className="px-6 py-4">{t('note')}</th>
                <th className="px-6 py-4 text-right">{t('amount')}</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions?.map((t, idx) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-slate-900">{format(new Date(t.date), 'MMM dd, yyyy')}</div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase">{format(new Date(t.date), 'HH:mm')}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                      {t.categoryId}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-[200px] truncate text-sm text-slate-600">
                    {t.note || '-'}
                  </td>
                  <td className={cn(
                    "px-6 py-4 text-right text-sm font-bold whitespace-nowrap",
                    t.type === 'INCOME' ? "text-success" : "text-danger"
                  )}>
                    {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount, t.currency)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(t.id)}
                      className={cn(
                        "transition-all flex items-center justify-center ml-auto gap-1 whitespace-nowrap",
                        deletingId === t.id 
                          ? "bg-danger text-white text-[10px] px-2 py-1 rounded font-bold" 
                          : "text-slate-300 hover:text-danger p-1.5 opacity-0 group-hover:opacity-100"
                      )}
                    >
                      {deletingId === t.id ? "CONFIRM" : <Trash2 size={16} />}
                    </button>
                  </td>
                </tr>
              ))}
              {(!filteredTransactions || filteredTransactions.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 space-y-4">
                    <FileText size={48} className="mx-auto opacity-20" />
                    <p>{t('noTransactions')}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
