import React, { useMemo, useState, useEffect } from 'react';
import { Proposal } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

interface DashboardProps {
  proposals: Proposal[];
}

const COLORS = ['#1e3a8a', '#f97316', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f59e0b', '#6366f1'];
const MONTHS_LABELS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

const Dashboard: React.FC<DashboardProps> = ({ proposals }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number | 'TODOS'>('TODOS');
  const [selectedYear, setSelectedYear] = useState<string | 'TODOS'>(new Date().getFullYear().toString());
  const [rankingToggle, setRankingToggle] = useState<'VALOR' | 'VIDAS'>('VALOR');
  const [selectedCorretor, setSelectedCorretor] = useState<string | 'TODOS'>('TODOS');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const corretoresDisponiveis = useMemo(() => {
    const set = new Set<string>();
    proposals.forEach(p => {
      if (p.corretor) set.add(p.corretor);
    });
    return Array.from(set).sort();
  }, [proposals]);

  // Filtra as propostas com base no mês/ano selecionado
  const filteredProposals = useMemo(() => {
    return proposals.filter(p => {
      if (!p.data) return false;
      const [year, month] = p.data.split('-');
      const mMatch = selectedMonth === 'TODOS' || (parseInt(month) - 1) === selectedMonth;
      const cMatch = selectedCorretor === 'TODOS' || p.corretor === selectedCorretor;
      const yMatch = selectedYear === 'TODOS' || year === selectedYear;
      return mMatch && yMatch && cMatch;
    });
  }, [proposals, selectedMonth, selectedYear, selectedCorretor]);

  // 1. KPIs Principais
  const kpis = useMemo(() => {
    let totalVendido = 0;
    let totalVidas = 0;
    let totalComissoes = 0;

    filteredProposals.forEach(p => {
      totalVendido += Number(p.valor) || 0;
      totalVidas += Number(p.vidas) || 0;
      totalComissoes += Number(p.comissao) || 0;
    });

    const ticketMedio = totalVidas > 0 ? totalVendido / totalVidas : 0;

    return { totalVendido, totalVidas, ticketMedio, totalComissoes };
  }, [filteredProposals]);

  // 2. Ranking de Corretores
  const rankingCorretores = useMemo(() => {
    const map = new Map<string, { corretor: string, valor: number, vidas: number }>();
    filteredProposals.forEach(p => {
      const corretor = p.corretor || 'Sem Corretor';
      const curr = map.get(corretor) || { corretor, valor: 0, vidas: 0 };
      curr.valor += Number(p.valor) || 0;
      curr.vidas += Number(p.vidas) || 0;
      map.set(corretor, curr);
    });

    return Array.from(map.values())
      .sort((a, b) => rankingToggle === 'VALOR' ? b.valor - a.valor : b.vidas - a.vidas)
      .slice(0, 10);
  }, [filteredProposals, rankingToggle]);

  // 3. Share por Operadora e Categoria
  const shareOperadora = useMemo(() => {
    const map = new Map<string, number>();
    filteredProposals.forEach(p => {
      const op = p.operadora || 'Outras';
      map.set(op, (map.get(op) || 0) + (Number(p.valor) || 0));
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredProposals]);

  const shareCategoria = useMemo(() => {
    const map = new Map<string, number>();
    filteredProposals.forEach(p => {
      const cat = p.categoria || 'Outras';
      map.set(cat, (map.get(cat) || 0) + (Number(p.valor) || 0));
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredProposals]);

  // 4. Evolução Diária/Mensal
  const evolucao = useMemo(() => {
    const map = new Map<string, {valor: number, vidas: number}>();
    filteredProposals.forEach(p => {
      if (!p.data) return;
      
      let key = p.data;
      if (selectedMonth === 'TODOS' && selectedYear !== 'TODOS') {
        const [year, month] = p.data.split('-');
        key = `${year}-${month}`;
      } else if (selectedYear === 'TODOS') {
         const [year] = p.data.split('-');
         key = year;
      }
      
      const curr = map.get(key) || {valor: 0, vidas: 0};
      curr.valor += (Number(p.valor) || 0);
      curr.vidas += (Number(p.vidas) || 0);
      map.set(key, curr);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, data]) => {
        let label = name;
        if (name.length === 7) {
            const [y, m] = name.split('-');
            label = `${MONTHS_LABELS[parseInt(m)-1]}/${y}`;
        } else if (name.length === 10) {
            const [y, m, d] = name.split('-');
            label = `${d}/${m}`;
        }
        return { name: label, value: data.valor, vidas: data.vidas };
      });
  }, [filteredProposals, selectedMonth, selectedYear]);

  // Função para formatar tooltip de R$
  const formatBRL = (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="bg-slate-900 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <i className="fa-solid fa-chart-line text-lg"></i>
          </div>
          <div>
            <h1 className="text-base font-black uppercase tracking-tighter">Dashboard de Vendas</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Indicadores</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:gap-4 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide">
          <div className="space-y-3 min-w-max">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <i className="fa-regular fa-calendar text-blue-500"></i> Mês
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedMonth('TODOS')}
                className={`px-2 py-1 rounded-lg text-[9px] font-black transition-all border ${selectedMonth === 'TODOS' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-blue-500 hover:text-white'}`}
              >
                TODOS
              </button>
              {MONTHS_LABELS.map((label, idx) => (
                <button
                  key={label}
                  onClick={() => setSelectedMonth(idx)}
                  className={`px-2 py-1 rounded-lg text-[9px] font-black transition-all border ${selectedMonth === idx ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-blue-500 hover:text-white'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="w-px bg-slate-700 h-12 hidden md:block"></div>

          <div className="space-y-3 min-w-max">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <i className="fa-solid fa-layer-group text-blue-500"></i> Ano
            </h3>
            <div className="flex gap-2">
              {['TODOS', '2025', '2026', '2027'].map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-3 py-1 rounded-lg text-[9px] font-black transition-all border ${selectedYear === year ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-blue-500 hover:text-white'}`}
                >
                  {year}
                </button>
              ))}
            </div>
                    </div>

          <div className="w-px bg-slate-700 h-12 hidden md:block"></div>

          <div className="space-y-3 min-w-max">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <i className="fa-solid fa-user-tie text-blue-500"></i> Corretor
            </h3>
            <select
              value={selectedCorretor}
              onChange={(e) => setSelectedCorretor(e.target.value)}
              className="bg-slate-800 text-white border border-slate-700 rounded-lg px-3 py-1 text-xs font-bold focus:outline-none focus:border-blue-500 w-40"
            >
              <option value="TODOS">TODOS</option>
              {corretoresDisponiveis.map(c => (
                <option key={c} value={c}>{c || 'Sem Nome'}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 1. KPIs Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 text-blue-600">Total Vendido</p>
          <p className="text-2xl font-black text-blue-900">R$ {kpis.totalVendido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 text-emerald-600">Total de Vidas</p>
          <p className="text-2xl font-black text-emerald-600">{kpis.totalVidas}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 text-orange-600">Ticket Médio</p>
          <p className="text-2xl font-black text-orange-600">R$ {kpis.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 text-purple-600">Previsão de Comissões</p>
          <p className="text-2xl font-black text-purple-600">R$ {kpis.totalComissoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. Ranking de Corretores */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-blue-900 font-black uppercase tracking-tighter flex items-center gap-2 text-sm">
              <i className="fa-solid fa-trophy text-amber-500"></i> Top 10 Corretores
            </h3>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setRankingToggle('VALOR')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${rankingToggle === 'VALOR' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                POR VALOR
              </button>
              <button 
                onClick={() => setRankingToggle('VIDAS')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${rankingToggle === 'VIDAS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                POR VIDAS
              </button>
            </div>
          </div>
          <div className="h-[350px] w-full min-w-0">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={rankingCorretores} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={rankingToggle === 'VALOR' ? (v) => `R$ ${v.toLocaleString('pt-BR')}` : undefined} />
                  <YAxis dataKey="corretor" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} width={100} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}} 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                    formatter={rankingToggle === 'VALOR' ? (value: number) => formatBRL(value) : (value: number) => value}
                  />
                  <Bar dataKey={rankingToggle === 'VALOR' ? 'valor' : 'vidas'} fill="#3b82f6" radius={[0, 4, 4, 0]} name={rankingToggle === 'VALOR' ? 'Total Vendido' : 'Qtd Vidas'} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 4. Share por Operadora e Categoria */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-blue-900 font-black uppercase tracking-tighter mb-4 flex items-center gap-2 text-sm">
              <i className="fa-solid fa-chart-pie text-orange-500"></i> Share por Operadora (R$)
            </h3>
            <div className="h-[140px] w-full min-w-0">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={shareOperadora}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {shareOperadora.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatBRL(value)} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px'}} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-blue-900 font-black uppercase tracking-tighter mb-4 flex items-center gap-2 text-sm">
              <i className="fa-solid fa-chart-pie text-emerald-500"></i> Share por Categoria (R$)
            </h3>
            <div className="h-[140px] w-full min-w-0">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={shareCategoria}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {shareCategoria.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatBRL(value)} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px'}} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Evolução Diária/Mensal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-blue-900 font-black uppercase tracking-tighter mb-6 flex items-center gap-2 text-sm">
            <i className="fa-solid fa-arrow-trend-up text-indigo-500"></i> Evolução de Vendas (R$)
          </h3>
          <div className="h-80 w-full min-w-0">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <LineChart data={evolucao}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9}} tickFormatter={(v) => `R$ ${v.toLocaleString('pt-BR')}`} width={80} />
                  <Tooltip formatter={(value) => formatBRL(Number(value))} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={4} dot={{ r: 4, fill: '#4f46e5' }} name="Total Vendido" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-blue-900 font-black uppercase tracking-tighter mb-6 flex items-center gap-2 text-sm">
            <i className="fa-solid fa-users text-emerald-500"></i> Evolução de Vidas
          </h3>
          <div className="h-80 w-full min-w-0">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <LineChart data={evolucao}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9}} width={40} />
                  <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Line type="monotone" dataKey="vidas" stroke="#10b981" strokeWidth={4} dot={{ r: 4, fill: '#10b981' }} name="Vidas" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
