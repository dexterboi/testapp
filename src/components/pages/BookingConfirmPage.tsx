import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Trophy, QrCode, CreditCard } from 'lucide-react';
import { supabase } from '@/services/supabase';
import { createBookingRequest } from '@/services/bookingService';
import { getRealPlaceholderImage } from '@/services/assetService';
import { ensureArray, getImageUrl } from '@/utils';
import { getFileUrl } from '@/services/supabase';

const BookingConfirmPage = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [isPaid, setIsPaid] = useState(false);
    const [loading, setLoading] = useState(false);
    const [friends, setFriends] = useState<any[]>([]);
    const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);

    useEffect(() => {
        const fetchFriends = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('friendships')
                .select(`
                    *,
                    user:user_id (id, name, avatar, takwira_id),
                    friend:friend_id (id, name, avatar, takwira_id)
                `)
                .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
                .eq('status', 'accepted');

            if (!error && data) {
                const processed = data.map(f => {
                    const profile = f.user_id === user.id ? f.friend : f.user;
                    // Fix potential null profiles (e.g. if user profile was deleted)
                    return profile || null;
                }).filter(Boolean);
                setFriends(processed);
            }
        };

        fetchFriends();
    }, []);

    if (!state) {
        navigate('/');
        return null;
    }

    const toggleParticipant = (friendId: string) => {
        setSelectedParticipantIds(prev =>
            prev.includes(friendId)
                ? prev.filter(id => id !== friendId)
                : [...prev, friendId]
        );
    };

    const handlePay = async () => {
        setLoading(true);
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) throw new Error('User not authenticated');

            // Fetch user profile to ensure we have the phone number
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('phone')
                .eq('id', authUser.id)
                .single();

            if (!profile?.phone) {
                throw new Error('Please add a phone number to your profile before booking.');
            }

            await createBookingRequest({
                pitch: state.pitch.id,
                user: authUser.id,
                start_time: new Date(state.slot.start),
                end_time: new Date(state.slot.end),
                total_price: state.total,
                participantIds: selectedParticipantIds
            });

            setIsPaid(true);
        } catch (error) {
            console.error('Booking failed:', error);
            alert(error instanceof Error ? error.message : 'Booking failed. Please try again.');
        }
        setLoading(false);
    };

    if (isPaid) {
        return (
            <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center text-app-text p-8 text-center overflow-auto pb-20">
                <div className="bg-primary text-slate-950 p-5 rounded-full mb-6 animate-bounce shadow-2xl">
                    <Trophy size={48} />
                </div>
                <h1 className="text-4xl font-black mb-2 tracking-tight">PENDING APPROVAL!</h1>
                <p className="opacity-60 mb-10 font-medium">The owner will review your request soon</p>

                <div className="bg-app-surface/50 backdrop-blur-xl text-app-text p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl mb-10 border border-app-border relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-primary/10"></div>
                    <div className="flex justify-center mb-6">
                        <div className="bg-white p-3 rounded-3xl">
                            <QrCode size={140} className="text-slate-900" />
                        </div>
                    </div>
                    <div className="bg-app-surface-2 p-4 rounded-2xl mb-6 border border-app-border text-app-text">
                        <p className="text-center font-black text-2xl tracking-[0.2em]">4829</p>
                        <p className="text-center text-[10px] font-black text-app-text-muted mt-1 uppercase tracking-widest">Digital Access Code</p>
                    </div>

                    <div className="text-left text-sm space-y-4">
                        <div className="flex justify-between items-center border-b border-app-border pb-2">
                            <span className="text-app-text-muted font-bold text-xs uppercase">Pitch</span>
                            <span className="font-black text-app-text">{state.pitch.name}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-app-border pb-2">
                            <span className="text-app-text-muted font-bold text-xs uppercase">Schedule</span>
                            <span className="font-black text-app-text text-right">
                                {new Date(state.slot.start).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                <br />
                                {new Date(state.slot.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {new Date(state.slot.end).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-app-text-muted font-bold text-xs uppercase">Paid</span>
                            <span className="font-black text-primary text-xl">TND {state.total}</span>
                        </div>
                    </div>
                </div>

                <button onClick={() => navigate('/')} className="w-full bg-app-surface-2 text-primary py-4 rounded-[2rem] font-black shadow-xl active:scale-95 transition-all text-xs tracking-widest uppercase border border-app-border hover:brightness-110">
                    BACK TO DASHBOARD
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-app-bg p-6 flex flex-col pb-safe text-app-text">
            <div className="flex items-center justify-between mb-8 pt-6">
                <button onClick={() => navigate(-1)} className="bg-app-surface/50 backdrop-blur-md p-3 rounded-2xl shadow-sm border border-app-border text-app-text"><ChevronLeft size={20} /></button>
                <h1 className="text-xs font-black tracking-[0.2em] text-app-text-muted uppercase">Checkout</h1>
                <div className="w-10"></div>
            </div>

            <div className="bg-app-surface/50 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-app-border mb-6">
                <h2 className="font-black text-app-text text-lg mb-6 tracking-tight">Booking Summary</h2>
                <div className="flex gap-4 mb-6 p-3 bg-app-surface-2 rounded-2xl border border-app-border">
                    <img
                        src={(() => {
                            const images = ensureArray(state.pitch.images, state.pitch.image);
                            const firstImage = images[0];
                            return firstImage ? getImageUrl(firstImage, 'pitch-images', state.pitch.id, getFileUrl) : getRealPlaceholderImage(state.pitch.id, state.pitch.surface === 'Indoor' ? 'indoor' : 'pitch');
                        })()}
                        className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div>
                        <p className="font-black text-app-text leading-tight mb-1">{state.pitch.name}</p>
                        <p className="text-[10px] text-app-text-muted font-black uppercase tracking-widest">{state.date} • {state.time}</p>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="flex justify-between text-xs font-bold text-app-text-muted">
                        <span className="uppercase tracking-widest opacity-60">Pitch Fee</span>
                        <span className="text-app-text font-black">TND {state.pitch.price_per_hour || state.pitch.pricePerHour || 0}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-app-text-muted">
                        <span className="uppercase tracking-widest opacity-60">Service Fee</span>
                        <span className="text-app-text font-black">TND 2.00</span>
                    </div>
                    <div className="border-t border-app-border pt-4 mt-2 flex justify-between items-center">
                        <span className="text-xs font-black text-app-text uppercase tracking-widest">Total Amount</span>
                        <span className="text-2xl font-black text-primary tracking-tight">TND {state.total + 2}</span>
                    </div>
                </div>

                {/* Player Contact Info Verification */}
                <div className="mt-6 pt-6 border-t border-app-border">
                    <div className="flex items-center gap-3 bg-app-surface-2 p-4 rounded-2xl border border-app-border">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                            <span className="material-symbols-rounded">phone_iphone</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-app-text-muted uppercase tracking-widest leading-none mb-1">Contact Verification</p>
                            <p className="text-xs font-black text-app-text uppercase tracking-tighter">Phone sync active</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-app-surface/50 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-app-border mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-app-text tracking-tight uppercase tracking-widest text-[10px]">Invite Crew</h3>
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase">
                        {selectedParticipantIds.length} SELECTED
                    </span>
                </div>

                {friends.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                        {friends.map(friend => (
                            <button
                                key={friend.id}
                                onClick={() => toggleParticipant(friend.id)}
                                className="flex flex-col items-center gap-2 flex-shrink-0"
                            >
                                <div className={`relative w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all ${selectedParticipantIds.includes(friend.id)
                                    ? 'border-primary ring-4 ring-primary/20 scale-95'
                                    : 'border-app-border'
                                    }`}>
                                    <img
                                        src={friend.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.name}`}
                                        className="w-full h-full object-cover"
                                        alt={friend.name}
                                    />
                                    {selectedParticipantIds.includes(friend.id) && (
                                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                            <div className="bg-primary text-slate-900 rounded-full p-0.5">
                                                <span className="material-symbols-rounded text-sm font-bold">check</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <span className={`text-[8px] font-black uppercase truncate w-14 text-center ${selectedParticipantIds.includes(friend.id) ? 'text-primary' : 'text-app-text-muted'
                                    }`}>
                                    {friend.name.split(' ')[0]}
                                </span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="bg-app-surface-2 p-4 rounded-2xl border border-app-border border-dashed text-center">
                        <p className="text-[10px] text-app-text-muted font-bold">No friends in your Crew yet.</p>
                        <button
                            onClick={() => navigate('/crew')}
                            className="text-[10px] text-primary font-black uppercase mt-2 hover:underline"
                        >
                            ADD FRIENDS
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-app-surface/50 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-app-border mb-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-app-text tracking-tight uppercase tracking-widest text-[10px]">PAYSPLIT™</h3>
                    <div className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase">ACTIVE</div>
                </div>
                <p className="text-[10px] text-app-text-muted font-bold mb-6 leading-relaxed">Pay the full amount now, or split with your team members automatically. Points will be awarded to all payers.</p>
                <div className="flex gap-3">
                    <button className="flex-1 py-3 border-2 border-app-border rounded-2xl text-[10px] font-black text-app-text-muted tracking-widest uppercase hover:border-primary/20 transition-all">SPLIT (1/10)</button>
                    <button className="flex-1 py-3 border-2 border-primary bg-primary/5 text-primary rounded-2xl text-[10px] font-black tracking-widest uppercase shadow-md shadow-primary/5">PAY ALL</button>
                </div>
            </div>

            <button
                disabled={loading}
                onClick={handlePay}
                className="w-full bg-primary text-slate-900 py-5 rounded-[2rem] font-black shadow-2xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 mt-8 disabled:opacity-50"
            >
                {loading ? (
                    <div className="animate-spin h-5 w-5 border-2 border-slate-900 border-t-transparent rounded-full"></div>
                ) : (
                    <>
                        <CreditCard size={20} className="text-slate-900/40" />
                        <span className="text-xs tracking-[0.25em] uppercase">Confirm Booking</span>
                    </>
                )}
            </button>
        </div>
    );
};

export default BookingConfirmPage;
