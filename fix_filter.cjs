const fs = require('fs');
let code = fs.readFileSync('components/ProposalsView.tsx', 'utf8');

code = code.replace(
  /const matchSearch = \(\s*p\.cliente\.toLowerCase\(\)\.includes\(searchTerm\.toLowerCase\(\)\) \|\| \s*p\.cpfCnpj\.includes\(searchTerm\) \|\| \s*p\.contrato\.toLowerCase\(\)\.includes\(searchTerm\.toLowerCase\(\)\)\s*\);/,
  `const searchTerms = searchTerm.toLowerCase().trim().split(/\\s+/);
      const matchSearch = searchTerms.every(term => 
        (p.cliente || '').toLowerCase().includes(term) || 
        (p.cpfCnpj || '').toLowerCase().includes(term) || 
        (p.contrato || '').toLowerCase().includes(term)
      );`
);

fs.writeFileSync('components/ProposalsView.tsx', code);
