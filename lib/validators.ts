// lib/validators.ts
// Centralized, robust validation functions for proposals and documents

export function calcDigito(base: string, pesos: number[]): number {
  const soma = base.split('').reduce((acc, d, i) => acc + parseInt(d, 10) * pesos[i], 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function validateCPF(cpf: string): boolean {
  const digits = (cpf || '').replace(/\D/g, '');
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  const d1 = calcDigito(digits.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calcDigito(digits.slice(0, 9) + d1, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return digits === digits.slice(0, 9) + String(d1) + String(d2);
}

export function validateCNPJ(cnpj: string): boolean {
  const digits = (cnpj || '').replace(/\D/g, '');
  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) return false;
  const d1 = calcDigito(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calcDigito(digits.slice(0, 12) + d1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return digits === digits.slice(0, 12) + String(d1) + String(d2);
}

export function validateCpfCnpj(doc: string): boolean {
  const digits = (doc || '').replace(/\D/g, '');
  if (!digits) return false;
  
  // Handle padded cases (e.g. lost leading zeroes from Excel spreadsheets)
  if (digits.length >= 8 && digits.length <= 10) {
    const padded = digits.padStart(11, '0');
    if (validateCPF(padded)) return true;
  }
  if (digits.length >= 12 && digits.length <= 13) {
    const padded = digits.padStart(14, '0');
    if (validateCNPJ(padded)) return true;
  }

  if (digits.length === 11) return validateCPF(digits);
  if (digits.length === 14) return validateCNPJ(digits);
  return false;
}

export function isCartaoCorretora(p: any): boolean {
  if (!p) return false;
  const categoria = (p.categoria || '').toLowerCase();
  const tipoPagamento = (p.detalhes?.proposta?.tipoPagamento || p.detalhes?.tipoPagamento || p.formaPagamento || '').toLowerCase();
  const obs = (p.observacao || p.detalhes?.proposta?.observacao || '').toLowerCase();

  return Boolean(
    p.detalhes?.proposta?.pagamentoCartao === true ||
    p.detalhes?.proposta?.pagamentoCartao === 'true' ||
    p.detalhes?.pagamentoCartao === true ||
    p.detalhes?.pagamentoCartao === 'true' ||
    p.pagamentoCartao === true ||
    p.pagamentoCartao === 'true' ||
    categoria.includes('cartão') ||
    categoria.includes('cartao') ||
    tipoPagamento.includes('cart') ||
    obs.includes('cartão da corretora') ||
    obs.includes('cartao da corretora') ||
    obs.includes('cartão corretora') ||
    obs.includes('cartao corretora')
  );
}

export interface ProposalValidationResult {
  isValid: boolean;
  errors: string[];
  missingCorretor: boolean;
  invalidValor: boolean;
  invalidVidas: boolean;
  invalidContrato: boolean;
  invalidCpfCnpj: boolean;
  invalidComissao: boolean;
}

export function validateProposalForAdvance(p: any): ProposalValidationResult {
  const errors: string[] = [];

  // 1. Corretor
  const corretor = (p.corretor || p.detalhes?.proposta?.corretor || '').trim();
  const missingCorretor = !corretor || corretor === 'Sem Corretor' || corretor === 'Selecione...' || corretor === 'Corretor Geral';
  if (missingCorretor) {
    errors.push('Corretor/Vendedora não informado ou inválido');
  }

  // 2. Vidas
  const vidas = Number(p.vidas !== undefined ? p.vidas : p.detalhes?.financeiro?.vidas);
  const invalidVidas = isNaN(vidas) || vidas <= 0;
  if (invalidVidas) {
    errors.push('Quantidade de vidas deve ser maior que 0');
  }

  // 3. Valor
  const isCartao = isCartaoCorretora(p);
  const valor = Number(p.valor !== undefined ? p.valor : p.detalhes?.financeiro?.valorContrato);
  const invalidValor = (isNaN(valor) || valor <= 0) && !isCartao;
  if (invalidValor) {
    errors.push('Valor do contrato deve ser maior que R$ 0,00');
  }

  // 4. Contrato
  const contrato = (p.contrato || p.detalhes?.proposta?.contrato || '').trim();
  const invalidContrato = !contrato || contrato.startsWith('IMP-') || contrato.toUpperCase() === 'NOVO' || contrato === '0';
  if (invalidContrato) {
    errors.push('Número de contrato definitivo e válido é obrigatório (não pode ser provisório ou vazio)');
  }

  // 5. CPF/CNPJ
  const cpfCnpj = (p.cpfCnpj || p.detalhes?.cliente?.cpfCnpj || '').trim();
  const invalidCpfCnpj = !cpfCnpj || !validateCpfCnpj(cpfCnpj);
  if (invalidCpfCnpj) {
    errors.push('CPF ou CNPJ do Cliente é inválido ou incompleto');
  }

  // 6. Comissão (não pode ser zerada se a proposta possui valor)
  const comissao = Number(p.comissao !== undefined ? p.comissao : p.detalhes?.financeiro?.parcelas?.[0]?.comissao);
  const invalidComissao = !isCartao && valor > 0 && (isNaN(comissao) || comissao <= 0);
  if (invalidComissao) {
    errors.push('Comissão da proposta não pode ser zerada (R$ 0,00). Defina um valor de comissão válido.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    missingCorretor,
    invalidValor,
    invalidVidas,
    invalidContrato,
    invalidCpfCnpj,
    invalidComissao
  };
}
