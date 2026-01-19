
import React from 'react';
import { User, Tab } from '../types';

interface LayoutProps {
  user: User;
  activeTab: Tab | null;
  setActiveTab: (tab: Tab) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, activeTab, setActiveTab, onLogout, children }) => {
  const tabs = [
    { id: Tab.DASHBOARD, label: 'Dashboard', icon: 'fa-chart-pie', permission: user.permissions.dashboard },
    { id: Tab.CONTAS_PAGAR, label: 'Contas a Pagar', icon: 'fa-file-invoice-dollar', permission: user.permissions.contasPagar },
    { id: Tab.CONTAS_RECEBER, label: 'Contas a Receber', icon: 'fa-hand-holding-dollar', permission: user.permissions.contasReceber },
    { id: Tab.FLUXO_CAIXA, label: 'Fluxo de Caixa', icon: 'fa-money-bill-transfer', permission: user.permissions.fluxoCaixa },
    { id: Tab.CENTRO_CUSTO, label: 'Estrutura', icon: 'fa-sitemap', permission: user.permissions.centroCusto },
    { id: Tab.DETALHES, label: 'Relatórios', icon: 'fa-file-lines', permission: user.permissions.detalhes },
    { id: Tab.PLAN_CREDENCIAS, label: 'Usuários', icon: 'fa-user-gear', permission: user.permissions.planCredencias },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-[60] shadow-sm">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 bg-blue-900 rounded flex items-center justify-center text-white font-black text-xl">M</div>
               <span className="text-lg font-black text-blue-900 uppercase tracking-tighter hidden sm:block">Multiplan</span>
            </div>
            
            <nav className="hidden lg:flex items-center gap-1">
              {tabs.map((tab) => (
                tab.permission && (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-900'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <i className={`fa-solid ${tab.icon} opacity-50`}></i>
                    {tab.label}
                  </button>
                )
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[9px] font-black text-blue-900/40 uppercase leading-none">Acesso</p>
              <p className="text-sm font-bold text-blue-900">{user.login}</p>
            </div>
            <button
              onClick={onLogout}
              className="w-10 h-10 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-full flex items-center justify-center transition-all border border-gray-200"
              title="Sair"
            >
              <i className="fa-solid fa-power-off"></i>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-[1600px] mx-auto w-full">
        {/* Mobile Navigation Bar */}
        <div className="lg:hidden flex overflow-x-auto gap-2 mb-4 pb-2 scrollbar-hide">
           {tabs.map(tab => tab.permission && (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase whitespace-nowrap ${
                 activeTab === tab.id ? 'bg-blue-900 text-white' : 'bg-white text-gray-500 border border-gray-100'
               }`}
             >
               {tab.label}
             </button>
           ))}
        </div>
        {children}
      </main>
    </div>
  );
};

export default Layout;