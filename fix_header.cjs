const fs = require('fs');
let code = fs.readFileSync('components/Dashboard.tsx', 'utf8');

// 1. Update evolucao to hold value and vidas
code = code.replace(
  /const evolucao = useMemo\(\(\) => {[\s\S]*?\}, \[filteredProposals, selectedMonth, selectedYear\]\);/,
`const evolucao = useMemo(() => {
    const map = new Map<string, {valor: number, vidas: number}>();
    filteredProposals.forEach(p => {
      if (!p.data) return;
      
      let key = p.data;
      if (selectedMonth === 'TODOS' && selectedYear !== 'TODOS') {
        const [year, month] = p.data.split('-');
        key = \`\${year}-\${month}\`;
      } else if (selectedYear === 'TODOS') {
         const [year] = p.data.split('-');
         key = year;
      }
      
      const curr = map.get(key) || {valor: 0, vidas: 0};
      curr.valor += (Number(p.valor) || 0);
      curr.vidas += (Number(p.vidas) || 0);
      map.set(key, curr);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, data]) => {
        let label = name;
        if (name.length === 7) {
            const [y, m] = name.split('-');
            label = \`\${MONTHS_LABELS[parseInt(m)-1]}/\${y}\`;
        } else if (name.length === 10) {
            const [y, m, d] = name.split('-');
            label = \`\${d}/\${m}\`;
        }
        return { name: label, value: data.valor, vidas: data.vidas };
      });
  }, [filteredProposals, selectedMonth, selectedYear]);`
);

// 2. Adjust header styling to be smaller and wrap if necessary
code = code.replace(
  /<div className="bg-slate-900 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 text-white shadow-lg">/,
  `<div className="bg-slate-900 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3 text-white shadow-lg">`
);

code = code.replace(
  /<div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">\s*<i className="fa-solid fa-chart-line text-xl"><\/i>\s*<\/div>\s*<div>\s*<h1 className="text-lg font-black uppercase tracking-tighter">Dashboard de Vendas<\/h1>\s*<p className="text-\[10px\] font-bold text-slate-400 uppercase tracking-widest">Indicadores de Propostas<\/p>\s*<\/div>/,
  `<div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <i className="fa-solid fa-chart-line text-lg"></i>
          </div>
          <div>
            <h1 className="text-base font-black uppercase tracking-tighter">Dashboard de Vendas</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Indicadores</p>
          </div>`
);

code = code.replace(
  /<div className="flex items-center gap-6 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">/g,
  `<div className="flex flex-wrap items-center gap-3 md:gap-4 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide">`
);

code = code.replace(
  /className={`px-3 py-1\.5 rounded-lg text-\[10px\] font-black transition-all border /g,
  'className={`px-2 py-1 rounded-lg text-[9px] font-black transition-all border '
);

code = code.replace(
  /className={`px-4 py-1\.5 rounded-lg text-\[10px\] font-black transition-all border /g,
  'className={`px-3 py-1 rounded-lg text-[9px] font-black transition-all border '
);

fs.writeFileSync('components/Dashboard.tsx', code);
