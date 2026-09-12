// components/rh/RhInicio.tsx
import React from 'react';
import { RhFuncionario, RhEstagiario, RhDemanda, RhFolhaPagamento, RhFerias, RhVaga } from '../../types';
import { dispararNotificacaoWhatsapp } from '../../lib/rhWhatsapp';

interface RhInicioProps {
  funcionarios: RhFuncionario[];
  estagiarios: RhEstagiario[];
  demandas: RhDemanda[];
  folhas: RhFolhaPagamento[];
  ferias: RhFerias[];
  vagas: RhVaga[];
  onNavigateTab: (tabKey: string) => void;
  onOpenSqlModal: () => void;
}

export const RhInicio: React.FC<RhInicioProps> = ({
  funcionarios,
  estagiarios,
  demandas,
  folhas,
  ferias,
  vagas,
  onNavigateTab,
  onOpenSqlModal
}) => {
  const funcionariosAtivos = funcionarios.filter(f => f.status === 'ATIVO');
  const estagiariosAtivos = estagiarios.filter(e => e.status === 'ATIVO');
  const demandasPendentes = demandas.filter(d => d.status === 'PENDENTE');
  const vagasAbertas = vagas.filter(v => v.status === 'ABERTA' || v.status === 'EM_PROCESSO');

  // Admissões em andamento (demandas do tipo EXAME_ADMISSIONAL, CONTRATO, DOCUMENTACAO)
  const admissoesDemandas = demandasPendentes.filter(d => 
    d.tipo === 'EXAME_ADMISSIONAL' || d.tipo === 'CONTRATO' || d.tipo === 'DOCUMENTACAO'
  );

  // Mês atual
  const agora = new Date();
  const competenciaAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-01`;
  const mesFormatado = agora.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  
  const folhasDoMes = folhas.filter(f => f.competencia === competenciaAtual);
  const folhaFechada = folhasDoMes.length > 0 && folhasDoMes.every(f => f.status === 'FECHADA');
  const totalFolhaMes = folhasDoMes.reduce((acc, f) => acc + f.valor_liquido, 0);

  // Alertas "Não Deixa Passar"
  const feriasAVencer = ferias.filter(f => f.status === 'A_VENCER');
  
  // Estagiários com término nos próximos 60 dias
  const estagiariosProximosFim = estagiariosAtivos.filter(e => {
    if (!e.previsao_termino) return false;
    const dt = new Date(e.previsao_termino + 'T00:00:00');
    const diffDias = (dt.getTime() - agora.getTime()) / (1000 * 3600 * 24);
    return diffDias >= 0 && diffDias <= 60;
  });

  // Alerta de 13º salário (ativo especialmente entre outubro e dezembro)
  const isEpocaDecimo = agora.getMonth() >= 9; // Out, Nov, Dez

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* BANNER PRINCIPAL / BOAS-VINDAS */}
      <div className="bg-gradient-to-r from-[#001a54] to-[#1d3b7a] rounded-3xl p-6 md:p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold tracking-wider uppercase backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Módulo de Recursos Humanos</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Painel de Gestão de RH</h1>
          <p className="text-blue-100/80 text-xs md:text-sm max-w-xl font-medium">
            Gestão de colaboradores CLT, contratos de estágio, admissões, demandas trabalhistas e fechamento integrado da folha de pagamento.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigateTab('folha')}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">payments</span>
            <span>Folha de {mesFormatado}</span>
          </button>
        </div>
      </div>

      {/* 3 CONTADORES / CARDS DE DESTAQUE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: Funcionários Ativos */}
        <div 
          onClick={() => onNavigateTab('funcionarios')}
          className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Colaboradores CLT</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">badge</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{funcionariosAtivos.length}</span>
            <span className="text-xs font-bold text-slate-500">ativos</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-2 flex items-center gap-1">
            <span>+ {estagiariosAtivos.length} estagiário(s) em contrato ativo</span>
          </p>
        </div>

        {/* Card 2: Admissões em Andamento */}
        <div 
          onClick={() => onNavigateTab('demandas')}
          className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Admissões em Curso</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">person_add</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{admissoesDemandas.length}</span>
            <span className="text-xs font-bold text-amber-700">etapas pendentes</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-2 truncate">
            {admissoesDemandas.length > 0 ? 'Exames, contratos e documentos pendentes' : 'Nenhuma admissão pendente no momento'}
          </p>
        </div>

        {/* Card 3: Demandas de RH Pendentes */}
        <div 
          onClick={() => onNavigateTab('demandas')}
          className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-rose-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Demandas de RH</span>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">checklist</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{demandasPendentes.length}</span>
            <span className="text-xs font-bold text-rose-600">para resolver</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-2 flex items-center gap-1">
            <span>{vagasAbertas.length} vaga(s) aberta(s) em processo seletivo</span>
          </p>
        </div>

      </div>

      {/* BLOCO "NÃO DEIXA PASSAR" & ADMISSÕES EM ANDAMENTO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* BLOCO "NÃO DEIXA PASSAR" (7 COLUNAS) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">notification_important</span>
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Não Deixa Passar</h3>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Prazos e Alertas Críticos</span>
          </div>

          <div className="space-y-3">
            
            {/* 1. Alerta de Férias a Vencer */}
            {feriasAVencer.length > 0 ? (
              feriasAVencer.slice(0, 2).map(f => (
                <div key={f.id} className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-amber-600 text-xl">event_upcoming</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Férias a Vencer: {f.funcionario_nome}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">Período limite: {f.periodo_aquisitivo_fim}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => dispararNotificacaoWhatsapp({
                      evento: 'FERIAS_VENCENDO',
                      titulo: 'Alerta de Férias',
                      dados: {
                        nome: f.funcionario_nome || 'Colaborador',
                        periodo: `${f.periodo_aquisitivo_inicio} a ${f.periodo_aquisitivo_fim}`,
                        terco: f.terco_constitucional || 0
                      }
                    })}
                    className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-xs flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                    title="Notificar Gestores no WhatsApp"
                  >
                    <i className="fa-brands fa-whatsapp text-sm"></i>
                    <span className="hidden sm:inline">Avisar</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3 text-xs text-slate-500 font-medium">
                <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
                <span>Nenhum colaborador com férias em limite crítico de vencimento.</span>
              </div>
            )}

            {/* 2. Alerta de Fim de Estágio Próximo */}
            {estagiariosProximosFim.length > 0 && (
              estagiariosProximosFim.map(est => (
                <div key={est.id} className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-blue-600 text-xl">school</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Término de Contrato de Estágio: {est.nome_completo}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">Previsão: {est.previsao_termino ? new Date(est.previsao_termino + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => dispararNotificacaoWhatsapp({
                      evento: 'FIM_ESTAGIO',
                      titulo: 'Término de Estágio',
                      dados: {
                        nome: est.nome_completo,
                        instituicao: est.instituicao_ensino || 'Instituição',
                        termino: est.previsao_termino ? new Date(est.previsao_termino + 'T00:00:00').toLocaleDateString('pt-BR') : '-',
                        supervisor: est.supervisor || 'Gestão de RH'
                      }
                    })}
                    className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-xs flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                    title="Notificar Gestores no WhatsApp"
                  >
                    <i className="fa-brands fa-whatsapp text-sm"></i>
                    <span className="hidden sm:inline">Avisar</span>
                  </button>
                </div>
              ))
            )}

            {/* 3. Indicador de 13º Salário */}
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
              isEpocaDecimo ? 'bg-indigo-50/70 border-indigo-200/80' : 'bg-slate-50 border-slate-200/70'
            }`}>
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined text-xl ${isEpocaDecimo ? 'text-indigo-600' : 'text-slate-400'}`}>
                  savings
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {isEpocaDecimo ? 'Período Oficial de 13º Salário Ativo' : 'Planejamento de 13º Salário'}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    1ª parcela até 30 de novembro • 2ª parcela até 20 de dezembro
                  </p>
                </div>
              </div>
              <button
                onClick={() => dispararNotificacaoWhatsapp({
                  evento: 'EPOCA_DECIMO',
                  titulo: '13º Salário',
                  dados: {
                    competencia: mesFormatado,
                    totalAtivos: funcionariosAtivos.length,
                    totalEstimado: funcionariosAtivos.reduce((acc, f) => acc + (f.salario / 2), 0)
                  }
                })}
                className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition-all text-[11px] font-bold cursor-pointer flex items-center gap-1"
              >
                <i className="fa-brands fa-whatsapp text-sm text-emerald-600"></i>
                <span className="hidden sm:inline">Notificar</span>
              </button>
            </div>

          </div>
        </div>

        {/* ADMISSÕES EM ANDAMENTO / CHECKLIST (5 COLUNAS) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">hourglass_top</span>
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Admissões em Curso</h3>
              </div>
              <button 
                onClick={() => onNavigateTab('demandas')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                Ver todas
              </button>
            </div>

            <div className="space-y-2.5 mt-3">
              {admissoesDemandas.length > 0 ? (
                admissoesDemandas.slice(0, 4).map(d => (
                  <div key={d.id} className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          d.tipo === 'EXAME_ADMISSIONAL' ? 'bg-amber-100 text-amber-800' :
                          d.tipo === 'CONTRATO' ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {d.tipo.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-bold text-slate-800 truncate">{d.funcionario_nome || 'Colaborador'}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-1 truncate">{d.descricao || 'Pendente de validação'}</p>
                    </div>

                    <button
                      onClick={() => dispararNotificacaoWhatsapp({
                        evento: 'DOCUMENTACAO_PENDENTE',
                        titulo: 'Admissão Pendente',
                        dados: {
                          nome: d.funcionario_nome || 'Novo Colaborador',
                          etapa: d.tipo.replace('_', ' '),
                          dataPrevista: d.data_prevista || 'Imediato',
                          cargo: 'Colaborador CLT'
                        }
                      })}
                      className="text-slate-400 hover:text-emerald-600 p-1.5 transition-colors cursor-pointer"
                      title="Enviar lembrete no WhatsApp"
                    >
                      <i className="fa-brands fa-whatsapp text-base"></i>
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 space-y-2">
                  <span className="material-symbols-outlined text-3xl">task_alt</span>
                  <p className="text-xs font-semibold">Todas as etapas de admissão estão em dia!</p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('funcionarios')}
            className="w-full mt-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            <span>Cadastrar Novo Funcionário</span>
          </button>
        </div>

      </div>

      {/* ATALHO GRANDE NO RODAPÉ: FOLHA DE PAGAMENTO DO MÊS */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-2xl shrink-0">
            <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Folha de Pagamento • {mesFormatado}</h3>
              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                folhaFechada ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {folhaFechada ? 'Fechada & Paga' : 'Em Aberto / Calculada'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Total Líquido Estimado da Competência: <strong className="text-slate-900 font-black">R$ {totalFolhaMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> • {funcionariosAtivos.length} colaboradores CLT ativos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => onNavigateTab('folha')}
            className="w-full md:w-auto px-6 py-3 bg-[#001a54] hover:bg-[#001138] text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-[#001a54]/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">arrow_forward</span>
            <span>Acessar Folha do Mês</span>
          </button>
        </div>
      </div>

    </div>
  );
};
