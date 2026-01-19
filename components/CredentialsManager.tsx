
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

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogin || !newSenha || !newEmail) {
      alert('Por favor, preencha Login, Senha e E-mail.');
      return;
    }

    const newUser: User = {
      login: newLogin,
      senha: newSenha,
      email: newEmail,
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

  const togglePermission = (login: string, permission: keyof User['permissions']) => {
    const updatedUsers = users.map(u => {
      if (u.login === login) {
        return {
          ...u,
          permissions: {
            ...u.permissions,
            [permission]: !u.permissions[permission]
          }
        };
      }
      return u;
    });
    onUpdateUsers(updatedUsers);
  };

  const removeUser = (login: string) => {
    if (login === 'admin') {
      alert('Não é possível remover o administrador.');
      return;
    }
    if (confirm(`Deseja remover o usuário ${login}?`)) {
      onUpdateUsers(users.filter(u => u.login !== login));
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-blue-900 uppercase">Gerenciamento de Credenciais</h2>
          <p className="text-sm text-gray-500">Controle usuários e níveis de acesso ao sistema</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-900 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-blue-800 transition-colors"
        >
          <i className={`fa-solid ${isAdding ? 'fa-times' : 'fa-plus'}`}></i>
          {isAdding ? 'Cancelar' : 'Novo Usuário'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddUser} className="bg-gray-50 p-6 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end animate-fade-in shadow-inner">
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-blue-900 uppercase mb-1">Login</label>
            <input 
              type="text" 
              className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-900 outline-none" 
              placeholder="Ex: joao.silva"
              value={newLogin}
              onChange={(e) => setNewLogin(e.target.value)}
              required
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-blue-900 uppercase mb-1">E-mail</label>
            <input 
              type="email" 
              className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-900 outline-none" 
              placeholder="Ex: joao@empresa.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-blue-900 uppercase mb-1">Senha</label>
            <input 
              type="password" 
              className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-900 outline-none" 
              placeholder="••••••"
              value={newSenha}
              onChange={(e) => setNewSenha(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="bg-orange-500 text-white p-2.5 rounded text-sm font-bold uppercase hover:bg-orange-600 transition-colors shadow-md">
            Salvar Usuário
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-blue-900 text-white text-[10px] uppercase">
              <th className="p-3 border-r border-blue-800">Login / E-mail</th>
              <th className="p-3 border-r border-blue-800 text-center">Contas Pagar</th>
              <th className="p-3 border-r border-blue-800 text-center">Contas Receber</th>
              <th className="p-3 border-r border-blue-800 text-center">Centro Custo</th>
              <th className="p-3 border-r border-blue-800 text-center">Dashboard</th>
              <th className="p-3 border-r border-blue-800 text-center">Fluxo Caixa</th>
              <th className="p-3 border-r border-blue-800 text-center">Detalhes</th>
              <th className="p-3 border-r border-blue-800 text-center">Credenciais</th>
              <th className="p-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {users.map((u, idx) => (
              <tr key={u.login} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="p-3 border-b border-gray-200">
                  <div className="font-bold text-blue-900">{u.login}</div>
                  <div className="text-[10px] text-gray-500">{u.email || '—'}</div>
                </td>
                <td className="p-3 border-b border-gray-200 text-center">
                  <input 
                    type="checkbox" 
                    checked={u.permissions.contasPagar} 
                    onChange={() => togglePermission(u.login, 'contasPagar')}
                    className="w-4 h-4 cursor-pointer"
                  />
                </td>
                <td className="p-3 border-b border-gray-200 text-center">
                  <input 
                    type="checkbox" 
                    checked={u.permissions.contasReceber} 
                    onChange={() => togglePermission(u.login, 'contasReceber')}
                    className="w-4 h-4 cursor-pointer"
                  />
                </td>
                <td className="p-3 border-b border-gray-200 text-center">
                  <input 
                    type="checkbox" 
                    checked={u.permissions.centroCusto} 
                    onChange={() => togglePermission(u.login, 'centroCusto')}
                    className="w-4 h-4 cursor-pointer"
                  />
                </td>
                <td className="p-3 border-b border-gray-200 text-center">
                  <input 
                    type="checkbox" 
                    checked={u.permissions.dashboard} 
                    onChange={() => togglePermission(u.login, 'dashboard')}
                    className="w-4 h-4 cursor-pointer"
                  />
                </td>
                <td className="p-3 border-b border-gray-200 text-center">
                  <input 
                    type="checkbox" 
                    checked={u.permissions.fluxoCaixa} 
                    onChange={() => togglePermission(u.login, 'fluxoCaixa')}
                    className="w-4 h-4 cursor-pointer"
                  />
                </td>
                <td className="p-3 border-b border-gray-200 text-center">
                  <input 
                    type="checkbox" 
                    checked={u.permissions.detalhes} 
                    onChange={() => togglePermission(u.login, 'detalhes')}
                    className="w-4 h-4 cursor-pointer"
                  />
                </td>
                <td className="p-3 border-b border-gray-200 text-center">
                  <input 
                    type="checkbox" 
                    checked={u.permissions.planCredencias} 
                    disabled={u.login === 'admin'}
                    onChange={() => togglePermission(u.login, 'planCredencias')}
                    className="w-4 h-4 cursor-pointer"
                  />
                </td>
                <td className="p-3 border-b border-gray-200 text-center">
                  <button 
                    onClick={() => removeUser(u.login)}
                    disabled={u.login === 'admin'}
                    className={`text-red-600 hover:text-red-800 disabled:opacity-30`}
                  >
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CredentialsManager;
