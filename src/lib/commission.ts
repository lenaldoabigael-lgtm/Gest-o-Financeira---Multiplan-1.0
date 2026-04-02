export interface SaleRecord {
  corretor: string;
  cargo: string;
  operadora: string;
  vidasTotais: number;
  vidasContrato: number;
  idade: number;
  premioMensal: number;
  parcela: number;
  valorParcela: number;
}

export interface CommissionResult extends SaleRecord {
  percentualAplicado: number;
  valorComissao: number;
  impostoRetido: number;
  valorLiquido: number;
  observacao: string;
}

function normalize(str: string) {
  return str.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function calculateCommission(sale: SaleRecord): CommissionResult {
  const cargo = normalize(sale.cargo);
  const operadora = normalize(sale.operadora);
  const parcela = sale.parcela;
  
  let percentual = 0;
  let obs = "";

  // Helper to check operadora
  const isHapvida = operadora.includes("hapvida");
  const isBradesco = operadora.includes("bradesco");
  const isAmil = operadora.includes("amil");
  const isSulamerica = operadora.includes("sulamerica") && !operadora.includes("odonto");
  const isSulamericaOdonto = operadora.includes("sulamerica") && operadora.includes("odonto");
  const isBlue = operadora.includes("blue");
  const isPlamed = operadora.includes("plamed");
  const isServdonto = operadora.includes("servdonto");
  const isSusep = ["all care", "affix", "corpe", "alter", "qualicorp"].some(op => operadora.includes(op));

  if (isSusep || cargo.includes("susep")) {
    if (parcela === 1) percentual = 100;
    obs = "100% + Bonificação";
  } else if (cargo.includes("trainee")) {
    if (parcela === 1) percentual = 100;
  } else if (cargo.includes("pleno")) {
    if (isHapvida) {
      if (parcela === 1) percentual = 100;
      if (parcela === 3) percentual = 20;
    } else if (isBradesco || isSulamerica || isAmil) {
      if (sale.premioMensal < 5000) {
        if (parcela === 1) percentual = 100;
        if (parcela === 3) percentual = 20;
      } else {
        if (parcela === 1) percentual = 100;
        if (parcela === 3) percentual = 40;
      }
    } else {
      if (parcela === 1) percentual = 100;
    }
  } else if (cargo.includes("senior")) {
    if (isHapvida || isAmil) {
      if (parcela === 1) percentual = 100;
      if (parcela === 2) percentual = 25;
      if (parcela === 3) percentual = 25;
    } else if (isBradesco || isSulamerica) {
      if (parcela === 1) percentual = 100;
      if (parcela === 2) percentual = 40;
      if (parcela === 3) percentual = 40;
    } else if (isBlue) {
      if (parcela === 1) percentual = 100;
      if (parcela === 2) percentual = 20;
      if (parcela === 3) percentual = 20;
    } else if (isServdonto || isPlamed) {
      if (parcela === 1) percentual = 100;
      if (parcela === 2) percentual = 20;
    } else {
      if (parcela === 1) percentual = 100;
    }
  } else if (cargo.includes("master")) {
    if (isHapvida) {
      if (parcela === 1) percentual = 100;
      if (parcela === 2) percentual = 20;
      if (parcela === 3) percentual = 20;
      if (parcela === 4) percentual = 30;
    } else if (isBradesco || isSulamerica) {
      if (parcela === 1) percentual = 100;
      if (parcela === 2) percentual = 50;
      if (parcela === 3) percentual = 50;
    } else if (isAmil || isPlamed || isBlue || isSulamericaOdonto || isServdonto) {
      if (parcela === 1) percentual = 100;
      if (parcela === 2) percentual = 25;
      if (parcela === 3) percentual = 25;
    } else {
      if (parcela === 1) percentual = 100;
    }
  } else if (cargo.includes("parceiro") || cargo.includes("externo")) {
    if (isHapvida) {
      if (parcela === 1) percentual = 100;
      if (parcela === 2) percentual = 40;
      if (parcela === 3) percentual = 30;
      if (parcela === 4) percentual = 30;
    } else if (isBradesco || isSulamerica) {
      if (parcela === 1) percentual = 100;
      if (parcela === 2) percentual = 50;
      if (parcela === 3) percentual = 50;
    } else if (isAmil || isPlamed || isBlue || isSulamericaOdonto || isServdonto) {
      if (parcela === 1) percentual = 100;
      if (parcela === 2) percentual = 25;
      if (parcela === 3) percentual = 25;
    } else {
      if (parcela === 1) percentual = 100;
    }
  } else if (cargo.includes("supervisor")) {
    if (isHapvida) {
      if (parcela === 1) percentual = 100;
      if (parcela === 2) percentual = 30;
      if (parcela === 3) percentual = 25;
    } else if (isBradesco || isSulamerica) {
      if (parcela === 1) percentual = 100;
      if (parcela === 2) percentual = 50;
      if (parcela === 3) percentual = 50;
    } else if (isAmil || isPlamed || isBlue || isSulamericaOdonto || isServdonto) {
      if (parcela === 1) percentual = 100;
      if (parcela === 2) percentual = 25;
      if (parcela === 3) percentual = 25;
    } else {
      if (parcela === 1) percentual = 100;
    }
  } else {
    // Default fallback
    if (parcela === 1) percentual = 100;
  }

  // Bonus Hapvida (Trainee and Pleno)
  let bonus = 0;
  if ((cargo.includes("trainee") || cargo.includes("pleno")) && isHapvida && sale.vidasTotais >= 6 && parcela === 1) {
    bonus = 200;
    obs += " + R$ 200,00 Bônus (6+ vidas). ";
  }

  // Calculate base commission
  let valorComissao = sale.valorParcela * (percentual / 100) + bonus;

  // Tax deductions
  let impostoRetido = 0;

  // Special tax rule for Parceiros PJ on Hapvida
  if (isHapvida && (cargo.includes("parceiro") || cargo.includes("externo"))) {
    if (parcela === 1) {
      impostoRetido = valorComissao * 0.07; // 7% na primeira
    } else if (parcela > 1) {
      impostoRetido = valorComissao * 0.15; // 15% nas demais
    }
  } 
  // Special tax rule for Supervisor on Hapvida (<= 99 vidas)
  else if (isHapvida && cargo.includes("supervisor") && sale.vidasContrato <= 99) {
    impostoRetido = valorComissao * 0.07; // 7% em todas as parcelas
  } 
  else {
    // General tax rules
    const has15PercentTax = isBradesco || isSulamerica || isAmil || operadora.includes("select") || isBlue || (isHapvida && sale.vidasContrato > 99);
    
    if (has15PercentTax) {
      impostoRetido = valorComissao * 0.15; // 15% em todas as parcelas
    } else if (isHapvida || isPlamed) {
      // "apenas nos valores referentes as segundas e terceiras parcelas da HAPVIDA, PLAMED"
      if (parcela > 1) {
        impostoRetido = valorComissao * 0.15;
      }
    }
  }

  const valorLiquido = valorComissao - impostoRetido;

  return {
    ...sale,
    percentualAplicado: percentual,
    valorComissao,
    impostoRetido,
    valorLiquido,
    observacao: obs.trim()
  };
}
