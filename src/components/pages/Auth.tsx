import React, { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App as CapApp } from '@capacitor/app';

interface AuthProps {
    onSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isOAuthLoading, setIsOAuthLoading] = useState(false);
    const [error, setError] = useState('');
    const [showEmailSent, setShowEmailSent] = useState(false);

    const handleManualAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (isLogin) {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) throw error;
            } else {
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/#/email-confirmed`,
                        data: {
                            name,
                            role: 'player'
                        }
                    }
                });

                if (signUpError) throw signUpError;

                if (data.user && !data.user.confirmed_at) {
                    setShowEmailSent(true);
                    setIsLoading(false);
                    return;
                }
            }

            await new Promise(resolve => setTimeout(resolve, 100));
            onSuccess();
        } catch (err: any) {
            console.error('❌ Auth error:', err);
            setError(err.message || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendEmail = async () => {
        setIsLoading(true);
        setError('');
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email,
            });
            if (error) throw error;
            alert('Verification email sent! Please check your inbox.');
        } catch (err: any) {
            setError(err.message || 'Failed to resend email');
        } finally {
            setIsLoading(false);
        }
    };


    // Fix "Loading Forever" - Reset state when app returns to foreground
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        const listener = CapApp.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
                console.log('📱 [Auth] App resumed, resetting loading states...');
                setIsOAuthLoading(false);
                setIsLoading(false);
            }
        });

        return () => {
            listener.then(h => h.remove());
        };
    }, []);

    const handleOAuth = async () => {
        setIsOAuthLoading(true);
        setError('');

        // Safety timeout: reset loading if nothing happens for 20s
        const timeout = setTimeout(() => {
            setIsOAuthLoading(false);
        }, 20000);

        try {
            console.log('🔐 [OAuth] Starting Google OAuth...');
            const isNative = Capacitor.isNativePlatform();

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    skipBrowserRedirect: isNative,
                    redirectTo: isNative
                        ? 'com.pitchperfect.app://oauth-callback'
                        : window.location.origin
                }
            });

            if (error) {
                clearTimeout(timeout);
                throw error;
            }

            if (isNative && data?.url) {
                console.log('🌐 [OAuth] Opening in-app browser overlay...');
                await Browser.open({
                    url: data.url,
                    presentationStyle: 'popover',
                    windowName: '_self'
                });
            } else if (!isNative) {
                clearTimeout(timeout);
            }
        } catch (err: any) {
            clearTimeout(timeout);
            console.error('❌ [OAuth] OAuth error:', err);
            setError(`OAuth with Google failed: ${err.message}`);
            setIsOAuthLoading(false);
        }
    };

    if (showEmailSent) {
        return (
            <div className="flex flex-col items-center justify-center p-8 md:p-10 bg-transparent rounded-[3.5rem] w-full max-w-md mx-auto font-sans animate-in fade-in zoom-in duration-500">
                <div className="bg-primary/10 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-primary/20">
                    <span className="material-symbols-rounded text-5xl text-primary">mark_email_unread</span>
                </div>
                <h2 className="text-3xl font-black text-app-text mb-3 text-center tracking-tighter uppercase leading-none">Squad Check! 📧</h2>
                <p className="text-app-text-muted text-[11px] font-bold text-center mb-8 leading-relaxed uppercase tracking-widest">
                    We've sent a verification link to <br /><span className="text-app-text bg-app-surface/50 px-2 py-0.5 rounded-md">{email}</span>
                </p>
                <div className="bg-app-surface border border-app-border rounded-[2rem] p-6 mb-8 w-full">
                    <p className="text-[10px] text-app-text-muted text-center font-black uppercase tracking-widest leading-relaxed">
                        💡 PRO TIP: Check your spam folder if you don't see the email within 60 seconds.
                    </p>
                </div>
                <button
                    onClick={handleResendEmail}
                    disabled={isLoading}
                    className="w-full bg-app-surface text-app-text font-black text-[11px] uppercase tracking-[0.2em] py-5.5 rounded-[1.8rem] hover:opacity-90 border border-app-border transition-all mb-4 disabled:opacity-50 active:scale-95 shadow-xl"
                >
                    {isLoading ? 'Sending...' : 'Resend Verification'}
                </button>
                <button
                    onClick={() => setShowEmailSent(false)}
                    className="text-[10px] text-primary font-black uppercase tracking-widest hover:underline py-2"
                >
                    ← Back to Login
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-7 md:p-10 bg-transparent w-[calc(100%-2rem)] max-w-md mx-auto font-sans animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="mb-10 text-center w-full">
                <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="w-16 h-16 flex items-center justify-center">
                        <img src="/assets/logo-v2.png" alt="Arena Logo" className="w-full h-full object-contain" />
                    </div>
                    <span
                        className="text-3xl font-black text-primary tracking-tighter uppercase"
                        style={{ fontFamily: "'Sakana', 'Plus Jakarta Sans', sans-serif" }}
                    >
                        Larena
                    </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-app-text mb-3 tracking-tighter uppercase leading-none">
                    {isLogin ? 'Welcome Back' : 'Join the Squad'}
                </h2>
                <p className="text-app-text-muted text-[10px] font-black uppercase tracking-[0.3em] opacity-60">
                    {isLogin ? 'Enter the arena to play' : 'Build your legacy on the pitch'}
                </p>
            </div>

            {/* Premium Tabs */}
            <div className="flex bg-app-surface p-1.5 rounded-[2.2rem] mb-10 w-full border border-app-border">
                <button
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 py-4 text-[11px] font-black uppercase tracking-[0.2em] rounded-[1.8rem] transition-all duration-300 ${isLogin ? 'bg-primary shadow-xl shadow-primary/20 text-slate-950 translate-z-10' : 'text-app-text-muted hover:text-app-text'
                        }`}
                >
                    Login
                </button>
                <button
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 py-4 text-[11px] font-black uppercase tracking-[0.2em] rounded-[1.8rem] transition-all duration-300 ${!isLogin ? 'bg-primary shadow-xl shadow-primary/20 text-slate-950 translate-z-10' : 'text-app-text-muted hover:text-app-text'
                        }`}
                >
                    Register
                </button>
            </div>

            {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-5 rounded-3xl text-[10px] w-full mb-8 font-black uppercase tracking-widest flex items-center shadow-inner leading-relaxed">
                    <span className="material-symbols-rounded text-xl mr-4 shrink-0">error</span> {error}
                </div>
            )}

            <form onSubmit={handleManualAuth} className="w-full space-y-5">
                {!isLogin && (
                    <div className="relative group">
                        <span className="material-symbols-rounded absolute left-5 top-1/2 -translate-y-1/2 text-app-text-muted group-focus-within:text-primary transition-all duration-300 group-focus-within:scale-110">person</span>
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-app-surface py-5 pl-14 pr-8 rounded-[1.8rem] text-[14px] font-bold text-app-text focus:outline-none focus:ring-2 focus:ring-primary/20 border border-app-border placeholder:text-app-text-muted transition-all font-sans"
                            required
                        />
                    </div>
                )}
                <div className="relative group">
                    <span className="material-symbols-rounded absolute left-5 top-1/2 -translate-y-1/2 text-app-text-muted group-focus-within:text-primary transition-all duration-300 group-focus-within:scale-110">mail</span>
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-app-surface-2 py-5 pl-14 pr-8 rounded-[1.8rem] text-[14px] font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/20 border border-app-border placeholder:text-slate-600 transition-all font-sans"
                        required
                    />
                </div>
                <div className="relative group">
                    <span className="material-symbols-rounded absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-primary transition-all duration-300 group-focus-within:scale-110">lock</span>
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-app-surface-2 py-5 pl-14 pr-8 rounded-[1.8rem] text-[14px] font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/20 border border-app-border placeholder:text-slate-600 transition-all font-sans"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary text-slate-950 font-black text-[12px] uppercase tracking-[0.3em] py-5.5 rounded-[2rem] shadow-2xl shadow-primary/30 flex items-center justify-center gap-4 group transition-all duration-300 active:scale-[0.98] disabled:opacity-50 mt-10 hover:brightness-110"
                >
                    {isLoading ? (
                        <div className="animate-spin h-6 w-6 border-3 border-slate-950 border-t-transparent rounded-full" />
                    ) : (
                        <>
                            {isLogin ? 'Enter Arena' : 'Join Squad'}
                            <span className="material-symbols-rounded text-2xl group-hover:translate-x-1.5 transition-transform">arrow_forward</span>
                        </>
                    )}
                </button>
            </form>

            <div className="my-10 flex items-center w-full">
                <div className="flex-1 h-[1px] bg-app-border"></div>
                <span className="px-6 text-[9px] text-app-text-muted font-black uppercase tracking-[0.4em]">Social link</span>
                <div className="flex-1 h-[1px] bg-app-border"></div>
            </div>

            <div className="w-full">
                <button
                    onClick={() => handleOAuth()}
                    disabled={isOAuthLoading}
                    className="w-full flex items-center justify-center gap-5 py-5 border border-app-border bg-app-surface rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] text-app-text hover:opacity-90 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                    {isOAuthLoading ? (
                        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                    ) : (
                        <>
                            <img src="https://www.google.com/favicon.ico" className="w-5 h-5 grayscale group-hover:grayscale-0 transition-all" alt="Google" />
                            Continue with Google
                        </>
                    )}
                </button>
            </div>

            <p className="mt-10 text-[9px] text-slate-600 font-bold text-center uppercase tracking-[0.2em] leading-loose opacity-60">
                Play responsibly. View our <span className="text-slate-400 underline">Terms</span> and <span className="text-slate-400 underline">Privacy</span>.
            </p>
        </div>
    );
};
