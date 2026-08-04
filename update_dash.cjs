const fs = require('fs');
let code = fs.readFileSync('components/Dashboard.tsx', 'utf8');
code = code.replace(
  /<\/div>\s*<\/div>\s*<\/div>\s*{\/\* 1\. KPIs Principais \*\//,
  `          </div>

          <div className="w-px bg-slate-700 h-12 hidden md:block"></div>

          <div className="space-y-3 min-w-max">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <i className="fa-solid fa-user-tie text-blue-500"></i> Corretor
            </h3>
            <select
              value={selectedCorretor}
              onChange={(e) => setSelectedCorretor(e.target.value)}
              className="bg-slate-800 text-white border border-slate-700 rounded-lg px-3 py-1 text-xs font-bold focus:outline-none focus:border-blue-500 w-40"
            >
              <option value="TODOS">TODOS</option>
              {corretoresDisponiveis.map(c => (
                <option key={c} value={c}>{c || 'Sem Nome'}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 1. KPIs Principais */`
);
fs.writeFileSync('components/Dashboard.tsx', code);
