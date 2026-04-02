
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
import ManagerArea from './components/ManagerArea';
import ProposalModal from './components/ProposalModal';
import FinanceView from './components/FinanceView';
import ProposalStructureView from './components/ProposalStructureView';
import ComissoesModule from './components/ComissoesModule';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [paymentLots, setPaymentLots] = useState<PaymentLot[]>([]);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [appUsers, setAppUsers] = useState<User[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [proposalRequirements, setProposalRequirements] = useState<ProposalRequirement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorType, setErrorType] = useState<'SCHEMA_HIDDEN' | 'TABLES_MISSING' | null>(null);
  const [activeAccount, setActiveAccount] = useState<string>('TODAS');

  const fetchData = async () => {
    setIsLoading(true);
    setErrorType(null);
    try {
      const { data: usersData, error: uErr, status } = await supabase.from('users').select('*');
      
      if (uErr) {
        console.error("Erro Supabase:", uErr);
        if (uErr.code === 'PGRST106' || uErr.message.includes('Invalid schema')) {
          setErrorType('SCHEMA_HIDDEN');
          setIsLoading(false);
          return;
        }
        if (uErr.code === '42P01' || status === 406) {
          setErrorType('TABLES_MISSING');
          setIsLoading(false);
          return;
        }
      }

      const [transactionsRes, costCentersRes, proposalsRes, requirementsRes, lotsRes] = await Promise.all([
        supabase.from('transactions').select('*').order('vencimento', { ascending: false }),
        supabase.from('cost_centers').select('*').order('nome'),
        supabase.from('proposals').select('*').order('data', { ascending: false }),
        supabase.from('proposal_requirements').select('*').order('nome'),
        supabase.from('payment_lots').select('*').order('dataAprovacao', { ascending: false })
      ]);

      // Check if any table is missing
      const anyMissing = [transactionsRes, costCentersRes, proposalsRes, requirementsRes, lotsRes].some(
        res => res.error && res.error.code === '42P01'
      );

      if (anyMissing) {
        setErrorType('TABLES_MISSING');
        setIsLoading(false);
        return;
      }

      // Check if proposals table is missing lote_id column
      const { error: colError } = await supabase.from('proposals').select('lote_id').limit(1);
      if (colError) {
        setErrorType('TABLES_MISSING');
        setIsLoading(false);
        return;
      }

      let currentUsers = (usersData || []) as User[];
      const adminUser = currentUsers.find(u => u.login === 'admin');
      
      if (!adminUser && !uErr) {
        const newAdmin: User = {
          login: 'admin',
          senha: '123',
          email: 'admin@multiplan.com',
          approved: true,
          permissions: {
            centroCusto: true, contasPagar: true, contasReceber: true,
            dashboard: true, fluxoCaixa: true, detalhes: true, planCredencias: true,
            gestaoDemandas: true, propostas: true, financeiro: true, estruturaProposta: true, comissoes: true
          }
        };
        await supabase.from('users').insert(newAdmin);
        currentUsers = [...currentUsers, newAdmin];
      } else if (adminUser && adminUser.permissions.comissoes === undefined) {
        // Patch existing admin to have comissoes permission
        const updatedAdmin = {
          ...adminUser,
          permissions: { ...adminUser.permissions, comissoes: true }
        };
        await supabase.from('users').update({ permissions: updatedAdmin.permissions }).eq('login', 'admin');
        currentUsers = currentUsers.map(u => u.login === 'admin' ? updatedAdmin : u);
      }

      setAppUsers(currentUsers);
      if (transactionsRes.data) setTransactions(transactionsRes.data);
      if (proposalsRes.data) {
        setProposals(proposalsRes.data);
      } else if (!proposalsRes.error) {
        // Mock data if table is empty but exists
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
        // Mock data if table is empty but exists
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
    fetchData();
  }, []);

  const accounts = useMemo(() => {
    const unique = Array.from(new Set(transactions.map(t => t.conta || 'GERAL')));
    return ['TODAS', ...unique.sort()];
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (activeAccount === 'TODAS') return transactions;
    return transactions.filter(t => (t.conta || 'GERAL') === activeAccount);
  }, [transactions, activeAccount]);

  const handleLogin = (login: string, pass: string) => {
    const foundUser = appUsers.find(u => u.login === login && u.senha === pass);
    if (foundUser) {
      if (foundUser.approved === false) {
        alert('Sua solicitação de acesso está aguardando aprovação do administrador.');
        return;
      }
      setUser(foundUser);
      
      const tabs = [
        { id: Tab.DASHBOARD, permission: foundUser.permissions.dashboard },
        { id: Tab.CONTAS_PAGAR, permission: foundUser.permissions.contasPagar },
        { id: Tab.CONTAS_RECEBER, permission: foundUser.permissions.contasReceber },
        { id: Tab.FLUXO_CAIXA, permission: foundUser.permissions.fluxoCaixa },
        { id: Tab.CENTRO_CUSTO, permission: foundUser.permissions.centroCusto },
        { id: Tab.ESTRUTURA_PROPOSTA, permission: foundUser.permissions.estruturaProposta },
        { id: Tab.DETALHES, permission: foundUser.permissions.detalhes },
        { id: Tab.PROPOSTAS, permission: foundUser.permissions.propostas },
        { id: Tab.GESTAO_DEMANDAS, permission: foundUser.permissions.gestaoDemandas },
        { id: Tab.FINANCEIRO, permission: foundUser.permissions.financeiro },
        { id: Tab.COMISSOES, permission: foundUser.permissions.comissoes },
        { id: Tab.PLAN_CREDENCIAS, permission: foundUser.permissions.planCredencias },
      ];
      
      const firstAllowedTab = tabs.find(t => t.permission)?.id || null;
      setActiveTab(firstAllowedTab);
    } else {
      alert('Login ou senha inválidos!');
    }
  };

  const handleRegister = async (login: string, email: string, pass: string) => {
    const newUser: User = {
      login, senha: pass, email,
      approved: false,
      permissions: { 
        centroCusto: false, contasPagar: false, contasReceber: false, 
        dashboard: false, fluxoCaixa: false, detalhes: false, 
        planCredencias: false, gestaoDemandas: false, propostas: false,
        financeiro: false, estruturaProposta: false, comissoes: false
      }
    };
    const { error } = await supabase.from('users').insert(newUser);
    if (error) {
      alert('Erro ao solicitar acesso. Este login já pode existir.');
      return false;
    }
    await fetchData();
    alert('Sua solicitação foi enviada com sucesso! Aguarde a aprovação do administrador.');
    return true;
  };

  const showAccountFilter = useMemo(() => {
    return activeTab !== null &&
           activeTab !== Tab.CENTRO_CUSTO && 
           activeTab !== Tab.PLAN_CREDENCIAS && 
           activeTab !== Tab.PROPOSTAS && 
           activeTab !== Tab.GESTAO_DEMANDAS &&
           activeTab !== Tab.ESTRUTURA_PROPOSTA &&
           activeTab !== Tab.FINANCEIRO &&
           activeTab !== Tab.COMISSOES;
  }, [activeTab]);

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
    <Layout user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => setUser(null)}>
      {showAccountFilter && (
        <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex items-center gap-4 mb-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <i className="fa-solid fa-building-columns"></i> Filtro por Conta
            </h3>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {accounts.map(acc => (
              <button
                key={acc}
                onClick={() => setActiveAccount(acc)}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border-2 ${
                  activeAccount === acc 
                  ? 'bg-blue-900 text-white border-blue-900 shadow-lg shadow-blue-900/20' 
                  : 'bg-white text-slate-500 border-slate-100 hover:border-blue-200 hover:text-blue-900 shadow-sm'
                }`}
              >
                {acc}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        {activeTab === null && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <i className="fa-solid fa-lock text-6xl text-slate-300"></i>
            <h2 className="text-2xl font-black text-slate-700 uppercase tracking-tighter">Acesso Restrito</h2>
            <p className="text-slate-500 max-w-md">Você não possui permissão para acessar nenhuma tela do sistema. Por favor, contate o administrador para solicitar acesso.</p>
          </div>
        )}
        {activeTab === Tab.DASHBOARD && <Dashboard transactions={filteredTransactions} />}
        {activeTab === Tab.CONTAS_PAGAR && (
          <TransactionTable 
            type="PAGAR" 
            transactions={filteredTransactions.filter(t => t.type === 'PAGAR')} 
            costCenters={costCenters}
            onAdd={async t => { await supabase.from('transactions').insert(t); fetchData(); }} 
            onBulkAdd={async items => { await supabase.from('transactions').insert(items); fetchData(); }}
            onUpdate={async t => { await supabase.from('transactions').update(t).eq('id', t.id); fetchData(); }} 
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
        {activeTab === Tab.DETALHES && <Details transactions={filteredTransactions} costCenters={costCenters} />}
        {activeTab === Tab.PROPOSTAS && (
          <ProposalsView 
            proposals={proposals} 
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
          />
        )}
        {activeTab === Tab.GESTAO_DEMANDAS && user.permissions.gestaoDemandas && (
          <ManagerArea 
            proposals={proposals} 
            onGeneratePaymentCode={async (ids) => {
              const selectedProposals = proposals.filter(p => ids.includes(p.id));
              
              // Bloqueio contra duplicidade
              const invalidProposals = selectedProposals.filter(p => p.status !== 'CADASTRADA');
              if (invalidProposals.length > 0) {
                alert('Ação bloqueada: Uma ou mais propostas já foram enviadas ao financeiro ou pagas.');
                return;
              }

              const totalValue = selectedProposals.reduce((acc, p) => acc + Number(p.comissao), 0);
              const code = `LOTE-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;
              
              const newLot: Omit<PaymentLot, 'id'> = {
                codigo: code,
                aprovadoPor: user?.login || 'Sistema',
                dataAprovacao: new Date().toISOString(),
                qtdPropostas: ids.length,
                vencimento: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
                valorTotal: totalValue,
                status: 'PENDENTE'
              };

              const { data: lotData, error: lotError } = await supabase.from('payment_lots').insert([newLot]).select();
              
              let createdLotId: string | undefined;

              if (lotError) {
                console.error('Erro ao criar lote:', lotError);
                alert('Erro ao criar lote de pagamento. Verifique o console.');
                return;
              } else if (lotData && lotData.length > 0) {
                createdLotId = lotData[0].id;
              }

              const updateData: any = { status: 'ENVIADA AO FINANCEIRO' };
              if (createdLotId) {
                updateData.lote_id = createdLotId;
              }

              const { error: propError } = await supabase.from('proposals').update(updateData).in('id', ids);
              
              if (propError) {
                console.error('Erro ao atualizar propostas:', propError);
                alert('Erro ao vincular propostas ao lote. Verifique o console.');
                return;
              } else {
                // Optimistic update to remove from release flow immediately
                setProposals(prev => prev.map(p => ids.includes(p.id) ? { ...p, status: 'ENVIADA AO FINANCEIRO', lote_id: createdLotId } : p));
              }

              // Small delay to ensure DB has processed the update before we fetch again
              await new Promise(resolve => setTimeout(resolve, 800));
              await fetchData();
              alert(`Código de Pagamento Gerado: ${code}\nAs propostas selecionadas foram enviadas ao financeiro.`);
            }} 
          />
        )}
        {activeTab === Tab.FINANCEIRO && user.permissions.financeiro && (
          <FinanceView 
            lots={paymentLots} 
            proposals={proposals}
            onPay={async (id) => {
              const { error } = await supabase.from('payment_lots').update({ status: 'PAGO' }).eq('id', id);
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
                fetchData();
              }
            }}
          />
        )}
        {activeTab === Tab.COMISSOES && user.permissions.comissoes && <ComissoesModule />}
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
        {activeTab === Tab.PLAN_CREDENCIAS && user.permissions.planCredencias && <CredentialsManager users={appUsers} onUpdateUsers={async nu => { for(const u of nu) { await supabase.from('users').upsert(u); } fetchData(); }} />}
      </div>

      <ProposalModal 
        isOpen={isProposalModalOpen} 
        onClose={() => {
          setIsProposalModalOpen(false);
          setEditingProposal(null);
        }} 
        requirements={proposalRequirements}
        proposal={editingProposal}
        onSave={async (proposalData) => {
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
              alert('Erro ao atualizar proposta. Verifique o console.');
            } else {
              fetchData();
            }
          } else {
            // Força status inicial
            proposalData.status = 'CADASTRADA';
            
            const { error } = await supabase.from('proposals').insert([proposalData]);
            if (error) {
              console.error('Erro ao salvar proposta:', error);
              alert('Erro ao salvar proposta. Verifique o console.');
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
