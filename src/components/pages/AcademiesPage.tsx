import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import {
    School,
    MapPin,
    ChevronRight,
    Search,
    Filter,
    ArrowLeft,
    Calendar,
    DollarSign,
    Users
} from 'lucide-react';

interface Academy {
    id: string;
    name: string;
    description: string;
    cover_url: string;
    programs: any[];
    complexes: {
        name: string;
        location: string;
        latitude: number;
        longitude: number;
    };
    distance?: number;
}

export const AcademiesPage: React.FC = () => {
    const navigate = useNavigate();
    const [academies, setAcademies] = useState<Academy[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [selectedAcademy, setSelectedAcademy] = useState<Academy | null>(null);
    const [showRegForm, setShowRegForm] = useState(false);
    const [regData, setRegData] = useState({ childName: '', childAge: '' });

    useEffect(() => {
        loadAcademies();
        detectLocation();
    }, []);

    const loadAcademies = async () => {
        const { data, error } = await supabase
            .from('academies')
            .select(`
        *,
        complexes (
          name,
          location,
          latitude,
          longitude
        )
      `);

        if (error) {
            console.error('Error loading academies:', error);
            return;
        }

        setAcademies(data as Academy[]);
        setIsLoading(false);
    };

    const detectLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(position => {
                const loc = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                setUserLocation(loc);
            });
        }
    };

    useEffect(() => {
        if (userLocation && academies.length > 0) {
            const sorted = [...academies].map(academy => {
                if (academy.complexes?.latitude && academy.complexes?.longitude) {
                    const dist = calculateDistance(
                        userLocation.lat,
                        userLocation.lng,
                        academy.complexes.latitude,
                        academy.complexes.longitude
                    );
                    return { ...academy, distance: parseFloat(dist) };
                }
                return { ...academy, distance: 9999 };
            }).sort((a, b) => (a.distance || 0) - (b.distance || 0));

            setAcademies(sorted);
        }
    }, [userLocation, academies.length]);

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (R * c).toFixed(1);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAcademy) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('Please sign in to register');
            return;
        }

        const { error } = await supabase
            .from('academy_registrations')
            .insert({
                academy_id: selectedAcademy.id,
                user_id: user.id,
                child_name: regData.childName,
                child_age: parseInt(regData.childAge),
                status: 'pending'
            });

        if (error) {
            alert('Error: ' + error.message);
        } else {
            alert('Request sent! The academy will contact you soon.');
            setSelectedAcademy(null);
            setShowRegForm(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 pb-24">
            {/* Header */}
            <div className="p-6 pt-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <School className="text-primary" />
                            Academies
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Train with the best coaches</p>
                    </div>
                    <button className="p-3 bg-slate-900 rounded-2xl border border-app-border">
                        <Filter className="text-slate-400 w-5 h-5" />
                    </button>
                </div>

                {/* Proximity Banner */}
                {userLocation && (
                    <div className="mb-8 p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-3">
                        <MapPin className="text-primary w-5 h-5" />
                        <p className="text-xs font-bold text-primary uppercase tracking-wider">Sorting by nearest to you</p>
                    </div>
                )}

                {/* Academies Grid */}
                <div className="space-y-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Searching...</p>
                        </div>
                    ) : (
                        academies.map(academy => (
                            <div
                                key={academy.id}
                                onClick={() => setSelectedAcademy(academy)}
                                className="bg-slate-900/50 rounded-[2rem] border border-app-border overflow-hidden group active:scale-[0.98] transition-all"
                            >
                                <div className="aspect-[2/1] bg-slate-800 relative">
                                    {academy.cover_url ? (
                                        <img src={academy.cover_url} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-700 text-4xl font-bold">{academy.name[0]}</div>
                                    )}
                                    <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-[10px] font-bold text-white">
                                        {academy.distance ? `${academy.distance} km` : 'Discovery'}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] font-black uppercase text-primary tracking-widest">{academy.complexes?.name}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">{academy.name}</h3>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase">
                                            <Users className="w-3 h-3" />
                                            5-16 Years
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase">
                                            <Calendar className="w-3 h-3" />
                                            3 Sessions/Week
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Academy Modal */}
            {selectedAcademy && (
                <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col pt-12">
                    <div className="flex items-center justify-between px-6 mb-6">
                        <button
                            onClick={() => { setSelectedAcademy(null); setShowRegForm(false); }}
                            className="p-3 bg-slate-900 rounded-2xl"
                        >
                            <ArrowLeft className="text-white" />
                        </button>
                        <h2 className="text-lg font-bold">Academy Details</h2>
                        <div className="w-10" />
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 space-y-8 pb-12">
                        <div className="aspect-square bg-slate-900 rounded-[3rem] overflow-hidden border border-app-border">
                            {selectedAcademy.cover_url ? (
                                <img src={selectedAcademy.cover_url} className="w-full h-full object-cover" alt="" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-800 text-7xl font-bold">{selectedAcademy.name[0]}</div>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-lg tracking-widest">Training Hub</span>
                                <span className="px-3 py-1 bg-app-surface-2 text-slate-500 text-[10px] font-black uppercase rounded-lg tracking-widest">{selectedAcademy.distance ? `${selectedAcademy.distance} km away` : 'Discovery'}</span>
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-4">{selectedAcademy.name}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-8">{selectedAcademy.description}</p>
                        </div>

                        <div className="p-8 bg-slate-900/80 rounded-[2.5rem] border border-app-border">
                            <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-6">Training Programs</h4>
                            <div className="space-y-4">
                                {(selectedAcademy.programs || []).map((p, i) => (
                                    <div key={i} className="p-4 bg-black/20 rounded-2xl flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-white">{p.name}</p>
                                            <p className="text-[10px] text-slate-500 uppercase font-black">{p.ageGroup} • {p.schedule}</p>
                                        </div>
                                        <p className="text-primary font-bold text-sm">{p.price} TND</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {showRegForm ? (
                            <form onSubmit={handleRegister} className="space-y-4 pt-4">
                                <h4 className="text-lg font-bold text-white">Enrollment Form</h4>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Child's Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={regData.childName}
                                        onChange={e => setRegData({ ...regData, childName: e.target.value })}
                                        className="w-full bg-slate-900 border-app-border rounded-2xl p-4 text-sm text-white focus:border-primary transition-all"
                                        placeholder="Enter full name"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Child's Age</label>
                                    <input
                                        type="number"
                                        required
                                        value={regData.childAge}
                                        onChange={e => setRegData({ ...regData, childAge: e.target.value })}
                                        className="w-full bg-slate-900 border-app-border rounded-2xl p-4 text-sm text-white focus:border-primary transition-all"
                                        placeholder="Current age"
                                    />
                                </div>
                                <button type="submit" className="w-full bg-primary text-slate-950 py-5 rounded-[2rem] font-bold text-lg shadow-xl shadow-primary/20">
                                    Submit Registration
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowRegForm(false)}
                                    className="w-full py-4 text-slate-500 font-bold uppercase text-[10px] tracking-widest"
                                >
                                    Go Back
                                </button>
                            </form>
                        ) : (
                            <button
                                onClick={() => setShowRegForm(true)}
                                className="w-full bg-primary text-slate-950 py-5 rounded-[2rem] font-bold text-lg shadow-xl shadow-primary/20"
                            >
                                Join Academy
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
