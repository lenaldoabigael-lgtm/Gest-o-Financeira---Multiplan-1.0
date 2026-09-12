// components/rh/RhVagas.tsx
import React, { useState, useMemo } from 'react';
import { RhVaga } from '../../types';

interface RhVagasProps {
  vagas: RhVaga[];
  onSaveVaga: (vaga: RhVaga, isNew: boolean) => void;
  onFecharEContratar: (vaga: RhVaga) => void;
}

export const RhVagas: React.FC<RhVagasProps> = ({
  vagas,
  onSaveVaga,
  onFecharEContratar
}) => {
  const [statusFilter, setStatusFilter] = useState<'ABERTA' | 'EM_PROCESSO' | 'FECHADA' | 'TODAS'>('ABERTA');
  const [tipoFilter, setTipoFilter] = useState<'CLT' | 'ESTAGIO' | 'TODOS'>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVaga, setEditingVaga] = useState<RhVaga | null>(null);

  const [formData, setFormData] = useState<Partial<RhVaga>>({
    cargo: '',
    area: 'Comercial',
    tipo: 'CLT',
    status: 'ABERTA',
    data_abertura: new Date().toISOString().split('T')[0],
    observacoes: ''
  });

  const filteredVagas = useMemo(() => {
    return vagas.filter(v => {
      if (statusFilter !== 'TODAS' && v.status !== statusFilter) return false;
      if (tipoFilter !== 'TODOS' && v.tipo !== tipoFilter) return false;
      const term = searchTerm.toLowerCase();
      if (term) {
        const matchCargo = v.cargo.toLowerCase().includes(term);
        const matchArea = (v.area || '').toLowerCase().includes(term);
        if (!matchCargo && !matchArea) return false;
      }
      return true;
    });
  }, [vagas, statusFilter, tipoFilter, searchTerm]);

  const handleOpenNew = () => {
    setEditingVaga(null);
    setFormData({
      cargo: '',
      area: 'Comercial',
      tipo: 'CLT',
      status: 'ABERTA',
      data_abertura: new Date().toISOString().split('T')[0],
      observacoes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: RhVaga) => {
    setEditingVaga(v);
    setFormData({ ...v });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cargo) {
      alert('Preencha o cargo da vaga.');
      return;
    }

    const vagaFinal: RhVaga = {
      id: editingVaga?.id || crypto.randomUUID(),
      cargo: formData.cargo.trim(),
      area: formData.area || 'Geral',
      tipo: formData.tipo || 'CLT',
      status: formData.status || 'ABERTA',
      data_abertura: formData.data_abertura,
      observacoes: formData.observacoes
    };

    onSaveVaga(vagaFinal, !editingVaga);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#001a54] text-2xl">work_outline</span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Recrutamento & Vagas</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Pipeline de vagas abertas, entrevistas em andamento e conversão direta para admissão.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleOpenNew}
            className="px-5 py-2.5 bg-[#001a54] hover:bg-[#001138] text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-[#001a54]/20 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-base">add_box</span>
            <span>Nova Vaga</span>
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
        <div className="flex flex-wrap items-center bg-slate-200/60 p-1.5 rounded-2xl gap-1">
          {(['ABERTA', 'EM_PROCESSO', 'FECHADA', 'TODAS'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st 
                  ? 'bg-white text-[#001a54] shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'TODAS' ? 'Todas' : st === 'ABERTA' ? 'Abertas' : st === 'EM_PROCESSO' ? 'Em Processo' : 'Fechadas'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <select
            value={tipoFilter}
            onChange={e => setTipoFilter(e.target.value as any)}
            className="p-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 shadow-xs"
          >
            <option value="TODOS">Todos os Contratos</option>
            <option value="CLT">Apenas CLT</option>
            <option value="ESTAGIO">Apenas Estágio</option>
          </select>

          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar por cargo ou área..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#001a54] focus:ring-1 focus:ring-[#001a54] shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* GRID DE VAGAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {filteredVagas.length > 0 ? (
          filteredVagas.map(vaga => {
            const isFechada = vaga.status === 'FECHADA';

            return (
              <div 
                key={vaga.id}
                className={`bg-white rounded-3xl p-6 border shadow-xs transition-all flex flex-col justify-between ${
                  isFechada ? 'border-slate-200/60 opacity-80' : 'border-slate-200/90 hover:border-blue-300'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${
                      vaga.tipo === 'CLT' 
                        ? 'bg-blue-100 text-blue-900 border-blue-200' 
                        : 'bg-purple-100 text-purple-900 border-purple-200'
                    }`}>
                      {vaga.tipo}
                    </span>

                    <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${
                      vaga.status === 'ABERTA' ? 'bg-emerald-100 text-emerald-900 border-emerald-200' :
                      vaga.status === 'EM_PROCESSO' ? 'bg-amber-100 text-amber-900 border-amber-200' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {vaga.status === 'EM_PROCESSO' ? 'Em Processo' : vaga.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight">{vaga.cargo}</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">Área: {vaga.area || 'Geral'}</p>
                  </div>

                  {vaga.observacoes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 line-clamp-3">
                      {vaga.observacoes}
                    </p>
                  )}

                  {vaga.data_abertura && (
                    <p className="text-[10px] text-slate-400 font-bold">
                      Aberta em: {new Date(vaga.data_abertura + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenEdit(vaga)}
                    className="p-2 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
                    title="Editar Vaga"
                  >
                    <span className="material-symbols-outlined text-base">edit</span>
                  </button>

                  {!isFechada && (
                    <button
                      onClick={() => onFecharEContratar(vaga)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                      title="Fechar vaga e abrir admissão"
                    >
                      <span className="material-symbols-outlined text-sm">how_to_reg</span>
                      <span>Contratar</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })
        ) : (
          <div className="col-span-3 py-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
            <span className="material-symbols-outlined text-4xl block mb-2">work_off</span>
            <p className="font-semibold text-xs">Nenhuma vaga encontrada com os filtros selecionados.</p>
          </div>
        )}
      </div>

      {/* MODAL NOVA/EDITAR VAGA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">{editingVaga ? 'edit' : 'work'}</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    {editingVaga ? 'Editar Vaga' : 'Nova Vaga no Processo Seletivo'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Cadastre os requisitos e área de atuação</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all"
              >
                <i className="fa-solid fa-xmark text-base"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Cargo da Vaga *</label>
                <input
                  type="text"
                  required
                  value={formData.cargo || ''}
                  onChange={e => setFormData({ ...formData, cargo: e.target.value })}
                  placeholder="Ex: Consultor Comercial Sênior"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Área / Setor</label>
                  <input
                    type="text"
                    value={formData.area || ''}
                    onChange={e => setFormData({ ...formData, area: e.target.value })}
                    placeholder="Ex: Comercial"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Tipo de Vaga</label>
                  <select
                    value={formData.tipo || 'CLT'}
                    onChange={e => setFormData({ ...formData, tipo: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="CLT">CLT (Efetivo)</option>
                    <option value="ESTAGIO">Estágio Acadêmico</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Status</label>
                  <select
                    value={formData.status || 'ABERTA'}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="ABERTA">ABERTA</option>
                    <option value="EM_PROCESSO">EM PROCESSO</option>
                    <option value="FECHADA">FECHADA</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Data de Abertura</label>
                  <input
                    type="date"
                    value={formData.data_abertura || ''}
                    onChange={e => setFormData({ ...formData, data_abertura: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Observações / Requisitos</label>
                <textarea
                  rows={3}
                  value={formData.observacoes || ''}
                  onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Ex: Experiência prévia em venda de planos de saúde Hapvida/Amil..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#001a54] hover:bg-[#001138] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-[#001a54]/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">check</span>
                  <span>Salvar Vaga</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
