import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin } from 'lucide-react';
import { getComplexes, calculateDistance, getUserLocation } from '@/services/dataService';

// Fallback for image generation if missing
// Stable placeholder for images
const getRealPlaceholderImage = (id: string, type: string) => `https://images.unsplash.com/photo-1574629810360-7de6a7d9b757?auto=format&fit=crop&q=80&w=400&h=400&sig=${id}`;

interface MapViewProps {
    onBack?: () => void;
    showBackButton?: boolean;
    compact?: boolean;
    complexes?: any[];
    userLocation?: { lat: number; lng: number } | null;
}

const MapView = ({ onBack, showBackButton = true, compact = false, complexes: initialComplexes, userLocation: initialLocation }: MapViewProps) => {
    const navigate = useNavigate();
    const [complexes, setComplexes] = useState<any[]>(initialComplexes || []);
    const [selectedComplex, setSelectedComplex] = useState<any | null>(null);
    const [loading, setLoading] = useState(!initialComplexes || initialComplexes.length === 0);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(initialLocation || null);
    const [mapReady, setMapReady] = useState(false);
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapInstance, setMapInstance] = useState<any>(null);
    const userMarkerRef = useRef<any>(null);

    useEffect(() => {
        const checkLeaflet = () => {
            if (typeof window !== 'undefined' && (window as any).L) {
                setMapReady(true);
                return true;
            }
            return false;
        };

        if (!checkLeaflet()) {
            let attempts = 0;
            const maxAttempts = 50;
            const interval = setInterval(() => {
                attempts++;
                if (checkLeaflet() || attempts >= maxAttempts) {
                    clearInterval(interval);
                    if (attempts >= maxAttempts) setLoading(false);
                }
            }, 100);
            return () => clearInterval(interval);
        }
    }, []);

    useEffect(() => {
        if (mapReady) {
            if (!initialComplexes) fetchData();
            if (!initialLocation) loadUserLocation();
        }
    }, [mapReady, initialComplexes, initialLocation]);

    useEffect(() => {
        if (initialComplexes) {
            setComplexes(initialComplexes);
            setLoading(false);
        }
    }, [initialComplexes]);

    useEffect(() => {
        if (initialLocation) {
            setUserLocation(initialLocation);
        }
    }, [initialLocation]);

    const fetchData = async () => {
        await fetchComplexes();
    };

    const loadUserLocation = async () => {
        try {
            const location = await getUserLocation();
            setUserLocation(location);
        } catch (error) {
            setUserLocation(null);
        }
    };

    const fetchComplexes = async () => {
        try {
            const data = await getComplexes();
            if (userLocation) {
                const sorted = data.map((c: any) => ({
                    ...c,
                    distance: calculateDistance(userLocation.lat, userLocation.lng, c.location_lat, c.location_lng)
                })).sort((a: any, b: any) => (a.distance || 0) - (b.distance || 0));
                setComplexes(sorted);
            } else {
                setComplexes(data);
            }
        } catch (error) {
            console.error('Error fetching complexes:', error);
        }
    };

    useEffect(() => {
        if (!mapReady || mapInstance || !mapRef.current) return;

        const L = (window as any).L;
        if (!L) return;

        const map = L.map(mapRef.current, {
            zoomControl: false,
            attributionControl: false
        }).setView([36.8065, 10.1815], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
        }).addTo(map);

        setMapInstance(map);
        setLoading(false);

        return () => {
            if (map) {
                map.remove();
                setMapInstance(null);
            }
        };
    }, [mapReady]);

    useEffect(() => {
        if (!mapInstance || !userLocation || !(window as any).L) return;
        const L = (window as any).L;

        if (userMarkerRef.current) mapInstance.removeLayer(userMarkerRef.current);

        const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: `<div style="background-color: #3b82f6; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3); border: 3px solid white; animation: pulse 2s infinite;"><div style="background-color: white; border-radius: 50%; width: 12px; height: 12px;"></div></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
        });

        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(mapInstance);
        mapInstance.setView([userLocation.lat, userLocation.lng], 15);
    }, [userLocation, mapInstance]);

    useEffect(() => {
        if (!mapInstance || complexes.length === 0 || !(window as any).L) return;
        const L = (window as any).L;

        // Clear only non-user markers
        mapInstance.eachLayer((layer: any) => {
            if (layer instanceof L.Marker && layer !== userMarkerRef.current) {
                mapInstance.removeLayer(layer);
            }
        });

        const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: #10b981; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4); border: 3px solid white;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
        });

        complexes.forEach((complex) => {
            if (complex.location_lat && complex.location_lng) {
                const marker = L.marker([complex.location_lat, complex.location_lng], { icon: customIcon }).addTo(mapInstance);
                marker.on('click', () => setSelectedComplex(complex));
            }
        });
    }, [complexes, mapInstance]);

    return (
        <div className={`w-full bg-app-bg relative overflow-hidden ${compact ? 'h-[400px] rounded-[2rem]' : 'h-full'}`}>
            <div ref={mapRef} className="absolute inset-0 z-0" style={{ height: '100%', width: '100%' }}></div>

            {showBackButton && (
                <div className="absolute top-12 left-4 z-[1000]">
                    <button onClick={onBack || (() => navigate(-1))} className="bg-app-surface/50 backdrop-blur-md p-3.5 rounded-2xl shadow-xl active:scale-90 transition-transform border border-app-border">
                        <ChevronLeft size={24} className="text-app-text" />
                    </button>
                </div>
            )}

            {loading && (
                <div className="absolute inset-0 bg-app-bg/60 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full shadow-lg"></div>
                        <span className="text-xs font-black text-primary tracking-widest uppercase">Locating pitches...</span>
                    </div>
                </div>
            )}

            {selectedComplex && (
                <div
                    onClick={() => navigate(`/complex/${selectedComplex.id}`)}
                    className="absolute bottom-6 left-4 right-4 bg-app-surface/90 backdrop-blur-xl rounded-[2.5rem] p-5 shadow-2xl z-[1000] border border-app-border animate-in slide-in-from-bottom duration-300 cursor-pointer group active:scale-[0.98] transition-all"
                >
                    <div className="flex gap-5">
                        <img
                            src={getRealPlaceholderImage(selectedComplex.id, 'complex')}
                            className="w-20 h-20 rounded-2xl object-cover shadow-lg group-hover:scale-105 transition-transform duration-500 border border-app-border"
                            alt={selectedComplex.name}
                        />
                        <div className="flex-1 py-1">
                            <h3 className="font-black text-lg text-app-text mb-1 leading-tight group-hover:text-primary transition-colors">{selectedComplex.name}</h3>
                            <div className="flex items-center gap-2">
                                <span className="bg-primary text-slate-900 px-4 py-2 rounded-xl font-black text-[10px] shadow-lg shadow-primary/20 tracking-widest uppercase">
                                    VIEW DETAILS
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapView;
