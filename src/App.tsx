/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './lib/i18n';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import TransactionForm from './components/TransactionForm';
import Settings from './components/Settings';
import RecurringManager from './components/RecurringManager';
import AccountabilitySheet from './components/AccountabilitySheet';
import { db, seedCategories } from './lib/db';
import { addDays, isBefore, isAfter, startOfDay } from 'date-fns';

export default function App() {
  const { t } = useTranslation();
  const [currentView, setCurrentView] = useState<'dashboard' | 'transactions' | 'reports' | 'settings' | 'recurring' | 'accountability'>('accountability');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    seedCategories();
    processRecurringEntries();
  }, []);

  // Simple routine to check and process recurring entries
  const processRecurringEntries = async () => {
    const rules = await db.recurringRules.where('isActive').equals(1).toArray();
    const now = new Date();

    for (const rule of rules) {
      let lastGen = rule.lastGeneratedDate ? new Date(rule.lastGeneratedDate) : new Date(rule.startDate);
      let nextGen = new Date(lastGen);

      // Increment based on frequency
      while (true) {
        if (rule.frequency === 'DAILY') nextGen = addDays(nextGen, 1);
        else if (rule.frequency === 'WEEKLY') nextGen = addDays(nextGen, 7);
        else if (rule.frequency === 'MONTHLY') nextGen.setMonth(nextGen.getMonth() + 1);

        if (isAfter(nextGen, now)) break;

        // Add transaction
        await db.transactions.add({
          amount: rule.amount,
          currency: rule.currency,
          date: new Date(nextGen),
          type: rule.type,
          categoryId: rule.categoryId,
          note: `[RECURRING] ${rule.note || ''}`,
          isRecurring: true,
          recurringId: rule.id
        });

        // Update rule lastGeneratedDate
        await db.recurringRules.update(rule.id!, { lastGeneratedDate: new Date(nextGen) });
      }
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'transactions': 
      case 'reports': return <TransactionList />;
      case 'recurring': return <RecurringManager />;
      case 'settings': return <Settings />;
      case 'accountability': return <AccountabilitySheet />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <Navigation 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        onAddClick={() => setShowAddForm(true)}
      />
      
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 md:p-10 lg:p-12">
          {renderView()}
        </div>
      </main>

      {showAddForm && <TransactionForm onClose={() => setShowAddForm(false)} />}
    </div>
  );
}

