import Dexie, { type Table } from 'dexie';
import { Transaction, RecurringRule, Category, AppSettings } from '../types';

export class AppDatabase extends Dexie {
  transactions!: Table<Transaction>;
  recurringRules!: Table<RecurringRule>;
  categories!: Table<Category>;
  settings!: Table<AppSettings>;

  constructor() {
    super('FinancialAppDB');
    this.version(3).stores({
      transactions: '++id, date, categoryId, type',
      recurringRules: '++id, isActive',
      categories: 'id, type, order',
      settings: '++id'
    });
  }
}

export const db = new AppDatabase();

// Initial categories based on user business document
export const INITIAL_CATEGORIES: Category[] = [
  { id: 'mobile', name: 'Mobile', icon: 'Smartphone', type: 'INCOME', order: 0 },
  { id: 'accessoires', name: 'Accessoires', icon: 'Headphones', type: 'INCOME', order: 1 },
  { id: 'reparation', name: 'Reparation', icon: 'Wrench', type: 'INCOME', order: 2 },
  { id: 'sim', name: 'SIM', icon: 'Cpu', type: 'INCOME', order: 3 },
  { id: 'others', name: 'Others', icon: 'MoreHorizontal', type: 'INCOME', order: 4 },
  { id: 'ria', name: 'Ria', icon: 'Globe', type: 'INCOME', order: 5 },
  { id: 'mg', name: 'MG', icon: 'Send', type: 'INCOME', order: 6 },
  { id: 'wu', name: 'WU', icon: 'DollarSign', type: 'INCOME', order: 7 },
  { id: 'om', name: 'OM', icon: 'Wallet', type: 'INCOME', order: 8 },
  // Common Expenses
  { id: 'rent', name: 'Rent', icon: 'Home', type: 'EXPENSE', order: 0 },
  { id: 'supplies', name: 'Supplies', icon: 'Package', type: 'EXPENSE', order: 1 },
  { id: 'electricity', name: 'Electricity', icon: 'Zap', type: 'EXPENSE', order: 2 },
];

export async function seedCategories() {
  const count = await db.categories.count();
  if (count === 0) {
    await db.categories.bulkAdd(INITIAL_CATEGORIES);
  }
  
  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.add({
      language: 'en',
      currency: 'USD',
      isDriveSyncEnabled: false
    });
  }
}
