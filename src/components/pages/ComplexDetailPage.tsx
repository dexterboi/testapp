import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getComplex, getPitchesByComplex, getReviews, submitReview } from '@/services/dataService';
import { getFileUrl } from '@/services/supabase';
import { getRealPlaceholderImage } from '@/services/assetService';
import { ImageViewer } from '@/components/common/ImageViewer';
import { ensureArray, getImageUrl, getAvatarUrl } from '@/utils';

const ComplexDetailPage = ({ user }: { user: any }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [complex, setComplex] = useState<any>(null);
    const [pitches, setPitches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingImages, setViewingImages] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const [reviews, setReviews] = useState<any[]>([]);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const [showReviewForm, setShowReviewForm] = useState(false);

    useEffect(() => {
        if (id) {
            fetchComplexData();
            fetchReviews();
        }
    }, [id]);

    const fetchComplexData = async () => {
        setLoading(true);
        const complexData = await getComplex(id!);
        const pitchesData = await getPitchesByComplex(id!);
        setComplex(complexData);
        setPitches(pitchesData);
        setLoading(false);
    };

    const fetchReviews = async () => {
        const reviewsData = await getReviews(id!);
        setReviews(reviewsData);
    };

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!complex || !user) return;

        setSubmittingReview(true);
        const result = await submitReview({
            complex_id: complex.id,
            user_id: user.id,
            rating: newReview.rating,
            comment: newReview.comment
        });

        if (result.success) {
            setNewReview({ rating: 5, comment: '' });
            setShowReviewForm(false);
            fetchReviews();
            fetchComplexData(); // Update average rating
        } else {
            alert("Error submitting review. Please try again.");
        }
        setSubmittingReview(false);
    };

    const getFullImageUrl = (image: string | null | undefined, bucket: string, recordId: string) => {
        return getImageUrl(image, bucket, recordId, getFileUrl);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#121417] flex items-center justify-center">
                <div className="relative">
                    <div className="animate-ping absolute inset-0 bg-primary/20 rounded-full"></div>
                    <div className="bg-white dark:bg-[#1E2126] p-6 rounded-full shadow-soft relative">
                        <span className="material-symbols-rounded text-3xl text-primary animate-pulse">stadium</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!complex) {
        return (
            <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#121417] flex items-center justify-center p-6">
                <div className="text-center group">
                    <div className="bg-white dark:bg-[#1E2126] backdrop-blur-xl p-8 rounded-2xl shadow-soft mb-6 group-hover:shadow-card transition-all duration-500">
                        <span className="material-symbols-rounded text-5xl text-slate-400 mb-4">search_off</span>
                        <p className="text-[#1A1D1F] dark:text-white font-extrabold text-xl mb-1 tracking-tight">Complex not found</p>
                        <p className="text-slate-500 text-sm mb-6">This venue might have been moved or removed.</p>
                        <button onClick={() => navigate('/')} className="w-full bg-primary text-[#1A1D1F] py-4 rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all">
                            Discover Venues
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const imagesArray = ensureArray(complex.images, complex.image);

    return (
        <div className="bg-[#F8F9FA] dark:bg-[#121417] min-h-screen pb-[calc(9rem+env(safe-area-inset-bottom))] font-sans text-[#1A1D1F] dark:text-white">
            {/* Premium Header Image - Banner */}
            <div className="relative h-[350px] overflow-hidden">
                {imagesArray.length > 0 ? (
                    <img
                        src={getFullImageUrl(imagesArray[0], 'complex-images', complex.id)}
                        alt={complex.name}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-[2s] ease-out"
                        onClick={() => {
                            setCurrentImageIndex(0);
                            setViewingImages(true);
                        }}
                        onError={(e) => {
                            console.error('Failed to load banner image:', imagesArray[0]);
                            e.currentTarget.src = getRealPlaceholderImage(complex.id, 'complex');
                        }}
                    />
                ) : (
                    <img
                        src={getRealPlaceholderImage(complex.id, 'complex')}
                        alt={complex.name}
                        className="w-full h-full object-cover"
                    />
                )}
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#F8F9FA] dark:from-[#121417] via-[#F8F9FA]/40 dark:via-[#121417]/40 to-transparent"></div>

                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-[calc(2rem+env(safe-area-inset-top))] left-6 w-10 h-10 bg-white/80 dark:bg-[#1E2126]/80 backdrop-blur-xl flex items-center justify-center rounded-xl text-[#1A1D1F] dark:text-white shadow-lg active:scale-90 transition-all z-30"
                >
                    <span className="material-symbols-rounded">arrow_back_ios_new</span>
                </button>

                <div className="absolute bottom-12 left-6 right-6 z-30">
                    <div className="flex flex-wrap gap-2 mb-2">
                        <span className="bg-primary/20 backdrop-blur-md text-primary font-bold text-[9px] px-3 py-1 rounded-full uppercase tracking-wider">
                            Top Rated
                        </span>
                        <span className="bg-white/40 dark:bg-[#1E2126]/40 backdrop-blur-md text-[#1A1D1F] dark:text-white font-bold text-[9px] px-3 py-1 rounded-full uppercase tracking-wider">
                            Verified
                        </span>
                    </div>
                    <h1 className="text-2xl font-extrabold text-[#1A1D1F] dark:text-white tracking-tight mb-1 leading-none">{complex.name}</h1>
                    <div className="flex items-center text-slate-500 text-xs font-medium gap-1">
                        <span className="material-symbols-rounded text-sm text-primary">location_on</span>
                        <span className="truncate">{complex.address?.split(',').slice(0, 2).join(',') || 'Tunis, Tunisia'}</span>
                    </div>
                </div>
            </div>

            <div className="px-6 -mt-6 relative z-30 space-y-4">
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-[#1E2126] p-4 rounded-2xl shadow-soft">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <span className="material-symbols-rounded text-primary text-lg">star</span>
                            </div>
                            <span className="text-xl font-bold text-[#1A1D1F] dark:text-white leading-none">{complex.avg_rating || '0.0'}</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-10">Rating ({reviews.length})</p>
                    </div>
                    <div className="bg-white dark:bg-[#1E2126] p-4 rounded-2xl shadow-soft">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <span className="material-symbols-rounded text-blue-500 text-lg">near_me</span>
                            </div>
                            <span className="text-xl font-bold text-[#1A1D1F] dark:text-white leading-none">1.2 km</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-10">Nearby</p>
                    </div>
                </div>

                {/* Complex Description */}
                <div className="bg-white dark:bg-[#1E2126] p-5 rounded-2xl shadow-soft relative overflow-hidden">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">About Venue</p>
                    <p className="text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                        {complex.description || "Premium sports destination featuring professional-grade pitches, modern amenities, and a vibrant community of athletes in Tunis."}
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-green-600">Available Today</span>
                    </div>
                </div>

                {/* Contact & Facilities */}
                <div className="space-y-4">
                    {/* Facilities Pill Row */}
                    {complex.facilities && complex.facilities.length > 0 && (
                        <div className="bg-app-surface backdrop-blur-xl p-6 rounded-[2.5rem] shadow-sm border border-app-border">
                            <p className="text-[10px] font-black uppercase tracking-widest text-app-text-muted mb-4">Top Facilities</p>
                            <div className="flex flex-wrap gap-2">
                                {complex.facilities.map((facility: string, index: number) => (
                                    <div
                                        key={index}
                                        className="px-4 py-2 bg-app-surface-2 rounded-xl text-[10px] font-black text-app-text border border-app-border flex items-center gap-2 hover:bg-primary hover:text-slate-900 transition-all cursor-default"
                                    >
                                        <span className="material-symbols-rounded text-xs">check_circle</span>
                                        {facility}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Contact Actions */}
                    <div className="grid grid-cols-2 gap-4">
                        {complex.phone && (
                            <a href={`tel:${complex.phone}`} className="bg-app-surface backdrop-blur-xl p-4 rounded-3xl flex items-center justify-center gap-3 border border-app-border shadow-sm hover:border-primary transition-all group">
                                <span className="material-symbols-rounded text-app-text-muted group-hover:text-primary transition-colors">call</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-app-text">Call Now</span>
                            </a>
                        )}
                        <button
                            onClick={() => setShowReviewForm(true)}
                            className="bg-app-surface backdrop-blur-xl p-4 rounded-3xl flex items-center justify-center gap-3 border border-app-border shadow-sm hover:border-primary transition-all group"
                        >
                            <span className="material-symbols-rounded text-app-text-muted group-hover:text-primary transition-colors">edit_note</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-app-text">Write Review</span>
                        </button>
                    </div>
                </div>

                {/* Image Gallery Section - Similar to Pitch Page */}
                {imagesArray.length > 1 && (
                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black text-app-text tracking-tight">Photo Gallery</h3>
                            <button
                                onClick={() => {
                                    setCurrentImageIndex(0);
                                    setViewingImages(true);
                                }}
                                className="text-primary text-[10px] font-black uppercase tracking-widest hover:text-primary/80 transition-colors"
                            >
                                View All ({imagesArray.length})
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {imagesArray.slice(1, 7).map((image: string, index: number) => (
                                <div
                                    key={`gallery-${index}`}
                                    className="aspect-square rounded-2xl overflow-hidden border border-app-border shadow-lg cursor-pointer group relative"
                                    onClick={() => {
                                        setCurrentImageIndex(index + 1);
                                        setViewingImages(true);
                                    }}
                                >
                                    <img
                                        src={getFullImageUrl(image, 'complex-images', complex.id)}
                                        alt={`Gallery ${index + 2}`}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        onError={(e) => {
                                            console.error('Failed to load gallery image:', image);
                                            e.currentTarget.src = getRealPlaceholderImage(complex.id, 'complex');
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-app-bg/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                            ))}
                            {imagesArray.length > 7 && (
                                <div
                                    className="aspect-square rounded-2xl bg-primary/20 border-2 border-primary/30 flex flex-col items-center justify-center cursor-pointer shadow-lg shadow-primary/20 active:scale-95 transition-all group hover:bg-primary/30"
                                    onClick={() => {
                                        setCurrentImageIndex(6);
                                        setViewingImages(true);
                                    }}
                                >
                                    <span className="text-primary font-black text-2xl mb-1 group-hover:scale-110 transition-transform">+{imagesArray.length - 7}</span>
                                    <span className="text-primary/80 text-[9px] font-black uppercase tracking-widest">More</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Premium Pitches List */}
                <section className="pt-4">
                    <div className="flex justify-between items-end mb-6">
                        <h2 className="text-xl font-black text-app-text tracking-tight">Available Pitches</h2>
                        <p className="text-app-text-muted text-[10px] font-bold uppercase tracking-widest">{pitches.length} Total</p>
                    </div>

                    <div className="space-y-4">
                        {pitches.length === 0 ? (
                            <div className="bg-app-surface backdrop-blur-xl p-12 rounded-[3.5rem] border border-app-border text-center shadow-inner">
                                <span className="material-symbols-rounded text-4xl text-app-text-muted mb-2">sports_soccer</span>
                                <p className="text-xs font-black text-app-text-muted uppercase tracking-widest">No pitches listed yet</p>
                            </div>
                        ) : (
                            pitches.map(pitch => (
                                <div
                                    key={pitch.id}
                                    onClick={() => navigate(`/pitch/${pitch.id}`)}
                                    className="bg-app-surface backdrop-blur-md p-5 rounded-[3rem] shadow-sm border border-app-border hover:bg-app-surface-2 active:scale-[0.98] transition-all cursor-pointer group"
                                >
                                    <div className="flex gap-5">
                                        <div className="relative w-28 h-28 rounded-[2rem] overflow-hidden shrink-0 shadow-lg group-hover:shadow-primary/10 transition-all border border-app-border">
                                            <img
                                                src={(() => {
                                                    const images = ensureArray(pitch.images, pitch.image);
                                                    const firstImage = images[0];
                                                    return firstImage
                                                        ? (firstImage.startsWith('http') ? firstImage : getFileUrl('pitch-images', `${pitch.id}/${firstImage}`))
                                                        : getRealPlaceholderImage(pitch.id, pitch.surface === 'Indoor' ? 'indoor' : 'pitch');
                                                })()}
                                                alt={pitch.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-app-bg/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        </div>

                                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                    <span className="bg-app-surface-2 px-2 py-0.5 rounded text-[8px] font-black text-app-text-muted uppercase tracking-wider">{pitch.surface || 'Field'}</span>
                                                    <span className="bg-primary/10 px-2 py-0.5 rounded text-[8px] font-black text-primary uppercase tracking-wider">{pitch.size || '5v5'}</span>
                                                    {pitch.sport_type && (
                                                        <span className="bg-blue-500/10 px-2 py-0.5 rounded text-[8px] font-black text-blue-400 uppercase tracking-wider flex items-center gap-1">
                                                            <span className="material-symbols-rounded text-[10px]">
                                                                {pitch.sport_type.toLowerCase().includes('football') ? 'sports_soccer' :
                                                                    pitch.sport_type.toLowerCase().includes('padel') ? 'sports_tennis' :
                                                                        pitch.sport_type.toLowerCase().includes('tennis') ? 'sports_tennis' :
                                                                            pitch.sport_type.toLowerCase().includes('basketball') ? 'sports_basketball' : 'sports_soccer'}
                                                            </span>
                                                            {pitch.sport_type}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="font-bold text-lg text-app-text leading-tight truncate">{pitch.name}</h3>
                                            </div>

                                            <div className="flex items-end justify-between">
                                                <div>
                                                    <p className="text-[8px] font-black text-app-text-muted uppercase tracking-widest mb-0.5">Price / Hour</p>
                                                    <span className="text-xl font-black text-app-text tabular-nums">
                                                        {pitch.price_per_hour || 60} <span className="text-[10px] text-app-text-muted">TND</span>
                                                    </span>
                                                </div>
                                                <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20 group-hover:scale-110 group-hover:-rotate-12 transition-all">
                                                    <span className="material-symbols-rounded text-slate-900 text-lg">arrow_forward</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Community Feedback */}
                <section className="pt-4 pb-12">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-black text-app-text tracking-tight">Player Feedback</h2>
                        <div className="flex -space-x-3 group cursor-pointer" onClick={() => setShowReviewForm(true)}>
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-app-bg bg-app-surface flex items-center justify-center shrink-0">
                                    <span className="material-symbols-rounded text-xs text-app-text-muted">person</span>
                                </div>
                            ))}
                            <div className="w-8 h-8 rounded-full border-2 border-app-bg bg-primary flex items-center justify-center text-[10px] font-black text-slate-900">+</div>
                        </div>
                    </div>

                    {reviews.length === 0 ? (
                        <div className="bg-app-surface backdrop-blur-xl p-10 rounded-[3.5rem] text-center border border-app-border">
                            <span className="material-symbols-rounded text-4xl text-app-text-muted mb-2">reviews</span>
                            <p className="text-xs font-black text-app-text-muted uppercase tracking-[0.2em] mb-4">No reviews yet</p>
                            <button onClick={() => setShowReviewForm(true)} className="text-primary font-black text-[10px] uppercase tracking-widest py-2 border-b-2 border-primary active:opacity-50 transition-all">Write First Review</button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {reviews.map((review: any) => (
                                <div key={review.id} className="bg-app-surface/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-app-border shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-app-border shadow-inner bg-app-surface-2">
                                                <img
                                                    src={getAvatarUrl(review.user_profiles?.avatar, review.user_profiles?.name, review.user_id)}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-app-text leading-none mb-1.5">{review.user_profiles?.name || 'Player'}</p>
                                                <div className="flex gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <span key={i} className={`material-symbols-rounded text-[10px] ${i < review.rating ? "text-primary fill-1" : "text-app-text-muted/20"}`}>star</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-[8px] font-black text-app-text-muted uppercase tracking-widest">{new Date(review.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                    </div>
                                    <p className="text-app-text-muted text-sm font-medium leading-relaxed pl-1 space-y-2">
                                        {review.comment}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* Review Modal */}
            {showReviewForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-app-bg/80 backdrop-blur-md p-6 animate-in fade-in duration-300">
                    <div className="bg-app-surface w-full max-w-sm rounded-[3rem] p-8 shadow-2xl border border-app-border animate-in zoom-in-95 duration-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

                        <h2 className="text-2xl font-black text-app-text tracking-tight mb-2">Rate Venue</h2>
                        <p className="text-app-text-muted text-sm font-medium mb-10 leading-relaxed">Share your experience at <span className="text-primary font-bold">{complex.name}</span> with other players.</p>

                        <form onSubmit={handleReviewSubmit} className="relative z-10">
                            <div className="flex justify-center gap-3 mb-10">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setNewReview({ ...newReview, rating: star })}
                                        className="transition-all active:scale-90"
                                    >
                                        <span className={`material-symbols-rounded text-5xl ${star <= newReview.rating ? "text-primary fill-1" : "text-app-surface-2"}`}>star</span>
                                    </button>
                                ))}
                            </div>

                            <textarea
                                value={newReview.comment}
                                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                placeholder="How was the pitch? The service? ..."
                                className="w-full bg-app-surface-2 border border-app-border rounded-[2rem] p-6 text-sm font-medium focus:ring-2 focus:ring-primary focus:bg-app-surface-2 transition-all mb-8 min-h-[140px] resize-none text-app-text placeholder:text-app-text-muted/40"
                                required
                            />

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowReviewForm(false)}
                                    className="flex-1 py-4.5 rounded-2xl text-[10px] font-black text-app-text-muted uppercase tracking-widest hover:bg-app-surface-2 transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingReview}
                                    className="flex-[2] py-4.5 rounded-2xl text-[10px] font-black text-slate-900 bg-primary shadow-xl shadow-primary/20 active:scale-95 transition-all uppercase tracking-[0.2em] flex items-center justify-center"
                                >
                                    {submittingReview ? (
                                        <div className="animate-spin h-5 w-5 border-2 border-slate-900 border-t-transparent rounded-full" />
                                    ) : "Post Review"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {imagesArray.length > 0 && (
                <ImageViewer
                    isOpen={viewingImages}
                    images={imagesArray.map(img => getImageUrl(img, 'complex-images', complex.id, getFileUrl))}
                    currentIndex={currentImageIndex}
                    collectionName="complexes"
                    recordId={complex.id}
                    onClose={() => setViewingImages(false)}
                    onNext={() => {
                        if (currentImageIndex < imagesArray.length - 1) {
                            setCurrentImageIndex(currentImageIndex + 1);
                        }
                    }}
                    onPrevious={() => {
                        if (currentImageIndex > 0) {
                            setCurrentImageIndex(currentImageIndex - 1);
                        }
                    }}
                />
            )}
        </div>
    );
};

export default ComplexDetailPage;
