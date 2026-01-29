import React from 'react';
import { useNavigate } from 'react-router-dom';

export const TeamsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-full bg-app-surface-2 flex items-center justify-center text-slate-400 hover:text-white transition-all"
        >
          <span className="material-symbols-rounded text-xl">arrow_back_ios_new</span>
        </button>
        <h1 className="text-2xl font-black text-white tracking-tighter uppercase">
          Active Squads
        </h1>
      </div>

      <div className="bg-slate-900/50 rounded-[3rem] p-8 text-center border border-app-border">
        <span className="material-symbols-rounded text-6xl text-slate-500 mb-6">groups</span>
        <h2 className="text-xl font-black text-white mb-4 uppercase tracking-widest">
          Coming Soon
        </h2>
        <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.2em]">
          Teams and squads system under development
        </p>
        <p className="text-slate-600 text-xs mt-2">
          Manage your sports crews and team information
        </p>
      </div>
    </div>
  );
};
