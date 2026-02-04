import React, { useState } from 'react';
import { Check, X, Clock, Calendar } from 'lucide-react';
import { supabase } from '@/services/supabase';

interface MatchConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookingId: string;
    onConfirm: () => void;
}

export const MatchConfirmationModal: React.FC<MatchConfirmationModalProps> = ({
    isOpen,
    onClose,
    bookingId,
    onConfirm
}) => {
    const [loading, setLoading] = useState(false);
    const [booking, setBooking] = React.useState<any>(null);

    React.useEffect(() => {
        if (isOpen && bookingId) {
            fetchBookingDetails();
        }
    }, [isOpen, bookingId]);

    const fetchBookingDetails = async () => {
        const { data, error } = await supabase
            .from('bookings')
            .select('*, pitches(name, complexes(name))')
            .eq('id', bookingId)
            .single();

        if (!error && data) {
            setBooking(data);
        }
    };

    const handleResponse = async (status: 'confirmed' | 'declined') => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Check if user is host or participant
            if (booking?.user_id === user.id) {
                // Host confirming their own match (redundant but possible)
                await supabase
                    .from('bookings')
                    .update({ status: status === 'confirmed' ? 'approved' : 'cancelled' })
                    .eq('id', bookingId);
            } else {
                // Participant confirming
                await supabase
                    .from('booking_participants')
                    .update({ status })
                    .eq('booking_id', bookingId)
                    .eq('user_id', user.id);
            }

            onConfirm();
            onClose();
        } catch (error) {
            console.error('Error responding to match:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-app-surface w-full max-w-sm rounded-[2.5rem] p-8 border border-white/10 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>

                <div className="flex justify-center mb-6">
                    <div className="bg-primary/20 p-4 rounded-full ring-8 ring-primary/5 animate-pulse">
                        <Clock className="text-primary w-10 h-10" />
                    </div>
                </div>

                <h2 className="text-2xl font-black text-center text-app-text mb-2 tracking-tight">READY TO PLAY?</h2>
                <p className="text-app-text-muted text-center text-xs font-bold uppercase tracking-widest mb-8">Match starts in 4 hours</p>

                {booking && (
                    <div className="bg-app-bg/50 rounded-2xl p-4 mb-8 border border-white/5">
                        <p className="font-black text-app-text text-sm mb-1 uppercase">{booking.pitches?.name}</p>
                        <div className="flex items-center gap-2 text-[10px] text-app-text-muted font-bold uppercase tracking-wider">
                            <Calendar size={12} />
                            <span>{new Date(booking.start_time).toLocaleDateString()} @ {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                )}

                <div className="flex gap-4">
                    <button
                        disabled={loading}
                        onClick={() => handleResponse('declined')}
                        className="flex-1 py-4 rounded-2xl bg-app-surface-2 border border-white/5 text-app-text-muted font-black text-xs uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-95 disabled:opacity-50"
                    >
                        NOT TODAY
                    </button>
                    <button
                        disabled={loading}
                        onClick={() => handleResponse('confirmed')}
                        className="flex-1 py-4 rounded-2xl bg-primary text-slate-950 font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 disabled:opacity-50"
                    >
                        I'M IN!
                    </button>
                </div>
            </div>
        </div>
    );
};
