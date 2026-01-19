
import React, { useState, useEffect, useMemo } from 'react';
import { User, Tab, Transaction, CostCenter } from './types';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TransactionTable from './components/TransactionTable';
import CostCentersView from './components/CostCentersView';
import CashFlow from './components/CashFlow';
import Details from './components/Details';
import CredentialsManager from './components/CredentialsManager';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [appUsers, setAppUsers] = useState<User[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbNeedsSetup, setDbNeedsSetup] = useState(false);
  
  // Novo Estado: Conta Bancária Ativa para as abas
  const [activeAccount, setActiveAccount] = useState<string>('TODAS');

  const fetchData = async () => {
    setIsLoading(true);
    setDbNeedsSetup(false);
    try {
      const { data: usersData, error: uErr } = await supabase.from('users').select('*');
      
      if (uErr && (uErr.code === '42P01' || uErr.message.includes('schema cache'))) {
        setDbNeedsSetup(true);
        setIsLoading(false);
        return;
      }

      const [transactionsRes, costCentersRes] = await Promise.all([
        supabase.from('transactions').select('*').order('vencimento', { ascending: false }),
        supabase.from('cost_centers').select('*').order('nome')
      ]);

      let currentUsers = usersData || [];
      const hasAdmin = currentUsers.some(u => u.login === 'admin');
      if (!hasAdmin && !uErr) {
        const adminUser: User = {
          login: 'admin',
          senha: '123',
          email: 'admin@multiplan.com',
          permissions: {
            centroCusto: true, contasPagar: true, contasReceber: true,
            dashboard: true, fluxoCaixa: true, detalhes: true, planCredencias: true
          }
        };
        await supabase.from('users').insert(adminUser);
        currentUsers = [...currentUsers, adminUser];
      }

      setAppUsers(currentUsers);
      if (transactionsRes.data) setTransactions(transactionsRes.data);
      if (costCentersRes.data) {
        setCostCenters(costCentersRes.data.map(cc => ({
          id: cc.id, nome: cc.nome, tipo: cc.tipo, subItens: cc.sub_itens || []
        })));
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Extrair contas únicas das transações para criar as abas
  const accounts = useMemo(() => {
    const unique = Array.from(new Set(transactions.map(t => t.conta || 'GERAL')));
    return ['TODAS', ...unique.sort()];
  }, [transactions]);

  // Filtrar transações baseado na conta selecionada
  const filteredTransactions = useMemo(() => {
    if (activeAccount === 'TODAS') return transactions;
    return transactions.filter(t => (t.conta || 'GERAL') === activeAccount);
  }, [transactions, activeAccount]);

  const handleLogin = (login: string, pass: string) => {
    const foundUser = appUsers.find(u => u.login === login && u.senha === pass);
    if (foundUser) {
      setUser(foundUser);
      if (foundUser.permissions.dashboard) setActiveTab(Tab.DASHBOARD);
      else setActiveTab(Tab.CONTAS_PAGAR);
    } else {
      alert('Login ou senha inválidos!');
    }
  };

  const handleRegister = async (login: string, email: string, pass: string) => {
    const newUser: User = {
      login, senha: pass, email,
      permissions: { centroCusto: false, contasPagar: true, contasReceber: true, dashboard: true, fluxoCaixa: false, detalhes: false, planCredencias: false }
    };
    const { error } = await supabase.from('users').insert(newUser);
    if (error) {
      alert('Erro no cadastro. Verifique se o SQL de desabilitação de RLS foi executado.');
      return false;
    }
    setAppUsers(p => [...p, newUser]);
    alert('Conta criada!');
    return true;
  };

  if (dbNeedsSetup) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-8 flex flex-col items-center">
        <div className="max-w-2xl w-full space-y-6">
          <div className="text-center">
             <i className="fa-solid fa-triangle-exclamation text-5xl text-yellow-500 mb-4"></i>
             <h1 className="text-2xl font-bold uppercase">Configuração Inicial Supabase</h1>
             <p className="text-slate-400 text-sm mt-2">As tabelas ainda não foram criadas no seu projeto Supabase.</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <pre className="text-[10px] text-green-400 overflow-x-auto whitespace-pre-wrap">
{`-- COPIE E COLE NO SQL EDITOR DO SUPABASE
CREATE TABLE IF NOT EXISTS users (login TEXT PRIMARY KEY, senha TEXT NOT NULL, email TEXT, permissions JSONB NOT NULL);
CREATE TABLE IF NOT EXISTS cost_centers (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nome TEXT NOT NULL, tipo TEXT NOT NULL, sub_itens TEXT[] DEFAULT '{}');
CREATE TABLE IF NOT EXISTS transactions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), type TEXT NOT NULL, vencimento DATE NOT NULL, pagamento DATE, descricao TEXT NOT NULL, valor NUMERIC(15,2) NOT NULL, "formaPagamento" TEXT NOT NULL, status TEXT NOT NULL, "centroCusto" TEXT NOT NULL, "subItem" TEXT NOT NULL, cliente TEXT, conta TEXT DEFAULT 'GERAL');

-- DESABILITAR RLS PARA TESTES (EVITA O ERRO DE SEGURANÇA)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE cost_centers DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;`}
            </pre>
          </div>
          <button onClick={fetchData} className="w-full bg-blue-600 py-3 rounded-lg font-bold uppercase hover:bg-blue-500 transition-all">Verificar Novamente</button>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><i className="fa-solid fa-spinner fa-spin text-3xl text-blue-900"></i></div>;
  if (!user) return <Login onLogin={handleLogin} onRegister={handleRegister} />;

  return (
    <Layout user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => setUser(null)}>
      {/* Seletor de Abas de Conta */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <span className="text-[10px] font-black text-gray-400 uppercase mr-2"><i className="fa-solid fa-wallet"></i> Contas:</span>
        {accounts.map(acc => (
          <button
            key={acc}
            onClick={() => setActiveAccount(acc)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border-2 ${
              activeAccount === acc 
              ? 'bg-blue-900 text-white border-blue-900 shadow-md' 
              : 'bg-white text-gray-500 border-gray-200 hover:border-blue-200'
            }`}
          >
            {acc}
          </button>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === Tab.DASHBOARD && <Dashboard transactions={filteredTransactions} />}
        {activeTab === Tab.CONTAS_PAGAR && <TransactionTable type="PAGAR" transactions={filteredTransactions.filter(t => t.type === 'PAGAR')} onAdd={async t => { await supabase.from('transactions').insert(t); fetchData(); }} onUpdate={async t => { await supabase.from('transactions').update(t).eq('id', t.id); fetchData(); }} onDelete={async ids => { await supabase.from('transactions').delete().in('id', ids); fetchData(); }} />}
        {activeTab === Tab.CONTAS_RECEBER && <TransactionTable type="RECEBER" transactions={filteredTransactions.filter(t => t.type === 'RECEBER')} onAdd={async t => { await supabase.from('transactions').insert(t); fetchData(); }} onUpdate={async t => { await supabase.from('transactions').update(t).eq('id', t.id); fetchData(); }} onDelete={async ids => { await supabase.from('transactions').delete().in('id', ids); fetchData(); }} />}
        {activeTab === Tab.CENTRO_CUSTO && <CostCentersView costCenters={costCenters} onSave={async cc => { await supabase.from('cost_centers').upsert({id: cc.id, nome: cc.nome, tipo: cc.tipo, sub_itens: cc.subItens}); fetchData(); }} onDelete={async id => { await supabase.from('cost_centers').delete().eq('id', id); fetchData(); }} />}
        {activeTab === Tab.FLUXO_CAIXA && <CashFlow transactions={filteredTransactions} />}
        {activeTab === Tab.DETALHES && <Details transactions={filteredTransactions} />}
        {activeTab === Tab.PLAN_CREDENCIAS && <CredentialsManager users={appUsers} onUpdateUsers={async nu => { for(const u of nu) { await supabase.from('users').upsert(u); } fetchData(); }} />}
      </div>
    </Layout>
  );
};

export default App;