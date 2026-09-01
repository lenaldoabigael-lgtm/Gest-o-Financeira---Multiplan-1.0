import React, { useState, useMemo } from 'react';
import { CostCenter } from '../types';

interface CostCentersViewProps {
  costCenters: CostCenter[];
  onSave: (cc: CostCenter) => void;
  onDelete: (id: string) => void;
}

interface TreeNode {
  id: string;
  code: string;
  name: string;
  fullName: string;
  tipo: 'RECEITA' | 'DESPESA';
  isParent: boolean;
  costCenterId?: string;
  subItemIndex?: number;
  children: TreeNode[];
}

const DEFAULT_INITIAL_TREE: Omit<CostCenter, 'id'>[] = [
  {
    nome: '1.1 Serviços Contratados',
    tipo: 'RECEITA',
    subItens: ['1.1.1 Consultoria', '1.1.2 Assessoria']
  },
  {
    nome: '1.2 Vendas de Produtos',
    tipo: 'RECEITA',
    subItens: ['1.2.1 Planos Individuais', '1.2.2 Planos Empresariais']
  },
  {
    nome: '1.3 RECEITA',
    tipo: 'RECEITA',
    subItens: [
      '1.3.1 COMISSÃO HAPVIDA',
      '1.3.2 COMISSÃO SULAMÉRICA',
      '1.3.3 COMISSÃO BRADESCO',
      '1.3.4 COMISSÃO AMIL',
      '1.3.5 COMISSÃO NOTREDAME/INTERMÉDICA',
      '1.3.6 COMISSÃO ALLIANZ',
      '1.3.7 COMISSÃO QUALICORP',
      '1.3.8 COMISSÃO UNIMED',
      '1.3.9 COMISSÃO PORTO SEGURO',
      '1.3.10 COMISSÃO SOMPO',
      '1.3.11 COMISSÃO ASSIM SAÚDE',
      '1.3.12 COMISSÃO DEMAIS OPERADORAS'
    ]
  },
  {
    nome: '2.1 Pessoal',
    tipo: 'DESPESA',
    subItens: ['2.1.1 Salários e Encargos', '2.1.2 Benefícios']
  },
  {
    nome: '2.2 Infraestrutura e TI',
    tipo: 'DESPESA',
    subItens: ['2.2.1 Licenças e Softwares', '2.2.2 Internet e Telefonia']
  },
  {
    nome: '2.3.1 COMISSÕES',
    tipo: 'DESPESA',
    subItens: ['2.3.1.1 CORRETORES', '2.3.1.2 PREMIAÇÕES']
  },
  {
    nome: '2.3.4 DESP. GESTORES',
    tipo: 'DESPESA',
    subItens: [
      '2.3.4.1 ADIANT. VANDER',
      '2.3.4.2 ADIANT. HELEN',
      '2.3.4.3 ADIANT. ANNY',
      '2.3.4.4 ADIANT. MARCOS',
      '2.3.4.5 TAXA DE GESTÃO DO GRUPO',
      '2.3.4.6 TAXA DE GESTÃO'
    ]
  },
  {
    nome: '2.3.5 DESP. PARCEIRO GESSICA',
    tipo: 'DESPESA',
    subItens: ['2.3.5.1 ADIANT. GESSICA']
  },
  {
    nome: '2.3.6 DESP. PARCEIRO MICHELE',
    tipo: 'DESPESA',
    subItens: ['2.3.6.1 ADIANT. MICHELE']
  },
  {
    nome: '2.3.7 DESP. PARCEIRO VIVIANE',
    tipo: 'DESPESA',
    subItens: ['2.3.7.1 ADIANT. VIVIANE']
  },
  {
    nome: '2.3.8 DESP.AVULSO',
    tipo: 'DESPESA',
    subItens: ['2.3.8.1 ADIANT. AVULSO', '2.3.8.2 REPASSES DIVERSOS']
  },
  {
    nome: '2.3.9 DESP.CAMPO DO BRITO',
    tipo: 'DESPESA',
    subItens: ['2.3.9.1 ADIANT. CAMPO DO BRITO']
  },
  {
    nome: '2.3.10 DESP.ESCRITORIO',
    tipo: 'DESPESA',
    subItens: ['2.3.10.1 ALUGUEL E CONDOMÍNIO', '2.3.10.2 ENERGIA E ÁGUA', '2.3.10.3 LIMPEZA E COPA']
  },
  {
    nome: '2.3.11 DESP.MATERIA PRIMA',
    tipo: 'DESPESA',
    subItens: ['2.3.11.1 MATERIAIS DE ESCRITÓRIO', '2.3.11.2 GRÁFICA E IMPRESSÕES']
  },
  {
    nome: '2.3.12 DESP.SAO CRISTOVAO',
    tipo: 'DESPESA',
    subItens: ['2.3.12.1 ADIANT. SAO CRISTOVAO']
  }
];

export const CostCentersView: React.FC<CostCentersViewProps> = ({ costCenters, onSave, onDelete }) => {
  // Collapse state for tree branches
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'TODOS' | 'RECEITA' | 'DESPESA'>('TODOS');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCC, setEditingCC] = useState<CostCenter | null>(null);
  const [parentForNewSub, setParentForNewSub] = useState<CostCenter | null>(null);
  
  // Quick subitem addition state
  const [isAddSubModalOpen, setIsAddSubModalOpen] = useState(false);
  const [newSubItemName, setNewSubItemName] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    nome: '',
    tipo: 'DESPESA' as 'RECEITA' | 'DESPESA',
    subItens: [] as string[],
    newSubItemInput: ''
  });

  // Toggle node collapse
  const toggleCollapse = (id: string) => {
    setCollapsedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const collapseAll = () => {
    const all: Record<string, boolean> = {
      'root-receitas': true,
      'root-despesas': true
    };
    effectiveCostCenters.forEach(cc => {
      all[cc.id] = true;
    });
    setCollapsedNodes(all);
  };

  const expandAll = () => {
    setCollapsedNodes({});
  };

  // If costCenters is empty from DB, use fallback list
  const effectiveCostCenters = useMemo(() => {
    if (costCenters && costCenters.length > 0) {
      return costCenters;
    }
    return DEFAULT_INITIAL_TREE.map((item, idx) => ({
      id: `default-${idx}`,
      nome: item.nome,
      tipo: item.tipo,
      subItens: item.subItens
    }));
  }, [costCenters]);

  // Split and sort into Receitas and Despesas
  const receitasList = useMemo(() => {
    return effectiveCostCenters.filter(cc => cc.tipo === 'RECEITA');
  }, [effectiveCostCenters]);

  const despesasList = useMemo(() => {
    return effectiveCostCenters.filter(cc => cc.tipo === 'DESPESA');
  }, [effectiveCostCenters]);

  // Open Modal for New Root / Category
  const handleOpenNew = (defaultTipo: 'RECEITA' | 'DESPESA' = 'DESPESA') => {
    setEditingCC(null);
    setParentForNewSub(null);
    setFormData({
      code: '',
      nome: '',
      tipo: defaultTipo,
      subItens: [],
      newSubItemInput: ''
    });
    setIsModalOpen(true);
  };

  // Open Modal to Edit an existing Category
  const handleOpenEdit = (cc: CostCenter) => {
    setEditingCC(cc);
    setParentForNewSub(null);
    
    // Check if name has a code prefix (e.g. "2.3.4 DESP. GESTORES")
    const match = cc.nome.match(/^([\d.]+)\s+(.*)$/);
    if (match) {
      setFormData({
        code: match[1],
        nome: match[2],
        tipo: cc.tipo,
        subItens: [...cc.subItens],
        newSubItemInput: ''
      });
    } else {
      setFormData({
        code: '',
        nome: cc.nome,
        tipo: cc.tipo,
        subItens: [...cc.subItens],
        newSubItemInput: ''
      });
    }
    setIsModalOpen(true);
  };

  // Quick Add Sub-Item to a Category
  const handleOpenQuickAddSub = (cc: CostCenter) => {
    setParentForNewSub(cc);
    setNewSubItemName('');
    setIsAddSubModalOpen(true);
  };

  const handleSaveQuickSubItem = () => {
    if (!parentForNewSub || !newSubItemName.trim()) return;

    const trimmed = newSubItemName.trim();
    if (parentForNewSub.subItens.includes(trimmed)) {
      alert('Este sub-item já existe nesta categoria.');
      return;
    }

    const updatedCC: CostCenter = {
      ...parentForNewSub,
      subItens: [...parentForNewSub.subItens, trimmed]
    };

    onSave(updatedCC);
    setIsAddSubModalOpen(false);
    setNewSubItemName('');
    // Ensure parent is expanded so user sees the new item
    setCollapsedNodes(prev => ({ ...prev, [parentForNewSub.id]: false }));
  };

  // Sub-items management in main modal
  const handleAddSubItemToForm = () => {
    if (!formData.newSubItemInput.trim()) return;
    const trimmed = formData.newSubItemInput.trim();
    if (formData.subItens.includes(trimmed)) {
      alert('Este sub-item já foi adicionado.');
      return;
    }
    setFormData({
      ...formData,
      subItens: [...formData.subItens, trimmed],
      newSubItemInput: ''
    });
  };

  const handleRemoveSubItemFromForm = (index: number) => {
    const updated = [...formData.subItens];
    updated.splice(index, 1);
    setFormData({ ...formData, subItens: updated });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) return;

    let finalName = formData.nome.trim();
    if (formData.code.trim()) {
      finalName = `${formData.code.trim()} ${finalName}`;
    }

    const payload: Partial<CostCenter> = {
      nome: finalName,
      tipo: formData.tipo,
      subItens: formData.subItens
    };

    if (editingCC?.id && !editingCC.id.startsWith('default-')) {
      payload.id = editingCC.id;
    }

    onSave(payload as CostCenter);
    setIsModalOpen(false);
  };

  const handleDeleteSubItemFromCC = (cc: CostCenter, subItemIndex: number) => {
    if (!confirm('Deseja realmente excluir este sub-item?')) return;
    const updatedSubItens = [...cc.subItens];
    updatedSubItens.splice(subItemIndex, 1);
    onSave({
      ...cc,
      subItens: updatedSubItens
    });
  };

  const handleDeleteCC = (cc: CostCenter) => {
    if (confirm(`Deseja realmente excluir o centro de custo "${cc.nome}" e todos os seus sub-itens?`)) {
      onDelete(cc.id);
    }
  };

  // Helper to format node label
  const parseNodeLabel = (rawName: string, fallbackCode: string) => {
    const match = rawName.match(/^([\d.]+)\s+(.*)$/);
    if (match) {
      return { code: match[1], label: match[2] };
    }
    return { code: fallbackCode, label: rawName };
  };

  // Filter check
  const matchesSearch = (text: string) => {
    if (!searchTerm.trim()) return true;
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  };

  // Total stats
  const totalCategorias = effectiveCostCenters.length;
  const totalSubItens = effectiveCostCenters.reduce((acc, cc) => acc + (cc.subItens?.length || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header matching the uploaded screenshot */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#001a54] tracking-tight">
            Centro de Custo
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
            Cadastre a estrutura hierárquica de receitas e despesas
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Bar */}
          <div className="relative min-w-[200px] sm:min-w-[260px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar conta ou sub-item..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#001a54]/20 focus:border-[#001a54] transition-all placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                &times;
              </button>
            )}
          </div>

          {/* Expand / Collapse Controls */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
            <button
              onClick={expandAll}
              title="Expandir todas as pastas"
              className="px-2.5 py-1.5 hover:bg-white hover:text-[#001a54] rounded-lg transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">unfold_more</span>
              <span className="hidden sm:inline">Expandir</span>
            </button>
            <button
              onClick={collapseAll}
              title="Recolher todas as pastas"
              className="px-2.5 py-1.5 hover:bg-white hover:text-[#001a54] rounded-lg transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">unfold_less</span>
              <span className="hidden sm:inline">Recolher</span>
            </button>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={() => handleOpenNew('RECEITA')}
            className="bg-[#001a54] hover:bg-[#00133d] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Adicionar Categoria Principal</span>
          </button>
        </div>
      </div>

      {/* Main Hierarchy Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 min-h-[500px]">
        {/* Quick summary stats bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Plano de Contas Hierárquico</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#ebf2fe] text-[#001a54]">
              {totalCategorias} Categorias
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
              {totalSubItens} Sub-itens
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-slate-400">Filtrar:</span>
            <button
              onClick={() => setFilterType('TODOS')}
              className={`px-2 py-1 rounded-md font-semibold transition-colors ${
                filterType === 'TODOS' ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('RECEITA')}
              className={`px-2 py-1 rounded-md font-semibold transition-colors ${
                filterType === 'RECEITA' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              1.0 Receitas
            </button>
            <button
              onClick={() => setFilterType('DESPESA')}
              className={`px-2 py-1 rounded-md font-semibold transition-colors ${
                filterType === 'DESPESA' ? 'bg-rose-100 text-rose-800' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              2.0 Despesas
            </button>
          </div>
        </div>

        {/* Tree Structure */}
        <div className="space-y-8 font-sans">
          {/* SECTION 1: 1.0 Receitas */}
          {(filterType === 'TODOS' || filterType === 'RECEITA') && (
            <div className="tree-root-section">
              {/* Root 1.0 Node */}
              <div className="group/root flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-50 transition-colors">
                <div
                  className="flex items-center gap-2 cursor-pointer select-none"
                  onClick={() => toggleCollapse('root-receitas')}
                >
                  <button className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-transform">
                    <span
                      className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${
                        collapsedNodes['root-receitas'] ? '-rotate-90' : ''
                      }`}
                    >
                      arrow_drop_down
                    </span>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#001a54]">1.0</span>
                    <span className="font-bold text-sm text-[#001a54]">Receitas</span>
                  </div>
                </div>

                <div className="opacity-0 group-hover/root:opacity-100 transition-opacity flex items-center gap-1">
                  <button
                    onClick={() => handleOpenNew('RECEITA')}
                    className="px-2 py-1 text-[11px] font-semibold text-[#001a54] hover:bg-[#ebf2fe] rounded-md transition-colors flex items-center gap-1"
                    title="Adicionar Categoria em Receitas"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    <span>Nova Categoria</span>
                  </button>
                </div>
              </div>

              {/* Children of 1.0 */}
              {!collapsedNodes['root-receitas'] && (
                <div className="ml-5 pl-4 border-l border-slate-200 mt-1 space-y-1">
                  {receitasList.length === 0 ? (
                    <div className="py-2 pl-4 text-xs text-slate-400 italic">
                      Nenhuma categoria de receita cadastrada.
                    </div>
                  ) : (
                    receitasList.map((cc, idx) => {
                      const isCollapsed = !!collapsedNodes[cc.id];
                      const { code, label } = parseNodeLabel(cc.nome, `1.${idx + 1}`);
                      const hasSubItens = cc.subItens && cc.subItens.length > 0;
                      const isCategoryMatching = matchesSearch(cc.nome) || cc.subItens.some(s => matchesSearch(s));

                      if (!isCategoryMatching) return null;

                      return (
                        <div key={cc.id} className="relative group/category">
                          {/* Node Row */}
                          <div className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-slate-50 transition-colors">
                            <div
                              className="flex items-center gap-2 cursor-pointer select-none flex-1 min-w-0"
                              onClick={() => hasSubItens && toggleCollapse(cc.id)}
                            >
                              {hasSubItens ? (
                                <button className="w-4 h-4 flex items-center justify-center text-slate-500 hover:text-slate-800">
                                  <span
                                    className={`material-symbols-outlined text-[16px] transition-transform duration-150 ${
                                      isCollapsed ? '-rotate-90' : ''
                                    }`}
                                  >
                                    arrow_drop_down
                                  </span>
                                </button>
                              ) : (
                                <span className="w-4 h-4 inline-block text-slate-300 text-center font-mono text-[10px]">
                                  •
                                </span>
                              )}

                              <div className="flex items-center gap-2 truncate">
                                <span className="font-semibold text-xs text-slate-800">{code}</span>
                                <span className="font-semibold text-xs text-slate-800 truncate">{label}</span>
                              </div>
                            </div>

                            {/* Node Actions on Hover */}
                            <div className="opacity-0 group-hover/category:opacity-100 transition-opacity flex items-center gap-1 shrink-0 ml-2">
                              <button
                                onClick={() => handleOpenQuickAddSub(cc)}
                                className="p-1 text-slate-500 hover:text-[#001a54] hover:bg-[#ebf2fe] rounded transition-colors"
                                title="Adicionar Sub-item"
                              >
                                <span className="material-symbols-outlined text-[15px]">add</span>
                              </button>
                              <button
                                onClick={() => handleOpenEdit(cc)}
                                className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Editar Categoria"
                              >
                                <span className="material-symbols-outlined text-[15px]">edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteCC(cc)}
                                className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                title="Excluir Categoria"
                              >
                                <span className="material-symbols-outlined text-[15px]">delete</span>
                              </button>
                            </div>
                          </div>

                          {/* Leaf / Sub-items */}
                          {hasSubItens && !isCollapsed && (
                            <div className="ml-5 pl-4 border-l border-slate-200 mt-0.5 space-y-0.5">
                              {cc.subItens.map((sub, subIdx) => {
                                const subParsed = parseNodeLabel(sub, `${code}.${subIdx + 1}`);
                                if (searchTerm && !matchesSearch(sub) && !matchesSearch(cc.nome)) return null;

                                return (
                                  <div
                                    key={subIdx}
                                    className="group/sub flex items-center justify-between py-1 px-2 rounded hover:bg-slate-50/80 transition-colors"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="w-3 text-slate-300 text-[10px] select-none font-mono">—</span>
                                      <span className="text-xs text-slate-600 font-medium">{subParsed.code}</span>
                                      <span className="text-xs text-slate-700 font-normal truncate">{subParsed.label}</span>
                                    </div>

                                    <div className="opacity-0 group-hover/sub:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() => handleDeleteSubItemFromCC(cc, subIdx)}
                                        className="p-0.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                        title="Excluir este sub-item"
                                      >
                                        <span className="material-symbols-outlined text-[14px]">close</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* DIVIDER LINE BETWEEN 1.0 AND 2.0 */}
          {filterType === 'TODOS' && <div className="border-t border-slate-100 my-6" />}

          {/* SECTION 2: 2.0 Despesas Operacionais */}
          {(filterType === 'TODOS' || filterType === 'DESPESA') && (
            <div className="tree-root-section">
              {/* Root 2.0 Node */}
              <div className="group/root flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-50 transition-colors">
                <div
                  className="flex items-center gap-2 cursor-pointer select-none"
                  onClick={() => toggleCollapse('root-despesas')}
                >
                  <button className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-transform">
                    <span
                      className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${
                        collapsedNodes['root-despesas'] ? '-rotate-90' : ''
                      }`}
                    >
                      arrow_drop_down
                    </span>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#001a54]">2.0</span>
                    <span className="font-bold text-sm text-[#001a54]">Despesas Operacionais</span>
                  </div>
                </div>

                <div className="opacity-0 group-hover/root:opacity-100 transition-opacity flex items-center gap-1">
                  <button
                    onClick={() => handleOpenNew('DESPESA')}
                    className="px-2 py-1 text-[11px] font-semibold text-[#001a54] hover:bg-[#ebf2fe] rounded-md transition-colors flex items-center gap-1"
                    title="Adicionar Categoria em Despesas"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    <span>Nova Categoria</span>
                  </button>
                </div>
              </div>

              {/* Children of 2.0 */}
              {!collapsedNodes['root-despesas'] && (
                <div className="ml-5 pl-4 border-l border-slate-200 mt-1 space-y-1">
                  {despesasList.length === 0 ? (
                    <div className="py-2 pl-4 text-xs text-slate-400 italic">
                      Nenhuma categoria de despesa cadastrada.
                    </div>
                  ) : (
                    despesasList.map((cc, idx) => {
                      const isCollapsed = !!collapsedNodes[cc.id];
                      const { code, label } = parseNodeLabel(cc.nome, `2.${idx + 1}`);
                      const hasSubItens = cc.subItens && cc.subItens.length > 0;
                      const isCategoryMatching = matchesSearch(cc.nome) || cc.subItens.some(s => matchesSearch(s));

                      if (!isCategoryMatching) return null;

                      return (
                        <div key={cc.id} className="relative group/category">
                          {/* Node Row */}
                          <div className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-slate-50 transition-colors">
                            <div
                              className="flex items-center gap-2 cursor-pointer select-none flex-1 min-w-0"
                              onClick={() => hasSubItens && toggleCollapse(cc.id)}
                            >
                              {hasSubItens ? (
                                <button className="w-4 h-4 flex items-center justify-center text-slate-500 hover:text-slate-800">
                                  <span
                                    className={`material-symbols-outlined text-[16px] transition-transform duration-150 ${
                                      isCollapsed ? '-rotate-90' : ''
                                    }`}
                                  >
                                    arrow_drop_down
                                  </span>
                                </button>
                              ) : (
                                <span className="w-4 h-4 inline-block text-slate-300 text-center font-mono text-[10px]">
                                  •
                                </span>
                              )}

                              <div className="flex items-center gap-2 truncate">
                                <span className="font-semibold text-xs text-slate-800">{code}</span>
                                <span className="font-semibold text-xs text-slate-800 truncate">{label}</span>
                              </div>
                            </div>

                            {/* Node Actions on Hover */}
                            <div className="opacity-0 group-hover/category:opacity-100 transition-opacity flex items-center gap-1 shrink-0 ml-2">
                              <button
                                onClick={() => handleOpenQuickAddSub(cc)}
                                className="p-1 text-slate-500 hover:text-[#001a54] hover:bg-[#ebf2fe] rounded transition-colors"
                                title="Adicionar Sub-item"
                              >
                                <span className="material-symbols-outlined text-[15px]">add</span>
                              </button>
                              <button
                                onClick={() => handleOpenEdit(cc)}
                                className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Editar Categoria"
                              >
                                <span className="material-symbols-outlined text-[15px]">edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteCC(cc)}
                                className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                title="Excluir Categoria"
                              >
                                <span className="material-symbols-outlined text-[15px]">delete</span>
                              </button>
                            </div>
                          </div>

                          {/* Leaf / Sub-items */}
                          {hasSubItens && !isCollapsed && (
                            <div className="ml-5 pl-4 border-l border-slate-200 mt-0.5 space-y-0.5">
                              {cc.subItens.map((sub, subIdx) => {
                                const subParsed = parseNodeLabel(sub, `${code}.${subIdx + 1}`);
                                if (searchTerm && !matchesSearch(sub) && !matchesSearch(cc.nome)) return null;

                                return (
                                  <div
                                    key={subIdx}
                                    className="group/sub flex items-center justify-between py-1 px-2 rounded hover:bg-slate-50/80 transition-colors"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="w-3 text-slate-300 text-[10px] select-none font-mono">—</span>
                                      <span className="text-xs text-slate-600 font-medium">{subParsed.code}</span>
                                      <span className="text-xs text-slate-700 font-normal truncate">{subParsed.label}</span>
                                    </div>

                                    <div className="opacity-0 group-hover/sub:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() => handleDeleteSubItemFromCC(cc, subIdx)}
                                        className="p-0.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                        title="Excluir este sub-item"
                                      >
                                        <span className="material-symbols-outlined text-[14px]">close</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Create / Edit Category */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150 border border-slate-100">
            <div className="bg-[#001a54] p-5 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px]">account_tree</span>
                <h3 className="text-base font-bold tracking-tight">
                  {editingCC ? 'Editar Categoria' : 'Nova Categoria'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Código (ex: 2.3.4)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-[#001a54]/20 focus:border-[#001a54] outline-none"
                    placeholder="2.3.4"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Nome da Categoria *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs uppercase focus:ring-2 focus:ring-[#001a54]/20 focus:border-[#001a54] outline-none"
                    placeholder="Ex: DESP. GESTORES"
                    value={formData.nome}
                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Grupo Raiz / Tipo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipo: 'RECEITA' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      formData.tipo === 'RECEITA'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                    <span>1.0 Receitas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipo: 'DESPESA' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      formData.tipo === 'DESPESA'
                        ? 'bg-rose-50 border-rose-500 text-rose-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                    <span>2.0 Despesas</span>
                  </button>
                </div>
              </div>

              {/* Sub-itens list inside modal */}
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Sub-itens vinculados ({formData.subItens.length})
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs uppercase focus:ring-2 focus:ring-[#001a54]/20 focus:border-[#001a54] outline-none"
                    placeholder="Ex: 2.3.4.1 ADIANT. VANDER"
                    value={formData.newSubItemInput}
                    onChange={e => setFormData({ ...formData, newSubItemInput: e.target.value })}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubItemToForm();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddSubItemToForm}
                    className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors"
                  >
                    + Adicionar
                  </button>
                </div>

                <div className="max-h-40 overflow-y-auto border border-slate-100 rounded-xl p-2 bg-slate-50/70 space-y-1">
                  {formData.subItens.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200/70 text-xs text-slate-700 font-medium group"
                    >
                      <span className="truncate">{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubItemFromForm(idx)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Remover"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </div>
                  ))}
                  {formData.subItens.length === 0 && (
                    <div className="text-center py-4 text-slate-400 text-xs italic">
                      Nenhum sub-item adicionado. Você também pode adicioná-los depois.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#001a54] text-white rounded-xl text-xs font-bold hover:bg-[#00133d] shadow-sm transition-all"
                >
                  {editingCC ? 'Salvar Alterações' : 'Criar Categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Quick Add Sub-Item */}
      {isAddSubModalOpen && parentForNewSub && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150 border border-slate-100">
            <div className="bg-[#001a54] p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                <h3 className="text-sm font-bold tracking-tight">Adicionar Sub-item</h3>
              </div>
              <button
                onClick={() => setIsAddSubModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">
                  Categoria Pai
                </span>
                <span className="font-bold text-[#001a54]">{parentForNewSub.nome}</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Nome do Sub-item *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs uppercase focus:ring-2 focus:ring-[#001a54]/20 focus:border-[#001a54] outline-none"
                  placeholder="Ex: 2.3.4.7 NOVO ADIANTAMENTO"
                  value={newSubItemName}
                  onChange={e => setNewSubItemName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveQuickSubItem();
                    }
                  }}
                  autoFocus
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddSubModalOpen(false)}
                  className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuickSubItem}
                  disabled={!newSubItemName.trim()}
                  className="flex-1 py-2 bg-[#001a54] text-white rounded-xl text-xs font-bold hover:bg-[#00133d] disabled:opacity-50 transition-all"
                >
                  Salvar Sub-item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostCentersView;
