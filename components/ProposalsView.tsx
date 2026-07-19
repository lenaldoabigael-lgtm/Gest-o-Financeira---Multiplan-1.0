
import React, { useState, useMemo, useEffect } from 'react';
import { Proposal, ProposalRequirement } from '../types';
import * as XLSX from 'xlsx';

interface ProposalsViewProps {
  proposals: Proposal[];
  requirements?: ProposalRequirement[];
  onAddProposal: () => void;
  onEditProposal: (proposal: Proposal) => void;
  onDeleteProposal: (id: string) => void;
  onImportProposals?: (proposals: any[]) => void;
}

const ProposalsView: React.FC<ProposalsViewProps> = ({ proposals, requirements = [], onAddProposal, onEditProposal, onDeleteProposal, onImportProposals }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterOperadora, setFilterOperadora] = useState('Todas');
  const [filterTipoPlano, setFilterTipoPlano] = useState('Todos');
  const [filterCorretor, setFilterCorretor] = useState('Todos');
  const [filterValor, setFilterValor] = useState('');
  const [confirmingSendId, setConfirmingSendId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [importPreviewData, setImportPreviewData] = useState<any[] | null>(null);
  const [viewingProposal, setViewingProposal] = useState<Proposal | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  
  type SortColumn = 'contrato' | 'cliente' | 'corretor' | 'operadora' | 'valor' | 'status' | null;
  type SortDirection = 'asc' | 'desc';

  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterPeriodo, setFilterPeriodo] = useState('Todos'); // 'Todos', 'Últimos 7 dias', 'Este mês'

  const handleSort = (column: NonNullable<SortColumn>) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else setSortColumn(null);
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredProposals = useMemo(() => {
    let result = proposals.filter(p => {
      const matchSearch = (
        p.cliente.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.cpfCnpj.includes(searchTerm) || 
        p.contrato.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchStatus = filterStatus === 'Todos' || p.status === filterStatus;
      const matchOperadora = filterOperadora === 'Todas' || p.operadora === filterOperadora;
      
      const tipoPlano = p.detalhes?.proposta?.tipoPlano || 'Não Informado';
      const matchTipoPlano = filterTipoPlano === 'Todos' || tipoPlano === filterTipoPlano;
      const matchCorretor = filterCorretor === 'Todos' || p.corretor === filterCorretor;

      const matchValor = !filterValor || p.valor.toString().includes(filterValor) || p.valor.toFixed(2).includes(filterValor);

      let matchPeriod = true;
      if (filterPeriodo !== 'Todos' && p.data) {
        const today = new Date();
        const pDate = new Date(p.data);
        if (!isNaN(pDate.getTime())) {
          if (filterPeriodo === 'Últimos 7 dias') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            matchPeriod = pDate >= sevenDaysAgo && pDate <= today;
          } else if (filterPeriodo === 'Este mês') {
            matchPeriod = pDate.getMonth() === today.getMonth() && pDate.getFullYear() === today.getFullYear();
          }
        }
      }

      return matchSearch && matchStatus && matchOperadora && matchTipoPlano && matchCorretor && matchValor && matchPeriod;
    });

    if (sortColumn) {
      result.sort((a, b) => {
        let valA: any = a[sortColumn as keyof Proposal];
        let valB: any = b[sortColumn as keyof Proposal];
        
        if (sortColumn === 'contrato') {
           valA = a.contrato; valB = b.contrato;
        } else if (sortColumn === 'cliente') {
           valA = a.cliente; valB = b.cliente;
        } else if (sortColumn === 'corretor') {
           valA = a.corretor; valB = b.corretor;
        } else if (sortColumn === 'operadora') {
           valA = a.operadora; valB = b.operadora;
        } else if (sortColumn === 'valor') {
           valA = Number(a.valor); valB = Number(b.valor);
        } else if (sortColumn === 'status') {
           valA = a.status; valB = b.status;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [proposals, searchTerm, filterStatus, filterOperadora, filterTipoPlano, filterCorretor, filterValor, filterPeriodo, sortColumn, sortDirection]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterOperadora, filterTipoPlano, filterCorretor, filterValor, filterPeriodo, sortColumn, sortDirection]);

  const totalPages = Math.ceil(filteredProposals.length / itemsPerPage);
  
  const paginatedProposals = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProposals.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProposals, currentPage, itemsPerPage]);

  const operadoras = useMemo(() => {
    const unique = Array.from(new Set(proposals.map(p => p.operadora)));
    return ['Todas', ...unique.sort()];
  }, [proposals]);

  const tiposPlano = useMemo(() => {
    const unique = Array.from(new Set(proposals.map(p => p.detalhes?.proposta?.tipoPlano || 'Não Informado')));
    return ['Todos', ...unique.sort()];
  }, [proposals]);

  const corretores = useMemo(() => {
    const unique = Array.from(new Set(proposals.map(p => p.corretor).filter(c => c)));
    return ['Todos', ...unique.sort()];
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

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Nº Contrato': '100203',
        'Dt Venda': '2026-06-11',
        'Nome': 'João da Silva',
        'CPF / CNPJ': '123.456.789-00',
        'Corretor': 'Carlos Medeiros',
        'Operadora': 'Unimed',
        'Categoria': 'Pinho',
        'Valor Contrato': 450.00,
        'Vidas': 2,
        'Status': 'CADASTRADA',
        'Comissão': 225.00,
        'Data Nascimento': '1985-04-12',
        'Email': 'joao@email.com',
        'Telefone': '11999999999',
        'CEP': '01001-000',
        'Endereço': 'Praça da Sé',
        'Número': '123',
        'Complemento': 'Apt 42',
        'Bairro': 'Sé',
        'Cidade': 'São Paulo',
        'Estado': 'SP',
        'Tipo de Plano': 'Familiar',
        'Unidade': 'São Paulo Centro',
        'Valor Taxa': 15.00
      },
      {
        'Nº Contrato': '100204',
        'Dt Venda': '2026-06-12',
        'Nome': 'Maria de Souza Ltda',
        'CPF / CNPJ': '12.345.678/0001-99',
        'Corretor': 'Carlos Medeiros',
        'Operadora': 'Bradesco Saúde',
        'Categoria': 'Top Nacional',
        'Valor Contrato': 1500.00,
        'Vidas': 5,
        'Status': 'CADASTRADA',
        'Comissão': 750.00,
        'Data Nascimento': '1990-08-20',
        'Email': 'contato@maria.com',
        'Telefone': '11988888888',
        'CEP': '01311-000',
        'Endereço': 'Avenida Paulista',
        'Número': '1000',
        'Complemento': 'Sala 51',
        'Bairro': 'Bela Vista',
        'Cidade': 'São Paulo',
        'Estado': 'SP',
        'Tipo de Plano': 'Empresarial',
        'Unidade': 'Paulista',
        'Valor Taxa': 20.00
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Modelo Importação");

    // Auto-size columns
    const max_width = 20;
    worksheet["!cols"] = Object.keys(templateData[0]).map(() => ({ wch: max_width }));

    XLSX.writeFile(workbook, 'modelo_importacao_propostas.xlsx');
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const parseExcelDate = (val: any): string => {
      if (!val) return new Date().toISOString().split('T')[0];
      
      if (val instanceof Date) {
        if (!isNaN(val.getTime())) {
          return val.toISOString().split('T')[0];
        }
      }
      
      const s = val.toString().trim();
      if (!s) return new Date().toISOString().split('T')[0];
      
      const num = Number(s);
      if (!isNaN(num) && num > 20000 && num < 60000) {
        const date = new Date(Math.round((num - 25569) * 86400 * 1000));
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
      
      const matchBR = s.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
      if (matchBR) {
        return `${matchBR[3]}-${matchBR[2]}-${matchBR[1]}`;
      }
      
      const matchISO = s.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
      if (matchISO) {
        return `${matchISO[1]}-${matchISO[2]}-${matchISO[3]}`;
      }
      
      const parsedDate = new Date(s);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString().split('T')[0];
      }
      
      return new Date().toISOString().split('T')[0];
    };

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);
        
        const validRows = json.filter(row => {
          const contract = row['Nº Contrato']?.toString() || row['Contrato']?.toString() || '';
          const name = row['Nome']?.toString() || row['Cliente']?.toString() || '';
          return contract.trim() !== '' || name.trim() !== '';
        });

        if (validRows.length === 0) {
          alert('Nenhuma proposta válida encontrada na planilha.');
          return;
        }

        const cleanMoney = (val: any): number => {
          if (val === undefined || val === null) return 0;
          if (typeof val === 'number') return val;
          const str = val.toString().trim();
          if (!str) return 0;
          // Remove R$, spaces, thousands separators (dot if Brazilian format, comma if US)
          const cleanStr = str.replace('R$', '').replace(/\s/g, '');
                                
          const hasCommaAndDot = cleanStr.includes(',') && cleanStr.includes('.');
          if (hasCommaAndDot) {
            if (cleanStr.indexOf('.') < cleanStr.indexOf(',')) {
              // Brazilian format: 1.234,56 -> 1234.56
              return parseFloat(cleanStr.replace(/\./g, '').replace(',', '.'));
            } else {
              // US format: 1,234.56 -> 1234.56
              return parseFloat(cleanStr.replace(/,/g, ''));
            }
          }
          
          if (cleanStr.includes(',')) {
            const parts = cleanStr.split(',');
            if (parts[parts.length - 1].length <= 2) {
              return parseFloat(cleanStr.replace(',', '.'));
            } else {
              return parseFloat(cleanStr.replace(/,/g, ''));
            }
          }
          
          return parseFloat(cleanStr) || 0;
        };

        const importedProposals = validRows.map(row => {
          const clienteNome = row['Nome']?.toString() || row['Cliente']?.toString() || 'Cliente Não Informado';
          const clienteCpfCnpj = row['CPF / CNPJ']?.toString() || row['CPF/CNPJ']?.toString() || row['CPF']?.toString() || row['CNPJ']?.toString() || '000.000.000-00';
          const contratoNum = row['Nº Contrato']?.toString() || row['Contrato']?.toString() || ('IMP-' + Math.random().toString(36).substr(2, 9).toUpperCase());
          const corretorNome = row['Corretor']?.toString() || 'Corretor Geral';
          const operadoraNome = row['Operadora']?.toString() || 'Operadora Geral';
          const categoriaNome = row['Categoria']?.toString() || 'Geral';
          const valorNum = cleanMoney(row['Valor Contrato'] || row['Valor']);
          const vidasNum = parseInt(row['Vidas']?.toString() || '0', 10) || 1;
          const dataVenda = parseExcelDate(row['Dt Venda'] || row['Data']);
          const valorTaxaNum = cleanMoney(row['Valor Taxa']);

          const tipoPlanoExtracted = row['Tipo de Plano']?.toString() || row['Tipo']?.toString() || '';

          let finalTaxaNum = valorTaxaNum;
          if (finalTaxaNum === 0 && (row['Valor Taxa'] === undefined || row['Valor Taxa'] === '')) {
             const taxasAdesao = requirements?.filter(r => r.tipo === 'TAXA_ADESAO') || [];
             const findTaxa = (op: string, tipo: string) => {
                return taxasAdesao.find(t => {
                   const parts = t.nome.split(' - ');
                   const reqOp = parts[0];
                   const reqTipo = parts.length > 2 ? parts[1] : 'TODOS';
                   return (reqOp === op || reqOp === 'TODAS') && (reqTipo === tipo || reqTipo === 'TODOS');
                });
             };
             const req = findTaxa(operadoraNome.toUpperCase(), tipoPlanoExtracted.toUpperCase() || 'TODOS');
             if (req) {
                 const parts = req.nome.split(' - ');
                 let baseTaxa = parseFloat(parts.length > 2 ? parts[2] : parts[1]) || 0;
                 
                 const isPorVida = 
                    (operadoraNome.toUpperCase() === 'SELECT' && tipoPlanoExtracted.toUpperCase() === 'EMPRESARIAL') ||
                    (operadoraNome.toUpperCase() === 'PLAMED' && tipoPlanoExtracted.toUpperCase() === 'EMPRESARIAL');
                    
                 if (isPorVida) {
                    baseTaxa = baseTaxa * (vidasNum || 0);
                 }
                 
                 finalTaxaNum = baseTaxa;
             }
          }

          // Attempt to find commission in standard column formats
          const rawComissao = row['Comissão'] !== undefined ? row['Comissão'] :
                              row['Comissao'] !== undefined ? row['Comissao'] :
                              row['Valor Comissão'] !== undefined ? row['Valor Comissão'] :
                              row['Valor Comissao'] !== undefined ? row['Valor Comissao'] :
                              row['Comissao Bruta'] !== undefined ? row['Comissao Bruta'] :
                              row['Comissão Bruta'] !== undefined ? row['Comissão Bruta'] :
                              undefined;

          const comissaoStr = rawComissao?.toString().trim();
          const hasComissao = comissaoStr !== undefined && comissaoStr !== '';
          const comissaoFromRow = hasComissao ? cleanMoney(rawComissao) : NaN;
          
          let comissaoNum = 0;
          if (!isNaN(comissaoFromRow)) {
            comissaoNum = comissaoFromRow;
          } else {
            comissaoNum = Math.max(0, valorNum - finalTaxaNum);
          }
          
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
            comissao: comissaoNum,
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
                tipoPlano: tipoPlanoExtracted,
                unidade: row['Unidade']?.toString() || ''
              },
              financeiro: {
                valorContrato: valorNum,
                vidas: vidasNum,
                valorTaxa: finalTaxaNum,
                parcelas: [
                  { id: '1', numero: '1ª Parcela', valor: valorNum, comissao: comissaoNum, vencimento: dataVenda }
                ]
              },
              beneficiarios: [],
              documentos: [],
              historico: []
            }
          };
        });

        if (onImportProposals) {
          setImportPreviewData(importedProposals);
        }
      } catch (err) {
        console.error("Error importing file:", err);
        alert('Erro ao importar o arquivo. Verifique o console.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; // Reset input
  };

  const totalVidas = filteredProposals.reduce((acc, p) => acc + (p.vidas || 0), 0);
  const valorTotal = filteredProposals.reduce((acc, p) => acc + (p.valor || 0), 0);
  const pendentesEnvio = filteredProposals.filter(p => p.status === 'CADASTRADA').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-blue-900 uppercase tracking-tighter">Propostas</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Gerencie e consulte os contratos de saúde</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleDownloadTemplate}
            className="bg-sky-50 hover:bg-sky-100 text-sky-700 px-6 py-3 rounded-xl font-black uppercase tracking-widest transition-all border border-sky-200 flex items-center gap-3 shadow-sm"
            title="Baixar planilha modelo com campos corretos preenchidos com exemplos"
          >
            <i className="fa-solid fa-download"></i> Baixar Modelo
          </button>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl">
            <i className="fa-solid fa-users"></i>
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Vidas (Filtro)</div>
            <div className="text-2xl font-black text-slate-800">{totalVidas}</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl">
            <i className="fa-solid fa-dollar-sign"></i>
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Total (Filtro)</div>
            <div className="text-2xl font-black text-slate-800">
              R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl">
            <i className="fa-solid fa-clock-rotate-left"></i>
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aguardando Envio (Filtro)</div>
            <div className="text-2xl font-black text-slate-800">{pendentesEnvio}</div>
          </div>
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
            value={filterPeriodo}
            onChange={(e) => setFilterPeriodo(e.target.value)}
            className="bg-slate-50 border-none rounded-xl text-sm py-3 px-4 focus:ring-2 focus:ring-blue-900/10"
          >
            <option value="Todos">Período: Todos</option>
            <option value="Últimos 7 dias">Últimos 7 dias</option>
            <option value="Este mês">Este mês</option>
          </select>
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
          <select
            value={filterTipoPlano}
            onChange={(e) => setFilterTipoPlano(e.target.value)}
            className="bg-slate-50 border-none rounded-xl text-sm py-3 px-4 focus:ring-2 focus:ring-blue-900/10"
          >
            {tiposPlano.map(tp => <option key={tp} value={tp}>{tp === 'Todos' ? 'Tipo de Plano: Todos' : tp}</option>)}
          </select>
          <select
            value={filterCorretor}
            onChange={(e) => setFilterCorretor(e.target.value)}
            className="bg-slate-50 border-none rounded-xl text-sm py-3 px-4 focus:ring-2 focus:ring-blue-900/10"
          >
            {corretores.map(c => <option key={c} value={c}>{c === 'Todos' ? 'Corretor: Todos' : c}</option>)}
          </select>
          <input
            type="text"
            placeholder="Valor..."
            value={filterValor}
            onChange={(e) => setFilterValor(e.target.value)}
            className="w-32 bg-slate-50 border-none rounded-xl text-sm py-3 px-4 focus:ring-2 focus:ring-blue-900/10 transition-all"
          />
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
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-blue-600" onClick={() => handleSort('contrato')}>
                  Contrato / Data {sortColumn === 'contrato' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-blue-600" onClick={() => handleSort('cliente')}>
                  Cliente {sortColumn === 'cliente' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-blue-600" onClick={() => handleSort('corretor')}>
                  Corretor {sortColumn === 'corretor' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-blue-600" onClick={() => handleSort('operadora')}>
                  Operadora {sortColumn === 'operadora' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-blue-600" onClick={() => handleSort('valor')}>
                  Valor / Vidas {sortColumn === 'valor' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-blue-600" onClick={() => handleSort('status')}>
                  Status {sortColumn === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedProposals.map((p) => (
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
                    <div className="text-[10px] text-slate-400 uppercase font-bold">{p.categoria} {p.detalhes?.proposta?.tipoPlano ? `- ${p.detalhes.proposta.tipoPlano}` : ''}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-700">R$ {Number(p.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    <div className="text-[10px] text-slate-400 font-bold">{p.vidas} vidas</div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`flex items-center gap-1.5 text-xs font-bold ${
                        p.status === 'CADASTRADA' ? 'text-slate-600' :
                        p.status === 'ENVIADA AO FINANCEIRO' ? 'text-blue-600' :
                        p.status === 'PAGO' ? 'text-emerald-600' :
                        'text-slate-600'
                      }`}>
                        {p.status === 'CADASTRADA' && '🕒 Cadastrada'}
                        {p.status === 'ENVIADA AO FINANCEIRO' && '🚀 Enviada'}
                        {p.status === 'PAGO' && '✅ Pago'}
                        {p.status !== 'CADASTRADA' && p.status !== 'ENVIADA AO FINANCEIRO' && p.status !== 'PAGO' && p.status}
                      </span>
                      {p.detalhes?.proposta?.pagamentoCartao && (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-orange-600">
                          💳 Cartão Corretora
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 relative">
                    <div className="flex items-center gap-2">
                      {openDropdownId === p.id && (
                        <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownId(null)}></div>
                      )}
                      
                      <button 
                        onClick={() => setOpenDropdownId(openDropdownId === p.id ? null : p.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all z-10"
                        title="Opções"
                      >
                        <i className="fa-solid fa-ellipsis-vertical text-xs"></i>
                      </button>

                      {openDropdownId === p.id && (
                        <div className="absolute right-12 top-10 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                          <button
                            onClick={() => {
                              setViewingProposal(p);
                              setOpenDropdownId(null);
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <i className="fa-solid fa-eye text-slate-400 w-4 text-center"></i> Visualizar
                          </button>
                          
                          <button
                            onClick={() => {
                              onEditProposal(p);
                              setOpenDropdownId(null);
                            }}
                            disabled={p.status === 'PAGO'}
                            className={`w-full text-left px-4 py-2 text-xs font-bold flex items-center gap-2 ${
                              p.status === 'PAGO' ? 'text-slate-300 cursor-not-allowed' : 'text-blue-600 hover:bg-slate-50'
                            }`}
                          >
                            <i className="fa-solid fa-pen-to-square w-4 text-center"></i> Editar
                          </button>

                          {p.status === 'CADASTRADA' && (
                            confirmingSendId === p.id ? (
                              <div className="px-2 py-1 mx-2 flex gap-1 bg-emerald-50 rounded-lg">
                                <button
                                  onClick={() => {
                                    onEditProposal({ ...p, status: 'ENVIADA AO FINANCEIRO' } as any);
                                    setConfirmingSendId(null);
                                    setOpenDropdownId(null);
                                  }}
                                  className="flex-1 bg-emerald-600 text-white rounded text-[10px] font-bold py-1"
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmingSendId(p.id);
                                }}
                                className="w-full text-left px-4 py-2 text-xs font-bold text-emerald-600 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <i className="fa-solid fa-paper-plane w-4 text-center"></i> Enviar ao Financeiro
                              </button>
                            )
                          )}

                          {p.status !== 'PAGO' && p.status !== 'ENVIADA AO FINANCEIRO' && (
                            confirmingDeleteId === p.id ? (
                              <div className="px-2 py-1 mx-2 flex gap-1 bg-red-50 rounded-lg">
                                <button
                                  onClick={() => {
                                    onDeleteProposal(p.id);
                                    setConfirmingDeleteId(null);
                                    setOpenDropdownId(null);
                                  }}
                                  className="flex-1 bg-red-600 text-white rounded text-[10px] font-bold py-1"
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmingDeleteId(p.id);
                                }}
                                className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <i className="fa-solid fa-trash w-4 text-center"></i> Excluir
                              </button>
                            )
                          )}
                        </div>
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

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} até {Math.min(currentPage * itemsPerPage, filteredProposals.length)} de {filteredProposals.length} registros
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <i className="fa-solid fa-chevron-left text-[10px]"></i>
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                  })
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="text-slate-400 font-bold px-1">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                          currentPage === page 
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <i className="fa-solid fa-chevron-right text-[10px]"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {importPreviewData && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-xl shadow-inner">
                  <i className="fa-solid fa-file-import"></i>
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Revisão de Importação</h2>
                  <p className="text-sm font-bold text-slate-500">Foram encontradas {importPreviewData.length} propostas na planilha.</p>
                </div>
              </div>
              <button 
                onClick={() => setImportPreviewData(null)}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contrato</th>
                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operadora</th>
                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {importPreviewData.slice(0, 50).map((p, index) => (
                        <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-slate-700 uppercase">{p.cliente}</div>
                            <div className="text-[10px] text-slate-400 font-bold">CPF: {p.cpfCnpj}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-blue-600">{p.contrato}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-700">{p.detalhes?.proposta?.operadora || p.operadora || 'N/A'}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-emerald-600">
                              R$ {Number(p.valor || p.detalhes?.financeiro?.valorContrato || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {importPreviewData.length > 50 && (
                  <div className="p-4 text-center bg-slate-50 border-t border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Mostrando as primeiras 50 de {importPreviewData.length} propostas...
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 flex gap-4 bg-white">
              <button
                type="button"
                onClick={() => setImportPreviewData(null)}
                className="flex-1 px-4 py-4 bg-slate-100 rounded-2xl font-black text-slate-500 hover:bg-slate-200 transition-all uppercase text-xs tracking-widest"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onImportProposals) {
                    onImportProposals(importPreviewData);
                  }
                  setImportPreviewData(null);
                }}
                className="flex-1 px-4 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-600/30 transition-all uppercase text-xs tracking-widest flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-check"></i> Confirmar Importação
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingProposal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-xl shadow-inner">
                  <i className="fa-solid fa-file-contract"></i>
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Detalhes da Proposta</h2>
                  <p className="text-sm font-bold text-slate-500">Contrato: {viewingProposal.contrato}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingProposal(null)}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-white">
              <div className="space-y-6">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cliente</label>
                    <div className="font-bold text-slate-800">{viewingProposal.cliente}</div>
                    <div className="text-xs text-slate-500 font-bold mt-1">CPF/CNPJ: {viewingProposal.cpfCnpj}</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Corretor / Venda</label>
                    <div className="font-bold text-slate-800">{viewingProposal.corretor}</div>
                    <div className="text-xs text-slate-500 font-bold mt-1">Data: {viewingProposal.data}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Operadora</label>
                    <div className="font-bold text-slate-800">{viewingProposal.operadora}</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Categoria</label>
                    <div className="font-bold text-slate-800">{viewingProposal.categoria}</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tipo de Plano</label>
                    <div className="font-bold text-slate-800">{viewingProposal.detalhes?.proposta?.tipoPlano || 'N/A'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-1">Valor do Contrato</label>
                    <div className="text-xl font-black text-blue-700">R$ {Number(viewingProposal.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    <div className="text-xs text-blue-500 font-bold mt-1">{viewingProposal.vidas} vidas</div>
                  </div>
                  <div className={`p-4 rounded-xl border ${
                    viewingProposal.status === 'CADASTRADA' ? 'bg-slate-50 border-slate-100' :
                    viewingProposal.status === 'ENVIADA AO FINANCEIRO' ? 'bg-blue-50 border-blue-100' :
                    viewingProposal.status === 'PAGO' ? 'bg-emerald-50 border-emerald-100' :
                    'bg-slate-50 border-slate-100'
                  }`}>
                    <label className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${
                      viewingProposal.status === 'CADASTRADA' ? 'text-slate-400' :
                      viewingProposal.status === 'ENVIADA AO FINANCEIRO' ? 'text-blue-400' :
                      viewingProposal.status === 'PAGO' ? 'text-emerald-400' :
                      'text-slate-400'
                    }`}>Status Atual</label>
                    <div className={`text-xl font-bold flex items-center gap-2 ${
                      viewingProposal.status === 'CADASTRADA' ? 'text-slate-700' :
                      viewingProposal.status === 'ENVIADA AO FINANCEIRO' ? 'text-blue-700' :
                      viewingProposal.status === 'PAGO' ? 'text-emerald-700' :
                      'text-slate-700'
                    }`}>
                      {viewingProposal.status === 'CADASTRADA' && '🕒 Cadastrada'}
                      {viewingProposal.status === 'ENVIADA AO FINANCEIRO' && '🚀 Enviada ao Financeiro'}
                      {viewingProposal.status === 'PAGO' && '✅ Pago'}
                      {viewingProposal.status !== 'CADASTRADA' && viewingProposal.status !== 'ENVIADA AO FINANCEIRO' && viewingProposal.status !== 'PAGO' && viewingProposal.status}
                    </div>
                  </div>
                </div>

                {viewingProposal.observacoes && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Observações</label>
                    <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap">{viewingProposal.observacoes}</p>
                  </div>
                )}
                
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingProposal(null)}
                className="px-6 py-3 bg-slate-200 text-slate-600 rounded-xl font-black hover:bg-slate-300 transition-all uppercase text-xs tracking-widest"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProposalsView;
