import React, { useState, useRef } from 'react';
import { supabase } from '@/services/supabase';
import { uploadToImageKit } from '@/services/imageKitService';
import { useNavigate } from 'react-router-dom';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { getAvatarUrl } from '@/utils';

interface UserProfileProps {
    user: any;
    onLogout: () => void;
    onRefresh?: () => Promise<void>;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout, onRefresh }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
    const [userName, setUserName] = useState(user?.name || '');
    const [isSavingPhone, setIsSavingPhone] = useState(false);
    const [isSavingName, setIsSavingName] = useState(false);
    const navigate = useNavigate();

    const [showSourceModal, setShowSourceModal] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const handleAvatarClick = () => {
        setShowSourceModal(true);
    };

    const handleSelectSource = (source: 'gallery' | 'camera') => {
        setShowSourceModal(false);
        if (source === 'gallery') {
            fileInputRef.current?.click();
        } else {
            startCamera();
        }
    };

    const startCamera = async () => {
        if (Capacitor.isNativePlatform()) {
            try {
                const image = await Camera.getPhoto({
                    quality: 90,
                    allowEditing: true,
                    resultType: CameraResultType.Base64,
                    source: CameraSource.Camera,
                    promptLabelHeader: 'Takwira Profile Photo',
                    promptLabelPhoto: 'From Gallery',
                    promptLabelPicture: 'Take Photo'
                });

                if (image.base64String) {
                    const blob = await fetch(`data:image/${image.format};base64,${image.base64String}`).then(res => res.blob());
                    const file = new File([blob], `avatar_${Date.now()}.${image.format}`, { type: `image/${image.format}` });
                    await handleUpload(file);
                }
            } catch (err) {
                console.error('Camera error:', err);
                // User cancelled or error
            }
        } else {
            // Web implementation (existing)
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user' },
                    audio: false
                });
                streamRef.current = stream;
                setIsCameraOpen(true);
                setTimeout(() => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                }, 100);
            } catch (err) {
                console.error('Error accessing camera:', err);
                alert('Could not access camera. Please check permissions.');
            }
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraOpen(false);
    };

    const capturePhoto = async () => {
        if (!videoRef.current) return;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(videoRef.current, 0, 0);

        canvas.toBlob(async (blob) => {
            if (blob) {
                const file = new File([blob], `avatar_${Date.now()}.jpg`, { type: 'image/jpeg' });
                stopCamera();
                await handleUpload(file);
            }
        }, 'image/jpeg', 0.8);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await handleUpload(file);
    };

    const handleUpload = async (file: File) => {
        if (!user?.id) return;

        setIsUploading(true);
        try {
            if (!file.type.startsWith('image/')) {
                alert('Please upload an image file.');
                return;
            }

            // 1. Upload to ImageKit
            const imageUrl = await uploadToImageKit(file);

            // 2. Update the user profile with the permanent ImageKit URL
            const { error: updateError } = await supabase
                .from('user_profiles')
                .update({ avatar: imageUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // 3. Refresh user data to update the UI
            if (onRefresh) {
                await onRefresh();
                alert('Profile picture updated successfully!');
            } else {
                alert('Profile picture updated successfully!');
            }
        } catch (err: any) {
            console.error('Avatar upload failed', err);
            alert(`Failed to upload avatar: ${err.message || 'Unknown error'}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSavePhone = async () => {
        if (!phoneNumber.trim()) {
            alert('Please enter a valid phone number');
            return;
        }

        setIsSavingPhone(true);
        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ phone: phoneNumber })
                .eq('id', user?.id);

            if (error) throw error;
            setIsEditingPhone(false);
            if (onRefresh) await onRefresh();
        } catch (err) {
            console.error('Failed to update phone', err);
            alert('Failed to update phone number. Please try again.');
        } finally {
            setIsSavingPhone(false);
        }
    };

    const handleCancelPhone = () => {
        setPhoneNumber(user?.phone || '');
        setIsEditingPhone(false);
    };

    const handleSaveName = async () => {
        if (!userName.trim()) {
            alert('Please enter a valid name');
            return;
        }

        setIsSavingName(true);
        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ name: userName })
                .eq('id', user?.id);

            if (error) throw error;
            setIsEditingName(false);
            if (onRefresh) await onRefresh();
        } catch (err) {
            console.error('Failed to update name', err);
            alert('Failed to update name. Please try again.');
        } finally {
            setIsSavingName(false);
        }
    };

    const handleCancelName = () => {
        setUserName(user?.name || '');
        setIsEditingName(false);
    };

    if (!user) {
        return (
            <div className="bg-app-bg min-h-screen pb-24 flex items-center justify-center font-sans">
                <div className="text-center p-8 bg-app-surface rounded-[3.5rem] shadow-xl border border-app-border max-w-xs w-full">
                    <div className="w-20 h-20 bg-app-surface-2 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-rounded text-4xl text-app-text-muted">account_circle</span>
                    </div>
                    <h2 className="text-xl font-black text-app-text tracking-tighter uppercase mb-2">Not Logged In</h2>
                    <p className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest leading-loose">Please log in to view your player profile and stats</p>
                </div>
            </div>
        );
    }

    const avatarUrl = getAvatarUrl(user?.avatar, user?.name, user?.id);
    const displayPhone = user?.phone || 'No phone verified';

    return (
        <div className="bg-app-bg min-h-screen pb-24 font-sans transition-colors duration-300">
            {/* Profile Header */}
            <div className="bg-app-surface p-8 pt-16 rounded-b-[4rem] shadow-2xl mb-8 border-b border-app-border relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="flex flex-col items-center relative z-10">
                    <div className="relative group cursor-pointer mb-8" onClick={handleAvatarClick}>
                        <div className="w-40 h-40 rounded-[3.5rem] overflow-hidden border-4 border-app-bg shadow-2xl relative group-hover:scale-[1.05] transition-all duration-700 p-1 bg-app-surface-2">
                            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover rounded-[3rem] group-hover:blur-[2px] transition-all" />
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[3rem]">
                                <span className="material-symbols-rounded text-white text-4xl mb-1">photo_camera</span>
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Update</span>
                            </div>
                        </div>

                        <div className="absolute -bottom-2 -right-2 bg-app-surface text-primary p-4 rounded-[1.2rem] shadow-2xl z-10 group-hover:rotate-12 transition-all border-4 border-app-bg">
                            <span className="material-symbols-rounded text-2xl font-bold">bolt</span>
                        </div>

                        {isUploading && (
                            <div className="absolute inset-1.5 bg-black/60 backdrop-blur-md rounded-[3rem] flex flex-col items-center justify-center z-20">
                                <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full shadow-lg mb-3" />
                                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] animate-pulse">Syncing...</span>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*"
                        />
                    </div>

                    {!isEditingName ? (
                        <div className="flex items-center gap-3">
                            <h2 className="text-4xl font-black text-app-text tracking-tighter uppercase leading-none">
                                {user.name?.split(' ')[0] || 'Pro'} <span className="text-primary italic">{user.name?.split(' ').slice(1).join(' ') || 'Player'}</span>
                            </h2>
                            <button onClick={() => setIsEditingName(true)} className="w-10 h-10 rounded-2xl bg-app-surface text-app-text-muted hover:text-app-text transition-all flex items-center justify-center active:scale-90 border border-app-border">
                                <span className="material-symbols-rounded text-xl">edit</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 w-full max-w-xs px-4">
                            <input
                                type="text"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                className="flex-1 h-14 px-6 bg-app-surface border-2 border-app-border rounded-[1.2rem] text-xl font-black text-app-text focus:ring-4 focus:ring-primary/10 transition-all uppercase"
                                autoFocus
                            />
                            <button onClick={handleSaveName} className="w-14 h-14 bg-app-surface text-primary rounded-[1.2rem] flex items-center justify-center shadow-xl active:scale-90 transition-all">
                                {isSavingName ? <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" /> : <span className="material-symbols-rounded font-bold text-2xl">check</span>}
                            </button>
                            <button onClick={handleCancelName} className="w-14 h-14 bg-app-surface-2 text-app-text-muted rounded-[1.2rem] flex items-center justify-center active:scale-90 transition-all">
                                <span className="material-symbols-rounded font-bold text-2xl">close</span>
                            </button>
                        </div>
                    )}
                    <p className="text-app-text-muted text-[11px] mt-4 mb-10 font-black tracking-[0.25em] uppercase px-6 py-2 bg-app-bg shadow-inner rounded-full border border-app-border">{user.email}</p>

                    {/* Elite Takwira ID Card */}
                    <div className="bg-app-surface w-full rounded-[3rem] p-8 mb-10 relative overflow-hidden shadow-2xl border border-app-border group">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full -mr-40 -mt-40 blur-[100px] group-hover:scale-125 transition-transform duration-1000" />
                        <div className="absolute bottom-0 left-0 w-60 h-60 bg-primary/10 rounded-full -ml-30 -mb-30 blur-[80px]" />

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-12">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary rounded-[1.2rem] flex items-center justify-center shadow-xl shadow-primary/20 rotate-3 group-hover:rotate-6 transition-transform">
                                        <span className="material-symbols-rounded text-slate-900 text-3xl font-black">verified_user</span>
                                    </div>
                                    <div>
                                        <span className="text-app-text font-black text-[13px] tracking-[0.4em] uppercase block leading-none mb-1">PITCH-ID</span>
                                        <span className="text-primary font-black text-[9px] tracking-widest uppercase opacity-90 italic">Redefined Elite Member</span>
                                    </div>
                                </div>
                                <div className="bg-black/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-app-border font-black text-[9px] text-white/60 tracking-[0.2em] uppercase">MEMBER SINCE {new Date(user.created_at).getFullYear()}</div>
                            </div>

                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-app-text-muted text-[9px] font-black uppercase tracking-[0.3em] mb-2 leading-none">PLAYER IDENTIFICATION</p>
                                    <div className="flex items-center gap-3">
                                        <p className="text-app-text font-black text-2xl tracking-[0.15em] font-mono leading-none">{user.takwira_id || '#TAK-0000'}</p>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(user.takwira_id);
                                                alert('Takwira ID copied!');
                                            }}
                                            className="w-8 h-8 flex items-center justify-center bg-app-surface-2 rounded-xl text-app-text-muted hover:text-primary transition-all active:scale-90"
                                        >
                                            <span className="material-symbols-rounded text-lg">content_copy</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-app-surface-2 p-2.5 rounded-2xl shadow-xl shadow-black/20 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-rounded text-app-text text-3xl font-bold">qr_code_2</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Phone Number Section */}
                    <div className="w-full mb-6">
                        {!isEditingPhone ? (
                            <div className="flex items-center justify-center gap-3 bg-slate-950/50 border border-app-border py-4 px-6 rounded-[2rem] shadow-inner group hover:border-primary/30 transition-all">
                                <span className={`material-symbols-rounded text-xl ${user.phone ? 'text-primary' : 'text-app-text-muted'}`}>phone_iphone</span>
                                <span className={`text-[11px] font-black uppercase tracking-widest ${user.phone ? 'text-app-text-muted' : 'text-app-text-muted opacity-60'}`}>
                                    {displayPhone}
                                </span>
                                <button
                                    onClick={() => setIsEditingPhone(true)}
                                    className="ml-2 w-8 h-8 rounded-full bg-app-surface text-app-text-muted hover:text-app-text transition-all active:scale-90"
                                >
                                    <span className="material-symbols-rounded text-lg">edit</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 w-full">
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="+216 -- --- ---"
                                    className="flex-1 h-14 px-6 bg-slate-900 border-2 border-app-border rounded-3xl text-sm font-black text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-slate-600"
                                    disabled={isSavingPhone}
                                />
                                <button
                                    onClick={handleSavePhone}
                                    disabled={isSavingPhone}
                                    className="w-14 h-14 bg-primary text-slate-900 rounded-3xl flex items-center justify-center shadow-lg shadow-primary/20 active:scale-90 transition-all disabled:opacity-50"
                                >
                                    {isSavingPhone ? (
                                        <div className="animate-spin h-5 w-5 border-2 border-slate-900 border-t-transparent rounded-full" />
                                    ) : (
                                        <span className="material-symbols-rounded font-bold text-2xl">check</span>
                                    )}
                                </button>
                                <button
                                    onClick={handleCancelPhone}
                                    disabled={isSavingPhone}
                                    className="w-14 h-14 bg-app-surface-2 text-app-text-muted rounded-3xl flex items-center justify-center active:scale-90 transition-all disabled:opacity-50"
                                >
                                    <span className="material-symbols-rounded font-bold text-2xl">close</span>
                                </button>
                            </div>
                        )}
                        {!user.phone && !isEditingPhone && (
                            <div className="flex items-center justify-center gap-1.5 mt-3">
                                <span className="material-symbols-rounded text-amber-500 text-xs">warning</span>
                                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Phone required for match bookings</p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 w-full">
                        {[
                            { label: 'Played', value: user.gamesPlayed || 0, color: 'slate' },
                            { label: 'Victory', value: user.wins || 0, color: 'primary' },
                            { label: 'Defeat', value: user.losses || 0, color: 'rose' }
                        ].map((stat, idx) => (
                            <div key={idx} className={`flex-1 p-5 rounded-[2.2rem] text-center border transition-all hover:-translate-y-1 ${stat.color === 'primary'
                                ? 'bg-primary/5 border-primary/20 shadow-lg shadow-primary/5'
                                : 'bg-app-surface border-app-border hover:bg-app-surface-2'
                                }`}>
                                <p className={`text-[9px] font-black uppercase tracking-widest mb-1.5 ${stat.color === 'primary' ? 'text-primary' : 'text-app-text-muted'
                                    }`}>{stat.label}</p>
                                <p className="text-2xl font-black text-app-text tabular-nums">{stat.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Menu Options */}
            <div className="px-8 space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em]">Activity & Career</h3>
                    <div className="h-px bg-app-border flex-1 ml-4" />
                </div>

                <div className="grid gap-3">
                    {user?.role?.toLowerCase() === 'owner' && (
                        <button
                            onClick={() => navigate('/owner')}
                            className="group w-full flex items-center p-5 bg-primary/10 hover:bg-primary transition-all rounded-[2.5rem] border border-primary/20 shadow-lg shadow-primary/10 active:scale-[0.98]"
                        >
                            <div className="w-14 h-14 bg-app-surface-2 rounded-3xl flex items-center justify-center text-primary shadow-xl group-hover:rotate-12 transition-all mr-5">
                                <span className="material-symbols-rounded text-3xl">dashboard_customize</span>
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-black text-app-text uppercase tracking-tight group-hover:text-slate-900">Owner Dashboard</p>
                                <p className="text-[10px] text-app-text-muted font-bold uppercase tracking-widest group-hover:text-slate-800">Manage your complexes</p>
                            </div>
                            <span className="material-symbols-rounded text-app-text-muted group-hover:text-slate-900 group-hover:translate-x-1 transition-transform">chevron_right</span>
                        </button>
                    )}

                    {[
                        { label: 'Achievements', desc: 'Badges & Stats', icon: 'military_tech', color: 'primary', path: '/achievements' },
                        { label: 'Academy Portal', desc: 'My Training Hub', icon: 'school', color: 'amber', path: '/academy-student' },
                        { label: 'Match History', desc: 'Booking receipts', icon: 'history', color: 'blue', path: '/history' },
                        { label: 'Active Squads', desc: 'My sports crews', icon: 'groups', color: 'emerald', path: '/teams' }
                    ].map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => navigate(item.path)}
                            className="group w-full flex items-center p-5 bg-app-surface hover:bg-app-surface-2 transition-all rounded-[2.5rem] border border-app-border active:scale-[0.98]"
                        >
                            <div className={`w-14 h-14 rounded-3xl flex items-center justify-center text-app-text-muted group-hover:text-primary transition-all mr-5 bg-app-surface-2 shadow-inner p-3`}>
                                <span className="material-symbols-rounded text-3xl">{item.icon}</span>
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-black text-app-text uppercase tracking-tight">{item.label}</p>
                                <p className="text-[10px] text-app-text-muted font-black uppercase tracking-widest opacity-60">{item.desc}</p>
                            </div>
                            <span className="material-symbols-rounded text-app-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all">arrow_forward</span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center justify-between px-2 pt-4">
                    <h3 className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em]">Account Hub</h3>
                    <div className="h-px bg-app-border flex-1 ml-4" />
                </div>

                <div className="grid gap-3">
                    <button
                        onClick={() => navigate('/preferences')}
                        className="group w-full flex items-center p-5 bg-app-surface hover:bg-app-surface-2 transition-all rounded-[2.5rem] border border-app-border active:scale-[0.98]"
                    >
                        <div className="w-14 h-14 bg-app-surface-2 rounded-3xl flex items-center justify-center text-app-text-muted group-hover:text-app-text transition-all mr-5">
                            <span className="material-symbols-rounded text-2xl">settings</span>
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-sm font-black text-app-text uppercase tracking-tight">Preferences</p>
                            <p className="text-[10px] text-app-text-muted font-bold uppercase tracking-widest">Notifications & Safety</p>
                        </div>
                        <span className="material-symbols-rounded text-app-text-muted">chevron_right</span>
                    </button>

                    <button
                        onClick={onLogout}
                        className="group w-full flex items-center p-5 bg-rose-500/10 hover:bg-rose-500/20 transition-all rounded-[2.5rem] border border-rose-500/20 active:scale-[0.98]"
                    >
                        <div className="w-14 h-14 bg-rose-500/10 rounded-3xl flex items-center justify-center text-rose-500 shadow-sm group-hover:rotate-12 transition-all mr-5">
                            <span className="material-symbols-rounded text-2xl">logout</span>
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-sm font-black text-rose-500 uppercase tracking-tight">Sign Out</p>
                            <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest">End your session</p>
                        </div>
                    </button>
                </div>
            </div>
            {/* Source Selection Modal */}
            {showSourceModal && (
                <div className="fixed inset-0 bg-app-bg/80 backdrop-blur-xl z-[100] flex items-end justify-center p-6 animate-in fade-in duration-300">
                    <div className="w-full max-w-sm bg-app-surface rounded-[3rem] border border-app-border p-8 shadow-2xl animate-in slide-in-from-bottom duration-500">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black text-app-text uppercase tracking-tighter">Profile Photo</h3>
                            <button onClick={() => setShowSourceModal(false)} className="w-10 h-10 rounded-full bg-app-surface-2 flex items-center justify-center text-app-text-muted">
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleSelectSource('camera')}
                                className="flex flex-col items-center justify-center p-8 bg-primary/10 rounded-[2.5rem] border border-primary/20 group hover:bg-primary transition-all active:scale-95"
                            >
                                <div className="w-16 h-16 bg-app-surface-2 rounded-[1.5rem] flex items-center justify-center text-primary group-hover:text-slate-900 group-hover:bg-white/20 transition-all mb-4">
                                    <span className="material-symbols-rounded text-4xl">photo_camera</span>
                                </div>
                                <span className="text-[10px] font-black text-app-text group-hover:text-slate-900 uppercase tracking-widest leading-none">Take Photo</span>
                            </button>
                            <button
                                onClick={() => handleSelectSource('gallery')}
                                className="flex flex-col items-center justify-center p-8 bg-app-surface-2 rounded-[2.5rem] border border-app-border group hover:bg-app-text hover:border-app-text transition-all active:scale-95"
                            >
                                <div className="w-16 h-16 bg-app-bg rounded-[1.5rem] flex items-center justify-center text-app-text-muted group-hover:text-app-bg group-hover:bg-app-text transition-all mb-4">
                                    <span className="material-symbols-rounded text-4xl">image</span>
                                </div>
                                <span className="text-[10px] font-black text-app-text group-hover:text-app-bg uppercase tracking-widest leading-none">Gallery</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Camera Preview Modal */}
            {isCameraOpen && (
                <div className="fixed inset-0 bg-app-bg z-[200] flex flex-col pt-16 animate-in fade-in duration-300">
                    <div className="px-8 flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-2xl font-black text-app-text tracking-tighter uppercase leading-none">Camera</h3>
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1 italic">Ready for shot</p>
                        </div>
                        <button onClick={stopCamera} className="w-12 h-12 rounded-[1.2rem] bg-app-surface border border-app-border flex items-center justify-center text-app-text active:scale-90 transition-all">
                            <span className="material-symbols-rounded">close</span>
                        </button>
                    </div>

                    <div className="flex-1 relative mx-6 mb-8 rounded-[3.5rem] overflow-hidden border-4 border-app-surface-2 shadow-2xl bg-app-surface-2">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover mirror"
                            style={{ transform: 'scaleX(-1)' }}
                        />
                        <div className="absolute inset-x-8 bottom-8 flex justify-center">
                            <button
                                onClick={capturePhoto}
                                className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl p-2 active:scale-90 transition-all group"
                            >
                                <div className="w-full h-full border-4 border-black/10 rounded-full flex items-center justify-center group-hover:scale-95 transition-all">
                                    <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
                                        <span className="material-symbols-rounded text-white text-4xl">bolt</span>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="px-12 text-center pb-12">
                        <p className="text-[10px] text-app-text-muted font-black uppercase tracking-[0.3em] leading-relaxed">Position your face in the center for the perfect player profile shot</p>
                    </div>
                </div>
            )}
        </div>
    );
};
