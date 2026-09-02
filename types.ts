
export type UserRole = 'admin' | 'cadastro_propostas' | 'pagamento_comissoes' | 'corretor';

export interface UserPermissions {
  centroCusto: boolean;
  contasPagar: boolean;
  contasReceber: boolean;
  dashboard: boolean;
  fluxoCaixa: boolean;
  detalhes: boolean;
  planCredencias: boolean;
  gestaoDemandas: boolean;
  propostas: boolean;
  financeiro: boolean;
  estruturaProposta: boolean;
  comissoes: boolean;
  cotacao?: boolean;
  exportarDados?: boolean;
  criarPropostas?: boolean;
  gestaoUsuarios?: boolean;
}

export interface User {
  id?: string;
  login: string;
  senha?: string;
  email?: string;
  role?: UserRole;
  cargo?: string;
  status?: 'ATIVO' | 'INATIVO';
  ultimoAcesso?: string;
  approved?: boolean;
  permissions: UserPermissions;
}

export type TransactionType = 'PAGAR' | 'RECEBER';
export type Status = 'PAGO' | 'PENDENTE' | 'RECEBIDO';

export interface Transaction {
  id: string;
  type: TransactionType;
  vencimento: string;
  pagamento?: string;
  descricao: string;
  valor: number;
  formaPagamento: string;
  status: Status;
  centroCusto: string;
  subItem: string;
  cliente?: string; // Utilizado para armazenar o comprovanteUrl/boleto sem alterar o schema do DB
  conta?: string; // Ex: Santander, Nubank, Caixa
}

export interface CostCenter {
  id: string;
  nome: string;
  tipo: 'RECEITA' | 'DESPESA';
  subItens: string[];
}

export interface ProposalRequirement {
  id: string;
  tipo: 'CORRETOR' | 'CATEGORIA' | 'OPERADORA' | 'TIPO_PLANO' | 'UNIDADE' | 'PRAZO_PAGAMENTO' | 'TAXA_ADESAO' | 'IMPOSTO_CORRETOR' | 'PERCENTUAL_COMISSAO' | 'TOPICO' | 'SUBTOPICO';
  nome: string;
}

export enum Tab {
  CONTAS_PAGAR = 'contas_pagar',
  CONTAS_RECEBER = 'contas_receber',
  CENTRO_CUSTO = 'centro_custo',
  DASHBOARD = 'dashboard',
  FLUXO_CAIXA = 'fluxo_caixa',
  DETALHES = 'detalhes',
  PLAN_CREDENCIAS = 'plan_credencias',
  ACOMPANHAMENTO = 'acompanhamento',
  PROPOSTAS = 'propostas',
  FINANCEIRO = 'financeiro',
  ESTRUTURA_PROPOSTA = 'estrutura_proposta',
  COMISSOES = 'comissoes',
  COTACAO = 'cotacao'
}

export interface CotacaoFilter {
  uf: string;
  cidade: string;
  modalidade?: 'INDIVIDUAL' | 'SUPER_SIMPLES_1_VIDA' | 'PME_2_29' | 'PME_30_99' | 'ADESAO';
  ageRanges: Record<string, number>;
  operadoras: string[];
  tiposPlano: string[];
  comOdonto: boolean;
  comCoparticipacao: boolean;
  acomodacao: 'ENFERMARIA' | 'APARTAMENTO' | 'S/ ACOM';
  comCarencias: boolean;
}

export type ModalidadeTabela = 'INDIVIDUAL' | 'SUPER_SIMPLES_1_VIDA' | 'PME_2_29' | 'PME_30_99' | 'ADESAO';

export interface TabelaPrecoFaixa {
  faixa: string;
  faixaOrdem: number;
  valorMedica1: number; // Com desconto (concomitante odonto)
  valorMedica2: number; // Sem desconto (sem odonto / cheio)
}

export interface TabelaPrecoProdutoParsed {
  id: string;
  nomeProduto: string; // Ex: 'Nosso Plano', 'Nosso Médico', 'Mix', 'Pleno', 'Integrado'
  segmentacao: 'AMB' | 'AMB+HOSP+OBST' | 'ODONTOLOGICO';
  acomodacao: 'S/ ACOM' | 'ENFERMARIA' | 'APARTAMENTO';
  coparticipacao: 'PARCIAL' | 'TOTAL' | 'SEM_COPART';
  registroAns?: string;
  codInternoComOdonto?: string;
  codInternoSemOdonto?: string;
  faixas: TabelaPrecoFaixa[];
}

export interface TabelaPrecoImportada {
  id: string;
  operadora: string; // Ex: 'HAPVIDA'
  modalidade: ModalidadeTabela; // Ex: 'INDIVIDUAL', 'PME_2_29', etc.
  cidade: string; // Ex: 'Fortaleza', 'Recife'
  uf: string; // Ex: 'CE', 'PE'
  vigenciaInicio: string; // Ex: '2026-07-01'
  vigenciaFim: string; // Ex: '2026-09-30'
  taxaAdesao: number; // Ex: 20.00 ou 35.00
  odontoPromoValor?: number; // Ex: 14.87 ou 23.25 ou 24.50
  odontoCheioValor?: number; // Ex: 75.84 ou 78.87
  arquivoNome?: string;
  produtos: TabelaPrecoProdutoParsed[];
  criadoEm: string;
  criadoPor?: string;
  ativo: boolean;
}

export interface CotacaoItemResult {
  id: string;
  operadora: string;
  planoNome: string;
  segmentacao?: string;
  acomodacao: 'ENFERMARIA' | 'APARTAMENTO';
  coparticipacao: boolean;
  temOdonto: boolean;
  origemTabela?: 'OFICIAL_PDF' | 'BASE_ESTIMADA' | 'SEM_TABELA_SOB_CONSULTA';
  statusTabela?: 'OFICIAL' | 'ESTIMADA' | 'SOB_CONSULTA';
  precosPorFaixa: {
    faixa: string;
    faixaLabel?: string;
    qtd: number;
    valorUnitarioSaude: number;
    valorUnitarioOdonto: number;
    subtotal: number;
  }[];
  taxaAdesao: number;
  carencias: { evento: string; dias: number | string }[];
  valorTotalSaude: number;
  valorTotalOdonto: number;
  valorTotalGeral: number;
}

export interface Cotacao {
  id: string;
  clienteNome?: string;
  uf: string;
  cidade: string;
  created_at: string;
  corretor: string;
  operadoras: string[];
  tiposPlano: string[];
  vidasPorFaixa: Record<string, number>;
  totalVidas: number;
  totalMensalEstimado: number;
  detalhes?: any;
}

export interface CotacaoRecord {
  id: string;
  data: string;
  cidade: string;
  uf: string;
  totalVidas: number;
  valorTotal: number;
  operadoras: string[];
  criadoPor: string;
  formatoSaida?: 'imagem' | 'pdf';
  itens?: CotacaoItemResult[];
}

export interface PaymentLot {
  id: string;
  codigo: string;
  aprovadoPor: string;
  dataAprovacao: string;
  qtdPropostas: number;
  vencimento: string;
  valorTotal: number;
  status: 'PENDENTE' | 'PAGO';
  comprovanteUrl?: string;
}

export interface Proposal {
  id: string;
  contrato: string;
  data: string;
  cliente: string;
  cpfCnpj: string;
  corretor: string;
  operadora: string;
  categoria: string;
  valor: number;
  vidas: number;
  status: 'CADASTRADA' | 'ENVIADA AO FINANCEIRO' | 'PAGO';
  comissao: number;
  detalhes?: any;
  observacoes?: string;
  lote_id?: string;
  parcelas_status?: Record<number, 'PENDENTE' | 'PAGO'>;
  parcelas_repassadas?: Record<number, 'PENDENTE' | 'PAGO'>;
  parcelas_valores?: Record<number, number>;
}
