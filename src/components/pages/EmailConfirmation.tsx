import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface EmailConfirmationProps {
    status: 'verifying' | 'success' | 'error';
    message?: string;
}

export const EmailConfirmation: React.FC<EmailConfirmationProps> = ({ status, message }) => {
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
        <div className="min-h-screen bg-background-light flex items-center justify-center p-8 font-sans">
            <div className="bg-white rounded-[4rem] shadow-2xl p-10 max-w-md w-full text-center border border-slate-50 overflow-hidden relative">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                {status === 'verifying' && (
                    <div className="relative z-10 animate-in fade-in zoom-in-95 duration-500">
                        <div className="bg-slate-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 relative">
                            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-[2.5rem] animate-spin"></div>
                            <span className="material-symbols-rounded text-4xl text-slate-300">hourglass_empty</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter uppercase">Verifying</h2>
                        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest leading-relaxed">Securing your identity... Please wait a moment.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="relative z-10 animate-in fade-in zoom-in-95 duration-500">
                        <div className="bg-primary w-24 h-24 rounded-[3rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/20 animate-bounce-short">
                            <span className="material-symbols-rounded text-5xl text-slate-900 font-bold">verified</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tighter uppercase">Goal Reached! 🎉</h2>
                        <p className="text-slate-500 text-[13px] font-bold leading-relaxed mb-8">
                            Your email is confirmed. Your Larena journey officially starts now.
                        </p>
                        <div className="bg-slate-50 rounded-[2rem] p-5 mb-8 border border-slate-100 group">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] group-hover:text-primary-dark transition-colors">
                                Redirecting to Pitch in <span className="text-slate-900 text-lg tabular-nums mx-1">{countdown}</span> s
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full bg-slate-900 text-white font-black py-5 rounded-[1.8rem] shadow-2xl shadow-slate-900/20 hover:bg-black transition-all active:scale-95 text-[11px] uppercase tracking-[0.2em]"
                        >
                            Enter Arena
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="relative z-10 animate-in fade-in zoom-in-95 duration-500">
                        <div className="bg-rose-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border-2 border-rose-100">
                            <span className="material-symbols-rounded text-5xl text-rose-500">report</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tighter uppercase">Timeout</h2>
                        <p className="text-slate-400 text-[13px] font-bold leading-relaxed mb-8">
                            {message || 'The verification link has expired or is invalid. Please try signing in again.'}
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full bg-slate-900 text-white font-black py-5 rounded-[1.8rem] shadow-2xl shadow-slate-900/10 hover:bg-black transition-all active:scale-95 text-[11px] uppercase tracking-[0.2em]"
                        >
                            Back to Base
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
