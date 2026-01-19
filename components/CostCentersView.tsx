
import React, { useState } from 'react';
import { CostCenter } from '../types';

interface CostCentersViewProps {
  costCenters: CostCenter[];
  onSave: (cc: CostCenter) => void;
  onDelete: (id: string) => void;
}

const CostCentersView: React.FC<CostCentersViewProps> = ({ costCenters, onSave, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCC, setEditingCC] = useState<CostCenter | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'DESPESA' as 'RECEITA' | 'DESPESA',
    subItens: [] as string[],
    newSubItem: ''
  });

  const handleOpenNew = () => {
    setEditingCC(null);
    setFormData({ nome: '', tipo: 'DESPESA', subItens: [], newSubItem: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cc: CostCenter) => {
    setEditingCC(cc);
    setFormData({
      nome: cc.nome,
      tipo: cc.tipo,
      subItens: [...cc.subItens],
      newSubItem: ''
    });
    setIsModalOpen(true);
  };

  const handleAddSubItem = () => {
    if (!formData.newSubItem.trim()) return;
    if (formData.subItens.includes(formData.newSubItem.trim().toUpperCase())) {
      alert('Este item já existe.');
      return;
    }
    setFormData({
      ...formData,
      subItens: [...formData.subItens, formData.newSubItem.trim().toUpperCase()],
      newSubItem: ''
    });
  };

  const handleRemoveSubItem = (index: number) => {
    const newSubItens = [...formData.subItens];
    newSubItens.splice(index, 1);
    setFormData({ ...formData, subItens: newSubItens });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) return;

    const cc: CostCenter = {
      id: editingCC?.id || Math.random().toString(36).substr(2, 9),
      nome: formData.nome.trim().toUpperCase(),
      tipo: formData.tipo,
      subItens: formData.subItens
    };

    onSave(cc);
    setIsModalOpen(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm min-h-[500px]">
      <div className="mb-8 border-b border-gray-100 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-blue-900 uppercase">Gestão de Centro de Custo</h2>
          <p className="text-sm text-gray-500">Organize a estrutura financeira da sua empresa</p>
        </div>
        <button 
          onClick={handleOpenNew}
          className="bg-blue-900 text-white px-6 py-2 rounded font-bold text-sm shadow-md hover:bg-blue-800 transition-colors flex items-center gap-2"
        >
          <i className="fa-solid fa-plus"></i> Novo Centro de Custo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {costCenters.map((cc, idx) => (
          <div key={cc.id} className="border border-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
             <div className={`${cc.tipo === 'RECEITA' ? 'bg-green-600' : 'bg-blue-900'} p-3 flex items-center justify-between text-white`}>
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="bg-white/20 w-6 h-6 flex-shrink-0 flex items-center justify-center rounded text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  <h3 className="text-xs font-black uppercase truncate" title={cc.nome}>
                    {cc.nome}
                  </h3>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button 
                    onClick={() => handleOpenEdit(cc)}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                    title="Editar"
                  >
                    <i className="fa-solid fa-pen text-[10px]"></i>
                  </button>
                  <button 
                    onClick={() => onDelete(cc.id)}
                    className="p-1 hover:bg-red-500 rounded transition-colors"
                    title="Excluir"
                  >
                    <i className="fa-solid fa-trash text-[10px]"></i>
                  </button>
                </div>
             </div>
             <div className="p-3 space-y-1 flex-1 bg-gray-50/50">
                <div className="text-[9px] font-bold text-gray-400 uppercase mb-2">Sub-itens:</div>
                {cc.subItens.map((item, i) => (
                  <div key={i} className="text-[10px] text-gray-600 font-semibold px-2 py-1 bg-white border border-gray-100 rounded flex items-center justify-between group">
                    <span>{item}</span>
                  </div>
                ))}
                {cc.subItens.length === 0 && (
                  <div className="text-[10px] text-gray-400 italic py-2">Nenhum sub-item cadastrado</div>
                )}
             </div>
             <div className="px-3 py-2 bg-gray-100 border-t border-gray-200 flex justify-between items-center">
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${cc.tipo === 'RECEITA' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {cc.tipo}
                </span>
                <span className="text-[9px] text-gray-500 font-bold">{cc.subItens.length} itens</span>
             </div>
          </div>
        ))}
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-blue-900 p-5 flex justify-between items-center text-white">
              <h3 className="text-lg font-bold uppercase tracking-tight">
                {editingCC ? 'Alterar Centro de Custo' : 'Novo Centro de Custo'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white transition-colors text-2xl">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-blue-900 uppercase mb-1">Nome do Centro</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 outline-none uppercase transition-all"
                    placeholder="Ex: DESP. VIAGENS"
                    value={formData.nome}
                    onChange={e => setFormData({...formData, nome: e.target.value})}
                    required 
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-blue-900 uppercase mb-1">Tipo de Fluxo</label>
                  <select 
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 outline-none transition-all"
                    value={formData.tipo}
                    onChange={e => setFormData({...formData, tipo: e.target.value as 'RECEITA' | 'DESPESA'})}
                  >
                    <option value="DESPESA">DESPESA</option>
                    <option value="RECEITA">RECEITA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-blue-900 uppercase mb-1">Gerenciar Sub-itens</label>
                <div className="flex gap-2 mb-3">
                  <input 
                    type="text" 
                    className="flex-1 p-2 border border-gray-300 rounded text-sm outline-none focus:border-blue-900 uppercase"
                    placeholder="Novo sub-item..."
                    value={formData.newSubItem}
                    onChange={e => setFormData({...formData, newSubItem: e.target.value})}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddSubItem())}
                  />
                  <button 
                    type="button"
                    onClick={handleAddSubItem}
                    className="bg-orange-500 text-white px-4 py-2 rounded font-bold text-sm hover:bg-orange-600 transition-colors"
                  >
                    ADD
                  </button>
                </div>
                
                <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-lg p-2 bg-gray-50 space-y-1">
                  {formData.subItens.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200 text-xs font-semibold group">
                      <span className="uppercase text-gray-700">{item}</span>
                      <button 
                        type="button"
                        onClick={() => handleRemoveSubItem(idx)}
                        className="text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  ))}
                  {formData.subItens.length === 0 && (
                    <div className="text-center py-4 text-gray-400 text-xs italic">Adicione sub-itens para classificar seus lançamentos.</div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 uppercase tracking-widest transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-3 bg-blue-900 text-white rounded-lg text-xs font-bold hover:bg-blue-800 shadow-lg uppercase tracking-widest transition-all"
                >
                  {editingCC ? 'Salvar Alterações' : 'Criar Centro de Custo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostCentersView;
