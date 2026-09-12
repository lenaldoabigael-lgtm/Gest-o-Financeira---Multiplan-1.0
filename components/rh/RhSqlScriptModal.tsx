// components/rh/RhSqlScriptModal.tsx
import React, { useState } from 'react';

interface RhSqlScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SQL_RH_SCRIPT = `-- ============================================================
-- MÓDULO RH — MultiPlan
-- Rodar inteiro de uma vez no SQL Editor do Supabase, na mesma ordem.
-- Depende de public.profiles e public.current_user_role() já existentes.
-- ============================================================

CREATE OR REPLACE FUNCTION public.tem_acesso_rh()
RETURNS BOOLEAN AS $$
  SELECT current_user_role() = 'admin'
    OR COALESCE((SELECT (permissions->>'rh')::boolean FROM public.profiles WHERE id = auth.uid()), false);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---------- Funcionários ----------

CREATE TABLE IF NOT EXISTS public.rh_funcionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE CHECK (cpf ~ '^\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2}$'),
  rg TEXT,
  data_nascimento DATE,
  telefone TEXT,
  email TEXT,
  cep TEXT,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  cargo TEXT,
  setor TEXT,
  data_admissao DATE NOT NULL,
  salario NUMERIC(10,2) NOT NULL,
  jornada TEXT,
  banco TEXT,
  agencia TEXT,
  conta TEXT,
  tipo_conta TEXT,
  pis_pasep TEXT,
  ctps_numero TEXT,
  ctps_serie TEXT,
  status TEXT NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'AFASTADO', 'DESLIGADO')),
  data_desligamento DATE,
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.rh_set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_rh_funcionarios_atualizado_em ON public.rh_funcionarios;
CREATE TRIGGER trg_rh_funcionarios_atualizado_em
  BEFORE UPDATE ON public.rh_funcionarios
  FOR EACH ROW EXECUTE FUNCTION public.rh_set_atualizado_em();

CREATE TABLE IF NOT EXISTS public.rh_dependentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID REFERENCES public.rh_funcionarios(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  cpf TEXT,
  data_nascimento DATE,
  parentesco TEXT
);

-- ---------- Estagiários ----------

CREATE TABLE IF NOT EXISTS public.rh_estagiarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE CHECK (cpf ~ '^\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2}$'),
  rg TEXT,
  data_nascimento DATE,
  telefone TEXT,
  email TEXT,
  instituicao_ensino TEXT,
  curso TEXT,
  previsao_termino DATE,
  valor_bolsa NUMERIC(10,2),
  supervisor TEXT,
  data_inicio DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'ENCERRADO')),
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- ---------- Vagas ----------

CREATE TABLE IF NOT EXISTS public.rh_vagas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cargo TEXT NOT NULL,
  area TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('CLT', 'ESTAGIO')),
  status TEXT NOT NULL DEFAULT 'ABERTA' CHECK (status IN ('ABERTA', 'EM_PROCESSO', 'FECHADA')),
  data_abertura DATE DEFAULT CURRENT_DATE,
  observacoes TEXT
);

-- ---------- Demandas de RH ----------

CREATE TABLE IF NOT EXISTS public.rh_demandas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID REFERENCES public.rh_funcionarios(id) ON DELETE CASCADE,
  vaga_id UUID REFERENCES public.rh_vagas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'CONCLUIDA')),
  data_prevista DATE,
  data_conclusao DATE,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rh_demandas_status ON public.rh_demandas(status);
CREATE INDEX IF NOT EXISTS idx_rh_demandas_data_prevista ON public.rh_demandas(data_prevista);

-- ---------- Adiantamentos ----------

CREATE TABLE IF NOT EXISTS public.rh_adiantamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID REFERENCES public.rh_funcionarios(id) ON DELETE RESTRICT NOT NULL,
  competencia DATE NOT NULL,
  valor NUMERIC(10,2) NOT NULL CHECK (valor > 0),
  data_lancamento DATE DEFAULT CURRENT_DATE,
  transacao_id UUID,
  criado_por UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- ---------- Férias ----------

CREATE TABLE IF NOT EXISTS public.rh_ferias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID REFERENCES public.rh_funcionarios(id) ON DELETE RESTRICT NOT NULL,
  periodo_aquisitivo_inicio DATE NOT NULL,
  periodo_aquisitivo_fim DATE NOT NULL,
  data_inicio_gozo DATE,
  data_fim_gozo DATE,
  terco_constitucional NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'A_VENCER' CHECK (status IN ('A_VENCER', 'AGENDADA', 'EM_GOZO', 'CONCLUIDA'))
);

-- ---------- Folha de Pagamento ----------

CREATE TABLE IF NOT EXISTS public.rh_folha_pagamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID REFERENCES public.rh_funcionarios(id) ON DELETE RESTRICT NOT NULL,
  competencia DATE NOT NULL,
  salario_base NUMERIC(10,2) NOT NULL,
  valor_horas_extras NUMERIC(10,2) NOT NULL DEFAULT 0,
  terco_ferias NUMERIC(10,2) NOT NULL DEFAULT 0,
  desconto_faltas_atrasos NUMERIC(10,2) NOT NULL DEFAULT 0,
  desconto_vale_transporte NUMERIC(10,2) NOT NULL DEFAULT 0,
  desconto_inss NUMERIC(10,2) NOT NULL DEFAULT 0,
  desconto_adiantamento NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_liquido NUMERIC(10,2) NOT NULL DEFAULT 0,
  fgts_depositado NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'CALCULADA' CHECK (status IN ('CALCULADA', 'FECHADA')),
  transacao_id UUID,
  data_fechamento DATE,
  criado_por UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  UNIQUE (funcionario_id, competencia)
);

CREATE INDEX IF NOT EXISTS idx_rh_folha_competencia ON public.rh_folha_pagamento(competencia);

-- ---------- Rescisões ----------

CREATE TABLE IF NOT EXISTS public.rh_rescisoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID REFERENCES public.rh_funcionarios(id) ON DELETE RESTRICT NOT NULL,
  data_desligamento DATE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('SEM_JUSTA_CAUSA', 'PEDIDO_DEMISSAO', 'JUSTA_CAUSA', 'ACORDO')),
  aviso_previo NUMERIC(10,2) NOT NULL DEFAULT 0,
  ferias_proporcionais NUMERIC(10,2) NOT NULL DEFAULT 0,
  decimo_proporcional NUMERIC(10,2) NOT NULL DEFAULT 0,
  multa_fgts NUMERIC(10,2) NOT NULL DEFAULT 0,
  saldo_salario NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  transacao_id UUID,
  criado_por UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  criado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE (funcionario_id, data_desligamento)
);

-- ---------- Tabela de INSS ----------

CREATE TABLE IF NOT EXISTS public.rh_tabela_inss (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vigencia_inicio DATE NOT NULL UNIQUE,
  faixas JSONB NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- ---------- RLS ----------

DO $$
DECLARE
  tabela TEXT;
BEGIN
  FOR tabela IN SELECT unnest(ARRAY[
    'rh_funcionarios', 'rh_dependentes', 'rh_estagiarios', 'rh_vagas',
    'rh_demandas', 'rh_adiantamentos', 'rh_ferias', 'rh_folha_pagamento', 'rh_rescisoes',
    'rh_tabela_inss'
  ])
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tabela);
    EXECUTE format('DROP POLICY IF EXISTS "rh_acesso_completo" ON public.%I', tabela);
    EXECUTE format('CREATE POLICY "rh_acesso_completo" ON public.%I FOR ALL USING (public.tem_acesso_rh())', tabela);
  END LOOP;
END $$;
`;

export const RhSqlScriptModal: React.FC<RhSqlScriptModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_RH_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold">
              <span className="material-symbols-outlined">database</span>
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">Script SQL do Módulo RH</h3>
              <p className="text-xs text-slate-500 font-medium">Execute no SQL Editor do Supabase para criar a estrutura no banco</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all"
          >
            <i className="fa-solid fa-xmark text-base"></i>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between bg-blue-50/70 p-3.5 rounded-2xl border border-blue-100 text-xs text-blue-900 font-medium">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-lg">info</span>
              <span>Copie o script e cole na aba <strong>SQL Editor</strong> do seu projeto Supabase.</span>
            </div>
            <button
              onClick={handleCopy}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                copied ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'content_copy'}</span>
              <span>{copied ? 'Copiado!' : 'Copiar SQL'}</span>
            </button>
          </div>

          <pre className="bg-slate-900 text-emerald-400 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-[380px] leading-relaxed border border-slate-800">
            {SQL_RH_SCRIPT}
          </pre>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
