import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
    show: boolean;
    debugMsg?: string;
}

export const SplashScreen = ({ show, debugMsg }: SplashScreenProps) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (!show) {
            const timer = setTimeout(() => setIsVisible(false), 500); // Wait for fade-out
            return () => clearTimeout(timer);
        }
    }, [show]);

    if (!isVisible) return null;

    return (
        <div
            className={`fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center transition-opacity duration-700 ease-in-out ${show ? 'opacity-100' : 'opacity-0'
                }`}
        >
            <div className="relative flex flex-col items-center">
                {/* Animated Arena Logo */}
                <div className="w-32 h-32 flex items-center justify-center mb-8 animate-bounce">
                    <img src="/assets/logo-v2.png" alt="Arena Logo" className="w-full h-full object-contain" />
                </div>

                {/* Brand Text */}
                <div className="flex flex-col items-center">
                    <div
                        className="flex items-center text-primary font-black text-5xl tracking-tighter animate-pulse uppercase"
                        style={{ fontFamily: "'Sakana', 'Plus Jakarta Sans', sans-serif" }}
                    >
                        Larena
                    </div>
                    <div className="mt-2 text-white/90 font-bold text-[10px] uppercase tracking-[0.5em]">
                        Tunisian Football Bookings
                    </div>
                </div>

                {/* Subtle Tagline */}
                <div className="mt-8 text-white/80 font-bold text-xs uppercase tracking-[0.3em] opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500 fill-mode-forwards text-center px-6">
                    {debugMsg || 'Your Game. Your Pitch.'}
                </div>
            </div>

            {/* Loading bar at the bottom */}
            <div className="absolute bottom-12 left-12 right-12 h-1 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-full origin-left animate-[loading_2.5s_ease-in-out_infinite]" />
            </div>

            <style>{`
        @keyframes loading {
          0% { transform: scaleX(0); }
          50% { transform: scaleX(0.7); }
          100% { transform: scaleX(1); }
        }
      `}</style>
        </div>
    );
};
