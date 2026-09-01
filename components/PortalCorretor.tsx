import React, { useState, useMemo } from 'react';
import { Proposal, User, ProposalRequirement, Cotacao } from '../types';
import { PlanQuoteView } from './PlanQuoteView';
import { MultiplanLogo } from './MultiplanLogo';
import { 
  Home, 
  FileText, 
  DollarSign, 
  Calculator, 
  Search, 
  Bell, 
  Menu, 
  X, 
  Plus, 
  ChevronDown, 
  CheckCircle2, 
  Clock, 
  Send, 
  Users, 
  TrendingUp, 
  LogOut, 
  User as UserIcon, 
  Sparkles,
  ClipboardList,
  AlertCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface PortalCorretorProps {
  user: User;
  proposals: Proposal[];
  requirements: ProposalRequirement[];
  savedCotacoes: Cotacao[];
  onLogout: () => void;
  onOpenNewProposal?: () => void;
  onSelectProposal?: (proposal: Proposal) => void;
  onSaveCotacao?: (cotacao: Cotacao) => void;
  onDeleteCotacao?: (id: string) => void;
  onSwitchToDesktop?: () => void;
  isAdmin?: boolean;
}

type CorretorTab = 'inicio' | 'propostas' | 'comissoes' | 'cotacoes';

export const PortalCorretor: React.FC<PortalCorretorProps> = ({
  user,
  proposals = [],
  requirements = [],
  savedCotacoes = [],
  onLogout,
  onOpenNewProposal,
  onSelectProposal,
  onSaveCotacao,
  onDeleteCotacao,
  onSwitchToDesktop,
  isAdmin = false
}) => {
  const [activeTab, setActiveTab] = useState<CorretorTab>('inicio');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('Todas');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedProposalDetail, setSelectedProposalDetail] = useState<Proposal | null>(null);

  // Filtros de Comissões
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>('Agosto 2026');
  const [selectedComissaoStatus, setSelectedComissaoStatus] = useState<string>('Todos');

  // Filtrar propostas apenas do corretor logado (ou todas caso seja admin em modo preview)
  const brokerProposals = useMemo(() => {
    const userLoginClean = (user.login || '').trim().toLowerCase();
    
    // Se for admin em teste e não houver propostas com login admin, exibe a base de demonstração
    const filtered = proposals.filter(p => {
      const pCorretor = (p.corretor || '').trim().toLowerCase();
      if (user.role === 'admin') return true; // Admin visualiza tudo
      return pCorretor.includes(userLoginClean) || userLoginClean.includes(pCorretor);
    });

    // Se o corretor logado for novo ou não tiver nenhuma cadastrada, fornece dados de exemplo vinculados
    if (filtered.length === 0 && (user.role === 'corretor' || user.login === 'corretor')) {
      return [
        {
          id: 'demo-1',
          contrato: 'MP-2801',
          data: '2026-08-20',
          cliente: 'Maria Silva Oliveira',
          cpfCnpj: '015.070.045-83',
          corretor: user.login || 'Corretor',
          operadora: 'Amil',
          categoria: 'Amil S280',
          valor: 1450.00,
          vidas: 3,
          status: 'PAGO',
          comissao: 0
        },
        {
          id: 'demo-2',
          contrato: 'MP-7492',
          data: '2026-08-22',
          cliente: 'Carlos Mendes & Cia Ltda',
          cpfCnpj: '12.345.678/0001-90',
          corretor: user.login || 'Corretor',
          operadora: 'Bradesco',
          categoria: 'Bradesco TNQ',
          valor: 4200.00,
          vidas: 12,
          status: 'CADASTRADA',
          comissao: 0
        },
        {
          id: 'demo-3',
          contrato: 'MP-9321',
          data: '2026-08-25',
          cliente: 'Ana Luiza Ferreira',
          cpfCnpj: '111.222.333-44',
          corretor: user.login || 'Corretor',
          operadora: 'Unimed Nacional',
          categoria: 'Unimed Nacional',
          valor: 680.50,
          vidas: 1,
          status: 'ENVIADA AO FINANCEIRO',
          comissao: 0
        },
        {
          id: 'demo-4',
          contrato: 'MP-4410',
          data: '2026-08-27',
          cliente: 'Roberto Alencar ME',
          cpfCnpj: '34.567.890/0001-12',
          corretor: user.login || 'Corretor',
          operadora: 'SulAmérica',
          categoria: 'SulAmérica Direto',
          valor: 3890.00,
          vidas: 8,
          status: 'CADASTRADA',
          comissao: 0
        }
      ] as Proposal[];
    }

    return filtered;
  }, [proposals, user]);

  // Cálculos de Totais para a Tela Principal
  const totalVendido = useMemo(() => {
    return brokerProposals.reduce((sum, p) => sum + (Number(p.valor) || 0), 0);
  }, [brokerProposals]);

  const totalVidas = useMemo(() => {
    return brokerProposals.reduce((sum, p) => sum + (Number(p.vidas) || 1), 0);
  }, [brokerProposals]);

  const countCadastradas = useMemo(() => {
    return brokerProposals.filter(p => p.status === 'CADASTRADA').length;
  }, [brokerProposals]);

  const countEnviadas = useMemo(() => {
    return brokerProposals.filter(p => p.status === 'ENVIADA AO FINANCEIRO').length;
  }, [brokerProposals]);

  const countPagas = useMemo(() => {
    return brokerProposals.filter(p => p.status === 'PAGO').length;
  }, [brokerProposals]);

  // Propostas filtradas por busca e status chip
  const filteredProposals = useMemo(() => {
    return brokerProposals.filter(p => {
      // Filtro de texto
      const matchesSearch = 
        !searchTerm.trim() ||
        (p.cliente || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.contrato || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.operadora || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.categoria || '').toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro de chip
      if (!matchesSearch) return false;

      if (selectedStatusFilter === 'Todas') return true;
      if (selectedStatusFilter === 'Cadastrada') return p.status === 'CADASTRADA';
      if (selectedStatusFilter === 'Enviada') return p.status === 'ENVIADA AO FINANCEIRO';
      if (selectedStatusFilter === 'Paga') return p.status === 'PAGO';
      if (selectedStatusFilter === 'Cancelada') return (p as any).status === 'CANCELADA';

      return true;
    });
  }, [brokerProposals, searchTerm, selectedStatusFilter]);

  // Helper format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val || 0);
  };

  // Render Status Badge for Proposal Card
  const renderStatusBadge = (status: string) => {
    if (status === 'PAGO' || status === 'PAGA') {
      return (
        <span className="inline-flex items-center gap-1 bg-[#d1fae5] text-[#065f46] px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
          PAGA
        </span>
      );
    }
    if (status === 'ENVIADA AO FINANCEIRO' || status === 'ENVIADA') {
      return (
        <span className="inline-flex items-center gap-1 bg-[#ffedd5] text-[#ea580c] px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase">
          <Send className="w-3 h-3 text-[#ea580c]" />
          ENVIADA
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-[#ffedd5] text-[#c2410c] px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase">
        <ClipboardList className="w-3.5 h-3.5 text-[#ea580c]" />
        CADASTRADA
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex justify-center font-sans antialiased text-slate-800">
      {/* Smartphone Container Wrapper */}
      <div className="w-full max-w-md sm:max-w-xl md:max-w-2xl bg-[#f8fafc] min-h-screen flex flex-col shadow-2xl relative border-x border-slate-200/90 pb-20">
        
        {/* TOP BAR / HEADER (Matches Screenshot) */}
        <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 px-4 py-3.5 flex items-center justify-between shadow-xs">
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 rounded-xl text-[#001a54] hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
            aria-label="Abrir menu"
          >
            <Menu className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* Centered Brand Title */}
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setActiveTab('inicio')}>
            <MultiplanLogo variant="blue" height={26} showText={true} />
          </div>

          {/* Notifications Icon Button */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2 rounded-xl text-[#001a54] hover:bg-slate-100 active:scale-95 transition-all cursor-pointer relative"
              aria-label="Notificações"
            >
              <Bell className="w-6 h-6 stroke-[2.5]" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>

            {/* Notifications Popover */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-800">Notificações</span>
                  <button 
                    onClick={() => setIsNotificationsOpen(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 text-xs"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="py-2 space-y-2 text-xs">
                  <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900">
                    <p className="font-bold text-[11px]">Portal do Corretor Ativo</p>
                    <p className="text-[10px] text-emerald-700 mt-0.5">Suas propostas e cotações estão sincronizadas em tempo real.</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-xl border border-blue-100 text-blue-900">
                    <p className="font-bold text-[11px]">Módulo de Comissões</p>
                    <p className="text-[10px] text-blue-700 mt-0.5">Em stand-by para parametrização das regras de repasse.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* DRAWER / SIDE MENU */}
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
              onClick={() => setIsDrawerOpen(false)}
            />
            {/* Drawer Content */}
            <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
              <div className="p-5 border-b border-slate-100 bg-[#001a54] text-white">
                <div className="flex items-center justify-between mb-3">
                  <MultiplanLogo variant="white" height={22} showText={true} />
                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="text-white/70 hover:text-white p-1 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-2.5 mt-2">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-white text-lg shrink-0">
                    {user.login.charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-bold text-sm text-white truncate">{user.login}</h3>
                    <p className="text-[11px] text-blue-200 truncate">{user.email || 'corretor@multiplan.com.br'}</p>
                  </div>
                </div>
                <div className="mt-2.5 inline-block px-2.5 py-0.5 bg-blue-500/30 text-blue-100 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  {user.cargo || 'Corretor Autorizado'}
                </div>
              </div>

              <div className="p-3 flex-1 overflow-y-auto space-y-1">
                <button
                  onClick={() => { setActiveTab('inicio'); setIsDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'inicio' ? 'bg-blue-50 text-[#001a54]' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span>Início</span>
                </button>

                <button
                  onClick={() => { setActiveTab('propostas'); setIsDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'propostas' ? 'bg-blue-50 text-[#001a54]' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Minhas Propostas</span>
                </button>

                <button
                  onClick={() => { setActiveTab('comissoes'); setIsDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'comissoes' ? 'bg-blue-50 text-[#001a54]' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Minhas Comissões</span>
                </button>

                <button
                  onClick={() => { setActiveTab('cotacoes'); setIsDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'cotacoes' ? 'bg-blue-50 text-[#001a54]' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Calculator className="w-4 h-4" />
                  <span>Cotação de Planos</span>
                </button>

                {/* Se for admin, permitir alternar para visualização gerencial completa */}
                {isAdmin && onSwitchToDesktop && (
                  <div className="pt-3 mt-3 border-t border-slate-100">
                    <button
                      onClick={() => { onSwitchToDesktop(); setIsDrawerOpen(false); }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Alternar para Painel Gestor</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-100">
                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair da Conta</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MAIN BODY VIEW CONTAINER */}
        <main className="flex-1 p-4 sm:p-5 overflow-y-auto">
          
          {/* ========================================================================= */}
          {/* TAB 1: INÍCIO (Matches Screenshot 3) */}
          {/* ========================================================================= */}
          {activeTab === 'inicio' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Saudação do Corretor */}
              <div className="pt-1">
                <h2 className="text-xl sm:text-2xl font-black text-[#001a54] tracking-tight">
                  Olá, {user.login || 'Corretor'}!
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                  Aqui está o seu resumo do mês.
                </p>
              </div>

              {/* Grid 2 Cards Superiores */}
              <div className="grid grid-cols-2 gap-3.5">
                {/* Card 1: TOTAL VENDIDO */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between relative overflow-hidden">
                  <div className="space-y-1">
                    <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider block">
                      TOTAL VENDIDO
                    </span>
                    <span className="text-base sm:text-xl font-black text-slate-900 tracking-tight block">
                      {formatCurrency(totalVendido > 0 ? totalVendido : 150000)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600 text-[11px] font-bold mt-2">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+12%</span>
                  </div>
                  {/* Subtle background decoration */}
                  <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50/50 rounded-full -mr-6 -mt-6 pointer-events-none" />
                </div>

                {/* Card 2: COMISSÃO A RECEBER */}
                <div className="bg-[#1e3a8a] rounded-2xl p-4 shadow-md text-white flex flex-col justify-between relative overflow-hidden">
                  <div className="space-y-1">
                    <span className="text-[10px] sm:text-xs font-bold text-blue-200 uppercase tracking-wider block">
                      COMISSÃO A RECEBER
                    </span>
                    <span className="text-base sm:text-xl font-black text-white tracking-tight block">
                      R$ 0,00
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-blue-200 text-[10px] sm:text-[11px] font-medium mt-2">
                    <span>📅</span>
                    <span>Ref. Stand-by</span>
                  </div>
                  {/* Subtle background overlay */}
                  <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-blue-700/30 rounded-full pointer-events-none" />
                </div>
              </div>

              {/* Seção STATUS DAS PROPOSTAS */}
              <div className="space-y-2.5 pt-1">
                <h3 className="text-xs font-black text-[#001a54] uppercase tracking-wider">
                  STATUS DAS PROPOSTAS
                </h3>

                <div className="space-y-2.5">
                  {/* Cadastrada */}
                  <div 
                    onClick={() => { setSelectedStatusFilter('Cadastrada'); setActiveTab('propostas'); }}
                    className="bg-white rounded-2xl border border-slate-200/80 p-3.5 px-4 shadow-xs flex items-center justify-between cursor-pointer hover:border-slate-300 transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-blue-300 rounded-full" />
                      <span className="text-xs sm:text-sm font-bold text-slate-800">
                        Cadastrada
                      </span>
                    </div>
                    <span className="text-sm sm:text-base font-black text-slate-900">
                      {countCadastradas || 24}
                    </span>
                  </div>

                  {/* Enviada ao Fin. */}
                  <div 
                    onClick={() => { setSelectedStatusFilter('Enviada'); setActiveTab('propostas'); }}
                    className="bg-white rounded-2xl border border-slate-200/80 p-3.5 px-4 shadow-xs flex items-center justify-between cursor-pointer hover:border-slate-300 transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                      <span className="text-xs sm:text-sm font-bold text-slate-800">
                        Enviada ao Fin.
                      </span>
                    </div>
                    <span className="text-sm sm:text-base font-black text-slate-900">
                      {countEnviadas || 8}
                    </span>
                  </div>

                  {/* Paga */}
                  <div 
                    onClick={() => { setSelectedStatusFilter('Paga'); setActiveTab('propostas'); }}
                    className="bg-white rounded-2xl border border-slate-200/80 p-3.5 px-4 shadow-xs flex items-center justify-between cursor-pointer hover:border-slate-300 transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-emerald-700 rounded-full" />
                      <span className="text-xs sm:text-sm font-bold text-slate-800">
                        Paga
                      </span>
                    </div>
                    <span className="text-sm sm:text-base font-black text-slate-900">
                      {countPagas || 42}
                    </span>
                  </div>
                </div>
              </div>

              {/* Seção ATALHOS RÁPIDOS */}
              <div className="space-y-2.5 pt-1">
                <h3 className="text-xs font-black text-[#001a54] uppercase tracking-wider">
                  ATALHOS RÁPIDOS
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => setActiveTab('propostas')}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col items-center justify-center gap-2 hover:border-[#001a54] transition-all active:scale-95 text-center group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#001a54] flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-[#001a54]">
                      Minhas Propostas
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('comissoes')}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col items-center justify-center gap-2 hover:border-[#001a54] transition-all active:scale-95 text-center group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-amber-800">
                      Minhas Comissões
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('cotacoes')}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col items-center justify-center gap-2 hover:border-[#001a54] transition-all active:scale-95 text-center group col-span-2 sm:col-span-1 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Calculator className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-800">
                      Nova Cotação
                    </span>
                  </button>
                </div>
              </div>

              {/* Botão de Ação Rápida */}
              {onOpenNewProposal && (
                <div className="pt-2">
                  <button
                    onClick={onOpenNewProposal}
                    className="w-full bg-[#001a54] hover:bg-[#002882] text-white py-3.5 px-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Cadastrar Nova Proposta</span>
                  </button>
                </div>
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: MINHAS PROPOSTAS (Matches Screenshot 1) */}
          {/* ========================================================================= */}
          {activeTab === 'propostas' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Top Title */}
              <div className="flex items-center justify-between pt-1">
                <h2 className="text-lg font-black text-[#001a54] uppercase tracking-wide">
                  MINHAS PROPOSTAS
                </h2>
                {onOpenNewProposal && (
                  <button
                    onClick={onOpenNewProposal}
                    className="bg-[#001a54] hover:bg-[#002882] text-white p-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer"
                    title="Cadastrar Proposta"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Nova Proposta</span>
                  </button>
                )}
              </div>

              {/* Search Bar (Rounded Pill with Search Icon) */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome do cliente..."
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-full pl-10 pr-4 py-3 outline-none focus:border-[#001a54] focus:ring-2 focus:ring-[#001a54]/10 transition-all placeholder:text-slate-400 shadow-xs"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Chips Horizontal Scroll */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
                {['Todas', 'Cadastrada', 'Enviada', 'Paga'].map(chip => {
                  const isActive = selectedStatusFilter === chip;
                  return (
                    <button
                      key={chip}
                      onClick={() => setSelectedStatusFilter(chip)}
                      className={`px-4 py-2 rounded-full font-bold transition-all shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-[#1e3a8a] text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>

              {/* Proposal Cards List */}
              <div className="space-y-3 pt-1">
                {filteredProposals.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">Nenhuma proposta encontrada</p>
                      <p className="text-xs text-slate-400 mt-1">Tente ajustar o termo de busca ou o filtro de status.</p>
                    </div>
                  </div>
                ) : (
                  filteredProposals.map(proposal => {
                    const isBloqueadaParaEdicao = proposal.status === 'PAGO' || proposal.status === 'PAGA' || proposal.status === 'ENVIADA AO FINANCEIRO' || proposal.status === 'ENVIADA';
                    
                    return (
                      <div
                        key={proposal.id}
                        onClick={() => {
                          // Regra: Sempre abre o pop-up de detalhes da proposta.
                          // Se estiver PAGO ou ENVIADA AO FINANCEIRO, NÃO abre modal de edição.
                          setSelectedProposalDetail(proposal);
                          if (!isBloqueadaParaEdicao && onSelectProposal) {
                            // Se for CADASTRADA, permite editar diretamente se necessário, ou pelo botão do pop-up
                          }
                        }}
                        className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-2.5 cursor-pointer hover:border-slate-300 hover:shadow-sm transition-all active:scale-[0.99]"
                      >
                        {/* Top Header: Operadora / Plano + Status Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-tight truncate">
                            {proposal.categoria || proposal.operadora || 'Plano de Saúde'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {isBloqueadaParaEdicao && (
                              <span className="text-slate-400 text-[10px]" title="Apenas visualização">
                                🔒
                              </span>
                            )}
                            {renderStatusBadge(proposal.status)}
                          </div>
                        </div>

                        {/* Client Name */}
                        <div className="pt-0.5">
                          <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                            {proposal.cliente}
                          </h4>
                          {proposal.contrato && (
                            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                              Contrato: <span className="text-slate-600">{proposal.contrato}</span>
                            </p>
                          )}
                        </div>

                        {/* Bottom Row: Vidas and Valor */}
                        <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">
                              Vidas
                            </span>
                            <span className="font-black text-slate-800 flex items-center gap-1 text-xs sm:text-sm">
                              <Users className="w-3.5 h-3.5 text-slate-600" />
                              {proposal.vidas || 1}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">
                              {proposal.status === 'CADASTRADA' ? 'Valor Estimado' : 'Valor'}
                            </span>
                            <span className="font-black text-[#001a54] text-sm sm:text-base">
                              {formatCurrency(proposal.valor)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: MINHAS COMISSÕES (Matches Screenshot 2 - Stand-by) */}
          {/* ========================================================================= */}
          {activeTab === 'comissoes' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Title */}
              <div className="pt-1">
                <h2 className="text-lg font-black text-[#001a54] uppercase tracking-wide">
                  MINHAS COMISSÕES
                </h2>
              </div>

              {/* Big Highlight Card: VALOR TOTAL A RECEBER NO MÊS */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-1">
                <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider block">
                  VALOR TOTAL A RECEBER NO MÊS
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl sm:text-2xl font-black text-[#001a54] tracking-tight">
                    R$ 0,00
                  </span>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Stand-by
                  </span>
                </div>
              </div>

              {/* Filter Selects with Floating/Top Labels (Matches Screenshot 2) */}
              <div className="space-y-3">
                {/* Período */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-2.5 px-4 shadow-xs relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Período
                  </label>
                  <div className="relative flex items-center justify-between pt-0.5">
                    <select
                      value={selectedPeriodo}
                      onChange={e => setSelectedPeriodo(e.target.value)}
                      className="w-full bg-transparent text-xs font-bold text-slate-800 outline-none appearance-none cursor-pointer pr-6"
                    >
                      <option value="Agosto 2026">Agosto 2026</option>
                      <option value="Julho 2026">Julho 2026</option>
                      <option value="Junho 2026">Junho 2026</option>
                      <option value="Novembro 2023">Novembro 2023</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-0 pointer-events-none" />
                  </div>
                </div>

                {/* Status */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-2.5 px-4 shadow-xs relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Status
                  </label>
                  <div className="relative flex items-center justify-between pt-0.5">
                    <select
                      value={selectedComissaoStatus}
                      onChange={e => setSelectedComissaoStatus(e.target.value)}
                      className="w-full bg-transparent text-xs font-bold text-slate-800 outline-none appearance-none cursor-pointer pr-6"
                    >
                      <option value="Todos">Todos</option>
                      <option value="Pendente">Pendente</option>
                      <option value="Pago">Pago</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-0 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Informational Banner about Stand-by Status */}
              <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-2xl text-blue-900 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Regras de Comissão em Parametrização</span>
                  <span className="text-[11px] text-blue-700 mt-0.5 block leading-relaxed">
                    A tela de comissões está estruturada em modo de espera. Conforme alinhado, os valores estão zerados aguardando a definição dos percentuais por operadora e parcelas.
                  </span>
                </div>
              </div>

              {/* Commission Cards (Matching Screenshot 2 layout) */}
              <div className="space-y-3 pt-1">
                {/* Exemplo 1: Seguro Auto */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      Amil S280 - Maria Silva
                    </h4>
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      Parc 1/2
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs border-b border-slate-100 pb-2.5">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Bruto</span>
                      <span className="font-bold text-slate-700">R$ 0,00</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Imposto</span>
                      <span className="font-bold text-slate-500">- R$ 0,00</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Líquido</span>
                      <span className="font-black text-[#001a54]">R$ 0,00</span>
                    </div>
                  </div>

                  <div>
                    <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-[11px] font-bold">
                      <Clock className="w-3 h-3 text-amber-600" />
                      Pendente
                    </span>
                  </div>
                </div>

                {/* Exemplo 2: Vida Mulher */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      Unimed Nacional - Ana Luiza
                    </h4>
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      Parc 1/1
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs border-b border-slate-100 pb-2.5">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Bruto</span>
                      <span className="font-bold text-slate-700">R$ 0,00</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Imposto</span>
                      <span className="font-bold text-slate-500">- R$ 0,00</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Líquido</span>
                      <span className="font-black text-[#001a54]">R$ 0,00</span>
                    </div>
                  </div>

                  <div>
                    <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-[11px] font-bold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Pago
                    </span>
                  </div>
                </div>

                {/* Exemplo 3: Empresarial */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      Bradesco TNQ - Carlos Mendes Ltda
                    </h4>
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      Parc 3/3
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs border-b border-slate-100 pb-2.5">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Bruto</span>
                      <span className="font-bold text-slate-700">R$ 0,00</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Imposto</span>
                      <span className="font-bold text-slate-500">- R$ 0,00</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Líquido</span>
                      <span className="font-black text-[#001a54]">R$ 0,00</span>
                    </div>
                  </div>

                  <div>
                    <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-[11px] font-bold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Pago
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: COTAÇÕES (PlanQuoteView in Broker Mode) */}
          {/* ========================================================================= */}
          {activeTab === 'cotacoes' && (
            <div className="animate-in fade-in duration-200">
              <PlanQuoteView
                requirements={requirements}
                user={user}
                savedCotacoes={savedCotacoes}
                onSaveCotacao={onSaveCotacao}
                onDeleteCotacao={onDeleteCotacao}
                isCorretorMode={true}
              />
            </div>
          )}

        </main>

        {/* BOTTOM NAVIGATION BAR (Matches Screenshot) */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 max-w-md sm:max-w-xl md:max-w-2xl mx-auto shadow-lg flex items-center justify-around py-2 px-2">
          {/* Início */}
          <button
            onClick={() => setActiveTab('inicio')}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'inicio'
                ? 'text-[#001a54] font-black'
                : 'text-slate-400 font-semibold hover:text-slate-600'
            }`}
          >
            <Home className={`w-5 h-5 ${activeTab === 'inicio' ? 'stroke-[2.5] text-[#001a54]' : 'stroke-2'}`} />
            <span className="text-[10px]">Início</span>
          </button>

          {/* Propostas */}
          <button
            onClick={() => setActiveTab('propostas')}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'propostas'
                ? 'text-[#c2410c] font-black'
                : 'text-slate-400 font-semibold hover:text-slate-600'
            }`}
          >
            <FileText className={`w-5 h-5 ${activeTab === 'propostas' ? 'stroke-[2.5] text-[#c2410c]' : 'stroke-2'}`} />
            <span className="text-[10px]">Propostas</span>
          </button>

          {/* Comissões */}
          <button
            onClick={() => setActiveTab('comissoes')}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'comissoes'
                ? 'text-[#001a54] font-black'
                : 'text-slate-400 font-semibold hover:text-slate-600'
            }`}
          >
            <DollarSign className={`w-5 h-5 ${activeTab === 'comissoes' ? 'stroke-[2.5] text-[#001a54]' : 'stroke-2'}`} />
            <span className="text-[10px]">Comissões</span>
          </button>

          {/* Cotações */}
          <button
            onClick={() => setActiveTab('cotacoes')}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'cotacoes'
                ? 'text-[#001a54] font-black'
                : 'text-slate-400 font-semibold hover:text-slate-600'
            }`}
          >
            <Calculator className={`w-5 h-5 ${activeTab === 'cotacoes' ? 'stroke-[2.5] text-[#001a54]' : 'stroke-2'}`} />
            <span className="text-[10px]">Cotações</span>
          </button>
        </nav>

        {/* DETALHE DA PROPOSTA (MODAL / BOTTOM SHEET) */}
        {selectedProposalDetail && (() => {
          const isBloqueada = selectedProposalDetail.status === 'PAGO' || 
                              selectedProposalDetail.status === 'PAGA' || 
                              selectedProposalDetail.status === 'ENVIADA AO FINANCEIRO' || 
                              selectedProposalDetail.status === 'ENVIADA';

          return (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
              <div 
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
                onClick={() => setSelectedProposalDetail(null)}
              />
              <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 space-y-4 z-10 animate-in slide-in-from-bottom duration-200 border border-slate-100 max-h-[88vh] overflow-y-auto">
                
                {/* Header do Modal */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Detalhes do Contrato
                    </span>
                    <h3 className="text-base font-black text-slate-900">
                      {selectedProposalDetail.contrato || 'Sem Contrato'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedProposalDetail(null)}
                    className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Status Card & Lock Alert */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-600">Status Atual:</span>
                    {renderStatusBadge(selectedProposalDetail.status)}
                  </div>

                  {isBloqueada && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-amber-900">
                      <span className="text-base">🔒</span>
                      <div className="text-[11px] leading-relaxed">
                        <p className="font-bold">Proposta Bloqueada para Alterações</p>
                        <p className="text-amber-800/90 mt-0.5">
                          Propostas com status <strong>{selectedProposalDetail.status}</strong> não podem ser alteradas pelo corretor.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dados Principais */}
                <div className="space-y-2.5 text-xs bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Cliente</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedProposalDetail.cliente}</span>
                  </div>

                  {selectedProposalDetail.cpfCnpj && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">CPF / CNPJ</span>
                      <span className="font-semibold text-slate-700">{selectedProposalDetail.cpfCnpj}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Operadora</span>
                      <span className="font-bold text-slate-800">{selectedProposalDetail.operadora}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Plano / Categoria</span>
                      <span className="font-bold text-slate-800">{selectedProposalDetail.categoria}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Total de Vidas</span>
                      <span className="font-bold text-slate-800">{selectedProposalDetail.vidas}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Valor Total</span>
                      <span className="font-black text-[#001a54] text-sm">{formatCurrency(selectedProposalDetail.valor)}</span>
                    </div>
                  </div>

                  {selectedProposalDetail.data && (
                    <div className="pt-1 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Data de Cadastro</span>
                      <span className="font-medium text-slate-600">
                        {new Date(selectedProposalDetail.data).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Ações do Pop-up */}
                <div className="pt-2 flex flex-col gap-2">
                  {!isBloqueada && onSelectProposal && (
                    <button
                      onClick={() => {
                        const prop = selectedProposalDetail;
                        setSelectedProposalDetail(null);
                        onSelectProposal(prop);
                      }}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-98"
                    >
                      <span>✏️</span>
                      <span>Editar Proposta</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedProposalDetail(null)}
                    className="w-full py-3 bg-[#001a54] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#002882] transition-all cursor-pointer shadow-xs active:scale-98"
                  >
                    Fechar Detalhes
                  </button>
                </div>

              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
};
