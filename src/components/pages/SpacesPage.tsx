import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getLobbies,
    createLobby,
    getTeams,
    createTeam,
    joinLobby,
    getFriendships,
    inviteToLobby,
    addTeamMember,
    deleteLobby,
    getComplexes,
    getUserLocation
} from '@/services/dataService';
import { useTranslation } from 'react-i18next';
import { ConfirmationModal, SuccessModal } from '@/components/common/ConfirmationModal';
import { getAvatarUrl } from '@/utils';

const SpacesPage = ({ currentUser }: { currentUser: any }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'lobbies' | 'teams'>('lobbies');
    const [lobbies, setLobbies] = useState<any[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

    // Modal states
    const [isLobbyModalOpen, setIsLobbyModalOpen] = useState(false);
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [maxPlayers, setMaxPlayers] = useState(10);
    const [lobbyType, setLobbyType] = useState<'private' | 'public'>('public');
    const [selectedComplexId, setSelectedComplexId] = useState<string>('');
    const [preferredDate, setPreferredDate] = useState<string>('');
    const [preferredTime, setPreferredTime] = useState<string>('18:00');
    const [complexes, setComplexes] = useState<any[]>([]);
    const [requestAccessModal, setRequestAccessModal] = useState<{ isOpen: boolean; lobbyId: string | null }>({ isOpen: false, lobbyId: null });
    const [requestMessage, setRequestMessage] = useState<string>('');

    useEffect(() => {
        fetchUserLocation();
        fetchComplexes();
    }, []);

    useEffect(() => {
        if (userLocation || !currentUser) {
            fetchData();
        }
    }, [userLocation, currentUser]);

    const fetchUserLocation = async () => {
        try {
            const location = await getUserLocation();
            setUserLocation(location);
        } catch (error) {
            console.error('Error fetching user location:', error);
        }
    };

    const fetchComplexes = async () => {
        try {
            const complexesData = await getComplexes();
            setComplexes(complexesData);
        } catch (error) {
            console.error('Error fetching complexes:', error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        const [lobbiesData, teamsData] = await Promise.all([
            getLobbies(currentUser?.id, userLocation || undefined),
            getTeams(currentUser?.id)
        ]);
        setLobbies(lobbiesData);
        setTeams(teamsData);
        setLoading(false);
    };

    const handleCreateLobby = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim() || !currentUser || !selectedComplexId || !preferredDate || !preferredTime) {
            setErrorModal({ isOpen: true, message: 'Please fill in all required fields' });
            return;
        }

        const { success, error } = await createLobby({
            name: newName.trim(),
            host_id: currentUser.id,
            complex_id: selectedComplexId,
            max_players: maxPlayers,
            type: lobbyType,
            preferred_date: preferredDate,
            preferred_time: preferredTime,
            status: 'open'
        });

        if (success) {
            setIsLobbyModalOpen(false);
            setNewName('');
            setSelectedComplexId('');
            setPreferredDate('');
            setPreferredTime('18:00');
            setLobbyType('public');
            setSuccessModal({ isOpen: true, message: 'Lobby created successfully!' });
            fetchData();
        } else {
            setErrorModal({ isOpen: true, message: error || 'Failed to create lobby' });
        }
    };

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim() || !currentUser) return;

        const { success, error } = await createTeam({
            name: newName.trim(),
            admin_id: currentUser.id,
            description: ''
        });

        if (success) {
            setIsTeamModalOpen(false);
            setNewName('');
            setSuccessModal({ isOpen: true, message: 'Team created successfully!' });
            fetchData();
        } else {
            setErrorModal({ isOpen: true, message: error || 'Failed to create team' });
        }
    };

    const handleJoinLobby = async (lobbyId: string) => {
        if (!currentUser) return;

        // Check if this is a public lobby that requires a request
        const lobby = lobbies.find(l => l.id === lobbyId);
        if (lobby?.type === 'public') {
            // Open modal to request access with optional message
            setRequestAccessModal({ isOpen: true, lobbyId });
            return;
        }

        // For private lobbies, they can't join directly
        setErrorModal({ isOpen: true, message: 'This is a private lobby. You need to be invited.' });
    };

    const handleRequestAccess = async () => {
        if (!requestAccessModal.lobbyId || !currentUser) return;

        const { success, error, message } = await joinLobby(
            requestAccessModal.lobbyId,
            currentUser.id,
            requestMessage.trim() || undefined
        );

        if (success) {
            setRequestAccessModal({ isOpen: false, lobbyId: null });
            setRequestMessage('');
            setSuccessModal({ isOpen: true, message: message || 'Access request sent!' });
            fetchData();
        } else {
            setErrorModal({ isOpen: true, message: error || 'Failed to send access request' });
        }
    };

    const handleDeleteLobby = async (lobbyId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent navigation when clicking delete
        if (!currentUser) return;
        setLobbyToDelete(lobbyId);
        setDeleteModalOpen(true);
    };

    const confirmDeleteLobby = async () => {
        if (!lobbyToDelete || !currentUser) return;

        const { success, error } = await deleteLobby(lobbyToDelete, currentUser.id);
        setDeleteModalOpen(false);
        setLobbyToDelete(null);

        if (success) {
            setSuccessModal({ isOpen: true, message: 'Lobby deleted successfully' });
            fetchData();
        } else {
            setErrorModal({ isOpen: true, message: error || 'Failed to delete lobby' });
        }
    };

    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteMode, setInviteMode] = useState<'lobby' | 'team'>('lobby');
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [userFriends, setUserFriends] = useState<any[]>([]);

    // Delete confirmation modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [lobbyToDelete, setLobbyToDelete] = useState<string | null>(null);

    // Success/Error modals
    const [successModal, setSuccessModal] = useState({ isOpen: false, message: '' });
    const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });

    const openInviteModal = async (item: any, mode: 'lobby' | 'team') => {
        if (!currentUser) return;
        setSelectedItem(item);
        setInviteMode(mode);

        const friendships = await getFriendships(currentUser.id);
        const acceptedFriends = friendships
            .filter((f: any) => f.status === 'accepted')
            .map((f: any) => f.user_id === currentUser.id ? f.friend : f.user);

        const inviteable = acceptedFriends.filter((friend: any) =>
            !item.members?.some((m: any) => m.user_id === friend.id)
        );

        setUserFriends(inviteable);
        setIsInviteModalOpen(true);
    };

    const handleInviteFriend = async (friendId: string) => {
        if (!selectedItem || !currentUser) return;

        let success, error;
        if (inviteMode === 'lobby') {
            const res = await inviteToLobby(selectedItem.id, friendId, currentUser.id);
            success = res.success;
            error = res.error;
        } else {
            const res = await addTeamMember(selectedItem.id, friendId);
            success = res.success;
            error = res.error;
        }

        if (success) {
            setUserFriends(prev => prev.filter(f => f.id !== friendId));
            setSuccessModal({ isOpen: true, message: 'Friend invited successfully!' });
            fetchData();
        } else {
            setErrorModal({ isOpen: true, message: error || 'Failed to invite friend' });
        }
    };

    return (
        <div className="min-h-screen bg-app-bg pb-[calc(8rem+env(safe-area-inset-bottom))] font-sans transition-colors duration-300">
            {/* Premium Header */}
            <header className="px-8 pt-[calc(3.5rem+env(safe-area-inset-top))] pb-8 sticky top-0 z-40 bg-app-bg/80 backdrop-blur-xl border-b border-app-border">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <p className="text-app-text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-1">{t('spaces.collaboration')}</p>
                        <h1 className="text-3xl font-black tracking-tighter text-app-text">{t('spaces.title')}</h1>
                    </div>
                    <div className="w-12 h-12 bg-app-surface-2 rounded-2xl flex items-center justify-center border border-app-border shadow-sm text-primary">
                        <span className="material-symbols-rounded">groups</span>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 p-1.5 bg-app-surface/50 rounded-[2rem] border border-app-border shadow-inner">
                    {[
                        { key: 'lobbies', label: t('spaces.lobbies_tab'), icon: 'stadium' },
                        { key: 'teams', label: t('spaces.teams_tab'), icon: 'shield_person' }
                    ].map(({ key, label, icon }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key as any)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[1.5rem] transition-all duration-500 ${activeTab === key
                                ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20'
                                : 'text-app-text-muted hover:text-app-text hover:bg-app-surface-2'
                                }`}
                        >
                            <span className="material-symbols-rounded text-lg">{icon}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
                        </button>
                    ))}
                </div>
            </header>

            {/* Content Section */}
            <div className="px-8">
                {activeTab === 'lobbies' ? (
                    <div className="space-y-6">
                        {/* Start Lobby Hero */}
                        <button
                            onClick={() => setIsLobbyModalOpen(true)}
                            className="w-full bg-app-surface/30 border-2 border-dashed border-app-border p-8 rounded-[3.5rem] flex flex-col items-center justify-center gap-3 group hover:border-primary/50 hover:bg-app-surface/50 transition-all active:scale-[0.98] shadow-inner"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-app-surface-2 flex items-center justify-center text-app-text-muted group-hover:text-primary group-hover:bg-primary/10 transition-all group-hover:rotate-12">
                                <span className="material-symbols-rounded text-3xl">add</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-sm font-black text-app-text uppercase tracking-widest">{t('spaces.start_lobby')}</span>
                                <span className="text-[10px] text-app-text-muted font-bold uppercase tracking-tight">{t('spaces.gather_players')}</span>
                            </div>
                        </button>

                        {loading ? (
                            <div className="bg-app-surface-2 p-20 rounded-[3.5rem] flex flex-col items-center justify-center border border-app-border shadow-inner">
                                <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                                <p className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">{t('spaces.finding_matches')}</p>
                            </div>
                        ) : lobbies.length === 0 ? (
                            <div className="bg-app-surface-2 p-20 rounded-[4rem] text-center border border-app-border shadow-inner">
                                <div className="w-20 h-20 bg-app-surface-2 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                    <span className="material-symbols-rounded text-4xl text-app-text-muted">sports_soccer</span>
                                </div>
                                <p className="text-app-text font-extrabold text-lg mb-2">{t('spaces.no_lobbies')}</p>
                                <p className="text-app-text-muted text-xs leading-relaxed max-w-[200px] mx-auto">{t('spaces.be_first')}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {lobbies.map(lobby => (
                                    <div
                                        key={lobby.id}
                                        className="bg-app-surface/50 backdrop-blur-md p-6 rounded-[2.5rem] border border-app-border shadow-lg hover:bg-app-surface transition-all duration-500 group cursor-pointer animate-in fade-in slide-in-from-bottom-4 relative overflow-hidden"
                                        onClick={() => {
                                            // Check if user has access before navigating
                                            const isHost = lobby.host_id === currentUser?.id;
                                            const isMember = lobby.members?.some((m: any) => m.user_id === currentUser?.id && m.status === 'joined');
                                            const isPublic = lobby.type === 'public';

                                            if (isHost || isMember || isPublic) {
                                                navigate(`/lobby/${lobby.id}`);
                                            } else {
                                                // For private lobbies, user needs to be invited
                                                setErrorModal({ isOpen: true, message: 'This is a private lobby. You need to be invited to view it.' });
                                            }
                                        }}
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                        <div className="flex justify-between items-start mb-6 relative z-10">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-black text-xl text-app-text tracking-tight group-hover:text-primary transition-colors">{lobby.name}</h3>
                                                    {lobby.type && (
                                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${lobby.type === 'public'
                                                            ? 'bg-primary/20 text-primary border border-primary/30'
                                                            : 'bg-app-surface-2 text-app-text-muted border border-app-border'
                                                            }`}>
                                                            {lobby.type}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="material-symbols-rounded text-sm text-primary">stadium</span>
                                                    <span className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">
                                                        {lobby.complex?.name || 'Local Ground'}
                                                    </span>
                                                </div>
                                                {(lobby.preferred_date || lobby.preferred_time) && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="material-symbols-rounded text-sm text-app-text-muted">schedule</span>
                                                        <span className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">
                                                            {lobby.preferred_date ? new Date(lobby.preferred_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                                                            {lobby.preferred_date && lobby.preferred_time ? ' • ' : ''}
                                                            {lobby.preferred_time || ''}
                                                        </span>
                                                    </div>
                                                )}
                                                {lobby._distance !== undefined && (
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <span className="material-symbols-rounded text-xs text-app-text-muted">location_on</span>
                                                        <span className="text-[9px] font-black text-app-text-muted">
                                                            {lobby._distance < 1 ? `${Math.round(lobby._distance * 1000)}m` : `${lobby._distance.toFixed(1)}km`} away
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="bg-app-surface-2 text-app-text px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-app-border shadow-lg">
                                                {lobby.members?.length || 0}<span className="text-app-text-muted mx-1">/</span>{lobby.max_players}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-auto relative z-10">
                                            <div className="flex -space-x-3">
                                                {Array.from({ length: Math.min(lobby.members?.length || 0, 5) }).map((_, i) => (
                                                    <div key={i} className="w-9 h-9 rounded-xl border-2 border-app-bg bg-app-surface-2 overflow-hidden shadow-sm">
                                                        <img
                                                            src={getAvatarUrl(lobby.members?.[i]?.user?.avatar, lobby.members?.[i]?.user?.name, lobby.members?.[i]?.user?.id)}
                                                            className="w-full h-full object-cover"
                                                            alt="Member"
                                                        />
                                                    </div>
                                                ))}
                                                {(lobby.members?.length > 5) && (
                                                    <div className="w-9 h-9 rounded-xl border-2 border-app-bg bg-app-surface-2 flex items-center justify-center text-[10px] font-black text-primary">
                                                        +{lobby.members.length - 5}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                                {/* Delete button - only show for lobby owner */}
                                                {lobby.host_id === currentUser?.id && (
                                                    <button
                                                        onClick={(e) => handleDeleteLobby(lobby.id, e)}
                                                        className="w-11 h-11 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all shadow-sm active:scale-90"
                                                        title="Delete Lobby"
                                                    >
                                                        <span className="material-symbols-rounded">delete</span>
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => openInviteModal(lobby, 'lobby')}
                                                    className="w-11 h-11 rounded-2xl bg-app-surface-2 border border-app-border flex items-center justify-center text-app-text-muted hover:text-primary hover:bg-app-surface-2 transition-all shadow-sm active:scale-90"
                                                >
                                                    <span className="material-symbols-rounded">person_add</span>
                                                </button>
                                                {lobby.type === 'public' ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent navigation
                                                            handleJoinLobby(lobby.id);
                                                        }}
                                                        disabled={lobby.members?.some((m: any) =>
                                                            m.user_id === currentUser?.id &&
                                                            (m.status === 'joined' || m.status === 'requested')
                                                        )}
                                                        className={`h-11 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${lobby.members?.some((m: any) =>
                                                            m.user_id === currentUser?.id &&
                                                            (m.status === 'joined' || m.status === 'requested')
                                                        )
                                                            ? 'bg-app-surface-2 text-app-text-muted border border-app-border'
                                                            : 'bg-primary text-slate-900 shadow-lg shadow-primary/20 active:scale-95 hover:bg-primary-dark'
                                                            }`}
                                                    >
                                                        {lobby.members?.some((m: any) =>
                                                            m.user_id === currentUser?.id && m.status === 'joined'
                                                        ) ? t('spaces.joined') :
                                                            lobby.members?.some((m: any) =>
                                                                m.user_id === currentUser?.id && m.status === 'requested'
                                                            ) ? t('spaces.requested') : t('spaces.request_access')}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => openInviteModal(lobby, 'lobby')}
                                                        disabled={lobby.members?.some((m: any) => m.user_id === currentUser?.id)}
                                                        className={`h-11 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${lobby.members?.some((m: any) => m.user_id === currentUser?.id)
                                                            ? 'bg-app-surface-2 text-app-text-muted border border-app-border'
                                                            : 'bg-app-surface-2 text-app-text-muted border border-app-border hover:bg-app-surface-2'
                                                            }`}
                                                    >
                                                        {lobby.members?.some((m: any) => m.user_id === currentUser?.id) ? t('spaces.joined') : t('spaces.private')}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Create Team Hero */}
                        <button
                            onClick={() => setIsTeamModalOpen(true)}
                            className="w-full bg-app-surface/30 border-2 border-dashed border-app-border p-8 rounded-[3.5rem] flex flex-col items-center justify-center gap-3 group hover:border-primary/50 hover:bg-app-surface/50 transition-all active:scale-[0.98] shadow-inner"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-app-surface-2 flex items-center justify-center text-app-text-muted group-hover:text-primary group-hover:bg-primary/10 transition-all group-hover:rotate-12">
                                <span className="material-symbols-rounded text-3xl">shield_person</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-sm font-black text-app-text uppercase tracking-widest">{t('spaces.form_team')}</span>
                                <span className="text-[10px] text-app-text-muted font-bold uppercase tracking-tight">{t('spaces.create_club')}</span>
                            </div>
                        </button>

                        {loading ? (
                            <div className="bg-app-surface-2 p-20 rounded-[3.5rem] flex flex-col items-center justify-center border border-app-border shadow-inner">
                                <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                                <p className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">{t('spaces.loading_clubs')}</p>
                            </div>
                        ) : teams.length === 0 ? (
                            <div className="bg-app-surface-2 p-20 rounded-[4rem] text-center border border-app-border shadow-inner">
                                <div className="w-20 h-20 bg-app-surface-2 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                    <span className="material-symbols-rounded text-4xl text-app-text-muted">shield</span>
                                </div>
                                <p className="text-app-text font-extrabold text-lg mb-2">{t('spaces.no_teams')}</p>
                                <p className="text-app-text-muted text-xs leading-relaxed max-w-[200px] mx-auto">{t('spaces.start_team_sub')}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {teams.map(team => (
                                    <div
                                        key={team.id}
                                        className="bg-app-surface/50 backdrop-blur-md p-6 rounded-[2.5rem] border border-app-border shadow-lg hover:bg-app-surface transition-all duration-500 group flex gap-5 items-center cursor-pointer animate-in fade-in slide-in-from-bottom-4"
                                        onClick={() => navigate(`/team/${team.id}`)}
                                    >
                                        <div className="w-20 h-20 rounded-[2rem] bg-app-surface flex items-center justify-center border border-app-border overflow-hidden relative shadow-inner p-1 group-hover:border-primary/30 transition-colors">
                                            {team.avatar_url ? (
                                                <img src={team.avatar_url} className="w-full h-full object-cover rounded-[1.6rem]" alt="Team logo" />
                                            ) : (
                                                <span className="material-symbols-rounded text-4xl text-app-text-muted">shield</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-black text-xl text-app-text truncate group-hover:text-primary transition-colors tracking-tight">{team.name}</h3>
                                            <p className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-3">
                                                {t('spaces.members_count', { count: team.members?.length || 0 })}
                                            </p>
                                            <div className="flex -space-x-2">
                                                {Array.from({ length: Math.min(team.members?.length || 0, 3) }).map((_, i) => (
                                                    <div key={i} className="w-8 h-8 rounded-xl border-2 border-app-bg bg-app-surface-2 overflow-hidden shadow-sm">
                                                        <img src={getAvatarUrl(team.members?.[i]?.user?.avatar, team.members?.[i]?.user?.name, team.members?.[i]?.user?.id)} className="w-full h-full object-cover" alt="Member" />
                                                    </div>
                                                ))}
                                                {(team.members?.length > 3) && (
                                                    <div className="w-8 h-8 rounded-xl border-2 border-app-bg bg-app-surface-2 flex items-center justify-center text-[9px] font-black text-primary">
                                                        +{team.members.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => openInviteModal(team, 'team')}
                                                className="w-11 h-11 rounded-2xl bg-app-surface-2 border border-app-border flex items-center justify-center text-app-text-muted hover:text-primary hover:bg-app-surface-2 transition-all shadow-sm active:scale-90"
                                            >
                                                <span className="material-symbols-rounded">person_add</span>
                                            </button>
                                            <button className="w-11 h-11 rounded-2xl bg-app-surface-2 flex items-center justify-center text-app-text-muted hover:text-app-text transition-all active:scale-90">
                                                <span className="material-symbols-rounded">chevron_right</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Premium Modals */}
            {(isLobbyModalOpen || isTeamModalOpen) && (
                <div className="fixed inset-0 z-[100] bg-app-bg/80 backdrop-blur-md flex items-end justify-center p-6 animate-in fade-in duration-500">
                    <div className="bg-app-surface w-full max-w-sm rounded-[3.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-32 duration-700 relative border border-app-border">
                        <button
                            onClick={() => { setIsLobbyModalOpen(false); setIsTeamModalOpen(false); }}
                            className="absolute top-6 right-6 w-10 h-10 bg-app-surface-2 rounded-full flex items-center justify-center text-app-text-muted hover:text-app-text active:scale-90 transition-all"
                        >
                            <span className="material-symbols-rounded">close</span>
                        </button>

                        <div className="mb-8">
                            <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-1">{t('spaces.new_space')}</p>
                            <h2 className="text-2xl font-black text-app-text tracking-tighter">
                                {isLobbyModalOpen ? t('spaces.create_lobby') : t('spaces.register_team')}
                            </h2>
                        </div>

                        <form
                            onSubmit={isLobbyModalOpen ? handleCreateLobby : handleCreateTeam}
                            className="space-y-8"
                        >
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest block px-1">{t('spaces.display_name')}</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder={isLobbyModalOpen ? "Saturday Night..." : "Club Elite..."}
                                    className="w-full bg-app-bg border-2 border-app-border rounded-[1.5rem] px-6 py-4 font-black text-app-text placeholder:text-app-text-muted/40 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                />
                            </div>

                            {isLobbyModalOpen && (
                                <>
                                    {/* Lobby Type */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest block px-1">{t('spaces.lobby_type')}</label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setLobbyType('public')}
                                                className={`flex-1 py-3 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${lobbyType === 'public'
                                                    ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20'
                                                    : 'bg-app-surface-2 text-app-text-muted border border-app-border hover:bg-app-surface-2'
                                                    }`}
                                            >
                                                {t('spaces.public')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setLobbyType('private')}
                                                className={`flex-1 py-3 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${lobbyType === 'private'
                                                    ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20'
                                                    : 'bg-app-surface-2 text-app-text-muted border border-app-border hover:bg-app-surface-2'
                                                    }`}
                                            >
                                                {t('spaces.private')}
                                            </button>
                                        </div>
                                        <p className="text-[9px] text-app-text-muted px-1">
                                            {lobbyType === 'public' ? t('spaces.lobby_public_sub') : t('spaces.lobby_private_sub')}
                                        </p>
                                    </div>

                                    {/* Complex Selection */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest block px-1">{t('spaces.venue_label')}</label>
                                        <select
                                            value={selectedComplexId}
                                            onChange={(e) => setSelectedComplexId(e.target.value)}
                                            className="w-full bg-app-bg border-2 border-app-border rounded-[1.5rem] px-6 py-4 font-black text-app-text focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            required
                                        >
                                            <option value="">{t('spaces.select_venue')}</option>
                                            {complexes.map(complex => (
                                                <option key={complex.id} value={complex.id} className="bg-app-surface">
                                                    {complex.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Date Selection */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest block px-1">{t('spaces.date_label')}</label>
                                        <input
                                            type="date"
                                            value={preferredDate}
                                            onChange={(e) => setPreferredDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full bg-app-bg border-2 border-app-border rounded-[1.5rem] px-6 py-4 font-black text-app-text focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            required
                                        />
                                    </div>

                                    {/* Time Selection */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest block px-1">{t('spaces.time_label')}</label>
                                        <input
                                            type="time"
                                            value={preferredTime}
                                            onChange={(e) => setPreferredTime(e.target.value)}
                                            className="w-full bg-app-bg border-2 border-app-border rounded-[1.5rem] px-6 py-4 font-black text-app-text focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            required
                                        />
                                    </div>

                                    {/* Capacity */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">{t('spaces.capacity')}</label>
                                            <span className="text-sm font-black text-primary">{t('spaces.players_count', { count: maxPlayers })}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="2"
                                            max="22"
                                            step="2"
                                            value={maxPlayers}
                                            onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-app-surface rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                        <div className="flex justify-between text-[8px] font-black text-app-text-muted uppercase tracking-widest">
                                            <span>{t('spaces.players_count', { count: 2 })}</span>
                                            <span>{t('spaces.players_count', { count: 22 })}</span>
                                        </div>
                                    </div>
                                </>
                            )}

                            <button
                                type="submit"
                                disabled={!newName.trim()}
                                className="w-full bg-primary text-slate-900 py-5 rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all text-[11px] disabled:opacity-20"
                            >
                                {isLobbyModalOpen ? 'Launch Lobby' : 'Establish Club'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Premium Invite Modal */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 z-[110] bg-app-bg/80 backdrop-blur-md flex items-end justify-center p-6 animate-in fade-in duration-500">
                    <div className="bg-app-surface w-full max-w-sm rounded-[3.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-32 duration-700 flex flex-col max-h-[80vh] relative border border-app-border">
                        <button
                            onClick={() => setIsInviteModalOpen(false)}
                            className="absolute top-6 right-6 w-10 h-10 bg-app-surface-2 rounded-full flex items-center justify-center text-app-text-muted hover:text-app-text active:scale-90 transition-all"
                        >
                            <span className="material-symbols-rounded">close</span>
                        </button>

                        <div className="mb-8">
                            <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-1">{t('spaces.send_invites')}</p>
                            <h2 className="text-2xl font-black text-app-text tracking-tighter">{t('spaces.invite_crew')}</h2>
                            <p className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest mt-1">{t('spaces.to_label')} {selectedItem?.name}</p>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-4 no-scrollbar">
                            {userFriends.length === 0 ? (
                                <div className="py-20 text-center">
                                    <div className="w-16 h-16 bg-app-surface-2 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <span className="material-symbols-rounded text-app-text-muted">person_off</span>
                                    </div>
                                    <p className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">{t('spaces.no_friends')}</p>
                                </div>
                            ) : (
                                userFriends.map(friend => (
                                    <div key={friend.id} className="flex items-center gap-4 p-4 bg-app-bg/50 rounded-[1.5rem] border border-app-border hover:bg-app-bg transition-colors group">
                                        <div className="w-12 h-12 rounded-[1rem] overflow-hidden border border-app-bg p-0.5 bg-app-surface-2 shadow-sm shrink-0">
                                            <img src={getAvatarUrl(friend.avatar, friend.name, friend.id)} className="w-full h-full object-cover rounded-[0.8rem]" alt="Friend" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-app-text text-[13px] truncate">{friend.name}</p>
                                            <p className="text-[9px] font-black text-app-text-muted tracking-widest uppercase">#{friend.takwira_id || 'PRO'}</p>
                                        </div>
                                        <button
                                            onClick={() => handleInviteFriend(friend.id)}
                                            className="bg-primary hover:bg-primary-dark text-slate-900 h-10 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-primary/10"
                                        >
                                            {t('spaces.invite_btn')}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Request Access Modal */}
            {requestAccessModal.isOpen && requestAccessModal.lobbyId && (
                <div className="fixed inset-0 z-[100] bg-app-bg/80 backdrop-blur-md flex items-end justify-center p-6 animate-in fade-in duration-500">
                    <div className="bg-app-surface w-full max-w-sm rounded-[3.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-32 duration-700 relative border border-app-border">
                        <button
                            onClick={() => {
                                setRequestAccessModal({ isOpen: false, lobbyId: null });
                                setRequestMessage('');
                            }}
                            className="absolute top-6 right-6 w-10 h-10 bg-app-surface-2 rounded-full flex items-center justify-center text-app-text-muted hover:text-app-text active:scale-90 transition-all"
                        >
                            <span className="material-symbols-rounded">close</span>
                        </button>

                        <div className="mb-8">
                            <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-1">{t('spaces.request_access')}</p>
                            <h2 className="text-2xl font-black text-app-text tracking-tighter">
                                {t('spaces.send_request')}
                            </h2>
                            <p className="text-[10px] text-app-text-muted mt-2">
                                {t('spaces.optional_msg')}
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest block px-1">{t('spaces.message_optional')}</label>
                                <textarea
                                    value={requestMessage}
                                    onChange={(e) => setRequestMessage(e.target.value)}
                                    placeholder={t('spaces.request_placeholder')}
                                    rows={4}
                                    className="w-full bg-app-bg border-2 border-app-border rounded-[1.5rem] px-6 py-4 font-black text-app-text placeholder:text-app-text-muted/40 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setRequestAccessModal({ isOpen: false, lobbyId: null });
                                        setRequestMessage('');
                                    }}
                                    className="flex-1 bg-app-surface-2 text-app-text-muted py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] hover:bg-app-surface-2 transition-all active:scale-95"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={handleRequestAccess}
                                    className="flex-1 bg-primary text-slate-900 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 active:scale-95 transition-all"
                                >
                                    {t('spaces.send_request')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModalOpen}
                title="Delete Lobby"
                message="Are you sure you want to delete this lobby? This action cannot be undone and all members will be removed."
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                onConfirm={confirmDeleteLobby}
                onCancel={() => {
                    setDeleteModalOpen(false);
                    setLobbyToDelete(null);
                }}
            />

            {/* Success Modal */}
            <SuccessModal
                isOpen={successModal.isOpen}
                title="Success"
                message={successModal.message}
                buttonText="OK"
                onClose={() => setSuccessModal({ isOpen: false, message: '' })}
            />

            {/* Error Modal */}
            <ConfirmationModal
                isOpen={errorModal.isOpen}
                title="Error"
                message={errorModal.message}
                confirmText="OK"
                cancelText=""
                type="danger"
                onConfirm={() => setErrorModal({ isOpen: false, message: '' })}
                onCancel={() => setErrorModal({ isOpen: false, message: '' })}
            />
        </div>
    );
};

export default SpacesPage;
