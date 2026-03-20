
import React, { useState, useMemo } from 'react';
import { Proposal } from '../types';
import * as XLSX from 'xlsx';

interface ManagerAreaProps {
  proposals: Proposal[];
  onGeneratePaymentCode: (selectedIds: string[]) => void;
}

const ManagerArea: React.FC<ManagerAreaProps> = ({ proposals, onGeneratePaymentCode }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOperadora, setFilterOperadora] = useState('Todas');

  const filteredProposals = useMemo(() => {
    return proposals.filter(p => 
      p.status === 'CADASTRADA' &&
      (p.corretor.toLowerCase().includes(searchTerm.toLowerCase()) || p.contrato.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterOperadora === 'Todas' || p.operadora === filterOperadora)
    );
  }, [proposals, searchTerm, filterOperadora]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === filteredProposals.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProposals.map(p => p.id));
    }
  };

  const summary = useMemo(() => {
    const selected = proposals.filter(p => selectedIds.includes(p.id));
    return {
      count: selected.length,
      vidas: selected.reduce((acc, p) => acc + Number(p.vidas), 0),
      valorTotal: selected.reduce((acc, p) => acc + Number(p.valor), 0),
      comissaoTotal: selected.reduce((acc, p) => acc + Number(p.comissao), 0),
      selectedProposals: selected
    };
  }, [proposals, selectedIds]);

  const handleExportExcel = () => {
    const dataToExport = selectedIds.length > 0
      ? summary.selectedProposals
      : filteredProposals;

    if (dataToExport.length === 0) {
      alert('Nenhuma proposta selecionada para exportar.');
      return;
    }

    const worksheetData = dataToExport.map(p => ({
      'Nº Contrato': p.contrato,
      'Data': p.data,
      'Cliente': p.cliente,
      'CPF/CNPJ': p.cpfCnpj,
      'Corretor': p.corretor,
      'Operadora': p.operadora,
      'Categoria': p.categoria,
      'Valor Contrato': p.valor,
      'Comissão/Taxa': p.comissao,
      'Vidas': p.vidas,
      'Status': p.status,
      'Observações': p.observacoes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Liberação");
    
    // Auto-size columns
    const max_width = worksheetData.reduce((w, r) => Math.max(w, ...Object.values(r).map(v => v.toString().length)), 10);
    worksheet["!cols"] = Object.keys(worksheetData[0]).map(() => ({ wch: max_width }));

    XLSX.writeFile(workbook, `liberacao_financeira_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const operadoras = useMemo(() => {
    const unique = Array.from(new Set(proposals.map(p => p.operadora)));
    return ['Todas', ...unique.sort()];
  }, [proposals]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-blue-900 uppercase tracking-tighter">Liberação Financeira</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Selecione as propostas para gerar o código de pagamento (Borderô)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input
                type="text"
                placeholder="Buscar corretor ou contrato..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-900/10 transition-all"
              />
            </div>
            <select
              value={filterOperadora}
              onChange={(e) => setFilterOperadora(e.target.value)}
              className="bg-slate-50 border-none rounded-xl text-sm py-3 px-4 focus:ring-2 focus:ring-blue-900/10"
            >
              {operadoras.map(op => <option key={op} value={op}>Operadora: {op}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="p-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.length > 0 && selectedIds.length === filteredProposals.length}
                        onChange={toggleAll}
                        className="rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                      />
                    </th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contrato</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Corretor</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor Contrato</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Comissão/Taxa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredProposals.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p.id)}
                          onChange={() => toggleSelection(p.id)}
                          className="rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                        />
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-blue-900">{p.contrato}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold">{p.operadora} ({p.vidas} vidas)</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-700">{p.corretor}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Multi Plan</div>
                      </td>
                      <td className="p-4 text-right font-mono text-sm text-slate-600">
                        R$ {Number(p.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-right font-mono text-sm font-bold text-emerald-600">
                        R$ {Number(p.comissao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  {filteredProposals.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center">
                        <i className="fa-solid fa-folder-open text-4xl text-slate-200 mb-3"></i>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhuma proposta pendente encontrada</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6 sticky top-24">
            <div className="flex items-center gap-3 text-blue-900">
              <i className="fa-solid fa-file-invoice-dollar text-xl"></i>
              <h2 className="font-black uppercase tracking-tighter">Resumo do Lote</h2>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Propostas Selecionadas:</span>
                <span className="font-black text-blue-900">{summary.count}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Total de Vidas:</span>
                <span className="font-black text-blue-900">{summary.vidas}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Valor Total dos Contratos:</span>
                <span className="font-bold text-slate-700">R$ {summary.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <button
                onClick={handleExportExcel}
                className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all border border-emerald-100 text-xs"
              >
                <i className="fa-solid fa-file-excel"></i>
                Exportar Seleção para Excel
              </button>

              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center justify-between">
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Total a Liberar (Comissões)</span>
                <span className="text-xl font-black text-emerald-600">R$ {summary.comissaoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <button
              disabled={selectedIds.length === 0}
              onClick={async () => {
                await onGeneratePaymentCode(selectedIds);
                setSelectedIds([]);
              }}
              className={`w-full py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg ${
                selectedIds.length > 0 
                ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/20' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <i className="fa-solid fa-check-circle"></i>
              Gerar Código de Pagamento
            </button>

            <p className="text-[9px] text-center text-slate-400 font-bold uppercase leading-tight">
              Ao gerar o código, o status das propostas mudará para "Enviado ao Financeiro".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerArea;
