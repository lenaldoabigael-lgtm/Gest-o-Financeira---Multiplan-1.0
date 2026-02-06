
import React, { useMemo, useState } from 'react';
import { Transaction } from '../types';

interface CashFlowProps {
  transactions: Transaction[];
}

interface RowData {
  label: string;
  type: 'IN' | 'OUT';
  isSubItem: boolean;
  parentLabel?: string;
  values: number[];
}

const CashFlow: React.FC<CashFlowProps> = ({ transactions }) => {
  const [showSubItems, setShowSubItems] = useState(false);
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  const data = useMemo(() => {
    const incomeCategories = Array.from(new Set<string>(transactions.filter(t => t.type === 'RECEBER').map(t => t.centroCusto))).sort();
    const expenseCategories = Array.from(new Set<string>(transactions.filter(t => t.type === 'PAGAR').map(t => t.centroCusto))).sort();

    const getValues = (filterFn: (t: Transaction) => boolean) => {
      const values = new Array(12).fill(0);
      transactions.filter(filterFn).forEach(t => {
        const month = new Date(t.vencimento).getMonth();
        values[month] += t.valor;
      });
      return values;
    };

    const incomeRows: RowData[] = [];
    incomeCategories.forEach(cat => {
      // Row for Main Category
      incomeRows.push({
        label: cat,
        type: 'IN',
        isSubItem: false,
        values: getValues(t => t.type === 'RECEBER' && t.centroCusto === cat)
      });

      // Rows for Sub-items
      if (showSubItems) {
        // Fix: Explicitly type Set as string to avoid 'unknown' being assigned to label: string
        const subItems = Array.from(new Set<string>(transactions.filter(t => t.type === 'RECEBER' && t.centroCusto === cat).map(t => t.subItem))).sort();
        subItems.forEach(sub => {
          incomeRows.push({
            label: sub,
            type: 'IN',
            isSubItem: true,
            parentLabel: cat,
            values: getValues(t => t.type === 'RECEBER' && t.centroCusto === cat && t.subItem === sub)
          });
        });
      }
    });

    const expenseRows: RowData[] = [];
    expenseCategories.forEach(cat => {
      // Row for Main Category
      expenseRows.push({
        label: cat,
        type: 'OUT',
        isSubItem: false,
        values: getValues(t => t.type === 'PAGAR' && t.centroCusto === cat)
      });

      // Rows for Sub-items
      if (showSubItems) {
        // Fix: Explicitly type Set as string to avoid 'unknown' being assigned to label: string
        const subItems = Array.from(new Set<string>(transactions.filter(t => t.type === 'PAGAR' && t.centroCusto === cat).map(t => t.subItem))).sort();
        subItems.forEach(sub => {
          expenseRows.push({
            label: sub,
            type: 'OUT',
            isSubItem: true,
            parentLabel: cat,
            values: getValues(t => t.type === 'PAGAR' && t.centroCusto === cat && t.subItem === sub)
          });
        });
      }
    });

    const totalInByMonth = new Array(12).fill(0);
    const totalOutByMonth = new Array(12).fill(0);

    incomeRows.filter(r => !r.isSubItem).forEach(row => row.values.forEach((v, i) => totalInByMonth[i] += v));
    expenseRows.filter(r => !r.isSubItem).forEach(row => row.values.forEach((v, i) => totalOutByMonth[i] += v));

    const saldoByMonth = totalInByMonth.map((tin, i) => tin - totalOutByMonth[i]);

    return { incomeRows, expenseRows, totalInByMonth, totalOutByMonth, saldoByMonth };
  }, [transactions, showSubItems]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
       <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-blue-900 uppercase tracking-tighter">Fluxo de Caixa Real</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acompanhamento mensal por categoria</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowSubItems(!showSubItems)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 flex items-center gap-2 ${
                showSubItems 
                ? 'bg-blue-900 text-white border-blue-900 shadow-lg shadow-blue-900/20' 
                : 'bg-white text-slate-500 border-slate-100 hover:border-blue-200'
              }`}
            >
              <i className={`fa-solid ${showSubItems ? 'fa-minus-square' : 'fa-plus-square'}`}></i>
              {showSubItems ? 'Ocultar Sub-itens' : 'Ver Detalhamento'}
            </button>
            <div className="h-8 w-px bg-slate-100 mx-1"></div>
            <button onClick={() => window.location.reload()} className="bg-slate-100 p-2.5 rounded-xl text-slate-500 hover:bg-blue-900 hover:text-white transition-all shadow-sm"><i className="fa-solid fa-rotate"></i></button>
          </div>
       </div>

       <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-inner">
         <table className="w-full text-[10px] border-collapse min-w-[1400px]">
            <thead>
              <tr className="bg-blue-900 text-white font-black uppercase tracking-widest">
                <th className="p-4 text-left sticky left-0 bg-blue-900 z-10 min-w-[280px]">Centro de Custo / Item</th>
                {months.map(m => <th key={m} className="p-4 text-right border-l border-blue-800/50">{m}</th>)}
                <th className="p-4 text-right border-l border-blue-800/50 bg-blue-950">Total Anual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* ENTRADAS */}
              <tr className="bg-emerald-600 text-white font-black">
                <td className="p-4 sticky left-0 bg-emerald-600 z-10 uppercase tracking-widest">TOTAL DE ENTRADAS (+)</td>
                {data.totalInByMonth.map((v, i) => <td key={i} className="p-4 text-right">R$ {v.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>)}
                <td className="p-4 text-right bg-emerald-700">R$ {data.totalInByMonth.reduce((a,b)=>a+b,0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
              </tr>
              {data.incomeRows.map((row, i) => (
                <tr key={i} className={`group transition-colors ${row.isSubItem ? 'bg-slate-50/40 text-slate-500 italic' : 'hover:bg-slate-50 font-bold text-slate-700 bg-white'}`}>
                  <td className={`p-4 sticky left-0 z-10 border-r border-slate-50 uppercase truncate ${row.isSubItem ? 'pl-10 text-[9px] bg-slate-50/40' : 'bg-white group-hover:bg-slate-50'}`}>
                    {row.isSubItem && <i className="fa-solid fa-level-up fa-rotate-90 mr-2 text-slate-300"></i>}
                    {row.label}
                  </td>
                  {row.values.map((v, j) => (
                    <td key={j} className={`p-4 text-right ${v > 0 ? 'text-emerald-600' : 'text-slate-300 opacity-50'}`}>
                      {v > 0 ? `R$ ${v.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : '—'}
                    </td>
                  ))}
                  <td className={`p-4 text-right font-black bg-slate-50/50 ${row.isSubItem ? 'text-emerald-500/70' : 'text-emerald-700'}`}>
                    R$ {row.values.reduce((a, b) => a + b, 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </td>
                </tr>
              ))}

              {/* SAÍDAS */}
              <tr className="bg-orange-600 text-white font-black">
                <td className="p-4 sticky left-0 bg-orange-600 z-10 uppercase tracking-widest">TOTAL DE SAÍDAS (-)</td>
                {data.totalOutByMonth.map((v, i) => <td key={i} className="p-4 text-right">R$ {v.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>)}
                <td className="p-4 text-right bg-orange-700">R$ {data.totalOutByMonth.reduce((a,b)=>a+b,0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
              </tr>
              {data.expenseRows.map((row, i) => (
                <tr key={i} className={`group transition-colors ${row.isSubItem ? 'bg-slate-50/40 text-slate-500 italic' : 'hover:bg-slate-50 font-bold text-slate-700 bg-white'}`}>
                  <td className={`p-4 sticky left-0 z-10 border-r border-slate-50 uppercase truncate ${row.isSubItem ? 'pl-10 text-[9px] bg-slate-50/40' : 'bg-white group-hover:bg-slate-50'}`}>
                    {row.isSubItem && <i className="fa-solid fa-level-up fa-rotate-90 mr-2 text-slate-300"></i>}
                    {row.label}
                  </td>
                  {row.values.map((v, j) => (
                    <td key={j} className={`p-4 text-right ${v > 0 ? 'text-orange-600' : 'text-slate-300 opacity-50'}`}>
                      {v > 0 ? `R$ ${v.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : '—'}
                    </td>
                  ))}
                  <td className={`p-4 text-right font-black bg-slate-50/50 ${row.isSubItem ? 'text-orange-500/70' : 'text-orange-700'}`}>
                    R$ {row.values.reduce((a, b) => a + b, 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </td>
                </tr>
              ))}

              {/* SALDO FINAL */}
              <tr className="bg-slate-900 text-white font-black text-[11px] shadow-lg">
                <td className="p-5 sticky left-0 bg-slate-900 z-10 uppercase tracking-[0.2em] border-r border-slate-800">Saldo Operacional (=)</td>
                {data.saldoByMonth.map((v, i) => (
                  <td key={i} className={`p-4 text-right border-l border-slate-800 ${v >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    R$ {v.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </td>
                ))}
                <td className="p-4 text-right bg-slate-950 text-white font-black border-l border-slate-800">
                  R$ {data.saldoByMonth.reduce((a,b)=>a+b,0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </td>
              </tr>
            </tbody>
         </table>
       </div>
    </div>
  );
};

export default CashFlow;
