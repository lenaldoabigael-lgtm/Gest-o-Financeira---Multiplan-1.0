
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
  const menuGroups = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'fa-chart-pie',
      isSingle: true,
      tabId: Tab.DASHBOARD,
      permission: user.permissions.dashboard
    },
    {
      id: 'comercial',
      label: 'Comercial',
      icon: 'fa-briefcase',
      items: [
        { id: Tab.PROPOSTAS, label: 'Propostas', icon: 'fa-file-contract', permission: user.permissions.propostas },
        { id: Tab.ESTRUTURA_PROPOSTA, label: 'Estrutura de Proposta', icon: 'fa-folder-tree', permission: user.permissions.estruturaProposta },
        { id: Tab.ACOMPANHAMENTO, label: 'Acompanhamento', icon: 'fa-list-check', permission: user.permissions.gestaoDemandas },
        { id: Tab.COMISSOES, label: 'Comissões', icon: 'fa-dollar-sign', permission: user.permissions.comissoes },
      ]
    },
    {
      id: 'financeiro',
      label: 'Financeiro',
      icon: 'fa-money-bill-wave',
      items: [
        { id: Tab.CONTAS_PAGAR, label: 'Contas a Pagar', icon: 'fa-file-invoice-dollar', permission: user.permissions.contasPagar },
        { id: Tab.CONTAS_RECEBER, label: 'Contas a Receber', icon: 'fa-hand-holding-dollar', permission: user.permissions.contasReceber },
        { id: Tab.FLUXO_CAIXA, label: 'Fluxo de Caixa', icon: 'fa-money-bill-transfer', permission: user.permissions.fluxoCaixa },
        { id: Tab.FINANCEIRO, label: 'Lotes de Pagamento', icon: 'fa-wallet', permission: user.permissions.financeiro },
      ]
    },
    {
      id: 'gestao',
      label: 'Gestão',
      icon: 'fa-sliders',
      items: [
        { id: Tab.CENTRO_CUSTO, label: 'Centro de Custo', icon: 'fa-sitemap', permission: user.permissions.centroCusto },
        { id: Tab.DETALHES, label: 'Relatórios', icon: 'fa-file-lines', permission: user.permissions.detalhes },
        { id: Tab.PLAN_CREDENCIAS, label: 'Usuários', icon: 'fa-user-gear', permission: user.permissions.planCredencias },
      ]
    }
  ];

  // Flatten tabs for mobile view
  const allPermittedTabs = menuGroups.flatMap(g => 
    g.isSingle 
      ? (g.permission ? [{ id: g.tabId!, label: g.label, icon: g.icon }] : []) 
      : g.items.filter(i => i.permission)
  );

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
              {menuGroups.map((group) => {
                if (group.isSingle) {
                  if (!group.permission) return null;
                  const isActive = activeTab === group.tabId;
                  return (
                    <button
                      key={group.id}
                      onClick={() => setActiveTab(group.tabId!)}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                        isActive
                          ? 'bg-blue-50 text-blue-900'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <i className={`fa-solid ${group.icon} opacity-50`}></i>
                      {group.label}
                    </button>
                  );
                }

                const permittedItems = group.items.filter(item => item.permission);
                if (permittedItems.length === 0) return null;

                const isActive = permittedItems.some(item => item.id === activeTab);

                return (
                  <div key={group.id} className="relative group">
                    <button
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                        isActive
                          ? 'bg-blue-50 text-blue-900'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <i className={`fa-solid ${group.icon} opacity-50`}></i>
                      {group.label}
                      <i className="fa-solid fa-chevron-down text-[10px] opacity-50 group-hover:rotate-180 transition-transform duration-300"></i>
                    </button>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute left-0 top-full pt-2 hidden group-hover:block z-50">
                      <div className="w-56 bg-white shadow-xl rounded-xl border border-gray-100 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        {permittedItems.map(item => (
                          <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center gap-3 hover:bg-blue-50 transition-colors ${
                              activeTab === item.id ? 'text-blue-900 bg-blue-50/50' : 'text-gray-600'
                            }`}
                          >
                            <i className={`fa-solid ${item.icon} w-4 text-center opacity-50`}></i>
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
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
           {allPermittedTabs.map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase whitespace-nowrap flex items-center gap-2 ${
                 activeTab === tab.id ? 'bg-blue-900 text-white' : 'bg-white text-gray-500 border border-gray-100'
               }`}
             >
               <i className={`fa-solid ${tab.icon} opacity-70`}></i>
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