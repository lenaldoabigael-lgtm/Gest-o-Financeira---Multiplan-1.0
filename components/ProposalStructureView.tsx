import React, { useState, useMemo } from 'react';
import { ProposalRequirement } from '../types';

interface ProposalStructureViewProps {
  requirements: ProposalRequirement[];
  onSave: (req: Omit<ProposalRequirement, 'id'>) => void;
  onDelete: (id: string) => void;
}

interface TreeItem {
  id: string;
  code: string;
  name: string;
  originalReq?: ProposalRequirement;
  children?: TreeItem[];
}

export const ProposalStructureView: React.FC<ProposalStructureViewProps> = ({
  requirements,
  onSave,
  onDelete
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    '1.0': true,
    '1.1': true,
    '1.2': true,
    '1.3': true,
    '1.4': true,
    '1.5': true,
    '2.0': true,
    '2.1': true,
    '2.2': true,
    '2.3': true,
    '2.4': true
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ProposalRequirement['tipo']>('CORRETOR');
  const [modalTitle, setModalTitle] = useState('');

  // Topic Modal State
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicCode, setNewTopicCode] = useState('');

  // Subtopic Modal State
  const [isSubtopicModalOpen, setIsSubtopicModalOpen] = useState(false);
  const [subtopicParent, setSubtopicParent] = useState('1.0');
  const [subtopicType, setSubtopicType] = useState<ProposalRequirement['tipo']>('CORRETOR');
  const [customSubtopicName, setCustomSubtopicName] = useState('');

  // Form states for modal
  const [simpleName, setSimpleName] = useState('');

  // Prazo Form
  const [prazoForm, setPrazoForm] = useState({
    operadora: '',
    regra: '',
    dias: ''
  });

  // Taxa Adesao Form
  const [taxaForm, setTaxaForm] = useState({
    operadora: '',
    tipoPlano: '',
    valor: ''
  });

  // Imposto Form
  const [impostoForm, setImpostoForm] = useState({
    corretor: '',
    operadora: '',
    tipoPlano: '',
    valor: ''
  });

  // Percentual Form
  const [percentualForm, setPercentualForm] = useState({
    corretor: '',
    operadora: '',
    tipoPlano: '',
    parcela: '',
    valor: ''
  });

  // Grouped Requirements
  const groupedRequirements = useMemo(() => {
    const groups: Record<string, ProposalRequirement[]> = {
      CORRETOR: [],
      CATEGORIA: [],
      OPERADORA: [],
      TIPO_PLANO: [],
      UNIDADE: [],
      PRAZO_PAGAMENTO: [],
      TAXA_ADESAO: [],
      IMPOSTO_CORRETOR: [],
      PERCENTUAL_COMISSAO: [],
      TOPICO: [],
      SUBTOPICO: []
    };
    requirements.forEach(req => {
      if (groups[req.tipo]) {
        groups[req.tipo].push(req);
      }
    });
    return groups;
  }, [requirements]);

  // Build the hierarchical tree matching screenshot
  const treeData = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    // 1.0 Parâmetros Cadastrais Básicos
    // 1.1 Corretores
    const corretoresItems: TreeItem[] = groupedRequirements.CORRETOR.map((req, idx) => ({
      id: req.id,
      code: `1.1.${idx + 1}`,
      name: req.nome,
      originalReq: req
    }));

    // 1.2 Operadoras
    const operadorasItems: TreeItem[] = groupedRequirements.OPERADORA.map((req, idx) => ({
      id: req.id,
      code: `1.2.${idx + 1}`,
      name: req.nome,
      originalReq: req
    }));

    // 1.3 Tipos de Plano
    const tiposPlanoItems: TreeItem[] = groupedRequirements.TIPO_PLANO.map((req, idx) => ({
      id: req.id,
      code: `1.3.${idx + 1}`,
      name: req.nome,
      originalReq: req
    }));

    // 1.4 Categorias
    const categoriasItems: TreeItem[] = groupedRequirements.CATEGORIA.map((req, idx) => ({
      id: req.id,
      code: `1.4.${idx + 1}`,
      name: req.nome,
      originalReq: req
    }));

    // 1.5 Unidades / Filiais
    const unidadesItems: TreeItem[] = groupedRequirements.UNIDADE.map((req, idx) => ({
      id: req.id,
      code: `1.5.${idx + 1}`,
      name: req.nome,
      originalReq: req
    }));

    // 2.0 Prazos de Pagamento e SLA por Operadora
    // 2.1 Prazos de Pagamento (SLA)
    const prazosItems: TreeItem[] = groupedRequirements.PRAZO_PAGAMENTO.map((req, idx) => ({
      id: req.id,
      code: `2.1.${idx + 1}`,
      name: req.nome,
      originalReq: req
    }));

    // 3.0 Regras Financeiras, Taxas & Comissões
    // 3.1 Taxas de Adesão / Implantação (R$)
    const taxasItems: TreeItem[] = groupedRequirements.TAXA_ADESAO.map((req, idx) => ({
      id: req.id,
      code: `3.1.${idx + 1}`,
      name: req.nome,
      originalReq: req
    }));

    // 3.2 Percentual de Comissão ao Corretor (%)
    const percentuaisItems: TreeItem[] = groupedRequirements.PERCENTUAL_COMISSAO.map((req, idx) => ({
      id: req.id,
      code: `3.2.${idx + 1}`,
      name: req.nome,
      originalReq: req
    }));

    // 3.3 Impostos da Nota (NF) / Descontos (%)
    const impostosItems: TreeItem[] = groupedRequirements.IMPOSTO_CORRETOR.map((req, idx) => ({
      id: req.id,
      code: `3.3.${idx + 1}`,
      name: req.nome,
      originalReq: req
    }));

    const roots: TreeItem[] = [
      {
        id: '1.0',
        code: '1.0',
        name: 'Parâmetros Cadastrais Básicos',
        children: [
          { id: '1.1', code: '1.1', name: 'Corretores', originalReq: undefined, children: corretoresItems },
          { id: '1.2', code: '1.2', name: 'Operadoras de Saúde e Odonto', originalReq: undefined, children: operadorasItems },
          { id: '1.3', code: '1.3', name: 'Tipos de Plano / Modalidades', originalReq: undefined, children: tiposPlanoItems },
          { id: '1.4', code: '1.4', name: 'Categorias de Proposta', originalReq: undefined, children: categoriasItems },
          { id: '1.5', code: '1.5', name: 'Unidades e Filiais', originalReq: undefined, children: unidadesItems }
        ]
      },
      {
        id: '2.0',
        code: '2.0',
        name: 'Prazos de Pagamento e SLA por Operadora',
        children: [
          { id: '2.1', code: '2.1', name: 'Prazos de Pagamento por Operadora (Dias)', originalReq: undefined, children: prazosItems }
        ]
      },
      {
        id: '3.0',
        code: '3.0',
        name: 'Regras Financeiras, Taxas & Comissões',
        children: [
          { id: '3.1', code: '3.1', name: 'Taxas de Adesão / Implantação (R$)', originalReq: undefined, children: taxasItems },
          { id: '3.2', code: '3.2', name: 'Percentual de Comissão ao Corretor (%)', originalReq: undefined, children: percentuaisItems },
          { id: '3.3', code: '3.3', name: 'Impostos da Nota (NF) / Descontos (%)', originalReq: undefined, children: impostosItems }
        ]
      }
    ];

    // Add any custom topics created by user
    if (groupedRequirements.TOPICO && groupedRequirements.TOPICO.length > 0) {
      groupedRequirements.TOPICO.forEach((topicReq, tIdx) => {
        const topicCode = topicReq.nome.match(/^(\d+\.\d+)/)?.[1] || `${roots.length + 1}.0`;
        const topicTitle = topicReq.nome.replace(/^(\d+\.\d+)\s*/, '');
        
        // Find any subtopics associated with this custom topic
        const customSubItems = (groupedRequirements.SUBTOPICO || [])
          .filter(sub => sub.nome.startsWith(`[${topicReq.id}]`) || sub.nome.startsWith(`[${topicCode}]`))
          .map((sub, sIdx) => {
            const cleanName = sub.nome.replace(/^\[[^\]]+\]\s*/, '');
            return {
              id: sub.id,
              code: `${topicCode.replace('.0', '')}.${sIdx + 1}`,
              name: cleanName,
              originalReq: sub
            };
          });

        roots.push({
          id: topicReq.id,
          code: topicCode,
          name: topicTitle || topicReq.nome,
          originalReq: topicReq,
          children: customSubItems.length > 0 ? customSubItems : [
            {
              id: `${topicReq.id}-item`,
              code: `${topicCode.replace('.0', '')}.1`,
              name: 'Parâmetro Inicial',
              originalReq: undefined,
              children: []
            }
          ]
        });
      });
    }

    // Filter tree by search term if provided
    if (!search) return roots;

    const filterNode = (node: TreeItem): TreeItem | null => {
      const matchSelf = node.name.toLowerCase().includes(search) || node.code.toLowerCase().includes(search);
      if (!node.children) {
        return matchSelf ? node : null;
      }
      const filteredChildren = node.children
        .map(filterNode)
        .filter((child): child is TreeItem => child !== null);

      if (matchSelf || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren
        };
      }
      return null;
    };

    return roots.map(filterNode).filter((node): node is TreeItem => node !== null);
  }, [groupedRequirements, searchTerm]);

  // Count total registers
  const totalCount = useMemo(() => requirements.length, [requirements]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const current = prev[nodeId] !== undefined ? prev[nodeId] : true;
      return { ...prev, [nodeId]: !current };
    });
  };

  const handleExpandAll = () => {
    const all: Record<string, boolean> = {
      '1.0': true,
      '1.1': true,
      '1.2': true,
      '1.3': true,
      '1.4': true,
      '1.5': true,
      '2.0': true,
      '2.1': true,
      '3.0': true,
      '3.1': true,
      '3.2': true,
      '3.3': true
    };
    const expandRec = (items: TreeItem[]) => {
      items.forEach(item => {
        all[item.id] = true;
        if (item.children) expandRec(item.children);
      });
    };
    expandRec(treeData);
    setExpandedNodes(all);
  };

  const handleCollapseAll = () => {
    const all: Record<string, boolean> = {
      '1.0': false,
      '1.1': false,
      '1.2': false,
      '1.3': false,
      '1.4': false,
      '1.5': false,
      '2.0': false,
      '2.1': false,
      '3.0': false,
      '3.1': false,
      '3.2': false,
      '3.3': false
    };
    const collapseRec = (items: TreeItem[]) => {
      items.forEach(item => {
        all[item.id] = false;
        if (item.children) collapseRec(item.children);
      });
    };
    collapseRec(treeData);
    setExpandedNodes(all);
  };

  // Open Add Modal by type
  const handleOpenAddModal = (type: ProposalRequirement['tipo'], title: string) => {
    setModalType(type);
    setModalTitle(title);
    setSimpleName('');
    setPrazoForm({ operadora: '', regra: '', dias: '' });
    setTaxaForm({ operadora: '', tipoPlano: '', valor: '' });
    setImpostoForm({ corretor: '', operadora: '', tipoPlano: '', valor: '' });
    setPercentualForm({ corretor: '', operadora: '', tipoPlano: '', parcela: '', valor: '' });
    setIsModalOpen(true);
  };

  // Save Modal
  const handleModalSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (modalType === 'CORRETOR' || modalType === 'OPERADORA' || modalType === 'TIPO_PLANO' || modalType === 'CATEGORIA' || modalType === 'UNIDADE') {
      if (!simpleName.trim()) return;
      onSave({ tipo: modalType, nome: simpleName.trim().toUpperCase() });
    } else if (modalType === 'PRAZO_PAGAMENTO') {
      if (!prazoForm.operadora || !prazoForm.dias) return;
      const nome = `${prazoForm.operadora}${prazoForm.regra ? ` - ${prazoForm.regra}` : ''} - ${prazoForm.dias} DIA(S)`.toUpperCase();
      onSave({ tipo: 'PRAZO_PAGAMENTO', nome });
    } else if (modalType === 'TAXA_ADESAO') {
      if (!taxaForm.operadora || !taxaForm.valor) return;
      const tp = taxaForm.tipoPlano || 'TODOS';
      const nome = `${taxaForm.operadora} - ${tp} - R$ ${taxaForm.valor}`.toUpperCase();
      onSave({ tipo: 'TAXA_ADESAO', nome });
    } else if (modalType === 'PERCENTUAL_COMISSAO') {
      if (!percentualForm.corretor || !percentualForm.operadora || !percentualForm.parcela || !percentualForm.valor) return;
      const tp = percentualForm.tipoPlano || 'TODOS OS TIPOS';
      const nome = `${percentualForm.parcela} - ${percentualForm.corretor} - ${percentualForm.operadora} - ${tp} - ${percentualForm.valor}`.toUpperCase();
      onSave({ tipo: 'PERCENTUAL_COMISSAO', nome });
    } else if (modalType === 'IMPOSTO_CORRETOR') {
      if (!impostoForm.corretor || !impostoForm.operadora || !impostoForm.valor) return;
      const tp = impostoForm.tipoPlano || 'TODOS OS TIPOS';
      const nome = `${impostoForm.corretor} - ${impostoForm.operadora} - ${tp} - ${impostoForm.valor}`.toUpperCase();
      onSave({ tipo: 'IMPOSTO_CORRETOR', nome });
    }

    setIsModalOpen(false);
  };

  // Helper mapping code to modal type and styling
  const getSubcategoryModalConfig = (code: string): { type: ProposalRequirement['tipo']; title: string; btnLabel: string; btnColor: string } | null => {
    switch (code) {
      case '1.1': return { type: 'CORRETOR', title: 'Corretor', btnLabel: '+ Novo Corretor', btnColor: 'bg-[#001a54] hover:bg-[#00133d] text-white' };
      case '1.2': return { type: 'OPERADORA', title: 'Operadora', btnLabel: '+ Nova Operadora', btnColor: 'bg-[#001a54] hover:bg-[#00133d] text-white' };
      case '1.3': return { type: 'TIPO_PLANO', title: 'Tipo de Plano', btnLabel: '+ Novo Tipo', btnColor: 'bg-[#001a54] hover:bg-[#00133d] text-white' };
      case '1.4': return { type: 'CATEGORIA', title: 'Categoria', btnLabel: '+ Nova Categoria', btnColor: 'bg-[#001a54] hover:bg-[#00133d] text-white' };
      case '1.5': return { type: 'UNIDADE', title: 'Unidade / Filial', btnLabel: '+ Nova Unidade', btnColor: 'bg-[#001a54] hover:bg-[#00133d] text-white' };
      case '2.1': return { type: 'PRAZO_PAGAMENTO', title: 'Prazo de Pagamento (SLA)', btnLabel: '+ Novo Prazo SLA', btnColor: 'bg-[#001a54] hover:bg-[#00133d] text-white' };
      case '3.1': return { type: 'TAXA_ADESAO', title: 'Taxa de Adesão / Implantação', btnLabel: '+ Nova Taxa', btnColor: 'bg-[#e85d04] hover:bg-[#cf5304] text-white' };
      case '3.2': return { type: 'PERCENTUAL_COMISSAO', title: 'Percentual de Comissão ao Corretor', btnLabel: '+ Novo Percentual', btnColor: 'bg-[#001a54] hover:bg-[#00133d] text-white' };
      case '3.3': return { type: 'IMPOSTO_CORRETOR', title: 'Imposto da Nota (NF) / Descontos', btnLabel: '+ Novo Imposto', btnColor: 'bg-[#007b5e] hover:bg-[#00624b] text-white' };
      default: return null;
    }
  };

  // Handle Save New Custom Topic
  const handleSaveTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    const nextNum = (groupedRequirements.TOPICO?.length || 0) + 4;
    const code = newTopicCode.trim() ? newTopicCode.trim() : `${nextNum}.0`;
    const fullName = `${code} ${newTopicName.trim().toUpperCase()}`;
    onSave({ tipo: 'TOPICO', nome: fullName });
    setNewTopicName('');
    setNewTopicCode('');
    setIsTopicModalOpen(false);
  };

  // Handle Save New Subtopic
  const handleSaveSubtopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (subtopicParent.startsWith('custom-')) {
      if (!customSubtopicName.trim()) return;
      const topicId = subtopicParent.replace('custom-', '');
      onSave({ tipo: 'SUBTOPICO', nome: `[${topicId}] ${customSubtopicName.trim().toUpperCase()}` });
    } else {
      // Standard subtopic handling based on subtopicType
      if (subtopicType === 'CORRETOR' || subtopicType === 'OPERADORA' || subtopicType === 'TIPO_PLANO' || subtopicType === 'CATEGORIA' || subtopicType === 'UNIDADE') {
        if (!simpleName.trim()) return;
        onSave({ tipo: subtopicType, nome: simpleName.trim().toUpperCase() });
      } else if (subtopicType === 'PRAZO_PAGAMENTO') {
        if (!prazoForm.operadora || !prazoForm.dias) return;
        const nome = `${prazoForm.operadora}${prazoForm.regra ? ` - ${prazoForm.regra}` : ''} - ${prazoForm.dias} DIA(S)`.toUpperCase();
        onSave({ tipo: 'PRAZO_PAGAMENTO', nome });
      } else if (subtopicType === 'TAXA_ADESAO') {
        if (!taxaForm.operadora || !taxaForm.valor) return;
        const tp = taxaForm.tipoPlano || 'TODOS';
        const nome = `${taxaForm.operadora} - ${tp} - R$ ${taxaForm.valor}`.toUpperCase();
        onSave({ tipo: 'TAXA_ADESAO', nome });
      } else if (subtopicType === 'PERCENTUAL_COMISSAO') {
        if (!percentualForm.corretor || !percentualForm.operadora || !percentualForm.parcela || !percentualForm.valor) return;
        const tp = percentualForm.tipoPlano || 'TODOS OS TIPOS';
        const nome = `${percentualForm.parcela} - ${percentualForm.corretor} - ${percentualForm.operadora} - ${tp} - ${percentualForm.valor}`.toUpperCase();
        onSave({ tipo: 'PERCENTUAL_COMISSAO', nome });
      } else if (subtopicType === 'IMPOSTO_CORRETOR') {
        if (!impostoForm.corretor || !impostoForm.operadora || !impostoForm.valor) return;
        const tp = impostoForm.tipoPlano || 'TODOS OS TIPOS';
        const nome = `${impostoForm.corretor} - ${impostoForm.operadora} - ${tp} - ${impostoForm.valor}`.toUpperCase();
        onSave({ tipo: 'IMPOSTO_CORRETOR', nome });
      }
    }
    setCustomSubtopicName('');
    setSimpleName('');
    setIsSubtopicModalOpen(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* HEADER MATCHING SCREENSHOT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#001a54] text-[24px]">
              account_tree
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#001a54] tracking-tight">
              Estrutura de Proposta
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
            Estrutura hierárquica de parâmetros cadastrais, tabelas de comissão, requisitos e regras operacionais.
          </p>
        </div>

        {/* Top Action Buttons (Criar Tópico e Sub-tópico) */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              const nextNum = (groupedRequirements.TOPICO?.length || 0) + 4;
              setNewTopicCode(`${nextNum}.0`);
              setNewTopicName('');
              setIsTopicModalOpen(true);
            }}
            className="bg-[#001a54] hover:bg-[#00133d] text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">library_add</span>
            <span>+ Novo Tópico</span>
          </button>

          <button
            onClick={() => {
              setSubtopicParent('1.0');
              setSubtopicType('CORRETOR');
              setSimpleName('');
              setCustomSubtopicName('');
              setIsSubtopicModalOpen(true);
            }}
            className="bg-white hover:bg-slate-50 text-[#001a54] border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px] text-[#001a54]">add_circle</span>
            <span>+ Novo Sub-tópico</span>
          </button>
        </div>
      </div>

      {/* SEARCH AND EXPAND / COLLAPSE TOOLBAR */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por parâmetro, operadora, corretor ou regra..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#001a54]/20 focus:border-[#001a54] transition-all placeholder:text-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              &times;
            </button>
          )}
        </div>

        {/* Expand / Collapse All Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExpandAll}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[15px]">unfold_more</span>
            <span>Expandir tudo</span>
          </button>
          <button
            onClick={handleCollapseAll}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[15px]">unfold_less</span>
            <span>Recolher tudo</span>
          </button>
        </div>
      </div>

      {/* HIERARCHICAL TREE VIEW CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-6">
        {treeData.map(rootNode => {
          const isRootExpanded = expandedNodes[rootNode.id] ?? true;
          const rootChildrenCount =
            rootNode.children?.reduce((acc, c) => acc + (c.children?.length || 0), 0) || 0;

          return (
            <div key={rootNode.id} className="space-y-2">
              {/* ROOT LEVEL HEADER (e.g. 1.0 Parâmetros Cadastrais Básicos) */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <button
                  onClick={() => toggleNode(rootNode.id)}
                  className="flex items-center gap-2 text-left group"
                >
                  <span className="material-symbols-outlined text-[#001a54] text-[20px] transition-transform">
                    {isRootExpanded ? 'arrow_drop_down' : 'arrow_right'}
                  </span>
                  <span className="text-sm font-bold text-[#001a54] tracking-tight group-hover:underline">
                    {rootNode.code} {rootNode.name}
                  </span>
                </button>

                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {rootChildrenCount} {rootNode.code === '1.0' ? 'itens' : 'regras'}
                </span>
              </div>

              {/* LEVEL 2 & 3 CHILDREN */}
              {isRootExpanded && rootNode.children && (
                <div className="pl-4 sm:pl-6 space-y-4 pt-1 border-l-2 border-slate-100 ml-2.5">
                  {rootNode.children.map(subCategory => {
                    const isSubExpanded = expandedNodes[subCategory.id] ?? true;
                    const itemsCount = subCategory.children?.length || 0;
                    const modalConfig = getSubcategoryModalConfig(subCategory.code);

                    return (
                      <div key={subCategory.id} className="space-y-2">
                        {/* Subcategory Header (e.g. 3.1 Taxas de Adesão / Implantação) */}
                        <div className="flex items-center justify-between group/sub py-1">
                          <button
                            onClick={() => toggleNode(subCategory.id)}
                            className="flex items-center gap-2 text-left"
                          >
                            <span className="material-symbols-outlined text-slate-400 text-[18px]">
                              {isSubExpanded ? 'expand_more' : 'chevron_right'}
                            </span>
                            <span className="text-xs sm:text-[13px] font-bold text-slate-800">
                              {subCategory.code} {subCategory.name}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">
                              ({itemsCount})
                            </span>
                          </button>

                          {/* Action Button for this subcategory matching print */}
                          {modalConfig && (
                            <button
                              onClick={() => handleOpenAddModal(modalConfig.type, modalConfig.title)}
                              className={`${modalConfig.btnColor} px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 shadow-2xs`}
                            >
                              <span>{modalConfig.btnLabel}</span>
                            </button>
                          )}
                        </div>

                        {/* Level 3 List Items */}
                        {isSubExpanded && subCategory.children && (
                          <div className="pl-5 sm:pl-7 space-y-1 border-l border-slate-200 ml-2">
                            {subCategory.children.length === 0 ? (
                              <p className="text-[11px] text-slate-400 italic py-1 pl-2">
                                Nenhum item cadastrado nesta categoria.
                              </p>
                            ) : (
                              subCategory.children.map(item => (
                                <div
                                  key={item.id}
                                  className="group flex items-center justify-between py-1.5 px-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="text-slate-300 font-mono text-[10px]">
                                      —
                                    </span>
                                    <span className="text-slate-400 font-mono text-[11px]">
                                      {item.code}
                                    </span>
                                    <span className="font-semibold text-slate-700 tracking-tight">
                                      {item.name}
                                    </span>
                                  </div>

                                  {/* Delete action */}
                                  {item.originalReq && (
                                    <button
                                      onClick={() => {
                                        if (confirm(`Excluir o item "${item.name}"?`)) {
                                          onDelete(item.id);
                                        }
                                      }}
                                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 transition-all rounded hover:bg-rose-50"
                                      title="Excluir"
                                    >
                                      <span className="material-symbols-outlined text-[15px]">
                                        delete
                                      </span>
                                    </button>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {treeData.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-40">search_off</span>
            <p className="text-xs font-bold uppercase tracking-wider">
              Nenhum resultado encontrado para a busca
            </p>
          </div>
        )}
      </div>

      {/* MODAL ADICIONAR ITEM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-100">
            {/* Modal Header */}
            <div className="bg-[#001a54] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                <h3 className="text-sm font-bold tracking-tight">
                  Cadastrar {modalTitle}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleModalSave} className="p-6 space-y-4">
              {/* SIMPLE TYPES: CORRETOR, OPERADORA, TIPO_PLANO, CATEGORIA, UNIDADE */}
              {(modalType === 'CORRETOR' || modalType === 'OPERADORA' || modalType === 'TIPO_PLANO' || modalType === 'CATEGORIA' || modalType === 'UNIDADE') && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Nome do {modalTitle} *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder={`Ex: ${modalType === 'CORRETOR' ? 'JOÃO SILVA' : modalType === 'OPERADORA' ? 'AMIL SAÚDE' : 'ADESÃO'}`}
                    value={simpleName}
                    onChange={e => setSimpleName(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold uppercase focus:ring-2 focus:ring-[#001a54]/20 focus:border-[#001a54] outline-none"
                  />
                </div>
              )}

              {/* PRAZO_PAGAMENTO */}
              {modalType === 'PRAZO_PAGAMENTO' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Operadora *
                    </label>
                    <select
                      required
                      value={prazoForm.operadora}
                      onChange={e => setPrazoForm({ ...prazoForm, operadora: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#001a54]"
                    >
                      <option value="">Selecione a Operadora...</option>
                      {groupedRequirements.OPERADORA.map(op => (
                        <option key={op.id} value={op.nome}>
                          {op.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Regra / Observação (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Adesão, PJ, Boleto..."
                      value={prazoForm.regra}
                      onChange={e => setPrazoForm({ ...prazoForm, regra: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs uppercase focus:outline-none focus:border-[#001a54]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Prazo em Dias (SLA) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="Ex: 5"
                      value={prazoForm.dias}
                      onChange={e => setPrazoForm({ ...prazoForm, dias: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#001a54]"
                    />
                  </div>
                </div>
              )}

              {/* TAXA_ADESAO */}
              {modalType === 'TAXA_ADESAO' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Operadora *
                    </label>
                    <select
                      required
                      value={taxaForm.operadora}
                      onChange={e => setTaxaForm({ ...taxaForm, operadora: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#001a54]"
                    >
                      <option value="">Selecione a Operadora...</option>
                      <option value="TODAS">TODAS AS OPERADORAS</option>
                      {groupedRequirements.OPERADORA.map(op => (
                        <option key={op.id} value={op.nome}>
                          {op.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Tipo de Plano
                    </label>
                    <select
                      value={taxaForm.tipoPlano}
                      onChange={e => setTaxaForm({ ...taxaForm, tipoPlano: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#001a54]"
                    >
                      <option value="TODOS">TODOS OS PLANOS</option>
                      {groupedRequirements.TIPO_PLANO.map(tp => (
                        <option key={tp.id} value={tp.nome}>
                          {tp.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Valor Fixo (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="Ex: 30.00"
                      value={taxaForm.valor}
                      onChange={e => setTaxaForm({ ...taxaForm, valor: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-[#001a54] focus:outline-none focus:border-[#001a54]"
                    />
                  </div>
                </div>
              )}

              {/* PERCENTUAL_COMISSAO */}
              {modalType === 'PERCENTUAL_COMISSAO' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Corretor *
                      </label>
                      <select
                        required
                        value={percentualForm.corretor}
                        onChange={e => setPercentualForm({ ...percentualForm, corretor: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#001a54]"
                      >
                        <option value="">Selecione...</option>
                        <option value="TODOS">TODOS</option>
                        {groupedRequirements.CORRETOR.map(c => (
                          <option key={c.id} value={c.nome}>
                            {c.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Operadora *
                      </label>
                      <select
                        required
                        value={percentualForm.operadora}
                        onChange={e => setPercentualForm({ ...percentualForm, operadora: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#001a54]"
                      >
                        <option value="">Selecione...</option>
                        <option value="TODAS">TODAS</option>
                        {groupedRequirements.OPERADORA.map(op => (
                          <option key={op.id} value={op.nome}>
                            {op.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Tipo de Plano
                      </label>
                      <select
                        value={percentualForm.tipoPlano}
                        onChange={e => setPercentualForm({ ...percentualForm, tipoPlano: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#001a54]"
                      >
                        <option value="TODOS">TODOS OS TIPOS</option>
                        {groupedRequirements.TIPO_PLANO.map(tp => (
                          <option key={tp.id} value={tp.nome}>
                            {tp.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Parcela *
                      </label>
                      <select
                        required
                        value={percentualForm.parcela}
                        onChange={e => setPercentualForm({ ...percentualForm, parcela: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#001a54]"
                      >
                        <option value="">Selecione...</option>
                        <option value="TODAS">TODAS AS PARCELAS</option>
                        {Array.from({ length: 12 }).map((_, i) => (
                          <option key={i} value={`${i + 1}ª_PARCELA`}>
                            {i + 1}ª Parcela
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Percentual de Comissão (%) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="Ex: 80.00"
                      value={percentualForm.valor}
                      onChange={e => setPercentualForm({ ...percentualForm, valor: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-[#001a54] focus:outline-none focus:border-[#001a54]"
                    />
                  </div>
                </div>
              )}

              {/* IMPOSTO_CORRETOR */}
              {modalType === 'IMPOSTO_CORRETOR' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Corretor *
                      </label>
                      <select
                        required
                        value={impostoForm.corretor}
                        onChange={e => setImpostoForm({ ...impostoForm, corretor: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#001a54]"
                      >
                        <option value="">Selecione...</option>
                        <option value="TODOS">TODOS OS CORRETORES</option>
                        {groupedRequirements.CORRETOR.map(c => (
                          <option key={c.id} value={c.nome}>
                            {c.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Operadora *
                      </label>
                      <select
                        required
                        value={impostoForm.operadora}
                        onChange={e => setImpostoForm({ ...impostoForm, operadora: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#001a54]"
                      >
                        <option value="">Selecione...</option>
                        <option value="TODAS">TODAS AS OPERADORAS</option>
                        {groupedRequirements.OPERADORA.map(op => (
                          <option key={op.id} value={op.nome}>
                            {op.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Alíquota de Retenção / Imposto (%) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="Ex: 6.00"
                      value={impostoForm.valor}
                      onChange={e => setImpostoForm({ ...impostoForm, valor: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-[#001a54] focus:outline-none focus:border-[#001a54]"
                    />
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#001a54] hover:bg-[#00133d] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  Salvar Parâmetro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CRIAR NOVO TÓPICO */}
      {isTopicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-[#001a54] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Criar Novo Tópico Principal</h3>
                <p className="text-[11px] text-blue-200 mt-0.5">Adiciona uma nova seção raiz à árvore de requisitos</p>
              </div>
              <button
                onClick={() => setIsTopicModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveTopic} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Código do Tópico (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 4.0"
                  value={newTopicCode}
                  onChange={e => setNewTopicCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#001a54]/20 focus:border-[#001a54] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Nome do Tópico Principal *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Regras de Campanhas e Bonificação"
                  value={newTopicName}
                  onChange={e => setNewTopicName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold uppercase focus:ring-2 focus:ring-[#001a54]/20 focus:border-[#001a54] outline-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTopicModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#001a54] hover:bg-[#00133d] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  Criar Tópico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CRIAR NOVO SUB-TÓPICO */}
      {isSubtopicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-[#001a54] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Criar Novo Sub-tópico</h3>
                <p className="text-[11px] text-blue-200 mt-0.5">Vincule um parâmetro ou regra a um tópico existente</p>
              </div>
              <button
                onClick={() => setIsSubtopicModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveSubtopic} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Tópico Pai */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Tópico Pai Principal *
                </label>
                <select
                  value={subtopicParent}
                  onChange={e => {
                    const val = e.target.value;
                    setSubtopicParent(val);
                    if (val === '1.0') setSubtopicType('CORRETOR');
                    else if (val === '2.0') setSubtopicType('PRAZO_PAGAMENTO');
                    else if (val === '3.0') setSubtopicType('TAXA_ADESAO');
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#001a54]"
                >
                  <option value="1.0">1.0 Parâmetros Cadastrais Básicos</option>
                  <option value="2.0">2.0 Prazos de Pagamento e SLA por Operadora</option>
                  <option value="3.0">3.0 Regras Financeiras, Taxas & Comissões</option>
                  {groupedRequirements.TOPICO?.map(top => (
                    <option key={top.id} value={`custom-${top.id}`}>
                      {top.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Se o Tópico Pai for um Custom Topic */}
              {subtopicParent.startsWith('custom-') ? (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Nome do Sub-tópico / Parâmetro *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Regra de Bônus Semestral"
                    value={customSubtopicName}
                    onChange={e => setCustomSubtopicName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold uppercase focus:ring-2 focus:ring-[#001a54]/20 focus:border-[#001a54] outline-none"
                  />
                </div>
              ) : (
                <>
                  {/* Se for 1.0 */}
                  {subtopicParent === '1.0' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Categoria de Cadastro *
                      </label>
                      <select
                        value={subtopicType}
                        onChange={e => setSubtopicType(e.target.value as ProposalRequirement['tipo'])}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#001a54]"
                      >
                        <option value="CORRETOR">1.1 Corretor</option>
                        <option value="OPERADORA">1.2 Operadora</option>
                        <option value="TIPO_PLANO">1.3 Tipo de Plano / Modalidade</option>
                        <option value="CATEGORIA">1.4 Categoria de Proposta</option>
                        <option value="UNIDADE">1.5 Unidade / Filial</option>
                      </select>
                    </div>
                  )}

                  {/* Se for 2.0 */}
                  {subtopicParent === '2.0' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Tipo de Regra *
                      </label>
                      <select
                        value={subtopicType}
                        onChange={e => setSubtopicType(e.target.value as ProposalRequirement['tipo'])}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#001a54]"
                      >
                        <option value="PRAZO_PAGAMENTO">2.1 Prazo de Pagamento (SLA) por Operadora</option>
                      </select>
                    </div>
                  )}

                  {/* Se for 3.0 */}
                  {subtopicParent === '3.0' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Tipo de Regra Financeira *
                      </label>
                      <select
                        value={subtopicType}
                        onChange={e => setSubtopicType(e.target.value as ProposalRequirement['tipo'])}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#001a54]"
                      >
                        <option value="TAXA_ADESAO">3.1 Taxa de Adesão / Implantação (R$)</option>
                        <option value="PERCENTUAL_COMISSAO">3.2 Percentual de Comissão ao Corretor (%)</option>
                        <option value="IMPOSTO_CORRETOR">3.3 Impostos da Nota (NF) / Descontos (%)</option>
                      </select>
                    </div>
                  )}

                  {/* Form fields based on subtopicType */}
                  {(subtopicType === 'CORRETOR' || subtopicType === 'OPERADORA' || subtopicType === 'TIPO_PLANO' || subtopicType === 'CATEGORIA' || subtopicType === 'UNIDADE') && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Nome do Registro *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Digite o nome..."
                        value={simpleName}
                        onChange={e => setSimpleName(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold uppercase focus:ring-2 focus:ring-[#001a54]/20 focus:border-[#001a54] outline-none"
                      />
                    </div>
                  )}

                  {subtopicType === 'PRAZO_PAGAMENTO' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          Operadora *
                        </label>
                        <select
                          required
                          value={prazoForm.operadora}
                          onChange={e => setPrazoForm({ ...prazoForm, operadora: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#001a54]"
                        >
                          <option value="">Selecione a Operadora...</option>
                          {groupedRequirements.OPERADORA.map(op => (
                            <option key={op.id} value={op.nome}>
                              {op.nome}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          Regra / Observação (Opcional)
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Adesão, PJ, Boleto..."
                          value={prazoForm.regra}
                          onChange={e => setPrazoForm({ ...prazoForm, regra: e.target.value.toUpperCase() })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs uppercase focus:outline-none focus:border-[#001a54]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          Prazo em Dias (SLA) *
                        </label>
                        <input
                          type="number"
                          required
                          placeholder="Ex: 5"
                          value={prazoForm.dias}
                          onChange={e => setPrazoForm({ ...prazoForm, dias: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#001a54]"
                        />
                      </div>
                    </div>
                  )}

                  {subtopicType === 'TAXA_ADESAO' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          Operadora *
                        </label>
                        <select
                          required
                          value={taxaForm.operadora}
                          onChange={e => setTaxaForm({ ...taxaForm, operadora: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#001a54]"
                        >
                          <option value="">Selecione a Operadora...</option>
                          <option value="TODAS">TODAS AS OPERADORAS</option>
                          {groupedRequirements.OPERADORA.map(op => (
                            <option key={op.id} value={op.nome}>
                              {op.nome}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          Tipo de Plano
                        </label>
                        <select
                          value={taxaForm.tipoPlano}
                          onChange={e => setTaxaForm({ ...taxaForm, tipoPlano: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#001a54]"
                        >
                          <option value="TODOS">TODOS OS PLANOS</option>
                          {groupedRequirements.TIPO_PLANO.map(tp => (
                            <option key={tp.id} value={tp.nome}>
                              {tp.nome}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          Valor Fixo (R$) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="Ex: 30.00"
                          value={taxaForm.valor}
                          onChange={e => setTaxaForm({ ...taxaForm, valor: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-[#001a54] focus:outline-none focus:border-[#001a54]"
                        />
                      </div>
                    </div>
                  )}

                  {subtopicType === 'PERCENTUAL_COMISSAO' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                            Corretor *
                          </label>
                          <select
                            required
                            value={percentualForm.corretor}
                            onChange={e => setPercentualForm({ ...percentualForm, corretor: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#001a54]"
                          >
                            <option value="">Selecione...</option>
                            <option value="TODOS">TODOS</option>
                            {groupedRequirements.CORRETOR.map(c => (
                              <option key={c.id} value={c.nome}>
                                {c.nome}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                            Operadora *
                          </label>
                          <select
                            required
                            value={percentualForm.operadora}
                            onChange={e => setPercentualForm({ ...percentualForm, operadora: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#001a54]"
                          >
                            <option value="">Selecione...</option>
                            <option value="TODAS">TODAS</option>
                            {groupedRequirements.OPERADORA.map(op => (
                              <option key={op.id} value={op.nome}>
                                {op.nome}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                            Tipo de Plano
                          </label>
                          <select
                            value={percentualForm.tipoPlano}
                            onChange={e => setPercentualForm({ ...percentualForm, tipoPlano: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#001a54]"
                          >
                            <option value="TODOS">TODOS OS TIPOS</option>
                            {groupedRequirements.TIPO_PLANO.map(tp => (
                              <option key={tp.id} value={tp.nome}>
                                {tp.nome}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                            Parcela *
                          </label>
                          <select
                            required
                            value={percentualForm.parcela}
                            onChange={e => setPercentualForm({ ...percentualForm, parcela: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#001a54]"
                          >
                            <option value="">Selecione...</option>
                            <option value="TODAS">TODAS AS PARCELAS</option>
                            {Array.from({ length: 12 }).map((_, i) => (
                              <option key={i} value={`${i + 1}ª_PARCELA`}>
                                {i + 1}ª Parcela
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          Percentual de Comissão (%) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="Ex: 80.00"
                          value={percentualForm.valor}
                          onChange={e => setPercentualForm({ ...percentualForm, valor: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-[#001a54] focus:outline-none focus:border-[#001a54]"
                        />
                      </div>
                    </div>
                  )}

                  {subtopicType === 'IMPOSTO_CORRETOR' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                            Corretor *
                          </label>
                          <select
                            required
                            value={impostoForm.corretor}
                            onChange={e => setImpostoForm({ ...impostoForm, corretor: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#001a54]"
                          >
                            <option value="">Selecione...</option>
                            <option value="TODOS">TODOS OS CORRETORES</option>
                            {groupedRequirements.CORRETOR.map(c => (
                              <option key={c.id} value={c.nome}>
                                {c.nome}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                            Operadora *
                          </label>
                          <select
                            required
                            value={impostoForm.operadora}
                            onChange={e => setImpostoForm({ ...impostoForm, operadora: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#001a54]"
                          >
                            <option value="">Selecione...</option>
                            <option value="TODAS">TODAS AS OPERADORAS</option>
                            {groupedRequirements.OPERADORA.map(op => (
                              <option key={op.id} value={op.nome}>
                                {op.nome}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          Alíquota de Retenção / Imposto (%) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="Ex: 6.00"
                          value={impostoForm.valor}
                          onChange={e => setImpostoForm({ ...impostoForm, valor: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-[#001a54] focus:outline-none focus:border-[#001a54]"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubtopicModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#001a54] hover:bg-[#00133d] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  Criar Sub-tópico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalStructureView;
