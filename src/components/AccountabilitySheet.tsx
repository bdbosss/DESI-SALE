import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  startOfDay,
  parseISO
} from 'date-fns';
import { Download, Save, Loader2, ChevronLeft, ChevronRight, TableProperties } from 'lucide-react';
import { exportTransactionsToPDF, exportAccountabilityToPDF, exportCategorySummaryToPDF } from '../lib/pdf';
import { cn } from '../lib/utils';

export default function AccountabilitySheet() {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeType, setActiveType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [viewMode, setViewMode] = useState<'detailed' | 'summary'>('summary');
  const [savingId, setSavingId] = useState<string | null>(null);

  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const currency = settings?.currency || 'USD';

  const categories = useLiveQuery(() => db.categories.where('type').equals(activeType).sortBy('order'), [activeType]);
  const transactions = useLiveQuery(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return db.transactions
      .where('date')
      .between(start, end, true, true)
      .and(t => t.type === activeType)
      .toArray();
  }, [currentMonth, activeType]);

  const days = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth)
    });
  }, [currentMonth]);

  // Handle cell update
  const handleCellChange = async (date: Date, categoryId: string, value: string) => {
    const amount = parseFloat(value);
    const cellKey = `${format(date, 'yyyy-MM-dd')}-${categoryId}`;
    setSavingId(cellKey);

    try {
      if (activeType === 'INCOME') {
        // Find existing transaction for this day and category
        const existing = transactions?.find(t => 
          isSameDay(new Date(t.date), date) && t.categoryId === categoryId
        );

        if (isNaN(amount) || amount === 0) {
          if (existing?.id) await db.transactions.delete(existing.id);
        } else {
          if (existing?.id) {
            await db.transactions.update(existing.id, { amount });
          } else {
            await db.transactions.add({
              date: startOfDay(date),
              amount,
              currency,
              type: activeType,
              categoryId,
              note: `Daily ${activeType} entry`,
              isRecurring: false
            });
          }
        }
      } else {
        // For Expenses: Use weekly buckets (4 rows)
        const existing = transactions?.find(t => 
          isSameDay(new Date(t.date), date) && t.categoryId === categoryId
        );

        if (isNaN(amount) || amount === 0) {
          if (existing?.id) await db.transactions.delete(existing.id);
        } else {
          if (existing?.id) {
            await db.transactions.update(existing.id, { amount });
          } else {
            await db.transactions.add({
              date: startOfDay(date),
              amount,
              currency,
              type: activeType,
              categoryId,
              note: `Weekly ${activeType} entry`,
              isRecurring: false
            });
          }
        }
      }
    } catch (error) {
      console.error("Cell update failed", error);
    } finally {
      setTimeout(() => setSavingId(null), 500);
    }
  };

  const getCellValue = (date: Date, categoryId: string) => {
    const t = transactions?.find(t => 
      isSameDay(new Date(t.date), date) && t.categoryId === categoryId
    );
    return t ? t.amount.toString() : '';
  };

  const getCategoryTotal = (categoryId: string) => {
    return transactions
      ?.filter(t => t.categoryId === categoryId)
      .reduce((sum, t) => sum + t.amount, 0) || 0;
  };

  const handleExport = () => {
    if (!transactions || !categories) return;
    
    const title = `Accountability_${activeType}_${format(currentMonth, 'MMMM_yyyy')}`;
    const data = days.map(day => {
      const values: Record<string, number> = {};
      categories.forEach(cat => {
        const t = transactions.find(tx => isSameDay(new Date(tx.date), day) && tx.categoryId === cat.id);
        values[cat.id] = t ? t.amount : 0;
      });
      return { rowName: format(day, 'yyyy-MM-dd'), values };
    });
    exportAccountabilityToPDF(data, categories, title, currency);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{t('businessAccountability')}</h2>
          <div className="flex items-center gap-2 mt-1">
            <button 
              onClick={() => setCurrentMonth(prev => {
                const d = new Date(prev);
                d.setMonth(d.getMonth() - 1);
                return d;
              })}
              className="p-1 hover:bg-slate-100 rounded transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-bold text-primary min-w-[120px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <button 
              onClick={() => setCurrentMonth(prev => {
                const d = new Date(prev);
                d.setMonth(d.getMonth() + 1);
                return d;
              })}
              className="p-1 hover:bg-slate-100 rounded transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-slate-100 p-1 rounded-lg mr-2">
            <button
              onClick={() => setActiveType('INCOME')}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-md transition-all",
                activeType === 'INCOME' ? "bg-white text-success shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {t('income')}
            </button>
            <button
              onClick={() => setActiveType('EXPENSE')}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-md transition-all",
                activeType === 'EXPENSE' ? "bg-white text-danger shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {t('expense')}
            </button>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('summary')}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-md transition-all",
                viewMode === 'summary' ? "bg-white text-slate-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Summary View
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-md transition-all",
                viewMode === 'detailed' ? "bg-white text-slate-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Detailed Sheet
            </button>
          </div>
          <button
            onClick={() => {
              if (!transactions || !categories) return;
              exportCategorySummaryToPDF(
                transactions, 
                categories, 
                `Monthly_Report_${activeType}_${format(currentMonth, 'MMMM_yyyy')}`, 
                currency
              );
            }}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:opacity-90 transition-all flex items-center gap-2"
          >
            <Download size={16} />
            Download Monthly Report
          </button>
          <button
            onClick={handleExport}
            className="bg-white border border-slate-200 text-slate-700 px-4 shadow-sm py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <Download size={16} />
            Export Full Sheet
          </button>
        </div>
      </header>

      <div className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full border-separate border-spacing-0">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-100">
                <th className="sticky left-0 z-30 bg-slate-100 border-b border-r border-slate-300 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500 min-w-[120px]">
                  Date
                </th>
                {categories?.map(cat => (
                  <th key={cat.id} className="border-b border-r border-slate-300 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-700 min-w-[110px]">
                    {cat.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {viewMode === 'summary' ? (
                <tr className="hover:bg-blue-50/30">
                  <td className="sticky left-0 z-10 bg-slate-50 border-r border-b border-slate-200 px-4 py-8 text-xs font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">
                    {format(currentMonth, 'MMMM yyyy')} Summary
                  </td>
                  {categories?.map(cat => (
                    <td key={cat.id} className="border-r border-b border-slate-200 p-6 text-center">
                      <div className={cn(
                        "text-lg font-black tracking-tight",
                        activeType === 'INCOME' ? "text-success" : "text-danger"
                      )}>
                        {getCategoryTotal(cat.id).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">
                        Total {cat.name}
                      </div>
                    </td>
                  ))}
                </tr>
              ) : (
                days.map(day => (
                  <tr key={day.toISOString()} className="hover:bg-blue-50/30">
                    <td className="sticky left-0 z-10 bg-slate-50 border-r border-b border-slate-200 px-4 py-2 text-xs font-mono font-bold text-slate-500 whitespace-nowrap">
                      {format(day, 'dd/MM/yyyy')}
                    </td>
                    {categories?.map(cat => {
                      const cellKey = `${format(day, 'yyyy-MM-dd')}-${cat.id}`;
                      return (
                        <td key={cat.id} className="border-r border-b border-slate-200 p-0 relative h-10">
                          <input
                            type="number"
                            defaultValue={getCellValue(day, cat.id)}
                            onBlur={(e) => handleCellChange(day, cat.id, e.target.value)}
                            className={cn(
                              "w-full h-full px-2 text-sm text-center outline-none bg-transparent focus:bg-primary/10 focus:ring-2 focus:ring-primary/20 transition-all font-medium",
                              activeType === 'EXPENSE' ? "text-danger" : "text-success",
                              savingId === cellKey && "bg-slate-50 animate-pulse"
                            )}
                            placeholder="0"
                          />
                          {savingId === cellKey && (
                            <div className="absolute right-1 top-1">
                              <Loader2 size={8} className="animate-spin text-primary" />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="sticky bottom-0 z-20">
              <tr className="bg-slate-900 text-white font-bold">
                <td className="sticky left-0 z-30 bg-slate-900 border-r border-slate-700 px-4 py-4 text-xs font-black uppercase tracking-widest">
                  TOTAL
                </td>
                {categories?.map(cat => (
                  <td key={cat.id} className={cn(
                    "border-r border-slate-700 px-4 py-4 text-center text-sm font-mono tracking-tight",
                    activeType === 'INCOME' ? "text-success" : "text-danger"
                  )}>
                    {getCategoryTotal(cat.id).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
            <Save size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Live Auto-Sync</p>
            <p className="text-xs text-slate-500 font-medium tracking-tight">Data is persisted as you type. No need to click save.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100">
            <TableProperties size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Sheet Mode</p>
            <p className="text-xs text-slate-500 font-medium tracking-tight">Full monthly accountability at a glance.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
