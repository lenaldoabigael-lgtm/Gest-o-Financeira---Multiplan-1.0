export interface GuiaPasso {
  numero: number;
  titulo: string;
  descricao: string;
  dica?: string;
  atencao?: string;
}

export interface GuiaItem {
  id: string;
  categoria: 'COMERCIAL' | 'ACOMPANHAMENTO' | 'FINANCEIRO' | 'COMISSOES' | 'RH' | 'MOBILE' | 'FAQ';
  categoriaNome: string;
  titulo: string;
  subtitulo: string;
  icone: string;
  cor: string;
  tempoLeitura: string;
  publico: string[];
  passos: GuiaPasso[];
  perguntasFrequentes?: { pergunta: string; resposta: string }[];
}

export const CATEGORIAS_ACADEMIA = [
  { id: 'TODOS', nome: 'Todos os Guias', icone: 'fa-layer-group' },
  { id: 'COMERCIAL', nome: 'Comercial & Propostas', icone: 'fa-briefcase' },
  { id: 'ACOMPANHAMENTO', nome: 'Acompanhamento (Kanban)', icone: 'fa-list-check' },
  { id: 'FINANCEIRO', nome: 'Financeiro & Lotes', icone: 'fa-wallet' },
  { id: 'COMISSOES', nome: 'Comissões & Repasses', icone: 'fa-dollar-sign' },
  { id: 'RH', nome: 'RH & Colaboradores', icone: 'fa-people-group' },
  { id: 'MOBILE', nome: 'Portal do Corretor (Mobile)', icone: 'fa-mobile-screen' },
  { id: 'FAQ', nome: 'Dúvidas Frequentes', icone: 'fa-circle-question' }
];

export const GUIAS_ACADEMIA: GuiaItem[] = [
  {
    id: 'cotacao-planos',
    categoria: 'COMERCIAL',
    categoriaNome: 'Comercial & Propostas',
    titulo: 'Cotação Rápida de Planos de Saúde & Odonto',
    subtitulo: 'Aprenda a pesquisar tabelas, comparar operadoras por faixa etária e gerar PDF para o cliente.',
    icone: 'fa-calculator',
    cor: 'blue',
    tempoLeitura: '3 min',
    publico: ['Corretores', 'Analistas', 'Comercial'],
    passos: [
      {
        numero: 1,
        titulo: 'Acessar o Módulo de Cotação',
        descricao: 'No menu superior do sistema, clique em Comercial e selecione Cotação de Planos (ou use o atalho no Portal do Corretor).'
      },
      {
        numero: 2,
        titulo: 'Definir Modalidade e Faixas Etárias',
        descricao: 'Selecione o tipo de contratação (Individual, Familiar, Adesão ou PME) e informe a quantidade de vidas em cada faixa etária (00-18, 19-23, etc.).',
        dica: 'O sistema calcula automaticamente a soma de vidas e ajusta os multiplicadores de valores em tempo real.'
      },
      {
        numero: 3,
        titulo: 'Filtrar por Operadoras e Acomodações',
        descricao: 'Escolha as operadoras desejadas (Hapvida, Amil, SulAmérica, Bradesco, etc.) e o tipo de acomodação (Enfermaria ou Apartamento).'
      },
      {
        numero: 4,
        titulo: 'Comparar e Exportar Orçamento',
        descricao: 'Analise os valores mensais lado a lado e clique em Exportar Orçamento para gerar a proposta visual para enviar ao cliente via WhatsApp ou e-mail.'
      }
    ],
    perguntasFrequentes: [
      {
        pergunta: 'As tabelas de preços estão atualizadas?',
        resposta: 'Sim. As tabelas são gerenciadas no módulo Gestão > Tabelas de Preço, com atualização automática de vigências.'
      }
    ]
  },
  {
    id: 'cadastro-proposta',
    categoria: 'COMERCIAL',
    categoriaNome: 'Comercial & Propostas',
    titulo: 'Cadastro Completo de Propostas de Venda',
    subtitulo: 'Passo a passo para registrar vendas de planos, dados de vidas, titular e regras de comissionamento.',
    icone: 'fa-file-contract',
    cor: 'indigo',
    tempoLeitura: '4 min',
    publico: ['Corretores', 'Comercial', 'Administradores'],
    passos: [
      {
        numero: 1,
        titulo: 'Iniciar Nova Proposta',
        descricao: 'Na tela Comercial > Propostas ou no Acompanhamento, clique no botão superior "+ Nova Proposta".'
      },
      {
        numero: 2,
        titulo: 'Identificação do Contrato e Operadora',
        descricao: 'Preencha o Número do Contrato/Proposta da operadora, selecione a Operadora (ex.: Hapvida, Amil) e o Tipo de Plano (Individual, Coletivo, PME).',
        atencao: 'O número do contrato é a chave de rastreio usada pelo Financeiro para identificar a liquidação.'
      },
      {
        numero: 3,
        titulo: 'Dados do Titular e Quantidade de Vidas',
        descricao: 'Insira o Nome Completo, CPF/CNPJ válido, Telefone, E-mail e a quantidade total de vidas incluídas no contrato.'
      },
      {
        numero: 4,
        titulo: 'Definição de Comissão e Corretor Responsável',
        descricao: 'Vincule o Corretor que realizou a venda. O sistema preenche automaticamente o percentual de comissão contratual cadastrado na estrutura comercial.',
        dica: 'Caso haja desconto de taxa administrativa ou adiantamento diferenciado, verifique os campos na aba Financeiro da proposta.'
      },
      {
        numero: 5,
        titulo: 'Salvar e Enviar para Análise',
        descricao: 'Ao clicar em Salvar, a proposta ingressa automaticamente no Acompanhamento com status CADASTRADA / Em Análise.'
      }
    ]
  },
  {
    id: 'regra-cartao-corretora',
    categoria: 'COMERCIAL',
    categoriaNome: 'Comercial & Propostas',
    titulo: 'Regra Especial: Vendas com Cartão da Corretora',
    subtitulo: 'Entenda como cadastrar e processar propostas cujo valor inicial foi passado na máquina da corretora.',
    icone: 'fa-credit-card',
    cor: 'purple',
    tempoLeitura: '3 min',
    publico: ['Corretores', 'Comercial', 'Financeiro'],
    passos: [
      {
        numero: 1,
        titulo: 'Quando utilizar a marcação Cartão da Corretora?',
        descricao: 'Utilize quando a 1ª mensalidade ou adesão do cliente for paga na máquina de cartão da Multiplan, e não diretamente por boleto da operadora.'
      },
      {
        numero: 2,
        titulo: 'Como marcar na proposta',
        descricao: 'No formulário da proposta, ative a opção "Pago no Cartão da Corretora". Um selo roxo será exibido no card da proposta.',
        atencao: 'Como o recurso já entrou na conta da corretora via cartão, essa proposta NÃO gera lote de repasse ao vendedor pelo financeiro!'
      },
      {
        numero: 3,
        titulo: 'Conclusão Direta no Acompanhamento',
        descricao: 'No Acompanhamento (Kanban), as propostas com Cartão da Corretora exibem o botão verde "CONCLUIR (PAGO NO CARTÃO)". Basta clicar para movê-la imediatamente para Concluídas.'
      }
    ],
    perguntasFrequentes: [
      {
        pergunta: 'Por que a proposta com Cartão da Corretora não entra na fila de gerar lote?',
        resposta: 'Porque os lotes de pagamento destinam-se a fazer transferências PIX de repasses a corretores. No cartão da corretora, a liquidação ocorre diretamente na conferência do adquirente.'
      }
    ]
  },
  {
    id: 'acompanhamento-kanban',
    categoria: 'ACOMPANHAMENTO',
    categoriaNome: 'Acompanhamento (Kanban)',
    titulo: 'Fluxo do Quadro de Acompanhamento (Kanban)',
    subtitulo: 'Entenda as 3 fases operacionais e como as propostas avançam até a liquidação final.',
    icone: 'fa-list-check',
    cor: 'amber',
    tempoLeitura: '4 min',
    publico: ['Comercial', 'Supervisores', 'Financeiro'],
    passos: [
      {
        numero: 1,
        titulo: 'Coluna 1: Em Análise',
        descricao: 'Propostas recém-cadastradas aguardando conferência documental, validação cadastral da operadora ou aprovação de vigência.',
        dica: 'Após conferir dados e anexos, clique em "ENVIAR P/ FINANCEIRO" para liberar a comissão.'
      },
      {
        numero: 2,
        titulo: 'Coluna 2: Aguardando Pagamento',
        descricao: 'Propostas sob custódia do setor Financeiro. O card exibe o Lote vinculado (ex.: LOTE-2603-042) ou o aviso de aguardo de lote.'
      },
      {
        numero: 3,
        titulo: 'Coluna 3: Concluídas',
        descricao: 'Propostas com a 1ª parcela de comissão/adiantamento devidamente liquidada no banco ou confirmadas no cartão da corretora.',
        atencao: 'Se houver necessidade de reabertura, gestores possuem o botão "Reabrir" para retornar a proposta ao fluxo de análise.'
      }
    ]
  },
  {
    id: 'geracao-lotes-financeiro',
    categoria: 'FINANCEIRO',
    categoriaNome: 'Financeiro & Lotes',
    titulo: 'Geração e Fechamento de Lotes de Pagamento (Borderô)',
    subtitulo: 'Como o Financeiro agrupa propostas aprovadas por corretor e cria lotes unificados para pagamento.',
    icone: 'fa-layer-group',
    cor: 'emerald',
    tempoLeitura: '5 min',
    publico: ['Financeiro', 'Gestores', 'Diretoria'],
    passos: [
      {
        numero: 1,
        titulo: 'Acessar Financeiro > Lotes de Pagamento',
        descricao: 'No menu Financeiro, selecione Lotes de Pagamento. A primeira sub-aba exibirá as propostas em "Aguardando Geração".'
      },
      {
        numero: 2,
        titulo: 'Selecionar Propostas por Corretor',
        descricao: 'Marque as caixas de seleção das propostas de um corretor. O sistema agrupa por titular de repasse e calcula o valor líquido total.',
        dica: 'Você pode usar os filtros por Operadora ou buscar pelo nome do Corretor para montar lotes específicos da semana.'
      },
      {
        numero: 3,
        titulo: 'Definir Data Prevista e Gerar Lote',
        descricao: 'Informe a data de vencimento prevista para o repasse e clique em "Gerar Lote de Pagamento".'
      },
      {
        numero: 4,
        titulo: 'Código Identificador do Lote',
        descricao: 'O sistema cria um lote com código padronizado (ex.: LOTE-RENAN-202609-228), travando as propostas no borderô oficial.'
      }
    ]
  },
  {
    id: 'baixa-liquidacao-lote',
    categoria: 'FINANCEIRO',
    categoriaNome: 'Financeiro & Lotes',
    titulo: 'Baixa, Liquidação e Comprovante de Pagamento',
    subtitulo: 'Como dar baixa em um lote pago, sincronizar as propostas para Concluídas e anexar comprovante.',
    icone: 'fa-check-double',
    cor: 'emerald',
    tempoLeitura: '4 min',
    publico: ['Financeiro', 'Gestores'],
    passos: [
      {
        numero: 1,
        titulo: 'Localizar o Lote Pendente',
        descricao: 'Na sub-aba "Lotes de Pagamento", localize o lote com status PENDENTE ou APROVADO.'
      },
      {
        numero: 2,
        titulo: 'Conferir Chave PIX e Valores',
        descricao: 'Clique no card do lote para expandir a lista de propostas, conferir o valor líquido de cada uma e a chave PIX bancária do corretor.'
      },
      {
        numero: 3,
        titulo: 'Confirmar Liquidação (Pagar Lote)',
        descricao: 'Clique no botão "Marcar como Pago" ou "Liquidar Lote". O sistema atualizará o status do lote para PAGO.',
        atencao: 'Sincronização Automática: Todas as propostas contidas no lote são automaticamente migradas para o status Concluídas no Acompanhamento!'
      },
      {
        numero: 4,
        titulo: 'Baixar e Compartilhar Comprovante',
        descricao: 'Use o botão "Imprimir / Exportar Borderô" para gerar o espelho de pagamento com discriminativo de todas as vidas e valores.'
      }
    ]
  },
  {
    id: 'desvincular-estornar-lote',
    categoria: 'FINANCEIRO',
    categoriaNome: 'Financeiro & Lotes',
    titulo: 'Desvinculação de Proposta e Estorno de Lote',
    subtitulo: 'Como remover uma proposta de um lote incorreto ou desfazer um lote gerado por engano.',
    icone: 'fa-arrow-rotate-left',
    cor: 'rose',
    tempoLeitura: '3 min',
    publico: ['Financeiro', 'Administradores'],
    passos: [
      {
        numero: 1,
        titulo: 'Desvincular uma Proposta Específica',
        descricao: 'Vá na sub-aba "Todas no Financeiro", localize a proposta e clique no botão "Desvincular". A proposta sairá do lote e retornará para a fila de Aguardando Geração.'
      },
      {
        numero: 2,
        titulo: 'Estorno Completo de um Lote',
        descricao: 'Se o lote ainda não foi pago e precisa ser refeito, clique em "Estornar Lote". Todas as propostas contidas nele voltam a ficar livres para novo agrupamento.',
        atencao: 'Lotes já marcados como PAGO exigem confirmação do gestor para reversão de baixa contábil.'
      }
    ]
  },
  {
    id: 'gestao-comissoes-repasses',
    categoria: 'COMISSOES',
    categoriaNome: 'Comissões & Repasses',
    titulo: 'Controle de Parcelas Subsequentes (2ª à 6ª Parcela)',
    subtitulo: 'Como gerenciar o repasse contínuo de comissões conforme os pagamentos das mensalidades pelos segurados.',
    icone: 'fa-hand-holding-dollar',
    cor: 'teal',
    tempoLeitura: '4 min',
    publico: ['Financeiro', 'Corretores', 'Gestores'],
    passos: [
      {
        numero: 1,
        titulo: 'Estrutura das Parcelas de Comissão',
        descricao: 'Cada contrato possui grade de parcelamento definida pela operadora (ex.: 1ª parcela vitalícia ou adiantamento de 100%, 2ª parcela 20%, 3ª parcela 20%, etc.).'
      },
      {
        numero: 2,
        titulo: 'Acompanhamento de Vigências',
        descricao: 'No módulo Comercial > Comissões, filtre por competência/mês para visualizar quais parcelas estão a vencer ou disponíveis para repasse.'
      },
      {
        numero: 3,
        titulo: 'Baixa de Parcela Individual',
        descricao: 'Quando o relatório da operadora confirmar a quitação da mensalidade pelo cliente, marque a respectiva parcela como "PAGA".'
      }
    ]
  },
  {
    id: 'portal-corretor-mobile',
    categoria: 'MOBILE',
    categoriaNome: 'Portal do Corretor (Mobile)',
    titulo: 'Utilização do Portal do Corretor no Celular',
    subtitulo: 'Guia do vendedor externo: como cadastrar vendas na rua, consultar extrato de comissões e cotações.',
    icone: 'fa-mobile-screen-button',
    cor: 'cyan',
    tempoLeitura: '3 min',
    publico: ['Corretores', 'Supervisores'],
    passos: [
      {
        numero: 1,
        titulo: 'Acesso Rápido no Navegador do Smartphone',
        descricao: 'Ao abrir o link do sistema no celular, o sistema detecta automaticamente o aparelho e abre a interface simplificada e fluida do Portal do Corretor.'
      },
      {
        numero: 2,
        titulo: 'Cadastrar Venda na Frente do Cliente',
        descricao: 'Clique no botão "+ Nova Proposta" no rodapé, tire foto ou anexe documentos pelo próprio celular e preencha os dados básicos.'
      },
      {
        numero: 3,
        titulo: 'Consulta de Extrato e Repasses',
        descricao: 'Acesse a aba "Meus Repasses" para ver o histórico dos lotes pagos, datas de crédito e comprovantes PIX.'
      }
    ]
  },
  {
    id: 'rh-colaboradores',
    categoria: 'RH',
    categoriaNome: 'RH & Colaboradores',
    titulo: 'Recursos Humanos: Colaboradores e Folha de Pagamento',
    subtitulo: 'Gerenciamento de admissões, cargos, salários, folha de pagamento mensal e envio de holerite via WhatsApp.',
    icone: 'fa-people-group',
    cor: 'orange',
    tempoLeitura: '4 min',
    publico: ['RH', 'Diretoria'],
    passos: [
      {
        numero: 1,
        titulo: 'Cadastro de Colaborador',
        descricao: 'No módulo RH, cadastre dados pessoais, cargo, departamento, chave PIX e salário base com benefícios.'
      },
      {
        numero: 2,
        titulo: 'Cálculo de Folha e Encargos',
        descricao: 'O sistema calcula automaticamente descontos legais (INSS, IRRF) e benefícios adicionais conforme a legislação vigente.'
      },
      {
        numero: 3,
        titulo: 'Envio de Holerite via WhatsApp',
        descricao: 'Gere o holerite em PDF com um clique e utilize a integração direta de WhatsApp para enviar o demonstrativo ao celular do colaborador.'
      }
    ]
  }
];
