import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface EmailConfirmationProps {
    status: 'verifying' | 'success' | 'error';
    message?: string;
}

export const EmailConfirmation: React.FC<EmailConfirmationProps> = ({ status, message }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        if (status === 'success') {
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        navigate('/');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [status, navigate]);

    return (
        <div className="min-h-screen bg-app-bg flex items-center justify-center p-8 font-sans">
            <div className="bg-app-surface rounded-[4rem] shadow-2xl p-10 max-w-md w-full text-center border border-app-border overflow-hidden relative">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                {status === 'verifying' && (
                    <div className="relative z-10 animate-in fade-in zoom-in-95 duration-500">
                        <div className="bg-app-surface-2 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 relative">
                            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-[2.5rem] animate-spin"></div>
                            <span className="material-symbols-rounded text-4xl text-app-text-muted">hourglass_empty</span>
                        </div>
                        <h2 className="text-3xl font-black text-app-text mb-2 tracking-tighter uppercase">{t('auth.verifying')}</h2>
                        <p className="text-app-text-muted text-[11px] font-bold uppercase tracking-widest leading-relaxed">{t('auth.securing_identity')}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="relative z-10 animate-in fade-in zoom-in-95 duration-500">
                        <div className="bg-primary w-24 h-24 rounded-[3rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/20 animate-bounce-short">
                            <span className="material-symbols-rounded text-5xl text-slate-900 font-bold">verified</span>
                        </div>
                        <h2 className="text-3xl font-black text-app-text mb-3 tracking-tighter uppercase">{t('auth.goal_reached')}</h2>
                        <p className="text-app-text-muted text-[13px] font-bold leading-relaxed mb-8">
                            {t('auth.email_confirmed_sub')}
                        </p>
                        <div className="bg-app-surface-2 rounded-[2rem] p-5 mb-8 border border-app-border group">
                            <p className="text-[10px] text-app-text-muted font-black uppercase tracking-[0.2em] group-hover:text-primary transition-colors">
                                {t('auth.redirecting_to_pitch')} <span className="text-app-text text-lg tabular-nums mx-1">{countdown}</span> s
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full bg-primary text-slate-950 font-black py-5 rounded-[1.8rem] shadow-2xl shadow-primary/20 hover:brightness-110 transition-all active:scale-95 text-[11px] uppercase tracking-[0.2em]"
                        >
                            {t('auth.enter_arena_btn')}
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="relative z-10 animate-in fade-in zoom-in-95 duration-500">
                        <div className="bg-rose-500/10 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border-2 border-rose-500/20">
                            <span className="material-symbols-rounded text-5xl text-rose-500">report</span>
                        </div>
                        <h2 className="text-3xl font-black text-app-text mb-3 tracking-tighter uppercase">{t('auth.timeout_title')}</h2>
                        <p className="text-app-text-muted text-[13px] font-bold leading-relaxed mb-8">
                            {message || t('auth.verification_failed')}
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full bg-app-surface text-app-text font-black py-5 rounded-[1.8rem] shadow-2xl shadow-black/10 hover:bg-app-surface-2 transition-all active:scale-95 text-[11px] uppercase tracking-[0.2em] border border-app-border"
                        >
                            {t('auth.back_to_base')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export const EmailConfirmationPage: React.FC = () => {
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState<string>('');

    useEffect(() => {
        const hash = window.location.hash;

        if (hash.includes('type=signup')) {
            setStatus('success');
        } else if (hash.includes('error')) {
            setStatus('error');
            const errorMatch = hash.match(/error_description=([^&]*)/);
            if (errorMatch) {
                setMessage(decodeURIComponent(errorMatch[1]));
            }
        } else {
            setTimeout(() => setStatus('success'), 1500);
        }
    }, []);

    return <EmailConfirmation status={status} message={message} />;
};
