import React, { useState, useMemo } from 'react';
import { GUIAS_ACADEMIA, CATEGORIAS_ACADEMIA, GuiaItem } from '../data/academiaGuias';

interface AcademiaMultiplanModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGuiaId?: string;
  contextTab?: string;
}

export const AcademiaMultiplanModal: React.FC<AcademiaMultiplanModalProps> = ({
  isOpen,
  onClose,
  initialGuiaId,
  contextTab
}) => {
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeGuiaId, setActiveGuiaId] = useState<string | null>(initialGuiaId || null);

  // Mapeia contexto atual do sistema para sugerir guia inicial
  React.useEffect(() => {
    if (initialGuiaId) {
      setActiveGuiaId(initialGuiaId);
    } else if (contextTab) {
      const tabLower = contextTab.toLowerCase();
      if (tabLower.includes('financeiro') || tabLower.includes('pagar')) {
        setSelectedCategoria('FINANCEIRO');
      } else if (tabLower.includes('acompanhamento') || tabLower.includes('gestaodemandas')) {
        setSelectedCategoria('ACOMPANHAMENTO');
      } else if (tabLower.includes('comissoes')) {
        setSelectedCategoria('COMISSOES');
      } else if (tabLower.includes('rh')) {
        setSelectedCategoria('RH');
      } else if (tabLower.includes('propostas') || tabLower.includes('cotacao')) {
        setSelectedCategoria('COMERCIAL');
      }
    }
  }, [initialGuiaId, contextTab, isOpen]);

  const filteredGuias = useMemo(() => {
    return GUIAS_ACADEMIA.filter(g => {
      const matchCategoria = selectedCategoria === 'TODOS' || g.categoria === selectedCategoria;
      const s = searchTerm.toLowerCase().trim();
      if (!s) return matchCategoria;

      const matchSearch =
        g.titulo.toLowerCase().includes(s) ||
        g.subtitulo.toLowerCase().includes(s) ||
        g.passos.some(p => p.titulo.toLowerCase().includes(s) || p.descricao.toLowerCase().includes(s)) ||
        (g.perguntasFrequentes || []).some(f => f.pergunta.toLowerCase().includes(s) || f.resposta.toLowerCase().includes(s));

      return matchCategoria && matchSearch;
    });
  }, [selectedCategoria, searchTerm]);

  const activeGuia = useMemo(() => {
    if (!activeGuiaId) return null;
    return GUIAS_ACADEMIA.find(g => g.id === activeGuiaId) || null;
  }, [activeGuiaId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-5xl h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-[#001a54] px-6 py-4 flex items-center justify-between text-white border-b border-blue-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 border border-white/10 shadow-inner">
              <span className="material-symbols-outlined text-2xl">school</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-white uppercase">
                  Academia Multiplan
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Guia Oficial
                </span>
              </div>
              <p className="text-xs text-blue-200 font-medium">
                Passo a passo, boas práticas e tutoriais operacionais de cada módulo do sistema.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="Fechar (ESC)"
            >
              <i className="fa-solid fa-xmark text-base"></i>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50/50">
          {/* Main Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search and Category Filter Bar */}
            <div className="p-4 bg-white border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              {activeGuia ? (
                <button
                  onClick={() => setActiveGuiaId(null)}
                  className="flex items-center gap-2 text-xs font-bold text-blue-900 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 px-3 py-2 rounded-xl transition-all cursor-pointer"
                >
                  <i className="fa-solid fa-arrow-left text-xs"></i>
                  <span>Voltar para todos os tutoriais</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 overflow-x-auto w-full pb-1 sm:pb-0 scrollbar-none">
                  {CATEGORIAS_ACADEMIA.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoria(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                        selectedCategoria === cat.id
                          ? 'bg-[#001a54] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                      }`}
                    >
                      <i className={`fa-solid ${cat.icone} text-[11px] opacity-70`}></i>
                      <span>{cat.nome}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="relative w-full sm:w-72 shrink-0">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input
                  type="text"
                  placeholder="Buscar tutoriais, regras..."
                  value={searchTerm}
                  onChange={e => {
                    setSearchTerm(e.target.value);
                    if (activeGuiaId) setActiveGuiaId(null);
                  }}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-all font-medium text-slate-800"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 text-xs"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Viewport: Either Guide Details or Guides Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {activeGuia ? (
                /* Detalhe do Passo a Passo */
                <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-150">
                  {/* Guide Header Banner */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-900 border border-blue-100">
                        {activeGuia.categoriaNome}
                      </span>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <i className="fa-regular fa-clock"></i>
                          <span>{activeGuia.tempoLeitura}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <i className="fa-solid fa-users"></i>
                          <span>{activeGuia.publico.join(', ')}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-900/5 text-blue-900 flex items-center justify-center text-xl shrink-0 border border-blue-900/10">
                        <i className={`fa-solid ${activeGuia.icone}`}></i>
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900">
                          {activeGuia.titulo}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {activeGuia.subtitulo}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Steps Timeline */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                      Etapas de Execução ({activeGuia.passos.length} passos)
                    </h4>

                    <div className="space-y-3">
                      {activeGuia.passos.map(passo => (
                        <div 
                          key={passo.numero}
                          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:border-slate-200 transition-all flex items-start gap-4"
                        >
                          <div className="w-8 h-8 rounded-xl bg-blue-900 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                            {passo.numero}
                          </div>

                          <div className="flex-1 space-y-2">
                            <h5 className="text-sm font-bold text-slate-900">
                              {passo.titulo}
                            </h5>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {passo.descricao}
                            </p>

                            {passo.dica && (
                              <div className="mt-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-2.5 text-xs text-emerald-900">
                                <i className="fa-solid fa-lightbulb text-emerald-600 mt-0.5"></i>
                                <div>
                                  <strong className="font-bold block text-emerald-950">Dica Prática:</strong>
                                  <span className="text-emerald-800 font-medium">{passo.dica}</span>
                                </div>
                              </div>
                            )}

                            {passo.atencao && (
                              <div className="mt-2.5 p-3 rounded-xl bg-amber-50/80 border border-amber-200/70 flex items-start gap-2.5 text-xs text-amber-900">
                                <i className="fa-solid fa-triangle-exclamation text-amber-600 mt-0.5"></i>
                                <div>
                                  <strong className="font-bold block text-amber-950">Atenção à Regra:</strong>
                                  <span className="text-amber-800 font-medium">{passo.atencao}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FAQ if available */}
                  {activeGuia.perguntasFrequentes && activeGuia.perguntasFrequentes.length > 0 && (
                    <div className="bg-slate-100/70 rounded-2xl p-5 border border-slate-200/60 space-y-3">
                      <div className="flex items-center gap-2 text-slate-800">
                        <i className="fa-solid fa-circle-question text-blue-900"></i>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                          Perguntas Frequentes sobre este tópico
                        </h4>
                      </div>

                      <div className="space-y-2.5">
                        {activeGuia.perguntasFrequentes.map((faq, idx) => (
                          <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200/60 text-xs">
                            <p className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                              <span className="text-blue-900">Q:</span> {faq.pergunta}
                            </p>
                            <p className="text-slate-600 pl-4 font-medium leading-relaxed">
                              {faq.resposta}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex justify-between items-center text-xs text-slate-400">
                    <button
                      onClick={() => setActiveGuiaId(null)}
                      className="text-blue-900 font-bold hover:underline flex items-center gap-1"
                    >
                      <i className="fa-solid fa-arrow-left"></i> Voltar à lista
                    </button>
                    <span>Academia Multiplan • Módulo de Treinamento</span>
                  </div>
                </div>
              ) : (
                /* Grid de Tutoriais */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-500">
                      Exibindo <span className="text-slate-900 font-black">{filteredGuias.length}</span> tutoriais disponíveis
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredGuias.map(guia => (
                      <div
                        key={guia.id}
                        onClick={() => setActiveGuiaId(guia.id)}
                        className="bg-white rounded-2xl p-5 border border-slate-200/70 hover:border-blue-900/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-900 transition-colors">
                              {guia.categoriaNome}
                            </span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <i className="fa-regular fa-clock"></i>
                              {guia.tempoLeitura}
                            </span>
                          </div>

                          <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-blue-900 group-hover:text-white text-slate-700 flex items-center justify-center text-lg shrink-0 transition-all">
                              <i className={`fa-solid ${guia.icone}`}></i>
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                                {guia.titulo}
                              </h4>
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                {guia.subtitulo}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                            <i className="fa-solid fa-list-ol"></i>
                            <span>{guia.passos.length} passos</span>
                          </div>
                          <span className="text-blue-900 font-bold flex items-center gap-1 text-[11px] group-hover:translate-x-0.5 transition-transform">
                            Ver passo a passo <i className="fa-solid fa-chevron-right text-[9px]"></i>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredGuias.length === 0 && (
                    <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center text-xl">
                        <i className="fa-solid fa-magnifying-glass"></i>
                      </div>
                      <h4 className="text-sm font-bold text-slate-700">Nenhum tutorial encontrado</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Não encontramos nenhum guia correspondente ao termo "{searchTerm}". Tente outra busca ou selecione outra categoria.
                      </p>
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedCategoria('TODOS');
                        }}
                        className="px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition-colors"
                      >
                        Limpar Filtros
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>Sistema Multiplan • Base de Treinamento Corporativo</span>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-500 shadow-2xs">ESC</kbd>
            <span>para fechar</span>
          </div>
        </div>
      </div>
    </div>
  );
};
