
import React, { useMemo } from 'react';
import { Transaction } from '../types';

interface CashFlowProps {
  transactions: Transaction[];
}

const CashFlow: React.FC<CashFlowProps> = ({ transactions }) => {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  const data = useMemo(() => {
    // Obter todos os centros de custo únicos presentes nas transações
    // Fix: Explicitly typing as string[] to ensure 'cat' in .map is not 'unknown'
    const incomeCategories: string[] = Array.from(new Set<string>(transactions.filter(t => t.type === 'RECEBER').map(t => t.centroCusto))).sort();
    const expenseCategories: string[] = Array.from(new Set<string>(transactions.filter(t => t.type === 'PAGAR').map(t => t.centroCusto))).sort();

    const getValuesForCategory = (category: string, type: 'RECEBER' | 'PAGAR') => {
      const values = new Array(12).fill(0);
      transactions.filter(t => t.type === type && t.centroCusto === category).forEach(t => {
        const month = new Date(t.vencimento).getMonth();
        values[month] += t.valor;
      });
      return values;
    };

    const incomeRows = incomeCategories.map((cat: string) => ({
      label: cat,
      type: 'IN',
      values: getValuesForCategory(cat, 'RECEBER')
    }));

    const expenseRows = expenseCategories.map((cat: string) => ({
      label: cat,
      type: 'OUT',
      values: getValuesForCategory(cat, 'PAGAR')
    }));

    // Cálculos de totais por mês
    const totalInByMonth = new Array(12).fill(0);
    const totalOutByMonth = new Array(12).fill(0);

    incomeRows.forEach(row => row.values.forEach((v, i) => totalInByMonth[i] += v));
    expenseRows.forEach(row => row.values.forEach((v, i) => totalOutByMonth[i] += v));

    const saldoByMonth = totalInByMonth.map((tin, i) => tin - totalOutByMonth[i]);

    return { incomeRows, expenseRows, totalInByMonth, totalOutByMonth, saldoByMonth };
  }, [transactions]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
       <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-blue-900 uppercase tracking-tighter">Fluxo de Caixa Real</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Soma de movimentações por categoria</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.location.reload()} className="bg-slate-100 p-2.5 rounded-xl text-slate-500 hover:bg-blue-900 hover:text-white transition-all"><i className="fa-solid fa-rotate"></i></button>
            <button className="bg-slate-100 p-2.5 rounded-xl text-slate-500 hover:bg-emerald-600 hover:text-white transition-all"><i className="fa-solid fa-file-excel"></i></button>
          </div>
       </div>

       <div className="overflow-x-auto rounded-xl border border-slate-100">
         <table className="w-full text-[10px] border-collapse min-w-[1400px]">
            <thead>
              <tr className="bg-blue-900 text-white font-black uppercase tracking-widest">
                <th className="p-4 text-left sticky left-0 bg-blue-900 z-10 min-w-[220px]">Centro de Custo</th>
                {months.map(m => <th key={m} className="p-4 text-right border-l border-blue-800/50">{m}</th>)}
                <th className="p-4 text-right border-l border-blue-800/50 bg-blue-950">Total Anual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* ENTRADAS */}
              <tr className="bg-emerald-50/50 font-black text-emerald-700">
                <td className="p-4 sticky left-0 bg-emerald-50/50 z-10">TOTAL DE ENTRADAS (+)</td>
                {data.totalInByMonth.map((v, i) => <td key={i} className="p-4 text-right">R$ {v.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>)}
                <td className="p-4 text-right bg-emerald-100">R$ {data.totalInByMonth.reduce((a,b)=>a+b,0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
              </tr>
              {data.incomeRows.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4 sticky left-0 bg-white group-hover:bg-slate-50 z-10 font-bold text-slate-600 border-r border-slate-50 uppercase">{row.label}</td>
                  {row.values.map((v, j) => (
                    <td key={j} className="p-4 text-right text-emerald-600 font-medium">
                      {v > 0 ? `R$ ${v.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : '—'}
                    </td>
                  ))}
                  <td className="p-4 text-right font-black text-emerald-700 bg-slate-50/50">
                    R$ {row.values.reduce((a, b) => a + b, 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </td>
                </tr>
              ))}

              {/* SAÍDAS */}
              <tr className="bg-orange-50/50 font-black text-orange-700">
                <td className="p-4 sticky left-0 bg-orange-50/50 z-10">TOTAL DE SAÍDAS (-)</td>
                {data.totalOutByMonth.map((v, i) => <td key={i} className="p-4 text-right">R$ {v.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>)}
                <td className="p-4 text-right bg-orange-100">R$ {data.totalOutByMonth.reduce((a,b)=>a+b,0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
              </tr>
              {data.expenseRows.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4 sticky left-0 bg-white group-hover:bg-slate-50 z-10 font-bold text-slate-600 border-r border-slate-50 uppercase">{row.label}</td>
                  {row.values.map((v, j) => (
                    <td key={j} className="p-4 text-right text-orange-600 font-medium">
                      {v > 0 ? `R$ ${v.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : '—'}
                    </td>
                  ))}
                  <td className="p-4 text-right font-black text-orange-700 bg-slate-50/50">
                    R$ {row.values.reduce((a, b) => a + b, 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </td>
                </tr>
              ))}

              {/* SALDO FINAL */}
              <tr className="bg-blue-900 text-white font-black text-xs">
                <td className="p-4 sticky left-0 bg-blue-900 z-10 uppercase tracking-widest">Saldo Operacional (=)</td>
                {data.saldoByMonth.map((v, i) => (
                  <td key={i} className={`p-4 text-right ${v >= 0 ? 'text-emerald-400' : 'text-orange-300'}`}>
                    R$ {v.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </td>
                ))}
                <td className="p-4 text-right bg-blue-950">R$ {data.saldoByMonth.reduce((a,b)=>a+b,0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
              </tr>
            </tbody>
         </table>
       </div>
    </div>
  );
};

export default CashFlow;
