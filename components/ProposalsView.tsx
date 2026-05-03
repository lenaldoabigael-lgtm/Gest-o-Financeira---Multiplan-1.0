
import React, { useState, useMemo } from 'react';
import { Proposal } from '../types';
import * as XLSX from 'xlsx';

interface ProposalsViewProps {
  proposals: Proposal[];
  onAddProposal: () => void;
  onEditProposal: (proposal: Proposal) => void;
  onDeleteProposal: (id: string) => void;
  onImportProposals?: (proposals: any[]) => void;
}

const ProposalsView: React.FC<ProposalsViewProps> = ({ proposals, onAddProposal, onEditProposal, onDeleteProposal, onImportProposals }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterOperadora, setFilterOperadora] = useState('Todas');
  const [confirmingSendId, setConfirmingSendId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  const statusOptions = ['Todos', 'CADASTRADA', 'ENVIADA AO FINANCEIRO', 'PAGO'];

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredProposals.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleExportExcel = () => {
    const dataToExport = selectedIds.length > 0
      ? proposals.filter(p => selectedIds.includes(p.id))
      : filteredProposals;

    if (dataToExport.length === 0) {
      alert('Nenhuma proposta para exportar.');
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
      'Valor': p.valor,
      'Vidas': p.vidas,
      'Status': p.status,
      'Observações': p.observacoes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Propostas");
    
    // Auto-size columns
    const max_width = worksheetData.reduce((w, r) => Math.max(w, ...Object.values(r).map(v => v.toString().length)), 10);
    worksheet["!cols"] = Object.keys(worksheetData[0]).map(() => ({ wch: max_width }));

    XLSX.writeFile(workbook, `propostas_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);
        
        if (json.length === 0) {
          alert('A planilha está vazia.');
          return;
        }

        const importedProposals = json.map(row => {
          const clienteNome = row['Nome']?.toString() || row['Cliente']?.toString() || '';
          const clienteCpfCnpj = row['CPF / CNPJ']?.toString() || row['CPF/CNPJ']?.toString() || row['CPF']?.toString() || row['CNPJ']?.toString() || '';
          const contratoNum = row['Nº Contrato']?.toString() || row['Contrato']?.toString() || '';
          const corretorNome = row['Corretor']?.toString() || '';
          const operadoraNome = row['Operadora']?.toString() || '';
          const categoriaNome = row['Categoria']?.toString() || '';
          const valorNum = parseFloat(row['Valor Contrato']?.toString() || row['Valor']?.toString() || '0');
          const vidasNum = parseInt(row['Vidas']?.toString() || '0', 10);
          const dataVenda = row['Dt Venda']?.toString() || row['Data']?.toString() || new Date().toISOString().split('T')[0];
          
          return {
            contrato: contratoNum,
            data: dataVenda,
            cliente: clienteNome,
            cpfCnpj: clienteCpfCnpj,
            corretor: corretorNome,
            operadora: operadoraNome,
            categoria: categoriaNome,
            valor: valorNum,
            vidas: vidasNum,
            status: row['Status']?.toString() || 'CADASTRADA',
            comissao: 0,
            detalhes: {
              cliente: {
                nome: clienteNome,
                cpfCnpj: clienteCpfCnpj,
                dataNascimento: row['Data Nascimento']?.toString() || '',
                email: row['Email']?.toString() || '',
                telefone: row['Telefone']?.toString() || ''
              },
              endereco: {
                cep: row['CEP']?.toString() || '',
                logradouro: row['Endereço']?.toString() || '',
                numero: row['Número']?.toString() || '',
                complemento: row['Complemento']?.toString() || '',
                bairro: row['Bairro']?.toString() || '',
                cidade: row['Cidade']?.toString() || '',
                estado: row['Estado']?.toString() || ''
              },
              proposta: {
                contrato: contratoNum,
                dataVenda: dataVenda,
                corretor: corretorNome,
                categoria: categoriaNome,
                operadora: operadoraNome,
                tipoPlano: row['Tipo de Plano']?.toString() || '',
                unidade: row['Unidade']?.toString() || ''
              },
              financeiro: {
                valorContrato: valorNum,
                vidas: vidasNum,
                valorTaxa: parseFloat(row['Valor Taxa']?.toString() || '0'),
                parcelas: []
              },
              beneficiarios: [],
              documentos: [],
              historico: []
            }
          };
        });

        if (onImportProposals) {
          onImportProposals(importedProposals);
        }
      } catch (err) {
        console.error("Error importing file:", err);
        alert('Erro ao importar o arquivo. Verifique o console.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-blue-900 uppercase tracking-tighter">Propostas</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Gerencie e consulte os contratos de saúde</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-black uppercase tracking-widest transition-all flex items-center gap-3">
            <i className="fa-solid fa-file-import"></i> Importar Planilha
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportExcel} />
          </label>
          <button
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-3"
          >
            <i className="fa-solid fa-file-excel"></i> Exportar Excel
          </button>
          <button
            onClick={onAddProposal}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 flex items-center gap-3"
          >
            <i className="fa-solid fa-plus"></i> Nova Proposta
          </button>
        </div>
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
                <th className="p-4 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    onChange={handleSelectAll}
                    checked={filteredProposals.length > 0 && selectedIds.length === filteredProposals.length}
                  />
                </th>
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
                <tr key={p.id} className={`hover:bg-slate-50/50 transition-colors group ${selectedIds.includes(p.id) ? 'bg-blue-50/30' : ''}`}>
                  <td className="p-4">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedIds.includes(p.id)}
                      onChange={() => handleSelectOne(p.id)}
                    />
                  </td>
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
                    <div className="font-bold text-slate-700">R$ {Number(p.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    <div className="text-[10px] text-slate-400 font-bold">{p.vidas} vidas</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      p.status === 'CADASTRADA' ? 'bg-slate-100 text-slate-700' :
                      p.status === 'ENVIADA AO FINANCEIRO' ? 'bg-blue-100 text-blue-700' :
                      p.status === 'PAGO' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onEditProposal(p)}
                        disabled={p.status === 'PAGO'}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                          p.status === 'PAGO' ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-slate-100 text-slate-500 hover:bg-blue-600 hover:text-white'
                        }`}
                        title={p.status === 'PAGO' ? 'Não é possível editar proposta paga' : 'Editar'}
                      >
                        <i className="fa-solid fa-pen-to-square text-xs"></i>
                      </button>

                      {p.status === 'CADASTRADA' && (
                        confirmingSendId === p.id ? (
                          <div className="flex gap-1 bg-emerald-50 rounded-lg p-1">
                            <button
                              onClick={() => {
                                onEditProposal({ ...p, status: 'ENVIADA AO FINANCEIRO' } as any);
                                setConfirmingSendId(null);
                              }}
                              className="px-2 bg-emerald-600 text-white rounded text-[10px] font-bold"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => setConfirmingSendId(null)}
                              className="px-2 bg-slate-200 text-slate-600 rounded text-[10px] font-bold hover:bg-slate-300"
                            >
                              X
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setConfirmingSendId(p.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all bg-slate-100 text-slate-500 hover:bg-emerald-600 hover:text-white"
                            title="Enviar ao Financeiro"
                          >
                            <i className="fa-solid fa-paper-plane text-xs"></i>
                          </button>
                        )
                      )}

                      {p.status !== 'PAGO' && p.status !== 'ENVIADA AO FINANCEIRO' && (
                        confirmingDeleteId === p.id ? (
                          <div className="flex gap-1 bg-red-50 rounded-lg p-1">
                            <button
                              onClick={() => {
                                onDeleteProposal(p.id);
                                setConfirmingDeleteId(null);
                              }}
                              className="px-2 bg-red-600 text-white rounded text-[10px] font-bold"
                            >
                              Deletar
                            </button>
                            <button
                              onClick={() => setConfirmingDeleteId(null)}
                              className="px-2 bg-slate-200 text-slate-600 rounded text-[10px] font-bold hover:bg-slate-300"
                            >
                              X
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setConfirmingDeleteId(p.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all bg-slate-100 text-slate-500 hover:bg-red-600 hover:text-white"
                            title="Excluir"
                          >
                            <i className="fa-solid fa-trash text-xs"></i>
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProposals.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
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
