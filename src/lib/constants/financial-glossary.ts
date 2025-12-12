// Financial Glossary - Educational definitions for common financial terms
// Each term has simple explanations in both Spanish and English

export interface GlossaryTerm {
  term: string;
  termEn: string;
  definition: string;
  definitionEn: string;
  example?: string;
  exampleEn?: string;
  tip?: string;
  tipEn?: string;
}

export const FINANCIAL_GLOSSARY: Record<string, GlossaryTerm> = {
  // ========== INCOME & TAXES ==========
  taxable: {
    term: "Gravable",
    termEn: "Taxable",
    definition: "Es el dinero sobre el cual debes pagar impuestos al gobierno. Si un ingreso es gravable, el CRA (gobierno de Canadá) tomará un porcentaje cuando declares tus impuestos.",
    definitionEn: "Money on which you must pay taxes to the government. If income is taxable, the CRA (Canadian government) will take a percentage when you file your taxes.",
    example: "Tu salario, pagos de clientes, y ganancias de inversiones generalmente son gravables.",
    exampleEn: "Your salary, client payments, and investment gains are generally taxable.",
    tip: "Los regalos y algunos reembolsos usualmente NO son gravables.",
    tipEn: "Gifts and some refunds are usually NOT taxable."
  },

  deductible: {
    term: "Deducible",
    termEn: "Deductible",
    definition: "Gastos que puedes restar de tus ingresos antes de calcular impuestos. Esto reduce la cantidad de impuestos que pagas.",
    definitionEn: "Expenses you can subtract from your income before calculating taxes. This reduces the amount of taxes you pay.",
    example: "Si ganaste $50,000 y tienes $10,000 en gastos deducibles, solo pagas impuestos sobre $40,000.",
    exampleEn: "If you earned $50,000 and have $10,000 in deductible expenses, you only pay taxes on $40,000.",
    tip: "Guarda todos tus recibos - cada gasto deducible es dinero que te ahorras.",
    tipEn: "Keep all your receipts - every deductible expense is money you save."
  },

  reimbursable: {
    term: "Reembolsable",
    termEn: "Reimbursable",
    definition: "Gastos que alguien más te va a devolver el dinero. Puede ser tu empleador, un cliente, o una compañía de seguros.",
    definitionEn: "Expenses that someone else will pay you back for. It could be your employer, a client, or an insurance company.",
    example: "Si compras materiales para un proyecto de un cliente y el contrato dice que te los pagan, es reembolsable.",
    exampleEn: "If you buy materials for a client project and the contract says they pay for it, it's reimbursable.",
    tip: "Siempre revisa tu contrato para saber qué gastos te reembolsan.",
    tipEn: "Always check your contract to know which expenses they reimburse."
  },

  itc: {
    term: "ITC (Crédito de Impuesto a Insumos)",
    termEn: "ITC (Input Tax Credit)",
    definition: "Si cobras HST/GST a tus clientes, puedes recuperar el HST/GST que pagaste en tus compras de negocio. Es dinero que el gobierno te devuelve.",
    definitionEn: "If you charge HST/GST to your clients, you can recover the HST/GST you paid on your business purchases. It's money the government returns to you.",
    example: "Pagaste $13 de HST en suministros de oficina. Puedes reclamar esos $13 como ITC.",
    exampleEn: "You paid $13 HST on office supplies. You can claim those $13 as ITC.",
    tip: "Solo aplica si estás registrado para HST/GST con el CRA.",
    tipEn: "Only applies if you're registered for HST/GST with the CRA."
  },

  // ========== ASSETS & LIABILITIES ==========
  asset: {
    term: "Activo",
    termEn: "Asset",
    definition: "Algo que PONE dinero en tu bolsillo. Un verdadero activo genera ingresos o aumenta de valor con el tiempo.",
    definitionEn: "Something that PUTS money in your pocket. A true asset generates income or increases in value over time.",
    example: "Inversiones que dan dividendos, propiedades que rentas, un negocio que genera ganancias.",
    exampleEn: "Investments that pay dividends, rental properties, a business that generates profits.",
    tip: "Robert Kiyosaki: 'Los ricos compran activos. Los pobres solo tienen gastos. La clase media compra pasivos creyendo que son activos.'",
    tipEn: "Robert Kiyosaki: 'The rich buy assets. The poor only have expenses. The middle class buys liabilities thinking they are assets.'"
  },

  liability: {
    term: "Pasivo",
    termEn: "Liability",
    definition: "Algo que SACA dinero de tu bolsillo. Son deudas u obligaciones que debes pagar.",
    definitionEn: "Something that TAKES money out of your pocket. These are debts or obligations you must pay.",
    example: "Hipoteca de tu casa (si no la rentas), préstamo del auto, tarjetas de crédito, préstamos estudiantiles.",
    exampleEn: "Home mortgage (if you don't rent it out), car loan, credit cards, student loans.",
    tip: "Tu objetivo es que tus activos generen suficiente dinero para pagar tus pasivos.",
    tipEn: "Your goal is for your assets to generate enough money to pay your liabilities."
  },

  netWorth: {
    term: "Patrimonio Neto",
    termEn: "Net Worth",
    definition: "Lo que realmente tienes = Total de Activos menos Total de Pasivos. Es como tu 'puntaje financiero' personal.",
    definitionEn: "What you actually own = Total Assets minus Total Liabilities. It's like your personal 'financial score'.",
    example: "Si tienes $100,000 en activos y $60,000 en deudas, tu patrimonio neto es $40,000.",
    exampleEn: "If you have $100,000 in assets and $60,000 in debt, your net worth is $40,000.",
    tip: "Revisa tu patrimonio neto cada mes. Si está creciendo, vas por buen camino.",
    tipEn: "Check your net worth every month. If it's growing, you're on the right track."
  },

  liquid: {
    term: "Líquido",
    termEn: "Liquid",
    definition: "Activos que puedes convertir en efectivo rápidamente (días o semanas) sin perder mucho valor.",
    definitionEn: "Assets you can convert to cash quickly (days or weeks) without losing much value.",
    example: "Dinero en cuenta de ahorros, acciones en bolsa, bonos del gobierno.",
    exampleEn: "Money in savings account, stocks on the exchange, government bonds.",
    tip: "Ten siempre 3-6 meses de gastos en activos líquidos como fondo de emergencia.",
    tipEn: "Always keep 3-6 months of expenses in liquid assets as an emergency fund."
  },

  depreciation: {
    term: "Depreciación",
    termEn: "Depreciation",
    definition: "La pérdida de valor de algo con el tiempo. Es lo opuesto a la apreciación (ganar valor).",
    definitionEn: "The loss of value of something over time. It's the opposite of appreciation (gaining value).",
    example: "Un auto nuevo pierde 20% de su valor al salir del lote. En 5 años puede valer la mitad.",
    exampleEn: "A new car loses 20% of its value when it leaves the lot. In 5 years it may be worth half.",
    tip: "Los ricos evitan comprar cosas que se deprecian. Prefieren invertir en lo que se aprecia.",
    tipEn: "The wealthy avoid buying things that depreciate. They prefer to invest in what appreciates."
  },

  // ========== INCOME TYPES ==========
  passiveIncome: {
    term: "Ingreso Pasivo",
    termEn: "Passive Income",
    definition: "Dinero que recibes sin trabajar activamente por él. Requiere trabajo inicial, pero luego sigue generando dinero.",
    definitionEn: "Money you receive without actively working for it. Requires initial work, but then keeps generating money.",
    example: "Rentas de propiedades, dividendos de acciones, regalías de un libro, ingresos de un curso online.",
    exampleEn: "Property rentals, stock dividends, book royalties, online course income.",
    tip: "El ingreso pasivo es la clave de la libertad financiera - tu dinero trabaja por ti.",
    tipEn: "Passive income is the key to financial freedom - your money works for you."
  },

  activeIncome: {
    term: "Ingreso Activo",
    termEn: "Active Income",
    definition: "Dinero que recibes a cambio de tu tiempo y trabajo directo. Si dejas de trabajar, dejas de ganar.",
    definitionEn: "Money you receive in exchange for your time and direct work. If you stop working, you stop earning.",
    example: "Tu salario, pagos por hora, proyectos de freelance, consultoría.",
    exampleEn: "Your salary, hourly payments, freelance projects, consulting.",
    tip: "Usa tu ingreso activo para comprar activos que generen ingreso pasivo.",
    tipEn: "Use your active income to buy assets that generate passive income."
  },

  dividend: {
    term: "Dividendo",
    termEn: "Dividend",
    definition: "Parte de las ganancias de una empresa que te pagan por ser dueño de acciones. Es como recibir un cheque por ser 'socio'.",
    definitionEn: "Part of a company's profits paid to you for owning shares. It's like receiving a check for being a 'partner'.",
    example: "Si tienes acciones de un banco canadiense, cada 3 meses te pagan dividendos.",
    exampleEn: "If you own shares of a Canadian bank, every 3 months they pay you dividends.",
    tip: "Las acciones que pagan dividendos son populares para crear ingreso pasivo.",
    tipEn: "Dividend-paying stocks are popular for creating passive income."
  },

  // ========== INVESTING ==========
  compound: {
    term: "Interés Compuesto",
    termEn: "Compound Interest",
    definition: "Cuando ganas intereses sobre tus intereses. Tu dinero crece cada vez más rápido con el tiempo.",
    definitionEn: "When you earn interest on your interest. Your money grows faster and faster over time.",
    example: "$1,000 al 10% anual = $2,593 en 10 años, pero $6,727 en 20 años (¡más que el doble!).",
    exampleEn: "$1,000 at 10% annually = $2,593 in 10 years, but $6,727 in 20 years (more than double!).",
    tip: "Einstein llamó al interés compuesto 'la octava maravilla del mundo'. Empieza a invertir joven.",
    tipEn: "Einstein called compound interest 'the eighth wonder of the world'. Start investing young."
  },

  diversification: {
    term: "Diversificación",
    termEn: "Diversification",
    definition: "No poner todos los huevos en una canasta. Invertir en diferentes tipos de activos para reducir el riesgo.",
    definitionEn: "Not putting all your eggs in one basket. Investing in different types of assets to reduce risk.",
    example: "En vez de solo acciones de una empresa, tienes acciones, bonos, bienes raíces, y algo de efectivo.",
    exampleEn: "Instead of just one company's stock, you have stocks, bonds, real estate, and some cash.",
    tip: "Si una inversión baja, las otras pueden compensar. Reduce el riesgo de perderlo todo.",
    tipEn: "If one investment drops, others can compensate. Reduces the risk of losing everything."
  },

  rrsp: {
    term: "RRSP",
    termEn: "RRSP",
    definition: "Registered Retirement Savings Plan. Cuenta de ahorro para el retiro donde no pagas impuestos hasta que retiras el dinero (idealmente cuando ganes menos).",
    definitionEn: "Registered Retirement Savings Plan. Retirement savings account where you don't pay taxes until you withdraw the money (ideally when you earn less).",
    example: "Si ganas $80,000 y pones $10,000 en RRSP, solo pagas impuestos sobre $70,000 este año.",
    exampleEn: "If you earn $80,000 and put $10,000 in RRSP, you only pay taxes on $70,000 this year.",
    tip: "Mejor si ganas más ahora que en el retiro. El límite es 18% de tu ingreso del año anterior.",
    tipEn: "Best if you earn more now than in retirement. The limit is 18% of your previous year's income."
  },

  tfsa: {
    term: "TFSA",
    termEn: "TFSA",
    definition: "Tax-Free Savings Account. Cuenta donde TODO el crecimiento es libre de impuestos - dividendos, ganancias, intereses. ¡Nunca pagas impuestos!",
    definitionEn: "Tax-Free Savings Account. Account where ALL growth is tax-free - dividends, gains, interest. You never pay taxes!",
    example: "Inviertes $10,000 y crece a $50,000. Los $40,000 de ganancia son 100% tuyos, sin impuestos.",
    exampleEn: "You invest $10,000 and it grows to $50,000. The $40,000 gain is 100% yours, no taxes.",
    tip: "Ideal para inversiones de alto crecimiento. Límite anual ~$7,000 (varía por año).",
    tipEn: "Ideal for high-growth investments. Annual limit ~$7,000 (varies by year)."
  },

  // ========== BUSINESS ==========
  cashFlow: {
    term: "Flujo de Efectivo",
    termEn: "Cash Flow",
    definition: "El dinero que entra y sale de tu bolsillo o negocio. Flujo positivo = entra más de lo que sale.",
    definitionEn: "The money coming in and going out of your pocket or business. Positive flow = more coming in than going out.",
    example: "Si recibes $5,000/mes y gastas $4,000, tienes flujo positivo de $1,000.",
    exampleEn: "If you receive $5,000/month and spend $4,000, you have positive cash flow of $1,000.",
    tip: "El flujo de efectivo es más importante que el patrimonio neto para el día a día.",
    tipEn: "Cash flow is more important than net worth for day-to-day life."
  },

  equity: {
    term: "Capital / Equity",
    termEn: "Equity",
    definition: "La parte que realmente es tuya después de restar lo que debes. En una casa: valor menos hipoteca.",
    definitionEn: "The part that's actually yours after subtracting what you owe. In a house: value minus mortgage.",
    example: "Casa vale $400,000, debes $300,000 de hipoteca. Tu equity es $100,000.",
    exampleEn: "House worth $400,000, you owe $300,000 mortgage. Your equity is $100,000.",
    tip: "Puedes usar tu equity como garantía para préstamos o líneas de crédito.",
    tipEn: "You can use your equity as collateral for loans or lines of credit."
  },

  roi: {
    term: "ROI (Retorno de Inversión)",
    termEn: "ROI (Return on Investment)",
    definition: "Cuánto ganas por cada dólar que inviertes, expresado en porcentaje.",
    definitionEn: "How much you earn for every dollar you invest, expressed as a percentage.",
    example: "Inviertes $1,000 y ganas $150. Tu ROI es 15%.",
    exampleEn: "You invest $1,000 and earn $150. Your ROI is 15%.",
    tip: "Compara el ROI de diferentes inversiones para tomar mejores decisiones.",
    tipEn: "Compare ROI of different investments to make better decisions."
  },

  // ========== FIRE & RETIREMENT ==========
  fire: {
    term: "FIRE",
    termEn: "FIRE",
    definition: "Financial Independence, Retire Early. Movimiento para ahorrar agresivamente y retirarte antes de los 65.",
    definitionEn: "Financial Independence, Retire Early. Movement to save aggressively and retire before 65.",
    example: "Ahorrar 50-70% de tus ingresos para retirarte en 10-15 años en vez de 40.",
    exampleEn: "Save 50-70% of your income to retire in 10-15 years instead of 40.",
    tip: "El número FIRE es ~25 veces tus gastos anuales (regla del 4%).",
    tipEn: "The FIRE number is ~25 times your annual expenses (4% rule)."
  },

  // ========== EXPENSE TRACKING ==========
  recurring: {
    term: "Recurrente",
    termEn: "Recurring",
    definition: "Algo que se repite regularmente - cada mes, cada semana, cada año. Son gastos o ingresos predecibles.",
    definitionEn: "Something that repeats regularly - every month, week, or year. These are predictable expenses or income.",
    example: "Netflix ($15/mes), salario ($3,000/mes), seguro del auto ($100/mes).",
    exampleEn: "Netflix ($15/month), salary ($3,000/month), car insurance ($100/month).",
    tip: "Revisa tus gastos recurrentes cada 3 meses - muchos puedes cancelar o negociar.",
    tipEn: "Review your recurring expenses every 3 months - many you can cancel or negotiate."
  },

  category: {
    term: "Categoría",
    termEn: "Category",
    definition: "Clasificación de tus gastos para entender en qué gastas tu dinero. Ayuda a identificar patrones.",
    definitionEn: "Classification of your expenses to understand what you spend your money on. Helps identify patterns.",
    example: "Comida, transporte, entretenimiento, vivienda, salud, educación.",
    exampleEn: "Food, transportation, entertainment, housing, health, education.",
    tip: "El CRA tiene categorías específicas para deducciones de negocio. Usa las correctas.",
    tipEn: "The CRA has specific categories for business deductions. Use the correct ones."
  }
};

// Get a term by key
export const getGlossaryTerm = (key: string): GlossaryTerm | undefined => {
  return FINANCIAL_GLOSSARY[key];
};

// Get all terms for a specific category
export const getGlossaryTermsByCategory = (category: 'taxes' | 'assets' | 'income' | 'investing' | 'business' | 'fire' | 'expense') => {
  const categoryMap: Record<string, string[]> = {
    taxes: ['taxable', 'deductible', 'reimbursable', 'itc'],
    assets: ['asset', 'liability', 'netWorth', 'liquid', 'depreciation'],
    income: ['passiveIncome', 'activeIncome', 'dividend'],
    investing: ['compound', 'diversification', 'rrsp', 'tfsa'],
    business: ['cashFlow', 'equity', 'roi'],
    fire: ['fire'],
    expense: ['recurring', 'category']
  };
  
  return categoryMap[category]?.map(key => ({ key, ...FINANCIAL_GLOSSARY[key] })) || [];
};
