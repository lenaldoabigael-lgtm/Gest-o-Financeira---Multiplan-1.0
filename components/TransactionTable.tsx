
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, Status } from '../types';
import { COST_CENTERS } from '../constants';

interface TransactionTableProps {
  type: TransactionType;
  transactions: Transaction[];
  onAdd: (transaction: Transaction) => void;
  onUpdate: (transaction: Transaction) => void;
  onDelete: (ids: string[]) => void;
}

const TransactionTable: React.FC<TransactionTableProps> = ({ type, transactions, onAdd, onUpdate, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    vencimento: new Date().toISOString().split('T')[0],
    pagamento: '',
    descricao: '',
    valor: '',
    formaPagamento: 'PIX',
    centroCusto: '',
    subItem: '',
    status: 'PENDENTE' as Status,
    conta: 'GERAL'
  });

  // Filtrar centros de custo pelo tipo (Receita ou Despesa)
  const availableCostCenters = COST_CENTERS.filter(cc => cc.tipo === (type === 'RECEBER' ? 'RECEITA' : 'DESPESA'));
  
  // Obter sub-itens do centro de custo selecionado
  const availableSubItems = availableCostCenters.find(cc => cc.nome === formData.centroCusto)?.subItens || [];

  const filtered = transactions.filter(t => {
    const search = searchTerm.toLowerCase();
    return (
      t.descricao.toLowerCase().includes(search) ||
      t.centroCusto.toLowerCase().includes(search) ||
      (t.conta || '').toLowerCase().includes(search)
    );
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const transactionData: Transaction = {
      id: editingId || crypto.randomUUID(),
      type: type,
      vencimento: formData.vencimento,
      pagamento: formData.status !== 'PENDENTE' ? (formData.pagamento || formData.vencimento) : undefined,
      descricao: formData.descricao,
      valor: parseFloat(formData.valor),
      formaPagamento: formData.formaPagamento,
      status: formData.status,
      centroCusto: formData.centroCusto,
      subItem: formData.subItem,
      conta: formData.conta
    };

    if (editingId) onUpdate(transactionData);
    else onAdd(transactionData);

    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      vencimento: new Date().toISOString().split('T')[0],
      pagamento: '',
      descricao: '',
      valor: '',
      formaPagamento: 'PIX',
      centroCusto: '',
      subItem: '',
      status: 'PENDENTE',
      conta: 'GERAL'
    });
    setEditingId(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <h2 className="text-xl font-black text-blue-900 uppercase tracking-tighter">
          {type === 'PAGAR' ? 'Contas a Pagar' : 'Contas a Receber'}
        </h2>
        <div className="flex items-center gap-2">
           <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-blue-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20">
             <i className="fa-solid fa-plus"></i> Novo Registro
           </button>
           <button onClick={() => onDelete(selectedIds)} disabled={selectedIds.length === 0} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${selectedIds.length > 0 ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
             <i className="fa-solid fa-trash-can"></i> {selectedIds.length > 0 ? `Excluir (${selectedIds.length})` : 'Excluir'}
           </button>
        </div>
      </div>

      <div className="p-4 bg-white border-b border-slate-50">
        <div className="relative group">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-900 transition-colors"></i>
          <input 
            type="text" 
            placeholder="Pesquisar por descrição, conta, categoria..." 
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-900/5 focus:border-blue-900 outline-none text-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
              <th className="p-5 w-12 text-center">
                <input type="checkbox" onChange={(e) => e.target.checked ? setSelectedIds(filtered.map(t => t.id)) : setSelectedIds([])} />
              </th>
              <th className="p-5">Data</th>
              <th className="p-5">Descrição / Conta</th>
              <th className="p-5 text-right">Valor</th>
              <th className="p-5">Categoria</th>
              <th className="p-5">Status</th>
              <th className="p-5 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100">
            {filtered.map((t) => (
              <tr key={t.id} className={`${selectedIds.includes(t.id) ? 'bg-blue-50/50' : 'hover:bg-slate-50/30'} transition-colors group`}>
                <td className="p-5 text-center">
                   <input type="checkbox" checked={selectedIds.includes(t.id)} onChange={() => setSelectedIds(prev => prev.includes(t.id) ? prev.filter(i => i !== t.id) : [...prev, t.id])} />
                </td>
                <td className="p-5 font-bold text-slate-600">{new Date(t.vencimento).toLocaleDateString('pt-BR')}</td>
                <td className="p-5">
                  <div className="font-black text-blue-900 uppercase tracking-tight leading-none mb-1">{t.descricao}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded font-black text-slate-500 uppercase">{t.conta || 'GERAL'}</span>
                    <span className="text-[9px] text-slate-400 uppercase font-bold">{t.formaPagamento}</span>
                  </div>
                </td>
                <td className={`p-5 text-right font-black text-lg ${type === 'PAGAR' ? 'text-red-500' : 'text-emerald-600'}`}>
                   R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-5">
                  <div className="text-[10px] uppercase font-black text-slate-400 leading-none">{t.centroCusto}</div>
                  <div className="text-[9px] font-bold text-slate-300 uppercase">{t.subItem}</div>
                </td>
                <td className="p-5">
                  <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                    t.status === 'PENDENTE' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {t.status}
                  </span>
                </td>
                <td className="p-5 text-center">
                  <button onClick={() => {
                    setEditingId(t.id);
                    setFormData({
                      vencimento: t.vencimento, pagamento: t.pagamento || '', descricao: t.descricao,
                      valor: t.valor.toString(), formaPagamento: t.formaPagamento, centroCusto: t.centroCusto,
                      subItem: t.subItem, status: t.status, conta: t.conta || 'GERAL'
                    });
                    setIsModalOpen(true);
                  }} className="text-blue-900 hover:bg-blue-50 p-3 rounded-xl transition-all"><i className="fa-solid fa-pen-to-square"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-blue-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-white/20">
            <div className="bg-blue-900 p-6 flex justify-between items-center text-white">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter">
                  {editingId ? 'Editar Lançamento' : 'Novo Lançamento'}
                </h3>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{type === 'PAGAR' ? 'Contas a Pagar' : 'Contas a Receber'}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="bg-white/10 w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all font-bold text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Data Vencimento</label>
                  <input type="date" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-900/5 transition-all" value={formData.vencimento} onChange={e => setFormData({...formData, vencimento: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Conta / Banco</label>
                  <select className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-900/5 transition-all font-bold" value={formData.conta} onChange={e => setFormData({...formData, conta: e.target.value})}>
                    <option value="SANTANDER">SANTANDER</option>
                    <option value="NUBANK">NUBANK</option>
                    <option value="CAIXA">CAIXA</option>
                    <option value="INTER">INTER</option>
                    <option value="BRADESCO">BRADESCO</option>
                    <option value="GERAL">GERAL / DINHEIRO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Descrição do Lançamento</label>
                <input type="text" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-900/5 uppercase font-medium" placeholder="Ex: PAGAMENTO FORNECEDOR X" value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value.toUpperCase()})} required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Valor (R$)</label>
                   <input type="number" step="0.01" className="w-full p-3 border border-slate-200 rounded-xl outline-none font-black text-lg text-blue-900" placeholder="0,00" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} required />
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Status do Pagamento</label>
                   <select className={`w-full p-3 border rounded-xl outline-none font-black text-xs ${formData.status === 'PENDENTE' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as Status})}>
                     <option value="PENDENTE">🟡 PENDENTE</option>
                     {type === 'PAGAR' ? <option value="PAGO">🟢 PAGO</option> : <option value="RECEBIDO">🟢 RECEBIDO</option>}
                   </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Centro de Custo</label>
                   <select className="w-full p-3 border border-slate-200 rounded-xl outline-none text-sm" value={formData.centroCusto} onChange={e => setFormData({...formData, centroCusto: e.target.value, subItem: ''})} required>
                     <option value="">Selecione...</option>
                     {availableCostCenters.map(cc => <option key={cc.id} value={cc.nome}>{cc.nome}</option>)}
                   </select>
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Sub-item</label>
                   <select className="w-full p-3 border border-slate-200 rounded-xl outline-none text-sm" value={formData.subItem} onChange={e => setFormData({...formData, subItem: e.target.value})} required disabled={!formData.centroCusto}>
                     <option value="">Selecione...</option>
                     {availableSubItems.map(si => <option key={si} value={si}>{si}</option>)}
                   </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Forma de Movimentação</label>
                <div className="grid grid-cols-3 gap-2">
                  {['PIX', 'BOLETO', 'DINHEIRO', 'CARTÃO', 'TRANSFERÊNCIA'].map(forma => (
                    <button type="button" key={forma} onClick={() => setFormData({...formData, formaPagamento: forma})} className={`py-2.5 rounded-xl text-[10px] font-black transition-all border ${formData.formaPagamento === forma ? 'bg-blue-900 text-white border-blue-900 shadow-lg shadow-blue-900/20' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300'}`}>
                      {forma}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-4 bg-slate-100 rounded-2xl font-black text-slate-500 hover:bg-slate-200 transition-all uppercase text-[10px] tracking-widest">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-4 bg-blue-900 text-white rounded-2xl font-black hover:bg-blue-800 shadow-xl shadow-blue-900/30 transition-all uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                  <i className="fa-solid fa-check"></i> Finalizar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionTable;
