/**
 * Professional theme presets ported from Fokuspark.
 * ADDITIVE: applied as a CSS-var override on :root via useProfessionalTheme.
 * Does NOT replace the existing ThemeContext; coexists with it.
 * When 'none' is selected, EvoFinz default theme is used as-is.
 */

export type ProfessionalThemePresetId =
  | 'none'
  | 'editorial-night'
  | 'slate-pro'
  | 'mono-paper'
  | 'deep-forest'
  | 'midnight-indigo'
  | 'nordic-light'
  | 'warm-sand'
  | 'cool-mist'
  | 'carbon-black'
  | 'rose-clay'
  | 'oceanic-deep'
  | 'focus-paper';

export interface ProfessionalThemePreset {
  id: ProfessionalThemePresetId;
  name: { es: string; en: string };
  description: { es: string; en: string };
  mode: 'light' | 'dark';
  /** Gradient for swatch + phone-mockup screen */
  swatch: string;
  /** Tokens HSL "h s% l%" applied as CSS vars on :root */
  tokens: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    border: string;
    input: string;
    ring: string;
  };
}

const PRESETS_DATA: Omit<ProfessionalThemePreset, 'id'> & { id: Exclude<ProfessionalThemePresetId, 'none'> }[] = [] as never;

export const PROFESSIONAL_THEME_PRESETS: ProfessionalThemePreset[] = [
  {
    id: 'none',
    name: { es: 'Predeterminado', en: 'Default' },
    description: { es: 'Tema EvoFinz original.', en: 'Original EvoFinz theme.' },
    mode: 'light',
    swatch: 'linear-gradient(135deg, hsl(210 20% 98%) 0%, hsl(210 22% 90%) 70%, hsl(217 91% 60%) 100%)',
    tokens: {
      background: '', foreground: '', card: '', cardForeground: '',
      primary: '', primaryForeground: '', secondary: '', secondaryForeground: '',
      muted: '', mutedForeground: '', accent: '', accentForeground: '',
      border: '', input: '', ring: '',
    },
  },
  {
    id: 'editorial-night',
    name: { es: 'Editorial Noche', en: 'Editorial Night' },
    description: { es: 'Negro profundo y azul tinta.', en: 'Deep black with ink blue.' },
    mode: 'dark',
    swatch: 'linear-gradient(135deg, hsl(222 47% 6%) 0%, hsl(222 47% 9%) 60%, hsl(217 91% 60%) 100%)',
    tokens: {
      background: '222 47% 6%', foreground: '0 0% 98%',
      card: '222 47% 10%', cardForeground: '0 0% 98%',
      primary: '217 91% 60%', primaryForeground: '222 47% 6%',
      secondary: '222 30% 14%', secondaryForeground: '0 0% 95%',
      muted: '222 30% 14%', mutedForeground: '215 16% 78%',
      accent: '217 91% 50%', accentForeground: '0 0% 100%',
      border: '222 30% 20%', input: '222 30% 20%', ring: '217 91% 60%',
    },
  },
  {
    id: 'slate-pro',
    name: { es: 'Slate Pro', en: 'Slate Pro' },
    description: { es: 'Grafito profesional, sobrio, neutral.', en: 'Professional graphite, sober, neutral.' },
    mode: 'dark',
    swatch: 'linear-gradient(135deg, hsl(215 28% 10%) 0%, hsl(215 28% 14%) 60%, hsl(199 89% 55%) 100%)',
    tokens: {
      background: '215 28% 10%', foreground: '210 20% 96%',
      card: '215 28% 14%', cardForeground: '210 20% 96%',
      primary: '210 20% 88%', primaryForeground: '215 28% 10%',
      secondary: '215 25% 17%', secondaryForeground: '210 20% 92%',
      muted: '215 25% 17%', mutedForeground: '215 14% 78%',
      accent: '199 89% 55%', accentForeground: '0 0% 100%',
      border: '215 25% 24%', input: '215 25% 24%', ring: '199 89% 55%',
    },
  },
  {
    id: 'mono-paper',
    name: { es: 'Papel Mono', en: 'Mono Paper' },
    description: { es: 'Papel claro, tipografía protagonista.', en: 'Light paper, typography leads.' },
    mode: 'light',
    swatch: 'linear-gradient(135deg, hsl(40 30% 97%) 0%, hsl(40 22% 88%) 70%, hsl(0 0% 14%) 100%)',
    tokens: {
      background: '40 30% 96%', foreground: '0 0% 8%',
      card: '0 0% 100%', cardForeground: '0 0% 8%',
      primary: '0 0% 12%', primaryForeground: '40 30% 98%',
      secondary: '40 22% 90%', secondaryForeground: '0 0% 12%',
      muted: '40 20% 91%', mutedForeground: '0 0% 30%',
      accent: '0 0% 18%', accentForeground: '40 30% 98%',
      border: '40 14% 80%', input: '40 14% 80%', ring: '0 0% 14%',
    },
  },
  {
    id: 'deep-forest',
    name: { es: 'Bosque Profundo', en: 'Deep Forest' },
    description: { es: 'Verde oscuro orgánico.', en: 'Organic dark green.' },
    mode: 'dark',
    swatch: 'linear-gradient(135deg, hsl(160 30% 8%) 0%, hsl(160 30% 12%) 60%, hsl(160 70% 45%) 100%)',
    tokens: {
      background: '160 30% 8%', foreground: '150 25% 96%',
      card: '160 30% 12%', cardForeground: '150 25% 96%',
      primary: '160 70% 45%', primaryForeground: '160 30% 6%',
      secondary: '160 25% 16%', secondaryForeground: '150 25% 92%',
      muted: '160 25% 16%', mutedForeground: '160 14% 78%',
      accent: '160 70% 40%', accentForeground: '0 0% 100%',
      border: '160 25% 22%', input: '160 25% 22%', ring: '160 70% 45%',
    },
  },
  {
    id: 'midnight-indigo',
    name: { es: 'Índigo Medianoche', en: 'Midnight Indigo' },
    description: { es: 'Índigo profundo con violetas sutiles.', en: 'Deep indigo with subtle violets.' },
    mode: 'dark',
    swatch: 'linear-gradient(135deg, hsl(243 47% 9%) 0%, hsl(243 47% 13%) 60%, hsl(258 90% 66%) 100%)',
    tokens: {
      background: '243 47% 9%', foreground: '240 20% 96%',
      card: '243 47% 13%', cardForeground: '240 20% 96%',
      primary: '258 90% 66%', primaryForeground: '243 47% 9%',
      secondary: '243 35% 16%', secondaryForeground: '240 20% 92%',
      muted: '243 35% 16%', mutedForeground: '240 14% 78%',
      accent: '258 90% 60%', accentForeground: '0 0% 100%',
      border: '243 35% 24%', input: '243 35% 24%', ring: '258 90% 66%',
    },
  },
  {
    id: 'nordic-light',
    name: { es: 'Nórdico Claro', en: 'Nordic Light' },
    description: { es: 'Blanco frío con azul nórdico.', en: 'Cool white with nordic blue.' },
    mode: 'light',
    swatch: 'linear-gradient(135deg, hsl(210 30% 98%) 0%, hsl(210 22% 90%) 70%, hsl(210 85% 42%) 100%)',
    tokens: {
      background: '210 30% 98%', foreground: '215 30% 10%',
      card: '0 0% 100%', cardForeground: '215 30% 10%',
      primary: '210 85% 42%', primaryForeground: '210 30% 98%',
      secondary: '210 25% 91%', secondaryForeground: '215 30% 14%',
      muted: '210 25% 92%', mutedForeground: '215 18% 32%',
      accent: '210 85% 42%', accentForeground: '0 0% 100%',
      border: '210 22% 80%', input: '210 22% 80%', ring: '210 85% 42%',
    },
  },
  {
    id: 'warm-sand',
    name: { es: 'Arena Cálida', en: 'Warm Sand' },
    description: { es: 'Beige cálido con terracota.', en: 'Warm beige with terracotta.' },
    mode: 'light',
    swatch: 'linear-gradient(135deg, hsl(35 50% 99%) 0%, hsl(35 35% 90%) 70%, hsl(18 65% 42%) 100%)',
    tokens: {
      background: '35 35% 95%', foreground: '25 35% 12%',
      card: '35 50% 99%', cardForeground: '25 35% 12%',
      primary: '18 65% 42%', primaryForeground: '35 50% 98%',
      secondary: '35 30% 87%', secondaryForeground: '25 35% 14%',
      muted: '35 25% 88%', mutedForeground: '25 22% 32%',
      accent: '18 65% 42%', accentForeground: '0 0% 100%',
      border: '35 24% 76%', input: '35 24% 76%', ring: '18 65% 42%',
    },
  },
  {
    id: 'cool-mist',
    name: { es: 'Niebla Fría', en: 'Cool Mist' },
    description: { es: 'Gris azulado con turquesa.', en: 'Blue-grey with teal.' },
    mode: 'light',
    swatch: 'linear-gradient(135deg, hsl(200 25% 98%) 0%, hsl(200 18% 90%) 70%, hsl(185 70% 35%) 100%)',
    tokens: {
      background: '200 22% 96%', foreground: '210 28% 10%',
      card: '0 0% 100%', cardForeground: '210 28% 10%',
      primary: '185 70% 35%', primaryForeground: '200 20% 98%',
      secondary: '200 18% 90%', secondaryForeground: '210 28% 14%',
      muted: '200 18% 91%', mutedForeground: '210 18% 32%',
      accent: '185 70% 35%', accentForeground: '0 0% 100%',
      border: '200 18% 80%', input: '200 18% 80%', ring: '185 70% 35%',
    },
  },
  {
    id: 'rose-clay',
    name: { es: 'Arcilla Rosa', en: 'Rose Clay' },
    description: { es: 'Rosa polvoriento sobre crema.', en: 'Dusty rose on cream.' },
    mode: 'light',
    swatch: 'linear-gradient(135deg, hsl(25 50% 98%) 0%, hsl(25 35% 90%) 70%, hsl(345 55% 45%) 100%)',
    tokens: {
      background: '25 45% 96%', foreground: '345 28% 12%',
      card: '0 0% 100%', cardForeground: '345 28% 12%',
      primary: '345 55% 45%', primaryForeground: '25 50% 98%',
      secondary: '25 35% 89%', secondaryForeground: '345 28% 14%',
      muted: '25 30% 90%', mutedForeground: '345 18% 32%',
      accent: '345 55% 45%', accentForeground: '0 0% 100%',
      border: '25 28% 78%', input: '25 28% 78%', ring: '345 55% 45%',
    },
  },
  {
    id: 'carbon-black',
    name: { es: 'Carbón Puro', en: 'Carbon Black' },
    description: { es: 'Negro casi puro con ámbar.', en: 'Near-pure black with amber.' },
    mode: 'dark',
    swatch: 'linear-gradient(135deg, hsl(0 0% 5%) 0%, hsl(0 0% 9%) 60%, hsl(38 92% 58%) 100%)',
    tokens: {
      background: '0 0% 5%', foreground: '0 0% 96%',
      card: '0 0% 9%', cardForeground: '0 0% 96%',
      primary: '38 92% 58%', primaryForeground: '0 0% 8%',
      secondary: '0 0% 14%', secondaryForeground: '0 0% 92%',
      muted: '0 0% 14%', mutedForeground: '0 0% 78%',
      accent: '38 92% 55%', accentForeground: '0 0% 8%',
      border: '0 0% 20%', input: '0 0% 20%', ring: '38 92% 58%',
    },
  },
  {
    id: 'oceanic-deep',
    name: { es: 'Océano Profundo', en: 'Oceanic Deep' },
    description: { es: 'Azul océano con cian.', en: 'Ocean blue with cyan.' },
    mode: 'dark',
    swatch: 'linear-gradient(135deg, hsl(205 45% 8%) 0%, hsl(205 45% 12%) 60%, hsl(190 85% 55%) 100%)',
    tokens: {
      background: '205 45% 8%', foreground: '195 25% 96%',
      card: '205 45% 12%', cardForeground: '195 25% 96%',
      primary: '190 85% 55%', primaryForeground: '205 45% 8%',
      secondary: '205 35% 16%', secondaryForeground: '195 25% 92%',
      muted: '205 35% 16%', mutedForeground: '195 14% 78%',
      accent: '190 85% 50%', accentForeground: '205 45% 8%',
      border: '205 30% 24%', input: '205 30% 24%', ring: '190 85% 55%',
    },
  },
  {
    id: 'focus-paper',
    name: { es: 'Enfoque Papel', en: 'Focus Paper' },
    description: { es: 'Celeste papel cuadriculado.', en: 'Sky paper grid.' },
    mode: 'light',
    swatch: 'linear-gradient(135deg, hsl(205 70% 95%) 0%, hsl(205 60% 88%) 70%, hsl(215 60% 22%) 100%)',
    tokens: {
      background: '205 65% 94%', foreground: '215 40% 12%',
      card: '0 0% 100%', cardForeground: '215 40% 12%',
      primary: '215 70% 30%', primaryForeground: '205 65% 98%',
      secondary: '205 50% 88%', secondaryForeground: '215 40% 14%',
      muted: '205 45% 90%', mutedForeground: '215 25% 32%',
      accent: '215 70% 30%', accentForeground: '0 0% 100%',
      border: '205 35% 78%', input: '205 35% 78%', ring: '215 70% 30%',
    },
  },
];

export const DEFAULT_PROFESSIONAL_THEME: ProfessionalThemePresetId = 'none';

export const getProfessionalTheme = (id: string | null): ProfessionalThemePreset =>
  PROFESSIONAL_THEME_PRESETS.find((p) => p.id === id) ??
  PROFESSIONAL_THEME_PRESETS.find((p) => p.id === DEFAULT_PROFESSIONAL_THEME)!;
