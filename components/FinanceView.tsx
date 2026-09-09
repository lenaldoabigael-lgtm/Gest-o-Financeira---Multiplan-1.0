
import React, { useState } from 'react';
import { PaymentLot, Proposal, ProposalRequirement, User } from '../types';
import { LOGO_BASE64 } from '../src/logo';
import { validateProposalForAdvance } from '../lib/validators';

interface FinanceViewProps {
  lots: PaymentLot[];
  proposals: Proposal[];
  requirements: ProposalRequirement[];
  user?: User;
  onPay: (id: string) => void;
  onGenerateLot: (corretor: string, proposalIds: string[]) => void;
  onReturnProposal?: (proposalId: string, lotId: string) => void;
  onReturnPendingProposal?: (proposalId: string) => Promise<void> | void;
  onEditProposal?: (proposal: Proposal) => void;
  onReverseLot?: (lotId: string) => Promise<void> | void;
}

const FinanceView: React.FC<FinanceViewProps> = ({ 
  lots, 
  proposals, 
  requirements, 
  user, 
  onPay, 
  onGenerateLot, 
  onReturnProposal, 
  onReturnPendingProposal,
  onEditProposal,
  onReverseLot 
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'LOTES' | 'AGUARDANDO'>('AGUARDANDO');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [dateFilter, setDateFilter] = useState('Todos');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [expandedLotId, setExpandedLotId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [confirmingReturnId, setConfirmingReturnId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [generatingBroker, setGeneratingBroker] = useState<string | null>(null);
  const [lotToReverse, setLotToReverse] = useState<PaymentLot | null>(null);
  const [isReversingLot, setIsReversingLot] = useState<boolean>(false);

  const isMasterUser = Boolean(
    user && (
      (user.email || '').toLowerCase().trim() === 'lenaldo.abigael@hotmail.com' ||
      (user.login || '').toLowerCase().trim() === 'lenaldo.abigael@hotmail.com' ||
      (user.login || '').toLowerCase().trim() === 'admin'
    )
  );

  const pendingProposals = proposals.filter(p => p.status === 'ENVIADA AO FINANCEIRO' && !p.lote_id);
  const groupedProposals = pendingProposals.reduce((acc, p) => {
    if (!acc[p.corretor]) acc[p.corretor] = [];
    acc[p.corretor].push(p);
    return acc;
  }, {} as Record<string, Proposal[]>);

  const handleFileChange = (lotId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFiles(prev => ({ ...prev, [lotId]: event.target.files![0] }));
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredLots = lots.filter(lot => {
    const lotProps = proposals.filter(p => p.lote_id === lot.id);
    const matchesSearch = 
      lot.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lotProps.some(p => 
        p.corretor.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.contrato && p.contrato.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    const matchesStatus = statusFilter === 'Todos' || 
                         (statusFilter === 'Pendente' && lot.status === 'PENDENTE') ||
                         (statusFilter === 'Pago' && lot.status === 'PAGO');
    let matchesDate = true;
    if (dateFilter !== 'Todos' && lot.vencimento) {
      const today = new Date();
      let lotDate = new Date();
      if (lot.vencimento !== 'Hoje') {
        if (lot.vencimento.match(/^\d{4}-\d{2}-\d{2}$/)) {
          lotDate = new Date(lot.vencimento);
        } else {
          lotDate = new Date(0);
        }
      }
      
      if (!isNaN(lotDate.getTime())) {
        if (dateFilter === 'Últimos 7 dias') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(today.getDate() - 7);
          matchesDate = lotDate >= sevenDaysAgo && lotDate <= today;
        } else if (dateFilter === 'Últimos 30 dias') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(today.getDate() - 30);
          matchesDate = lotDate >= thirtyDaysAgo && lotDate <= today;
        } else if (dateFilter === 'Este mês') {
          matchesDate = lotDate.getMonth() === today.getMonth() && lotDate.getFullYear() === today.getFullYear();
        } else if (dateFilter === 'Mês passado') {
          const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          matchesDate = lotDate.getMonth() === lastMonth.getMonth() && lotDate.getFullYear() === lastMonth.getFullYear();
        }
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const sortedLots = [...filteredLots].sort((a, b) => {
    if (!sortConfig) return 0;
    
    let aValue: any = a[sortConfig.key as keyof PaymentLot];
    let bValue: any = b[sortConfig.key as keyof PaymentLot];

    if (sortConfig.key === 'valorTotal') {
      aValue = Number(aValue);
      bValue = Number(bValue);
    } else if (sortConfig.key === 'qtdPropostas') {
      aValue = Number(aValue);
      bValue = Number(bValue);
    } else if (sortConfig.key === 'vencimento') {
      const getMs = (v: string) => {
         if (v === 'Hoje') return new Date().getTime();
         const d = new Date(v);
         return isNaN(d.getTime()) ? 0 : d.getTime();
      };
      aValue = getMs(aValue as string);
      bValue = getMs(bValue as string);
    }

    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const today = new Date();
  const pagoEsteMes = filteredLots.filter(l => {
    if (l.status !== 'PAGO' || !l.vencimento) return false;
    let d = new Date(l.vencimento === 'Hoje' ? today.getTime() : l.vencimento);
    if(isNaN(d.getTime())) return false;
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  }).reduce((acc, l) => acc + Number(l.valorTotal), 0);

  const pagoMesPassado = filteredLots.filter(l => {
    if (l.status !== 'PAGO' || !l.vencimento) return false;
    let d = new Date(l.vencimento === 'Hoje' ? today.getTime() : l.vencimento);
    if(isNaN(d.getTime())) return false;
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
  }).reduce((acc, l) => acc + Number(l.valorTotal), 0);

  let percentualCrescimento = 0;
  if (pagoMesPassado > 0) {
    percentualCrescimento = ((pagoEsteMes - pagoMesPassado) / pagoMesPassado) * 100;
  } else if (pagoEsteMes > 0) {
    percentualCrescimento = 100;
  }

  const totals = {
    pendente: filteredLots.filter(l => l.status === 'PENDENTE').reduce((acc, l) => acc + Number(l.valorTotal), 0),
    pagoHoje: filteredLots.filter(l => l.status === 'PAGO').reduce((acc, l) => acc + Number(l.valorTotal), 0), // Simplification
    countPendente: filteredLots.filter(l => l.status === 'PENDENTE').length,
    countPago: filteredLots.filter(l => l.status === 'PAGO').length
  };

  const formatDataAprovacao = (dateStr: string) => {
    if (!dateStr) return '-';
    if (dateStr.includes('T')) {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return dateStr;
  };

  const formatVencimento = (dateStr: string) => {
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    }
    return dateStr;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="bg-slate-900 p-4 rounded-xl flex items-center gap-4 text-white shadow-lg">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <i className="fa-solid fa-wallet text-xl"></i>
        </div>
        <div>
          <h1 className="text-lg font-black uppercase tracking-tighter">Módulo Financeiro</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Controle de Pagamentos e Comissões</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border-l-4 border-orange-500 shadow-sm flex justify-between items-start">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Aguardando Pagamento</p>
            <h2 className="text-2xl font-black text-slate-800">R$ {totals.pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
          </div>
          <span className="bg-orange-100 text-orange-600 text-[9px] font-black px-2 py-1 rounded-full uppercase">{totals.countPendente} {totals.countPendente === 1 ? 'Lote' : 'Lotes'}</span>
        </div>
        <div className="bg-white p-6 rounded-xl border-l-4 border-emerald-500 shadow-sm flex flex-col justify-center gap-2">
          <div className="flex justify-between items-start w-full">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pago (Total)</p>
            <h2 className="text-2xl font-black text-slate-800">R$ {totals.pagoHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
          </div>
          <span className="bg-emerald-100 text-emerald-600 text-[9px] font-black px-2 py-1 rounded-full uppercase">{totals.countPago} {totals.countPago === 1 ? 'Lote' : 'Lotes'}</span>
          </div>
          {percentualCrescimento !== 0 && (
             <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1 ${percentualCrescimento > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {percentualCrescimento > 0 ? <i className="fa-solid fa-arrow-trend-up"></i> : <i className="fa-solid fa-arrow-trend-down"></i>}
                  {Math.abs(percentualCrescimento).toFixed(1)}%
                </span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">vs. mês anterior</span>
             </div>
          )}
        </div>
        <div className="bg-white p-6 rounded-xl border-l-4 border-blue-500 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Previsão da Semana</p>
          <h2 className="text-2xl font-black text-slate-800">R$ {(totals.pendente + totals.pagoHoje).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
        </div>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-xl shadow-xs border border-slate-200/70 text-xs font-bold tracking-wider text-slate-500">
        <button 
          onClick={() => setActiveSubTab('AGUARDANDO')} 
          className={`flex-1 py-2.5 px-4 text-center rounded-lg transition-all cursor-pointer uppercase ${activeSubTab === 'AGUARDANDO' ? 'bg-white text-blue-600 shadow-sm font-black' : 'hover:text-slate-800'}`}
        >
          Aguardando Geração ({pendingProposals.length})
        </button>
        <button 
          onClick={() => setActiveSubTab('LOTES')} 
          className={`flex-1 py-2.5 px-4 text-center rounded-lg transition-all cursor-pointer uppercase ${activeSubTab === 'LOTES' ? 'bg-white text-blue-600 shadow-sm font-black' : 'hover:text-slate-800'}`}
        >
          Lotes de Pagamento ({lots.length})
        </button>
      </div>

      {activeSubTab === 'AGUARDANDO' && (
        <div className="space-y-4">
          {Object.keys(groupedProposals).length === 0 ? (
             <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center">
               <i className="fa-solid fa-folder-open text-4xl text-slate-200 mb-3"></i>
               <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhuma proposta aguardando geração de lote</p>
             </div>
          ) : (
            Object.entries(groupedProposals).map(([corretor, propsUncached]) => {
              const props = propsUncached as Proposal[];
              const totalCorretor = props.reduce((acc, p) => acc + Number(p.comissao || 0), 0);
              return (
                <div key={corretor} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-800 uppercase">{corretor || 'Sem Corretor'}</h3>
                      <p className="text-xs text-slate-500 font-bold">{props.length} {props.length === 1 ? 'proposta' : 'propostas'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Total Comissões</p>
                        <p className="text-lg font-black text-emerald-600 leading-none">R$ {totalCorretor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <button 
                        disabled={generatingBroker === corretor}
                        onClick={async () => {
                          if (!corretor || corretor.trim() === '' || corretor === 'Sem Corretor' || corretor === 'Corretor Geral') {
                            setAlertMessage('Não é possível gerar lote para propostas sem corretor/vendedora definido. Edite as propostas e informe o corretor.');
                            return;
                          }
                          for (const p of props) {
                            const val = validateProposalForAdvance(p);
                            if (!val.isValid) {
                              setAlertMessage(`Não é possível gerar lote. A proposta contrato "${p.contrato || 'Sem Contrato'}" possui pendências:\n• ${val.errors.join('\n• ')}\n\nPor favor, corrija a proposta antes de gerar o lote.`);
                              return;
                            }
                          }
                          try {
                            setGeneratingBroker(corretor);
                            await onGenerateLot(corretor, props.map(p => p.id));
                          } finally {
                            setGeneratingBroker(null);
                          }
                        }}
                        className={`font-semibold text-xs uppercase tracking-wider py-2.5 px-5 rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-2 active:scale-[0.98] ${
                          generatingBroker === corretor
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                        }`}
                      >
                        {generatingBroker === corretor ? (
                          <>
                            <i className="fa-solid fa-circle-notch fa-spin"></i> Gerando Lote...
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-layer-group"></i> Gerar Lote
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50">
                        <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          <th className="px-4 py-3 rounded-l-xl">Contrato</th>
                          <th className="px-4 py-3">Operadora</th>
                          <th className="px-4 py-3">Tipo do Plano</th>
                          <th className="px-4 py-3">Cliente</th>
                          <th className="px-4 py-3">Vidas</th>
                          <th className="px-4 py-3">Comissão</th>
                          <th className="px-4 py-3 text-right rounded-r-xl">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {props.map(p => (
                          <tr key={p.id} className="text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 text-slate-800">{p.contrato}</td>
                            <td className="px-4 py-3">{p.operadora}</td>
                            <td className="px-4 py-3 text-slate-500">{p.detalhes?.proposta?.tipoPlano || '-'}</td>
                            <td className="px-4 py-3">{p.cliente}</td>
                            <td className="px-4 py-3">{p.vidas}</td>
                            <td className={`px-4 py-3 font-extrabold ${Number(p.comissao || 0) < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                              R$ {Number(p.comissao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {onEditProposal && (
                                  <button
                                    onClick={() => onEditProposal(p)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50/90 hover:bg-blue-600 hover:text-white border border-blue-200/80 active:scale-[0.98] transition-all cursor-pointer shadow-xs whitespace-nowrap"
                                    title="Editar proposta"
                                  >
                                    <i className="fa-solid fa-pen-to-square text-xs"></i>
                                    <span>Editar</span>
                                  </button>
                                )}
                                {onReturnPendingProposal && (
                                  confirmingReturnId === p.id ? (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={async () => {
                                          await onReturnPendingProposal(p.id);
                                          setConfirmingReturnId(null);
                                        }}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer whitespace-nowrap"
                                        title="Confirmar devolução para status CADASTRADA"
                                      >
                                        <i className="fa-solid fa-check text-xs"></i>
                                        <span>Confirmar</span>
                                      </button>
                                      <button
                                        onClick={() => setConfirmingReturnId(null)}
                                        className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                                        title="Cancelar"
                                      >
                                        <i className="fa-solid fa-xmark"></i>
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setConfirmingReturnId(p.id)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50/90 hover:bg-amber-600 hover:text-white border border-amber-200/80 active:scale-[0.98] transition-all cursor-pointer shadow-xs whitespace-nowrap"
                                      title="Devolver proposta para status CADASTRADA"
                                    >
                                      <i className="fa-solid fa-rotate-left text-xs"></i>
                                      <span>Devolver</span>
                                    </button>
                                  )
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeSubTab === 'LOTES' && (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-layer-group text-blue-600"></i>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Lotes de Pagamento (Borderôs)</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input 
                type="text" 
                placeholder="Buscar por código, corretor, contrato..." 
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20 w-64"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="bg-slate-50 border border-slate-200 rounded-lg text-xs px-3 py-2 outline-none"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            >
              <option value="Todos">Vencimento: Todos</option>
              <option value="Últimos 7 dias">Últimos 7 dias</option>
              <option value="Últimos 30 dias">Últimos 30 dias</option>
              <option value="Este mês">Este mês</option>
              <option value="Mês passado">Mês passado</option>
            </select>
            <select 
              className="bg-slate-50 border border-slate-200 rounded-lg text-xs px-3 py-2 outline-none"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="Todos">Status: Todos</option>
              <option value="Pendente">Status: Pendente</option>
              <option value="Pago">Status: Pago</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('codigo')}>
                  Código do Lote {sortConfig?.key === 'codigo' && (sortConfig.direction === 'asc' ? <i className="fa-solid fa-sort-up ml-1"></i> : <i className="fa-solid fa-sort-down ml-1"></i>)}
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('aprovadoPor')}>
                  Aprovado por {sortConfig?.key === 'aprovadoPor' && (sortConfig.direction === 'asc' ? <i className="fa-solid fa-sort-up ml-1"></i> : <i className="fa-solid fa-sort-down ml-1"></i>)}
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('qtdPropostas')}>
                  Qtd. Propostas {sortConfig?.key === 'qtdPropostas' && (sortConfig.direction === 'asc' ? <i className="fa-solid fa-sort-up ml-1"></i> : <i className="fa-solid fa-sort-down ml-1"></i>)}
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('vencimento')}>
                  Vencimento {sortConfig?.key === 'vencimento' && (sortConfig.direction === 'asc' ? <i className="fa-solid fa-sort-up ml-1"></i> : <i className="fa-solid fa-sort-down ml-1"></i>)}
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('valorTotal')}>
                  Valor Total {sortConfig?.key === 'valorTotal' && (sortConfig.direction === 'asc' ? <i className="fa-solid fa-sort-up ml-1"></i> : <i className="fa-solid fa-sort-down ml-1"></i>)}
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('status')}>
                  Status {sortConfig?.key === 'status' && (sortConfig.direction === 'asc' ? <i className="fa-solid fa-sort-up ml-1"></i> : <i className="fa-solid fa-sort-down ml-1"></i>)}
                </th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedLots.map(lot => (
                <React.Fragment key={lot.id}>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-slate-800">{lot.codigo}</p>
                      <button 
                        onClick={() => setExpandedLotId(expandedLotId === lot.id ? null : lot.id)}
                        className="text-[9px] font-bold text-blue-600 hover:underline uppercase"
                      >
                        {expandedLotId === lot.id ? 'Ocultar detalhes' : 'Ver detalhes'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      {lot.status === 'PENDENTE' ? (
                        <p className="text-xs font-bold text-slate-400 italic">Aguardando...</p>
                      ) : (
                        <>
                          <p className="text-xs font-bold text-slate-700">{lot.aprovadoPor}</p>
                          <p className="text-[9px] text-slate-400">{formatDataAprovacao(lot.dataAprovacao)}</p>
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {lot.qtdPropostas} {lot.qtdPropostas === 1 ? 'proposta' : 'propostas'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold ${lot.vencimento === 'Hoje' ? 'text-red-500' : 'text-slate-600'}`}>
                        {formatVencimento(lot.vencimento)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-slate-800">
                      R$ {Number(lot.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      {lot.status === 'PENDENTE' ? (
                        <span className="bg-orange-100 text-orange-600 text-[9px] font-black px-2 py-1 rounded uppercase">Pendente</span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-600 text-[9px] font-black px-2 py-1 rounded uppercase flex items-center gap-1 w-fit">
                          <i className="fa-solid fa-check"></i> Pago
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {lot.status === 'PENDENTE' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => onPay(lot.id)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-sm hover:shadow transition-all cursor-pointer whitespace-nowrap"
                          >
                            <i className="fa-solid fa-circle-check text-blue-200 text-xs"></i>
                            <span>Confirmar Pagamento</span>
                          </button>
                          {isMasterUser && onReverseLot && (
                            <button
                              onClick={() => setLotToReverse(lot)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:text-white bg-rose-50/80 hover:bg-rose-600 border border-rose-200/80 hover:border-rose-600 active:scale-[0.98] transition-all cursor-pointer shadow-xs whitespace-nowrap"
                              title="Estornar/Excluir Lote (Ação Master: lenaldo.abigael@hotmail.com)"
                            >
                              <i className="fa-solid fa-rotate-left text-xs text-rose-500 hover:text-white"></i>
                              <span>Estornar</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => {
                            const lotProposals = proposals.filter(p => p.lote_id === lot.id);
                            
                            const impostos = requirements.filter(r => r.tipo === 'IMPOSTO_CORRETOR');
                            let totalComissoes = 0;
                            let totalDescontos = 0;

                            const rowsHtml = lotProposals.map(p => {
                              const comissaoBase = Number(p.comissao || 0);
                              const tipoPlano = (p.detalhes?.proposta?.tipoPlano || "").toUpperCase();
                              const corretor = p.corretor.toUpperCase();
                              const operadora = p.operadora.toUpperCase();

                              const pctStr = impostos.find(r => {
                                const parts = r.nome.split(" - ");
                                if (parts.length === 4) {
                                  const [c, op, tp] = parts;
                                  const matchCorretor = c === corretor || c === "TODOS" || c === "TODOS OS CORRETORES";
                                  const matchOperadora = op === operadora || op === "TODAS" || op === "TODAS AS OPERADORAS";
                                  const matchTipoPlano = tp === tipoPlano || tp === "TODOS OS TIPOS" || tp === "TODOS";
                                  return matchCorretor && matchOperadora && matchTipoPlano;
                                } else if (parts.length >= 3) {
                                  const [c, op] = parts;
                                  const matchCorretor = c === corretor || c === "TODOS" || c === "TODOS OS CORRETORES";
                                  const matchOperadora = op === operadora || op === "TODAS" || op === "TODAS AS OPERADORAS";
                                  return matchCorretor && matchOperadora;
                                }
                                return false;
                              });

                              let txPercentual = 0;
                              if (pctStr) {
                                const parts = pctStr.nome.split(" - ");
                                txPercentual = parseFloat(parts[parts.length - 1]) || 0;
                              }

                              const desconto = Number((comissaoBase * (txPercentual / 100)).toFixed(2));
                              const liquido = comissaoBase - desconto;

                              totalComissoes += comissaoBase;
                              totalDescontos += desconto;

                              return `
                                <tr>
                                  <td class="col-corretor"><strong>${p.corretor}</strong></td>
                                  <td class="col-contrato">${p.contrato || '-'}</td>
                                  <td class="col-cliente">${p.cliente || '-'}</td>
                                  <td class="col-operadora">${p.operadora || '-'}</td>
                                  <td class="col-plano">${p.detalhes?.proposta?.tipoPlano || '-'}</td>
                                  <td class="col-valor text-right">R$ ${comissaoBase.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td class="col-desconto text-right text-red-500">-${txPercentual.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}% (R$ ${desconto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                                  <td class="col-liquido text-right text-emerald">R$ ${liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                              `;
                            }).join('');
                            
                            const valorLiquidoTotal = totalComissoes - totalDescontos;

                            const receiptHtml = `
                              <!DOCTYPE html>
                              <html lang="pt-BR">
                              <head>
                                <meta charset="UTF-8">
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                <title>Comprovante de Pagamento - Lote ${lot.codigo}</title>
                                <style>
                                  * { box-sizing: border-box; }
                                  body { 
                                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
                                    padding: 24px 16px; 
                                    margin: 0; 
                                    background: #f1f5f9; 
                                    color: #0f172a; 
                                    -webkit-print-color-adjust: exact !important;
                                    print-color-adjust: exact !important;
                                  }
                                  .actions-bar {
                                    max-width: 860px;
                                    margin: 0 auto 16px auto;
                                    display: flex;
                                    justify-content: flex-end;
                                    gap: 12px;
                                  }
                                  .btn {
                                    padding: 10px 20px;
                                    font-size: 13px;
                                    font-weight: 700;
                                    border-radius: 8px;
                                    cursor: pointer;
                                    border: none;
                                    display: inline-flex;
                                    align-items: center;
                                    gap: 8px;
                                    transition: all 0.2s;
                                  }
                                  .btn-primary {
                                    background: #001a54;
                                    color: #ffffff;
                                    box-shadow: 0 2px 4px rgba(0, 26, 84, 0.2);
                                  }
                                  .btn-primary:hover {
                                    background: #002882;
                                  }
                                  .receipt-container { 
                                    max-width: 860px; 
                                    margin: 0 auto; 
                                    background: #ffffff; 
                                    padding: 32px 28px; 
                                    border-radius: 12px; 
                                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.05); 
                                  }
                                  .header { 
                                    display: flex; 
                                    justify-content: space-between; 
                                    align-items: flex-start; 
                                    border-bottom: 2px solid #e2e8f0; 
                                    padding-bottom: 20px; 
                                    margin-bottom: 24px; 
                                    gap: 20px;
                                  }
                                  .header-left {
                                    display: flex;
                                    flex-direction: column;
                                    gap: 8px;
                                  }
                                  .logo-img {
                                    height: 52px;
                                    max-width: 180px;
                                    object-fit: contain;
                                    object-position: left;
                                  }
                                  .title { 
                                    font-size: 20px; 
                                    font-weight: 900; 
                                    color: #001a54; 
                                    text-transform: uppercase; 
                                    margin: 0 0 4px 0; 
                                    letter-spacing: -0.02em;
                                  }
                                  .subtitle { 
                                    font-size: 13px; 
                                    color: #64748b; 
                                    margin: 0; 
                                  }
                                  .amount-box { 
                                    text-align: right; 
                                    flex-shrink: 0;
                                  }
                                  .amount-label { 
                                    font-size: 11px; 
                                    font-weight: 700; 
                                    color: #64748b; 
                                    text-transform: uppercase; 
                                    letter-spacing: 0.05em; 
                                    margin: 0 0 2px 0; 
                                  }
                                  .amount-value { 
                                    font-size: 26px; 
                                    font-weight: 900; 
                                    color: #059669; 
                                    margin: 0; 
                                    line-height: 1.1;
                                  }
                                  .amount-detail { 
                                    font-size: 11px; 
                                    color: #475569; 
                                    font-weight: 600; 
                                    margin-top: 6px; 
                                  }
                                  
                                  .info-grid { 
                                    display: grid; 
                                    grid-template-columns: 1fr 1fr; 
                                    gap: 16px; 
                                    margin-bottom: 24px; 
                                  }
                                  .info-item { 
                                    background: #f8fafc; 
                                    border: 1px solid #e2e8f0;
                                    padding: 12px 16px; 
                                    border-radius: 8px; 
                                  }
                                  .info-label { 
                                    font-size: 10px; 
                                    font-weight: 800; 
                                    color: #64748b; 
                                    text-transform: uppercase; 
                                    letter-spacing: 0.05em; 
                                    margin: 0 0 4px 0; 
                                  }
                                  .info-value { 
                                    font-size: 13px; 
                                    font-weight: 700; 
                                    color: #0f172a; 
                                    margin: 0; 
                                  }
                                  
                                  .section-title {
                                    font-size: 13px; 
                                    font-weight: 800; 
                                    color: #001a54; 
                                    margin: 0 0 10px 0; 
                                    text-transform: uppercase; 
                                    letter-spacing: 0.03em;
                                  }
                                  .table-container { 
                                    border: 1px solid #e2e8f0; 
                                    border-radius: 8px; 
                                    overflow: hidden; 
                                    width: 100%;
                                  }
                                  table { 
                                    width: 100%; 
                                    table-layout: fixed;
                                    border-collapse: collapse; 
                                    text-align: left; 
                                    font-size: 11px;
                                  }
                                  th { 
                                    background: #f8fafc; 
                                    padding: 10px 8px; 
                                    font-size: 10px; 
                                    font-weight: 800; 
                                    color: #475569; 
                                    text-transform: uppercase; 
                                    letter-spacing: 0.03em;
                                    border-bottom: 1.5px solid #e2e8f0; 
                                    overflow-wrap: break-word;
                                  }
                                  td { 
                                    padding: 8px 8px; 
                                    font-size: 11px; 
                                    color: #334155; 
                                    border-bottom: 1px solid #f1f5f9; 
                                    overflow-wrap: break-word;
                                    word-break: break-word;
                                  }
                                  tr:nth-child(even) td {
                                    background-color: #fafbfc;
                                  }
                                  tr:last-child td { 
                                    border-bottom: none; 
                                  }
                                  .text-right { 
                                    text-align: right; 
                                  }
                                  .text-emerald { 
                                    color: #059669; 
                                    font-weight: 700; 
                                  }
                                  .text-red-500 { 
                                    color: #e11d48; 
                                    font-weight: 600;
                                  }
                                  
                                  .col-corretor { width: 13%; }
                                  .col-contrato { width: 11%; }
                                  .col-cliente  { width: 21%; }
                                  .col-operadora { width: 10%; }
                                  .col-plano     { width: 10%; }
                                  .col-valor     { width: 11%; white-space: nowrap; }
                                  .col-desconto  { width: 12%; white-space: nowrap; }
                                  .col-liquido   { width: 12%; white-space: nowrap; }
                                  
                                  .footer-note { 
                                    text-align: center; 
                                    margin-top: 28px; 
                                    font-size: 11px; 
                                    color: #94a3b8; 
                                    border-top: 1px solid #e2e8f0; 
                                    padding-top: 16px; 
                                  }
                                  
                                  @page {
                                    size: A4 portrait;
                                    margin: 10mm 8mm 10mm 8mm;
                                  }
                                  @media print {
                                    body { 
                                      background: #ffffff !important; 
                                      padding: 0 !important; 
                                      margin: 0 !important; 
                                    }
                                    .no-print, .actions-bar { 
                                      display: none !important; 
                                    }
                                    .receipt-container { 
                                      box-shadow: none !important; 
                                      padding: 0 !important; 
                                      margin: 0 !important;
                                      max-width: 100% !important; 
                                      width: 100% !important;
                                      border-radius: 0 !important;
                                    }
                                    .header {
                                      margin-bottom: 16px !important;
                                      padding-bottom: 12px !important;
                                    }
                                    .info-grid {
                                      margin-bottom: 16px !important;
                                    }
                                    table {
                                      font-size: 9.5px !important;
                                    }
                                    th, td {
                                      padding: 6px 4px !important;
                                    }
                                    tr {
                                      page-break-inside: avoid;
                                    }
                                  }
                                </style>
                              </head>
                              <body>
                                <div class="actions-bar no-print">
                                  <button class="btn btn-primary" onclick="window.print()">
                                    🖨️ Imprimir Comprovante / PDF
                                  </button>
                                </div>
                                <div class="receipt-container">
                                  <div class="header">
                                    <div class="header-left">
                                      <img class="logo-img" src="${LOGO_BASE64 ? 'data:image/png;base64,' + LOGO_BASE64 : window.location.origin + '/logo.png'}" alt="Multi Plan Logo" onerror="this.style.display='none'" />
                                      <div>
                                        <h1 class="title">Comprovante de Pagamento</h1>
                                        <p class="subtitle">Borderô / Lote Nº: <strong>${lot.codigo}</strong></p>
                                      </div>
                                    </div>
                                    <div class="amount-box">
                                      <p class="amount-label">Valor Líquido Pago</p>
                                      <p class="amount-value">R$ ${valorLiquidoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                      <p class="amount-detail">Base: R$ ${totalComissoes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | Impostos/Retenções: R$ ${totalDescontos.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    </div>
                                  </div>
                                  
                                  <div class="info-grid">
                                    <div class="info-item">
                                      <p class="info-label">Aprovado Por</p>
                                      <p class="info-value">${lot.aprovadoPor}</p>
                                    </div>
                                    <div class="info-item">
                                      <p class="info-label">Data da Geração / Pagamento</p>
                                      <p class="info-value">${formatDataAprovacao(lot.dataAprovacao)}</p>
                                    </div>
                                  </div>
                                  
                                  <h3 class="section-title">Detalhamento das Propostas (${lot.qtdPropostas})</h3>
                                  <div class="table-container">
                                    <table>
                                      <thead>
                                        <tr>
                                          <th class="col-corretor">Corretor</th>
                                          <th class="col-contrato">Contrato</th>
                                          <th class="col-cliente">Cliente</th>
                                          <th class="col-operadora">Operadora</th>
                                          <th class="col-plano">Tipo Plano</th>
                                          <th class="col-valor text-right">Comissão Base</th>
                                          <th class="col-desconto text-right">Imposto/NF (%)</th>
                                          <th class="col-liquido text-right">Líquido Pago</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        ${rowsHtml}
                                      </tbody>
                                    </table>
                                  </div>
                                  
                                  <div class="footer-note">
                                    Este é um comprovante interno gerado automaticamente pelo sistema.<br/>
                                    <strong>SIS - Sistema Integrado de Saúde • Multi Plan Benefícios</strong>
                                  </div>
                                </div>
                              </body>
                              </html>
                            `;
                            
                            const w = window.open();
                            if (w) {
                              w.document.write(receiptHtml);
                              w.document.close();
                            } else {
                              alert('Por favor, permita pop-ups para visualizar o comprovante.');
                            }
                          }}
                          className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-blue-700 bg-slate-100/80 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 active:scale-[0.98] transition-all cursor-pointer shadow-xs whitespace-nowrap"
                        >
                          <i className="fa-solid fa-receipt text-slate-400 group-hover:text-blue-600 transition-colors text-xs"></i>
                          <span>Ver Comprovante</span>
                        </button>
                        {isMasterUser && onReverseLot && (
                          <button
                            onClick={() => setLotToReverse(lot)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:text-white bg-rose-50/80 hover:bg-rose-600 border border-rose-200/80 hover:border-rose-600 active:scale-[0.98] transition-all cursor-pointer shadow-xs whitespace-nowrap ml-auto"
                            title="Estornar Lote (Ação Master: lenaldo.abigael@hotmail.com)"
                          >
                            <i className="fa-solid fa-rotate-left text-xs text-rose-500 hover:text-white"></i>
                            <span>Estornar Lote</span>
                          </button>
                        )}
                      </div>
                      )}
                    </td>
                  </tr>
                  {expandedLotId === lot.id && (
                    <tr className="bg-slate-50/30">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                              <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <th className="px-4 py-3">Corretor</th>
                                <th className="px-4 py-3">Contrato</th>
                                <th className="px-4 py-3">Operadora</th>
                                <th className="px-4 py-3">Tipo do Plano</th>
                                <th className="px-4 py-3">Vidas</th>
                                <th className="px-4 py-3">Valor do Contrato</th>
                                <th className="px-4 py-3">Comissão</th>
                                <th className="px-4 py-3 text-right">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {proposals.filter(p => p.lote_id === lot.id).map(prop => (
                                <tr key={prop.id} className="hover:bg-slate-50/50">
                                  <td className="px-4 py-3 text-xs font-bold text-slate-700">{prop.corretor}</td>
                                  <td className="px-4 py-3 text-xs text-slate-600">{prop.contrato || '-'}</td>
                                  <td className="px-4 py-3 text-xs text-slate-600">{prop.operadora}</td>
                                  <td className="px-4 py-3 text-xs text-slate-600">{prop.detalhes?.proposta?.tipoPlano || '-'}</td>
                                  <td className="px-4 py-3 text-xs text-slate-600">{prop.vidas}</td>
                                  <td className="px-4 py-3 text-xs text-slate-600">
                                    R$ {Number(prop.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className={`px-4 py-3 text-xs font-bold ${Number(prop.comissao || 0) < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                    R$ {Number(prop.comissao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    {lot.status !== 'PAGO' && onReturnProposal && (
                                      <div className="flex gap-2 justify-end">
                                        {confirmingReturnId === prop.id ? (
                                          <>
                                            <button
                                              onClick={() => {
                                                onReturnProposal(prop.id, lot.id);
                                                setConfirmingReturnId(null);
                                              }}
                                              className="px-2 py-1 bg-red-600 text-white rounded-lg text-xs font-bold transition-all hover:bg-red-700 shadow-sm"
                                            >
                                              Confirmar
                                            </button>
                                            <button
                                              onClick={() => setConfirmingReturnId(null)}
                                              className="px-2 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all hover:bg-slate-300 shadow-sm"
                                            >
                                              <i className="fa-solid fa-xmark"></i>
                                            </button>
                                          </>
                                        ) : (
                                          <button
                                            onClick={() => setConfirmingReturnId(prop.id)}
                                            className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white transition-all shadow-sm"
                                            title="Devolver para status Cadastrada"
                                          >
                                            <i className="fa-solid fa-rotate-left text-xs"></i>
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))}
                              {proposals.filter(p => p.lote_id === lot.id).length === 0 && (
                                <tr>
                                  <td colSpan={8} className="px-4 py-6 text-center text-xs text-slate-500">
                                    Nenhuma proposta encontrada para este lote.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {sortedLots.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <i className="fa-solid fa-folder-open text-4xl text-slate-200 mb-3"></i>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhum lote encontrado</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {lotToReverse && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center text-lg font-bold">
                    <i className="fa-solid fa-rotate-left"></i>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">Estorno de Lote</h3>
                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <i className="fa-solid fa-shield-halved text-[9px]"></i> Ação Master (lenaldo.abigael@hotmail.com)
                    </span>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => !isReversingLot && setLotToReverse(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
                >
                  <i className="fa-solid fa-xmark text-base"></i>
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-500 uppercase">Código do Lote:</span>
                  <span className="font-black text-slate-800">{lotToReverse.codigo}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-500 uppercase">Status Atual:</span>
                  <span className={`font-black uppercase ${lotToReverse.status === 'PAGO' ? 'text-emerald-600' : 'text-orange-600'}`}>
                    {lotToReverse.status}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-500 uppercase">Valor Total:</span>
                  <span className="font-black text-slate-900">
                    R$ {Number(lotToReverse.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-500 uppercase">Propostas Vinculadas:</span>
                  <span className="font-black text-blue-600">
                    {proposals.filter(p => p.lote_id === lotToReverse.id).length} propostas
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 mb-6 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <i className="fa-solid fa-circle-exclamation text-amber-600"></i> Impacto do Estorno:
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-800">
                  <li>Todas as propostas vinculadas voltarão ao status <strong>"ENVIADA AO FINANCEIRO"</strong> para que possam ser reprocessadas.</li>
                  <li>O lote <strong>{lotToReverse.codigo}</strong> será excluído permanentemente do sistema.</li>
                  <li>Se houver lançamento gerado no Contas a Pagar deste lote, ele será cancelado.</li>
                </ul>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isReversingLot}
                  onClick={() => setLotToReverse(null)}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isReversingLot}
                  onClick={async () => {
                    if (!onReverseLot || !lotToReverse) return;
                    try {
                      setIsReversingLot(true);
                      await onReverseLot(lotToReverse.id);
                      setLotToReverse(null);
                    } catch (err: any) {
                      alert('Erro ao estornar lote: ' + (err.message || ''));
                    } finally {
                      setIsReversingLot(false);
                    }
                  }}
                  className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl uppercase tracking-wider transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isReversingLot ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin"></i> Estornando...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-rotate-left"></i> Confirmar Estorno
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {alertMessage !== '' && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 text-2xl">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">Atenção</h3>
              <p className="text-sm text-slate-600 mb-6">{alertMessage}</p>
              <button 
                type="button"
                onClick={() => setAlertMessage('')}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl transition-all"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceView;
