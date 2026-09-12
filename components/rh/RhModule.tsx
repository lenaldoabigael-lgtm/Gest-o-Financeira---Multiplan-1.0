// components/rh/RhModule.tsx
import React, { useState, useEffect } from 'react';
import { 
  User, 
  RhFuncionario, 
  RhEstagiario, 
  RhDemanda, 
  RhVaga, 
  RhFolhaPagamento as FolhaType, 
  RhFerias, 
  RhAdiantamento, 
  RhRescisao,
  Transaction
} from '../../types';
import { supabase } from '../../lib/supabase';
import { RhInicio } from './RhInicio';
import { RhFuncionarios } from './RhFuncionarios';
import { RhEstagiarios } from './RhEstagiarios';
import { RhDemandas } from './RhDemandas';
import { RhVagas } from './RhVagas';
import { RhFolhaPagamento } from './RhFolhaPagamento';
import { RhSqlScriptModal } from './RhSqlScriptModal';

interface RhModuleProps {
  user: User;
  onAddTransaction?: (transaction: Omit<Transaction, 'id'>) => void;
}

// Initial Demo/Seed Data
const SEED_FUNCIONARIOS: RhFuncionario[] = [
  {
    id: 'f-1',
    nome_completo: 'Carlos Eduardo Mendes',
    cpf: '123.456.789-00',
    rg: '2005001234-5',
    data_nascimento: '1988-04-12',
    telefone: '(85) 99876-5432',
    email: 'carlos.mendes@multiplan.com',
    cargo: 'Analista Comercial Sênior',
    setor: 'Comercial',
    data_admissao: '2023-03-15',
    salario: 3850.00,
    jornada: '44h semanais',
    banco: 'Santander',
    agencia: '0450',
    conta: '12345-6',
    tipo_conta: 'CORRENTE',
    status: 'ATIVO',
    dependentes: [
      { id: 'd-1', nome: 'Lucas Mendes', parentesco: 'FILHO(A)', data_nascimento: '2018-09-20' }
    ]
  },
  {
    id: 'f-2',
    nome_completo: 'Juliana Cavalcante Rocha',
    cpf: '234.567.890-11',
    rg: '2008009876-2',
    data_nascimento: '1992-11-05',
    telefone: '(85) 98765-4321',
    email: 'juliana.rocha@multiplan.com',
    cargo: 'Gerente Comercial de Saúde',
    setor: 'Comercial',
    data_admissao: '2022-08-01',
    salario: 6200.00,
    jornada: '44h semanais',
    banco: 'Nubank',
    agencia: '0001',
    conta: '9876543-2',
    tipo_conta: 'CORRENTE',
    status: 'ATIVO',
    dependentes: []
  },
  {
    id: 'f-3',
    nome_completo: 'Mariana Albuquerque Dias',
    cpf: '345.678.901-22',
    rg: '2012004567-8',
    data_nascimento: '1995-07-19',
    telefone: '(85) 99123-4567',
    email: 'mariana.dias@multiplan.com',
    cargo: 'Assistente Administrativo & DP',
    setor: 'Administrativo / RH',
    data_admissao: '2024-01-10',
    salario: 2400.00,
    jornada: '44h semanais',
    banco: 'Bradesco',
    agencia: '1289',
    conta: '54321-0',
    tipo_conta: 'CORRENTE',
    status: 'ATIVO',
    dependentes: []
  }
];

const SEED_ESTAGIARIOS: RhEstagiario[] = [
  {
    id: 'e-1',
    nome_completo: 'Felipe Santana Lima',
    cpf: '456.789.012-33',
    data_nascimento: '2002-05-14',
    telefone: '(85) 98888-7777',
    email: 'felipe.lima@unifor.br',
    instituicao_ensino: 'Universidade de Fortaleza (UNIFOR)',
    curso: 'Administração de Empresas',
    previsao_termino: '2026-11-30',
    valor_bolsa: 1300.00,
    supervisor: 'Juliana Cavalcante Rocha',
    data_inicio: '2024-06-01',
    status: 'ATIVO'
  }
];

const SEED_DEMANDAS: RhDemanda[] = [
  {
    id: 'dem-1',
    tipo: 'EXAME_ADMISSIONAL',
    descricao: 'Realizar ASO Admissional do novo corretor interno',
    status: 'PENDENTE',
    data_prevista: new Date().toISOString().split('T')[0],
    funcionario_nome: 'Marcos Paulo Silva'
  },
  {
    id: 'dem-2',
    tipo: 'CONTRATO',
    descricao: 'Coletar assinatura digital no contrato de trabalho CLT',
    status: 'PENDENTE',
    data_prevista: new Date().toISOString().split('T')[0],
    funcionario_nome: 'Marcos Paulo Silva'
  }
];

const SEED_VAGAS: RhVaga[] = [
  {
    id: 'v-1',
    cargo: 'Consultor de Planos de Saúde PME',
    area: 'Comercial',
    tipo: 'CLT',
    status: 'ABERTA',
    data_abertura: '2026-09-01',
    observacoes: 'Experiência prévia em cotações e vendas PME Hapvida e Amil.'
  },
  {
    id: 'v-2',
    cargo: 'Estagiário de Atendimento & Suporte',
    area: 'Atendimento',
    tipo: 'ESTAGIO',
    status: 'EM_PROCESSO',
    data_abertura: '2026-09-05',
    observacoes: 'Cursando Administração ou Marketing.'
  }
];

const SEED_FERIAS: RhFerias[] = [
  {
    id: 'fer-1',
    funcionario_id: 'f-2',
    funcionario_nome: 'Juliana Cavalcante Rocha',
    periodo_aquisitivo_inicio: '2023-08-01',
    periodo_aquisitivo_fim: '2024-07-31',
    terco_constitucional: 2066.66,
    status: 'A_VENCER'
  }
];

export const RhModule: React.FC<RhModuleProps> = ({ user, onAddTransaction }) => {
  const [activeSubTab, setActiveSubTab] = useState<'inicio' | 'funcionarios' | 'estagiarios' | 'demandas' | 'vagas' | 'folha'>('inicio');
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);

  // States
  const [funcionarios, setFuncionarios] = useState<RhFuncionario[]>(() => {
    const saved = localStorage.getItem('rh_funcionarios');
    return saved ? JSON.parse(saved) : SEED_FUNCIONARIOS;
  });

  const [estagiarios, setEstagiarios] = useState<RhEstagiario[]>(() => {
    const saved = localStorage.getItem('rh_estagiarios');
    return saved ? JSON.parse(saved) : SEED_ESTAGIARIOS;
  });

  const [demandas, setDemandas] = useState<RhDemanda[]>(() => {
    const saved = localStorage.getItem('rh_demandas');
    return saved ? JSON.parse(saved) : SEED_DEMANDAS;
  });

  const [vagas, setVagas] = useState<RhVaga[]>(() => {
    const saved = localStorage.getItem('rh_vagas');
    return saved ? JSON.parse(saved) : SEED_VAGAS;
  });

  const [folhas, setFolhas] = useState<FolhaType[]>(() => {
    const saved = localStorage.getItem('rh_folha_pagamento');
    return saved ? JSON.parse(saved) : [];
  });

  const [adiantamentos, setAdiantamentos] = useState<RhAdiantamento[]>(() => {
    const saved = localStorage.getItem('rh_adiantamentos');
    return saved ? JSON.parse(saved) : [];
  });

  const [ferias, setFerias] = useState<RhFerias[]>(() => {
    const saved = localStorage.getItem('rh_ferias');
    return saved ? JSON.parse(saved) : SEED_FERIAS;
  });

  const [rescisoes, setRescisoes] = useState<RhRescisao[]>(() => {
    const saved = localStorage.getItem('rh_rescisoes');
    return saved ? JSON.parse(saved) : [];
  });

  // Salvar no LocalStorage como persistência local garantida
  useEffect(() => {
    localStorage.setItem('rh_funcionarios', JSON.stringify(funcionarios));
  }, [funcionarios]);

  useEffect(() => {
    localStorage.setItem('rh_estagiarios', JSON.stringify(estagiarios));
  }, [estagiarios]);

  useEffect(() => {
    localStorage.setItem('rh_demandas', JSON.stringify(demandas));
  }, [demandas]);

  useEffect(() => {
    localStorage.setItem('rh_vagas', JSON.stringify(vagas));
  }, [vagas]);

  useEffect(() => {
    localStorage.setItem('rh_folha_pagamento', JSON.stringify(folhas));
  }, [folhas]);

  useEffect(() => {
    localStorage.setItem('rh_adiantamentos', JSON.stringify(adiantamentos));
  }, [adiantamentos]);

  useEffect(() => {
    localStorage.setItem('rh_ferias', JSON.stringify(ferias));
  }, [ferias]);

  useEffect(() => {
    localStorage.setItem('rh_rescisoes', JSON.stringify(rescisoes));
  }, [rescisoes]);

  // Carregar do Supabase se tabelas existirem
  useEffect(() => {
    const carregarDadosSupabase = async () => {
      try {
        const { data: dbFuncs, error: errFuncs } = await supabase.from('rh_funcionarios').select('*, dependentes:rh_dependentes(*)');
        if (!errFuncs && dbFuncs && dbFuncs.length > 0) {
          setFuncionarios(dbFuncs);
        }

        const { data: dbEst, error: errEst } = await supabase.from('rh_estagiarios').select('*');
        if (!errEst && dbEst && dbEst.length > 0) {
          setEstagiarios(dbEst);
        }

        const { data: dbDem, error: errDem } = await supabase.from('rh_demandas').select('*');
        if (!errDem && dbDem && dbDem.length > 0) {
          setDemandas(dbDem);
        }

        const { data: dbVagas, error: errVagas } = await supabase.from('rh_vagas').select('*');
        if (!errVagas && dbVagas && dbVagas.length > 0) {
          setVagas(dbVagas);
        }

        const { data: dbFolha, error: errFolha } = await supabase.from('rh_folha_pagamento').select('*');
        if (!errFolha && dbFolha && dbFolha.length > 0) {
          setFolhas(dbFolha);
        }
      } catch (e) {
        console.info('Supabase RH tabelas não prontas ou sem conexão, usando armazenamento local sincronizado.');
      }
    };

    carregarDadosSupabase();
  }, []);

  // Handlers para Funcionários
  const handleSaveFuncionario = async (func: RhFuncionario, isNew: boolean) => {
    if (isNew) {
      setFuncionarios(prev => [func, ...prev]);

      // Ao criar novo funcionário, gera automaticamente o checklist de admissão
      const checklistNovo: RhDemanda[] = [
        {
          id: crypto.randomUUID(),
          funcionario_id: func.id,
          funcionario_nome: func.nome_completo,
          tipo: 'EXAME_ADMISSIONAL',
          descricao: `Agendar e coletar ASO Admissional de ${func.nome_completo}`,
          status: 'PENDENTE',
          data_prevista: func.data_admissao,
          criado_em: new Date().toISOString()
        },
        {
          id: crypto.randomUUID(),
          funcionario_id: func.id,
          funcionario_nome: func.nome_completo,
          tipo: 'CONTRATO',
          descricao: `Colher assinatura do contrato de trabalho e termos de ${func.nome_completo}`,
          status: 'PENDENTE',
          data_prevista: func.data_admissao,
          criado_em: new Date().toISOString()
        },
        {
          id: crypto.randomUUID(),
          funcionario_id: func.id,
          funcionario_nome: func.nome_completo,
          tipo: 'DOCUMENTACAO',
          descricao: `Validar cópia de CTPS, CPF e comprovante bancário de ${func.nome_completo}`,
          status: 'PENDENTE',
          data_prevista: func.data_admissao,
          criado_em: new Date().toISOString()
        }
      ];

      setDemandas(prev => [...checklistNovo, ...prev]);
    } else {
      setFuncionarios(prev => prev.map(f => f.id === func.id ? func : f));
    }

    // Tentar persistir no Supabase
    try {
      const { dependentes, ...funcSemDep } = func;
      await supabase.from('rh_funcionarios').upsert(funcSemDep);
      if (dependentes && dependentes.length > 0) {
        const depsToSave = dependentes.map(d => ({ ...d, funcionario_id: func.id }));
        await supabase.from('rh_dependentes').upsert(depsToSave);
      }
    } catch (err) {
      console.info('Salvo localmente.');
    }
  };

  // Desligar Funcionário com Rescisão
  const handleDesligarFuncionario = async (rescisao: RhRescisao) => {
    setRescisoes(prev => [rescisao, ...prev]);
    
    // Atualizar funcionário para DESLIGADO
    setFuncionarios(prev => prev.map(f => {
      if (f.id === rescisao.funcionario_id) {
        return {
          ...f,
          status: 'DESLIGADO',
          data_desligamento: rescisao.data_desligamento
        };
      }
      return f;
    }));

    // Gerar lançamento no Financeiro (Contas a Pagar) se houver handler
    if (onAddTransaction && rescisao.valor_total > 0) {
      onAddTransaction({
        type: 'PAGAR',
        vencimento: rescisao.data_desligamento,
        descricao: `Rescisão Contratual CLT - ${rescisao.funcionario_nome} (${rescisao.tipo.replace('_', ' ')})`,
        valor: rescisao.valor_total,
        formaPagamento: 'TRANSFERENCIA',
        status: 'PENDENTE',
        centroCusto: 'RH / Folha de Pagamento',
        subItem: 'Rescisões Trabalhistas',
        cliente: `Rescisão ID: ${rescisao.id}`
      });
    }

    try {
      await supabase.from('rh_rescisoes').insert([rescisao]);
      await supabase.from('rh_funcionarios').update({ 
        status: 'DESLIGADO', 
        data_desligamento: rescisao.data_desligamento 
      }).eq('id', rescisao.funcionario_id);
    } catch (e) {
      console.info('Rescisão gravada.');
    }
  };

  // Handlers para Estagiários
  const handleSaveEstagiario = async (est: RhEstagiario, isNew: boolean) => {
    if (isNew) {
      setEstagiarios(prev => [est, ...prev]);
    } else {
      setEstagiarios(prev => prev.map(e => e.id === est.id ? est : e));
    }

    try {
      await supabase.from('rh_estagiarios').upsert(est);
    } catch (e) {
      console.info('Salvo localmente.');
    }
  };

  // Efetivar estagiário como CLT
  const handleEfetivarEstagiario = (est: RhEstagiario) => {
    setActiveSubTab('funcionarios');
  };

  // Handlers para Demandas
  const handleSaveDemanda = async (demanda: RhDemanda, isNew: boolean) => {
    if (isNew) {
      setDemandas(prev => [demanda, ...prev]);
    } else {
      setDemandas(prev => prev.map(d => d.id === demanda.id ? demanda : d));
    }

    try {
      await supabase.from('rh_demandas').upsert(demanda);
    } catch (e) {
      console.info('Salvo localmente.');
    }
  };

  const handleToggleStatusDemanda = (id: string) => {
    setDemandas(prev => prev.map(d => {
      if (d.id === id) {
        const novoStatus = d.status === 'PENDENTE' ? 'CONCLUIDA' : 'PENDENTE';
        return {
          ...d,
          status: novoStatus,
          data_conclusao: novoStatus === 'CONCLUIDA' ? new Date().toISOString().split('T')[0] : undefined
        };
      }
      return d;
    }));
  };

  // Handlers para Vagas
  const handleSaveVaga = async (vaga: RhVaga, isNew: boolean) => {
    if (isNew) {
      setVagas(prev => [vaga, ...prev]);
    } else {
      setVagas(prev => prev.map(v => v.id === vaga.id ? vaga : v));
    }

    try {
      await supabase.from('rh_vagas').upsert(vaga);
    } catch (e) {
      console.info('Salvo localmente.');
    }
  };

  const handleFecharEContratarVaga = (vaga: RhVaga) => {
    // Atualiza vaga para FECHADA
    setVagas(prev => prev.map(v => v.id === vaga.id ? { ...v, status: 'FECHADA' } : v));

    if (vaga.tipo === 'CLT') {
      setActiveSubTab('funcionarios');
    } else {
      setActiveSubTab('estagiarios');
    }
  };

  // Handlers para Folha de Pagamento
  const handleSalvarFolha = async (folhasAtualizadas: FolhaType[]) => {
    setFolhas(prev => {
      const outras = prev.filter(f => !folhasAtualizadas.some(fa => fa.competencia === f.competencia && fa.funcionario_id === f.funcionario_id));
      return [...outras, ...folhasAtualizadas];
    });

    try {
      await supabase.from('rh_folha_pagamento').upsert(folhasAtualizadas);
    } catch (e) {
      console.info('Folha salva localmente.');
    }
  };

  const handleFecharFolha = async (comp: string, totalLiquido: number, qtdFuncionarios: number) => {
    const dataFechamento = new Date().toISOString().split('T')[0];

    // Atualiza status das folhas
    setFolhas(prev => prev.map(f => {
      if (f.competencia === comp) {
        return {
          ...f,
          status: 'FECHADA',
          data_fechamento: dataFechamento
        };
      }
      return f;
    }));

    // Lança automaticamente em Contas a Pagar
    if (onAddTransaction && totalLiquido > 0) {
      const compDate = new Date(comp + 'T00:00:00');
      const mesAno = compDate.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' });

      // Vencimento estimado: dia 05 do mês seguinte
      const proximoMes = new Date(compDate.getFullYear(), compDate.getMonth() + 1, 5);
      const vencimentoStr = proximoMes.toISOString().split('T')[0];

      onAddTransaction({
        type: 'PAGAR',
        vencimento: vencimentoStr,
        descricao: `Folha de Pagamento Salarial CLT - Competência ${mesAno} (${qtdFuncionarios} colaboradores)`,
        valor: totalLiquido,
        formaPagamento: 'TRANSFERENCIA',
        status: 'PENDENTE',
        centroCusto: 'RH / Folha de Pagamento',
        subItem: 'Salários CLT'
      });
    }

    try {
      await supabase.from('rh_folha_pagamento')
        .update({ status: 'FECHADA', data_fechamento: dataFechamento })
        .eq('competencia', comp);
    } catch (e) {
      console.info('Folha fechada.');
    }
  };

  // Lançar Adiantamento Salarial
  const handleLancarAdiantamento = async (ad: RhAdiantamento) => {
    setAdiantamentos(prev => [ad, ...prev]);

    // Gera lançamento imediato no Contas a Pagar
    if (onAddTransaction && ad.valor > 0) {
      onAddTransaction({
        type: 'PAGAR',
        vencimento: ad.data_lancamento,
        descricao: `Adiantamento Salarial - ${ad.funcionario_nome || 'Colaborador'} (Comp. ${ad.competencia})`,
        valor: ad.valor,
        formaPagamento: 'PIX',
        status: 'PENDENTE',
        centroCusto: 'RH / Folha de Pagamento',
        subItem: 'Adiantamentos Salariais'
      });
    }

    try {
      await supabase.from('rh_adiantamentos').insert([ad]);
    } catch (e) {
      console.info('Adiantamento salvo.');
    }
  };

  // Sub-abas do menu RH
  const subTabs = [
    { key: 'inicio', label: 'Início', icon: 'dashboard', materialIcon: 'space_dashboard' },
    { key: 'funcionarios', label: 'Funcionários', icon: 'badge', materialIcon: 'badge' },
    { key: 'estagiarios', label: 'Estagiários', icon: 'school', materialIcon: 'school' },
    { key: 'demandas', label: 'Demandas de RH', icon: 'checklist', materialIcon: 'checklist' },
    { key: 'vagas', label: 'Vagas', icon: 'work', materialIcon: 'work' },
    { key: 'folha', label: 'Folha de Pagamento', icon: 'payments', materialIcon: 'payments' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* BARRA DE NAVEGAÇÃO DE SUB-ABAS DO RH */}
      <div className="bg-white rounded-3xl p-2 border border-slate-200/80 shadow-xs flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {subTabs.map(tab => {
            const isActive = activeSubTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveSubTab(tab.key as any)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-[#001a54] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[19px]">{tab.materialIcon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* RENDERIZAÇÃO DA SUB-ABA ATIVA */}
      {activeSubTab === 'inicio' && (
        <RhInicio
          funcionarios={funcionarios}
          estagiarios={estagiarios}
          demandas={demandas}
          folhas={folhas}
          ferias={ferias}
          vagas={vagas}
          onNavigateTab={(tabKey) => setActiveSubTab(tabKey as any)}
          onOpenSqlModal={() => setIsSqlModalOpen(true)}
        />
      )}

      {activeSubTab === 'funcionarios' && (
        <RhFuncionarios
          funcionarios={funcionarios}
          onSaveFuncionario={handleSaveFuncionario}
          onDesligarFuncionario={handleDesligarFuncionario}
        />
      )}

      {activeSubTab === 'estagiarios' && (
        <RhEstagiarios
          estagiarios={estagiarios}
          onSaveEstagiario={handleSaveEstagiario}
          onEfetivarComoClt={handleEfetivarEstagiario}
        />
      )}

      {activeSubTab === 'demandas' && (
        <RhDemandas
          demandas={demandas}
          funcionarios={funcionarios}
          onSaveDemanda={handleSaveDemanda}
          onToggleStatusDemanda={handleToggleStatusDemanda}
        />
      )}

      {activeSubTab === 'vagas' && (
        <RhVagas
          vagas={vagas}
          onSaveVaga={handleSaveVaga}
          onFecharEContratar={handleFecharEContratarVaga}
        />
      )}

      {activeSubTab === 'folha' && (
        <RhFolhaPagamento
          folhas={folhas}
          funcionarios={funcionarios}
          adiantamentos={adiantamentos}
          onSalvarFolha={handleSalvarFolha}
          onFecharFolha={handleFecharFolha}
          onLancarAdiantamento={handleLancarAdiantamento}
        />
      )}

      {/* MODAL DO SCRIPT SQL */}
      <RhSqlScriptModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />

    </div>
  );
};
