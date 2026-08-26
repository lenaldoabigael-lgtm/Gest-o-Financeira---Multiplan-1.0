
import React, { useState, useEffect, useMemo } from 'react';
import { User, Tab, Transaction, CostCenter, Proposal, ProposalRequirement, PaymentLot } from './types';
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
import { supabase } from './lib/supabase';

const DEFAULT_USERS: User[] = [
  {
    login: 'admin',
    senha: 'Davi2017',
    email: 'Lenaldo.abigael@hotmail.com',
    approved: true,
    permissions: {
      centroCusto: true, contasPagar: true, contasReceber: true,
      dashboard: true, fluxoCaixa: true, detalhes: true, planCredencias: true,
      gestaoDemandas: true, propostas: true, financeiro: true, estruturaProposta: true, comissoes: true
    }
  },
  {
    login: 'admin2',
    senha: '123',
    email: 'admin2@gmail.com',
    approved: true,
    permissions: {
      centroCusto: false, contasPagar: false, contasReceber: false,
      dashboard: true, fluxoCaixa: false, detalhes: false, planCredencias: false,
      gestaoDemandas: false, propostas: false, financeiro: false, estruturaProposta: false, comissoes: false
    }
  },
  {
    login: 'Gestor',
    senha: '123',
    email: 'Gestor@gmail.com',
    approved: true,
    permissions: {
      centroCusto: false, contasPagar: false, contasReceber: false,
      dashboard: false, fluxoCaixa: false, detalhes: false, planCredencias: false,
      gestaoDemandas: true, propostas: false, financeiro: true, estruturaProposta: false, comissoes: false
    }
  },
  {
    login: 'Renan Rodrigues',
    senha: 'a1b2c3',
    email: 'Renan.Rodrigues@multiplan.com',
    approved: false,
    permissions: {
      centroCusto: false, contasPagar: false, contasReceber: false,
      dashboard: false, fluxoCaixa: false, detalhes: false, planCredencias: false,
      gestaoDemandas: true, propostas: true, financeiro: false, estruturaProposta: false, comissoes: false
    }
  },
  {
    login: 'Rodrigo.Mendes',
    senha: '123456',
    email: 'Rodrigo.Mendes@Gmail.com',
    approved: false,
    permissions: {
      centroCusto: true, contasPagar: true, contasReceber: true,
      dashboard: true, fluxoCaixa: true, detalhes: true, planCredencias: false,
      gestaoDemandas: true, propostas: true, financeiro: true, estruturaProposta: true, comissoes: true
    }
  }
];

const mergeWithDefaultUsers = (dbUsers: User[] = []): User[] => {
  const merged = [...dbUsers];
  for (const defUser of DEFAULT_USERS) {
    const exists = merged.some(u => (u.login || '').trim().toLowerCase() === defUser.login.toLowerCase());
    if (!exists) {
      merged.push(defUser);
    }
  }
  return merged;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [paymentLots, setPaymentLots] = useState<PaymentLot[]>([]);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [appUsers, setAppUsers] = useState<User[]>(DEFAULT_USERS);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [proposalRequirements, setProposalRequirements] = useState<ProposalRequirement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorType, setErrorType] = useState<'SCHEMA_HIDDEN' | 'TABLES_MISSING' | null>(null);
  const [activeAccount, setActiveAccount] = useState<string>('TODAS');

  const getDefaultPermissionsForRole = (role?: string) => {
    if (role === 'admin') {
      return {
        centroCusto: true, contasPagar: true, contasReceber: true,
        dashboard: true, fluxoCaixa: true, detalhes: true, planCredencias: true,
        gestaoDemandas: true, propostas: true, financeiro: true, estruturaProposta: true, comissoes: true
      };
    }
    if (role === 'cadastro_propostas') {
      return {
        centroCusto: false, contasPagar: false, contasReceber: false,
        dashboard: false, fluxoCaixa: false, detalhes: false, planCredencias: false,
        gestaoDemandas: true, propostas: true, financeiro: false, estruturaProposta: false, comissoes: false
      };
    }
    if (role === 'pagamento_comissoes') {
      return {
        centroCusto: false, contasPagar: false, contasReceber: false,
        dashboard: false, fluxoCaixa: false, detalhes: false, planCredencias: false,
        gestaoDemandas: false, propostas: true, financeiro: true, estruturaProposta: false, comissoes: true
      };
    }
    if (role === 'corretor') {
      return {
        centroCusto: false, contasPagar: false, contasReceber: false,
        dashboard: false, fluxoCaixa: false, detalhes: false, planCredencias: false,
        gestaoDemandas: false, propostas: true, financeiro: false, estruturaProposta: false, comissoes: true
      };
    }
    return {
      centroCusto: false, contasPagar: false, contasReceber: false,
      dashboard: false, fluxoCaixa: false, detalhes: false, planCredencias: false,
      gestaoDemandas: false, propostas: false, financeiro: false, estruturaProposta: false, comissoes: false
    };
  };

  const fetchData = async () => {
    setIsLoading(true);
    setErrorType(null);
    try {
      const [transactionsRes, costCentersRes, proposalsRes, requirementsRes, lotsRes, usersRes] = await Promise.all([
        supabase.from('transactions').select('*').order('vencimento', { ascending: false }),
        supabase.from('cost_centers').select('*').order('nome'),
        supabase.from('proposals').select('*').order('data', { ascending: false }),
        supabase.from('proposal_requirements').select('*').order('nome'),
        supabase.from('payment_lots').select('*').order('dataAprovacao', { ascending: false }),
        supabase.from('users').select('*')
      ]);

      if (usersRes.data) {
        setAppUsers(mergeWithDefaultUsers(usersRes.data as User[]));
      } else {
        setAppUsers(mergeWithDefaultUsers([]));
      }

      if (transactionsRes.data) setTransactions(transactionsRes.data);
      if (proposalsRes.data) {
        setProposals(proposalsRes.data);
      } else if (!proposalsRes.error) {
        const mockProposals: Proposal[] = [
          { id: '1', contrato: '6GTLW', data: '2026-04-20', cliente: 'EDILMA SANTOS BOMFIM BISPO', cpfCnpj: '015.070.045-83', corretor: 'Anny', operadora: 'Hapvida', categoria: 'Saúde-PME', valor: 1566.62, vidas: 4, status: 'CADASTRADA', comissao: 783.31 },
          { id: '2', contrato: 'GPLRG', data: '2026-04-20', cliente: 'T.F.S. SILVA FARMACIA', cpfCnpj: '12.345.678/0001-90', corretor: 'Michele', operadora: 'Hapvida', categoria: 'Saúde-PME', valor: 2379.28, vidas: 6, status: 'CADASTRADA', comissao: 1189.64 },
          { id: '3', contrato: 'HXRYU', data: '2026-04-21', cliente: 'JOAO SILVA', cpfCnpj: '111.222.333-44', corretor: 'Luiza', operadora: 'Amil', categoria: 'Direto', valor: 326.37, vidas: 2, status: 'CADASTRADA', comissao: 163.18 },
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
      if (lotsRes.data) {
        setPaymentLots(lotsRes.data);
      } else if (!lotsRes.error) {
        const mockLots: PaymentLot[] = [
          { id: '1', codigo: 'LOTE-2603-042', aprovadoPor: 'Arley (Gestor)', dataAprovacao: '16/03/2026 às 14:30', qtdPropostas: 2, vencimento: '17/03/2026', valorTotal: 946.49, status: 'PENDENTE' },
          { id: '2', codigo: 'LOTE-2603-041', aprovadoPor: 'João (Gestor)', dataAprovacao: '15/03/2026 às 16:15', qtdPropostas: 5, vencimento: 'Hoje', valorTotal: 3946.01, status: 'PENDENTE' },
        ];
        setPaymentLots(mockLots);
      }
    } catch (error) {
      console.error('Erro crítico:', error);
      setErrorType('TABLES_MISSING');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const restoreSession = async () => {
      setIsLoading(true);
      const savedLogin = localStorage.getItem('sis_login');
      const savedPass = localStorage.getItem('sis_pass');

      const { data: usersData } = await supabase.from('users').select('*');
      const currentUsers = mergeWithDefaultUsers((usersData || []) as User[]);
      setAppUsers(currentUsers);

      if (savedLogin && savedPass) {
        const cleanSavedLogin = savedLogin.trim().toLowerCase();
        const cleanSavedPass = savedPass.trim();

        const foundUser = currentUsers.find(u => {
          const uLogin = (u.login || '').trim().toLowerCase();
          const uEmail = (u.email || '').trim().toLowerCase();
          return (uLogin === cleanSavedLogin || uEmail === cleanSavedLogin) && (u.senha || '').trim() === cleanSavedPass;
        });

        if (foundUser && foundUser.approved !== false && String(foundUser.approved) !== 'false') {
          let userPerms = foundUser.permissions || {
            centroCusto: false, contasPagar: false, contasReceber: false,
            dashboard: false, fluxoCaixa: false, detalhes: false, planCredencias: false,
            gestaoDemandas: false, propostas: false, financeiro: false, estruturaProposta: false, comissoes: false
          };
          if (foundUser.login === 'admin') {
            userPerms = {
              centroCusto: true, contasPagar: true, contasReceber: true,
              dashboard: true, fluxoCaixa: true, detalhes: true, planCredencias: true,
              gestaoDemandas: true, propostas: true, financeiro: true, estruturaProposta: true, comissoes: true
            };
          }
          const appUser: User = { ...foundUser, permissions: userPerms };
          setUser(appUser);
          await fetchData();

          const tabs = [
            { id: Tab.DASHBOARD, permission: appUser.permissions.dashboard },
            { id: Tab.CONTAS_PAGAR, permission: appUser.permissions.contasPagar },
            { id: Tab.CONTAS_RECEBER, permission: appUser.permissions.contasReceber },
            { id: Tab.FLUXO_CAIXA, permission: appUser.permissions.fluxoCaixa },
            { id: Tab.CENTRO_CUSTO, permission: appUser.permissions.centroCusto },
            { id: Tab.ESTRUTURA_PROPOSTA, permission: appUser.permissions.estruturaProposta },
            { id: Tab.DETALHES, permission: appUser.permissions.detalhes },
            { id: Tab.PROPOSTAS, permission: appUser.permissions.propostas },
            { id: Tab.ACOMPANHAMENTO, permission: appUser.permissions.gestaoDemandas },
            { id: Tab.FINANCEIRO, permission: appUser.permissions.financeiro },
            { id: Tab.COMISSOES, permission: appUser.permissions.comissoes },
            { id: Tab.PLAN_CREDENCIAS, permission: appUser.permissions.planCredencias },
          ];

          const savedTab = localStorage.getItem('sis_activeTab') as Tab | null;
          if (savedTab && tabs.find(t => t.id === savedTab)?.permission) {
            setActiveTab(savedTab);
          } else {
            setActiveTab(tabs.find(t => t.permission)?.id || null);
          }
        }
      }
      setIsLoading(false);
    };

    restoreSession();
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
      const cleanInput = emailOrLogin.trim().toLowerCase();
      const cleanPass = pass.trim();

      const { data: usersData } = await supabase.from('users').select('*');
      const currentUsers = mergeWithDefaultUsers((usersData || []) as User[]);
      setAppUsers(currentUsers);

      const foundUser = currentUsers.find(u => {
        const uLogin = (u.login || '').trim().toLowerCase();
        const uEmail = (u.email || '').trim().toLowerCase();
        return (uLogin === cleanInput || uEmail === cleanInput) && (u.senha || '').trim() === cleanPass;
      });

      if (!foundUser) {
        setIsLoading(false);
        return false;
      }

      if (foundUser.approved === false || String(foundUser.approved) === 'false') {
        setIsLoading(false);
        alert('Sua solicitação de acesso está aguardando aprovação do administrador.');
        return false;
      }

      let userPerms = foundUser.permissions || {
        centroCusto: false, contasPagar: false, contasReceber: false,
        dashboard: false, fluxoCaixa: false, detalhes: false, planCredencias: false,
        gestaoDemandas: false, propostas: false, financeiro: false, estruturaProposta: false, comissoes: false
      };

      if (foundUser.login === 'admin') {
        userPerms = {
          centroCusto: true, contasPagar: true, contasReceber: true,
          dashboard: true, fluxoCaixa: true, detalhes: true, planCredencias: true,
          gestaoDemandas: true, propostas: true, financeiro: true, estruturaProposta: true, comissoes: true
        };
      }

      const appUser: User = { ...foundUser, permissions: userPerms };
      setUser(appUser);
      localStorage.setItem('sis_login', appUser.login);
      localStorage.setItem('sis_pass', appUser.senha || '');

      await fetchData();

      const tabs = [
        { id: Tab.DASHBOARD, permission: appUser.permissions.dashboard },
        { id: Tab.CONTAS_PAGAR, permission: appUser.permissions.contasPagar },
        { id: Tab.CONTAS_RECEBER, permission: appUser.permissions.contasReceber },
        { id: Tab.FLUXO_CAIXA, permission: appUser.permissions.fluxoCaixa },
        { id: Tab.CENTRO_CUSTO, permission: appUser.permissions.centroCusto },
        { id: Tab.ESTRUTURA_PROPOSTA, permission: appUser.permissions.estruturaProposta },
        { id: Tab.DETALHES, permission: appUser.permissions.detalhes },
        { id: Tab.PROPOSTAS, permission: appUser.permissions.propostas },
        { id: Tab.ACOMPANHAMENTO, permission: appUser.permissions.gestaoDemandas },
        { id: Tab.FINANCEIRO, permission: appUser.permissions.financeiro },
        { id: Tab.COMISSOES, permission: appUser.permissions.comissoes },
        { id: Tab.PLAN_CREDENCIAS, permission: appUser.permissions.planCredencias },
      ];

      const savedTab = localStorage.getItem('sis_activeTab') as Tab | null;
      if (savedTab && tabs.find(t => t.id === savedTab)?.permission) {
        setActiveTab(savedTab);
      } else {
        setActiveTab(tabs.find(t => t.permission)?.id || null);
      }

      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Erro de login:', err);
      setIsLoading(false);
      return false;
    }
  };

  const handleRegister = async (login: string, email: string, pass: string): Promise<boolean> => {
    const cleanLogin = login.trim();
    const cleanEmail = email.trim();
    
    // Check if user already exists
    const existing = appUsers.find(u => 
      (u.login && u.login.trim().toLowerCase() === cleanLogin.toLowerCase()) ||
      (cleanEmail && u.email && u.email.trim().toLowerCase() === cleanEmail.toLowerCase())
    );
    if (existing) {
      alert('Este login ou e-mail já está cadastrado no sistema.');
      return false;
    }

    const newUser: User = {
      login: cleanLogin,
      senha: pass,
      email: cleanEmail,
      approved: false,
      permissions: {
        centroCusto: false, contasPagar: false, contasReceber: false,
        dashboard: false, fluxoCaixa: false, detalhes: false, planCredencias: false,
        gestaoDemandas: false, propostas: false, financeiro: false, estruturaProposta: false, comissoes: false
      }
    };

    try {
      await supabase.from('users').insert([newUser]);
    } catch (e) {
      console.warn('DB insert notice:', e);
    }

    setAppUsers(prev => [...prev, newUser]);
    alert('Sua solicitação foi enviada com sucesso! Aguarde a aprovação do administrador.');
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

/* 2. ATUALIZAR TABELAS EXISTENTES */
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS detalhes JSONB;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS lote_id UUID;

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

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-blue-900 gap-4">
      <i className="fa-solid fa-circle-notch fa-spin text-4xl"></i>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Sincronizando Multiplan...</span>
    </div>
  );

  if (!user) return <Login onLogin={handleLogin} onRegister={handleRegister} />;

  return (
    <Layout 
      user={user} 
      activeTab={activeTab} 
      setActiveTab={(tab) => {
        setActiveTab(tab);
        if (tab) localStorage.setItem('sis_activeTab', tab);
      }} 
      onLogout={async () => {
        await supabase.auth.signOut();
        setUser(null);
        setActiveTab(null);
        setTransactions([]);
        setProposals([]);
        setPaymentLots([]);
        setCostCenters([]);
        setProposalRequirements([]);
        localStorage.removeItem('sis_activeTab');
        localStorage.removeItem('sis_login');
        localStorage.removeItem('sis_pass');
      }}
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
          if (cc.id) payload.id = cc.id;
          const { error } = await supabase.from('cost_centers').upsert(payload); 
          if (error) {
            console.error('Erro ao salvar centro de custo:', error);
            alert('Erro ao salvar centro de custo. Verifique o console.');
          } else {
            fetchData(); 
          }
        }} onDelete={async id => { 
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
              const uniqueImported = importedProposals.filter(importada => 
                !proposals.some(p => p.contrato.trim() === importada.contrato.trim())
              );

              const duplicadasCount = importedProposals.length - uniqueImported.length;

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
            onStatusChange={async (id, novoStatus) => {
              if (novoStatus === 'ENVIADA AO FINANCEIRO') {
                const p = proposals.find(p => p.id === id);
                if (p && (!p.vidas || p.vidas === 0)) {
                  alert('Não é possível enviar propostas com 0 vidas para o financeiro.');
                  return;
                }
              }
              const { error } = await supabase.from('proposals').update({ status: novoStatus }).eq('id', id);
              if (error) {
                console.error('Erro ao atualizar status:', error);
                alert('Erro ao atualizar status da proposta.');
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
            onGenerateLot={async (corretor, ids) => {
              const selectedProposals = proposals.filter(p => ids.includes(p.id));
              
              const impostos = proposalRequirements.filter(r => r.tipo === 'IMPOSTO_CORRETOR');
              const totalValue = selectedProposals.reduce((acc, p) => {
                const comissaoBase = Number(p.comissao || 0);
                const corretor = p.corretor.toUpperCase();
                const operadora = p.operadora.toUpperCase();
                const tipoPlano = (p.detalhes?.proposta?.tipoPlano || '').toUpperCase();
                
                const baseSearch = [
                  `${corretor} - ${operadora}`,
                  `TODOS - ${operadora}`,
                  `${corretor} - TODAS`,
                  `TODOS - TODAS`
                ];
                
                let pctStr;
                for (const base of baseSearch) {
                  pctStr = impostos.find(r => r.nome.startsWith(`${base} - ${tipoPlano} - `)) ||
                           impostos.find(r => r.nome.startsWith(`${base} - TODOS OS TIPOS - `)) ||
                           impostos.find(r => r.nome.startsWith(`${base} - TODOS - `)) ||
                           impostos.find(r => r.nome.split(' - ').length === 3 && r.nome.startsWith(`${base} - `));
                  if (pctStr) break;
                }
                
                let txPercentual = 0;
                if (pctStr) {
                  const parts = pctStr.nome.split(' - ');
                  txPercentual = parseFloat(parts[parts.length - 1]) || 0;
                }

                const desconto = Number((comissaoBase * (txPercentual / 100)).toFixed(2));
                const liquido = comissaoBase - desconto;
                return acc + liquido;
              }, 0);

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

              const { data: lotData, error: lotError } = await supabase.from('payment_lots').insert([newLot]).select();
              
              if (lotError) {
                console.error('Erro ao criar lote:', lotError);
                alert('Erro ao criar lote de pagamento. Verifique o console.');
                return;
              } else if (lotData && lotData.length > 0) {
                const createdLotId = lotData[0].id;
                const { error: propError } = await supabase.from('proposals').update({ lote_id: createdLotId }).in('id', ids);
                
                if (propError) {
                  console.error('Erro ao atualizar propostas:', propError);
                  alert('Erro ao vincular propostas ao lote. Verifique o console.');
                } else {
                  await fetchData();
                  alert(`Lote gerado para ${corretor}: ${code}`);
                }
              }
            }}
            onReturnProposal={async (proposalId, lotId) => {
              const prop = proposals.find(p => p.id === proposalId);
              const lot = paymentLots.find(l => l.id === lotId);
              if (!prop || !lot) return;

              const { error: propError } = await supabase.from('proposals').update({ status: 'CADASTRADA', lote_id: null }).eq('id', proposalId);
              if (propError) {
                 alert('Erro ao devolver proposta. Verifique o console.');
                 return;
              }

              const remainingProposals = proposals.filter(p => p.lote_id === lotId && p.id !== proposalId);
              if (remainingProposals.length === 0) {
                 await supabase.from('payment_lots').delete().eq('id', lotId);
              } else {
                 const newTotal = remainingProposals.reduce((a, b) => a + Number(b.comissao), 0);
                 await supabase.from('payment_lots').update({ qtdPropostas: remainingProposals.length, valorTotal: newTotal }).eq('id', lotId);
              }

              await fetchData();
              alert(`Proposta ${prop.contrato || ''} devolvida com sucesso para status Cadastrada.`);
            }}
            onPay={async (id) => {
              const lot = paymentLots.find(l => l.id === id);
              const { error } = await supabase.from('payment_lots').update({ 
                status: 'PAGO', 
                aprovadoPor: user?.login || 'Sistema', 
                dataAprovacao: new Date().toISOString() 
              }).eq('id', id);
              if (error) {
                console.error('Erro ao pagar lote:', error);
                alert('Erro ao pagar lote. Verifique o console.');
              } else {
                // Atualiza as propostas vinculadas ao lote para PAGO
                const { error: propError } = await supabase.from('proposals').update({ status: 'PAGO' }).eq('lote_id', id);
                if (propError) {
                  console.error('Erro ao atualizar status das propostas para PAGO:', propError);
                  alert('Aviso: Lote pago, mas houve erro ao atualizar as propostas vinculadas.');
                }
                
                // Gerar transação automática em Contas a Pagar
                if (lot) {
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
                }
                
                fetchData();
              }
            }}
          />
        )}
        {activeTab === Tab.COMISSOES && user.permissions.comissoes && <ComissoesModule proposals={proposals} onUpdateProposal={(updated: Proposal) => setProposals(proposals.map(p => p.id === updated.id ? updated : p))} requirements={proposalRequirements} />}
        {activeTab === Tab.ESTRUTURA_PROPOSTA && user.permissions.estruturaProposta && (
          <ProposalStructureView 
            requirements={proposalRequirements}
            onSave={async (req) => {
              const { error } = await supabase.from('proposal_requirements').insert([req]);
              if (error) {
                console.error('Erro ao salvar requisito:', error);
                alert('Erro ao salvar requisito. Verifique o console.');
              } else {
                fetchData();
              }
            }}
            onDelete={async (id) => {
              const { error } = await supabase.from('proposal_requirements').delete().eq('id', id);
              if (error) {
                console.error('Erro ao excluir requisito:', error);
                alert('Erro ao excluir requisito. Verifique o console.');
              } else {
                fetchData();
              }
            }}
          />
        )}
        {activeTab === Tab.PLAN_CREDENCIAS && user.permissions.planCredencias && (
          <CredentialsManager 
            users={appUsers} 
            onUpdateUsers={async nu => { 
              setAppUsers(nu);
              const deletedUsers = appUsers.filter(u => !nu.some(item => item.login === u.login));
              for (const du of deletedUsers) {
                try {
                  await supabase.from('users').delete().eq('login', du.login);
                } catch (e) {
                  console.warn('Error deleting user:', e);
                }
              }
              for (const u of nu) { 
                try {
                  await supabase.from('users').upsert({
                    login: u.login,
                    senha: u.senha,
                    email: u.email,
                    approved: u.approved !== false,
                    permissions: u.permissions
                  }); 
                } catch (e) {
                  console.warn('Error upserting user:', e);
                }
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
          const contratoNumber = proposalData.contrato.trim();
          const isContratoDuplicado = proposals.some(
            p => p.contrato.trim() === contratoNumber && p.id !== editingProposal?.id
          );

          if (isContratoDuplicado) {
            alert(`Já existe uma proposta cadastrada com o contrato ${contratoNumber}. Não é permitido cadastrar propostas duplicadas.`);
            return;
          }

          if (editingProposal) {
            // Regra Crítica: Não permitir voltar status ou alterar se estiver PAGO
            if (editingProposal.status === 'PAGO') {
              alert('Propostas com status PAGO não podem ser alteradas.');
              return;
            }
            if (editingProposal.status === 'ENVIADA AO FINANCEIRO' && proposalData.status === 'CADASTRADA') {
              proposalData.status = 'ENVIADA AO FINANCEIRO';
            }

            const { error } = await supabase.from('proposals').update(proposalData).eq('id', editingProposal.id);
            if (error) {
              console.error('Erro ao atualizar proposta:', error);
              alert('Erro ao atualizar proposta no Supabase: ' + (error.message || 'Verifique o console.'));
            } else {
              fetchData();
            }
          } else {
            // Se não veio como "ENVIADA AO FINANCEIRO" (via cartão), força CADASTRADA
            if (proposalData.status !== 'ENVIADA AO FINANCEIRO') {
              proposalData.status = 'CADASTRADA';
            }
            
            const { error } = await supabase.from('proposals').insert([proposalData]);
            if (error) {
              console.error('Erro ao salvar proposta:', error);
              alert('Erro ao salvar proposta no Supabase: ' + (error.message || 'Verifique o console e o RLS da tabela proposals.'));
            } else {
              fetchData();
            }
          }
        }}
      />
    </Layout>
  );
};

export default App;
