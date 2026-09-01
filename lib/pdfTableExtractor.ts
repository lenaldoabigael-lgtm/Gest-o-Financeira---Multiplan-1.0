import { ModalidadeTabela, TabelaPrecoImportada, TabelaPrecoProdutoParsed, TabelaPrecoFaixa } from '../types';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker
if (typeof window !== 'undefined' && 'Worker' in window) {
  // Use cloudflare CDN worker matching the pdfjs-dist version or inline worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

const AGE_BRACKETS_LIST = [
  '00 a 18',
  '19 a 23',
  '24 a 28',
  '29 a 33',
  '34 a 38',
  '39 a 43',
  '44 a 48',
  '49 a 53',
  '54 a 58',
  '59 ou mais'
];

export interface ExtractedPageResult {
  pageNumber: number;
  cidade: string;
  uf: string;
  operadora: string;
  modalidade: ModalidadeTabela;
  vigenciaInicio: string;
  vigenciaFim: string;
  taxaAdesao: number;
  odontoPromoValor: number;
  odontoCheioValor: number;
  produtos: TabelaPrecoProdutoParsed[];
  rawText: string;
}

export interface ParsePdfOptions {
  operadora: string;
  modalidade: ModalidadeTabela;
  vigenciaInicio: string;
  vigenciaFim: string;
  arquivoNome?: string;
  onProgress?: (current: number, total: number, status: string) => void;
}

/**
 * Clean currency strings like "R$ 1.449,74" or "1449,74" to numeric 1449.74
 */
export function parseCurrencyValue(str: string): number {
  if (!str) return 0;
  const cleaned = str
    .replace(/R\$/g, '')
    .replace(/\s+/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : Math.round(val * 100) / 100;
}

/**
 * Extract structured text items with position from a PDF page
 */
async function extractPageText(page: any): Promise<{ fullText: string; lines: string[] }> {
  const textContent = await page.getTextContent();
  const items = textContent.items as Array<{ str: string; transform: number[]; width: number; height: number }>;
  
  if (!items || items.length === 0) {
    return { fullText: '', lines: [] };
  }

  // Sort items by Y coordinate (top to bottom) and then by X coordinate (left to right)
  const lineMap: Map<number, Array<{ str: string; x: number }>> = new Map();
  const yTolerance = 4;

  items.forEach(item => {
    const text = item.str.trim();
    if (!text) return;
    const x = item.transform[4];
    const y = item.transform[5];

    let foundY: number | null = null;
    for (const existingY of lineMap.keys()) {
      if (Math.abs(existingY - y) < yTolerance) {
        foundY = existingY;
        break;
      }
    }

    if (foundY !== null) {
      lineMap.get(foundY)!.push({ str: text, x });
    } else {
      lineMap.set(y, [{ str: text, x }]);
    }
  });

  const sortedYs = Array.from(lineMap.keys()).sort((a, b) => b - a);
  const lines: string[] = [];

  sortedYs.forEach(y => {
    const lineItems = lineMap.get(y)!;
    lineItems.sort((a, b) => a.x - b.x);
    lines.push(lineItems.map(i => i.str).join(' '));
  });

  const fullText = lines.join('\n');
  return { fullText, lines };
}

/**
 * Detects City and UF from page text
 */
function detectCityUf(text: string): { cidade: string; uf: string } {
  const normalized = text.toUpperCase();

  const citiesMap: Array<{ pattern: RegExp; cidade: string; uf: string }> = [
    { pattern: /FORTALEZA\s*[-–]\s*CE/i, cidade: 'Fortaleza', uf: 'CE' },
    { pattern: /JUAZEIRO\s*DO\s*NORTE\s*[-–]\s*CE/i, cidade: 'Juazeiro do Norte', uf: 'CE' },
    { pattern: /RECIFE\s*[-–]\s*PE/i, cidade: 'Recife', uf: 'PE' },
    { pattern: /CAMPINA\s*GRANDE\s*[-–]\s*PB/i, cidade: 'Campina Grande', uf: 'PB' },
    { pattern: /JO[ÃA]O\s*PESSOA\s*[-–]\s*PB/i, cidade: 'João Pessoa', uf: 'PB' },
    { pattern: /NATAL\s*[-–]\s*RN/i, cidade: 'Natal', uf: 'RN' },
    { pattern: /MOSSOR[OÓ]\s*[-–]\s*RN/i, cidade: 'Mossoró', uf: 'RN' },
    { pattern: /MACEI[OÓ]\s*[-–]\s*AL/i, cidade: 'Maceió', uf: 'AL' },
    { pattern: /ARACAJU\s*[-–]\s*SE/i, cidade: 'Aracaju', uf: 'SE' },
    { pattern: /SALVADOR\s*[-–]\s*BA/i, cidade: 'Salvador', uf: 'BA' },
    { pattern: /FEIRA\s*DE\s*SANTANA\s*[-–]\s*BA/i, cidade: 'Feira de Santana', uf: 'BA' },
    { pattern: /CAMA[CÇ]ARI\s*[-–]\s*BA/i, cidade: 'Camaçari', uf: 'BA' },
    { pattern: /BEL[EÉ]M\s*[-–]\s*PA/i, cidade: 'Belém', uf: 'PA' },
    { pattern: /PARAUAPEBAS\s*[-–]\s*PA/i, cidade: 'Parauapebas', uf: 'PA' },
    { pattern: /MANAUS\s*[-–]\s*AM/i, cidade: 'Manaus', uf: 'AM' },
    { pattern: /TERESINA\s*[-–]\s*PI/i, cidade: 'Teresina', uf: 'PI' },
    { pattern: /S[ÃA]O\s*LU[IÍ]S\s*[-–]\s*MA/i, cidade: 'São Luís', uf: 'MA' },
    { pattern: /GOI[AÂ]NIA\s*[-–]\s*GO/i, cidade: 'Goiânia', uf: 'GO' },
    { pattern: /AN[AÁ]POLIS\s*[-–]\s*GO/i, cidade: 'Anápolis', uf: 'GO' },
    { pattern: /RIO\s*VERDE\s*[-–]\s*GO/i, cidade: 'Rio Verde', uf: 'GO' },
    { pattern: /QUIRIN[OÓ]POLIS\s*[-–]\s*GO/i, cidade: 'Quirinópolis', uf: 'GO' },
    { pattern: /BRAS[IÍ]LIA\s*[-–]\s*DF/i, cidade: 'Brasília', uf: 'DF' },
    { pattern: /BELO\s*HORIZONTE\s*[-–]\s*MG/i, cidade: 'Belo Horizonte', uf: 'MG' },
    { pattern: /UBERABA\s*[-–]\s*MG/i, cidade: 'Uberaba', uf: 'MG' },
    { pattern: /UBERL[AÂ]NDIA\s*[-–]\s*MG/i, cidade: 'Uberlândia', uf: 'MG' },
    { pattern: /RIBEIR[AÃ]O\s*PRETO\s*[-–]\s*SP/i, cidade: 'Ribeirão Preto', uf: 'SP' },
    { pattern: /S[AÃ]O\s*JOS[EÉ]\s*DOS\s*CAMPOS\s*[-–]\s*SP/i, cidade: 'São José dos Campos', uf: 'SP' },
    { pattern: /S[AÃ]O\s*CARLOS\s*[-–]\s*SP/i, cidade: 'São Carlos', uf: 'SP' },
    { pattern: /LIMEIRA\s*[-–]\s*SP/i, cidade: 'Limeira', uf: 'SP' },
    { pattern: /BAURU\s*[-–]\s*SP/i, cidade: 'Bauru', uf: 'SP' },
    { pattern: /FRANCA\s*[-–]\s*SP/i, cidade: 'Franca', uf: 'SP' },
    { pattern: /LINS\s*[-–]\s*SP/i, cidade: 'Lins', uf: 'SP' },
    { pattern: /MAR[IÍ]LIA\s*[-–]\s*SP/i, cidade: 'Marília', uf: 'SP' },
    { pattern: /PIRACICABA\s*[-–]\s*SP/i, cidade: 'Piracicaba', uf: 'SP' },
    { pattern: /PIRASSUNUNGA\s*[-–]\s*SP/i, cidade: 'Pirassununga', uf: 'SP' },
    { pattern: /SERT[AÃ]OZINHO\s*[-–]\s*SP/i, cidade: 'Sertãozinho', uf: 'SP' },
    { pattern: /BARRETOS\s*[-–]\s*SP/i, cidade: 'Barretos', uf: 'SP' },
    { pattern: /JABOTICABAL\s*[-–]\s*SP/i, cidade: 'Jaboticabal', uf: 'SP' },
    { pattern: /CAMPO\s*GRANDE\s*[-–]\s*MS/i, cidade: 'Campo Grande', uf: 'MS' },
    { pattern: /DOURADOS\s*[-–]\s*MS/i, cidade: 'Dourados', uf: 'MS' },
    { pattern: /TR[EÊ]S\s*LAGOAS\s*[-–]\s*MS/i, cidade: 'Três Lagoas', uf: 'MS' },
    { pattern: /CUIAB[AÁ]\s*[-–]\s*MT/i, cidade: 'Cuiabá', uf: 'MT' },
    { pattern: /RONDON[OÓ]POLIS\s*[-–]\s*MT/i, cidade: 'Rondonópolis', uf: 'MT' },
    { pattern: /JOINVILLE\s*[-–]\s*SC|JOINVILLE/i, cidade: 'Joinville', uf: 'SC' }
  ];

  for (const item of citiesMap) {
    if (item.pattern.test(normalized)) {
      return { cidade: item.cidade, uf: item.uf };
    }
  }

  return { cidade: 'Principal', uf: 'BR' };
}

/**
 * Detects Modalidade from page text
 */
function detectModalidade(text: string, fallback: ModalidadeTabela): ModalidadeTabela {
  const norm = text.toUpperCase();
  if (norm.includes('PME (DE 30 A 99 VIDAS)') || norm.includes('30 A 99 VIDAS')) {
    return 'PME_30_99';
  }
  if (norm.includes('PORTE I') || norm.includes('DE 2 A 15 VIDAS') || norm.includes('DE 16 A 29 VIDAS') || norm.includes('2 A 29 VIDAS')) {
    return 'PME_2_29';
  }
  if (norm.includes('PORTE - 1 VIDA') || norm.includes('PORTE 1 VIDA')) {
    return 'SUPER_SIMPLES_1_VIDA';
  }
  if (norm.includes('PLANO DE SAÚDE INDIVIDUAL') || norm.includes('INDIVIDUAL')) {
    return 'INDIVIDUAL';
  }
  return fallback;
}

/**
 * Detects Taxa de Adesão from text
 */
function detectTaxaAdesao(text: string, modalidade: ModalidadeTabela): number {
  const match = 
    text.match(/(?:TX\.?|TAXA)\s*(?:DE\s*)?ADES[ÃA]O\s*(?::|\-)?\s*(?:R\$\s*)?(\d+[\d.,]*)/i) ||
    text.match(/ADES[ÃA]O\s*(?:POR\s*CONTRATO)?\s*(?::|\-)?\s*(?:R\$\s*)?(\d+[\d.,]*)/i);
  if (match && match[1]) {
    return parseCurrencyValue(match[1]);
  }
  if (modalidade === 'INDIVIDUAL') return 35.00;
  if (modalidade === 'PME_30_99' || modalidade === 'PME_2_29' || modalidade === 'SUPER_SIMPLES_1_VIDA') return 20.00;
  return 35.00;
}

/**
 * Detects Odonto values
 */
function detectOdontoValues(text: string): { promo: number; cheio: number } {
  // Look for +ODONTO table values
  const promoMatch = text.match(/VALOR\s*PROMO\s*(?:R\$\s*)?(\d+[\d.,]*)/i);
  const cheioMatch = text.match(/VALOR\s*(?:R\$\s*)?(\d+[\d.,]*)\s*VALOR\s*PROMO/i) || text.match(/VALOR[²\s]*(?:R\$\s*)?(\d+[\d.,]*)/i);

  const promo = promoMatch && promoMatch[1] ? parseCurrencyValue(promoMatch[1]) : 14.87;
  const cheio = cheioMatch && cheioMatch[1] ? parseCurrencyValue(cheioMatch[1]) : 75.84;

  return { promo, cheio };
}

/**
 * Extract rate tables from the page text lines
 */
function parseAgeLinesToProducts(
  lines: string[],
  cidade: string,
  modalidade: ModalidadeTabela
): TabelaPrecoProdutoParsed[] {
  const products: TabelaPrecoProdutoParsed[] = [];
  
  // Find age bracket lines (e.g. lines starting with "00 a 18", "19 a 23", etc.)
  const ageRowMap: Record<string, string[]> = {};
  
  lines.forEach(line => {
    const trimmed = line.trim();
    for (const b of AGE_BRACKETS_LIST) {
      const bRegex = new RegExp(`^(${b.replace(' ', '\\s*')})\\s*(?:anos)?\\s*(.*)`, 'i');
      if (bRegex.test(trimmed)) {
        const matches = trimmed.match(/R\$\s*[\d.,]+/g) || trimmed.match(/[\d]{2,4},[\d]{2}/g) || [];
        if (matches.length > 0) {
          ageRowMap[b] = matches;
        }
      }
    }
  });

  // If age brackets found, construct products from columns
  const rowKeys = Object.keys(ageRowMap);
  if (rowKeys.length >= 7) {
    // Number of columns detected in the first age bracket row
    const firstRowValues = ageRowMap['00 a 18'] || Object.values(ageRowMap)[0] || [];
    const numColumns = firstRowValues.length;

    // Detect plan names in the header text
    const joinedText = lines.join(' ').toUpperCase();
    const hasNossoPlano = joinedText.includes('NOSSO PLANO');
    const hasNossoMedico = joinedText.includes('NOSSO MÉDICO') || joinedText.includes('NOSSO MEDICO');
    const hasMix = joinedText.includes('MIX');
    const hasPleno = joinedText.includes('PLENO');
    const hasIntegrado = joinedText.includes('INTEGRADO');

    // Build standard configurations based on columns count
    if (modalidade === 'INDIVIDUAL') {
      // Typically:
      // Nosso Plano: Copart Parcial (Enferm, Apart) | Copart Total (Enferm, Apart)
      // Mix / Nosso Medico: Copart Parcial (Enferm, Apart)
      // Each has Medica 1 and Medica 2
      const createProduct = (
        name: string,
        acom: 'ENFERMARIA' | 'APARTAMENTO' | 'S/ ACOM',
        copart: 'PARCIAL' | 'TOTAL' | 'SEM_COPART',
        col1Idx: number,
        col2Idx: number
      ): TabelaPrecoProdutoParsed => {
        const faixas: TabelaPrecoFaixa[] = AGE_BRACKETS_LIST.map((b, idx) => {
          const rowVals = ageRowMap[b] || [];
          const v1 = rowVals[col1Idx] ? parseCurrencyValue(rowVals[col1Idx]) : 0;
          const v2 = rowVals[col2Idx] ? parseCurrencyValue(rowVals[col2Idx]) : v1;
          return {
            faixa: b,
            faixaOrdem: idx + 1,
            valorMedica1: v1,
            valorMedica2: v2
          };
        });

        return {
          id: `${name}-${acom}-${copart}-${Date.now()}-${col1Idx}`,
          nomeProduto: name,
          segmentacao: 'AMB+HOSP+OBST',
          acomodacao: acom,
          coparticipacao: copart,
          faixas
        };
      };

      if (numColumns >= 8) {
        // Col 0,1: Nosso Plano Parcial Enfermaria (Medica 1, Medica 2)
        // Col 2,3: Nosso Plano Parcial Apartamento (Medica 1, Medica 2)
        // Col 5,6 / 6,7: Nosso Plano Copart Enfermaria (Medica 1, Medica 2)
        // Col 7,8 / 8,9: Nosso Plano Copart Apartamento (Medica 1, Medica 2)
        products.push(createProduct('Nosso Plano', 'ENFERMARIA', 'PARCIAL', 0, 1));
        products.push(createProduct('Nosso Plano', 'APARTAMENTO', 'PARCIAL', 2, 3));
        
        const offset = numColumns >= 10 ? 5 : 4;
        products.push(createProduct('Nosso Plano', 'ENFERMARIA', 'TOTAL', offset, offset + 1));
        products.push(createProduct('Nosso Plano', 'APARTAMENTO', 'TOTAL', offset + 2, offset + 3));
      } else if (numColumns >= 4) {
        products.push(createProduct(hasNossoMedico ? 'Nosso Médico' : 'Nosso Plano', 'ENFERMARIA', 'PARCIAL', 0, 1));
        products.push(createProduct(hasNossoMedico ? 'Nosso Médico' : 'Nosso Plano', 'APARTAMENTO', 'PARCIAL', 2, 3));
      }
    } else {
      // PME (2-29 or 30-99 or MEI 1 vida)
      // Products have AMB (S/ ACOM) and AMB+HOSP+OBST (ENFERM, APART)
      const createPmeProduct = (
        name: string,
        seg: 'AMB' | 'AMB+HOSP+OBST',
        acom: 'S/ ACOM' | 'ENFERMARIA' | 'APARTAMENTO',
        copart: 'PARCIAL' | 'TOTAL' | 'SEM_COPART',
        col1Idx: number,
        col2Idx: number
      ): TabelaPrecoProdutoParsed => {
        const faixas: TabelaPrecoFaixa[] = AGE_BRACKETS_LIST.map((b, idx) => {
          const rowVals = ageRowMap[b] || [];
          const v1 = rowVals[col1Idx] ? parseCurrencyValue(rowVals[col1Idx]) : 0;
          const v2 = rowVals[col2Idx] ? parseCurrencyValue(rowVals[col2Idx]) : v1;
          return {
            faixa: b,
            faixaOrdem: idx + 1,
            valorMedica1: v1,
            valorMedica2: v2
          };
        });

        return {
          id: `${name}-${seg}-${acom}-${copart}-${Date.now()}-${col1Idx}`,
          nomeProduto: name,
          segmentacao: seg,
          acomodacao: acom,
          coparticipacao: copart,
          faixas
        };
      };

      const baseName = hasIntegrado ? 'Integrado' : hasPleno ? 'Pleno' : hasNossoMedico ? 'Nosso Médico' : 'Nosso Plano';

      if (numColumns >= 12) {
        // Full grid with Parcial (Amb, Enferm, Apart) and Total (Amb, Enferm, Apart)
        products.push(createPmeProduct(baseName, 'AMB', 'S/ ACOM', 'PARCIAL', 0, 1));
        products.push(createPmeProduct(baseName, 'AMB+HOSP+OBST', 'ENFERMARIA', 'PARCIAL', 2, 3));
        products.push(createPmeProduct(baseName, 'AMB+HOSP+OBST', 'APARTAMENTO', 'PARCIAL', 4, 5));
        products.push(createPmeProduct(baseName, 'AMB', 'S/ ACOM', 'TOTAL', 6, 7));
        products.push(createPmeProduct(baseName, 'AMB+HOSP+OBST', 'ENFERMARIA', 'TOTAL', 8, 9));
        products.push(createPmeProduct(baseName, 'AMB+HOSP+OBST', 'APARTAMENTO', 'TOTAL', 10, 11));
      } else if (numColumns >= 8) {
        // Enferm & Apart (Parcial & Total)
        products.push(createPmeProduct(baseName, 'AMB+HOSP+OBST', 'ENFERMARIA', 'PARCIAL', 0, 1));
        products.push(createPmeProduct(baseName, 'AMB+HOSP+OBST', 'APARTAMENTO', 'PARCIAL', 2, 3));
        products.push(createPmeProduct(baseName, 'AMB+HOSP+OBST', 'ENFERMARIA', 'TOTAL', 4, 5));
        products.push(createPmeProduct(baseName, 'AMB+HOSP+OBST', 'APARTAMENTO', 'TOTAL', 6, 7));
      } else if (numColumns >= 6) {
        // Amb, Enferm, Apart (Parcial or Total)
        products.push(createPmeProduct(baseName, 'AMB', 'S/ ACOM', 'PARCIAL', 0, 1));
        products.push(createPmeProduct(baseName, 'AMB+HOSP+OBST', 'ENFERMARIA', 'PARCIAL', 2, 3));
        products.push(createPmeProduct(baseName, 'AMB+HOSP+OBST', 'APARTAMENTO', 'PARCIAL', 4, 5));
      } else if (numColumns >= 4) {
        products.push(createPmeProduct(baseName, 'AMB+HOSP+OBST', 'ENFERMARIA', 'PARCIAL', 0, 1));
        products.push(createPmeProduct(baseName, 'AMB+HOSP+OBST', 'APARTAMENTO', 'PARCIAL', 2, 3));
      }
    }
  }

  return products;
}

/**
 * Main parser entry point to process a PDF File and extract all rate sheets
 */
export async function parsePdfRateSheet(
  file: File | ArrayBuffer,
  options: ParsePdfOptions
): Promise<TabelaPrecoImportada[]> {
  const arrayBuffer = file instanceof File ? await file.arrayBuffer() : file;
  const fileName = file instanceof File ? file.name : options.arquivoNome || 'tabela.pdf';

  if (options.onProgress) {
    options.onProgress(0, 100, 'Carregando documento PDF...');
  }

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;

  const results: TabelaPrecoImportada[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (options.onProgress) {
      options.onProgress(pageNum, totalPages, `Lendo página ${pageNum} de ${totalPages}...`);
    }

    const page = await pdfDoc.getPage(pageNum);
    const { fullText, lines } = await extractPageText(page);

    // Only process pages that contain pricing tables (skip pure adjustment index pages if separate)
    const isPriceTable = 
      (fullText.includes('TABELA DE VENDAS') || fullText.includes('COPARTICIPAÇÃO')) && 
      (fullText.includes('00 a 18') || fullText.includes('59 anos') || fullText.includes('59 ANOS'));

    if (!isPriceTable) {
      continue;
    }

    const { cidade, uf } = detectCityUf(fullText);
    const modalidade = detectModalidade(fullText, options.modalidade);
    const taxaAdesao = detectTaxaAdesao(fullText, modalidade);
    const { promo: odontoPromo, cheio: odontoCheio } = detectOdontoValues(fullText);

    const produtos = parseAgeLinesToProducts(lines, cidade, modalidade);

    if (produtos.length > 0) {
      results.push({
        id: `TAB-${options.operadora}-${cidade}-${uf}-${modalidade}-${Date.now()}-${pageNum}`,
        operadora: options.operadora.toUpperCase(),
        modalidade,
        cidade,
        uf,
        vigenciaInicio: options.vigenciaInicio,
        vigenciaFim: options.vigenciaFim,
        taxaAdesao,
        odontoPromoValor: odontoPromo,
        odontoCheioValor: odontoCheio,
        arquivoNome: fileName,
        produtos,
        criadoEm: new Date().toISOString(),
        ativo: true
      });
    }
  }

  if (options.onProgress) {
    options.onProgress(totalPages, totalPages, 'Processamento concluído com sucesso!');
  }

  return results;
}
