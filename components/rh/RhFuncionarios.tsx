// components/rh/RhFuncionarios.tsx
import React, { useState, useMemo } from 'react';
import { RhFuncionario, RhDependente, RhRescisao } from '../../types';
import { RhRescisaoModal } from './RhRescisaoModal';

interface RhFuncionariosProps {
  funcionarios: RhFuncionario[];
  onSaveFuncionario: (func: RhFuncionario, isNew: boolean) => void;
  onDeleteFuncionario?: (id: string) => void;
  onDesligarFuncionario: (rescisao: RhRescisao) => void;
}

export const RhFuncionarios: React.FC<RhFuncionariosProps> = ({
  funcionarios,
  onSaveFuncionario,
  onDesligarFuncionario
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ATIVO' | 'AFASTADO' | 'DESLIGADO'>('ATIVO');
  
  // Modal de Cadastro/Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFunc, setEditingFunc] = useState<RhFuncionario | null>(null);

  // Modal de Desligamento / Rescisão
  const [funcionarioParaDesligar, setFuncionarioParaDesligar] = useState<RhFuncionario | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<RhFuncionario>>({
    nome_completo: '',
    cpf: '',
    rg: '',
    data_nascimento: '',
    telefone: '',
    email: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: 'Fortaleza',
    estado: 'CE',
    cargo: 'Analista Comercial',
    setor: 'Comercial',
    data_admissao: new Date().toISOString().split('T')[0],
    salario: 2500,
    jornada: '44h semanais (Segunda a Sexta)',
    banco: 'Santander',
    agencia: '',
    conta: '',
    tipo_conta: 'CORRENTE',
    pis_pasep: '',
    ctps_numero: '',
    ctps_serie: '',
    status: 'ATIVO',
    dependentes: []
  });

  const [dependentesList, setDependentesList] = useState<RhDependente[]>([]);

  // Filtro
  const filteredFuncionarios = useMemo(() => {
    return funcionarios.filter(f => {
      const matchStatus = statusFilter === 'TODOS' || f.status === statusFilter;
      const term = searchTerm.toLowerCase();
      const matchSearch = !term || 
        f.nome_completo.toLowerCase().includes(term) ||
        f.cpf.includes(term) ||
        (f.cargo && f.cargo.toLowerCase().includes(term)) ||
        (f.setor && f.setor.toLowerCase().includes(term));

      return matchStatus && matchSearch;
    });
  }, [funcionarios, statusFilter, searchTerm]);

  // Abrir modal de criação
  const handleOpenNewModal = () => {
    setEditingFunc(null);
    setFormData({
      nome_completo: '',
      cpf: '',
      rg: '',
      data_nascimento: '',
      telefone: '',
      email: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: 'Fortaleza',
      estado: 'CE',
      cargo: 'Analista Comercial',
      setor: 'Comercial',
      data_admissao: new Date().toISOString().split('T')[0],
      salario: 2500,
      jornada: '44h semanais',
      banco: 'Santander',
      agencia: '',
      conta: '',
      tipo_conta: 'CORRENTE',
      pis_pasep: '',
      ctps_numero: '',
      ctps_serie: '',
      status: 'ATIVO',
      dependentes: []
    });
    setDependentesList([]);
    setIsModalOpen(true);
  };

  // Abrir modal de edição
  const handleOpenEditModal = (f: RhFuncionario) => {
    setEditingFunc(f);
    setFormData({ ...f });
    setDependentesList(f.dependentes || []);
    setIsModalOpen(true);
  };

  // Salvar formulário
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome_completo || !formData.cpf || !formData.data_admissao || !formData.salario) {
      alert('Por favor, preencha os campos obrigatórios (Nome, CPF, Data de Admissão e Salário).');
      return;
    }

    const funcionarioFinal: RhFuncionario = {
      id: editingFunc?.id || crypto.randomUUID(),
      nome_completo: formData.nome_completo.trim(),
      cpf: formData.cpf.trim(),
      rg: formData.rg,
      data_nascimento: formData.data_nascimento,
      telefone: formData.telefone,
      email: formData.email,
      cep: formData.cep,
      logradouro: formData.logradouro,
      numero: formData.numero,
      complemento: formData.complemento,
      bairro: formData.bairro,
      cidade: formData.cidade,
      estado: formData.estado,
      cargo: formData.cargo || 'Colaborador',
      setor: formData.setor || 'Geral',
      data_admissao: formData.data_admissao,
      salario: Number(formData.salario) || 0,
      jornada: formData.jornada,
      banco: formData.banco,
      agencia: formData.agencia,
      conta: formData.conta,
      tipo_conta: formData.tipo_conta,
      pis_pasep: formData.pis_pasep,
      ctps_numero: formData.ctps_numero,
      ctps_serie: formData.ctps_serie,
      status: formData.status || 'ATIVO',
      dependentes: dependentesList,
      atualizado_em: new Date().toISOString()
    };

    onSaveFuncionario(funcionarioFinal, !editingFunc);
    setIsModalOpen(false);
  };

  // Dependentes Handlers
  const handleAddDependente = () => {
    setDependentesList(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        nome: '',
        parentesco: 'FILHO(A)',
        data_nascimento: '',
        cpf: ''
      }
    ]);
  };

  const handleUpdateDependente = (id: string, field: keyof RhDependente, value: string) => {
    setDependentesList(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const handleRemoveDependente = (id: string) => {
    setDependentesList(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER E FILTROS */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#001a54] text-2xl">badge</span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Gestão de Funcionários CLT</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Cadastro completo, dependentes, histórico salarial e gestão de desligamentos.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleOpenNewModal}
            className="px-5 py-2.5 bg-[#001a54] hover:bg-[#001138] text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-[#001a54]/20 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            <span>Novo Funcionário</span>
          </button>
        </div>
      </div>

      {/* BARRA DE PESQUISA E ABAS DE STATUS */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        
        {/* Status Pills */}
        <div className="flex items-center bg-slate-200/60 p-1.5 rounded-2xl gap-1">
          {(['ATIVO', 'AFASTADO', 'DESLIGADO', 'TODOS'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st 
                  ? 'bg-white text-[#001a54] shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'TODOS' ? 'Todos' : st === 'ATIVO' ? 'Ativos' : st === 'AFASTADO' ? 'Afastados' : 'Desligados'}
            </button>
          ))}
        </div>

        {/* Input de Busca */}
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por nome, cargo ou CPF..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#001a54] focus:ring-1 focus:ring-[#001a54] shadow-xs"
          />
        </div>
      </div>

      {/* TABELA DE FUNCIONÁRIOS */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="py-3.5 px-4">COLABORADOR</th>
                <th className="py-3.5 px-4">CARGO & SETOR</th>
                <th className="py-3.5 px-4">SALÁRIO BASE</th>
                <th className="py-3.5 px-4">ADMISSÃO</th>
                <th className="py-3.5 px-4 text-center">STATUS</th>
                <th className="py-3.5 px-4 text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredFuncionarios.length > 0 ? (
                filteredFuncionarios.map(func => {
                  const statusColors = {
                    ATIVO: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                    AFASTADO: 'bg-amber-100 text-amber-800 border-amber-200',
                    DESLIGADO: 'bg-rose-100 text-rose-800 border-rose-200'
                  };

                  return (
                    <tr key={func.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Nome e CPF */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">
                            {func.nome_completo.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{func.nome_completo}</p>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">CPF: {func.cpf}</p>
                          </div>
                        </div>
                      </td>

                      {/* Cargo & Setor */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 block">{func.cargo}</span>
                        <span className="text-[11px] text-slate-500 font-medium">{func.setor || 'Geral'}</span>
                      </td>

                      {/* Salário */}
                      <td className="py-3.5 px-4">
                        <span className="font-black text-slate-900">
                          R$ {func.salario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        {func.dependentes && func.dependentes.length > 0 && (
                          <span className="text-[10px] text-blue-600 block font-medium">
                            {func.dependentes.length} dependente(s)
                          </span>
                        )}
                      </td>

                      {/* Admissão */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {func.data_admissao ? new Date(func.data_admissao + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${statusColors[func.status]}`}>
                          {func.status}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(func)}
                            className="p-2 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
                            title="Editar Cadastro"
                          >
                            <span className="material-symbols-outlined text-base">edit</span>
                          </button>

                          {func.status === 'ATIVO' && (
                            <button
                              onClick={() => setFuncionarioParaDesligar(func)}
                              className="p-2 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                              title="Desligar e Calcular Rescisão"
                            >
                              <span className="material-symbols-outlined text-base">person_cancel</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl block mb-2">person_search</span>
                    <p className="font-semibold text-xs">Nenhum funcionário encontrado com os filtros selecionados.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header Modal */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">{editingFunc ? 'edit' : 'person_add'}</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    {editingFunc ? 'Editar Funcionário' : 'Novo Funcionário CLT'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Preencha os dados contratuais, bancários e dependentes</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all"
              >
                <i className="fa-solid fa-xmark text-base"></i>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* 1. DADOS PESSOAIS */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-[#001a54] uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">person</span>
                  <span>1. Dados Pessoais</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      value={formData.nome_completo || ''}
                      onChange={e => setFormData({ ...formData, nome_completo: e.target.value })}
                      placeholder="Ex: João da Silva Santos"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">RG</label>
                    <input
                      type="text"
                      value={formData.rg || ''}
                      onChange={e => setFormData({ ...formData, rg: e.target.value })}
                      placeholder="Número do RG"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Data de Nascimento</label>
                    <input
                      type="date"
                      value={formData.data_nascimento || ''}
                      onChange={e => setFormData({ ...formData, data_nascimento: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      value={formData.telefone || ''}
                      onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                      placeholder="(85) 99999-9999"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 2. DADOS CONTRATUAIS */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-black text-[#001a54] uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">work</span>
                  <span>2. Dados Contratuais & Salário</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Cargo *</label>
                    <input
                      type="text"
                      required
                      value={formData.cargo || ''}
                      onChange={e => setFormData({ ...formData, cargo: e.target.value })}
                      placeholder="Ex: Consultor Comercial"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Setor</label>
                    <input
                      type="text"
                      value={formData.setor || ''}
                      onChange={e => setFormData({ ...formData, setor: e.target.value })}
                      placeholder="Ex: Comercial / Financeiro"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Salário Base (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.salario || ''}
                      onChange={e => setFormData({ ...formData, salario: Number(e.target.value) })}
                      placeholder="Ex: 3000.00"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#001a54] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Data de Admissão *</label>
                    <input
                      type="date"
                      required
                      value={formData.data_admissao || ''}
                      onChange={e => setFormData({ ...formData, data_admissao: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">PIS / PASEP</label>
                    <input
                      type="text"
                      value={formData.pis_pasep || ''}
                      onChange={e => setFormData({ ...formData, pis_pasep: e.target.value })}
                      placeholder="Número do PIS"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">CTPS Número</label>
                    <input
                      type="text"
                      value={formData.ctps_numero || ''}
                      onChange={e => setFormData({ ...formData, ctps_numero: e.target.value })}
                      placeholder="Número CTPS"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">CTPS Série</label>
                    <input
                      type="text"
                      value={formData.ctps_serie || ''}
                      onChange={e => setFormData({ ...formData, ctps_serie: e.target.value })}
                      placeholder="Série CTPS"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Status</label>
                    <select
                      value={formData.status || 'ATIVO'}
                      onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="ATIVO">ATIVO</option>
                      <option value="AFASTADO">AFASTADO</option>
                      <option value="DESLIGADO">DESLIGADO</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. DADOS BANCÁRIOS */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-black text-[#001a54] uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">account_balance</span>
                  <span>3. Dados Bancários para Pagamento</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Banco</label>
                    <input
                      type="text"
                      value={formData.banco || ''}
                      onChange={e => setFormData({ ...formData, banco: e.target.value })}
                      placeholder="Ex: Santander / Nubank"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Agência</label>
                    <input
                      type="text"
                      value={formData.agencia || ''}
                      onChange={e => setFormData({ ...formData, agencia: e.target.value })}
                      placeholder="Ex: 0123"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Conta & Dígito</label>
                    <input
                      type="text"
                      value={formData.conta || ''}
                      onChange={e => setFormData({ ...formData, conta: e.target.value })}
                      placeholder="Ex: 12345-6"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Tipo de Conta</label>
                    <select
                      value={formData.tipo_conta || 'CORRENTE'}
                      onChange={e => setFormData({ ...formData, tipo_conta: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="CORRENTE">Conta Corrente</option>
                      <option value="POUPANCA">Conta Poupança</option>
                      <option value="SALARIO">Conta Salário</option>
                      <option value="PIX">Chave PIX</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 4. DEPENDENTES */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-[#001a54] uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">family_restroom</span>
                    <span>4. Dependentes Legais ({dependentesList.length})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddDependente}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    <span>Adicionar Dependente</span>
                  </button>
                </div>

                {dependentesList.length > 0 ? (
                  <div className="space-y-2.5">
                    {dependentesList.map((dep, idx) => (
                      <div key={dep.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Nome do Dependente</label>
                          <input
                            type="text"
                            value={dep.nome}
                            onChange={e => handleUpdateDependente(dep.id, 'nome', e.target.value)}
                            placeholder="Nome completo"
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Parentesco</label>
                          <select
                            value={dep.parentesco || 'FILHO(A)'}
                            onChange={e => handleUpdateDependente(dep.id, 'parentesco', e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                          >
                            <option value="FILHO(A)">Filho(a)</option>
                            <option value="CONJUGE">Cônjuge / Companheiro(a)</option>
                            <option value="PAI_MAE">Pai / Mãe</option>
                            <option value="OUTRO">Outro</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Data Nascimento</label>
                          <input
                            type="date"
                            value={dep.data_nascimento || ''}
                            onChange={e => handleUpdateDependente(dep.id, 'data_nascimento', e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-4 md:pt-0">
                          <input
                            type="text"
                            value={dep.cpf || ''}
                            onChange={e => handleUpdateDependente(dep.id, 'cpf', e.target.value)}
                            placeholder="CPF (opcional)"
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveDependente(dep.id)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            title="Remover dependente"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic bg-slate-50/50 p-3 rounded-xl border border-dashed border-slate-200 text-center">
                    Nenhum dependente cadastrado para este colaborador.
                  </p>
                )}
              </div>

              {/* Botões do Formulário */}
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
                  <span>{editingFunc ? 'Salvar Alterações' : 'Cadastrar Funcionário'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL DE RESCISÃO / DESLIGAMENTO */}
      {funcionarioParaDesligar && (
        <RhRescisaoModal
          isOpen={!!funcionarioParaDesligar}
          onClose={() => setFuncionarioParaDesligar(null)}
          funcionario={funcionarioParaDesligar}
          onConfirmRescisao={(rescisao) => {
            onDesligarFuncionario(rescisao);
            setFuncionarioParaDesligar(null);
          }}
        />
      )}

    </div>
  );
};
