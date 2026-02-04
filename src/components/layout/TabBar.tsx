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
    const hiddenRoutes = ['/pitch/', '/chat/', '/match/', '/team/', '/owner/bookings/', '/owner/pitches/'];
    if (hiddenRoutes.some(path => location.pathname.startsWith(path))) {
        return null;
    }

    return (
        <>
            <nav className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[92%] max-w-[380px] bg-[#1A1D1F]/95 backdrop-blur-xl rounded-[2rem] py-3 px-2 shadow-2xl z-50 flex items-center border border-white/10">
                <Link
                    to="/"
                    className={`flex items-center justify-center gap-2 rounded-full transition-all duration-300 whitespace-nowrap overflow-hidden ${isActive('/') ? 'bg-primary text-[#1A1D1F] flex-[1.5] py-2.5 px-4 shadow-lg shadow-primary/20' : 'flex-1 text-slate-400 hover:text-white py-2.5 px-3'}`}
                >
                    <span className="material-symbols-rounded text-xl shrink-0">home</span>
                    {isActive('/') && <span className="text-xs font-bold">Accueil</span>}
                </Link>

                <Link
                    to="/matches"
                    className={`flex items-center justify-center gap-2 rounded-full transition-all duration-300 whitespace-nowrap overflow-hidden ${isActive('/matches') ? 'bg-primary text-[#1A1D1F] flex-[1.5] py-2.5 px-4 shadow-lg shadow-primary/20' : 'flex-1 text-slate-400 hover:text-white py-2.5 px-3'}`}
                >
                    <span className="material-symbols-rounded text-xl shrink-0">sports_soccer</span>
                    {isActive('/matches') && <span className="text-xs font-bold">Matchs</span>}
                </Link>

                <Link
                    to="/crew"
                    className={`flex items-center justify-center gap-2 rounded-full transition-all duration-300 whitespace-nowrap overflow-hidden relative ${isActive('/crew') ? 'bg-primary text-[#1A1D1F] flex-[1.5] py-2.5 px-4 shadow-lg shadow-primary/20' : 'flex-1 text-slate-400 hover:text-white py-2.5 px-3'}`}
                >
                    <span className="material-symbols-rounded text-xl shrink-0">groups</span>
                    {isActive('/crew') && <span className="text-xs font-bold">Équipe</span>}
                    {pendingCount > 0 && (
                        <div className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-rose-500 rounded-full border-2 border-[#1A1D1F] flex items-center justify-center animate-pulse shadow-lg shadow-rose-500/50 z-10">
                            <span className="text-[8px] font-black text-white px-0.5">{pendingCount > 99 ? '99+' : pendingCount}</span>
                        </div>
                    )}
                </Link>

                <Link
                    to="/profile"
                    className={`flex items-center justify-center gap-2 rounded-full transition-all duration-300 whitespace-nowrap overflow-hidden ${isActive('/profile') ? 'bg-primary text-[#1A1D1F] flex-[1.5] py-2.5 px-4 shadow-lg shadow-primary/20' : 'flex-1 text-slate-400 hover:text-white py-2.5 px-3'}`}
                >
                    <span className="material-symbols-rounded text-xl shrink-0">person</span>
                    {isActive('/profile') && <span className="text-xs font-bold">Profil</span>}
                </Link>
            </nav>

            {/* Safe area spacer */}
            <div className="h-28 mb-safe bg-transparent"></div>
        </>
    );
};

export default TabBar;
