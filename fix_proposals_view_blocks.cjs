const fs = require('fs');
let code = fs.readFileSync('components/ProposalsView.tsx', 'utf8');

// 1. Confirm Import Block
const importConfirmTarget = `                onClick={() => {
                  if (onImportProposals) {
                    onImportProposals(importPreviewData);
                  }
                  setImportPreviewData(null);
                }}`;

const importConfirmReplacement = `                onClick={() => {
                  const hasMissingContract = importPreviewData.some(p => !p.contrato || p.contrato.trim() === '' || p.contrato.startsWith('IMP-'));
                  if (hasMissingContract) {
                    setAlertMessage('Não é possível confirmar a importação: existem propostas sem número de contrato. Por favor, edite a planilha e informe a numeração correta.');
                    return;
                  }
                  if (onImportProposals) {
                    onImportProposals(importPreviewData);
                  }
                  setImportPreviewData(null);
                }}`;
code = code.replace(importConfirmTarget, importConfirmReplacement);

// 2. Send to Finance Block
const sendFinanceTarget = `                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!p.vidas || p.vidas === 0) {
                                    setAlertMessage('Não é possível enviar propostas com 0 vidas para o financeiro. Edite a proposta e insira a quantidade de vidas corretamente.');
                                    return;
                                  }
                                  setConfirmingSendId(p.id);
                                }}`;

const sendFinanceReplacement = `                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!p.vidas || p.vidas === 0) {
                                    setAlertMessage('Não é possível enviar propostas com 0 vidas para o financeiro. Edite a proposta e insira a quantidade de vidas corretamente.');
                                    return;
                                  }
                                  if (!p.contrato || p.contrato.trim() === '' || p.contrato.startsWith('IMP-')) {
                                    setAlertMessage('Não é possível enviar propostas sem número de contrato para o financeiro. Edite a proposta e informe o contrato.');
                                    return;
                                  }
                                  setConfirmingSendId(p.id);
                                }}`;
code = code.replace(sendFinanceTarget, sendFinanceReplacement);

fs.writeFileSync('components/ProposalsView.tsx', code);
