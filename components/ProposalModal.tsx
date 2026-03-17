
import React, { useState } from 'react';
import { Proposal } from '../types';

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (proposal: Omit<Proposal, 'id'>) => void;
}

const ProposalModal: React.FC<ProposalModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    cliente: {
      nome: 'EDILMA SANTOS BOMFIM BISPO',
      cpfCnpj: '015.070.045-83',
      dataNascimento: '02/11/1984',
      email: 'edilma@gmail.com',
      telefone: '(79) 9991-96232'
    },
    endereco: {
      cep: '49088-076',
      logradouro: 'Travessa Seis A',
      numero: '33',
      complemento: '',
      bairro: 'Lamarão',
      cidade: 'Aracaju',
      estado: 'SE'
    },
    proposta: {
      corretor: 'Anny',
      categoria: 'SAÚDE PME',
      operadora: 'Hapvida',
      tipoPlano: '02 a 29 vidas',
      unidade: 'Multi Plan'
    },
    financeiro: {
      valorContrato: 1566.62,
      vidas: 4,
      valorTaxa: 20.00,
      parcelas: [
        { id: '1', numero: '1ª Parcela', valor: 1566.62, comissao: 783.31, vencimento: '20/04/2026' }
      ]
    },
    beneficiarios: [
      { id: '1', nome: 'Edilma Santos Bomfim Bispo', cpf: '015.070.045-83', nascimento: '02/11/1984', parentesco: 'Titular' }
    ],
    historico: [
      { id: '1', data: '16/03/26 15:06', responsavel: 'Rafael Sampaio', observacao: 'PP DE HELLEN PORTAL DE KAROL...' }
    ]
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Map back to the simple Proposal type for compatibility with App.tsx
    onSave({
      contrato: 'NOVO',
      data: new Date().toISOString().split('T')[0],
      cliente: formData.cliente.nome,
      cpfCnpj: formData.cliente.cpfCnpj,
      corretor: formData.proposta.corretor,
      operadora: formData.proposta.operadora,
      categoria: formData.proposta.categoria,
      valor: formData.financeiro.valorContrato,
      vidas: formData.financeiro.vidas,
      status: 'CADASTRADO',
      comissao: formData.financeiro.parcelas[0]?.comissao || 0
    });
    onClose();
  };

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

  const Input = ({ label, value, className = "" }: { label: string, value: string, className?: string }) => (
    <div className={`space-y-1 ${className}`}>
      <label className="text-[9px] font-medium text-slate-500 uppercase">{label}</label>
      <div className="w-full p-2 bg-white border border-slate-200 rounded text-[11px] text-slate-700 min-h-[32px]">
        {value}
      </div>
    </div>
  );

  const Select = ({ label, value, className = "" }: { label: string, value: string, className?: string }) => (
    <div className={`space-y-1 ${className}`}>
      <label className="text-[9px] font-medium text-slate-500 uppercase">{label}</label>
      <div className="w-full p-2 bg-white border border-slate-200 rounded text-[11px] text-slate-700 flex justify-between items-center min-h-[32px]">
        {value}
        <i className="fa-solid fa-chevron-down text-[8px] text-slate-400"></i>
      </div>
    </div>
  );

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
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Detalhes da Proposta</h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Visualização e edição de contrato</p>
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
                  <Input label="Nome" value={formData.cliente.nome} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="CPF / CNPJ" value={formData.cliente.cpfCnpj} />
                    <Input label="Data Nascimento" value={formData.cliente.dataNascimento} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Email" value={formData.cliente.email} />
                    <Input label="Telefone" value={formData.cliente.telefone} />
                  </div>
                </div>
              </Card>
            </div>

            {/* Endereço */}
            <div className="lg:col-span-5">
              <Card title="Endereço" icon="fa-location-dot">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="CEP" value={formData.endereco.cep} />
                    <Input label="Endereço" value={formData.endereco.logradouro} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Número" value={formData.endereco.numero} />
                    <Input label="Complemento" value={formData.endereco.complemento} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Input label="Bairro" value={formData.endereco.bairro} className="col-span-1" />
                    <Input label="Cidade" value={formData.endereco.cidade} className="col-span-1" />
                    <Select label="Estado" value={formData.endereco.estado} className="col-span-1" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Dados da Proposta */}
            <div className="lg:col-span-12">
              <Card title="Dados da Proposta" icon="fa-file-lines">
                <div className="grid grid-cols-5 gap-4">
                  <Input label="Corretor" value={formData.proposta.corretor} />
                  <Select label="Categoria" value={formData.proposta.categoria} />
                  <Select label="Operadora" value={formData.proposta.operadora} />
                  <Select label="Tipo de Plano" value={formData.proposta.tipoPlano} />
                  <Select label="Unidade" value={formData.proposta.unidade} />
                </div>
              </Card>
            </div>

            {/* Beneficiários */}
            <div className="lg:col-span-12">
              <Card 
                title="Beneficiários" 
                icon="fa-users" 
                action={
                  <button className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
                    <i className="fa-solid fa-plus"></i> Adicionar
                  </button>
                }
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
                    {formData.beneficiarios.map(b => (
                      <tr key={b.id} className="text-[11px] text-slate-600">
                        <td className="py-3 font-medium">{b.nome}</td>
                        <td className="py-3">{b.cpf}</td>
                        <td className="py-3">{b.nascimento}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold uppercase">{b.parentesco}</span>
                        </td>
                        <td className="py-3 text-right space-x-3">
                          <button className="text-blue-500 font-bold hover:underline">Editar</button>
                          <button className="text-red-500 font-bold hover:underline">Excluir</button>
                        </td>
                      </tr>
                    ))}
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
                      <p className="text-[13px] font-bold text-slate-800">R$ {formData.financeiro.valorContrato.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-[8px] font-medium text-slate-400 uppercase">Vidas</p>
                      <p className="text-[13px] font-bold text-slate-800">{formData.financeiro.vidas}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-[8px] font-medium text-slate-400 uppercase">Valor Taxa</p>
                      <p className="text-[13px] font-bold text-slate-800">R$ {formData.financeiro.valorTaxa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
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
                  <button className="text-[9px] font-bold text-blue-600 uppercase flex items-center gap-1 px-2 py-1 bg-blue-50 rounded border border-blue-100">
                    <i className="fa-solid fa-upload"></i> Adicionar
                  </button>
                }
              >
                <div className="h-[160px] flex flex-col items-center justify-center text-slate-300 gap-2 border border-slate-100 rounded-lg">
                  <p className="text-[10px] font-medium uppercase tracking-wider">Nenhum documento anexado</p>
                </div>
              </Card>
            </div>

            {/* Nova Observação */}
            <div className="lg:col-span-4">
              <Card title="Nova Observação" icon="fa-comment-dots">
                <div className="space-y-4">
                  <textarea 
                    className="w-full h-24 p-3 bg-white border border-slate-200 rounded text-[11px] text-slate-700 outline-none focus:border-blue-400 transition-all resize-none"
                    placeholder="Digite uma observação..."
                  ></textarea>
                  <button className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-bold uppercase transition-all">
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
