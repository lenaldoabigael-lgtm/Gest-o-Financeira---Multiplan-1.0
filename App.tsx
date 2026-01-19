
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
      // Teste de conexão básico
      const { data: usersData, error: uErr, status } = await supabase.from('users').select('*');
      
      if (uErr) {
        console.error("Erro Supabase:", uErr);
        // PGRST106 significa que o esquema 'public' não está exposto nas configurações da API
        if (uErr.code === 'PGRST106' || uErr.message.includes('Invalid schema')) {
          setErrorType('SCHEMA_HIDDEN');
          setIsLoading(false);
          return;
        }
        // 42P01 significa que a tabela não existe
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
      alert('Erro no cadastro. Verifique as configurações do banco.');
      return false;
    }
    await fetchData();
    alert('Conta criada!');
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

          <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 space-y-6 shadow-2xl">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <span className="bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-xs">1</span>
              Como resolver no Painel Supabase:
            </h2>
            <ol className="space-y-4 text-slate-300 text-sm list-decimal list-inside">
              <li>No menu lateral, clique em <i className="fa-solid fa-cog mx-1 text-blue-400"></i> <strong>Settings</strong>.</li>
              <li>Clique na aba <i className="fa-solid fa-link mx-1 text-blue-400"></i> <strong>API</strong>.</li>
              <li>Desça até a seção <strong>Data API</strong>.</li>
              <li>No campo <strong>Exposed schemas</strong>, adicione <strong>"public"</strong>.</li>
              <li>Clique em <strong>Save</strong> (topo ou rodapé da página).</li>
            </ol>
            <p className="text-xs text-slate-500 italic">Após salvar, aguarde 10 segundos e clique no botão abaixo.</p>
          </div>

          <button onClick={fetchData} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3">
            <i className="fa-solid fa-sync"></i> Configuração Concluída. Recarregar!
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
            <p className="text-slate-400">Execute o script abaixo no SQL Editor do Supabase para criar a estrutura:</p>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4 shadow-2xl">
            <pre className="bg-black/50 p-4 rounded-lg text-[11px] text-green-400 overflow-x-auto border border-white/5 max-h-64 leading-relaxed font-mono">
{`CREATE TABLE IF NOT EXISTS users (login TEXT PRIMARY KEY, senha TEXT NOT NULL, email TEXT, permissions JSONB NOT NULL);
CREATE TABLE IF NOT EXISTS cost_centers (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nome TEXT NOT NULL, tipo TEXT NOT NULL, sub_itens TEXT[] DEFAULT '{}');
CREATE TABLE IF NOT EXISTS transactions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), type TEXT NOT NULL, vencimento DATE NOT NULL, pagamento DATE, descricao TEXT NOT NULL, valor NUMERIC(15,2) NOT NULL, "formaPagamento" TEXT NOT NULL, status TEXT NOT NULL, "centroCusto" TEXT NOT NULL, "subItem" TEXT NOT NULL, cliente TEXT, conta TEXT DEFAULT 'GERAL');

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE cost_centers DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;`}
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
      <div className="mb-6">
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

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        {activeTab === Tab.DASHBOARD && <Dashboard transactions={filteredTransactions} />}
        {activeTab === Tab.CONTAS_PAGAR && (
          <TransactionTable 
            type="PAGAR" 
            transactions={filteredTransactions.filter(t => t.type === 'PAGAR')} 
            onAdd={async t => { await supabase.from('transactions').insert(t); fetchData(); }} 
            onUpdate={async t => { await supabase.from('transactions').update(t).eq('id', t.id); fetchData(); }} 
            onDelete={async ids => { await supabase.from('transactions').delete().in('id', ids); fetchData(); }} 
          />
        )}
        {activeTab === Tab.CONTAS_RECEBER && (
          <TransactionTable 
            type="RECEBER" 
            transactions={filteredTransactions.filter(t => t.type === 'RECEBER')} 
            onAdd={async t => { await supabase.from('transactions').insert(t); fetchData(); }} 
            onUpdate={async t => { await supabase.from('transactions').update(t).eq('id', t.id); fetchData(); }} 
            onDelete={async ids => { await supabase.from('transactions').delete().in('id', ids); fetchData(); }} 
          />
        )}
        {activeTab === Tab.CENTRO_CUSTO && <CostCentersView costCenters={costCenters} onSave={async cc => { await supabase.from('cost_centers').upsert({id: cc.id, nome: cc.nome, tipo: cc.tipo, sub_itens: cc.subItens}); fetchData(); }} onDelete={async id => { await supabase.from('cost_centers').delete().eq('id', id); fetchData(); }} />}
        {activeTab === Tab.FLUXO_CAIXA && <CashFlow transactions={filteredTransactions} />}
        {activeTab === Tab.DETALHES && <Details transactions={filteredTransactions} />}
        {activeTab === Tab.PLAN_CREDENCIAS && <CredentialsManager users={appUsers} onUpdateUsers={async nu => { for(const u of nu) { await supabase.from('users').upsert(u); } fetchData(); }} />}
      </div>
    </Layout>
  );
};

export default App;
