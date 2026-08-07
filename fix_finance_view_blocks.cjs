const fs = require('fs');
let code = fs.readFileSync('components/FinanceView.tsx', 'utf8');

const generateLotTarget = `                        onClick={() => {
                          const hasZeroVidas = props.some(p => !p.vidas || p.vidas === 0);
                          if (hasZeroVidas) {
                            setAlertMessage('Não é possível gerar lote: existem propostas com 0 vidas. Por favor, edite-as e informe a quantidade correta.');
                            return;
                          }
                          onGenerateLot(corretor, props.map(p => p.id));
                        }}`;

const generateLotReplacement = `                        onClick={() => {
                          const hasZeroVidas = props.some(p => !p.vidas || p.vidas === 0);
                          if (hasZeroVidas) {
                            setAlertMessage('Não é possível gerar lote: existem propostas com 0 vidas. Por favor, edite-as e informe a quantidade correta.');
                            return;
                          }
                          const hasMissingContract = props.some(p => !p.contrato || p.contrato.trim() === '' || p.contrato.startsWith('IMP-'));
                          if (hasMissingContract) {
                            setAlertMessage('Não é possível gerar lote: existem propostas sem número de contrato. Por favor, edite-as e informe o contrato corretamente.');
                            return;
                          }
                          onGenerateLot(corretor, props.map(p => p.id));
                        }}`;
code = code.replace(generateLotTarget, generateLotReplacement);

fs.writeFileSync('components/FinanceView.tsx', code);
