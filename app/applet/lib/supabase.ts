import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://wpjehsjzeuxdtoovkocp.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwamVoc2p6ZXV4ZHRvb3Zrb2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NjkxMTAsImV4cCI6MjA4NDM0NTExMH0.XuoSR8DoILZFXBFoHOBgoNrnNDnxYLjk6bPUzVug258';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * SQL PARA CRIAÇÃO DAS TABELAS E CONFIGURAÇÃO DE SEGURANÇA (Execute no SQL Editor do Supabase):
 * 
 * -- Desabilitar RLS ou adicionar políticas de acesso público para permitir inserção/leitura
 * ALTER TABLE users DISABLE ROW LEVEL SECURITY;
 * ALTER TABLE cost_centers DISABLE ROW LEVEL SECURITY;
 * ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
 * ALTER TABLE proposal_requirements DISABLE ROW LEVEL SECURITY;
 * ALTER TABLE proposals DISABLE ROW LEVEL SECURITY;
 * ALTER TABLE payment_lots DISABLE ROW LEVEL SECURITY;
 */
