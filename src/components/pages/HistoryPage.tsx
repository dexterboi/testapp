import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/services/supabase';
import { getUserBookings } from '@/services/dataService';
import { requestCancellation, cancelBooking } from '@/services/bookingService';
import { ConfirmationModal, SuccessModal } from '@/components/common/ConfirmationModal';
import { Calendar, Clock, MapPin, AlertCircle, CheckCircle, XCircle, Edit2, Trash2 } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'history' | 'cancelled'>('all');
  const [cancellingBooking, setCancellingBooking] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchBookings();

    // Subscribe to changes
    const bookingsSubscription = supabase
      .channel('public:history_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
        console.log('🔔 [History] Booking change detected:', payload);
        fetchBookings();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'booking_participants' }, (payload) => {
        console.log('🔔 [History] Participant change detected:', payload);
        fetchBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(bookingsSubscription);
    };
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const data = await getUserBookings(user.id, true);
      setBookings(data || []);
    }
    setLoading(false);
  };

  const handleCancelClick = (booking: any) => {
    setCancellingBooking(booking);
  };

  const confirmCancel = async () => {
    if (!cancellingBooking) return;
    try {
      // If pending, we can just cancel. If approved, we request cancellation.
      if (cancellingBooking.status === 'pending') {
        await cancelBooking(cancellingBooking.id);
        setSuccessMessage(t('booking.cancelled_success'));
      } else {
        await requestCancellation(cancellingBooking.id);
        setSuccessMessage(t('booking.cancellation_requested'));
      }
      setShowSuccessModal(true);
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert(t('common.error_occurred'));
    } finally {
      setCancellingBooking(null);
    }
  };

  const handleModifyClick = (booking: any) => {
    navigate(`/pitch/${booking.pitch_id}`, {
      state: {
        modifyingBooking: booking
      }
    });
  };

  const getFilteredBookings = () => {
    const now = new Date();
    return bookings.filter(b => {
      const endTime = new Date(b.end_time);
      const isPast = endTime < now;
      const isCancelled = ['cancelled', 'rejected', 'cancel_request'].includes(b.status);

      switch (filter) {
        case 'active':
          return !isPast && !isCancelled;
        case 'history':
          return isPast && !isCancelled;
        case 'cancelled':
          return isCancelled;
        default:
          return true;
      }
    });
  };

  const getStatusBadge = (booking: any) => {
    const status = booking.status;
    const endTime = new Date(booking.end_time);
    const isPast = endTime < new Date();

    // If user is a participant, show their status prioritized
    if (booking.is_participant) {
      if (booking.participant_status === 'invited') {
        return <span className="px-2 py-1 bg-amber-500/10 text-amber-500 rounded text-xs font-bold uppercase">MATCH INVITE</span>;
      }
      if (booking.participant_status === 'confirmed') {
        return <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded text-xs font-bold uppercase">PLAYING</span>;
      }
      if (booking.participant_status === 'declined') {
        return <span className="px-2 py-1 bg-red-500/10 text-red-500 rounded text-xs font-bold uppercase">DECLINED</span>;
      }
    }

    if (status === 'cancelled' || status === 'rejected') {
      return <span className="px-2 py-1 bg-red-500/10 text-red-500 rounded text-xs font-bold uppercase">{t('status.cancelled')}</span>;
    }
    if (status === 'cancel_request') {
      return <span className="px-2 py-1 bg-orange-500/10 text-orange-500 rounded text-xs font-bold uppercase">{t('status.cancellation_requested')}</span>;
    }
    if (isPast) {
      return <span className="px-2 py-1 bg-slate-500/10 text-slate-500 rounded text-xs font-bold uppercase">{t('status.completed')}</span>;
    }
    if (status === 'approved') {
      return <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded text-xs font-bold uppercase">{t('status.confirmed')}</span>;
    }
    if (status === 'pending') {
      return <span className="px-2 py-1 bg-amber-500/10 text-amber-500 rounded text-xs font-bold uppercase">{t('status.pending')}</span>;
    }
    return <span className="px-2 py-1 bg-slate-500/10 text-slate-500 rounded text-xs font-bold uppercase">{status}</span>;
  };

  const filteredBookings = getFilteredBookings();

  return (
    <div className="min-h-screen bg-app-bg text-app-text pb-20">
      <div className="p-6 pt-12 sticky top-0 bg-app-bg/95 backdrop-blur z-10 border-b border-app-border">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/profile')} className="p-2 rounded-full bg-app-surface hover:bg-app-surface-2 transition-colors">
            <span className="material-symbols-rounded">arrow_back</span>
          </button>
          <h1 className="text-2xl font-black uppercase tracking-tight">{t('profile.history')}</h1>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {['all', 'active', 'history', 'cancelled'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${filter === f
                ? 'bg-primary text-slate-950 shadow-lg shadow-primary/20'
                : 'bg-app-surface text-app-text-muted hover:bg-app-surface-2'
                }`}
            >
              {t(`filter.${f}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-4">
        {loading ? (
          <div className="text-center py-10 text-app-text-muted animate-pulse">Loading...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <Calendar size={48} className="mx-auto mb-4 text-app-text-muted" />
            <p className="font-bold">{t('common.no_results')}</p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-app-surface rounded-2xl p-4 border border-app-border shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg leading-tight mb-1">{booking.pitches?.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-app-text-muted">
                    <MapPin size={12} />
                    <span>{booking.pitches?.complexes?.name}</span>
                  </div>
                </div>
                {getStatusBadge(booking)}
              </div>

              <div className="flex gap-4 mb-4 text-sm">
                <div className="flex items-center gap-2 bg-app-bg px-3 py-2 rounded-lg">
                  <Calendar size={14} className="text-primary" />
                  <span className="font-medium">
                    {new Date(booking.start_time).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-app-bg px-3 py-2 rounded-lg">
                  <Clock size={14} className="text-primary" />
                  <span className="font-medium">
                    {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Actions for Active Bookings */}
              {filter !== 'history' && filter !== 'cancelled' && !['cancelled', 'rejected', 'completed'].includes(booking.status) && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-app-border">
                  {!booking.is_participant ? (
                    <>
                      <button
                        onClick={() => handleModifyClick(booking)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-app-surface-2 text-app-text font-bold text-xs uppercase tracking-wider hover:bg-app-border transition-colors"
                      >
                        <Edit2 size={14} />
                        {t('common.modify')}
                      </button>
                      <button
                        onClick={() => handleCancelClick(booking)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/10 text-red-500 font-bold text-xs uppercase tracking-wider hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 size={14} />
                        {t('common.cancel')}
                      </button>
                    </>
                  ) : (
                    booking.participant_status === 'invited' && (
                      <button
                        onClick={() => {
                          // Trigger the modal via App state would be best, but for now we can just use a simple alert/confirm or navigate
                          // Since the modal is in App.tsx and triggered by notifications, we might want a different trigger here
                          // For simplicity, let's just show a prompt
                          if (window.confirm("Ready to play? Confirm your attendance for this match.")) {
                            supabase.from('booking_participants')
                              .update({ status: 'confirmed' })
                              .eq('booking_id', booking.id)
                              .eq('user_id', (supabase.auth.getUser() as any).data?.user?.id) // This is a bit hacky, but fetchBookings will refresh it
                              .then(() => fetchBookings());
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-primary text-slate-950 font-black text-xs uppercase tracking-wider hover:brightness-110 transition-all"
                      >
                        <CheckCircle size={14} />
                        CONFIRM ATTENDANCE
                      </button>
                    )
                  )}
                </div>
              )}

              {/* Modification Status Badge */}
              {booking.modification_status === 'pending' && (
                <div className="mt-3 text-xs text-amber-500 font-bold flex items-center gap-1">
                  <AlertCircle size={12} />
                  Modification Pending
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <ConfirmationModal
        isOpen={!!cancellingBooking}
        onCancel={() => setCancellingBooking(null)}
        onConfirm={confirmCancel}
        title={t('booking.cancel_title')}
        message={t('booking.cancel_confirm')}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={t('common.success')}
        message={successMessage}
      />
    </div>
  );
};
