import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dgpdlwklqvbmdtalyiis.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRncGRsd2tscXZibWR0YWx5aWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MzEzMTYsImV4cCI6MjA4NDIwNzMxNn0.REgLPzPG7Xq2I5Ocp7vD8IS2MLuqfbNNioOrS0RNGSA';

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
