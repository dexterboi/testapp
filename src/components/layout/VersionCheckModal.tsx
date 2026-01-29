import React from 'react';
import { Download, Rocket } from 'lucide-react';

interface VersionCheckModalProps {
    isOpen: boolean;
    latestVersion: string;
    releaseNotes: string;
    downloadUrl: string;
    onClose: () => void;
}

export const VersionCheckModal = ({ isOpen, latestVersion, releaseNotes, downloadUrl, onClose }: VersionCheckModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-sm bg-slate-900 border border-app-border rounded-[3rem] p-8 shadow-2xl shadow-primary/20 animate-in zoom-in-95 duration-500 relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse"></div>

                <div className="relative z-10 text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-primary/20">
                        <Rocket className="text-primary w-10 h-10" />
                    </div>

                    <h2 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase">Update Available!</h2>
                    <p className="text-primary text-xs font-black uppercase tracking-widest mb-6">Version {latestVersion}</p>

                    <div className="bg-app-surface-2 rounded-2xl p-4 mb-8 border border-app-border text-left">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">What's New:</p>
                        <p className="text-xs text-slate-300 font-medium leading-relaxed">{releaseNotes}</p>
                    </div>

                    <div className="space-y-3">
                        <a
                            href={downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-4.5 rounded-2xl bg-primary text-slate-950 font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-primary/20 active:scale-95 transition-all"
                        >
                            <Download size={16} />
                            Download Larena.apk
                        </a>

                        <button
                            onClick={onClose}
                            className="w-full py-4 rounded-2xl bg-app-surface-2 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-app-surface-2 transition-all"
                        >
                            Later
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
