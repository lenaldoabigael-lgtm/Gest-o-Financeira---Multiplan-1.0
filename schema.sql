-- SCHEMA SUPABASE - ETAPA 1: SEGURANÇA E AUTH (RLS + PROFILES)

-- 1. Criar tabela public.profiles conectada com auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  login TEXT,
  role TEXT NOT NULL DEFAULT 'cadastro_propostas' CHECK (role IN ('admin', 'cadastro_propostas', 'pagamento_comissoes', 'corretor')),
  approved BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Habilitar Row Level Security (RLS) em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_lots ENABLE ROW LEVEL SECURITY;

-- 3. Função auxiliar para verificar a role do usuário logado
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 4. Trigger para auto-criar profile ao cadastrar no Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, login, role, approved, permissions)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'login', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'cadastro_propostas'),
    COALESCE((new.raw_user_meta_data->>'approved')::boolean, true),
    COALESCE(new.raw_user_meta_data->'permissions', '{}'::jsonb)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    login = EXCLUDED.login,
    role = EXCLUDED.role,
    approved = EXCLUDED.approved,
    permissions = EXCLUDED.permissions;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. POLÍTICAS RLS POR TABELA

-- Profiles
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id OR current_user_role() = 'admin'
  );

-- Cost Centers (Admin e Financeiro)
DROP POLICY IF EXISTS "cost_centers_policy" ON public.cost_centers;
CREATE POLICY "cost_centers_policy" ON public.cost_centers
  FOR ALL USING (
    current_user_role() IN ('admin', 'pagamento_comissoes')
  );

-- Transactions (Admin e Financeiro)
DROP POLICY IF EXISTS "transactions_policy" ON public.transactions;
CREATE POLICY "transactions_policy" ON public.transactions
  FOR ALL USING (
    current_user_role() IN ('admin', 'pagamento_comissoes')
  );

-- Proposal Requirements (Admin, Cadastro Propostas e Financeiro)
DROP POLICY IF EXISTS "proposal_requirements_policy" ON public.proposal_requirements;
CREATE POLICY "proposal_requirements_policy" ON public.proposal_requirements
  FOR ALL USING (
    current_user_role() IN ('admin', 'cadastro_propostas', 'pagamento_comissoes')
  );

-- Payment Lots (Admin e Financeiro)
DROP POLICY IF EXISTS "payment_lots_policy" ON public.payment_lots;
CREATE POLICY "payment_lots_policy" ON public.payment_lots
  FOR ALL USING (
    current_user_role() IN ('admin', 'pagamento_comissoes')
  );

-- Proposals
-- Admin e Cadastro Propostas: acesso total
DROP POLICY IF EXISTS "proposals_admin_cadastro" ON public.proposals;
CREATE POLICY "proposals_admin_cadastro" ON public.proposals
  FOR ALL USING (
    current_user_role() IN ('admin', 'cadastro_propostas')
  );

-- Pagamento Comissões: acesso somente leitura
DROP POLICY IF EXISTS "proposals_read_pagamento_comissoes" ON public.proposals;
CREATE POLICY "proposals_read_pagamento_comissoes" ON public.proposals
  FOR SELECT USING (
    current_user_role() = 'pagamento_comissoes'
  );

-- Corretor: acesso às próprias propostas
DROP POLICY IF EXISTS "proposals_corretor_own" ON public.proposals;
CREATE POLICY "proposals_corretor_own" ON public.proposals
  FOR ALL USING (
    current_user_role() = 'corretor' AND (corretor_id = auth.uid() OR corretor = (SELECT login FROM public.profiles WHERE id = auth.uid()))
  );
