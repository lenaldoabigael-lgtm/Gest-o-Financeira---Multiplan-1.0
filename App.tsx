import React, { useState, useEffect, useMemo } from 'react';
import { User, UserPermissions, Tab, Transaction, CostCenter, Proposal, ProposalRequirement, PaymentLot, Cotacao } from './types';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TransactionTable from './components/TransactionTable';
import CostCentersView from './components/CostCentersView';
import CashFlow from './components/CashFlow';
import Details from './components/Details';
import CredentialsManager from './components/CredentialsManager';
import ProposalsView from './components/ProposalsView';
import SellerBoard from './components/SellerBoard';
import ProposalModal from './components/ProposalModal';
import FinanceView from './components/FinanceView';
import ProposalStructureView from './components/ProposalStructureView';
import ComissoesModule from './components/ComissoesModule';
import PlanQuoteView from './components/PlanQuoteView';
import { PortalCorretor } from './components/PortalCorretor';
import { RhModule } from './components/rh/RhModule';
import { NotificacoesConfigModule } from './components/configuracoes/NotificacoesConfigModule';
import { ModalSolicitarAcesso } from './components/ModalSolicitarAcesso';
import { supabase } from './lib/supabase';
import { calculateLotTotalNet, calculateProposalNetCommission } from './lib/lotCalculations';
import { isCartaoCorretora } from './lib/validators';
import { logDeviceSession } from './lib/deviceDetect';

const DEFAULT_USERS: User[] = [
  {
    login: 'admin',
    senha: 'Davi2017',
    email: 'lenaldo.abigael@hotmail.com',
    cargo: 'Gerente Geral & Financeiro',
    role: 'admin',
    status: 'ATIVO',
    ultimoAcesso: 'Hoje\n12:00',
    approved: true,
    permissions: {
      centroCusto: true, contasPagar: true, contasReceber: true,
      dashboard: true, fluxoCaixa: true, detalhes: true, planCredencias: true,
      gestaoDemandas: true, propostas: true, financeiro: true, estruturaProposta: true, comissoes: true,
      criarPropostas: true, exportarDados: true, cotacao: true, rh: true, notificacoes: true
    }
  },
  {
    login: 'Hellen Kelma',
    senha: 'mplan6803',
    email: 'hellen.kelma@hotmail.com',
    cargo: 'Analista Sênior',
    role: 'admin',
    status: 'ATIVO',
    ultimoAcesso: 'Hoje\n10:00',
    approved: true,
    permissions: {
      centroCusto: true, contasPagar: true, contasReceber: true,
      dashboard: true, fluxoCaixa: true, detalhes: true, planCredencias: true,
      gestaoDemandas: true, propostas: true, financeiro: true, estruturaProposta: true, comissoes: true,
      criarPropostas: true, exportarDados: true, cotacao: true, rh: true, notificacoes: true
    }
  },
  {
    login: 'ADRIANE RODRIGUES',
    senha: '123456',
    email: 'adriane.rodrigues@multiplan.com',
    cargo: 'Analista Sênior',
    role: 'admin',
    status: 'ATIVO',
    ultimoAcesso: 'Hoje\n09:00',
    approved: true,
    permissions: {
      centroCusto: true, contasPagar: true, contasReceber: true,
      dashboard: true, fluxoCaixa: true, detalhes: true, planCredencias: true,
      gestaoDemandas: true, propostas: true, financeiro: true, estruturaProposta: true, comissoes: true,
      criarPropostas: true, exportarDados: true, cotacao: true, rh: true, notificacoes: true
    }
  },
  {
    login: 'Renan Rodrigues',
    senha: 'a1b2c3',
    email: 'renan.rodrigues@multiplan.com',
    cargo: 'Analista Sênior',
    role: 'admin',
    status: 'ATIVO',
    ultimoAcesso: 'Hoje\n14:32',
    approved: true,
    permissions: {
      centroCusto: false, contasPagar: false, contasReceber: false,
      dashboard: false, fluxoCaixa: false, detalhes: false, planCredencias: false,
      gestaoDemandas: false, propostas: true, financeiro: false, estruturaProposta: false, comissoes: false,
      criarPropostas: true, exportarDados: false, cotacao: false
    }
  },
  {
    login: 'Rodrigo.Mendes',
    senha: '123456',
    email: 'rodrigo.mendes@gmail.com',
    cargo: 'Analista Sênior',
    role: 'admin',
    status: 'ATIVO',
    ultimoAcesso: 'Hoje\n14:32',
    approved: true,
    permissions: {
      centroCusto: true, contasPagar: true, contasReceber: true,
      dashboard: true, fluxoCaixa: true, detalhes: true, planCredencias: false,
      gestaoDemandas: true, propostas: true, financeiro: true, estruturaProposta: true, comissoes: true
    }
  }
];

const TEST_LOGINS_TO_PURGE = ['corretor', 'carlos corretor', 'anny', 'michele', 'luiza'];

const fetchSupabaseUsersSafely = async (): Promise<User[]> => {
  try {
    const fetchPromise = supabase.from('users').select('*');
    const timeoutPromise = new Promise<{ data: null; error: any }>(resolve =>
      setTimeout(() => resolve({ data: null, error: 'TIMEOUT' }), 2500)
    );
    const result: any = await Promise.race([fetchPromise, timeoutPromise]);
    if (result && result.data && Array.isArray(result.data)) {
      return result.data as User[];
    }
  } catch (e) {
    console.warn('Erro ao carregar usuários do Supabase:', e);
  }
  return [];
};

const getDefaultPermissionsForRole = (role?: string): UserPermissions => {
  if (role === 'admin') {
    return {
      centroCusto: true, contasPagar: true, contasReceber: true,
      dashboard: true, fluxoCaixa: true, detalhes: true, planCredencias: true,
      gestaoDemandas: true, propostas: true, financeiro: true, estruturaProposta: true, comissoes: true,
      cotacao: true, exportarDados: true, criarPropostas: true, gestaoUsuarios: true, rh: true, notificacoes: true
    };
  }
  if (role === 'cadastro_propostas') {
    return {
      centroCusto: false, contasPagar: false, contasReceber: false,
      dashboard: false, fluxoCaixa: false, detalhes: false, planCredencias: false,
      gestaoDemandas: true, propostas: true, financeiro: false, estruturaProposta: false, comissoes: false,
      cotacao: true, exportarDados: false, criarPropostas: true, gestaoUsuarios: false
    };
  }
  if (role === 'pagamento_comissoes') {
    return {
      centroCusto: false, contasPagar: true, contasReceber: true,
      dashboard: false, fluxoCaixa: true, detalhes: true, planCredencias: false,
      gestaoDemandas: false, propostas: true, financeiro: true, estruturaProposta: false, comissoes: true,
      cotacao: false, exportarDados: true, criarPropostas: false, gestaoUsuarios: false
    };
  }
  if (role === 'corretor') {
    return {
      centroCusto: false, contasPagar: false, contasReceber: false,
      dashboard: false, fluxoCaixa: false, detalhes: false, planCredencias: false,
      gestaoDemandas: false, propostas: true, financeiro: false, estruturaProposta: false, comissoes: true,
      cotacao: true, exportarDados: false, criarPropostas: true, gestaoUsuarios: false
    };
  }
  return {
    centroCusto: false, contasPagar: false, contasReceber: false,
    dashboard: false, fluxoCaixa: false, detalhes: false, planCredencias: false,
    gestaoDemandas: false, propostas: false, financeiro: false, estruturaProposta: false, comissoes: false,
    cotacao: false, exportarDados: false, criarPropostas: false, gestaoUsuarios: false
  };
};

const normalizeKey = (str?: string): string => {
  if (!str) return '';
  return str.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
};

const mergeUserRecords = (base: User, incoming: User): User => {
  const isIncomingMasterAdmin = (incoming.login || '').trim().toLowerCase() === 'admin';
  const isBaseMasterAdmin = (base.login || '').trim().toLowerCase() === 'admin';
  const isMasterAdmin = isIncomingMasterAdmin || isBaseMasterAdmin;

  // Preserve 'admin' login for master user, otherwise pick formatted name (with spaces/casing)
  let preferredLogin = incoming.login || base.login;
  if (isMasterAdmin) {
    preferredLogin = 'admin';
  } else if (base.login && base.login.includes(' ') && !incoming.login?.includes(' ')) {
    preferredLogin = base.login;
  } else if (incoming.login && incoming.login.includes(' ') && !base.login?.includes(' ')) {
    preferredLogin = incoming.login;
  }

  // Preserve Corretor cargo or most specific cargo
  let preferredCargo = incoming.cargo || base.cargo;
  if (isMasterAdmin) {
    preferredCargo = 'Gerente Geral & Financeiro';
  } else if (!preferredCargo) {
    preferredCargo = 'Analista Sênior';
  }

  const isCorretor = preferredCargo.toLowerCase().includes('corretor') || 
                    (base.role === 'corretor') || 
                    (incoming.role === 'corretor');

  const preferredRole = isMasterAdmin ? 'admin' : (isCorretor ? 'corretor' : (incoming.role || base.role || 'admin'));
  const defaultPerms = getDefaultPermissionsForRole(preferredRole);

  const mergedPermissions: UserPermissions = {
    ...defaultPerms,
    ...(base.permissions || {}),
    ...(incoming.permissions || {})
  };

  return {
    ...base,
    ...incoming,
    id: incoming.id || base.id,
    login: preferredLogin,
    email: incoming.email || base.email,
    senha: incoming.senha || base.senha,
    cargo: preferredCargo,
    role: preferredRole as any,
    status: incoming.status || base.status || 'ATIVO',
    ultimoAcesso: incoming.ultimoAcesso || base.ultimoAcesso || 'Hoje\n12:00',
    approved: incoming.approved !== undefined ? incoming.approved : (base.approved !== undefined ? base.approved : true),
    permissions: mergedPermissions
  };
};

const mergeWithDefaultUsers = (dbUsers: User[] = []): User[] => {
  // 1. Read local storage cache if available
  let localUsers: User[] = [];
  try {
    const raw = localStorage.getItem('multiplan_app_users');
    if (raw) {
      localUsers = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading local users cache:', e);
  }

  // 1.b Read deleted users list from localStorage to prevent resurrection
  let deletedLogins: string[] = [];
  try {
    const rawDel = localStorage.getItem('multiplan_deleted_users');
    if (rawDel) {
      deletedLogins = JSON.parse(rawDel);
    }
  } catch (e) {
    console.warn('Error reading deleted users cache:', e);
  }

  const isPurgedOrDeleted = (login?: string, email?: string) => {
    const keyLogin = (login || '').trim().toLowerCase();
    const keyEmail = (email || '').trim().toLowerCase();
    return TEST_LOGINS_TO_PURGE.includes(keyLogin) || 
           deletedLogins.includes(keyLogin) ||
           (keyEmail && deletedLogins.includes(keyEmail));
  };

  const mergedList: User[] = [];

  const addOrMergeUser = (candidate: User, isDbSource = false) => {
    if (!candidate || (!candidate.login && !candidate.email)) return;
    if (!isDbSource && isPurgedOrDeleted(candidate.login, candidate.email)) return;

    const candEmail = (candidate.email || '').trim().toLowerCase();
    const candNormLogin = normalizeKey(candidate.login);
    const isCandAdmin = (candidate.login || '').trim().toLowerCase() === 'admin';

    // Find existing match by ID, exact email, normalized login or admin email alias
    const existingIndex = mergedList.findIndex(u => {
      if (candidate.id && u.id && candidate.id === u.id) return true;
      
      const uEmail = (u.email || '').trim().toLowerCase();
      if (candEmail && uEmail && candEmail === uEmail) return true;
      
      const uNormLogin = normalizeKey(u.login);
      if (candNormLogin && uNormLogin && candNormLogin === uNormLogin) return true;

      // Special check for master admin aliases
      const isUAdmin = (u.login || '').trim().toLowerCase() === 'admin';
      if (isCandAdmin && uEmail === 'lenaldo.abigael@hotmail.com') return true;
      if (isUAdmin && candEmail === 'lenaldo.abigael@hotmail.com') return true;

      return false;
    });

    if (existingIndex >= 0) {
      mergedList[existingIndex] = mergeUserRecords(mergedList[existingIndex], candidate);
    } else {
      mergedList.push({
        ...candidate,
        status: candidate.status || 'ATIVO',
        cargo: candidate.cargo || ((candidate.login || '').toLowerCase() === 'admin' ? 'Gerente Geral & Financeiro' : 'Analista Sênior'),
        role: candidate.role || ((candidate.login || '').toLowerCase() === 'admin' ? 'admin' : (candidate.cargo?.toLowerCase().includes('corretor') ? 'corretor' : 'admin')),
        permissions: candidate.permissions || getDefaultPermissionsForRole(candidate.role)
      });
    }
  };

  // Layer 1: Default baseline users (subject to deletion purge)
  for (const u of DEFAULT_USERS) {
    addOrMergeUser(u, false);
  }

  // Layer 2: Database / Supabase profiles and users (always preserved, true source of truth)
  for (const u of dbUsers) {
    addOrMergeUser(u, true);
  }

  // Layer 3: Local modifications (admin edits)
  for (const u of localUsers) {
    addOrMergeUser(u, true);
  }

  // Write back deduplicated list to localStorage to self-heal cached duplicates
  try {
    localStorage.setItem('multiplan_app_users', JSON.stringify(mergedList));
  } catch (e) {
    console.warn('Error updating deduplicated multiplan_app_users cache', e);
  }

  return mergedList;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [paymentLots, setPaymentLots] = useState<PaymentLot[]>([]);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [isSolicitarAcessoGlobalOpen, setIsSolicitarAcessoGlobalOpen] = useState(false);
  const [appUsers, setAppUsers] = useState<User[]>(DEFAULT_USERS);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [proposalRequirements, setProposalRequirements] = useState<ProposalRequirement[]>([]);
  const [savedCotacoes, setSavedCotacoes] = useState<Cotacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorType, setErrorType] = useState<'SCHEMA_HIDDEN' | 'TABLES_MISSING' | null>(null);
  const [activeAccount, setActiveAccount] = useState<string>('TODAS');
  const [forcedView, setForcedView] = useState<'auto' | 'desktop' | 'portal_corretor'>('auto');

  const fetchData = async () => {
    setIsLoading(true);
    setErrorType(null);
    try {
      const [transactionsRes, costCentersRes, proposalsRes, requirementsRes, lotsRes, profilesRes, usersTableRes, cotacoesRes] = await Promise.all([
        supabase.from('transactions').select('*').order('vencimento', { ascending: false }),
        supabase.from('cost_centers').select('*').order('nome'),
        supabase.from('proposals').select('*').order('data', { ascending: false }),
        supabase.from('proposal_requirements').select('*').order('nome'),
        supabase.from('payment_lots').select('*').order('dataAprovacao', { ascending: false }),
        supabase.from('profiles').select('*'),
        supabase.from('users').select('*').then(r => r, () => ({ data: null, error: null })),
        supabase.from('cotacoes').select('*').order('created_at', { ascending: false }).then(r => r, () => ({ data: null, error: null }))
      ]);

      if (cotacoesRes && cotacoesRes.data && cotacoesRes.data.length > 0) {
        setSavedCotacoes(cotacoesRes.data.map((c: any) => ({
          id: c.id,
          clienteNome: c.cliente_nome || c.clienteNome || 'Cliente Cotação',
          uf: c.uf || 'PE',
          cidade: c.cidade || 'Recife',
          created_at: c.created_at || new Date().toISOString(),
          corretor: c.criado_por || c.corretor || 'Corretor',
          operadoras: Array.isArray(c.operadoras) ? c.operadoras : [c.operadoras || 'HAPVIDA'],
          tiposPlano: Array.isArray(c.tipos_plano) ? c.tipos_plano : ['ADESÃO'],
          vidasPorFaixa: c.detalhes_json?.vidasPorFaixa || c.vidasPorFaixa || {},
          totalVidas: Number(c.total_vidas || c.totalVidas || 1),
          totalMensalEstimado: Number(c.valor_total || c.totalMensalEstimado || 0),
          detalhes: c.detalhes_json || c.detalhes || {}
        })));
      } else {
        const localSaved = localStorage.getItem('multiplan_saved_cotacoes');
        if (localSaved) {
          try {
            setSavedCotacoes(JSON.parse(localSaved));
          } catch (e) {
            console.warn('Error parsing local cotacoes', e);
          }
        }
      }

      // Combina dados de profiles e da tabela users
      const mapUsers: Record<string, User> = {};

      if (profilesRes.data) {
        for (const p of profilesRes.data) {
          const key = (p.email || p.login || p.id).toLowerCase();
          mapUsers[key] = {
            id: p.id,
            login: p.login || p.email?.split('@')[0] || p.email,
            email: p.email,
            role: p.role || 'corretor',
            cargo: p.cargo || (p.role === 'admin' ? 'Gerente Financeiro' : 'Analista Sênior'),
            status: 'ATIVO',
            approved: p.approved !== false,
            permissions: p.permissions || getDefaultPermissionsForRole(p.role),
          };
        }
      }

      if (usersTableRes.data) {
        for (const u of usersTableRes.data) {
          const key = (u.email || u.login).toLowerCase();
          const existing = mapUsers[key];
          mapUsers[key] = {
            id: existing?.id || `usr_${u.login}`,
            login: u.login,
            email: u.email || existing?.email || '',
            senha: u.senha || existing?.senha,
            role: existing?.role || (u.permissions?.criarPropostas && !u.permissions?.financeiro ? 'corretor' : 'admin'),
            cargo: existing?.cargo || 'Analista Sênior',
            status: u.approved === 'false' || u.approved === false ? 'INATIVO' : 'ATIVO',
            approved: u.approved !== 'false' && u.approved !== false,
            permissions: u.permissions || existing?.permissions || getDefaultPermissionsForRole(existing?.role || 'admin'),
          };
        }
      }

      const mergedUsers = mergeWithDefaultUsers(Object.values(mapUsers));
      setAppUsers(mergedUsers);

      // Sincronização e auto-cura: garante que os usuários padrão essenciais estejam presentes na tabela users com aprovação ativa
      const defaultSyncList = [
        { login: 'admin', senha: 'D@vi2017', email: 'lenaldo.abigael@hotmail.com', role: 'admin' },
        { login: 'Hellen Kelma', senha: 'mplan6803', email: 'hellen.kelma@hotmail.com', role: 'admin' },
        { login: 'ADRIANE RODRIGUES', senha: '123456', email: 'adriane.rodrigues@multiplan.com', role: 'admin' },
        { login: 'Renan Rodrigues', senha: 'a1b2c3', email: 'renan.rodrigues@multiplan.com', role: 'admin' },
        { login: 'Rodrigo.Mendes', senha: '123456', email: 'rodrigo.mendes@gmail.com', role: 'admin' }
      ];

      for (const dUser of defaultSyncList) {
        try {
          const matchExisting = (usersTableRes.data || []).find((u: any) => 
            (u.login || '').trim().toLowerCase() === dUser.login.toLowerCase() ||
            (u.email || '').trim().toLowerCase() === dUser.email.toLowerCase()
          );

          if (!matchExisting || matchExisting.approved === 'false' || matchExisting.approved === false) {
            await supabase.from('users').upsert({
              login: dUser.login,
              senha: matchExisting?.senha || dUser.senha,
              email: dUser.email,
              approved: 'true',
              permissions: getDefaultPermissionsForRole(dUser.role)
            }, { onConflict: 'login' });
          }
        } catch (e) {}
      }

      if (transactionsRes.data) setTransactions(transactionsRes.data);
      if (proposalsRes.data && proposalsRes.data.length > 0) {
        setProposals(proposalsRes.data.map((p: any) => ({
          ...p,
          parcelas_status: p.parcelas_status || p.detalhes?.parcelas_status || {},
          parcelas_valores: p.parcelas_valores || p.detalhes?.parcelas_valores || {},
          parcelas_repassadas: p.parcelas_repassadas || p.detalhes?.parcelas_repassadas || {}
        })));
      } else {
        const mockProposals: Proposal[] = [
          { 
            id: '1', contrato: '6GTLW', data: '2026-04-20', cliente: 'EDILMA SANTOS BOMFIM BISPO', cpfCnpj: '015.070.045-83', corretor: 'corretor', operadora: 'Amil', categoria: 'Saúde-PME', valor: 1566.62, vidas: 4, status: 'CADASTRADA', comissao: 1566.62, 
            detalhes: { 
              cliente: { nome: 'EDILMA SANTOS BOMFIM BISPO', cpfCnpj: '015.070.045-83', email: 'edilma@exemplo.com', telefone: '(81) 98888-7777', dataNascimento: '15/05/1985' },
              proposta: { contrato: '6GTLW', dataVenda: '2026-04-20', corretor: 'corretor', operadora: 'Amil', categoria: 'Saúde-PME', tipoPlano: 'PME' },
              financeiro: { valorContrato: 1566.62, vidas: 4, parcelas: [{ id: '1', numero: '1ª Parcela', valor: 1566.62, comissao: 1566.62, vencimento: '2026-04-20' }] }
            } 
          },
          { 
            id: '2', contrato: 'GPLRG', data: '2026-04-20', cliente: 'T.F.S. SILVA FARMACIA LTDA', cpfCnpj: '12.345.678/0001-90', corretor: 'corretor', operadora: 'Bradesco Saúde', categoria: 'Saúde-PME', valor: 2379.28, vidas: 6, status: 'ENVIADA AO FINANCEIRO', comissao: 2379.28, 
            detalhes: { 
              cliente: { nome: 'T.F.S. SILVA FARMACIA LTDA', cpfCnpj: '12.345.678/0001-90', email: 'farmacia@exemplo.com', telefone: '(81) 3444-2222', dataNascimento: '' },
              proposta: { contrato: 'GPLRG', dataVenda: '2026-04-20', corretor: 'corretor', operadora: 'Bradesco Saúde', categoria: 'Saúde-PME', tipoPlano: 'PME' },
              financeiro: { valorContrato: 2379.28, vidas: 6, parcelas: [{ id: '1', numero: '1ª Parcela', valor: 2379.28, comissao: 2379.28, vencimento: '2026-04-20' }] }
            } 
          },
          { 
            id: '3', contrato: 'HXRYU', data: '2026-04-21', cliente: 'JOAO SILVA COSTA', cpfCnpj: '111.222.333-44', corretor: 'corretor', operadora: 'Unimed Nacional', categoria: 'Adesão', valor: 826.37, vidas: 2, status: 'PAGO', comissao: 826.37, 
            detalhes: { 
              cliente: { nome: 'JOAO SILVA COSTA', cpfCnpj: '111.222.333-44', email: 'joao.costa@exemplo.com', telefone: '(81) 99999-1111', dataNascimento: '10/10/1990' },
              proposta: { contrato: 'HXRYU', dataVenda: '2026-04-21', corretor: 'corretor', operadora: 'Unimed Nacional', categoria: 'Adesão', tipoPlano: 'Adesão' },
              financeiro: { valorContrato: 826.37, vidas: 2, parcelas: [{ id: '1', numero: '1ª Parcela', valor: 826.37, comissao: 826.37, vencimento: '2026-04-21' }] }
            } 
          },
          { 
            id: '4', contrato: 'MPL99', data: '2026-04-22', cliente: 'CLINICA SAUDE INTEGRADA', cpfCnpj: '33.444.555/0001-22', corretor: 'Carlos Corretor', operadora: 'SulAmérica', categoria: 'Saúde-PME', valor: 3450.00, vidas: 8, status: 'CADASTRADA', comissao: 3450.00, 
            detalhes: { 
              cliente: { nome: 'CLINICA SAUDE INTEGRADA', cpfCnpj: '33.444.555/0001-22', email: 'contato@clinicasaude.com.br', telefone: '(81) 3333-5555', dataNascimento: '' },
              proposta: { contrato: 'MPL99', dataVenda: '2026-04-22', corretor: 'Carlos Corretor', operadora: 'SulAmérica', categoria: 'Saúde-PME', tipoPlano: 'PME' },
              financeiro: { valorContrato: 3450.00, vidas: 8, parcelas: [{ id: '1', numero: '1ª Parcela', valor: 3450.00, comissao: 3450.00, vencimento: '2026-04-22' }] }
            } 
          },
          { 
            id: '5', contrato: 'AN772', data: '2026-04-18', cliente: 'RESTAURANTE BOA VISTA LTDA', cpfCnpj: '98.765.432/0001-11', corretor: 'Anny', operadora: 'Hapvida', categoria: 'Saúde-PME', valor: 1890.50, vidas: 5, status: 'PAGO', comissao: 1890.50, 
            detalhes: { 
              cliente: { nome: 'RESTAURANTE BOA VISTA LTDA', cpfCnpj: '98.765.432/0001-11', email: 'boavista@restaurante.com', telefone: '(81) 3222-4444', dataNascimento: '' },
              proposta: { contrato: 'AN772', dataVenda: '2026-04-18', corretor: 'Anny', operadora: 'Hapvida', categoria: 'Saúde-PME', tipoPlano: 'PME' },
              financeiro: { valorContrato: 1890.50, vidas: 5, parcelas: [{ id: '1', numero: '1ª Parcela', valor: 1890.50, comissao: 1890.50, vencimento: '2026-04-18' }] }
            } 
          },
          { 
            id: '6', contrato: 'MC551', data: '2026-04-19', cliente: 'CONSULTORIA FINANCEIRA ALFA', cpfCnpj: '55.666.777/0001-88', corretor: 'Michele', operadora: 'Porto Seguro', categoria: 'Saúde-PME', valor: 2100.00, vidas: 3, status: 'ENVIADA AO FINANCEIRO', comissao: 2100.00, 
            detalhes: { 
              cliente: { nome: 'CONSULTORIA FINANCEIRA ALFA', cpfCnpj: '55.666.777/0001-88', email: 'alfa@consultoria.com', telefone: '(81) 3111-9999', dataNascimento: '' },
              proposta: { contrato: 'MC551', dataVenda: '2026-04-19', corretor: 'Michele', operadora: 'Porto Seguro', categoria: 'Saúde-PME', tipoPlano: 'PME' },
              financeiro: { valorContrato: 2100.00, vidas: 3, parcelas: [{ id: '1', numero: '1ª Parcela', valor: 2100.00, comissao: 2100.00, vencimento: '2026-04-19' }] }
            } 
          },
          { 
            id: '7', contrato: 'LZ334', data: '2026-04-21', cliente: 'MARCOS VINICIUS PEREIRA', cpfCnpj: '222.333.444-55', corretor: 'Luiza', operadora: 'Amil', categoria: 'Individual', valor: 450.00, vidas: 1, status: 'CADASTRADA', comissao: 450.00, 
            detalhes: { 
              cliente: { nome: 'MARCOS VINICIUS PEREIRA', cpfCnpj: '222.333.444-55', email: 'marcos.vinicius@exemplo.com', telefone: '(81) 97777-3333', dataNascimento: '25/08/1992' },
              proposta: { contrato: 'LZ334', dataVenda: '2026-04-21', corretor: 'Luiza', operadora: 'Amil', categoria: 'Individual', tipoPlano: 'Individual' },
              financeiro: { valorContrato: 450.00, vidas: 1, parcelas: [{ id: '1', numero: '1ª Parcela', valor: 450.00, comissao: 450.00, vencimento: '2026-04-21' }] }
            } 
          }
        ];
        setProposals(mockProposals);
      }
      if (costCentersRes.data) {
        setCostCenters(costCentersRes.data.map(cc => ({
          id: cc.id, nome: cc.nome, tipo: cc.tipo, subItens: cc.sub_itens || []
        })));
      }
      if (requirementsRes.data) {
        setProposalRequirements(requirementsRes.data);
      }
      let loadedLots: PaymentLot[] = [];
      if (lotsRes.data) {
        loadedLots = lotsRes.data;
        setPaymentLots(lotsRes.data);
      } else if (!lotsRes.error) {
        const mockLots: PaymentLot[] = [
          { id: '1', codigo: 'LOTE-2603-042', aprovadoPor: 'Arley (Gestor)', dataAprovacao: '16/03/2026 às 14:30', qtdPropostas: 2, vencimento: '17/03/2026', valorTotal: 946.49, status: 'PENDENTE' },
          { id: '2', codigo: 'LOTE-2603-041', aprovadoPor: 'João (Gestor)', dataAprovacao: '15/03/2026 às 16:15', qtdPropostas: 5, vencimento: 'Hoje', valorTotal: 3946.01, status: 'PENDENTE' },
        ];
        loadedLots = mockLots;
        setPaymentLots(mockLots);
      }

      // Auto-cura e consistência de integridade:
      // 1. Se houver propostas com lote_id preenchido apontando para um lote que NÃO existe mais em payment_lots (lote órfão),
      // limpa lote_id = null para restaurar as propostas imediatamente na fila de Aguardando Geração.
      // 2. Se houver propostas vinculadas a um lote cujo status é 'PAGO', mas a proposta ainda está com status diferente de 'PAGO',
      // sincroniza a proposta imediatamente para 'PAGO' (Concluída).
      if (proposalsRes.data && proposalsRes.data.length > 0 && loadedLots.length >= 0) {
        const validLotIds = new Set(loadedLots.map(l => String(l.id).trim()));
        const paidLotMap = new Map(loadedLots.filter(l => l.status === 'PAGO').map(l => [String(l.id).trim(), l]));

        const orphanProposals = proposalsRes.data.filter((p: any) => {
          if (!p.lote_id) return false;
          const lid = String(p.lote_id).trim();
          return lid !== '' && lid !== 'null' && lid !== 'undefined' && !validLotIds.has(lid);
        });

        if (orphanProposals.length > 0) {
          console.warn(`[Auto-Cura] Detectadas ${orphanProposals.length} propostas com lote_id órfão. Limpando lote_id no banco para reexibir no Financeiro...`);
          const orphanIds = orphanProposals.map((p: any) => p.id);
          supabase
            .from('proposals')
            .update({ lote_id: null })
            .in('id', orphanIds)
            .then(({ error }) => {
              if (error) console.error('Erro ao limpar lote_id órfão no Supabase:', error);
              else console.log('[Auto-Cura] Propostas órfãs restauradas com sucesso no Supabase.');
            });
          
          setProposals(prev => prev.map(p => {
            if (orphanIds.includes(p.id)) {
              return { ...p, lote_id: null };
            }
            return p;
          }));
        }

        // Sincronização de propostas de lotes já pagos
        const proposalsInPaidLotsNeedingUpdate = proposalsRes.data.filter((p: any) => {
          if (!p.lote_id || p.status === 'PAGO') return false;
          const lid = String(p.lote_id).trim();
          return paidLotMap.has(lid);
        });

        if (proposalsInPaidLotsNeedingUpdate.length > 0) {
          console.log(`[Auto-Sync] Sincronizando ${proposalsInPaidLotsNeedingUpdate.length} propostas cujos lotes já estão liquidados como PAGO...`);
          const updateIds = proposalsInPaidLotsNeedingUpdate.map((p: any) => p.id);
          for (const p of proposalsInPaidLotsNeedingUpdate) {
            const lot = paidLotMap.get(String(p.lote_id).trim());
            const existingDetalhes = p.detalhes || {};
            const updatedParcelasStatus = {
              ...(existingDetalhes.parcelas_status || {}),
              1: 'PAGO'
            };
            const updatedParcelasValores = {
              ...(existingDetalhes.parcelas_valores || {}),
              1: existingDetalhes.parcelas_valores?.[1] || Number(p.valor) || Number(p.comissao) || 0
            };
            const updatedHistorico = [
              ...(existingDetalhes.historico || []),
              {
                id: Math.random().toString(36).substr(2, 9),
                data: new Date().toISOString(),
                responsavel: 'Sistema Financeiro',
                observacao: `Lote ${lot?.codigo || ''} liquidado como PAGO. Proposta concluída automaticamente.`
              }
            ];

            supabase
              .from('proposals')
              .update({
                status: 'PAGO',
                detalhes: {
                  ...existingDetalhes,
                  parcelas_status: updatedParcelasStatus,
                  parcelas_valores: updatedParcelasValores,
                  historico: updatedHistorico
                }
              })
              .eq('id', p.id)
              .then(({ error }) => {
                if (error) console.error(`Erro ao sincronizar proposta ${p.id} para PAGO:`, error);
              });
          }

          setProposals(prev => prev.map(p => {
            if (updateIds.includes(p.id)) {
              return { ...p, status: 'PAGO' };
            }
            return p;
          }));
        }
      }
    } catch (error) {
      console.error('Erro crítico:', error);
      setErrorType('TABLES_MISSING');
    } finally {
      setIsLoading(false);
    }
  };

  const ativarPrimeiraAbaPermitida = (appUser: User) => {
    const tabs = [
      { id: Tab.DASHBOARD, permission: appUser.permissions.dashboard },
      { id: Tab.PROPOSTAS, permission: appUser.permissions.propostas },
      { id: Tab.COTACAO, permission: appUser.permissions.cotacao !== false },
      { id: Tab.ESTRUTURA_PROPOSTA, permission: appUser.permissions.estruturaProposta },
      { id: Tab.ACOMPANHAMENTO, permission: appUser.permissions.gestaoDemandas },
      { id: Tab.COMISSOES, permission: appUser.permissions.comissoes },
      { id: Tab.CONTAS_PAGAR, permission: appUser.permissions.contasPagar },
      { id: Tab.CONTAS_RECEBER, permission: appUser.permissions.contasReceber },
      { id: Tab.FLUXO_CAIXA, permission: appUser.permissions.fluxoCaixa },
      { id: Tab.FINANCEIRO, permission: appUser.permissions.financeiro },
      { id: Tab.CENTRO_CUSTO, permission: appUser.permissions.centroCusto },
      { id: Tab.DETALHES, permission: appUser.permissions.detalhes },
      { id: Tab.PLAN_CREDENCIAS, permission: appUser.permissions.planCredencias },
    ];
    const savedTab = localStorage.getItem('sis_activeTab') as Tab | null;
    if (savedTab && tabs.find(t => t.id === savedTab)?.permission) {
      setActiveTab(savedTab);
    } else {
      setActiveTab(tabs.find(t => t.permission)?.id || null);
    }
  };

  const montarUsuarioDoProfile = (profile: any): User => ({
    id: profile.id,
    login: profile.login || profile.email,
    email: profile.email,
    role: profile.role,
    status: 'ATIVO',
    approved: profile.approved !== false,
    permissions: profile.role === 'admin'
      ? { centroCusto: true, contasPagar: true, contasReceber: true, dashboard: true, fluxoCaixa: true, detalhes: true, planCredencias: true, gestaoDemandas: true, propostas: true, financeiro: true, estruturaProposta: true, comissoes: true }
      : (profile.permissions || getDefaultPermissionsForRole(profile.role)),
  });

  useEffect(() => {
    logDeviceSession();
    const restoreSession = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          // Consulta também tabela users pelo e-mail
          const { data: userFromTable } = await supabase
            .from('users')
            .select('*')
            .ilike('email', session.user.email || '')
            .maybeSingle();

          const isApprovedInUsersTable = userFromTable && (userFromTable.approved === 'true' || userFromTable.approved === true);
          const isApprovedInProfile = profile && profile.approved !== false;

          if (isApprovedInProfile || isApprovedInUsersTable) {
            // Se estava aprovado na tabela users mas desatualizado em profiles, auto-atualiza
            if (profile && profile.approved === false && isApprovedInUsersTable) {
              await supabase.from('profiles').update({ approved: true }).eq('id', session.user.id);
              profile.approved = true;
            }

            const appUser: User = profile 
              ? montarUsuarioDoProfile(profile)
              : {
                  id: session.user.id,
                  login: userFromTable?.login || session.user.email?.split('@')[0] || 'usuario',
                  email: session.user.email,
                  role: userFromTable?.role || 'corretor',
                  cargo: userFromTable?.cargo || 'Analista Sênior',
                  status: 'ATIVO' as const,
                  approved: true,
                  permissions: userFromTable?.permissions || getDefaultPermissionsForRole('corretor')
                };

            setUser(appUser);
            await fetchData();
            ativarPrimeiraAbaPermitida(appUser);
          }
        }
      } catch (e) {
        console.warn('Erro ao restaurar sessão:', e);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setUser(null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const accounts = useMemo(() => {
    const unique = Array.from(new Set(transactions.map(t => t.conta || 'GERAL')));
    return ['TODAS', ...unique.sort()];
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (activeAccount === 'TODAS') return transactions;
    return transactions.filter(t => (t.conta || 'GERAL') === activeAccount);
  }, [transactions, activeAccount]);

  const handleLogin = async (emailOrLogin: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const cleanInput = (emailOrLogin || '').trim();
      const cleanInputLower = cleanInput.toLowerCase();
      const cleanPass = (pass || '').trim();
      let email = cleanInput;

      // 1. Resolve usuário local ou na tabela para encontrar e-mail e dados completos
      const matchedUser = appUsers.find(u => {
        const uLogin = (u.login || '').trim().toLowerCase();
        const uEmail = (u.email || '').trim().toLowerCase();
        const uEmailPrefix = uEmail.split('@')[0];
        const uFirstName = uLogin.split(' ')[0];

        return uLogin === cleanInputLower ||
               uEmail === cleanInputLower ||
               uEmailPrefix === cleanInputLower ||
               uFirstName === cleanInputLower ||
               (cleanInputLower.length >= 4 && uLogin.startsWith(cleanInputLower));
      });

      if (matchedUser?.email) {
        email = matchedUser.email;
      } else if (!email.includes('@')) {
        // Busca e-mail na tabela users ou profiles do Supabase
        try {
          const { data: userRow } = await supabase
            .from('users')
            .select('*')
            .or(`login.ilike.${cleanInput},login.ilike.${cleanInput}%,email.ilike.${cleanInput}`)
            .limit(1)
            .maybeSingle();
          if (userRow?.email) email = userRow.email;
        } catch (e) {}
      }

      // 2. Tentativa de Login via Supabase Auth
      let authUser: any = null;
      if (email.includes('@')) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: cleanPass });
        if (!error && data?.user) {
          authUser = data.user;
        }
      }

      // 3. Se autenticou com sucesso no Supabase Auth:
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        // Consulta também a tabela users
        const { data: userRow } = await supabase
          .from('users')
          .select('*')
          .or(`email.ilike.${email},login.ilike.${cleanInput}`)
          .maybeSingle();

        const isApprovedInUsers = userRow && (userRow.approved === 'true' || userRow.approved === true);
        const isApprovedInProfile = profile && profile.approved !== false;

        if (isApprovedInUsers || isApprovedInProfile || matchedUser?.approved) {
          // Garante auto-cura se o profile constar como false ou não existir
          if (!profile) {
            await supabase.from('profiles').upsert({
              id: authUser.id,
              email: authUser.email,
              full_name: userRow?.login || matchedUser?.login || cleanInput,
              role: userRow?.permissions?.financeiro ? 'admin' : (matchedUser?.role || 'admin'),
              approved: true,
              permissions: userRow?.permissions || matchedUser?.permissions || getDefaultPermissionsForRole('admin'),
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
          } else if (profile.approved === false) {
            await supabase.from('profiles').update({ approved: true }).eq('id', authUser.id);
            profile.approved = true;
          }

          // Garante sincronização da senha e aprovação na tabela users
          try {
            await supabase.from('users').upsert({
              login: userRow?.login || matchedUser?.login || cleanInput,
              senha: cleanPass,
              email: authUser.email,
              approved: 'true',
              permissions: userRow?.permissions || matchedUser?.permissions || getDefaultPermissionsForRole('admin')
            }, { onConflict: 'login' });
          } catch (e) {}

          const appUser: User = profile ? montarUsuarioDoProfile({ ...profile, approved: true }) : {
            id: authUser.id,
            login: userRow?.login || matchedUser?.login || cleanInput,
            email: authUser.email,
            role: (userRow?.permissions?.financeiro ? 'admin' : (matchedUser?.role || 'admin')) as any,
            status: 'ATIVO',
            approved: true,
            permissions: userRow?.permissions || matchedUser?.permissions || getDefaultPermissionsForRole('admin')
          };

          setUser(appUser);
          await fetchData();
          ativarPrimeiraAbaPermitida(appUser);
          setIsLoading(false);
          return true;
        } else {
          setIsLoading(false);
          alert('Sua solicitação de acesso está aguardando aprovação do administrador.');
          return false;
        }
      }

      // 4. Fallback: Autenticação direta contra tabela users / appUsers / credenciais corporativas
      let tableUser: any = null;
      try {
        const { data: dbUser } = await supabase
          .from('users')
          .select('*')
          .or(`login.ilike.${cleanInput},login.ilike.${cleanInput}%,email.ilike.${cleanInput}`)
          .limit(1)
          .maybeSingle();
        if (dbUser) tableUser = dbUser;
      } catch (err) {}

      const candidateUser = tableUser || matchedUser;

      if (candidateUser) {
        // Validação de senha: checa senha exata ou aliases conhecidos
        const storedPass = (candidateUser.senha || '').trim();
        const candLoginLower = (candidateUser.login || '').trim().toLowerCase();
        const candEmailLower = (candidateUser.email || '').trim().toLowerCase();

        const isHellen = candLoginLower.includes('hellen') || candEmailLower.includes('hellen');
        const isAdmin = candLoginLower === 'admin' || candEmailLower.includes('lenaldo.abigael');
        const isAdriane = candLoginLower.includes('adriane') || candEmailLower.includes('adriane');

        const isPassValid = 
          storedPass === cleanPass ||
          (isHellen && (cleanPass === 'mplan6803' || cleanPass === 'HK@2026')) ||
          (isAdmin && (cleanPass === 'Davi2017' || cleanPass === 'D@vi2017')) ||
          (isAdriane && cleanPass === '123456');

        if (isPassValid) {
          if (candidateUser.approved === 'false' || candidateUser.approved === false) {
            setIsLoading(false);
            alert('Sua solicitação de acesso está aguardando aprovação do administrador.');
            return false;
          }

          const resolvedLogin = candidateUser.login || cleanInput;
          const resolvedEmail = candidateUser.email || email;
          const permissions = candidateUser.permissions || getDefaultPermissionsForRole('admin');

          const appUser: User = {
            id: candidateUser.id || `usr_${resolvedLogin}`,
            login: resolvedLogin,
            email: resolvedEmail,
            senha: cleanPass,
            role: (candidateUser.role || (permissions.financeiro ? 'admin' : 'corretor')) as any,
            cargo: candidateUser.cargo || (resolvedLogin.toLowerCase() === 'admin' ? 'Gerente Geral & Financeiro' : 'Analista Sênior'),
            status: 'ATIVO',
            approved: true,
            permissions: permissions
          };

          // Auto-cura e persistência imediata no Supabase (tabela users e profiles)
          try {
            await supabase.from('users').upsert({
              login: resolvedLogin,
              senha: cleanPass,
              email: resolvedEmail,
              approved: 'true',
              permissions: permissions
            }, { onConflict: 'login' });

            if (resolvedEmail) {
              await supabase.from('profiles').update({ approved: true, login: resolvedLogin }).ilike('email', resolvedEmail);
            }
          } catch (e) {
            console.warn('Auto-sync login error:', e);
          }

          setUser(appUser);
          await fetchData();
          ativarPrimeiraAbaPermitida(appUser);
          setIsLoading(false);
          return true;
        }
      }

      setIsLoading(false);
      return false;
    } catch (err) {
      console.error('Erro de login:', err);
      setIsLoading(false);
      return false;
    }
  };

  const handleRegister = async (login: string, email: string, pass: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanLogin = login.trim();
    if (!cleanEmail) {
      alert('E-mail é obrigatório para solicitar acesso.');
      return false;
    }

    if (!cleanLogin) {
      alert('Nome de usuário / Login é obrigatório.');
      return false;
    }

    if (pass.trim().length < 6) {
      alert('A senha deve conter no mínimo 6 caracteres.');
      return false;
    }

    // Limpa cache de usuários deletados para garantir que re-cadastros apareçam normalmente
    try {
      const rawDel = localStorage.getItem('multiplan_deleted_users');
      if (rawDel) {
        const delList: string[] = JSON.parse(rawDel);
        const filtered = delList.filter(k => k !== cleanLogin.toLowerCase() && k !== cleanEmail);
        localStorage.setItem('multiplan_deleted_users', JSON.stringify(filtered));
      }
    } catch (e) {}

    let authUserId: string | undefined = undefined;

    // 1. Tenta cadastrar no Supabase Auth
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: pass.trim(),
        options: {
          data: {
            login: cleanLogin,
            name: cleanLogin,
            full_name: cleanLogin,
            role: 'corretor',
            cargo: 'Corretor Autorizado',
            approved: false
          }
        }
      });

      if (signUpError) {
        console.warn('Aviso Supabase Auth signUp:', signUpError.message);
      } else if (signUpData?.user?.id) {
        authUserId = signUpData.user.id;
      }
    } catch (err) {
      console.warn('Erro ao chamar supabase.auth.signUp:', err);
    }

    // 2. Garante gravação na tabela users como pendente (approved = 'false')
    try {
      await supabase.from('users').upsert({
        login: cleanLogin,
        senha: pass.trim(),
        email: cleanEmail,
        approved: 'false',
        permissions: getDefaultPermissionsForRole('corretor')
      }, { onConflict: 'login' });
    } catch (err) {
      console.warn('Erro ao inserir na tabela users no registro:', err);
    }

    // 3. Garante gravação na tabela profiles como pendente (approved = false)
    try {
      const profilePayload: any = {
        email: cleanEmail,
        full_name: cleanLogin,
        role: 'corretor',
        approved: false,
        permissions: getDefaultPermissionsForRole('corretor'),
        updated_at: new Date().toISOString()
      };

      if (authUserId) {
        profilePayload.id = authUserId;
        await supabase.from('profiles').upsert(profilePayload, { onConflict: 'id' });
      } else {
        await supabase.from('profiles').upsert(profilePayload, { onConflict: 'email' });
      }
    } catch (err) {
      console.warn('Erro ao atualizar profiles no registro:', err);
    }

    alert('Sua solicitação de acesso foi enviada com sucesso! O administrador já pode aprová-la na Gestão de Credenciais.');
    return true;
  };


  if (errorType === 'SCHEMA_HIDDEN') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-8 flex flex-col items-center justify-center font-sans">
        <div className="max-w-2xl w-full space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-center space-y-4">
            <i className="fa-solid fa-lock-open text-6xl text-orange-500 mb-4 animate-bounce"></i>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Esquema Bloqueado (PGRST106)</h1>
            <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl text-orange-200 text-sm">
              Sua API do Supabase não está configurada para mostrar o esquema <strong>public</strong>.
            </div>
          </div>
          <button onClick={fetchData} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3">
            <i className="fa-solid fa-sync"></i> Recarregar Configuração
          </button>
        </div>
      </div>
    );
  }

  if (errorType === 'TABLES_MISSING') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-8 flex flex-col items-center justify-center font-sans">
        <div className="max-w-3xl w-full space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-center space-y-4">
            <i className="fa-solid fa-database text-6xl text-blue-500 mb-4"></i>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Tabelas não encontradas</h1>
            <p className="text-slate-400">Execute o script abaixo no SQL Editor do Supabase para criar a estrutura das abas Estrutura, Propostas e Financeiro:</p>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Script SQL de Inicialização</span>
              <button 
                onClick={() => {
                  const sql = document.querySelector('pre')?.innerText;
                  if (sql) { navigator.clipboard.writeText(sql); alert('SQL Copiado!'); }
                }}
                className="bg-white/10 hover:bg-white/20 text-[10px] px-3 py-1 rounded-md transition-all uppercase font-bold"
              >
                Copiar SQL
              </button>
            </div>
            <pre className="bg-black/50 p-4 rounded-lg text-[11px] text-green-400 overflow-x-auto border border-white/5 max-h-64 leading-relaxed font-mono">
{`/* 1. CRIAR TABELAS */
CREATE TABLE IF NOT EXISTS users (login TEXT PRIMARY KEY, senha TEXT NOT NULL, email TEXT, approved BOOLEAN DEFAULT false, permissions JSONB NOT NULL);
CREATE TABLE IF NOT EXISTS cost_centers (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nome TEXT NOT NULL, tipo TEXT NOT NULL, sub_itens TEXT[] DEFAULT '{}');
CREATE TABLE IF NOT EXISTS transactions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), type TEXT NOT NULL, vencimento DATE NOT NULL, pagamento DATE, descricao TEXT NOT NULL, valor NUMERIC(15,2) NOT NULL, "formaPagamento" TEXT NOT NULL, status TEXT NOT NULL, "centroCusto" TEXT NOT NULL, "subItem" TEXT NOT NULL, cliente TEXT, conta TEXT DEFAULT 'GERAL');
CREATE TABLE IF NOT EXISTS proposal_requirements (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tipo TEXT NOT NULL, nome TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS proposals (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), contrato TEXT NOT NULL, data DATE NOT NULL, cliente TEXT NOT NULL, "cpfCnpj" TEXT NOT NULL, corretor TEXT NOT NULL, operadora TEXT NOT NULL, categoria TEXT NOT NULL, valor NUMERIC(15,2) NOT NULL, vidas INTEGER NOT NULL, status TEXT NOT NULL, comissao NUMERIC(15,2) NOT NULL, detalhes JSONB, lote_id UUID);
CREATE TABLE IF NOT EXISTS payment_lots (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), codigo TEXT NOT NULL, "aprovadoPor" TEXT NOT NULL, "dataAprovacao" TIMESTAMP WITH TIME ZONE NOT NULL, "qtdPropostas" INTEGER NOT NULL, vencimento DATE NOT NULL, "valorTotal" NUMERIC(15,2) NOT NULL, status TEXT NOT NULL);

/* 2. ATUALIZAR TABELAS EXISTENTES (COMPATIBILIDADE TOTAL) */
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS detalhes JSONB;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS lote_id UUID;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS parcelas_status JSONB;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS parcelas_valores JSONB;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS parcelas_repassadas JSONB;

/* 3. DESABILITAR RLS (Segurança para Testes) */
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE cost_centers DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_requirements DISABLE ROW LEVEL SECURITY;
ALTER TABLE proposals DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_lots DISABLE ROW LEVEL SECURITY;`}
            </pre>
          </div>

          <button onClick={fetchData} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3">
            <i className="fa-solid fa-sync"></i> Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const isUserCorretor = useMemo(() => {
    if (!user) return false;
    if (user.role === 'admin' || user.login.toLowerCase() === 'admin') return false;
    if (user.role === 'corretor') return true;
    if ((user.cargo || '').toLowerCase().includes('corretor')) return true;
    return false;
  }, [user]);

  // Regra de Separação por Função:
  // Se for Corretor, tem acesso estritamente restrito ao Portal do Corretor (Mobile / Web de vendas)
  // Administradores e Analistas/Gestores têm acesso ao painel desktop com permissão de pré-visualizar
  const isShowingCorretorPortal = isUserCorretor || forcedView === 'portal_corretor';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setActiveTab(null);
    setForcedView('auto');
    setTransactions([]);
    setProposals([]);
    setPaymentLots([]);
    setCostCenters([]);
    setProposalRequirements([]);
    localStorage.removeItem('sis_activeTab');
  };

  const cleanProposalPayloadForSupabase = (prop: Partial<Proposal>) => {
    const {
      parcelas_status,
      parcelas_valores,
      parcelas_repassadas,
      observacoes,
      ...clean
    } = (prop || {}) as any;

    const currentDetalhes = clean.detalhes || {};
    const mergedStatus = parcelas_status || currentDetalhes.parcelas_status;
    const mergedValores = parcelas_valores || currentDetalhes.parcelas_valores;
    const mergedRepassadas = parcelas_repassadas || currentDetalhes.parcelas_repassadas;
    const mergedObs = observacoes || currentDetalhes.observacoes;

    clean.detalhes = {
      ...currentDetalhes,
      ...(mergedStatus ? { parcelas_status: mergedStatus } : {}),
      ...(mergedValores ? { parcelas_valores: mergedValores } : {}),
      ...(mergedRepassadas ? { parcelas_repassadas: mergedRepassadas } : {}),
      ...(mergedObs ? { observacoes: mergedObs } : {})
    };

    // Remove campos que não são colunas físicas na tabela proposals do Supabase
    delete clean.observacoes;

    return clean;
  };

  const handleSaveProposal = async (proposalData: Proposal) => {
    const contratoNumber = proposalData.contrato.trim();
    const isContratoDuplicado = proposals.some(
      p => p.contrato.trim() === contratoNumber && p.id !== editingProposal?.id
    );

    if (isContratoDuplicado) {
      alert(`Já existe uma proposta cadastrada com o contrato ${contratoNumber}. Não é permitido cadastrar propostas duplicadas.`);
      return;
    }

    // Sanitiza o payload para remover colunas que residem dentro do JSONB detalhes (evita erro PGRST204)
    const cleanPayload = cleanProposalPayloadForSupabase(proposalData);

    if (editingProposal) {
      // Regra Crítica: Não permitir voltar status ou alterar se estiver PAGO
      if (editingProposal.status === 'PAGO') {
        alert('Propostas com status PAGO não podem ser alteradas.');
        return;
      }
      if (editingProposal.status === 'ENVIADA AO FINANCEIRO' && cleanPayload.status === 'CADASTRADA') {
        cleanPayload.status = 'ENVIADA AO FINANCEIRO';
      }

      const { error } = await supabase.from('proposals').update(cleanPayload).eq('id', editingProposal.id);
      if (error) {
        console.error('Erro ao atualizar proposta:', error);
        alert('Erro ao atualizar proposta: ' + (error.message || ''));
        setProposals(prev => prev.map(p => p.id === editingProposal.id ? proposalData : p));
      } else {
        fetchData();
      }
    } else {
      if (cleanPayload.status !== 'ENVIADA AO FINANCEIRO') {
        cleanPayload.status = 'CADASTRADA';
      }
      
      const { error } = await supabase.from('proposals').insert([cleanPayload]);
      if (error) {
        console.error('Erro ao salvar proposta:', error);
        alert('Erro ao salvar proposta: ' + (error.message || ''));
        setProposals(prev => [proposalData, ...prev]);
      } else {
        fetchData();
      }
    }
  };

  const handleSaveCotacao = async (newCotacao: Cotacao) => {
    setSavedCotacoes(prev => {
      const next = [newCotacao, ...prev];
      localStorage.setItem('multiplan_saved_cotacoes', JSON.stringify(next));
      return next;
    });
    try {
      await supabase.from('cotacoes').insert([{
        cliente_nome: newCotacao.clienteNome,
        cidade: newCotacao.cidade,
        uf: newCotacao.uf,
        total_vidas: newCotacao.totalVidas,
        valor_total: newCotacao.totalMensalEstimado,
        operadoras: newCotacao.operadoras,
        tipos_plano: newCotacao.tiposPlano,
        criado_por: user?.login || 'Corretor',
        detalhes_json: {
          vidasPorFaixa: newCotacao.vidasPorFaixa,
          ...newCotacao.detalhes
        }
      }]);
    } catch (err) {
      console.warn('Could not insert cotacao into supabase, saved locally', err);
    }
  };

  const handleDeleteCotacao = async (id: string) => {
    setSavedCotacoes(prev => {
      const next = prev.filter(c => c.id !== id);
      localStorage.setItem('multiplan_saved_cotacoes', JSON.stringify(next));
      return next;
    });
    try {
      await supabase.from('cotacoes').delete().eq('id', id);
    } catch (err) {
      console.warn('Could not delete cotacao from supabase', err);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-blue-900 gap-4">
      <i className="fa-solid fa-circle-notch fa-spin text-4xl"></i>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Sincronizando Multiplan...</span>
    </div>
  );

  if (!user) return <Login onLogin={handleLogin} onRegister={handleRegister} />;

  // Render Portal do Corretor (Mobile/Web interface)
  if (isShowingCorretorPortal) {
    return (
      <>
        <PortalCorretor
          user={user}
          proposals={proposals}
          requirements={proposalRequirements}
          savedCotacoes={savedCotacoes}
          onLogout={handleLogout}
          onOpenNewProposal={() => {
            setEditingProposal(null);
            setIsProposalModalOpen(true);
          }}
          onSelectProposal={(p) => {
            setEditingProposal(p);
            setIsProposalModalOpen(true);
          }}
          onSaveCotacao={handleSaveCotacao}
          onDeleteCotacao={handleDeleteCotacao}
          onSwitchToDesktop={() => setForcedView('desktop')}
          isAdmin={user.role === 'admin' || user.login === 'admin' || user.permissions.dashboard}
        />
        {isProposalModalOpen && (
          <ProposalModal 
            isOpen={isProposalModalOpen} 
            onClose={() => {
              setIsProposalModalOpen(false);
              setEditingProposal(null);
            }} 
            requirements={proposalRequirements}
            proposal={editingProposal}
            user={user}
            onSave={async (proposalData) => {
              await handleSaveProposal(proposalData);
              setIsProposalModalOpen(false);
              setEditingProposal(null);
            }}
          />
        )}
      </>
    );
  }

  return (
    <Layout 
      user={user} 
      activeTab={activeTab} 
      setActiveTab={(tab) => {
        setActiveTab(tab);
        if (tab) localStorage.setItem('sis_activeTab', tab);
      }} 
      onLogout={handleLogout}
      onOpenCorretorPortal={() => setForcedView('portal_corretor')}
      onOpenSolicitarAcesso={() => setIsSolicitarAcessoGlobalOpen(true)}
    >

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        {activeTab === null && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <i className="fa-solid fa-lock text-6xl text-slate-300"></i>
            <h2 className="text-2xl font-black text-slate-700 uppercase tracking-tighter">Acesso Restrito</h2>
            <p className="text-slate-500 max-w-md">Você não possui permissão para acessar nenhuma tela do sistema. Por favor, contate o administrador para solicitar acesso.</p>
          </div>
        )}
        {activeTab === Tab.DASHBOARD && <Dashboard proposals={proposals} />}
        {activeTab === Tab.NOTIFICACOES && <NotificacoesConfigModule user={user!} />}
        {activeTab === Tab.RH && (
          <RhModule 
            user={user!} 
            onAddTransaction={async (t) => { 
              await supabase.from('transactions').insert(t); 
              fetchData(); 
            }} 
          />
        )}
        {activeTab === Tab.CONTAS_PAGAR && (
          <TransactionTable 
            type="PAGAR" 
            transactions={filteredTransactions.filter(t => t.type === 'PAGAR')} 
            costCenters={costCenters}
            onAdd={async t => { await supabase.from('transactions').insert(t); fetchData(); }} 
            onBulkAdd={async items => { await supabase.from('transactions').insert(items); fetchData(); }}
            onUpdate={async t => { await supabase.from('transactions').update(t).eq('id', t.id); fetchData(); }} 
            onBulkUpdate={async items => { 
              await Promise.all(items.map(t => supabase.from('transactions').update(t).eq('id', t.id)));
              fetchData();
            }}
            onDelete={async ids => { await supabase.from('transactions').delete().in('id', ids); fetchData(); }} 
          />
        )}
        {activeTab === Tab.CONTAS_RECEBER && (
          <TransactionTable 
            type="RECEBER" 
            transactions={filteredTransactions.filter(t => t.type === 'RECEBER')} 
            costCenters={costCenters}
            onAdd={async t => { await supabase.from('transactions').insert(t); fetchData(); }} 
            onBulkAdd={async items => { await supabase.from('transactions').insert(items); fetchData(); }}
            onUpdate={async t => { await supabase.from('transactions').update(t).eq('id', t.id); fetchData(); }} 
            onBulkUpdate={async items => { 
              await Promise.all(items.map(t => supabase.from('transactions').update(t).eq('id', t.id)));
              fetchData();
            }}
            onDelete={async ids => { await supabase.from('transactions').delete().in('id', ids); fetchData(); }} 
          />
        )}
        {/* Fix: Changed cc.sub_itens to cc.subItens to match the CostCenter type definition */}
        {activeTab === Tab.CENTRO_CUSTO && <CostCentersView costCenters={costCenters} onSave={async cc => { 
          const payload: any = { nome: cc.nome, tipo: cc.tipo, sub_itens: cc.subItens || [] };
          if (cc.id && !cc.id.startsWith('default-')) payload.id = cc.id;
          const { error } = await supabase.from('cost_centers').upsert(payload); 
          if (error) {
            console.error('Erro ao salvar centro de custo:', error);
            alert('Erro ao salvar centro de custo. Verifique o console.');
          } else {
            fetchData(); 
          }
        }} onDelete={async id => { 
          if (id.startsWith('default-')) {
            fetchData();
            return;
          }
          const { error } = await supabase.from('cost_centers').delete().eq('id', id); 
          if (error) {
            console.error('Erro ao excluir centro de custo:', error);
            alert('Erro ao excluir centro de custo. Verifique o console.');
          } else {
            fetchData(); 
          }
        }} />}
        {activeTab === Tab.FLUXO_CAIXA && <CashFlow transactions={filteredTransactions} />}
        {activeTab === Tab.DETALHES && (
          <Details 
            transactions={filteredTransactions} 
            costCenters={costCenters} 
            onUpdate={async t => { await supabase.from('transactions').update(t).eq('id', t.id); fetchData(); }}
          />
        )}
        {activeTab === Tab.PROPOSTAS && (
          <ProposalsView 
            proposals={proposals} 
            requirements={proposalRequirements}
            onAddProposal={() => {
              setEditingProposal(null);
              setIsProposalModalOpen(true);
            }} 
            onEditProposal={(p) => {
              if (p.status === 'PAGO') {
                alert('Propostas com status PAGO não podem ser alteradas.');
                return;
              }
              setEditingProposal(p);
              setIsProposalModalOpen(true);
            }}
            onDeleteProposal={async (id) => {
              const proposalToDelete = proposals.find(p => p.id === id);
              if (proposalToDelete?.status === 'PAGO') {
                alert('Propostas com status PAGO não podem ser excluídas.');
                return;
              }
              if (proposalToDelete?.status === 'ENVIADA AO FINANCEIRO') {
                alert('Propostas enviadas ao financeiro não podem ser excluídas.');
                return;
              }
              const { error } = await supabase.from('proposals').delete().eq('id', id);
              if (error) {
                console.error('Erro ao excluir proposta:', error);
                alert('Erro ao excluir proposta. Verifique o console.');
              } else {
                fetchData();
              }
            }}
            onImportProposals={async (importedProposals) => {
              // Sanitiza e mapeia apenas as colunas oficiais da tabela proposals no Supabase
              // (Evita o erro PGRST204 de coluna inexistente como 'observacoes' no schema cache)
              const sanitizedProposals = importedProposals.map(raw => {
                const { 
                  _cpfValido, 
                  _corretorValido, 
                  _duplicado, 
                  _bloqueios,
                  _avisos,
                  _cpfMotivo,
                  observacoes,
                  ...rest 
                } = (raw || {}) as any;

                const baseDetalhes = (rest.detalhes && typeof rest.detalhes === 'object') ? { ...rest.detalhes } : {};
                const obsTexto = observacoes || rest.observacoes;
                if (obsTexto) {
                  baseDetalhes.observacoes = obsTexto;
                }

                return {
                  contrato: String(rest.contrato || '').trim(),
                  data: rest.data || new Date().toISOString().split('T')[0],
                  cliente: String(rest.cliente || '').trim(),
                  cpfCnpj: String(rest.cpfCnpj || '').trim(),
                  corretor: String(rest.corretor || '').trim(),
                  operadora: String(rest.operadora || '').trim(),
                  categoria: rest.categoria || 'Geral',
                  valor: Number(rest.valor) || 0,
                  vidas: Number(rest.vidas) || 1,
                  status: 'CADASTRADA',
                  comissao: Number(rest.comissao) || 0,
                  detalhes: Object.keys(baseDetalhes).length > 0 ? baseDetalhes : null
                };
              });

              const uniqueImported = sanitizedProposals.filter(importada => 
                !proposals.some(p => p.contrato.trim() === importada.contrato.trim())
              );

              const duplicadasCount = sanitizedProposals.length - uniqueImported.length;

              if (uniqueImported.length === 0) {
                alert(duplicadasCount > 0 ? 'Todas as propostas do arquivo já estão cadastradas (contratos duplicados).' : 'Nenhuma proposta válida encontrada no arquivo.');
                return;
              }

              const { error } = await supabase.from('proposals').insert(uniqueImported);
              if (error) {
                console.error('Erro ao importar propostas:', error);
                alert('Erro ao importar propostas no Supabase: ' + (error.message || 'Verifique o console e o RLS da tabela proposals.'));
              } else {
                let msg = `${uniqueImported.length} propostas importadas com sucesso!`;
                if (duplicadasCount > 0) {
                  msg += `\n${duplicadasCount} propostas foram ignoradas pois já existem cadastros com o mesmo número de contrato.`;
                }
                alert(msg);
                fetchData();
              }
            }}
          />
        )}
        {activeTab === Tab.ACOMPANHAMENTO && user.permissions.gestaoDemandas && (
          <SellerBoard 
            proposals={proposals} 
            requirements={proposalRequirements}
            lots={paymentLots}
            onStatusChange={async (id, novoStatus) => {
              const p = proposals.find(prop => prop.id === id);
              
              // Se for cartão da corretora e a tentativa for de enviar ao financeiro, força transição direta para PAGO
              let targetStatus = novoStatus;
              if (p && isCartaoCorretora(p) && novoStatus === 'ENVIADA AO FINANCEIRO') {
                targetStatus = 'PAGO';
              }

              if (targetStatus === 'ENVIADA AO FINANCEIRO') {
                if (p && (!p.vidas || p.vidas === 0)) {
                  alert('Não é possível enviar propostas com 0 vidas para o financeiro.');
                  return;
                }
              }

              const isMovingToPago = targetStatus === 'PAGO';
              const isCartao = p ? isCartaoCorretora(p) : false;

              const updatePayload: any = {
                status: targetStatus
              };

              if (isMovingToPago && p) {
                // Atualiza 1ª parcela como PAGO (armazenado dentro de detalhes para compatibilidade com o schema Supabase)
                const updatedParcelasStatus = {
                  ...(p.detalhes?.parcelas_status || p.parcelas_status || {}),
                  1: 'PAGO'
                };
                const updatedParcelasValores = {
                  ...(p.detalhes?.parcelas_valores || p.parcelas_valores || {}),
                  1: p.parcelas_valores?.[1] || p.detalhes?.parcelas_valores?.[1] || Number(p.valor) || Number(p.comissao) || 0
                };

                updatePayload.detalhes = {
                  ...(p.detalhes || {}),
                  parcelas_status: updatedParcelasStatus,
                  parcelas_valores: updatedParcelasValores,
                  historico: [
                    ...(p.detalhes?.historico || []),
                    {
                      id: Math.random().toString(36).substr(2, 9),
                      data: new Date().toISOString(),
                      responsavel: user?.login || 'Sistema',
                      observacao: isCartao 
                        ? 'Quitado no Cartão de Crédito da Corretora - Concluído diretamente como PAGO.'
                        : 'Pagamento confirmado e marcado como PAGO.'
                    }
                  ]
                };
              } else if (targetStatus === 'ENVIADA AO FINANCEIRO' && p) {
                updatePayload.detalhes = {
                  ...(p.detalhes || {}),
                  historico: [
                    ...(p.detalhes?.historico || []),
                    {
                      id: Math.random().toString(36).substr(2, 9),
                      data: new Date().toISOString(),
                      responsavel: user?.login || 'Sistema',
                      observacao: 'Enviada ao Financeiro para fechamento de lote.'
                    }
                  ]
                };
              }

              const cleanPayload = cleanProposalPayloadForSupabase(updatePayload);
              const { error } = await supabase.from('proposals').update(cleanPayload).eq('id', id);
              if (error) {
                console.error('Erro ao atualizar status:', error);
                alert('Erro ao atualizar status da proposta: ' + (error.message || ''));
              } else {
                fetchData();
              }
            }}
          />
        )}
        {activeTab === Tab.FINANCEIRO && user.permissions.financeiro && (
          <FinanceView 
            lots={paymentLots} 
            proposals={proposals}
            requirements={proposalRequirements}
            user={user}
            onUnlinkProposal={async (proposalId) => {
              const { error } = await supabase
                .from('proposals')
                .update({ lote_id: null })
                .eq('id', proposalId);
              if (error) {
                alert('Erro ao desvincular proposta do lote: ' + error.message);
                return;
              }
              setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, lote_id: null } : p));
              await fetchData();
            }}
            onUnlinkAllProposalsFromLot={async (lotId) => {
              const { error } = await supabase
                .from('proposals')
                .update({ lote_id: null })
                .eq('lote_id', lotId);
              if (error) {
                alert('Erro ao desvincular propostas do lote: ' + error.message);
                return;
              }
              setProposals(prev => prev.map(p => p.lote_id === lotId ? { ...p, lote_id: null } : p));
              await fetchData();
            }}
            onEditProposal={(p) => {
              if (p.status === 'PAGO') {
                alert('Propostas com status PAGO não podem ser alteradas.');
                return;
              }
              setEditingProposal(p);
              setIsProposalModalOpen(true);
            }}
            onReturnPendingProposal={async (proposalId) => {
              const prop = proposals.find(p => p.id === proposalId);
              if (!prop) return;

              const { error: propError } = await supabase
                .from('proposals')
                .update({ status: 'CADASTRADA', lote_id: null })
                .eq('id', proposalId);

              if (propError) {
                console.error('Erro ao devolver proposta:', propError);
                alert('Erro ao devolver proposta para CADASTRADA. Verifique o console.');
                return;
              }

              await fetchData();
              alert(`Proposta ${prop.contrato || ''} devolvida com sucesso para o status CADASTRADA.`);
            }}
            onGenerateLot={async (corretor, ids) => {
              // 1. Validação de segurança: garantir que nenhuma proposta já pertença a outro lote ou esteja paga
              const selectedProposals = proposals.filter(p => ids.includes(p.id));
              const alreadyInLot = selectedProposals.filter(p => p.lote_id || p.status === 'PAGO');
              if (alreadyInLot.length > 0) {
                alert(`Não foi possível gerar o lote: algumas propostas já estão vinculadas a outro lote ou pagas.\nPropostas: ${alreadyInLot.map(p => p.contrato || p.cliente).join(', ')}`);
                await fetchData();
                return;
              }
              
              // 2. Cálculo preciso com alíquotas de imposto / retenção da corretora centralizado
              const totalValue = calculateLotTotalNet(selectedProposals, proposalRequirements);

              const code = `LOTE-${corretor.replace(/[^A-Z0-9]/ig, '').substring(0, 5).toUpperCase()}-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;
              
              const newLot: Omit<PaymentLot, 'id'> = {
                codigo: code,
                aprovadoPor: 'Aguardando',
                dataAprovacao: new Date().toISOString(),
                qtdPropostas: ids.length,
                vencimento: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Amanhã
                valorTotal: totalValue,
                status: 'PENDENTE'
              };

              // 3. Inserção do lote no Supabase com padrão atômico e compensação/rollback
              const { data: lotData, error: lotError } = await supabase.from('payment_lots').insert([newLot]).select();
              
              if (lotError || !lotData || lotData.length === 0) {
                console.error('Erro ao criar lote:', lotError);
                alert('Erro ao criar lote de pagamento. Verifique o console.');
                return;
              }

              const createdLotId = lotData[0].id;

              // 4. Vinculação das propostas ao lote gerado
              const { error: propError } = await supabase.from('proposals').update({ lote_id: createdLotId }).in('id', ids);
              
              if (propError) {
                console.error('Erro ao vincular propostas ao lote. Executando rollback/compensação imediata:', propError);
                // Rollback automático: exclui o lote órfão criado para manter integridade relacional
                await supabase.from('payment_lots').delete().eq('id', createdLotId);
                alert('Erro ao vincular propostas ao lote. A operação foi cancelada automaticamente para evitar inconsistências no banco.');
                await fetchData();
              } else {
                await fetchData();
                alert(`Lote ${code} gerado com sucesso para ${corretor} no valor líquido de R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}!`);
              }
            }}
            onReturnProposal={async (proposalId, lotId) => {
              const prop = proposals.find(p => p.id === proposalId);
              const lot = paymentLots.find(l => l.id === lotId);
              if (!prop || !lot) return;

              // 1. Desvincula a proposta e retorna ao status CADASTRADA
              const { error: propError } = await supabase.from('proposals').update({ status: 'CADASTRADA', lote_id: null }).eq('id', proposalId);
              if (propError) {
                 console.error('Erro ao devolver proposta:', propError);
                 alert('Erro ao devolver proposta. Verifique o console.');
                 return;
              }

              // 2. Recalcula o lote com as propostas restantes aplicando deduções de imposto idênticas
              const remainingProposals = proposals.filter(p => p.lote_id === lotId && p.id !== proposalId);
              if (remainingProposals.length === 0) {
                 await supabase.from('payment_lots').delete().eq('id', lotId);
              } else {
                 const newTotal = calculateLotTotalNet(remainingProposals, proposalRequirements);
                 await supabase.from('payment_lots').update({ 
                   qtdPropostas: remainingProposals.length, 
                   valorTotal: newTotal 
                 }).eq('id', lotId);
              }

              await fetchData();
              alert(`Proposta ${prop.contrato || ''} devolvida com sucesso para status CADASTRADA.`);
            }}
            onPay={async (id) => {
              const lot = paymentLots.find(l => l.id === id);
              if (!lot) return;

              const lotProps = proposals.filter(p => p.lote_id === id);

              // 1. Atualiza o lote para PAGO
              const { error: lotError } = await supabase.from('payment_lots').update({ 
                status: 'PAGO', 
                aprovadoPor: user?.login || 'Sistema', 
                dataAprovacao: new Date().toISOString() 
              }).eq('id', id);

              if (lotError) {
                console.error('Erro ao pagar lote:', lotError);
                alert('Erro ao processar liquidação do lote. Operação interrompida.');
                return;
              }

              // 2. Atualiza as propostas vinculadas para PAGO e sincroniza automaticamente a 1ª Parcela (Adiantamento)
              try {
                const updatePromises = lotProps.map(p => {
                  const updatedParcelasStatus = {
                    ...(p.parcelas_status || {}),
                    1: 'PAGO'
                  };
                  const updatedParcelasValores = {
                    ...(p.parcelas_valores || {}),
                    1: p.parcelas_valores?.[1] || Number(p.valor) || Number(p.comissao) || 0
                  };

                  const updatedHistorico = [
                    ...(p.detalhes?.historico || []),
                    {
                      id: Math.random().toString(36).substr(2, 9),
                      data: new Date().toISOString(),
                      responsavel: user?.login || 'Sistema',
                      observacao: `Adiantamento/1ª Parcela liquidada via Lote ${lot.codigo}.`
                    }
                  ];

                  const updatedDetalhes = {
                    ...(p.detalhes || {}),
                    parcelas_status: updatedParcelasStatus,
                    parcelas_valores: updatedParcelasValores,
                    historico: updatedHistorico
                  };

                  return supabase.from('proposals').update({
                    status: 'PAGO',
                    detalhes: updatedDetalhes
                  }).eq('id', p.id);
                });

                const results = await Promise.all(updatePromises);
                const hasError = results.some(r => r.error);
                if (hasError) {
                  console.warn('Aviso: Algumas propostas tiveram pendência ao salvar histórico ou parcelas.');
                }
              } catch (err) {
                console.error('Erro ao sincronizar parcelas das propostas no pagamento:', err);
              }

              // 3. Gerar transação automática em Contas a Pagar com idêntica descrição
              try {
                const newTransaction = {
                  type: 'PAGAR',
                  vencimento: lot.vencimento,
                  pagamento: new Date().toISOString().split('T')[0],
                  descricao: `PAGAMENTO COMISSÃO - ${lot.codigo}`,
                  valor: lot.valorTotal,
                  formaPagamento: 'PIX',
                  status: 'PAGO',
                  centroCusto: 'COMISSÕES',
                  subItem: 'CORRETORES',
                  conta: 'CAIXA'
                };
                await supabase.from('transactions').insert(newTransaction);
              } catch (err) {
                console.warn('Erro ao registrar lançamento em contas a pagar:', err);
              }

              await fetchData();
              alert(`Lote ${lot.codigo} liquidado com sucesso! A 1ª Parcela das propostas foi atualizada para PAGO.`);
            }}
            onReverseLot={async (lotId) => {
              const lot = paymentLots.find(l => l.id === lotId);
              if (!lot) return;

              try {
                // 1. Reverter todas as propostas associadas para status 'ENVIADA AO FINANCEIRO' e desvincular lote
                const { error: propError } = await supabase
                  .from('proposals')
                  .update({ status: 'ENVIADA AO FINANCEIRO', lote_id: null })
                  .eq('lote_id', lotId);

                if (propError) {
                  console.error('Erro ao reverter status das propostas:', propError);
                  alert('Erro ao desvincular propostas do lote: ' + propError.message);
                  return;
                }

                // 2. Remover lançamento financeiro de contas a pagar gerado automaticamente (se houver)
                await supabase
                  .from('transactions')
                  .delete()
                  .eq('descricao', `PAGAMENTO COMISSÃO - ${lot.codigo}`);

                // 3. Excluir o lote de pagamento
                const { error: lotError } = await supabase
                  .from('payment_lots')
                  .delete()
                  .eq('id', lotId);

                if (lotError) {
                  console.error('Erro ao excluir lote:', lotError);
                  alert('Erro ao excluir o lote: ' + lotError.message);
                } else {
                  await fetchData();
                  alert(`Lote ${lot.codigo} foi estornado com sucesso! As propostas retornaram para a fila "Aguardando Fechamento".`);
                }
              } catch (err: any) {
                console.error('Erro inesperado no estorno do lote:', err);
                alert('Erro ao estornar lote: ' + (err.message || 'Erro desconhecido.'));
              }
            }}
          />
        )}
        {activeTab === Tab.COMISSOES && user.permissions.comissoes && (
          <ComissoesModule 
            proposals={proposals} 
            onUpdateProposal={async (updated: Proposal) => {
              setProposals(prev => prev.map(p => p.id === updated.id ? updated : p));
              try {
                const updatedDetalhes = {
                  ...(updated.detalhes || {}),
                  parcelas_status: updated.parcelas_status,
                  parcelas_valores: updated.parcelas_valores,
                  parcelas_repassadas: updated.parcelas_repassadas
                };
                await supabase.from('proposals').update({
                  detalhes: updatedDetalhes
                }).eq('id', updated.id);
              } catch (err) {
                console.error('Erro ao sincronizar atualização de comissões/parcelas no Supabase:', err);
              }
            }} 
            requirements={proposalRequirements} 
          />
        )}
        {activeTab === Tab.ESTRUTURA_PROPOSTA && user.permissions.estruturaProposta && (
          <ProposalStructureView 
            requirements={proposalRequirements}
            onSave={async (req) => {
              const tempId = `req-${Date.now()}`;
              const newReq: ProposalRequirement = { id: tempId, ...req };
              setProposalRequirements(prev => [...prev, newReq]);

              try {
                const { data, error } = await supabase.from('proposal_requirements').insert([req]).select();
                if (error) {
                  console.warn('DB insert error (mantendo no estado local):', error);
                } else if (data && data[0]) {
                  setProposalRequirements(prev => prev.map(r => r.id === tempId ? data[0] : r));
                }
              } catch (e) {
                console.warn('DB connection notice:', e);
              }
              fetchData();
            }}
            onDelete={async (id) => {
              setProposalRequirements(prev => prev.filter(r => r.id !== id));
              try {
                const { error } = await supabase.from('proposal_requirements').delete().eq('id', id);
                if (error) {
                  console.warn('DB delete notice:', error);
                }
              } catch (e) {
                console.warn('DB delete error:', e);
              }
              fetchData();
            }}
          />
        )}
        {activeTab === Tab.PLAN_CREDENCIAS && user.permissions.planCredencias && (
          <CredentialsManager 
            users={appUsers} 
            currentUser={user}
            onUpdateUsers={async nu => { 
              setAppUsers(nu);
              try {
                localStorage.setItem('multiplan_app_users', JSON.stringify(nu));
              } catch (err) {
                console.warn('Error saving users to localStorage:', err);
              }

              // If current logged-in user's data was updated, sync active session user
              if (user) {
                const selfMatch = nu.find(u => (u.login || '').trim().toLowerCase() === (user.login || '').trim().toLowerCase());
                if (selfMatch) {
                  setUser(prev => prev ? ({ ...prev, ...selfMatch }) : prev);
                }
              }

              const deletedUsers = appUsers.filter(u => !nu.some(item => (item.login || '').trim().toLowerCase() === (u.login || '').trim().toLowerCase()));
              
              try {
                const rawDel = localStorage.getItem('multiplan_deleted_users');
                let delList: string[] = rawDel ? JSON.parse(rawDel) : [];

                // Remove anyone currently in nu from the deleted list
                const nuKeys = new Set(nu.flatMap(u => [(u.login || '').trim().toLowerCase(), (u.email || '').trim().toLowerCase()]).filter(Boolean));
                delList = delList.filter(k => !nuKeys.has(k));

                if (deletedUsers.length > 0) {
                  for (const du of deletedUsers) {
                    const k = (du.login || '').trim().toLowerCase();
                    if (k && !delList.includes(k)) {
                      delList.push(k);
                    }
                  }
                }
                localStorage.setItem('multiplan_deleted_users', JSON.stringify(delList));
              } catch (e) {
                console.warn('Error updating deleted users cache:', e);
              }

              for (const du of deletedUsers) {
                try {
                  await supabase.from('users').delete().eq('login', du.login);
                  if (du.email) {
                    await supabase.from('profiles').delete().eq('email', du.email);
                  }
                } catch (e) {
                  console.warn('Error deleting user:', e);
                }
              }
              for (const u of nu) { 
                try {
                  // Tabela users possui estritamente as colunas: login, senha, email, permissions, approved
                  await supabase.from('users').upsert({
                    login: u.login,
                    senha: u.senha || '123456',
                    email: u.email || '',
                    approved: u.approved !== false ? 'true' : 'false',
                    permissions: u.permissions || {}
                  }, { onConflict: 'login' });

                  if (u.id || u.email) {
                    const validRole = ['admin', 'cadastro_propostas', 'pagamento_comissoes', 'corretor'].includes(u.role || '') 
                      ? u.role 
                      : ((u.cargo || '').toLowerCase().includes('corretor') ? 'corretor' : 'admin');

                    const profilePayload: any = {
                      login: u.login,
                      role: validRole,
                      approved: u.approved !== false,
                      permissions: u.permissions || {}
                    };
                    if (u.email) profilePayload.email = u.email;
                    
                    if (u.id && !u.id.startsWith('usr_')) {
                      await supabase.from('profiles').upsert({ id: u.id, ...profilePayload }, { onConflict: 'id' });
                    } else if (u.email) {
                      await supabase.from('profiles').update(profilePayload).eq('email', u.email);
                    }
                  }
                } catch (e) {
                  console.warn('Error upserting user to DB:', e);
                }
              } 
            }} 
          />
        )}
        {activeTab === Tab.COTACAO && (
          <PlanQuoteView 
            requirements={proposalRequirements} 
            user={user!}
            savedCotacoes={savedCotacoes}
            onSaveCotacao={async (newCotacao) => {
              setSavedCotacoes(prev => {
                const next = [newCotacao, ...prev];
                localStorage.setItem('multiplan_saved_cotacoes', JSON.stringify(next));
                return next;
              });
              try {
                await supabase.from('cotacoes').insert([{
                  cliente_nome: newCotacao.clienteNome,
                  cidade: newCotacao.cidade,
                  uf: newCotacao.uf,
                  total_vidas: newCotacao.totalVidas,
                  valor_total: newCotacao.totalMensalEstimado,
                  operadoras: newCotacao.operadoras,
                  tipos_plano: newCotacao.tiposPlano,
                  criado_por: user?.login || 'Corretor',
                  detalhes_json: {
                    vidasPorFaixa: newCotacao.vidasPorFaixa,
                    ...newCotacao.detalhes
                  }
                }]);
              } catch (err) {
                console.warn('Could not insert cotacao into supabase, saved locally', err);
              }
            }}
            onDeleteCotacao={async (id) => {
              setSavedCotacoes(prev => {
                const next = prev.filter(c => c.id !== id);
                localStorage.setItem('multiplan_saved_cotacoes', JSON.stringify(next));
                return next;
              });
              try {
                await supabase.from('cotacoes').delete().eq('id', id);
              } catch (err) {
                console.warn('Could not delete cotacao from supabase', err);
              }
            }}
          />
        )}
      </div>

      <ProposalModal 
        isOpen={isProposalModalOpen} 
        onClose={() => {
          setIsProposalModalOpen(false);
          setEditingProposal(null);
        }} 
        requirements={proposalRequirements}
        proposal={editingProposal}
        user={user!}
        onSave={async (proposalData) => {
          await handleSaveProposal(proposalData);
          setIsProposalModalOpen(false);
          setEditingProposal(null);
        }}
      />

      <ModalSolicitarAcesso
        isOpen={isSolicitarAcessoGlobalOpen}
        onClose={() => setIsSolicitarAcessoGlobalOpen(false)}
        currentUser={user || undefined}
        onSuccess={() => {
          alert('Solicitação interna enviada com sucesso! O Administrador analisará e liberará o acesso na aba de Credenciais.');
        }}
      />
    </Layout>
  );
};

export default App;
