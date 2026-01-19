
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wpjehsjzeuxdtoovkocp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwamVoc2p6ZXV4ZHRvb3Zrb2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NjkxMTAsImV4cCI6MjA4NDM0NTExMH0.XuoSR8DoILZFXBFoHOBgoNrnNDnxYLjk6bPUzVug258';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * SQL PARA CRIAÇÃO DAS TABELAS (Execute no SQL Editor do Supabase):
 * 
 * -- 1. Tabela de Usuários
 * CREATE TABLE users (
 *   login TEXT PRIMARY KEY,
 *   senha TEXT NOT NULL,
 *   email TEXT,
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
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
 * );
 */
