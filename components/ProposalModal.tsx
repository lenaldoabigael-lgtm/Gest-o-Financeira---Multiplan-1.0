import React, { useState, useRef } from 'react';
import { Proposal, ProposalRequirement, User } from '../types';

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (proposal: Omit<Proposal, 'id'>) => void;
  requirements: ProposalRequirement[];
  proposal?: Proposal | null;
  user: User;
}

const formatCpfCnpj = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  } else {
    return digits
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  }
};

const validateCpfCnpj = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return false;

  if (digits.length === 11) {
    if (/^(\d)\1+$/.test(digits)) return false;
    let sum = 0;
    let remainder;
    for (let i = 1; i <= 9; i++) sum += parseInt(digits.substring(i - 1, i)) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(digits.substring(9, 10))) return false;
    
    sum = 0;
    for (let i = 1; i <= 10; i++) sum += parseInt(digits.substring(i - 1, i)) * (12 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(digits.substring(10, 11))) return false;
    return true;
  } else if (digits.length === 14) {
    if (/^(\d)\1+$/.test(digits)) return false;
    let size = digits.length - 2;
    let numbers = digits.substring(0, size);
    const digitsCNPJ = digits.substring(size);
    let sum = 0;
    let pos = size - 7;
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result !== parseInt(digitsCNPJ.charAt(0))) return false;
    
    size = size + 1;
    numbers = digits.substring(0, size);
    sum = 0;
    pos = size - 7;
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    let result2 = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result2 !== parseInt(digitsCNPJ.charAt(1))) return false;
    return true;
  }
  return false;
};

const formatDate = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) {
    return digits;
  } else if (digits.length <= 4) {
    return digits.replace(/(\d{2})(\d)/, '$1/$2');
  } else {
    return digits.replace(/(\d{2})(\d{2})(\d{1,4})/, '$1/$2/$3').slice(0, 10);
  }
};

const ProposalModal: React.FC<ProposalModalProps> = ({ isOpen, onClose, onSave, requirements, proposal, user }) => {
  const [alertMessage, setAlertMessage] = useState('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    cliente: true,
    endereco: true,
    proposta: true,
    beneficiarios: true,
    financeiro: true,
    documentos: true,
    historico: true
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

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
      corretor: user.name || '',
      categoria: '',
      operadora: '',
      tipoPlano: '',
      unidade: '',
      pagamentoCartao: false
    },
    beneficiarios: [] as Array<{
      id: string;
      nome: string;
      cpf: string;
      nascimento: string;
      parentesco: string;
      titularPlanoSaude?: boolean;
    }>,
    financeiro: {
      valorContrato: 0,
      vidas: 0,
      valorTaxa: 0,
      parcelas: [
        { id: '1', numero: '1ª Parcela', valor: 0, comissao: 0, vencimento: new Date().toLocaleDateString('pt-BR') }
      ]
    },
    documentos: [] as Array<{
      id: string;
      nome: string;
      data: string;
      tamanho: string;
      url?: string;
    }>,
    historico: [] as Array<{
      id: string;
      data: string;
      responsavel: string;
      observacao: string;
    }>
  };

  const [formData, setFormData] = useState(initialData);
  const [newObservation, setNewObservation] = useState('');
  const [newBeneficiaryInput, setNewBeneficiaryInput] = useState({
    nome: '',
    cpf: '',
    nascimento: '',
    parentesco: 'Titular',
    titularPlanoSaude: false
  });

  const handleAddNote = () => {
    if (!newObservation.trim()) return;
    const newNote = {
      id: Math.random().toString(36).substr(2, 9),
      data: new Date().toLocaleString('pt-BR'),
      responsavel: user.name || 'Usuário',
      observacao: newObservation.trim()
    };
    setFormData(prev => ({
      ...prev,
      historico: [newNote, ...prev.historico]
    }));
    setNewObservation('');
  };

  const handleAddBeneficiary = () => {
    if (!newBeneficiaryInput.nome.trim()) return;
    
    if (newBeneficiaryInput.cpf && !validateCpfCnpj(newBeneficiaryInput.cpf)) {
      setAlertMessage('O CPF/CNPJ do beneficiário é inválido. Por favor, verifique.');
      return;
    }

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
      parentesco: 'Titular',
      titularPlanoSaude: false
    });
  };

  const handleDeleteBeneficiary = (id: string) => {
    setFormData(prev => ({
      ...prev,
      beneficiarios: prev.beneficiarios.filter(b => b.id !== id)
    }));
  };

  const handleUpdateBeneficiary = (id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      beneficiarios: prev.beneficiarios.map(b => b.id === id ? { ...b, [field]: value } : b)
    }));
  };

  const handleFileUpload = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setAlertMessage('O arquivo é muito grande. O tamanho máximo permitido é de 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      const newDoc = {
        id: Math.random().toString(36).substr(2, 9),
        nome: file.name,
        data: new Date().toLocaleDateString('pt-BR'),
        tamanho: (file.size / 1024).toFixed(1) + ' KB',
        url: base64Url
      };
      setFormData(prev => ({
        ...prev,
        documentos: [...prev.documentos, newDoc]
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddDocument = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
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
              tipoPlano: proposal.detalhes?.proposta?.tipoPlano || '',
              unidade: proposal.detalhes?.proposta?.unidade || '',
              pagamentoCartao: proposal.detalhes?.proposta?.pagamentoCartao || false
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

  const isReadOnlyLocked = Boolean(
    proposal && 
    (proposal.status === 'PAGO' || proposal.status === 'PAGA' || proposal.status === 'ENVIADA AO FINANCEIRO' || proposal.status === 'ENVIADA') &&
    (user.role === 'corretor' || (user.login || '').trim().toLowerCase() === 'corretor' || !user.permissions?.cadastros)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isReadOnlyLocked) {
      setAlertMessage(`Esta proposta está com status ${proposal?.status} e não pode ser alterada.`);
      return;
    }
    
    const vidas = Number(formData.financeiro.vidas) || 0;
    const nextStatus = (proposal?.status && proposal.status !== 'CADASTRADA') 
      ? proposal.status 
      : (formData.proposta.pagamentoCartao ? 'ENVIADA AO FINANCEIRO' : 'CADASTRADA');
      
    if ((nextStatus === 'ENVIADA AO FINANCEIRO' || formData.proposta.pagamentoCartao) && vidas === 0) {
      setAlertMessage('Não é possível salvar propostas de Cartão Corretora ou avançar para o financeiro com 0 vidas. Por favor, insira a quantidade de vidas correta.');
      return;
    }

    const valorContrato = Number(formData.financeiro.valorContrato) || 0;
    if (nextStatus === 'ENVIADA AO FINANCEIRO' && valorContrato === 0 && !formData.proposta.pagamentoCartao) {
      setAlertMessage('Não é possível avançar para o financeiro com valor de R$ 0,00 (exceto Cartão Corretora). Por favor, insira o valor do contrato.');
      return;
    }
    
    if (!validateCpfCnpj(formData.cliente.cpfCnpj)) {
      setAlertMessage('O CPF ou CNPJ do Cliente é inválido. Por favor, verifique os dígitos e tente novamente.');
      return;
    }
    
    const invalidBeneficiarios = formData.beneficiarios.filter(b => b.cpf && !validateCpfCnpj(b.cpf));
    if (invalidBeneficiarios.length > 0) {
      setAlertMessage(`Existem beneficiários com CPF inválido: ${invalidBeneficiarios.map(b => b.nome).join(', ')}. Por favor, verifique.`);
      return;
    }

    if (!formData.proposta.contrato || formData.proposta.contrato.trim() === '' || formData.proposta.contrato.startsWith('IMP-') || formData.proposta.contrato === 'NOVO') {
      setAlertMessage('Não é possível salvar a proposta sem um número de contrato definitivo. Por favor, insira o número do contrato.');
      return;
    }

    onSave({
      contrato: formData.proposta.contrato || 'NOVO',
      data: formData.proposta.dataVenda || new Date().toISOString().split('T')[0],
      cliente: formData.cliente.nome,
      cpfCnpj: formData.cliente.cpfCnpj,
      corretor: formData.proposta.corretor,
      operadora: formData.proposta.operadora,
      categoria: formData.proposta.categoria,
      valor: Number(formData.financeiro.valorContrato) || 0,
      vidas: vidas,
      status: nextStatus,
      comissao: formData.proposta.pagamentoCartao ? 0 : (Number(formData.financeiro.parcelas[0]?.comissao) || 0),
      detalhes: formData
    });
    onClose();
  };

  const getOptions = (tipo: ProposalRequirement['tipo']) => {
    return requirements.filter(r => r.tipo === tipo).map(r => r.nome);
  };

  const calcularTaxaAdesao = (opStr: string, tpStr: string, vidas: number) => {
    const taxasAdesao = requirements?.filter(r => r.tipo === 'TAXA_ADESAO') || [];
    
    const findTaxa = (op: string, tipo: string) => {
      return taxasAdesao.find(t => {
         const parts = t.nome.split(' - ');
         const reqOp = parts[0];
         const reqTipo = parts.length > 2 ? parts[1] : 'TODOS';
         return (reqOp === op || reqOp === 'TODAS') && (reqTipo === tipo || reqTipo === 'TODOS');
      });
    };

    const req = findTaxa(opStr.toUpperCase() || 'TODAS', tpStr.toUpperCase() || 'TODOS');
    let baseTaxa = 0;
    
    if (req) {
       const parts = req.nome.split(' - ');
       baseTaxa = parseFloat(parts.length > 2 ? parts[2] : parts[1]) || 0;
       
       const isPorVida = 
          (opStr.toUpperCase() === 'SELECT' && tpStr.toUpperCase() === 'EMPRESARIAL') ||
          (opStr.toUpperCase() === 'PLAMED' && tpStr.toUpperCase() === 'EMPRESARIAL');
          
       if (isPorVida) {
          return baseTaxa * (vidas || 0);
       }
    }
    return baseTaxa;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200/80">
        
        {/* Modal Header */}
        <div className="bg-white px-6 py-3.5 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#001f54] rounded-lg flex items-center justify-center text-white shadow-sm">
              <span className="material-symbols-outlined text-lg">description</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-[#001f54] tracking-tight leading-tight">
                {proposal ? 'Editar Proposta' : 'Nova Proposta'}
              </h2>
              <p className="text-[11px] font-medium text-[#e85d04] leading-tight">
                Preencha os campos abaixo conforme a proposta.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            title="Fechar"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Content Body with Accordion Sections */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-[#f8fafc]">
          {isReadOnlyLocked && (
            <div className="bg-amber-50 border border-amber-300 text-amber-900 p-3.5 rounded-xl flex items-center gap-3 shadow-2xs">
              <span className="text-xl">🔒</span>
              <div className="text-xs">
                <p className="font-bold">Contrato com alterações bloqueadas</p>
                <p className="text-amber-800">Esta proposta está com status <strong>{proposal?.status}</strong> e não pode ser editada pelo corretor.</p>
              </div>
            </div>
          )}

          {/* Section 1: Dados do Cliente */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div 
              onClick={() => toggleSection('cliente')}
              className="bg-[#002b66] hover:bg-[#002252] text-white px-4 py-2.5 flex items-center justify-between font-bold text-xs cursor-pointer select-none transition-colors"
            >
              <span>Dados do Cliente</span>
              <span className="material-symbols-outlined text-lg transition-transform duration-200" style={{ transform: openSections.cliente ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                expand_more
              </span>
            </div>
            {openSections.cliente && (
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 mb-1 block">Razão Social / Nome Completo</label>
                  <input
                    type="text"
                    placeholder="Razão Social / Nome Completo"
                    value={formData.cliente.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, cliente: { ...prev.cliente, nome: e.target.value } }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 mb-1 block">CPF / CNPJ</label>
                    <input
                      type="text"
                      placeholder="CPF / CNPJ"
                      value={formData.cliente.cpfCnpj}
                      onChange={(e) => setFormData(prev => ({ ...prev, cliente: { ...prev.cliente, cpfCnpj: formatCpfCnpj(e.target.value) } }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 mb-1 block">Data de Nascimento</label>
                    <input
                      type="text"
                      placeholder="Data de Nascimento"
                      value={formData.cliente.dataNascimento}
                      onChange={(e) => setFormData(prev => ({ ...prev, cliente: { ...prev.cliente, dataNascimento: formatDate(e.target.value) } }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 mb-1 block">E-mail de Contato</label>
                    <input
                      type="email"
                      placeholder="E-mail de Contato"
                      value={formData.cliente.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, cliente: { ...prev.cliente, email: e.target.value } }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 mb-1 block">Telefone Principal</label>
                    <input
                      type="text"
                      placeholder="Telefone Principal"
                      value={formData.cliente.telefone}
                      onChange={(e) => setFormData(prev => ({ ...prev, cliente: { ...prev.cliente, telefone: e.target.value } }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Endereço */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div 
              onClick={() => toggleSection('endereco')}
              className="bg-[#002b66] hover:bg-[#002252] text-white px-4 py-2.5 flex items-center justify-between font-bold text-xs cursor-pointer select-none transition-colors"
            >
              <span>Endereço</span>
              <span className="material-symbols-outlined text-lg transition-transform duration-200" style={{ transform: openSections.endereco ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                expand_more
              </span>
            </div>
            {openSections.endereco && (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 mb-1 block">CEP</label>
                    <input
                      type="text"
                      placeholder="CEP"
                      value={formData.endereco.cep}
                      onChange={(e) => setFormData(prev => ({ ...prev, endereco: { ...prev.endereco, cep: e.target.value } }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 mb-1 block">Logradouro</label>
                    <input
                      type="text"
                      placeholder="Logradouro"
                      value={formData.endereco.logradouro}
                      onChange={(e) => setFormData(prev => ({ ...prev, endereco: { ...prev.endereco, logradouro: e.target.value } }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 mb-1 block">Cidade</label>
                    <input
                      type="text"
                      placeholder="Cidade"
                      value={formData.endereco.cidade}
                      onChange={(e) => setFormData(prev => ({ ...prev, endereco: { ...prev.endereco, cidade: e.target.value } }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 mb-1 block">Número</label>
                    <input
                      type="text"
                      placeholder="Número"
                      value={formData.endereco.numero}
                      onChange={(e) => setFormData(prev => ({ ...prev, endereco: { ...prev.endereco, numero: e.target.value } }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 mb-1 block">Complemento</label>
                    <input
                      type="text"
                      placeholder="Complemento"
                      value={formData.endereco.complemento}
                      onChange={(e) => setFormData(prev => ({ ...prev, endereco: { ...prev.endereco, complemento: e.target.value } }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 mb-1 block">Bairro</label>
                    <input
                      type="text"
                      placeholder="Bairro"
                      value={formData.endereco.bairro}
                      onChange={(e) => setFormData(prev => ({ ...prev, endereco: { ...prev.endereco, bairro: e.target.value } }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 mb-1 block">Estado</label>
                    <select
                      value={formData.endereco.estado}
                      onChange={(e) => setFormData(prev => ({ ...prev, endereco: { ...prev.endereco, estado: e.target.value } }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 transition-all cursor-pointer"
                    >
                      <option value="">Selecione...</option>
                      {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Dados da Proposta (Orange Header) */}
          <div className="bg-white rounded-xl shadow-xs border border-orange-200/80 overflow-hidden">
            <div 
              onClick={() => toggleSection('proposta')}
              className="bg-[#e85d04] hover:bg-[#d45504] text-white px-4 py-2.5 flex items-center justify-between font-bold text-xs cursor-pointer select-none transition-colors"
            >
              <span>Dados da Proposta</span>
              <span className="material-symbols-outlined text-lg transition-transform duration-200" style={{ transform: openSections.proposta ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                expand_more
              </span>
            </div>
            {openSections.proposta && (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 mb-1 block">Nº Contrato</label>
                    <input
                      type="text"
                      placeholder="Nº Contrato"
                      value={formData.proposta.contrato}
                      onChange={(e) => setFormData(prev => ({ ...prev, proposta: { ...prev.proposta, contrato: e.target.value } }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 transition-all placeholder:text-slate-400 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 mb-1 block">Data</label>
                    <input
                      type="date"
                      value={formData.proposta.dataVenda}
                      onChange={(e) => setFormData(prev => ({ ...prev, proposta: { ...prev.proposta, dataVenda: e.target.value } }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 transition-all cursor-pointer"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 mb-1 block">Operadora</label>
                    <select
                      value={formData.proposta.operadora}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => {
                          const novaTaxa = calcularTaxaAdesao(val, prev.proposta.tipoPlano || '', prev.financeiro.vidas);
                          return { 
                            ...prev, 
                            proposta: { ...prev.proposta, operadora: val },
                            financeiro: {
                              ...prev.financeiro,
                              valorTaxa: novaTaxa,
                              parcelas: prev.financeiro.parcelas.map((p, i) => i === 0 ? { ...p, comissao: prev.proposta.pagamentoCartao ? -novaTaxa : Math.max(0, prev.financeiro.valorContrato - novaTaxa) } : p)
                            }
                          };
                        });
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 transition-all cursor-pointer"
                    >
                      <option value="">Selecione...</option>
                      {getOptions('OPERADORA').map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 mb-1 block">Categoria do Plano</label>
                    <select
                      value={formData.proposta.categoria}
                      onChange={(e) => setFormData(prev => ({ ...prev, proposta: { ...prev.proposta, categoria: e.target.value } }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 transition-all cursor-pointer"
                    >
                      <option value="">Selecione...</option>
                      {getOptions('CATEGORIA').map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 mb-1 block">Tipo de Plano</label>
                    <select
                      value={formData.proposta.tipoPlano}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => {
                          const novaTaxa = calcularTaxaAdesao(prev.proposta.operadora || '', val, prev.financeiro.vidas);
                          return { 
                            ...prev, 
                            proposta: { ...prev.proposta, tipoPlano: val },
                            financeiro: {
                              ...prev.financeiro,
                              valorTaxa: novaTaxa,
                              parcelas: prev.financeiro.parcelas.map((p, i) => i === 0 ? { ...p, comissao: prev.proposta.pagamentoCartao ? -novaTaxa : Math.max(0, prev.financeiro.valorContrato - novaTaxa) } : p)
                            }
                          };
                        });
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 transition-all cursor-pointer"
                    >
                      <option value="">Selecione...</option>
                      {getOptions('TIPO_PLANO').map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 mb-1 block">Unidade</label>
                    <select
                      value={formData.proposta.unidade}
                      onChange={(e) => setFormData(prev => ({ ...prev, proposta: { ...prev.proposta, unidade: e.target.value } }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 transition-all cursor-pointer"
                    >
                      <option value="">Selecione...</option>
                      {getOptions('UNIDADE').map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 mb-1 block">Corretor</label>
                    <select
                      value={formData.proposta.corretor}
                      onChange={(e) => setFormData(prev => ({ ...prev, proposta: { ...prev.proposta, corretor: e.target.value } }))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 transition-all cursor-pointer"
                    >
                      <option value="">Selecione...</option>
                      {getOptions('CORRETOR').map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="pb-2">
                    <label className="flex items-center gap-2 cursor-pointer group select-none">
                      <input 
                        type="checkbox" 
                        checked={formData.proposta.pagamentoCartao || false} 
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData(prev => {
                            const updated = { ...prev, proposta: { ...prev.proposta, pagamentoCartao: checked } };
                            if (updated.financeiro.parcelas[0]) {
                              updated.financeiro.parcelas[0].comissao = checked ? -updated.financeiro.valorTaxa : Math.max(0, updated.financeiro.valorContrato - updated.financeiro.valorTaxa);
                            }
                            return updated;
                          });
                        }}
                        className="w-4 h-4 text-orange-600 bg-white border-slate-300 rounded focus:ring-orange-500 focus:ring-2 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors flex items-center gap-1.5">
                        <span className="text-sm">💳</span> Pagamento no Cartão Corretora
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Beneficiários */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div 
              onClick={() => toggleSection('beneficiarios')}
              className="bg-[#002b66] hover:bg-[#002252] text-white px-4 py-2.5 flex items-center justify-between font-bold text-xs cursor-pointer select-none transition-colors"
            >
              <span>Beneficiários</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddBeneficiary();
                  }}
                  className="bg-[#e85d04] hover:bg-orange-600 text-white font-bold text-[11px] px-3 py-1 rounded-md flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                >
                  <span className="material-symbols-outlined text-sm leading-none">add</span>
                  <span>Adicionar</span>
                </button>
                <span className="material-symbols-outlined text-lg transition-transform duration-200" style={{ transform: openSections.beneficiarios ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  expand_more
                </span>
              </div>
            </div>
            {openSections.beneficiarios && (
              <div className="p-4 space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                        <th className="pb-2 px-2 w-[26%]">Nome</th>
                        <th className="pb-2 px-2 w-[20%]">CPF</th>
                        <th className="pb-2 px-2 w-[18%]">Nascimento</th>
                        <th className="pb-2 px-2 w-[18%]">Parentesco</th>
                        <th className="pb-2 px-2 text-center w-[10%]">Titular</th>
                        <th className="pb-2 px-2 text-right w-[8%]">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {/* Input row for quick adding */}
                      <tr className="bg-slate-50/60">
                        <td className="py-2 px-2">
                          <input 
                            type="text"
                            placeholder="Nome do Beneficiário..."
                            value={newBeneficiaryInput.nome}
                            onChange={(e) => setNewBeneficiaryInput(prev => ({ ...prev, nome: e.target.value }))}
                            className="w-full bg-white border border-slate-200 px-2 py-1 text-xs text-slate-800 outline-none focus:border-blue-500 rounded placeholder:text-slate-400"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input 
                            type="text"
                            placeholder="CPF..."
                            value={newBeneficiaryInput.cpf}
                            onChange={(e) => setNewBeneficiaryInput(prev => ({ ...prev, cpf: formatCpfCnpj(e.target.value) }))}
                            className="w-full bg-white border border-slate-200 px-2 py-1 text-xs text-slate-800 outline-none focus:border-blue-500 rounded placeholder:text-slate-400"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input 
                            type="text"
                            placeholder="DD/MM/AAAA"
                            value={newBeneficiaryInput.nascimento}
                            onChange={(e) => setNewBeneficiaryInput(prev => ({ ...prev, nascimento: formatDate(e.target.value) }))}
                            className="w-full bg-white border border-slate-200 px-2 py-1 text-xs text-slate-800 outline-none focus:border-blue-500 rounded placeholder:text-slate-400"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <select 
                            value={newBeneficiaryInput.parentesco}
                            onChange={(e) => setNewBeneficiaryInput(prev => ({ ...prev, parentesco: e.target.value }))}
                            className="w-full bg-white border border-slate-200 px-2 py-1 text-xs text-slate-800 outline-none focus:border-blue-500 rounded cursor-pointer"
                          >
                            <option value="Titular">Titular</option>
                            <option value="Cônjuge">Cônjuge</option>
                            <option value="Filho(a)">Filho(a)</option>
                            <option value="Pai/Mãe">Pai/Mãe</option>
                            <option value="Outros">Outros</option>
                          </select>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input 
                            type="checkbox"
                            checked={newBeneficiaryInput.titularPlanoSaude}
                            onChange={(e) => setNewBeneficiaryInput(prev => ({ ...prev, titularPlanoSaude: e.target.checked }))}
                            className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                            title="É o titular do plano?"
                          />
                        </td>
                        <td className="py-2 px-2 text-right">
                          <button 
                            type="button"
                            onClick={handleAddBeneficiary}
                            className="text-blue-600 hover:text-blue-800 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Add
                          </button>
                        </td>
                      </tr>

                      {formData.beneficiarios.map(b => (
                        <tr key={b.id} className="hover:bg-slate-50/50">
                          <td className="py-2 px-2">
                            <input 
                              type="text"
                              value={b.nome}
                              onChange={(e) => handleUpdateBeneficiary(b.id, 'nome', e.target.value)}
                              className="w-full bg-transparent border-none p-0 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-blue-300 rounded"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input 
                              type="text"
                              value={b.cpf}
                              onChange={(e) => handleUpdateBeneficiary(b.id, 'cpf', formatCpfCnpj(e.target.value))}
                              className="w-full bg-transparent border-none p-0 text-xs text-slate-600 outline-none focus:ring-1 focus:ring-blue-300 rounded"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input 
                              type="text"
                              value={b.nascimento}
                              onChange={(e) => handleUpdateBeneficiary(b.id, 'nascimento', formatDate(e.target.value))}
                              className="w-full bg-transparent border-none p-0 text-xs text-slate-600 outline-none focus:ring-1 focus:ring-blue-300 rounded"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <select 
                              value={b.parentesco}
                              onChange={(e) => handleUpdateBeneficiary(b.id, 'parentesco', e.target.value)}
                              className="w-full bg-transparent border-none p-0 text-xs text-slate-600 outline-none focus:ring-1 focus:ring-blue-300 rounded cursor-pointer"
                            >
                              <option value="Titular">Titular</option>
                              <option value="Cônjuge">Cônjuge</option>
                              <option value="Filho(a)">Filho(a)</option>
                              <option value="Pai/Mãe">Pai/Mãe</option>
                              <option value="Outros">Outros</option>
                            </select>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <input 
                              type="checkbox"
                              checked={!!b.titularPlanoSaude}
                              onChange={(e) => handleUpdateBeneficiary(b.id, 'titularPlanoSaude', e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-2 px-2 text-right">
                            <button 
                              type="button"
                              onClick={() => handleDeleteBeneficiary(b.id)}
                              className="text-red-500 hover:text-red-700 text-xs font-bold transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}

                      {formData.beneficiarios.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-slate-400 text-xs italic font-normal">
                            Nenhum beneficiário cadastrado ainda. Use a linha acima para adicionar.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Financeiro */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div 
              onClick={() => toggleSection('financeiro')}
              className="bg-[#002b66] hover:bg-[#002252] text-white px-4 py-2.5 flex items-center justify-between font-bold text-xs cursor-pointer select-none transition-colors"
            >
              <span>Financeiro</span>
              <span className="material-symbols-outlined text-lg transition-transform duration-200" style={{ transform: openSections.financeiro ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                expand_more
              </span>
            </div>
            {openSections.financeiro && (
              <div className="p-4 space-y-4">
                {/* Top 3 Summary Tiles */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-200/70">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Valor Total</span>
                    <span className="text-sm font-black text-slate-800">
                      {formData.financeiro.valorContrato > 0 
                        ? `R$ ${Number(formData.financeiro.valorContrato).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                        : '--'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-200/70">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Comissão</span>
                    <span className="text-sm font-black text-slate-800">
                      R$ {Number(formData.financeiro.parcelas[0]?.comissao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-200/70">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Parcelas</span>
                    <span className="text-sm font-black text-slate-800">1x</span>
                  </div>
                </div>

                {/* 3 Inputs row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 mb-1 block">Valor do Contrato (R$)</label>
                    <input
                      type="number"
                      value={formData.financeiro.valorContrato || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setFormData(prev => ({ 
                          ...prev, 
                          financeiro: { 
                            ...prev.financeiro, 
                            valorContrato: val,
                            parcelas: prev.financeiro.parcelas.map((p, i) => i === 0 ? { ...p, valor: val, comissao: prev.proposta.pagamentoCartao ? -prev.financeiro.valorTaxa : Math.max(0, val - prev.financeiro.valorTaxa) } : p)
                          } 
                        }));
                      }}
                      className="w-full px-3 py-2 bg-slate-100/70 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-blue-500 transition-all"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 mb-1 block">Qtd Vidas</label>
                    <input
                      type="number"
                      value={formData.financeiro.vidas || ''}
                      onChange={(e) => {
                        const novasVidas = parseInt(e.target.value) || 0;
                        setFormData(prev => {
                          const novaTaxa = calcularTaxaAdesao(prev.proposta.operadora || '', prev.proposta.tipoPlano || '', novasVidas);
                          return { 
                            ...prev, 
                            financeiro: { 
                              ...prev.financeiro, 
                              vidas: novasVidas,
                              valorTaxa: novaTaxa,
                              parcelas: prev.financeiro.parcelas.map((p, i) => i === 0 ? { ...p, comissao: prev.proposta.pagamentoCartao ? -novaTaxa : Math.max(0, prev.financeiro.valorContrato - novaTaxa) } : p)
                            } 
                          };
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-100/70 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-blue-500 transition-all"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 mb-1 block">Valor Taxa</label>
                    <input
                      type="number"
                      value={formData.financeiro.valorTaxa}
                      readOnly
                      className="w-full px-3 py-2 bg-slate-100/70 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 outline-none cursor-not-allowed"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Sub-table: Detalhamento das Parcelas */}
                <div className="pt-2">
                  <h4 className="text-[11px] font-bold text-slate-600 mb-2">Detalhamento das Parcelas</h4>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                        <th className="pb-1.5 px-2">Parcela</th>
                        <th className="pb-1.5 px-2">Valor</th>
                        <th className="pb-1.5 px-2">Comissão</th>
                        <th className="pb-1.5 px-2">Vencimento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formData.financeiro.parcelas.map(p => (
                        <tr key={p.id} className="text-xs text-slate-700 font-medium">
                          <td className="py-2 px-2">{p.numero}</td>
                          <td className="py-2 px-2 font-bold">R$ {Number(p.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className={`py-2 px-2 font-bold ${p.comissao < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            R$ {Number(p.comissao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-2">{p.vencimento}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Section 6: Documentação */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div 
              onClick={() => toggleSection('documentos')}
              className="bg-[#002b66] hover:bg-[#002252] text-white px-4 py-2.5 flex items-center justify-between font-bold text-xs cursor-pointer select-none transition-colors"
            >
              <span>Documentação</span>
              <span className="material-symbols-outlined text-lg transition-transform duration-200" style={{ transform: openSections.documentos ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                expand_more
              </span>
            </div>
            {openSections.documentos && (
              <div className="p-4 space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                    e.target.value = '';
                  }}
                />
                
                {/* Drag and Drop Zone */}
                <div 
                  onClick={handleAddDocument}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 text-center bg-slate-50/50 hover:bg-blue-50/30 cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-3xl text-slate-400">cloud_upload</span>
                  <p className="text-xs font-bold text-slate-700">Arraste arquivos aqui ou clique para selecionar</p>
                  <p className="text-[10px] text-slate-400 font-medium">(PDF, JPG, PNG, Max 10MB)</p>
                </div>

                {/* List of uploaded documents */}
                {formData.documentos.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {formData.documentos.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-red-500 text-lg">picture_as_pdf</span>
                          <div>
                            <p className="text-xs font-bold text-slate-800 truncate max-w-[260px]">{doc.nome}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{doc.data} • {doc.tamanho}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.url && (
                            <button 
                              type="button"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = doc.url!;
                                link.download = doc.nome;
                                link.click();
                              }}
                              className="text-blue-600 hover:text-blue-800 p-1 transition-colors cursor-pointer"
                              title="Download"
                            >
                              <span className="material-symbols-outlined text-base">download</span>
                            </button>
                          )}
                          <button 
                            type="button"
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="text-red-500 hover:text-red-700 p-1 transition-colors cursor-pointer"
                            title="Remover"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 7: Observações & Histórico */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div 
              onClick={() => toggleSection('historico')}
              className="bg-[#002b66] hover:bg-[#002252] text-white px-4 py-2.5 flex items-center justify-between font-bold text-xs cursor-pointer select-none transition-colors"
            >
              <span>Observações & Histórico</span>
              <span className="material-symbols-outlined text-lg transition-transform duration-200" style={{ transform: openSections.historico ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                expand_more
              </span>
            </div>
            {openSections.historico && (
              <div className="p-4 space-y-3">
                <textarea
                  value={newObservation}
                  onChange={(e) => setNewObservation(e.target.value)}
                  placeholder="Digite uma observação para incluir no histórico da proposta..."
                  className="w-full h-20 p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-500 transition-all resize-none placeholder:text-slate-400"
                ></textarea>
                <button
                  type="button"
                  onClick={handleAddNote}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 transition-all cursor-pointer"
                >
                  Adicionar Nota ao Histórico
                </button>

                {formData.historico.length > 0 && (
                  <div className="pt-2">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                          <th className="pb-1.5 px-2 w-[25%]">Data</th>
                          <th className="pb-1.5 px-2 w-[25%]">Responsável</th>
                          <th className="pb-1.5 px-2 w-[50%]">Observação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {formData.historico.map(h => (
                          <tr key={h.id} className="text-xs text-slate-700">
                            <td className="py-2 px-2 whitespace-nowrap text-slate-500">{h.data}</td>
                            <td className="py-2 px-2 font-bold text-slate-800">{h.responsavel}</td>
                            <td className="py-2 px-2 text-slate-600">{h.observacao}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Action Button */}
          <div className="pt-2">
            {isReadOnlyLocked ? (
              <div className="w-full py-3.5 bg-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase tracking-wider text-center cursor-not-allowed">
                🔒 Proposta em Modo Somente Leitura
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full py-3.5 bg-[#001f54] hover:bg-[#001740] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-950/20 active:scale-99 transition-all cursor-pointer"
              >
                {proposal ? 'Salvar Alterações' : 'Salvar Proposta'}
              </button>
            )}
          </div>

        </div>

      </div>

      {alertMessage !== '' && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 text-red-500 text-2xl">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight mb-2">Atenção</h3>
              <p className="text-xs text-slate-600 mb-6">{alertMessage}</p>
              <button 
                type="button"
                onClick={() => setAlertMessage('')}
                className="w-full bg-[#001f54] hover:bg-[#001740] text-white font-bold py-2.5 rounded-xl transition-all text-xs cursor-pointer"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalModal;
