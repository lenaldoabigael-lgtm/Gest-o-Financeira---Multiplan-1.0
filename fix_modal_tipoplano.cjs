const fs = require('fs');
let code = fs.readFileSync('components/ProposalModal.tsx', 'utf8');

const target = `              tipoPlano: '', // Not in Proposal type
              unidade: '', // Not in Proposal type`;

const replacement = `              tipoPlano: proposal.detalhes?.proposta?.tipoPlano || '',
              unidade: proposal.detalhes?.proposta?.unidade || '',`;

if(code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('components/ProposalModal.tsx', code);
  console.log("Updated ProposalModal.tsx initialization");
}
