// components/RevisaoImportacaoModal.tsx
//
// Revisão de importação com edição inline + validações em tempo real antes de confirmar.
//   - BLOQUEIOS: Contrato vazio ou duplicado, CPF/CNPJ inválido, sem vendedora, valor R$ 0,00, vidas <= 0.
//   - AVISOS: Contrato idêntico ao CPF, vendedora ou operadora não cadastrada, comissão zerada, etc.
//   - HIGIENIZAÇÃO: Remove campos temporários (_cpfValido, etc.) antes de persistir no banco de dados.

import React, { useMemo, useState } from 'react';
import { Proposal, ProposalRequirement } from '../types';
import { parseBrlMoney, formatBrl } from '../lib/currency';

interface RevisaoImportacaoModalProps {
  data: any[];
  requirements: ProposalRequirement[];
  existingProposals: Proposal[];
  onConfirm: (rows: any[]) => void;
  onCancel: () => void;
}

// ---------- Máscara e Validação de CPF e CNPJ ----------

export function formatCpfCnpj(doc: string): string {
  const digits = (doc || '').replace(/\D/g, '');
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .slice(0, 14);
  } else {
    return digits
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})/, '$1-$2')
      .slice(0, 18);
  }
}

function calcDigito(base: string, pesos: number[]): number {
  const soma = base.split('').reduce((acc, d, i) => acc + parseInt(d, 10) * pesos[i], 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

function validarCPF(cpf: string): boolean {
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const d1 = calcDigito(cpf.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calcDigito(cpf.slice(0, 9) + d1, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return cpf === cpf.slice(0, 9) + String(d1) + String(d2);
}

function validarCNPJ(cnpj: string): boolean {
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  const d1 = calcDigito(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calcDigito(cnpj.slice(0, 12) + d1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return cnpj === cnpj.slice(0, 12) + String(d1) + String(d2);
}

// Corrige zero à esquerda perdido na planilha e valida dígitos
function corrigirDocumento(raw: string): { valor: string; rawDigits: string; valido: boolean; motivo?: string } {
  const original = (raw || '').replace(/\D/g, '');
  if (!original) {
    return { valor: '', rawDigits: '', valido: false, motivo: 'CPF/CNPJ não informado' };
  }

  let digitos = original;
  if (original.length >= 8 && original.length <= 10) {
    digitos = original.padStart(11, '0');
  } else if (original.length >= 12 && original.length <= 13) {
    digitos = original.padStart(14, '0');
  }

  let valido = false;
  let motivo = '';

  if (digitos.length === 11) {
    valido = validarCPF(digitos);
    if (!valido) motivo = 'Dígito verificador do CPF incorreto';
  } else if (digitos.length === 14) {
    valido = validarCNPJ(digitos);
    if (!valido) motivo = 'Dígito verificador do CNPJ incorreto';
  } else {
    valido = false;
    motivo = `Quantidade de dígitos incorreta (${digitos.length}/11)`;
  }

  return { valor: formatCpfCnpj(digitos), rawDigits: digitos, valido, motivo };
}

// ---------- Utilitários e Validadores Auxiliares ----------

const normalizar = (s: string) => (s || '').trim().toUpperCase().replace(/\s+/g, ' ');

function existeNaLista(valor: string, lista: string[]): boolean {
  if (!valor) return true;
  return lista.some(l => normalizar(l) === normalizar(valor));
}

function sugestaoParecida(valor: string, lista: string[]): string | null {
  const norm = normalizar(valor);
  if (!norm) return null;
  const achou = lista.find(l => {
    const ln = normalizar(l);
    return ln.includes(norm) || norm.includes(ln) || (norm.length >= 4 && ln.slice(0, 4) === norm.slice(0, 4));
  });
  return achou || null;
}

function valorSuspeito(v: number): boolean {
  if (v === undefined || v === null || isNaN(v) || v <= 0) return true;
  const casas = (v.toString().split('.')[1] || '').length;
  return casas > 2;
}

function dataSuspeita(dataStr: string): string | null {
  if (!dataStr) return null;
  const d = new Date(dataStr);
  if (isNaN(d.getTime())) return 'Data inválida';
  const hoje = new Date();
  if (d.getTime() > hoje.getTime()) return 'Data no futuro';
  const doisAnosAtras = new Date();
  doisAnosAtras.setFullYear(hoje.getFullYear() - 2);
  if (d.getTime() < doisAnosAtras.getTime()) return 'Data muito antiga';
  return null;
}

const emailValido = (email: string) => !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
const telefoneValido = (tel: string) => { const d = (tel || '').replace(/\D/g, ''); return !tel || (d.length >= 10 && d.length <= 11); };
const cepValido = (cep: string) => !cep || (cep || '').replace(/\D/g, '').length === 8;

export const RevisaoImportacaoModal: React.FC<RevisaoImportacaoModalProps> = ({
  data, requirements, existingProposals, onConfirm, onCancel,
}) => {
  const [rows, setRows] = useState(() =>
    data.map(p => {
      const doc = corrigirDocumento(p.cpfCnpj || '');
      const v = Number(p.valor) || 0;
      let c = Number(p.comissao);
      const taxa = Number(p.detalhes?.financeiro?.valorTaxa) || 0;
      if ((isNaN(c) || c <= 0) && v > 0) {
        c = (taxa > 0 && v > taxa) ? (v - taxa) : v;
      }
      const rawVidas = Number(p.vidas);
      const finalVidas = isNaN(rawVidas) || rawVidas <= 0 ? 1 : rawVidas;
      return { 
        ...p, 
        vidas: finalVidas,
        cpfCnpj: doc.valor, 
        comissao: isNaN(c) ? 0 : c,
        _cpfValido: doc.valido,
        _cpfMotivo: doc.motivo
      };
    })
  );

  const [vendedoraLote, setVendedoraLote] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'TODAS' | 'BLOQUEIO' | 'AVISO' | 'VALIDAS'>('TODAS');
  const [linhaExpandida, setLinhaExpandida] = useState<number | null>(null);

  const operadoras = useMemo(() => requirements.filter(r => r.tipo === 'OPERADORA').map(r => r.nome), [requirements]);
  const corretores = useMemo(() => requirements.filter(r => r.tipo === 'CORRETOR').map(r => r.nome), [requirements]);
  const contratosExistentes = useMemo(
    () => new Set(existingProposals.map(p => (p.contrato || '').trim().toUpperCase())),
    [existingProposals]
  );

  const atualizarLinha = (index: number, campo: string, valor: any) => {
    setRows(prev => prev.map((r, i) => {
      if (i !== index) return r;
      const atualizado = { ...r, [campo]: valor };
      if (campo === 'cpfCnpj') {
        const doc = corrigirDocumento(valor);
        atualizado.cpfCnpj = formatCpfCnpj(valor);
        atualizado._cpfValido = doc.valido;
        atualizado._cpfMotivo = doc.motivo;
      }
      if (campo === 'valor' && (Number(atualizado.comissao) <= 0 || Number(atualizado.comissao) === Number(r.valor))) {
        const v = Number(valor) || 0;
        const taxa = Number(r.detalhes?.financeiro?.valorTaxa) || 0;
        atualizado.comissao = (taxa > 0 && v > taxa) ? (v - taxa) : v;
      }
      return atualizado;
    }));
  };

  const atualizarDetalhe = (index: number, grupo: string, campo: string, valor: any) => {
    setRows(prev => prev.map((r, i) => {
      if (i !== index) return r;
      return { ...r, detalhes: { ...r.detalhes, [grupo]: { ...r.detalhes?.[grupo], [campo]: valor } } };
    }));
  };

  const aplicarVendedoraEmLote = () => {
    if (!vendedoraLote.trim()) return;
    setRows(prev => prev.map(r =>
      (!r.corretor || r.corretor === 'Corretor Geral' || r.corretor === 'Sem Corretor') ? { ...r, corretor: vendedoraLote.trim() } : r
    ));
  };

  const autoCorrigirComissoes = () => {
    setRows(prev => prev.map(r => {
      const v = Number(r.valor) || 0;
      const c = Number(r.comissao) || 0;
      const taxa = Number(r.detalhes?.financeiro?.valorTaxa) || 0;
      if (c <= 0 && v > 0) {
        const novaComissao = (taxa > 0 && v > taxa) ? (v - taxa) : v;
        return {
          ...r,
          comissao: novaComissao,
          detalhes: {
            ...r.detalhes,
            financeiro: {
              ...r.detalhes?.financeiro,
              parcelas: [
                { id: '1', numero: '1ª Parcela', valor: v, comissao: novaComissao, vencimento: r.data || '' }
              ]
            }
          }
        };
      }
      return r;
    }));
  };

  const semContrato = (r: any) => !r.contrato || r.contrato.trim() === '' || r.contrato.startsWith('IMP-');

  const contratoDuplicado = (r: any, index: number) => {
    if (semContrato(r)) return false;
    const c = normalizar(r.contrato);
    if (contratosExistentes.has(c)) return true;
    return rows.some((outra, i) => i !== index && normalizar(outra.contrato) === c);
  };

  const contratoIgualCpf = (r: any) => {
    const cDigits = (r.contrato || '').replace(/\D/g, '');
    const docDigits = (r.cpfCnpj || '').replace(/\D/g, '');
    return cDigits.length >= 8 && docDigits.length >= 8 && cDigits === docDigits;
  };

  // Itens que BLOQUEIAM a confirmação
  const pendenciasBloqueio = (r: any, index: number): { label: string; desc: string }[] => {
    const lista: { label: string; desc: string }[] = [];
    if (semContrato(r)) {
      lista.push({ label: 'Sem Contrato', desc: 'Número do contrato é obrigatório' });
    } else if (contratoDuplicado(r, index)) {
      lista.push({ label: 'Contrato Duplicado', desc: 'Contrato já existe no sistema ou repetido na planilha' });
    }

    if (!r.corretor || r.corretor.trim() === '' || r.corretor === 'Corretor Geral' || r.corretor === 'Sem Corretor') {
      lista.push({ label: 'Sem Vendedora', desc: 'Vendedora/Corretor obrigatório' });
    }

    if (!r._cpfValido) {
      lista.push({ label: 'CPF/CNPJ Inválido', desc: r._cpfMotivo || 'Dígitos ou formato incorreto' });
    }

    const valorNum = Number(r.valor);
    if ((isNaN(valorNum) || valorNum <= 0) && !r.detalhes?.proposta?.pagamentoCartao) {
      lista.push({ label: 'Valor R$ 0,00', desc: 'Valor do contrato deve ser maior que zero' });
    }

    const vidasNum = Number(r.vidas);
    if (isNaN(vidasNum) || vidasNum <= 0) {
      lista.push({ label: 'Vidas Zerado', desc: 'Quantidade de vidas deve ser no mínimo 1' });
    }

    return lista;
  };

  // Itens que apenas AVISAM (não bloqueiam)
  const pendenciasAviso = (r: any): { label: string; desc: string }[] => {
    const lista: { label: string; desc: string }[] = [];
    if (contratoIgualCpf(r)) {
      lista.push({ label: 'Contrato = CPF', desc: 'Número do contrato idêntico ao CPF. Verifique se o nº de proposta já foi gerado.' });
    }
    if (r.corretor && r.corretor !== 'Corretor Geral' && !existeNaLista(r.corretor, corretores)) {
      lista.push({ label: 'Vendedora não cadastrada', desc: `"${r.corretor}" não está na lista de corretores` });
    }
    if (!existeNaLista(r.operadora, operadoras)) {
      lista.push({ label: 'Operadora não cadastrada', desc: `"${r.operadora}" não está na lista de operadoras` });
    }
    const comissaoNum = Number(r.comissao);
    const valorNum = Number(r.valor);
    if ((isNaN(comissaoNum) || comissaoNum <= 0) && valorNum > 0 && !r.detalhes?.proposta?.pagamentoCartao) {
      lista.push({ label: 'Comissão Zerada', desc: 'Comissão calculada como R$ 0,00' });
    } else if (comissaoNum > valorNum && valorNum > 0) {
      lista.push({ label: 'Comissão > Valor', desc: 'Comissão maior que o valor do contrato' });
    }
    if (valorSuspeito(valorNum)) {
      lista.push({ label: 'Valor Suspeito', desc: 'Casas decimais anormais' });
    }
    const dataProblema = dataSuspeita(r.data);
    if (dataProblema) {
      lista.push({ label: dataProblema, desc: 'Verifique a data da venda' });
    }
    if (!emailValido(r.detalhes?.cliente?.email)) {
      lista.push({ label: 'E-mail inválido', desc: 'Formato de e-mail incorreto' });
    }
    if (!telefoneValido(r.detalhes?.cliente?.telefone)) {
      lista.push({ label: 'Telefone inválido', desc: 'Telefone incompleto' });
    }
    return lista;
  };

  const totalSemContrato = rows.filter(r => semContrato(r)).length;
  const totalDuplicado = rows.filter((r, i) => contratoDuplicado(r, i)).length;
  const totalCpfInvalido = rows.filter(r => !r._cpfValido).length;
  const totalContratoCpf = rows.filter(r => contratoIgualCpf(r)).length;
  const totalComissaoZerada = rows.filter(r => (Number(r.comissao) <= 0) && Number(r.valor) > 0 && !r.detalhes?.proposta?.pagamentoCartao).length;
  
  const totalBloqueio = rows.filter((r, i) => pendenciasBloqueio(r, i).length > 0).length;
  const totalAviso = rows.filter((r, i) => pendenciasBloqueio(r, i).length === 0 && pendenciasAviso(r).length > 0).length;
  const totalValidas = rows.filter((r, i) => pendenciasBloqueio(r, i).length === 0 && pendenciasAviso(r).length === 0).length;

  const filteredRows = rows.map((r, originalIndex) => ({ ...r, _originalIndex: originalIndex })).filter(r => {
    const b = pendenciasBloqueio(r, r._originalIndex);
    const a = pendenciasAviso(r);
    if (filtroStatus === 'BLOQUEIO') return b.length > 0;
    if (filtroStatus === 'AVISO') return b.length === 0 && a.length > 0;
    if (filtroStatus === 'VALIDAS') return b.length === 0 && a.length === 0;
    return true;
  });

  const confirmar = () => {
    if (totalBloqueio > 0) return;
    if (totalAviso > 0) {
      const ok = window.confirm(
        `${totalAviso} de ${rows.length} proposta(s) possuem avisos informativos (ex: Contrato igual ao CPF ou Vendedora). ` +
        `Deseja confirmar a importação? Todas entrarão como CADASTRADA e poderão ser ajustadas a qualquer momento.`
      );
      if (!ok) return;
    }

    // Higienização completa: sincroniza e remove qualquer campo temporário
    const rowsSincronizadas = rows.map(r => {
      const v = Number(r.valor) || 0;
      const c = Number(r.comissao) || 0;
      const doc = corrigirDocumento(r.cpfCnpj || '');

      return {
        contrato: String(r.contrato || '').trim(),
        data: r.data || new Date().toISOString().split('T')[0],
        cliente: String(r.cliente || '').trim(),
        cpfCnpj: doc.valor || String(r.cpfCnpj || '').trim(),
        corretor: String(r.corretor || '').trim(),
        operadora: String(r.operadora || '').trim(),
        categoria: r.categoria || 'Geral',
        valor: v,
        vidas: Number(r.vidas) || 1,
        status: 'CADASTRADA',
        comissao: c,
        detalhes: {
          ...r.detalhes,
          cliente: {
            ...r.detalhes?.cliente,
            nome: String(r.cliente || '').trim(),
            cpfCnpj: doc.valor || String(r.cpfCnpj || '').trim()
          },
          proposta: {
            ...r.detalhes?.proposta,
            contrato: String(r.contrato || '').trim(),
            corretor: String(r.corretor || '').trim(),
            operadora: String(r.operadora || '').trim()
          },
          financeiro: {
            ...r.detalhes?.financeiro,
            valorContrato: v,
            vidas: Number(r.vidas) || 1,
            parcelas: [
              {
                id: r.detalhes?.financeiro?.parcelas?.[0]?.id || '1',
                numero: r.detalhes?.financeiro?.parcelas?.[0]?.numero || '1ª Parcela',
                valor: v,
                comissao: c,
                vencimento: r.data || ''
              }
            ]
          }
        }
      };
    });

    onConfirm(rowsSincronizadas);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100">
        
        {/* Cabeçalho */}
        <div className="p-5 md:p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-white">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl shadow-xs">
              <i className="fa-solid fa-file-import"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">REVISÃO DE IMPORTAÇÃO</h2>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">
                  {rows.length} {rows.length === 1 ? 'proposta' : 'propostas'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Valide os campos com máscara e alertas automáticos antes de confirmar.
              </p>
            </div>
          </div>

          {/* Filtros por Categoria de Status */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setFiltroStatus('TODAS')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filtroStatus === 'TODAS' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Todas ({rows.length})
            </button>
            <button
              onClick={() => setFiltroStatus('BLOQUEIO')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filtroStatus === 'BLOQUEIO' 
                  ? 'bg-red-600 text-white shadow-xs' 
                  : totalBloqueio > 0 ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-slate-400'
              }`}
            >
              <i className="fa-solid fa-circle-xmark text-xs"></i>
              <span>Bloqueios ({totalBloqueio})</span>
            </button>
            <button
              onClick={() => setFiltroStatus('AVISO')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filtroStatus === 'AVISO' 
                  ? 'bg-amber-500 text-white shadow-xs' 
                  : totalAviso > 0 ? 'text-amber-700 bg-amber-50 hover:bg-amber-100' : 'text-slate-400'
              }`}
            >
              <i className="fa-solid fa-triangle-exclamation text-xs"></i>
              <span>Avisos ({totalAviso})</span>
            </button>
            <button
              onClick={() => setFiltroStatus('VALIDAS')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filtroStatus === 'VALIDAS' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <i className="fa-solid fa-circle-check text-xs"></i>
              <span>Válidas ({totalValidas})</span>
            </button>
          </div>

          <button 
            onClick={onCancel} 
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
            title="Fechar"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Barra de Ações Rápidas */}
        <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[320px]">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wide">Vendedora em lote:</span>
            <input 
              type="text" 
              value={vendedoraLote} 
              onChange={e => setVendedoraLote(e.target.value)}
              placeholder="Digite o nome da vendedora..." 
              list="corretores-lista"
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold flex-1 max-w-xs bg-white text-slate-700 outline-none focus:border-blue-500" 
            />
            <button 
              onClick={aplicarVendedoraEmLote} 
              className="px-3.5 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-slate-900 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              Aplicar
            </button>
          </div>

          {totalComissaoZerada > 0 && (
            <button 
              onClick={autoCorrigirComissoes}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
              title="Calcula comissão baseada no valor e taxa"
            >
              <i className="fa-solid fa-wand-magic-sparkles text-xs"></i>
              <span>Auto-Corrigir {totalComissaoZerada} Comissão(ões)</span>
            </button>
          )}
        </div>

        {/* Alerta de Bloqueio ou Avisos */}
        {totalBloqueio > 0 && (
          <div className="px-6 py-2.5 bg-rose-50 border-b border-rose-100 flex items-center gap-2.5 text-rose-800 text-xs font-bold">
            <i className="fa-solid fa-circle-exclamation text-rose-600 text-sm"></i>
            <span>
              {totalBloqueio} proposta(s) necessitam de correção para liberar a importação:
              {totalSemContrato > 0 && ` • ${totalSemContrato} sem contrato`}
              {totalDuplicado > 0 && ` • ${totalDuplicado} contrato duplicado`}
              {totalCpfInvalido > 0 && ` • ${totalCpfInvalido} CPF/CNPJ inválido`}
            </span>
          </div>
        )}

        {totalBloqueio === 0 && totalContratoCpf > 0 && (
          <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2.5 text-amber-800 text-xs font-bold">
            <i className="fa-solid fa-triangle-exclamation text-amber-600 text-sm"></i>
            <span>
              Aviso: {totalContratoCpf} proposta(s) possuem o número de Contrato idêntico ao CPF. Caso já possua o número da proposta/contrato definitivo, você pode editá-lo diretamente na tabela abaixo.
            </span>
          </div>
        )}

        {/* Tabela de Revisão */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-slate-50/40">
          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <th className="p-3 w-8 text-center"></th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3 min-w-[155px]">CPF / CNPJ</th>
                    <th className="p-3 min-w-[145px]">Contrato</th>
                    <th className="p-3 min-w-[125px]">Operadora</th>
                    <th className="p-3 min-w-[145px]">Vendedora</th>
                    <th className="p-3 w-28">Valor</th>
                    <th className="p-3 w-28">Comissão</th>
                    <th className="p-3 min-w-[180px]">Status & Sinalizações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRows.map((r) => {
                    const originalIndex = r._originalIndex;
                    const bloqueios = pendenciasBloqueio(r, originalIndex);
                    const avisos = pendenciasAviso(r);
                    const isIgualCpf = contratoIgualCpf(r);
                    const isCpfInvalido = !r._cpfValido;
                    const expandida = linhaExpandida === originalIndex;
                    const cNum = Number(r.comissao) || 0;

                    const rowBgClass = bloqueios.length > 0 
                      ? 'bg-rose-50/40 hover:bg-rose-50/70' 
                      : avisos.length > 0 
                        ? 'bg-amber-50/30 hover:bg-amber-50/60' 
                        : 'hover:bg-slate-50/80';

                    return (
                      <React.Fragment key={originalIndex}>
                        <tr className={`transition-colors ${rowBgClass}`}>
                          <td className="p-2 text-center">
                            <button 
                              onClick={() => setLinhaExpandida(expandida ? null : originalIndex)} 
                              className="text-slate-400 hover:text-slate-700 transition-colors p-1"
                              title="Ver mais campos"
                            >
                              <i className={`fa-solid fa-chevron-${expandida ? 'up' : 'down'} text-xs`}></i>
                            </button>
                          </td>

                          {/* Cliente */}
                          <td className="p-2">
                            <input 
                              value={r.cliente || ''} 
                              onChange={e => atualizarLinha(originalIndex, 'cliente', e.target.value)}
                              placeholder="Nome do cliente"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-transparent hover:border-slate-200 focus:border-blue-400 focus:bg-white text-xs font-bold text-slate-800 uppercase outline-none" 
                            />
                          </td>

                          {/* CPF / CNPJ com máscara ativa e validação */}
                          <td className="p-2">
                            <div className="relative">
                              <input 
                                value={r.cpfCnpj || ''} 
                                onChange={e => atualizarLinha(originalIndex, 'cpfCnpj', e.target.value)}
                                placeholder="000.000.000-00"
                                maxLength={18}
                                className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold outline-none transition-all ${
                                  isCpfInvalido 
                                    ? 'border-rose-300 bg-rose-50 text-rose-800 font-black' 
                                    : 'border-transparent hover:border-slate-200 focus:border-blue-400 focus:bg-white text-slate-800'
                                }`} 
                              />
                              {isCpfInvalido && (
                                <span 
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-rose-500 text-xs"
                                  title={r._cpfMotivo || 'CPF/CNPJ inválido'}
                                >
                                  <i className="fa-solid fa-circle-exclamation"></i>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Contrato */}
                          <td className="p-2">
                            <div className="relative">
                              <input 
                                value={r.contrato || ''} 
                                onChange={e => atualizarLinha(originalIndex, 'contrato', e.target.value)}
                                placeholder="Nº Contrato"
                                className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold outline-none transition-all ${
                                  semContrato(r) || contratoDuplicado(r, originalIndex)
                                    ? 'border-rose-300 bg-rose-50 text-rose-800 font-black placeholder-rose-300' 
                                    : isIgualCpf
                                      ? 'border-amber-300 bg-amber-50/80 text-amber-900 font-black'
                                      : 'border-transparent hover:border-slate-200 focus:border-blue-400 focus:bg-white text-blue-700 font-extrabold'
                                }`} 
                              />
                              {isIgualCpf && (
                                <span 
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-600 text-xs"
                                  title="Contrato idêntico ao CPF. Altere caso já tenha o número da proposta."
                                >
                                  <i className="fa-solid fa-triangle-exclamation"></i>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Operadora */}
                          <td className="p-2">
                            <input 
                              value={r.operadora || ''} 
                              onChange={e => atualizarLinha(originalIndex, 'operadora', e.target.value)}
                              list="operadoras-lista"
                              placeholder="Operadora"
                              className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold outline-none ${
                                !existeNaLista(r.operadora, operadoras) 
                                  ? 'border-amber-300 bg-amber-50 text-amber-800' 
                                  : 'border-transparent hover:border-slate-200 focus:border-blue-400 focus:bg-white text-slate-800'
                              }`} 
                            />
                            {!existeNaLista(r.operadora, operadoras) && sugestaoParecida(r.operadora, operadoras) && (
                              <button 
                                onClick={() => atualizarLinha(originalIndex, 'operadora', sugestaoParecida(r.operadora, operadoras))}
                                className="text-[10px] text-blue-600 hover:underline mt-0.5 block font-bold"
                              >
                                Usar "{sugestaoParecida(r.operadora, operadoras)}"?
                              </button>
                            )}
                          </td>

                          {/* Vendedora */}
                          <td className="p-2">
                            <input 
                              value={r.corretor || ''} 
                              onChange={e => atualizarLinha(originalIndex, 'corretor', e.target.value)}
                              list="corretores-lista"
                              placeholder="Vendedora"
                              className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold outline-none ${
                                (!r.corretor || r.corretor === 'Corretor Geral' || r.corretor === 'Sem Corretor')
                                  ? 'border-rose-300 bg-rose-50 text-rose-800'
                                  : !existeNaLista(r.corretor, corretores)
                                    ? 'border-amber-300 bg-amber-50 text-amber-800'
                                    : 'border-transparent hover:border-slate-200 focus:border-blue-400 focus:bg-white text-slate-800'
                              }`} 
                            />
                          </td>

                          {/* Valor */}
                          <td className="p-2">
                            <input 
                              type="text" 
                              value={r.valor !== undefined && r.valor !== null ? (typeof r.valor === 'number' ? formatBrl(r.valor) : r.valor) : ''}
                              onChange={e => {
                                const parsed = parseBrlMoney(e.target.value);
                                atualizarLinha(originalIndex, 'valor', parsed);
                              }}
                              className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold outline-none ${
                                valorSuspeito(Number(r.valor)) 
                                  ? 'border-rose-300 bg-rose-50 text-rose-800 font-black' 
                                  : 'border-transparent hover:border-slate-200 focus:border-blue-400 focus:bg-white text-slate-800'
                              }`} 
                            />
                          </td>

                          {/* Comissão */}
                          <td className="p-2">
                            <input 
                              type="text" 
                              value={r.comissao !== undefined && r.comissao !== null ? (typeof r.comissao === 'number' ? formatBrl(r.comissao) : r.comissao) : ''}
                              onChange={e => {
                                const parsed = parseBrlMoney(e.target.value);
                                atualizarLinha(originalIndex, 'comissao', parsed);
                              }}
                              className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-black outline-none ${
                                cNum <= 0 && Number(r.valor) > 0 
                                  ? 'border-amber-300 bg-amber-50 text-amber-800' 
                                  : 'border-transparent hover:border-slate-200 focus:border-blue-400 focus:bg-white text-emerald-600'
                              }`} 
                            />
                          </td>

                          {/* Status / Avisos com Badges Visuais */}
                          <td className="p-2">
                            <div className="flex flex-wrap gap-1 items-center">
                              {bloqueios.length > 0 ? (
                                bloqueios.map((b, idx) => (
                                  <span 
                                    key={idx}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200 whitespace-nowrap"
                                    title={b.desc}
                                  >
                                    <i className="fa-solid fa-circle-xmark text-rose-600 text-[9px]"></i>
                                    {b.label}
                                  </span>
                                ))
                              ) : avisos.length > 0 ? (
                                avisos.map((a, idx) => (
                                  <span 
                                    key={idx}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200 whitespace-nowrap"
                                    title={a.desc}
                                  >
                                    <i className="fa-solid fa-triangle-exclamation text-amber-600 text-[9px]"></i>
                                    {a.label}
                                  </span>
                                ))
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                                  <i className="fa-solid fa-circle-check text-emerald-600 text-[9px]"></i>
                                  Válida
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Linha Expandida para Dados Complementares */}
                        {expandida && (
                          <tr className="bg-slate-50/80 border-b border-slate-200">
                            <td colSpan={9} className="p-4">
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
                                <CampoSecundario 
                                  label="Vidas" 
                                  value={r.vidas ?? 1}
                                  onChange={v => atualizarLinha(originalIndex, 'vidas', parseInt(v) || 1)} 
                                  type="number" 
                                />
                                <CampoSecundario 
                                  label="Data da Venda" 
                                  value={r.data || ''}
                                  onChange={v => atualizarLinha(originalIndex, 'data', v)} 
                                  type="date" 
                                />
                                <CampoSecundario 
                                  label="E-mail" 
                                  value={r.detalhes?.cliente?.email || ''}
                                  onChange={v => atualizarDetalhe(originalIndex, 'cliente', 'email', v)}
                                  invalido={!emailValido(r.detalhes?.cliente?.email)} 
                                />
                                <CampoSecundario 
                                  label="Telefone" 
                                  value={r.detalhes?.cliente?.telefone || ''}
                                  onChange={v => atualizarDetalhe(originalIndex, 'cliente', 'telefone', v)}
                                  invalido={!telefoneValido(r.detalhes?.cliente?.telefone)} 
                                />
                                <CampoSecundario 
                                  label="CEP" 
                                  value={r.detalhes?.endereco?.cep || ''}
                                  onChange={v => atualizarDetalhe(originalIndex, 'endereco', 'cep', v)}
                                  invalido={!cepValido(r.detalhes?.endereco?.cep)} 
                                />
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-xs text-slate-500 font-bold">
                        Nenhuma proposta encontrada para o filtro selecionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <datalist id="operadoras-lista">{operadoras.map(op => <option key={op} value={op} />)}</datalist>
              <datalist id="corretores-lista">{corretores.map(c => <option key={c} value={c} />)}</datalist>
            </div>
          </div>
        </div>

        {/* Rodapé e Botões de Confirmação */}
        <div className="p-5 md:p-6 border-t border-slate-100 flex items-center justify-between gap-4 bg-white">
          <button 
            onClick={onCancel} 
            className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black uppercase text-xs tracking-wider transition-all cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={confirmar}
            disabled={totalBloqueio > 0}
            className={`px-8 py-3.5 rounded-xl font-black uppercase text-xs tracking-wider flex items-center gap-2 transition-all shadow-xs cursor-pointer active:scale-[0.98] ${
              totalBloqueio > 0 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
            }`}
          >
            <i className={`fa-solid ${totalBloqueio > 0 ? 'fa-lock' : 'fa-check'}`}></i>
            <span>
              {totalBloqueio > 0
                ? `Corrija ${totalBloqueio} bloqueio(s) para liberar`
                : totalAviso > 0 
                  ? `Confirmar Importação (${totalAviso} aviso${totalAviso > 1 ? 's' : ''})` 
                  : `Confirmar Importação (${rows.length} propostas)`}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};

const CampoSecundario: React.FC<{ label: string; value: any; onChange: (v: string) => void; type?: string; invalido?: boolean }> = ({
  label, value, onChange, type = 'text', invalido = false,
}) => (
  <div>
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wide block mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold outline-none ${
        invalido ? 'border-rose-300 bg-rose-50 text-rose-800' : 'border-slate-200 text-slate-800 focus:border-blue-400'
      }`}
    />
  </div>
);

export default RevisaoImportacaoModal;
