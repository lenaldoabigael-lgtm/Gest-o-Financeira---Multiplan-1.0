
import React, { useState } from 'react';
import { Transaction } from '../types';
import { COST_CENTERS } from '../constants';

interface DetailsProps {
  transactions: Transaction[];
}

const Details: React.FC<DetailsProps> = ({ transactions }) => {
  const [activeSubTab, setActiveSubTab] = useState<'PAGAR' | 'RECEBER'>('PAGAR');
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [formaFilter, setFormaFilter] = useState('Todos');
  const [ccFilter, setCcFilter] = useState('Todos');
  const [yearFilter, setYearFilter] = useState('2023');

  const filtered = transactions.filter(t => {
    // Basic type filter
    if (t.type !== activeSubTab) return false;
    
    // Status filter
    if (statusFilter !== 'Todos' && t.status !== statusFilter) return false;
    
    // Forma Pagamento filter
    if (formaFilter !== 'Todos' && t.formaPagamento !== formaFilter) return false;
    
    // Centro Custo filter
    if (ccFilter !== 'Todos' && t.centroCusto !== ccFilter) return false;
    
    // Year filter (vencimento is YYYY-MM-DD)
    if (yearFilter !== 'Todos' && !t.vencimento.startsWith(yearFilter)) return false;

    return true;
  });

  const exportToCSV = () => {
    if (filtered.length === 0) {
      alert('Não há dados filtrados para exportar.');
      return;
    }

    const headers = ['Data Vencimento', 'Centro de Custo', 'Sub-Item', 'Descrição', 'Forma Pagamento', 'Status', 'Valor'];
    const rows = filtered.map(t => [
      new Date(t.vencimento).toLocaleDateString('pt-BR'),
      t.centroCusto,
      t.subItem,
      t.descricao.replace(/;/g, ','), // Evitar quebra do CSV caso haja ponto e vírgula na descrição
      t.formaPagamento,
      t.status,
      t.valor.toFixed(2).replace('.', ',')
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(r => r.join(';'))
    ].join('\n');

    // BOM para garantir UTF-8 no Excel
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = `relatorio_${activeSubTab.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
       <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveSubTab('PAGAR')}
              className={`px-6 py-2 rounded text-sm font-bold transition-all ${activeSubTab === 'PAGAR' ? 'bg-blue-900 text-white shadow-lg' : 'bg-gray-100 text-gray-600'}`}
            >
              Contas a Pagar
            </button>
            <button 
              onClick={() => setActiveSubTab('RECEBER')}
              className={`px-6 py-2 rounded text-sm font-bold transition-all ${activeSubTab === 'RECEBER' ? 'bg-blue-900 text-white shadow-lg' : 'bg-gray-100 text-gray-600'}`}
            >
              Contas a Receber
            </button>
          </div>
          
          <button 
            onClick={exportToCSV}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <i className="fa-solid fa-file-csv"></i>
            Exportar CSV
          </button>
       </div>

       {/* Filters Grid */}
       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-[10px] font-bold text-blue-900 uppercase mb-1">Status</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-900 bg-white"
            >
              <option>Todos</option>
              <option value="PAGO">PAGO</option>
              <option value="RECEBIDO">RECEBIDO</option>
              <option value="PENDENTE">PENDENTE</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-blue-900 uppercase mb-1">Forma de Pag.</label>
            <select 
              value={formaFilter}
              onChange={(e) => setFormaFilter(e.target.value)}
              className="w-full text-xs p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-900 bg-white"
            >
              <option>Todos</option>
              <option>BOLETO</option>
              <option>PIX</option>
              <option>TRANSFERÊNCIA</option>
              <option>DINHEIRO</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-blue-900 uppercase mb-1">Centro de Custo</label>
            <select 
              value={ccFilter}
              onChange={(e) => setCcFilter(e.target.value)}
              className="w-full text-xs p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-900 bg-white"
            >
              <option>Todos</option>
              {COST_CENTERS.map(cc => (
                <option key={cc.id} value={cc.nome}>{cc.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-blue-900 uppercase mb-1">Ano</label>
            <select 
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full text-xs p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-900 bg-white"
            >
              <option value="Todos">Todos</option>
              <option value="2022">2022</option>
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>
       </div>

       {/* Table */}
       <div className="overflow-x-auto">
         <table className="w-full text-[11px] border-collapse">
           <thead>
             <tr className="bg-orange-500 text-white uppercase">
               <th className="p-2 text-left border-r border-orange-400">Data Venc.</th>
               <th className="p-2 text-left border-r border-orange-400">Centro de Custo</th>
               <th className="p-2 text-left border-r border-orange-400">Sub-Item</th>
               <th className="p-2 text-left border-r border-orange-400">Descrição</th>
               <th className="p-2 text-left border-r border-orange-400">Forma Pag.</th>
               <th className="p-2 text-left border-r border-orange-400">Status</th>
               <th className="p-2 text-right">Valor</th>
             </tr>
           </thead>
           <tbody>
             {filtered.map((t, idx) => (
               <tr key={t.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-orange-50 hover:bg-orange-100 transition-colors'}>
                 <td className="p-2 border-b border-gray-200 whitespace-nowrap">{new Date(t.vencimento).toLocaleDateString('pt-BR')}</td>
                 <td className="p-2 border-b border-gray-200 uppercase font-bold text-gray-700">{t.centroCusto}</td>
                 <td className="p-2 border-b border-gray-200 text-gray-500">{t.subItem}</td>
                 <td className="p-2 border-b border-gray-200 font-medium">{t.descricao}</td>
                 <td className="p-2 border-b border-gray-200">{t.formaPagamento}</td>
                 <td className="p-2 border-b border-gray-200">
                   <span className={`px-1 rounded ${t.status === 'PENDENTE' ? 'text-orange-600' : 'text-green-700'}`}>
                     {t.status}
                   </span>
                 </td>
                 <td className={`p-2 border-b border-gray-200 text-right font-bold ${activeSubTab === 'PAGAR' ? 'text-orange-600' : 'text-green-600'}`}>
                   R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                 </td>
               </tr>
             ))}
             {filtered.length === 0 && (
               <tr>
                 <td colSpan={7} className="p-10 text-center text-gray-400">Nenhum registro encontrado com os filtros selecionados.</td>
               </tr>
             )}
           </tbody>
           {filtered.length > 0 && (
             <tfoot>
               <tr className="bg-gray-100 font-bold">
                 <td colSpan={6} className="p-2 text-right uppercase">Total do Filtro:</td>
                 <td className={`p-2 text-right ${activeSubTab === 'PAGAR' ? 'text-orange-600' : 'text-green-600'}`}>
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
