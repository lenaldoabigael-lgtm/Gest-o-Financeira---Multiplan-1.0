import React, { useState, useMemo } from 'react';
import { Proposal, ProposalRequirement } from '../types';

interface SellerBoardProps {
  proposals: Proposal[];
  requirements: ProposalRequirement[];
  onStatusChange: (id: string, novoStatus: 'CADASTRADA' | 'ENVIADA AO FINANCEIRO' | 'PAGO') => void;
}

export function getDiasParaPagamento(
  operadora: string,
  tipoPlano: string,
  categoria: string,
  requirements: ProposalRequirement[]
): number {
  const op = (operadora || '').toLowerCase().trim();
  const cat = (categoria || '').toLowerCase();
  const tipo = (tipoPlano || '').toLowerCase();

  const prazoReqs = (requirements || []).filter(r => r.tipo === 'PRAZO_PAGAMENTO');

  let bestMatchDays = 5;
  let currentMatchScore = -1;

  for (const req of prazoReqs) {
    const nome = req.nome.toLowerCase();
    const parts = nome.split('-');
    if (parts.length < 2) continue;

    const reqOp = parts[0].trim();

    if (op.includes(reqOp) || reqOp.includes(op)) {
      const daysStr = parts[parts.length - 1];
      const match = daysStr.match(/(\d+)/);
      if (!match) continue;

      const days = parseInt(match[1], 10);
      let score = 0;

      const ruleStr = parts.length >= 3 ? parts[1].trim() : reqOp;
      const hasPJ = ruleStr.includes('pj') || ruleStr.includes('empresarial');
      const hasPF =
        ruleStr.includes('pf') ||
        ruleStr.includes('adesão') ||
        ruleStr.includes('adesao') ||
        ruleStr.includes('individual');

      const isPropPJ =
        cat.includes('pj') || tipo.includes('empresarial') || cat.includes('empresarial');
      const isPropPF = !isPropPJ;

      if (hasPJ && isPropPJ) score = 2;
      else if (hasPF && isPropPF) score = 2;
      else if (!hasPJ && !hasPF) score = 1;
      else score = 0;

      if (score > currentMatchScore) {
        currentMatchScore = score;
        bestMatchDays = days;
      }
    }
  }

  if (currentMatchScore === -1) {
    if (op.includes('hapvida')) return 1;
    if (op.includes('servdonto'))
      return cat.includes('pj') || tipo.includes('empresarial') ? 2 : 1;
    if (op.includes('sulamerica') || op.includes('sulamérica'))
      return cat.includes('pj') || tipo.includes('empresarial') || cat.includes('empresarial')
        ? 10
        : 1;
    if (op.includes('bradesco') || op.includes('unimed') || op.includes('odontoprev')) return 10;
    if (op.includes('amil') || op.includes('select') || op.includes('plamed')) return 8;
    if (op.includes('odonto s/a') || op.includes('odonto sa')) return 15;
    if (op.includes('blue')) return 1;
  }

  return bestMatchDays;
}

export const SellerBoard: React.FC<SellerBoardProps> = ({
  proposals = [],
  requirements = [],
  onStatusChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOperadora, setSelectedOperadora] = useState('TODAS');
  const [selectedCorretor, setSelectedCorretor] = useState('TODOS');
  const [filterAtrasadasOnly, setFilterAtrasadasOnly] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedProposalDetails, setSelectedProposalDetails] = useState<Proposal | null>(null);
  const [alertMessage, setAlertMessage] = useState('');

  // Extract unique operadoras and corretores for filters
  const availableOperadoras = useMemo(() => {
    const set = new Set(proposals.map(p => p.operadora).filter(Boolean));
    return ['TODAS', ...Array.from(set).sort()];
  }, [proposals]);

  const availableCorretores = useMemo(() => {
    const set = new Set(proposals.map(p => p.corretor).filter(Boolean));
    return ['TODOS', ...Array.from(set).sort()];
  }, [proposals]);

  // Helper date calculator
  const getProposalSLACalculation = (p: Proposal) => {
    const isEnviada = p.status === 'ENVIADA AO FINANCEIRO';
    const isPago = p.status === 'PAGO';
    let diasSLA = 0;
    let vencimentoFormatted = '';
    let isAtrasado = false;
    let diasAtraso = 0;
    let dataConclusao = '';

    const hist = p.detalhes?.historico?.find(
      (h: any) => h.status === 'ENVIADA AO FINANCEIRO'
    );
    const dataBase = hist ? new Date(hist.data) : new Date(p.data || Date.now());
    diasSLA = getDiasParaPagamento(
      p.operadora,
      p.detalhes?.proposta?.tipoPlano || '',
      p.categoria,
      requirements
    );

    const dataVencimento = new Date(dataBase);
    dataVencimento.setDate(dataVencimento.getDate() + diasSLA);
    
    // Format YYYY-MM-DD or DD/MM/YYYY
    const y = dataVencimento.getFullYear();
    const m = String(dataVencimento.getMonth() + 1).padStart(2, '0');
    const d = String(dataVencimento.getDate()).padStart(2, '0');
    vencimentoFormatted = `${d}/${m}/${y}`;

    if (isEnviada) {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const target = new Date(dataVencimento);
      target.setHours(0, 0, 0, 0);

      const diffTime = target.getTime() - hoje.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        isAtrasado = true;
        diasAtraso = Math.abs(diffDays);
      }
    }

    if (isPago) {
      const histPago = p.detalhes?.historico?.find((h: any) => h.status === 'PAGO');
      const dPago = histPago ? new Date(histPago.data) : new Date(p.data || Date.now());
      dataConclusao = `${dPago.getFullYear()}-${String(dPago.getMonth() + 1).padStart(2, '0')}-${String(dPago.getDate()).padStart(2, '0')}`;
    }

    return {
      diasSLA,
      vencimentoFormatted,
      isAtrasado,
      diasAtraso,
      dataConclusao
    };
  };

  // Filter proposals
  const filteredProposals = useMemo(() => {
    return proposals.filter(p => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        (p.cliente && p.cliente.toLowerCase().includes(term)) ||
        (p.cpfCnpj && p.cpfCnpj.toLowerCase().includes(term)) ||
        (p.contrato && p.contrato.toLowerCase().includes(term)) ||
        (p.id && p.id.toLowerCase().includes(term));

      const matchesOperadora =
        selectedOperadora === 'TODAS' || p.operadora === selectedOperadora;
      const matchesCorretor =
        selectedCorretor === 'TODOS' || p.corretor === selectedCorretor;

      if (filterAtrasadasOnly) {
        const sla = getProposalSLACalculation(p);
        if (!sla.isAtrasado) return false;
      }

      return matchesSearch && matchesOperadora && matchesCorretor;
    });
  }, [
    proposals,
    searchTerm,
    selectedOperadora,
    selectedCorretor,
    filterAtrasadasOnly,
    requirements
  ]);

  const columns = [
    {
      id: 'CADASTRADA',
      title: 'Em Análise',
      dotColor: 'bg-[#001a54]',
      badgeBg: 'bg-slate-100 text-slate-700'
    },
    {
      id: 'ENVIADA AO FINANCEIRO',
      title: 'Aguardando Pgto',
      dotColor: 'bg-[#e85d04]',
      badgeBg: 'bg-orange-50 text-[#e85d04] border border-orange-100'
    },
    {
      id: 'PAGO',
      title: 'Concluídas',
      dotColor: 'bg-emerald-500',
      badgeBg: 'bg-emerald-50 text-emerald-700 border border-emerald-100'
    }
  ];

  const activeFiltersCount =
    (selectedOperadora !== 'TODAS' ? 1 : 0) +
    (selectedCorretor !== 'TODOS' ? 1 : 0) +
    (filterAtrasadasOnly ? 1 : 0);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* TOP HEADER MATCHING SCREENSHOT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#001a54] tracking-tight">
            Acompanhamento de Propostas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
            Visão consolidada do fluxo de contratos e repasses das operadoras.
          </p>
        </div>

        {/* SEARCH & FILTER BAR ON TOP RIGHT */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar proposta, cliente ou CPF"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#001a54]/15 focus:border-[#001a54] transition-all placeholder:text-slate-400 shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                &times;
              </button>
            )}
          </div>

          <button
            onClick={() => setIsFilterModalOpen(true)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border shadow-2xs active:scale-95 ${
              activeFiltersCount > 0
                ? 'bg-orange-50 border-orange-200 text-[#e85d04]'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">filter_list</span>
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#e85d04] text-white text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* KANBAN BOARD 3 COLUMNS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {columns.map(col => {
          const colProposals = filteredProposals.filter(p => p.status === col.id);

          return (
            <div
              key={col.id}
              className="bg-[#f8fafd] rounded-2xl border border-slate-200/90 flex flex-col min-h-[760px] p-4 shadow-2xs"
            >
              {/* Column Header matching screenshot */}
              <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                    {col.title}
                  </h2>
                </div>

                <span className="bg-white border border-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-2xs">
                  {colProposals.length}
                </span>
              </div>

              {/* Column Content */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-0.5 scrollbar-thin">
                {colProposals.length > 0 ? (
                  colProposals.map(p => {
                    const sla = getProposalSLACalculation(p);
                    const propCode = p.contrato
                      ? p.contrato.startsWith('PROP-')
                        ? p.contrato
                        : `PROP-${p.contrato}`
                      : p.cpfCnpj
                      ? `PROP-${p.cpfCnpj}`
                      : `PROP-${p.id.slice(0, 8).toUpperCase()}`;

                    const isCartaoCorretora =
                      (p.categoria && p.categoria.toLowerCase().includes('cartão')) ||
                      (p.categoria && p.categoria.toLowerCase().includes('cartao')) ||
                      p.categoria === 'Cartão Corretora';

                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProposalDetails(p)}
                        className={`bg-white rounded-2xl p-4 shadow-2xs border transition-all hover:shadow-md cursor-pointer relative ${
                          sla.isAtrasado
                            ? 'border-red-400 ring-1 ring-red-400/30'
                            : 'border-slate-200/90 hover:border-slate-300'
                        }`}
                      >
                        {/* Top Card: Code on left, Operadora badge on right */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[11px] font-bold text-slate-500 font-mono tracking-tight truncate">
                            {propCode}
                          </span>

                          <span className="bg-white border border-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                            {p.operadora || 'OPERADORA'}
                          </span>
                        </div>

                        {/* Client Name */}
                        <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 mb-2.5 uppercase tracking-tight line-clamp-1">
                          {p.cliente || 'CLIENTE SEM NOME'}
                        </h3>

                        {/* Badges / Tags Row */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-3">
                          {/* Cartão Corretora badge */}
                          {isCartaoCorretora && (
                            <span className="bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">
                                credit_card
                              </span>
                              <span>Cartão Corretora</span>
                            </span>
                          )}

                          {/* Vidas badge */}
                          <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                            {p.vidas || 1} {p.vidas === 1 ? 'vida' : 'vidas'}
                          </span>

                          {/* Corretor badge */}
                          {p.corretor && (
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase">
                              {p.corretor}
                            </span>
                          )}
                        </div>

                        {/* Overdue alert block matching screenshot */}
                        {sla.isAtrasado && (
                          <div className="mb-3 bg-red-50/70 border border-red-200 rounded-xl px-3 py-2 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-red-600 uppercase tracking-tight flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[15px]">warning</span>
                              <span>
                                ATRASO: {sla.diasAtraso} {sla.diasAtraso === 1 ? 'DIA' : 'DIAS'}
                              </span>
                            </span>
                          </div>
                        )}

                        {/* Pagamento Concluído Box for Concluídas Column */}
                        {p.status === 'PAGO' && (
                          <div className="mb-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl px-3 py-2 flex items-center justify-between text-emerald-800">
                            <span className="text-[11px] font-bold flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-emerald-600 text-[16px]">
                                check_circle
                              </span>
                              <span>Pagamento Concluído</span>
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-700 font-mono">
                              {sla.dataConclusao || '2026-08-27'}
                            </span>
                          </div>
                        )}

                        {/* Footer info: Valor Repasse & Prazo Esperado */}
                        <div className="pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2 items-end">
                          <div>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                              {p.status === 'PAGO' ? 'VALOR' : 'VALOR REPASSE'}
                            </span>
                            <span className="font-bold text-xs text-slate-900 font-mono">
                              R${' '}
                              {Number(p.valor || p.comissao || 0).toLocaleString('pt-BR', {
                                minimumFractionDigits: 2
                              })}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                              PRAZO ESPERADO
                            </span>
                            <span
                              className={`text-[11px] font-bold font-mono ${
                                sla.isAtrasado ? 'text-red-600' : 'text-slate-700'
                              }`}
                            >
                              {sla.vencimentoFormatted || p.data || 'N/A'}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons on hover/bottom */}
                        <div
                          className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5"
                          onClick={e => e.stopPropagation()}
                        >
                          {p.status === 'CADASTRADA' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!p.vidas || p.vidas === 0) {
                                  setAlertMessage(
                                    'Não é possível enviar propostas com 0 vidas para o financeiro. Edite a proposta primeiro.'
                                  );
                                  return;
                                }
                                onStatusChange(p.id, 'ENVIADA AO FINANCEIRO');
                              }}
                              className="w-full bg-[#e85d04] hover:bg-[#cf5304] text-white text-[10px] font-bold py-1.5 rounded-lg uppercase tracking-wider transition-all flex items-center justify-center gap-1 shadow-2xs active:scale-95"
                            >
                              <span>Enviar p/ Financeiro</span>
                              <span className="material-symbols-outlined text-[14px]">
                                arrow_forward
                              </span>
                            </button>
                          )}

                          {p.status === 'ENVIADA AO FINANCEIRO' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onStatusChange(p.id, 'PAGO');
                              }}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-1.5 rounded-lg uppercase tracking-wider transition-all flex items-center justify-center gap-1 shadow-2xs active:scale-95"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                check_circle
                              </span>
                              <span>Confirmar Pagamento</span>
                            </button>
                          )}

                          {p.status === 'PAGO' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onStatusChange(p.id, 'ENVIADA AO FINANCEIRO');
                              }}
                              className="text-slate-400 hover:text-slate-600 text-[10px] font-semibold py-1 px-2 rounded flex items-center gap-1 transition-colors"
                              title="Reabrir / Mudar Status"
                            >
                              <span className="material-symbols-outlined text-[13px]">
                                undo
                              </span>
                              <span>Reabrir</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  /* Empty state exactly matching screenshot */
                  <div className="h-64 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-6 text-slate-400 bg-white/60">
                    <span className="material-symbols-outlined text-3xl mb-1 text-slate-300">
                      description
                    </span>
                    <p className="text-xs font-medium text-slate-500">
                      Nenhuma proposta nesta coluna
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FILTER MODAL */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-[#001a54] uppercase tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">filter_alt</span>
                Filtrar Propostas
              </h3>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">
                  Operadora
                </label>
                <select
                  value={selectedOperadora}
                  onChange={e => setSelectedOperadora(e.target.value)}
                  className="w-full p-2.5 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 outline-none focus:bg-white focus:ring-2 focus:ring-[#001a54]/10 focus:border-[#001a54]"
                >
                  {availableOperadoras.map(op => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">
                  Corretor
                </label>
                <select
                  value={selectedCorretor}
                  onChange={e => setSelectedCorretor(e.target.value)}
                  className="w-full p-2.5 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 outline-none focus:bg-white focus:ring-2 focus:ring-[#001a54]/10 focus:border-[#001a54]"
                >
                  {availableCorretores.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={filterAtrasadasOnly}
                    onChange={e => setFilterAtrasadasOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-[#e85d04] focus:ring-[#e85d04]"
                  />
                  <span>Mostrar apenas propostas em atraso (SLA Estourado)</span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2.5 mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  setSelectedOperadora('TODAS');
                  setSelectedCorretor('TODOS');
                  setFilterAtrasadasOnly(false);
                  setSearchTerm('');
                  setIsFilterModalOpen(false);
                }}
                className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Limpar Filtros
              </button>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="flex-1 py-2 bg-[#001a54] hover:bg-[#00133d] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROPOSAL DETAILS MODAL (POP-UP MATCHING SCREENSHOT) */}
      {selectedProposalDetails && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 max-h-[92vh] flex flex-col">
            {/* Navy Header matching screenshot */}
            <div className="bg-[#001a54] px-6 py-4 flex items-center justify-between text-white shrink-0">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Detalhes da Proposta
                </h3>
                <p className="text-xs text-blue-100/90 font-medium mt-0.5">
                  Contrato Nº {selectedProposalDetails.contrato || selectedProposalDetails.cpfCnpj || selectedProposalDetails.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedProposalDetails(null)}
                className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 flex items-center justify-center cursor-pointer"
                title="Fechar"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body with scrollable content */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Client & Price Top Box */}
              <div className="border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between gap-4 bg-white shadow-2xs">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                    {selectedProposalDetails.cliente || 'CLIENTE SEM NOME'}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    CPF/CNPJ: {selectedProposalDetails.cpfCnpj || 'Não informado'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-base sm:text-lg font-bold text-[#001a54] font-mono">
                    R$ {Number(selectedProposalDetails.valor || selectedProposalDetails.comissao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* 2x2 Details Grid */}
              <div className="grid grid-cols-2 gap-3.5">
                {/* Operadora */}
                <div className="bg-[#f8fafd] border border-slate-100 rounded-xl p-3.5">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    OPERADORA
                  </span>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                    {selectedProposalDetails.operadora || '-'}
                  </span>
                </div>

                {/* Categoria */}
                <div className="bg-[#f8fafd] border border-slate-100 rounded-xl p-3.5">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    CATEGORIA
                  </span>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                    {selectedProposalDetails.categoria || selectedProposalDetails.detalhes?.proposta?.categoria || 'ODONTO'}
                  </span>
                </div>

                {/* Corretor */}
                <div className="bg-[#f8fafd] border border-slate-100 rounded-xl p-3.5">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    CORRETOR
                  </span>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                    {selectedProposalDetails.corretor || '-'}
                  </span>
                </div>

                {/* Vidas */}
                <div className="bg-[#f8fafd] border border-slate-100 rounded-xl p-3.5">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    VIDAS
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    {selectedProposalDetails.vidas || 1}
                  </span>
                </div>
              </div>

              {/* OBSERVAÇÕES & HISTÓRICO */}
              <div className="bg-[#f8fafd] border border-slate-100 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-sm text-[#001a54]">notes</span>
                  <span>OBSERVAÇÕES & HISTÓRICO</span>
                </div>

                {/* Observações texto direto */}
                {(selectedProposalDetails.observacoes || selectedProposalDetails.detalhes?.observacoes || selectedProposalDetails.detalhes?.proposta?.observacoes) ? (
                  <div className="p-3 bg-white rounded-lg border border-slate-200/80 text-xs text-slate-700 font-medium whitespace-pre-wrap leading-relaxed shadow-2xs">
                    {selectedProposalDetails.observacoes || selectedProposalDetails.detalhes?.observacoes || selectedProposalDetails.detalhes?.proposta?.observacoes}
                  </div>
                ) : null}

                {/* Histórico estruturado */}
                {Array.isArray(selectedProposalDetails.detalhes?.historico) && selectedProposalDetails.detalhes.historico.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    {selectedProposalDetails.detalhes.historico.map((h: any, idx: number) => (
                      <div key={h.id || idx} className="p-2.5 bg-white rounded-lg border border-slate-200/70 text-xs shadow-2xs">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                          <span className="text-[#001a54]">{h.responsavel || 'Usuário'}</span>
                          <span>{h.data || ''}</span>
                        </div>
                        <p className="text-slate-700 text-xs font-medium whitespace-pre-wrap">{h.observacao}</p>
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* Se não tiver nenhuma observação */}
                {!selectedProposalDetails.observacoes &&
                  !selectedProposalDetails.detalhes?.observacoes &&
                  !selectedProposalDetails.detalhes?.proposta?.observacoes &&
                  (!Array.isArray(selectedProposalDetails.detalhes?.historico) || selectedProposalDetails.detalhes.historico.length === 0) && (
                    <p className="text-xs text-slate-400 italic py-1">
                      Nenhuma observação registrada para esta proposta.
                    </p>
                  )}
              </div>

              {/* ANEXOS & BAIXA DE ARQUIVOS */}
              <div className="bg-[#f8fafd] border border-slate-100 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-[#001a54]">attach_file</span>
                    <span>ANEXOS & DOCUMENTOS</span>
                  </div>
                  {Array.isArray(selectedProposalDetails.detalhes?.documentos) && selectedProposalDetails.detalhes.documentos.length > 0 && (
                    <span className="text-[10px] font-bold text-[#001a54] bg-blue-100/70 px-2 py-0.5 rounded-full">
                      {selectedProposalDetails.detalhes.documentos.length} anexo(s)
                    </span>
                  )}
                </div>

                {/* Lista de anexos */}
                {(() => {
                  const docs: Array<{ id: string; nome: string; data?: string; tamanho?: string; url?: string }> = [];
                  if (Array.isArray(selectedProposalDetails.detalhes?.documentos)) {
                    docs.push(...selectedProposalDetails.detalhes.documentos);
                  }
                  if (Array.isArray((selectedProposalDetails as any).documentos)) {
                    (selectedProposalDetails as any).documentos.forEach((d: any) => {
                      if (!docs.some(existing => existing.id === d.id || existing.nome === d.nome)) {
                        docs.push(d);
                      }
                    });
                  }
                  if (selectedProposalDetails.detalhes?.comprovanteUrl || (selectedProposalDetails as any).comprovanteUrl) {
                    const url = selectedProposalDetails.detalhes?.comprovanteUrl || (selectedProposalDetails as any).comprovanteUrl;
                    if (!docs.some(d => d.url === url)) {
                      docs.push({
                        id: 'comp-principal',
                        nome: 'Comprovante / Anexo Principal',
                        data: selectedProposalDetails.data || 'Registrado',
                        tamanho: 'Arquivo Anexo',
                        url: url
                      });
                    }
                  }

                  if (docs.length === 0) {
                    return (
                      <div className="p-3 bg-white rounded-lg border border-slate-200/80 text-center shadow-2xs">
                        <span className="material-symbols-outlined text-2xl text-slate-300 block mb-1">folder_off</span>
                        <p className="text-xs text-slate-400 italic">
                          Nenhum documento ou anexo anexado a este contrato.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      {docs.map((doc, idx) => (
                        <div
                          key={doc.id || idx}
                          className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-base">
                                {doc.nome?.toLowerCase().endsWith('.pdf') ? 'picture_as_pdf' : 'description'}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate" title={doc.nome}>
                                {doc.nome || `Anexo #${idx + 1}`}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {doc.data || 'Registrado'} {doc.tamanho ? `• ${doc.tamanho}` : ''}
                              </p>
                            </div>
                          </div>

                          {/* Botão de Baixar Anexo */}
                          {doc.url ? (
                            <button
                              type="button"
                              onClick={() => {
                                try {
                                  const link = document.createElement('a');
                                  link.href = doc.url!;
                                  link.download = doc.nome || `anexo_contrato_${selectedProposalDetails.contrato || 'doc'}`;
                                  link.target = '_blank';
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                } catch (e) {
                                  window.open(doc.url, '_blank');
                                }
                              }}
                              className="px-3 py-1.5 bg-[#001a54] hover:bg-[#00133d] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 shadow-xs cursor-pointer active:scale-95"
                              title="Baixar este arquivo"
                            >
                              <span className="material-symbols-outlined text-sm">download</span>
                              <span>Baixar Anexo</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Sem link</span>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Footer Fechar Button */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedProposalDetails(null)}
                className="px-6 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 bg-white transition-all shadow-2xs active:scale-95 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALERT MODAL */}
      {alertMessage && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 text-red-600">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Atenção</h3>
            <p className="text-xs text-slate-600 mb-5">{alertMessage}</p>
            <button
              onClick={() => setAlertMessage('')}
              className="w-full bg-[#001a54] text-white font-bold py-2 rounded-xl text-xs transition-all hover:bg-[#00133d] shadow-xs"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerBoard;
