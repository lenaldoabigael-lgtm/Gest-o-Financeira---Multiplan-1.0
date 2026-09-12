// components/rh/RhEstagiarios.tsx
import React, { useState, useMemo } from 'react';
import { RhEstagiario } from '../../types';
import { dispararNotificacaoWhatsapp } from '../../lib/rhWhatsapp';

interface RhEstagiariosProps {
  estagiarios: RhEstagiario[];
  onSaveEstagiario: (est: RhEstagiario, isNew: boolean) => void;
  onEfetivarComoClt?: (est: RhEstagiario) => void;
}

export const RhEstagiarios: React.FC<RhEstagiariosProps> = ({
  estagiarios,
  onSaveEstagiario,
  onEfetivarComoClt
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ATIVO' | 'ENCERRADO' | 'TODOS'>('ATIVO');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEst, setEditingEst] = useState<RhEstagiario | null>(null);

  const [formData, setFormData] = useState<Partial<RhEstagiario>>({
    nome_completo: '',
    cpf: '',
    rg: '',
    data_nascimento: '',
    telefone: '',
    email: '',
    instituicao_ensino: 'Unifor',
    curso: 'Administração',
    previsao_termino: '',
    valor_bolsa: 1200,
    supervisor: 'Gestor Comercial',
    data_inicio: new Date().toISOString().split('T')[0],
    status: 'ATIVO'
  });

  const filteredEstagiarios = useMemo(() => {
    return estagiarios.filter(e => {
      const matchStatus = statusFilter === 'TODOS' || e.status === statusFilter;
      const term = searchTerm.toLowerCase();
      const matchSearch = !term ||
        e.nome_completo.toLowerCase().includes(term) ||
        e.cpf.includes(term) ||
        (e.instituicao_ensino && e.instituicao_ensino.toLowerCase().includes(term)) ||
        (e.curso && e.curso.toLowerCase().includes(term));

      return matchStatus && matchSearch;
    });
  }, [estagiarios, statusFilter, searchTerm]);

  const handleOpenNew = () => {
    setEditingEst(null);
    setFormData({
      nome_completo: '',
      cpf: '',
      rg: '',
      data_nascimento: '',
      telefone: '',
      email: '',
      instituicao_ensino: '',
      curso: '',
      previsao_termino: '',
      valor_bolsa: 1200,
      supervisor: 'Gestor Comercial',
      data_inicio: new Date().toISOString().split('T')[0],
      status: 'ATIVO'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (e: RhEstagiario) => {
    setEditingEst(e);
    setFormData({ ...e });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome_completo || !formData.cpf || !formData.data_inicio) {
      alert('Por favor, preencha os campos obrigatórios (Nome, CPF e Data de Início).');
      return;
    }

    const estFinal: RhEstagiario = {
      id: editingEst?.id || crypto.randomUUID(),
      nome_completo: formData.nome_completo.trim(),
      cpf: formData.cpf.trim(),
      rg: formData.rg,
      data_nascimento: formData.data_nascimento,
      telefone: formData.telefone,
      email: formData.email,
      instituicao_ensino: formData.instituicao_ensino,
      curso: formData.curso,
      previsao_termino: formData.previsao_termino,
      valor_bolsa: Number(formData.valor_bolsa) || 0,
      supervisor: formData.supervisor,
      data_inicio: formData.data_inicio,
      status: formData.status || 'ATIVO',
      criado_em: editingEst?.criado_em || new Date().toISOString()
    };

    onSaveEstagiario(estFinal, !editingEst);
    setIsModalOpen(false);
  };

  const hoje = new Date();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#001a54] text-2xl">school</span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Estagiários & Contratos de Estágio</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Acompanhamento de vigência, supervisão acadêmica, bolsas e alertas de término de contrato.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleOpenNew}
            className="px-5 py-2.5 bg-[#001a54] hover:bg-[#001138] text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-[#001a54]/20 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Novo Estagiário</span>
          </button>
        </div>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="flex items-center bg-slate-200/60 p-1.5 rounded-2xl gap-1">
          {(['ATIVO', 'ENCERRADO', 'TODOS'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st 
                  ? 'bg-white text-[#001a54] shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'TODOS' ? 'Todos' : st === 'ATIVO' ? 'Contratos Ativos' : 'Encerrados'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por nome, curso ou instituição..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#001a54] focus:ring-1 focus:ring-[#001a54] shadow-xs"
          />
        </div>
      </div>

      {/* TABELA DE ESTAGIÁRIOS */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="py-3.5 px-4">ESTAGIÁRIO</th>
                <th className="py-3.5 px-4">CURSO & INSTITUIÇÃO</th>
                <th className="py-3.5 px-4">BOLSA AUXÍLIO</th>
                <th className="py-3.5 px-4">PREVISÃO TÉRMINO</th>
                <th className="py-3.5 px-4">SUPERVISOR</th>
                <th className="py-3.5 px-4 text-center">STATUS</th>
                <th className="py-3.5 px-4 text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredEstagiarios.length > 0 ? (
                filteredEstagiarios.map(est => {
                  // Calcular proximidade do fim
                  let terminoAlerta = false;
                  if (est.previsao_termino && est.status === 'ATIVO') {
                    const dt = new Date(est.previsao_termino + 'T00:00:00');
                    const diffDias = (dt.getTime() - hoje.getTime()) / (1000 * 3600 * 24);
                    terminoAlerta = diffDias >= 0 && diffDias <= 60;
                  }

                  return (
                    <tr key={est.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 font-black text-xs flex items-center justify-center shrink-0">
                            {est.nome_completo.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{est.nome_completo}</p>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">CPF: {est.cpf}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 block">{est.curso || 'Não especificado'}</span>
                        <span className="text-[11px] text-slate-500 font-medium">{est.instituicao_ensino || 'Instituição'}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-black text-slate-900">
                          R$ {Number(est.valor_bolsa || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-700">
                            {est.previsao_termino ? new Date(est.previsao_termino + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                          </span>
                          {terminoAlerta && (
                            <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.5 rounded-full" title="Término próximo (menos de 60 dias)">
                              Próximo
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {est.supervisor || '-'}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                          est.status === 'ATIVO' 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {est.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {terminoAlerta && (
                            <button
                              onClick={() => dispararNotificacaoWhatsapp({
                                evento: 'FIM_ESTAGIO',
                                titulo: 'Aviso de Término de Estágio',
                                dados: {
                                  nome: est.nome_completo,
                                  instituicao: est.instituicao_ensino || '',
                                  termino: est.previsao_termino ? new Date(est.previsao_termino + 'T00:00:00').toLocaleDateString('pt-BR') : '',
                                  supervisor: est.supervisor || ''
                                }
                              })}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                              title="Avisar no WhatsApp"
                            >
                              <i className="fa-brands fa-whatsapp text-base"></i>
                            </button>
                          )}

                          {onEfetivarComoClt && est.status === 'ATIVO' && (
                            <button
                              onClick={() => onEfetivarComoClt(est)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                              title="Efetivar como CLT"
                            >
                              <span className="material-symbols-outlined text-base">badge</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEdit(est)}
                            className="p-2 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all"
                            title="Editar Contrato"
                          >
                            <span className="material-symbols-outlined text-base">edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl block mb-2">school</span>
                    <p className="font-semibold text-xs">Nenhum estagiário encontrado com os filtros selecionados.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CADASTRO/EDIÇÃO DE ESTAGIÁRIO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">school</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    {editingEst ? 'Editar Estagiário' : 'Novo Contrato de Estágio'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Dados acadêmicos, supervisor e bolsa-auxílio</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all"
              >
                <i className="fa-solid fa-xmark text-base"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.nome_completo || ''}
                    onChange={e => setFormData({ ...formData, nome_completo: e.target.value })}
                    placeholder="Nome do estagiário"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">CPF *</label>
                  <input
                    type="text"
                    required
                    value={formData.cpf || ''}
                    onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.telefone || ''}
                    onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(85) 99999-9999"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Instituição de Ensino</label>
                  <input
                    type="text"
                    value={formData.instituicao_ensino || ''}
                    onChange={e => setFormData({ ...formData, instituicao_ensino: e.target.value })}
                    placeholder="Ex: UNIFOR, UFC, Estácio"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Curso</label>
                  <input
                    type="text"
                    value={formData.curso || ''}
                    onChange={e => setFormData({ ...formData, curso: e.target.value })}
                    placeholder="Ex: Administração, Marketing"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Bolsa Auxílio (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.valor_bolsa || ''}
                    onChange={e => setFormData({ ...formData, valor_bolsa: Number(e.target.value) })}
                    placeholder="1200.00"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#001a54] focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Supervisor de Estágio</label>
                  <input
                    type="text"
                    value={formData.supervisor || ''}
                    onChange={e => setFormData({ ...formData, supervisor: e.target.value })}
                    placeholder="Nome do supervisor responsável"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Data de Início *</label>
                  <input
                    type="date"
                    required
                    value={formData.data_inicio || ''}
                    onChange={e => setFormData({ ...formData, data_inicio: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Previsão de Término</label>
                  <input
                    type="date"
                    value={formData.previsao_termino || ''}
                    onChange={e => setFormData({ ...formData, previsao_termino: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Status</label>
                  <select
                    value={formData.status || 'ATIVO'}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="ATIVO">ATIVO</option>
                    <option value="ENCERRADO">ENCERRADO</option>
                  </select>
                </div>
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
                  <span>Salvar Estagiário</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
