
import React, { useState, useMemo } from 'react';
import { Transaction, CostCenter } from '../types';

interface DetailsProps {
  transactions: Transaction[];
  costCenters: CostCenter[];
}

const Details: React.FC<DetailsProps> = ({ transactions, costCenters }) => {
  const [activeSubTab, setActiveSubTab] = useState<'PAGAR' | 'RECEBER'>('PAGAR');
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [formaFilter, setFormaFilter] = useState('Todos');
  const [ccFilter, setCcFilter] = useState('Todos');
  const [accountFilter, setAccountFilter] = useState('Todos');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Extrair contas únicas das transações para popular o filtro
  const availableAccounts = useMemo(() => {
    const accounts = transactions.map(t => t.conta || 'GERAL');
    return Array.from(new Set(accounts)).sort();
  }, [transactions]);

  const filtered = transactions.filter(t => {
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
                {costCenters.filter(cc => cc.tipo === (activeSubTab === 'PAGAR' ? 'DESPESA' : 'RECEITA')).map(cc => (
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
               </tr>
             ))}
             {filtered.length === 0 && (
               <tr>
                 <td colSpan={8} className="p-20 text-center text-slate-300 font-black uppercase tracking-widest text-[10px]">Nenhum registro encontrado</td>
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
    </div>
  );
};

export default Details;
