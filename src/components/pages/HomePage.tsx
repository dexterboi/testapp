import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutGrid, Map, Heart, Bell } from 'lucide-react';
import { supabase, getFileUrl } from '@/services/supabase';
import { getComplexes, getUserLocation, calculateDistance } from '@/services/dataService';
import { FilterModal } from '@/components/common/FilterModal';
import NotificationCenter from '@/components/common/NotificationCenter';
import MapView from '@/components/spaces/MapView';
import { getRealPlaceholderImage } from '@/services/assetService';
import { ensureArray, getAvatarUrl } from '@/utils';

interface HomePageProps {
    user: any;
    pendingCount: number;
}

export const HomePage = ({ user, pendingCount }: HomePageProps) => {
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [complexes, setComplexes] = useState<any[]>([]);
    const [allComplexes, setAllComplexes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        maxPrice: 200,
        minRating: 0,
        maxDistance: 100,
        surfaces: [] as string[],
        amenities: [] as string[]
    });
    const [activeFiltersCount, setActiveFiltersCount] = useState(0);
    const [selectedSport, setSelectedSport] = useState<string | null>(null);
    const [totalNotifications, setTotalNotifications] = useState(0);

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedTime, setSelectedTime] = useState('18:00');
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);

    const navigate = useNavigate();
    const { t } = useTranslation();

    // Helper to get sport image URL
    const getSportImage = (sport: string) => {
        const images: Record<string, string> = {
            'Football': 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1000',
            'Padel': 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&q=80&w=1000',
            'Tennis': 'https://images.unsplash.com/photo-1622163642998-1ea2bc3e7a6e?auto=format&fit=crop&q=80&w=1000',
            'Basketball': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=1000'
        };
        return images[sport] || images['Football'];
    };

    // Helper to get sport badge
    const getSportBadge = (sport: string) => {
        const badges: Record<string, { text: string; className: string }> = {
            'Football': { text: 'PRO', className: 'bg-primary text-[#1A1D1F]' },
            'Padel': { text: 'TRENDING', className: 'bg-white/80 backdrop-blur-md text-[#1A1D1F]' },
            'Tennis': { text: 'PRO', className: 'bg-primary text-[#1A1D1F]' },
            'Basketball': { text: 'TEAM', className: 'bg-blue-500 text-white' }
        };
        return badges[sport] || { text: 'SPORT', className: 'bg-primary text-[#1A1D1F]' };
    };

    useEffect(() => {
        initializeData();
        if (user?.id) {
            fetchNotificationCount();

            // Push notifications are initialized immediately on login in App.tsx auth handler
            // This ensures permission is requested as soon as user authenticates

            // Set up real-time subscription for notifications
            const channel = supabase
                .channel('notifications')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships', filter: `friend_id=eq.${user.id}` }, () => {
                    console.log('📬 Friend request notification change detected');
                    fetchNotificationCount();
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'lobby_members', filter: `user_id=eq.${user.id}` }, () => {
                    console.log('📬 Lobby invite notification change detected');
                    fetchNotificationCount();
                })
                // Listen for lobby access requests (when user is host)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lobby_members', filter: `status=eq.requested` }, async (payload) => {
                    console.log('📬 Lobby access request notification change detected', payload);
                    // Check if this is for a lobby where user is host
                    if (payload.new?.lobby_id) {
                        const { data: lobby } = await supabase
                            .from('lobbies')
                            .select('host_id')
                            .eq('id', payload.new.lobby_id)
                            .single();

                        if (lobby?.host_id === user.id) {
                            console.log('📬 Lobby access request is for your lobby, refreshing count');
                            fetchNotificationCount();
                        }
                    }
                })
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'complexes' }, () => {
                    console.log('📬 New complex notification change detected');
                    fetchNotificationCount();
                })
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pitches' }, () => {
                    console.log('📬 New pitch notification change detected');
                    fetchNotificationCount();
                })
                .subscribe();

            // Listen for notification actions to refresh count
            const handleNotificationAction = () => {
                fetchNotificationCount();
            };
            window.addEventListener('notificationAction', handleNotificationAction);

            return () => {
                supabase.removeChannel(channel);
                window.removeEventListener('notificationAction', handleNotificationAction);
            };
        }
    }, [user?.id]);

    const fetchNotificationCount = async () => {
        if (!user?.id) return;
        try {
            // Get seen notification IDs from localStorage
            const seenNotificationsKey = `seen_notifications_${user.id}`;
            const seenNotifications: string[] = JSON.parse(localStorage.getItem(seenNotificationsKey) || '[]');

            // Friend requests (actionable) - only count unseen
            const { data: friendRequests } = await supabase
                .from('friendships')
                .select('id')
                .eq('friend_id', user.id)
                .eq('status', 'pending');

            const unseenFriendRequests = (friendRequests || []).filter(fr => !seenNotifications.includes(`friend_${fr.id}`)).length;

            // Lobby invites (actionable) - only count unseen
            let unseenLobbyInvites = 0;
            try {
                const { data: lobbyInvites, error: lobbyError } = await supabase
                    .from('lobby_members')
                    .select('lobby_id, user_id')
                    .eq('user_id', user.id)
                    .eq('status', 'invited');

                if (lobbyError) {
                    console.warn('Error fetching lobby invites for notifications:', lobbyError);
                    // Continue with 0 count if query fails (RLS policy issue)
                } else {
                    unseenLobbyInvites = (lobbyInvites || []).filter(li => {
                        const notificationId = `lobby_${li.lobby_id}_${li.user_id}`;
                        return !seenNotifications.includes(notificationId);
                    }).length;
                }
            } catch (error) {
                console.warn('Error processing lobby invites:', error);
                // Continue with 0 count
            }

            // Lobby access requests (for hosts) - only count unseen
            let unseenLobbyRequests = 0;
            try {
                // First get all lobbies where user is host
                const { data: userLobbies, error: lobbiesError } = await supabase
                    .from('lobbies')
                    .select('id')
                    .eq('host_id', user.id);

                if (lobbiesError) {
                    console.warn('Error fetching user lobbies for notifications:', lobbiesError);
                } else if (userLobbies && userLobbies.length > 0) {
                    const lobbyIds = userLobbies.map(l => l.id);
                    const { data: lobbyRequests, error: requestsError } = await supabase
                        .from('lobby_members')
                        .select('lobby_id, user_id, request_message')
                        .eq('status', 'requested')
                        .in('lobby_id', lobbyIds);

                    if (requestsError) {
                        console.warn('Error fetching lobby requests for notifications:', requestsError);
                    } else {
                        unseenLobbyRequests = (lobbyRequests || []).filter(lr => {
                            const notificationId = `lobby_request_${lr.lobby_id}_${lr.user_id}`;
                            return !seenNotifications.includes(notificationId);
                        }).length;
                    }
                }
            } catch (error) {
                console.warn('Error processing lobby requests:', error);
            }

            // New complexes (created in last 7 days) - only count unseen
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const { data: newComplexes } = await supabase
                .from('complexes')
                .select('id, created_at')
                .gte('created_at', sevenDaysAgo.toISOString());

            const unseenComplexes = (newComplexes || []).filter(c => !seenNotifications.includes(`venue_${c.id}`)).length;

            // New pitches (created in last 7 days) - only count unseen
            const { data: newPitches } = await supabase
                .from('pitches')
                .select('id, created_at')
                .gte('created_at', sevenDaysAgo.toISOString());

            const unseenPitches = (newPitches || []).filter(p => !seenNotifications.includes(`pitch_${p.id}`)).length;

            // Count only unseen notifications
            const actionableCount = unseenFriendRequests + unseenLobbyInvites + unseenLobbyRequests;
            const newContentCount = Math.min(unseenComplexes + unseenPitches, 5);
            const total = actionableCount + newContentCount;
            setTotalNotifications(total);
        } catch (error) {
            console.error('Error fetching notification count:', error);
        }
    };

    // Re-sort complexes when user location becomes available
    useEffect(() => {
        if (userLocation && complexes.length > 0) {
            console.log('📍 User location updated, re-sorting', complexes.length, 'complexes by distance');
            sortComplexesByDistance(complexes);
        }
    }, [userLocation, complexes.length]);

    // Real-time search filtering
    useEffect(() => {
        if (allComplexes.length === 0) return;

        const filterComplexes = async () => {
            let filtered = [...allComplexes];

            // Apply sport type filter
            if (selectedSport) {
                const { data: pitchesData } = await supabase
                    .from('pitches')
                    .select('complex_id, sport_type')
                    .eq('sport_type', selectedSport);

                const complexIdsWithSport = new Set(pitchesData?.map((p: any) => p.complex_id) || []);
                filtered = filtered.filter((c: any) => complexIdsWithSport.has(c.id));
            }

            // Apply search query filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                filtered = filtered.filter((c: any) =>
                    c.name?.toLowerCase().includes(q) ||
                    c.address?.toLowerCase().includes(q) ||
                    (c.amenities || []).some((a: string) => a.toLowerCase().includes(q))
                );
            }

            // Apply other filters
            filtered = filtered.filter((c: any) => {
                const price = c.min_price || 0;
                if (price > filters.maxPrice) return false;
                if (filters.minRating > 0 && (c.avg_rating || 0) < filters.minRating) return false;
                return true;
            });

            // Surface filter
            if (filters.surfaces.length > 0) {
                filtered = filtered.filter((c: any) => {
                    const available = (c.available_surfaces || []).map((s: string) => s.toLowerCase());
                    return filters.surfaces.some((s: string) => available.includes(s.toLowerCase()));
                });
            }

            // Amenities filter
            if (filters.amenities.length > 0) {
                filtered = filtered.filter((c: any) => {
                    const complexAmenities = (c.amenities || []).map((a: string) => a.toLowerCase());
                    return filters.amenities.every((a: string) => complexAmenities.includes(a.toLowerCase()));
                });
            }

            // Distance filter - only apply if user explicitly set a distance filter (not the default)
            // Don't apply distance filter by default - show all complexes
            if (userLocation && filters.maxDistance < 100) {
                // Only apply distance filter if user has explicitly set it to less than 100km
                filtered = filtered.filter((c: any) => {
                    if (c.location_lat && c.location_lng) {
                        const dist = calculateDistance(
                            userLocation.lat,
                            userLocation.lng,
                            c.location_lat,
                            c.location_lng
                        );
                        return dist <= filters.maxDistance;
                    }
                    // If complex has no location data, include it (don't filter out)
                    return true;
                });
            }
            // If maxDistance is 100 or more (default), don't filter by distance - show all complexes

            // Sort by distance if user location is available
            if (userLocation) {
                sortComplexesByDistance(filtered);
            } else {
                setComplexes(filtered);
            }
        };

        filterComplexes();
    }, [searchQuery, filters, allComplexes, userLocation, selectedSport]);

    const initializeData = async () => {
        setLoading(true);

        // Try to get user location first (but don't wait too long)
        const locationPromise = loadUserLocation();
        const dataPromise = fetchData();

        // Wait for both to complete
        await Promise.all([locationPromise, dataPromise]);

        setLoading(false);
    };

    const loadUserLocation = async () => {
        try {
            console.log('🔍 Requesting location (Racing Strategy)...');
            const location = await getUserLocation();
            console.log('✅ Location settled:', location);
            setUserLocation(location);
            setLocationError(null);
        } catch (error: any) {
            console.warn('⚠️ Location fallback active:', error?.message || error);
            // getUserLocation now handles its own fallback to Tunis, so this is just a safety catch
        }
    };

    const sortComplexesByDistance = (data: any[]) => {
        if (!userLocation) {
            setComplexes(data);
            return;
        }

        // Calculate distances and sort by distance
        const complexesWithDistance = data.map((complex: any) => {
            if (complex.location_lat && complex.location_lng) {
                const distance = calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    complex.location_lat,
                    complex.location_lng
                );
                console.log(`📍 Distance to ${complex.name}:`, distance.toFixed(2), 'km');
                return { ...complex, distance };
            }
            return complex;
        });

        // Sort by distance if available
        const sorted = complexesWithDistance.sort((a: any, b: any) => {
            if (a.distance !== undefined && b.distance !== undefined) {
                return a.distance - b.distance;
            }
            // Put items without distance at the end
            if (a.distance === undefined) return 1;
            if (b.distance === undefined) return -1;
            return 0;
        });

        console.log('✅ Complexes sorted by distance. Nearest:', sorted[0]?.name, sorted[0]?.distance?.toFixed(2), 'km');
        setComplexes(sorted);
    };

    const fetchData = async () => {
        console.log('🏟️ Fetching complexes...');
        const data = await getComplexes();
        console.log('📊 Complexes received:', data.length, data);

        // Store all complexes for filtering
        setAllComplexes(data);

        // Sort by distance if user location is already available
        if (userLocation) {
            sortComplexesByDistance(data);
        } else {
            setComplexes(data);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = async (filterOverride?: any) => {
        setLoading(true);
        const activeFilters = filterOverride || filters;

        // Use stored complexes if available, otherwise fetch
        let complexesToFilter = allComplexes.length > 0 ? allComplexes : await getComplexes();
        if (allComplexes.length === 0) {
            setAllComplexes(complexesToFilter);
        }
        let allComplexesFiltered = [...complexesToFilter];

        // 1. Search Query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            allComplexesFiltered = allComplexesFiltered.filter((c: any) =>
                c.name?.toLowerCase().includes(q) ||
                c.address?.toLowerCase().includes(q) ||
                (c.amenities || []).some((a: string) => a.toLowerCase().includes(q))
            );
        }

        // 2. Price Filter (Use real min_price from DB)
        allComplexesFiltered = allComplexesFiltered.filter((c: any) => {
            const price = c.min_price || 0;
            return price <= activeFilters.maxPrice;
        });

        // 3. Rating Filter
        if (activeFilters.minRating > 0) {
            allComplexesFiltered = allComplexesFiltered.filter((c: any) => (c.avg_rating || 0) >= activeFilters.minRating);
        }

        // 4. Surface Filter
        if (activeFilters.surfaces.length > 0) {
            allComplexesFiltered = allComplexesFiltered.filter((c: any) => {
                const available = (c.available_surfaces || []).map((s: string) => s.toLowerCase());
                return activeFilters.surfaces.some((s: string) => available.includes(s.toLowerCase()));
            });
        }

        // 5. Amenities Filter
        if (activeFilters.amenities.length > 0) {
            allComplexesFiltered = allComplexesFiltered.filter((c: any) => {
                const complexAmenities = (c.amenities || []).map((a: string) => a.toLowerCase());
                return activeFilters.amenities.every((a: string) => complexAmenities.includes(a.toLowerCase()));
            });
        }

        // 6. Distance Filter - only apply if user explicitly set it (not default 100km)
        if (userLocation && activeFilters.maxDistance < 100) {
            allComplexesFiltered = allComplexesFiltered.filter((c: any) => {
                if (c.location_lat && c.location_lng) {
                    const dist = calculateDistance(
                        userLocation.lat,
                        userLocation.lng,
                        c.location_lat,
                        c.location_lng
                    );
                    return dist <= activeFilters.maxDistance;
                }
                return true; // Keep if no location data (or could filter out)
            });
        }
        // If maxDistance is 100 or more (default), don't filter by distance - show all complexes

        // Count active filters (only count if user explicitly set them, not defaults)
        let count = 0;
        if (activeFilters.maxPrice < 200) count++;
        if (activeFilters.minRating > 0) count++;
        if (activeFilters.maxDistance < 100 && userLocation) count++; // Only count if distance filter is active
        if (activeFilters.surfaces.length > 0) count++;
        if (activeFilters.amenities.length > 0) count++;

        console.log(`🔍 [FILTER] After filters: ${allComplexesFiltered.length} matches. Filters:`, activeFilters);
        setActiveFiltersCount(count);

        if (userLocation) {
            sortComplexesByDistance(allComplexesFiltered);
        } else {
            setComplexes(allComplexesFiltered);
        }
        setLoading(false);
        setIsFilterOpen(false);
    };

    // Extract sports types for the horizontal scroller
    const sportsTypes = ['Football', 'Padel', 'Tennis', 'Basketball'];

    return (
        <div className="pb-[calc(8rem+env(safe-area-inset-bottom))] bg-[#F8F9FA] dark:bg-[#121417] min-h-screen font-sans transition-colors duration-300">
            <FilterModal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                filters={filters}
                setFilters={setFilters}
                onApply={applyFilters}
            />

            <NotificationCenter
                isOpen={isNotificationsOpen}
                onClose={() => {
                    setIsNotificationsOpen(false);
                    fetchNotificationCount();
                }}
                userId={user?.id}
                pendingCount={pendingCount}
            />

            {/* New Header Design */}
            <header className="px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-4">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <p className="text-slate-500 text-sm font-medium mb-1">Hello, 👋</p>
                        <h1 className="text-2xl font-extrabold tracking-tight text-[#1A1D1F] dark:text-white">{user?.name?.split(' ')[0] || 'Player'}</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Notification Bell */}
                        <button
                            onClick={() => setIsNotificationsOpen(true)}
                            className="relative w-12 h-12 rounded-full bg-white dark:bg-[#1E2126] flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 transition-all"
                        >
                            <Bell size={20} className="text-slate-600 dark:text-slate-300" />
                            {totalNotifications > 0 && (
                                <div className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center border-2 border-white dark:border-[#121417]">
                                    <span className="text-[10px] font-bold text-white">{totalNotifications > 9 ? '9+' : totalNotifications}</span>
                                </div>
                            )}
                        </button>
                        {/* Profile Avatar */}
                        <div
                            className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden border-2 border-primary/40 cursor-pointer"
                            onClick={() => navigate('/profile')}
                        >
                            <img
                                src={getAvatarUrl(user?.avatar, user?.name, user?.id)}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
                    <input
                        type="text"
                        placeholder={t('home.search_placeholder') || "Search for sports or venues"}
                        className="w-full h-12 pl-12 pr-14 rounded-2xl bg-white dark:bg-[#1E2126] border-none text-sm focus:ring-2 focus:ring-primary focus:outline-none text-[#1A1D1F] dark:text-white placeholder:text-slate-400 shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-primary rounded-xl text-[#1A1D1F] shadow-sm"
                    >
                        <span className="material-symbols-rounded text-xl">tune</span>
                    </button>
                </div>
            </header>

            <main className="animate-in fade-in duration-700">
                {viewMode === 'list' ? (
                    <>
                        {/* Popular Sports Section */}
                        <section className="mt-4">
                            <div className="flex justify-between items-center px-6 mb-4">
                                <h2 className="text-xs font-bold tracking-[0.1em] uppercase text-slate-400">Popular Sports</h2>
                                <button className="text-green-600 dark:text-primary font-bold text-xs tracking-tight">VIEW ALL</button>
                            </div>
                            <div className="flex overflow-x-auto gap-4 px-6 no-scrollbar pb-2">
                                {sportsTypes.map((sport) => {
                                    const badge = getSportBadge(sport);
                                    return (
                                        <div
                                            key={sport}
                                            onClick={() => setSelectedSport(selectedSport === sport ? null : sport)}
                                            className="flex-none w-40 relative group cursor-pointer"
                                        >
                                            <div className="aspect-[4/5] rounded-[1.5rem] overflow-hidden relative shadow-card">
                                                <img
                                                    alt={sport}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                    src={getSportImage(sport)}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                                                <div className="absolute bottom-4 left-4">
                                                    <span className={`${badge.className} text-[9px] font-black px-2 py-0.5 rounded-md uppercase mb-1.5 inline-block`}>
                                                        {badge.text}
                                                    </span>
                                                    <h3 className="text-white font-bold text-base leading-tight">{sport}</h3>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Nearby Venues Section */}
                        <section className="mt-8 px-6 pb-10">
                            <div className="flex justify-between items-center mb-5">
                                <h2 className="text-xs font-bold tracking-[0.1em] uppercase text-slate-400">Nearby Venues</h2>
                                <button
                                    onClick={() => setViewMode('map')}
                                    className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold bg-white dark:bg-[#1E2126] px-3 py-1.5 rounded-full shadow-sm border border-slate-100 dark:border-slate-700"
                                >
                                    <span className="material-symbols-rounded text-sm">map</span>
                                    MAP
                                </button>
                            </div>

                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-24 bg-white dark:bg-[#1E2126] rounded-2xl animate-pulse shadow-soft"></div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {complexes.map(complex => {
                                        const images = ensureArray(complex.images, complex.image);
                                        const mainImage = images[0]
                                            ? (images[0].startsWith('http') ? images[0] : getFileUrl('complex-images', `${complex.id}/${images[0]}`))
                                            : getRealPlaceholderImage(complex.id, 'complex');

                                        return (
                                            <div
                                                key={complex.id}
                                                onClick={() => navigate(`/complex/${complex.id}`)}
                                                className="bg-white dark:bg-[#1E2126] p-3 rounded-2xl flex items-center gap-4 shadow-soft hover:shadow-card transition-all cursor-pointer"
                                            >
                                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                                                    <img
                                                        alt={complex.name}
                                                        className="w-full h-full object-cover"
                                                        src={mainImage}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-sm text-[#1A1D1F] dark:text-white truncate">{complex.name}</h4>
                                                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                                                        <div className="flex items-center gap-0.5">
                                                            <span className="material-symbols-rounded text-green-500 text-[14px]">star</span>
                                                            <span className="font-bold text-[#1A1D1F] dark:text-white">{complex.avg_rating || '4.8'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <span className="material-symbols-rounded text-[14px]">location_on</span>
                                                            <span>{complex.distance !== undefined ? `${complex.distance.toFixed(1)} km` : 'Tunis'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 flex gap-1.5">
                                                        {ensureArray(complex.sports || ['Football']).slice(0, 2).map((sport, idx) => (
                                                            <span key={idx} className="text-[9px] font-bold text-slate-500 bg-slate-50 dark:bg-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                                                                {sport.toUpperCase()}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <button className="w-8 h-8 flex items-center justify-center rounded-full text-slate-300 hover:text-red-500 transition-colors">
                                                    <Heart size={18} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    </>
                ) : (
                    <div className="h-[calc(100vh-280px)] mx-8 rounded-3xl overflow-hidden border border-app-border shadow-2xl relative animate-in zoom-in-95 duration-500 bg-app-surface">
                        <MapView
                            onBack={() => setViewMode('list')}
                            showBackButton={false}
                            complexes={complexes}
                            userLocation={userLocation}
                        />
                    </div>
                )}

                {/* Location Error Banner */}
                {locationError && (
                    <div className="mx-8 mt-4 p-4 bg-amber-500/10 rounded-3xl border border-amber-500/20 flex items-center gap-4 animate-in slide-in-from-top-4 duration-300">
                        <div className="bg-amber-500/20 p-2.5 rounded-2xl text-amber-500">
                            <span className="material-symbols-rounded">location_off</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-black text-amber-500 uppercase tracking-tight">{t('home.location_off')}</p>
                            <p className="text-[10px] text-amber-500/80 leading-tight">{t('home.location_off_sub')}</p>
                        </div>
                        <button onClick={loadUserLocation} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-amber-500/20 active:scale-95 transition-transform">{t('home.retry')}</button>
                    </div>
                )}
            </main>

            {/* Footer Safe Area Spacer */}
            <div className="h-10"></div>
        </div>
    );
};
