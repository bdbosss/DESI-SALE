import React, { useState } from 'react';
import { Home, List, PieChart, Repeat, Settings, Plus, TableProperties, Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface NavigationProps {
  currentView: string;
  onViewChange: (view: any) => void;
  onAddClick: () => void;
}

export default function Navigation({ currentView, onViewChange, onAddClick }: NavigationProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: Home },
    { id: 'accountability', label: t('businessAccountability'), icon: TableProperties },
    { id: 'transactions', label: t('transactions'), icon: List },
    { id: 'reports', label: t('reports'), icon: PieChart },
    { id: 'recurring', label: t('recurring'), icon: Repeat },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  const handleLinkClick = (id: string) => {
    onViewChange(id);
    setIsOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
              D
            </div>
            <span className="font-bold text-xl tracking-tight">DESI SALE</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-500 hover:text-slate-900">
            <X size={24} />
          </button>
        </div>
      
        <nav className="space-y-1 mt-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleLinkClick(item.id)}
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
          onClick={() => { onAddClick(); setIsOpen(false); }}
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
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center px-4 z-40">
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
        <span className="ml-4 font-bold text-lg tracking-tight">DESI SALE</span>
      </div>

      {/* Desktop Sidebar (Fixed) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-white z-50 shadow-2xl md:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
