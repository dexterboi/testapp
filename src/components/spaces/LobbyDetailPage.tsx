import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    getLobbyMembers,
    getLobbyMessages,
    sendLobbyMessage,
    supabase,
    inviteToLobby,
    getFriendships,
    respondToLobbyRequest,
    leaveLobby,
    kickLobbyMember,
    updateLobby
} from '@/services/dataService';
import { SuccessModal, ConfirmationModal } from '@/components/common/ConfirmationModal';
import { getAvatarUrl, getImageUrl, ensureArray } from '@/utils';
import { getFileUrl } from '@/services/supabase';
import { useTranslation } from 'react-i18next';
import { getRealPlaceholderImage } from '@/services/assetService';
import MapView from './MapView';

const LobbyDetailPage = ({ currentUser }: { currentUser: any }) => {
    const { t } = useTranslation();
    const { id: lobbyId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [lobby, setLobby] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'chat' | 'players' | 'details'>('chat');
    const [messageInput, setMessageInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [userFriends, setUserFriends] = useState<any[]>([]);
    const [successModal, setSuccessModal] = useState({ isOpen: false, message: '' });
    const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });
    const [leaveModalOpen, setLeaveModalOpen] = useState(false);
    const [kickModalOpen, setKickModalOpen] = useState(false);
    const [memberToKick, setMemberToKick] = useState<{ userId: string; userName: string } | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Edit form state
    const [editName, setEditName] = useState('');
    const [editLevel, setEditLevel] = useState('all');
    const [editAgeRange, setEditAgeRange] = useState('');
    const [editTeamSize, setEditTeamSize] = useState(5);
    const [editPreferredDate, setEditPreferredDate] = useState('');
    const [editPreferredTime, setEditPreferredTime] = useState('18:00');
    const [editType, setEditType] = useState<'public' | 'private'>('public');

    useEffect(() => {
        if (lobbyId) {
            fetchLobbyData();
            const subscription = setupRealtime();
            return () => {
                supabase.removeChannel(subscription);
            };
        }
    }, [lobbyId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, activeTab]);

    const fetchLobbyData = async () => {
        setLoading(true);
        try {
            const { data: lobbyData, error: lobbyError } = await supabase
                .from('lobbies')
                .select('*, host:host_id(id, name, avatar, phone), complex:complex_id(id, name, address, images, location_lat, location_lng)')
                .eq('id', lobbyId)
                .single();

            if (lobbyError) throw lobbyError;
            setLobby(lobbyData);

            // Initialize edit state
            setEditName(lobbyData.name || '');
            setEditLevel(lobbyData.level || 'all');
            setEditAgeRange(lobbyData.age_range || '');
            setEditTeamSize(lobbyData.team_size || 5);
            setEditPreferredDate(lobbyData.preferred_date || '');
            setEditPreferredTime(lobbyData.preferred_time || '18:00');
            setEditType(lobbyData.type || 'public');

            const membersData = await getLobbyMembers(lobbyId!);
            setMembers(membersData);

            // Only fetch messages if user is authorized (host or approved member)
            if (currentUser) {
                const isHost = lobbyData.host_id === currentUser.id;
                const isMember = membersData.some((m: any) => m.user_id === currentUser.id && m.status === 'joined');

                if (isHost || isMember) {
                    const messagesData = await getLobbyMessages(lobbyId!);
                    setMessages(messagesData);
                } else {
                    setMessages([]); // Don't show messages to unauthorized users
                }
            } else {
                setMessages([]);
            }

            // Check if user has access to view this lobby
            if (currentUser) {
                const isHost = lobbyData.host_id === currentUser.id;
                const isMember = membersData.some((m: any) => m.user_id === currentUser.id && m.status === 'joined');
                const isPublic = lobbyData.type === 'public';

                // For private lobbies, only host and members can access
                if (!isPublic && !isHost && !isMember) {
                    // Check if user is a friend of the host
                    const friendships = await getFriendships(currentUser.id);
                    const friendIds = friendships
                        .filter((f: any) => f.status === 'accepted')
                        .map((f: any) => f.user_id === currentUser.id ? f.friend_id : f.user_id);

                    const isFriendOfHost = friendIds.includes(lobbyData.host_id);

                    if (!isFriendOfHost) {
                        setErrorModal({ isOpen: true, message: t('social.no_access_private') || 'You do not have access to this private match. You need to be invited.' });
                        setTimeout(() => navigate('/matches'), 2000);
                        setLoading(false);
                        return;
                    }
                }
            } else {
                // Not logged in - redirect
                navigate('/matches');
                setLoading(false);
                return;
            }
        } catch (error) {
            console.error('Error fetching lobby details:', error);
            navigate('/matches');
        } finally {
            setLoading(false);
        }
    };

    const setupRealtime = () => {
        const channel = supabase
            .channel(`lobby:${lobbyId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'lobby_messages',
                filter: `lobby_id=eq.${lobbyId}`
            }, async (payload) => {
                // Only add message if user is authorized to see messages
                if (currentUser) {
                    const isHost = lobby?.host_id === currentUser.id;
                    const isMember = members.some((m: any) => m.user_id === currentUser.id && m.status === 'joined');

                    if (isHost || isMember) {
                        const { data: sender } = await supabase
                            .from('user_profiles')
                            .select('id, name, avatar, phone')
                            .eq('id', payload.new.sender_id)
                            .single();

                        const newMessage: any = { ...payload.new, sender };
                        setMessages(prev => {
                            if (prev.find((m: any) => m.id === newMessage.id)) return prev;
                            return [...prev, newMessage];
                        });
                    }
                }
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'lobby_members',
                filter: `lobby_id=eq.${lobbyId}`
            }, async () => {
                const updatedMembers = await getLobbyMembers(lobbyId!);
                setMembers(updatedMembers);

                // If user just got approved, fetch messages
                if (currentUser) {
                    const isHost = lobby?.host_id === currentUser.id;
                    const isMember = updatedMembers.some((m: any) => m.user_id === currentUser.id && m.status === 'joined');

                    if ((isHost || isMember) && messages.length === 0) {
                        const messagesData = await getLobbyMessages(lobbyId!);
                        setMessages(messagesData);
                    }
                }
            })
            .subscribe();

        return channel;
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !currentUser || !lobbyId) return;

        // Check if user can participate
        const isMember = members.some((m: any) => m.user_id === currentUser.id && m.status === 'joined');
        const isHost = lobby?.host_id === currentUser.id;

        if (!isHost && !isMember) {
            setErrorModal({ isOpen: true, message: 'You need to be approved to send messages in this lobby.' });
            return;
        }

        const content = messageInput.trim();
        setMessageInput('');

        const tempId = 'temp-' + Date.now();
        const optimisticMsg = {
            id: tempId,
            lobby_id: lobbyId,
            sender_id: currentUser.id,
            content: content,
            created_at: new Date().toISOString(),
            sender: {
                id: currentUser.id,
                name: currentUser.name,
                avatar: getAvatarUrl(currentUser.avatar, currentUser.name, currentUser.id)
            },
            isPending: true
        };

        setMessages(prev => [...prev, optimisticMsg]);

        const { success, data, error } = await sendLobbyMessage(lobbyId, currentUser.id, content);

        if (success) {
            setMessages(prev => prev.map(m => m.id === tempId ? { ...data, sender: optimisticMsg.sender } : m));
        } else {
            setMessages(prev => prev.filter(m => m.id !== tempId));
            setErrorModal({ isOpen: true, message: 'Failed to send message: ' + error });
        }
    };

    const openInviteModal = async () => {
        if (!currentUser) return;
        const friendships = await getFriendships(currentUser.id);
        const acceptedFriends = friendships
            .filter((f: any) => f.status === 'accepted')
            .map((f: any) => f.user_id === currentUser.id ? f.friend : f.user);

        const inviteable = acceptedFriends.filter((friend: any) =>
            !members.some((m: any) => m.user_id === friend.id && m.status === 'joined')
        );

        setUserFriends(inviteable);
        setIsInviteModalOpen(true);
    };

    const handleRespondToRequest = async (userId: string, response: 'accepted' | 'declined') => {
        if (!lobbyId || !currentUser) return;

        try {
            const { success, error } = await respondToLobbyRequest(
                lobbyId!,
                userId,
                response,
                currentUser.id
            );

            if (success) {
                setSuccessModal({
                    isOpen: true,
                    message: response === 'accepted'
                        ? 'Request approved! User has been added to the lobby.'
                        : 'Request declined.'
                });
                // Refresh immediately to update the UI
                setTimeout(() => {
                    fetchLobbyData();
                }, 500);
            } else {
                setErrorModal({ isOpen: true, message: error || 'Failed to respond to request' });
            }
        } catch (err: any) {
            console.error('Error responding to request:', err);
            setErrorModal({ isOpen: true, message: err?.message || 'An unexpected error occurred' });
        }
    };

    const handleInviteFriend = async (friendId: string) => {
        if (!lobbyId || !currentUser) return;
        const { success, error } = await inviteToLobby(lobbyId, friendId, currentUser.id);
        if (success) {
            setUserFriends(prev => prev.filter(f => f.id !== friendId));
        } else {
            alert('Error inviting friend: ' + error);
        }
    };

    const handleLeaveLobby = async () => {
        if (!lobbyId || !currentUser) return;

        const { success, error } = await leaveLobby(lobbyId, currentUser.id);

        if (success) {
            setLeaveModalOpen(false);
            setSuccessModal({ isOpen: true, message: 'You have left the lobby.' });
            // Navigate back to spaces page after a short delay
            setTimeout(() => {
                navigate('/matches');
            }, 1500);
        } else {
            setErrorModal({ isOpen: true, message: error || 'Failed to leave lobby' });
        }
    };

    const handleKickMember = async () => {
        if (!lobbyId || !currentUser || !memberToKick) return;

        const { success, error } = await kickLobbyMember(lobbyId, memberToKick.userId, currentUser.id);

        if (success) {
            setKickModalOpen(false);
            setMemberToKick(null);
            setSuccessModal({ isOpen: true, message: `${memberToKick.userName} has been removed from the lobby.` });
            fetchLobbyData(); // Refresh to update members list
        } else {
            setErrorModal({ isOpen: true, message: error || 'Failed to kick member' });
        }
    };

    const handleUpdateLobby = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!lobbyId || !currentUser) return;

        const { success, error } = await updateLobby(lobbyId, {
            name: editName,
            level: editLevel,
            age_range: editAgeRange,
            team_size: editTeamSize,
            max_players: editTeamSize * 2,
            preferred_date: editPreferredDate,
            preferred_time: editPreferredTime,
            type: editType
        });

        if (success) {
            setIsEditModalOpen(false);
            setSuccessModal({ isOpen: true, message: 'Match updated successfully!' });
            fetchLobbyData();
        } else {
            setErrorModal({ isOpen: true, message: error || 'Failed to update match' });
        }
    };

    const handleGetDirections = () => {
        if (!lobby?.complex?.location_lat || !lobby?.complex?.location_lng) return;
        const { location_lat: lat, location_lng: lng } = lobby.complex;
        // Using Google Maps URL for directions
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        window.open(url, '_blank');
    };

    // Check if current user is an approved member or host
    const isMember = members.some((m: any) => m.user_id === currentUser?.id && m.status === 'joined');
    const isHost = lobby?.host_id === currentUser?.id;
    const canParticipate = isHost || isMember; // Only host and approved members can chat/participate
    const hasPendingRequest = members.some((m: any) => m.user_id === currentUser?.id && m.status === 'requested');
    const hasPendingInvite = members.some((m: any) => m.user_id === currentUser?.id && m.status === 'invited');

    if (loading) {
        return (
            <div className="min-h-screen bg-app-bg flex items-center justify-center">
                <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-app-bg pb-24 flex flex-col h-screen font-sans transition-colors duration-300">
            {/* Premium Header */}
            <header className="bg-app-bg/80 backdrop-blur-xl px-6 pt-14 pb-6 border-b border-app-border flex items-center gap-4 z-40 shrink-0 sticky top-0">
                <button
                    onClick={() => navigate('/matches')}
                    className="w-10 h-10 bg-app-surface-2 rounded-xl flex items-center justify-center text-app-text-muted hover:text-app-text border border-app-border shadow-sm transition-all active:scale-90"
                >
                    <span className="material-symbols-rounded">arrow_back_ios_new</span>
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-black text-app-text tracking-tighter truncate leading-tight uppercase">{lobby?.name}</h1>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/50" />
                        <span className="text-[9px] font-black uppercase text-primary-dark tracking-widest">{lobby?.status === 'active' ? t('social.active_session') : lobby?.status?.toUpperCase()}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isMember && !isHost && (
                        <button
                            onClick={() => setLeaveModalOpen(true)}
                            className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center active:scale-90 transition-all shadow-sm hover:bg-red-500/20"
                            title={t('social.leave_lobby')}
                        >
                            <span className="material-symbols-rounded">exit_to_app</span>
                        </button>
                    )}
                    {isHost && (
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center active:scale-90 transition-all shadow-sm hover:bg-primary/20"
                            title={t('common.modify')}
                        >
                            <span className="material-symbols-rounded">edit</span>
                        </button>
                    )}
                    {(canParticipate || isHost) && (
                        <button
                            onClick={openInviteModal}
                            className="w-10 h-10 rounded-xl bg-primary text-slate-900 flex items-center justify-center active:scale-90 transition-all shadow-lg shadow-primary/10 border border-primary/20"
                        >
                            <span className="material-symbols-rounded">person_add</span>
                        </button>
                    )}
                    {lobby?.host_id === currentUser?.id && (
                        <button className="w-10 h-10 rounded-xl bg-app-surface-2 text-app-text-muted flex items-center justify-center active:scale-90 transition-all border border-app-border shadow-sm">
                            <span className="material-symbols-rounded">settings</span>
                        </button>
                    )}
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="px-6 py-4 bg-app-bg border-b border-app-border shrink-0">
                <div className="flex p-1.5 bg-app-surface rounded-[1.5rem] gap-2 border border-app-border">
                    {[
                        { key: 'details', label: t('spaces.details_tab') || 'Details', icon: 'info' },
                        { key: 'chat', label: t('social.match_chat'), icon: 'forum' },
                        { key: 'players', label: t('social.squad_list'), icon: 'groups' }
                    ].map(({ key, label, icon }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key as any)}
                            className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === key
                                ? 'bg-primary text-slate-900 shadow-lg shadow-primary/10'
                                : 'text-app-text-muted hover:text-app-text'
                                }`}
                        >
                            <span className="material-symbols-rounded text-lg">{icon}</span>
                            {label} {key === 'players' && `(${members.length})`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'details' ? (
                    <div className="h-full overflow-y-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Venue Hero */}
                        <div className="relative h-48 rounded-[2.5rem] overflow-hidden bg-app-surface border border-app-border group">
                            {(() => {
                                const images = ensureArray(lobby?.complex?.images || lobby?.complex?.image);
                                const firstImage = images[0];
                                return firstImage ? (
                                    <img
                                        src={getImageUrl(firstImage, 'complex-images', lobby?.complex_id, getFileUrl)}
                                        className="w-full h-full object-cover transform scale-105 group-hover:scale-110 transition-transform duration-700"
                                        alt={lobby?.complex?.name}
                                        onError={(e) => {
                                            e.currentTarget.src = getRealPlaceholderImage(lobby?.complex_id || 'default', 'complex');
                                        }}
                                    />
                                ) : (
                                    <img
                                        src={getRealPlaceholderImage(lobby?.complex_id || 'default', 'complex')}
                                        className="w-full h-full object-cover"
                                        alt={lobby?.complex?.name}
                                    />
                                );
                            })()}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            <div className="absolute bottom-6 left-6 right-6">
                                <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-1">{t('spaces.venue_label').replace('*', '')}</p>
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter">{lobby?.complex?.name || 'Local Ground'}</h3>
                                <p className="text-white/60 text-[10px] font-bold uppercase truncate">{lobby?.complex?.address}</p>
                            </div>
                        </div>

                        {/* Match Settings Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: t('spaces.date_label').replace('*', ''), value: lobby?.preferred_date ? new Date(lobby.preferred_date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : '---', icon: 'calendar_today' },
                                { label: t('spaces.time_label').replace('*', ''), value: lobby?.preferred_time || '---', icon: 'schedule' },
                                { label: t('spaces.level_label'), value: lobby?.level?.toUpperCase() || 'ALL', icon: 'trending_up' },
                                { label: t('spaces.team_size_label'), value: `${lobby?.team_size} vs ${lobby?.team_size}`, icon: 'sports_soccer' },
                                { label: t('spaces.age_label'), value: lobby?.age_range || 'ALL AGES', icon: 'face' },
                                { label: t('spaces.price_per_player'), value: `${lobby?.price_per_player || 0} TND`, icon: 'payments' }
                            ].map((item, i) => (
                                <div key={i} className="bg-app-surface/50 border border-app-border p-4 rounded-3xl flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-primary opacity-80">
                                        <span className="material-symbols-rounded text-lg">{item.icon}</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                                    </div>
                                    <span className="text-xs font-black text-app-text uppercase">{item.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Map Integration */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-rounded text-primary">map</span>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-app-text-muted">Pitch Location</h3>
                                </div>
                                <button
                                    onClick={handleGetDirections}
                                    className="flex items-center gap-1.5 text-primary hover:text-primary-dark transition-colors px-3 py-1 bg-primary/10 rounded-full border border-primary/20"
                                >
                                    <span className="material-symbols-rounded text-base">directions</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest">Get Directions</span>
                                </button>
                            </div>

                            <div className="rounded-[2.5rem] overflow-hidden border border-app-border bg-app-surface h-[250px] relative shadow-lg">
                                {lobby?.complex ? (
                                    <MapView
                                        compact
                                        showBackButton={false}
                                        complexes={[lobby.complex]}
                                        userLocation={null} // We can pass current location if we had it, but MapView handles it
                                        initialCenter={{ lat: lobby.complex.location_lat, lng: lobby.complex.location_lng }}
                                        initialZoom={15}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-app-text-muted">
                                        <span className="material-symbols-rounded text-4xl animate-pulse">place</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Host Info */}
                        <div className="bg-primary/5 rounded-[2.5rem] border border-primary/10 p-6 flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-primary/20 bg-app-surface">
                                <img
                                    src={getAvatarUrl(lobby?.host?.avatar, lobby?.host?.name, lobby?.host?.id)}
                                    className="w-full h-full object-cover"
                                    alt="Host"
                                />
                            </div>
                            <div className="flex-1">
                                <p className="text-primary text-[9px] font-black uppercase tracking-widest mb-1">Match Captain</p>
                                <h4 className="text-sm font-black text-app-text uppercase">{lobby?.host?.name}</h4>
                            </div>
                            <span className="material-symbols-rounded text-primary">verified</span>
                        </div>
                    </div>
                ) : activeTab === 'chat' ? (
                    <div className="h-full flex flex-col">
                        {/* Access Restriction Banner */}
                        {!canParticipate && currentUser && (
                            <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-rounded text-amber-400">lock</span>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">
                                            {hasPendingRequest
                                                ? t('social.access_pending')
                                                : hasPendingInvite
                                                    ? t('social.invite_pending')
                                                    : t('social.access_required')}
                                        </p>
                                        <p className="text-[9px] text-amber-300/80 font-bold">
                                            {hasPendingRequest
                                                ? t('social.pending_approval_msg')
                                                : hasPendingInvite
                                                    ? t('social.check_squad_tab')
                                                    : t('social.request_access_msg')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth pb-32">
                            {!canParticipate && currentUser ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                                    <div className="w-20 h-20 rounded-[2.5rem] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
                                        <span className="material-symbols-rounded text-4xl text-amber-400">lock</span>
                                    </div>
                                    <p className="text-sm font-black uppercase tracking-widest text-amber-400 mb-2">Access Required</p>
                                    <p className="text-[10px] text-app-text-muted font-bold leading-relaxed max-w-[280px]">
                                        {hasPendingRequest
                                            ? 'Your access request is pending approval. The lobby host will review your request soon.'
                                            : hasPendingInvite
                                                ? 'You have been invited to this lobby. Please accept the invitation to participate.'
                                                : 'You need to request access to view messages and participate in this lobby.'}
                                    </p>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20 grayscale">
                                    <div className="w-20 h-20 rounded-[2.5rem] bg-app-surface-2 flex items-center justify-center mb-6">
                                        <span className="material-symbols-rounded text-4xl text-app-text-muted">chat_bubble</span>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-app-text-muted">{t('social.strategy_starts')}</p>
                                    <p className="text-[9px] font-bold text-app-text-muted mt-2 uppercase tracking-tight">{t('social.break_ice')}</p>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.sender_id === currentUser?.id;
                                    return (
                                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                            <div className="flex items-center gap-2 mb-1.5 px-2">
                                                {!isMe && <span className="text-[9px] font-black text-app-text-muted uppercase tracking-widest">{msg.sender?.name}</span>}
                                                <span className="text-[8px] font-black text-app-text uppercase tabular-nums tracking-widest opacity-60">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div
                                                className={`max-w-[85%] px-5 py-3.5 rounded-[2rem] text-[13px] shadow-sm relative group transition-all hover:scale-[1.02] ${isMe
                                                    ? 'bg-primary text-slate-900 rounded-br-none shadow-primary/10'
                                                    : 'bg-app-surface-2 text-app-text backdrop-blur-md border border-app-border rounded-bl-none'
                                                    }`}
                                            >
                                                <p className="leading-relaxed font-bold whitespace-pre-wrap tracking-tight">{msg.content}</p>
                                                {isMe && (
                                                    <div className="absolute -bottom-1 -right-1">
                                                        <span className={`material-symbols-rounded text-[14px] ${msg.isPending ? 'text-slate-900/40' : 'text-slate-900/60'}`}>done_all</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Premium Input Bar - Only show if user can participate */}
                        {canParticipate ? (
                            <div className="fixed bottom-0 left-0 right-0 p-6 z-50 bg-gradient-to-t from-app-bg via-app-bg to-transparent">
                                <form
                                    onSubmit={handleSendMessage}
                                    className="max-w-md mx-auto flex items-center gap-3 bg-app-surface p-2 rounded-[2.5rem] shadow-2xl border border-app-border"
                                >
                                    <div className="flex-1 flex items-center bg-app-bg/50 rounded-[2rem] px-5 py-3.5 border border-app-border">
                                        <input
                                            type="text"
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            placeholder={t('social.type_message')}
                                            className="flex-1 bg-transparent border-none outline-none text-[13px] font-bold text-app-text placeholder:text-app-text-muted/40"
                                        />
                                        <button type="button" className="text-app-text-muted hover:text-primary transition-colors">
                                            <span className="material-symbols-rounded text-xl">mood</span>
                                        </button>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!messageInput.trim()}
                                        className={`w-12 h-12 rounded-[1.8rem] flex items-center justify-center transition-all ${messageInput.trim()
                                            ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20 active:scale-95'
                                            : 'bg-app-surface-2 text-app-text-muted opacity-50'
                                            }`}
                                    >
                                        <span className="material-symbols-rounded text-xl">send</span>
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="fixed bottom-0 left-0 right-0 p-6 z-50 bg-gradient-to-t from-app-bg via-app-bg to-transparent">
                                <div className="max-w-md mx-auto bg-app-surface/50 p-4 rounded-[2rem] border border-amber-500/20 text-center">
                                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Access Required</p>
                                    <p className="text-[9px] text-app-text-muted font-bold">
                                        {hasPendingRequest
                                            ? 'Waiting for host approval...'
                                            : hasPendingInvite
                                                ? 'Check the Squad List tab to accept your invitation'
                                                : 'Request access to participate in this lobby'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-full overflow-y-auto p-8 space-y-4 no-scrollbar">
                        {/* Pending Requests Section (for lobby host) */}
                        {lobby?.host_id === currentUser?.id && (
                            <>
                                {members.filter(m => m.status === 'requested' || m.status === 'invited').length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-3 px-1">Pending Requests</h3>
                                        {members
                                            .filter(m => m.status === 'requested' || m.status === 'invited')
                                            .map((member) => (
                                                <div key={member.id} className="bg-amber-500/10 p-5 rounded-[2.5rem] border border-amber-500/20 flex items-center gap-5 shadow-sm mb-4 animate-in slide-in-from-bottom-4">
                                                    <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-500/30 shadow-sm relative shrink-0 p-0.5 bg-app-surface-2">
                                                        <img
                                                            src={getAvatarUrl(member.user?.avatar, member.user?.name, member.user?.id)}
                                                            className="w-full h-full object-cover rounded-[0.9rem]"
                                                            alt="Avatar"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-black text-app-text text-sm truncate">{member.user?.name}</p>
                                                        </div>
                                                        <p className="text-[9px] font-black text-app-text-muted uppercase tracking-widest mt-0.5">#{member.user?.takwira_id || 'PRO_PLAYER'}</p>
                                                        {member.request_message && (
                                                            <p className="text-[10px] text-app-text mt-2 italic">"{member.request_message}"</p>
                                                        )}
                                                        <div className={`mt-2 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.1em] border-2 inline-block ${member.status === 'requested'
                                                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                            : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                            }`}>
                                                            {member.status === 'requested' ? 'Access Request' : 'Invited'}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleRespondToRequest(member.user_id, 'accepted')}
                                                            className="bg-primary text-slate-900 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-primary-dark transition-all active:scale-95 shadow-lg shadow-primary/20"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleRespondToRequest(member.user_id, 'declined')}
                                                            className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-red-500/20 transition-all active:scale-95"
                                                        >
                                                            Decline
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </>
                        )}

                        {/* Joined Members Section */}
                        <div>
                            {lobby?.host_id === currentUser?.id && members.filter(m => m.status === 'joined').length > 0 && (
                                <h3 className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-3 px-1">Members</h3>
                            )}
                            {members
                                .filter(m => m.status === 'joined')
                                .map((member) => (
                                    <div key={member.id} className="bg-app-surface/50 p-5 rounded-[2.5rem] border border-app-border flex items-center gap-5 shadow-sm hover:bg-app-surface hover:shadow-xl transition-all duration-500 group animate-in slide-in-from-bottom-4 mb-4">
                                        <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-app-surface-2 shadow-sm relative shrink-0 p-0.5 bg-app-surface-2">
                                            <img
                                                src={getAvatarUrl(member.user?.avatar, member.user?.name, member.user?.id)}
                                                className="w-full h-full object-cover rounded-[0.9rem]"
                                                alt="Avatar"
                                            />
                                            {member.user?.id === lobby?.host_id && (
                                                <div className="absolute -top-1 -right-1 bg-primary text-slate-900 p-1 rounded-lg shadow-md border-2 border-app-surface">
                                                    <span className="material-symbols-rounded text-[14px]">stars</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-black text-app-text text-sm truncate group-hover:text-primary transition-colors">{member.user?.name}</p>
                                                {member.user?.id === lobby?.host_id && (
                                                    <span className="text-[7px] font-black text-slate-900 uppercase bg-primary px-1.5 py-0.5 rounded-full border border-primary/20">CAPTAIN</span>
                                                )}
                                            </div>
                                            <p className="text-[9px] font-black text-app-text-muted uppercase tracking-widest mt-0.5">#{member.user?.takwira_id || 'PRO_PLAYER'}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.1em] border-2 shadow-sm bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                                Joined
                                            </div>
                                            {/* Kick button - only show for host */}
                                            {isHost && member.user_id !== currentUser?.id && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setMemberToKick({ userId: member.user_id, userName: member.user?.name || 'Member' });
                                                        setKickModalOpen(true);
                                                    }}
                                                    className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center hover:bg-red-500/20 transition-all active:scale-90"
                                                    title="Remove Member"
                                                >
                                                    <span className="material-symbols-rounded text-sm">close</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </div>

                        {/* Show pending invites/requests for current user (if not host) */}
                        {lobby?.host_id !== currentUser?.id && !canParticipate && (
                            <div className="mt-6">
                                {hasPendingInvite && (
                                    <div className="bg-purple-500/10 p-5 rounded-[2.5rem] border border-purple-500/20 flex items-center gap-5 shadow-sm mb-4">
                                        <div className="flex-1">
                                            <p className="font-black text-app-text text-sm mb-2">
                                                You have been invited to this lobby!
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleRespondToRequest(currentUser.id, 'accepted')}
                                                    className="bg-primary text-slate-900 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-primary-dark transition-all active:scale-95 shadow-lg shadow-primary/20"
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => handleRespondToRequest(currentUser.id, 'declined')}
                                                    className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-red-500/20 transition-all active:scale-95"
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {hasPendingRequest && (
                                    <div className="bg-blue-500/10 p-5 rounded-[2.5rem] border border-blue-500/20 flex items-center gap-5 shadow-sm mb-4">
                                        <div className="flex-1">
                                            <p className="font-black text-app-text text-sm mb-2">
                                                Your access request is pending
                                            </p>
                                            <p className="text-[10px] text-app-text-muted font-bold">
                                                The lobby host will review your request. You'll be notified when they respond.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {!hasPendingRequest && !hasPendingInvite && lobby?.type === 'public' && (
                                    <div className="bg-app-surface/50 p-5 rounded-[2.5rem] border border-app-border flex items-center gap-5 shadow-sm mb-4">
                                        <div className="flex-1">
                                            <p className="font-black text-app-text text-sm mb-2">
                                                Request Access to Participate
                                            </p>
                                            <p className="text-[10px] text-app-text-muted font-bold mb-3">
                                                You can view this lobby but need approval to chat and participate.
                                            </p>
                                            <button
                                                onClick={() => navigate('/matches')}
                                                className="bg-primary text-slate-900 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-primary-dark transition-all active:scale-95 shadow-lg shadow-primary/20"
                                            >
                                                Go to Spaces to Request Access
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Premium Invite Modal */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 z-[100] bg-app-bg/80 backdrop-blur-md flex items-end justify-center p-6 animate-in fade-in duration-500">
                    <div className="bg-app-surface w-full max-w-sm rounded-[3.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-32 duration-700 max-h-[80vh] flex flex-col relative border border-app-border">
                        <button
                            onClick={() => setIsInviteModalOpen(false)}
                            className="absolute top-6 right-6 w-10 h-10 bg-app-surface-2 rounded-full flex items-center justify-center text-app-text-muted hover:text-app-text active:scale-90 transition-all"
                        >
                            <span className="material-symbols-rounded">close</span>
                        </button>

                        <div className="mb-8">
                            <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-1">Squad Builder</p>
                            <h2 className="text-2xl font-black text-app-text tracking-tighter">Invite Crew</h2>
                            <p className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest mt-1">Strengthen the lobby squad</p>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-4 no-scrollbar">
                            {userFriends.length === 0 ? (
                                <div className="py-20 text-center grayscale opacity-40">
                                    <div className="w-20 h-20 rounded-[2.5rem] bg-app-surface-2 flex items-center justify-center mx-auto mb-6">
                                        <span className="material-symbols-rounded text-4xl text-app-text-muted">person_off</span>
                                    </div>
                                    <p className="text-[10px] font-black uppercase text-app-text-muted tracking-[0.2em]">Everyone is in!</p>
                                    <p className="text-[8px] text-app-text-muted mt-2 uppercase font-black">All crew mates have joined</p>
                                </div>
                            ) : (
                                userFriends.map(friend => (
                                    <div key={friend.id} className="flex items-center gap-4 p-4 bg-app-bg/50 rounded-[2rem] border border-app-border hover:bg-app-bg transition-all group">
                                        <div className="w-12 h-12 rounded-[1rem] overflow-hidden border border-app-surface p-0.5 bg-app-surface-2 shadow-sm shrink-0">
                                            <img src={getAvatarUrl(friend.avatar, friend.name, friend.id)} className="w-full h-full object-cover rounded-[0.8rem]" alt="Friend avatar" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-app-text text-[13px] truncate">{friend.name}</p>
                                            <p className="text-[9px] font-black text-app-text-muted uppercase tracking-[0.1em]">#{friend.takwira_id || 'CREW'}</p>
                                        </div>
                                        <button
                                            onClick={() => handleInviteFriend(friend.id)}
                                            className="bg-primary hover:bg-primary-dark text-slate-900 h-10 px-5 rounded-[1rem] font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-primary/20 border-2 border-primary/20"
                                        >
                                            INVITE
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Match Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[101] bg-app-bg/80 backdrop-blur-md flex items-end justify-center p-6 animate-in fade-in duration-500">
                    <div className="bg-app-surface w-full max-w-sm rounded-[3.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-32 duration-700 relative border border-app-border max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setIsEditModalOpen(false)}
                            className="absolute top-6 right-6 w-10 h-10 bg-app-surface-2 rounded-full flex items-center justify-center text-app-text-muted hover:text-app-text active:scale-90 transition-all"
                        >
                            <span className="material-symbols-rounded">close</span>
                        </button>

                        <div className="mb-6">
                            <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-1">Edit Match</p>
                            <h2 className="text-2xl font-black text-app-text tracking-tighter uppercase leading-none">Modify Details</h2>
                        </div>

                        <form onSubmit={handleUpdateLobby} className="space-y-4">
                            {/* Match Name */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest block px-1">Match Name</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full bg-app-bg border-2 border-app-border rounded-[1.2rem] px-4 py-3 font-black text-app-text focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    required
                                />
                            </div>

                            {/* Level & Age Group */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest block px-1">{t('spaces.level_label')}</label>
                                    <div className="relative">
                                        <select
                                            value={editLevel}
                                            onChange={(e) => setEditLevel(e.target.value)}
                                            className="w-full bg-app-bg border-2 border-app-border rounded-[1.2rem] px-4 py-3 font-black text-app-text appearance-none focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        >
                                            <option value="all">All Levels</option>
                                            <option value="beginner">Beginner</option>
                                            <option value="intermediate">Intermediate</option>
                                            <option value="advanced">Advanced</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-app-text-muted">
                                            <span className="material-symbols-rounded text-sm">unfold_more</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest block px-1">{t('spaces.age_label')}</label>
                                    <input
                                        type="text"
                                        value={editAgeRange}
                                        onChange={(e) => setEditAgeRange(e.target.value)}
                                        className="w-full bg-app-bg border-2 border-app-border rounded-[1.2rem] px-4 py-3 font-black text-app-text focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="e.g. 18-35"
                                    />
                                </div>
                            </div>

                            {/* Players Per Team Slider */}
                            <div className="space-y-2.5 bg-app-surface-2 p-4 rounded-[1.5rem] border border-app-border/30">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">{t('spaces.team_size_label')}</label>
                                    <span className="bg-primary/10 text-primary px-3 py-0.5 rounded-full text-xs font-black ring-1 ring-primary/20">
                                        {editTeamSize} vs {editTeamSize}
                                    </span>
                                </div>
                                <div className="px-1">
                                    <input
                                        type="range"
                                        min="2"
                                        max="11"
                                        step="1"
                                        value={editTeamSize}
                                        onChange={(e) => setEditTeamSize(parseInt(e.target.value))}
                                        className="w-full h-2 bg-app-bg rounded-lg appearance-none cursor-pointer accent-primary border border-app-border/50"
                                    />
                                    <div className="flex justify-between mt-1.5 px-0.5">
                                        <span className="text-[8px] font-black text-app-text-muted/50">2v2</span>
                                        <span className="text-[8px] font-black text-app-text-muted/50">11v11</span>
                                    </div>
                                </div>
                            </div>

                            {/* Date & Time Selection */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest block px-1">{t('spaces.date_label')}</label>
                                    <input
                                        type="date"
                                        value={editPreferredDate}
                                        onChange={(e) => setEditPreferredDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full bg-app-bg border-2 border-app-border rounded-[1.2rem] px-4 py-3 font-black text-app-text focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest block px-1">{t('spaces.time_label')}</label>
                                    <input
                                        type="time"
                                        value={editPreferredTime}
                                        onChange={(e) => setEditPreferredTime(e.target.value)}
                                        className="w-full bg-app-bg border-2 border-app-border rounded-[1.2rem] px-4 py-3 font-black text-app-text focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Match Type Selection */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditType('public')}
                                    className={`py-3 rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${editType === 'public'
                                        ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20'
                                        : 'bg-app-bg text-app-text-muted border-2 border-app-border'
                                        }`}
                                >
                                    <span className="material-symbols-rounded text-sm">public</span>
                                    {t('spaces.lobby_type_public')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditType('private')}
                                    className={`py-3 rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${editType === 'private'
                                        ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20'
                                        : 'bg-app-bg text-app-text-muted border-2 border-app-border'
                                        }`}
                                >
                                    <span className="material-symbols-rounded text-sm">lock</span>
                                    {t('spaces.lobby_type_private')}
                                </button>
                            </div>

                            {/* Bottom Action Bar */}
                            <div className="flex gap-3 items-stretch pt-2">
                                <div className="bg-app-surface-2 px-4 py-1 rounded-[1.5rem] flex flex-col justify-center flex-1 border border-app-border/30">
                                    <span className="text-[8px] font-black text-app-text-muted uppercase tracking-widest leading-none mb-0.5">{t('spaces.price_per_player')}</span>
                                    <span className="text-base font-black text-primary leading-none">{lobby?.price_per_player || 0} TND</span>
                                </div>

                                <button
                                    type="submit"
                                    className="flex-[1.8] bg-primary text-slate-900 py-4 rounded-[1.5rem] font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all text-xs flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-rounded text-lg">check_circle</span>
                                    {t('common.save_changes')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Success/Error Modals */}
            <SuccessModal
                isOpen={successModal.isOpen}
                title="Success"
                message={successModal.message}
                onClose={() => setSuccessModal({ isOpen: false, message: '' })}
            />
            <SuccessModal
                isOpen={errorModal.isOpen}
                title="Error"
                message={errorModal.message}
                onClose={() => setErrorModal({ isOpen: false, message: '' })}
            />

            {/* Leave Lobby Confirmation Modal */}
            <ConfirmationModal
                isOpen={leaveModalOpen}
                title="Leave Lobby"
                message="Are you sure you want to leave this lobby? You will need to request access again to rejoin."
                confirmText="Leave"
                cancelText="Cancel"
                type="warning"
                onConfirm={handleLeaveLobby}
                onCancel={() => setLeaveModalOpen(false)}
            />

            {/* Kick Member Confirmation Modal */}
            <ConfirmationModal
                isOpen={kickModalOpen}
                title="Remove Member"
                message={`Are you sure you want to remove ${memberToKick?.userName} from this lobby?`}
                confirmText="Remove"
                cancelText="Cancel"
                type="danger"
                onConfirm={handleKickMember}
                onCancel={() => {
                    setKickModalOpen(false);
                    setMemberToKick(null);
                }}
            />
        </div >
    );
};

export default LobbyDetailPage;
