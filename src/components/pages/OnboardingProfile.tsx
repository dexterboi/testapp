import React, { useState, useRef } from 'react';
import { supabase } from '@/services/supabase';
import { uploadToImageKit } from '@/services/imageKitService';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { getAvatarUrl } from '@/utils';
import { useTranslation } from 'react-i18next';
import { User, MapPin, Phone, FileText, Instagram, Twitter, Facebook, ChevronRight, Camera as CameraIcon, X } from 'lucide-react';

interface OnboardingProfileProps {
    user: any;
    onComplete: () => void;
    onSkip: () => void;
}

export const OnboardingProfile: React.FC<OnboardingProfileProps> = ({ user, onComplete, onSkip }) => {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        address: user?.address || '',
        bio: user?.bio || '',
        instagram: user?.instagram || '',
        twitter: user?.twitter || '',
        facebook: user?.facebook || '',
    });

    const [avatar, setAvatar] = useState<string | null>(user?.avatar || null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showSourceModal, setShowSourceModal] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

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
            }
        } else {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await handleUpload(file);
        }
    };

    const handleUpload = async (file: File) => {
        setIsUploading(true);
        try {
            const imageUrl = await uploadToImageKit(file);
            if (imageUrl) {
                setAvatar(imageUrl);
            }
        } catch (err) {
            console.error('Upload error:', err);
        } finally {
            setIsUploading(false);
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({
                    name: formData.name,
                    phone: formData.phone || null,
                    address: formData.address || null,
                    bio: formData.bio || null,
                    instagram: formData.instagram || null,
                    twitter: formData.twitter || null,
                    facebook: formData.facebook || null,
                    avatar: avatar,
                    profile_completed: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;
            onComplete();
        } catch (err: any) {
            console.error('Error saving profile:', err);
            setErrors({ submit: err.message || 'Failed to save profile' });
        } finally {
            setIsSaving(false);
        }
    };

    const avatarUrl = getAvatarUrl(avatar, formData.name, user?.id);

    return (
        <div className="bg-[#F8F9FA] dark:bg-[#121417] min-h-screen pb-24 font-sans transition-colors duration-300">
            {/* Header */}
            <div className="px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <p className="text-slate-500 text-sm font-medium mb-1">Welcome! 👋</p>
                        <h1 className="text-2xl font-extrabold tracking-tight text-[#1A1D1F] dark:text-white">
                            Complete Your Profile
                        </h1>
                    </div>
                    <button
                        onClick={onSkip}
                        className="text-sm font-semibold text-slate-400 hover:text-primary transition-colors"
                    >
                        Skip
                    </button>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Tell us more about yourself to enhance your experience
                </p>
            </div>

            {/* Avatar Section */}
            <div className="px-6 mb-6">
                <div className="bg-white dark:bg-[#1E2126] p-6 rounded-2xl shadow-soft">
                    <div className="flex flex-col items-center">
                        <div
                            className="relative group cursor-pointer mb-4"
                            onClick={handleAvatarClick}
                        >
                            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#F8F9FA] dark:border-[#121417] shadow-xl relative group-hover:scale-[1.05] transition-all duration-700 bg-slate-100">
                                <img
                                    src={avatarUrl}
                                    alt="Profile"
                                    className="w-full h-full object-cover group-hover:blur-[2px] transition-all"
                                />
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <CameraIcon className="w-8 h-8 text-white mb-1" />
                                    <span className="text-[9px] font-bold text-white uppercase tracking-widest">Add Photo</span>
                                </div>
                            </div>
                            {isUploading && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center">
                                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-slate-400">Tap to add profile photo</p>
                    </div>
                </div>
            </div>

            {/* Form Fields */}
            <div className="px-6 space-y-4">
                {/* Required Fields */}
                <div className="bg-white dark:bg-[#1E2126] p-6 rounded-2xl shadow-soft">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.1em] mb-4">Required</h3>

                    {/* Name */}
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Full Name *
                        </label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="Enter your full name"
                                className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl text-sm text-[#1A1D1F] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                        {errors.name && (
                            <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                        )}
                    </div>

                    {/* Phone */}
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Phone Number
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                placeholder="+1 234 567 890"
                                className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl text-sm text-[#1A1D1F] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Address
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                            <textarea
                                value={formData.address}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                placeholder="Your address"
                                rows={3}
                                className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl text-sm text-[#1A1D1F] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Optional Fields */}
                <div className="bg-white dark:bg-[#1E2126] p-6 rounded-2xl shadow-soft">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.1em] mb-4">About You</h3>

                    {/* Bio */}
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Bio
                        </label>
                        <div className="relative">
                            <FileText className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                            <textarea
                                value={formData.bio}
                                onChange={(e) => handleInputChange('bio', e.target.value)}
                                placeholder="Tell us about yourself..."
                                rows={4}
                                className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl text-sm text-[#1A1D1F] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Social Links */}
                <div className="bg-white dark:bg-[#1E2126] p-6 rounded-2xl shadow-soft">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.1em] mb-4">Social Links</h3>

                    {/* Instagram */}
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Instagram
                        </label>
                        <div className="relative">
                            <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={formData.instagram}
                                onChange={(e) => handleInputChange('instagram', e.target.value)}
                                placeholder="@username"
                                className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl text-sm text-[#1A1D1F] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Twitter */}
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Twitter
                        </label>
                        <div className="relative">
                            <Twitter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={formData.twitter}
                                onChange={(e) => handleInputChange('twitter', e.target.value)}
                                placeholder="@username"
                                className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl text-sm text-[#1A1D1F] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Facebook */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Facebook
                        </label>
                        <div className="relative">
                            <Facebook className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={formData.facebook}
                                onChange={(e) => handleInputChange('facebook', e.target.value)}
                                placeholder="facebook.com/username"
                                className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl text-sm text-[#1A1D1F] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {errors.submit && (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl p-4">
                        <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="pt-4 space-y-3">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full py-4 bg-primary hover:bg-primary/90 text-[#1A1D1F] font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <span className="w-5 h-5 border-2 border-[#1A1D1F]/30 border-t-[#1A1D1F] rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                Complete Profile
                                <ChevronRight className="w-5 h-5" />
                            </>
                        )}
                    </button>

                    <button
                        onClick={onSkip}
                        className="w-full py-4 bg-transparent text-slate-400 font-semibold rounded-2xl hover:text-slate-600 dark:hover:text-slate-300 transition-all"
                    >
                        Skip for now
                    </button>
                </div>
            </div>

            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />

            {/* Source Selection Modal */}
            {showSourceModal && (
                <div className="fixed inset-0 bg-app-bg/80 backdrop-blur-xl z-[100] flex items-end justify-center p-6 animate-in fade-in duration-300">
                    <div className="w-full max-w-sm bg-app-surface rounded-[3rem] border border-app-border p-8 shadow-2xl animate-in slide-in-from-bottom duration-500">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black text-app-text uppercase tracking-tighter">Add Photo</h3>
                            <button
                                onClick={() => setShowSourceModal(false)}
                                className="w-10 h-10 rounded-full bg-app-surface-2 flex items-center justify-center text-app-text-muted"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleSelectSource('camera')}
                                className="flex flex-col items-center justify-center p-8 bg-primary/10 rounded-[2.5rem] border border-primary/20 group hover:bg-primary transition-all active:scale-95"
                            >
                                <div className="w-16 h-16 bg-app-surface-2 rounded-[1.5rem] flex items-center justify-center text-primary group-hover:text-slate-900 group-hover:bg-white/20 transition-all mb-4">
                                    <CameraIcon className="w-8 h-8" />
                                </div>
                                <span className="text-[10px] font-black text-app-text group-hover:text-slate-900 uppercase tracking-widest leading-none">Camera</span>
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
        </div>
    );
};
