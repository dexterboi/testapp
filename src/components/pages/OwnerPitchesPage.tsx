import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Plus, Phone, Check, Save, X, MoreVertical } from 'lucide-react';
import { supabase } from '@/services/supabase';
import { getPitchesByComplex, getComplex } from '@/services/dataService';
import { ensureArray } from '@/utils';
import { ImageUpload } from '@/components/common/ImageUpload';
import { SuccessModal } from '@/components/common/ConfirmationModal';

const OwnerPitchesPage = () => {
    const { complexId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'pitches' | 'complex' | 'images'>('pitches');
    const [pitches, setPitches] = useState<any[]>([]);
    const [complex, setComplex] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editingPitch, setEditingPitch] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [settings, setSettings] = useState({
        description: '',
        phone: '',
        email: '',
        facilities: [] as string[]
    });

    const availableFacilities = [
        'Parking', 'Changing Rooms', 'Showers', 'Cafe', 'WiFi',
        'First Aid', 'Equipment Rental', 'Coaching', 'Floodlights',
        'Spectator Seating', 'Disability Access', 'Security'
    ];

    useEffect(() => {
        if (complexId) {
            fetchData();
        }
    }, [complexId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pitchesData, complexData] = await Promise.all([
                getPitchesByComplex(complexId!),
                getComplex(complexId!)
            ]);
            setPitches(pitchesData);
            setComplex(complexData);
            setSettings({
                description: complexData.description || '',
                phone: complexData.phone || '',
                email: complexData.email || '',
                facilities: complexData.facilities || []
            });
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        setLoading(false);
    };

    const fetchPitches = async () => {
        const data = await getPitchesByComplex(complexId!);
        setPitches(data);
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('complexes')
                .update(settings)
                .eq('id', complexId!);

            if (error) throw error;
            setSaving(false);
            setShowSuccessModal(true);
            fetchData();
        } catch (error) {
            console.error('Error saving settings:', error);
            setSaving(false);
            setErrorMessage('Failed to save settings. Please try again.');
            setShowErrorModal(true);
        }
    };

    const toggleFacility = (facility: string) => {
        setSettings(prev => ({
            ...prev,
            facilities: prev.facilities.includes(facility)
                ? prev.facilities.filter(f => f !== facility)
                : [...prev.facilities, facility]
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 px-8 text-center text-white">
                <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mb-6"></div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Establishing Link...</p>
            </div>
        );
    }

    if (!complex) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
                <p className="text-slate-500 uppercase font-black tracking-widest text-xs italic">Signal Lost - Venue Not Found</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 pb-32 font-sans text-white">
            {/* Header */}
            <div className="bg-slate-950 px-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-6 border-b border-app-border sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate('/owner')} className="w-10 h-10 rounded-full bg-app-surface-2 hover:bg-app-surface-2 text-white flex items-center justify-center transition-all active:scale-90">
                        <ChevronLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-black tracking-tighter text-white leading-none">
                        Edit Pitch <span className="text-primary">Details</span>
                    </h1>
                </div>

                {/* Tab Selector */}
                <div className="flex bg-app-surface-2 rounded-2xl p-1 border border-app-border">
                    {(['pitches', 'complex', 'images'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-primary text-slate-900 shadow-lg shadow-primary/10' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-6 pt-6">
                {activeTab === 'pitches' && (
                    <div className="space-y-6">
                        {/* Section Header */}
                        <div className="mb-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">YOUR INVENTORY</p>
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-white leading-none">
                                    Active Pitches <span className="text-primary">{pitches.length}</span>
                                </h2>
                            </div>
                        </div>

                        {/* Pitch Cards */}
                        {pitches.map((pitch) => {
                            const getPitchIcon = () => {
                                const name = (pitch.name || '').toLowerCase();
                                if (name.includes('football') || name.includes('soccer')) {
                                    return 'sports_soccer';
                                } else if (name.includes('padel') || name.includes('tennis')) {
                                    return 'sports_tennis';
                                } else if (name.includes('basketball')) {
                                    return 'sports_basketball';
                                }
                                return 'sports_soccer';
                            };

                            const getPitchType = () => {
                                const name = (pitch.name || '').toLowerCase();
                                if (name.includes('indoor')) return 'INDOOR';
                                return 'OUTDOOR';
                            };

                            return (
                                <div key={pitch.id} className="bg-slate-900/60 rounded-3xl p-5 border border-app-border group hover:bg-slate-900 transition-all">
                                    <div className="flex items-center gap-4">
                                        {/* Pitch Image/Icon */}
                                        <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent"></div>
                                            <span className={`material-symbols-rounded text-4xl text-primary relative z-10`}>{getPitchIcon()}</span>
                                        </div>

                                        {/* Pitch Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-black text-[16px] text-white uppercase tracking-tight mb-2 truncate">
                                                {pitch.name}
                                            </h3>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getPitchType() === 'OUTDOOR'
                                                        ? 'bg-primary text-slate-950'
                                                        : 'bg-blue-500 text-white'
                                                    }`}>
                                                    {getPitchType()}
                                                </span>
                                                <span className="text-[11px] text-slate-400 font-bold">
                                                    {pitch.size} • {pitch.surface}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Edit Button */}
                                        <button
                                            onClick={() => setEditingPitch(pitch)}
                                            className="w-10 h-10 bg-app-surface-2 rounded-full flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all border border-app-border"
                                        >
                                            <span className="material-symbols-rounded text-xl text-primary">edit</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Add New Pitch Card */}
                        <div className="bg-slate-900/40 rounded-3xl p-8 border-2 border-dashed border-app-border text-center">
                            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Plus size={24} className="text-slate-400" />
                            </div>
                            <p className="text-[12px] text-slate-400 font-bold leading-relaxed mb-6">
                                Expand your venue by adding new facilities or courts to your listing.
                            </p>
                            <button
                                onClick={() => setEditingPitch({ name: '', size: '11 a side', surface: 'Grass', price_per_hour: 0, complex_id: complexId })}
                                className="w-full bg-primary text-slate-950 font-black py-4 rounded-2xl text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Plus size={20} />
                                ADD NEW PITCH
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'complex' && (
                    <div className="space-y-10 animate-in fade-in duration-500">
                        {/* Description Section */}
                        <div>
                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-2 mb-4 block">About Venue</label>
                            <textarea
                                value={settings.description}
                                onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                                className="w-full bg-slate-900/50 border border-app-border rounded-[2.5rem] p-6 text-sm font-bold text-white focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all placeholder:text-slate-700 min-h-[150px] shadow-inner"
                                placeholder="Share your venue's story..."
                            />
                        </div>

                        {/* Contact Grid */}
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-2 mb-4 block">Direct Contact</label>
                                <div className="relative group">
                                    <Phone size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="tel"
                                        value={settings.phone}
                                        onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-app-border rounded-[1.8rem] pl-14 pr-6 py-4 text-sm font-black text-white focus:ring-2 focus:ring-primary/20 transition-all"
                                        placeholder="Phone Number"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Amenities Section */}
                        <div>
                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-2 mb-6 block">Venue Tech & Comfort</label>
                            <div className="grid grid-cols-2 gap-3">
                                {availableFacilities.map((facility) => (
                                    <button
                                        key={facility}
                                        onClick={() => toggleFacility(facility)}
                                        className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${settings.facilities.includes(facility) ? 'bg-primary/10 border-primary/20 text-primary shadow-lg shadow-primary/5' : 'bg-slate-900/50 border-app-border text-slate-500 hover:text-slate-300'}`}
                                    >
                                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${settings.facilities.includes(facility) ? 'bg-primary border-primary text-slate-900' : 'bg-slate-950 border-app-border'}`}>
                                            {settings.facilities.includes(facility) && <Check size={12} strokeWidth={4} />}
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-tight">{facility}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Global Actions */}
                        <div className="pt-6 fixed bottom-24 left-8 right-8 z-[60]">
                            <button
                                onClick={handleSaveSettings}
                                disabled={saving}
                                className="w-full bg-primary text-slate-900 font-black py-5 rounded-[2rem] text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 transition-all"
                            >
                                {saving ? <div className="animate-spin h-5 w-5 border-2 border-slate-900 border-t-transparent rounded-full"></div> : <Save size={20} />}
                                {saving ? 'Syncing...' : 'Deploy Updates'}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'images' && (
                    <div className="animate-in fade-in duration-500 space-y-6">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">VENUE GALLERY</p>
                            <h2 className="text-2xl font-black text-white leading-none mb-6">
                                Complex Images
                            </h2>
                            {complex && (
                                <ImageUpload
                                    collection="complexes"
                                    recordId={complex.id}
                                    fieldName="images"
                                    currentImages={ensureArray(complex.images, complex.image)}
                                    maxFiles={10}
                                    onUploadComplete={fetchData}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Pitch Edit/Create Modal */}
            {editingPitch && (
                <PitchEditModal
                    pitch={editingPitch}
                    complexId={complexId!}
                    onClose={() => {
                        setEditingPitch(null);
                        fetchPitches();
                    }}
                    onPitchUpdate={fetchPitches}
                />
            )}
            <SuccessModal isOpen={showSuccessModal} title="Settings Saved" message="Your complex settings have been updated successfully." onClose={() => setShowSuccessModal(false)} />
            <SuccessModal isOpen={showErrorModal} title="Error" message={errorMessage} onClose={() => setShowErrorModal(false)} />
        </div>
    );
};

const PitchEditModal = ({ pitch, complexId, onClose, onPitchUpdate }: { pitch: any; complexId: string; onClose: () => void; onPitchUpdate?: () => void }) => {
    const isNewPitch = !pitch.id;
    const [currentPitch, setCurrentPitch] = useState(pitch);

    useEffect(() => {
        if (!isNewPitch && pitch.id) {
            const fetchPitch = async () => {
                try {
                    const { data, error } = await supabase
                        .from('pitches')
                        .select('*')
                        .eq('id', pitch.id)
                        .single();

                    if (!error && data) {
                        setCurrentPitch(data);
                    }
                } catch (err) {
                    console.error('[PitchEditModal] Error fetching pitch:', err);
                }
            };
            fetchPitch();
        }
    }, [pitch.id, isNewPitch]);

    const [formData, setFormData] = useState({
        name: pitch.name || '',
        size: pitch.size || '11 a side',
        surface: pitch.surface || 'Grass',
        sport_type: pitch.sport_type || 'Football',
        price_per_hour: pitch.price_per_hour || 0,
        opening_hour: pitch.opening_hour || 8,
        closing_hour: pitch.closing_hour || 23,
        match_duration: pitch.match_duration || 75,
        status: pitch.status || 'active'
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const refreshPitchData = async () => {
        if (isNewPitch || !pitch.id) return;
        try {
            const { data, error: fetchError } = await supabase
                .from('pitches')
                .select('*')
                .eq('id', pitch.id)
                .single();

            if (!fetchError && data) {
                setCurrentPitch(data);
            }
        } catch (err) {
            console.error('[PitchEditModal] Error refreshing pitch data:', err);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            setError('Pitch name is required');
            return;
        }

        setSaving(true);
        setError('');
        try {
            const pitchData = {
                ...formData,
                complex_id: complexId
            };

            if (isNewPitch) {
                const { error: insertError } = await supabase
                    .from('pitches')
                    .insert([pitchData]);
                if (insertError) throw insertError;
            } else {
                const { error: updateError } = await supabase
                    .from('pitches')
                    .update(pitchData)
                    .eq('id', pitch.id);
                if (updateError) throw updateError;
            }

            onClose();
            if (onPitchUpdate) onPitchUpdate();
        } catch (err: any) {
            console.error('Error saving pitch:', err);
            setError(err.message || 'Failed to save pitch. Please try again.');
        }
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[100] flex items-end md:items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-slate-900 rounded-[3rem] w-full max-w-md border border-app-border shadow-2xl animate-in slide-in-from-bottom duration-500 max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-8 border-b border-app-border flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                            {isNewPitch ? 'Add New Pitch' : 'Edit Pitch'}
                        </h2>
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-app-surface-2 hover:bg-app-surface-2 rounded-full text-slate-400 transition-all">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-8 space-y-6 overflow-y-auto flex-1">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                            <p className="text-red-400 text-sm font-bold">{error}</p>
                        </div>
                    )}

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Pitch Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-slate-950 border border-app-border rounded-2xl p-4 text-sm font-black text-white focus:border-primary/50 transition-all outline-none"
                            placeholder="e.g., Main Football Pitch"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Sport Type</label>
                        <select
                            value={formData.sport_type}
                            onChange={(e) => setFormData({ ...formData, sport_type: e.target.value })}
                            className="w-full bg-slate-950 border border-app-border rounded-2xl p-4 text-sm font-black text-white appearance-none focus:border-primary/50 transition-all outline-none"
                        >
                            <option value="Football">Football</option>
                            <option value="Padel">Padel</option>
                            <option value="Tennis">Tennis</option>
                            <option value="Basketball">Basketball</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Size</label>
                            <select
                                value={formData.size}
                                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                                className="w-full bg-slate-950 border border-app-border rounded-2xl p-4 text-sm font-black text-white appearance-none focus:border-primary/50 transition-all outline-none"
                            >
                                <option value="6 a side">6 a side</option>
                                <option value="7 a side">7 a side</option>
                                <option value="11 a side">11 a side</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Surface</label>
                            <select
                                value={formData.surface}
                                onChange={(e) => setFormData({ ...formData, surface: e.target.value })}
                                className="w-full bg-slate-950 border border-app-border rounded-2xl p-4 text-sm font-black text-white appearance-none focus:border-primary/50 transition-all outline-none"
                            >
                                <option value="Grass">Grass</option>
                                <option value="3G">3G</option>
                                <option value="4G">4G</option>
                                <option value="outdoor">Outdoor</option>
                                <option value="indoor">Indoor</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Operating Hours</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Opening</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="23"
                                    value={formData.opening_hour}
                                    onChange={(e) => setFormData({ ...formData, opening_hour: +e.target.value })}
                                    className="w-full bg-slate-950 border border-app-border rounded-2xl p-4 text-sm font-black text-white focus:border-primary/50 transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Closing</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="23"
                                    value={formData.closing_hour}
                                    onChange={(e) => setFormData({ ...formData, closing_hour: +e.target.value })}
                                    className="w-full bg-slate-950 border border-app-border rounded-2xl p-4 text-sm font-black text-white focus:border-primary/50 transition-all outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Price Per Hour (TND)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.price_per_hour}
                            onChange={(e) => setFormData({ ...formData, price_per_hour: +e.target.value })}
                            className="w-full bg-slate-950 border border-app-border rounded-2xl p-4 text-sm font-black text-white focus:border-primary/50 transition-all outline-none"
                        />
                    </div>

                    {!isNewPitch && pitch.id && (
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Pitch Images</label>
                            <ImageUpload
                                collection="pitches"
                                recordId={pitch.id}
                                fieldName="images"
                                currentImages={ensureArray(currentPitch?.images, currentPitch?.image)}
                                maxFiles={10}
                                onUploadComplete={async () => {
                                    await refreshPitchData();
                                    if (onPitchUpdate) onPitchUpdate();
                                }}
                            />
                        </div>
                    )}
                </div>

                <div className="p-8 border-t border-app-border flex-shrink-0 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-app-surface-2 text-slate-400 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-app-surface-2 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 bg-primary text-slate-950 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
                    >
                        {saving ? (
                            <div className="animate-spin h-5 w-5 border-2 border-slate-950 border-t-transparent rounded-full mx-auto" />
                        ) : (
                            isNewPitch ? 'Create Pitch' : 'Save Changes'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OwnerPitchesPage;
