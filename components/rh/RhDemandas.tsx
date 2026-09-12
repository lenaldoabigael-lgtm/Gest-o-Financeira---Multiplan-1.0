// components/rh/RhDemandas.tsx
import React, { useState, useMemo } from 'react';
import { RhDemanda, RhFuncionario } from '../../types';
import { dispararNotificacaoWhatsapp } from '../../lib/rhWhatsapp';

interface RhDemandasProps {
  demandas: RhDemanda[];
  funcionarios: RhFuncionario[];
  onSaveDemanda: (demanda: RhDemanda, isNew: boolean) => void;
  onToggleStatusDemanda: (id: string) => void;
  onDeleteDemanda?: (id: string) => void;
}

export const RhDemandas: React.FC<RhDemandasProps> = ({
  demandas,
  funcionarios,
  onSaveDemanda,
  onToggleStatusDemanda
}) => {
  const [statusFilter, setStatusFilter] = useState<'PENDENTE' | 'CONCLUIDA' | 'ATRASADAS' | 'TODAS'>('PENDENTE');
  const [tipoFilter, setTipoFilter] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<RhDemanda>>({
    tipo: 'EXAME_ADMISSIONAL',
    descricao: '',
    data_prevista: new Date().toISOString().split('T')[0],
    funcionario_id: '',
    status: 'PENDENTE'
  });

  const hojeStr = new Date().toISOString().split('T')[0];

  const filteredDemandas = useMemo(() => {
    return demandas.filter(d => {
      // Filtro de Status
      if (statusFilter === 'PENDENTE' && d.status !== 'PENDENTE') return false;
      if (statusFilter === 'CONCLUIDA' && d.status !== 'CONCLUIDA') return false;
      if (statusFilter === 'ATRASADAS' && (d.status === 'CONCLUIDA' || !d.data_prevista || d.data_prevista >= hojeStr)) return false;

      // Filtro de Tipo
      if (tipoFilter !== 'TODOS' && d.tipo !== tipoFilter) return false;

      // Busca
      const term = searchTerm.toLowerCase();
      if (term) {
        const matchDesc = (d.descricao || '').toLowerCase().includes(term);
        const matchNome = (d.funcionario_nome || '').toLowerCase().includes(term);
        const matchTipo = (d.tipo || '').toLowerCase().includes(term);
        if (!matchDesc && !matchNome && !matchTipo) return false;
      }

      return true;
    });
  }, [demandas, statusFilter, tipoFilter, searchTerm, hojeStr]);

  const handleOpenNew = () => {
    setFormData({
      tipo: 'EXAME_ADMISSIONAL',
      descricao: '',
      data_prevista: new Date().toISOString().split('T')[0],
      funcionario_id: funcionarios[0]?.id || '',
      status: 'PENDENTE'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.descricao || !formData.tipo) {
      alert('Preencha a descrição da demanda.');
      return;
    }

    const func = funcionarios.find(f => f.id === formData.funcionario_id);

    const demandaFinal: RhDemanda = {
      id: crypto.randomUUID(),
      tipo: formData.tipo || 'OUTRO',
      descricao: formData.descricao.trim(),
      data_prevista: formData.data_prevista,
      funcionario_id: formData.funcionario_id || undefined,
      funcionario_nome: func?.nome_completo,
      status: 'PENDENTE',
      criado_em: new Date().toISOString()
    };

    onSaveDemanda(demandaFinal, true);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#001a54] text-2xl">checklist</span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Demandas & Checklists de RH</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Controle de exames admissionais, contratos de trabalho, entrega de CTPS e tarefas de departamento pessoal.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleOpenNew}
            className="px-5 py-2.5 bg-[#001a54] hover:bg-[#001138] text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-[#001a54]/20 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-base">add_task</span>
            <span>Nova Demanda</span>
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
        <div className="flex flex-wrap items-center bg-slate-200/60 p-1.5 rounded-2xl gap-1">
          {(['PENDENTE', 'ATRASADAS', 'CONCLUIDA', 'TODAS'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st 
                  ? 'bg-white text-[#001a54] shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'TODAS' ? 'Todas' : st === 'PENDENTE' ? 'Pendentes' : st === 'ATRASADAS' ? 'Atrasadas' : 'Concluídas'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <select
            value={tipoFilter}
            onChange={e => setTipoFilter(e.target.value)}
            className="p-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 shadow-xs"
          >
            <option value="TODOS">Todos os Tipos</option>
            <option value="EXAME_ADMISSIONAL">Exame Admissional / Periódico</option>
            <option value="CONTRATO">Contrato de Trabalho</option>
            <option value="DOCUMENTACAO">Documentação / CTPS</option>
            <option value="OUTRO">Outras Tarefas</option>
          </select>

          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar demanda..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#001a54] focus:ring-1 focus:ring-[#001a54] shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* LISTA DE DEMANDAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDemandas.length > 0 ? (
          filteredDemandas.map(dem => {
            const isConcluida = dem.status === 'CONCLUIDA';
            const isAtrasada = !isConcluida && dem.data_prevista && dem.data_prevista < hojeStr;

            const badgeConfig: Record<string, { label: string; color: string }> = {
              EXAME_ADMISSIONAL: { label: 'Exame Admissional', color: 'bg-amber-100 text-amber-900 border-amber-200' },
              CONTRATO: { label: 'Contrato CLT', color: 'bg-blue-100 text-blue-900 border-blue-200' },
              DOCUMENTACAO: { label: 'Documentação', color: 'bg-purple-100 text-purple-900 border-purple-200' },
              OUTRO: { label: 'Geral', color: 'bg-slate-100 text-slate-800 border-slate-200' }
            };

            const badge = badgeConfig[dem.tipo] || badgeConfig.OUTRO;

            return (
              <div 
                key={dem.id}
                className={`bg-white rounded-3xl p-5 border shadow-xs transition-all flex items-start justify-between gap-4 ${
                  isConcluida ? 'border-slate-200/60 opacity-75' : isAtrasada ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200/90 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <button
                    onClick={() => onToggleStatusDemanda(dem.id)}
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all mt-0.5 cursor-pointer shrink-0 ${
                      isConcluida ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 hover:border-blue-500 bg-white'
                    }`}
                  >
                    {isConcluida && <span className="material-symbols-outlined text-sm font-bold">check</span>}
                  </button>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${badge.color}`}>
                        {badge.label}
                      </span>
                      {isAtrasada && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                          Atrasada
                        </span>
                      )}
                    </div>

                    <h4 className={`text-xs font-bold text-slate-900 ${isConcluida ? 'line-through text-slate-400' : ''}`}>
                      {dem.descricao}
                    </h4>

                    {dem.funcionario_nome && (
                      <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">person</span>
                        <span>{dem.funcionario_nome}</span>
                      </p>
                    )}

                    {dem.data_prevista && (
                      <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">calendar_today</span>
                        <span>Previsão: {new Date(dem.data_prevista + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => dispararNotificacaoWhatsapp({
                      evento: 'DOCUMENTACAO_PENDENTE',
                      titulo: 'Lembrete de Demanda de RH',
                      dados: {
                        nome: dem.funcionario_nome || 'Colaborador',
                        etapa: badge.label,
                        dataPrevista: dem.data_prevista ? new Date(dem.data_prevista + 'T00:00:00').toLocaleDateString('pt-BR') : 'Imediato',
                        cargo: 'Colaborador'
                      }
                    })}
                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
                    title="Cobrar via WhatsApp"
                  >
                    <i className="fa-brands fa-whatsapp text-base"></i>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 py-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
            <span className="material-symbols-outlined text-4xl block mb-2">task_alt</span>
            <p className="font-semibold text-xs">Nenhuma demanda encontrada com os filtros selecionados.</p>
          </div>
        )}
      </div>

      {/* MODAL NOVA DEMANDA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">add_task</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Nova Demanda de RH</h3>
                  <p className="text-xs text-slate-500 font-medium">Cadastre um checklist de admissão ou tarefa de DP</p>
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
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Tipo de Demanda *</label>
                <select
                  value={formData.tipo || 'EXAME_ADMISSIONAL'}
                  onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="EXAME_ADMISSIONAL">Exame Admissional / ASO</option>
                  <option value="CONTRATO">Elaboração e Assinatura de Contrato</option>
                  <option value="DOCUMENTACAO">Coleta de Documentos / CTPS</option>
                  <option value="OUTRO">Outra Demanda</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Colaborador Vinculado (Opcional)</label>
                <select
                  value={formData.funcionario_id || ''}
                  onChange={e => setFormData({ ...formData, funcionario_id: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="">Nenhum (Tarefa Geral do RH)</option>
                  {funcionarios.map(f => (
                    <option key={f.id} value={f.id}>{f.nome_completo} ({f.cargo})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Descrição da Demanda *</label>
                <input
                  type="text"
                  required
                  value={formData.descricao || ''}
                  onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Ex: Agendar exame admissional na clínica parceira"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Data Prevista de Conclusão</label>
                <input
                  type="date"
                  value={formData.data_prevista || ''}
                  onChange={e => setFormData({ ...formData, data_prevista: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
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
                  <span>Salvar Demanda</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
