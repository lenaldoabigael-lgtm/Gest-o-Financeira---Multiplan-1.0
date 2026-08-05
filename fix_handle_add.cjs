const fs = require('fs');
let code = fs.readFileSync('components/ProposalModal.tsx', 'utf8');

code = code.replace(
  /const newDoc = \{\s*id: Math\.random\(\)\.toString\(36\)\.substr\(2, 9\),\s*nome: file\.name,\s*data: new Date\(\)\.toLocaleDateString\('pt-BR'\),\s*tamanho: \(file\.size \/ 1024\)\.toFixed\(1\) \+ ' KB'\s*\};/,
  `const newDoc = {
          id: Math.random().toString(36).substr(2, 9),
          nome: file.name,
          data: new Date().toLocaleDateString('pt-BR'),
          tamanho: (file.size / 1024).toFixed(1) + ' KB',
          url: URL.createObjectURL(file)
        };`
);

fs.writeFileSync('components/ProposalModal.tsx', code);
