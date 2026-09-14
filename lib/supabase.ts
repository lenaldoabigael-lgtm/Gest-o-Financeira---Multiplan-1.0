
import { createClient } from '@supabase/supabase-js';
import { UserAccessRequest } from '../types';

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
}): Promise<{ 
  success: boolean; 
  authUserId?: string; 
  authError?: string; 
  userTableError?: string; 
  profileTableError?: string; 
  message?: string 
}> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { success: false, authError: 'Credenciais do Supabase não configuradas.' };
  }

  const cleanEmail = (userData.email || '').trim().toLowerCase();
  const cleanLogin = (userData.login || '').trim();
  const password = userData.password || '123456';

  // Limpa cache de usuários deletados para garantir que não seja filtrado
  try {
    const rawDel = localStorage.getItem('multiplan_deleted_users');
    if (rawDel) {
      const delList: string[] = JSON.parse(rawDel);
      const filtered = delList.filter(k => k !== cleanLogin.toLowerCase() && k !== cleanEmail);
      localStorage.setItem('multiplan_deleted_users', JSON.stringify(filtered));
    }
  } catch (e) {}

  let authUserId: string | undefined = undefined;
  let authErrorMsg: string | undefined = undefined;
  let userTableErrorMsg: string | undefined = undefined;
  let profileTableErrorMsg: string | undefined = undefined;

  const validRole = ['admin', 'cadastro_propostas', 'pagamento_comissoes', 'corretor'].includes(userData.role || '') 
    ? (userData.role as string) 
    : (cleanLogin.toLowerCase().includes('admin') ? 'admin' : 'cadastro_propostas');

  // 1. Tenta criar no Supabase Auth usando cliente com chave pública
  try {
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });

    const { data: signUpData, error: signUpError } = await authClient.auth.signUp({
      email: cleanEmail,
      password: password,
      options: {
        data: {
          login: cleanLogin,
          name: cleanLogin,
          role: validRole,
          cargo: userData.cargo || 'Analista Sênior',
          approved: true,
          permissions: userData.permissions || {}
        }
      }
    });

    if (signUpError) {
      console.warn('Aviso Supabase Auth signUp:', signUpError.message);
      authErrorMsg = signUpError.message;
    } else if (signUpData.user?.id) {
      authUserId = signUpData.user.id;
    }
  } catch (err: any) {
    console.warn('Erro ao tentar criar no Auth Client efêmero:', err);
    authErrorMsg = err?.message || 'Falha na comunicação com Supabase Auth';
  }

  // 2. Se não conseguiu ID pelo signUp (ex: e-mail já existia ou cadastro anônimo bloqueado), busca se já existe no profiles/auth
  if (!authUserId) {
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .or(`email.ilike.${cleanEmail},login.ilike.${cleanLogin}`)
        .maybeSingle();

      if (existingProfile?.id) {
        authUserId = existingProfile.id;
      }
    } catch (e) {}
  }

  // 3. Inserir ou atualizar na tabela users (login, senha, email, permissions, approved)
  try {
    const userPayload = {
      login: cleanLogin,
      senha: password,
      email: cleanEmail,
      permissions: userData.permissions || {},
      approved: 'true'
    };

    const { error: usersTableError } = await supabase
      .from('users')
      .upsert(userPayload, { onConflict: 'login' });

    if (usersTableError) {
      console.warn('Aviso ao inserir na tabela users:', usersTableError.message);
      userTableErrorMsg = usersTableError.message;

      // Tentativa de fallback com insert simples
      try {
        const { error: insertErr } = await supabase.from('users').insert(userPayload);
        if (!insertErr) {
          userTableErrorMsg = undefined;
        }
      } catch (e) {}
    }

    // Se houver registro com mesmo e-mail mas login diferente (ex: "Hellen Kelma"), atualiza a senha lá também
    if (cleanEmail) {
      try {
        await supabase
          .from('users')
          .update({ senha: password, approved: 'true', permissions: userData.permissions || {} })
          .ilike('email', cleanEmail);
      } catch (e) {}
    }
  } catch (err: any) {
    console.warn('Erro ao inserir na tabela users:', err);
    userTableErrorMsg = err?.message;
  }

  // 4. Inserir ou atualizar na tabela profiles (id, email, login, role, approved, permissions)
  try {
    if (authUserId) {
      const profilePayload = {
        id: authUserId,
        email: cleanEmail,
        login: cleanLogin,
        role: validRole,
        approved: true,
        permissions: userData.permissions || {}
      };
      const { error: pErr } = await supabase.from('profiles').upsert(profilePayload, { onConflict: 'id' });
      if (pErr) {
        profileTableErrorMsg = pErr.message;
      }
    } else {
      // Se não temos o authUserId, tenta atualizar por email
      const { error: pUpdErr } = await supabase.from('profiles').update({
        login: cleanLogin,
        role: validRole,
        approved: true,
        permissions: userData.permissions || {}
      }).ilike('email', cleanEmail);
      if (pUpdErr) {
        profileTableErrorMsg = pUpdErr.message;
      }
    }
  } catch (err: any) {
    console.warn('Erro ao atualizar tabela profiles:', err);
    profileTableErrorMsg = err?.message;
  }

  const isSuccess = !userTableErrorMsg || !!authUserId || !authErrorMsg;

  return { 
    success: isSuccess, 
    authUserId: authUserId,
    authError: authErrorMsg,
    userTableError: userTableErrorMsg,
    profileTableError: profileTableErrorMsg
  };
}

/**
 * Salva uma nova solicitação interna de acesso
 */
export async function saveUserAccessRequest(request: UserAccessRequest): Promise<{ success: boolean; error?: string }> {
  // 1. Salva no localStorage como cache seguro imediato
  try {
    const raw = localStorage.getItem('multiplan_user_access_requests');
    const list: UserAccessRequest[] = raw ? JSON.parse(raw) : [];
    const updated = [request, ...list.filter(r => r.id !== request.id)];
    localStorage.setItem('multiplan_user_access_requests', JSON.stringify(updated));
  } catch (e) {}

  // 2. Tenta persistir no Supabase
  try {
    const payload = {
      id: request.id,
      nome: request.nome,
      email: request.email,
      telefone: request.telefone || '',
      cargo_sugerido: request.cargoSugerido,
      justificativa: request.justificativa,
      solicitante_login: request.solicitanteLogin,
      solicitante_email: request.solicitanteEmail || '',
      status: request.status,
      created_at: request.created_at,
      aprovado_por: request.aprovadoPor,
      aprovado_em: request.aprovadoEm,
      motivo_recusa: request.motivoRecusa
    };

    const { error } = await supabase.from('user_access_requests').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Aviso ao salvar solicitação no Supabase:', error.message);
    }
    return { success: true };
  } catch (err: any) {
    console.warn('Erro ao salvar solicitação no Supabase (salvo localmente):', err);
    return { success: true };
  }
}

/**
 * Carrega a lista de solicitações internas de acesso
 */
export async function getUserAccessRequests(): Promise<UserAccessRequest[]> {
  let localList: UserAccessRequest[] = [];
  try {
    const raw = localStorage.getItem('multiplan_user_access_requests');
    if (raw) localList = JSON.parse(raw);
  } catch (e) {}

  try {
    const { data, error } = await supabase
      .from('user_access_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && Array.isArray(data)) {
      const dbList: UserAccessRequest[] = data.map(item => ({
        id: item.id,
        nome: item.nome,
        email: item.email,
        telefone: item.telefone,
        cargoSugerido: item.cargo_sugerido || item.cargoSugerido || 'Analista Sênior',
        justificativa: item.justificativa || '',
        solicitanteLogin: item.solicitante_login || item.solicitanteLogin || 'Colaborador',
        solicitanteEmail: item.solicitante_email || item.solicitanteEmail || '',
        status: item.status || 'PENDENTE',
        created_at: item.created_at || new Date().toISOString(),
        aprovadoPor: item.aprovado_por || item.aprovadoPor,
        aprovadoEm: item.aprovado_em || item.aprovadoEm,
        motivoRecusa: item.motivo_recusa || item.motivoRecusa
      }));

      // Combina com local garantindo sem perdas
      const map = new Map<string, UserAccessRequest>();
      for (const item of localList) map.set(item.id, item);
      for (const item of dbList) map.set(item.id, item);
      const combined = Array.from(map.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      try {
        localStorage.setItem('multiplan_user_access_requests', JSON.stringify(combined));
      } catch (e) {}

      return combined;
    }
  } catch (err) {
    console.warn('Erro ao buscar solicitações do Supabase (usando local):', err);
  }

  return localList;
}

/**
 * Atualiza o status de uma solicitação de acesso (Aprovada / Recusada)
 */
export async function updateUserAccessRequest(
  id: string,
  updates: Partial<UserAccessRequest>
): Promise<{ success: boolean; error?: string }> {
  try {
    const raw = localStorage.getItem('multiplan_user_access_requests');
    const list: UserAccessRequest[] = raw ? JSON.parse(raw) : [];
    const updated = list.map(item => item.id === id ? { ...item, ...updates } : item);
    localStorage.setItem('multiplan_user_access_requests', JSON.stringify(updated));
  } catch (e) {}

  try {
    const payload: any = {};
    if (updates.status) payload.status = updates.status;
    if (updates.aprovadoPor) payload.aprovado_por = updates.aprovadoPor;
    if (updates.aprovadoEm) payload.aprovado_em = updates.aprovadoEm;
    if (updates.motivoRecusa) payload.motivo_recusa = updates.motivoRecusa;

    await supabase.from('user_access_requests').update(payload).eq('id', id);
  } catch (e) {}

  return { success: true };
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
