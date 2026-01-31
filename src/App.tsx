import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/services/supabase';
import { Auth } from '@/components/pages/Auth';
import { UserProfile } from '@/components/pages/UserProfile';
import { OwnerDashboard } from '@/components/pages/OwnerDashboard';
import { AchievementsPage } from '@/components/pages/AchievementsPage';
import { HistoryPage } from '@/components/pages/HistoryPage';
import { TeamsPage } from '@/components/pages/TeamsPage';
import { PreferencesPage } from '@/components/pages/PreferencesPage';
import SpacesPage from '@/components/pages/SpacesPage';
import LobbyDetailPage from '@/components/spaces/LobbyDetailPage';
import TeamDetailPage from '@/components/spaces/TeamDetailPage';
import CrewPage from '@/components/pages/CrewPage';
import ChatPage from '@/components/pages/ChatPage';
import { initializePushNotifications } from '@/services/pushNotificationService';
import { SplashScreen } from '@/components/layout/SplashScreen';
import { HomePage } from '@/components/pages/HomePage';
import { EmailConfirmationPage } from '@/components/pages/EmailConfirmation';
import TabBar from '@/components/layout/TabBar';

// Restored Components
import ComplexDetailPage from '@/components/pages/ComplexDetailPage';
import PitchDetailsPage from '@/components/pages/PitchDetailsPage';
import BookingConfirmPage from '@/components/pages/BookingConfirmPage';
import UserBookingsPage from '@/components/pages/UserBookingsPage';
import AdminPage from '@/components/pages/AdminPage';
import OwnerBookingsPage from '@/components/pages/OwnerBookingsPage';
import OwnerPitchesPage from '@/components/pages/OwnerPitchesPage';
import { VersionCheckModal } from '@/components/layout/VersionCheckModal';
import pkg from '../package.json';

// Component to scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App = () => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, any>>({});
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const presenceChannelRef = useRef<any>(null);

  const [updateInfo, setUpdateInfo] = useState<{ latestVersion: string; releaseNotes: string; downloadUrl: string } | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('theme') as any) || 'system';
  });

  // Handle Theme Changes
  useEffect(() => {
    const root = window.document.documentElement;
    const applyTheme = (currentTheme: string) => {
      if (currentTheme === 'dark' || (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme(theme);
    localStorage.setItem('theme', theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    checkUser();
    checkForUpdates();
  }, []);

  // Initialize push notifications as soon as user is available
  useEffect(() => {
    if (user?.id && Capacitor.isNativePlatform()) {
      console.log('🔔 [App] Initializing push for user:', user.id);
      initializePushNotifications(user.id)
        .then(result => console.log('🔔 [Push] Startup init result:', result))
        .catch(err => console.error('🔔 [Push] Startup init error:', err));
    }
  }, [user?.id]);

  const checkForUpdates = async () => {
    try {
      // Fetch version.json from GitHub with a cache-buster
      const response = await fetch(`https://raw.githubusercontent.com/dexterboi/testapp/main/version.json?t=${Date.now()}`);
      if (!response.ok) return;

      const data = await response.json();
      const latestVersion = data.latest_version;
      const currentVersion = pkg.version;

      console.log(`📱 [Version] Check: Remote=${latestVersion}, Local=${currentVersion}`);

      if (latestVersion && latestVersion !== currentVersion) {
        console.log('🚀 [Version] New version detected! Opening modal...');
        // Temporary Debug Alert
        alert(`Update Found: Remote=${latestVersion} | Local=${currentVersion}`);

        setUpdateInfo({
          latestVersion: latestVersion,
          releaseNotes: data.release_notes || 'New updates available!',
          downloadUrl: data.download_url
        });
        setIsUpdateModalOpen(true);
      }
    } catch (error) {
      console.warn('⚠️ [Version] Check failed:', error);
      alert('Version Check Failed: ' + (error as Error).message);
    }
  };

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Set initial user from session metadata so app can open immediately
        const initialUser = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          avatar: session.user.user_metadata?.avatar_url || null,
          role: session.user.user_metadata?.role || 'user',
          phone: session.user.phone || null,
        };
        setUser(initialUser);

        // Fetch full profile in background (non-blocking)
        fetchAndSetUserProfile(session.user);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAndSetUserProfile = async (authUser: any) => {
    try {
      // Fetch latest profile from user_profiles table
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error fetching profile from DB:', error);
        // Fallback to auth metadata if profile fetch fails
        setUser({
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          avatar: authUser.user_metadata?.avatar_url || null,
          role: authUser.user_metadata?.role || 'user',
          phone: authUser.phone || null,
        });
        return;
      }

      const appUser = {
        id: authUser.id,
        email: authUser.email,
        name: profile.name || authUser.email?.split('@')[0] || 'User',
        avatar: profile.avatar || null,
        role: profile.role || 'user',
        phone: profile.phone || null,
        takwira_id: profile.takwira_id,
        created_at: profile.created_at,
      };

      setUser(appUser);
      console.log('👤 [App] Profile synced from database:', appUser.name);
    } catch (err) {
      console.error('Critical error in fetchAndSetUserProfile:', err);
    }
  };

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchAndSetUserProfile(session.user);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        console.log(`🔐 [Auth] ${event} event detected for user:`, session.user.id);

        // Safety: Force close any open browser overlay when session is established
        if (Capacitor.isNativePlatform()) {
          Browser.close().catch(() => { });
        }

        // Update user state (non-blocking profile fetch)
        const initialUser = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          avatar: session.user.user_metadata?.avatar_url || null,
          role: session.user.user_metadata?.role || 'user',
          phone: session.user.phone || null,
        };
        setUser(initialUser);
        fetchAndSetUserProfile(session.user);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Listen for deep links (OAuth callback) on native platforms
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    console.log('🔗 [Deep Link] Setting up App URL listener for native platform...');

    const listener = CapApp.addListener('appUrlOpen', async (event) => {
      console.log('🔗 [Deep Link] Received URL:', event.url);

      if (event.url.includes('oauth-callback') || event.url.includes('#access_token')) {
        console.log('🔗 [Deep Link] OAuth callback detected. Parsing tokens...');

        // Extract tokens from the fragment
        const url = new URL(event.url.replace('#', '?'));
        const accessToken = url.searchParams.get('access_token');
        const refreshToken = url.searchParams.get('refresh_token');

        if (accessToken && refreshToken) {
          console.log('✅ [Deep Link] Tokens found. Setting session...');
          try {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) throw error;
            console.log('✅ [Deep Link] Session established successfully!');

            // Close browser overlay as soon as we have the session
            await Browser.close();
            console.log('✅ [Deep Link] Browser closed');

            // Refresh user state immediately
            checkUser();
          } catch (e: any) {
            console.error('❌ [Deep Link] Auth error:', e.message);
          }
        } else {
          console.warn('⚠️ [Deep Link] No tokens found in URL');
          // Fallback: still try to close browser
          Browser.close().catch(() => { });
        }
      }
    });

    return () => {
      listener.then(handle => handle.remove());
      console.log('🔗 [Deep Link] Listener removed');
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    let cleanupSocial: (() => void) | undefined;

    const refreshCount = async (userId: string) => {
      const { count } = await supabase
        .from('friendships')
        .select('id', { count: 'exact' })
        .eq('friend_id', userId)
        .eq('status', 'pending');
      if (mounted) setPendingRequestsCount(count || 0);
    };

    const setupListeners = (userId: string) => {
      refreshCount(userId);

      const friendshipChannel = supabase
        .channel(`public: friendships: friend_id = eq.${userId} `)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships', filter: `friend_id = eq.${userId} ` }, () => {
          refreshCount(userId);
        })
        .subscribe();

      const handleRefresh = () => refreshCount(userId);
      window.addEventListener('refreshPendingRequests', handleRefresh);

      const presenceChannel = supabase.channel('online-users', {
        config: { presence: { key: userId } }
      });

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState();
          const online: Record<string, any> = {};
          Object.keys(state).forEach(key => {
            online[key] = state[key][0];
          });
          if (mounted) setOnlineUsers(online);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({
              user_id: userId,
              online_at: new Date().toISOString(),
              status: 'online'
            });
          }
        });

      presenceChannelRef.current = presenceChannel;

      return () => {
        supabase.removeChannel(friendshipChannel);
        supabase.removeChannel(presenceChannel);
        window.removeEventListener('refreshPendingRequests', handleRefresh);
      };
    };

    if (user?.id) {
      cleanupSocial = setupListeners(user.id);
    }

    return () => {
      mounted = false;
      if (cleanupSocial) cleanupSocial();
    };
  }, [user?.id]);

  if (isLoading) return <SplashScreen show={true} />;

  return (
    <div className="min-h-screen bg-app-bg text-app-text font-sans transition-colors duration-300">
      <SplashScreen show={showSplash} />

      {!user ? (
        <Auth onSuccess={() => checkUser()} />
      ) : (
        <HashRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<HomePage user={user} pendingCount={pendingRequestsCount} />} />
            <Route path="/profile" element={<UserProfile user={user} onLogout={() => setUser(null)} onRefresh={refreshUser} />} />
            <Route path="/social" element={<CrewPage currentUser={user} onlineUsers={onlineUsers} />} />
            <Route path="/crew" element={<CrewPage currentUser={user} onlineUsers={onlineUsers} />} />
            <Route path="/chat" element={<ChatPage currentUser={user} onlineUsers={onlineUsers} />} />
            <Route path="/chat/:friendshipId" element={<ChatPage currentUser={user} onlineUsers={onlineUsers} />} />
            <Route path="/complex/:id" element={<ComplexDetailPage user={user} />} />
            <Route path="/pitch/:id" element={<PitchDetailsPage />} />
            <Route path="/booking/confirm" element={<BookingConfirmPage />} />
            <Route path="/bookings" element={<UserBookingsPage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/preferences" element={<PreferencesPage theme={theme} onThemeChange={setTheme} />} />
            <Route path="/spaces" element={<SpacesPage currentUser={user} />} />
            <Route path="/lobby/:id" element={<LobbyDetailPage currentUser={user} />} />
            <Route path="/team/:id" element={<TeamDetailPage currentUser={user} />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/owner" element={<OwnerDashboard user={user} />} />
            <Route path="/owner/bookings/:complexId" element={<OwnerBookingsPage />} />
            <Route path="/owner/pitches/:complexId" element={<OwnerPitchesPage />} />
            <Route path="/confirm-email" element={<EmailConfirmationPage />} />
            <Route path="/email-confirmed" element={<EmailConfirmationPage />} />
          </Routes>
          <TabBar pendingCount={pendingRequestsCount} />
        </HashRouter>
      )}

      {updateInfo && (
        <VersionCheckModal
          isOpen={isUpdateModalOpen}
          latestVersion={updateInfo.latestVersion}
          releaseNotes={updateInfo.releaseNotes}
          downloadUrl={updateInfo.downloadUrl}
          onClose={() => setIsUpdateModalOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
