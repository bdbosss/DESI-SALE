import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { Transaction, Category } from '../types';
import { formatCurrency } from './utils';

export function exportTransactionsToPDF(transactions: Transaction[], title: string, currency: string) {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 14, 30);

  const tableData = transactions.map(t => [
    format(new Date(t.date), 'yyyy-MM-dd'),
    t.type,
    t.categoryId,
    t.note || '-',
    formatCurrency(t.amount, t.currency)
  ]);

  autoTable(doc, {
    startY: 35,
    head: [['Date', 'Type', 'Category', 'Note', 'Amount']],
    body: tableData,
    foot: [[
      '', '', '', 'Total',
      formatCurrency(transactions.reduce((acc, t) => acc + (t.type === 'INCOME' ? t.amount : -t.amount), 0), currency)
    ]],
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' }
  });

  doc.save(`${title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
}

export function exportCategorySummaryToPDF(
  transactions: Transaction[],
  categories: Category[],
  title: string,
  currency: string
) {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 14, 30);

  // Group by category
  const summary: Record<string, { income: number, expense: number }> = {};
  
  categories.forEach(cat => {
    summary[cat.id] = { income: 0, expense: 0 };
  });

  transactions.forEach(t => {
    if (summary[t.categoryId]) {
      if (t.type === 'INCOME') summary[t.categoryId].income += t.amount;
      else summary[t.categoryId].expense += t.amount;
    }
  });

  const head = [['Category', 'Income', 'Expense', 'Net']];
  const body = categories
    .map(cat => {
      const data = summary[cat.id];
      const net = data.income - data.expense;
      return [
        cat.name,
        formatCurrency(data.income, currency),
        formatCurrency(data.expense, currency),
        formatCurrency(net, currency)
      ];
    })
    .filter(row => row[1] !== formatCurrency(0, currency) || row[2] !== formatCurrency(0, currency));

  const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);

  autoTable(doc, {
    startY: 35,
    head,
    body,
    foot: [['TOTAL', formatCurrency(totalIncome, currency), formatCurrency(totalExpense, currency), formatCurrency(totalIncome - totalExpense, currency)]],
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] },
    footStyles: { fillColor: [52, 73, 94] }
  });

  doc.save(`${title.replace(/\s+/g, '_')}_Monthly_Summary.pdf`);
}

export function exportAccountabilityToPDF(
  data: { rowName: string; values: Record<string, number> }[],
  categories: { id: string; name: string }[],
  title: string,
  currency: string
) {
  const doc = new jsPDF({ orientation: 'landscape' });

  doc.setFontSize(20);
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 14, 30);

  const head = [['Date/Period', ...categories.map(c => c.name)]];
  const body = data.map(row => [
    row.rowName,
    ...categories.map(cat => formatCurrency(row.values[cat.id] || 0, currency))
  ]);

  autoTable(doc, {
    startY: 35,
    head,
    body,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    styles: { cellPadding: 2 }
  });

  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
}
