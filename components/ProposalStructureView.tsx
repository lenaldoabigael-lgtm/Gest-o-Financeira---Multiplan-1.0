
import React, { useState, useMemo } from 'react';
import { ProposalRequirement } from '../types';

interface ProposalStructureViewProps {
  requirements: ProposalRequirement[];
  onSave: (req: Omit<ProposalRequirement, 'id'>) => void;
  onDelete: (id: string) => void;
}

const ProposalStructureView: React.FC<ProposalStructureViewProps> = ({ requirements, onSave, onDelete }) => {
  const [newItems, setNewItems] = useState({
    CORRETOR: '',
    CATEGORIA: '',
    OPERADORA: '',
    TIPO_PLANO: '',
    UNIDADE: ''
  });

  const [newPrazo, setNewPrazo] = useState({
    operadora: '',
    regra: '',
    dias: ''
  });

  const [newTaxaAdesao, setNewTaxaAdesao] = useState({
    operadora: '',
    valor: ''
  });

  const [newImposto, setNewImposto] = useState({
    corretor: '',
    operadora: '',
    valor: ''
  });

  const categories = [
    { id: 'CORRETOR', label: 'Corretores', icon: 'fa-user-tie' },
    { id: 'CATEGORIA', label: 'Categorias', icon: 'fa-tags' },
    { id: 'OPERADORA', label: 'Operadoras', icon: 'fa-hospital' },
    { id: 'TIPO_PLANO', label: 'Tipos de Plano', icon: 'fa-layer-group' },
    { id: 'UNIDADE', label: 'Unidades', icon: 'fa-building' }
  ] as const;

  const handleAdd = (tipo: ProposalRequirement['tipo']) => {
    if (tipo === 'PRAZO_PAGAMENTO' || tipo === 'TAXA_ADESAO' || tipo === 'IMPOSTO_CORRETOR') return; // Handled separately
    const nome = newItems[tipo].trim();
    if (!nome) return;
    
    onSave({ tipo, nome: nome.toUpperCase() });
    setNewItems(prev => ({ ...prev, [tipo]: '' }));
  };

  const handleAddPrazo = () => {
    if (!newPrazo.operadora || !newPrazo.dias) return;
    const nome = `${newPrazo.operadora}${newPrazo.regra ? ` - ${newPrazo.regra}` : ''} - ${newPrazo.dias} DIA(S)`.toUpperCase();
    onSave({ tipo: 'PRAZO_PAGAMENTO', nome });
    setNewPrazo({ operadora: '', regra: '', dias: '' });
  };

  const handleAddTaxaAdesao = () => {
    if (!newTaxaAdesao.operadora || !newTaxaAdesao.valor) return;
    const nome = `${newTaxaAdesao.operadora} - ${newTaxaAdesao.valor}`.toUpperCase();
    onSave({ tipo: 'TAXA_ADESAO', nome });
    setNewTaxaAdesao({ operadora: '', valor: '' });
  };

  const handleAddImposto = () => {
    if (!newImposto.corretor || !newImposto.operadora || !newImposto.valor) return;
    const nome = `${newImposto.corretor} - ${newImposto.operadora} - ${newImposto.valor}`.toUpperCase();
    onSave({ tipo: 'IMPOSTO_CORRETOR', nome });
    setNewImposto({ corretor: '', operadora: '', valor: '' });
  };

  const groupedRequirements = useMemo(() => {
    const groups: Record<string, ProposalRequirement[]> = {
      CORRETOR: [],
      CATEGORIA: [],
      OPERADORA: [],
      TIPO_PLANO: [],
      UNIDADE: [],
      PRAZO_PAGAMENTO: [],
      TAXA_ADESAO: [],
      IMPOSTO_CORRETOR: []
    };
    requirements.forEach(req => {
      if (groups[req.tipo]) {
        groups[req.tipo].push(req);
      }
    });
    return groups;
  }, [requirements]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-blue-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
            <i className="fa-solid fa-sitemap text-xl"></i>
          </div>
          <div>
            <h1 className="text-2xl font-black text-blue-900 uppercase tracking-tighter">Estrutura de Propostas</h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Gerencie os requisitos básicos para o cadastro de novas propostas</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="bg-slate-900 p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <i className={`fa-solid ${cat.icon} text-blue-400`}></i>
                <h3 className="text-xs font-black uppercase tracking-widest">{cat.label}</h3>
              </div>
              <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold">
                {groupedRequirements[cat.id].length}
              </span>
            </div>
            
            <div className="p-4 flex-1 space-y-4">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newItems[cat.id]}
                  onChange={(e) => setNewItems(prev => ({ ...prev, [cat.id]: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && handleAdd(cat.id)}
                  placeholder={`Novo ${cat.label.slice(0, -1)}...`}
                  className="flex-1 bg-slate-50 border-none rounded-xl text-xs py-2.5 px-4 focus:ring-2 focus:ring-blue-900/10 outline-none uppercase font-bold text-slate-700"
                />
                <button 
                  onClick={() => handleAdd(cat.id)}
                  className="bg-blue-900 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20 active:scale-95"
                >
                  <i className="fa-solid fa-plus"></i>
                </button>
              </div>

              <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {groupedRequirements[cat.id].map(req => (
                  <div key={req.id} className="group flex items-center justify-between p-3 bg-slate-50 hover:bg-white hover:shadow-md hover:shadow-slate-200/50 border border-transparent hover:border-slate-100 rounded-xl transition-all">
                    <span className="text-[11px] font-bold text-slate-700 uppercase">{req.nome}</span>
                    <button 
                      onClick={() => onDelete(req.id)}
                      className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                    >
                      <i className="fa-solid fa-trash-can text-[10px]"></i>
                    </button>
                  </div>
                ))}
                {groupedRequirements[cat.id].length === 0 && (
                  <div className="text-center py-8 opacity-20">
                    <i className={`fa-solid ${cat.icon} text-2xl mb-2`}></i>
                    <p className="text-[10px] font-bold uppercase">Nenhum registro</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Card Especial para Prazos de Pagamento */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:col-span-2 lg:col-span-3">
          <div className="bg-blue-900 p-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <i className="fa-solid fa-clock text-blue-300"></i>
              <h3 className="text-xs font-black uppercase tracking-widest">Prazos de Pagamento (SLA)</h3>
            </div>
            <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold">
              {groupedRequirements.PRAZO_PAGAMENTO.length}
            </span>
          </div>
          
          <div className="p-4 flex-1 space-y-4">
            <div className="flex flex-col md:flex-row gap-2">
              <select
                value={newPrazo.operadora}
                onChange={(e) => setNewPrazo(prev => ({ ...prev, operadora: e.target.value }))}
                className="flex-1 bg-slate-50 border-none rounded-xl text-xs py-2.5 px-4 focus:ring-2 focus:ring-blue-900/10 outline-none uppercase font-bold text-slate-700"
              >
                <option value="">Selecione a Operadora...</option>
                {groupedRequirements.OPERADORA.map(op => (
                  <option key={op.id} value={op.nome}>{op.nome}</option>
                ))}
              </select>
              <input 
                type="text" 
                value={newPrazo.regra}
                onChange={(e) => setNewPrazo(prev => ({ ...prev, regra: e.target.value }))}
                placeholder="Regra (Ex: Adesão, PJ...)"
                className="flex-1 bg-slate-50 border-none rounded-xl text-xs py-2.5 px-4 focus:ring-2 focus:ring-blue-900/10 outline-none uppercase font-bold text-slate-700"
              />
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={newPrazo.dias}
                  onChange={(e) => setNewPrazo(prev => ({ ...prev, dias: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddPrazo()}
                  placeholder="Dias"
                  className="w-24 bg-slate-50 border-none rounded-xl text-xs py-2.5 px-4 focus:ring-2 focus:ring-blue-900/10 outline-none uppercase font-bold text-slate-700"
                />
                <button 
                  onClick={handleAddPrazo}
                  className="bg-blue-900 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20 active:scale-95"
                >
                  <i className="fa-solid fa-plus"></i>
                </button>
              </div>
            </div>

            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {groupedRequirements.PRAZO_PAGAMENTO.map(req => (
                <div key={req.id} className="group flex items-center justify-between p-3 bg-slate-50 hover:bg-white hover:shadow-md hover:shadow-slate-200/50 border border-transparent hover:border-slate-100 rounded-xl transition-all">
                  <span className="text-[11px] font-bold text-slate-700 uppercase"><i className="fa-solid fa-clock text-blue-900 mr-2"></i> {req.nome}</span>
                  <button 
                    onClick={() => onDelete(req.id)}
                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                  >
                    <i className="fa-solid fa-trash-can text-[10px]"></i>
                  </button>
                </div>
              ))}
              {groupedRequirements.PRAZO_PAGAMENTO.length === 0 && (
                <div className="col-span-full text-center py-8 opacity-20">
                  <i className="fa-solid fa-clock text-2xl mb-2"></i>
                  <p className="text-[10px] font-bold uppercase">Nenhum prazo cadastrado</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card Especial para Taxa de Implantação/Adesão (Fixa em R$) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:col-span-2 lg:col-span-3">
          <div className="bg-orange-600 p-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <i className="fa-solid fa-money-bill-wave text-orange-200"></i>
              <h3 className="text-xs font-black uppercase tracking-widest">Taxas de Adesão/Implantação (Fixo R$)</h3>
            </div>
            <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold">
              {groupedRequirements.TAXA_ADESAO.length}
            </span>
          </div>
          
          <div className="p-4 flex-1 space-y-4">
            <div className="flex flex-col md:flex-row gap-2">
              <select
                value={newTaxaAdesao.operadora}
                onChange={(e) => setNewTaxaAdesao(prev => ({ ...prev, operadora: e.target.value }))}
                className="flex-1 bg-slate-50 border-none rounded-xl text-xs py-2.5 px-4 focus:ring-2 focus:ring-orange-600/10 outline-none uppercase font-bold text-slate-700"
              >
                <option value="">Selecione a Operadora...</option>
                <option value="TODAS">TODAS AS OPERADORAS</option>
                {groupedRequirements.OPERADORA.map(op => (
                  <option key={op.id} value={op.nome}>{op.nome}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={newTaxaAdesao.valor}
                  onChange={(e) => setNewTaxaAdesao(prev => ({ ...prev, valor: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTaxaAdesao()}
                  placeholder="Valor R$"
                  className="w-32 bg-slate-50 border-none rounded-xl text-xs py-2.5 px-4 focus:ring-2 focus:ring-orange-600/10 outline-none uppercase font-bold text-slate-700"
                />
                <button 
                  onClick={handleAddTaxaAdesao}
                  className="bg-orange-600 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20 active:scale-95"
                >
                  <i className="fa-solid fa-plus"></i>
                </button>
              </div>
            </div>

            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {groupedRequirements.TAXA_ADESAO.map(req => (
                <div key={req.id} className="group flex items-center justify-between p-3 bg-slate-50 hover:bg-white hover:shadow-md hover:shadow-slate-200/50 border border-transparent hover:border-slate-100 rounded-xl transition-all">
                  <span className="text-[11px] font-bold text-slate-700 uppercase"><i className="fa-solid fa-money-bill-wave text-orange-600 mr-2"></i> R$ {req.nome.split(' - ')[1]} ({req.nome.split(' - ')[0]})</span>
                  <button 
                    onClick={() => onDelete(req.id)}
                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                  >
                    <i className="fa-solid fa-trash-can text-[10px]"></i>
                  </button>
                </div>
              ))}
              {groupedRequirements.TAXA_ADESAO.length === 0 && (
                <div className="col-span-full text-center py-8 opacity-20">
                  <i className="fa-solid fa-money-bill-wave text-2xl mb-2"></i>
                  <p className="text-[10px] font-bold uppercase">Nenhuma taxa de adesão cadastrada</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card Especial para Taxas de Desconto (Corretor e Operadora) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:col-span-2 lg:col-span-3">
          <div className="bg-emerald-700 p-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <i className="fa-solid fa-percent text-emerald-300"></i>
              <h3 className="text-xs font-black uppercase tracking-widest">Impostos da Nota de NF / Descontos (%)</h3>
            </div>
            <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold">
              {groupedRequirements.IMPOSTO_CORRETOR.length}
            </span>
          </div>
          
          <div className="p-4 flex-1 space-y-4">
            <div className="flex flex-col md:flex-row gap-2">
              <select
                value={newImposto.corretor}
                onChange={(e) => setNewImposto(prev => ({ ...prev, corretor: e.target.value }))}
                className="flex-1 bg-slate-50 border-none rounded-xl text-xs py-2.5 px-4 focus:ring-2 focus:ring-emerald-700/10 outline-none uppercase font-bold text-slate-700"
              >
                <option value="">Selecione o Corretor...</option>
                <option value="TODOS">TODOS OS CORRETORES</option>
                {groupedRequirements.CORRETOR.map(c => (
                  <option key={c.id} value={c.nome}>{c.nome}</option>
                ))}
              </select>
              <select
                value={newImposto.operadora}
                onChange={(e) => setNewImposto(prev => ({ ...prev, operadora: e.target.value }))}
                className="flex-1 bg-slate-50 border-none rounded-xl text-xs py-2.5 px-4 focus:ring-2 focus:ring-emerald-700/10 outline-none uppercase font-bold text-slate-700"
              >
                <option value="">Selecione a Operadora...</option>
                <option value="TODAS">TODAS AS OPERADORAS</option>
                {groupedRequirements.OPERADORA.map(op => (
                  <option key={op.id} value={op.nome}>{op.nome}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={newImposto.valor}
                  onChange={(e) => setNewImposto(prev => ({ ...prev, valor: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddImposto()}
                  placeholder="%"
                  className="w-24 bg-slate-50 border-none rounded-xl text-xs py-2.5 px-4 focus:ring-2 focus:ring-emerald-700/10 outline-none uppercase font-bold text-slate-700"
                />
                <button 
                  onClick={handleAddImposto}
                  className="bg-emerald-700 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-700/20 active:scale-95"
                >
                  <i className="fa-solid fa-plus"></i>
                </button>
              </div>
            </div>

            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {groupedRequirements.IMPOSTO_CORRETOR.map(req => (
                <div key={req.id} className="group flex items-center justify-between p-3 bg-slate-50 hover:bg-white hover:shadow-md hover:shadow-slate-200/50 border border-transparent hover:border-slate-100 rounded-xl transition-all">
                  <span className="text-[11px] font-bold text-slate-700 uppercase"><i className="fa-solid fa-percent text-emerald-700 mr-2"></i> {req.nome.split(' - ')[2]}% - {req.nome.split(' - ')[0]} ({req.nome.split(' - ')[1]})</span>
                  <button 
                    onClick={() => onDelete(req.id)}
                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                  >
                    <i className="fa-solid fa-trash-can text-[10px]"></i>
                  </button>
                </div>
              ))}
              {groupedRequirements.IMPOSTO_CORRETOR.length === 0 && (
                <div className="col-span-full text-center py-8 opacity-20">
                  <i className="fa-solid fa-percent text-2xl mb-2"></i>
                  <p className="text-[10px] font-bold uppercase">Nenhuma taxa cadastrada</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalStructureView;
