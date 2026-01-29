import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import { getComplexStatistics, getComplexBookings, updateBookingStatus, cancelBooking } from '@/services/bookingService';
import { ConfirmationModal, SuccessModal } from '@/components/common/ConfirmationModal';

export const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [complexes, setComplexes] = useState<any[]>([]);
  const [selectedComplex, setSelectedComplex] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOwnerComplexes();
  }, []);

  useEffect(() => {
    if (selectedComplex) {
      fetchStatistics();
    }
  }, [selectedComplex]);

  const fetchOwnerComplexes = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setLoading(false);
        return;
      }

      const { data: records, error } = await supabase
        .from('complexes')
        .select('*')
        .eq('owner_id', authUser.id);

      if (error) throw error;

      setComplexes(records || []);
      if (records && records.length > 0) {
        setSelectedComplex(records[0]);
      }
    } catch (error) {
      console.error('Error fetching complexes:', error);
    }
    setLoading(false);
  };

  const fetchStatistics = async () => {
    if (!selectedComplex) return;
    const data = await getComplexStatistics(selectedComplex.id);
    setStats(data);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStatistics();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 px-8 text-center">
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-primary/10 rounded-[2rem] border border-primary/20 flex items-center justify-center animate-pulse">
            <span className="material-symbols-rounded text-4xl text-primary font-black">robot_2</span>
          </div>
          <div className="absolute -inset-4 border-2 border-primary/20 border-dashed rounded-full animate-spin-slow"></div>
        </div>
        <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2 italic">Syncing Hub</h3>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Connecting to Command Center</p>
      </div>
    );
  }

  if (complexes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-8 text-center">
        <div className="max-w-xs">
          <div className="bg-app-surface-2 w-24 h-24 rounded-[3rem] flex items-center justify-center mx-auto mb-8 border border-app-border">
            <span className="material-symbols-rounded text-5xl text-slate-700">storefront</span>
          </div>
          <h2 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase">No Venue Found</h2>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-8">You don't own any active venues in our system yet.</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-primary text-slate-900 px-8 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 active:scale-95 transition-all"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-[calc(8rem+env(safe-area-inset-bottom))] font-sans relative overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
      <div className="absolute top-[-100px] right-[-100px] w-80 h-80 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 px-6 pt-[calc(5rem+env(safe-area-inset-top))] pb-8">
        {/* Date and Welcome */}
        <div className="mb-6">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter mb-1">
                Welcome, <span className="text-primary italic">Pitch Owner</span>
              </h1>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-12 h-12 flex items-center justify-center bg-app-surface-2 rounded-full text-white hover:bg-app-surface-2 transition-all border border-app-border"
            >
              <span className={`material-symbols-rounded text-xl ${refreshing ? 'animate-spin' : ''}`}>sync</span>
            </button>
          </div>
        </div>

        {/* Complex Selector - Show if multiple complexes */}
        {complexes.length > 1 && (
          <div className="mb-6">
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
              {complexes.map(complex => (
                <button
                  key={complex.id}
                  onClick={() => setSelectedComplex(complex)}
                  className={`flex-shrink-0 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                    selectedComplex?.id === complex.id
                      ? 'bg-primary text-slate-950 shadow-lg shadow-primary/20'
                      : 'bg-app-surface-2 text-slate-400 hover:bg-app-surface-2'
                  }`}
                >
                  {complex.Name || complex.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Statistics Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
            <h2 className="text-[11px] font-black text-white uppercase tracking-widest">STATISTICS</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {/* Total Revenue Card */}
            <div className="flex-shrink-0 w-[280px] bg-slate-900/60 rounded-3xl p-6 border border-app-border">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                  <span className="material-symbols-rounded text-2xl text-primary">account_balance_wallet</span>
                </div>
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">+12%</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Revenue</p>
              <p className="text-2xl font-black text-white tracking-tight mb-3">
                {stats?.totalRevenue ? `${stats.totalRevenue.toLocaleString()}` : '0'} <span className="text-xs text-slate-500">TND</span>
              </p>
              <div className="h-1 bg-primary/20 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>

            {/* Monthly Revenue Card */}
            <div className="flex-shrink-0 w-[280px] bg-slate-900/60 rounded-3xl p-6 border border-app-border">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                  <span className="material-symbols-rounded text-2xl text-primary">trending_up</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">This Month</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Monthly Revenue</p>
              <p className="text-2xl font-black text-white tracking-tight mb-3">
                {stats?.thisMonth?.revenue ? `${stats.thisMonth.revenue.toLocaleString()}` : '0'} <span className="text-xs text-slate-500">TND</span>
              </p>
              <div className="h-1 bg-primary/20 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>

            {/* Bookings Week Card */}
            <div className="flex-shrink-0 w-[280px] bg-slate-900/60 rounded-3xl p-6 border border-app-border">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                  <span className="material-symbols-rounded text-2xl text-primary">calendar_month</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Today</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Bookings Week</p>
              <p className="text-2xl font-black text-white tracking-tight mb-3">
                {stats?.thisMonth?.bookings || 0}
              </p>
              <div className="h-1 bg-primary/20 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>

            {/* Pending Requests Card */}
            <div className="flex-shrink-0 w-[280px] bg-slate-900/60 rounded-3xl p-6 border border-app-border">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
                  <span className="material-symbols-rounded text-2xl text-amber-400">notification_important</span>
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Pending Requests</p>
              <p className="text-2xl font-black text-white tracking-tight mb-3">
                {stats?.pending || 0}
              </p>
              <div className="h-1 bg-amber-500/20 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: stats?.pending ? '30%' : '0%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Bookings Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              <h2 className="text-[11px] font-black text-white uppercase tracking-widest">RECENT BOOKINGS</h2>
            </div>
            <button
              onClick={() => navigate(`/owner/bookings/${selectedComplex?.id}`)}
              className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-primary transition-colors"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            <PendingBookingsList complexId={selectedComplex?.id} onUpdate={fetchStatistics} />
          </div>
        </div>

        {/* Venue Settings Grid */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
            <h2 className="text-[11px] font-black text-white uppercase tracking-widest">VENUE SETTINGS</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate(`/owner/bookings/${selectedComplex?.id}`)}
              className="bg-slate-900/60 rounded-3xl p-6 border border-app-border text-left group hover:bg-slate-900 transition-all"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-rounded text-2xl text-primary">history</span>
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">Timeline</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Full Ledger</p>
            </button>

            <button
              onClick={() => navigate(`/owner/pitches/${selectedComplex?.id}`)}
              className="bg-slate-900/60 rounded-3xl p-6 border border-app-border text-left group hover:bg-slate-900 transition-all"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-rounded text-2xl text-primary">tune</span>
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">Settings</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configuration</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PendingBookingsList = ({ complexId, onUpdate }: { complexId: string; onUpdate: () => void }) => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingBooking, setCancellingBooking] = useState<any>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (complexId) {
      fetchBookings();
    }
  }, [complexId]);

  const fetchBookings = async () => {
    setLoading(true);
    const pendingData = await getComplexBookings(complexId, 'pending');
    const cancelRequestData = await getComplexBookings(complexId, 'cancel_request');
    const allData = [...pendingData, ...cancelRequestData].slice(0, 5);
    setBookings(allData);
    setLoading(false);
    onUpdate();
  };

  const handleApprove = async (bookingId: string) => {
    try {
      await updateBookingStatus(bookingId, 'approved');
      fetchBookings();
    } catch (error) {
      setErrorMessage('Failed to approve booking.');
      setShowErrorModal(true);
    }
  };

  const handleReject = async (bookingId: string) => {
    try {
      await updateBookingStatus(bookingId, 'rejected');
      fetchBookings();
    } catch (error) {
      setErrorMessage('Failed to reject booking.');
      setShowErrorModal(true);
    }
  };

  const handleApproveCancel = async (bookingId: string) => {
    try {
      await cancelBooking(bookingId);
      fetchBookings();
    } catch (error) {
      setErrorMessage('Failed to approve cancellation.');
      setShowErrorModal(true);
    }
  };

  const handleRejectCancel = async (bookingId: string) => {
    try {
      await updateBookingStatus(bookingId, 'approved');
      fetchBookings();
    } catch (error) {
      setErrorMessage('Failed to reject cancellation request.');
      setShowErrorModal(true);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full shadow-inner opacity-50"></div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-slate-900/40 p-12 rounded-[3.5rem] text-center border border-app-border flex flex-col items-center">
        <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center mb-6 border border-primary/10">
          <span className="material-symbols-rounded text-3xl text-primary/30">verified_user</span>
        </div>
        <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-2">Operational Excellence</h3>
        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Your queue is currently empty</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map(booking => {
        const user = Array.isArray(booking.user_profiles) ? booking.user_profiles[0] : booking.user_profiles;
        const pitch = Array.isArray(booking.pitches) ? booking.pitches[0] : booking.pitches;
        const startTime = new Date(booking.start_time);
        const endTime = new Date(booking.end_time);
        
        // Get status badge color
        const getStatusBadge = () => {
          if (booking.status === 'approved') {
            return 'bg-primary text-slate-950';
          } else if (booking.status === 'pending') {
            return 'bg-orange-500 text-white';
          } else if (booking.status === 'cancel_request') {
            return 'bg-red-500 text-white';
          } else if (booking.status === 'rejected') {
            return 'bg-red-500 text-white';
          }
          return 'bg-slate-500 text-white';
        };

        const getStatusText = () => {
          if (booking.status === 'approved') return 'CONFIRMED';
          if (booking.status === 'pending') return 'PENDING';
          if (booking.status === 'cancel_request') return 'CANC';
          if (booking.status === 'rejected') return 'CANCELLED';
          return booking.status.toUpperCase();
        };

        // Get sport icon based on pitch name
        const getSportIcon = () => {
          const pitchName = (pitch?.name || '').toLowerCase();
          if (pitchName.includes('football') || pitchName.includes('soccer')) {
            return 'sports_soccer';
          } else if (pitchName.includes('padel') || pitchName.includes('tennis')) {
            return 'sports_tennis';
          } else if (pitchName.includes('basketball')) {
            return 'sports_basketball';
          }
          return 'sports_soccer';
        };

        return (
          <div key={booking.id} className="bg-slate-900/60 rounded-3xl p-5 border border-app-border group hover:bg-slate-900 transition-all">
            <div className="flex items-center gap-4">
              {/* Sport Icon */}
              <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className={`material-symbols-rounded text-3xl text-primary`}>{getSportIcon()}</span>
              </div>

              {/* Booking Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-[15px] text-white uppercase tracking-tight mb-1 truncate">
                  {pitch?.name || 'Main Pitch'}
                </h4>
                <p className="text-[12px] text-slate-300 font-bold mb-1">
                  {startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} - {endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span className="material-symbols-rounded text-sm">person</span>
                  <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
                  <span>{user?.name || 'Player'}</span>
                </div>
              </div>

              {/* Status Badge and Actions */}
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusBadge()}`}>
                  {getStatusText()}
                </span>
                {booking.status === 'pending' || booking.status === 'cancel_request' ? (
                  <button
                    onClick={() => {
                      if (booking.status === 'cancel_request') {
                        handleApproveCancel(booking.id);
                      } else {
                        handleApprove(booking.id);
                      }
                    }}
                    className="w-8 h-8 bg-app-surface-2 rounded-full flex items-center justify-center hover:bg-app-surface-2 transition-colors"
                  >
                    <span className="material-symbols-rounded text-lg text-slate-400">more_vert</span>
                  </button>
                ) : (
                  <div className="w-8 h-8"></div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Error View */}
      <SuccessModal
        isOpen={showErrorModal}
        title="Drift Error"
        message={errorMessage}
        buttonText="Return"
        onClose={() => setShowErrorModal(false)}
      />
    </div>
  );
};
