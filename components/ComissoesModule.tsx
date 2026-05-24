import React, { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Upload, Download, FileSpreadsheet, Calculator, DollarSign, Wallet, CheckSquare, LayoutDashboard, Receipt, ArrowRightLeft, Building2, FileText, FileSignature, CheckCircle, Landmark, Users, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Proposal, ProposalRequirement } from '../types';
import { calculateCommission, SaleRecord, CommissionResult } from "@/lib/commission";

function CalculoComissoes() {
  const [results, setResults] = useState<CommissionResult[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      const parsedData: SaleRecord[] = data.map((row) => ({
        corretor: row["Corretor"] || row["Nome do Corretor"] || "Desconhecido",
        cargo: row["Cargo"] || "Trainee",
        operadora: row["Operadora"] || "Outros",
        vidasTotais: Number(row["Vidas no Mes"]) || Number(row["Vidas Totais"]) || 1,
        vidasContrato: Number(row["Vidas no Contrato"]) || 1,
        idade: Number(row["Idade"]) || 30,
        premioMensal: Number(row["Premio Mensal"]) || Number(row["Premio"]) || 0,
        parcela: Number(row["Parcela"]) || 1,
        valorParcela: Number(row["Valor da Parcela"]) || Number(row["Valor Pago"]) || 0,
      }));

      const calculated = parsedData.map(calculateCommission);
      setResults(calculated);
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        "Corretor": "João Silva",
        "Cargo": "Pleno",
        "Operadora": "Hapvida Individual",
        "Vidas no Mes": 10,
        "Vidas no Contrato": 2,
        "Idade": 35,
        "Premio Mensal": 1500,
        "Parcela": 1,
        "Valor da Parcela": 1500,
      },
      {
        "Corretor": "Maria Santos",
        "Cargo": "Master",
        "Operadora": "Bradesco Saúde",
        "Vidas no Mes": 30,
        "Vidas no Contrato": 15,
        "Idade": 40,
        "Premio Mensal": 8000,
        "Parcela": 2,
        "Valor da Parcela": 8000,
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
    saveAs(data, "template_comissoes.xlsx");
  };

  const exportResults = () => {
    if (results.length === 0) return;

    const exportData = results.map(r => ({
      "Corretor": r.corretor,
      "Cargo": r.cargo,
      "Operadora": r.operadora,
      "Parcela": r.parcela,
      "Valor da Parcela": r.valorParcela,
      "% Aplicado": `${r.percentualAplicado}%`,
      "Valor Comissão Bruta": r.valorComissao,
      "Imposto Retido": r.impostoRetido,
      "Valor Líquido": r.valorLiquido,
      "Observação": r.observacao
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resultados");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
    saveAs(data, "resultados_comissoes.xlsx");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Cálculo de Comissões</h2>
          <p className="text-slate-500 mt-1">Importe a planilha de vendas para calcular as comissões automaticamente.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={downloadTemplate}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Baixar Template
          </Button>
          <Button onClick={exportResults} disabled={results.length === 0} className="bg-blue-900 hover:bg-blue-800">
            <Download className="w-4 h-4 mr-2" />
            Exportar Resultados
          </Button>
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-blue-950">Importar Dados</CardTitle>
            <CardDescription>Faça upload da planilha preenchida.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg p-6 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-blue-900 mb-3" />
              <p className="text-sm font-medium text-slate-700 text-center">
                {fileName ? fileName : "Clique ou arraste o arquivo Excel"}
              </p>
              <p className="text-xs text-slate-500 mt-1">.xlsx ou .xls</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-blue-950">Resumo do Cálculo</CardTitle>
            <CardDescription>Visão geral das comissões processadas.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Total de Vendas</p>
                <p className="text-2xl font-bold mt-1 text-slate-800">{results.length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Comissão Bruta Total</p>
                <p className="text-2xl font-bold mt-1 text-blue-600">
                  {formatCurrency(results.reduce((acc, curr) => acc + curr.valorComissao, 0))}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Comissão Líquida Total</p>
                <p className="text-2xl font-bold mt-1 text-emerald-600">
                  {formatCurrency(results.reduce((acc, curr) => acc + curr.valorLiquido, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {results.length > 0 && (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <CardTitle className="text-lg text-blue-950">Resultados Detalhados</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">Corretor</TableHead>
                  <TableHead className="font-semibold text-slate-700">Cargo</TableHead>
                  <TableHead className="font-semibold text-slate-700">Operadora</TableHead>
                  <TableHead className="font-semibold text-slate-700">Parcela</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Valor Parcela</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">% Aplicado</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Comissão Bruta</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Imposto</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Líquido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r, i) => (
                  <TableRow key={i} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium text-slate-800">{r.corretor}</TableCell>
                    <TableCell className="text-slate-600">{r.cargo}</TableCell>
                    <TableCell className="text-slate-600">{r.operadora}</TableCell>
                    <TableCell className="text-slate-600">{r.parcela}ª</TableCell>
                    <TableCell className="text-right text-slate-600">{formatCurrency(r.valorParcela)}</TableCell>
                    <TableCell className="text-right text-slate-600">{r.percentualAplicado}%</TableCell>
                    <TableCell className="text-right text-slate-600">{formatCurrency(r.valorComissao)}</TableCell>
                    <TableCell className="text-right text-red-500">-{formatCurrency(r.impostoRetido)}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-600">{formatCurrency(r.valorLiquido)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ComissoesView({ proposals, onUpdateProposal }: { proposals: Proposal[], onUpdateProposal: (p: Proposal) => void }) {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');

  // Only show proposals that are PAGO
  const paidProposals = proposals.filter(p => p.status === 'PAGO');

  const handleImport = () => {
    if (!importText.trim()) return;
    
    const lines = importText.split('\n');
    let updatedCount = 0;

    // We can group updates by proposal ID first, so we call onUpdateProposal fewer times or correctly
    const updatesById: Record<string, Proposal> = {};

    lines.forEach(line => {
      // separator can be tab or semicolon
      const parts = line.split(/[\t;]/).map(p => p.trim());
      if (parts.length >= 4) {
        let contrato = parts[0];
        let operadora = parts[1];
        let nome = parts[2];
        let parcela = parseInt(parts[3], 10);
        let valorRecebido = parts.length > 4 ? parseFloat(parts[4].replace(',', '.')) : 0;
        
        // Find by Contrato and Operadora
        const prop = proposals.find(p => p.contrato === contrato && p.operadora?.toUpperCase() === operadora.toUpperCase());
        if (prop && !isNaN(parcela)) {
          const pid = prop.id;
          if (!updatesById[pid]) {
            updatesById[pid] = { ...prop };
          }
          updatesById[pid].parcelas_status = {
            ...(updatesById[pid].parcelas_status || {}),
            [parcela]: 'PAGO'
          };
          // Accumulate received value for this parcel
          const currentReceivedValue = updatesById[pid].parcelas_valores?.[parcela] || 0;
          updatesById[pid].parcelas_valores = {
            ...(updatesById[pid].parcelas_valores || {}),
            [parcela]: currentReceivedValue + valorRecebido
          };
          updatedCount++;
        }
      }
    });

    Object.values(updatesById).forEach(updatedProp => {
      onUpdateProposal(updatedProp);
    });

    setIsImportModalOpen(false);
    setImportText('');
    alert(`${updatedCount} parcelas processadas com sucesso!`);
  };

  const toggleParcela = (proposal: Proposal, parcelaIndex: number) => {
    const currentStatus = proposal.parcelas_status?.[parcelaIndex];
    let newStatus: 'PENDENTE' | 'PAGO' = 'PAGO';
    if (currentStatus === 'PAGO') {
      newStatus = 'PENDENTE';
    }

    onUpdateProposal({
      ...proposal,
      parcelas_status: {
        ...(proposal.parcelas_status || {}),
        [parcelaIndex]: newStatus
      }
    });
  };

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-6">Comissões (Acompanhamento)</h2>
      <Card className="border-slate-200 shadow-sm w-full overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="space-y-1">
            <CardTitle className="text-blue-950 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              Gestão de Comissões e Parcelas
            </CardTitle>
            <CardDescription>Acompanhamento das 20 parcelas, com base nos contratos pagos.</CardDescription>
          </div>
          <Button onClick={() => setIsImportModalOpen(true)} className="bg-sky-600 hover:bg-sky-700 text-white shadow-sm gap-2">
            <i className="fa-solid fa-file-import"></i>
            Importar Relatório
          </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto w-full custom-scrollbar">
          <div className="min-w-max pb-4">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700 min-w-[120px] sticky left-0 bg-slate-50 z-10 shadow-[1px_0_0_0_#e2e8f0]">Contrato</TableHead>
                  <TableHead className="font-semibold text-slate-700 min-w-[200px]">Cliente</TableHead>
                  <TableHead className="font-semibold text-slate-700 min-w-[150px]">Corretor</TableHead>
                  <TableHead className="font-semibold text-slate-700 min-w-[150px]">Operadora</TableHead>
                  {Array.from({ length: 20 }).map((_, i) => (
                    <TableHead key={i} className="font-semibold text-slate-700 text-center text-xs min-w-[80px]">
                      {i + 1}ª
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paidProposals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={24} className="text-center py-8 text-slate-500">
                      Nenhuma proposta com status "PAGO".
                    </TableCell>
                  </TableRow>
                ) : (
                  paidProposals.map((p) => (
                    <TableRow key={p.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-bold text-slate-800 sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[1px_0_0_0_#e2e8f0]">{p.contrato}</TableCell>
                      <TableCell className="font-medium text-slate-600">{p.cliente}</TableCell>
                      <TableCell className="text-slate-600">{p.corretor}</TableCell>
                      <TableCell className="text-slate-600">
                        {p.operadora}
                        {p.detalhes?.proposta?.pagamentoCartao && (
                          <div className="text-[8px] font-black uppercase tracking-widest bg-orange-100 text-orange-700 px-1 py-0.5 rounded border border-orange-200 mt-1 inline-block">
                            💳 Cartão Corretora
                          </div>
                        )}
                      </TableCell>
                      {Array.from({ length: 20 }).map((_, i) => {
                        const status = p.parcelas_status?.[i + 1] || 'PENDENTE';
                        const isAdiantamento = i === 0;
                        const isPago = status === 'PAGO';

                        let bgColor = "bg-slate-100 hover:bg-slate-200 border-slate-200 text-transparent";
                        let iconColor = "";
                        
                        if (isPago) {
                          if (isAdiantamento) {
                            bgColor = "bg-yellow-400 hover:bg-yellow-500 border-yellow-500 text-white shadow-sm";
                            iconColor = "text-white";
                          } else {
                            bgColor = "bg-emerald-500 hover:bg-emerald-600 border-emerald-600 text-white shadow-sm";
                            iconColor = "text-white";
                          }
                        }

                        return (
                          <TableCell key={i} className="text-center p-2 border-l border-slate-100">
                            <button
                              onClick={() => toggleParcela(p, i + 1)}
                              title={isPago ? "Marcar como Pendente" : isAdiantamento ? "Marcar Pagamento Adiantamento" : "Marcar como Pago"}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border ${bgColor} mx-auto`}
                            >
                              {isPago ? <CheckSquare className={`w-4 h-4 ${iconColor}`} /> : null}
                            </button>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Importar Relatório da Operadora</h2>
                <p className="text-sm text-slate-500 mt-1">Cole os dados para atualizar as parcelas automaticamente</p>
              </div>
              <button 
                onClick={() => setIsImportModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                title="Fechar"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                  <i className="fa-solid fa-circle-info"></i> Formato Esperado
                </h4>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Cada linha deve conter Número do Contrato, Operadora, Nome do Cliente/Beneficiário, Número da Parcela e (Opcional) Valor Recebido. Separados por ponto e vírgula ou tabulação.<br/><br/>
                  <strong className="font-mono bg-blue-100 px-1 py-0.5 rounded">Exemplo:</strong><br/>
                  <span className="font-mono text-blue-600 bg-white px-2 py-1 inline-block mt-1 rounded border border-blue-100 w-full">73678421; SULAMERICA; RUAN FERNANDES; 2; 1500.00</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Dados do Relatório
                </label>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all font-mono min-h-[150px]"
                  placeholder="Cole os dados aqui..."
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                ></textarea>
              </div>
            </div>

            <div className="border-t border-slate-100 p-4 bg-slate-50 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsImportModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" className="bg-sky-600 hover:bg-sky-700 text-white" onClick={handleImport}>
                Processar Importação
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RemuneracaoView({ proposals, onUpdateProposal, requirements }: { proposals: Proposal[], onUpdateProposal: (p: Proposal) => void, requirements: ProposalRequirement[] }) {
  // Find all parcels that are PAGO by operadora but not repassadas to corretor
  const pendingParcels: { proposal: Proposal; parcelaIndex: number; percentual: number; valorPagar: number }[] = [];
  
  const percentuaisConf = requirements.filter(r => r.tipo === 'PERCENTUAL_COMISSAO');

  proposals.forEach(p => {
    if (p.status !== 'PAGO' || !p.parcelas_status) return;
    
    // Check up to 20 parcels
    for (let i = 1; i <= 20; i++) {
      if (p.parcelas_status[i] === 'PAGO' && p.parcelas_repassadas?.[i] !== 'PAGO') {
        
        // Find percentual: match parcela, corretor, operadora
        const strParcela = `${i}ª_PARCELA`;
        const match = percentuaisConf.find(r => r.nome.startsWith(`${strParcela} - ${p.corretor.toUpperCase()} - ${p.operadora.toUpperCase()} - `)) ||
                      percentuaisConf.find(r => r.nome.startsWith(`${strParcela} - TODOS - ${p.operadora.toUpperCase()} - `)) ||
                      percentuaisConf.find(r => r.nome.startsWith(`${strParcela} - ${p.corretor.toUpperCase()} - TODAS - `)) ||
                      percentuaisConf.find(r => r.nome.startsWith(`${strParcela} - TODOS - TODAS - `)) ||
                      percentuaisConf.find(r => r.nome.startsWith(`TODAS - ${p.corretor.toUpperCase()} - ${p.operadora.toUpperCase()} - `)) ||
                      percentuaisConf.find(r => r.nome.startsWith(`TODAS - TODOS - ${p.operadora.toUpperCase()} - `)) ||
                      percentuaisConf.find(r => r.nome.startsWith(`TODAS - ${p.corretor.toUpperCase()} - TODAS - `)) ||
                      percentuaisConf.find(r => r.nome.startsWith(`TODAS - TODOS - TODAS - `));
        
        let pct = 0;
        if (match) {
          pct = parseFloat(match.nome.split(' - ')[3]) || 0;
        }

        const valorBase = p.parcelas_valores?.[i] || p.valor; // Use received value if available, fallback to total contract value
        const valorPagar = (p.detalhes?.proposta?.pagamentoCartao && i === 1) ? 0 : valorBase * (pct / 100);

        pendingParcels.push({
          proposal: p,
          parcelaIndex: i,
          percentual: pct,
          valorPagar: valorPagar
        });
      }
    }
  });

  const groupedByCorretor = pendingParcels.reduce((acc, curr) => {
    const corr = curr.proposal.corretor || 'Sem Corretor';
    if (!acc[corr]) acc[corr] = [];
    acc[corr].push(curr);
    return acc;
  }, {} as Record<string, typeof pendingParcels>);

  const handlePagarCorretor = (corretor: string) => {
    const toPay = groupedByCorretor[corretor] || [];
    if (toPay.length === 0) return;

    // Group updates by proposal ID
    const updatesById: Record<string, Proposal> = {};
    
    toPay.forEach(item => {
      const pid = item.proposal.id;
      if (!updatesById[pid]) {
        updatesById[pid] = { ...item.proposal };
      }
      updatesById[pid].parcelas_repassadas = {
        ...(updatesById[pid].parcelas_repassadas || {}),
        [item.parcelaIndex]: 'PAGO'
      };
    });

    Object.values(updatesById).forEach(updatedProp => {
      onUpdateProposal(updatedProp);
    });
    
    alert(`Pagamento das parcelas gerado com sucesso para ${corretor}!`);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-6">Remuneração (Aguardando Geração)</h2>
      
      <div className="space-y-4">
        {Object.keys(groupedByCorretor).length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center">
              <i className="fa-solid fa-folder-open text-4xl text-slate-200 mb-3"></i>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhum repasse aguardando</p>
            </div>
        ) : (
          Object.entries(groupedByCorretor).map(([corretor, parcels]) => {
            const totalPagar = parcels.reduce((acc, p) => acc + p.valorPagar, 0);
            return (
              <div key={corretor} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase">{corretor}</h3>
                    <p className="text-xs text-slate-500 font-bold">{parcels.length} {parcels.length === 1 ? 'parcela pendente' : 'parcelas pendentes'}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Total a Pagar</p>
                      <p className="text-lg font-black text-emerald-600 leading-none">R$ {totalPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <button 
                      onClick={() => handlePagarCorretor(corretor)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase tracking-widest py-3 px-6 rounded-xl transition-all shadow-lg flex items-center gap-2"
                    >
                      <i className="fa-solid fa-check"></i> Marcar como Pago
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contrato</th>
                        <th className="py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                        <th className="py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operadora</th>
                        <th className="py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Parcela</th>
                        <th className="py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor Base</th>
                        <th className="py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">% Corretor</th>
                        <th className="py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Repasse</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parcels.map((parcel, idx) => (
                        <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                          <td className="py-2 text-xs font-bold text-slate-800">{parcel.proposal.contrato}</td>
                          <td className="py-2 text-xs text-slate-600">{parcel.proposal.cliente}</td>
                          <td className="py-2 text-xs text-slate-600">
                            {parcel.proposal.operadora}
                            {parcel.proposal.detalhes?.proposta?.pagamentoCartao && (
                               <div className="text-[8px] font-black uppercase tracking-widest bg-orange-100 text-orange-700 px-1 py-0.5 rounded border border-orange-200 mt-1 inline-block">
                                 💳 Cartão Corretora
                               </div>
                            )}
                          </td>
                          <td className="py-2 text-xs font-bold text-slate-600 text-center">{parcel.parcelaIndex}ª</td>
                          <td className="py-2 text-xs font-medium text-slate-600 text-right">R$ {(parcel.proposal.parcelas_valores?.[parcel.parcelaIndex] || parcel.proposal.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="py-2 text-xs font-bold text-sky-600 text-right">{parcel.percentual}%</td>
                          <td className="py-2 text-xs font-black text-emerald-600 text-right">R$ {parcel.valorPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function AcertoComissoesPlaceholder() {
  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-6">Acerto de Comissões</h2>
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-blue-950 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            Conciliação e Acertos
          </CardTitle>
          <CardDescription>Auditoria, estornos e conciliação de pagamentos com as operadoras.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
            <p className="text-slate-500 font-medium">Módulo em desenvolvimento</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ComissoesModule({ proposals = [], onUpdateProposal = () => {}, requirements = [] }: { proposals?: Proposal[], onUpdateProposal?: (p: Proposal) => void, requirements?: ProposalRequirement[] }) {
  const [activeTab, setActiveTab] = useState("comissoes");

  return (
    <div className="flex flex-col w-full h-full">
      {/* Sub Navigation for the new modules */}
      <div className="bg-white border-b border-slate-200 px-6 flex gap-1 overflow-x-auto mb-6 rounded-t-xl shadow-sm">
        <button 
          onClick={() => setActiveTab('comissoes')} 
          className={`py-3 px-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'comissoes' ? 'border-blue-600 text-blue-700 bg-slate-50' : 'border-transparent text-slate-600 hover:text-blue-600 hover:bg-slate-50'}`}
        >
          <DollarSign className="w-4 h-4" />
          Comissões
        </button>
        <button 
          onClick={() => setActiveTab('remuneracao')} 
          className={`py-3 px-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'remuneracao' ? 'border-blue-600 text-blue-700 bg-slate-50' : 'border-transparent text-slate-600 hover:text-blue-600 hover:bg-slate-50'}`}
        >
          <Wallet className="w-4 h-4" />
          Remuneração
        </button>
        <button 
          onClick={() => setActiveTab('calculo')} 
          className={`py-3 px-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'calculo' ? 'border-blue-600 text-blue-700 bg-slate-50' : 'border-transparent text-slate-600 hover:text-blue-600 hover:bg-slate-50'}`}
        >
          <Calculator className="w-4 h-4" />
          Cálculo de Comissões
        </button>
        <button 
          onClick={() => setActiveTab('acerto')} 
          className={`py-3 px-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'acerto' ? 'border-blue-600 text-blue-700 bg-slate-50' : 'border-transparent text-slate-600 hover:text-blue-600 hover:bg-slate-50'}`}
        >
          <CheckSquare className="w-4 h-4" />
          Acerto de Comissões
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full">
        {activeTab === 'comissoes' && <ComissoesView proposals={proposals} onUpdateProposal={onUpdateProposal} />}
        {activeTab === 'remuneracao' && <RemuneracaoView proposals={proposals} onUpdateProposal={onUpdateProposal} requirements={requirements} />}
        {activeTab === 'calculo' && <CalculoComissoes />}
        {activeTab === 'acerto' && <AcertoComissoesPlaceholder />}
      </div>
    </div>
  );
}
