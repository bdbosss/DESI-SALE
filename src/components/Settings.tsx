import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { Globe, CreditCard, Cloud, RefreshCw } from 'lucide-react';
import { Language, Currency } from '../types';
import { cn } from '../lib/utils';
import { db } from '../lib/db';

import CategoryManager from './CategoryManager';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const settings = useLiveQuery(() => db.settings.toCollection().first());

  const currentCurrency = settings?.currency || 'USD';
  const currentLang = i18n.language as Language;

  const changeLanguage = async (lng: Language) => {
    i18n.changeLanguage(lng);
    if (settings?.id) {
      await db.settings.update(settings.id, { language: lng });
    } else {
      await db.settings.add({ language: lng, currency: currentCurrency, isDriveSyncEnabled: false });
    }
  };

  const changeCurrency = async (currency: Currency) => {
    if (settings?.id) {
      await db.settings.update(settings.id, { currency });
    } else {
      await db.settings.add({ language: currentLang, currency, isDriveSyncEnabled: false });
    }
  };

  const handleDriveSync = async () => {
    try {
      const response = await fetch('/api/auth/google/url');
      const { url } = await response.json();
      window.open(url, 'google_auth', 'width=600,height=700');
    } catch (error) {
      console.error("Sync init failed", error);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <header className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">{t('settings')}</h2>
        <p className="text-sm font-medium text-slate-500">Manage your application preferences</p>
      </header>

      <div className="glass-card p-6 space-y-10">
        <section className="space-y-4">
          <div className="flex items-center gap-3 text-primary">
            <Globe size={18} />
            <h3 className="font-bold uppercase text-[10px] tracking-widest">{t('categories')}</h3>
          </div>
          <CategoryManager />
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-primary">
            <Globe size={18} />
            <h3 className="font-bold uppercase text-[10px] tracking-widest">{t('language')}</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => changeLanguage('en')}
              className={cn(
                "p-3 rounded-lg border transition-all text-sm font-bold",
                currentLang === 'en' ? "border-primary bg-primary/5 text-primary" : "border-slate-100 text-slate-500 hover:border-slate-200"
              )}
            >
              English
            </button>
            <button
              onClick={() => changeLanguage('fr')}
              className={cn(
                "p-3 rounded-lg border transition-all text-sm font-bold",
                currentLang === 'fr' ? "border-primary bg-primary/5 text-primary" : "border-slate-100 text-slate-500 hover:border-slate-200"
              )}
            >
              Français
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-primary">
            <CreditCard size={18} />
            <h3 className="font-bold uppercase text-[10px] tracking-widest">{t('currency')}</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
             <button
              onClick={() => changeCurrency('USD')}
              className={cn(
                "p-3 rounded-lg border transition-all text-sm font-bold",
                currentCurrency === 'USD' ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-slate-100 text-slate-500 hover:border-slate-200"
              )}
            >
              USD ($)
            </button>
            <button
               onClick={() => changeCurrency('EUR')}
               className={cn(
                "p-3 rounded-lg border transition-all text-sm font-bold",
                currentCurrency === 'EUR' ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-slate-100 text-slate-500 hover:border-slate-200"
              )}
            >
              EUR (€)
            </button>
            <button
               onClick={() => changeCurrency('GBP')}
               className={cn(
                "p-3 rounded-lg border transition-all text-sm font-bold",
                currentCurrency === 'GBP' ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-slate-100 text-slate-500 hover:border-slate-200"
              )}
            >
              GBP (£)
            </button>
            <button
               onClick={() => changeCurrency('NGN')}
               className={cn(
                "p-3 rounded-lg border transition-all text-sm font-bold",
                currentCurrency === 'NGN' ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-slate-100 text-slate-500 hover:border-slate-200"
              )}
            >
              NGN (₦)
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-primary">
            <Cloud size={18} />
            <h3 className="font-bold uppercase text-[10px] tracking-widest">{t('backupStatus')}</h3>
          </div>
          <div className="bg-slate-50 rounded-xl p-8 flex flex-col items-center gap-4 text-center border border-slate-100/50">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-300">
               <Cloud size={24} />
            </div>
            <div>
              <p className="font-bold text-slate-600 text-sm">{t('notConnected')}</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">{t('syncGoogleDrive')} to keep your data safe.</p>
            </div>
            <button 
              onClick={handleDriveSync}
              className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-2.5 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-50 transition-all active:scale-95"
            >
              <RefreshCw size={14} />
              Connect Google Drive
            </button>
          </div>
        </section>

        <div className="pt-6 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">
            DESI SALE • Developed by HAGHRAH MAN
          </p>
        </div>
      </div>
    </div>
  );
}
