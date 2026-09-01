
import React from 'react';
import { User, Tab } from '../types';
import { MultiplanLogo } from './MultiplanLogo';

interface LayoutProps {
  user: User;
  activeTab: Tab | null;
  setActiveTab: (tab: Tab) => void;
  onLogout: () => void;
  onOpenCorretorPortal?: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, activeTab, setActiveTab, onLogout, onOpenCorretorPortal, children }) => {
  const menuGroups = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'fa-chart-pie',
      materialIcon: 'pie_chart',
      isSingle: true,
      tabId: Tab.DASHBOARD,
      permission: user.permissions.dashboard
    },
    {
      id: 'comercial',
      label: 'Comercial',
      icon: 'fa-briefcase',
      materialIcon: 'work',
      items: [
        { id: Tab.PROPOSTAS, label: 'Propostas', icon: 'fa-file-contract', materialIcon: 'description', permission: user.permissions.propostas },
        { id: Tab.COTACAO, label: 'Cotação de Planos', icon: 'fa-calculator', materialIcon: 'calculate', permission: user.permissions.cotacao !== false },
        { id: Tab.ESTRUTURA_PROPOSTA, label: 'Estrutura de Proposta', icon: 'fa-folder-tree', materialIcon: 'account_tree', permission: user.permissions.estruturaProposta },
        { id: Tab.ACOMPANHAMENTO, label: 'Acompanhamento', icon: 'fa-list-check', materialIcon: 'checklist', permission: user.permissions.gestaoDemandas },
        { id: Tab.COMISSOES, label: 'Comissões', icon: 'fa-dollar-sign', materialIcon: 'attach_money', permission: user.permissions.comissoes },
      ]
    },
    {
      id: 'financeiro',
      label: 'Financeiro',
      icon: 'fa-money-bill-wave',
      materialIcon: 'payments',
      items: [
        { id: Tab.CONTAS_PAGAR, label: 'Contas a Pagar', icon: 'fa-file-invoice-dollar', materialIcon: 'receipt_long', permission: user.permissions.contasPagar },
        { id: Tab.CONTAS_RECEBER, label: 'Contas a Receber', icon: 'fa-hand-holding-dollar', materialIcon: 'paid', permission: user.permissions.contasReceber },
        { id: Tab.FLUXO_CAIXA, label: 'Fluxo de Caixa', icon: 'fa-money-bill-transfer', materialIcon: 'sync_alt', permission: user.permissions.fluxoCaixa },
        { id: Tab.FINANCEIRO, label: 'Lotes de Pagamento', icon: 'fa-wallet', materialIcon: 'account_balance_wallet', permission: user.permissions.financeiro },
      ]
    },
    {
      id: 'gestao',
      label: 'Gestão',
      icon: 'fa-sliders',
      materialIcon: 'tune',
      items: [
        { id: Tab.CENTRO_CUSTO, label: 'Centro de Custo', icon: 'fa-sitemap', materialIcon: 'account_tree', permission: user.permissions.centroCusto },
        { id: Tab.DETALHES, label: 'Relatórios', icon: 'fa-file-lines', materialIcon: 'insert_chart', permission: user.permissions.detalhes },
        { id: Tab.PLAN_CREDENCIAS, label: 'Usuários', icon: 'fa-user-gear', materialIcon: 'manage_accounts', permission: user.permissions.planCredencias },
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
              <MultiplanLogo variant="blue" height={28} showText={true} />
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
                      className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                        isActive
                          ? 'bg-[#dce6fd] text-[#001a54]'
                          : 'text-gray-600 hover:bg-[#dce6fd]/60 hover:text-[#001a54]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[17px] text-[#001a54]">{group.materialIcon}</span>
                      <span>{group.label}</span>
                    </button>
                  );
                }

                const permittedItems = group.items.filter(item => item.permission);
                if (permittedItems.length === 0) return null;

                const isActive = permittedItems.some(item => item.id === activeTab);

                return (
                  <div key={group.id} className="relative group">
                    <button
                      className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                        isActive
                          ? 'bg-[#dce6fd] text-[#001a54]'
                          : 'text-gray-600 hover:bg-[#dce6fd]/60 hover:text-[#001a54]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[17px] text-[#001a54]">{group.materialIcon}</span>
                      <span>{group.label}</span>
                      <i className="fa-solid fa-chevron-down text-[10px] opacity-70 group-hover:rotate-180 transition-transform duration-200"></i>
                    </button>
                    
                    {/* Dropdown Menu - matching screenshot design */}
                    <div className="absolute left-0 top-full pt-1.5 hidden group-hover:block z-50">
                      <div className="w-56 bg-white shadow-xl shadow-slate-900/10 rounded-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-1.5 duration-150">
                        {permittedItems.map(item => {
                          const isItemActive = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => setActiveTab(item.id)}
                              className={`w-full text-left px-4 py-3 text-xs flex items-center gap-3 transition-colors ${
                                isItemActive
                                  ? 'bg-[#ebf2fe] text-[#001a54] font-bold'
                                  : 'text-[#1e293b] font-semibold hover:bg-[#ebf2fe] hover:text-[#001a54]'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[19px] text-[#1d3b7a]">{item.materialIcon}</span>
                              <span>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {onOpenCorretorPortal && (
              <button
                onClick={onOpenCorretorPortal}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 text-xs font-bold transition-all shadow-xs active:scale-95"
                title="Abrir visão do Corretor (Mobile / Web)"
              >
                <span className="material-symbols-outlined text-[17px] text-blue-700">smartphone</span>
                <span>Portal do Corretor</span>
              </button>
            )}

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