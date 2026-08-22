import { createClient } from '@supabase/supabase-js';

const sanitizeUrl = (url?: string): string => {
  const fallback = 'https://wpjehsjzeuxdtoovkocp.supabase.co';
  if (!url || typeof url !== 'string' || !url.trim()) {
    return fallback;
  }
  let cleaned = url.trim();
  cleaned = cleaned.replace(/\/+$/, '');
  cleaned = cleaned.replace(/\/rest\/v1\/?$/i, '');
  cleaned = cleaned.replace(/\/auth\/v1\/?$/i, '');
  cleaned = cleaned.replace(/\/storage\/v1\/?$/i, '');
  cleaned = cleaned.replace(/\/+$/, '');
  
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'https://' + cleaned;
  }
  return cleaned || fallback;
};

const sanitizeKey = (key?: string): string => {
  const fallback = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwamVoc2p6ZXV4ZHRvb3Zrb2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NjkxMTAsImV4cCI6MjA4NDM0NTExMH0.XuoSR8DoILZFXBFoHOBgoNrnNDnxYLjk6bPUzVug258';
  if (!key || typeof key !== 'string' || !key.trim()) {
    return fallback;
  }
  return key.trim();
};

const SUPABASE_URL = sanitizeUrl((import.meta as any).env?.VITE_SUPABASE_URL);
const SUPABASE_ANON_KEY = sanitizeKey((import.meta as any).env?.VITE_SUPABASE_ANON_KEY);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

