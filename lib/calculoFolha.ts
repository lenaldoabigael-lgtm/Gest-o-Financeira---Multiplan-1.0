// lib/calculoFolha.ts
//
// Lógica de cálculo da folha de pagamento e rescisões do Módulo RH MultiPlan
// Conforme especificações da CLT e tabela progressiva de INSS.

import { RhTabelaInssFaixa } from '../types';

// Tabela Padrão Progressiva do INSS 2026/2025
export const TABELA_INSS_PADRAO: RhTabelaInssFaixa[] = [
  { ate: 1412.00, aliquota: 0.075, deducao: 0 },
  { ate: 2666.68, aliquota: 0.090, deducao: 21.18 },
  { ate: 4000.03, aliquota: 0.120, deducao: 101.18 },
  { ate: 7786.02, aliquota: 0.140, deducao: 181.18 },
  { ate: null, aliquota: 0.140, deducao: 181.18 } // Teto
];

/**
 * Calcula o desconto progressivo de INSS por faixas
 */
export function calcularInssProgressivo(salarioBruto: number, faixas: RhTabelaInssFaixa[] = TABELA_INSS_PADRAO): number {
  if (salarioBruto <= 0) return 0;

  let descontoTotal = 0;
  let baseRestante = salarioBruto;
  let limiteAnterior = 0;

  for (let i = 0; i < faixas.length; i++) {
    const faixa = faixas[i];
    const limiteAtual = faixa.ate;

    if (limiteAtual === null) {
      // Teto atingido na faixa anterior
      break;
    }

    if (salarioBruto > limiteAtual) {
      const faixaTributavel = limiteAtual - limiteAnterior;
      descontoTotal += faixaTributavel * faixa.aliquota;
      limiteAnterior = limiteAtual;
    } else {
      const faixaTributavel = salarioBruto - limiteAnterior;
      descontoTotal += faixaTributavel * faixa.aliquota;
      break;
    }
  }

  // Teto máximo do INSS (em torno de R$ 908,86 no teto de 7.786,02)
  const tetoFaixa = faixas.find(f => f.ate !== null && faixas[faixas.indexOf(f) + 1]?.ate === null);
  const tetoMaximo = tetoFaixa ? (tetoFaixa.ate! * 0.14 - (tetoFaixa.deducao || 181.18)) : 908.86;

  return Math.min(Number(descontoTotal.toFixed(2)), Number(tetoMaximo.toFixed(2)));
}

/**
 * Calcula FGTS a ser depositado pelo empregador (8% do salário base + horas extras)
 * NOTA: Não é descontado do funcionário. É obrigação da empresa.
 */
export function calcularFgtsEmpresa(salarioBase: number, horasExtras: number = 0): number {
  const baseTributavel = Math.max(0, salarioBase + horasExtras);
  return Number((baseTributavel * 0.08).toFixed(2));
}

/**
 * Calcula a folha líquida do funcionário
 */
export interface ParametrosCalculoFolha {
  salarioBase: number;
  horasExtras?: number;
  tercoFerias?: number;
  descontoFaltasAtrasos?: number;
  descontoValeTransporte?: number;
  descontoAdiantamento?: number;
  faixasInss?: RhTabelaInssFaixa[];
}

export interface ResultadoCalculoFolha {
  salarioBase: number;
  valorHorasExtras: number;
  tercoFerias: number;
  totalProventos: number;
  descontoInss: number;
  descontoFaltasAtrasos: number;
  descontoValeTransporte: number;
  descontoAdiantamento: number;
  totalDescontos: number;
  valorLiquido: number;
  fgtsDepositado: number;
}

export function calcularFolhaFuncionario(params: ParametrosCalculoFolha): ResultadoCalculoFolha {
  const salarioBase = Number(params.salarioBase) || 0;
  const valorHorasExtras = Number(params.horasExtras) || 0;
  const tercoFerias = Number(params.tercoFerias) || 0;
  const descontoFaltasAtrasos = Number(params.descontoFaltasAtrasos) || 0;
  const descontoValeTransporte = Number(params.descontoValeTransporte) || 0;
  const descontoAdiantamento = Number(params.descontoAdiantamento) || 0;

  const baseCalculoInss = Math.max(0, salarioBase + valorHorasExtras - descontoFaltasAtrasos);
  const descontoInss = calcularInssProgressivo(baseCalculoInss, params.faixasInss || TABELA_INSS_PADRAO);

  const totalProventos = Number((salarioBase + valorHorasExtras + tercoFerias).toFixed(2));
  const totalDescontos = Number((descontoInss + descontoFaltasAtrasos + descontoValeTransporte + descontoAdiantamento).toFixed(2));
  
  const valorLiquido = Number(Math.max(0, totalProventos - totalDescontos).toFixed(2));
  const fgtsDepositado = calcularFgtsEmpresa(salarioBase, valorHorasExtras);

  return {
    salarioBase,
    valorHorasExtras,
    tercoFerias,
    totalProventos,
    descontoInss,
    descontoFaltasAtrasos,
    descontoValeTransporte,
    descontoAdiantamento,
    totalDescontos,
    valorLiquido,
    fgtsDepositado
  };
}

/**
 * Cálculo estimado de rescisão contratual (para conferência)
 */
export interface ParametrosRescisao {
  salarioBase: number;
  dataAdmissao: string;
  dataDesligamento: string;
  tipo: 'SEM_JUSTA_CAUSA' | 'PEDIDO_DEMISSAO' | 'JUSTA_CAUSA' | 'ACORDO';
  saldoFgtsEstimado?: number;
}

export interface ResultadoRescisao {
  diasSaldoSalario: number;
  saldoSalario: number;
  mesesDecimo: number;
  decimoProporcional: number;
  mesesFerias: number;
  feriasProporcionais: number;
  tercoFeriasRescisao: number;
  avisoPrevioDias: number;
  avisoPrevio: number;
  multaFgts: number;
  valorTotal: number;
}

export function calcularEstimativaRescisao(params: ParametrosRescisao): ResultadoRescisao {
  const salario = Number(params.salarioBase) || 0;
  if (salario <= 0 || !params.dataAdmissao || !params.dataDesligamento) {
    return {
      diasSaldoSalario: 0,
      saldoSalario: 0,
      mesesDecimo: 0,
      decimoProporcional: 0,
      mesesFerias: 0,
      feriasProporcionais: 0,
      tercoFeriasRescisao: 0,
      avisoPrevioDias: 0,
      avisoPrevio: 0,
      multaFgts: 0,
      valorTotal: 0
    };
  }

  const dtAdmissao = new Date(params.dataAdmissao);
  const dtDesligamento = new Date(params.dataDesligamento);
  
  // Saldo de Salário (dias do mês de desligamento)
  const diaDesligamento = dtDesligamento.getDate();
  const valorDia = salario / 30;
  const saldoSalario = Number((valorDia * Math.min(30, diaDesligamento)).toFixed(2));

  // Meses trabalhados no ano corrente para 13º proporcional
  let mesesDecimo = dtDesligamento.getMonth() + 1;
  if (diaDesligamento < 15) {
    mesesDecimo = Math.max(0, mesesDecimo - 1);
  }
  // Se admitido no mesmo ano, desconta os meses antes da admissão
  if (dtAdmissao.getFullYear() === dtDesligamento.getFullYear()) {
    const mesAdmissao = dtAdmissao.getMonth();
    const diaAdmissao = dtAdmissao.getDate();
    const mesesAnteriores = diaAdmissao > 15 ? mesAdmissao + 1 : mesAdmissao;
    mesesDecimo = Math.max(0, mesesDecimo - mesesAnteriores);
  }
  mesesDecimo = Math.min(12, Math.max(0, mesesDecimo));

  // Meses para férias proporcionais no período aquisitivo
  const mesesTrabalhadosTotal = Math.max(0, 
    (dtDesligamento.getFullYear() - dtAdmissao.getFullYear()) * 12 + (dtDesligamento.getMonth() - dtAdmissao.getMonth())
  );
  let mesesFerias = mesesTrabalhadosTotal % 12;
  if (diaDesligamento >= 15) mesesFerias += 1;
  mesesFerias = Math.min(12, Math.max(0, mesesFerias));

  // Anos completos de serviço para aviso prévio proporcional (Lei 12.506/2011)
  const anosCompletos = Math.floor(mesesTrabalhadosTotal / 12);
  const diasAviso = Math.min(90, 30 + (anosCompletos * 3));

  let avisoPrevio = 0;
  let decimoProporcional = 0;
  let feriasProporcionais = 0;
  let tercoFeriasRescisao = 0;
  let multaFgts = 0;

  // Saldo FGTS aproximado caso não informado (8% mensal acumulado)
  const saldoFgtsBase = params.saldoFgtsEstimado || (salario * 0.08 * Math.max(1, mesesTrabalhadosTotal));

  switch (params.tipo) {
    case 'SEM_JUSTA_CAUSA':
      avisoPrevio = Number(((salario / 30) * diasAviso).toFixed(2));
      decimoProporcional = Number(((salario / 12) * mesesDecimo).toFixed(2));
      const feriasProp = (salario / 12) * mesesFerias;
      feriasProporcionais = Number(feriasProp.toFixed(2));
      tercoFeriasRescisao = Number((feriasProp / 3).toFixed(2));
      multaFgts = Number((saldoFgtsBase * 0.40).toFixed(2)); // 40%
      break;

    case 'PEDIDO_DEMISSAO':
      avisoPrevio = 0; // Não recebe indenização
      decimoProporcional = Number(((salario / 12) * mesesDecimo).toFixed(2));
      const feriasPropPed = (salario / 12) * mesesFerias;
      feriasProporcionais = Number(feriasPropPed.toFixed(2));
      tercoFeriasRescisao = Number((feriasPropPed / 3).toFixed(2));
      multaFgts = 0; // Não tem direito
      break;

    case 'JUSTA_CAUSA':
      avisoPrevio = 0;
      decimoProporcional = 0;
      feriasProporcionais = 0;
      tercoFeriasRescisao = 0;
      multaFgts = 0;
      break;

    case 'ACORDO':
      avisoPrevio = Number((((salario / 30) * diasAviso) * 0.5).toFixed(2)); // 50%
      decimoProporcional = Number(((salario / 12) * mesesDecimo).toFixed(2));
      const feriasPropAc = (salario / 12) * mesesFerias;
      feriasProporcionais = Number(feriasPropAc.toFixed(2));
      tercoFeriasRescisao = Number((feriasPropAc / 3).toFixed(2));
      multaFgts = Number((saldoFgtsBase * 0.20).toFixed(2)); // 20%
      break;
  }

  const valorTotal = Number(
    (saldoSalario + avisoPrevio + decimoProporcional + feriasProporcionais + tercoFeriasRescisao + multaFgts).toFixed(2)
  );

  return {
    diasSaldoSalario: Math.min(30, diaDesligamento),
    saldoSalario,
    mesesDecimo,
    decimoProporcional,
    mesesFerias,
    feriasProporcionais,
    tercoFeriasRescisao,
    avisoPrevioDias: params.tipo === 'SEM_JUSTA_CAUSA' || params.tipo === 'ACORDO' ? diasAviso : 0,
    avisoPrevio,
    multaFgts,
    valorTotal
  };
}
