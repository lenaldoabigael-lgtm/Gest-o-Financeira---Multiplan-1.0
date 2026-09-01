import React, { useState } from 'react';
import { 
  Building2, 
  Calendar, 
  Layers, 
  Trash2, 
  FileUp, 
  Search, 
  Eye, 
  CheckCircle2, 
  X,
  FileText
} from 'lucide-react';
import { TabelaPrecoImportada, TabelaPrecoProdutoParsed } from '../types';

interface TabelasPrecoManagerProps {
  tabelas: TabelaPrecoImportada[];
  onOpenImportModal: () => void;
  onDeleteTabela: (id: string) => void;
}

export const TabelasPrecoManager: React.FC<TabelasPrecoManagerProps> = ({
  tabelas,
  onOpenImportModal,
  onDeleteTabela
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalidadeFilter, setModalidadeFilter] = useState('TODAS');
  const [selectedTabela, setSelectedTabela] = useState<TabelaPrecoImportada | null>(null);

  const filteredTabelas = tabelas.filter(tab => {
    const term = searchTerm.toLowerCase();
    const matchSearch = 
      (tab.operadora || '').toLowerCase().includes(term) ||
      (tab.cidade || '').toLowerCase().includes(term) ||
      (tab.uf || '').toLowerCase().includes(term) ||
      (tab.modalidade || '').toLowerCase().includes(term);

    const matchMod = modalidadeFilter === 'TODAS' || tab.modalidade === modalidadeFilter;
    return matchSearch && matchMod;
  });

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#001a54] flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Tabelas de Preços Oficiais Importadas ({tabelas.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Base de dados com os valores oficiais extraídos dos PDFs das operadoras por praça e modalidade.
          </p>
        </div>

        <button
          onClick={onOpenImportModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          <FileUp className="w-4 h-4" />
          <span>Importar Nova Tabela (PDF)</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por praça, operadora ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600"
          />
        </div>

        <select
          value={modalidadeFilter}
          onChange={(e) => setModalidadeFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600"
        >
          <option value="TODAS">Todas as Modalidades</option>
          <option value="INDIVIDUAL">Individual / Familiar</option>
          <option value="SUPER_SIMPLES_1_VIDA">Super Simples / 1 Vida</option>
          <option value="PME_2_29">PME (02 a 29 vidas)</option>
          <option value="PME_30_99">PME (30 a 99 vidas)</option>
          <option value="ADESAO">Adesão</option>
        </select>
      </div>

      {/* Grid of Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTabelas.map((tab) => (
          <div
            key={tab.id}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                    {tab.operadora}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">
                    {tab.cidade} - {tab.uf}
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                  {tab.modalidade}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400">Vigência:</span>
                  <span className="font-semibold text-slate-700">
                    {new Date(tab.vigenciaInicio).toLocaleDateString('pt-BR')} até {new Date(tab.vigenciaFim).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tx. Adesão:</span>
                  <span className="font-bold text-slate-800">R$ {tab.taxaAdesao.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Produtos no PDF:</span>
                  <span className="font-bold text-blue-600">{tab.produtos.length} produtos / planos</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-3 flex items-center justify-between gap-2">
              <button
                onClick={() => setSelectedTabela(tab)}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Ver Faixas & Planos</span>
              </button>

              <button
                onClick={() => {
                  if (confirm(`Excluir a tabela de ${tab.cidade} (${tab.operadora})?`)) {
                    onDeleteTabela(tab.id);
                  }
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                title="Excluir Tabela"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTabelas.length === 0 && (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-40 text-blue-500" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Nenhuma tabela encontrada
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Clique em "Importar Nova Tabela (PDF)" para carregar uma tabela de preços oficial.
          </p>
        </div>
      )}

      {/* Modal de Detalhes da Tabela */}
      {selectedTabela && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-4xl max-h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-100 text-[#001a54] uppercase tracking-wide border border-blue-200">
                    {selectedTabela.operadora}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Tabela Oficial • {selectedTabela.cidade} - {selectedTabela.uf}
                  </h3>
                </div>
                <p className="text-xs font-medium text-slate-500">
                  Modalidade: <strong className="text-slate-800">{selectedTabela.modalidade}</strong> • Vigência: <strong className="text-slate-800">{selectedTabela.vigenciaInicio}</strong> a <strong className="text-slate-800">{selectedTabela.vigenciaFim}</strong> • Taxa Adesão: <strong className="text-slate-800">R$ {selectedTabela.taxaAdesao.toFixed(2)}</strong>
                </p>
              </div>
              <button 
                onClick={() => setSelectedTabela(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo da Tabela */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/50">
              {selectedTabela.produtos.map((prod) => (
                <div key={prod.id} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-[#001a54] uppercase tracking-tight flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        {prod.nomeProduto} • {prod.acomodacao} ({prod.coparticipacao})
                      </h4>
                      {prod.registroAns && (
                        <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                          Registro ANS: <span className="font-mono text-slate-700">{prod.registroAns}</span>
                        </p>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg self-start sm:self-auto border border-slate-200/80">
                      {prod.acomodacao}
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-xs text-left bg-white">
                      <thead className="bg-slate-100 text-slate-700 text-[11px] uppercase font-extrabold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-4">Faixa Etária ANS</th>
                          <th className="py-2.5 px-4 text-right text-emerald-800">Médica 1 (C/ Odonto Promocional)</th>
                          <th className="py-2.5 px-4 text-right text-slate-800">Médica 2 (Sem Odonto / Tabela)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {prod.faixas.map((f, idx) => (
                          <tr key={f.faixa} className={idx % 2 === 0 ? 'bg-white hover:bg-blue-50/40 transition-colors' : 'bg-slate-50/70 hover:bg-blue-50/40 transition-colors'}>
                            <td className="py-2.5 px-4 font-semibold text-slate-800">
                              {f.faixa} anos
                            </td>
                            <td className="py-2.5 px-4 text-right font-bold text-emerald-700">
                              <span className="bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                                R$ {f.valorMedica1.toFixed(2)}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                              <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                                R$ {f.valorMedica2.toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 flex justify-end bg-slate-50">
              <button
                onClick={() => setSelectedTabela(null)}
                className="px-5 py-2.5 bg-[#001a54] hover:bg-[#00133e] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
