
import React, { useState, useMemo } from 'react';
import { Proposal } from '../types';

interface ProposalsViewProps {
  proposals: Proposal[];
  onAddProposal: () => void;
  onDeleteProposal: (id: string) => void;
}

const ProposalsView: React.FC<ProposalsViewProps> = ({ proposals, onAddProposal, onDeleteProposal }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterOperadora, setFilterOperadora] = useState('Todas');

  const filteredProposals = useMemo(() => {
    return proposals.filter(p => 
      (p.cliente.toLowerCase().includes(searchTerm.toLowerCase()) || 
       p.cpfCnpj.includes(searchTerm) || 
       p.contrato.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterStatus === 'Todos' || p.status === filterStatus) &&
      (filterOperadora === 'Todas' || p.operadora === filterOperadora)
    );
  }, [proposals, searchTerm, filterStatus, filterOperadora]);

  const operadoras = useMemo(() => {
    const unique = Array.from(new Set(proposals.map(p => p.operadora)));
    return ['Todas', ...unique.sort()];
  }, [proposals]);

  const statusOptions = ['Todos', 'CADASTRADO', 'ENVIADO_FINANCEIRO', 'PAGO'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-blue-900 uppercase tracking-tighter">Propostas</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Gerencie e consulte os contratos de saúde</p>
        </div>
        <button
          onClick={onAddProposal}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 flex items-center gap-3"
        >
          <i className="fa-solid fa-plus"></i> Nova Proposta
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input
            type="text"
            placeholder="Buscar por Cliente, CPF/CNPJ ou Nº Contrato..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-900/10 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 border-none rounded-xl text-sm py-3 px-4 focus:ring-2 focus:ring-blue-900/10"
          >
            {statusOptions.map(s => <option key={s} value={s}>{s === 'Todos' ? 'Status: Todos' : s}</option>)}
          </select>
          <select
            value={filterOperadora}
            onChange={(e) => setFilterOperadora(e.target.value)}
            className="bg-slate-50 border-none rounded-xl text-sm py-3 px-4 focus:ring-2 focus:ring-blue-900/10"
          >
            {operadoras.map(op => <option key={op} value={op}>{op === 'Todas' ? 'Operadora: Todas' : op}</option>)}
          </select>
          <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all">
            Filtros
          </button>
          <button className="px-6 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
            Buscar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contrato / Data</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Corretor</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operadora</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor / Vidas</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProposals.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-4">
                    <div className="font-bold text-blue-600">{p.contrato}</div>
                    <div className="text-[10px] text-slate-400 font-bold">{p.data}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-700 uppercase">{p.cliente}</div>
                    <div className="text-[10px] text-slate-400 font-bold">CPF: {p.cpfCnpj}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-600">{p.corretor}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-700">{p.operadora}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">{p.categoria}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-700">R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    <div className="text-[10px] text-slate-400 font-bold">{p.vidas} vidas</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      p.status === 'CADASTRADO' ? 'bg-emerald-100 text-emerald-700' :
                      p.status === 'ENVIADO_FINANCEIRO' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 hover:bg-blue-600 hover:text-white rounded-lg transition-all">
                        <i className="fa-solid fa-pen-to-square text-xs"></i>
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm('Tem certeza que deseja excluir esta proposta?')) {
                            onDeleteProposal(p.id);
                          }
                        }}
                        className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                      >
                        <i className="fa-solid fa-trash text-xs"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProposals.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <i className="fa-solid fa-folder-open text-4xl text-slate-200 mb-3"></i>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhuma proposta encontrada</p>
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

export default ProposalsView;
