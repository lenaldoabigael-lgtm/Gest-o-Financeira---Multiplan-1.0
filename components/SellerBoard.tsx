import React from 'react';
import { Proposal, ProposalRequirement } from '../types';

interface SellerBoardProps {
  proposals: Proposal[];
  requirements: ProposalRequirement[];
  onStatusChange: (id: string, novoStatus: 'CADASTRADA' | 'ENVIADA AO FINANCEIRO' | 'PAGO') => void;
}

export function getDiasParaPagamento(operadora: string, tipoPlano: string, categoria: string, requirements: ProposalRequirement[]): number {
  const op = operadora.toLowerCase().trim();
  const cat = categoria.toLowerCase();
  const tipo = tipoPlano.toLowerCase();
  
  const prazoReqs = requirements.filter(r => r.tipo === 'PRAZO_PAGAMENTO');
  
  let bestMatchDays = 5; // Default caso não ache
  let currentMatchScore = -1;
  
  for (const req of prazoReqs) {
    const nome = req.nome.toLowerCase();
    
    // Extrai o nome da operadora da string (sempre o que vem antes do primeiro "-")
    const parts = nome.split('-');
    if (parts.length < 2) continue;
    
    const reqOp = parts[0].trim();
    
    // Verifica se a operadora bate
    if (op.includes(reqOp) || reqOp.includes(op)) {
      // Pega os dias da última parte
      const daysStr = parts[parts.length - 1];
      const match = daysStr.match(/(\d+)/);
      if (!match) continue;
      
      const days = parseInt(match[1], 10);
      let score = 0;
      
      // Se houver uma regra no meio (ex: "operadora - regra - dias") ou se parte do nome contém a regra
      let ruleStr = "";
      if (parts.length >= 3) {
        ruleStr = parts[1].trim();
      } else {
        // Se a regra estiver junto com o nome (o que é improvável dado a forma que salvamos, mas previne falhas)
        ruleStr = reqOp; 
      }

      const hasPJ = ruleStr.includes('pj') || ruleStr.includes('empresarial');
      const hasPF = ruleStr.includes('pf') || ruleStr.includes('adesão') || ruleStr.includes('adesao') || ruleStr.includes('individual');
      
      const isPropPJ = cat.includes('pj') || tipo.includes('empresarial') || cat.includes('empresarial');
      const isPropPF = !isPropPJ;

      if (hasPJ && isPropPJ) {
        score = 2; // Match específico
      } else if (hasPF && isPropPF) {
        score = 2;
      } else if (!hasPJ && !hasPF) {
        score = 1; // Match geral (só operadora sem regra específica)
      } else {
        score = 0; // Miss match
      }

      if (score > currentMatchScore) {
        currentMatchScore = score;
        bestMatchDays = days;
      }
    }
  }

  // Falback para as regras hard-coded caso não haja regras na tabela para essa operadora
  if (currentMatchScore === -1) {
    if (op.includes('hapvida')) {
      return 1;
    }
    if (op.includes('servdonto')) {
      if (cat.includes('pj') || tipo.includes('empresarial')) return 2;
      return 1;
    }
    if (op.includes('sulamerica') || op.includes('sulamérica')) {
      if (cat.includes('pj') || tipo.includes('empresarial') || cat.includes('empresarial')) return 10;
      return 1;
    }
    if (op.includes('bradesco') || op.includes('unimed') || op.includes('odontoprev')) {
      return 10;
    }
    if (op.includes('amil') || op.includes('select') || op.includes('plamed')) {
      return 8;
    }
    if (op.includes('odonto s/a') || op.includes('odonto sa')) {
      return 15;
    }
    if (op.includes('blue')) {
      return 1;
    }
  }
  
  return bestMatchDays;
}

const SellerBoard: React.FC<SellerBoardProps> = ({ proposals, requirements, onStatusChange }) => {
  const columns = [
    { id: 'CADASTRADA', title: 'Cadastradas' },
    { id: 'ENVIADA AO FINANCEIRO', title: 'Enviadas ao Financeiro (Aguardando Pagamento)' },
    { id: 'PAGO', title: 'Pagas' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Acompanhamento e SLA</h2>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Acompanhe o andamento e o prazo de pagamento das suas propostas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {columns.map(col => (
          <div key={col.id} className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex flex-col h-[700px]">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4 flex items-center justify-between">
              {col.title}
              <span className="bg-slate-200 text-slate-600 px-2 py-1 rounded-lg text-[10px]">
                {proposals.filter(p => p.status === col.id).length}
              </span>
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
              {proposals.filter(p => p.status === col.id).map(p => {
                const isEnviada = p.status === 'ENVIADA AO FINANCEIRO';
                let dataEnvio: Date | null = null;
                let diasSLA = 0;
                let vencimentoStr = '';
                let bgColor = 'bg-white';
                let alertText = '';
                
                if (isEnviada || p.status === 'PAGO') {
                  // Acha a data de envio na historia se houver, se nao usa a data da proposta (fallback)
                  const hist = p.detalhes?.historico?.find((h: any) => h.status === 'ENVIADA AO FINANCEIRO');
                  dataEnvio = hist ? new Date(hist.data) : new Date(p.data);
                  diasSLA = getDiasParaPagamento(p.operadora, p.detalhes?.proposta?.tipoPlano || '', p.categoria, requirements);
                  
                  const dataVencimento = new Date(dataEnvio);
                  dataVencimento.setDate(dataVencimento.getDate() + diasSLA);
                  vencimentoStr = dataVencimento.toLocaleDateString('pt-BR');
                  
                  if (isEnviada) {
                    const hoje = new Date();
                    const diffTime = dataVencimento.getTime() - hoje.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays < 0) {
                      bgColor = 'bg-red-50 border-red-200';
                      alertText = 'Atrasado';
                    } else if (diffDays <= 2) {
                      bgColor = 'bg-amber-50 border-amber-200';
                      alertText = 'Vence em breve';
                    } else {
                      bgColor = 'bg-emerald-50 border-emerald-100';
                      alertText = 'No prazo';
                    }
                  }
                }

                return (
                  <div key={p.id} className={`${bgColor} p-4 rounded-2xl shadow-sm border border-slate-100 transition-all cursor-default`}> 
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {p.operadora} - {p.categoria}
                      </span>
                      {alertText && (
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                          alertText === 'Atrasado' ? 'bg-red-100 text-red-700' : 
                          alertText === 'Vence em breve' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {alertText}
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-slate-800 text-sm mb-1">{p.cliente}</div>
                    <div className="text-xs text-slate-500 mb-3">CPF/CNPJ: {p.cpfCnpj}</div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                        Vidas: {p.vidas}
                      </span>
                      <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">
                        R$ {Number(p.valor).toFixed(2)}
                      </span>
                    </div>

                    {isEnviada && (
                      <div className="mt-3 pt-3 border-t border-slate-100/50 flex flex-col gap-1">
                        <div className="text-[10px] flex justify-between text-slate-500">
                          <span className="font-bold">Prazo (SLA):</span>
                          <span>{diasSLA} {diasSLA === 1 ? 'dia' : 'dias'}</span>
                        </div>
                        <div className="text-[10px] flex justify-between text-slate-500">
                          <span className="font-bold">Data Prevista:</span>
                          <span className={`${alertText === 'Atrasado' ? 'text-red-600 font-bold' : ''}`}>{vencimentoStr}</span>
                        </div>
                      </div>
                    )}
                    
                    {p.status === 'PAGO' && (
                      <div className="mt-3 pt-3 border-t border-slate-100/50 flex flex-col gap-1">
                        <div className="text-[10px] flex justify-between text-emerald-600 font-bold uppercase">
                          <i className="fa-solid fa-check-circle mr-1"></i> Pagamento Realizado
                        </div>
                      </div>
                    )}

                    {p.status === 'CADASTRADA' && (
                      <button
                        onClick={() => onStatusChange(p.id, 'ENVIADA AO FINANCEIRO')}
                        className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black py-2 rounded-xl uppercase tracking-widest transition-all"
                      >
                        Enviar Financeiro <i className="fa-solid fa-arrow-right ml-1"></i>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SellerBoard;
