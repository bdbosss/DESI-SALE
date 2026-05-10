import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      dashboard: 'Dashboard',
      transactions: 'Transactions',
      reports: 'Reports',
      settings: 'Settings',
      recurring: 'Recurring',
      expense: 'Expense',
      income: 'Income',
      profit: 'Profit',
      dailySummary: 'Daily Summary',
      weeklySummary: 'Weekly Summary',
      monthlySummary: 'Monthly Summary',
      customRange: 'Custom Range',
      addTransaction: 'Add Transaction',
      scanReceipt: 'Scan Receipt',
      exportPdf: 'Export PDF',
      currency: 'Currency',
      language: 'Language',
      businessAccountability: 'Business Accountability',
      noTransactions: 'No transactions found for this period.',
      totalBalance: 'Total Balance',
      recentTransactions: 'Recent Transactions',
      categories: 'Categories',
      amount: 'Amount',
      date: 'Date',
      note: 'Note',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      syncGoogleDrive: 'Sync with Google Drive',
      backupStatus: 'Drive Backup',
      notConnected: 'Not Connected',
      connected: 'Connected',
      lastSync: 'Last Sync',
      scanning: 'Scanning receipt...',
      scanComplete: 'Scan complete!',
      scanError: 'Could not extract details from receipt.',
      recurringRules: 'Recurring Rules',
      frequency: 'Frequency',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      active: 'Active',
      inactive: 'Inactive',
      addRecurring: 'New Recurring Entry',
    }
  },
  fr: {
    translation: {
      dashboard: 'Tableau de bord',
      transactions: 'Transactions',
      reports: 'Rapports',
      settings: 'Paramètres',
      recurring: 'Récurrent',
      expense: 'Dépense',
      income: 'Revenu',
      profit: 'Profit',
      dailySummary: 'Résumé quotidien',
      weeklySummary: 'Résumé hebdomadaire',
      monthlySummary: 'Résumé mensuel',
      customRange: 'Période personnalisée',
      addTransaction: 'Ajouter une transaction',
      scanReceipt: 'Scanner un reçu',
      exportPdf: 'Exporter en PDF',
      currency: 'Devise',
      language: 'Langue',
      businessAccountability: 'Responsabilité Commerciale',
      noTransactions: 'Aucune transaction trouvée pour cette période.',
      totalBalance: 'Solde Total',
      recentTransactions: 'Transactions Récentes',
      categories: 'Catégories',
      amount: 'Montant',
      date: 'Date',
      note: 'Note',
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      syncGoogleDrive: 'Sinc. avec Google Drive',
      backupStatus: 'Sauvegarde Drive',
      notConnected: 'Non Connecté',
      connected: 'Connecté',
      lastSync: 'Dernière Sinc.',
      scanning: 'Numérisation du reçu...',
      scanComplete: 'Numérisation terminée !',
      scanError: 'Impossible d\'extraire les détails du reçu.',
      recurringRules: 'Règles Récurrentes',
      frequency: 'Fréquence',
      daily: 'Quotidien',
      weekly: 'Hebdomadaire',
      monthly: 'Mensuel',
      active: 'Actif',
      inactive: 'Inactif',
      addRecurring: 'Nouvelle Entrée Récurrente',
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
