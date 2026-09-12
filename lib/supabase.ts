
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
 * Cria um novo usuário no Supabase Auth (sem deslogar a sessão atual do administrador)
 * usando um cliente secundário efêmero, e salva os dados nas tabelas profiles e users.
 */
export async function createAuthUserByAdmin(userData: {
  email: string;
  password?: string;
  name?: string;
  role?: string;
  cargo?: string;
  telefone?: string;
  login: string;
  permissions?: any;
}): Promise<{ success: boolean; authUserId?: string; error?: string }> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { success: false, error: 'Credenciais do Supabase não configuradas.' };
  }

  try {
    // Instância secundária efêmera do Supabase com persistência de sessão desabilitada
    // para que a chamada de signUp não substitua a sessão ativa do administrador logado
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });

    const password = userData.password || '123456';

    const { data: signUpData, error: signUpError } = await authClient.auth.signUp({
      email: userData.email.trim(),
      password: password,
      options: {
        data: {
          login: userData.login.trim(),
          name: userData.name || userData.login.trim(),
          full_name: userData.name || userData.login.trim(),
          role: userData.role || 'corretor',
          cargo: userData.cargo || 'Analista Sênior',
          approved: true
        }
      }
    });

    if (signUpError) {
      console.warn('Aviso Supabase Auth signUp:', signUpError.message);
      return { success: false, error: signUpError.message };
    }

    const authUserId = signUpData.user?.id;

    // Se criado no Auth, vinculamos o perfil aprovado imediatamente na tabela profiles
    if (authUserId) {
      try {
        await supabase
          .from('profiles')
          .upsert({
            id: authUserId,
            email: userData.email.trim(),
            full_name: userData.name || userData.login.trim(),
            role: userData.role || 'corretor',
            approved: true, // Já aprovado pelo administrador
            permissions: userData.permissions,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
      } catch (err) {
        console.warn('Erro ao atualizar tabela profiles:', err);
      }
    }

    return { 
      success: true, 
      authUserId: authUserId 
    };

  } catch (err: any) {
    console.error('Erro na criação de usuário via Auth Admin:', err);
    return { success: false, error: err?.message || 'Erro desconhecido' };
  }
}

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
