// components/rh/RhFolhaPagamento.tsx
import React, { useState, useMemo } from 'react';
import { RhFolhaPagamento as FolhaType, RhFuncionario, RhAdiantamento, Transaction } from '../../types';
import { calcularFolhaFuncionario } from '../../lib/calculoFolha';
import { dispararNotificacaoWhatsapp } from '../../lib/rhWhatsapp';
import { RhHoleriteModal } from './RhHoleriteModal';

interface RhFolhaPagamentoProps {
  folhas: FolhaType[];
  funcionarios: RhFuncionario[];
  adiantamentos: RhAdiantamento[];
  onSalvarFolha: (folhasAtualizadas: FolhaType[]) => void;
  onFecharFolha: (competencia: string, totalLiquido: number, qtdFuncionarios: number) => void;
  onLancarAdiantamento: (adiantamento: RhAdiantamento) => void;
}

export const RhFolhaPagamento: React.FC<RhFolhaPagamentoProps> = ({
  folhas,
  funcionarios,
  adiantamentos,
  onSalvarFolha,
  onFecharFolha,
  onLancarAdiantamento
}) => {
  // Competência padrão (mês corrente YYYY-MM-01)
  const [competencia, setCompetencia] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });

  const [selectedHolerite, setSelectedHolerite] = useState<{ folha: FolhaType; func?: RhFuncionario } | null>(null);
  
  // Modal de Lançamento de Adiantamento
  const [isAdiantamentoModalOpen, setIsAdiantamentoModalOpen] = useState(false);
  const [adFuncId, setAdFuncId] = useState(funcionarios[0]?.id || '');
  const [adValor, setAdValor] = useState(1000);
  const [adData, setAdData] = useState(new Date().toISOString().split('T')[0]);

  // Funcionários CLT Ativos
  const funcionariosAtivos = useMemo(() => {
    return funcionarios.filter(f => f.status === 'ATIVO');
  }, [funcionarios]);

  // Folhas da competência selecionada
  const folhasDaCompetencia = useMemo(() => {
    const existentes = folhas.filter(f => f.competencia === competencia);
    
    // Se não existirem folhas calculadas para algum funcionário ativo, pré-calcula dinamicamente
    return funcionariosAtivos.map(func => {
      const encontrada = existentes.find(e => e.funcionario_id === func.id);
      if (encontrada) return encontrada;

      // Calcular adiantamentos do funcionário nesta competência
      const adiantamentosDoMes = adiantamentos
        .filter(a => a.funcionario_id === func.id && a.competencia === competencia)
        .reduce((acc, a) => acc + a.valor, 0);

      const calculo = calcularFolhaFuncionario({
        salarioBase: func.salario,
        horasExtras: 0,
        tercoFerias: 0,
        descontoFaltasAtrasos: 0,
        descontoValeTransporte: 0,
        descontoAdiantamento: adiantamentosDoMes
      });

      const novaFolha: FolhaType = {
        id: crypto.randomUUID(),
        funcionario_id: func.id,
        funcionario_nome: func.nome_completo,
        funcionario_cargo: func.cargo,
        funcionario_cpf: func.cpf,
        competencia: competencia,
        salario_base: calculo.salarioBase,
        valor_horas_extras: calculo.valorHorasExtras,
        terco_ferias: calculo.tercoFerias,
        desconto_faltas_atrasos: calculo.descontoFaltasAtrasos,
        desconto_vale_transporte: calculo.descontoValeTransporte,
        desconto_inss: calculo.descontoInss,
        desconto_adiantamento: calculo.descontoAdiantamento,
        valor_liquido: calculo.valorLiquido,
        fgts_depositado: calculo.fgtsDepositado,
        status: 'CALCULADA'
      };

      return novaFolha;
    });
  }, [folhas, competencia, funcionariosAtivos, adiantamentos]);

  // Totais da Competência
  const totais = useMemo(() => {
    return folhasDaCompetencia.reduce((acc, f) => ({
      salarioBase: acc.salarioBase + f.salario_base,
      horasExtras: acc.horasExtras + f.valor_horas_extras,
      tercoFerias: acc.tercoFerias + f.terco_ferias,
      inss: acc.inss + f.desconto_inss,
      adiantamentos: acc.adiantamentos + f.desconto_adiantamento,
      outrosDescontos: acc.outrosDescontos + f.desconto_faltas_atrasos + f.desconto_vale_transporte,
      liquido: acc.liquido + f.valor_liquido,
      fgts: acc.fgts + f.fgts_depositado
    }), {
      salarioBase: 0,
      horasExtras: 0,
      tercoFerias: 0,
      inss: 0,
      adiantamentos: 0,
      outrosDescontos: 0,
      liquido: 0,
      fgts: 0
    });
  }, [folhasDaCompetencia]);

  const folhaJaFechada = folhasDaCompetencia.length > 0 && folhasDaCompetencia.every(f => f.status === 'FECHADA');

  // Atualizar campo avulso de uma linha da folha (ex: horas extras, faltas)
  const handleUpdateItem = (funcionarioId: string, campo: string, valorNum: number) => {
    const atualizadas = folhasDaCompetencia.map(f => {
      if (f.funcionario_id !== funcionarioId) return f;

      const params = {
        salarioBase: f.salario_base,
        horasExtras: campo === 'horasExtras' ? valorNum : f.valor_horas_extras,
        tercoFerias: campo === 'tercoFerias' ? valorNum : f.terco_ferias,
        descontoFaltasAtrasos: campo === 'descontoFaltas' ? valorNum : f.desconto_faltas_atrasos,
        descontoValeTransporte: campo === 'descontoVt' ? valorNum : f.desconto_vale_transporte,
        descontoAdiantamento: campo === 'descontoAdiantamento' ? valorNum : f.desconto_adiantamento
      };

      const res = calcularFolhaFuncionario(params);

      return {
        ...f,
        valor_horas_extras: res.valorHorasExtras,
        terco_ferias: res.tercoFerias,
        desconto_faltas_atrasos: res.descontoFaltasAtrasos,
        desconto_vale_transporte: res.descontoValeTransporte,
        desconto_inss: res.descontoInss,
        desconto_adiantamento: res.descontoAdiantamento,
        valor_liquido: res.valorLiquido,
        fgts_depositado: res.fgtsDepositado
      };
    });

    onSalvarFolha(atualizadas);
  };

  // Recalcular Toda a Folha
  const handleRecalcularTudo = () => {
    const recalculadas = funcionariosAtivos.map(func => {
      const adiantamentosDoMes = adiantamentos
        .filter(a => a.funcionario_id === func.id && a.competencia === competencia)
        .reduce((acc, a) => acc + a.valor, 0);

      const calculo = calcularFolhaFuncionario({
        salarioBase: func.salario,
        horasExtras: 0,
        tercoFerias: 0,
        descontoFaltasAtrasos: 0,
        descontoValeTransporte: 0,
        descontoAdiantamento: adiantamentosDoMes
      });

      return {
        id: crypto.randomUUID(),
        funcionario_id: func.id,
        funcionario_nome: func.nome_completo,
        funcionario_cargo: func.cargo,
        funcionario_cpf: func.cpf,
        competencia: competencia,
        salario_base: calculo.salarioBase,
        valor_horas_extras: calculo.valorHorasExtras,
        terco_ferias: calculo.tercoFerias,
        desconto_faltas_atrasos: calculo.descontoFaltasAtrasos,
        desconto_vale_transporte: calculo.descontoValeTransporte,
        desconto_inss: calculo.descontoInss,
        desconto_adiantamento: calculo.descontoAdiantamento,
        valor_liquido: calculo.valorLiquido,
        fgts_depositado: calculo.fgtsDepositado,
        status: 'CALCULADA' as const
      };
    });

    onSalvarFolha(recalculadas);
  };

  // Fechar Folha
  const handleExecutarFechamento = () => {
    if (folhaJaFechada) {
      alert('A folha desta competência já foi fechada.');
      return;
    }

    if (confirm(`Deseja fechar a Folha de Pagamento da competência ${competencia}? \n\nIsso gerará automaticamente uma conta a pagar no valor total líquido de R$ ${totais.liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para os ${folhasDaCompetencia.length} colaboradores.`)) {
      onFecharFolha(competencia, totais.liquido, folhasDaCompetencia.length);
    }
  };

  // Lançar Adiantamento
  const handleSalvarAdiantamento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adFuncId || adValor <= 0) {
      alert('Preencha o funcionário e um valor válido de adiantamento.');
      return;
    }

    const func = funcionarios.find(f => f.id === adFuncId);

    const novoAd: RhAdiantamento = {
      id: crypto.randomUUID(),
      funcionario_id: adFuncId,
      funcionario_nome: func?.nome_completo,
      competencia: competencia,
      valor: Number(adValor),
      data_lancamento: adData,
      criado_por: 'Admin'
    };

    onLancarAdiantamento(novoAd);
    setIsAdiantamentoModalOpen(false);
  };

  const competenciaDate = new Date(competencia + 'T00:00:00');
  const mesFormatado = competenciaDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER E CONTROLES DA COMPETÊNCIA */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#001a54] text-2xl">payments</span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Folha de Pagamento Mensal</h2>
            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
              folhaJaFechada ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'
            }`}>
              {folhaJaFechada ? 'Folha Fechada' : 'Folha Aberta'}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Cálculo progressivo de INSS, FGTS (8% informativo), proventos, horas extras, descontos e geração de contas a pagar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Seletor de Competência */}
          <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl gap-2 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 pl-2 uppercase">Mês:</span>
            <input
              type="month"
              value={competencia.substring(0, 7)}
              onChange={e => setCompetencia(`${e.target.value}-01`)}
              className="bg-white px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
            />
          </div>

          <button
            onClick={() => setIsAdiantamentoModalOpen(true)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200"
          >
            <span className="material-symbols-outlined text-base">price_change</span>
            <span>Lançar Adiantamento</span>
          </button>

          <button
            onClick={handleRecalcularTudo}
            className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-blue-200"
            title="Recalcular parâmetros e adiantamentos"
          >
            <span className="material-symbols-outlined text-base">sync</span>
            <span>Recalcular</span>
          </button>

          <button
            onClick={handleExecutarFechamento}
            disabled={folhaJaFechada}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md cursor-pointer ${
              folhaJaFechada 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
            }`}
          >
            <span className="material-symbols-outlined text-base">lock</span>
            <span>{folhaJaFechada ? 'Folha Já Fechada' : 'Fechar Folha'}</span>
          </button>
        </div>
      </div>

      {/* DASHBOARD DE TOTAIS DA FOLHA */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Total Proventos Brutos */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Salários Base</span>
          <span className="text-xl font-black text-slate-900 mt-1 block">
            R$ {totais.salarioBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">+ R$ {totais.horasExtras.toFixed(2)} extras/férias</span>
        </div>

        {/* Descontos INSS */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider block">Desconto INSS (Colaborador)</span>
          <span className="text-xl font-black text-rose-600 mt-1 block">
            - R$ {totais.inss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">Tabela progressiva oficial</span>
        </div>

        {/* FGTS Empresa */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider block">FGTS a Recolher (Empresa 8%)</span>
          <span className="text-xl font-black text-blue-700 mt-1 block">
            R$ {totais.fgts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">Encargo patronal da corretora</span>
        </div>

        {/* Total Líquido a Pagar */}
        <div className="bg-gradient-to-br from-[#001a54] to-[#1d3b7a] rounded-3xl p-5 text-white shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-200">TOTAL LÍQUIDO A PAGAR</span>
            <button
              onClick={() => dispararNotificacaoWhatsapp({
                evento: 'FOLHA_PRONTA',
                titulo: 'Folha Pronta',
                dados: {
                  competencia: mesFormatado,
                  qtdFuncionarios: folhasDaCompetencia.length,
                  valorLiquido: totais.liquido,
                  fgts: totais.fgts
                }
              })}
              className="text-white/80 hover:text-emerald-400 p-1 transition-colors"
              title="Avisar gestores no WhatsApp"
            >
              <i className="fa-brands fa-whatsapp text-lg"></i>
            </button>
          </div>
          <span className="text-2xl font-black text-white mt-1 block">
            R$ {totais.liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-blue-200/80 font-medium">{folhasDaCompetencia.length} colaboradores</span>
        </div>

      </div>

      {/* TABELA DETALHADA DA FOLHA */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
            Discriminação por Funcionário • {mesFormatado}
          </h3>
          <span className="text-xs text-slate-500 font-medium">Edite horas extras ou faltas diretamente na tabela</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">FUNCIONÁRIO</th>
                <th className="py-3 px-3 text-right">SAL. BASE</th>
                <th className="py-3 px-3 text-right">H. EXTRAS (R$)</th>
                <th className="py-3 px-3 text-right">INSS (DESC.)</th>
                <th className="py-3 px-3 text-right">ADIANTAMENTO</th>
                <th className="py-3 px-3 text-right">OUTROS DESC.</th>
                <th className="py-3 px-4 text-right font-black text-emerald-800">LÍQUIDO A PAGAR</th>
                <th className="py-3 px-3 text-right text-blue-700">FGTS 8%</th>
                <th className="py-3 px-4 text-center">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {folhasDaCompetencia.length > 0 ? (
                folhasDaCompetencia.map(folha => {
                  const func = funcionarios.find(f => f.id === folha.funcionario_id);

                  return (
                    <tr key={folha.funcionario_id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Nome e Cargo */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{folha.funcionario_nome || func?.nome_completo}</span>
                        <span className="text-[11px] text-slate-400 font-medium">{folha.funcionario_cargo || func?.cargo}</span>
                      </td>

                      {/* Salário Base */}
                      <td className="py-3.5 px-3 text-right font-semibold text-slate-800">
                        R$ {folha.salario_base.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Horas Extras (Editável) */}
                      <td className="py-3.5 px-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          disabled={folhaJaFechada}
                          value={folha.valor_horas_extras || ''}
                          placeholder="0,00"
                          onChange={e => handleUpdateItem(folha.funcionario_id, 'horasExtras', Number(e.target.value))}
                          className="w-20 p-1 text-right bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500"
                        />
                      </td>

                      {/* INSS Desconto */}
                      <td className="py-3.5 px-3 text-right font-bold text-rose-600">
                        - R$ {folha.desconto_inss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Adiantamento Desconto */}
                      <td className="py-3.5 px-3 text-right font-medium text-slate-600">
                        {folha.desconto_adiantamento > 0 ? `- R$ ${folha.desconto_adiantamento.toFixed(2)}` : '-'}
                      </td>

                      {/* Outros Descontos (Faltas/VT) */}
                      <td className="py-3.5 px-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          disabled={folhaJaFechada}
                          value={folha.desconto_faltas_atrasos || ''}
                          placeholder="0,00"
                          onChange={e => handleUpdateItem(folha.funcionario_id, 'descontoFaltas', Number(e.target.value))}
                          className="w-20 p-1 text-right bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500"
                        />
                      </td>

                      {/* Total Líquido */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-black text-sm text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 inline-block">
                          R$ {folha.valor_liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* FGTS 8% */}
                      <td className="py-3.5 px-3 text-right font-bold text-blue-700">
                        R$ {folha.fgts_depositado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedHolerite({ folha, func })}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-[#001a54] hover:text-white text-slate-700 rounded-xl text-[11px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                          title="Visualizar e Imprimir Holerite"
                        >
                          <span className="material-symbols-outlined text-xs">receipt_long</span>
                          <span>Holerite</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl block mb-2">person_off</span>
                    <p className="font-semibold text-xs">Nenhum funcionário CLT ativo encontrado para esta competência.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE LANÇAMENTO DE ADIANTAMENTO */}
      {isAdiantamentoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">price_change</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Lançar Adiantamento Salarial</h3>
                  <p className="text-xs text-slate-500 font-medium">Competência {mesFormatado}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAdiantamentoModalOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all"
              >
                <i className="fa-solid fa-xmark text-base"></i>
              </button>
            </div>

            <form onSubmit={handleSalvarAdiantamento} className="p-6 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Colaborador *</label>
                <select
                  value={adFuncId}
                  onChange={e => setAdFuncId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  {funcionariosAtivos.map(f => (
                    <option key={f.id} value={f.id}>{f.nome_completo} ({f.cargo} - Salário R$ {f.salario})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Valor do Adiantamento (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={adValor}
                  onChange={e => setAdValor(Number(e.target.value))}
                  placeholder="Ex: 1000.00"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#001a54] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Data do Pagamento do Adiantamento</label>
                <input
                  type="date"
                  value={adData}
                  onChange={e => setAdData(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAdiantamentoModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#001a54] hover:bg-[#001138] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-[#001a54]/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">check</span>
                  <span>Confirmar e Lançar</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL DE HOLERITE */}
      {selectedHolerite && (
        <RhHoleriteModal
          isOpen={!!selectedHolerite}
          onClose={() => setSelectedHolerite(null)}
          folha={selectedHolerite.folha}
          funcionario={selectedHolerite.func}
        />
      )}

    </div>
  );
};
