import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Zap, Star, MapPin, Share2, Heart, Wifi, Car, ShowerHead, CreditCard, Trophy } from 'lucide-react';
import { getPitch } from '@/services/dataService';
import { getAvailableSlots, createBookingRequest } from '@/services/bookingService';
import { supabase, getFileUrl } from '@/services/supabase';
import { getRealPlaceholderImage } from '@/services/assetService';
import { ConfirmationModal, SuccessModal } from '@/components/common/ConfirmationModal';
import { ImageViewer } from '@/components/common/ImageViewer';
import { ensureArray, getImageUrl } from '@/utils';
import { ADD_ONS } from '@/constants';

const PitchDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
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
                    alert('⚠️ Phone Number Required\n\nPlease add your phone number in your profile before making a booking.');
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

            await createBookingRequest({
                pitch: pitch.id,
                user: authUser.id,
                start_time: new Date(selectedSlot.start),
                end_time: new Date(selectedSlot.end),
                total_price: calculateTotal()
            });

            setIsBooking(false);
            setShowSuccessModal(true);
        } catch (error) {
            setIsBooking(false);
            alert(error instanceof Error ? error.message : 'Failed to create booking.');
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
                <p className="font-extrabold text-xl text-app-text mb-1">Pitch not found</p>
                <button onClick={() => navigate(-1)} className="mt-4 text-primary font-black uppercase text-[10px] tracking-widest">Go Back</button>
            </div>
        </div>
    );

    return (
        <div className="bg-app-bg text-app-text antialiased min-h-screen pb-[calc(120px+env(safe-area-inset-bottom))] font-display">
            <div className="max-w-[430px] mx-auto min-h-screen relative flex flex-col">
                {/* Hero Section */}
                <div className="relative h-[400px] w-full shrink-0">
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
                    <div className="absolute top-12 left-6 right-6 flex justify-between items-center z-20">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-full bg-app-bg/20 backdrop-blur-md flex items-center justify-center text-app-text border border-app-border active:scale-90 transition-all"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div className="flex gap-2">
                            <button className="w-10 h-10 rounded-full bg-app-bg/20 backdrop-blur-md flex items-center justify-center text-app-text border border-app-border active:scale-90 transition-all">
                                <Share2 size={20} />
                            </button>
                            <button className="w-10 h-10 rounded-full bg-app-bg/20 backdrop-blur-md flex items-center justify-center text-app-text border border-app-border active:scale-90 transition-all">
                                <Heart size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Rating Badge Overlay */}
                    <div className="absolute bottom-10 left-6 z-20">
                        <div className="px-3 py-1.5 bg-primary rounded-full text-black text-xs font-bold flex items-center gap-1 shadow-lg shadow-primary/20">
                            <Star size={14} fill="currentColor" />
                            4.9 (120+ Reviews)
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="px-6 pt-8 -mt-6 rounded-t-[32px] bg-app-bg z-10 flex-grow">
                    {/* Title & Price Section */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-2xl font-extrabold tracking-tight mb-1 text-app-text">{pitch.name}</h1>
                            <div className="flex items-center text-app-text-muted text-sm font-medium">
                                <MapPin className="text-primary text-base mr-1" size={16} />
                                {(Array.isArray(pitch.complexes) ? pitch.complexes[0] : pitch.complexes)?.name || 'Premium Venue'}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest mb-1">Per Hour</div>
                            <div className="text-xl font-bold text-primary">{pitch.price_per_hour || 45}.00 TND</div>
                        </div>
                    </div>

                    {/* Amenities Chips */}
                    <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar pb-1">
                        {pitch.sport_type && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 backdrop-blur-md rounded-full whitespace-nowrap shadow-sm border border-blue-500/20">
                                <span className="material-symbols-rounded text-blue-400 text-[18px]">
                                    {pitch.sport_type.toLowerCase().includes('football') ? 'sports_soccer' :
                                        pitch.sport_type.toLowerCase().includes('padel') ? 'sports_tennis' :
                                            pitch.sport_type.toLowerCase().includes('tennis') ? 'sports_tennis' :
                                                pitch.sport_type.toLowerCase().includes('basketball') ? 'sports_basketball' : 'sports_soccer'}
                                </span>
                                <span className="text-sm font-bold text-blue-400">{pitch.sport_type}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 px-4 py-2 bg-app-surface backdrop-blur-md rounded-full whitespace-nowrap shadow-sm border border-app-border">
                            <Wifi className="text-primary" size={18} />
                            <span className="text-sm font-medium">Free WiFi</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-app-surface backdrop-blur-md rounded-full whitespace-nowrap shadow-sm border border-app-border">
                            <Car className="text-primary" size={18} />
                            <span className="text-sm font-medium">Parking</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-app-surface backdrop-blur-md rounded-full whitespace-nowrap shadow-sm border border-app-border">
                            <ShowerHead className="text-primary" size={18} />
                            <span className="text-sm font-medium">Showers</span>
                        </div>
                    </div>

                    {/* About Section */}
                    <div className="mb-8">
                        <h2 className="text-lg font-bold mb-3 text-app-text">About Venue</h2>
                        <p className="text-app-text-muted text-sm leading-relaxed">
                            Experience {pitch.name} at {(Array.isArray(pitch.complexes) ? pitch.complexes[0] : pitch.complexes)?.name}.
                            Featuring high-quality {pitch.surface || 'Field'} surface, {pitch.size || 'standard'} size, and premium facilities.
                            Perfect for both competitive play and leisure sessions with friends.
                        </p>
                    </div>

                    {/* Date Selector */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold">Select Date</h2>
                            <span className="text-primary text-sm font-bold">
                                {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
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
                                            {date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
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
                            <label className="text-xs font-bold text-app-text-muted uppercase tracking-widest">Or Pick Other:</label>
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
                        <h2 className="text-lg font-bold mb-4">Select Time Slot</h2>
                        {loadingSlots ? (
                            <div className="bg-app-surface backdrop-blur-md p-12 rounded-[2rem] flex flex-col items-center justify-center border border-app-border">
                                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-3"></div>
                                <p className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">Checking slots...</p>
                            </div>
                        ) : availableSlots.length === 0 ? (
                            <div className="bg-app-surface backdrop-blur-md p-12 rounded-[2rem] text-center border border-app-border">
                                <span className="material-symbols-rounded text-4xl text-app-text-muted mb-2">event_busy</span>
                                <p className="text-xs font-black text-app-text-muted uppercase tracking-widest">No slots today</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-3">
                                {availableSlots.map((slot, idx) => {
                                    const startTime = new Date(slot.start).toLocaleTimeString('en-US', {
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
                                    <p className="text-[10px] font-black uppercase text-app-text-muted tracking-widest">Selected Slot</p>
                                    <p className="text-sm font-bold text-app-text">{new Date(selectedSlot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase text-app-text-muted tracking-widest">Total Price</p>
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
                                    <span>Processing...</span>
                                </>
                            ) : (
                                "Book Now"
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={showConfirmModal}
                title="Review Booking"
                message="Review your session details before confirming:"
                details={[
                    { label: 'Pitch', value: pitch.name },
                    { label: 'Date', value: new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) },
                    { label: 'Time', value: selectedSlot ? `${new Date(selectedSlot.start).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}` : '' },
                    { label: 'Amount', value: `${calculateTotal()} TND (Cash)` }
                ]}
                confirmText="Confirm"
                cancelText="Edit"
                onConfirm={handleConfirmBooking}
                onCancel={() => setShowConfirmModal(false)}
            />

            <SuccessModal
                isOpen={showSuccessModal}
                title="Booking Sent!"
                message={`Your request has been sent. Bring ${calculateTotal()} TND in cash on arrival once approved.`}
                buttonText="Back to Grounds"
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
