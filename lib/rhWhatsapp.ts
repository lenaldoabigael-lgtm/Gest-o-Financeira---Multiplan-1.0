// lib/rhWhatsapp.ts
//
// Utilitário para envio, configuração e formatação de notificações de WhatsApp para o Módulo RH e Sistema MultiPlan
//

import { RhNotificationSettings, NotificationLog } from '../types';
import { supabase } from './supabase';

export type RhEventoWhatsapp = 
  | 'FERIAS_VENCENDO'
  | 'EPOCA_DECIMO'
  | 'DOCUMENTACAO_PENDENTE'
  | 'FIM_ESTAGIO'
  | 'FOLHA_PRONTA'
  | 'TESTE_INTEGRACAO'
  | 'RESCISAO_CALCULADA';

export interface MensagemWhatsappConfig {
  evento: RhEventoWhatsapp;
  titulo: string;
  destinatarioNome?: string;
  telefone?: string;
  dados: Record<string, string | number>;
}

export const DEFAULT_RH_NOTIFICATION_SETTINGS: RhNotificationSettings = {
  whatsappPadrao: '85999999999',
  nomeResponsavel: 'Lenaldo Abigael / Gestão MultiPlan',
  telefoneSecundario: '',
  nomeResponsavelSecundario: 'Supervisão de RH & DP',
  alertaFeriasAtivo: true,
  alertaDecimoAtivo: true,
  alertaAdmissaoAtivo: true,
  alertaEstagioAtivo: true,
  alertaFolhaAtivo: true,
  alertaRescisaoAtivo: true,
  mensagemPersonalizada: 'MultiPlan Corretora de Seguros & Planos de Saúde'
};

const STORAGE_KEY_SETTINGS = 'multiplan_rh_notification_settings_v1';
const STORAGE_KEY_LOGS = 'multiplan_rh_notification_logs_v1';

/**
 * Retorna as configurações de notificações salvas ou o padrão
 */
export function getRhNotificationSettings(): RhNotificationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_RH_NOTIFICATION_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.warn('Erro ao carregar configurações de notificação do localStorage:', e);
  }
  return DEFAULT_RH_NOTIFICATION_SETTINGS;
}

/**
 * Salva as configurações de notificações no localStorage e sincroniza no Supabase se possível
 */
export async function saveRhNotificationSettings(settings: RhNotificationSettings, usuarioLogin?: string): Promise<void> {
  const updatedSettings: RhNotificationSettings = {
    ...settings,
    atualizadoEm: new Date().toISOString(),
    atualizadoPor: usuarioLogin || 'admin'
  };

  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updatedSettings));
  } catch (e) {
    console.error('Erro ao salvar no localStorage:', e);
  }

  // Sincronização opcional com Supabase
  try {
    const { error } = await supabase
      .from('system_settings')
      .upsert({
        key: 'rh_notification_settings',
        value: updatedSettings,
        updated_at: new Date().toISOString(),
        updated_by: usuarioLogin || 'admin'
      }, { onConflict: 'key' });
    
    if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
      console.warn('Supabase system_settings sync notice:', error.message);
    }
  } catch (err) {
    // Falha silenciosa de rede se tabela não estiver criada
  }
}

/**
 * Normaliza qualquer formato de telefone brasileiro para o formato internacional do WhatsApp (ex: 5585999999999)
 */
export function normalizarNumeroParaWhatsapp(telefone: string): string {
  if (!telefone) return '';
  const apenasNumeros = telefone.replace(/\D/g, '');
  if (!apenasNumeros) return '';
  
  if (apenasNumeros.startsWith('55') && (apenasNumeros.length === 12 || apenasNumeros.length === 13)) {
    return apenasNumeros;
  }
  
  if (apenasNumeros.length === 10 || apenasNumeros.length === 11) {
    return `55${apenasNumeros}`;
  }
  
  return apenasNumeros;
}

/**
 * Formata telefone para exibição visual amigável: (85) 99999-9999 ou +55 (85) 99999-9999
 */
export function formatarTelefoneVisual(telefone: string): string {
  if (!telefone) return '';
  const num = telefone.replace(/\D/g, '');
  
  if (num.length === 13 && num.startsWith('55')) {
    const ddd = num.substring(2, 4);
    const parte1 = num.substring(4, 9);
    const parte2 = num.substring(9);
    return `+55 (${ddd}) ${parte1}-${parte2}`;
  }
  if (num.length === 11) {
    const ddd = num.substring(0, 2);
    const parte1 = num.substring(2, 7);
    const parte2 = num.substring(7);
    return `(${ddd}) ${parte1}-${parte2}`;
  }
  if (num.length === 10) {
    const ddd = num.substring(0, 2);
    const parte1 = num.substring(2, 6);
    const parte2 = num.substring(6);
    return `(${ddd}) ${parte1}-${parte2}`;
  }
  return telefone;
}

/**
 * Gera texto formatado para envio no WhatsApp
 */
export function gerarTextoNotificacaoWhatsapp(config: MensagemWhatsappConfig): string {
  const agora = new Date().toLocaleDateString('pt-BR');
  const settings = getRhNotificationSettings();
  const rodape = settings.mensagemPersonalizada ? `\n\n🏢 _${settings.mensagemPersonalizada}_` : '';

  switch (config.evento) {
    case 'FERIAS_VENCENDO':
      return `📅 *MultiPlan RH — Alerta de Férias a Vencer*\n\n` +
        `Olá! O período de férias do colaborador *${config.dados.nome}* está se aproximando do limite legal.\n` +
        `• *Período Aquisitivo:* ${config.dados.periodo}\n` +
        `• *Status:* ${config.dados.status || 'A Vencer'}\n` +
        `• *Previsão de Terço Constitucional:* R$ ${Number(config.dados.terco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n` +
        `👉 Acesse o módulo de RH no MultiPlan para agendar as férias.` + rodape;

    case 'EPOCA_DECIMO':
      return `💰 *MultiPlan RH — Aviso de 13º Salário (${config.dados.parcela || '1ª Parcela'})*\n\n` +
        `Atenção gestores: Estamos no período oficial de cálculo e adiantamento do 13º Salário dos colaboradores.\n` +
        `• *Competência:* ${config.dados.competencia || agora}\n` +
        `• *Total de Funcionários Ativos:* ${config.dados.totalAtivos}\n` +
        `• *Impacto Estimado da Folha:* R$ ${Number(config.dados.totalEstimado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n` +
        `👉 Acesse a Folha de Pagamento do MultiPlan para revisar os cálculos.` + rodape;

    case 'DOCUMENTACAO_PENDENTE':
      return `⚠️ *MultiPlan RH — Checklist de Admissão Pendente*\n\n` +
        `Constam pendências de documentação ou exames para a admissão do colaborador *${config.dados.nome}*:\n` +
        `• *Etapa Pendente:* ${config.dados.etapa}\n` +
        `• *Data Prevista:* ${config.dados.dataPrevista || 'Urgente'}\n` +
        `• *Cargo:* ${config.dados.cargo}\n\n` +
        `👉 Acesse a aba Demandas de RH no MultiPlan para concluir a admissão.` + rodape;

    case 'FIM_ESTAGIO':
      return `🎓 *MultiPlan RH — Vencimento de Contrato de Estágio*\n\n` +
        `O contrato de estágio de *${config.dados.nome}* está próximo do término previsto:\n` +
        `• *Instituição:* ${config.dados.instituicao}\n` +
        `• *Previsão de Término:* ${config.dados.termino}\n` +
        `• *Supervisor:* ${config.dados.supervisor || 'Gestão de RH'}\n\n` +
        `👉 Avalie a renovação do termo de estágio ou a efetivação como CLT no MultiPlan.` + rodape;

    case 'FOLHA_PRONTA':
      return `📑 *MultiPlan RH — Folha do Mês Pronta para Fechamento*\n\n` +
        `A folha de pagamento da competência *${config.dados.competencia}* já foi calculada e está pronta para fechamento financeiro:\n` +
        `• *Total de Funcionários:* ${config.dados.qtdFuncionarios}\n` +
        `• *Valor Líquido Total:* R$ ${Number(config.dados.valorLiquido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
        `• *FGTS a Recolher (Empresa):* R$ ${Number(config.dados.fgts || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n` +
        `👉 Acesse o MultiPlan para aprovar e gerar o lançamento automático em Contas a Pagar.` + rodape;

    case 'RESCISAO_CALCULADA':
      return `📄 *MultiPlan RH — Cálculo de Rescisão Concluído*\n\n` +
        `Foi calculado o desligamento do colaborador *${config.dados.nome}*:\n` +
        `• *Motivo:* ${config.dados.tipo}\n` +
        `• *Data de Desligamento:* ${config.dados.data}\n` +
        `• *Total Líquido Rescisório:* R$ ${Number(config.dados.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n` +
        `👉 Acesse a aba Rescisões no MultiPlan para gerar a minuta e homologação.` + rodape;

    case 'TESTE_INTEGRACAO':
      return `🔔 *MultiPlan RH — Teste de Notificações WhatsApp*\n\n` +
        `Olá *${config.destinatarioNome || 'Gestor'}*! Esta é uma mensagem de validação da integração do MultiPlan.\n\n` +
        `✅ *Status da Integração:* 100% Operacional\n` +
        `⏰ *Horário do Teste:* ${new Date().toLocaleTimeString('pt-BR')} do dia ${agora}\n` +
        `📱 *Destino Configurado:* ${config.dados.telefone || 'WhatsApp Padrão'}\n\n` +
        `Seus alertas de RH (Folha de Pagamento, Estágios, Férias e Admissões) estão prontos para envio direto.` + rodape;
  }
}

/**
 * Histórico de logs de notificações
 */
export function getNotificationLogs(): NotificationLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Erro ao carregar logs:', e);
  }
  return [];
}

export function addNotificationLog(logData: Omit<NotificationLog, 'id' | 'timestamp'>): NotificationLog {
  const newLog: NotificationLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    ...logData
  };

  try {
    const current = getNotificationLogs();
    const updated = [newLog, ...current].slice(0, 50); // Mantém os últimos 50
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(updated));
  } catch (e) {
    console.error('Erro ao salvar log de notificação:', e);
  }

  return newLog;
}

export function limparLogsNotificacao(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_LOGS);
  } catch (e) {
    console.error('Erro ao limpar logs:', e);
  }
}

/**
 * Abre o WhatsApp Web / App com o texto pré-formatado e registra o log
 */
export function dispararNotificacaoWhatsapp(config: MensagemWhatsappConfig, telefoneCustomizado?: string): { url: string; texto: string; numeroFormatado: string } {
  const settings = getRhNotificationSettings();
  const telFinal = telefoneCustomizado || config.telefone || settings.whatsappPadrao;
  const numLimpo = normalizarNumeroParaWhatsapp(telFinal);
  
  const texto = gerarTextoNotificacaoWhatsapp(config);
  const textoEncoded = encodeURIComponent(texto);
  
  let url = `https://wa.me/?text=${textoEncoded}`;
  if (numLimpo) {
    url = `https://wa.me/${numLimpo}?text=${textoEncoded}`;
  }
  
  // Registra no log local
  addNotificationLog({
    tipo: config.evento,
    destinatario: config.destinatarioNome || settings.nomeResponsavel || 'Gestor RH',
    telefone: telFinal,
    status: config.evento === 'TESTE_INTEGRACAO' ? 'TESTE_REALIZADO' : 'ENVIADO',
    mensagemPreview: texto.substring(0, 100) + (texto.length > 100 ? '...' : '')
  });

  window.open(url, '_blank', 'noopener,noreferrer');

  return { url, texto, numeroFormatado: numLimpo };
}

