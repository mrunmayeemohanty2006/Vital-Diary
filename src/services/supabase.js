import { createClient } from '@supabase/supabase-js';

// Default / fallback credentials or environment variables
const SUPABASE_STORAGE_KEY = 'vital_diary_supabase_config';

export function getSupabaseConfig() {
  const saved = localStorage.getItem(SUPABASE_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved supabase config', e);
    }
  }
  return {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  };
}

export function saveSupabaseConfig(url, anonKey) {
  localStorage.setItem(
    SUPABASE_STORAGE_KEY,
    JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() })
  );
  // Re-instantiate client
  initSupabaseClient();
}

let supabaseInstance = null;

export function initSupabaseClient() {
  const config = getSupabaseConfig();
  if (config.url && config.anonKey) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey);
      return supabaseInstance;
    } catch (err) {
      console.warn('Error initializing Supabase client:', err);
      supabaseInstance = null;
    }
  }
  supabaseInstance = null;
  return null;
}

// Initial initialization
initSupabaseClient();

export function getSupabase() {
  if (!supabaseInstance) {
    initSupabaseClient();
  }
  return supabaseInstance;
}

export function isSupabaseConfigured() {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.anonKey);
}

/**
 * Upload file to Supabase storage bucket 'vital-records'
 * Falls back to local object URL if Supabase is not configured
 */
export async function uploadMedicalFile(file, userId = 'user') {
  const client = getSupabase();
  
  if (client) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `records/${fileName}`;

      const { data, error } = await client.storage
        .from('vital-records')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.warn('Supabase storage upload error:', error.message);
        throw error;
      }

      // Get public or signed URL
      const { data: urlData } = client.storage
        .from('vital-records')
        .getPublicUrl(filePath);

      return {
        success: true,
        path: filePath,
        url: urlData?.publicUrl || '',
        storageType: 'supabase',
      };
    } catch (err) {
      console.warn('Falling back to local file reader due to Supabase error:', err);
      // Fall through to local simulation for seamless prototype demo
    }
  }

  // Fallback: Read file as data URL / Blob for local offline usage
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({
        success: true,
        path: `local/${file.name}`,
        url: reader.result,
        storageType: 'local',
      });
    };
    reader.readAsDataURL(file);
  });
}
