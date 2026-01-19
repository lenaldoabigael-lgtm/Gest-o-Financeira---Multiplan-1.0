
import React from 'react';
import { Transaction } from '../types';

interface CashFlowProps {
  transactions: Transaction[];
}

const CashFlow: React.FC<CashFlowProps> = ({ transactions }) => {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  // Aggregate data for mock (simplified)
  const rows = [
    { label: 'RECEITA CONDOMINIO', type: 'IN', values: [43346, 80448, 186394, 115040, 78655, 50302, 106315, 380228, 300486, 147048, 56776, 99634] },
    { label: 'ACESSORIA JURIDICA', type: 'OUT', values: [1024, 0, 0, 0, 0, 0, 0, 0, 2558, 0, 1534, 0] },
    { label: 'DESP. ESCRITORIO', type: 'OUT', values: [14976, 27088, 15652, 31324, 12013, 1141, 3860, 59753, 80210, 4315, 5278, 13376] },
    { label: 'DESP. MAT. OBRA', type: 'OUT', values: [939, 820, 3061, 90, 1371, 25303, 853, 30213, 11690, 499, 0, 160] },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
       <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-blue-900 uppercase">Fluxo de Caixa</h2>
          <div className="flex gap-2">
            <button className="bg-gray-100 p-2 rounded hover:bg-gray-200"><i className="fa-solid fa-rotate"></i></button>
            <button className="bg-gray-100 p-2 rounded hover:bg-gray-200"><i className="fa-solid fa-file-excel"></i></button>
          </div>
       </div>

       <div className="overflow-x-auto">
         <table className="w-full text-[11px] border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-blue-900 text-white">
                <th className="p-2 text-left border border-blue-800 min-w-[200px]">Rótulos de Linha</th>
                {months.map(m => <th key={m} className="p-2 border border-blue-800 text-right">{m}</th>)}
                <th className="p-2 border border-blue-800 text-right">Total Geral</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-gray-200 font-bold uppercase">
                <td className="p-2 border border-gray-300">TOTAL DE ENTRADAS</td>
                {months.map((_, i) => <td key={i} className="p-2 border border-gray-300"></td>)}
                <td className="p-2 border border-gray-300"></td>
              </tr>
              {rows.filter(r => r.type === 'IN').map((row, i) => (
                <tr key={i} className="hover:bg-blue-50 transition-colors">
                  <td className="p-2 border border-gray-200 font-semibold">{row.label}</td>
                  {row.values.map((v, j) => (
                    <td key={j} className="p-2 border border-gray-200 text-right text-green-700">
                      R$ {v.toLocaleString('pt-BR')}
                    </td>
                  ))}
                  <td className="p-2 border border-gray-200 text-right font-bold text-green-800">
                    R$ {row.values.reduce((a, b) => a + b, 0).toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-200 font-bold uppercase">
                <td className="p-2 border border-gray-300">TOTAL DE SAÍDAS</td>
                {months.map((_, i) => <td key={i} className="p-2 border border-gray-300"></td>)}
                <td className="p-2 border border-gray-300"></td>
              </tr>
              {rows.filter(r => r.type === 'OUT').map((row, i) => (
                <tr key={i} className="hover:bg-orange-50 transition-colors">
                  <td className="p-2 border border-gray-200 font-semibold">{row.label}</td>
                  {row.values.map((v, j) => (
                    <td key={j} className="p-2 border border-gray-200 text-right text-orange-700">
                      -R$ {v.toLocaleString('pt-BR')}
                    </td>
                  ))}
                  <td className="p-2 border border-gray-200 text-right font-bold text-orange-800">
                    -R$ {row.values.reduce((a, b) => a + b, 0).toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
              <tr className="bg-blue-900 text-white font-bold">
                <td className="p-2 border border-blue-800">SALDO OPERACIONAL</td>
                {months.map((_, i) => <td key={i} className="p-2 border border-blue-800 text-right">R$ 15.000,00</td>)}
                <td className="p-2 border border-blue-800 text-right">R$ 180.000,00</td>
              </tr>
            </tbody>
         </table>
       </div>
    </div>
  );
};

export default CashFlow;
