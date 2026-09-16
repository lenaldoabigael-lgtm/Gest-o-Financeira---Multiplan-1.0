import { Proposal, ProposalRequirement } from '../types';

/**
 * Calculates the tax/deduction percentage and net commission for a single proposal.
 * Uses the rules defined in proposal_requirements under 'IMPOSTO_CORRETOR'.
 */
export function calculateProposalNetCommission(
  p: Proposal,
  requirements: ProposalRequirement[] = []
): {
  comissaoBase: number;
  txPercentual: number;
  desconto: number;
  liquido: number;
} {
  const comissaoBase = Number(p.comissao || 0);
  const corretor = (p.corretor || '').trim().toUpperCase();
  const operadora = (p.operadora || '').trim().toUpperCase();
  const tipoPlano = (p.detalhes?.proposta?.tipoPlano || '').trim().toUpperCase();

  const impostos = (requirements || []).filter(r => r.tipo === 'IMPOSTO_CORRETOR');

  const baseSearch = [
    `${corretor} - ${operadora}`,
    `TODOS - ${operadora}`,
    `${corretor} - TODAS`,
    `TODOS - TODAS`
  ];

  let pctStr: ProposalRequirement | undefined;
  for (const base of baseSearch) {
    pctStr =
      impostos.find(r => r.nome.toUpperCase().startsWith(`${base} - ${tipoPlano} - `)) ||
      impostos.find(r => r.nome.toUpperCase().startsWith(`${base} - TODOS OS TIPOS - `)) ||
      impostos.find(r => r.nome.toUpperCase().startsWith(`${base} - TODOS - `)) ||
      impostos.find(r => {
        const parts = r.nome.split(' - ');
        return parts.length === 3 && r.nome.toUpperCase().startsWith(`${base} - `);
      });

    if (pctStr) break;
  }

  let txPercentual = 0;
  if (pctStr) {
    const parts = pctStr.nome.split(' - ');
    txPercentual = parseFloat(parts[parts.length - 1]) || 0;
  }

  const desconto = Number((comissaoBase * (txPercentual / 100)).toFixed(2));
  const liquido = Number((comissaoBase - desconto).toFixed(2));

  return {
    comissaoBase,
    txPercentual,
    desconto,
    liquido: Math.max(0, liquido)
  };
}

/**
 * Calculates the total net amount for an array of proposals in a payment lot.
 */
export function calculateLotTotalNet(
  proposals: Proposal[],
  requirements: ProposalRequirement[] = []
): number {
  const total = proposals.reduce((acc, p) => {
    const { liquido } = calculateProposalNetCommission(p, requirements);
    return acc + liquido;
  }, 0);
  return Number(total.toFixed(2));
}
