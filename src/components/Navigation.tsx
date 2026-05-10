import React from 'react';
import { Home, List, PieChart, Repeat, Settings, Plus, TableProperties } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

interface NavigationProps {
  currentView: string;
  onViewChange: (view: any) => void;
  onAddClick: () => void;
}

export default function Navigation({ currentView, onViewChange, onAddClick }: NavigationProps) {
  const { t } = useTranslation();

  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: Home },
    { id: 'accountability', label: t('businessAccountability'), icon: TableProperties },
    { id: 'transactions', label: t('transactions'), icon: List },
    { id: 'reports', label: t('reports'), icon: PieChart },
    { id: 'recurring', label: t('recurring'), icon: Repeat },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
              D
            </div>
            <span className="font-bold text-xl tracking-tight">DESI SALE</span>
          </div>
        
          <nav className="space-y-1 mt-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200",
                  currentView === item.id 
                    ? "bg-slate-100 text-primary font-medium" 
                    : "text-slate-500 hover:bg-slate-50"
                )}
              >
                <item.icon size={18} />
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-100">
          <button 
            onClick={onAddClick}
            className="w-full bg-primary hover:bg-primary-dark text-white flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-all active:scale-[0.98]"
          >
            <Plus size={18} />
            {t('addTransaction')}
          </button>
          
          <div className="mt-4 text-center">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
              Developed by HAGHRAH MAN
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 px-6 py-3 flex justify-between items-center z-50">
        {navItems.slice(0, 2).map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "flex flex-col items-center gap-1",
              currentView === item.id ? "text-primary" : "text-gray-400"
            )}
          >
            <item.icon size={20} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}

        <button 
          onClick={onAddClick}
          className="bg-primary text-white p-4 rounded-full -translate-y-8 shadow-xl shadow-primary/40 active:scale-90 transition-transform"
        >
          <Plus size={24} />
        </button>

        {navItems.slice(2, 4).map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "flex flex-col items-center gap-1",
              currentView === item.id ? "text-primary" : "text-gray-400"
            )}
          >
            <item.icon size={20} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
        
        <button
          onClick={() => onViewChange('settings')}
          className={cn(
            "flex flex-col items-center gap-1",
            currentView === 'settings' ? "text-primary" : "text-gray-400"
          )}
        >
          <Settings size={20} />
          <span className="text-[10px] font-medium">{t('settings')}</span>
        </button>
      </nav>
    </>
  );
}
