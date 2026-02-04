import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Zap, Star, MapPin, Share2, Heart, Wifi, Car, ShowerHead, CreditCard, Trophy } from 'lucide-react';
import { getPitch } from '@/services/dataService';
import { getAvailableSlots, createBookingRequest, modifyBooking } from '@/services/bookingService';
import { supabase, getFileUrl } from '@/services/supabase';
import { getRealPlaceholderImage } from '@/services/assetService';
import { ConfirmationModal, SuccessModal } from '@/components/common/ConfirmationModal';
import { ImageViewer } from '@/components/common/ImageViewer';
import { ensureArray, getImageUrl } from '@/utils';
import { ADD_ONS } from '@/constants';

const PitchDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const modifyingBooking = location.state?.modifyingBooking;
    const { t } = useTranslation();
    const [pitch, setPitch] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
    const [availableSlots, setAvailableSlots] = useState<any[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isBooking, setIsBooking] = useState(false);
    const [viewingImages, setViewingImages] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        if (id) {
            fetchPitch();
        }
    }, [id]);

    useEffect(() => {
        if (pitch && selectedDate) {
            fetchAvailableSlots();
        }
    }, [pitch, selectedDate]);

    const fetchPitch = async () => {
        setLoading(true);
        const data = await getPitch(id!);
        setPitch(data);
        setLoading(false);
    };

    const fetchAvailableSlots = async () => {
        if (!pitch?.id || !selectedDate) return;
        setLoadingSlots(true);
        try {
            const date = new Date(selectedDate + 'T00:00:00');
            const slots = await getAvailableSlots(pitch.id, date);
            setAvailableSlots(slots);
        } catch (error) {
            console.error('Error fetching slots:', error);
            setAvailableSlots([]);
        }
        setLoadingSlots(false);
    };

    const toggleAddOn = (id: string) => {
        if (selectedAddOns.includes(id)) setSelectedAddOns(prev => prev.filter(x => x !== id));
        else setSelectedAddOns(prev => [...prev, id]);
    };

    const calculateTotal = () => {
        let total = selectedSlot?.price || pitch.price_per_hour || pitch.pricePerHour || 0;
        selectedAddOns.forEach(id => {
            const addon = ADD_ONS.find(a => a.id === id);
            if (addon) total += addon.price;
        });
        return total;
    };

    const handleBookingClick = () => {
        if (!selectedSlot) return;

        supabase.auth.getUser().then(({ data: { user: authUser } }) => {
            if (!authUser) return;

            supabase.from('user_profiles').select('phone').eq('id', authUser.id).single().then(({ data: profile }) => {
                if (!profile?.phone) {
                    alert(`${t('pitch.phone_required')}\n\n${t('pitch.phone_required_sub')}`);
                    navigate('/profile');
                    return;
                }
                setShowConfirmModal(true);
            });
        });
    };

    const handleConfirmBooking = async () => {
        setShowConfirmModal(false);
        setIsBooking(true);

        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) throw new Error('User not authenticated');

            if (modifyingBooking) {
                await modifyBooking(
                    modifyingBooking.id,
                    {
                        start: new Date(selectedSlot.start),
                        end: new Date(selectedSlot.end),
                        price: calculateTotal()
                    },
                    modifyingBooking.status
                );
            } else {
                await createBookingRequest({
                    pitch: pitch.id,
                    user: authUser.id,
                    start_time: new Date(selectedSlot.start),
                    end_time: new Date(selectedSlot.end),
                    total_price: calculateTotal()
                });
            }

            setIsBooking(false);
            setShowSuccessModal(true);
        } catch (error) {
            setIsBooking(false);
            alert(error instanceof Error ? error.message : t('pitch.booking_failed'));
        }
    };

    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        navigate('/');
    };

    const imagesArray = ensureArray(pitch?.images, pitch?.image);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-app-bg">
            <div className="relative">
                <div className="animate-ping absolute inset-0 bg-primary/20 rounded-full"></div>
                <div className="bg-app-surface p-6 rounded-full border border-app-border relative">
                    <span className="material-symbols-rounded text-3xl text-primary animate-pulse">sports_soccer</span>
                </div>
            </div>
        </div>
    );

    if (!pitch) return (
        <div className="min-h-screen bg-app-bg flex items-center justify-center p-6 text-center">
            <div className="bg-app-surface backdrop-blur-xl p-8 rounded-[3rem] shadow-sm border border-app-border">
                <span className="material-symbols-rounded text-5xl text-app-text-muted mb-4">error</span>
                <p className="font-extrabold text-xl text-app-text mb-1">{t('pitch.not_found')}</p>
                <button onClick={() => navigate(-1)} className="mt-4 text-primary font-black uppercase text-[10px] tracking-widest">{t('pitch.go_back')}</button>
            </div>
        </div>
    );

    return (
        <div className="bg-app-bg text-app-text antialiased min-h-screen pb-[calc(120px+env(safe-area-inset-bottom))] font-display">
            <div className="max-w-[430px] mx-auto min-h-screen relative flex flex-col">
                {/* Hero Section */}
                <div className="relative h-[350px] w-full shrink-0">
                    {imagesArray.length > 0 ? (
                        <img
                            src={getImageUrl(imagesArray[0], 'pitch-images', pitch.id, getFileUrl)}
                            alt={pitch.name}
                            className="w-full h-full object-cover cursor-pointer transition-transform duration-[2s]"
                            onClick={() => {
                                setCurrentImageIndex(0);
                                setViewingImages(true);
                            }}
                        />
                    ) : (
                        <img
                            src={getRealPlaceholderImage(pitch.id, pitch.surface === 'Indoor' ? 'indoor' : 'pitch')}
                            className="w-full h-full object-cover"
                            alt={pitch.name}
                        />
                    )}

                    {/* Top Floating Buttons */}
                    <div className="absolute top-[calc(2rem+env(safe-area-inset-top))] left-6 right-6 flex justify-between items-center z-20">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-xl bg-white/80 dark:bg-[#1E2126]/80 backdrop-blur-md flex items-center justify-center text-[#1A1D1F] dark:text-white shadow-lg active:scale-90 transition-all"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div className="flex gap-2">
                            <button className="w-10 h-10 rounded-xl bg-white/80 dark:bg-[#1E2126]/80 backdrop-blur-md flex items-center justify-center text-[#1A1D1F] dark:text-white shadow-lg active:scale-90 transition-all">
                                <Share2 size={20} />
                            </button>
                            <button className="w-10 h-10 rounded-xl bg-white/80 dark:bg-[#1E2126]/80 backdrop-blur-md flex items-center justify-center text-[#1A1D1F] dark:text-white shadow-lg active:scale-90 transition-all">
                                <Heart size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Rating Badge Overlay */}
                    <div className="absolute bottom-8 left-6 z-20">
                        <div className="px-3 py-1.5 bg-primary rounded-full text-[#1A1D1F] text-xs font-bold flex items-center gap-1 shadow-lg shadow-primary/20">
                            <Star size={14} fill="currentColor" />
                            4.9 (120+ {t('common.reviews')})
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="px-6 pt-6 -mt-4 rounded-t-[24px] bg-[#F8F9FA] dark:bg-[#121417] z-10 flex-grow">
                    {/* Title & Price Section */}
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-xl font-extrabold tracking-tight mb-1 text-[#1A1D1F] dark:text-white">{pitch.name}</h1>
                            <div className="flex items-center text-slate-500 text-sm font-medium">
                                <MapPin className="text-primary text-base mr-1" size={16} />
                                {(Array.isArray(pitch.complexes) ? pitch.complexes[0] : pitch.complexes)?.name || 'Premium Venue'}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{t('pitch.per_hour')}</div>
                            <div className="text-lg font-bold text-primary">{pitch.price_per_hour || 45}.00 TND</div>
                        </div>
                    </div>

                    {/* Amenities Chips */}
                    <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
                        {pitch.sport_type && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-full whitespace-nowrap">
                                <span className="material-symbols-rounded text-blue-500 text-base">
                                    {pitch.sport_type.toLowerCase().includes('football') ? 'sports_soccer' :
                                        pitch.sport_type.toLowerCase().includes('padel') ? 'sports_tennis' :
                                            pitch.sport_type.toLowerCase().includes('tennis') ? 'sports_tennis' :
                                                pitch.sport_type.toLowerCase().includes('basketball') ? 'sports_basketball' : 'sports_soccer'}
                                </span>
                                <span className="text-xs font-bold text-blue-500">{pitch.sport_type}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#1E2126] rounded-full whitespace-nowrap shadow-sm">
                            <Wifi className="text-primary" size={16} />
                            <span className="text-xs font-medium text-[#1A1D1F] dark:text-white">{t('common.free_wifi')}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#1E2126] rounded-full whitespace-nowrap shadow-sm">
                            <Car className="text-primary" size={16} />
                            <span className="text-xs font-medium text-[#1A1D1F] dark:text-white">{t('common.parking')}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#1E2126] rounded-full whitespace-nowrap shadow-sm">
                            <ShowerHead className="text-primary" size={16} />
                            <span className="text-xs font-medium text-[#1A1D1F] dark:text-white">{t('common.showers')}</span>
                        </div>
                    </div>

                    {/* About Section */}
                    <div className="mb-6">
                        <h2 className="text-sm font-bold mb-2 text-[#1A1D1F] dark:text-white">{t('pitch.about_venue')}</h2>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Experience {pitch.name} at {(Array.isArray(pitch.complexes) ? pitch.complexes[0] : pitch.complexes)?.name}.
                            Featuring high-quality {pitch.surface || 'Field'} surface, {pitch.size || 'standard'} size, and premium facilities.
                            Perfect for both competitive play and leisure sessions with friends.
                        </p>
                    </div>

                    {/* Date Selector */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold">{t('pitch.select_date')}</h2>
                            <span className="text-primary text-sm font-bold">
                                {new Date(selectedDate).toLocaleDateString(t('common.locale', { defaultValue: 'en-US' }), { month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-0.5">
                            {[0, 1, 2, 3, 4, 5, 6].map(idx => {
                                const date = new Date();
                                date.setDate(date.getDate() + idx);
                                const dateStr = date.toISOString().split('T')[0];
                                const isSelected = selectedDate === dateStr;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedDate(dateStr)}
                                        className={`flex flex-col items-center justify-center min-w-[64px] h-20 rounded-2xl transition-all duration-300 shadow-sm ${isSelected
                                            ? 'bg-primary text-black'
                                            : 'bg-app-surface text-app-text-muted border border-app-border'
                                            }`}
                                    >
                                        <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isSelected ? 'text-black' : 'text-app-text-muted'}`}>
                                            {date.toLocaleDateString(t('common.locale', { defaultValue: 'en-US' }), { weekday: 'short' }).toUpperCase()}
                                        </span>
                                        <span className={`text-lg font-extrabold ${isSelected ? 'text-black' : 'text-app-text'}`}>
                                            {date.getDate()}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                        {/* Custom Date Input for flexibility */}
                        <div className="mt-4 flex items-center justify-between px-1">
                            <label className="text-xs font-bold text-app-text-muted uppercase tracking-widest">{t('pitch.or_pick_other')}</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="text-xs font-black bg-app-surface text-app-text border border-app-border rounded-lg focus:ring-1 focus:ring-primary h-8"
                            />
                        </div>
                    </div>

                    {/* Time Selector */}
                    <div className="mb-8 pb-4">
                        <h2 className="text-lg font-bold mb-4">{t('pitch.select_time')}</h2>
                        {loadingSlots ? (
                            <div className="bg-app-surface backdrop-blur-md p-12 rounded-[2rem] flex flex-col items-center justify-center border border-app-border">
                                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-3"></div>
                                <p className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">{t('pitch.checking_slots')}</p>
                            </div>
                        ) : availableSlots.length === 0 ? (
                            <div className="bg-app-surface backdrop-blur-md p-12 rounded-[2rem] text-center border border-app-border">
                                <span className="material-symbols-rounded text-4xl text-app-text-muted mb-2">event_busy</span>
                                <p className="text-xs font-black text-app-text-muted uppercase tracking-widest">{t('pitch.no_slots')}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-3">
                                {availableSlots.map((slot, idx) => {
                                    const startTime = new Date(slot.start).toLocaleTimeString(t('common.locale', { defaultValue: 'en-US' }), {
                                        hour: '2-digit', minute: '2-digit', hour12: true
                                    });
                                    const isSelected = selectedSlot?.start === slot.start;

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => slot.available && setSelectedSlot(slot)}
                                            disabled={!slot.available}
                                            className={`py-3 px-2 rounded-xl text-[11px] font-bold transition-all border ${!slot.available
                                                ? 'bg-app-surface-2/20 border-app-border text-app-text-muted opacity-50 cursor-not-allowed'
                                                : isSelected
                                                    ? 'bg-primary text-black border-primary scale-[1.02]'
                                                    : 'bg-app-surface border-app-border text-app-text hover:border-primary'
                                                }`}
                                        >
                                            {startTime}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Button Section - Sticky at bottom */}
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-app-bg/80 backdrop-blur-xl border-t border-app-border max-w-[430px] mx-auto z-50 rounded-t-[32px] shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.5)] pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
                    <div className="flex flex-col gap-3">
                        {selectedSlot && (
                            <div className="flex justify-between items-center px-2">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-app-text-muted tracking-widest">{t('pitch.selected_slot')}</p>
                                    <p className="text-sm font-bold text-app-text">{new Date(selectedSlot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase text-app-text-muted tracking-widest">{t('pitch.total_price')}</p>
                                    <p className="text-sm font-extrabold text-primary">{calculateTotal()} TND</p>
                                </div>
                            </div>
                        )}
                        <button
                            disabled={!selectedSlot || isBooking}
                            onClick={handleBookingClick}
                            className="w-full bg-primary hover:bg-opacity-90 text-black py-4 rounded-2xl font-extrabold text-lg shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2"
                        >
                            {isBooking ? (
                                <>
                                    <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full" />
                                    <span>{t('pitch.processing')}</span>
                                </>
                            ) : (
                                modifyingBooking ? t('common.modify') : t('pitch.book_now')
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={showConfirmModal}
                title={modifyingBooking ? t('common.modify_booking') : t('pitch.review_booking')}
                message={t('pitch.review_sub')}
                details={[
                    { label: t('pitch.label_pitch'), value: pitch.name },
                    { label: t('pitch.label_date'), value: new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) },
                    { label: t('pitch.label_time'), value: selectedSlot ? `${new Date(selectedSlot.start).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}` : '' },
                    { label: t('pitch.label_amount'), value: `${calculateTotal()} TND (Cash)` }
                ]}
                confirmText={t('common.confirm')}
                cancelText={t('pitch.edit')}
                onConfirm={handleConfirmBooking}
                onCancel={() => setShowConfirmModal(false)}
            />

            <SuccessModal
                isOpen={showSuccessModal}
                title={modifyingBooking ? t('common.success') : t('pitch.booking_sent')}
                message={modifyingBooking ? t('booking.modification_success') : t('pitch.booking_sent_sub', { amount: calculateTotal() })}
                buttonText={t('pitch.back_to_grounds')}
                onClose={handleSuccessClose}
            />

            {imagesArray.length > 0 && (
                <ImageViewer
                    isOpen={viewingImages}
                    images={imagesArray.map(img => getImageUrl(img, 'pitch-images', pitch.id, getFileUrl))}
                    currentIndex={currentImageIndex}
                    collectionName="pitches"
                    recordId={pitch.id}
                    onClose={() => setViewingImages(false)}
                    onNext={() => {
                        if (currentImageIndex < imagesArray.length - 1) {
                            setCurrentImageIndex(currentImageIndex + 1);
                        }
                    }}
                    onPrevious={() => {
                        if (currentImageIndex > 0) {
                            setCurrentImageIndex(currentImageIndex - 1);
                        }
                    }}
                />
            )}
        </div>
    );
};

export default PitchDetailsPage;
