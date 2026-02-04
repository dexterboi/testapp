import React, { useState, useRef } from 'react';
import { supabase } from '@/services/supabase';
import { uploadToImageKit } from '@/services/imageKitService';
import { useNavigate } from 'react-router-dom';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { getAvatarUrl } from '@/utils';
import { useTranslation } from 'react-i18next';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface UserProfileProps {
    user: any;
    onLogout: () => void;
    onRefresh?: () => Promise<void>;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout, onRefresh }) => {
    const { t } = useTranslation();
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

    // Account deletion states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Check if user is an owner
    const isOwner = user?.role?.toLowerCase() === 'owner';

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
                    promptLabelHeader: t('profile.photo_title'),
                    promptLabelPhoto: t('profile.from_gallery'),
                    promptLabelPicture: t('profile.take_photo')
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
                alert(t('profile.upload_success'));
            } else {
                alert(t('profile.upload_success'));
            }
        } catch (err: any) {
            console.error('Avatar upload failed', err);
            alert(`${t('profile.upload_failed')}: ${err.message || t('common.unknown_error')}`);
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
                    <h2 className="text-xl font-black text-app-text tracking-tighter uppercase mb-2">{t('profile.not_logged_in')}</h2>
                    <p className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest leading-loose">{t('profile.please_login_msg')}</p>
                </div>
            </div>
        );
    }

    const avatarUrl = getAvatarUrl(user?.avatar, user?.name, user?.id);
    const displayPhone = user?.phone || 'No phone verified';

    return (
        <div className="bg-[#F8F9FA] dark:bg-[#121417] min-h-screen pb-24 font-sans transition-colors duration-300">
            {/* Profile Header */}
            <div className="px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <p className="text-slate-500 text-sm font-medium mb-1">Hello, 👋</p>
                        <h1 className="text-2xl font-extrabold tracking-tight text-[#1A1D1F] dark:text-white">{t('tabs.profile')}</h1>
                    </div>
                </div>
            </div>

            {/* Profile Header */}
            <div className="bg-white dark:bg-[#1E2126] mx-6 p-6 rounded-2xl shadow-soft mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="flex flex-col items-center relative z-10">
                    <div className="relative group cursor-pointer mb-6" onClick={handleAvatarClick}>
                        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#F8F9FA] dark:border-[#121417] shadow-xl relative group-hover:scale-[1.05] transition-all duration-700 bg-slate-100">
                            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover group-hover:blur-[2px] transition-all" />
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span className="material-symbols-rounded text-white text-3xl mb-1">photo_camera</span>
                                <span className="text-[9px] font-bold text-white uppercase tracking-widest">{t('profile.update_btn')}</span>
                            </div>
                        </div>

                        <div className="absolute -bottom-1 -right-1 bg-primary text-[#1A1D1F] p-2 rounded-full shadow-lg z-10 group-hover:rotate-12 transition-all border-2 border-white dark:border-[#1E2126]">
                            <span className="material-symbols-rounded text-lg font-bold">bolt</span>
                        </div>

                        {isUploading && (
                            <div className="absolute inset-1.5 bg-black/60 backdrop-blur-md rounded-[3rem] flex flex-col items-center justify-center z-20">
                                <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full shadow-lg mb-3" />
                                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] animate-pulse">{t('profile.syncing')}</span>
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
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-[#1A1D1F] dark:text-white tracking-tight">
                                {user.name}
                            </h2>
                            <button onClick={() => setIsEditingName(true)} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-[#1A1D1F] dark:hover:text-white transition-all flex items-center justify-center active:scale-90">
                                <span className="material-symbols-rounded text-lg">edit</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 w-full max-w-xs px-4">
                            <input
                                type="text"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                className="flex-1 h-12 px-4 bg-slate-100 dark:bg-slate-700 border-none rounded-xl text-base font-bold text-[#1A1D1F] dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                                autoFocus
                            />
                            <button onClick={handleSaveName} className="w-12 h-12 bg-primary text-[#1A1D1F] rounded-xl flex items-center justify-center shadow-sm active:scale-90 transition-all">
                                {isSavingName ? <div className="animate-spin h-5 w-5 border-2 border-[#1A1D1F] border-t-transparent rounded-full" /> : <span className="material-symbols-rounded font-bold text-xl">check</span>}
                            </button>
                            <button onClick={handleCancelName} className="w-12 h-12 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-xl flex items-center justify-center active:scale-90 transition-all">
                                <span className="material-symbols-rounded font-bold text-xl">close</span>
                            </button>
                        </div>
                    )}
                    <p className="text-slate-500 text-xs mt-2 mb-6 font-medium">{user.email}</p>

                    {/* Elite Takwira ID Card */}
                    <div className="bg-[#1A1D1F] w-full rounded-2xl p-5 mb-6 relative overflow-hidden shadow-card">
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                                        <span className="material-symbols-rounded text-[#1A1D1F] text-2xl">verified_user</span>
                                    </div>
                                    <div>
                                        <span className="text-white font-bold text-xs tracking-wider uppercase block">{t('profile.pitch_id')}</span>
                                        <span className="text-primary text-[9px] tracking-wide">{t('profile.elite_member')}</span>
                                    </div>
                                </div>
                                <div className="bg-white/10 px-2 py-1 rounded-lg text-[9px] text-white/60 tracking-wide">{t('profile.member_since')} {new Date(user.created_at).getFullYear()}</div>
                            </div>

                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-white/50 text-[9px] font-bold uppercase tracking-wider mb-1">{t('profile.player_identification')}</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-white font-bold text-lg tracking-wider font-mono">{user.takwira_id || '#TAK-0000'}</p>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(user.takwira_id);
                                                alert(t('profile.id_copied'));
                                            }}
                                            className="w-7 h-7 flex items-center justify-center bg-white/10 rounded-lg text-white/60 hover:text-primary transition-all active:scale-90"
                                        >
                                            <span className="material-symbols-rounded text-base">content_copy</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-white/10 p-2 rounded-xl">
                                    <span className="material-symbols-rounded text-white text-2xl">qr_code_2</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Phone Number Section */}
                    <div className="w-full mb-6">
                        {!isEditingPhone ? (
                            <div className="flex items-center justify-center gap-3 bg-slate-100 dark:bg-slate-700 py-3 px-4 rounded-xl shadow-sm group">
                                <span className={`material-symbols-rounded text-lg ${user.phone ? 'text-primary' : 'text-slate-400'}`}>phone_iphone</span>
                                <span className={`text-sm font-medium ${user.phone ? 'text-[#1A1D1F] dark:text-white' : 'text-slate-400'}`}>
                                    {user?.phone || t('profile.no_phone')}
                                </span>
                                <button
                                    onClick={() => setIsEditingPhone(true)}
                                    className="ml-2 w-8 h-8 rounded-lg bg-white dark:bg-slate-600 text-slate-400 hover:text-[#1A1D1F] dark:hover:text-white transition-all active:scale-90"
                                >
                                    <span className="material-symbols-rounded text-base">edit</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 w-full">
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="+216 -- --- ---"
                                    className="flex-1 h-12 px-4 bg-slate-100 dark:bg-slate-700 border-none rounded-xl text-sm font-bold text-[#1A1D1F] dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                                    disabled={isSavingPhone}
                                />
                                <button
                                    onClick={handleSavePhone}
                                    disabled={isSavingPhone}
                                    className="w-12 h-12 bg-primary text-[#1A1D1F] rounded-xl flex items-center justify-center shadow-sm active:scale-90 transition-all disabled:opacity-50"
                                >
                                    {isSavingPhone ? (
                                        <div className="animate-spin h-5 w-5 border-2 border-[#1A1D1F] border-t-transparent rounded-full" />
                                    ) : (
                                        <span className="material-symbols-rounded font-bold text-xl">check</span>
                                    )}
                                </button>
                                <button
                                    onClick={handleCancelPhone}
                                    disabled={isSavingPhone}
                                    className="w-12 h-12 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-xl flex items-center justify-center active:scale-90 transition-all disabled:opacity-50"
                                >
                                    <span className="material-symbols-rounded font-bold text-xl">close</span>
                                </button>
                            </div>
                        )}
                        {!user.phone && !isEditingPhone && (
                            <div className="flex items-center justify-center gap-1.5 mt-3">
                                <span className="material-symbols-rounded text-amber-500 text-xs">warning</span>
                                <p className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">{t('profile.phone_required')}</p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 w-full">
                        {[
                            { label: t('profile.played'), value: user.gamesPlayed || 0, color: 'slate' },
                            { label: t('profile.victory'), value: user.wins || 0, color: 'primary' },
                            { label: t('profile.defeat'), value: user.losses || 0, color: 'rose' }
                        ].map((stat, idx) => (
                            <div key={idx} className={`flex-1 p-4 rounded-xl text-center transition-all hover:-translate-y-1 ${stat.color === 'primary'
                                ? 'bg-primary/10'
                                : 'bg-slate-100 dark:bg-slate-700'
                                }`}>
                                <p className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${stat.color === 'primary' ? 'text-primary' : 'text-slate-500'
                                    }`}>{stat.label}</p>
                                <p className="text-xl font-bold text-[#1A1D1F] dark:text-white tabular-nums">{stat.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Menu Options */}
            <div className="px-6 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.1em]">{t('profile.activity_career')}</h3>

                <div className="grid gap-3">
                    {user?.role?.toLowerCase() === 'owner' && (
                        <button
                            onClick={() => navigate('/owner')}
                            className="group w-full flex items-center p-4 bg-primary/10 hover:bg-primary/20 transition-all rounded-2xl active:scale-[0.98]"
                        >
                            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-[#1A1D1F] shadow-sm mr-4">
                                <span className="material-symbols-rounded text-2xl">dashboard_customize</span>
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-bold text-[#1A1D1F] dark:text-white">{t('profile.owner_dashboard')}</p>
                                <p className="text-[10px] text-slate-500">{t('profile.owner_dashboard_sub')}</p>
                            </div>
                            <span className="material-symbols-rounded text-slate-400">chevron_right</span>
                        </button>
                    )}

                    {[
                        { label: t('profile.achievements'), desc: t('profile.achievements_sub'), icon: 'military_tech', path: '/achievements' },
                        { label: t('profile.history'), desc: t('profile.history_sub_receipts'), icon: 'history', path: '/history' },
                        { label: t('profile.active_squads'), desc: t('profile.active_squads_sub'), icon: 'groups', path: '/teams' }
                    ].map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => navigate(item.path)}
                            className="group w-full flex items-center p-4 bg-white dark:bg-[#1E2126] hover:shadow-card transition-all rounded-2xl shadow-soft active:scale-[0.98]"
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-primary transition-all mr-4 bg-slate-100 dark:bg-slate-700`}>
                                <span className="material-symbols-rounded text-2xl">{item.icon}</span>
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-bold text-[#1A1D1F] dark:text-white">{item.label}</p>
                                <p className="text-[10px] text-slate-500">{item.desc}</p>
                            </div>
                            <span className="material-symbols-rounded text-slate-400 group-hover:text-primary transition-all">arrow_forward</span>
                        </button>
                    ))}
                </div>

                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.1em] pt-4">{t('profile.account_hub')}</h3>

                <div className="grid gap-3">
                    <button
                        onClick={() => navigate('/preferences')}
                        className="group w-full flex items-center p-4 bg-white dark:bg-[#1E2126] hover:shadow-card transition-all rounded-2xl shadow-soft active:scale-[0.98]"
                    >
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-[#1A1D1F] dark:group-hover:text-white transition-all mr-4">
                            <span className="material-symbols-rounded text-xl">settings</span>
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-sm font-bold text-[#1A1D1F] dark:text-white">{t('profile.preferences')}</p>
                            <p className="text-[10px] text-slate-500">{t('profile.preferences_sub')}</p>
                        </div>
                        <span className="material-symbols-rounded text-slate-400">chevron_right</span>
                    </button>

                    <button
                        onClick={onLogout}
                        className="group w-full flex items-center p-4 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all rounded-2xl active:scale-[0.98]"
                    >
                        <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center text-rose-500 mr-4">
                            <span className="material-symbols-rounded text-xl">logout</span>
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-sm font-bold text-rose-500">{t('profile.sign_out')}</p>
                            <p className="text-[10px] text-rose-400">{t('profile.sign_out_sub')}</p>
                        </div>
                    </button>

                    {/* Delete Account Button - Only for non-owner users */}
                    {!isOwner && (
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="group w-full flex items-center p-4 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all rounded-2xl active:scale-[0.98] border border-red-200 dark:border-red-800/30"
                        >
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-red-500 mr-4">
                                <Trash2 className="w-5 h-5" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-bold text-red-500">{t('profile.delete_account') || 'Delete Account'}</p>
                                <p className="text-[10px] text-red-400">{t('profile.delete_account_sub') || 'Permanently delete your account and all data'}</p>
                            </div>
                        </button>
                    )}
                </div>
            </div>
            {/* Source Selection Modal */}
            {showSourceModal && (
                <div className="fixed inset-0 bg-app-bg/80 backdrop-blur-xl z-[100] flex items-end justify-center p-6 animate-in fade-in duration-300">
                    <div className="w-full max-w-sm bg-app-surface rounded-[3rem] border border-app-border p-8 shadow-2xl animate-in slide-in-from-bottom duration-500">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black text-app-text uppercase tracking-tighter">{t('profile.photo_title')}</h3>
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
                                <span className="text-[10px] font-black text-app-text group-hover:text-slate-900 uppercase tracking-widest leading-none">{t('profile.take_photo')}</span>
                            </button>
                            <button
                                onClick={() => handleSelectSource('gallery')}
                                className="flex flex-col items-center justify-center p-8 bg-app-surface-2 rounded-[2.5rem] border border-app-border group hover:bg-app-text hover:border-app-text transition-all active:scale-95"
                            >
                                <div className="w-16 h-16 bg-app-bg rounded-[1.5rem] flex items-center justify-center text-app-text-muted group-hover:text-app-bg group-hover:bg-app-text transition-all mb-4">
                                    <span className="material-symbols-rounded text-4xl">image</span>
                                </div>
                                <span className="text-[10px] font-black text-app-text group-hover:text-app-bg uppercase tracking-widest leading-none">{t('profile.gallery')}</span>
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
                            <h3 className="text-2xl font-black text-app-text tracking-tighter uppercase leading-none">{t('profile.camera')}</h3>
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1 italic">{t('profile.ready_shot')}</p>
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
                        <p className="text-[10px] text-app-text-muted font-black uppercase tracking-[0.3em] leading-relaxed">{t('profile.camera_guideline')}</p>
                    </div>
                </div>
            )}

            {/* Delete Account Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-white dark:bg-[#1E2126] rounded-[2rem] border border-red-200 dark:border-red-800/30 p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-[#1A1D1F] dark:text-white mb-2">
                                {t('profile.delete_confirm_title') || 'Delete Account?'}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {t('profile.delete_confirm_message') || 'This action cannot be undone. All your data will be permanently deleted.'}
                            </p>
                        </div>

                        <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 mb-6">
                            <p className="text-xs text-red-600 dark:text-red-400 mb-2">
                                {t('profile.delete_type_confirm') || 'Type "DELETE" to confirm:'}
                            </p>
                            <input
                                type="text"
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                placeholder="DELETE"
                                className="w-full px-4 py-3 bg-white dark:bg-[#121417] border border-red-200 dark:border-red-800/30 rounded-xl text-sm text-[#1A1D1F] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                            />
                        </div>

                        {deleteError && (
                            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl p-4 mb-6">
                                <p className="text-xs text-red-600 dark:text-red-400">{deleteError}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeleteConfirmation('');
                                    setDeleteError(null);
                                }}
                                disabled={isDeleting}
                                className="py-3 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-50"
                            >
                                {t('profile.cancel') || 'Cancel'}
                            </button>
                            <button
                                onClick={async () => {
                                    if (deleteConfirmation !== 'DELETE') {
                                        setDeleteError(t('profile.delete_type_error') || 'Please type "DELETE" to confirm');
                                        return;
                                    }
                                    setIsDeleting(true);
                                    setDeleteError(null);
                                    try {
                                        const { data: { session } } = await supabase.auth.getSession();
                                        if (!session) {
                                            throw new Error('No active session');
                                        }

                                        const response = await fetch(
                                            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user-account`,
                                            {
                                                method: 'POST',
                                                headers: {
                                                    'Authorization': `Bearer ${session.access_token}`,
                                                    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                                                    'Content-Type': 'application/json'
                                                }
                                            }
                                        );

                                        const result = await response.json();

                                        if (!response.ok) {
                                            throw new Error(result.error || 'Failed to delete account');
                                        }

                                        // Account deleted successfully
                                        setShowDeleteModal(false);
                                        onLogout();
                                    } catch (error: any) {
                                        console.error('Error deleting account:', error);
                                        setDeleteError(error.message || 'Failed to delete account. Please try again.');
                                    } finally {
                                        setIsDeleting(false);
                                    }
                                }}
                                disabled={isDeleting || deleteConfirmation !== 'DELETE'}
                                className="py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        {t('profile.deleting') || 'Deleting...'}
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        {t('profile.delete_account_confirm') || 'Delete Account'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
