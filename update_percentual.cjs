const fs = require('fs');

let code = fs.readFileSync('components/ProposalStructureView.tsx', 'utf8');

const targetState = `  const [newPercentual, setNewPercentual] = useState({
    corretor: '',
    operadora: '',
    parcela: '',
    valor: ''
  });`;

const replacementState = `  const [newPercentual, setNewPercentual] = useState({
    corretor: '',
    operadora: '',
    tipoPlano: '',
    parcela: '',
    valor: ''
  });`;

const targetHandler = `  const handleAddPercentual = () => {
    if (!newPercentual.corretor || !newPercentual.operadora || !newPercentual.parcela || !newPercentual.valor) return;
    const nome = \`\${newPercentual.parcela} - \${newPercentual.corretor} - \${newPercentual.operadora} - \${newPercentual.valor}\`.toUpperCase();
    onSave({ tipo: 'PERCENTUAL_COMISSAO', nome });
    setNewPercentual({ corretor: '', operadora: '', parcela: '', valor: '' });
  };`;

const replacementHandler = `  const handleAddPercentual = () => {
    if (!newPercentual.corretor || !newPercentual.operadora || !newPercentual.parcela || !newPercentual.valor) return;
    const tipo = newPercentual.tipoPlano || 'TODOS OS TIPOS';
    const nome = \`\${newPercentual.parcela} - \${newPercentual.corretor} - \${newPercentual.operadora} - \${tipo} - \${newPercentual.valor}\`.toUpperCase();
    onSave({ tipo: 'PERCENTUAL_COMISSAO', nome });
    setNewPercentual({ corretor: '', operadora: '', tipoPlano: '', parcela: '', valor: '' });
  };`;

const targetSelect = `              <select
                value={newPercentual.operadora}
                onChange={(e) => setNewPercentual(prev => ({ ...prev, operadora: e.target.value }))}
                className="flex-1 bg-slate-50 border-none rounded-xl text-xs py-2.5 px-4 focus:ring-2 focus:ring-sky-600/10 outline-none uppercase font-bold text-slate-700"
              >
                <option value="">Selecione a Operadora...</option>
                <option value="TODAS">TODAS AS OPERADORAS</option>
                {groupedRequirements.OPERADORA.map(op => (
                  <option key={op.id} value={op.nome}>{op.nome}</option>
                ))}
              </select>
              <select`;

const replacementSelect = `              <select
                value={newPercentual.operadora}
                onChange={(e) => setNewPercentual(prev => ({ ...prev, operadora: e.target.value }))}
                className="flex-1 bg-slate-50 border-none rounded-xl text-xs py-2.5 px-4 focus:ring-2 focus:ring-sky-600/10 outline-none uppercase font-bold text-slate-700"
              >
                <option value="">Selecione a Operadora...</option>
                <option value="TODAS">TODAS AS OPERADORAS</option>
                {groupedRequirements.OPERADORA.map(op => (
                  <option key={op.id} value={op.nome}>{op.nome}</option>
                ))}
              </select>
              <select
                value={newPercentual.tipoPlano}
                onChange={(e) => setNewPercentual(prev => ({ ...prev, tipoPlano: e.target.value }))}
                className="flex-1 bg-slate-50 border-none rounded-xl text-xs py-2.5 px-4 focus:ring-2 focus:ring-sky-600/10 outline-none uppercase font-bold text-slate-700"
              >
                <option value="">Selecione o Tipo...</option>
                <option value="TODOS">TODOS OS TIPOS</option>
                {groupedRequirements.TIPO_PLANO.map(t => (
                  <option key={t.id} value={t.nome}>{t.nome}</option>
                ))}
              </select>
              <select`;

const targetDisplay = `                  <span className="text-[11px] font-bold text-slate-700 uppercase"><i className="fa-solid fa-chart-pie text-sky-600 mr-2"></i> {req.nome.split(' - ')[3]}% - Parcela: {req.nome.split(' - ')[0].replace('_', ' ')} - {req.nome.split(' - ')[1]} ({req.nome.split(' - ')[2]})</span>`;

const replacementDisplay = `                  <span className="text-[11px] font-bold text-slate-700 uppercase"><i className="fa-solid fa-chart-pie text-sky-600 mr-2"></i> {req.nome.split(' - ').length === 5 ? req.nome.split(' - ')[4] : req.nome.split(' - ')[3]}% - Parcela: {req.nome.split(' - ')[0].replace('_', ' ')} - {req.nome.split(' - ')[1]} ({req.nome.split(' - ')[2]}{req.nome.split(' - ').length === 5 && req.nome.split(' - ')[3] !== 'TODOS OS TIPOS' ? ' / ' + req.nome.split(' - ')[3] : ''})</span>`;

code = code.replace(targetState, replacementState);
code = code.replace(targetHandler, replacementHandler);
code = code.replace(targetSelect, replacementSelect);
code = code.replace(targetDisplay, replacementDisplay);

fs.writeFileSync('components/ProposalStructureView.tsx', code);
console.log("Updated ProposalStructureView.tsx");
