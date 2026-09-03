
import React, { useState, useMemo, useEffect } from 'react';
import { Proposal, ProposalRequirement } from '../types';
import * as XLSX from 'xlsx';
import { RevisaoImportacaoModal } from './RevisaoImportacaoModal';

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
  const [alertMessage, setAlertMessage] = useState('');

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
      const searchTerms = searchTerm.toLowerCase().trim().split(/\s+/);
      const matchSearch = searchTerms.every(term => 
        (p.cliente || '').toLowerCase().includes(term) || 
        (p.cpfCnpj || '').toLowerCase().includes(term) || 
        (p.contrato || '').toLowerCase().includes(term)
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
          if (!str || str === '-') return 0;
          
          let cleanStr = str.replace(/R\$\s?/gi, '').replace(/\s/g, '').replace(/\u00A0/g, '');
          
          const commas = (cleanStr.match(/,/g) || []).length;
          const dots = (cleanStr.match(/\./g) || []).length;
          
          if (commas === 1 && dots === 1) {
            if (cleanStr.indexOf('.') < cleanStr.indexOf(',')) {
               return parseFloat(cleanStr.replace(/\./g, '').replace(',', '.'));
            } else {
               return parseFloat(cleanStr.replace(/,/g, ''));
            }
          }
          
          if (commas === 1 && dots === 0) {
            const parts = cleanStr.split(',');
            if (parts[1].length <= 2) {
               return parseFloat(cleanStr.replace(',', '.'));
            } else {
               return parseFloat(cleanStr.replace(',', ''));
            }
          }
          
          if (dots === 1 && commas === 0) {
            const parts = cleanStr.split('.');
            if (parts[1].length === 3) {
               return parseFloat(cleanStr.replace('.', ''));
            }
          }
          
          const parsed = parseFloat(cleanStr);
          return isNaN(parsed) ? 0 : parsed;
        };

        const importedProposals = validRows.map(row => {
          const clienteNome = row['Nome']?.toString() || row['Cliente']?.toString() || 'Cliente Não Informado';
          const clienteCpfCnpj = row['CPF / CNPJ']?.toString() || row['CPF/CNPJ']?.toString() || row['CPF']?.toString() || row['CNPJ']?.toString() || '000.000.000-00';
          const contratoNum = row['Nº Contrato']?.toString() || row['Contrato']?.toString() || ('IMP-' + Math.random().toString(36).substr(2, 9).toUpperCase());
          const corretorNome = row['Corretor']?.toString() || 'Corretor Geral';
          const operadoraNome = row['Operadora']?.toString() || 'Operadora Geral';
          const categoriaNome = row['Categoria']?.toString() || 'Geral';
          const valorNum = cleanMoney(row['Valor Contrato'] || row['Valor']);
          // Não força mais 0 -> 1 em silêncio; deixa passar e a tela de
          // revisão sinaliza, porque 0 pode ser um erro real de preenchimento
          const vidasNum = parseInt(row['Vidas']?.toString() || '0', 10) || 0;
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
          if (!isNaN(comissaoFromRow) && comissaoFromRow !== 0) {
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
            // Toda importação entra como CADASTRADA, sempre — o que a planilha
            // trouxer em "Status" é ignorado de propósito. Deixar a vendedora
            // marcar "Pago" na planilha e isso pular direto o fluxo normal
            // (Cadastrada -> Enviada ao Financeiro -> Paga) puxaria o registro
            // sem passar pelas ações que cada etapa dispara no financeiro.
            status: 'CADASTRADA',
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
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-[26px] font-extrabold text-[#002b66] tracking-tight leading-tight">
            Propostas de Saúde
          </h1>
          <p className="text-[13px] text-slate-500 font-normal mt-1">
            Gerencie e consulte o histórico de propostas e contratos de saúde.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDownloadTemplate}
            className="bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-200 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Baixar planilha modelo"
          >
            <span className="material-symbols-outlined text-[17px] text-slate-600">download</span>
            <span>Baixar Modelo</span>
          </button>
          <label className="bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-200 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer">
            <span className="material-symbols-outlined text-[17px] text-slate-600">upload</span>
            <span>Importar</span>
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportExcel} />
          </label>
          <button
            onClick={handleExportExcel}
            className="bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-200 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px] text-slate-600">output</span>
            <span>Exportar Excel</span>
          </button>
          <button
            onClick={onAddProposal}
            className="bg-[#001f54] hover:bg-[#001740] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-98"
          >
            <span className="material-symbols-outlined text-[17px] leading-none">add</span>
            <span>Nova Proposta</span>
          </button>
        </div>
      </div>

      {/* 3 Stat KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
        <div className="bg-white px-5 py-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-[#ebf3ff] text-[#2563eb] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl font-normal">group</span>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-normal">Total Vidas (Filtro)</div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight leading-tight mt-0.5">{totalVidas}</div>
          </div>
        </div>

        <div className="bg-white px-5 py-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-[#e8fbf3] text-[#10b981] flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-[#10b981]">$</span>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-normal">Valor Total (Filtro)</div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight leading-tight mt-0.5">
              R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="bg-white px-5 py-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-[#fef7ea] text-[#f59e0b] flex items-center justify-center shrink-0">
            <div className="w-5.5 h-5.5 rounded-full border-[1.5px] border-[#f59e0b] flex items-center justify-center text-[#f59e0b] text-xs font-black tracking-tighter leading-none pb-0.5">
              ···
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-normal">Aguardando Envio (Filtro)</div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight leading-tight mt-0.5">{pendentesEnvio}</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-2.5">
        <div className="flex-1 min-w-[220px] relative">
          <span className="material-symbols-outlined text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">search</span>
          <input
            type="text"
            placeholder="Buscar por Cliente, CPF/CNPJ ou Nº Contrato..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterPeriodo}
            onChange={(e) => setFilterPeriodo(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg text-xs py-2 px-3 text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="Todos">Periodo: Todos</option>
            <option value="Últimos 7 dias">Últimos 7 dias</option>
            <option value="Este mês">Este mês</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg text-xs py-2 px-3 text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
          >
            {statusOptions.map(s => <option key={s} value={s}>{s === 'Todos' ? 'Status: Todos' : s}</option>)}
          </select>
          <select
            value={filterOperadora}
            onChange={(e) => setFilterOperadora(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg text-xs py-2 px-3 text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
          >
            {operadoras.map(op => <option key={op} value={op}>{op === 'Todas' ? 'Operadora: Todas' : op}</option>)}
          </select>
          <select
            value={filterTipoPlano}
            onChange={(e) => setFilterTipoPlano(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg text-xs py-2 px-3 text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
          >
            {tiposPlano.map(tp => <option key={tp} value={tp}>{tp === 'Todos' ? 'Tipo: Todos' : tp}</option>)}
          </select>
          <select
            value={filterCorretor}
            onChange={(e) => setFilterCorretor(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg text-xs py-2 px-3 text-slate-700 outline-none focus:border-blue-500 cursor-pointer max-w-[150px] truncate"
          >
            {corretores.map(c => <option key={c} value={c}>{c === 'Todos' ? 'Corretor: Todos' : c}</option>)}
          </select>
          <input
            type="text"
            placeholder="Valor..."
            value={filterValor}
            onChange={(e) => setFilterValor(e.target.value)}
            className="w-24 bg-white border border-slate-200 rounded-lg text-xs py-2 px-3 text-slate-700 outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
          <button className="px-5 py-2 bg-[#f0f7ff] hover:bg-[#e0efff] text-[#0284c7] rounded-lg text-xs font-black uppercase tracking-wider transition-colors border border-sky-100 cursor-pointer">
            BUSCAR
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th className="py-3 px-4 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    onChange={handleSelectAll}
                    checked={filteredProposals.length > 0 && selectedIds.length === filteredProposals.length}
                  />
                </th>
                <th className="py-3 px-4 text-[11px] font-black text-slate-500 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('contrato')}>
                  CONTRATO / DATA {sortColumn === 'contrato' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-3 px-4 text-[11px] font-black text-slate-500 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('cliente')}>
                  CLIENTE {sortColumn === 'cliente' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-3 px-4 text-[11px] font-black text-slate-500 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('corretor')}>
                  CORRETOR {sortColumn === 'corretor' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-3 px-4 text-[11px] font-black text-slate-500 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('operadora')}>
                  OPERADORA {sortColumn === 'operadora' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-3 px-4 text-[11px] font-black text-slate-500 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('valor')}>
                  VALOR / VIDAS {sortColumn === 'valor' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-3 px-4 text-[11px] font-black text-slate-500 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('status')}>
                  STATUS {sortColumn === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-3 px-4 text-[11px] font-black text-slate-500 uppercase tracking-wider text-center">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedProposals.map((p) => (
                <tr key={p.id} className={`hover:bg-slate-50/70 transition-colors group ${selectedIds.includes(p.id) ? 'bg-blue-50/20' : ''}`}>
                  <td className="py-3 px-4">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={selectedIds.includes(p.id)}
                      onChange={() => handleSelectOne(p.id)}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <button 
                      onClick={() => setViewingProposal(p)}
                      className="font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1.5 text-xs transition-colors cursor-pointer text-left"
                    >
                      {p.contrato}
                      {p.contrato.startsWith('IMP-') && (
                        <span className="material-symbols-outlined text-amber-500 text-sm" title="Contrato provisório">warning</span>
                      )}
                    </button>
                    <div className="text-[11px] text-slate-400 font-medium">{p.data}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-800 text-xs uppercase">{p.cliente}</div>
                    <div className="text-[10px] text-slate-400 font-medium">CPF: {p.cpfCnpj}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-700 text-xs uppercase">{p.corretor}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-800 text-xs uppercase">{p.operadora}</div>
                    <div className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">
                      {p.categoria} {p.detalhes?.proposta?.tipoPlano ? `- ${p.detalhes.proposta.tipoPlano}` : ''}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-800 text-xs">
                      R$ {Number(p.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className={`text-[10px] font-medium ${!p.vidas || p.vidas === 0 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                      {p.vidas} vidas
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1 items-start justify-center">
                      {p.status === 'PAGO' || p.status === 'PAGA' ? (
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#009688]">
                          <span className="material-symbols-outlined text-base text-[#009688] leading-none">check_box</span>
                          <span>Pago</span>
                        </div>
                      ) : p.status === 'ENVIADA AO FINANCEIRO' || p.status === 'ENVIADA' ? (
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563eb]">
                          <span className="text-xs leading-none">🚀</span>
                          <span>Enviada</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600">
                          <span className="material-symbols-outlined text-base text-amber-500 leading-none">schedule</span>
                          <span>Cadastrada</span>
                        </div>
                      )}

                      {p.detalhes?.proposta?.pagamentoCartao && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#e65100] uppercase tracking-tight">
                          <span className="text-xs leading-none">💳</span>
                          <span>CARTÃO CORRETORA</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 relative text-center">
                    <div className="inline-flex items-center justify-center">
                      {openDropdownId === p.id && (
                        <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownId(null)}></div>
                      )}
                      
                      <button 
                        onClick={() => setOpenDropdownId(openDropdownId === p.id ? null : p.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors z-10 cursor-pointer"
                        title="Ações"
                      >
                        <span className="material-symbols-outlined text-base">more_vert</span>
                      </button>

                      {openDropdownId === p.id && (
                        <div className="absolute right-8 top-8 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
                          <button
                            onClick={() => {
                              setViewingProposal(p);
                              setOpenDropdownId(null);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm text-slate-400">visibility</span>
                            <span>Visualizar</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              onEditProposal(p);
                              setOpenDropdownId(null);
                            }}
                            disabled={p.status === 'PAGO' || p.status === 'PAGA'}
                            className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center gap-2 cursor-pointer ${
                              p.status === 'PAGO' || p.status === 'PAGA' ? 'text-slate-300 cursor-not-allowed' : 'text-blue-600 hover:bg-slate-50'
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                            <span>Editar</span>
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
                                  className="flex-1 bg-emerald-600 text-white rounded text-[10px] font-bold py-1 cursor-pointer"
                                >
                                  Confirmar
                                </button>
                                <button
                                  onClick={() => setConfirmingSendId(null)}
                                  className="px-2 bg-slate-200 text-slate-600 rounded text-[10px] font-bold hover:bg-slate-300 cursor-pointer"
                                >
                                  X
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!p.vidas || p.vidas === 0) {
                                    setAlertMessage('Não é possível enviar propostas com 0 vidas para o financeiro. Edite a proposta e insira a quantidade de vidas corretamente.');
                                    return;
                                  }
                                  if ((!p.valor || p.valor === 0) && !p.detalhes?.proposta?.pagamentoCartao) {
                                    setAlertMessage('Não é possível enviar propostas com valor R$ 0,00 para o financeiro (exceto Cartão Corretora). Edite a proposta e insira o valor do contrato.');
                                    return;
                                  }
                                  if (!p.contrato || p.contrato.trim() === '' || p.contrato.startsWith('IMP-')) {
                                    setAlertMessage('Não é possível enviar propostas sem número de contrato para o financeiro. Edite a proposta e informe o contrato.');
                                    return;
                                  }
                                  setConfirmingSendId(p.id);
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-emerald-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm">send</span>
                                <span>Enviar ao Financeiro</span>
                              </button>
                            )
                          )}

                          {p.status !== 'PAGO' && p.status !== 'PAGA' && p.status !== 'ENVIADA AO FINANCEIRO' && (
                            confirmingDeleteId === p.id ? (
                              <div className="px-2 py-1 mx-2 flex gap-1 bg-red-50 rounded-lg">
                                <button
                                  onClick={() => {
                                    onDeleteProposal(p.id);
                                    setConfirmingDeleteId(null);
                                    setOpenDropdownId(null);
                                  }}
                                  className="flex-1 bg-red-600 text-white rounded text-[10px] font-bold py-1 cursor-pointer"
                                >
                                  Deletar
                                </button>
                                <button
                                  onClick={() => setConfirmingDeleteId(null)}
                                  className="px-2 bg-slate-200 text-slate-600 rounded text-[10px] font-bold hover:bg-slate-300 cursor-pointer"
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
                                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                                <span>Excluir</span>
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
                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">folder_open</span>
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
        <RevisaoImportacaoModal
          data={importPreviewData}
          requirements={requirements}
          existingProposals={proposals}
          onCancel={() => setImportPreviewData(null)}
          onConfirm={(rows) => {
            if (onImportProposals) onImportProposals(rows);
            setImportPreviewData(null);
          }}
        />
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

      {alertMessage !== '' && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 text-2xl">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">Atenção</h3>
              <p className="text-sm text-slate-600 mb-6">{alertMessage}</p>
              <button 
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

export default ProposalsView;
