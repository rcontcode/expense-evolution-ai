export const MENTOR_QUOTES = [
  {
    quote: "No trabajes por dinero, haz que el dinero trabaje para ti.",
    author: "Robert Kiyosaki",
    book: "Padre Rico, Padre Pobre",
    category: "passive_income"
  },
  {
    quote: "El activo más poderoso que tenemos es nuestra mente.",
    author: "Robert Kiyosaki",
    book: "Padre Rico, Padre Pobre",
    category: "mindset"
  },
  {
    quote: "La regla número uno es nunca perder dinero. La regla número dos es nunca olvidar la regla número uno.",
    author: "Warren Buffett",
    book: "",
    category: "investing"
  },
  {
    quote: "El precio es lo que pagas. El valor es lo que obtienes.",
    author: "Warren Buffett",
    book: "",
    category: "investing"
  },
  {
    quote: "No ahorres lo que queda después de gastar, gasta lo que queda después de ahorrar.",
    author: "Warren Buffett",
    book: "",
    category: "saving"
  },
  {
    quote: "La diversificación es protección contra la ignorancia. Tiene poco sentido si sabes lo que estás haciendo.",
    author: "Warren Buffett",
    book: "",
    category: "investing"
  },
  {
    quote: "El mejor momento para plantar un árbol fue hace 20 años. El segundo mejor momento es ahora.",
    author: "Proverbio Chino",
    book: "",
    category: "general"
  },
  {
    quote: "Los ricos compran activos. Los pobres solo tienen gastos. La clase media compra pasivos que piensan que son activos.",
    author: "Robert Kiyosaki",
    book: "Padre Rico, Padre Pobre",
    category: "assets"
  },
  {
    quote: "Tu casa no es un activo, es un pasivo. Un activo pone dinero en tu bolsillo.",
    author: "Robert Kiyosaki",
    book: "Padre Rico, Padre Pobre",
    category: "assets"
  },
  {
    quote: "El interés compuesto es la octava maravilla del mundo. El que lo entiende, lo gana; el que no, lo paga.",
    author: "Albert Einstein",
    book: "",
    category: "compound"
  },
  {
    quote: "Nunca dependas de un solo ingreso. Haz inversiones para crear una segunda fuente.",
    author: "Warren Buffett",
    book: "",
    category: "passive_income"
  },
  {
    quote: "La libertad financiera es libertad de preocupaciones.",
    author: "Tony Robbins",
    book: "Money: Master the Game",
    category: "freedom"
  },
  {
    quote: "El dinero es un terrible amo pero un excelente sirviente.",
    author: "P.T. Barnum",
    book: "",
    category: "mindset"
  },
  {
    quote: "Invierte en ti mismo. Tu carrera es el motor de tu riqueza.",
    author: "Benjamin Graham",
    book: "El Inversor Inteligente",
    category: "self_investment"
  },
  {
    quote: "La mayoría de la gente planifica más una semana de vacaciones que su vida financiera.",
    author: "Mary Hunt",
    book: "",
    category: "planning"
  },
  {
    quote: "No se trata de cuánto dinero ganas, sino de cuánto dinero conservas.",
    author: "Robert Kiyosaki",
    book: "Padre Rico, Padre Pobre",
    category: "saving"
  },
  {
    quote: "El juego del dinero se gana en la mente, no en un banco.",
    author: "Robert Kiyosaki",
    book: "Incrementa tu IQ Financiero",
    category: "mindset"
  },
  {
    quote: "Los emprendedores ven problemas como oportunidades.",
    author: "Robert Kiyosaki",
    book: "El Cuadrante del Flujo del Dinero",
    category: "entrepreneurship"
  },
  {
    quote: "Muévete del cuadrante E (empleado) al cuadrante D (dueño de negocio) o I (inversor).",
    author: "Robert Kiyosaki",
    book: "El Cuadrante del Flujo del Dinero",
    category: "cashflow"
  },
  {
    quote: "El riesgo viene de no saber lo que estás haciendo.",
    author: "Warren Buffett",
    book: "",
    category: "risk"
  }
];

export const FINANCIAL_TIPS = [
  {
    tip: "Crea un fondo de emergencia de 3-6 meses de gastos antes de invertir.",
    category: "emergency_fund",
    difficulty: "beginner"
  },
  {
    tip: "Automatiza tus ahorros: págate a ti primero.",
    category: "automation",
    difficulty: "beginner"
  },
  {
    tip: "Diversifica tus fuentes de ingreso: no dependas de una sola.",
    category: "diversification",
    difficulty: "intermediate"
  },
  {
    tip: "Reinvierte tus ganancias para aprovechar el interés compuesto.",
    category: "compound",
    difficulty: "intermediate"
  },
  {
    tip: "Educa tu mente financiera: lee al menos un libro de finanzas al mes.",
    category: "education",
    difficulty: "beginner"
  },
  {
    tip: "Distingue entre activos y pasivos: compra activos que generen ingresos.",
    category: "assets",
    difficulty: "intermediate"
  },
  {
    tip: "Reduce gastos innecesarios y redirígelos a inversiones.",
    category: "expenses",
    difficulty: "beginner"
  },
  {
    tip: "Considera ingresos pasivos digitales: cursos, ebooks, afiliados.",
    category: "digital",
    difficulty: "intermediate"
  }
];

export function getRandomQuote(category?: string): typeof MENTOR_QUOTES[0] {
  const filtered = category 
    ? MENTOR_QUOTES.filter(q => q.category === category)
    : MENTOR_QUOTES;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export function getRandomTip(difficulty?: string): typeof FINANCIAL_TIPS[0] {
  const filtered = difficulty 
    ? FINANCIAL_TIPS.filter(t => t.difficulty === difficulty)
    : FINANCIAL_TIPS;
  return filtered[Math.floor(Math.random() * filtered.length)];
}
