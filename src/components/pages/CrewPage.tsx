import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    getFriendships,
    searchUsers,
    sendFriendRequest,
    updateFriendshipStatus,
    supabase
} from '@/services/dataService';
import { ConfirmationModal, SuccessModal } from '@/components/common/ConfirmationModal';
import { getAvatarUrl } from '@/utils';
import { useTranslation } from 'react-i18next';

const CrewPage = ({ currentUser, onlineUsers }: { currentUser: any, onlineUsers: Record<string, any> }) => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [friendships, setFriendships] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [successModal, setSuccessModal] = useState({ isOpen: false, message: '' });
    const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });

    useEffect(() => {
        let mounted = true;
        if (currentUser && mounted) {
            fetchFriendships(currentUser.id);

            // Refresh pending requests count when Crew page is accessed
            window.dispatchEvent(new CustomEvent('refreshPendingRequests'));

            const channel = supabase
                .channel('social_updates')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'friendships' },
                    () => {
                        fetchFriendships(currentUser.id);
                        // Refresh count when friendships change
                        window.dispatchEvent(new CustomEvent('refreshPendingRequests'));
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
        return () => { mounted = false; };
    }, [currentUser]);

    const fetchFriendships = async (userId: string) => {
        setLoading(true);
        const data = await getFriendships(userId);
        setFriendships(data);
        setLoading(false);
    };

    const handleSearch = async (val: string) => {
        setSearchQuery(val);
        if (val.trim().length >= 2) {
            setSearching(true);
            const results = await searchUsers(val);
            setSearchResults(results.filter((r: any) => r.id !== currentUser?.id));
            setSearching(false);
        } else {
            setSearchResults([]);
        }
    };

    const handleAddFriend = async (friendId: string) => {
        if (!currentUser) return;
        const { success, error } = await sendFriendRequest(currentUser.id, friendId);
        if (success) {
            setSuccessModal({ isOpen: true, message: t('social.request_sent_success') });
            fetchFriendships(currentUser.id);
        } else {
            setErrorModal({ isOpen: true, message: error || t('social.request_failed') });
        }
    };

    const handleUpdateStatus = async (friendshipId: string, status: 'accepted' | 'blocked') => {
        const { success, error } = await updateFriendshipStatus(friendshipId, status);
        if (success && currentUser) {
            if (status === 'accepted') {
                setSuccessModal({ isOpen: true, message: t('social.request_accepted_msg') });
            }
            fetchFriendships(currentUser.id);
            // Immediately refresh pending requests count
            window.dispatchEvent(new CustomEvent('refreshPendingRequests'));
        } else if (error) {
            setErrorModal({ isOpen: true, message: error || t('social.update_failed') });
        }
    };

    const pendingRequests = friendships.filter(f => f.status === 'pending' && f.friend_id === currentUser?.id);
    const myFriends = friendships.filter(f => f.status === 'accepted');

    return (
        <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#121417] pb-[calc(8rem+env(safe-area-inset-bottom))] font-sans transition-colors duration-300">
            {/* New Header Design */}
            <header className="px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-4">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <p className="text-slate-500 text-sm font-medium mb-1">Hello, 👋</p>
                        <h1 className="text-2xl font-extrabold tracking-tight text-[#1A1D1F] dark:text-white">{t('social.the_crew')}</h1>
                    </div>
                    <div className="flex -space-x-3">
                        {myFriends.slice(0, 3).map((f, i) => {
                            const friend = f.user_id === currentUser?.id ? f.friend : f.user;
                            return (
                                <div key={i} className="w-10 h-10 rounded-2xl border-2 border-slate-900 bg-slate-800 overflow-hidden shadow-sm">
                                    <img
                                        src={getAvatarUrl(friend.avatar, friend.name, friend.id)}
                                        className="w-full h-full object-cover"
                                        alt="Friend"
                                    />
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder={t('social.search_placeholder')}
                        className="w-full h-12 pl-12 pr-12 rounded-2xl bg-white dark:bg-[#1E2126] border-none text-sm focus:ring-2 focus:ring-primary focus:outline-none text-[#1A1D1F] dark:text-white placeholder:text-slate-400 shadow-sm"
                    />
                    {searching && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                        </div>
                    )}
                </div>
            </header>

            <div className="px-6 space-y-6">
                {searchQuery.trim().length >= 2 ? (
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h3 className="text-[10px] text-app-text-muted font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-1 h-1 bg-primary rounded-full"></span> {t('social.potential_crewmates')}
                        </h3>
                        {searchResults.length === 0 && !searching ? (
                            <div className="bg-white dark:bg-[#1E2126] p-12 rounded-2xl text-center shadow-soft">
                                <span className="material-symbols-rounded text-4xl text-slate-400 mb-2">person_search</span>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('social.no_players_found')}</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {searchResults.map(user => {
                                    const friendship = friendships.find(f => f.user_id === user.id || f.friend_id === user.id);
                                    return (
                                        <div key={user.id} className="bg-white dark:bg-[#1E2126] p-3 rounded-2xl flex items-center gap-4 shadow-soft hover:shadow-card transition-all">
                                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                                                <img
                                                    src={getAvatarUrl(user.avatar, user.name, user.id)}
                                                    className="w-full h-full object-cover"
                                                    alt="User"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-[#1A1D1F] dark:text-white truncate">{user.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">#{user.takwira_id || t('social.recruit_id')}</p>
                                            </div>
                                            {!friendship ? (
                                                <button
                                                    onClick={() => handleAddFriend(user.id)}
                                                    className="w-10 h-10 bg-primary text-[#1A1D1F] rounded-xl shadow-sm active:scale-90 transition-all flex items-center justify-center"
                                                >
                                                    <span className="material-symbols-rounded">person_add</span>
                                                </button>
                                            ) : (
                                                <div className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase ${friendship.status === 'accepted' ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                                    {friendship.status === 'accepted' ? t('social.crew_tag') : t('social.pending_tag')}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                ) : (
                    <>
                        {/* Incoming Requests - Prominent Section */}
                        {pendingRequests.length > 0 && (
                            <section className="animate-in zoom-in-95 duration-500 mb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-[10px] text-app-text-muted font-black uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping"></span>
                                        {t('social.crew_invites')}
                                    </h3>
                                    <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-[9px] font-black uppercase tracking-widest border border-primary/30">
                                        {pendingRequests.length} {t('social.new_invites')}
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {pendingRequests.map(req => {
                                        const requester = req.user;
                                        if (!requester) return null;
                                        return (
                                            <div key={req.id} className="bg-white dark:bg-[#1E2126] p-3 rounded-2xl flex items-center gap-4 shadow-soft border-l-4 border-primary">
                                                <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                                                    <img
                                                        src={getAvatarUrl(requester.avatar, requester.name, requester.id)}
                                                        className="w-full h-full object-cover"
                                                        alt="Requester"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm text-[#1A1D1F] dark:text-white truncate">{requester.name}</p>
                                                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{t('social.wants_to_join')}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleUpdateStatus(req.id, 'accepted')}
                                                        className="w-10 h-10 bg-primary text-[#1A1D1F] rounded-xl shadow-sm flex items-center justify-center active:scale-90 transition-all"
                                                    >
                                                        <span className="material-symbols-rounded">check</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(req.id, 'blocked')}
                                                        className="w-10 h-10 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-xl flex items-center justify-center active:scale-90 transition-all"
                                                    >
                                                        <span className="material-symbols-rounded">close</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* My Friends / Crew */}
                        <section className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xs font-bold tracking-[0.1em] uppercase text-slate-400">{t('social.my_crew')}</h3>
                                <span className="px-3 py-1 bg-white dark:bg-[#1E2126] rounded-full text-[9px] font-bold text-slate-500 uppercase tracking-widest">{myFriends.length} {t('social.members_count')}</span>
                            </div>

                            {loading ? (
                                <div className="bg-white dark:bg-[#1E2126] p-20 rounded-2xl flex flex-col items-center justify-center shadow-soft">
                                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('social.checking_status')}</p>
                                </div>
                            ) : myFriends.length === 0 ? (
                                <div className="bg-white dark:bg-[#1E2126] border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-16 text-center shadow-soft">
                                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                        <span className="material-symbols-rounded text-4xl text-slate-400">group_add</span>
                                    </div>
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                                        {t('social.empty_crew')}<br />{t('social.search_players_above')}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {myFriends.map(friendship => {
                                        const friend = friendship.user_id === currentUser?.id ? friendship.friend : friendship.user;
                                        if (!friend) return null;
                                        const isOnline = onlineUsers[friend.id]?.status === 'online';

                                        return (
                                            <Link
                                                to={`/chat/${friendship.id}`}
                                                key={friendship.id}
                                                className="bg-white dark:bg-[#1E2126] p-3 rounded-2xl flex items-center gap-4 shadow-soft hover:shadow-card transition-all active:scale-[0.98]"
                                            >
                                                <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 relative">
                                                    <img
                                                        src={getAvatarUrl(friend.avatar, friend.name, friend.id)}
                                                        className="w-full h-full object-cover"
                                                        alt="Friend"
                                                    />
                                                    {isOnline && (
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-[#1E2126] bg-green-500" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-sm text-[#1A1D1F] dark:text-white truncate">{friend.name}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${isOnline ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                                            {isOnline ? t('social.active') : t('social.offline_tag')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-[#1A1D1F] transition-all">
                                                    <span className="material-symbols-rounded">chat_bubble</span>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </div>

            {/* Success Modal */}
            <SuccessModal
                isOpen={successModal.isOpen}
                title={t('common.success')}
                message={successModal.message}
                buttonText={t('common.ok')}
                onClose={() => setSuccessModal({ isOpen: false, message: '' })}
            />

            {/* Error Modal */}
            <ConfirmationModal
                isOpen={errorModal.isOpen}
                title={t('common.error')}
                message={errorModal.message}
                confirmText={t('common.ok')}
                cancelText=""
                type="danger"
                onConfirm={() => setErrorModal({ isOpen: false, message: '' })}
                onCancel={() => setErrorModal({ isOpen: false, message: '' })}
            />
        </div>
    );
};

export default CrewPage;
