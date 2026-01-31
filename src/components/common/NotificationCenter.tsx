import React, { useState, useEffect } from 'react';
import { supabase, respondToLobbyRequest } from '@/services/dataService';
import { useNavigate } from 'react-router-dom';

interface NotificationCenterProps {
    pendingCount: number;
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

const NotificationCenter = ({ isOpen, onClose, userId }: NotificationCenterProps) => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen && userId) {
            fetchNotifications();
            // Mark all current notifications as seen when notification center opens
            markNotificationsAsSeen();
        }
    }, [isOpen, userId]);

    const markNotificationsAsSeen = async () => {
        if (!userId) return;
        try {
            // Get all current notifications
            const { data: friendRequests } = await supabase
                .from('friendships')
                .select('id')
                .eq('friend_id', userId)
                .eq('status', 'pending');

            const { data: lobbyInvites } = await supabase
                .from('lobby_members')
                .select('lobby_id, user_id')
                .eq('user_id', userId)
                .eq('status', 'invited');

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const { data: newComplexes } = await supabase
                .from('complexes')
                .select('id')
                .gte('created_at', sevenDaysAgo.toISOString());

            const { data: newPitches } = await supabase
                .from('pitches')
                .select('id')
                .gte('created_at', sevenDaysAgo.toISOString());

            // Mark all as seen in localStorage
            const seenNotificationsKey = `seen_notifications_${userId}`;
            const currentSeen: string[] = JSON.parse(localStorage.getItem(seenNotificationsKey) || '[]');
            const newSeen = [...currentSeen];

            (friendRequests || []).forEach(fr => {
                if (!newSeen.includes(`friend_${fr.id}`)) newSeen.push(`friend_${fr.id}`);
            });
            (lobbyInvites || []).forEach(li => {
                const notificationId = `lobby_${li.lobby_id}_${li.user_id}`;
                if (!newSeen.includes(notificationId)) newSeen.push(notificationId);
            });

            // Mark lobby access requests as seen
            const { data: userLobbies } = await supabase
                .from('lobbies')
                .select('id')
                .eq('host_id', userId);

            if (userLobbies && userLobbies.length > 0) {
                const lobbyIds = userLobbies.map(l => l.id);
                const { data: lobbyRequests } = await supabase
                    .from('lobby_members')
                    .select('lobby_id, user_id')
                    .eq('status', 'requested')
                    .in('lobby_id', lobbyIds);

                (lobbyRequests || []).forEach(lr => {
                    const notificationId = `lobby_request_${lr.lobby_id}_${lr.user_id}`;
                    if (!newSeen.includes(notificationId)) newSeen.push(notificationId);
                });
            }
            (newComplexes || []).forEach(c => {
                if (!newSeen.includes(`venue_${c.id}`)) newSeen.push(`venue_${c.id}`);
            });
            (newPitches || []).forEach(p => {
                if (!newSeen.includes(`pitch_${p.id}`)) newSeen.push(`pitch_${p.id}`);
            });

            localStorage.setItem(seenNotificationsKey, JSON.stringify(newSeen));
        } catch (error) {
            console.error('Error marking notifications as seen:', error);
        }
    };

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            // 1. Fetch Friend Requests
            const { data: friendRequests } = await supabase
                .from('friendships')
                .select('*, user:user_id(id, name, avatar)')
                .eq('friend_id', userId)
                .eq('status', 'pending');

            // 2. Fetch Lobby Invites (for current user)
            const { data: lobbyInvites } = await supabase
                .from('lobby_members')
                .select('*, lobby:lobby_id(id, name), invited_by_user:invited_by(id, name)')
                .eq('user_id', userId)
                .eq('status', 'invited');

            // 2b. Fetch Lobby Access Requests (for lobbies where user is host)
            const { data: userLobbies } = await supabase
                .from('lobbies')
                .select('id')
                .eq('host_id', userId);

            let lobbyAccessRequests: any[] = [];
            if (userLobbies && userLobbies.length > 0) {
                const lobbyIds = userLobbies.map(l => l.id);
                const { data: requests } = await supabase
                    .from('lobby_members')
                    .select('*, lobby:lobby_id(id, name), user:user_id(id, name, avatar)')
                    .eq('status', 'requested')
                    .in('lobby_id', lobbyIds);

                lobbyAccessRequests = requests || [];
            }

            // 3. Fetch New Complexes (created in last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const { data: newComplexes } = await supabase
                .from('complexes')
                .select('id, name, address, created_at')
                .gte('created_at', sevenDaysAgo.toISOString())
                .order('created_at', { ascending: false })
                .limit(10);

            // 4. Fetch New Pitches (created in last 7 days)
            const { data: newPitches } = await supabase
                .from('pitches')
                .select('id, name, sport_type, created_at, complexes(id, name)')
                .gte('created_at', sevenDaysAgo.toISOString())
                .order('created_at', { ascending: false })
                .limit(10);

            const allNotifications = [
                ...(friendRequests || []).map(r => ({ ...r, type: 'friend_request' })),
                ...(lobbyInvites || []).map(i => ({ ...i, type: 'lobby_invite' })),
                ...(lobbyAccessRequests || []).map(r => ({ ...r, type: 'lobby_access_request' })),
                ...(newComplexes || []).map(c => ({ ...c, type: 'new_venue' })),
                ...(newPitches || []).map(p => ({ ...p, type: 'new_pitch' }))
            ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setNotifications(allNotifications);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (type: string, id: string, action: 'accept' | 'decline', extraData?: any) => {
        try {
            if (type === 'friend_request') {
                if (action === 'accept') {
                    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', id);
                } else {
                    await supabase.from('friendships').delete().eq('id', id);
                }
            } else if (type === 'lobby_invite') {
                // For lobby_members, use composite key (lobby_id, user_id) instead of id
                const lobbyId = extraData?.lobby_id || (id.includes('_') ? id.split('_')[0] : null);
                const memberUserId = extraData?.user_id || (id.includes('_') ? id.split('_')[1] : null);

                if (!lobbyId || !memberUserId) {
                    console.error('Missing lobby_id or user_id for lobby invite action');
                    return;
                }

                if (action === 'accept') {
                    const { error } = await supabase
                        .from('lobby_members')
                        .update({ status: 'joined' })
                        .eq('lobby_id', lobbyId)
                        .eq('user_id', memberUserId);
                    if (error) throw error;
                } else {
                    const { error } = await supabase
                        .from('lobby_members')
                        .delete()
                        .eq('lobby_id', lobbyId)
                        .eq('user_id', memberUserId);
                    if (error) throw error;
                }
            } else if (type === 'lobby_access_request') {
                // Handle lobby access request (approve/decline)
                const lobbyId = extraData?.lobby_id || (id.includes('_') ? id.split('_')[0] : null);
                const memberUserId = extraData?.user_id || (id.includes('_') ? id.split('_')[1] : null);

                if (!lobbyId || !memberUserId) {
                    console.error('Missing lobby_id or user_id for lobby access request action');
                    return;
                }

                if (action === 'accept') {
                    const { success, error } = await respondToLobbyRequest(lobbyId, memberUserId, 'accepted', userId);
                    if (!success && error) throw new Error(error);
                } else {
                    const { success, error } = await respondToLobbyRequest(lobbyId, memberUserId, 'declined', userId);
                    if (!success && error) throw new Error(error);
                }
            }
            fetchNotifications();
            // Trigger a custom event to refresh notification count in parent
            window.dispatchEvent(new CustomEvent('notificationAction'));
        } catch (error) {
            console.error('Error handling notification action:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-black/60 animate-in fade-in duration-300">
            <div
                className="absolute inset-0"
                onClick={onClose}
            ></div>

            <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-app-surface shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in slide-in-from-right duration-500 flex flex-col font-sans border-l border-app-border">
                {/* Header */}
                <div className="p-8 pb-6 bg-app-surface flex justify-between items-center border-b border-app-border">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <span className="material-symbols-rounded text-2xl font-bold">notifications_active</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-app-text tracking-tighter uppercase">Activity</h2>
                            <p className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest">{notifications.length} Pending Actions</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center bg-app-surface-2 rounded-full text-app-text-muted hover:text-app-text transition-all active:scale-90"
                    >
                        <span className="material-symbols-rounded">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full shadow-inner"></div>
                            <p className="text-[10px] font-black text-app-text-muted uppercase tracking-widest animate-pulse">Scanning Pitch...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-20 px-8 flex flex-col items-center">
                            <div className="bg-app-surface-2 w-24 h-24 rounded-[3rem] flex items-center justify-center mb-6 shadow-inner border border-app-border">
                                <span className="material-symbols-rounded text-5xl text-app-text-muted opacity-20">inbox</span>
                            </div>
                            <h3 className="text-sm font-black text-app-text uppercase tracking-widest mb-2">Zero Drift</h3>
                            <p className="text-[10px] text-app-text-muted font-bold leading-relaxed uppercase tracking-widest">You're all caught up. <br />Go join a match!</p>
                        </div>
                    ) : (
                        notifications.map((notif) => {
                            const getNotificationContent = () => {
                                switch (notif.type) {
                                    case 'friend_request':
                                        return {
                                            icon: 'person_add',
                                            iconBg: 'bg-blue-500/10 text-blue-500',
                                            badge: 'Crew Invite',
                                            badgeColor: 'bg-blue-500/10 text-blue-500',
                                            title: <>{notif.user?.name} <span className="text-app-text-muted font-bold">wants to join your crew</span></>,
                                            showActions: true
                                        };
                                    case 'lobby_invite':
                                        return {
                                            icon: 'sports_soccer',
                                            iconBg: 'bg-primary/10 text-primary',
                                            badge: 'Lobby Invite',
                                            badgeColor: 'bg-primary/20 text-primary',
                                            title: <>{notif.invited_by_user?.name} <span className="text-app-text-muted font-bold">invited you to</span> {notif.lobby?.name}</>,
                                            showActions: true
                                        };
                                    case 'lobby_access_request':
                                        return {
                                            icon: 'person_add',
                                            iconBg: 'bg-amber-500/10 text-amber-500',
                                            badge: 'Access Request',
                                            badgeColor: 'bg-amber-500/20 text-amber-500',
                                            title: <>{notif.user?.name} <span className="text-app-text-muted font-bold">wants to join</span> {notif.lobby?.name}</>,
                                            subtitle: notif.request_message,
                                            showActions: true
                                        };
                                    case 'new_venue':
                                        return {
                                            icon: 'stadium',
                                            iconBg: 'bg-emerald-500/10 text-emerald-500',
                                            badge: 'New Venue',
                                            badgeColor: 'bg-emerald-500/20 text-emerald-500',
                                            title: <><span className="text-app-text font-black">{notif.name}</span> <span className="text-app-text-muted font-bold">just opened!</span></>,
                                            subtitle: notif.address,
                                            showActions: false,
                                            actionLabel: 'View Venue',
                                            actionLink: `/complex/${notif.id}`
                                        };
                                    case 'new_pitch':
                                        return {
                                            icon: 'sports_soccer',
                                            iconBg: 'bg-purple-500/10 text-purple-500',
                                            badge: 'New Pitch',
                                            badgeColor: 'bg-purple-500/20 text-purple-500',
                                            title: <><span className="text-app-text font-black">{notif.name}</span> <span className="text-app-text-muted font-bold">added at</span> {notif.complexes?.name}</>,
                                            subtitle: notif.sport_type ? `${notif.sport_type} pitch` : 'New pitch available',
                                            showActions: false,
                                            actionLabel: 'View Complex',
                                            actionLink: `/complex/${notif.complexes?.id}`
                                        };
                                    default:
                                        return null;
                                }
                            };

                            const content = getNotificationContent();
                            if (!content) return null;

                            return (
                                <div key={notif.id} className="group bg-app-surface-2 p-5 rounded-[2.5rem] border border-app-border shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 hover:shadow-xl">
                                    <div className="flex gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-500 ${content.iconBg}`}>
                                            <span className="material-symbols-rounded text-2xl font-bold">
                                                {content.icon}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${content.badgeColor}`}>
                                                    {content.badge}
                                                </span>
                                                <span className="text-[9px] text-app-text-muted font-bold uppercase tracking-widest">
                                                    {new Date(notif.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-[12px] text-app-text font-black mb-1 leading-tight uppercase tracking-tight">
                                                {content.title}
                                            </p>
                                            {content.subtitle && (
                                                <p className="text-[10px] text-app-text-muted font-bold mb-3">
                                                    {content.subtitle}
                                                </p>
                                            )}

                                            {content.showActions ? (
                                                <div className="flex gap-2 mt-4">
                                                    <button
                                                        onClick={() => handleAction(
                                                            notif.type,
                                                            notif.type === 'lobby_invite' || notif.type === 'lobby_access_request'
                                                                ? `${notif.lobby_id}_${notif.user_id || notif.user_id}`
                                                                : notif.id,
                                                            'accept',
                                                            (notif.type === 'lobby_invite' || notif.type === 'lobby_access_request')
                                                                ? { lobby_id: notif.lobby_id, user_id: notif.user_id }
                                                                : undefined
                                                        )}
                                                        className="flex-1 bg-primary text-slate-900 py-3 rounded-[1.2rem] text-[10px] font-black tracking-widest uppercase hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                                    >
                                                        <span className="material-symbols-rounded text-sm">check</span> Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(
                                                            notif.type,
                                                            notif.type === 'lobby_invite' || notif.type === 'lobby_access_request'
                                                                ? `${notif.lobby_id}_${notif.user_id || notif.user_id}`
                                                                : notif.id,
                                                            'decline',
                                                            (notif.type === 'lobby_invite' || notif.type === 'lobby_access_request')
                                                                ? { lobby_id: notif.lobby_id, user_id: notif.user_id }
                                                                : undefined
                                                        )}
                                                        className="flex-[0.6] bg-app-surface-2 text-app-text-muted py-3 rounded-[1.2rem] text-[10px] font-black tracking-widest uppercase hover:text-app-text transition-all active:scale-95 border border-app-border"
                                                    >
                                                        Ignore
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        if (content.actionLink) {
                                                            navigate(content.actionLink);
                                                            onClose();
                                                        }
                                                    }}
                                                    className="w-full bg-primary text-slate-900 py-3 rounded-[1.2rem] text-[10px] font-black tracking-widest uppercase hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mt-4"
                                                >
                                                    <span className="material-symbols-rounded text-sm">arrow_forward</span> {content.actionLabel}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer Advice */}
                <div className="p-8 bg-app-surface border-t border-app-border">
                    <div className="bg-app-surface-2 p-4 rounded-2xl flex items-center gap-3 border border-app-border">
                        <span className="material-symbols-rounded text-primary text-xl">tips_and_updates</span>
                        <p className="text-[9px] text-app-text-muted font-bold uppercase tracking-widest leading-relaxed">
                            Pro Tip: Active players get 2x more lobby invitations.
                        </p>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default NotificationCenter;
