
import React, { useState } from 'react';
import { Proposal, ProposalRequirement } from '../types';

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (proposal: Omit<Proposal, 'id'>) => void;
  requirements: ProposalRequirement[];
  proposal?: Proposal | null;
}

const Card = ({ title, icon, children, action }: { title: string, icon: string, children: React.ReactNode, action?: React.ReactNode }) => (
  <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <i className={`fa-solid ${icon} text-blue-500 text-xs`}></i>
        <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-tight">{title}</h3>
      </div>
      {action}
    </div>
    <div className="p-4">
      {children}
    </div>
  </div>
);

const Input = ({ label, value, onChange, type = "text", className = "" }: { label: string, value: string | number, onChange: (val: string) => void, type?: string, className?: string }) => (
  <div className={`space-y-1 ${className}`}>
    <label className="text-[9px] font-medium text-slate-500 uppercase">{label}</label>
    <input 
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-2 bg-white border border-slate-200 rounded text-[11px] text-slate-700 outline-none focus:border-blue-400 transition-all"
    />
  </div>
);

const Select = ({ label, value, options, onChange, className = "" }: { label: string, value: string, options: string[], onChange: (val: string) => void, className?: string }) => (
  <div className={`space-y-1 ${className}`}>
    <label className="text-[9px] font-medium text-slate-500 uppercase">{label}</label>
    <select 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-2 bg-white border border-slate-200 rounded text-[11px] text-slate-700 outline-none focus:border-blue-400 transition-all appearance-none cursor-pointer"
    >
      <option value="">Selecione...</option>
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

const ProposalModal: React.FC<ProposalModalProps> = ({ isOpen, onClose, onSave, requirements, proposal }) => {
  const initialData = {
    cliente: {
      nome: '',
      cpfCnpj: '',
      dataNascimento: '',
      email: '',
      telefone: ''
    },
    endereco: {
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: ''
    },
    proposta: {
      contrato: '',
      dataVenda: new Date().toISOString().split('T')[0],
      corretor: '',
      categoria: '',
      operadora: '',
      tipoPlano: '',
      unidade: ''
    },
    financeiro: {
      valorContrato: 0,
      vidas: 0,
      valorTaxa: 0,
      parcelas: [
        { id: '1', numero: '1ª Parcela', valor: 0, comissao: 0, vencimento: '' }
      ]
    },
    beneficiarios: [] as { id: string, nome: string, cpf: string, nascimento: string, parentesco: string }[],
    documentos: [] as { id: string, nome: string, data: string, tamanho: string }[],
    historico: [] as any[]
  };

  const [formData, setFormData] = useState(initialData);
  const [newObservation, setNewObservation] = useState('');
  const [newBeneficiaryInput, setNewBeneficiaryInput] = useState({
    nome: '',
    cpf: '',
    nascimento: '',
    parentesco: 'Titular'
  });

  const handleAddNote = () => {
    if (!newObservation.trim()) return;
    const note = {
      id: Math.random().toString(36).substr(2, 9),
      data: new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }),
      responsavel: 'Rafael Sampaio', // Mock current user
      observacao: newObservation
    };
    setFormData(prev => ({
      ...prev,
      historico: [note, ...prev.historico]
    }));
    setNewObservation('');
  };

  const handleAddBeneficiary = () => {
    if (!newBeneficiaryInput.nome) return;

    const newBeneficiary = {
      id: Math.random().toString(36).substr(2, 9),
      ...newBeneficiaryInput
    };

    setFormData(prev => ({
      ...prev,
      beneficiarios: [...prev.beneficiarios, newBeneficiary]
    }));

    setNewBeneficiaryInput({
      nome: '',
      cpf: '',
      nascimento: '',
      parentesco: 'Titular'
    });
  };

  const handleDeleteBeneficiary = (id: string) => {
    setFormData(prev => ({
      ...prev,
      beneficiarios: prev.beneficiarios.filter(b => b.id !== id)
    }));
  };

  const handleUpdateBeneficiary = (id: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      beneficiarios: prev.beneficiarios.map(b => b.id === id ? { ...b, [field]: value } : b)
    }));
  };

  const handleAddDocument = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const newDoc = {
          id: Math.random().toString(36).substr(2, 9),
          nome: file.name,
          data: new Date().toLocaleDateString('pt-BR'),
          tamanho: (file.size / 1024).toFixed(1) + ' KB'
        };
        setFormData(prev => ({
          ...prev,
          documentos: [...prev.documentos, newDoc]
        }));
      }
    };
    input.click();
  };

  const handleDeleteDocument = (id: string) => {
    setFormData(prev => ({
      ...prev,
      documentos: prev.documentos.filter(d => d.id !== id)
    }));
  };

  React.useEffect(() => {
    if (isOpen) {
      if (proposal) {
        if (proposal.detalhes) {
          setFormData(proposal.detalhes);
        } else {
          setFormData({
            ...initialData,
            cliente: {
              ...initialData.cliente,
              nome: proposal.cliente,
              cpfCnpj: proposal.cpfCnpj
            },
            proposta: {
              contrato: proposal.contrato,
              dataVenda: proposal.data,
              corretor: proposal.corretor,
              categoria: proposal.categoria,
              operadora: proposal.operadora,
              tipoPlano: '', // Not in Proposal type
              unidade: '' // Not in Proposal type
            },
            financeiro: {
              ...initialData.financeiro,
              valorContrato: proposal.valor,
              vidas: proposal.vidas,
              parcelas: [
                { id: '1', numero: '1ª Parcela', valor: proposal.valor, comissao: proposal.comissao, vencimento: proposal.data }
              ]
            }
          });
        }
      } else {
        setFormData(initialData);
      }
    }
  }, [isOpen, proposal]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      contrato: formData.proposta.contrato || 'NOVO',
      data: formData.proposta.dataVenda || new Date().toISOString().split('T')[0],
      cliente: formData.cliente.nome,
      cpfCnpj: formData.cliente.cpfCnpj,
      corretor: formData.proposta.corretor,
      operadora: formData.proposta.operadora,
      categoria: formData.proposta.categoria,
      valor: Number(formData.financeiro.valorContrato) || 0,
      vidas: Number(formData.financeiro.vidas) || 0,
      status: proposal?.status || 'CADASTRADA',
      comissao: Number(formData.financeiro.parcelas[0]?.comissao) || 0,
      detalhes: formData
    });
    onClose();
  };

  const getOptions = (tipo: ProposalRequirement['tipo']) => {
    return requirements.filter(r => r.tipo === tipo).map(r => r.nome);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-300">
      <div className="bg-[#f8fafc] w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-white px-8 py-4 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <i className="fa-solid fa-file-invoice text-lg"></i>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">
                {proposal ? 'Editar Proposta' : 'Nova Proposta'}
              </h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {proposal ? 'Edição de contrato existente' : 'Cadastro de novo contrato'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
              Fechar
            </button>
            <button onClick={handleSubmit} className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20">
              Salvar Alterações
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#f1f5f9]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Dados do Cliente */}
            <div className="lg:col-span-7">
              <Card title="Dados do Cliente" icon="fa-user">
                <div className="space-y-4">
                  <Input 
                    label="Nome" 
                    value={formData.cliente.nome} 
                    onChange={(val) => setFormData(prev => ({ ...prev, cliente: { ...prev.cliente, nome: val } }))}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      label="CPF / CNPJ" 
                      value={formData.cliente.cpfCnpj} 
                      onChange={(val) => setFormData(prev => ({ ...prev, cliente: { ...prev.cliente, cpfCnpj: val } }))}
                    />
                    <Input 
                      label="Data Nascimento" 
                      value={formData.cliente.dataNascimento} 
                      onChange={(val) => setFormData(prev => ({ ...prev, cliente: { ...prev.cliente, dataNascimento: val } }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      label="Email" 
                      value={formData.cliente.email} 
                      onChange={(val) => setFormData(prev => ({ ...prev, cliente: { ...prev.cliente, email: val } }))}
                    />
                    <Input 
                      label="Telefone" 
                      value={formData.cliente.telefone} 
                      onChange={(val) => setFormData(prev => ({ ...prev, cliente: { ...prev.cliente, telefone: val } }))}
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* Endereço */}
            <div className="lg:col-span-5">
              <Card title="Endereço" icon="fa-location-dot">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      label="CEP" 
                      value={formData.endereco.cep} 
                      onChange={(val) => setFormData(prev => ({ ...prev, endereco: { ...prev.endereco, cep: val } }))}
                    />
                    <Input 
                      label="Endereço" 
                      value={formData.endereco.logradouro} 
                      onChange={(val) => setFormData(prev => ({ ...prev, endereco: { ...prev.endereco, logradouro: val } }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      label="Número" 
                      value={formData.endereco.numero} 
                      onChange={(val) => setFormData(prev => ({ ...prev, endereco: { ...prev.endereco, numero: val } }))}
                    />
                    <Input 
                      label="Complemento" 
                      value={formData.endereco.complemento} 
                      onChange={(val) => setFormData(prev => ({ ...prev, endereco: { ...prev.endereco, complemento: val } }))}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Input 
                      label="Bairro" 
                      value={formData.endereco.bairro} 
                      className="col-span-1" 
                      onChange={(val) => setFormData(prev => ({ ...prev, endereco: { ...prev.endereco, bairro: val } }))}
                    />
                    <Input 
                      label="Cidade" 
                      value={formData.endereco.cidade} 
                      className="col-span-1" 
                      onChange={(val) => setFormData(prev => ({ ...prev, endereco: { ...prev.endereco, cidade: val } }))}
                    />
                    <Select 
                      label="Estado" 
                      value={formData.endereco.estado} 
                      className="col-span-1" 
                      options={['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']}
                      onChange={(val) => setFormData(prev => ({ ...prev, endereco: { ...prev.endereco, estado: val } }))}
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* Dados da Proposta */}
            <div className="lg:col-span-12">
              <Card title="Dados da Proposta" icon="fa-file-lines">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      label="Nº Contrato" 
                      value={formData.proposta.contrato} 
                      onChange={(val) => setFormData(prev => ({ ...prev, proposta: { ...prev.proposta, contrato: val } }))}
                    />
                    <Input 
                      label="Dt Venda" 
                      type="date"
                      value={formData.proposta.dataVenda} 
                      onChange={(val) => setFormData(prev => ({ ...prev, proposta: { ...prev.proposta, dataVenda: val } }))}
                    />
                  </div>
                  <div className="grid grid-cols-5 gap-4">
                    <Select 
                      label="Corretor" 
                      value={formData.proposta.corretor} 
                      options={getOptions('CORRETOR')}
                      onChange={(val) => setFormData(prev => ({ ...prev, proposta: { ...prev.proposta, corretor: val } }))}
                    />
                    <Select 
                      label="Categoria" 
                      value={formData.proposta.categoria} 
                      options={getOptions('CATEGORIA')}
                      onChange={(val) => setFormData(prev => ({ ...prev, proposta: { ...prev.proposta, categoria: val } }))}
                    />
                    <Select 
                      label="Operadora" 
                      value={formData.proposta.operadora} 
                      options={getOptions('OPERADORA')}
                      onChange={(val) => setFormData(prev => ({ ...prev, proposta: { ...prev.proposta, operadora: val } }))}
                    />
                    <Select 
                      label="Tipo de Plano" 
                      value={formData.proposta.tipoPlano} 
                      options={getOptions('TIPO_PLANO')}
                      onChange={(val) => setFormData(prev => ({ ...prev, proposta: { ...prev.proposta, tipoPlano: val } }))}
                    />
                    <Select 
                      label="Unidade" 
                      value={formData.proposta.unidade} 
                      options={getOptions('UNIDADE')}
                      onChange={(val) => setFormData(prev => ({ ...prev, proposta: { ...prev.proposta, unidade: val } }))}
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* Beneficiários */}
            <div className="lg:col-span-12">
              <Card 
                title="Beneficiários" 
                icon="fa-users" 
              >
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="pb-3">Nome</th>
                      <th className="pb-3">CPF</th>
                      <th className="pb-3">Nascimento</th>
                      <th className="pb-3">Parentesco</th>
                      <th className="pb-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {/* Input Row for New Beneficiary */}
                    <tr className="bg-blue-50/30">
                      <td className="py-2">
                        <input 
                          type="text"
                          placeholder="Novo Nome..."
                          value={newBeneficiaryInput.nome}
                          onChange={(e) => setNewBeneficiaryInput(prev => ({ ...prev, nome: e.target.value }))}
                          className="w-full bg-white border border-blue-100 p-1 text-[11px] text-slate-700 outline-none focus:ring-1 focus:ring-blue-400 rounded"
                        />
                      </td>
                      <td className="py-2">
                        <input 
                          type="text"
                          placeholder="CPF..."
                          value={newBeneficiaryInput.cpf}
                          onChange={(e) => setNewBeneficiaryInput(prev => ({ ...prev, cpf: e.target.value }))}
                          className="w-full bg-white border border-blue-100 p-1 text-[11px] text-slate-700 outline-none focus:ring-1 focus:ring-blue-400 rounded"
                        />
                      </td>
                      <td className="py-2">
                        <input 
                          type="text"
                          placeholder="DD/MM/AAAA"
                          value={newBeneficiaryInput.nascimento}
                          onChange={(e) => setNewBeneficiaryInput(prev => ({ ...prev, nascimento: e.target.value }))}
                          className="w-full bg-white border border-blue-100 p-1 text-[11px] text-slate-700 outline-none focus:ring-1 focus:ring-blue-400 rounded"
                        />
                      </td>
                      <td className="py-2">
                        <select 
                          value={newBeneficiaryInput.parentesco}
                          onChange={(e) => setNewBeneficiaryInput(prev => ({ ...prev, parentesco: e.target.value }))}
                          className="w-full bg-white border border-blue-100 p-1 text-[11px] text-slate-700 outline-none focus:ring-1 focus:ring-blue-400 rounded appearance-none cursor-pointer"
                        >
                          <option value="Titular">Titular</option>
                          <option value="Cônjuge">Cônjuge</option>
                          <option value="Filho(a)">Filho(a)</option>
                          <option value="Pai/Mãe">Pai/Mãe</option>
                          <option value="Outros">Outros</option>
                        </select>
                      </td>
                      <td className="py-2 text-right">
                        <button 
                          onClick={handleAddBeneficiary}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all"
                        >
                          Adicionar
                        </button>
                      </td>
                    </tr>

                    {formData.beneficiarios.map(b => (
                      <tr key={b.id} className="text-[11px] text-slate-600">
                        <td className="py-2">
                          <input 
                            type="text"
                            value={b.nome}
                            onChange={(e) => handleUpdateBeneficiary(b.id, 'nome', e.target.value)}
                            className="w-full bg-transparent border-none p-1 text-[11px] text-slate-700 outline-none focus:ring-1 focus:ring-blue-200 rounded"
                          />
                        </td>
                        <td className="py-2">
                          <input 
                            type="text"
                            value={b.cpf}
                            onChange={(e) => handleUpdateBeneficiary(b.id, 'cpf', e.target.value)}
                            className="w-full bg-transparent border-none p-1 text-[11px] text-slate-700 outline-none focus:ring-1 focus:ring-blue-200 rounded"
                          />
                        </td>
                        <td className="py-2">
                          <input 
                            type="text"
                            value={b.nascimento}
                            onChange={(e) => handleUpdateBeneficiary(b.id, 'nascimento', e.target.value)}
                            className="w-full bg-transparent border-none p-1 text-[11px] text-slate-700 outline-none focus:ring-1 focus:ring-blue-200 rounded"
                          />
                        </td>
                        <td className="py-2">
                          <select 
                            value={b.parentesco}
                            onChange={(e) => handleUpdateBeneficiary(b.id, 'parentesco', e.target.value)}
                            className="w-full bg-transparent border-none p-1 text-[11px] text-slate-700 outline-none focus:ring-1 focus:ring-blue-200 rounded appearance-none"
                          >
                            <option value="Titular">Titular</option>
                            <option value="Cônjuge">Cônjuge</option>
                            <option value="Filho(a)">Filho(a)</option>
                            <option value="Pai/Mãe">Pai/Mãe</option>
                            <option value="Outros">Outros</option>
                          </select>
                        </td>
                        <td className="py-2 text-right">
                          <button 
                            onClick={() => handleDeleteBeneficiary(b.id)}
                            className="text-red-500 font-bold hover:underline px-2"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                    {formData.beneficiarios.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                          Nenhum beneficiário cadastrado
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Card>
            </div>

            {/* Financeiro */}
            <div className="lg:col-span-6">
              <Card title="Financeiro" icon="fa-dollar-sign">
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4 bg-[#f8fafc] p-4 rounded-lg border border-slate-100">
                    <div className="text-left">
                      <p className="text-[8px] font-medium text-slate-400 uppercase">Valor Contrato</p>
                      <input 
                        type="number"
                        value={formData.financeiro.valorContrato}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setFormData(prev => ({ 
                            ...prev, 
                            financeiro: { 
                              ...prev.financeiro, 
                              valorContrato: val,
                              parcelas: prev.financeiro.parcelas.map((p, i) => i === 0 ? { ...p, valor: val, comissao: Math.max(0, val - prev.financeiro.valorTaxa) } : p)
                            } 
                          }));
                        }}
                        className="w-full bg-transparent border-none p-0 text-[13px] font-bold text-slate-800 outline-none focus:ring-0"
                      />
                    </div>
                    <div className="text-left">
                      <p className="text-[8px] font-medium text-slate-400 uppercase">Vidas</p>
                      <input 
                        type="number"
                        value={formData.financeiro.vidas}
                        onChange={(e) => setFormData(prev => ({ ...prev, financeiro: { ...prev.financeiro, vidas: parseInt(e.target.value) || 0 } }))}
                        className="w-full bg-transparent border-none p-0 text-[13px] font-bold text-slate-800 outline-none focus:ring-0"
                      />
                    </div>
                    <div className="text-left">
                      <p className="text-[8px] font-medium text-slate-400 uppercase">Valor Taxa</p>
                      <input 
                        type="number"
                        value={formData.financeiro.valorTaxa}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setFormData(prev => ({ 
                            ...prev, 
                            financeiro: { 
                              ...prev.financeiro, 
                              valorTaxa: val,
                              parcelas: prev.financeiro.parcelas.map((p, i) => i === 0 ? { ...p, comissao: Math.max(0, prev.financeiro.valorContrato - val) } : p)
                            } 
                          }));
                        }}
                        className="w-full bg-transparent border-none p-0 text-[13px] font-bold text-slate-800 outline-none focus:ring-0"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Parcelas</p>
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[9px] font-bold text-slate-400 uppercase border-b border-slate-100">
                          <th className="pb-2">Parcela</th>
                          <th className="pb-2">Valor</th>
                          <th className="pb-2">Comissão</th>
                          <th className="pb-2">Vencimento</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {formData.financeiro.parcelas.map(p => (
                          <tr key={p.id} className="text-[11px] text-slate-600">
                            <td className="py-2.5">{p.numero}</td>
                            <td className="py-2.5">R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="py-2.5 font-bold text-emerald-600">R$ {p.comissao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="py-2.5">{p.vencimento}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            </div>

            {/* Documentos */}
            <div className="lg:col-span-6">
              <Card 
                title="Documentos" 
                icon="fa-paperclip"
                action={
                  <button 
                    onClick={handleAddDocument}
                    className="text-[9px] font-bold text-blue-600 uppercase flex items-center gap-1 px-2 py-1 bg-blue-50 rounded border border-blue-100"
                  >
                    <i className="fa-solid fa-upload"></i> Adicionar
                  </button>
                }
              >
                <div className="space-y-2">
                  {formData.documentos.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100 group">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-file-pdf text-red-500"></i>
                        <div>
                          <p className="text-[10px] font-bold text-slate-700 truncate max-w-[150px]">{doc.nome}</p>
                          <p className="text-[8px] text-slate-400 font-medium">{doc.data} • {doc.tamanho}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-blue-500 hover:text-blue-700">
                          <i className="fa-solid fa-download text-[10px]"></i>
                        </button>
                        <button 
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <i className="fa-solid fa-trash text-[10px]"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                  {formData.documentos.length === 0 && (
                    <div className="h-[160px] flex flex-col items-center justify-center text-slate-300 gap-2 border border-slate-100 rounded-lg">
                      <p className="text-[10px] font-medium uppercase tracking-wider">Nenhum documento anexado</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Nova Observação */}
            <div className="lg:col-span-4">
              <Card title="Nova Observação" icon="fa-comment-dots">
                <div className="space-y-4">
                  <textarea 
                    value={newObservation}
                    onChange={(e) => setNewObservation(e.target.value)}
                    className="w-full h-24 p-3 bg-white border border-slate-200 rounded text-[11px] text-slate-700 outline-none focus:border-blue-400 transition-all resize-none"
                    placeholder="Digite uma observação..."
                  ></textarea>
                  <button 
                    onClick={handleAddNote}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-bold uppercase transition-all"
                  >
                    Adicionar Nota
                  </button>
                </div>
              </Card>
            </div>

            {/* Histórico */}
            <div className="lg:col-span-8">
              <Card title="Histórico" icon="fa-clock-rotate-left">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[9px] font-bold text-slate-400 uppercase border-b border-slate-100">
                      <th className="pb-2">Data</th>
                      <th className="pb-2">Responsável</th>
                      <th className="pb-2">Observação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {formData.historico.map(h => (
                      <tr key={h.id} className="text-[10px] text-slate-600">
                        <td className="py-2.5 whitespace-nowrap">{h.data}</td>
                        <td className="py-2.5 font-bold text-slate-700">{h.responsavel}</td>
                        <td className="py-2.5 truncate max-w-[200px]">{h.observacao}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalModal;
