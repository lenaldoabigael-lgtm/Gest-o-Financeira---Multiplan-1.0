import React, { useState, useMemo, useRef } from 'react';
import { Transaction, TransactionType, Status, CostCenter } from '../types';

interface TransactionTableProps {
  type: TransactionType;
  transactions: Transaction[];
  costCenters: CostCenter[];
  onAdd: (transaction: Transaction) => void;
  onBulkAdd?: (transactions: Transaction[]) => Promise<void>;
  onUpdate: (transaction: Transaction) => void;
  onBulkUpdate?: (transactions: Transaction[]) => Promise<void>;
  onDelete: (ids: string[]) => void;
}

type SortField = 'vencimento' | 'valor' | 'descricao' | 'centroCusto';
type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 50;

export const TransactionTable: React.FC<TransactionTableProps> = ({
  type,
  transactions,
  costCenters,
  onAdd,
  onBulkAdd,
  onUpdate,
  onBulkUpdate,
  onDelete
}) => {
  // Filters State
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [filterPeriod, setFilterPeriod] = useState<string>('TODOS');
  const [filterCentroCusto, setFilterCentroCusto] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('vencimento');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Pagination (50 items per page)
  const [currentPage, setCurrentPage] = useState(1);

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImportExportMenuOpen, setIsImportExportMenuOpen] = useState(false);
  const [importData, setImportData] = useState<Transaction[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Main Form Data
  const [formData, setFormData] = useState({
    vencimento: new Date().toISOString().split('T')[0],
    pagamento: '',
    descricao: '',
    valor: '',
    formaPagamento: 'PIX',
    centroCusto: '',
    subItem: '',
    status: 'PENDENTE' as Status,
    conta: 'GERAL',
    comprovanteUrl: ''
  });

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrences, setRecurrences] = useState(2);

  // Batch Form Rows (for "Cadastro em lote")
  const [batchRows, setBatchRows] = useState<Array<{
    id: string;
    vencimento: string;
    descricao: string;
    valor: string;
    formaPagamento: string;
    centroCusto: string;
    subItem: string;
    conta: string;
    status: Status;
  }>>([
    { id: '1', vencimento: new Date().toISOString().split('T')[0], descricao: '', valor: '', formaPagamento: 'PIX', centroCusto: '', subItem: '', conta: 'GERAL', status: 'PENDENTE' },
    { id: '2', vencimento: new Date().toISOString().split('T')[0], descricao: '', valor: '', formaPagamento: 'PIX', centroCusto: '', subItem: '', conta: 'GERAL', status: 'PENDENTE' },
    { id: '3', vencimento: new Date().toISOString().split('T')[0], descricao: '', valor: '', formaPagamento: 'PIX', centroCusto: '', subItem: '', conta: 'GERAL', status: 'PENDENTE' },
  ]);

  const availableCostCenters = useMemo(() => {
    return costCenters.filter(cc => cc.tipo === (type === 'RECEBER' ? 'RECEITA' : 'DESPESA'));
  }, [costCenters, type]);

  const availableSubItems = useMemo(() => {
    return availableCostCenters.find(cc => cc.nome === formData.centroCusto)?.subItens || [];
  }, [availableCostCenters, formData.centroCusto]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filtered and Sorted list
  const filteredTransactions = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const thirtyDaysStr = thirtyDaysAgo.toISOString().split('T')[0];

    return transactions.filter(t => {
      // Search
      if (search) {
        const matchesSearch =
          t.descricao.toLowerCase().includes(search) ||
          t.centroCusto.toLowerCase().includes(search) ||
          (t.subItem || '').toLowerCase().includes(search) ||
          (t.conta || '').toLowerCase().includes(search) ||
          t.formaPagamento.toLowerCase().includes(search) ||
          t.valor.toString().includes(search);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filterStatus !== 'TODOS') {
        const isAtrasado = t.status === 'PENDENTE' && t.vencimento < todayStr;
        if (filterStatus === 'ATRASADO') {
          if (!isAtrasado) return false;
        } else if (filterStatus === 'PENDENTE') {
          if (t.status !== 'PENDENTE') return false;
        } else if (filterStatus === 'PAGO' || filterStatus === 'RECEBIDO') {
          if (t.status !== 'PAGO' && t.status !== 'RECEBIDO') return false;
        }
      }

      // Period filter
      if (filterPeriod !== 'TODOS') {
        const [year, month] = t.vencimento.split('-').map(Number);
        if (filterPeriod === 'MES_ATUAL') {
          if (year !== currentYear || month !== currentMonth + 1) return false;
        } else if (filterPeriod === 'ULTIMOS_30_DIAS') {
          if (t.vencimento < thirtyDaysStr || t.vencimento > todayStr) return false;
        } else if (filterPeriod === 'ATRASADOS') {
          if (!(t.status === 'PENDENTE' && t.vencimento < todayStr)) return false;
        }
      }

      // Centro de Custo filter
      if (filterCentroCusto !== 'TODOS') {
        if (t.centroCusto !== filterCentroCusto) return false;
      }

      return true;
    });
  }, [transactions, searchTerm, filterStatus, filterPeriod, filterCentroCusto, todayStr]);

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      let comp = 0;
      if (sortField === 'vencimento') {
        comp = a.vencimento.localeCompare(b.vencimento);
      } else if (sortField === 'valor') {
        comp = a.valor - b.valor;
      } else if (sortField === 'descricao') {
        comp = a.descricao.localeCompare(b.descricao);
      } else if (sortField === 'centroCusto') {
        comp = a.centroCusto.localeCompare(b.centroCusto);
      }
      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [filteredTransactions, sortField, sortOrder]);

  // Total Pendente calculation
  const totalPendente = useMemo(() => {
    return filteredTransactions
      .filter(t => t.status === 'PENDENTE')
      .reduce((acc, t) => acc + t.valor, 0);
  }, [filteredTransactions]);

  // Pagination Math (50 rows per page)
  const totalRecords = sortedTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / ITEMS_PER_PAGE));
  const effectiveCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = (effectiveCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalRecords);
  const displayedTransactions = useMemo(() => {
    return sortedTransactions.slice(startIndex, endIndex);
  }, [sortedTransactions, startIndex, endIndex]);

  // Reset pagination on filter change
  const handleFilterChange = (setter: (val: any) => void, val: any) => {
    setter(val);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilterStatus('TODOS');
    setFilterPeriod('TODOS');
    setFilterCentroCusto('TODOS');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Checkbox helpers
  const areAllCurrentPageSelected = useMemo(() => {
    if (displayedTransactions.length === 0) return false;
    return displayedTransactions.every(t => selectedIds.includes(t.id));
  }, [displayedTransactions, selectedIds]);

  const handleSelectAllCurrentPage = () => {
    if (areAllCurrentPageSelected) {
      const pageIds = new Set(displayedTransactions.map(t => t.id));
      setSelectedIds(prev => prev.filter(id => !pageIds.has(id)));
    } else {
      const pageIds = displayedTransactions.map(t => t.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Form Reset
  const resetForm = () => {
    setFormData({
      vencimento: new Date().toISOString().split('T')[0],
      pagamento: '',
      descricao: '',
      valor: '',
      formaPagamento: 'PIX',
      centroCusto: '',
      subItem: '',
      status: 'PENDENTE',
      conta: 'GERAL',
      comprovanteUrl: ''
    });
    setIsRecurring(false);
    setRecurrences(2);
    setEditingId(null);
  };

  // Open Edit
  const handleOpenEdit = (t: Transaction) => {
    setEditingId(t.id);
    setFormData({
      vencimento: t.vencimento,
      pagamento: t.pagamento || '',
      descricao: t.descricao,
      valor: t.valor.toString(),
      formaPagamento: t.formaPagamento || 'PIX',
      centroCusto: t.centroCusto,
      subItem: t.subItem || '',
      status: t.status,
      conta: t.conta || 'GERAL',
      comprovanteUrl: t.cliente || ''
    });
    setIsRecurring(false);
    setIsModalOpen(true);
  };

  // Quick Toggle Status (Pendente <-> Pago/Recebido)
  const handleTogglePaid = (t: Transaction) => {
    if (t.status === 'PENDENTE') {
      onUpdate({
        ...t,
        status: type === 'PAGAR' ? 'PAGO' : 'RECEBIDO',
        pagamento: todayStr
      });
    } else {
      onUpdate({
        ...t,
        status: 'PENDENTE',
        pagamento: undefined
      });
    }
  };

  // Single Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.descricao.trim() || !formData.valor) return;

    const parsedValor = parseFloat(formData.valor.toString().replace(',', '.'));
    if (isNaN(parsedValor)) {
      alert('Por favor, informe um valor numérico válido.');
      return;
    }

    if (!editingId && isRecurring && recurrences > 1) {
      const transactionsToInsert: Transaction[] = [];
      const [year, month, day] = formData.vencimento.split('-').map(Number);

      for (let i = 0; i < recurrences; i++) {
        const date = new Date(year, month - 1 + i, day);
        const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        transactionsToInsert.push({
          id: crypto.randomUUID(),
          type: type,
          vencimento: dateString,
          pagamento: i === 0 && formData.status !== 'PENDENTE' ? (formData.pagamento || dateString) : undefined,
          descricao: `${formData.descricao.trim()} (${i + 1}/${recurrences})`,
          valor: parsedValor,
          formaPagamento: formData.formaPagamento,
          status: i === 0 ? formData.status : 'PENDENTE',
          centroCusto: formData.centroCusto || 'OUTROS',
          subItem: formData.subItem || '',
          conta: formData.conta || 'GERAL',
          cliente: formData.comprovanteUrl || ''
        });
      }

      if (onBulkAdd) {
        await onBulkAdd(transactionsToInsert);
      } else {
        transactionsToInsert.forEach(t => onAdd(t));
      }
    } else {
      const transactionData: Transaction = {
        id: editingId || crypto.randomUUID(),
        type: type,
        vencimento: formData.vencimento,
        pagamento: formData.status !== 'PENDENTE' ? (formData.pagamento || formData.vencimento) : undefined,
        descricao: formData.descricao.trim(),
        valor: parsedValor,
        formaPagamento: formData.formaPagamento,
        status: formData.status,
        centroCusto: formData.centroCusto || 'OUTROS',
        subItem: formData.subItem || '',
        conta: formData.conta || 'GERAL',
        cliente: formData.comprovanteUrl || ''
      };

      if (editingId) onUpdate(transactionData);
      else onAdd(transactionData);
    }

    setIsModalOpen(false);
    resetForm();
  };

  // Batch Add Save
  const handleSaveBatch = async () => {
    const validRows = batchRows.filter(r => r.descricao.trim() && parseFloat(r.valor.replace(',', '.')) > 0);
    if (validRows.length === 0) {
      alert('Preencha ao menos uma linha válida com Descrição e Valor.');
      return;
    }

    const itemsToInsert: Transaction[] = validRows.map(r => ({
      id: crypto.randomUUID(),
      type: type,
      vencimento: r.vencimento || todayStr,
      pagamento: r.status !== 'PENDENTE' ? r.vencimento : undefined,
      descricao: r.descricao.trim().toUpperCase(),
      valor: parseFloat(r.valor.replace(',', '.')),
      formaPagamento: r.formaPagamento || 'PIX',
      status: r.status || 'PENDENTE',
      centroCusto: r.centroCusto || 'OUTROS',
      subItem: r.subItem || '',
      conta: r.conta || 'GERAL'
    }));

    if (onBulkAdd) {
      await onBulkAdd(itemsToInsert);
    } else {
      itemsToInsert.forEach(t => onAdd(t));
    }

    setIsBatchModalOpen(false);
    // Reset batch rows
    setBatchRows([
      { id: '1', vencimento: todayStr, descricao: '', valor: '', formaPagamento: 'PIX', centroCusto: '', subItem: '', conta: 'GERAL', status: 'PENDENTE' },
      { id: '2', vencimento: todayStr, descricao: '', valor: '', formaPagamento: 'PIX', centroCusto: '', subItem: '', conta: 'GERAL', status: 'PENDENTE' },
      { id: '3', vencimento: todayStr, descricao: '', valor: '', formaPagamento: 'PIX', centroCusto: '', subItem: '', conta: 'GERAL', status: 'PENDENTE' },
    ]);
  };

  // Bulk actions
  const handleBulkMarkAsPaid = async () => {
    if (!onBulkUpdate) return;
    const itemsToUpdate = transactions
      .filter(t => selectedIds.includes(t.id) && t.status === 'PENDENTE')
      .map(t => ({
        ...t,
        status: (type === 'PAGAR' ? 'PAGO' : 'RECEBIDO') as Status,
        pagamento: todayStr
      }));

    if (itemsToUpdate.length > 0) {
      await onBulkUpdate(itemsToUpdate);
      setSelectedIds([]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Deseja realmente excluir os ${selectedIds.length} registros selecionados?`)) {
      onDelete(selectedIds);
      setSelectedIds([]);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Vencimento', 'Pagamento', 'Descrição', 'Valor', 'Forma Pagamento', 'Status', 'Centro de Custo', 'Sub-item', 'Conta'];
    const rows = sortedTransactions.map(t => [
      t.vencimento,
      t.pagamento || '',
      `"${t.descricao.replace(/"/g, '""')}"`,
      t.valor.toFixed(2),
      t.formaPagamento,
      t.status,
      `"${t.centroCusto.replace(/"/g, '""')}"`,
      `"${(t.subItem || '').replace(/"/g, '""')}"`,
      t.conta || 'GERAL'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${type === 'PAGAR' ? 'contas_a_pagar' : 'contas_a_receber'}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsImportExportMenuOpen(false);
  };

  // CSV Import handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/);
      if (lines.length < 2) return;

      const headerLine = lines[0];
      const countSemicolon = (headerLine.match(/;/g) || []).length;
      const countComma = (headerLine.match(/,/g) || []).length;
      const separator = countSemicolon >= countComma ? ';' : ',';

      const headers = headerLine.toLowerCase().split(separator).map(h => h.trim());
      const parsed: Transaction[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(separator);
        const getCol = (possibleHeaders: string[]) => {
          const idx = headers.findIndex(h => possibleHeaders.some(p => h.includes(p)));
          return idx !== -1 ? cols[idx]?.trim() : '';
        };

        const vencRaw = getCol(['venc', 'data']);
        const desc = getCol(['desc', 'lança', 'hist']);
        const valorRaw = getCol(['valor', 'quant', 'preço', 'total']);
        const statusRaw = getCol(['stat']);
        const forma = getCol(['forma', 'pag', 'mov']);
        const centro = getCol(['centro', 'categ', 'estru']);
        const sub = getCol(['sub', 'item']);
        const conta = getCol(['conta', 'banc']);

        let venc = vencRaw;
        if (vencRaw.includes('/')) {
          const parts = vencRaw.split('/');
          if (parts.length === 3) {
            const [d, m, y] = parts;
            venc = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
          }
        }

        const valorClean = (valorRaw || '0').replace(/\./g, '').replace(',', '.');
        const valor = parseFloat(valorClean);

        const sUpper = (statusRaw || '').toUpperCase();
        let finalStatus: Status = 'PENDENTE';
        if (sUpper.includes('PAGO') || sUpper.includes('RECEB') || sUpper.includes('CONCLU')) {
          finalStatus = type === 'PAGAR' ? 'PAGO' : 'RECEBIDO';
        }

        parsed.push({
          id: crypto.randomUUID(),
          type,
          vencimento: venc || todayStr,
          descricao: (desc || 'IMPORTADO CSV').toUpperCase(),
          valor: isNaN(valor) ? 0 : valor,
          status: finalStatus,
          formaPagamento: (forma || 'PIX').toUpperCase(),
          centroCusto: (centro || 'OUTROS').toUpperCase(),
          subItem: (sub || '').toUpperCase(),
          conta: (conta || 'GERAL').toUpperCase()
        });
      }

      setImportData(parsed);
      setIsImportModalOpen(true);
      setIsImportExportMenuOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const confirmImport = async () => {
    if (onBulkAdd) {
      await onBulkAdd(importData);
    } else {
      for (const item of importData) {
        onAdd(item);
      }
    }
    setIsImportModalOpen(false);
    setImportData([]);
  };

  // Helper date formatter (DD/MM/YYYY)
  const formatDateBR = (isoDate: string) => {
    if (!isoDate) return '-';
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDate;
  };

  // Helper currency formatter
  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Generate pagination range numbers
  const paginationRange = useMemo(() => {
    const range: (number | string)[] = [];
    const maxVisible = 10;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) range.push(i);
    } else {
      // Show first pages, current window, and last
      if (effectiveCurrentPage <= 4) {
        for (let i = 1; i <= 6; i++) range.push(i);
        range.push('...');
        range.push(totalPages);
      } else if (effectiveCurrentPage >= totalPages - 3) {
        range.push(1);
        range.push('...');
        for (let i = totalPages - 5; i <= totalPages; i++) range.push(i);
      } else {
        range.push(1);
        range.push('...');
        for (let i = effectiveCurrentPage - 2; i <= effectiveCurrentPage + 2; i++) range.push(i);
        range.push('...');
        range.push(totalPages);
      }
    }
    return range;
  }, [totalPages, effectiveCurrentPage]);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Hidden File Input for CSV */}
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* TOP HEADER - Matching the screenshot */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#001a54] tracking-tight">
            {type === 'PAGAR' ? 'Contas a Pagar' : 'Contas a Receber'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
            {type === 'PAGAR'
              ? 'Gerencie os pagamentos pendentes e o histórico financeiro.'
              : 'Gerencie os recebimentos pendentes e o histórico financeiro.'}
          </p>
        </div>

        {/* Right Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Import / Export Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsImportExportMenuOpen(!isImportExportMenuOpen)}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[17px] text-slate-600">import_export</span>
              <span>Importar/Exportar</span>
              <span className="material-symbols-outlined text-[15px] text-slate-400">arrow_drop_down</span>
            </button>

            {isImportExportMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setIsImportExportMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-[#ebf2fe] hover:text-[#001a54] flex items-center gap-2.5"
                >
                  <span className="material-symbols-outlined text-[17px] text-[#1d3b7a]">upload</span>
                  <span>Importar CSV</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-[#ebf2fe] hover:text-[#001a54] flex items-center gap-2.5"
                >
                  <span className="material-symbols-outlined text-[17px] text-[#1d3b7a]">download</span>
                  <span>Exportar CSV</span>
                </button>
              </div>
            )}
          </div>

          {/* Cadastro em lote */}
          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[17px] text-slate-600">playlist_add</span>
            <span>Cadastro em lote</span>
          </button>

          {/* + Cadastrar */}
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="bg-[#001a54] hover:bg-[#00133d] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Cadastrar</span>
          </button>
        </div>
      </div>

      {/* FILTER BAR & TOTAL ROW - Matching the screenshot */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5">
            <select
              value={filterStatus}
              onChange={e => handleFilterChange(setFilterStatus, e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-[#001a54]/20 focus:border-[#001a54] transition-all cursor-pointer"
            >
              <option value="TODOS">Status: Todos</option>
              <option value="PENDENTE">Status: Pendente</option>
              <option value={type === 'PAGAR' ? 'PAGO' : 'RECEBIDO'}>
                Status: {type === 'PAGAR' ? 'Pago' : 'Recebido'}
              </option>
              <option value="ATRASADO">Status: Atrasado</option>
            </select>
          </div>

          {/* Vencimento / Periodo Dropdown */}
          <div className="flex items-center gap-1.5">
            <select
              value={filterPeriod}
              onChange={e => handleFilterChange(setFilterPeriod, e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-[#001a54]/20 focus:border-[#001a54] transition-all cursor-pointer"
            >
              <option value="TODOS">Vencimento: Todos</option>
              <option value="MES_ATUAL">Vencimento: Mês Atual</option>
              <option value="ULTIMOS_30_DIAS">Vencimento: Últimos 30 Dias</option>
              <option value="ATRASADOS">Vencimento: Apenas Vencidos</option>
            </select>
          </div>

          {/* Centro de Custo Dropdown */}
          <div className="flex items-center gap-1.5">
            <select
              value={filterCentroCusto}
              onChange={e => handleFilterChange(setFilterCentroCusto, e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-[#001a54]/20 focus:border-[#001a54] transition-all cursor-pointer max-w-[220px] truncate"
            >
              <option value="TODOS">Centro de Custo: Todos</option>
              {availableCostCenters.map(cc => (
                <option key={cc.id} value={cc.nome}>
                  {cc.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Search box inline */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={e => handleFilterChange(setSearchTerm, e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#001a54]/20 focus:border-[#001a54] transition-all w-36 sm:w-48 placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => handleFilterChange(setSearchTerm, '')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                &times;
              </button>
            )}
          </div>

          {/* Limpar Filtros */}
          {(filterStatus !== 'TODOS' || filterPeriod !== 'TODOS' || filterCentroCusto !== 'TODOS' || searchTerm) && (
            <button
              onClick={handleClearFilters}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-all cursor-pointer"
            >
              Limpar Filtros
            </button>
          )}
        </div>

        {/* Right Metric: Total Pendente */}
        <div className="text-right flex items-center md:justify-end gap-2">
          <span className="text-xs text-slate-500 font-medium">Total Pendente:</span>
          <span className="text-sm sm:text-base font-bold text-[#001a54] tracking-tight">
            R$ {formatCurrency(totalPendente)}
          </span>
        </div>
      </div>

      {/* BULK ACTIONS BAR (When items are selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-[#ebf2fe] border border-[#dce6fd] rounded-xl px-4 py-2.5 flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs text-[#001a54] font-semibold">
            <span className="w-5 h-5 rounded-full bg-[#001a54] text-white flex items-center justify-center text-[10px] font-bold">
              {selectedIds.length}
            </span>
            <span>item(ns) selecionado(s)</span>
          </div>

          <div className="flex items-center gap-2">
            {onBulkUpdate && (
              <button
                onClick={handleBulkMarkAsPaid}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Marcar como {type === 'PAGAR' ? 'Pago' : 'Recebido'}</span>
              </button>
            )}
            <button
              onClick={handleBulkDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              <span>Excluir</span>
            </button>
          </div>
        </div>
      )}

      {/* MAIN DATA TABLE - Exactly matching the screenshot */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8faff] text-slate-500 text-xs font-semibold border-b border-slate-100 select-none">
                <th className="py-3.5 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={areAllCurrentPageSelected}
                    onChange={handleSelectAllCurrentPage}
                    className="w-4 h-4 rounded border-slate-300 text-[#001a54] focus:ring-0 cursor-pointer"
                  />
                </th>

                <th
                  onClick={() => handleSort('vencimento')}
                  className="py-3.5 px-4 cursor-pointer hover:text-[#001a54] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Vencimento</span>
                    <span className="material-symbols-outlined text-[14px]">
                      {sortField === 'vencimento' ? (sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                    </span>
                  </div>
                </th>

                <th
                  onClick={() => handleSort('descricao')}
                  className="py-3.5 px-4 cursor-pointer hover:text-[#001a54] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Descrição</span>
                    <span className="material-symbols-outlined text-[14px]">
                      {sortField === 'descricao' ? (sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                    </span>
                  </div>
                </th>

                <th
                  onClick={() => handleSort('valor')}
                  className="py-3.5 px-4 cursor-pointer hover:text-[#001a54] transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Valor</span>
                    <span className="material-symbols-outlined text-[14px]">
                      {sortField === 'valor' ? (sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                    </span>
                  </div>
                </th>

                <th className="py-3.5 px-4">Forma de Pagamento</th>
                <th className="py-3.5 px-4">Status</th>

                <th
                  onClick={() => handleSort('centroCusto')}
                  className="py-3.5 px-4 cursor-pointer hover:text-[#001a54] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Centro de Custo</span>
                    <span className="material-symbols-outlined text-[14px]">
                      {sortField === 'centroCusto' ? (sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                    </span>
                  </div>
                </th>

                <th className="py-3.5 px-4 text-center">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {displayedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[36px] text-slate-300">
                        receipt_long
                      </span>
                      <p className="text-sm font-medium text-slate-500">Nenhum lançamento encontrado</p>
                      <p className="text-xs text-slate-400">Tente ajustar os filtros ou cadastre um novo registro.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedTransactions.map(t => {
                  const isSelected = selectedIds.includes(t.id);
                  const isAtrasado = t.status === 'PENDENTE' && t.vencimento < todayStr;
                  const isPaid = t.status === 'PAGO' || t.status === 'RECEBIDO';

                  return (
                    <tr
                      key={t.id}
                      className={`transition-colors group ${
                        isSelected ? 'bg-[#f4f7fe]' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(t.id)}
                          className="w-4 h-4 rounded border-slate-300 text-[#001a54] focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Vencimento */}
                      <td className="py-3.5 px-4 font-medium whitespace-nowrap">
                        <span className={isAtrasado ? 'text-[#b42318] font-bold' : 'text-slate-700'}>
                          {formatDateBR(t.vencimento)}
                        </span>
                      </td>

                      {/* Descrição */}
                      <td className="py-3.5 px-4 font-bold text-slate-800 tracking-tight">
                        <div className="flex items-center gap-2">
                          <span className="uppercase">{t.descricao}</span>
                          {t.cliente && (
                            <a
                              href={t.cliente}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-700"
                              title="Ver anexo / comprovante"
                            >
                              <span className="material-symbols-outlined text-[14px]">link</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Valor */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(t.valor)}
                      </td>

                      {/* Forma de Pagamento */}
                      <td className="py-3.5 px-4 text-slate-500 font-medium uppercase whitespace-nowrap">
                        {t.formaPagamento || 'PIX'}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isPaid ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#d1fadf] text-[#027a48] tracking-wider uppercase">
                            {t.status}
                          </span>
                        ) : isAtrasado ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#fee4e2] text-[#b42318] tracking-wider uppercase">
                            ATRASADO
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#fef0c7] text-[#b54708] tracking-wider uppercase">
                            PENDENTE
                          </span>
                        )}
                      </td>

                      {/* Centro de Custo */}
                      <td className="py-3.5 px-4 text-slate-600 font-semibold uppercase tracking-tight whitespace-nowrap">
                        {t.centroCusto || 'SEM CENTRO DE CUSTO'}
                      </td>

                      {/* Ações: 3 round icon buttons matching print */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Toggle Paid / Check */}
                          <button
                            onClick={() => handleTogglePaid(t)}
                            title={t.status === 'PENDENTE' ? 'Marcar como Baixado' : 'Desfazer Baixa'}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                              isPaid
                                ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[17px]">
                              check_circle
                            </span>
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(t)}
                            title="Editar"
                            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:text-[#001a54] hover:bg-slate-100 transition-all"
                          >
                            <span className="material-symbols-outlined text-[17px]">edit</span>
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => {
                              if (confirm(`Excluir o lançamento "${t.descricao}"?`)) {
                                onDelete([t.id]);
                              }
                            }}
                            title="Excluir"
                            className="w-7 h-7 rounded-full flex items-center justify-center text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-all"
                          >
                            <span className="material-symbols-outlined text-[17px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER - 50 items per page limit */}
        <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs select-none">
          {/* Info text */}
          <div className="text-slate-500 font-medium">
            {totalRecords === 0
              ? 'Mostrando 0 registros'
              : `Mostrando ${startIndex + 1}-${endIndex} de ${totalRecords} registros`}
          </div>

          {/* Numbered Pagination Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {/* Previous Page Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={effectiveCurrentPage === 1}
              className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Página Anterior"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>

            {/* Page numbers */}
            {paginationRange.map((page, index) => {
              if (page === '...') {
                return (
                  <span key={`ellipsis-${index}`} className="px-1 text-slate-400">
                    ...
                  </span>
                );
              }

              const pageNum = Number(page);
              const isActive = pageNum === effectiveCurrentPage;

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'border-2 border-[#001a54] text-[#001a54] bg-[#ebf2fe]/60 font-bold'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Next Page Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={effectiveCurrentPage === totalPages || totalPages === 0}
              className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Próxima Página"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: NOVO / EDITAR LANÇAMENTO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-150 border border-slate-100">
            <div className="bg-[#001a54] p-5 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px]">
                  {editingId ? 'edit_note' : 'add_circle'}
                </span>
                <h3 className="text-base font-bold tracking-tight">
                  {editingId ? 'Editar Lançamento' : `Novo Lançamento - ${type === 'PAGAR' ? 'Contas a Pagar' : 'Contas a Receber'}`}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Data de Vencimento *
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#001a54]/20 focus:border-[#001a54] outline-none"
                    value={formData.vencimento}
                    onChange={e => setFormData({ ...formData, vencimento: e.target.value })}
                  />
                </div>

                {formData.status !== 'PENDENTE' && (
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-800 uppercase mb-1">
                      Data do Pagamento/Baixa *
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 border border-emerald-300 bg-emerald-50/50 rounded-xl text-xs text-emerald-900 font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      value={formData.pagamento || formData.vencimento}
                      onChange={e => setFormData({ ...formData, pagamento: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Descrição *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: ALUGUEL ESCRITÓRIO"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs uppercase focus:ring-2 focus:ring-[#001a54]/20 focus:border-[#001a54] outline-none"
                  value={formData.descricao}
                  onChange={e => setFormData({ ...formData, descricao: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-[#001a54] focus:ring-2 focus:ring-[#001a54]/20 focus:border-[#001a54] outline-none"
                    value={formData.valor}
                    onChange={e => setFormData({ ...formData, valor: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => {
                      const newStatus = e.target.value as Status;
                      setFormData(prev => ({
                        ...prev,
                        status: newStatus,
                        pagamento: newStatus === 'PENDENTE' ? '' : (prev.pagamento || prev.vencimento)
                      }));
                    }}
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-bold outline-none ${
                      formData.status === 'PENDENTE'
                        ? 'border-amber-300 bg-amber-50 text-amber-800'
                        : 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    }`}
                  >
                    <option value="PENDENTE">🟡 PENDENTE</option>
                    <option value={type === 'PAGAR' ? 'PAGO' : 'RECEBIDO'}>
                      🟢 {type === 'PAGAR' ? 'PAGO' : 'RECEBIDO'}
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Centro de Custo *
                  </label>
                  <select
                    required
                    value={formData.centroCusto}
                    onChange={e => setFormData({ ...formData, centroCusto: e.target.value, subItem: '' })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#001a54]/20 focus:border-[#001a54] outline-none"
                  >
                    <option value="">Selecione o centro de custo...</option>
                    {availableCostCenters.map(cc => (
                      <option key={cc.id} value={cc.nome}>
                        {cc.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Sub-item
                  </label>
                  <select
                    value={formData.subItem}
                    onChange={e => setFormData({ ...formData, subItem: e.target.value })}
                    disabled={!formData.centroCusto}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#001a54]/20 focus:border-[#001a54] outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="">Selecione o sub-item (opcional)...</option>
                    {availableSubItems.map((si, idx) => (
                      <option key={idx} value={si}>
                        {si}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Forma de Pagamento
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {['PIX', 'BOLETO', 'TED', 'CARTÃO', 'DINHEIRO', 'CHEQUE'].map(f => (
                      <button
                        type="button"
                        key={f}
                        onClick={() => setFormData({ ...formData, formaPagamento: f })}
                        className={`py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                          formData.formaPagamento === f
                            ? 'bg-[#001a54] text-white border-[#001a54]'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Conta / Banco
                  </label>
                  <select
                    value={formData.conta}
                    onChange={e => setFormData({ ...formData, conta: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#001a54]/20 focus:border-[#001a54] outline-none"
                  >
                    <option value="GERAL">GERAL / CAIXA</option>
                    <option value="INTER">BANCO INTER</option>
                    <option value="BRADESCO">BRADESCO</option>
                    <option value="CAIXA">CAIXA ECONÔMICA</option>
                    <option value="INFINIT">INFINIT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Link do Comprovante / Anexo (Opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#001a54]/20 focus:border-[#001a54] outline-none"
                  value={formData.comprovanteUrl}
                  onChange={e => setFormData({ ...formData, comprovanteUrl: e.target.value })}
                />
              </div>

              {/* Recurrence (only when creating new) */}
              {!editingId && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={isRecurring}
                      onChange={e => setIsRecurring(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#001a54] focus:ring-0 cursor-pointer"
                    />
                    <span>Lançamento Recorrente (Parcelamento Mensal)?</span>
                  </label>

                  {isRecurring && (
                    <div className="flex items-center gap-2 pt-1 animate-in fade-in">
                      <span className="text-xs text-slate-500 font-medium">Quantidade de Meses:</span>
                      <input
                        type="number"
                        min="2"
                        max="60"
                        value={recurrences}
                        onChange={e => setRecurrences(Math.max(2, parseInt(e.target.value) || 2))}
                        className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center text-[#001a54]"
                      />
                      <span className="text-[11px] text-slate-400">({recurrences} parcelas consecutivas)</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#001a54] text-white rounded-xl text-xs font-bold hover:bg-[#00133d] shadow-sm transition-all"
                >
                  {editingId ? 'Salvar Alterações' : 'Cadastrar Lançamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CADASTRO EM LOTE */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-150 border border-slate-100">
            <div className="bg-[#001a54] p-5 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px]">playlist_add</span>
                <h3 className="text-base font-bold tracking-tight">
                  Cadastro em Lote - {type === 'PAGAR' ? 'Contas a Pagar' : 'Contas a Receber'}
                </h3>
              </div>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <p className="text-xs text-slate-500">
                Preencha os campos abaixo para cadastrar múltiplos lançamentos simultaneamente:
              </p>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#f8faff] text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 w-32">Vencimento</th>
                      <th className="p-2.5">Descrição *</th>
                      <th className="p-2.5 w-28">Valor (R$) *</th>
                      <th className="p-2.5 w-32">Forma</th>
                      <th className="p-2.5 w-44">Centro de Custo</th>
                      <th className="p-2.5 w-28">Status</th>
                      <th className="p-2.5 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batchRows.map((row, idx) => (
                      <tr key={row.id}>
                        <td className="p-2">
                          <input
                            type="date"
                            value={row.vencimento}
                            onChange={e => {
                              const updated = [...batchRows];
                              updated[idx].vencimento = e.target.value;
                              setBatchRows(updated);
                            }}
                            className="w-full p-1.5 border border-slate-200 rounded-lg text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="Descrição"
                            value={row.descricao}
                            onChange={e => {
                              const updated = [...batchRows];
                              updated[idx].descricao = e.target.value.toUpperCase();
                              setBatchRows(updated);
                            }}
                            className="w-full p-1.5 border border-slate-200 rounded-lg text-xs uppercase"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            value={row.valor}
                            onChange={e => {
                              const updated = [...batchRows];
                              updated[idx].valor = e.target.value;
                              setBatchRows(updated);
                            }}
                            className="w-full p-1.5 border border-slate-200 rounded-lg text-xs font-bold text-[#001a54]"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={row.formaPagamento}
                            onChange={e => {
                              const updated = [...batchRows];
                              updated[idx].formaPagamento = e.target.value;
                              setBatchRows(updated);
                            }}
                            className="w-full p-1.5 border border-slate-200 rounded-lg text-xs"
                          >
                            {['PIX', 'BOLETO', 'TED', 'CARTÃO', 'DINHEIRO'].map(f => (
                              <option key={f} value={f}>
                                {f}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <select
                            value={row.centroCusto}
                            onChange={e => {
                              const updated = [...batchRows];
                              updated[idx].centroCusto = e.target.value;
                              setBatchRows(updated);
                            }}
                            className="w-full p-1.5 border border-slate-200 rounded-lg text-xs"
                          >
                            <option value="">Selecione...</option>
                            {availableCostCenters.map(cc => (
                              <option key={cc.id} value={cc.nome}>
                                {cc.nome}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <select
                            value={row.status}
                            onChange={e => {
                              const updated = [...batchRows];
                              updated[idx].status = e.target.value as Status;
                              setBatchRows(updated);
                            }}
                            className="w-full p-1.5 border border-slate-200 rounded-lg text-xs font-bold"
                          >
                            <option value="PENDENTE">PENDENTE</option>
                            <option value={type === 'PAGAR' ? 'PAGO' : 'RECEBIDO'}>
                              {type === 'PAGAR' ? 'PAGO' : 'RECEBIDO'}
                            </option>
                          </select>
                        </td>
                        <td className="p-2 text-center">
                          {batchRows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setBatchRows(batchRows.filter((_, i) => i !== idx));
                              }}
                              className="text-slate-400 hover:text-rose-600"
                            >
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    setBatchRows([
                      ...batchRows,
                      {
                        id: crypto.randomUUID(),
                        vencimento: todayStr,
                        descricao: '',
                        valor: '',
                        formaPagamento: 'PIX',
                        centroCusto: '',
                        subItem: '',
                        conta: 'GERAL',
                        status: 'PENDENTE'
                      }
                    ]);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-[#001a54] hover:bg-[#ebf2fe] rounded-lg transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>+ Adicionar mais linhas</span>
                </button>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveBatch}
                  className="flex-1 py-2.5 bg-[#001a54] text-white rounded-xl text-xs font-bold hover:bg-[#00133d] shadow-sm transition-all"
                >
                  Salvar Lote de Lançamentos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO DE IMPORTAÇÃO CSV */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150 border border-slate-100">
            <div className="bg-[#001a54] p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px]">cloud_upload</span>
                <h3 className="text-base font-bold tracking-tight">Confirmar Importação CSV</h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Registros Identificados</p>
                  <p className="text-2xl font-bold text-[#001a54]">{importData.length}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Valor Total</p>
                  <p className="text-2xl font-bold text-[#001a54]">
                    R$ {formatCurrency(importData.reduce((acc, i) => acc + i.valor, 0))}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/70 text-xs text-amber-800 flex gap-2">
                <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0">info</span>
                <span>
                  Todos os lançamentos do arquivo serão adicionados com seus respectivos vencimentos, descrições e centros de custo mapeados.
                </span>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmImport}
                  className="flex-1 py-2.5 bg-[#001a54] text-white rounded-xl text-xs font-bold hover:bg-[#00133d] shadow-sm transition-all"
                >
                  Confirmar e Importar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionTable;
