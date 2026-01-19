
import { User, Transaction, CostCenter } from './types';

export const USERS: User[] = [
  {
    login: 'admin',
    senha: '123',
    permissions: { 
      centroCusto: true, 
      contasPagar: true, 
      contasReceber: true, 
      dashboard: true, 
      fluxoCaixa: true, 
      detalhes: true,
      planCredencias: true 
    }
  },
  {
    login: 'teste1',
    senha: '123',
    permissions: { 
      centroCusto: true, 
      contasPagar: true, 
      contasReceber: false, 
      dashboard: false, 
      fluxoCaixa: false, 
      detalhes: false,
      planCredencias: false 
    }
  },
  {
    login: 'teste2',
    senha: '123',
    permissions: { 
      centroCusto: true, 
      contasPagar: false, 
      contasReceber: true, 
      dashboard: false, 
      fluxoCaixa: false, 
      detalhes: false,
      planCredencias: false 
    }
  },
  {
    login: 'teste3',
    senha: '123',
    permissions: { 
      centroCusto: false, 
      contasPagar: true, 
      contasReceber: true, 
      dashboard: true, 
      fluxoCaixa: true, 
      detalhes: true,
      planCredencias: false 
    }
  }
];

export const COST_CENTERS: CostCenter[] = [
  { id: '1', nome: 'RECEITA', tipo: 'RECEITA', subItens: ['RECEITA CONDOMINIO', 'RENDIMENTOS'] },
  { id: '2', nome: 'DESP. ESCRITORIO', tipo: 'DESPESA', subItens: ['ALUGUEL ESCRITORIO', 'ÁGUA - ESCRITORIO', 'LUZ - ESCRITORIO', 'TELEFONE - ESCRITORIO', 'CELULAR - ESCRITORIO', 'INTERNET - ESCRITORIO'] },
  { id: '3', nome: 'DESP. DEPOSITO', tipo: 'DESPESA', subItens: ['ALUGUEL DEPOSITO', 'ÁGUA - DEPOSITO', 'LUZ - DEPOSITO', 'TELEFONE - DEPOSITO'] },
  { id: '4', nome: 'DESP. FUNCION. ESCRITORIO', tipo: 'DESPESA', subItens: ['SALARIO ESC', 'ADIANTAMENTO ESC', 'ALIMENTAÇÃO ESC', 'VALE TRANSPORTE ESC'] },
  { id: '5', nome: 'DESP. FUNCION. OBRA', tipo: 'DESPESA', subItens: ['SALARIO OBRA', 'ADIANTAMENTO OBRA', 'ALIMENTAÇÃO OBRA', 'VALE TRANSPORTE OBRA'] },
  { id: '6', nome: 'DESP. MARKETING', tipo: 'DESPESA', subItens: ['CIA GOOGLE', 'ACESSORIA MKT', 'BRINDES'] },
  { id: '7', nome: 'DESP. TELEFONICA', tipo: 'DESPESA', subItens: ['CELULAR TIM', 'CELULAR VIVO'] },
  { id: '8', nome: 'DESP. MAT. OBRA', tipo: 'DESPESA', subItens: ['MAT DIVERSOS', 'FERRAMENTAS'] },
  { id: '9', nome: 'DESP. VEICULOS', tipo: 'DESPESA', subItens: ['GASOLINA', 'MANUTENÇÃO', 'SEGURO'] },
  { id: '10', nome: 'ACESSORIA JURIDICA', tipo: 'DESPESA', subItens: ['MENSALIDADE JURIDICA', 'HONORARIOS'] }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    type: 'PAGAR',
    vencimento: '2023-01-03',
    pagamento: '2023-01-03',
    descricao: 'DESP. MARKETING|CIA GOOGLEPIX',
    valor: 1704.00,
    formaPagamento: 'PIX',
    status: 'PAGO',
    centroCusto: 'DESP. MARKETING',
    subItem: 'CIA GOOGLE'
  },
  {
    id: '2',
    type: 'PAGAR',
    vencimento: '2023-01-08',
    pagamento: '2023-01-08',
    descricao: 'DESP. MAT. OBRA|MAT DIVERSOS PIX',
    valor: 418.84,
    formaPagamento: 'PIX',
    status: 'PAGO',
    centroCusto: 'DESP. MAT. OBRA',
    subItem: 'MAT DIVERSOS'
  },
  {
    id: '3',
    type: 'PAGAR',
    vencimento: '2023-01-09',
    pagamento: '2023-01-09',
    descricao: 'DESP. ESCRITORIO|LUZ - ESCRITORIOPIX',
    valor: 1504.93,
    formaPagamento: 'PIX',
    status: 'PAGO',
    centroCusto: 'DESP. ESCRITORIO',
    subItem: 'LUZ - ESCRITORIO'
  },
  {
    id: '4',
    type: 'PAGAR',
    vencimento: '2023-01-11',
    descricao: 'DESP. FUNCION. OBRA|VALE TRANSPORTE',
    valor: 2288.19,
    formaPagamento: 'TRANSFERÊNCIA',
    status: 'PENDENTE',
    centroCusto: 'DESP. FUNCION. OBRA',
    subItem: 'VALE TRANSPORTE OBRA'
  },
  {
    id: '5',
    type: 'RECEBER',
    vencimento: '2023-01-01',
    pagamento: '2023-01-01',
    descricao: 'RECEITA CONDOMINIO JAN/23',
    valor: 4583.69,
    formaPagamento: 'BOLETO',
    status: 'RECEBIDO',
    centroCusto: 'RECEITA',
    subItem: 'RECEITA CONDOMINIO',
    cliente: 'CONDOMINIO ALFA'
  },
  {
    id: '6',
    type: 'RECEBER',
    vencimento: '2023-02-13',
    descricao: 'RECEITA CONDOMINIO FEV/23',
    valor: 7949.24,
    formaPagamento: 'BOLETO',
    status: 'PENDENTE',
    centroCusto: 'RECEITA',
    subItem: 'RECEITA CONDOMINIO',
    cliente: 'CONDOMINIO BETA'
  }
];
