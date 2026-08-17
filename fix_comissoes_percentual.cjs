const fs = require('fs');
let code = fs.readFileSync('components/ComissoesModule.tsx', 'utf8');

const targetPercentual = `        // Find percentual: match parcela, corretor, operadora
        const strParcela = \`\${i}ª_PARCELA\`;
        const match = percentuaisConf.find(r => r.nome.startsWith(\`\${strParcela} - \${p.corretor.toUpperCase()} - \${p.operadora.toUpperCase()} - \`)) ||
                      percentuaisConf.find(r => r.nome.startsWith(\`\${strParcela} - TODOS - \${p.operadora.toUpperCase()} - \`)) ||
                      percentuaisConf.find(r => r.nome.startsWith(\`\${strParcela} - \${p.corretor.toUpperCase()} - TODAS - \`)) ||
                      percentuaisConf.find(r => r.nome.startsWith(\`\${strParcela} - TODOS - TODAS - \`)) ||
                      percentuaisConf.find(r => r.nome.startsWith(\`TODAS - \${p.corretor.toUpperCase()} - \${p.operadora.toUpperCase()} - \`)) ||
                      percentuaisConf.find(r => r.nome.startsWith(\`TODAS - TODOS - \${p.operadora.toUpperCase()} - \`)) ||
                      percentuaisConf.find(r => r.nome.startsWith(\`TODAS - \${p.corretor.toUpperCase()} - TODAS - \`)) ||
                      percentuaisConf.find(r => r.nome.startsWith(\`TODAS - TODOS - TODAS - \`));`;

const replacementPercentual = `        // Find percentual: match parcela, corretor, operadora, tipoPlano
        const strParcela = \`\${i}ª_PARCELA\`;
        const tipoPlano = (p.detalhes?.proposta?.tipoPlano || '').toUpperCase();
        const baseSearch = [
          \`\${strParcela} - \${p.corretor.toUpperCase()} - \${p.operadora.toUpperCase()}\`,
          \`\${strParcela} - TODOS - \${p.operadora.toUpperCase()}\`,
          \`\${strParcela} - \${p.corretor.toUpperCase()} - TODAS\`,
          \`\${strParcela} - TODOS - TODAS\`,
          \`TODAS - \${p.corretor.toUpperCase()} - \${p.operadora.toUpperCase()}\`,
          \`TODAS - TODOS - \${p.operadora.toUpperCase()}\`,
          \`TODAS - \${p.corretor.toUpperCase()} - TODAS\`,
          \`TODAS - TODOS - TODAS\`
        ];
        
        let match;
        for (const base of baseSearch) {
          // First try exact match with tipoPlano
          match = percentuaisConf.find(r => r.nome.startsWith(\`\${base} - \${tipoPlano} - \`));
          if (match) break;
          // Then try TODOS OS TIPOS
          match = percentuaisConf.find(r => r.nome.startsWith(\`\${base} - TODOS OS TIPOS - \`));
          if (match) break;
          // Fallback for older formats without tipoPlano
          match = percentuaisConf.find(r => {
             const parts = r.nome.split(' - ');
             return parts.length === 4 && r.nome.startsWith(\`\${base} - \`);
          });
          if (match) break;
        }`;

code = code.replace(targetPercentual, replacementPercentual);
fs.writeFileSync('components/ComissoesModule.tsx', code);
console.log("Updated ComissoesModule.tsx");
