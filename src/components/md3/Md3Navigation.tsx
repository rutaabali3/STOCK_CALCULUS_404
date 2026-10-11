import React from 'react';
import { Scale, History as HistoryIcon, Settings as SettingsIcon } from 'lucide-react';
import { SyncBadge } from '../SyncBadge';

export type NavTab = 'weigh' | 'history' | 'settings' | 'slip';

interface NavItemConfig {
  id: 'weigh' | 'history' | 'settings';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'weigh', label: 'Weigh', icon: Scale },
  { id: 'history', label: 'History', icon: HistoryIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export interface Md3NavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: 'weigh' | 'history' | 'settings') => void;
  shopName?: string;
}

export const Md3Navigation: React.FC<Md3NavigationProps> = ({
  activeTab,
  onTabChange,
  shopName = 'Mandi Calculator',
}) => {
  return (
    <>
      {/* 1. Desktop & Tablet Navigation Rail (Screen width >= 768px: md+) */}
      <aside className="hidden md:flex flex-col justify-between w-20 lg:w-64 bg-md-surface-container-low border-r border-md-outline-variant/20 min-h-screen p-3 z-30 shrink-0 sticky top-0 h-screen">
        <div className="space-y-6">
          {/* Rail Header / Brand */}
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="w-10 h-10 rounded-2xl bg-md-primary flex items-center justify-center text-md-on-primary font-black shadow-md-1 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div className="hidden lg:block overflow-hidden">
              <h2 className="text-sm font-bold text-md-on-surface truncate tracking-tight">
                {shopName}
              </h2>
              <span className="text-[11px] font-medium text-md-on-surface-variant uppercase tracking-wider block">
                Mandi System
              </span>
            </div>
          </div>

          {/* Nav Items Column */}
          <nav className="flex flex-col gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={`group relative flex items-center gap-4 rounded-full transition-all duration-200 select-none cursor-pointer focus:outline-none ${
                    isActive
                      ? 'bg-md-secondary-container text-md-on-secondary-container font-bold shadow-sm'
                      : 'text-md-on-surface-variant hover:text-md-on-surface hover:bg-md-surface-container-high'
                  } p-3 lg:px-5 lg:py-3.5`}
                >
                  <div className="flex items-center justify-center w-6 h-6 shrink-0 mx-auto lg:mx-0">
                    <Icon className="w-5 h-5 transition-transform group-hover:scale-105" />
                  </div>
                  <span className="hidden lg:inline text-sm tracking-wide">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Rail Footer (Sync Status) */}
        <div className="p-2 border-t border-md-outline-variant/20 flex flex-col items-center lg:items-start gap-2">
          <SyncBadge />
        </div>
      </aside>

      {/* 2. Mobile MD3 Bottom Navigation Bar (Screen width < 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-md-surface-container/95 backdrop-blur-md border-t border-md-outline-variant/20 px-4 flex justify-around items-center z-40 shadow-md-2 pb-[env(safe-area-inset-bottom,0px)]">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className="flex flex-col items-center justify-center flex-1 py-1 focus:outline-none cursor-pointer select-none"
            >
              <div
                className={`flex items-center justify-center h-8 w-16 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-md-secondary-container text-md-on-secondary-container shadow-sm'
                    : 'text-md-on-surface-variant hover:bg-md-on-surface/[0.08]'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`text-[12px] tracking-wide mt-1 transition-all ${
                  isActive
                    ? 'font-bold text-md-on-surface'
                    : 'font-medium text-md-on-surface-variant'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
