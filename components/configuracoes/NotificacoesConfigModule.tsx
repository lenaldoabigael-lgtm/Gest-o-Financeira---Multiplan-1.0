// components/configuracoes/NotificacoesConfigModule.tsx
import React, { useState, useEffect } from 'react';
import { User, RhNotificationSettings, NotificationLog } from '../../types';
import { 
  getRhNotificationSettings, 
  saveRhNotificationSettings, 
  DEFAULT_RH_NOTIFICATION_SETTINGS,
  getNotificationLogs,
  dispararNotificacaoWhatsapp,
  gerarTextoNotificacaoWhatsapp,
  formatarTelefoneVisual,
  normalizarNumeroParaWhatsapp,
  limparLogsNotificacao,
  RhEventoWhatsapp
} from '../../lib/rhWhatsapp';

interface NotificacoesConfigModuleProps {
  user: User;
}

export const NotificacoesConfigModule: React.FC<NotificacoesConfigModuleProps> = ({ user }) => {
  const [settings, setSettings] = useState<RhNotificationSettings>(DEFAULT_RH_NOTIFICATION_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Test State
  const [testTipo, setTestTipo] = useState<RhEventoWhatsapp>('TESTE_INTEGRACAO');
  const [testTelefone, setTestTelefone] = useState('');
  const [testDestinatario, setTestDestinatario] = useState('');
  const [testCustom, setTestCustom] = useState(false);
  const [testSuccessMessage, setTestSuccessMessage] = useState<string | null>(null);
  
  // Logs
  const [logs, setLogs] = useState<NotificationLog[]>([]);

  useEffect(() => {
    const loaded = getRhNotificationSettings();
    setSettings(loaded);
    setTestTelefone(loaded.whatsappPadrao);
    setTestDestinatario(loaded.nomeResponsavel);
    setLogs(getNotificationLogs());
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveRhNotificationSettings(settings, user.login);
      setSaveSuccess(true);
      setTestTelefone(settings.whatsappPadrao);
      setTestDestinatario(settings.nomeResponsavel);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  // Monta os dados de exemplo para o preview
  const getPreviewDados = (evento: RhEventoWhatsapp) => {
    switch (evento) {
      case 'TESTE_INTEGRACAO':
        return {
          telefone: formatarTelefoneVisual(testCustom ? testTelefone : settings.whatsappPadrao),
        };
      case 'FOLHA_PRONTA':
        return {
          competencia: 'Fevereiro/2026',
          qtdFuncionarios: 14,
          valorLiquido: 48950.00,
          fgts: 3916.00
        };
      case 'FIM_ESTAGIO':
        return {
          nome: 'Lucas Gabriel Silveira',
          instituicao: 'Universidade de Fortaleza (UNIFOR)',
          termino: '31/03/2026',
          supervisor: 'Diretoria Comercial'
        };
      case 'FERIAS_VENCENDO':
        return {
          nome: 'Mariana Rodrigues Costa',
          periodo: '01/04/2025 a 31/03/2026',
          status: 'Limite Crítico (30 dias)',
          terco: 1150.00
        };
      case 'DOCUMENTACAO_PENDENTE':
        return {
          nome: 'Rafael Albuquerque',
          etapa: 'ASO Admissional & Coleta de CTPS Digital',
          dataPrevista: '20/02/2026',
          cargo: 'Analista de Benefícios Pleno'
        };
      case 'EPOCA_DECIMO':
        return {
          parcela: '1ª Parcela (Adiantamento)',
          competencia: 'Novembro/2026',
          totalAtivos: 18,
          totalEstimado: 32400.00
        };
      case 'RESCISAO_CALCULADA':
        return {
          nome: 'Carla Vasconcelos',
          tipo: 'Sem Justa Causa',
          data: '15/02/2026',
          valor: 7850.40
        };
      default:
        return {};
    }
  };

  const previewTexto = gerarTextoNotificacaoWhatsapp({
    evento: testTipo,
    titulo: 'Simulação',
    destinatarioNome: testCustom ? (testDestinatario || 'Gestor') : settings.nomeResponsavel,
    telefone: testCustom ? testTelefone : settings.whatsappPadrao,
    dados: getPreviewDados(testTipo)
  });

  const handleDispararTeste = () => {
    const destino = testCustom ? testTelefone : settings.whatsappPadrao;
    if (!destino || destino.replace(/\D/g, '').length < 10) {
      alert('Por favor, informe um número de telefone com DDD válido para o teste.');
      return;
    }

    const { numeroFormatado } = dispararNotificacaoWhatsapp({
      evento: testTipo,
      titulo: 'Teste de Integração',
      destinatarioNome: testCustom ? (testDestinatario || 'Gestor') : settings.nomeResponsavel,
      telefone: destino,
      dados: getPreviewDados(testTipo)
    }, destino);

    setLogs(getNotificationLogs());
    setTestSuccessMessage(`Mensagem gerada para +${numeroFormatado}! Verifique a janela do WhatsApp.`);
    setTimeout(() => setTestSuccessMessage(null), 5000);
  };

  const handleLimparLogs = () => {
    if (confirm('Deseja limpar todo o histórico de logs de notificações?')) {
      limparLogsNotificacao();
      setLogs([]);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* CABEÇALHO DO MÓDULO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs border border-emerald-100/80">
            <span className="material-symbols-outlined text-3xl">chat</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Configurações de Notificações
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                WhatsApp Live
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Defina os números de WhatsApp e regras para disparar alertas automáticos do RH e da operação.
            </p>
          </div>
        </div>

        {/* STATUS CARD */}
        <div className="flex items-center gap-3 bg-slate-50 p-3 px-4 rounded-2xl border border-slate-100 text-xs">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
          <div>
            <span className="block font-bold text-slate-700">Número Padrão Ativo</span>
            <span className="font-mono text-emerald-700 font-extrabold">
              {settings.whatsappPadrao ? formatarTelefoneVisual(settings.whatsappPadrao) : 'Não configurado'}
            </span>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold animate-fadeIn">
          <span className="material-symbols-outlined text-emerald-600 text-lg">verified</span>
          <span>Configurações salvas com sucesso! O novo número padrão já está ativo para todos os alertas de RH.</span>
        </div>
      )}

      {/* GRID DE CONFIGURAÇÕES E TESTE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUNA ESQUERDA: FORMULÁRIO DE NÚMEROS E GATILHOS (7 COLUNAS) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* CARD 1: NÚMEROS DE TELEFONE */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">contact_phone</span>
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Telefones Oficiais de Destino
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Números que receberão os resumos e notificações instantâneas
                  </p>
                </div>
              </div>

              {/* NÚMERO PRINCIPAL */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    WhatsApp Principal (RH & Gestão) <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-5 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <i className="fa-brands fa-whatsapp text-emerald-600 text-base"></i>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="Ex: 85999999999"
                        value={settings.whatsappPadrao}
                        onChange={e => setSettings({ ...settings, whatsappPadrao: e.target.value })}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                    </div>
                    <div className="sm:col-span-7">
                      <input
                        type="text"
                        required
                        placeholder="Nome do Responsável / Cargo"
                        value={settings.nomeResponsavel}
                        onChange={e => setSettings({ ...settings, nomeResponsavel: e.target.value })}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Insira com DDD (Ex: 85999998888 ou +55 85 99999-8888). O sistema normaliza automaticamente.
                  </p>
                </div>

                {/* NÚMERO SECUNDÁRIO */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    WhatsApp Secundário (Supervisão / DP / Financeiro) <span className="text-slate-400 font-normal text-[10px]">(Opcional)</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-5 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <span className="material-symbols-outlined text-base">phone_iphone</span>
                      </div>
                      <input
                        type="text"
                        placeholder="Ex: 85988887777"
                        value={settings.telefoneSecundario || ''}
                        onChange={e => setSettings({ ...settings, telefoneSecundario: e.target.value })}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                    </div>
                    <div className="sm:col-span-7">
                      <input
                        type="text"
                        placeholder="Nome do Responsável Secundário"
                        value={settings.nomeResponsavelSecundario || ''}
                        onChange={e => setSettings({ ...settings, nomeResponsavelSecundario: e.target.value })}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* ASSINATURA DAS MENSAGENS */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Assinatura / Rodapé Institucional das Mensagens
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: MultiPlan Corretora de Seguros & Planos de Saúde"
                    value={settings.mensagemPersonalizada || ''}
                    onChange={e => setSettings({ ...settings, mensagemPersonalizada: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Aparece no rodapé de todas as notificações enviadas para dar credibilidade institucional.
                  </p>
                </div>
              </div>
            </div>

            {/* CARD 2: GATILHOS DE NOTIFICAÇÃO */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">notifications_active</span>
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Gatilhos Automáticos do RH
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Habilite quais eventos disparam botões e atalhos rápidos de aviso
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                
                {/* 1. Folha de Pagamento */}
                <label className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">receipt_long</span>
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-800">Fechamento de Folha de Pagamento</span>
                      <span className="text-[11px] text-slate-500">Resumo líquido, provisão de FGTS e quantidade de funcionários</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.alertaFolhaAtivo}
                    onChange={e => setSettings({ ...settings, alertaFolhaAtivo: e.target.checked })}
                    className="w-5 h-5 text-emerald-600 rounded-md focus:ring-emerald-500 border-slate-300"
                  />
                </label>

                {/* 2. Fim de Estágio */}
                <label className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">school</span>
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-800">Término de Contrato de Estágio</span>
                      <span className="text-[11px] text-slate-500">Alertas de 60 e 30 dias para renovação ou efetivação CLT</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.alertaEstagioAtivo}
                    onChange={e => setSettings({ ...settings, alertaEstagioAtivo: e.target.checked })}
                    className="w-5 h-5 text-emerald-600 rounded-md focus:ring-emerald-500 border-slate-300"
                  />
                </label>

                {/* 3. Férias a Vencer */}
                <label className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">event_upcoming</span>
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-800">Alerta de Férias a Vencer</span>
                      <span className="text-[11px] text-slate-500">Avisos de prazo limite do período concessivo legal</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.alertaFeriasAtivo}
                    onChange={e => setSettings({ ...settings, alertaFeriasAtivo: e.target.checked })}
                    className="w-5 h-5 text-emerald-600 rounded-md focus:ring-emerald-500 border-slate-300"
                  />
                </label>

                {/* 4. Checklist Admissional */}
                <label className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">checklist</span>
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-800">Checklist Admissional & ASO</span>
                      <span className="text-[11px] text-slate-500">Cobrança de exames médicos, contratos e CTPS</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.alertaAdmissaoAtivo}
                    onChange={e => setSettings({ ...settings, alertaAdmissaoAtivo: e.target.checked })}
                    className="w-5 h-5 text-emerald-600 rounded-md focus:ring-emerald-500 border-slate-300"
                  />
                </label>

                {/* 5. 13º Salário */}
                <label className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">payments</span>
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-800">Avisos de 13º Salário</span>
                      <span className="text-[11px] text-slate-500">Lembretes de 1ª e 2ª parcelas nos meses de final de ano</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.alertaDecimoAtivo}
                    onChange={e => setSettings({ ...settings, alertaDecimoAtivo: e.target.checked })}
                    className="w-5 h-5 text-emerald-600 rounded-md focus:ring-emerald-500 border-slate-300"
                  />
                </label>

                {/* 6. Rescisão */}
                <label className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">person_remove</span>
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-800">Cálculos de Rescisão Contratual</span>
                      <span className="text-[11px] text-slate-500">Notificação de verbas e valores para homologação</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.alertaRescisaoAtivo}
                    onChange={e => setSettings({ ...settings, alertaRescisaoAtivo: e.target.checked })}
                    className="w-5 h-5 text-emerald-600 rounded-md focus:ring-emerald-500 border-slate-300"
                  />
                </label>

              </div>

              {/* BOTÃO SALVAR */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-3 bg-[#001a54] hover:bg-[#002875] text-white rounded-2xl text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-lg">save</span>
                  <span>{isSaving ? 'Salvando...' : 'Salvar Configurações'}</span>
                </button>
              </div>
            </div>

          </form>
        </div>

        {/* COLUNA DIREITA: SIMULADOR & TESTE EM TEMPO REAL (5 COLUNAS) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* CARD DE TESTE */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <i className="fa-brands fa-whatsapp text-lg"></i>
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Testar Integração WhatsApp
                </h2>
                <p className="text-[11px] text-slate-400 font-medium">
                  Valide a formatação e o recebimento de mensagens instantaneamente
                </p>
              </div>
            </div>

            {/* SELETOR DE MODELO */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Modelo de Notificação para Teste
                </label>
                <select
                  value={testTipo}
                  onChange={e => setTestTipo(e.target.value as RhEventoWhatsapp)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                >
                  <option value="TESTE_INTEGRACAO">⚡ Teste Geral de Conectividade</option>
                  <option value="FOLHA_PRONTA">📑 Fechamento de Folha de Pagamento</option>
                  <option value="FIM_ESTAGIO">🎓 Vencimento de Contrato de Estágio</option>
                  <option value="FERIAS_VENCENDO">📅 Alerta de Férias a Vencer</option>
                  <option value="DOCUMENTACAO_PENDENTE">⚠️ Checklist Admissional Pendente</option>
                  <option value="EPOCA_DECIMO">💰 Aviso de 13º Salário</option>
                  <option value="RESCISAO_CALCULADA">📄 Rescisão Contratual</option>
                </select>
              </div>

              {/* OPÇÃO NÚMERO CUSTOMIZADO OU PADRÃO */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Destino do Teste
                  </label>
                  <button
                    type="button"
                    onClick={() => setTestCustom(!testCustom)}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
                  >
                    {testCustom ? 'Usar número padrão' : 'Digitar outro número para teste'}
                  </button>
                </div>

                {testCustom ? (
                  <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <input
                      type="text"
                      placeholder="Telefone com DDD (Ex: 85999991111)"
                      value={testTelefone}
                      onChange={e => setTestTelefone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                    />
                    <input
                      type="text"
                      placeholder="Nome do Destinatário do Teste"
                      value={testDestinatario}
                      onChange={e => setTestDestinatario(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100 flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold text-emerald-950">
                        {settings.nomeResponsavel || 'Gestor RH'}
                      </span>
                      <span className="text-[11px] font-mono font-extrabold text-emerald-700">
                        {settings.whatsappPadrao ? formatarTelefoneVisual(settings.whatsappPadrao) : 'Número não definido'}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-200/80 text-emerald-900 rounded-full text-[10px] font-extrabold">
                      Padrão
                    </span>
                  </div>
                )}
              </div>

              {/* PREVIEW DO WHATSAPP */}
              <div className="pt-2">
                <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                  Prévia da Mensagem (Formato WhatsApp)
                </label>
                <div className="p-4 bg-[#e5ddd5] rounded-2xl border border-[#d1c7bc] shadow-inner text-xs font-sans text-slate-900 relative">
                  <div className="bg-white p-3.5 rounded-2xl rounded-tl-xs shadow-xs space-y-2 max-w-[95%]">
                    <p className="whitespace-pre-wrap leading-relaxed text-[11px] text-slate-800">
                      {previewTexto}
                    </p>
                    <div className="flex justify-end items-center gap-1 text-[9px] text-slate-400 pt-1">
                      <span>{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-blue-500 font-bold">✓✓</span>
                    </div>
                  </div>
                </div>
              </div>

              {testSuccessMessage && (
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>{testSuccessMessage}</span>
                </div>
              )}

              {/* BOTÃO DE DISPARO */}
              <button
                type="button"
                onClick={handleDispararTeste}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <i className="fa-brands fa-whatsapp text-lg"></i>
                <span>Enviar Mensagem de Teste</span>
              </button>
            </div>
          </div>

          {/* HISTÓRICO DE DISPAROS RECENTES */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400 text-lg">history</span>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Últimos Disparos de Teste
                </h3>
              </div>
              {logs.length > 0 && (
                <button
                  type="button"
                  onClick={handleLimparLogs}
                  className="text-[10px] font-bold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>

            {logs.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {logs.slice(0, 5).map(log => (
                  <div key={log.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] flex items-center justify-between gap-2">
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 truncate">{log.destinatario}</span>
                        <span className="text-[10px] font-mono text-slate-400">({formatarTelefoneVisual(log.telefone)})</span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{log.mensagemPreview}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                        {log.status === 'TESTE_REALIZADO' ? 'Teste' : 'Enviado'}
                      </span>
                      <span className="block text-[9px] text-slate-400 mt-0.5">
                        {new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4 font-medium">
                Nenhum teste de notificação realizado recentemente.
              </p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
