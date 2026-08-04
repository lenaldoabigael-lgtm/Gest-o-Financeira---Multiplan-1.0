const fs = require('fs');
let code = fs.readFileSync('components/Dashboard.tsx', 'utf8');

code = code.replace(
  /\{\/\* 5\. Evolução Diária\/Mensal \*\/\}[\s\S]*?<\/LineChart>\s*<\/ResponsiveContainer>\s*<\/div>\s*<\/div>\s*<\/div>/,
`{/* 5. Evolução Diária/Mensal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-blue-900 font-black uppercase tracking-tighter mb-6 flex items-center gap-2 text-sm">
            <i className="fa-solid fa-arrow-trend-up text-indigo-500"></i> Evolução de Vendas (R$)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolucao}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9}} tickFormatter={(v) => \`R$ \${v.toLocaleString('pt-BR')}\`} width={80} />
                <Tooltip formatter={(value) => formatBRL(Number(value))} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={4} dot={{ r: 4, fill: '#4f46e5' }} name="Total Vendido" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-blue-900 font-black uppercase tracking-tighter mb-6 flex items-center gap-2 text-sm">
            <i className="fa-solid fa-users text-emerald-500"></i> Evolução de Vidas
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolucao}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9}} width={40} />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Line type="monotone" dataKey="vidas" stroke="#10b981" strokeWidth={4} dot={{ r: 4, fill: '#10b981' }} name="Vidas" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>`
);

fs.writeFileSync('components/Dashboard.tsx', code);
