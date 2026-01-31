import { Download, Rocket, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface VersionCheckModalProps {
    isOpen: boolean;
    latestVersion: string;
    releaseNotes: string;
    downloadUrl: string;
    onClose: () => void;
}

export const VersionCheckModal = ({ isOpen, latestVersion, releaseNotes, downloadUrl, onClose }: VersionCheckModalProps) => {
    const { t } = useTranslation();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="absolute inset-0" onClick={onClose} />
            <div className="w-full max-w-sm bg-app-surface border border-app-border rounded-[3rem] p-8 shadow-2xl animate-in zoom-in-95 duration-500 relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse"></div>

                <div className="relative z-10 text-center">
                    <button
                        onClick={onClose}
                        className="absolute -top-2 -right-2 w-10 h-10 flex items-center justify-center bg-app-surface border border-app-border rounded-full text-app-text-muted active:scale-90 transition-all z-20"
                    >
                        <X size={18} />
                    </button>

                    <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-primary/20 shadow-inner">
                        <Rocket className="text-primary w-10 h-10" />
                    </div>

                    <h2 className="text-2xl font-black text-app-text mb-2 tracking-tighter uppercase">{t('update.available')}</h2>
                    <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-8 bg-primary/5 py-1.5 px-4 rounded-full inline-block border border-primary/10">
                        {t('update.version')} {latestVersion}
                    </p>

                    <div className="bg-app-bg/50 rounded-3xl p-5 mb-8 border border-app-border text-left backdrop-blur-sm">
                        <p className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="w-1 h-1 bg-primary rounded-full"></span>
                            {t('update.whats_new')}
                        </p>
                        <p className="text-xs text-app-text font-bold leading-relaxed">{releaseNotes}</p>
                    </div>

                    <div className="space-y-4">
                        <a
                            href={downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-5 rounded-2xl bg-primary text-slate-950 font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-primary/30 active:scale-95 transition-all hover:brightness-105"
                        >
                            <Download size={18} />
                            {t('update.download')}
                        </a>

                        <button
                            onClick={onClose}
                            className="w-full py-4 rounded-2xl bg-app-surface text-app-text-muted font-black text-[10px] uppercase tracking-widest hover:text-app-text transition-all active:scale-95"
                        >
                            {t('update.later')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
