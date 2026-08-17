const fs = require('fs');

// 1. Update ProposalsView.tsx
let code = fs.readFileSync('components/ProposalsView.tsx', 'utf8');
const pvTarget = `                                  if (!p.valor || p.valor === 0) {
                                    setAlertMessage('Não é possível enviar propostas com valor R$ 0,00 para o financeiro. Edite a proposta e insira o valor do contrato.');
                                    return;
                                  }`;
const pvReplacement = `                                  if ((!p.valor || p.valor === 0) && !p.detalhes?.proposta?.pagamentoCartao) {
                                    setAlertMessage('Não é possível enviar propostas com valor R$ 0,00 para o financeiro (exceto Cartão Corretora). Edite a proposta e insira o valor do contrato.');
                                    return;
                                  }`;
if(code.includes(pvTarget)) {
  code = code.replace(pvTarget, pvReplacement);
  fs.writeFileSync('components/ProposalsView.tsx', code);
  console.log("Updated ProposalsView.tsx");
}

// 2. Update ProposalModal.tsx
let modalCode = fs.readFileSync('components/ProposalModal.tsx', 'utf8');
const modalTarget = `    const valorContrato = Number(formData.financeiro.valorContrato) || 0;
    if ((nextStatus === 'ENVIADA AO FINANCEIRO' || formData.proposta.pagamentoCartao) && valorContrato === 0) {
      setAlertMessage('Não é possível salvar propostas de Cartão Corretora ou avançar para o financeiro com valor de R$ 0,00. Por favor, insira o valor do contrato.');
      return;
    }`;
const modalReplacement = `    const valorContrato = Number(formData.financeiro.valorContrato) || 0;
    if (nextStatus === 'ENVIADA AO FINANCEIRO' && valorContrato === 0 && !formData.proposta.pagamentoCartao) {
      setAlertMessage('Não é possível avançar para o financeiro com valor de R$ 0,00 (exceto Cartão Corretora). Por favor, insira o valor do contrato.');
      return;
    }`;
if(modalCode.includes(modalTarget)) {
  modalCode = modalCode.replace(modalTarget, modalReplacement);
  fs.writeFileSync('components/ProposalModal.tsx', modalCode);
  console.log("Updated ProposalModal.tsx");
}

// 3. Update FinanceView.tsx
let financeCode = fs.readFileSync('components/FinanceView.tsx', 'utf8');
const financeTarget = `                          const hasZeroValor = props.some(p => !p.valor || p.valor === 0);
                          if (hasZeroValor) {
                            setAlertMessage('Não é possível gerar lote: existem propostas com valor R$ 0,00. Por favor, edite-as e informe o valor correto.');
                            return;
                          }`;
const financeReplacement = `                          const hasZeroValor = props.some(p => (!p.valor || p.valor === 0) && !p.detalhes?.proposta?.pagamentoCartao);
                          if (hasZeroValor) {
                            setAlertMessage('Não é possível gerar lote: existem propostas com valor R$ 0,00 (exceto Cartão Corretora). Por favor, edite-as e informe o valor correto.');
                            return;
                          }`;
if(financeCode.includes(financeTarget)) {
  financeCode = financeCode.replace(financeTarget, financeReplacement);
  fs.writeFileSync('components/FinanceView.tsx', financeCode);
  console.log("Updated FinanceView.tsx");
}
