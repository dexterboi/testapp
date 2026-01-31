import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, X } from 'lucide-react';
import { supabase } from '@/services/supabase';
import { getUserBookings } from '@/services/dataService';
import { requestCancellation } from '@/services/bookingService';
import { getRelation } from '@/utils';
import { ConfirmationModal, SuccessModal } from '@/components/common/ConfirmationModal';

const UserBookingsPage = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState<any[]>([]);
    const [filter, setFilter] = useState('upcoming');
    const [loading, setLoading] = useState(true);
    const [cancellingBooking, setCancellingBooking] = useState<any>(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Fix for Mobile/Safari date parsing (SQL -> ISO)
    const safeDate = (dateInput: any): Date => {
        if (!dateInput) return new Date();
        if (dateInput instanceof Date) return dateInput;
        // Replace space with T for ISO 8601 compliance
        return new Date(dateInput.replace(' ', 'T'));
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
            setLoading(false);
            return;
        }
        const data = await getUserBookings(authUser.id);
        setBookings(data || []);
        setLoading(false);
    };

    const handleConfirmCancel = async () => {
        if (!cancellingBooking) return;
        setIsCancelling(true);
        try {
            await requestCancellation(cancellingBooking.id);
            setCancellingBooking(null);
            setIsCancelling(false);
            setShowSuccessModal(true);
            fetchBookings();
        } catch (error) {
            setIsCancelling(false);
            setErrorMessage('Failed to send cancel request.');
            setShowErrorModal(true);
        }
    };

    const getFilteredBookings = () => {
        const now = new Date();
        switch (filter) {
            case 'upcoming':
                return bookings.filter(b => {
                    const endTime = safeDate(b.end_time || b.start_time);
                    return endTime >= now && (['pending', 'approved', 'cancel_request'].includes(b.status) || (!b.status && b.access_code));
                });
            case 'past':
                return bookings.filter(b => safeDate(b.end_time || b.start_time) < now);
            case 'cancelled':
                return bookings.filter(b => b.status === 'cancelled' || b.status === 'rejected');
            default:
                return bookings;
        }
    };

    const filteredBookings = getFilteredBookings();

    const getStatusBadge = (booking: any) => {
        const isPast = safeDate(booking.start_time) < new Date();
        if (isPast && booking.status === 'approved') {
            return <span className="px-3 py-1 bg-app-surface text-app-text-muted rounded-lg text-[10px] font-black uppercase tracking-widest border border-app-border">Completed</span>;
        }
        switch (booking.status) {
            case 'pending': return <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-500/20 italic">Pending</span>;
            case 'approved': return <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest border border-primary/20 shadow-sm shadow-primary/5">Confirmed</span>;
            case 'cancel_request': return <span className="px-3 py-1 bg-orange-500/10 text-orange-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-orange-500/20 italic">Cancelling...</span>;
            default: return <span className="px-3 py-1 bg-app-surface text-app-text-muted rounded-lg text-[10px] font-black uppercase tracking-widest border border-app-border">{booking.status?.toUpperCase() || 'UNKNOWN'}</span>;
        }
    };

    return (
        <div className="min-h-screen bg-app-bg pb-[calc(8rem+env(safe-area-inset-bottom))] text-app-text transition-colors duration-300">
            <header className="px-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-6 sticky top-0 z-40 bg-app-bg/80 backdrop-blur-xl border-b border-app-border">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <p className="text-app-text-muted text-[10px] font-black uppercase tracking-[0.3em] mb-1 opacity-60">Activity Hub</p>
                        <h1 className="text-3xl font-black tracking-tighter text-app-text leading-none">My <span className="text-primary italic">Matches</span></h1>
                    </div>
                    <div className="w-12 h-12 bg-app-surface rounded-[1.2rem] flex items-center justify-center border border-app-border text-primary">
                        <span className="material-symbols-rounded text-2xl">confirmation_number</span>
                    </div>
                </div>

                <div className="flex gap-2 p-1 bg-app-surface-2 rounded-[1.2rem] border border-app-border overflow-x-auto no-scrollbar">
                    {[
                        { key: 'upcoming', label: 'Active', icon: 'bolt' },
                        { key: 'past', label: 'History', icon: 'history' },
                        { key: 'cancelled', label: 'Others', icon: 'close' }
                    ].map(({ key, label, icon }) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={`flex-1 min-w-[80px] flex items-center justify-center gap-2 py-2.5 rounded-[0.8rem] transition-all duration-300 ${filter === key
                                ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20'
                                : 'text-app-text-muted hover:text-app-text hover:bg-app-surface'
                                }`}
                        >
                            <span className={`material-symbols-rounded text-sm ${filter === key ? 'text-slate-900' : ''}`}>{icon}</span>
                            <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
                        </button>
                    ))}
                </div>
            </header>

            <div className="px-6 mt-4 space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {loading ? (
                    <div className="bg-app-surface p-16 rounded-[2.5rem] flex flex-col items-center justify-center border border-app-border">
                        <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full mb-4"></div>
                        <p className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.3em] animate-pulse">Loading...</p>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="bg-app-surface p-12 rounded-[2.5rem] text-center border border-app-border">
                        <span className="material-symbols-rounded text-4xl text-app-text-muted mb-4 opacity-20">sports_soccer</span>
                        <p className="text-app-text font-black text-lg tracking-tight uppercase mb-4">No Matches Found</p>
                        <button onClick={() => navigate('/')} className="bg-app-surface-2 hover:bg-app-surface-2/80 text-primary px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest transition-colors border border-app-border">Find a Pitch</button>
                    </div>
                ) : (
                    filteredBookings.map(booking => {
                        const pitch = getRelation(booking, 'pitches');
                        const complex = pitch ? getRelation(pitch, 'complexes') : null;
                        const startTime = safeDate(booking.start_time);
                        const hoursUntil = (startTime.getTime() - new Date().getTime()) / (1000 * 60 * 60);
                        const canCancel = !(safeDate(booking.start_time) < new Date()) &&
                            (booking.status === 'pending' || booking.status === 'approved') &&
                            hoursUntil >= 24;

                        return (
                            <div key={booking.id} className="bg-app-surface backdrop-blur-md p-5 rounded-[2rem] border border-app-border relative overflow-hidden group">
                                {/* Glow Effect */}
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-[40px] group-hover:bg-primary/10 transition-all duration-700"></div>

                                <div className="relative z-10">
                                    {/* Top Row: Date & Status */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-app-surface-2 p-2.5 rounded-xl border border-app-border text-primary">
                                                <span className="material-symbols-rounded text-lg">calendar_today</span>
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-black text-app-text uppercase leading-none mb-0.5">
                                                    {startTime.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </p>
                                                <p className="text-[10px] font-bold text-app-text-muted uppercase tracking-wide">
                                                    {startTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                </p>
                                            </div>
                                        </div>
                                        {getStatusBadge(booking)}
                                    </div>

                                    {/* Middle Row: Venue Info */}
                                    <div className="mb-4 pl-1">
                                        <p className="text-[9px] font-black text-app-text-muted uppercase tracking-widest mb-1 truncate">{complex?.name || 'Venue'}</p>
                                        <h3 className="font-black text-xl text-app-text tracking-tight truncate group-hover:text-primary transition-colors">{pitch?.name || 'Pro Pitch'}</h3>
                                    </div>

                                    {/* Bottom Row: Price & Actions */}
                                    <div className="flex items-center justify-between pt-4 border-t border-app-border">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-black text-app-text tracking-tight">{booking.total_price}</span>
                                            <span className="text-[9px] font-black text-app-text-muted uppercase tracking-widest ml-0.5">TND</span>
                                        </div>

                                        <div className="flex gap-2 items-center">
                                            {booking.status === 'approved' && (
                                                <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
                                                    <Zap size={12} className="text-primary" />
                                                    <span className="text-[10px] font-black text-primary tracking-widest font-mono">{booking.access_code}</span>
                                                </div>
                                            )}

                                            {canCancel && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setCancellingBooking(booking); }}
                                                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all"
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {cancellingBooking && (
                <ConfirmationModal
                    isOpen={true}
                    title="Cancel Match?"
                    message="Are you sure you want to request a cancellation? This action cannot be undone."
                    confirmText={isCancelling ? 'Processing...' : 'Confirm Cancel'}
                    onConfirm={handleConfirmCancel}
                    onCancel={() => setCancellingBooking(null)}
                    type="warning"
                />
            )}
            <SuccessModal isOpen={showSuccessModal} title="Request Sent" message="Cancellation request submitted to the venue owner." onClose={() => setShowSuccessModal(false)} />
            <SuccessModal isOpen={showErrorModal} title="Error" message={errorMessage} onClose={() => setShowErrorModal(false)} />
        </div>
    );
};

export default UserBookingsPage;
