
import React, { useState, useMemo, useRef } from 'react';
import { Transaction, TransactionType, Status, CostCenter } from '../types';

interface TransactionTableProps {
  type: TransactionType;
  transactions: Transaction[];
  costCenters: CostCenter[];
  onAdd: (transaction: Transaction) => void;
  onBulkAdd?: (transactions: Transaction[]) => Promise<void>;
  onUpdate: (transaction: Transaction) => void;
  onDelete: (ids: string[]) => void;
}

type SortField = 'vencimento' | 'valor';
type SortOrder = 'asc' | 'desc';

const TransactionTable: React.FC<TransactionTableProps> = ({ type, transactions, costCenters, onAdd, onBulkAdd, onUpdate, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<Transaction[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [sortField, setSortField] = useState<SortField>('vencimento');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  const [formData, setFormData] = useState({
    vencimento: new Date().toISOString().split('T')[0],
    pagamento: '',
    descricao: '',
    valor: '',
    formaPagamento: 'PIX',
    centroCusto: '',
    subItem: '',
    status: 'PENDENTE' as Status,
    conta: 'GERAL'
  });

  const availableCostCenters = costCenters.filter(cc => cc.tipo === (type === 'RECEBER' ? 'RECEITA' : 'DESPESA'));
  const availableSubItems = availableCostCenters.find(cc => cc.nome === formData.centroCusto)?.subItens || [];

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedAndFiltered = useMemo(() => {
    const search = searchTerm.toLowerCase();
    let result = transactions.filter(t => {
      return (
        t.descricao.toLowerCase().includes(search) ||
        t.centroCusto.toLowerCase().includes(search) ||
        (t.conta || '').toLowerCase().includes(search)
      );
    });

    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'vencimento') {
        comparison = a.vencimento.localeCompare(b.vencimento);
      } else if (sortField === 'valor') {
        comparison = a.valor - b.valor;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [transactions, searchTerm, sortField, sortOrder]);

  const handleStatusChange = (newStatus: Status) => {
    setFormData(prev => ({
      ...prev,
      status: newStatus,
      pagamento: newStatus === 'PENDENTE' ? '' : (prev.pagamento || prev.vencimento)
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const transactionData: Transaction = {
      id: editingId || crypto.randomUUID(),
      type: type,
      vencimento: formData.vencimento,
      pagamento: formData.status !== 'PENDENTE' ? (formData.pagamento || formData.vencimento) : undefined,
      descricao: formData.descricao,
      valor: parseFloat(formData.valor),
      formaPagamento: formData.formaPagamento,
      status: formData.status,
      centroCusto: formData.centroCusto,
      subItem: formData.subItem,
      conta: formData.conta
    };

    if (editingId) onUpdate(transactionData);
    else onAdd(transactionData);

    setIsModalOpen(false);
    resetForm();
  };

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
      conta: 'GERAL'
    });
    setEditingId(null);
  };

  // Helper para verificar alertas de vencimento
  const getVencimentoAlert = (vencimento: string, status: Status) => {
    if (type !== 'PAGAR' || status !== 'PENDENTE') return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(vencimento);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        type: 'overdue',
        icon: 'fa-circle-exclamation',
        color: 'text-red-500',
        label: 'Vencida!'
      };
    } else if (diffDays <= 10) {
      return {
        type: 'soon',
        icon: 'fa-triangle-exclamation',
        color: 'text-orange-500',
        label: `Vence em ${diffDays} dias`
      };
    }
    return null;
  };

  // Lógica de Importação CSV
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/);
      const headers = lines[0].toLowerCase().split(/[;,]/);
      
      const parsed: Transaction[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const cols = lines[i].split(/[;,]/);
        if (cols.length < 5) continue;

        const getCol = (possibleHeaders: string[]) => {
            const idx = headers.findIndex(h => possibleHeaders.some(p => h.includes(p)));
            return idx !== -1 ? cols[idx]?.trim() : '';
        };

        const vencRaw = getCol(['venc', 'data']);
        const desc = getCol(['desc']);
        const valorRaw = getCol(['valor', 'quant']);
        const statusRaw = getCol(['stat']);
        const forma = getCol(['forma', 'pag', 'mov']);
        const centro = getCol(['centro', 'categ', 'estru']);
        const sub = getCol(['sub', 'item']);
        const conta = getCol(['conta', 'banc']);

        let venc = vencRaw;
        if (vencRaw.includes('/')) {
            const [d, m, y] = vencRaw.split('/');
            venc = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }

        const valor = parseFloat(valorRaw.replace(/\./g, '').replace(',', '.'));
        const status: Status = statusRaw.toUpperCase().includes('PAGO') || statusRaw.toUpperCase().includes('RECEB') ? (type === 'PAGAR' ? 'PAGO' : 'RECEBIDO') : 'PENDENTE';

        parsed.push({
            id: crypto.randomUUID(),
            type,
            vencimento: venc || new Date().toISOString().split('T')[0],
            descricao: (desc || 'IMPORTADO CSV').toUpperCase(),
            valor: isNaN(valor) ? 0 : valor,
            status,
            formaPagamento: (forma || 'PIX').toUpperCase(),
            centroCusto: (centro || 'OUTROS').toUpperCase(),
            subItem: (sub || '').toUpperCase(),
            conta: (conta || 'GERAL').toUpperCase()
        });
      }
      
      setImportData(parsed);
      setIsImportModalOpen(true);
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

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <i className="fa-solid fa-sort ml-1 opacity-20"></i>;
    return sortOrder === 'asc' 
      ? <i className="fa-solid fa-sort-up ml-1 text-blue-900"></i> 
      : <i className="fa-solid fa-sort-down ml-1 text-blue-900"></i>;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <h2 className="text-xl font-black text-blue-900 uppercase tracking-tighter">
          {type === 'PAGAR' ? 'Contas a Pagar' : 'Contas a Receber'}
        </h2>
        <div className="flex items-center gap-2">
           <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
           <button onClick={() => fileInputRef.current?.click()} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20">
             <i className="fa-solid fa-file-import"></i> Importar CSV
           </button>
           <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-blue-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20">
             <i className="fa-solid fa-plus"></i> Novo Registro
           </button>
           <button onClick={() => onDelete(selectedIds)} disabled={selectedIds.length === 0} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${selectedIds.length > 0 ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
             <i className="fa-solid fa-trash-can"></i> {selectedIds.length > 0 ? `Excluir (${selectedIds.length})` : 'Excluir'}
           </button>
        </div>
      </div>

      <div className="p-4 bg-white border-b border-slate-50">
        <div className="relative group">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-900 transition-colors"></i>
          <input 
            type="text" 
            placeholder="Pesquisar por descrição, conta, categoria..." 
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-900/5 focus:border-blue-900 outline-none text-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
              <th className="p-5 w-12 text-center">
                <input type="checkbox" onChange={(e) => e.target.checked ? setSelectedIds(sortedAndFiltered.map(t => t.id)) : setSelectedIds([])} />
              </th>
              <th className="p-5 cursor-pointer hover:text-blue-900 transition-colors" onClick={() => handleSort('vencimento')}>
                Vencimento <SortIcon field="vencimento" />
              </th>
              <th className="p-5">Descrição / Conta</th>
              <th className="p-5 text-right cursor-pointer hover:text-blue-900 transition-colors" onClick={() => handleSort('valor')}>
                Valor <SortIcon field="valor" />
              </th>
              <th className="p-5">Categoria</th>
              <th className="p-5">Status / Pagamento</th>
              <th className="p-5 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100">
            {sortedAndFiltered.map((t) => {
              const alert = getVencimentoAlert(t.vencimento, t.status);
              return (
                <tr key={t.id} className={`${selectedIds.includes(t.id) ? 'bg-blue-50/50' : 'hover:bg-slate-50/30'} transition-colors group`}>
                  <td className="p-5 text-center">
                     <input type="checkbox" checked={selectedIds.includes(t.id)} onChange={() => setSelectedIds(prev => prev.includes(t.id) ? prev.filter(i => i !== t.id) : [...prev, t.id])} />
                  </td>
                  <td className="p-5 font-bold text-slate-600">
                    <div className="flex items-center gap-2">
                      {alert && (
                        <div className={`relative group/alert`} title={alert.label}>
                          <i className={`fa-solid ${alert.icon} ${alert.color} text-base animate-pulse`}></i>
                          <span className="absolute left-full ml-2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover/alert:opacity-100 transition-opacity whitespace-nowrap z-20">
                            {alert.label}
                          </span>
                        </div>
                      )}
                      <span className={alert?.type === 'overdue' ? 'text-red-600' : ''}>
                        {new Date(t.vencimento).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="font-black text-blue-900 uppercase tracking-tight leading-none mb-1">{t.descricao}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded font-black text-slate-500 uppercase">{t.conta || 'GERAL'}</span>
                      <span className="text-[9px] text-slate-400 uppercase font-bold">{t.formaPagamento}</span>
                    </div>
                  </td>
                  <td className={`p-5 text-right font-black text-lg ${type === 'PAGAR' ? 'text-red-500' : 'text-emerald-600'}`}>
                     R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-5">
                    <div className="text-[10px] uppercase font-black text-slate-400 leading-none">{t.centroCusto}</div>
                    <div className="text-[9px] font-bold text-slate-300 uppercase">{t.subItem}</div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col gap-1">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-block w-fit ${
                        String(t.status) === 'PENDENTE' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {t.status}
                      </span>
                      {t.pagamento && (
                        <span className="text-[9px] text-slate-400 font-bold italic">
                          Baixa: {new Date(t.pagamento).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-5 text-center">
                    <button onClick={() => {
                      setEditingId(t.id);
                      setFormData({
                        vencimento: t.vencimento, pagamento: t.pagamento || '', descricao: t.descricao,
                        valor: t.valor.toString(), formaPagamento: t.formaPagamento, centroCusto: t.centroCusto,
                        subItem: t.subItem, status: t.status, conta: t.conta || 'GERAL'
                      });
                      setIsModalOpen(true);
                    }} className="text-blue-900 hover:bg-blue-50 p-3 rounded-xl transition-all"><i className="fa-solid fa-pen-to-square"></i></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de Confirmação de Importação */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-blue-900/80 backdrop-blur-lg z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in fade-in duration-300">
            <div className="bg-emerald-600 p-6 text-white text-center">
                <i className="fa-solid fa-cloud-arrow-up text-4xl mb-4"></i>
                <h3 className="text-2xl font-black uppercase tracking-tighter">Confirmar Importação</h3>
                <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mt-1">Verifique os dados antes de processar</p>
            </div>
            <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Registros</p>
                        <p className="text-2xl font-black text-blue-900">{importData.length}</p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Total</p>
                        <p className={`text-2xl font-black ${type === 'PAGAR' ? 'text-red-500' : 'text-emerald-600'}`}>
                            R$ {importData.reduce((acc, i) => acc + i.valor, 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </p>
                    </div>
                </div>

                <div className="bg-amber-50 border-2 border-amber-100 p-4 rounded-xl flex gap-3">
                    <i className="fa-solid fa-triangle-exclamation text-amber-500 text-xl"></i>
                    <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase">
                        Certifique-se de que o CSV possui ponto e vírgula (;) como separador e as colunas de Vencimento e Valor estão no formato correto.
                    </p>
                </div>

                <div className="flex gap-4">
                    <button onClick={() => setIsImportModalOpen(false)} className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-500 font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
                    <button onClick={confirmImport} className="flex-1 py-4 rounded-2xl bg-emerald-600 text-white font-black uppercase text-xs tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-600/30 transition-all">Confirmar e Salvar</button>
                </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-blue-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-white/20">
            <div className="bg-blue-900 p-6 flex justify-between items-center text-white">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter">
                  {editingId ? 'Editar Lançamento' : 'Novo Lançamento'}
                </h3>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{type === 'PAGAR' ? 'Contas a Pagar' : 'Contas a Receber'}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="bg-white/10 w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all font-bold text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto max-h-[85vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Data Vencimento</label>
                  <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-900/5 transition-all text-slate-700 font-medium" value={formData.vencimento} onChange={e => setFormData({...formData, vencimento: e.target.value})} required />
                </div>
                {formData.status !== 'PENDENTE' && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1.5">Data do Pagamento / Recebimento</label>
                    <input type="date" className="w-full p-3 bg-emerald-50 border border-emerald-200 rounded-xl outline-none focus:ring-4 focus:ring-emerald-900/5 transition-all text-emerald-700 font-bold" value={formData.pagamento} onChange={e => setFormData({...formData, pagamento: e.target.value})} required />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Descrição do Lançamento</label>
                <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-900/5 uppercase font-medium text-slate-700" placeholder="Ex: PAGAMENTO FORNECEDOR X" value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value.toUpperCase()})} required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Valor (R$)</label>
                   <input type="number" step="0.01" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-black text-lg text-blue-900" placeholder="0,00" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} required />
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Status do Pagamento</label>
                   <select className={`w-full p-3 border rounded-xl outline-none font-black text-xs transition-colors ${formData.status === 'PENDENTE' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`} value={formData.status} onChange={e => handleStatusChange(e.target.value as Status)}>
                     <option value="PENDENTE">🟡 PENDENTE</option>
                     {type === 'PAGAR' ? <option value="PAGO">🟢 PAGO</option> : <option value="RECEBIDO">🟢 RECEBIDO</option>}
                   </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Conta / Banco</label>
                  <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-900/5 transition-all font-bold text-slate-700" value={formData.conta} onChange={e => setFormData({...formData, conta: e.target.value})}>
                    <option value="CAIXA">CAIXA</option>
                    <option value="INTER">INTER</option>
                    <option value="BRADESCO">BRADESCO</option>
                    <option value="GERAL">GERAL / DINHEIRO</option>
                  </select>
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Centro de Custo (Estrutura)</label>
                   <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm text-slate-700 font-bold" value={formData.centroCusto} onChange={e => setFormData({...formData, centroCusto: e.target.value, subItem: ''})} required>
                     <option value="">Selecione...</option>
                     {availableCostCenters.map(cc => <option key={cc.id} value={cc.nome}>{cc.nome}</option>)}
                   </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Sub-item</label>
                   <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm text-slate-700 font-bold disabled:opacity-50" value={formData.subItem} onChange={e => setFormData({...formData, subItem: e.target.value})} required disabled={!formData.centroCusto}>
                     <option value="">Selecione...</option>
                     {availableSubItems.map(si => <option key={si} value={si}>{si}</option>)}
                   </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Forma de Movimentação</label>
                  <div className="grid grid-cols-3 gap-1">
                    {['PIX', 'BOLETO', 'DINHEIRO', 'CARTÃO', 'TED'].map(forma => (
                      <button type="button" key={forma} onClick={() => setFormData({...formData, formaPagamento: forma})} className={`py-2 rounded-lg text-[9px] font-black transition-all border ${formData.formaPagamento === forma ? 'bg-blue-900 text-white border-blue-900 shadow-md' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                        {forma}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-4 bg-slate-100 rounded-2xl font-black text-slate-500 hover:bg-slate-200 transition-all uppercase text-[10px] tracking-widest">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-4 bg-blue-900 text-white rounded-2xl font-black hover:bg-blue-800 shadow-xl shadow-blue-900/30 transition-all uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                  <i className="fa-solid fa-check"></i> Finalizar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionTable;
