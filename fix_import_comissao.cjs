const fs = require('fs');
let code = fs.readFileSync('components/ProposalsView.tsx', 'utf8');

code = code.replace(
  /const cleanMoney = \(val: any\): number => \{[\s\S]*?return parseFloat\(cleanStr\) \|\| 0;\s*\};/,
  `const cleanMoney = (val: any): number => {
          if (val === undefined || val === null) return 0;
          if (typeof val === 'number') return val;
          const str = val.toString().trim();
          if (!str || str === '-') return 0;
          
          let cleanStr = str.replace(/R\\$\\s?/gi, '').replace(/\\s/g, '').replace(/\\u00A0/g, '');
          
          const commas = (cleanStr.match(/,/g) || []).length;
          const dots = (cleanStr.match(/\\./g) || []).length;
          
          if (commas === 1 && dots === 1) {
            if (cleanStr.indexOf('.') < cleanStr.indexOf(',')) {
               return parseFloat(cleanStr.replace(/\\./g, '').replace(',', '.'));
            } else {
               return parseFloat(cleanStr.replace(/,/g, ''));
            }
          }
          
          if (commas === 1 && dots === 0) {
            const parts = cleanStr.split(',');
            if (parts[1].length <= 2) {
               return parseFloat(cleanStr.replace(',', '.'));
            } else {
               return parseFloat(cleanStr.replace(',', ''));
            }
          }
          
          if (dots === 1 && commas === 0) {
            const parts = cleanStr.split('.');
            if (parts[1].length === 3) {
               return parseFloat(cleanStr.replace('.', ''));
            }
          }
          
          const parsed = parseFloat(cleanStr);
          return isNaN(parsed) ? 0 : parsed;
        };`
);

code = code.replace(
  /let comissaoNum = 0;\s*if \(!isNaN\(comissaoFromRow\)\) \{\s*comissaoNum = comissaoFromRow;\s*\} else \{\s*comissaoNum = Math\.max\(0, valorNum - finalTaxaNum\);\s*\}/,
  `let comissaoNum = 0;
          if (!isNaN(comissaoFromRow) && comissaoFromRow !== 0) {
            comissaoNum = comissaoFromRow;
          } else {
            comissaoNum = Math.max(0, valorNum - finalTaxaNum);
          }`
);

fs.writeFileSync('components/ProposalsView.tsx', code);
