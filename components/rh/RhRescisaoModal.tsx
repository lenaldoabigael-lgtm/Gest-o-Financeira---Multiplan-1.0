// components/rh/RhRescisaoModal.tsx
import React, { useState, useMemo } from 'react';
import { RhFuncionario, RhRescisao } from '../../types';
import { calcularEstimativaRescisao } from '../../lib/calculoFolha';

interface RhRescisaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  funcionario: RhFuncionario;
  onConfirmRescisao: (rescisao: RhRescisao) => void;
}

export const RhRescisaoModal: React.FC<RhRescisaoModalProps> = ({
  isOpen,
  onClose,
  funcionario,
  onConfirmRescisao
}) => {
  const [tipo, setTipo] = useState<'SEM_JUSTA_CAUSA' | 'PEDIDO_DEMISSAO' | 'JUSTA_CAUSA' | 'ACORDO'>('SEM_JUSTA_CAUSA');
  const [dataDesligamento, setDataDesligamento] = useState<string>(new Date().toISOString().split('T')[0]);
  const [saldoFgts, setSaldoFgts] = useState<number>(0);

  const estimativa = useMemo(() => {
    return calcularEstimativaRescisao({
      salarioBase: funcionario.salario,
      dataAdmissao: funcionario.data_admissao,
      dataDesligamento: dataDesligamento,
      tipo: tipo,
      saldoFgtsEstimado: saldoFgts > 0 ? saldoFgts : undefined
    });
  }, [funcionario, dataDesligamento, tipo, saldoFgts]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const rescisao: RhRescisao = {
      id: crypto.randomUUID(),
      funcionario_id: funcionario.id,
      funcionario_nome: funcionario.nome_completo,
      data_desligamento: dataDesligamento,
      tipo: tipo,
      aviso_previo: estimativa.avisoPrevio,
      ferias_proporcionais: estimativa.feriasProporcionais + estimativa.tercoFeriasRescisao,
      decimo_proporcional: estimativa.decimoProporcional,
      multa_fgts: estimativa.multaFgts,
      saldo_salario: estimativa.saldoSalario,
      valor_total: estimativa.valorTotal,
      criado_em: new Date().toISOString()
    };

    onConfirmRescisao(rescisao);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-rose-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined">person_cancel</span>
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Desligamento de Funcionário</h3>
              <p className="text-xs text-slate-500 font-medium">{funcionario.nome_completo} • {funcionario.cargo}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all"
          >
            <i className="fa-solid fa-xmark text-base"></i>
          </button>
        </div>

        {/* Corpo do formulário & cálculo */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Tipo de Desligamento
              </label>
              <select
                value={tipo}
                onChange={e => setTipo(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="SEM_JUSTA_CAUSA">Demissão sem Justa Causa (Iniciativa da Empresa)</option>
                <option value="PEDIDO_DEMISSAO">Pedido de Demissão (Iniciativa do Empregado)</option>
                <option value="ACORDO">Acordo Mútuo (Art. 484-A CLT)</option>
                <option value="JUSTA_CAUSA">Demissão por Justa Causa</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Data do Desligamento
              </label>
              <input
                type="date"
                value={dataDesligamento}
                onChange={e => setDataDesligamento(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Salário Base</span>
              <span className="font-extrabold text-slate-800">R$ {funcionario.salario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Admissão</span>
              <span className="font-bold text-slate-800">{new Date(funcionario.data_admissao + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Aviso Prévio</span>
              <span className="font-bold text-slate-800">{estimativa.avisoPrevioDias} dias</span>
            </div>
          </div>

          {/* Discriminação da Rescisão */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 text-[11px] font-black text-slate-700 uppercase tracking-wider">
              Estimativa das Verbas Rescisórias
            </div>
            <div className="p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-700">
                <span>Saldo de Salário ({estimativa.diasSaldoSalario} dias):</span>
                <span className="font-bold">R$ {estimativa.saldoSalario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span>Aviso Prévio Indenizado:</span>
                <span className="font-bold">R$ {estimativa.avisoPrevio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span>13º Salário Proporcional ({estimativa.mesesDecimo}/12):</span>
                <span className="font-bold">R$ {estimativa.decimoProporcional.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span>Férias Proporcionais ({estimativa.mesesFerias}/12) + 1/3 Constitucional:</span>
                <span className="font-bold">R$ {(estimativa.feriasProporcionais + estimativa.tercoFeriasRescisao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              {estimativa.multaFgts > 0 && (
                <div className="flex justify-between items-center text-slate-700">
                  <span>Multa Rescisória do FGTS ({tipo === 'ACORDO' ? '20%' : '40%'}):</span>
                  <span className="font-bold text-rose-600">R$ {estimativa.multaFgts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm font-black">
                <span className="text-slate-900 uppercase">Total Líquido Estimado da Rescisão:</span>
                <span className="text-rose-700 text-base">R$ {estimativa.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 italic">
            * Ao confirmar, o colaborador será marcado com o status <strong>DESLIGADO</strong> no sistema e o registro de rescisão será arquivado para auditoria e controle financeiro.
          </p>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Cancelar
          </button>
          
          <button
            onClick={handleConfirm}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">check</span>
            <span>Confirmar e Desligar</span>
          </button>
        </div>

      </div>
    </div>
  );
};
