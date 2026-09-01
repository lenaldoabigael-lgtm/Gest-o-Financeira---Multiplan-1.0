import React, { useState, useRef } from 'react';
import { 
  FileUp, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Calendar, 
  Layers, 
  ShieldCheck, 
  FileText, 
  Edit3, 
  Trash2, 
  Plus, 
  Save, 
  RefreshCw, 
  ArrowRight,
  Eye,
  Check
} from 'lucide-react';
import { ModalidadeTabela, TabelaPrecoImportada, TabelaPrecoProdutoParsed } from '../types';
import { parsePdfRateSheet } from '../lib/pdfTableExtractor';

interface ImportarTabelaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (novasTabelas: TabelaPrecoImportada[]) => void;
}

export const ImportarTabelaModal: React.FC<ImportarTabelaModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  // Pré-requisitos
  const [operadora, setOperadora] = useState('HAPVIDA');
  const [outraOperadora, setOutraOperadora] = useState('');
  const [modalidade, setModalidade] = useState<ModalidadeTabela>('INDIVIDUAL');
  const [vigenciaInicio, setVigenciaInicio] = useState('2026-07-01');
  const [vigenciaFim, setVigenciaFim] = useState('2026-09-30');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Estados de processamento
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dados extraídos para conferência
  const [tabelasExtraidas, setTabelasExtraidas] = useState<TabelaPrecoImportada[]>([]);
  const [activeTabelaIdx, setActiveTabelaIdx] = useState(0);
  const [activeProdutoIdx, setActiveProdutoIdx] = useState(0);
  const [step, setStep] = useState<'FORM' | 'REVIEW'>('FORM');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const operadoraFinal = operadora === 'OUTRA' ? (outraOperadora.trim().toUpperCase() || 'PERSONALIZADA') : operadora;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMsg(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setSelectedFile(file);
        setErrorMsg(null);
      } else {
        setErrorMsg('Por favor, selecione um arquivo em formato PDF.');
      }
    }
  };

  const handleProcessPdf = async () => {
    if (!selectedFile) {
      setErrorMsg('Por favor, selecione um arquivo PDF da tabela da operadora.');
      return;
    }
    if (!vigenciaInicio || !vigenciaFim) {
      setErrorMsg('Informe as datas de início e fim da vigência.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setProgressPercent(10);
    setProgressMsg('Iniciando análise do PDF com OCR estruturado...');

    try {
      const result = await parsePdfRateSheet(selectedFile, {
        operadora: operadoraFinal,
        modalidade,
        vigenciaInicio,
        vigenciaFim,
        arquivoNome: selectedFile.name,
        onProgress: (current, total, msg) => {
          const pct = Math.round((current / (total || 1)) * 100);
          setProgressPercent(pct);
          setProgressMsg(msg);
        }
      });

      if (!result || result.length === 0) {
        throw new Error('Nenhuma tabela de preços reconhecida no PDF. Verifique se o documento contém páginas de vendas ou use a inclusão manual.');
      }

      setTabelasExtraidas(result);
      setActiveTabelaIdx(0);
      setActiveProdutoIdx(0);
      setStep('REVIEW');
    } catch (err: any) {
      console.error('Erro ao processar PDF:', err);
      setErrorMsg(err.message || 'Falha ao processar o arquivo PDF. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToDatabase = () => {
    if (tabelasExtraidas.length === 0) return;
    onSuccess(tabelasExtraidas);
    onClose();
  };

  const updateTaxaAdesao = (tabelaIdx: number, newTaxa: number) => {
    setTabelasExtraidas(prev => {
      const copy = [...prev];
      copy[tabelaIdx] = { ...copy[tabelaIdx], taxaAdesao: newTaxa };
      return copy;
    });
  };

  const updateFaixaValor = (tabelaIdx: number, produtoIdx: number, faixaIdx: number, field: 'valorMedica1' | 'valorMedica2', newVal: number) => {
    setTabelasExtraidas(prev => {
      const copy = [...prev];
      const targetTabela = { ...copy[tabelaIdx] };
      const targetProdutos = [...targetTabela.produtos];
      const targetProd = { ...targetProdutos[produtoIdx] };
      const targetFaixas = [...targetProd.faixas];
      
      targetFaixas[faixaIdx] = {
        ...targetFaixas[faixaIdx],
        [field]: newVal
      };

      targetProd.faixas = targetFaixas;
      targetProdutos[produtoIdx] = targetProd;
      targetTabela.produtos = targetProdutos;
      copy[tabelaIdx] = targetTabela;
      return copy;
    });
  };

  const activeTabela = tabelasExtraidas[activeTabelaIdx];
  const activeProduto = activeTabela?.produtos?.[activeProdutoIdx];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Importar Tabela de Vendas em PDF
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-[#001a54] border border-blue-200">
                  IA & Leitor Oficial
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Alimente a base de cálculo diretamente a partir do PDF da operadora por cidade e modalidade
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/40">
          {step === 'FORM' ? (
            <div className="space-y-6">
              
              {/* Seção 1: Pré-Requisitos Mandatórios */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#001a54] uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  1. Pré-Requisitos da Tabela (Obrigatórios)
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Operadora */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Operadora
                    </label>
                    <select
                      value={operadora}
                      onChange={(e) => setOperadora(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none"
                    >
                      <option value="HAPVIDA">Hapvida NotreDame</option>
                      <option value="AMIL">Amil Saúde</option>
                      <option value="BRADESCO">Bradesco Saúde</option>
                      <option value="SULAMERICA">SulAmérica Saúde</option>
                      <option value="UNIMED">Unimed</option>
                      <option value="BLUE">Blue Saúde</option>
                      <option value="OUTRA">+ Cadastrar Outra...</option>
                    </select>
                    {operadora === 'OUTRA' && (
                      <input
                        type="text"
                        placeholder="Nome da Operadora"
                        value={outraOperadora}
                        onChange={(e) => setOutraOperadora(e.target.value)}
                        className="mt-2 w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none"
                      />
                    )}
                  </div>

                  {/* Modalidade / Tipo de Tabela */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Tipo da Tabela / Modalidade
                    </label>
                    <select
                      value={modalidade}
                      onChange={(e) => setModalidade(e.target.value as ModalidadeTabela)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none"
                    >
                      <option value="INDIVIDUAL">Individual / Familiar (1 vida)</option>
                      <option value="SUPER_SIMPLES_1_VIDA">Super Simples / MEI (Porte 1 vida)</option>
                      <option value="PME_2_29">PME Porte I e II (02 a 29 vidas)</option>
                      <option value="PME_30_99">PME Porte III (30 a 99 vidas)</option>
                      <option value="ADESAO">Coletivo por Adesão</option>
                    </select>
                  </div>

                  {/* Período de Vigência */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Início Vigência
                      </label>
                      <input
                        type="date"
                        value={vigenciaInicio}
                        onChange={(e) => setVigenciaInicio(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Fim Vigência
                      </label>
                      <input
                        type="date"
                        value={vigenciaFim}
                        onChange={(e) => setVigenciaFim(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 2: Upload do Arquivo PDF */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <label className="block text-xs font-extrabold text-[#001a54] uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  2. Arquivo PDF da Tabela Oficial
                </label>

                <div 
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                    selectedFile 
                      ? 'border-blue-500 bg-blue-50/50' 
                      : 'border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-slate-50'
                  }`}
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="application/pdf,.pdf" 
                    onChange={handleFileChange}
                    className="hidden" 
                  />

                  {selectedFile ? (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{selectedFile.name}</p>
                        <p className="text-xs text-slate-500 font-medium">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Clique para trocar de arquivo
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                        <FileUp className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          Arraste o arquivo PDF aqui ou <span className="text-blue-600 underline">clique para selecionar</span>
                        </p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Suporta tabelas completas com múltiplas páginas e praças de venda
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress & Error */}
              {isProcessing && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-blue-900">
                    <span>{progressMsg}</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 flex items-center gap-3 text-rose-800 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

            </div>
          ) : (
            /* REVIEW / AUDIT STEP */
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-950">
                      Extração Concluída ({tabelasExtraidas.length} praça(s) / tabelas identificadas)
                    </h3>
                    <p className="text-xs text-emerald-800 font-medium">
                      Revise os valores das 10 faixas etárias por praça e produto antes de persistir no banco
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setStep('FORM')}
                  className="text-xs font-bold text-slate-700 hover:text-slate-900 px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 shadow-xs cursor-pointer"
                >
                  Voltar ao formulário
                </button>
              </div>

              {/* Seletor de Cidades / Praças Extraídas */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {tabelasExtraidas.map((tab, idx) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTabelaIdx(idx);
                      setActiveProdutoIdx(0);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                      activeTabelaIdx === idx
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    {tab.cidade} - {tab.uf} ({tab.modalidade})
                  </button>
                ))}
              </div>

              {activeTabela && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  {/* Informações da Praça */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500 block font-medium">Operadora:</span>
                      <span className="font-extrabold text-slate-900">{activeTabela.operadora}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-medium">Modalidade:</span>
                      <span className="font-extrabold text-slate-900">{activeTabela.modalidade}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-medium">Tx. Adesão (R$):</span>
                      <div className="relative mt-0.5 max-w-[120px]">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[11px]">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={activeTabela.taxaAdesao || ''}
                          onChange={(e) => updateTaxaAdesao(activeTabelaIdx, parseFloat(e.target.value) || 0)}
                          className="w-full pl-7 pr-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-blue-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-medium">Odonto Promo:</span>
                      <span className="font-extrabold text-emerald-700">R$ {activeTabela.odontoPromoValor?.toFixed(2) || '14.87'}</span>
                    </div>
                  </div>

                  {/* Seletor de Produtos dentro da Praça */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {activeTabela.produtos.map((prod, pIdx) => (
                      <button
                        key={prod.id}
                        onClick={() => setActiveProdutoIdx(pIdx)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                          activeProdutoIdx === pIdx
                            ? 'bg-[#001a54] text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {prod.nomeProduto} • {prod.acomodacao} ({prod.coparticipacao})
                      </button>
                    ))}
                  </div>

                  {/* Tabela de Faixas Etárias Editável */}
                  {activeProduto && (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                      <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-800">
                        <span>Valores das 10 Faixas Etárias ANS ({activeProduto.nomeProduto} - {activeProduto.acomodacao})</span>
                        <span className="text-slate-500 font-semibold text-[11px]">Edição manual de valores permitida</span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-extrabold border-b border-slate-200">
                            <tr>
                              <th className="px-4 py-2.5">Faixa Etária ANS</th>
                              <th className="px-4 py-2.5 text-emerald-800">Médica ¹ (C/ Desconto Odonto)</th>
                              <th className="px-4 py-2.5 text-slate-800">Médica ² (Sem Odonto / Cheio)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {activeProduto.faixas.map((f, fIdx) => (
                              <tr key={f.faixa} className={fIdx % 2 === 0 ? 'bg-white hover:bg-blue-50/40' : 'bg-slate-50/60 hover:bg-blue-50/40'}>
                                <td className="px-4 py-2.5 font-bold text-slate-900">
                                  {f.faixa} anos
                                </td>
                                <td className="px-4 py-2.5">
                                  <div className="relative max-w-[160px]">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={f.valorMedica1 || ''}
                                      onChange={(e) => updateFaixaValor(activeTabelaIdx, activeProdutoIdx, fIdx, 'valorMedica1', parseFloat(e.target.value) || 0)}
                                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:outline-none"
                                    />
                                  </div>
                                </td>
                                <td className="px-4 py-2.5">
                                  <div className="relative max-w-[160px]">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={f.valorMedica2 || ''}
                                      onChange={(e) => updateFaixaValor(activeTabelaIdx, activeProdutoIdx, fIdx, 'valorMedica2', parseFloat(e.target.value) || 0)}
                                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none"
                                    />
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          {step === 'FORM' ? (
            <button
              onClick={handleProcessPdf}
              disabled={isProcessing || !selectedFile}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Extraindo dados do PDF...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  Processar e Extrair Tabelas
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep('FORM')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={handleSaveToDatabase}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Confirmar e Gravar no Banco de Dados
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
