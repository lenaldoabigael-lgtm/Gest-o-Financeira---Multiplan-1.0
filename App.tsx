
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

      const [transactionsRes, costCentersRes] = await Promise.all([
        supabase.from('transactions').select('*').order('vencimento', { ascending: false }),
        supabase.from('cost_centers').select('*').order('nome')
      ]);

      let currentUsers = (usersData || []) as User[];
      const hasAdmin = currentUsers.some(u => u.login === 'admin');
      
      if (!hasAdmin && !uErr) {
        const adminUser: User = {
          login: 'admin',
          senha: '123',
          email: 'admin@multiplan.com',
          approved: true,
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
      if (foundUser.permissions.dashboard) setActiveTab(Tab.DASHBOARD);
      else setActiveTab(Tab.CONTAS_PAGAR);
    } else {
      alert('Login ou senha inválidos!');
    }
  };

  const handleRegister = async (login: string, email: string, pass: string) => {
    const newUser: User = {
      login, senha: pass, email,
      approved: false,
      permissions: { centroCusto: false, contasPagar: false, contasReceber: false, dashboard: false, fluxoCaixa: false, detalhes: false, planCredencias: false }
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

  // Determina se o filtro de conta deve ser exibido
  const showAccountFilter = useMemo(() => {
    return activeTab !== Tab.CENTRO_CUSTO && activeTab !== Tab.PLAN_CREDENCIAS;
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
        {activeTab === Tab.DASHBOARD && <Dashboard transactions={filteredTransactions} />}
        {activeTab === Tab.CONTAS_PAGAR && (
          <TransactionTable 
            type="PAGAR" 
            transactions={filteredTransactions.filter(t => t.type === 'PAGAR')} 
            costCenters={costCenters}
            onAdd={async t => { await supabase.from('transactions').insert(t); fetchData(); }} 
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
            onUpdate={async t => { await supabase.from('transactions').update(t).eq('id', t.id); fetchData(); }} 
            onDelete={async ids => { await supabase.from('transactions').delete().in('id', ids); fetchData(); }} 
          />
        )}
        {activeTab === Tab.CENTRO_CUSTO && <CostCentersView costCenters={costCenters} onSave={async cc => { await supabase.from('cost_centers').upsert({id: cc.id, nome: cc.nome, tipo: cc.tipo, sub_itens: cc.subItens}); fetchData(); }} onDelete={async id => { await supabase.from('cost_centers').delete().eq('id', id); fetchData(); }} />}
        {activeTab === Tab.FLUXO_CAIXA && <CashFlow transactions={filteredTransactions} />}
        {activeTab === Tab.DETALHES && <Details transactions={filteredTransactions} costCenters={costCenters} />}
        {activeTab === Tab.PLAN_CREDENCIAS && <CredentialsManager users={appUsers} onUpdateUsers={async nu => { for(const u of nu) { await supabase.from('users').upsert(u); } fetchData(); }} />}
      </div>
    </Layout>
  );
};

export default App;
