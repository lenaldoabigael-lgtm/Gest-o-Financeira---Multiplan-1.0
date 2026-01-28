
import React, { useState } from 'react';
import { User } from '../types';

interface CredentialsManagerProps {
  users: User[];
  onUpdateUsers: (users: User[]) => void;
}

const CredentialsManager: React.FC<CredentialsManagerProps> = ({ users, onUpdateUsers }) => {
  const [newLogin, setNewLogin] = useState('');
  const [newSenha, setNewSenha] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Usuários que explicitamente solicitaram acesso (approved === false)
  const pendingUsers = users.filter(u => u.approved === false);
  
  // Usuários aprovados ou legados (sem o campo approved definido ainda)
  const activeUsers = users.filter(u => u.approved !== false);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogin || !newSenha || !newEmail) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const newUser: User = {
      login: newLogin,
      senha: newSenha,
      email: newEmail,
      approved: true, 
      permissions: {
        centroCusto: false,
        contasPagar: false,
        contasReceber: false,
        dashboard: false,
        fluxoCaixa: false,
        detalhes: false,
        planCredencias: false
      }
    };

    onUpdateUsers([...users, newUser]);
    setNewLogin('');
    setNewSenha('');
    setNewEmail('');
    setIsAdding(false);
  };

  const handleApprove = (login: string) => {
    const updatedUsers = users.map(u => {
      if (u.login === login) {
        return { ...u, approved: true };
      }
      return u;
    });
    onUpdateUsers(updatedUsers);
  };

  const togglePermission = (login: string, permission: keyof User['permissions']) => {
    const updatedUsers = users.map(u => {
      if (u.login === login) {
        const currentPermissions = u.permissions || {
          centroCusto: false, contasPagar: false, contasReceber: false,
          dashboard: false, fluxoCaixa: false, detalhes: false, planCredencias: false
        };
        return {
          ...u,
          permissions: {
            ...currentPermissions,
            [permission]: !currentPermissions[permission]
          }
        };
      }
      return u;
    });
    onUpdateUsers(updatedUsers);
  };

  const removeUser = (login: string) => {
    if (login === 'admin') {
      alert('O usuário administrador master não pode ser removido.');
      return;
    }
    if (confirm(`Tem certeza que deseja remover o usuário "${login}"?`)) {
      onUpdateUsers(users.filter(u => u.login !== login));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* SEÇÃO 1: SOLICITAÇÕES PENDENTES */}
      {pendingUsers.length > 0 && (
        <div className="bg-white rounded-3xl border-2 border-orange-200 overflow-hidden shadow-xl shadow-orange-900/5">
          <div className="bg-orange-50 px-6 py-4 border-b border-orange-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-lg animate-bounce">
                <i className="fa-solid fa-user-plus"></i>
              </div>
              <div>
                <h3 className="text-lg font-black text-orange-900 uppercase tracking-tighter">Solicitações Pendentes</h3>
                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Aprove o acesso para novos colaboradores</p>
              </div>
            </div>
            <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-black">{pendingUsers.length} PENDENTE(S)</span>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingUsers.map(u => (
              <div key={u.login} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between hover:border-orange-300 transition-all group">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{u.login}</p>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold lowercase truncate px-4">{u.email}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleApprove(u.login)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                  >
                    Aprovar Acesso
                  </button>
                  <button 
                    onClick={() => removeUser(u.login)}
                    className="bg-white hover:bg-red-50 hover:text-red-600 text-slate-300 py-2.5 px-4 rounded-xl border border-slate-100 transition-all active:scale-95"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEÇÃO 2: USUÁRIOS ATIVOS E PERMISSÕES */}
      <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
        <div className="p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-50">
          <div>
            <h2 className="text-2xl font-black text-blue-900 uppercase tracking-tighter">Gestão de Usuários</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Controle de telas e permissões por colaborador</p>
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-blue-900 hover:bg-blue-800 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-900/30 active:scale-95"
          >
            <i className={`fa-solid ${isAdding ? 'fa-xmark' : 'fa-plus'}`}></i>
            {isAdding ? 'Cancelar Cadastro' : 'Cadastrar Manualmente'}
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleAddUser} className="bg-blue-50/50 p-8 border-b border-blue-100 grid grid-cols-1 md:grid-cols-4 gap-6 items-end animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Login de Acesso</label>
              <input 
                type="text" 
                className="w-full p-4 text-xs font-bold border border-blue-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-900/5 transition-all bg-white" 
                placeholder="Ex: joao.admin"
                value={newLogin}
                onChange={(e) => setNewLogin(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-blue-900 uppercase tracking-widest">E-mail</label>
              <input 
                type="email" 
                className="w-full p-4 text-xs font-bold border border-blue-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-900/5 transition-all bg-white" 
                placeholder="colaborador@multiplan.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Senha Inicial</label>
              <input 
                type="password" 
                className="w-full p-4 text-xs font-bold border border-blue-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-900/5 transition-all bg-white" 
                placeholder="••••••"
                value={newSenha}
                onChange={(e) => setNewSenha(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="bg-orange-500 text-white py-4.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 active:scale-95">
              Criar e Liberar
            </button>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
                <th className="p-6">Usuário</th>
                <th className="p-6 text-center">Dashboard</th>
                <th className="p-6 text-center">C. Pagar</th>
                <th className="p-6 text-center">C. Receber</th>
                <th className="p-6 text-center">F. Caixa</th>
                <th className="p-6 text-center">Estrutura</th>
                <th className="p-6 text-center">Relatórios</th>
                <th className="p-6 text-center">Usuários</th>
                <th className="p-6 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeUsers.length > 0 ? activeUsers.map((u, idx) => (
                <tr key={u.login} className={`group hover:bg-blue-50/30 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                  <td className="p-6">
                    <div className="font-black text-blue-900 uppercase tracking-tight">{u.login}</div>
                    <div className="text-[10px] text-slate-400 font-bold lowercase mt-0.5">{u.email || 'N/A'}</div>
                  </td>
                  
                  {[
                    { key: 'dashboard', label: 'Dashboard' },
                    { key: 'contasPagar', label: 'C. Pagar' },
                    { key: 'contasReceber', label: 'C. Receber' },
                    { key: 'fluxoCaixa', label: 'F. Caixa' },
                    { key: 'centroCusto', label: 'Estrutura' },
                    { key: 'detalhes', label: 'Relatórios' },
                    { key: 'planCredencias', label: 'Usuários' }
                  ].map(perm => (
                    <td key={perm.key} className="p-6 text-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={u.permissions ? !!u.permissions[perm.key as keyof User['permissions']] : false} 
                          disabled={u.login === 'admin' && perm.key === 'planCredencias'}
                          onChange={() => togglePermission(u.login, perm.key as keyof User['permissions'])}
                        />
                        <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5 shadow-inner"></div>
                      </label>
                    </td>
                  ))}

                  <td className="p-6 text-center">
                    {u.login !== 'admin' ? (
                      <button 
                        onClick={() => removeUser(u.login)}
                        className="text-slate-300 hover:text-red-600 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-red-50 transition-all mx-auto"
                        title="Remover"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    ) : (
                      <div className="text-[8px] font-black text-blue-900 bg-blue-100 px-2 py-1 rounded uppercase tracking-widest inline-block">Master</div>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={9} className="p-32 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <i className="fa-solid fa-users-slash text-6xl"></i>
                      <p className="text-sm font-black uppercase tracking-widest">Nenhum usuário cadastrado</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CredentialsManager;
