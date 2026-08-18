const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const target = `              const impostos = proposalRequirements.filter(r => r.tipo === 'IMPOSTO_CORRETOR');
              const totalValue = selectedProposals.reduce((acc, p) => {
                const comissaoBase = Number(p.comissao || 0);
                const pctStr = impostos.find(r => r.nome.startsWith(\`\${p.corretor.toUpperCase()} - \${p.operadora.toUpperCase()} - \`)) ||
                               impostos.find(r => r.nome.startsWith(\`TODOS - \${p.operadora.toUpperCase()} - \`)) ||
                               impostos.find(r => r.nome.startsWith(\`\${p.corretor.toUpperCase()} - TODAS - \`)) ||
                               impostos.find(r => r.nome.startsWith(\`TODOS - TODAS - \`));
                
                let txPercentual = 0;
                if (pctStr) {
                  txPercentual = parseFloat(pctStr.nome.split(' - ')[2]) || 0;
                }`;

const replacement = `              const impostos = proposalRequirements.filter(r => r.tipo === 'IMPOSTO_CORRETOR');
              const totalValue = selectedProposals.reduce((acc, p) => {
                const comissaoBase = Number(p.comissao || 0);
                const corretor = p.corretor.toUpperCase();
                const operadora = p.operadora.toUpperCase();
                const tipoPlano = (p.detalhes?.proposta?.tipoPlano || '').toUpperCase();
                
                const baseSearch = [
                  \`\${corretor} - \${operadora}\`,
                  \`TODOS - \${operadora}\`,
                  \`\${corretor} - TODAS\`,
                  \`TODOS - TODAS\`
                ];
                
                let pctStr;
                for (const base of baseSearch) {
                  pctStr = impostos.find(r => r.nome.startsWith(\`\${base} - \${tipoPlano} - \`)) ||
                           impostos.find(r => r.nome.startsWith(\`\${base} - TODOS OS TIPOS - \`)) ||
                           impostos.find(r => r.nome.startsWith(\`\${base} - TODOS - \`)) ||
                           impostos.find(r => r.nome.split(' - ').length === 3 && r.nome.startsWith(\`\${base} - \`));
                  if (pctStr) break;
                }
                
                let txPercentual = 0;
                if (pctStr) {
                  const parts = pctStr.nome.split(' - ');
                  txPercentual = parseFloat(parts[parts.length - 1]) || 0;
                }`;

if(code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('App.tsx', code);
  console.log("Updated App.tsx com sucesso!");
} else {
  console.log("Target string não encontrada no App.tsx");
}
