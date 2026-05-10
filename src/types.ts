export type Currency = 'USD' | 'EUR' | 'GBP' | 'NGN';
export type TransactionType = 'EXPENSE' | 'INCOME';
export type Language = 'en' | 'fr';

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: TransactionType;
  order: number;
}

export interface Transaction {
  id?: number;
  date: Date;
  amount: number;
  currency: Currency;
  type: TransactionType;
  categoryId: string;
  note: string;
  receiptImage?: string; // base64 or blob URL
  isRecurring: boolean;
  recurringId?: number;
}

export interface RecurringRule {
  id?: number;
  amount: number;
  currency: Currency;
  type: TransactionType;
  categoryId: string;
  note: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  startDate: Date;
  lastGeneratedDate?: Date;
  isActive: boolean;
}

export interface AppSettings {
  language: Language;
  currency: Currency;
  isDriveSyncEnabled: boolean;
  lastDriveSync?: Date;
  id?: number;
}
