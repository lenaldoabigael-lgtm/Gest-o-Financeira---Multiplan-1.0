
import React, { useState } from 'react';
import { PaymentLot, Proposal } from '../types';

interface FinanceViewProps {
  lots: PaymentLot[];
  proposals: Proposal[];
  onPay: (id: string) => void;
}

const FinanceView: React.FC<FinanceViewProps> = ({ lots, proposals, onPay }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [expandedLotId, setExpandedLotId] = useState<string | null>(null);

  const filteredLots = lots.filter(lot => {
    const matchesSearch = lot.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || 
                         (statusFilter === 'Pendente' && lot.status === 'PENDENTE') ||
                         (statusFilter === 'Pago' && lot.status === 'PAGO');
    return matchesSearch && matchesStatus;
  });

  const totals = {
    pendente: lots.filter(l => l.status === 'PENDENTE').reduce((acc, l) => acc + Number(l.valorTotal), 0),
    pagoHoje: lots.filter(l => l.status === 'PAGO').reduce((acc, l) => acc + Number(l.valorTotal), 0), // Simplification
    countPendente: lots.filter(l => l.status === 'PENDENTE').length,
    countPago: lots.filter(l => l.status === 'PAGO').length
  };

  const formatDataAprovacao = (dateStr: string) => {
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
        <div className="bg-white p-6 rounded-xl border-l-4 border-emerald-500 shadow-sm flex justify-between items-start">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pago (Total)</p>
            <h2 className="text-2xl font-black text-slate-800">R$ {totals.pagoHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
          </div>
          <span className="bg-emerald-100 text-emerald-600 text-[9px] font-black px-2 py-1 rounded-full uppercase">{totals.countPago} {totals.countPago === 1 ? 'Lote' : 'Lotes'}</span>
        </div>
        <div className="bg-white p-6 rounded-xl border-l-4 border-blue-500 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Previsão da Semana</p>
          <h2 className="text-2xl font-black text-slate-800">R$ {(totals.pendente + totals.pagoHoje).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
        </div>
      </div>

      {/* Table Area */}
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
                placeholder="Buscar por código do lote..." 
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20 w-64"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="bg-slate-50 border border-slate-200 rounded-lg text-xs px-3 py-2 outline-none"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option>Status: Todos</option>
              <option>Status: Pendente</option>
              <option>Status: Pago</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">Código do Lote</th>
                <th className="px-6 py-4">Aprovado por</th>
                <th className="px-6 py-4">Qtd. Propostas</th>
                <th className="px-6 py-4">Vencimento</th>
                <th className="px-6 py-4">Valor Total</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLots.map(lot => (
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
                      <p className="text-xs font-bold text-slate-700">{lot.aprovadoPor}</p>
                      <p className="text-[9px] text-slate-400">{formatDataAprovacao(lot.dataAprovacao)}</p>
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
                        <button 
                          onClick={() => onPay(lot.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black px-4 py-2 rounded-lg uppercase tracking-widest flex items-center gap-2 ml-auto shadow-md shadow-blue-600/20 transition-all"
                        >
                          <i className="fa-solid fa-circle-check"></i> Baixar Pagamento
                        </button>
                      ) : (
                        <button className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest flex items-center gap-2 ml-auto transition-all">
                          <i className="fa-solid fa-paperclip"></i> Ver Comprovante
                        </button>
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
                                <th className="px-4 py-3">Vidas</th>
                                <th className="px-4 py-3">Valor do Contrato</th>
                                <th className="px-4 py-3">Comissão</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {proposals.filter(p => p.lote_id === lot.id).map(prop => (
                                <tr key={prop.id} className="hover:bg-slate-50/50">
                                  <td className="px-4 py-3 text-xs font-bold text-slate-700">{prop.corretor}</td>
                                  <td className="px-4 py-3 text-xs text-slate-600">{prop.numeroContrato || '-'}</td>
                                  <td className="px-4 py-3 text-xs text-slate-600">{prop.operadora}</td>
                                  <td className="px-4 py-3 text-xs text-slate-600">{prop.vidas}</td>
                                  <td className="px-4 py-3 text-xs text-slate-600">
                                    R$ {Number(prop.valorContrato || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-4 py-3 text-xs font-bold text-emerald-600">
                                    R$ {Number(prop.comissao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              ))}
                              {proposals.filter(p => p.lote_id === lot.id).length === 0 && (
                                <tr>
                                  <td colSpan={6} className="px-4 py-6 text-center text-xs text-slate-500">
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
              {filteredLots.length === 0 && (
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
    </div>
  );
};

export default FinanceView;
