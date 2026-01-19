
import React, { useState } from 'react';
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
  
  // Form State
  const [formData, setFormData] = useState({
    vencimento: '',
    pagamento: '',
    descricao: '',
    valor: '',
    formaPagamento: 'PIX',
    centroCusto: '',
    subItem: '',
    status: 'PENDENTE' as Status,
    conta: 'GERAL'
  });

  const filtered = transactions.filter(t => {
    const search = searchTerm.toLowerCase();
    return (
      t.descricao.toLowerCase().includes(search) ||
      t.centroCusto.toLowerCase().includes(search) ||
      (t.conta || '').toLowerCase().includes(search)
    );
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(filtered.map(t => t.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Excluir ${selectedIds.length} registros?`)) {
      onDelete(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({ vencimento: '', pagamento: '', descricao: '', valor: '', formaPagamento: 'PIX', centroCusto: '', subItem: '', status: 'PENDENTE', conta: 'GERAL' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Transaction) => {
    setEditingId(t.id);
    setFormData({
      vencimento: t.vencimento,
      pagamento: t.pagamento || '',
      descricao: t.descricao,
      valor: t.valor.toString(),
      formaPagamento: t.formaPagamento,
      centroCusto: t.centroCusto,
      subItem: t.subItem,
      status: t.status,
      conta: t.conta || 'GERAL'
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const transactionData: Transaction = {
      id: editingId || crypto.randomUUID(),
      type: type,
      vencimento: formData.vencimento,
      pagamento: formData.pagamento || undefined,
      descricao: formData.descricao,
      valor: parseFloat(formData.valor),
      formaPagamento: formData.formaPagamento,
      status: formData.status,
      centroCusto: formData.centroCusto || 'OUTROS',
      subItem: formData.subItem || 'DIVERSOS',
      conta: formData.conta
    };

    if (editingId) onUpdate(transactionData);
    else onAdd(transactionData);

    setIsModalOpen(false);
  };

  const selectedCC = COST_CENTERS.find(cc => cc.nome === formData.centroCusto);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-blue-900 uppercase">
          {type === 'PAGAR' ? 'Contas a Pagar' : 'Contas a Receber'}
        </h2>
        <div className="flex items-center gap-2">
           <button onClick={handleOpenNew} className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-800 transition-colors">
             <i className="fa-solid fa-plus"></i> Novo
           </button>
           <button onClick={handleDeleteSelected} disabled={selectedIds.length === 0} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${selectedIds.length > 0 ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
             <i className="fa-solid fa-trash-can"></i> {selectedIds.length > 0 ? `Excluir (${selectedIds.length})` : 'Excluir'}
           </button>
        </div>
      </div>

      <div className="p-4 bg-gray-50">
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input 
            type="text" 
            placeholder="Pesquisar descrição, conta, centro de custo..." 
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100 text-gray-600 text-[10px] uppercase tracking-wider">
              <th className="p-4 w-12 text-center">
                <input type="checkbox" onChange={handleSelectAll} checked={filtered.length > 0 && selectedIds.length === filtered.length} />
              </th>
              <th className="p-4">Vencimento</th>
              <th className="p-4">Descrição / Conta</th>
              <th className="p-4 text-right">Valor</th>
              <th className="p-4">Centro Custo</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-100">
            {filtered.map((t) => (
              <tr key={t.id} className={`${selectedIds.includes(t.id) ? 'bg-blue-50' : 'hover:bg-gray-50'} transition-colors`}>
                <td className="p-4 text-center">
                   <input type="checkbox" checked={selectedIds.includes(t.id)} onChange={() => handleSelectOne(t.id)} />
                </td>
                <td className="p-4 font-medium">{new Date(t.vencimento).toLocaleDateString('pt-BR')}</td>
                <td className="p-4">
                  <div className="font-bold text-gray-900">{t.descricao}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] bg-gray-200 px-1.5 py-0.5 rounded text-gray-600 font-bold uppercase">{t.conta || 'GERAL'}</span>
                    <span className="text-[9px] text-gray-400 uppercase">{t.formaPagamento}</span>
                  </div>
                </td>
                <td className={`p-4 text-right font-bold ${type === 'PAGAR' ? 'text-red-500' : 'text-green-600'}`}>
                   R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-4 text-[10px] uppercase font-semibold text-gray-500">
                  {t.centroCusto} <br/> <span className="text-gray-400">{t.subItem}</span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${
                    t.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {t.status}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <button onClick={() => handleOpenEdit(t)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"><i className="fa-solid fa-pen"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-blue-900 p-6 flex justify-between items-center text-white">
              <h3 className="text-lg font-bold uppercase tracking-tight">{editingId ? 'Editar' : 'Novo'} Registro</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Data Vencimento</label>
                  <input type="date" className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={formData.vencimento} onChange={e => setFormData({...formData, vencimento: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Conta Bancária</label>
                  <select className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={formData.conta} onChange={e => setFormData({...formData, conta: e.target.value})}>
                    <option value="SANTANDER">SANTANDER</option>
                    <option value="NUBANK">NUBANK</option>
                    <option value="CAIXA">CAIXA</option>
                    <option value="INTER">INTER</option>
                    <option value="GERAL">GERAL / CAIXA INTERNO</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                   <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Valor</label>
                   <input type="number" step="0.01" className="w-full p-2.5 border rounded-lg outline-none" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} required />
                </div>
                <div className="col-span-1">
                   <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Forma</label>
                   <select className="w-full p-2.5 border rounded-lg outline-none" value={formData.formaPagamento} onChange={e => setFormData({...formData, formaPagamento: e.target.value})}>
                     <option>PIX</option><option>BOLETO</option><option>TRANSFERÊNCIA</option><option>DINHEIRO</option><option>CARTÃO</option>
                   </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Descrição</label>
                <input type="text" className="w-full p-2.5 border rounded-lg outline-none" placeholder="Ex: Pagamento Internet" value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Centro de Custo</label>
                  <select className="w-full p-2.5 border rounded-lg outline-none" value={formData.centroCusto} onChange={e => setFormData({...formData, centroCusto: e.target.value, subItem: ''})} required>
                    <option value="">Selecione...</option>
                    {COST_CENTERS.filter(cc => type === 'PAGAR' ? cc.tipo === 'DESPESA' : cc.tipo === 'RECEITA').map(cc => (
                      <option key={cc.id} value={cc.nome}>{cc.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Status</label>
                   <select className="w-full p-2.5 border rounded-lg outline-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as Status})}>
                     <option value="PENDENTE">PENDENTE</option>
                     <option value={type === 'PAGAR' ? 'PAGO' : 'RECEBIDO'}>{type === 'PAGAR' ? 'PAGO' : 'RECEBIDO'}</option>
                   </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 bg-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-all uppercase text-xs tracking-widest">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800 shadow-lg transition-all uppercase text-xs tracking-widest">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionTable;
