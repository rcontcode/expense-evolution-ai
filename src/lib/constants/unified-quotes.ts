import { MENTOR_QUOTES } from './mentor-quotes';

export interface UnifiedQuote {
  text: string;
  author: string;
  reference?: string;
  category: string;
  source: 'evofinz' | 'fokuspark';
}

// Convert existing mentor quotes
const evofinzQuotes: UnifiedQuote[] = MENTOR_QUOTES.map(q => ({
  text: q.quote,
  author: q.author,
  reference: q.book || undefined,
  category: q.category,
  source: 'evofinz' as const,
}));

// Universal/Fokuspark quotes (only shown to Bundle users)
const fokusparkQuotes: UnifiedQuote[] = [
  { text: "La imaginación es más importante que el conocimiento.", author: "Albert Einstein", category: "mindset", source: "fokuspark" },
  { text: "Sé el cambio que quieres ver en el mundo.", author: "Mahatma Gandhi", category: "mindset", source: "fokuspark" },
  { text: "La única forma de hacer un gran trabajo es amar lo que haces.", author: "Steve Jobs", category: "entrepreneurship", source: "fokuspark" },
  { text: "El éxito es ir de fracaso en fracaso sin perder el entusiasmo.", author: "Winston Churchill", category: "mindset", source: "fokuspark" },
  { text: "La vida es lo que pasa mientras estás ocupado haciendo otros planes.", author: "John Lennon", category: "general", source: "fokuspark" },
  { text: "No cuentes los días, haz que los días cuenten.", author: "Muhammad Ali", category: "mindset", source: "fokuspark" },
  { text: "La disciplina es el puente entre las metas y los logros.", author: "Jim Rohn", category: "planning", source: "fokuspark" },
  { text: "Tu tiempo es limitado, no lo desperdicies viviendo la vida de otro.", author: "Steve Jobs", category: "freedom", source: "fokuspark" },
  { text: "El secreto del éxito es la constancia del propósito.", author: "Benjamin Disraeli", category: "planning", source: "fokuspark" },
  { text: "La mente es todo. En lo que piensas, te conviertes.", author: "Buda", category: "mindset", source: "fokuspark" },
  { text: "No esperes el momento perfecto, toma el momento y hazlo perfecto.", author: "Zoey Sayward", category: "mindset", source: "fokuspark" },
  { text: "El mejor momento para empezar fue ayer. El segundo mejor es ahora.", author: "Proverbio", category: "compound", source: "fokuspark" },
  { text: "La paz interior comienza cuando eliges no permitir que otra persona controle tus emociones.", author: "Pema Chödrön", category: "general", source: "fokuspark" },
  { text: "Respirar profundamente es el primer paso hacia la claridad.", author: "Thich Nhat Hanh", category: "general", source: "fokuspark" },
  { text: "La meditación no es escapar de la realidad, es ver la realidad con claridad.", author: "Bhante Gunaratana", category: "general", source: "fokuspark" },
  { text: "El enfoque no es decir sí a lo importante, es decir no a todo lo demás.", author: "Steve Jobs", category: "planning", source: "fokuspark" },
  { text: "La productividad nunca es accidental. Es el resultado del compromiso.", author: "Paul J. Meyer", category: "planning", source: "fokuspark" },
  { text: "Cuida tu cuerpo, es el único lugar donde tienes que vivir.", author: "Jim Rohn", category: "general", source: "fokuspark" },
  { text: "La gratitud convierte lo que tenemos en suficiente.", author: "Melody Beattie", category: "saving", source: "fokuspark" },
  { text: "Haz de cada día tu obra maestra.", author: "John Wooden", category: "mindset", source: "fokuspark" },
  { text: "El progreso, no la perfección, es lo que importa.", author: "Anónimo", category: "mindset", source: "fokuspark" },
  { text: "La calma es un superpoder.", author: "Anónimo", category: "general", source: "fokuspark" },
  { text: "Donde hay voluntad, hay camino.", author: "Proverbio", category: "mindset", source: "fokuspark" },
  { text: "La paciencia no es la habilidad de esperar, sino de mantener buena actitud mientras esperas.", author: "Joyce Meyer", category: "investing", source: "fokuspark" },
  { text: "El cambio es la ley de la vida.", author: "John F. Kennedy", category: "general", source: "fokuspark" },
  { text: "No puedes controlar el viento, pero puedes ajustar las velas.", author: "Jimmy Dean", category: "risk", source: "fokuspark" },
  { text: "La simplicidad es la máxima sofisticación.", author: "Leonardo da Vinci", category: "planning", source: "fokuspark" },
  { text: "El viaje de mil millas comienza con un solo paso.", author: "Lao Tzu", category: "compound", source: "fokuspark" },
];

export function getContextualQuote(
  route: string,
  timeOfDay: 'morning' | 'afternoon' | 'evening',
  hasBundleAccess: boolean
): UnifiedQuote {
  const available = hasBundleAccess
    ? [...evofinzQuotes, ...fokusparkQuotes]
    : evofinzQuotes;

  // Category preference by time
  const timeCategories: Record<string, string[]> = {
    morning: ['mindset', 'planning', 'self_investment'],
    afternoon: ['investing', 'entrepreneurship', 'saving'],
    evening: ['freedom', 'general', 'compound'],
  };

  const preferred = timeCategories[timeOfDay] || [];
  const preferredQuotes = available.filter(q => preferred.includes(q.category));
  const pool = preferredQuotes.length > 3 ? preferredQuotes : available;

  // Deterministic-ish selection based on date + route
  const seed = new Date().toDateString() + route;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return pool[Math.abs(hash) % pool.length];
}

export function getQuotesByCategory(category: string, hasBundleAccess: boolean): UnifiedQuote[] {
  const available = hasBundleAccess
    ? [...evofinzQuotes, ...fokusparkQuotes]
    : evofinzQuotes;
  return available.filter(q => q.category === category);
}
