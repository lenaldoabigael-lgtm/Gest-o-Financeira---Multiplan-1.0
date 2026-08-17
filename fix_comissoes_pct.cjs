const fs = require('fs');
let code = fs.readFileSync('components/ComissoesModule.tsx', 'utf8');

const targetPct = `        let pct = 0;
        if (match) {
          pct = parseFloat(match.nome.split(' - ')[3]) || 0;
        }`;

const replacementPct = `        let pct = 0;
        if (match) {
          const parts = match.nome.split(' - ');
          pct = parseFloat(parts[parts.length - 1]) || 0;
        }`;

code = code.replace(targetPct, replacementPct);
fs.writeFileSync('components/ComissoesModule.tsx', code);
console.log("Updated ComissoesModule.tsx pct extraction");
