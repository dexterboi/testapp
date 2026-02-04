import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getBooking } from '@/services/dataService';
import { approveModification, rejectModification, updateBookingStatus } from '@/services/bookingService';
import { Calendar, Clock, MapPin, User, AlertCircle, Check, X } from 'lucide-react';

interface BookingRequestModalProps {
    bookingId: string | null;
    type: string | null;
    onClose: () => void;
    onActionComplete: () => void;
}

export const BookingRequestModal: React.FC<BookingRequestModalProps> = ({ bookingId, type, onClose, onActionComplete }) => {
    const { t } = useTranslation();
    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (bookingId) {
            fetchBookingDetails();
        }
    }, [bookingId]);

    const fetchBookingDetails = async () => {
        if (!bookingId) return;
        setLoading(true);
        const data = await getBooking(bookingId);
        setBooking(data);
        setLoading(false);
    };

    const handleAction = async (action: 'approve' | 'reject') => {
        if (!booking) return;
        setProcessing(true);
        try {
            if (type === 'modification_request') {
                if (action === 'approve') await approveModification(booking.id);
                else await rejectModification(booking.id);
            } else if (type === 'new_booking') {
                if (action === 'approve') await updateBookingStatus(booking.id, 'approved');
                else await updateBookingStatus(booking.id, 'rejected');
            } else if (type === 'cancel_request') {
                if (action === 'approve') await updateBookingStatus(booking.id, 'cancelled');
                // Rejecting cancellation means keeping it active/approved? Or just ignoring?
                // Usually we just approve cancellation. Rejecting might mean "No, you can't cancel".
                // Let's assume reject means revert to approved.
                else await updateBookingStatus(booking.id, 'approved');
            }
            onActionComplete();
            onClose();
        } catch (error) {
            console.error('Error processing action:', error);
            alert(t('common.error_occurred'));
        } finally {
            setProcessing(false);
        }
    };

    if (!bookingId) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-app-surface w-full max-w-md rounded-[2rem] shadow-2xl border border-app-border overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-app-border flex justify-between items-center bg-app-surface-2/50">
                    <h2 className="text-lg font-black uppercase tracking-tight">
                        {type === 'modification_request' ? 'Modification Request' :
                            type === 'new_booking' ? 'New Booking Request' :
                                type === 'cancel_request' ? 'Cancellation Request' : 'Booking Details'}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-app-surface-2 transition-colors">
                        <X size={20} className="text-app-text-muted" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                        </div>
                    ) : booking ? (
                        <div className="space-y-6">
                            {/* Pitch Info */}
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-app-surface-2 rounded-xl flex items-center justify-center shrink-0">
                                    <MapPin size={24} className="text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg leading-tight">{booking.pitches?.name}</h3>
                                    <p className="text-xs text-app-text-muted font-medium">{booking.pitches?.complexes?.name}</p>
                                </div>
                            </div>

                            {/* User Info */}
                            <div className="flex items-center gap-3 p-3 bg-app-surface-2 rounded-xl">
                                <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                                    <User size={16} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold">{booking.user_profiles?.name || 'Guest User'}</p>
                                    <p className="text-[10px] text-app-text-muted">{booking.user_profiles?.phone || 'No phone'}</p>
                                </div>
                            </div>

                            {/* Request Details */}
                            {type === 'modification_request' && booking.modification_status === 'pending' ? (
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase mb-3">
                                        <AlertCircle size={14} />
                                        <span>Requested Changes</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-app-text-muted">New Date</span>
                                            <span className="font-bold">{new Date(booking.new_start_time).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-app-text-muted">New Time</span>
                                            <span className="font-bold">
                                                {new Date(booking.new_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                                {new Date(booking.new_end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-app-text-muted">New Price</span>
                                            <span className="font-bold text-primary">{booking.new_total_price} TND</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Calendar size={16} className="text-app-text-muted" />
                                        <span className="font-medium">{new Date(booking.start_time).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Clock size={16} className="text-app-text-muted" />
                                        <span className="font-medium">
                                            {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                            {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-app-text-muted text-xs font-bold uppercase tracking-wider">Price</span>
                                        <span className="font-bold text-primary">{booking.total_price} TND</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-app-text-muted">Booking not found</div>
                    )}
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-app-border bg-app-surface-2/30 flex gap-3">
                    <button
                        onClick={() => handleAction('reject')}
                        disabled={processing}
                        className="flex-1 py-3 rounded-xl bg-red-500/10 text-red-500 font-bold text-xs uppercase tracking-wider hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                        Reject
                    </button>
                    <button
                        onClick={() => handleAction('approve')}
                        disabled={processing}
                        className="flex-1 py-3 rounded-xl bg-primary text-black font-bold text-xs uppercase tracking-wider hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                        {processing ? 'Processing...' : 'Approve'}
                    </button>
                </div>
            </div>
        </div>
    );
};
