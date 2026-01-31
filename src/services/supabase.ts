import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
