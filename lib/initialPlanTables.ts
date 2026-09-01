import { TabelaPrecoImportada } from '../types';

export const INITIAL_IMPORTED_TABLES: TabelaPrecoImportada[] = [
  // 1. FORTALEZA - CE (INDIVIDUAL)
  {
    id: 'TAB-HAP-FOR-INDIVIDUAL-2026',
    operadora: 'HAPVIDA',
    modalidade: 'INDIVIDUAL',
    cidade: 'Fortaleza',
    uf: 'CE',
    vigenciaInicio: '2026-07-01',
    vigenciaFim: '2026-09-30',
    taxaAdesao: 35.00,
    odontoPromoValor: 24.50,
    odontoCheioValor: 75.84,
    arquivoNome: 'tabela_individual_fortaleza_ce.pdf',
    criadoEm: '2026-07-01T00:00:00.000Z',
    ativo: true,
    produtos: [
      {
        id: 'HAP-NOSSO-PLAN-PARCIAL-ENF-FOR',
        nomeProduto: 'Nosso Plano',
        segmentacao: 'AMB+HOSP+OBST',
        acomodacao: 'ENFERMARIA',
        coparticipacao: 'PARCIAL',
        registroAns: '484.226/19-0',
        codInternoComOdonto: '21042',
        codInternoSemOdonto: '21043',
        faixas: [
          { faixa: '00 a 18', faixaOrdem: 1, valorMedica1: 267.56, valorMedica2: 293.06 },
          { faixa: '19 a 23', faixaOrdem: 2, valorMedica1: 330.70, valorMedica2: 362.22 },
          { faixa: '24 a 28', faixaOrdem: 3, valorMedica1: 380.31, valorMedica2: 416.55 },
          { faixa: '29 a 33', faixaOrdem: 4, valorMedica1: 425.95, valorMedica2: 466.54 },
          { faixa: '34 a 38', faixaOrdem: 5, valorMedica1: 447.25, valorMedica2: 489.87 },
          { faixa: '39 a 43', faixaOrdem: 6, valorMedica1: 505.39, valorMedica2: 553.55 },
          { faixa: '44 a 48', faixaOrdem: 7, valorMedica1: 628.55, valorMedica2: 688.45 },
          { faixa: '49 a 53', faixaOrdem: 8, valorMedica1: 850.87, valorMedica2: 931.95 },
          { faixa: '54 a 58', faixaOrdem: 9, valorMedica1: 1148.67, valorMedica2: 1258.13 },
          { faixa: '59 ou mais', faixaOrdem: 10, valorMedica1: 1449.74, valorMedica2: 1587.89 }
        ]
      },
      {
        id: 'HAP-NOSSO-PLAN-PARCIAL-APT-FOR',
        nomeProduto: 'Nosso Plano',
        segmentacao: 'AMB+HOSP+OBST',
        acomodacao: 'APARTAMENTO',
        coparticipacao: 'PARCIAL',
        registroAns: '484.227/19-8',
        codInternoComOdonto: '21047',
        codInternoSemOdonto: '21048',
        faixas: [
          { faixa: '00 a 18', faixaOrdem: 1, valorMedica1: 401.35, valorMedica2: 426.85 },
          { faixa: '19 a 23', faixaOrdem: 2, valorMedica1: 496.07, valorMedica2: 527.59 },
          { faixa: '24 a 28', faixaOrdem: 3, valorMedica1: 570.48, valorMedica2: 606.73 },
          { faixa: '29 a 33', faixaOrdem: 4, valorMedica1: 638.94, valorMedica2: 679.54 },
          { faixa: '34 a 38', faixaOrdem: 5, valorMedica1: 670.89, valorMedica2: 713.52 },
          { faixa: '39 a 43', faixaOrdem: 6, valorMedica1: 758.11, valorMedica2: 806.28 },
          { faixa: '44 a 48', faixaOrdem: 7, valorMedica1: 942.86, valorMedica2: 1002.77 },
          { faixa: '49 a 53', faixaOrdem: 8, valorMedica1: 1276.35, valorMedica2: 1357.45 },
          { faixa: '54 a 58', faixaOrdem: 9, valorMedica1: 1723.07, valorMedica2: 1832.56 },
          { faixa: '59 ou mais', faixaOrdem: 10, valorMedica1: 2174.69, valorMedica2: 2312.87 }
        ]
      },
      {
        id: 'HAP-NOSSO-PLAN-TOTAL-ENF-FOR',
        nomeProduto: 'Nosso Plano',
        segmentacao: 'AMB+HOSP+OBST',
        acomodacao: 'ENFERMARIA',
        coparticipacao: 'TOTAL',
        registroAns: '484.226/19-0',
        codInternoComOdonto: '11812',
        codInternoSemOdonto: '11862',
        faixas: [
          { faixa: '00 a 18', faixaOrdem: 1, valorMedica1: 214.04, valorMedica2: 239.54 },
          { faixa: '19 a 23', faixaOrdem: 2, valorMedica1: 264.55, valorMedica2: 296.07 },
          { faixa: '24 a 28', faixaOrdem: 3, valorMedica1: 304.23, valorMedica2: 340.48 },
          { faixa: '29 a 33', faixaOrdem: 4, valorMedica1: 340.74, valorMedica2: 381.34 },
          { faixa: '34 a 38', faixaOrdem: 5, valorMedica1: 357.78, valorMedica2: 400.41 },
          { faixa: '39 a 43', faixaOrdem: 6, valorMedica1: 404.29, valorMedica2: 452.46 },
          { faixa: '44 a 48', faixaOrdem: 7, valorMedica1: 502.82, valorMedica2: 562.72 },
          { faixa: '49 a 53', faixaOrdem: 8, valorMedica1: 680.67, valorMedica2: 761.75 },
          { faixa: '54 a 58', faixaOrdem: 9, valorMedica1: 918.90, valorMedica2: 1028.36 },
          { faixa: '59 ou mais', faixaOrdem: 10, valorMedica1: 1159.74, valorMedica2: 1297.89 }
        ]
      },
      {
        id: 'HAP-NOSSO-PLAN-TOTAL-APT-FOR',
        nomeProduto: 'Nosso Plano',
        segmentacao: 'AMB+HOSP+OBST',
        acomodacao: 'APARTAMENTO',
        coparticipacao: 'TOTAL',
        registroAns: '484.227/19-8',
        codInternoComOdonto: '11813',
        codInternoSemOdonto: '11863',
        faixas: [
          { faixa: '00 a 18', faixaOrdem: 1, valorMedica1: 321.06, valorMedica2: 346.56 },
          { faixa: '19 a 23', faixaOrdem: 2, valorMedica1: 396.83, valorMedica2: 428.35 },
          { faixa: '24 a 28', faixaOrdem: 3, valorMedica1: 456.35, valorMedica2: 492.60 },
          { faixa: '29 a 33', faixaOrdem: 4, valorMedica1: 511.11, valorMedica2: 551.71 },
          { faixa: '34 a 38', faixaOrdem: 5, valorMedica1: 536.67, valorMedica2: 579.30 },
          { faixa: '39 a 43', faixaOrdem: 6, valorMedica1: 606.44, valorMedica2: 654.61 },
          { faixa: '44 a 48', faixaOrdem: 7, valorMedica1: 754.23, valorMedica2: 814.14 },
          { faixa: '49 a 53', faixaOrdem: 8, valorMedica1: 1021.00, valorMedica2: 1102.10 },
          { faixa: '54 a 58', faixaOrdem: 9, valorMedica1: 1378.35, valorMedica2: 1487.84 },
          { faixa: '59 ou mais', faixaOrdem: 10, valorMedica1: 1739.62, valorMedica2: 1877.80 }
        ]
      },
      {
        id: 'HAP-MIX-PARCIAL-ENF-FOR',
        nomeProduto: 'Mix',
        segmentacao: 'AMB+HOSP+OBST',
        acomodacao: 'ENFERMARIA',
        coparticipacao: 'PARCIAL',
        registroAns: '469.350/13-7',
        codInternoComOdonto: '21428',
        codInternoSemOdonto: '21611',
        faixas: [
          { faixa: '00 a 18', faixaOrdem: 1, valorMedica1: 401.35, valorMedica2: 426.85 },
          { faixa: '19 a 23', faixaOrdem: 2, valorMedica1: 496.07, valorMedica2: 527.59 },
          { faixa: '24 a 28', faixaOrdem: 3, valorMedica1: 570.48, valorMedica2: 606.73 },
          { faixa: '29 a 33', faixaOrdem: 4, valorMedica1: 638.94, valorMedica2: 679.54 },
          { faixa: '34 a 38', faixaOrdem: 5, valorMedica1: 670.89, valorMedica2: 713.52 },
          { faixa: '39 a 43', faixaOrdem: 6, valorMedica1: 758.11, valorMedica2: 806.28 },
          { faixa: '44 a 48', faixaOrdem: 7, valorMedica1: 942.86, valorMedica2: 1002.77 },
          { faixa: '49 a 53', faixaOrdem: 8, valorMedica1: 1276.35, valorMedica2: 1357.45 },
          { faixa: '54 a 58', faixaOrdem: 9, valorMedica1: 1723.07, valorMedica2: 1832.56 },
          { faixa: '59 ou mais', faixaOrdem: 10, valorMedica1: 2174.69, valorMedica2: 2312.87 }
        ]
      },
      {
        id: 'HAP-MIX-PARCIAL-APT-FOR',
        nomeProduto: 'Mix',
        segmentacao: 'AMB+HOSP+OBST',
        acomodacao: 'APARTAMENTO',
        coparticipacao: 'PARCIAL',
        registroAns: '469.341/13-8',
        codInternoComOdonto: '21427',
        codInternoSemOdonto: '21610',
        faixas: [
          { faixa: '00 a 18', faixaOrdem: 1, valorMedica1: 602.02, valorMedica2: 627.52 },
          { faixa: '19 a 23', faixaOrdem: 2, valorMedica1: 744.10, valorMedica2: 775.61 },
          { faixa: '24 a 28', faixaOrdem: 3, valorMedica1: 855.72, valorMedica2: 891.95 },
          { faixa: '29 a 33', faixaOrdem: 4, valorMedica1: 958.41, valorMedica2: 998.98 },
          { faixa: '34 a 38', faixaOrdem: 5, valorMedica1: 1006.33, valorMedica2: 1048.93 },
          { faixa: '39 a 43', faixaOrdem: 6, valorMedica1: 1137.15, valorMedica2: 1185.29 },
          { faixa: '44 a 48', faixaOrdem: 7, valorMedica1: 1414.27, valorMedica2: 1474.15 },
          { faixa: '49 a 53', faixaOrdem: 8, valorMedica1: 1914.50, valorMedica2: 1995.56 },
          { faixa: '54 a 58', faixaOrdem: 9, valorMedica1: 2584.58, valorMedica2: 2694.01 },
          { faixa: '59 ou mais', faixaOrdem: 10, valorMedica1: 3262.00, valorMedica2: 3400.11 }
        ]
      }
    ]
  },

  // 2. FORTALEZA - CE (PME 30 a 99 vidas)
  {
    id: 'TAB-HAP-FOR-PME-30-99-2026',
    operadora: 'HAPVIDA',
    modalidade: 'PME_30_99',
    cidade: 'Fortaleza',
    uf: 'CE',
    vigenciaInicio: '2026-07-01',
    vigenciaFim: '2026-09-30',
    taxaAdesao: 20.00,
    odontoPromoValor: 14.87,
    odontoCheioValor: 75.84,
    arquivoNome: 'tabela_pme_30_99_fortaleza_ce.pdf',
    criadoEm: '2026-07-01T00:00:00.000Z',
    ativo: true,
    produtos: [
      {
        id: 'HAP-PME-NOSSO-PLAN-PARCIAL-ENF-FOR',
        nomeProduto: 'Nosso Plano',
        segmentacao: 'AMB+HOSP+OBST',
        acomodacao: 'ENFERMARIA',
        coparticipacao: 'PARCIAL',
        registroAns: '484.252/19-9',
        codInternoComOdonto: '21218*',
        codInternoSemOdonto: '21218',
        faixas: [
          { faixa: '00 a 18', faixaOrdem: 1, valorMedica1: 168.80, valorMedica2: 232.10 },
          { faixa: '19 a 23', faixaOrdem: 2, valorMedica1: 189.06, valorMedica2: 259.96 },
          { faixa: '24 a 28', faixaOrdem: 3, valorMedica1: 211.75, valorMedica2: 291.16 },
          { faixa: '29 a 33', faixaOrdem: 4, valorMedica1: 243.51, valorMedica2: 334.83 },
          { faixa: '34 a 38', faixaOrdem: 5, valorMedica1: 280.04, valorMedica2: 385.06 },
          { faixa: '39 a 43', faixaOrdem: 6, valorMedica1: 333.25, valorMedica2: 458.22 },
          { faixa: '44 a 48', faixaOrdem: 7, valorMedica1: 416.56, valorMedica2: 572.77 },
          { faixa: '49 a 53', faixaOrdem: 8, valorMedica1: 520.70, valorMedica2: 715.96 },
          { faixa: '54 a 58', faixaOrdem: 9, valorMedica1: 885.19, valorMedica2: 1217.14 },
          { faixa: '59 ou mais', faixaOrdem: 10, valorMedica1: 991.41, valorMedica2: 1363.19 }
        ]
      },
      {
        id: 'HAP-PME-NOSSO-PLAN-PARCIAL-APT-FOR',
        nomeProduto: 'Nosso Plano',
        segmentacao: 'AMB+HOSP+OBST',
        acomodacao: 'APARTAMENTO',
        coparticipacao: 'PARCIAL',
        registroAns: '484.251/19-1',
        codInternoComOdonto: '21219*',
        codInternoSemOdonto: '21219',
        faixas: [
          { faixa: '00 a 18', faixaOrdem: 1, valorMedica1: 253.20, valorMedica2: 348.15 },
          { faixa: '19 a 23', faixaOrdem: 2, valorMedica1: 283.58, valorMedica2: 389.92 },
          { faixa: '24 a 28', faixaOrdem: 3, valorMedica1: 317.61, valorMedica2: 436.71 },
          { faixa: '29 a 33', faixaOrdem: 4, valorMedica1: 365.25, valorMedica2: 502.22 },
          { faixa: '34 a 38', faixaOrdem: 5, valorMedica1: 420.04, valorMedica2: 577.56 },
          { faixa: '39 a 43', faixaOrdem: 6, valorMedica1: 499.85, valorMedica2: 687.29 },
          { faixa: '44 a 48', faixaOrdem: 7, valorMedica1: 624.81, valorMedica2: 859.11 },
          { faixa: '49 a 53', faixaOrdem: 8, valorMedica1: 781.01, valorMedica2: 1073.89 },
          { faixa: '54 a 58', faixaOrdem: 9, valorMedica1: 1327.72, valorMedica2: 1825.62 },
          { faixa: '59 ou mais', faixaOrdem: 10, valorMedica1: 1487.05, valorMedica2: 2044.69 }
        ]
      },
      {
        id: 'HAP-PME-NOSSO-PLAN-TOTAL-ENF-FOR',
        nomeProduto: 'Nosso Plano',
        segmentacao: 'AMB+HOSP+OBST',
        acomodacao: 'ENFERMARIA',
        coparticipacao: 'TOTAL',
        registroAns: '484.252/19-9',
        codInternoComOdonto: '11791*',
        codInternoSemOdonto: '11791',
        faixas: [
          { faixa: '00 a 18', faixaOrdem: 1, valorMedica1: 131.94, valorMedica2: 181.42 },
          { faixa: '19 a 23', faixaOrdem: 2, valorMedica1: 147.77, valorMedica2: 203.18 },
          { faixa: '24 a 28', faixaOrdem: 3, valorMedica1: 165.50, valorMedica2: 227.56 },
          { faixa: '29 a 33', faixaOrdem: 4, valorMedica1: 190.33, valorMedica2: 261.70 },
          { faixa: '34 a 38', faixaOrdem: 5, valorMedica1: 218.88, valorMedica2: 300.96 },
          { faixa: '39 a 43', faixaOrdem: 6, valorMedica1: 260.47, valorMedica2: 358.15 },
          { faixa: '44 a 48', faixaOrdem: 7, valorMedica1: 325.59, valorMedica2: 447.69 },
          { faixa: '49 a 53', faixaOrdem: 8, valorMedica1: 406.99, valorMedica2: 559.61 },
          { faixa: '54 a 58', faixaOrdem: 9, valorMedica1: 691.88, valorMedica2: 951.34 },
          { faixa: '59 ou mais', faixaOrdem: 10, valorMedica1: 774.91, valorMedica2: 1065.50 }
        ]
      },
      {
        id: 'HAP-PME-NOSSO-PLAN-TOTAL-APT-FOR',
        nomeProduto: 'Nosso Plano',
        segmentacao: 'AMB+HOSP+OBST',
        acomodacao: 'APARTAMENTO',
        coparticipacao: 'TOTAL',
        registroAns: '484.251/19-1',
        codInternoComOdonto: '11790*',
        codInternoSemOdonto: '11790',
        faixas: [
          { faixa: '00 a 18', faixaOrdem: 1, valorMedica1: 197.93, valorMedica2: 272.15 },
          { faixa: '19 a 23', faixaOrdem: 2, valorMedica1: 221.68, valorMedica2: 304.81 },
          { faixa: '24 a 28', faixaOrdem: 3, valorMedica1: 248.28, valorMedica2: 341.39 },
          { faixa: '29 a 33', faixaOrdem: 4, valorMedica1: 285.52, valorMedica2: 392.59 },
          { faixa: '34 a 38', faixaOrdem: 5, valorMedica1: 328.35, valorMedica2: 451.48 },
          { faixa: '39 a 43', faixaOrdem: 6, valorMedica1: 390.74, valorMedica2: 537.27 },
          { faixa: '44 a 48', faixaOrdem: 7, valorMedica1: 488.43, valorMedica2: 671.59 },
          { faixa: '49 a 53', faixaOrdem: 8, valorMedica1: 610.54, valorMedica2: 839.49 },
          { faixa: '54 a 58', faixaOrdem: 9, valorMedica1: 1037.92, valorMedica2: 1427.14 },
          { faixa: '59 ou mais', faixaOrdem: 10, valorMedica1: 1162.47, valorMedica2: 1598.40 }
        ]
      }
    ]
  },

  // 3. FORTALEZA - CE (PORTE I e II: 2 a 29 vidas)
  {
    id: 'TAB-HAP-FOR-PME-2-29-2026',
    operadora: 'HAPVIDA',
    modalidade: 'PME_2_29',
    cidade: 'Fortaleza',
    uf: 'CE',
    vigenciaInicio: '2026-07-01',
    vigenciaFim: '2026-09-30',
    taxaAdesao: 20.00,
    odontoPromoValor: 23.25,
    odontoCheioValor: 78.87,
    arquivoNome: 'tabela_pme_2_29_fortaleza_ce.pdf',
    criadoEm: '2026-07-01T00:00:00.000Z',
    ativo: true,
    produtos: [
      {
        id: 'HAP-PME-2-29-NOSSO-PLAN-PARCIAL-ENF-FOR',
        nomeProduto: 'Nosso Plano',
        segmentacao: 'AMB+HOSP+OBST',
        acomodacao: 'ENFERMARIA',
        coparticipacao: 'PARCIAL',
        registroAns: '484.252/19-9',
        codInternoComOdonto: '21218',
        codInternoSemOdonto: '21218',
        faixas: [
          { faixa: '00 a 18', faixaOrdem: 1, valorMedica1: 197.08, valorMedica2: 197.08 },
          { faixa: '19 a 23', faixaOrdem: 2, valorMedica1: 220.73, valorMedica2: 220.73 },
          { faixa: '24 a 28', faixaOrdem: 3, valorMedica1: 247.22, valorMedica2: 247.22 },
          { faixa: '29 a 33', faixaOrdem: 4, valorMedica1: 284.30, valorMedica2: 284.30 },
          { faixa: '34 a 38', faixaOrdem: 5, valorMedica1: 326.95, valorMedica2: 326.95 },
          { faixa: '39 a 43', faixaOrdem: 6, valorMedica1: 389.07, valorMedica2: 389.07 },
          { faixa: '44 a 48', faixaOrdem: 7, valorMedica1: 486.34, valorMedica2: 486.34 },
          { faixa: '49 a 53', faixaOrdem: 8, valorMedica1: 607.93, valorMedica2: 607.93 },
          { faixa: '54 a 58', faixaOrdem: 9, valorMedica1: 1033.48, valorMedica2: 1033.48 },
          { faixa: '59 ou mais', faixaOrdem: 10, valorMedica1: 1157.50, valorMedica2: 1157.50 }
        ]
      },
      {
        id: 'HAP-PME-2-29-NOSSO-PLAN-PARCIAL-APT-FOR',
        nomeProduto: 'Nosso Plano',
        segmentacao: 'AMB+HOSP+OBST',
        acomodacao: 'APARTAMENTO',
        coparticipacao: 'PARCIAL',
        registroAns: '484.251/19-1',
        codInternoComOdonto: '21219',
        codInternoSemOdonto: '21219',
        faixas: [
          { faixa: '00 a 18', faixaOrdem: 1, valorMedica1: 294.88, valorMedica2: 294.88 },
          { faixa: '19 a 23', faixaOrdem: 2, valorMedica1: 330.27, valorMedica2: 330.27 },
          { faixa: '24 a 28', faixaOrdem: 3, valorMedica1: 369.90, valorMedica2: 369.90 },
          { faixa: '29 a 33', faixaOrdem: 4, valorMedica1: 425.39, valorMedica2: 425.39 },
          { faixa: '34 a 38', faixaOrdem: 5, valorMedica1: 489.20, valorMedica2: 489.20 },
          { faixa: '39 a 43', faixaOrdem: 6, valorMedica1: 582.15, valorMedica2: 582.15 },
          { faixa: '44 a 48', faixaOrdem: 7, valorMedica1: 727.69, valorMedica2: 727.69 },
          { faixa: '49 a 53', faixaOrdem: 8, valorMedica1: 909.61, valorMedica2: 909.61 },
          { faixa: '54 a 58', faixaOrdem: 9, valorMedica1: 1546.34, valorMedica2: 1546.34 },
          { faixa: '59 ou mais', faixaOrdem: 10, valorMedica1: 1731.90, valorMedica2: 1731.90 }
        ]
      },
      {
        id: 'HAP-PME-2-29-NOSSO-PLAN-TOTAL-ENF-FOR',
        nomeProduto: 'Nosso Plano',
        segmentacao: 'AMB+HOSP+OBST',
        acomodacao: 'ENFERMARIA',
        coparticipacao: 'TOTAL',
        registroAns: '484.252/19-9',
        codInternoComOdonto: '11791',
        codInternoSemOdonto: '11791',
        faixas: [
          { faixa: '00 a 18', faixaOrdem: 1, valorMedica1: 153.99, valorMedica2: 153.99 },
          { faixa: '19 a 23', faixaOrdem: 2, valorMedica1: 172.47, valorMedica2: 172.47 },
          { faixa: '24 a 28', faixaOrdem: 3, valorMedica1: 193.17, valorMedica2: 193.17 },
          { faixa: '29 a 33', faixaOrdem: 4, valorMedica1: 222.15, valorMedica2: 222.15 },
          { faixa: '34 a 38', faixaOrdem: 5, valorMedica1: 255.47, valorMedica2: 255.47 },
          { faixa: '39 a 43', faixaOrdem: 6, valorMedica1: 304.01, valorMedica2: 304.01 },
          { faixa: '44 a 48', faixaOrdem: 7, valorMedica1: 380.01, valorMedica2: 380.01 },
          { faixa: '49 a 53', faixaOrdem: 8, valorMedica1: 475.01, valorMedica2: 475.01 },
          { faixa: '54 a 58', faixaOrdem: 9, valorMedica1: 807.52, valorMedica2: 807.52 },
          { faixa: '59 ou mais', faixaOrdem: 10, valorMedica1: 904.42, valorMedica2: 904.42 }
        ]
      }
    ]
  },

  // 4. CAMPO GRANDE - MS (PORTE 1 VIDA / MEI)
  {
    id: 'TAB-HAP-CG-MEI-1-VIDA-2026',
    operadora: 'HAPVIDA',
    modalidade: 'SUPER_SIMPLES_1_VIDA',
    cidade: 'Campo Grande',
    uf: 'MS',
    vigenciaInicio: '2026-07-01',
    vigenciaFim: '2026-09-30',
    taxaAdesao: 20.00,
    odontoPromoValor: 23.25,
    odontoCheioValor: 78.87,
    arquivoNome: 'tabela_mei_1_vida_campo_grande.pdf',
    criadoEm: '2026-07-01T00:00:00.000Z',
    ativo: true,
    produtos: [
      {
        id: 'HAP-MEI-INTEGRADO-PARCIAL-ENF-CG',
        nomeProduto: 'Integrado',
        segmentacao: 'AMB+HOSP+OBST',
        acomodacao: 'ENFERMARIA',
        coparticipacao: 'PARCIAL',
        registroAns: '482.991/19-3',
        codInternoComOdonto: '21432',
        codInternoSemOdonto: '21432',
        faixas: [
          { faixa: '00 a 18', faixaOrdem: 1, valorMedica1: 313.68, valorMedica2: 313.68 },
          { faixa: '19 a 23', faixaOrdem: 2, valorMedica1: 326.23, valorMedica2: 326.23 },
          { faixa: '24 a 28', faixaOrdem: 3, valorMedica1: 326.23, valorMedica2: 326.23 },
          { faixa: '29 a 33', faixaOrdem: 4, valorMedica1: 375.16, valorMedica2: 375.16 },
          { faixa: '34 a 38', faixaOrdem: 5, valorMedica1: 431.43, valorMedica2: 431.43 },
          { faixa: '39 a 43', faixaOrdem: 6, valorMedica1: 501.15, valorMedica2: 501.15 },
          { faixa: '44 a 48', faixaOrdem: 7, valorMedica1: 771.77, valorMedica2: 771.77 },
          { faixa: '49 a 53', faixaOrdem: 8, valorMedica1: 1180.81, valorMedica2: 1180.81 },
          { faixa: '54 a 58', faixaOrdem: 9, valorMedica1: 1328.06, valorMedica2: 1328.06 },
          { faixa: '59 ou mais', faixaOrdem: 10, valorMedica1: 1880.53, valorMedica2: 1880.53 }
        ]
      },
      {
        id: 'HAP-MEI-PLENO-PARCIAL-ENF-CG',
        nomeProduto: 'Pleno',
        segmentacao: 'AMB+HOSP+OBST',
        acomodacao: 'ENFERMARIA',
        coparticipacao: 'PARCIAL',
        registroAns: '482.995/19-6',
        codInternoComOdonto: '21433',
        codInternoSemOdonto: '21433',
        faixas: [
          { faixa: '00 a 18', faixaOrdem: 1, valorMedica1: 407.15, valorMedica2: 407.15 },
          { faixa: '19 a 23', faixaOrdem: 2, valorMedica1: 423.44, valorMedica2: 423.44 },
          { faixa: '24 a 28', faixaOrdem: 3, valorMedica1: 423.44, valorMedica2: 423.44 },
          { faixa: '29 a 33', faixaOrdem: 4, valorMedica1: 486.96, valorMedica2: 486.96 },
          { faixa: '34 a 38', faixaOrdem: 5, valorMedica1: 560.00, valorMedica2: 560.00 },
          { faixa: '39 a 43', faixaOrdem: 6, valorMedica1: 650.50, valorMedica2: 650.50 },
          { faixa: '44 a 48', faixaOrdem: 7, valorMedica1: 1001.77, valorMedica2: 1001.77 },
          { faixa: '49 a 53', faixaOrdem: 8, valorMedica1: 1532.71, valorMedica2: 1532.71 },
          { faixa: '54 a 58', faixaOrdem: 9, valorMedica1: 1723.84, valorMedica2: 1723.84 },
          { faixa: '59 ou mais', faixaOrdem: 10, valorMedica1: 2440.96, valorMedica2: 2440.96 }
        ]
      },
      {
        id: 'HAP-MEI-PLENO-PARCIAL-APT-CG',
        nomeProduto: 'Pleno',
        segmentacao: 'AMB+HOSP+OBST',
        acomodacao: 'APARTAMENTO',
        coparticipacao: 'PARCIAL',
        registroAns: '482.990/19-5',
        codInternoComOdonto: '21431',
        codInternoSemOdonto: '21431',
        faixas: [
          { faixa: '00 a 18', faixaOrdem: 1, valorMedica1: 528.84, valorMedica2: 528.84 },
          { faixa: '19 a 23', faixaOrdem: 2, valorMedica1: 549.99, valorMedica2: 549.99 },
          { faixa: '24 a 28', faixaOrdem: 3, valorMedica1: 549.99, valorMedica2: 549.99 },
          { faixa: '29 a 33', faixaOrdem: 4, valorMedica1: 632.49, valorMedica2: 632.49 },
          { faixa: '34 a 38', faixaOrdem: 5, valorMedica1: 727.36, valorMedica2: 727.36 },
          { faixa: '39 a 43', faixaOrdem: 6, valorMedica1: 844.90, valorMedica2: 844.90 },
          { faixa: '44 a 48', faixaOrdem: 7, valorMedica1: 1301.15, valorMedica2: 1301.15 },
          { faixa: '49 a 53', faixaOrdem: 8, valorMedica1: 1990.76, valorMedica2: 1990.76 },
          { faixa: '54 a 58', faixaOrdem: 9, valorMedica1: 2239.01, valorMedica2: 2239.01 },
          { faixa: '59 ou mais', faixaOrdem: 10, valorMedica1: 3170.44, valorMedica2: 3170.44 }
        ]
      }
    ]
  },

  // 5. RECIFE - PE (INDIVIDUAL)
  {
    id: 'TAB-HAP-REC-INDIVIDUAL-2026',
    operadora: 'HAPVIDA',
    modalidade: 'INDIVIDUAL',
    cidade: 'Recife',
    uf: 'PE',
    vigenciaInicio: '2026-07-01',
    vigenciaFim: '2026-09-30',
    taxaAdesao: 35.00,
    odontoPromoValor: 24.50,
    odontoCheioValor: 75.84,
    arquivoNome: 'tabela_individual_recife_pe.pdf',
    criadoEm: '2026-07-01T00:00:00.000Z',
    ativo: true,
    produtos: [
      {
        id: 'HAP-NOSSO-PLAN-PARCIAL-ENF-REC',
        nomeProduto: 'Nosso Plano',
        segmentacao: 'AMB+HOSP+OBST',
        acomodacao: 'ENFERMARIA',
        coparticipacao: 'PARCIAL',
        registroAns: '484.226/19-0',
        codInternoComOdonto: '21042',
        codInternoSemOdonto: '21043',
        faixas: [
          { faixa: '00 a 18', faixaOrdem: 1, valorMedica1: 321.82, valorMedica2: 347.32 },
          { faixa: '19 a 23', faixaOrdem: 2, valorMedica1: 397.77, valorMedica2: 429.29 },
          { faixa: '24 a 28', faixaOrdem: 3, valorMedica1: 457.44, valorMedica2: 493.68 },
          { faixa: '29 a 33', faixaOrdem: 4, valorMedica1: 512.33, valorMedica2: 552.92 },
          { faixa: '34 a 38', faixaOrdem: 5, valorMedica1: 537.95, valorMedica2: 580.57 },
          { faixa: '39 a 43', faixaOrdem: 6, valorMedica1: 607.88, valorMedica2: 656.04 },
          { faixa: '44 a 48', faixaOrdem: 7, valorMedica1: 756.02, valorMedica2: 815.92 },
          { faixa: '49 a 53', faixaOrdem: 8, valorMedica1: 1023.42, valorMedica2: 1104.51 },
          { faixa: '54 a 58', faixaOrdem: 9, valorMedica1: 1381.62, valorMedica2: 1491.09 },
          { faixa: '59 ou mais', faixaOrdem: 10, valorMedica1: 1743.74, valorMedica2: 1881.90 }
        ]
      },
      {
        id: 'HAP-NOSSO-PLAN-PARCIAL-APT-REC',
        nomeProduto: 'Nosso Plano',
        segmentacao: 'AMB+HOSP+OBST',
        acomodacao: 'APARTAMENTO',
        coparticipacao: 'PARCIAL',
        registroAns: '484.227/19-8',
        codInternoComOdonto: '21047',
        codInternoSemOdonto: '21048',
        faixas: [
          { faixa: '00 a 18', faixaOrdem: 1, valorMedica1: 482.76, valorMedica2: 508.26 },
          { faixa: '19 a 23', faixaOrdem: 2, valorMedica1: 596.69, valorMedica2: 628.21 },
          { faixa: '24 a 28', faixaOrdem: 3, valorMedica1: 686.19, valorMedica2: 722.44 },
          { faixa: '29 a 33', faixaOrdem: 4, valorMedica1: 768.53, valorMedica2: 809.13 },
          { faixa: '34 a 38', faixaOrdem: 5, valorMedica1: 806.96, valorMedica2: 849.59 },
          { faixa: '39 a 43', faixaOrdem: 6, valorMedica1: 911.86, valorMedica2: 960.04 },
          { faixa: '44 a 48', faixaOrdem: 7, valorMedica1: 1134.08, valorMedica2: 1194.00 },
          { faixa: '49 a 53', faixaOrdem: 8, valorMedica1: 1535.20, valorMedica2: 1616.32 },
          { faixa: '54 a 58', faixaOrdem: 9, valorMedica1: 2072.52, valorMedica2: 2182.03 },
          { faixa: '59 ou mais', faixaOrdem: 10, valorMedica1: 2615.73, valorMedica2: 2753.94 }
        ]
      }
    ]
  }
];
