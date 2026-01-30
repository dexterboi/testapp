import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface TabBarProps {
    pendingCount: number;
}

const TabBar = ({ pendingCount }: TabBarProps) => {
    const location = useLocation();
    const { t } = useTranslation();

    const isActive = (path: string) =>
        location.pathname === path;

    // Hide TabBar on detail pages and chat to prioritize actionable buttons (like "Book Now" or "Send")
    const hiddenRoutes = ['/pitch/', '/chat/', '/lobby/', '/team/', '/owner/bookings/', '/owner/pitches/'];
    if (hiddenRoutes.some(path => location.pathname.startsWith(path))) {
        return null;
    }

    return (
        <>
            <nav className="fixed bottom-[calc(2rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[92%] max-w-[420px] bg-app-surface/90 backdrop-blur-2xl rounded-[2.5rem] py-2 px-1.5 shadow-xl dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] z-50 flex justify-around items-center border border-app-border transition-colors duration-300">
                <Link
                    to="/"
                    className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full transition-all duration-300 relative group ${isActive('/') ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20 flex-[1.4]' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white flex-1'}`}
                >
                    <span className={`material-symbols-rounded text-[22px] ${isActive('/') ? 'fill-1' : ''}`}>home</span>
                    {isActive('/') && <span className="text-[9px] font-black uppercase tracking-widest animate-in fade-in zoom-in duration-300">{t('tabs.home')}</span>}
                    {!isActive('/') && <div className="absolute -top-1.5 w-1 h-1 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />}
                </Link>

                <Link
                    to="/spaces"
                    className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full transition-all duration-300 relative group ${isActive('/spaces') ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20 flex-[1.4]' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white flex-1'}`}
                >
                    <span className={`material-symbols-rounded text-[22px] ${isActive('/spaces') ? 'fill-1' : ''}`}>stadium</span>
                    {isActive('/spaces') && <span className="text-[9px] font-black uppercase tracking-widest animate-in fade-in zoom-in duration-300">{t('tabs.spaces')}</span>}
                    {!isActive('/spaces') && <div className="absolute -top-1.5 w-1 h-1 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />}
                </Link>

                <Link
                    to="/social"
                    className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full transition-all duration-300 relative group ${isActive('/social') ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20 flex-[1.4]' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white flex-1'}`}
                >
                    <div className="relative">
                        <span className={`material-symbols-rounded text-[22px] ${isActive('/social') ? 'fill-1' : ''}`}>groups</span>
                        {pendingCount > 0 && (
                            <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center animate-pulse shadow-lg shadow-rose-500/50 z-10">
                                <span className="text-[9px] font-black text-white px-0.5">{pendingCount > 99 ? '99+' : pendingCount}</span>
                            </div>
                        )}
                    </div>
                    {isActive('/social') && <span className="text-[9px] font-black uppercase tracking-widest animate-in fade-in zoom-in duration-300">{t('tabs.crew')}</span>}
                    {!isActive('/social') && <div className="absolute -top-1.5 w-1 h-1 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />}
                </Link>

                <Link
                    to="/profile"
                    className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full transition-all duration-300 relative group ${isActive('/profile') ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20 flex-[1.4]' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white flex-1'}`}
                >
                    <span className={`material-symbols-rounded text-[22px] ${isActive('/profile') ? 'fill-1' : ''}`}>person</span>
                    {isActive('/profile') && <span className="text-[9px] font-black uppercase tracking-widest animate-in fade-in zoom-in duration-300">{t('tabs.profile')}</span>}
                    {!isActive('/profile') && <div className="absolute -top-1.5 w-1 h-1 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />}
                </Link>
            </nav>

            {/* Safe area spacer */}
            <div className="h-32 mb-safe bg-transparent"></div>
        </>
    );
};

export default TabBar;
