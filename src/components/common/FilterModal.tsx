import React from 'react';
import { X } from 'lucide-react';

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    filters: {
        maxPrice: number;
        minRating: number;
        maxDistance: number;
        surfaces: string[];
        amenities: string[];
    };
    setFilters: React.Dispatch<React.SetStateAction<{
        maxPrice: number;
        minRating: number;
        maxDistance: number;
        surfaces: string[];
        amenities: string[];
    }>>;
    onApply: () => void;
}

export const FilterModal = ({ isOpen, onClose, filters, setFilters, onApply }: FilterModalProps) => {
    if (!isOpen) return null;

    const surfaces = ["Grass", "3G", "4G", "Synthetic", "Indoor"];
    const amenities = ["Parking", "Cafe", "Changing Rooms", "Showers", "Lighting", "Wi-Fi"];

    return (
        <div className="fixed inset-0 z-[100] bg-app-bg flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Sticky Header */}
            <div className="flex justify-between items-center p-6 border-b border-app-border bg-app-bg sticky top-0 z-10">
                <h2 className="text-xl font-black text-app-text tracking-tighter uppercase">Filters</h2>
                <button onClick={onClose} className="p-2 hover:bg-app-surface-2 rounded-full transition-colors">
                    <X size={20} className="text-app-text-muted" />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-10 space-y-10 scroll-smooth pb-32">
                <div className="space-y-10">
                    {/* Distance Filter */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-xs font-black text-app-text-muted uppercase tracking-widest">Max Distance</label>
                            <span className="text-primary font-black text-lg">{filters.maxDistance} km</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="100"
                            step="1"
                            value={filters.maxDistance}
                            onChange={(e) => setFilters({ ...filters, maxDistance: parseInt(e.target.value) })}
                            className="w-full h-3 bg-app-surface-2 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <p className="text-[10px] text-app-text-muted mt-2 font-medium italic">Showing complexes within {filters.maxDistance}km of your location.</p>
                    </div>

                    {/* Price Range */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-xs font-black text-app-text-muted uppercase tracking-widest">Max Price (per hour)</label>
                            <span className="text-primary font-black text-lg">{filters.maxPrice} TND</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="200"
                            step="10"
                            value={filters.maxPrice}
                            onChange={(e) => setFilters({ ...filters, maxPrice: parseInt(e.target.value) })}
                            className="w-full h-3 bg-app-surface-2 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                    </div>

                    {/* Star Rating */}
                    <div>
                        <label className="text-xs font-black text-app-text-muted uppercase tracking-widest block mb-4">Minimum Rating</label>
                        <div className="flex gap-2">
                            {[0, 3, 4, 4.5].map((rating) => (
                                <button
                                    key={rating}
                                    onClick={() => setFilters({ ...filters, minRating: rating })}
                                    className={`flex-1 py-3.5 rounded-2xl text-xs font-bold transition-all border ${filters.minRating === rating
                                        ? 'bg-primary text-slate-900 border-primary shadow-xl shadow-primary/20'
                                        : 'bg-app-surface text-app-text-muted border-app-border hover:bg-app-surface-2 hover:text-app-text'
                                        }`}
                                >
                                    {rating === 0 ? "Any" : `${rating}+ ⭐`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Surface Type */}
                    <div>
                        <label className="text-xs font-black text-app-text-muted uppercase tracking-widest block mb-4">Surface Type</label>
                        <div className="flex flex-wrap gap-2">
                            {surfaces.map((surface) => (
                                <button
                                    key={surface}
                                    onClick={() => {
                                        const newSurfaces = filters.surfaces.includes(surface)
                                            ? filters.surfaces.filter((s: string) => s !== surface)
                                            : [...filters.surfaces, surface];
                                        setFilters({ ...filters, surfaces: newSurfaces });
                                    }}
                                    className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all border ${filters.surfaces.includes(surface)
                                        ? 'bg-primary text-slate-900 border-primary shadow-lg'
                                        : 'bg-app-surface text-app-text-muted border-app-border hover:bg-app-surface-2 hover:text-app-text'
                                        }`}
                                >
                                    {surface}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Amenities */}
                    <div>
                        <label className="text-xs font-black text-app-text-muted uppercase tracking-widest block mb-4">Amenities</label>
                        <div className="grid grid-cols-2 gap-3">
                            {amenities.map((amenity) => (
                                <label key={amenity} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${filters.amenities.includes(amenity) ? 'bg-primary/10 border-primary/20' : 'bg-app-surface border-app-border hover:bg-app-surface-2'}`}>
                                    <input
                                        type="checkbox"
                                        checked={filters.amenities.includes(amenity)}
                                        onChange={() => {
                                            const newAmenities = filters.amenities.includes(amenity)
                                                ? filters.amenities.filter((a: string) => a !== amenity)
                                                : [...filters.amenities, amenity];
                                            setFilters({ ...filters, amenities: newAmenities });
                                        }}
                                        className="w-5 h-5 rounded text-primary focus:ring-primary accent-primary border-app-border bg-app-surface-2"
                                    />
                                    <span className={`text-[11px] font-bold ${filters.amenities.includes(amenity) ? 'text-primary' : 'text-app-text-muted'}`}>{amenity}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Bottom Actions */}
            <div className="fixed bottom-0 left-0 right-0 px-6 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,20px))] bg-app-bg border-t border-app-border flex gap-3 z-20">
                <button
                    onClick={() => {
                        const defaults = { maxPrice: 200, minRating: 0, maxDistance: 100, surfaces: [], amenities: [] };
                        setFilters(defaults);
                        onApply();
                    }}
                    className="flex-1 py-4.5 rounded-2xl text-[11px] font-black text-app-text-muted border border-app-border hover:bg-app-surface-2 transition-all uppercase tracking-widest"
                >
                    Reset
                </button>
                <button
                    onClick={() => onApply()}
                    className="flex-[2] py-4.5 rounded-2xl text-[11px] font-black text-slate-900 bg-primary shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest"
                >
                    Apply Filters
                </button>
            </div>
        </div>
    );
};
