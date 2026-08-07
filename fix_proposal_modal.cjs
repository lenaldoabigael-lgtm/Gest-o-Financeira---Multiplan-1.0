const fs = require('fs');
let code = fs.readFileSync('components/ProposalModal.tsx', 'utf8');

const target = `    if ((nextStatus === 'ENVIADA AO FINANCEIRO' || formData.proposta.pagamentoCartao) && vidas === 0) {
      setAlertMessage('Não é possível salvar propostas de Cartão Corretora ou avançar para o financeiro com 0 vidas. Por favor, insira a quantidade de vidas correta.');
      return;
    }`;

const replacement = `    if ((nextStatus === 'ENVIADA AO FINANCEIRO' || formData.proposta.pagamentoCartao) && vidas === 0) {
      setAlertMessage('Não é possível salvar propostas de Cartão Corretora ou avançar para o financeiro com 0 vidas. Por favor, insira a quantidade de vidas correta.');
      return;
    }
    
    if (!formData.proposta.contrato || formData.proposta.contrato.trim() === '' || formData.proposta.contrato.startsWith('IMP-') || formData.proposta.contrato === 'NOVO') {
      setAlertMessage('Não é possível salvar a proposta sem um número de contrato definitivo. Por favor, insira o número do contrato.');
      return;
    }`;
    
code = code.replace(target, replacement);

fs.writeFileSync('components/ProposalModal.tsx', code);
