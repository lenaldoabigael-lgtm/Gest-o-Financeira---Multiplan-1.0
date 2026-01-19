
import React from 'react';
import { Transaction } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

interface DashboardProps {
  transactions: Transaction[];
}

const COLORS = ['#1e3a8a', '#f97316', '#10b981', '#ef4444', '#8b5cf6'];

const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const receitas = transactions.filter(t => t.type === 'RECEBER').reduce((acc, t) => acc + t.valor, 0);
  const despesas = transactions.filter(t => t.type === 'PAGAR').reduce((acc, t) => acc + t.valor, 0);
  const saldo = receitas - despesas;
  
  const despesasPagas = transactions.filter(t => t.type === 'PAGAR' && t.status === 'PAGO').reduce((acc, t) => acc + t.valor, 0);
  const despesasPendentes = despesas - despesasPagas;

  // Mock data for charts
  const monthlyData = [
    { name: 'Jan', receitas: 1634743, despesas: 946786 },
    { name: 'Fev', receitas: 1800000, despesas: 850000 },
    { name: 'Mar', receitas: 1500000, despesas: 1100000 },
  ];

  const topDespesas = [
    { name: 'DESC. FUNCION. OBRA', value: 392803 },
    { name: 'DESC. ESCRITORIO', value: 268990 },
    { name: 'DESC. DEPOSITO', value: 96392 },
    { name: 'DESC. MAT. OBRA', value: 75003 },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-900">
          <p className="text-gray-500 text-xs font-bold uppercase mb-1">Saldo</p>
          <p className="text-2xl font-bold text-gray-900">R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
          <p className="text-gray-500 text-xs font-bold uppercase mb-1">Receitas</p>
          <p className="text-2xl font-bold text-green-600">R$ {receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-500">
          <p className="text-gray-500 text-xs font-bold uppercase mb-1">Despesas</p>
          <p className="text-2xl font-bold text-orange-600">-R$ {despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
          <p className="text-gray-500 text-xs font-bold uppercase mb-1">Pendentes</p>
          <p className="text-2xl font-bold text-red-600">R$ {despesasPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-blue-900 font-bold mb-6 flex items-center gap-2">
            <i className="fa-solid fa-chart-line"></i> Receita x Despesa por Mês
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="receitas" stroke="#1e3a8a" strokeWidth={3} dot={{ r: 6 }} />
                <Line type="monotone" dataKey="despesas" stroke="#f97316" strokeWidth={3} dot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-blue-900 font-bold mb-6 flex items-center gap-2">
            <i className="fa-solid fa-chart-pie"></i> Top 10 Despesas
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topDespesas}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {topDespesas.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-blue-900 font-bold mb-6 flex items-center gap-2">
          <i className="fa-solid fa-chart-bar"></i> Receita x Despesa por Dia (Simulação)
        </h3>
        <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="receitas" fill="#1e3a8a" />
                    <Bar dataKey="despesas" fill="#f97316" />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
