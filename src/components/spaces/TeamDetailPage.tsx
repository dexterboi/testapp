import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    getTeamMembers,
    getTeamMessages,
    sendTeamMessage,
    supabase,
    addTeamMember,
    getFriendships
} from '@/services/dataService';
import { getAvatarUrl } from '@/utils';
import { useTranslation } from 'react-i18next';

const TeamDetailPage = ({ currentUser }: { currentUser: any }) => {
    const { t } = useTranslation();
    const { id: teamId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [team, setTeam] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'chat' | 'members'>('chat');
    const [messageInput, setMessageInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [userFriends, setUserFriends] = useState<any[]>([]);

    useEffect(() => {
        if (teamId) {
            fetchTeamData();
            const subscription = setupRealtime();
            return () => {
                supabase.removeChannel(subscription);
            };
        }
    }, [teamId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, activeTab]);

    const fetchTeamData = async () => {
        setLoading(true);
        try {
            const { data: teamData, error: teamError } = await supabase
                .from('teams')
                .select('*, admin:admin_id(id, name, avatar, phone)')
                .eq('id', teamId)
                .single();

            if (teamError) throw teamError;
            setTeam(teamData);

            const [membersData, messagesData] = await Promise.all([
                getTeamMembers(teamId!),
                getTeamMessages(teamId!)
            ]);

            setMembers(membersData);
            setMessages(messagesData);
        } catch (error) {
            console.error('Error fetching team details:', error);
            navigate('/spaces');
        } finally {
            setLoading(false);
        }
    };

    const setupRealtime = () => {
        const channel = supabase
            .channel(`team:${teamId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'team_messages',
                filter: `team_id=eq.${teamId}`
            }, async (payload) => {
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
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'team_members',
                filter: `team_id=eq.${teamId}`
            }, () => {
                getTeamMembers(teamId!).then(setMembers);
            })
            .subscribe();

        return channel;
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !currentUser || !teamId) return;

        const content = messageInput.trim();
        setMessageInput('');

        const tempId = 'temp-' + Date.now();
        const optimisticMsg = {
            id: tempId,
            team_id: teamId,
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

        const { success, data, error } = await sendTeamMessage(teamId, currentUser.id, content);

        if (success) {
            setMessages(prev => prev.map(m => m.id === tempId ? { ...data, sender: optimisticMsg.sender } : m));
        } else {
            setMessages(prev => prev.filter(m => m.id !== tempId));
            alert('Failed to send: ' + error);
        }
    };

    const openInviteModal = async () => {
        if (!currentUser) return;
        const friendships = await getFriendships(currentUser.id);
        const acceptedFriends = friendships
            .filter((f: any) => f.status === 'accepted')
            .map((f: any) => f.user_id === currentUser.id ? f.friend : f.user);

        const inviteable = acceptedFriends.filter((friend: any) =>
            !members.some((m: any) => m.user_id === friend.id)
        );

        setUserFriends(inviteable);
        setIsInviteModalOpen(true);
    };

    const handleInviteFriend = async (friendId: string) => {
        if (!teamId || !currentUser) return;
        const { success, error } = await addTeamMember(teamId, friendId);
        if (success) {
            setUserFriends(prev => prev.filter(f => f.id !== friendId));
        } else {
            alert('Error inviting friend: ' + error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-app-bg flex items-center justify-center">
                <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-app-bg pb-24 flex flex-col h-screen font-sans">
            {/* Premium Header */}
            <header className="bg-app-bg/80 backdrop-blur-xl px-6 pt-14 pb-6 border-b border-app-border flex items-center gap-4 z-40 shrink-0 sticky top-0">
                <button
                    onClick={() => navigate('/spaces')}
                    className="w-10 h-10 bg-app-surface-2 rounded-xl flex items-center justify-center text-app-text-muted hover:text-app-text border border-app-border shadow-sm transition-all active:scale-90"
                >
                    <span className="material-symbols-rounded">arrow_back_ios_new</span>
                </button>
                <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-app-border shrink-0 shadow-md p-0.5 bg-app-surface-2">
                    <img
                        src={getAvatarUrl(team?.avatar_url, team?.name, team?.id)}
                        className="w-full h-full object-cover rounded-lg"
                        alt="Team Avatar"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-black text-app-text tracking-tighter truncate leading-tight uppercase">{team?.name}</h1>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/50" />
                        <span className="text-[10px] font-black uppercase text-primary-dark tracking-widest">{members.length} {t('social.squad_members')}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={openInviteModal}
                        className="w-10 h-10 rounded-xl bg-primary text-slate-900 flex items-center justify-center active:scale-90 transition-all shadow-lg shadow-primary/10 border border-primary/20"
                    >
                        <span className="material-symbols-rounded">person_add</span>
                    </button>
                    <button className="w-10 h-10 rounded-xl bg-app-surface-2 text-app-text-muted flex items-center justify-center active:scale-90 transition-all border border-app-border shadow-sm">
                        <span className="material-symbols-rounded">more_vert</span>
                    </button>
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="px-6 py-4 bg-app-bg border-b border-app-border shrink-0">
                <div className="flex p-1.5 bg-app-surface rounded-[1.5rem] gap-2 border border-app-border">
                    {[
                        { key: 'chat', label: t('social.squad_hq'), icon: 'shield' },
                        { key: 'members', label: t('social.roster'), icon: 'sports_soccer' }
                    ].map(({ key, label, icon }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key as any)}
                            className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === key
                                ? 'bg-primary text-slate-900 shadow-xl shadow-primary/10'
                                : 'text-app-text-muted hover:text-app-text'
                                }`}
                        >
                            <span className="material-symbols-rounded text-lg">{icon}</span>
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'chat' ? (
                    <div className="h-full flex flex-col">
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth pb-32">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20 grayscale">
                                    <div className="w-20 h-20 rounded-[2.5rem] bg-app-surface-2 flex items-center justify-center mb-6">
                                        <span className="material-symbols-rounded text-4xl text-app-text-muted">security</span>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-app-text-muted">{t('social.hq_online')}</p>
                                    <p className="text-[9px] font-bold text-app-text-muted mt-2 uppercase tracking-tight">{t('social.coordinate_win')}</p>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.sender_id === currentUser?.id;
                                    return (
                                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                            <div className="flex items-center gap-2 mb-1.5 px-2">
                                                {!isMe && <span className="text-[9px] font-black text-app-text-muted uppercase tracking-widest">{msg.sender?.name}</span>}
                                                <span className="text-[8px] font-black text-app-text uppercase tabular-nums tracking-widest">
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

                        {/* Premium Input Bar */}
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
                    </div>
                ) : (
                    <div className="h-full overflow-y-auto p-8 space-y-4 no-scrollbar">
                        {members.map((member) => (
                            <div key={member.id} className="bg-app-surface/50 p-5 rounded-[2.5rem] border border-app-border flex items-center gap-5 shadow-sm hover:bg-app-surface hover:shadow-xl transition-all duration-500 group animate-in slide-in-from-bottom-4">
                                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-app-border shadow-sm relative shrink-0 p-0.5 bg-app-surface-2">
                                    <img
                                        src={getAvatarUrl(member.user?.avatar, member.user?.name, member.user?.id)}
                                        className="w-full h-full object-cover rounded-[0.9rem]"
                                        alt="Member Avatar"
                                    />
                                    {member.role === 'admin' && (
                                        <div className="absolute -top-1 -right-1 bg-primary text-slate-900 p-1 rounded-lg shadow-md border-2 border-app-surface">
                                            <span className="material-symbols-rounded text-[14px]">stars</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-black text-app-text text-sm truncate group-hover:text-primary transition-colors">{member.user?.name}</p>
                                        {member.role === 'admin' && (
                                            <span className="text-[7px] font-black text-slate-900 uppercase bg-primary px-1.5 py-0.5 rounded-full border border-primary/20">ADMIN</span>
                                        )}
                                    </div>
                                    <p className="text-[9px] font-black text-app-text-muted uppercase tracking-widest mt-0.5">#{member.user?.takwira_id || 'SQUAD_MEMBER'}</p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <p className="text-[9px] font-black text-app-text-muted uppercase tracking-widest">{t('social.joined')}</p>
                                        <p className="text-[9px] font-black text-app-text-muted uppercase tracking-tighter">{new Date(member.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
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
                            <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-1">{t('social.squad_recruitment')}</p>
                            <h2 className="text-2xl font-black text-app-text tracking-tighter">{t('social.draft_friends')}</h2>
                            <p className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest mt-1">{t('social.add_friends_to', { team: team?.name })}</p>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-4 no-scrollbar">
                            {userFriends.length === 0 ? (
                                <div className="py-20 text-center grayscale opacity-40">
                                    <div className="w-20 h-20 rounded-[2.5rem] bg-app-surface-2 flex items-center justify-center mx-auto mb-6">
                                        <span className="material-symbols-rounded text-4xl text-app-text-muted">person_off</span>
                                    </div>
                                    <p className="text-[10px] font-black uppercase text-app-text-muted tracking-[0.2em]">Full Squad</p>
                                    <p className="text-[8px] text-app-text-muted mt-2 uppercase font-black">All friends are already in teams</p>
                                </div>
                            ) : (
                                userFriends.map(friend => (
                                    <div key={friend.id} className="flex items-center gap-4 p-4 bg-app-bg/50 rounded-[2rem] border border-app-border hover:bg-app-bg transition-all group">
                                        <div className="w-12 h-12 rounded-[1rem] overflow-hidden border border-app-border p-0.5 bg-app-surface-2 shadow-sm shrink-0">
                                            <img src={getAvatarUrl(friend.avatar, friend.name, friend.id)} className="w-full h-full object-cover rounded-[0.8rem]" alt="Friend avatar" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-app-text text-[13px] truncate">{friend.name}</p>
                                            <p className="text-[9px] font-black text-app-text-muted uppercase tracking-[0.1em]">#{friend.takwira_id || 'ROOKIE'}</p>
                                        </div>
                                        <button
                                            onClick={() => handleInviteFriend(friend.id)}
                                            className="bg-primary hover:bg-primary-dark text-slate-900 h-10 px-5 rounded-[1rem] font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-primary/20 border-2 border-primary/20"
                                        >
                                            {t('social.recruit')}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamDetailPage;
