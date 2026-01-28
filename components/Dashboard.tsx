
import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

interface DashboardProps {
  transactions: Transaction[];
}

const COLORS = ['#1e3a8a', '#f97316', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f59e0b', '#6366f1'];

const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const stats = useMemo(() => {
    const receitas = transactions.filter(t => t.type === 'RECEBER').reduce((acc, t) => acc + t.valor, 0);
    const despesas = transactions.filter(t => t.type === 'PAGAR').reduce((acc, t) => acc + t.valor, 0);
    const despesasPagas = transactions.filter(t => t.type === 'PAGAR' && (t.status === 'PAGO' || t.status === 'RECEBIDO')).reduce((acc, t) => acc + t.valor, 0);
    
    return {
      receitas,
      despesas,
      saldo: receitas - despesas,
      pendentes: despesas - despesasPagas
    };
  }, [transactions]);

  const chartData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const data = months.map(m => ({ name: m, receitas: 0, despesas: 0 }));

    transactions.forEach(t => {
      const date = new Date(t.vencimento);
      const monthIdx = date.getMonth();
      if (t.type === 'RECEBER') data[monthIdx].receitas += t.valor;
      else data[monthIdx].despesas += t.valor;
    });

    return data.filter(d => d.receitas > 0 || d.despesas > 0);
  }, [transactions]);

  const topDespesas = useMemo(() => {
    const categories: Record<string, number> = {};
    transactions.filter(t => t.type === 'PAGAR').forEach(t => {
      categories[t.centroCusto] = (categories[t.centroCusto] || 0) + t.valor;
    });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Saldo Atual</p>
          <p className={`text-2xl font-black ${stats.saldo >= 0 ? 'text-blue-900' : 'text-red-500'}`}>
            R$ {stats.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 text-emerald-600">Total Receitas</p>
          <p className="text-2xl font-black text-emerald-600">R$ {stats.receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 text-orange-600">Total Despesas</p>
          <p className="text-2xl font-black text-orange-600">R$ {stats.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 text-red-600">Total Pendente</p>
          <p className="text-2xl font-black text-red-600">R$ {stats.pendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-blue-900 font-black uppercase tracking-tighter mb-6 flex items-center gap-2 text-sm">
            <i className="fa-solid fa-chart-line text-blue-500"></i> Desempenho Mensal Real
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
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
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-blue-900 font-black uppercase tracking-tighter mb-6 flex items-center gap-2 text-sm">
          <i className="fa-solid fa-chart-bar text-emerald-500"></i> Receita x Despesa por Mês (Real)
        </h3>
        <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                    <Legend iconType="rect" />
                    <Bar dataKey="receitas" fill="#1e3a8a" radius={[4, 4, 0, 0]} name="Receitas" />
                    <Bar dataKey="despesas" fill="#f97316" radius={[4, 4, 0, 0]} name="Despesas" />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
