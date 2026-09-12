// components/rh/RhHoleriteModal.tsx
import React from 'react';
import { RhFolhaPagamento, RhFuncionario } from '../../types';

interface RhHoleriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  folha: RhFolhaPagamento;
  funcionario?: RhFuncionario;
}

export const RhHoleriteModal: React.FC<RhHoleriteModalProps> = ({ isOpen, onClose, folha, funcionario }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const competenciaDate = new Date(folha.competencia + 'T00:00:00');
  const mesAno = competenciaDate.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' });

  const proventos: { codigo: string; descricao: string; referencia: string; valor: number }[] = [];
  const descontos: { codigo: string; descricao: string; referencia: string; valor: number }[] = [];

  // Proventos
  if (folha.salario_base > 0) {
    proventos.push({ codigo: '001', descricao: 'Salário Base', referencia: '30D', valor: folha.salario_base });
  }
  if (folha.valor_horas_extras > 0) {
    proventos.push({ codigo: '002', descricao: 'Horas Extras 50%/100%', referencia: 'Variável', valor: folha.valor_horas_extras });
  }
  if (folha.terco_ferias > 0) {
    proventos.push({ codigo: '003', descricao: '1/3 Constitucional de Férias', referencia: '33.33%', valor: folha.terco_ferias });
  }

  // Descontos
  if (folha.desconto_inss > 0) {
    descontos.push({ codigo: '101', descricao: 'INSS Folha', referencia: 'Progressiva', valor: folha.desconto_inss });
  }
  if (folha.desconto_faltas_atrasos > 0) {
    descontos.push({ codigo: '102', descricao: 'Faltas e Atrasos', referencia: '-', valor: folha.desconto_faltas_atrasos });
  }
  if (folha.desconto_vale_transporte > 0) {
    descontos.push({ codigo: '103', descricao: 'Vale Transporte', referencia: '6%', valor: folha.desconto_vale_transporte });
  }
  if (folha.desconto_adiantamento > 0) {
    descontos.push({ codigo: '104', descricao: 'Adiantamento Salarial', referencia: 'Comp.', valor: folha.desconto_adiantamento });
  }

  const totalProventos = proventos.reduce((acc, p) => acc + p.valor, 0);
  const totalDescontos = descontos.reduce((acc, d) => acc + d.valor, 0);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabeçalho da Modal (Não impresso) */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined">receipt_long</span>
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Recibo de Pagamento (Holerite)</h3>
              <p className="text-xs text-slate-500 font-medium">Competência {mesAno} • {folha.funcionario_nome || funcionario?.nome_completo}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#001a54] hover:bg-[#001138] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">print</span>
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button 
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all"
            >
              <i className="fa-solid fa-xmark text-base"></i>
            </button>
          </div>
        </div>

        {/* Área do Holerite (Imprimível) */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-white print:p-0">
          <div className="border border-slate-400 p-6 rounded-xl font-sans text-slate-900 bg-white max-w-3xl mx-auto shadow-xs print:border-slate-600 print:shadow-none">
            
            {/* Header Empregador */}
            <div className="border-b border-slate-300 pb-3 mb-3 flex justify-between items-start">
              <div>
                <h4 className="font-black text-sm text-slate-900 tracking-wider">MULTIPLAN CORRETORA DE PLANOS DE SAÚDE</h4>
                <p className="text-[11px] text-slate-600 font-medium">CNPJ: 12.345.678/0001-90 • Endereço: Av. Comercial, 1000 - Sala 402</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 block text-slate-800">
                  RECIBO DE PAGAMENTO
                </span>
                <span className="text-xs font-bold text-slate-700 mt-1 block">MÊS/ANO: <strong>{mesAno}</strong></span>
              </div>
            </div>

            {/* Dados do Colaborador */}
            <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-4">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase block">Nome do Empregado</span>
                <span className="font-bold text-slate-900 truncate block">{folha.funcionario_nome || funcionario?.nome_completo || 'Colaborador'}</span>
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase block">CPF</span>
                <span className="font-bold text-slate-800">{folha.funcionario_cpf || funcionario?.cpf || '-'}</span>
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase block">Cargo / Função</span>
                <span className="font-bold text-slate-800">{folha.funcionario_cargo || funcionario?.cargo || 'Colaborador'}</span>
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase block">Data Admissão</span>
                <span className="font-bold text-slate-800">{funcionario?.data_admissao ? new Date(funcionario.data_admissao + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</span>
              </div>
            </div>

            {/* Tabela de Itens */}
            <div className="border border-slate-300 rounded-lg overflow-hidden mb-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-[10px] font-black text-slate-700 uppercase tracking-wider border-b border-slate-300">
                    <th className="p-2 w-16">CÓD.</th>
                    <th className="p-2">DESCRIÇÃO DA VERBA</th>
                    <th className="p-2 w-20 text-center">REF.</th>
                    <th className="p-2 w-28 text-right">PROVENTOS</th>
                    <th className="p-2 w-28 text-right">DESCONTOS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {proventos.map(p => (
                    <tr key={p.codigo} className="hover:bg-slate-50/50">
                      <td className="p-2 font-mono text-slate-500 text-[11px]">{p.codigo}</td>
                      <td className="p-2 font-bold text-slate-800">{p.descricao}</td>
                      <td className="p-2 text-center text-slate-600">{p.referencia}</td>
                      <td className="p-2 text-right font-bold text-emerald-700">R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="p-2 text-right text-slate-400">-</td>
                    </tr>
                  ))}
                  {descontos.map(d => (
                    <tr key={d.codigo} className="hover:bg-slate-50/50">
                      <td className="p-2 font-mono text-slate-500 text-[11px]">{d.codigo}</td>
                      <td className="p-2 font-bold text-slate-800">{d.descricao}</td>
                      <td className="p-2 text-center text-slate-600">{d.referencia}</td>
                      <td className="p-2 text-right text-slate-400">-</td>
                      <td className="p-2 text-right font-bold text-rose-700">R$ {d.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totais */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-300 mb-4 text-xs font-bold">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Total de Proventos</span>
                <span className="text-sm text-emerald-700">R$ {totalProventos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Total de Descontos</span>
                <span className="text-sm text-rose-700">R$ {totalDescontos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="bg-emerald-100/70 p-2 rounded-md border border-emerald-300 text-right">
                <span className="text-[10px] text-emerald-900 uppercase font-black block">VALOR LÍQUIDO A RECEBER</span>
                <span className="text-base font-black text-emerald-900">R$ {folha.valor_liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Bases de Cálculo Legais */}
            <div className="grid grid-cols-5 gap-2 border-t border-slate-200 pt-3 text-[10px] text-slate-600 mb-6">
              <div>
                <span className="font-bold block text-slate-400 uppercase">Salário Base</span>
                <span className="font-bold text-slate-800">R$ {folha.salario_base.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div>
                <span className="font-bold block text-slate-400 uppercase">Sal. Contrib. INSS</span>
                <span className="font-bold text-slate-800">R$ {(folha.salario_base + folha.valor_horas_extras).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div>
                <span className="font-bold block text-slate-400 uppercase">Base Cálc. FGTS</span>
                <span className="font-bold text-slate-800">R$ {(folha.salario_base + folha.valor_horas_extras).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div>
                <span className="font-bold block text-slate-400 uppercase">FGTS do Mês (8%)</span>
                <span className="font-bold text-blue-700">R$ {folha.fgts_depositado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div>
                <span className="font-bold block text-slate-400 uppercase">Status</span>
                <span className="font-bold text-slate-800">{folha.status === 'FECHADA' ? 'FECHADA & PAGA' : 'CALCULADA'}</span>
              </div>
            </div>

            {/* Canhoto de Assinatura */}
            <div className="border-t border-dashed border-slate-300 pt-4 text-xs text-slate-600 flex flex-col md:flex-row justify-between items-end gap-6">
              <p className="text-[10px] text-slate-500 max-w-sm">
                DECLARO TER RECEBIDO A IMPORTÂNCIA LÍQUIDA DISCRIMINADA NESTE RECIBO, NADA MAIS TENDO A RECLAMAR.
              </p>
              <div className="w-64 text-center">
                <div className="border-b border-slate-400 mb-1"></div>
                <span className="text-[10px] font-bold uppercase text-slate-700">Assinatura do Colaborador</span>
              </div>
            </div>

          </div>
        </div>

        {/* Rodapé da Modal (Não impresso) */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
