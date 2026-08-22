
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

/**
 * SQL PARA CRIAÇÃO DAS TABELAS (Execute no SQL Editor do Supabase):
 * 
 * -- 1. Tabela de Usuários
 * CREATE TABLE users (
 *   login TEXT PRIMARY KEY,
 *   senha TEXT NOT NULL,
 *   email TEXT,
 *   approved BOOLEAN DEFAULT FALSE,
 *   permissions JSONB NOT NULL
 * );
 * 
 * -- 2. Tabela de Centros de Custo
 * CREATE TABLE cost_centers (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   nome TEXT NOT NULL,
 *   tipo TEXT NOT NULL CHECK (tipo IN ('RECEITA', 'DESPESA')),
 *   sub_itens TEXT[] DEFAULT '{}'
 * );
 * 
 * -- 3. Tabela de Transações
 * CREATE TABLE transactions (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   type TEXT NOT NULL CHECK (type IN ('PAGAR', 'RECEBER')),
 *   vencimento DATE NOT NULL,
 *   pagamento DATE,
 *   descricao TEXT NOT NULL,
 *   valor NUMERIC(15,2) NOT NULL,
 *   "formaPagamento" TEXT NOT NULL,
 *   status TEXT NOT NULL,
 *   "centroCusto" TEXT NOT NULL,
 *   "subItem" TEXT NOT NULL,
 *   cliente TEXT,
 *   conta TEXT DEFAULT 'GERAL',
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
 * );
 */
