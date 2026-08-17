const fs = require('fs');
let code = fs.readFileSync('components/ProposalsView.tsx', 'utf8');

// Update Send to Finance block in ProposalsView.tsx
const sendFinanceTarget = `                                  if (!p.vidas || p.vidas === 0) {
                                    setAlertMessage('Não é possível enviar propostas com 0 vidas para o financeiro. Edite a proposta e insira a quantidade de vidas corretamente.');
                                    return;
                                  }`;

const sendFinanceReplacement = `                                  if (!p.vidas || p.vidas === 0) {
                                    setAlertMessage('Não é possível enviar propostas com 0 vidas para o financeiro. Edite a proposta e insira a quantidade de vidas corretamente.');
                                    return;
                                  }
                                  if (!p.valor || p.valor === 0) {
                                    setAlertMessage('Não é possível enviar propostas com valor R$ 0,00 para o financeiro. Edite a proposta e insira o valor do contrato.');
                                    return;
                                  }`;

if(code.includes(sendFinanceTarget)) {
  code = code.replace(sendFinanceTarget, sendFinanceReplacement);
  fs.writeFileSync('components/ProposalsView.tsx', code);
  console.log("Updated ProposalsView.tsx");
} else {
  console.log("Could not find target in ProposalsView.tsx");
}

let modalCode = fs.readFileSync('components/ProposalModal.tsx', 'utf8');
const modalTarget = `    if ((nextStatus === 'ENVIADA AO FINANCEIRO' || formData.proposta.pagamentoCartao) && vidas === 0) {
      setAlertMessage('Não é possível salvar propostas de Cartão Corretora ou avançar para o financeiro com 0 vidas. Por favor, insira a quantidade de vidas correta.');
      return;
    }`;

const modalReplacement = `    if ((nextStatus === 'ENVIADA AO FINANCEIRO' || formData.proposta.pagamentoCartao) && vidas === 0) {
      setAlertMessage('Não é possível salvar propostas de Cartão Corretora ou avançar para o financeiro com 0 vidas. Por favor, insira a quantidade de vidas correta.');
      return;
    }

    const valorContrato = Number(formData.financeiro.valorContrato) || 0;
    if ((nextStatus === 'ENVIADA AO FINANCEIRO' || formData.proposta.pagamentoCartao) && valorContrato === 0) {
      setAlertMessage('Não é possível salvar propostas de Cartão Corretora ou avançar para o financeiro com valor de R$ 0,00. Por favor, insira o valor do contrato.');
      return;
    }`;

if(modalCode.includes(modalTarget)) {
  modalCode = modalCode.replace(modalTarget, modalReplacement);
  fs.writeFileSync('components/ProposalModal.tsx', modalCode);
  console.log("Updated ProposalModal.tsx");
} else {
  console.log("Could not find target in ProposalModal.tsx");
}

let financeCode = fs.readFileSync('components/FinanceView.tsx', 'utf8');
const financeTarget = `                          const hasZeroVidas = props.some(p => !p.vidas || p.vidas === 0);
                          if (hasZeroVidas) {
                            setAlertMessage('Não é possível gerar lote: existem propostas com 0 vidas. Por favor, edite-as e informe a quantidade correta.');
                            return;
                          }`;

const financeReplacement = `                          const hasZeroVidas = props.some(p => !p.vidas || p.vidas === 0);
                          if (hasZeroVidas) {
                            setAlertMessage('Não é possível gerar lote: existem propostas com 0 vidas. Por favor, edite-as e informe a quantidade correta.');
                            return;
                          }
                          const hasZeroValor = props.some(p => !p.valor || p.valor === 0);
                          if (hasZeroValor) {
                            setAlertMessage('Não é possível gerar lote: existem propostas com valor R$ 0,00. Por favor, edite-as e informe o valor correto.');
                            return;
                          }`;

if(financeCode.includes(financeTarget)) {
  financeCode = financeCode.replace(financeTarget, financeReplacement);
  fs.writeFileSync('components/FinanceView.tsx', financeCode);
  console.log("Updated FinanceView.tsx");
} else {
  console.log("Could not find target in FinanceView.tsx");
}

