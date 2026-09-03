// components/RevisaoImportacaoModal.tsx
//
// Revisão de importação com edição inline + validações reais antes de
// confirmar. Duas categorias:
//   - BLOQUEIA: contrato vazio ou duplicado (na planilha ou já
//     existente no sistema)
//   - AVISA: tudo que só um humano consegue julgar (nome parecido mas
//     não exatamente igual ao cadastrado, valores fora do normal...)

import React, { useMemo, useState } from 'react';
import { Proposal, ProposalRequirement } from '../types';

interface RevisaoImportacaoModalProps {
  data: any[];
  requirements: ProposalRequirement[];
  existingProposals: Proposal[];
  onConfirm: (rows: any[]) => void;
  onCancel: () => void;
}

// ---------- CPF/CNPJ: dígito verificador de verdade, não só tamanho ----------

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

// Corrige zero à esquerda perdido (planilha guardando CPF/CNPJ como
// número) e só então confere o dígito verificador de verdade.
function corrigirDocumento(raw: string): { valor: string; valido: boolean } {
  const original = (raw || '').replace(/\D/g, '');
  let digitos = original;
  if (original.length >= 8 && original.length <= 10) digitos = original.padStart(11, '0');
  else if (original.length >= 12 && original.length <= 13) digitos = original.padStart(14, '0');

  const valido = digitos.length === 11 ? validarCPF(digitos) : digitos.length === 14 ? validarCNPJ(digitos) : false;
  return { valor: digitos !== original ? digitos : raw, valido };
}

// ---------- outros validadores ----------

const normalizar = (s: string) => (s || '').trim().toUpperCase().replace(/\s+/g, ' ');

function existeNaLista(valor: string, lista: string[]): boolean {
  if (!valor) return true; // vazio é outro tipo de pendência, não este
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
  if (isNaN(d.getTime())) return 'data inválida';
  const hoje = new Date();
  if (d.getTime() > hoje.getTime()) return 'data no futuro';
  const doisAnosAtras = new Date();
  doisAnosAtras.setFullYear(hoje.getFullYear() - 2);
  if (d.getTime() < doisAnosAtras.getTime()) return 'data com mais de 2 anos';
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
      return { ...p, cpfCnpj: doc.valor, _cpfValido: doc.valido };
    })
  );
  const [vendedoraLote, setVendedoraLote] = useState('');
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
      if (campo === 'cpfCnpj') atualizado._cpfValido = corrigirDocumento(valor).valido;
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
      (!r.corretor || r.corretor === 'Corretor Geral') ? { ...r, corretor: vendedoraLote.trim() } : r
    ));
  };

  const semContrato = (r: any) => !r.contrato || r.contrato.trim() === '' || r.contrato.startsWith('IMP-');

  const contratoDuplicado = (r: any, index: number) => {
    if (semContrato(r)) return false;
    const c = normalizar(r.contrato);
    if (contratosExistentes.has(c)) return true;
    return rows.some((outra, i) => i !== index && normalizar(outra.contrato) === c);
  };

  // Pendências que BLOQUEIA a confirmação
  const pendenciasBloqueio = (r: any, index: number) => {
    const lista: string[] = [];
    if (semContrato(r)) lista.push('sem contrato');
    else if (contratoDuplicado(r, index)) lista.push('contrato duplicado');
    return lista;
  };

  // Pendências que só AVISA
  const pendenciasAviso = (r: any) => {
    const lista: string[] = [];
    if (!r._cpfValido) lista.push('CPF/CNPJ inválido');
    if (!r.corretor || r.corretor === 'Corretor Geral') lista.push('sem vendedora');
    else if (!existeNaLista(r.corretor, corretores)) lista.push('vendedora não cadastrada');
    if (!existeNaLista(r.operadora, operadoras)) lista.push('operadora não cadastrada');
    if (valorSuspeito(Number(r.valor))) lista.push('valor suspeito');
    if (!r.vidas || Number(r.vidas) <= 0) lista.push('vidas zerado');
    if (Number(r.comissao) > Number(r.valor)) lista.push('comissão maior que o valor');
    const dataProblema = dataSuspeita(r.data);
    if (dataProblema) lista.push(dataProblema);
    if (!emailValido(r.detalhes?.cliente?.email)) lista.push('e-mail inválido');
    if (!telefoneValido(r.detalhes?.cliente?.telefone)) lista.push('telefone inválido');
    if (!cepValido(r.detalhes?.endereco?.cep)) lista.push('CEP inválido');
    return lista;
  };

  const totalSemContrato = rows.filter(r => semContrato(r)).length;
  const totalDuplicado = rows.filter((r, i) => contratoDuplicado(r, i)).length;
  const totalBloqueio = rows.filter((r, i) => pendenciasBloqueio(r, i).length > 0).length;
  const totalAviso = rows.filter(r => pendenciasAviso(r).length > 0).length;

  const confirmar = () => {
    if (totalBloqueio > 0) return;
    if (totalAviso > 0) {
      const ok = window.confirm(
        `${totalAviso} de ${rows.length} propostas têm algum aviso (fora contrato). ` +
        `Confirmar assim mesmo? Elas entram marcadas, dá pra corrigir depois direto na lista de Propostas.`
      );
      if (!ok) return;
    }
    onConfirm(rows);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-xl shadow-inner">
            <i className="fa-solid fa-file-import"></i>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Revisão de Importação</h2>
            <p className="text-sm font-bold text-slate-500">
              {rows.length} proposta(s) na planilha — corrige direto aqui antes de confirmar. Todas entram como CADASTRADA.
            </p>
          </div>
          {totalBloqueio > 0 && (
            <div className="ml-auto mr-4 flex items-center gap-3 bg-red-50 text-red-700 px-4 py-2 rounded-xl border border-red-200">
              <i className="fa-solid fa-lock text-red-500 text-lg"></i>
              <span className="text-xs font-bold">{totalBloqueio} linha(s) bloqueando a confirmação</span>
            </div>
          )}
          {totalBloqueio === 0 && totalAviso > 0 && (
            <div className="ml-auto mr-4 flex items-center gap-3 bg-amber-50 text-amber-700 px-4 py-2 rounded-xl border border-amber-200">
              <i className="fa-solid fa-triangle-exclamation text-amber-500 text-lg"></i>
              <span className="text-xs font-bold">{totalAviso} linha(s) com aviso (não bloqueia)</span>
            </div>
          )}
          <button onClick={onCancel} className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Aplicar vendedora a todas as linhas sem uma:</span>
          <input type="text" value={vendedoraLote} onChange={e => setVendedoraLote(e.target.value)}
            placeholder="Nome da vendedora..." className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm flex-1 max-w-xs" />
          <button onClick={aplicarVendedoraEmLote} className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-slate-700">
            Aplicar
          </button>
        </div>

        {totalBloqueio > 0 && (
          <div className="px-6 py-3 bg-red-50 border-b border-red-100 flex items-center gap-3">
            <i className="fa-solid fa-circle-info text-red-500"></i>
            <span className="text-xs font-bold text-red-700">
              {totalSemContrato > 0 && `${totalSemContrato} sem número de contrato. `}
              {totalDuplicado > 0 && `${totalDuplicado} com contrato repetido (na planilha ou já existente no sistema). `}
              Corrija o campo "Contrato" (vermelho na tabela) — a importação só libera depois.
            </span>
          </div>
        )}

        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-8"></th>
                    <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                    <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">CPF/CNPJ</th>
                    <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contrato</th>
                    <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operadora</th>
                    <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendedora</th>
                    <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                    <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Avisos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rows.map((r, index) => {
                    const bloqueios = pendenciasBloqueio(r, index);
                    const avisos = pendenciasAviso(r);
                    const expandida = linhaExpandida === index;
                    return (
                      <React.Fragment key={index}>
                        <tr className={bloqueios.length > 0 ? 'bg-red-50/40' : avisos.length > 0 ? 'bg-amber-50/40' : ''}>
                          <td className="p-2 text-center">
                            <button onClick={() => setLinhaExpandida(expandida ? null : index)} className="text-slate-400 hover:text-slate-700">
                              <i className={`fa-solid fa-chevron-${expandida ? 'up' : 'down'} text-xs`}></i>
                            </button>
                          </td>
                          <td className="p-2">
                            <input value={r.cliente || ''} onChange={e => atualizarLinha(index, 'cliente', e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg border border-transparent hover:border-slate-200 focus:border-blue-400 text-sm font-bold text-slate-700 uppercase" />
                          </td>
                          <td className="p-2">
                            <input value={r.cpfCnpj || ''} onChange={e => atualizarLinha(index, 'cpfCnpj', e.target.value)}
                              className={`w-full px-2 py-1.5 rounded-lg border text-sm font-bold ${r._cpfValido ? 'border-transparent hover:border-slate-200' : 'border-red-300 bg-red-50 text-red-700'}`} />
                          </td>
                          <td className="p-2">
                            <input value={r.contrato || ''} onChange={e => atualizarLinha(index, 'contrato', e.target.value)}
                              placeholder="Obrigatório"
                              className={`w-full px-2 py-1.5 rounded-lg border text-sm font-bold ${bloqueios.length > 0 ? 'border-red-300 bg-red-50 text-red-700 placeholder-red-300' : 'border-transparent hover:border-slate-200 text-blue-600'}`} />
                          </td>
                          <td className="p-2">
                            <input value={r.operadora || ''} onChange={e => atualizarLinha(index, 'operadora', e.target.value)}
                              list="operadoras-lista"
                              className={`w-full px-2 py-1.5 rounded-lg border text-sm font-bold ${!existeNaLista(r.operadora, operadoras) ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-transparent hover:border-slate-200 text-slate-700'}`} />
                            {!existeNaLista(r.operadora, operadoras) && sugestaoParecida(r.operadora, operadoras) && (
                              <button onClick={() => atualizarLinha(index, 'operadora', sugestaoParecida(r.operadora, operadoras))}
                                className="text-[10px] text-blue-600 hover:underline mt-0.5">
                                usar "{sugestaoParecida(r.operadora, operadoras)}"?
                              </button>
                            )}
                          </td>
                          <td className="p-2">
                            <input value={r.corretor || ''} onChange={e => atualizarLinha(index, 'corretor', e.target.value)}
                              list="corretores-lista"
                              className={`w-full px-2 py-1.5 rounded-lg border text-sm font-bold ${(!r.corretor || r.corretor === 'Corretor Geral' || !existeNaLista(r.corretor, corretores)) ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-transparent hover:border-slate-200 text-slate-700'}`} />
                          </td>
                          <td className="p-2">
                            <input type="number" step="0.01" value={r.valor ?? 0}
                              onChange={e => atualizarLinha(index, 'valor', parseFloat(e.target.value))}
                              className={`w-24 px-2 py-1.5 rounded-lg border text-sm font-bold ${valorSuspeito(Number(r.valor)) ? 'border-red-300 bg-red-50 text-red-700' : 'border-transparent hover:border-slate-200 text-emerald-600'}`} />
                          </td>
                          <td className="p-2">
                            {bloqueios.length > 0 ? (
                              <span className="text-[10px] font-bold text-red-700">{bloqueios.join(', ')}</span>
                            ) : avisos.length > 0 ? (
                              <span className="text-[10px] font-bold text-amber-700">{avisos.join(', ')}</span>
                            ) : (
                              <i className="fa-solid fa-circle-check text-emerald-500"></i>
                            )}
                          </td>
                        </tr>
                        {expandida && (
                          <tr className="bg-slate-50/60">
                            <td colSpan={8} className="p-4">
                              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                                <CampoSecundario label="Vidas" value={r.vidas ?? 0}
                                  onChange={v => atualizarLinha(index, 'vidas', parseInt(v) || 0)} type="number" />
                                <CampoSecundario label="Data Venda" value={r.data || ''}
                                  onChange={v => atualizarLinha(index, 'data', v)} type="date" />
                                <CampoSecundario label="Comissão" value={r.comissao ?? 0}
                                  onChange={v => atualizarLinha(index, 'comissao', parseFloat(v) || 0)} type="number" />
                                <CampoSecundario label="E-mail" value={r.detalhes?.cliente?.email || ''}
                                  onChange={v => atualizarDetalhe(index, 'cliente', 'email', v)}
                                  invalido={!emailValido(r.detalhes?.cliente?.email)} />
                                <CampoSecundario label="Telefone" value={r.detalhes?.cliente?.telefone || ''}
                                  onChange={v => atualizarDetalhe(index, 'cliente', 'telefone', v)}
                                  invalido={!telefoneValido(r.detalhes?.cliente?.telefone)} />
                                <CampoSecundario label="CEP" value={r.detalhes?.endereco?.cep || ''}
                                  onChange={v => atualizarDetalhe(index, 'endereco', 'cep', v)}
                                  invalido={!cepValido(r.detalhes?.endereco?.cep)} />
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
              <datalist id="operadoras-lista">{operadoras.map(op => <option key={op} value={op} />)}</datalist>
              <datalist id="corretores-lista">{corretores.map(c => <option key={c} value={c} />)}</datalist>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex gap-4 bg-white">
          <button onClick={onCancel} className="flex-1 px-4 py-4 bg-slate-100 rounded-2xl font-black text-slate-500 hover:bg-slate-200 transition-all uppercase text-xs tracking-widest">
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={totalBloqueio > 0}
            title={totalBloqueio > 0 ? 'Resolva os contratos vazios ou duplicados pra liberar' : ''}
            className={`flex-1 px-4 py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all ${
              totalBloqueio > 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-600/30'
            }`}
          >
            <i className={`fa-solid ${totalBloqueio > 0 ? 'fa-lock' : 'fa-check'}`}></i>
            {totalBloqueio > 0
              ? `Resolva ${totalBloqueio} contrato(s) pra liberar`
              : totalAviso > 0 ? `Confirmar mesmo assim (${totalAviso} aviso${totalAviso > 1 ? 's' : ''})` : 'Confirmar Importação'}
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
    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`w-full px-2 py-1.5 rounded-lg border text-xs font-bold ${invalido ? 'border-red-300 bg-red-50 text-red-700' : 'border-slate-200 text-slate-700'}`}
    />
  </div>
);

export default RevisaoImportacaoModal;
