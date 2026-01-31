import React from 'react';
import { useNavigate } from 'react-router-dom';

interface PreferencesPageProps {
  theme: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
}

export const PreferencesPage: React.FC<PreferencesPageProps> = ({ theme, onThemeChange }) => {
  const navigate = useNavigate();

  const themeOptions = [
    { id: 'light', label: 'Light', icon: 'light_mode' },
    { id: 'dark', label: 'Dark', icon: 'dark_mode' },
    { id: 'system', label: 'System', icon: 'settings_brightness' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-6 transition-colors duration-300">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-full bg-slate-200 dark:bg-app-surface-2 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
        >
          <span className="material-symbols-rounded text-xl">arrow_back_ios_new</span>
        </button>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
          Preferences
        </h1>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 px-2">
            Appearance
          </h2>
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-2 border border-slate-200 dark:border-app-border shadow-sm">
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onThemeChange(opt.id as any)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${theme === opt.id
                      ? 'bg-primary text-black shadow-lg shadow-primary/20'
                      : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400'
                    }`}
                >
                  <span className="material-symbols-rounded">{opt.icon}</span>
                  <span className="text-[10px] font-black uppercase tracking-wider">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-200/50 dark:bg-slate-900/50 rounded-[2.5rem] p-8 text-center border border-slate-200 dark:border-app-border">
          <span className="material-symbols-rounded text-6xl text-slate-300 dark:text-slate-700 mb-6">settings</span>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-widest">
            More Coming Soon
          </h2>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.1em]">
            Notification & Safety settings
          </p>
        </section>
      </div>
    </div>
  );
};
