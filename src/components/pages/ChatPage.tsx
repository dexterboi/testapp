import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    getMessages,
    sendMessage,
    supabase
} from '@/services/dataService';
import { getAvatarUrl } from '@/utils';
import { useTranslation } from 'react-i18next';

const ChatPage = ({ currentUser, onlineUsers }: { currentUser: any, onlineUsers: Record<string, any> }) => {
    const { t } = useTranslation();
    const { friendshipId } = useParams<{ friendshipId: string }>();
    const navigate = useNavigate();
    const [messages, setMessages] = useState<any[]>([]);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [friend, setFriend] = useState<any>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!friendshipId || !currentUser) return;

        const fetchInitialData = async () => {
            try {
                const { data: friendship } = await supabase
                    .from('friendships')
                    .select(`
                      *,
                      user:user_id (id, name, avatar, takwira_id, phone),
                      friend:friend_id (id, name, avatar, takwira_id, phone)
                    `)
                    .eq('id', friendshipId)
                    .single();

                if (friendship) {
                    setFriend(friendship.user_id === currentUser.id ? friendship.friend : friendship.user);
                }

                const msgs = await getMessages(friendshipId);
                setMessages(msgs);
            } catch (err) {
                console.error("Error loading chat:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();

        const channel = supabase
            .channel(`chat:${friendshipId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `friendship_id=eq.${friendshipId}`
                },
                (payload) => {
                    setMessages(prev => {
                        const exists = prev.some(m => m.id === payload.new.id);
                        if (exists) return prev;
                        return [...prev, payload.new];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [friendshipId, currentUser]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || !friendshipId || !currentUser) return;

        const msgContent = content.trim();
        setContent('');

        const tempId = 'temp-' + Date.now();
        const optimisticMsg = {
            id: tempId,
            friendship_id: friendshipId,
            sender_id: currentUser.id,
            content: msgContent,
            created_at: new Date().toISOString(),
            is_read: false,
            isPending: true
        };

        setMessages(prev => [...prev, optimisticMsg]);

        const { success, data } = await sendMessage(friendshipId, currentUser.id, msgContent);

        if (success) {
            setMessages(prev => prev.map(m => m.id === tempId ? data : m));
        } else {
            alert('Failed to send message');
            setMessages(prev => prev.filter(m => m.id !== tempId));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-app-bg flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    const isOnline = friend && onlineUsers[friend.id]?.status === 'online';

    return (
        <div className="fixed inset-0 bg-app-bg flex flex-col z-[70] animate-in slide-in-from-right duration-500 font-sans transition-colors duration-300">
            {/* Premium Chat Header */}
            <header className="bg-app-bg/80 backdrop-blur-xl px-6 pt-[calc(3.5rem+env(safe-area-inset-top))] pb-4 border-b border-app-border flex items-center gap-4 sticky top-0 z-40">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 bg-app-surface rounded-xl flex items-center justify-center text-app-text-muted hover:text-app-text border border-app-border shadow-lg transition-all active:scale-90"
                >
                    <span className="material-symbols-rounded">arrow_back_ios_new</span>
                </button>

                <div className="flex-1 flex items-center gap-3">
                    <div className="relative">
                        <div className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-app-border shadow-sm bg-app-surface-2 p-0.5">
                            <img
                                src={getAvatarUrl(friend?.avatar, friend?.name, friend?.id)}
                                className="w-full h-full object-cover rounded-[0.9rem]"
                                alt="Avatar"
                            />
                        </div>
                        {isOnline && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full border-2 border-app-bg shadow-sm" />
                        )}
                    </div>
                    <div>
                        <h2 className="font-black text-app-text text-[15px] leading-tight tracking-tight">{friend?.name}</h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`w-1 h-1 rounded-full ${isOnline ? 'bg-primary' : 'bg-app-text-muted'}`} />
                            <p className={`text-[9px] font-black uppercase tracking-widest ${isOnline ? 'text-primary' : 'text-app-text-muted'}`}>
                                {isOnline ? t('social.active_now') : t('social.offline')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button className="w-10 h-10 bg-app-surface rounded-xl flex items-center justify-center text-app-text-muted border border-app-border shadow-sm hover:opacity-80 transition-all">
                        <span className="material-symbols-rounded">phone</span>
                    </button>
                    <button className="w-10 h-10 bg-app-surface rounded-xl flex items-center justify-center text-app-text-muted border border-app-border shadow-sm hover:opacity-80 transition-all">
                        <span className="material-symbols-rounded">videocam</span>
                    </button>
                </div>
            </header>

            {/* Messages Body */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth pb-32"
            >
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 grayscale space-y-6">
                        <div className="w-20 h-20 bg-app-surface rounded-[2.5rem] flex items-center justify-center border border-app-border">
                            <span className="material-symbols-rounded text-4xl text-app-text-muted">forum</span>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-app-text-muted">
                            {t('social.no_messages_yet')}<br />{t('social.start_talking_strategy')}
                        </p>
                    </div>
                ) : (
                    messages.map((msg, i) => {
                        const isMe = msg.sender_id === currentUser.id;
                        const showAvatar = !isMe && (i === 0 || messages[i - 1].sender_id !== msg.sender_id);

                        return (
                            <div key={msg.id} className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse animate-in slide-in-from-right duration-300' : 'flex-row animate-in slide-in-from-left duration-300'}`}>
                                {!isMe && showAvatar ? (
                                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-app-border mb-1 bg-slate-800">
                                        <img src={getAvatarUrl(friend?.avatar, friend?.name, friend?.id)} className="w-full h-full object-cover" alt="Avatar" />
                                    </div>
                                ) : !isMe ? (
                                    <div className="w-8 shrink-0" />
                                ) : null}

                                <div className={`max-w-[80%] px-5 py-3.5 rounded-[2rem] shadow-sm relative transition-all hover:scale-[1.02] ${isMe
                                    ? 'bg-primary text-slate-900 rounded-br-none shadow-lg shadow-primary/10'
                                    : 'bg-app-surface backdrop-blur-md text-app-text rounded-bl-none border border-app-border'
                                    }`}>
                                    <p className="text-[13px] font-bold leading-relaxed">{msg.content}</p>
                                    <div className={`flex items-center gap-1 mt-1.5 opacity-40 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <span className="text-[8px] font-black uppercase tracking-widest">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {isMe && (
                                            <span className="material-symbols-rounded text-[10px]">{msg.is_read ? 'done_all' : 'done'}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Premium Message Input */}
            <div className="fixed bottom-0 left-0 right-0 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] z-50 bg-gradient-to-t from-app-bg via-app-bg to-transparent">
                <form
                    onSubmit={handleSend}
                    className="max-w-md mx-auto flex gap-3 items-center bg-app-surface backdrop-blur-xl p-2 rounded-[2rem] shadow-2xl border border-app-border"
                >
                    <button type="button" className="w-12 h-12 flex items-center justify-center text-app-text-muted hover:text-primary transition-colors">
                        <span className="material-symbols-rounded">add_circle</span>
                    </button>
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={t('social.type_message')}
                            className="w-full bg-app-surface-2 border-none rounded-[1.5rem] py-3.5 px-5 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-app-text-muted text-app-text"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!content.trim()}
                        className="w-12 h-12 bg-app-surface text-primary rounded-[1.4rem] flex items-center justify-center active:scale-95 transition-all shadow-lg shadow-black/10 disabled:opacity-20 disabled:scale-100"
                    >
                        <span className="material-symbols-rounded">send</span>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatPage;
