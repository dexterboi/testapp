import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getComplexBookings, updateBookingStatus, cancelBooking } from '@/services/bookingService';
import { getRelation } from '@/utils';
import { SuccessModal } from '@/components/common/ConfirmationModal';

const OwnerBookingsPage = () => {
    const { t, i18n } = useTranslation();
    const { complexId } = useParams();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState<any[]>([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (complexId) fetchBookings();
    }, [complexId, filter]);

    const fetchBookings = async () => {
        setLoading(true);
        const status = filter === 'all' ? undefined : filter;
        const data = await getComplexBookings(complexId!, status);
        setBookings(data || []);
        setLoading(false);
    };

    const handleAction = async (id: string, status: string, isCancel = false) => {
        try {
            if (isCancel) await cancelBooking(id);
            else await updateBookingStatus(id, status as any);
            fetchBookings();
        } catch (e) {
            setErrorMessage(t('activity.update_failed'));
            setShowErrorModal(true);
        }
    };

    // Generate date options for the next 7 days
    const getDateOptions = () => {
        const dates = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push(date);
        }
        return dates;
    };

    const dateOptions = getDateOptions();

    const getStatusBadge = (status: string) => {
        if (status === 'approved') {
            return 'bg-primary text-slate-950';
        } else if (status === 'pending') {
            return 'bg-orange-500 text-white';
        } else if (status === 'cancel_request' || status === 'rejected') {
            return 'bg-red-500 text-white';
        }
        return 'bg-slate-500 text-white';
    };

    const getStatusText = (status: string) => {
        if (status === 'approved') return t('owner.status.confirmed');
        if (status === 'pending') return t('owner.status.pending');
        if (status === 'cancel_request') return 'CANC';
        if (status === 'rejected') return t('owner.status.rejected');
        return status.toUpperCase();
    };

    const getSportIcon = (pitchName: string) => {
        const name = (pitchName || '').toLowerCase();
        if (name.includes('football') || name.includes('soccer')) {
            return 'sports_soccer';
        } else if (name.includes('padel') || name.includes('tennis')) {
            return 'sports_tennis';
        } else if (name.includes('basketball')) {
            return 'sports_basketball';
        }
        return 'sports_soccer';
    };

    // Filter bookings by search query and selected date
    const filteredBookings = bookings.filter(booking => {
        // Filter by date if one is selected
        if (selectedDate) {
            const bookingDate = new Date(booking.start_time);
            const selectedDateStr = selectedDate.toDateString();
            const bookingDateStr = bookingDate.toDateString();
            if (bookingDateStr !== selectedDateStr) {
                return false;
            }
        }

        // Filter by search query
        if (searchQuery) {
            const pitch = getRelation(booking, 'pitches');
            const user = getRelation(booking, 'user_profiles');
            const searchLower = searchQuery.toLowerCase();
            return (
                (pitch?.name || '').toLowerCase().includes(searchLower) ||
                (user?.name || '').toLowerCase().includes(searchLower)
            );
        }

        return true;
    });

    return (
        <div className="min-h-screen bg-slate-950 pb-24 font-sans text-white">
            {/* Header */}
            <div className="bg-slate-950 px-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-6 border-b border-app-border sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/owner')} className="w-10 h-10 rounded-full bg-app-surface-2 hover:bg-app-surface-2 text-white flex items-center justify-center transition-all active:scale-90">
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter text-white leading-none">
                                Manage <span className="text-primary">Bookings</span>
                            </h1>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-app-surface-2 flex items-center justify-center">
                        <User size={20} className="text-slate-400" />
                    </div>
                </div>

                {/* Search Bar */}
                <div className="mb-4">
                    <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search customer or pitch..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900/60 border border-app-border rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/30 transition-all"
                        />
                    </div>
                </div>

                {/* Date Selector */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-2">
                    {dateOptions.map((date, index) => {
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                        const dayNum = date.getDate();
                        // Check if this date has any bookings
                        const hasBookings = bookings.some(booking => {
                            const bookingDate = new Date(booking.start_time);
                            return bookingDate.toDateString() === date.toDateString();
                        });
                        const isSelected = selectedDate
                            ? date.toDateString() === selectedDate.toDateString()
                            : false;

                        return (
                            <button
                                key={index}
                                onClick={() => {
                                    // Toggle: if clicking the same date, deselect it (show all)
                                    if (selectedDate && date.toDateString() === selectedDate.toDateString()) {
                                        setSelectedDate(null);
                                    } else {
                                        setSelectedDate(date);
                                    }
                                }}
                                className={`flex-shrink-0 px-4 py-2.5 rounded-full text-[11px] font-black uppercase tracking-tight transition-all relative ${isSelected
                                    ? 'bg-primary text-slate-950 shadow-lg shadow-primary/20'
                                    : 'bg-slate-900/60 text-white border border-app-border'
                                    } ${!hasBookings ? 'opacity-50' : ''}`}
                            >
                                {dayName} {dayNum}
                                {hasBookings && !isSelected && (
                                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Status Filters */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {['all', 'approved', 'pending', 'cancel_request'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${filter === s
                                ? 'bg-slate-900/60 text-white border border-app-border'
                                : 'bg-transparent text-slate-400 hover:text-white'
                                }`}
                        >
                            {s === 'cancel_request' ? 'CANC' : s.replace('_', ' ').toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bookings List */}
            <div className="px-6 pt-6 space-y-3">
                {loading ? (
                    <div className="bg-slate-900/50 p-24 rounded-3xl flex flex-col items-center justify-center border border-app-border">
                        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mb-6"></div>
                        <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Loading bookings...</p>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="bg-slate-900/30 p-20 rounded-3xl text-center border border-app-border">
                        <p className="text-slate-300 font-black uppercase tracking-widest text-[10px]">No bookings found</p>
                    </div>
                ) : (
                    filteredBookings.map(booking => {
                        const pitch = getRelation(booking, 'pitches');
                        const user = getRelation(booking, 'user_profiles');
                        const startTime = new Date(booking.start_time);
                        const endTime = new Date(booking.end_time);

                        return (
                            <div key={booking.id} className="bg-slate-900/60 rounded-3xl p-5 border border-app-border group hover:bg-slate-900 transition-all">
                                <div className="flex items-center gap-4">
                                    {/* Sport Icon */}
                                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center flex-shrink-0">
                                        <span className={`material-symbols-rounded text-3xl text-primary`}>{getSportIcon(pitch?.name || '')}</span>
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

                                    {/* Status Badge and Menu */}
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusBadge(booking.status)}`}>
                                            {getStatusText(booking.status)}
                                        </span>
                                        <button
                                            onClick={() => {
                                                if (booking.status === 'pending') {
                                                    handleAction(booking.id, 'approved');
                                                } else if (booking.status === 'cancel_request') {
                                                    handleAction(booking.id, 'cancelled', true);
                                                }
                                            }}
                                            className="w-8 h-8 bg-app-surface-2 rounded-full flex items-center justify-center hover:bg-app-surface-2 transition-colors"
                                        >
                                            <span className="material-symbols-rounded text-lg text-slate-400">more_vert</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            <SuccessModal isOpen={showErrorModal} title="Error" message={errorMessage} onClose={() => setShowErrorModal(false)} />
        </div>
    );
};

export default OwnerBookingsPage;
