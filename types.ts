
export type UserRole = 'admin' | 'teste1' | 'teste2' | 'teste3';

export interface User {
  login: string;
  senha: string;
  email?: string;
  approved?: boolean; // Novo campo para controle de aprovação
  permissions: {
    centroCusto: boolean;
    contasPagar: boolean;
    contasReceber: boolean;
    dashboard: boolean;
    fluxoCaixa: boolean;
    detalhes: boolean;
    planCredencias: boolean;
  };
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
  cliente?: string;
  conta?: string; // Ex: Santander, Nubank, Caixa
}

export interface CostCenter {
  id: string;
  nome: string;
  tipo: 'RECEITA' | 'DESPESA';
  subItens: string[];
}

export enum Tab {
  CONTAS_PAGAR = 'contas_pagar',
  CONTAS_RECEBER = 'contas_receber',
  CENTRO_CUSTO = 'centro_custo',
  DASHBOARD = 'dashboard',
  FLUXO_CAIXA = 'fluxo_caixa',
  DETALHES = 'detalhes',
  PLAN_CREDENCIAS = 'plan_credencias'
}
