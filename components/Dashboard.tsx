
import React, { useMemo, useState } from 'react';
import { Transaction } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

interface DashboardProps {
  transactions: Transaction[];
}

const COLORS = ['#1e3a8a', '#f97316', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f59e0b', '#6366f1'];
const MONTHS_LABELS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const [selectedMonth, setSelectedMonth] = useState<number | 'TODOS'>('TODOS');
  const [selectedYear, setSelectedYear] = useState<string | 'TODOS'>(new Date().getFullYear().toString());

  // Filtra as transações para os cards de resumo e gráfico de pizza com base no mês/ano selecionado
  const filteredForSummary = useMemo(() => {
    return transactions.filter(t => {
      const [year, month] = t.vencimento.split('-');
      const mMatch = selectedMonth === 'TODOS' || (parseInt(month) - 1) === selectedMonth;
      const yMatch = selectedYear === 'TODOS' || year === selectedYear;
      return mMatch && yMatch;
    });
  }, [transactions, selectedMonth, selectedYear]);

  const stats = useMemo(() => {
    const receitas = filteredForSummary.filter(t => t.type === 'RECEBER').reduce((acc, t) => acc + t.valor, 0);
    const despesas = filteredForSummary.filter(t => t.type === 'PAGAR').reduce((acc, t) => acc + t.valor, 0);
    const despesasPagas = filteredForSummary.filter(t => t.type === 'PAGAR' && (t.status === 'PAGO' || t.status === 'RECEBIDO')).reduce((acc, t) => acc + t.valor, 0);
    
    return {
      receitas,
      despesas,
      saldo: receitas - despesas,
      pendentes: despesas - despesasPagas
    };
  }, [filteredForSummary]);

  const chartData = useMemo(() => {
    const data = MONTHS_LABELS.map(m => ({ name: m, receitas: 0, despesas: 0 }));

    transactions.forEach(t => {
      const [year, month] = t.vencimento.split('-');
      if (selectedYear !== 'TODOS' && year !== selectedYear) return;
      
      const monthIdx = parseInt(month) - 1;
      if (t.type === 'RECEBER') data[monthIdx].receitas += t.valor;
      else data[monthIdx].despesas += t.valor;
    });

    return data;
  }, [transactions, selectedYear]);

  const taskCountData = useMemo(() => {
    const data = MONTHS_LABELS.map(m => ({ name: m, concluidas: 0, pendentes: 0 }));

    transactions.forEach(t => {
      const [year, month] = t.vencimento.split('-');
      if (selectedYear !== 'TODOS' && year !== selectedYear) return;

      const monthIdx = parseInt(month) - 1;
      if (t.status === 'PAGO' || t.status === 'RECEBIDO') {
        data[monthIdx].concluidas += 1;
      } else {
        data[monthIdx].pendentes += 1;
      }
    });

    return data;
  }, [transactions, selectedYear]);

  const topDespesas = useMemo(() => {
    const categories: Record<string, number> = {};
    filteredForSummary.filter(t => t.type === 'PAGAR').forEach(t => {
      categories[t.centroCusto] = (categories[t.centroCusto] || 0) + t.valor;
    });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredForSummary]);

  return (
    <div className="space-y-6">
      {/* Filtros de Mês e Ano */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-3 flex-1">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <i className="fa-solid fa-calendar-days text-blue-900"></i> Filtrar por Período
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedMonth('TODOS')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border ${selectedMonth === 'TODOS' ? 'bg-blue-900 text-white border-blue-900' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-blue-200'}`}
              >
                TODOS
              </button>
              {MONTHS_LABELS.map((label, idx) => (
                <button
                  key={label}
                  onClick={() => setSelectedMonth(idx)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border ${selectedMonth === idx ? 'bg-blue-900 text-white border-blue-900 shadow-md' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-blue-200'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="w-px bg-slate-100 h-12 hidden md:block"></div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <i className="fa-solid fa-layer-group text-blue-900"></i> Ano
            </h3>
            <div className="flex gap-2">
              {['TODOS', '2023', '2024', '2025'].map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all border ${selectedYear === year ? 'bg-blue-900 text-white border-blue-900 shadow-md' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-blue-200'}`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Saldo {selectedMonth !== 'TODOS' ? MONTHS_LABELS[selectedMonth] : 'Atual'}</p>
          <p className={`text-2xl font-black ${stats.saldo >= 0 ? 'text-blue-900' : 'text-red-500'}`}>
            R$ {stats.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 text-emerald-600">Total Receitas</p>
          <p className="text-2xl font-black text-emerald-600">R$ {stats.receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 text-orange-600">Total Despesas</p>
          <p className="text-2xl font-black text-orange-600">R$ {stats.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 text-red-600">Total Pendente</p>
          <p className="text-2xl font-black text-red-600">R$ {stats.pendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-blue-900 font-black uppercase tracking-tighter mb-6 flex items-center gap-2 text-sm">
            <i className="fa-solid fa-chart-line text-blue-500"></i> Desempenho Mensal Real ({selectedYear})
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9}} />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="receitas" stroke="#10b981" strokeWidth={4} dot={{ r: 4, fill: '#10b981' }} name="Receitas" />
                <Line type="monotone" dataKey="despesas" stroke="#f97316" strokeWidth={4} dot={{ r: 4, fill: '#f97316' }} name="Despesas" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-blue-900 font-black uppercase tracking-tighter mb-6 flex items-center gap-2 text-sm">
            <i className="fa-solid fa-tasks text-emerald-500"></i> Volume de Tarefas ({selectedYear})
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskCountData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9}} allowDecimals={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="rect" />
                <Bar dataKey="concluidas" fill="#10b981" radius={[4, 4, 0, 0]} name="Concluídas" />
                <Bar dataKey="pendentes" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Pendentes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-blue-900 font-black uppercase tracking-tighter mb-6 flex items-center gap-2 text-sm">
            <i className="fa-solid fa-chart-pie text-orange-500"></i> Distribuição por Centro de Custo
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topDespesas}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {topDespesas.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-blue-900 font-black uppercase tracking-tighter mb-6 flex items-center gap-2 text-sm">
            <i className="fa-solid fa-chart-bar text-emerald-500"></i> Receita x Despesa Mensal
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                    <Legend iconType="rect" />
                    <Bar dataKey="receitas" fill="#1e3a8a" radius={[4, 4, 0, 0]} name="Receitas" />
                    <Bar dataKey="despesas" fill="#f97316" radius={[4, 4, 0, 0]} name="Despesas" />
                </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
