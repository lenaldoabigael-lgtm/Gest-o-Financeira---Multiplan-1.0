
import React, { useState, useMemo } from 'react';
import { Transaction, CostCenter, Status } from '../types';
import { CONTAS_BANCO } from '../constants';

interface DetailsProps {
  transactions?: Transaction[];
  costCenters?: CostCenter[];
  onUpdate?: (transaction: Transaction) => void;
  onDelete?: (ids: string[]) => void;
}

const Details: React.FC<DetailsProps> = ({ transactions = [], costCenters = [], onUpdate, onDelete }) => {
  const [activeSubTab, setActiveSubTab] = useState<'PAGAR' | 'RECEBER'>('PAGAR');
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [formaFilter, setFormaFilter] = useState('Todos');
  const [ccFilter, setCcFilter] = useState('Todos');
  const [accountFilter, setAccountFilter] = useState('Todos');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editFormData, setEditFormData] = useState<{
    vencimento: string;
    pagamento: string;
    descricao: string;
    valor: string;
    formaPagamento: string;
    centroCusto: string;
    subItem: string;
    status: Status;
    conta: string;
    cliente: string;
  }>({
    vencimento: '',
    pagamento: '',
    descricao: '',
    valor: '',
    formaPagamento: 'PIX',
    centroCusto: '',
    subItem: '',
    status: 'PENDENTE',
    conta: CONTAS_BANCO[0] || 'Caixa econômica 26.200',
    cliente: ''
  });
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const safeTransactions = transactions || [];
  const safeCostCenters = costCenters || [];

  // Extrair contas únicas das transações e mesclar com as contas oficiais
  const availableAccounts = useMemo(() => {
    const accounts = safeTransactions.map(t => t.conta).filter(Boolean) as string[];
    const combined = Array.from(new Set([...CONTAS_BANCO, ...accounts])).filter(Boolean);
    return combined;
  }, [safeTransactions]);

  // Centros de custo disponíveis de acordo com a aba ativa no modal
  const availableCostCentersForEdit = useMemo(() => {
    const targetTipo = (editingTransaction?.type || activeSubTab) === 'PAGAR' ? 'DESPESA' : 'RECEITA';
    return safeCostCenters.filter(cc => cc.tipo === targetTipo);
  }, [safeCostCenters, editingTransaction?.type, activeSubTab]);

  // Sub-itens dinâmicos de acordo com o centro de custo selecionado
  const availableSubItemsForEdit = useMemo(() => {
    if (!editFormData.centroCusto) return [];
    const found = safeCostCenters.find(cc => cc.nome === editFormData.centroCusto);
    return found?.subItens || [];
  }, [safeCostCenters, editFormData.centroCusto]);

  const handleOpenEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setEditFormData({
      vencimento: t.vencimento || '',
      pagamento: t.pagamento || '',
      descricao: t.descricao || '',
      valor: t.valor !== undefined ? t.valor.toString() : '',
      formaPagamento: t.formaPagamento || 'PIX',
      centroCusto: t.centroCusto || '',
      subItem: t.subItem || '',
      status: t.status || 'PENDENTE',
      conta: t.conta || 'GERAL',
      cliente: t.cliente || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    if (!editFormData.descricao.trim()) {
      alert('Por favor, informe a descrição do lançamento.');
      return;
    }

    const parsedVal = parseFloat(editFormData.valor.toString().replace(',', '.'));
    if (isNaN(parsedVal) || parsedVal < 0) {
      alert('Por favor, informe um valor monetário válido.');
      return;
    }

    const updatedTransaction: Transaction = {
      ...editingTransaction,
      vencimento: editFormData.vencimento,
      pagamento: editFormData.status !== 'PENDENTE' ? (editFormData.pagamento || editFormData.vencimento) : undefined,
      descricao: editFormData.descricao.trim().toUpperCase(),
      valor: parsedVal,
      formaPagamento: editFormData.formaPagamento,
      centroCusto: editFormData.centroCusto || 'OUTROS',
      subItem: editFormData.subItem || '',
      status: editFormData.status,
      conta: editFormData.conta || 'GERAL',
      cliente: editFormData.cliente || ''
    };

    if (onUpdate) {
      onUpdate(updatedTransaction);
    }

    setIsEditModalOpen(false);
    setFeedbackMsg({
      type: 'success',
      message: `Lançamento "${updatedTransaction.descricao}" atualizado com sucesso!`
    });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const filtered = safeTransactions.filter(t => {
    if (t.type !== activeSubTab) return false;
    if (statusFilter !== 'Todos' && t.status !== statusFilter) return false;
    if (formaFilter !== 'Todos' && t.formaPagamento !== formaFilter) return false;
    if (ccFilter !== 'Todos' && t.centroCusto !== ccFilter) return false;
    if (accountFilter !== 'Todos' && (t.conta || 'GERAL') !== accountFilter) return false;
    if (yearFilter !== 'Todos' && !t.vencimento.startsWith(yearFilter)) return false;
    
    // Date Range Filter
    if (startDate && t.vencimento < startDate) return false;
    if (endDate && t.vencimento > endDate) return false;
    
    return true;
  });

  const applyPreset = (preset: 'month' | 'lastMonth' | 'year' | 'lastYear') => {
    const now = new Date();
    let start = '';
    let end = '';

    const formatDate = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    if (preset === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      start = formatDate(firstDay);
      end = formatDate(lastDay);
    } else if (preset === 'lastMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      start = formatDate(firstDay);
      end = formatDate(lastDay);
    } else if (preset === 'year') {
      start = `${now.getFullYear()}-01-01`;
      end = `${now.getFullYear()}-12-31`;
    } else if (preset === 'lastYear') {
      start = `${now.getFullYear() - 1}-01-01`;
      end = `${now.getFullYear() - 1}-12-31`;
    }

    setStartDate(start);
    setEndDate(end);
    setYearFilter('Todos'); // Desativa o filtro de ano fixo para priorizar o range
  };

  const exportToCSV = () => {
    if (filtered.length === 0) {
      alert('Não há dados filtrados para exportar.');
      return;
    }
    const headers = ['Data Vencimento', 'Conta', 'Centro de Custo', 'Sub-Item', 'Descrição', 'Forma Pagamento', 'Status', 'Valor'];
    const csvContent = [
      headers.join(';'),
      ...filtered.map(t => [
        new Date(t.vencimento).toLocaleDateString('pt-BR'),
        t.conta || 'GERAL',
        t.centroCusto,
        t.subItem,
        t.descricao.replace(/;/g, ','),
        t.formaPagamento,
        t.status,
        t.valor.toFixed(2).replace('.', ',')
      ].join(';'))
    ].join('\n');

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_${activeSubTab.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const clearDateRange = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
       <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
            <button 
              onClick={() => setActiveSubTab('PAGAR')}
              className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'PAGAR' ? 'bg-blue-900 text-white shadow-lg' : 'text-slate-500 hover:text-blue-900'}`}
            >
              Contas a Pagar
            </button>
            <button 
              onClick={() => setActiveSubTab('RECEBER')}
              className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'RECEBER' ? 'bg-blue-900 text-white shadow-lg' : 'text-slate-500 hover:text-blue-900'}`}
            >
              Contas a Receber
            </button>
          </div>
          
          <button 
            onClick={exportToCSV}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
          >
            <i className="fa-solid fa-file-csv"></i> Exportar para Excel
          </button>
       </div>

       <div className="space-y-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Atalhos:</span>
            {[
              { label: 'Este Mês', preset: 'month' as const },
              { label: 'Mês Passado', preset: 'lastMonth' as const },
              { label: 'Este Ano', preset: 'year' as const },
              { label: 'Ano Passado', preset: 'lastYear' as const }
            ].map(item => (
              <button 
                key={item.preset}
                onClick={() => applyPreset(item.preset)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-blue-900 uppercase tracking-widest hover:border-blue-900 transition-all hover:bg-blue-50 active:scale-95 shadow-sm"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            <div>
              <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1.5">Data Início</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                className="w-full text-xs font-bold p-3 border border-slate-200 rounded-xl bg-white outline-none focus:ring-4 focus:ring-blue-900/5 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1.5">Data Fim</label>
              <div className="relative">
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)} 
                  className="w-full text-xs font-bold p-3 border border-slate-200 rounded-xl bg-white outline-none focus:ring-4 focus:ring-blue-900/5 transition-all"
                />
                {(startDate || endDate) && (
                  <button 
                    onClick={clearDateRange}
                    className="absolute -right-2 -top-2 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] hover:bg-red-600 transition-colors shadow-sm"
                    title="Limpar Datas"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1.5">Filtrar Status</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full text-xs font-bold p-3 border border-slate-200 rounded-xl bg-white outline-none focus:ring-4 focus:ring-blue-900/5 transition-all">
                <option>Todos</option>
                <option value="PAGO">PAGO / RECEBIDO</option>
                <option value="PENDENTE">PENDENTE</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1.5">Conta / Banco</label>
              <select value={accountFilter} onChange={e => setAccountFilter(e.target.value)} className="w-full text-xs font-bold p-3 border border-slate-200 rounded-xl bg-white outline-none focus:ring-4 focus:ring-blue-900/5 transition-all">
                <option value="Todos">Todas as Contas</option>
                {availableAccounts.map(acc => (
                  <option key={acc} value={acc}>{acc}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1.5">Forma Pag.</label>
              <select value={formaFilter} onChange={e => setFormaFilter(e.target.value)} className="w-full text-xs font-bold p-3 border border-slate-200 rounded-xl bg-white outline-none focus:ring-4 focus:ring-blue-900/5 transition-all">
                <option>Todos</option>
                <option>BOLETO</option>
                <option>PIX</option>
                <option>TRANSFERÊNCIA</option>
                <option>DINHEIRO</option>
                <option>CARTÃO</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1.5">Centro de Custo</label>
              <select value={ccFilter} onChange={e => setCcFilter(e.target.value)} className="w-full text-xs font-bold p-3 border border-slate-200 rounded-xl bg-white outline-none focus:ring-4 focus:ring-blue-900/5 transition-all">
                <option>Todos</option>
                {safeCostCenters.filter(cc => cc.tipo === (activeSubTab === 'PAGAR' ? 'DESPESA' : 'RECEITA')).map(cc => (
                  <option key={cc.id} value={cc.nome}>{cc.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1.5">Ano</label>
              <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} className="w-full text-xs font-bold p-3 border border-slate-200 rounded-xl bg-white outline-none focus:ring-4 focus:ring-blue-900/5 transition-all">
                <option value="Todos">Todos</option>
                <option value="2023">2023</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
              </select>
            </div>
          </div>
       </div>

       {feedbackMsg && (
         <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300 ${
           feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
         }`}>
           <div className="flex items-center gap-2">
             <i className={`fa-solid ${feedbackMsg.type === 'success' ? 'fa-circle-check text-emerald-600' : 'fa-triangle-exclamation text-red-600'} text-base`}></i>
             <span>{feedbackMsg.message}</span>
           </div>
           <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-600">
             <i className="fa-solid fa-xmark"></i>
           </button>
         </div>
       )}

       <div className="overflow-x-auto rounded-xl border border-slate-100">
         <table className="w-full text-[10px] border-collapse">
           <thead>
             <tr className="bg-slate-900 text-white uppercase tracking-widest font-black">
               <th className="p-4 text-left">Data Venc.</th>
               <th className="p-4 text-left">Conta</th>
               <th className="p-4 text-left">Centro de Custo</th>
               <th className="p-4 text-left">Sub-Item</th>
               <th className="p-4 text-left">Descrição</th>
               <th className="p-4 text-left">Forma</th>
               <th className="p-4 text-left">Status</th>
               <th className="p-4 text-right">Valor</th>
               <th className="p-4 text-center">Ações</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
             {filtered.map((t, idx) => (
               <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                 <td className="p-4 font-bold text-slate-500 whitespace-nowrap">{new Date(t.vencimento).toLocaleDateString('pt-BR')}</td>
                 <td className="p-4">
                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black text-[9px] uppercase">{t.conta || 'GERAL'}</span>
                 </td>
                 <td className="p-4 uppercase font-black text-blue-900">{t.centroCusto}</td>
                 <td className="p-4 text-slate-400 font-bold uppercase">{t.subItem}</td>
                 <td className="p-4 font-medium text-slate-600 max-w-xs truncate">{t.descricao}</td>
                 <td className="p-4 font-bold text-slate-500">{t.formaPagamento}</td>
                 <td className="p-4">
                   <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${t.status === 'PENDENTE' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                     {t.status}
                   </span>
                 </td>
                 <td className={`p-4 text-right font-black text-sm ${activeSubTab === 'PAGAR' ? 'text-orange-500' : 'text-emerald-600'}`}>
                   R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                 </td>
                 <td className="p-4 text-center whitespace-nowrap">
                   <div className="flex items-center justify-center gap-1.5">
                     {/* Botão de Edição das Contas a Pagar e a Receber */}
                     <button
                       type="button"
                       onClick={() => handleOpenEdit(t)}
                       className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#001a54] font-black text-[10px] uppercase tracking-wider transition-all hover:scale-105 active:scale-95 cursor-pointer border border-blue-200/70 shadow-xs"
                       title={activeSubTab === 'PAGAR' ? 'Editar Conta a Pagar' : 'Editar Conta a Receber'}
                     >
                       <i className="fa-solid fa-pen-to-square text-[11px] text-[#001a54]"></i>
                       <span>Editar</span>
                     </button>

                     {/* Botão de Baixa / Desfazer Baixa */}
                     {onUpdate && (
                       <button onClick={() => {
                         if (t.status === 'PENDENTE') {
                           onUpdate({
                             ...t,
                             status: activeSubTab === 'PAGAR' ? 'PAGO' : 'RECEBIDO',
                             pagamento: new Date().toISOString().split('T')[0]
                           });
                         } else {
                           onUpdate({
                             ...t,
                             status: 'PENDENTE',
                             pagamento: undefined
                           });
                         }
                       }} className={`p-2 rounded-xl transition-all hover:scale-110 active:scale-95 cursor-pointer ${
                         t.status === 'PENDENTE' 
                           ? 'text-emerald-600 hover:bg-emerald-50' 
                           : 'text-amber-600 hover:bg-amber-50'
                       }`} title={t.status === 'PENDENTE' ? (activeSubTab === 'PAGAR' ? 'Marcar como Pago' : 'Marcar como Recebido') : 'Desfazer Baixa'}>
                         <i className={`fa-solid ${t.status === 'PENDENTE' ? 'fa-check-circle' : 'fa-arrow-rotate-left'} text-xs`}></i>
                       </button>
                     )}
                   </div>
                 </td>
               </tr>
             ))}
             {filtered.length === 0 && (
               <tr>
                 <td colSpan={9} className="p-20 text-center text-slate-300 font-black uppercase tracking-widest text-[10px]">Nenhum registro encontrado</td>
               </tr>
             )}
           </tbody>
           {filtered.length > 0 && (
             <tfoot>
               <tr className="bg-slate-50 font-black text-slate-900">
                 <td colSpan={7} className="p-4 text-right uppercase tracking-widest">Total dos Filtros:</td>
                 <td className={`p-4 text-right text-lg ${activeSubTab === 'PAGAR' ? 'text-orange-500' : 'text-emerald-600'}`}>
                    R$ {filtered.reduce((sum, t) => sum + t.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                 </td>
               </tr>
             </tfoot>
           )}
         </table>
       </div>

       {/* MODAL DE EDIÇÃO DE LANÇAMENTO */}
       {isEditModalOpen && editingTransaction && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
             <div className="bg-[#001a54] p-5 flex justify-between items-center text-white">
               <div className="flex items-center gap-2.5">
                 <span className="material-symbols-outlined text-xl">edit_note</span>
                 <h3 className="text-base font-extrabold tracking-tight">
                   Editar Lançamento — {editingTransaction.type === 'PAGAR' ? 'Contas a Pagar' : 'Contas a Receber'}
                 </h3>
               </div>
               <button
                 type="button"
                 onClick={() => setIsEditModalOpen(false)}
                 className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
               >
                 <span className="material-symbols-outlined text-lg">close</span>
               </button>
             </div>

             <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 <div>
                   <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                     Data de Vencimento *
                   </label>
                   <input
                     type="date"
                     required
                     value={editFormData.vencimento}
                     onChange={e => setEditFormData({ ...editFormData, vencimento: e.target.value })}
                     className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#001a54]/20 focus:border-[#001a54] outline-none"
                   />
                 </div>

                 {editFormData.status !== 'PENDENTE' && (
                   <div>
                     <label className="block text-[11px] font-bold text-emerald-800 uppercase mb-1">
                       Data do Pagamento/Baixa *
                     </label>
                     <input
                       type="date"
                       required
                       value={editFormData.pagamento || editFormData.vencimento}
                       onChange={e => setEditFormData({ ...editFormData, pagamento: e.target.value })}
                       className="w-full px-3 py-2 border border-emerald-300 bg-emerald-50/50 rounded-xl text-xs text-emerald-900 font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
                     />
                   </div>
                 )}
               </div>

               <div>
                 <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                   Descrição do Lançamento *
                 </label>
                 <input
                   type="text"
                   required
                   placeholder="Ex: PAGAMENTO COMISSÃO / ALUGUEL"
                   value={editFormData.descricao}
                   onChange={e => setEditFormData({ ...editFormData, descricao: e.target.value.toUpperCase() })}
                   className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs uppercase font-bold focus:ring-2 focus:ring-[#001a54]/20 focus:border-[#001a54] outline-none"
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
                     value={editFormData.valor}
                     onChange={e => setEditFormData({ ...editFormData, valor: e.target.value })}
                     className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-extrabold text-[#001a54] focus:ring-2 focus:ring-[#001a54]/20 focus:border-[#001a54] outline-none"
                   />
                 </div>

                 <div>
                   <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                     Status da Conta
                   </label>
                   <select
                     value={editFormData.status}
                     onChange={e => {
                       const newStatus = e.target.value as Status;
                       setEditFormData(prev => ({
                         ...prev,
                         status: newStatus,
                         pagamento: newStatus === 'PENDENTE' ? '' : (prev.pagamento || prev.vencimento)
                       }));
                     }}
                     className={`w-full px-3 py-2 border rounded-xl text-xs font-bold outline-none cursor-pointer ${
                       editFormData.status === 'PENDENTE'
                         ? 'border-amber-300 bg-amber-50 text-amber-800'
                         : 'border-emerald-300 bg-emerald-50 text-emerald-800'
                     }`}
                   >
                     <option value="PENDENTE">🟡 PENDENTE</option>
                     <option value={editingTransaction.type === 'PAGAR' ? 'PAGO' : 'RECEBIDO'}>
                       🟢 {editingTransaction.type === 'PAGAR' ? 'PAGO' : 'RECEBIDO'}
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
                     value={editFormData.centroCusto}
                     onChange={e => setEditFormData({ ...editFormData, centroCusto: e.target.value, subItem: '' })}
                     className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#001a54]/20 focus:border-[#001a54] outline-none cursor-pointer"
                   >
                     <option value="">Selecione o centro de custo...</option>
                     {availableCostCentersForEdit.map(cc => (
                       <option key={cc.id} value={cc.nome}>
                         {cc.nome}
                       </option>
                     ))}
                   </select>
                 </div>

                 <div>
                   <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                     Sub-Item
                   </label>
                   {availableSubItemsForEdit.length > 0 ? (
                     <select
                       value={editFormData.subItem}
                       onChange={e => setEditFormData({ ...editFormData, subItem: e.target.value })}
                       className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#001a54]/20 focus:border-[#001a54] outline-none cursor-pointer"
                     >
                       <option value="">Selecione o sub-item (opcional)...</option>
                       {availableSubItemsForEdit.map((si, idx) => (
                         <option key={idx} value={si}>{si}</option>
                       ))}
                     </select>
                   ) : (
                     <input
                       type="text"
                       placeholder="Ex: CORRETORES / DESPESAS"
                       value={editFormData.subItem}
                       onChange={e => setEditFormData({ ...editFormData, subItem: e.target.value.toUpperCase() })}
                       className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs uppercase focus:ring-2 focus:ring-[#001a54]/20 focus:border-[#001a54] outline-none"
                     />
                   )}
                 </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 <div>
                   <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                     Forma de Pagamento
                   </label>
                   <select
                     value={editFormData.formaPagamento}
                     onChange={e => setEditFormData({ ...editFormData, formaPagamento: e.target.value })}
                     className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-[#001a54]/20 focus:border-[#001a54] outline-none cursor-pointer"
                   >
                     {['PIX', 'BOLETO', 'TRANSFERÊNCIA', 'TED', 'CARTÃO', 'DINHEIRO', 'CHEQUE'].map(f => (
                       <option key={f} value={f}>{f}</option>
                     ))}
                   </select>
                 </div>

                 <div>
                   <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                     Conta / Banco
                   </label>
                   <select
                     value={editFormData.conta}
                     onChange={e => setEditFormData({ ...editFormData, conta: e.target.value })}
                     className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-[#001a54]/20 focus:border-[#001a54] outline-none cursor-pointer"
                   >
                     {availableAccounts.map(acc => (
                       <option key={acc} value={acc}>{acc}</option>
                     ))}
                   </select>
                 </div>
               </div>

               <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                 <button
                   type="button"
                   onClick={() => setIsEditModalOpen(false)}
                   className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                 >
                   Cancelar
                 </button>
                 <button
                   type="submit"
                   className="px-5 py-2.5 rounded-xl bg-[#001a54] hover:bg-[#001138] text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-950/20 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                 >
                   <i className="fa-solid fa-check"></i>
                   Salvar Alterações
                 </button>
               </div>
             </form>
           </div>
         </div>
       )}
    </div>
  );
};

export default Details;
