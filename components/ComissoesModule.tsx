import React, { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Upload, Download, FileSpreadsheet, Calculator, DollarSign, Wallet, CheckSquare, LayoutDashboard, Receipt, ArrowRightLeft, Building2, FileText, FileSignature, CheckCircle, Landmark, Users, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

function ComissoesPlaceholder() {
  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-6">Comissões</h2>
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-blue-950 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            Gestão de Comissões
          </CardTitle>
          <CardDescription>Visão geral e relatórios de comissões pagas e a pagar.</CardDescription>
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

function RemuneracaoPlaceholder() {
  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-6">Remuneração</h2>
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-blue-950 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-600" />
            Políticas de Remuneração
          </CardTitle>
          <CardDescription>Configuração de grades, percentuais e regras por operadora e cargo.</CardDescription>
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

export default function ComissoesModule() {
  const [activeTab, setActiveTab] = useState("calculo");

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
        {activeTab === 'comissoes' && <ComissoesPlaceholder />}
        {activeTab === 'remuneracao' && <RemuneracaoPlaceholder />}
        {activeTab === 'calculo' && <CalculoComissoes />}
        {activeTab === 'acerto' && <AcertoComissoesPlaceholder />}
      </div>
    </div>
  );
}
