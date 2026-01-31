import { createClient } from '@supabase/supabase-js';
import { Preferences } from '@capacitor/preferences';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file or build configuration.');
}

// Custom storage adapter for Capacitor
const SupabaseStorageAdapter = {
  getItem: async (key: string) => {
    try {
      const { value } = await Preferences.get({ key });
      console.log(`🔐 [Auth Adapter] getItem: ${key} -> ${value ? 'Found' : 'Null'}`);
      return value;
    } catch (err) {
      console.error(`❌ [Auth Adapter] getItem error:`, err);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      console.log(`🔐 [Auth Adapter] setItem: ${key}`);
      await Preferences.set({ key, value });
    } catch (err) {
      console.error(`❌ [Auth Adapter] setItem error:`, err);
    }
  },
  removeItem: async (key: string) => {
    try {
      console.log(`🔐 [Auth Adapter] removeItem: ${key}`);
      await Preferences.remove({ key });
    } catch (err) {
      console.error(`❌ [Auth Adapter] removeItem error:`, err);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SupabaseStorageAdapter,
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Handle deep links manually if needed
  },
});

// Helper to get file URLs from Supabase Storage
export const getFileUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

// Helper to get storage bucket name based on collection
export const getBucketName = (collection: string, field: string): string => {
  if (collection === 'user_profiles' && field === 'avatar') return 'avatars';
  if (collection === 'complexes' && field === 'images') return 'complex-images';
  if (collection === 'pitches' && field === 'image') return 'pitch-images';
  return 'uploads';
};

// Legacy compatibility function (for gradual migration)
export const getFileUrlLegacy = (collection: string, recordId: string, filename: string) => {
  const bucket = getBucketName(collection, 'image');
  const path = `${recordId}/${filename}`;
  return getFileUrl(bucket, path);
};
