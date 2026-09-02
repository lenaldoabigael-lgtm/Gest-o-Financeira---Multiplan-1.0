import React, { useState, useMemo, useEffect } from 'react';
import { ProposalRequirement, User, Cotacao, CotacaoItemResult, ModalidadeTabela, TabelaPrecoImportada } from '../types';
import { CotacaoCartaoModal } from './CotacaoCartaoModal';
import { ImportarTabelaModal } from './ImportarTabelaModal';
import { TabelasPrecoManager } from './TabelasPrecoManager';
import { OperatorLogo } from './OperatorLogo';
import { INITIAL_IMPORTED_TABLES } from '../lib/initialPlanTables';
import { supabase } from '../lib/supabase';
import { FileUp, Database, Sparkles, CheckCircle2 } from 'lucide-react';

interface PlanQuoteViewProps {
  requirements: ProposalRequirement[];
  user: User;
  onSaveCotacao?: (cotacao: Cotacao) => void;
  savedCotacoes?: Cotacao[];
  onDeleteCotacao?: (id: string) => void;
  isCorretorMode?: boolean;
}

const AGE_BRACKETS = [
  { key: '00 a 18', label: '00 a 18 anos' },
  { key: '19 a 23', label: '19 a 23 anos' },
  { key: '24 a 28', label: '24 a 28 anos' },
  { key: '29 a 33', label: '29 a 33 anos' },
  { key: '34 a 38', label: '34 a 38 anos' },
  { key: '39 a 43', label: '39 a 43 anos' },
  { key: '44 a 48', label: '44 a 48 anos' },
  { key: '49 a 53', label: '49 a 53 anos' },
  { key: '54 a 58', label: '54 a 58 anos' },
  { key: '59 ou mais', label: '59 ou mais anos' }
];

const UF_CITIES: Record<string, string[]> = {
  CE: ['Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú', 'Sobral', 'Crato'],
  PE: ['Recife', 'Caruaru', 'Olinda', 'Jaboatão dos Guararapes', 'Petrolina', 'Paulista', 'Garanhuns', 'Cabo de Santo Agostinho'],
  PA: ['Belém', 'Ananindeua', 'Santarém', 'Marabá', 'Castanhal'],
  MS: ['Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá'],
  SP: ['São Paulo', 'Campinas', 'Guarulhos', 'Santo André', 'Ribeirão Preto', 'São Bernardo do Campo', 'Osasco', 'Sorocaba'],
  RJ: ['Rio de Janeiro', 'Niterói', 'Duque de Caxias', 'Nova Iguaçu', 'São Gonçalo', 'Belford Roxo', 'Petrópolis'],
  BA: ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Juazeiro', 'Itabuna', 'Lauro de Freitas'],
  MG: ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim', 'Montes Claros'],
  DF: ['Brasília', 'Taguatinga', 'Ceilândia', 'Águas Claras'],
  AL: ['Maceió', 'Arapiraca', 'Rio Largo', 'Palmeira dos Índios'],
  PB: ['João Pessoa', 'Campina Grande', 'Santa Rita', 'Patos'],
  RN: ['Natal', 'Mossoró', 'Parnamirim', 'São Gonçalo do Amarante'],
  SE: ['Aracaju', 'Nossa Senhora do Socorro', 'São Cristóvão', 'Itabaiana', 'Lagarto']
};

const DEFAULT_OPERADORAS = [
  'HAPVIDA',
  'AMIL',
  'BRADESCO',
  'SULAMÉRICA',
  'UNIMED',
  'BLUE',
  'GEAP',
  'HAPVIDA ODONTO',
  'ODONTOPREV',
  'PLAMED',
  'SELECT',
  'SERVDONTO'
];

const DEFAULT_PLAN_TYPES = [
  'INDIVIDUAL',
  'NOSSO PLANO',
  'ADESÃO',
  'EMPRESARIAL',
  'SAÚDE PME',
  'ODONTO PF',
  'ODONTO PJ'
];

const BASE_PRICES_PER_OPERADORA: Record<string, number[]> = {
  HAPVIDA: [185.50, 210.00, 245.00, 280.00, 320.00, 380.00, 470.00, 590.00, 780.00, 1110.00],
  AMIL: [240.00, 275.00, 315.00, 370.00, 420.00, 510.00, 640.00, 810.00, 1050.00, 1440.00],
  BRADESCO: [290.00, 335.00, 390.00, 455.00, 530.00, 645.00, 810.00, 1020.00, 1340.00, 1790.00],
  SULAMÉRICA: [285.00, 330.00, 385.00, 450.00, 520.00, 635.00, 795.00, 1010.00, 1320.00, 1750.00],
  UNIMED: [220.00, 255.00, 295.00, 345.00, 400.00, 485.00, 610.00, 770.00, 1010.00, 1380.00],
  BLUE: [210.00, 240.00, 275.00, 320.00, 370.00, 445.00, 560.00, 710.00, 920.00, 1260.00],
  GEAP: [205.00, 235.00, 270.00, 315.00, 360.00, 435.00, 545.00, 690.00, 895.00, 1220.00],
  'HAPVIDA ODONTO': [22.90, 22.90, 22.90, 22.90, 22.90, 22.90, 22.90, 22.90, 22.90, 22.90],
  ODONTOPREV: [29.90, 29.90, 29.90, 29.90, 29.90, 29.90, 29.90, 29.90, 29.90, 29.90],
  PLAMED: [195.00, 225.00, 260.00, 305.00, 350.00, 420.00, 525.00, 660.00, 870.00, 1190.00],
  SELECT: [225.00, 258.00, 298.00, 348.00, 398.00, 480.00, 605.00, 765.00, 995.00, 1360.00],
  SERVDONTO: [24.90, 24.90, 24.90, 24.90, 24.90, 24.90, 24.90, 24.90, 24.90, 24.90],
  DEFAULT: [210.00, 240.00, 280.00, 325.00, 375.00, 450.00, 560.00, 710.00, 930.00, 1280.00]
};

export const PlanQuoteView: React.FC<PlanQuoteViewProps> = ({
  requirements = [],
  user,
  onSaveCotacao,
  savedCotacoes = [],
  onDeleteCotacao,
  isCorretorMode = false
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'NOVA' | 'TABELAS_PDF' | 'HISTORICO'>('NOVA');

  // Modal de Importação PDF
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Tabelas Importadas — vêm do Supabase agora (localStorage era só
  // pra esse navegador; várias pessoas cotando precisam ver a mesma base)
  const [importedTables, setImportedTables] = useState<TabelaPrecoImportada[]>([]);
  const [tabelasCarregando, setTabelasCarregando] = useState(true);

  const carregarTabelasPreco = async () => {
    setTabelasCarregando(true);
    const { data, error } = await supabase
      .from('tabelas_preco_importadas')
      .select(`
        id, operadora, modalidade, cidade, uf, vigencia_inicio, vigencia_fim,
        taxa_adesao, odonto_promo_valor, odonto_cheio_valor, arquivo_nome,
        criado_em, criado_por, ativo,
        tabela_preco_produtos (
          id, nome_produto, segmentacao, acomodacao, coparticipacao,
          registro_ans, cod_interno_com_odonto, cod_interno_sem_odonto,
          tabela_preco_faixas ( id, faixa, faixa_ordem, valor_medica1, valor_medica2 )
        )
      `);

    if (error || !data) {
      console.warn('Não foi possível carregar tabelas de preço do Supabase, usando base local', error);
      const saved = localStorage.getItem('multiplan_imported_plan_tables');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setImportedTables(parsed);
            setTabelasCarregando(false);
            return;
          }
        } catch (e) { /* segue pro fallback fixo abaixo */ }
      }
      setImportedTables(INITIAL_IMPORTED_TABLES);
      setTabelasCarregando(false);
      return;
    }

    const mapeadas: TabelaPrecoImportada[] = data.map((t: any) => ({
      id: t.id,
      operadora: t.operadora,
      modalidade: t.modalidade,
      cidade: t.cidade,
      uf: t.uf,
      vigenciaInicio: t.vigencia_inicio,
      vigenciaFim: t.vigencia_fim,
      taxaAdesao: Number(t.taxa_adesao),
      odontoPromoValor: t.odonto_promo_valor != null ? Number(t.odonto_promo_valor) : undefined,
      odontoCheioValor: t.odonto_cheio_valor != null ? Number(t.odonto_cheio_valor) : undefined,
      arquivoNome: t.arquivo_nome,
      criadoEm: t.criado_em,
      criadoPor: t.criado_por,
      ativo: t.ativo,
      produtos: (t.tabela_preco_produtos || []).map((p: any) => ({
        id: p.id,
        nomeProduto: p.nome_produto,
        segmentacao: p.segmentacao,
        acomodacao: p.acomodacao,
        coparticipacao: p.coparticipacao,
        registroAns: p.registro_ans,
        codInternoComOdonto: p.cod_interno_com_odonto,
        codInternoSemOdonto: p.cod_interno_sem_odonto,
        faixas: (p.tabela_preco_faixas || [])
          .sort((a: any, b: any) => a.faixa_ordem - b.faixa_ordem)
          .map((f: any) => ({
            faixa: f.faixa,
            faixaOrdem: f.faixa_ordem,
            valorMedica1: Number(f.valor_medica1),
            valorMedica2: Number(f.valor_medica2),
          })),
      })),
    }));

    setImportedTables(mapeadas.length > 0 ? mapeadas : INITIAL_IMPORTED_TABLES);
    setTabelasCarregando(false);
  };

  useEffect(() => {
    carregarTabelasPreco();
  }, []);

  // Modalidade de Venda
  const [selectedModalidade, setSelectedModalidade] = useState<ModalidadeTabela>('INDIVIDUAL');

  // Location State
  const [selectedUf, setSelectedUf] = useState<string>('CE');
  const [selectedCidade, setSelectedCidade] = useState<string>('Fortaleza');

  // Lives distribution by age bracket
  const [lives, setLives] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    AGE_BRACKETS.forEach(b => {
      initial[b.key] = 0;
    });
    initial['24 a 28'] = 1;
    return initial;
  });

  // Dynamic Operadoras selection
  const allOperadoras = useMemo(() => {
    const fromReqs = requirements
      .filter(r => r.tipo === 'OPERADORA')
      .map(r => r.nome.toUpperCase());
    if (fromReqs.length > 0) {
      return Array.from(new Set([...fromReqs, ...DEFAULT_OPERADORAS]));
    }
    return DEFAULT_OPERADORAS;
  }, [requirements]);

  const [selectedOperadoras, setSelectedOperadoras] = useState<string[]>(['HAPVIDA']);

  // Dynamic Plan Types selection
  const allPlanTypes = useMemo(() => {
    const fromReqs = requirements
      .filter(r => r.tipo === 'TIPO_PLANO')
      .map(r => r.nome.toUpperCase());
    if (fromReqs.length > 0) {
      return Array.from(new Set([...fromReqs, ...DEFAULT_PLAN_TYPES]));
    }
    return DEFAULT_PLAN_TYPES;
  }, [requirements]);

  const [selectedPlanTypes, setSelectedPlanTypes] = useState<string[]>(['NOSSO PLANO']);

  // Coverage Toggles
  const [hasOdonto, setHasOdonto] = useState<boolean>(true);
  const [hasCopart, setHasCopart] = useState<boolean>(true);
  const [acomodacao, setAcomodacao] = useState<'ENFERMARIA' | 'APARTAMENTO'>('ENFERMARIA');
  const [showCarencias, setShowCarencias] = useState<boolean>(true);

  // Search filter for History
  const [historySearch, setHistorySearch] = useState<string>('');

  // Calculation State & Results
  const [hasCalculated, setHasCalculated] = useState<boolean>(false);
  const [modalItem, setModalItem] = useState<CotacaoItemResult | null>(null);

  // Total vidas calculation
  const totalVidas = useMemo(() => {
    return Object.values(lives).reduce((acc: number, curr: number) => acc + (curr || 0), 0);
  }, [lives]);

  const handleUpdateLives = (bracketKey: string, delta: number) => {
    setLives(prev => {
      const current = prev[bracketKey] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [bracketKey]: next };
    });
  };

  const handleSetExactLives = (bracketKey: string, val: number) => {
    setLives(prev => ({ ...prev, [bracketKey]: Math.max(0, val) }));
  };

  const handleZerarVidas = () => {
    const reset: Record<string, number> = {};
    AGE_BRACKETS.forEach(b => {
      reset[b.key] = 0;
    });
    setLives(reset);
    setHasCalculated(false);
  };

  const toggleOperadora = (op: string) => {
    setSelectedOperadoras(prev => {
      if (prev.includes(op)) {
        if (prev.length === 1) return prev;
        return prev.filter(item => item !== op);
      }
      return [...prev, op];
    });
  };

  const togglePlanType = (tipo: string) => {
    setSelectedPlanTypes(prev => {
      if (prev.includes(tipo)) {
        if (prev.length === 1) return prev;
        return prev.filter(item => item !== tipo);
      }
      return [...prev, tipo];
    });
  };

  const availableCities = useMemo(() => {
    return UF_CITIES[selectedUf] || ['Capital', 'Interior'];
  }, [selectedUf]);

  const handleUfChange = (newUf: string) => {
    setSelectedUf(newUf);
    const cities = UF_CITIES[newUf] || [];
    if (cities.length > 0) {
      setSelectedCidade(cities[0]);
    }
  };

  const handleImportSuccess = async (novasTabelas: TabelaPrecoImportada[]) => {
    // Se já existe tabela pra essa cidade/modalidade/operadora, apaga a
    // antiga antes (cascade leva produtos e faixas junto) — mesma regra
    // de "substitui" que já existia no localStorage.
    for (const nt of novasTabelas) {
      const { data: existentes } = await supabase
        .from('tabelas_preco_importadas')
        .select('id')
        .eq('cidade', nt.cidade).eq('uf', nt.uf)
        .eq('modalidade', nt.modalidade).eq('operadora', nt.operadora);
      if (existentes && existentes.length > 0) {
        await supabase.from('tabelas_preco_importadas').delete()
          .in('id', existentes.map((e: any) => e.id));
      }

      const { data: tabelaInserida, error: erroTabela } = await supabase
        .from('tabelas_preco_importadas')
        .insert({
          operadora: nt.operadora, modalidade: nt.modalidade,
          cidade: nt.cidade, uf: nt.uf,
          vigencia_inicio: nt.vigenciaInicio, vigencia_fim: nt.vigenciaFim,
          taxa_adesao: nt.taxaAdesao,
          odonto_promo_valor: nt.odontoPromoValor ?? null,
          odonto_cheio_valor: nt.odontoCheioValor ?? null,
          arquivo_nome: nt.arquivoNome ?? null,
          criado_por: user?.login ?? null,
          ativo: true,
        })
        .select('id')
        .single();

      if (erroTabela || !tabelaInserida) {
        console.error('Erro ao gravar tabela de preço:', erroTabela);
        continue;
      }

      for (const produto of nt.produtos) {
        const { data: produtoInserido, error: erroProduto } = await supabase
          .from('tabela_preco_produtos')
          .insert({
            tabela_id: tabelaInserida.id,
            nome_produto: produto.nomeProduto,
            segmentacao: produto.segmentacao,
            acomodacao: produto.acomodacao,
            coparticipacao: produto.coparticipacao,
            registro_ans: produto.registroAns ?? null,
            cod_interno_com_odonto: produto.codInternoComOdonto ?? null,
            cod_interno_sem_odonto: produto.codInternoSemOdonto ?? null,
          })
          .select('id')
          .single();

        if (erroProduto || !produtoInserido) {
          console.error('Erro ao gravar produto da tabela:', erroProduto);
          continue;
        }

        if (produto.faixas.length > 0) {
          await supabase.from('tabela_preco_faixas').insert(
            produto.faixas.map(f => ({
              produto_id: produtoInserido.id,
              faixa: f.faixa,
              faixa_ordem: f.faixaOrdem,
              valor_medica1: f.valorMedica1,
              valor_medica2: f.valorMedica2,
            }))
          );
        }
      }
    }

    await carregarTabelasPreco();
    alert(`Sucesso! ${novasTabelas.length} tabela(s) importada(s) e integradas ao motor de cálculo.`);
  };

  const handleDeleteImportedTable = async (id: string) => {
    setImportedTables(prev => prev.filter(t => t.id !== id)); // otimista
    const { error } = await supabase.from('tabelas_preco_importadas').delete().eq('id', id);
    if (error) {
      console.error('Erro ao apagar tabela de preço:', error);
      await carregarTabelasPreco(); // desfaz a remoção otimista se falhou
    }
  };

  // Função auxiliar para determinar o status de disponibilidade de tabela da operadora
  const getOperadoraStatus = (opKey: string) => {
    const opNorm = opKey.toUpperCase().trim();
    
    // 1. Tabela Oficial Importada e Ativa para a localidade
    const hasOfficial = importedTables.some(t => 
      t.ativo &&
      t.operadora.toUpperCase() === opNorm &&
      t.uf.toUpperCase() === selectedUf.toUpperCase() &&
      (t.cidade.toLowerCase().includes(selectedCidade.toLowerCase()) || selectedCidade.toLowerCase().includes(t.cidade.toLowerCase())) &&
      t.modalidade === selectedModalidade
    );
    if (hasOfficial) {
      return {
        status: 'OFICIAL' as const,
        label: 'Tabela Oficial PDF',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        dotColor: 'bg-emerald-500',
        tooltip: 'Tabela oficial importada via PDF ativa no banco de dados'
      };
    }

    // 2. Base Padrão de Sistema
    const hasBase = Boolean(
      BASE_PRICES_PER_OPERADORA[opNorm] ||
      BASE_PRICES_PER_OPERADORA[opNorm.replace(' SAÚDE', '')] ||
      BASE_PRICES_PER_OPERADORA[opNorm.replace(' ODONTO', '')]
    );
    if (hasBase) {
      return {
        status: 'ESTIMADA' as const,
        label: 'Tabela Base',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        dotColor: 'bg-blue-500',
        tooltip: 'Estimativa base calculada pelo sistema'
      };
    }

    // 3. Sem Tabela no Banco (Sob Consulta)
    return {
      status: 'SOB_CONSULTA' as const,
      label: 'Sob Consulta',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
      dotColor: 'bg-amber-500',
      tooltip: 'Sem tabela de valores cadastrada no banco para esta região'
    };
  };

  // Identifica se temos tabela oficial importada correspondente aos parâmetros
  const matchingOfficialTable = useMemo(() => {
    return importedTables.find(t => 
      t.ativo &&
      t.operadora.toUpperCase() === (selectedOperadoras[0] || '').toUpperCase() &&
      t.uf.toUpperCase() === selectedUf.toUpperCase() &&
      (t.cidade.toLowerCase().includes(selectedCidade.toLowerCase()) || selectedCidade.toLowerCase().includes(t.cidade.toLowerCase())) &&
      (t.modalidade === selectedModalidade)
    );
  }, [importedTables, selectedOperadoras, selectedUf, selectedCidade, selectedModalidade]);

  // Calculate quote results
  const calculatedResults = useMemo<CotacaoItemResult[]>(() => {
    if (!hasCalculated || totalVidas === 0) return [];

    const results: CotacaoItemResult[] = [];

    selectedOperadoras.forEach(opKey => {
      const opNorm = opKey.toUpperCase();
      const opStatusInfo = getOperadoraStatus(opKey);

      // Procura se temos tabela oficial importada
      const officialTable = importedTables.find(t => 
        t.ativo &&
        t.operadora.toUpperCase() === opNorm &&
        t.uf.toUpperCase() === selectedUf.toUpperCase() &&
        (t.cidade.toLowerCase().includes(selectedCidade.toLowerCase()) || selectedCidade.toLowerCase().includes(t.cidade.toLowerCase())) &&
        t.modalidade === selectedModalidade
      );

      selectedPlanTypes.forEach(tipoPlano => {
        const isPureOdonto = tipoPlano.includes('ODONTO') || opNorm.includes('ODONTO');
        
        let matchingProduct = officialTable?.produtos.find(p => {
          const matchAcom = p.acomodacao === acomodacao;
          const matchCopart = hasCopart ? p.coparticipacao !== 'SEM_COPART' : p.coparticipacao === 'SEM_COPART';
          return matchAcom && matchCopart;
        });

        if (!matchingProduct && officialTable?.produtos.length) {
          matchingProduct = officialTable.produtos.find(p => p.acomodacao === acomodacao) || officialTable.produtos[0];
        }

        const isSobConsulta = opStatusInfo.status === 'SOB_CONSULTA';

        const basePrices =
          BASE_PRICES_PER_OPERADORA[opNorm] ||
          BASE_PRICES_PER_OPERADORA[opNorm.replace(' SAÚDE', '')] ||
          BASE_PRICES_PER_OPERADORA[opNorm.replace(' ODONTO', '')] ||
          (isSobConsulta ? null : BASE_PRICES_PER_OPERADORA.DEFAULT);

        const odontoPromo = officialTable?.odontoPromoValor || 24.50;
        const odontoAddon = !isPureOdonto && hasOdonto ? odontoPromo : 0.0;

        let totalSaude = 0;
        let totalOdonto = 0;

        const precosPorFaixa = AGE_BRACKETS.map((b, idx) => {
          const numVidas = lives[b.key] || 0;
          let unitPriceSaude = 0;

          if (isSobConsulta && !matchingProduct) {
            unitPriceSaude = 0;
          } else if (matchingProduct && matchingProduct.faixas && matchingProduct.faixas[idx]) {
            // Se o usuário selecionou Odonto concomitante, usa Medica1 (com desconto), se não, Medica2
            const faixaObj = matchingProduct.faixas[idx];
            unitPriceSaude = hasOdonto ? faixaObj.valorMedica1 : faixaObj.valorMedica2;
          } else if (basePrices) {
            const basePrice = basePrices[idx] || 200;
            const acomodacaoMultiplier = isPureOdonto ? 1.0 : acomodacao === 'APARTAMENTO' ? 1.20 : 1.0;
            const copartDiscount = isPureOdonto ? 1.0 : hasCopart ? 0.88 : 1.0;
            unitPriceSaude = Math.round(basePrice * acomodacaoMultiplier * copartDiscount * 100) / 100;
          }

          const unitPriceOdonto = isSobConsulta ? 0 : odontoAddon;
          const subtotal = Math.round((unitPriceSaude + unitPriceOdonto) * numVidas * 100) / 100;

          if (numVidas > 0) {
            totalSaude += unitPriceSaude * numVidas;
            totalOdonto += unitPriceOdonto * numVidas;
          }

          return {
            faixa: b.key,
            faixaLabel: b.label,
            qtd: numVidas,
            valorUnitarioSaude: unitPriceSaude,
            valorUnitarioOdonto: unitPriceOdonto,
            subtotal
          };
        });

        const taxaAdesao = isSobConsulta ? 0 : (officialTable?.taxaAdesao ?? 35.00);
        const valorTotalGeral = Math.round((totalSaude + totalOdonto) * 100) / 100;

        results.push({
          id: `${opKey}-${tipoPlano}-${Date.now()}-${Math.random()}`,
          operadora: opKey,
          planoNome: matchingProduct?.nomeProduto ? `${matchingProduct.nomeProduto} (${selectedModalidade})` : tipoPlano,
          segmentacao: isPureOdonto ? 'Odontológico' : 'Ambulatorial + Hospitalar c/ Obstetrícia',
          acomodacao,
          coparticipacao: hasCopart,
          temOdonto: hasOdonto && !isPureOdonto,
          origemTabela: officialTable ? 'OFICIAL_PDF' : isSobConsulta ? 'SEM_TABELA_SOB_CONSULTA' : 'BASE_ESTIMADA',
          statusTabela: officialTable ? 'OFICIAL' : isSobConsulta ? 'SOB_CONSULTA' : 'ESTIMADA',
          precosPorFaixa,
          taxaAdesao,
          carencias: [
            { evento: 'Urgência e Emergência', dias: 1 },
            { evento: 'Consultas e Exames Simples', dias: 30 },
            { evento: 'Exames Especiais e Cirurgias', dias: 180 },
            { evento: 'Parto a Termo', dias: 300 }
          ],
          valorTotalSaude: Math.round(totalSaude * 100) / 100,
          valorTotalOdonto: Math.round(totalOdonto * 100) / 100,
          valorTotalGeral
        });
      });
    });

    return results;
  }, [
    hasCalculated,
    totalVidas,
    selectedOperadoras,
    selectedPlanTypes,
    lives,
    acomodacao,
    hasCopart,
    hasOdonto,
    selectedCidade,
    selectedUf,
    selectedModalidade,
    importedTables
  ]);

  const handleCalculateClick = () => {
    if (totalVidas === 0) {
      alert('Por favor, adicione pelo menos 1 vida nas faixas etárias para calcular.');
      return;
    }
    if (selectedOperadoras.length === 0) {
      alert('Selecione ao menos uma operadora.');
      return;
    }
    if (selectedPlanTypes.length === 0) {
      alert('Selecione ao menos um tipo de plano.');
      return;
    }

    setHasCalculated(true);
  };

  const handleSaveCotacaoDirectly = (itemToSave: CotacaoItemResult, clientName?: string) => {
    const newCotacao: Cotacao = {
      id: 'COT-' + Date.now().toString().slice(-6),
      clienteNome: clientName || 'Cliente Cotação',
      uf: selectedUf,
      cidade: selectedCidade,
      created_at: new Date().toISOString(),
      corretor: user.login,
      operadoras: [itemToSave.operadora],
      tiposPlano: [itemToSave.planoNome],
      vidasPorFaixa: lives,
      totalVidas,
      totalMensalEstimado: itemToSave.valorTotalGeral,
      detalhes: {
        hasOdonto: itemToSave.temOdonto,
        hasCopart: itemToSave.coparticipacao,
        acomodacao: itemToSave.acomodacao,
        precosPorFaixa: itemToSave.precosPorFaixa,
        taxaAdesao: itemToSave.taxaAdesao
      }
    };

    if (onSaveCotacao) {
      onSaveCotacao(newCotacao);
    }
    alert('Cotação salva com sucesso no histórico!');
  };

  // Filtered History
  const filteredSavedCotacoes = useMemo(() => {
    if (!historySearch.trim()) return savedCotacoes;
    const term = historySearch.toLowerCase();
    return savedCotacoes.filter(c =>
      (c.clienteNome || '').toLowerCase().includes(term) ||
      (c.cidade || '').toLowerCase().includes(term) ||
      (c.uf || '').toLowerCase().includes(term) ||
      (c.operadoras || []).some(o => o.toLowerCase().includes(term)) ||
      (c.corretor || '').toLowerCase().includes(term)
    );
  }, [savedCotacoes, historySearch]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* HEADER WITH BRAND IDENTITY */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#001a54] text-[26px]">
              calculate
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#001a54] tracking-tight">
              Motor de Cotação de Planos
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
            Simulador comercial integrado com leitura de tabelas oficiais em PDF das operadoras.
          </p>
        </div>

        {/* Top Right Sub-tabs & Import Action */}
        <div className="flex flex-wrap items-center gap-2">
          {!isCorretorMode && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <FileUp className="w-4 h-4" />
              <span>Importar PDF</span>
            </button>
          )}

          <div className="flex items-center bg-slate-200/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveSubTab('NOVA')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeSubTab === 'NOVA'
                  ? 'bg-[#001a54] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">add_box</span>
              <span>Nova Cotação</span>
            </button>

            {!isCorretorMode && (
              <button
                onClick={() => setActiveSubTab('TABELAS_PDF')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeSubTab === 'TABELAS_PDF'
                    ? 'bg-[#001a54] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Tabelas PDF ({importedTables.length})</span>
              </button>
            )}

            <button
              onClick={() => setActiveSubTab('HISTORICO')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeSubTab === 'HISTORICO'
                  ? 'bg-[#001a54] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">history</span>
              <span>Minhas Cotações ({savedCotacoes.length})</span>
            </button>
          </div>
        </div>
      </div>

      {activeSubTab === 'NOVA' ? (
        <div className="space-y-4">
          
          {/* Status da Tabela Oficial Reconhecida */}
          {matchingOfficialTable ? (
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center justify-between text-emerald-800 text-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold block">
                    Tabela Oficial Ativa: {matchingOfficialTable.operadora} ({matchingOfficialTable.cidade} - {matchingOfficialTable.uf})
                  </span>
                  <span className="text-[11px] text-emerald-700">
                    Modalidade: {matchingOfficialTable.modalidade} • Vigência: {new Date(matchingOfficialTable.vigenciaInicio).toLocaleDateString('pt-BR')} a {new Date(matchingOfficialTable.vigenciaFim).toLocaleDateString('pt-BR')} • {matchingOfficialTable.produtos.length} produtos mapeados com 10 faixas etárias
                  </span>
                </div>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                Valores Oficiais PDF
              </span>
            </div>
          ) : !isCorretorMode ? (
            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex items-center justify-between text-amber-900 text-xs">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold">Calculando com base paramétrica atualizada</span>
                  <span className="block text-[11px] text-amber-700">
                    Para usar valores exatos do PDF da operadora para esta praça, clique em "Importar PDF".
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="text-xs font-bold text-amber-900 underline hover:text-amber-950"
              >
                Importar Tabela Agora
              </button>
            </div>
          ) : null}

          {/* 1. LOCALIDADE E MODALIDADE */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#001a54] tracking-tight">
                <span className="material-symbols-outlined text-[18px] text-[#001a54]">
                  location_on
                </span>
                <span>1. LOCALIDADE E MODALIDADE DA COTAÇÃO</span>
              </div>

              {/* Total de Vidas Badge */}
              <div className="bg-[#ebf2fe] border border-[#bcd3fc] text-[#001a54] px-3.5 py-1 rounded-full text-xs font-bold tracking-tight">
                Total de Vidas: {totalVidas}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase">
                  Estado (UF)
                </label>
                <div className="relative">
                  <select
                    value={selectedUf}
                    onChange={e => handleUfChange(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3.5 py-2.5 pr-9 appearance-none focus:outline-none focus:ring-2 focus:ring-[#001a54]/20 focus:border-[#001a54] transition-all cursor-pointer"
                  >
                    {Object.keys(UF_CITIES).map(uf => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-[18px]">
                    expand_more
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase">
                  Cidade Principal
                </label>
                <div className="relative">
                  <select
                    value={selectedCidade}
                    onChange={e => setSelectedCidade(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3.5 py-2.5 pr-9 appearance-none focus:outline-none focus:ring-2 focus:ring-[#001a54]/20 focus:border-[#001a54] transition-all cursor-pointer"
                  >
                    {availableCities.map(city => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-[18px]">
                    expand_more
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase">
                  Tipo / Modalidade
                </label>
                <div className="relative">
                  <select
                    value={selectedModalidade}
                    onChange={e => setSelectedModalidade(e.target.value as ModalidadeTabela)}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3.5 py-2.5 pr-9 appearance-none focus:outline-none focus:ring-2 focus:ring-[#001a54]/20 focus:border-[#001a54] transition-all cursor-pointer"
                  >
                    <option value="INDIVIDUAL">Individual / Familiar (1 vida)</option>
                    <option value="SUPER_SIMPLES_1_VIDA">Super Simples (Porte 1 Vida / MEI)</option>
                    <option value="PME_2_29">PME Porte I e II (02 a 29 vidas)</option>
                    <option value="PME_30_99">PME Porte III (30 a 99 vidas)</option>
                    <option value="ADESAO">Coletivo por Adesão</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-[18px]">
                    expand_more
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. QUANTIDADE DE VIDAS POR FAIXA ETÁRIA */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#001a54] tracking-tight">
                  <span className="material-symbols-outlined text-[18px] text-[#001a54]">
                    diversity_3
                  </span>
                  <span>2. QUANTIDADE DE VIDAS POR FAIXA ETÁRIA (ANS)</span>
                </div>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                  Utilize os controles - / + ou digite a quantidade em cada uma das 10 faixas regulamentadas.
                </p>
              </div>

              {totalVidas > 0 && (
                <button
                  type="button"
                  onClick={handleZerarVidas}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors self-start sm:self-center cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">delete_sweep</span>
                  <span>Zerar Vidas</span>
                </button>
              )}
            </div>

            {/* 10 Age brackets grid: 2 rows of 5 cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1">
              {AGE_BRACKETS.map(b => {
                const count = lives[b.key] || 0;
                const isActive = count > 0;

                return (
                  <div
                    key={b.key}
                    className={`p-3 rounded-xl border transition-all flex flex-col justify-between relative ${
                      isActive
                        ? 'bg-blue-50/50 border-[#001a54] ring-1 ring-[#001a54]/30 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-700 tracking-tight uppercase truncate">
                        {b.label}
                      </span>
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-[#001a54]" />
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-1 bg-white border border-slate-200 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateLives(b.key, -1)}
                        disabled={count === 0}
                        className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors text-sm cursor-pointer"
                      >
                        -
                      </button>

                      <input
                        type="number"
                        min="0"
                        value={count}
                        onChange={(e) => handleSetExactLives(b.key, parseInt(e.target.value) || 0)}
                        className="w-10 text-center text-xs font-black text-slate-900 outline-none font-mono"
                      />

                      <button
                        type="button"
                        onClick={() => handleUpdateLives(b.key, 1)}
                        className="w-7 h-7 rounded-md bg-[#001a54] text-white font-bold hover:bg-[#00133d] flex items-center justify-center transition-colors text-sm shadow-2xs cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. SELEÇÃO DE OPERADORAS (COM MECANISMO VISUAL DE DISPONIBILIDADE) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#001a54] tracking-tight">
                <span className="material-symbols-outlined text-[20px] text-[#001a54]">
                  corporate_fare
                </span>
                <span>3. SELEÇÃO DE OPERADORAS (CHIPS MÚLTIPLOS)</span>
              </div>
              
              {/* Legenda de Disponibilidade */}
              <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Oficial PDF
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> Base
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Sob Consulta
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {allOperadoras.map(op => {
                const isSelected = selectedOperadoras.includes(op);
                const statusInfo = getOperadoraStatus(op);

                return (
                  <button
                    key={op}
                    type="button"
                    onClick={() => toggleOperadora(op)}
                    title={statusInfo.tooltip}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-tight uppercase border transition-all flex items-center gap-2 active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'bg-[#001a54] text-white border-[#001a54] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span>{op}</span>

                    {/* Tag Visual de Disponibilidade */}
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                        isSelected
                          ? statusInfo.status === 'OFICIAL'
                            ? 'bg-emerald-400/30 text-emerald-200 border border-emerald-400/40'
                            : statusInfo.status === 'SOB_CONSULTA'
                            ? 'bg-amber-400/30 text-amber-200 border border-amber-400/40'
                            : 'bg-blue-400/30 text-blue-200 border border-blue-400/40'
                          : statusInfo.status === 'OFICIAL'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : statusInfo.status === 'SOB_CONSULTA'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {statusInfo.status === 'OFICIAL' ? '✓ PDF' : statusInfo.status === 'SOB_CONSULTA' ? '▲ Consulta' : 'Base'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. TIPO DE PLANO / CATEGORIA (CHIPS MÚLTIPLOS) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#001a54] tracking-tight">
              <span className="material-symbols-outlined text-[20px] text-[#001a54]">
                layers
              </span>
              <span>4. TIPO DE PLANO / CATEGORIA (CHIPS MÚLTIPLOS)</span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {allPlanTypes.map(tipo => {
                const isSelected = selectedPlanTypes.includes(tipo);
                return (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => togglePlanType(tipo)}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-tight uppercase border transition-all flex items-center gap-2 active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'bg-[#001a54] text-white border-[#001a54] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span>{tipo}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AVISO VISUAL DE OPERADORAS SEM TABELA NO BANCO */}
          {selectedOperadoras.some(op => getOperadoraStatus(op).status === 'SOB_CONSULTA') && (
            <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 flex items-start gap-3 text-amber-900 shadow-xs animate-in fade-in duration-200">
              <span className="material-symbols-outlined text-amber-600 text-xl shrink-0 mt-0.5">
                warning
              </span>
              <div className="text-xs space-y-1">
                <p className="font-bold">
                  Operadora(s) marcadas como Sob Consulta: {selectedOperadoras.filter(op => getOperadoraStatus(op).status === 'SOB_CONSULTA').join(', ')}
                </p>
                <p className="text-amber-800/90 leading-relaxed">
                  Estas operadoras não possuem tabela de preços cadastrada no banco de dados para {selectedCidade}/{selectedUf}. No cálculo, estas opções serão apresentadas com o status <strong>"Sob Consulta na Mesa de Operações"</strong>.
                </p>
              </div>
            </div>
          )}

          {/* 5. OPÇÕES DE COBERTURA E ACOMODAÇÃO */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#001a54] tracking-tight">
              <span className="material-symbols-outlined text-[18px] text-[#001a54]">
                tune
              </span>
              <span>5. OPÇÕES DE COBERTURA E ACOMODAÇÃO</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
              {/* Plano Odontológico */}
              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-slate-800">
                    Plano Odonto
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {hasOdonto ? 'Sim (+R$ 22,90/vida)' : 'Não incluso'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setHasOdonto(!hasOdonto)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                    hasOdonto ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform shadow-2xs ${
                      hasOdonto ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Coparticipação */}
              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-slate-800">
                    Coparticipação
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {hasCopart ? 'Com Copay (-12%)' : 'Sem Copay'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setHasCopart(!hasCopart)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                    hasCopart ? 'bg-[#001a54]' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform shadow-2xs ${
                      hasCopart ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Acomodação */}
              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-slate-800">
                    Acomodação
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase">
                    {acomodacao === 'ENFERMARIA' ? 'Enfermaria' : 'Apartamento (+20%)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setAcomodacao(prev => (prev === 'ENFERMARIA' ? 'APARTAMENTO' : 'ENFERMARIA'))
                  }
                  className="px-3 py-1 bg-[#001a54] text-white text-xs font-bold rounded-lg transition-all shadow-2xs hover:bg-[#00133d] cursor-pointer"
                >
                  {acomodacao === 'ENFERMARIA' ? 'Enfermaria' : 'Apartamento'}
                </button>
              </div>

              {/* Exibir Carências */}
              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-slate-800">
                    Carências ANS
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {showCarencias ? 'Padrão ANS' : 'Ocultar'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCarencias(!showCarencias)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                    showCarencias ? 'bg-[#001a54]' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform shadow-2xs ${
                      showCarencias ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* BOTTOM SUMMARY & CALCULATE BUTTON BAR */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Resumo dos Parâmetros
              </span>
              <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">
                {selectedCidade}/{selectedUf} • {totalVidas} {totalVidas === 1 ? 'Vida' : 'Vidas'} • {selectedOperadoras.length} Operadora(s) • {selectedPlanTypes.length} Plano(s)
              </p>
            </div>

            <button
              onClick={handleCalculateClick}
              className="bg-[#001a54] hover:bg-[#00133d] text-white px-8 py-3.5 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">play_arrow</span>
              <span>CALCULAR COTAÇÃO</span>
            </button>
          </div>

          {/* CALCULATED RESULTS */}
          {hasCalculated && (
            <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#001a54] text-[20px]">
                    analytics
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-[#001a54] tracking-tight">
                    Opções de Planos Calculadas ({calculatedResults.length})
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {calculatedResults.map((res) => {
                  const isSobConsulta = res.statusTabela === 'SOB_CONSULTA';
                  const isOficial = res.statusTabela === 'OFICIAL';

                  return (
                    <div
                      key={res.id}
                      className={`bg-white rounded-2xl border shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all ${
                        isSobConsulta ? 'border-amber-300' : 'border-slate-200/90 hover:border-slate-300'
                      }`}
                    >
                      {/* Top Header */}
                      <div className={`p-4 text-white flex items-center justify-between ${
                        isSobConsulta
                          ? 'bg-gradient-to-r from-amber-600 to-amber-700'
                          : isOficial
                          ? 'bg-gradient-to-r from-[#001a54] to-emerald-900'
                          : 'bg-gradient-to-r from-[#001a54] to-[#003182]'
                      }`}>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <OperatorLogo operadora={res.operadora} variant="white" height={24} />
                            {isOficial && (
                              <span className="px-2 py-0.5 bg-emerald-500/30 text-emerald-100 text-[9px] font-bold rounded-full border border-emerald-400/30">
                                ✓ Tabela Oficial PDF
                              </span>
                            )}
                            {isSobConsulta && (
                              <span className="px-2 py-0.5 bg-amber-400/30 text-amber-100 text-[9px] font-bold rounded-full border border-amber-300/40">
                                ⚠️ Sob Consulta
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-blue-100 font-medium">{res.planoNome}</p>
                        </div>
                        <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full uppercase border border-white/20">
                          {res.acomodacao}
                        </span>
                      </div>

                      {/* Table Body */}
                      <div className="p-5 space-y-4 flex-1">
                        {isSobConsulta ? (
                          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2 text-center">
                            <span className="material-symbols-outlined text-amber-600 text-3xl">
                              pending_actions
                            </span>
                            <h4 className="text-sm font-bold text-amber-900">
                              Tabela de Preços Não Cadastrada no Banco
                            </h4>
                            <p className="text-xs text-amber-800/90 leading-relaxed">
                              A operadora <strong>{res.operadora}</strong> ainda não possui tabela oficial de valores cadastrada para {selectedCidade}/{selectedUf}.
                            </p>
                            <p className="text-[11px] font-semibold text-amber-700">
                              Solicite a cotação diretamente à nossa mesa de operações ou importe a tabela oficial em PDF.
                            </p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                  <th className="py-2 px-3">Faixa</th>
                                  <th className="py-2 px-3 text-center">Vidas</th>
                                  <th className="py-2 px-3 text-right">Saúde</th>
                                  {res.temOdonto && <th className="py-2 px-3 text-right">Odonto</th>}
                                  <th className="py-2 px-3 text-right">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-mono">
                                {res.precosPorFaixa
                                  .filter((p) => p.qtd > 0)
                                  .map((p) => (
                                    <tr key={p.faixa}>
                                      <td className="py-2 px-3 font-sans font-bold text-slate-800">{p.faixa} anos</td>
                                      <td className="py-2 px-3 text-center font-bold text-slate-700">{p.qtd}x</td>
                                      <td className="py-2 px-3 text-right text-slate-600">
                                        R$ {p.valorUnitarioSaude.toFixed(2)}
                                      </td>
                                      {res.temOdonto && (
                                        <td className="py-2 px-3 text-right text-slate-600">
                                          R$ {p.valorUnitarioOdonto.toFixed(2)}
                                        </td>
                                      )}
                                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                                        R$ {p.subtotal.toFixed(2)}
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Bloco Sólido de Total */}
                        <div className={`p-4 rounded-xl flex items-center justify-between shadow-xs mt-2 ${
                          isSobConsulta ? 'bg-amber-800 text-white' : 'bg-[#001a54] text-white'
                        }`}>
                          <div>
                            <span className="text-[10px] font-extrabold text-blue-200 uppercase tracking-wider block">
                              VALOR TOTAL MENSAL
                            </span>
                            <span className="text-[11px] text-blue-100 font-medium">
                              Para {totalVidas} vida(s)
                            </span>
                          </div>
                          <div className="text-right">
                            <span className={`font-black block ${isSobConsulta ? 'text-lg text-amber-200' : 'text-2xl font-mono'}`}>
                              {isSobConsulta ? 'Sob Consulta na Mesa' : `R$ ${res.valorTotalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                            </span>
                            {!isSobConsulta && res.taxaAdesao > 0 && (
                              <span className="text-[10px] text-blue-200/90 font-medium block">
                                + R$ {res.taxaAdesao.toFixed(2)} adesão por contrato
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                        {isSobConsulta ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                const msg = `Olá! Preciso de cotação para ${res.operadora} (${res.planoNome}) em ${selectedCidade}/${selectedUf} para ${totalVidas} vidas.`;
                                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
                              }}
                              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                            >
                              <span className="material-symbols-outlined text-base">chat</span>
                              <span>Solicitar Análise na Mesa (WhatsApp)</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleSaveCotacaoDirectly(res)}
                              className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-[#001a54] flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-base">bookmark</span>
                              <span>Salvar</span>
                            </button>

                            <button
                              onClick={() => setModalItem(res)}
                              className="px-4 py-2 bg-[#e85d04] hover:bg-[#d05303] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-base">send</span>
                              <span>Gerar Cotação WhatsApp</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : activeSubTab === 'TABELAS_PDF' ? (
        <div className="space-y-4">
          <TabelasPrecoManager
            tabelas={importedTables}
            onImportClick={() => setIsImportModalOpen(true)}
            onDeleteTabela={handleDeleteImportedTable}
          />
        </div>
      ) : (
        /* HISTÓRICO DE COTAÇÕES */
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-[#001a54] tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">history</span>
                <span>Histórico de Cotações Salvas</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Consulte, visualize cartões e reenvie propostas cotadas anteriormente.
              </p>
            </div>

            {/* History Search */}
            <div className="relative w-full sm:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                placeholder="Buscar por cliente, operadora ou cidade..."
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#001a54] text-slate-800"
              />
            </div>
          </div>

          {filteredSavedCotacoes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Cliente / Referência</th>
                    <th className="py-3 px-4">Localidade</th>
                    <th className="py-3 px-4">Operadora(s)</th>
                    <th className="py-3 px-4 text-center">Vidas</th>
                    <th className="py-3 px-4 text-right">Valor Total Mensal</th>
                    <th className="py-3 px-4 text-center">Corretor</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSavedCotacoes.map(q => (
                    <tr key={q.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {new Date(q.created_at || Date.now()).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">
                          {q.clienteNome || 'Cliente Cotação'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{q.id}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {q.cidade}/{q.uf}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {(q.operadoras || []).map(op => (
                            <span key={op} className="px-2 py-0.5 bg-blue-50 text-[#001a54] rounded font-bold text-[10px] border border-blue-200">
                              {op}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold font-mono">
                        {q.totalVidas}
                      </td>
                      <td className="py-3 px-4 text-right font-black font-mono text-slate-900 text-sm">
                        R$ {Number(q.totalMensalEstimado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600 font-medium">
                        {q.corretor}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              const itemPrecos = q.detalhes?.precosPorFaixa || Object.entries(q.vidasPorFaixa || {}).map(([f, qtd]) => ({
                                faixa: f,
                                qtd: Number(qtd) || 0,
                                valorUnitarioSaude: (Number(q.totalMensalEstimado) || 0) / (q.totalVidas || 1),
                                valorUnitarioOdonto: 0,
                                subtotal: (Number(q.totalMensalEstimado) || 0) / (q.totalVidas || 1) * (Number(qtd) || 0)
                              }));

                              const item: CotacaoItemResult = {
                                id: q.id,
                                operadora: q.operadoras[0] || 'HAPVIDA',
                                planoNome: (q.tiposPlano && q.tiposPlano[0]) || 'ADESÃO',
                                segmentacao: 'Ambulatorial + Hospitalar c/ Obstetrícia',
                                acomodacao: q.detalhes?.acomodacao || 'ENFERMARIA',
                                coparticipacao: q.detalhes?.hasCopart ?? true,
                                temOdonto: q.detalhes?.hasOdonto ?? false,
                                precosPorFaixa: itemPrecos,
                                taxaAdesao: q.detalhes?.taxaAdesao || 0,
                                carencias: [
                                  { evento: 'Urgência e Emergência', dias: 1 },
                                  { evento: 'Consultas e Exames Simples', dias: 30 },
                                  { evento: 'Exames Especiais e Cirurgias', dias: 180 },
                                  { evento: 'Parto a Termo', dias: 300 }
                                ],
                                valorTotalSaude: Number(q.totalMensalEstimado || 0),
                                valorTotalOdonto: 0,
                                valorTotalGeral: Number(q.totalMensalEstimado || 0)
                              };

                              setModalItem(item);
                            }}
                            className="px-3 py-1.5 bg-[#001a54] hover:bg-[#00133d] text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            <span>Visualizar Cartão</span>
                          </button>

                          {onDeleteCotacao && (
                            <button
                              onClick={() => {
                                if (confirm(`Deseja excluir a cotação ${q.id}?`)) {
                                  onDeleteCotacao(q.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                              title="Excluir Cotação"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-40">
                history_toggle_off
              </span>
              <p className="text-xs font-bold uppercase tracking-wider">
                Nenhuma cotação salva encontrada
              </p>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE IMPORTAÇÃO DE TABELA EM PDF */}
      <ImportarTabelaModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      {/* MODAL CARTÃO DE COTAÇÃO (WHATSAPP / PDF) */}
      {modalItem && (
        <CotacaoCartaoModal
          item={modalItem}
          cidade={selectedCidade}
          uf={selectedUf}
          user={user}
          onClose={() => setModalItem(null)}
          onSaveCotacao={(clientName) => {
            handleSaveCotacaoDirectly(modalItem, clientName);
            setModalItem(null);
          }}
        />
      )}
    </div>
  );
};

export default PlanQuoteView;