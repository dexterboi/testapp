import React from 'react';

const AdminPage = () => {
    return (
        <div className="p-6 bg-slate-950 min-h-screen pb-24 text-white">
            <h1 className="text-2xl font-black mb-6 text-white uppercase tracking-tighter italic">Venue Command</h1>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-app-border shadow-sm">
                    <p className="text-gray-500 text-xs uppercase font-bold mb-1">Daily Revenue</p>
                    <p className="text-2xl font-bold text-green-600">TND 1,240</p>
                    <p className="text-xs text-green-600 mt-1 flex items-center">▲ 12% vs last week</p>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-app-border shadow-sm">
                    <p className="text-gray-500 text-xs uppercase font-bold mb-1">Occupancy</p>
                    <p className="text-2xl font-bold text-blue-600">82%</p>
                    <p className="text-xs text-gray-400 mt-1">4 slots remaining</p>
                </div>
            </div>

            <div className="bg-slate-900/50 rounded-2xl border border-app-border shadow-sm overflow-hidden mb-6">
                <div className="p-4 border-b border-app-border flex justify-between items-center">
                    <h3 className="font-black text-xs text-white uppercase tracking-widest">Dynamic Pricing Engine</h3>
                    <div className="bg-primary/10 text-primary px-2 py-1 rounded-full text-[9px] font-black uppercase">ACTIVE</div>
                </div>
                <div className="p-4 text-sm">
                    <div className="flex justify-between py-2 border-b border-app-border">
                        <span className="text-slate-400 font-bold text-xs uppercase tracking-tight">Rain Protocol</span>
                        <span className="font-black text-primary">-10%</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-app-border">
                        <span className="text-slate-400 font-bold text-xs uppercase tracking-tight">Peak Surcharge</span>
                        <span className="font-black text-primary">+15%</span>
                    </div>
                    <div className="flex justify-between py-2">
                        <span className="text-slate-400 font-bold text-xs uppercase tracking-tight">Last Minute</span>
                        <span className="font-black text-rose-500">-25%</span>
                    </div>
                </div>
            </div>

            <button className="w-full bg-app-surface-2 border border-app-border text-slate-300 font-black py-4 rounded-2xl mb-4 text-[11px] uppercase tracking-widest hover:bg-app-surface-2 transition-all italic">Manage Block Bookings</button>
            <button className="w-full bg-rose-500/10 border border-rose-500/20 text-rose-500 font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest hover:bg-rose-500/20 transition-all italic">Maintenance Mode</button>
        </div>
    );
};

export default AdminPage;
