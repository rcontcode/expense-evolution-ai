/**
 * Surface textures (ported from Fokuspark).
 * Pure CSS / inline SVG data URIs. No assets, no requests.
 * Applied via CSS vars `--surface-texture` + `--surface-texture-size` on `<body>`.
 */

export type SurfaceTextureId =
  | 'none'
  | 'grid-math'
  | 'dot-paper'
  | 'linen'
  | 'denim'
  | 'limestone'
  | 'kraft';

export interface SurfaceTexture {
  id: SurfaceTextureId;
  name: { es: string; en: string };
  description: { es: string; en: string };
  cssImage: string;
  cssSize?: string;
}

const svg = (s: string) =>
  `url("data:image/svg+xml;utf8,${encodeURIComponent(s)}")`;

const linenSvg = `
<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'>
  <defs>
    <pattern id='w' width='4' height='4' patternUnits='userSpaceOnUse'>
      <path d='M0 2 H4' stroke='rgba(0,0,0,0.05)' stroke-width='0.6'/>
      <path d='M2 0 V4' stroke='rgba(0,0,0,0.04)' stroke-width='0.6'/>
    </pattern>
  </defs>
  <rect width='80' height='80' fill='url(#w)'/>
</svg>`;

const denimSvg = `
<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'>
  <path d='M0 8 L8 0' stroke='rgba(30,60,110,0.10)' stroke-width='1'/>
  <path d='M-2 2 L2 -2 M6 10 L10 6' stroke='rgba(30,60,110,0.06)' stroke-width='0.8'/>
</svg>`;

const limestoneSvg = `
<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'>
  <filter id='n'>
    <feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' seed='7'/>
    <feColorMatrix values='0 0 0 0 0.15  0 0 0 0 0.13  0 0 0 0 0.10  0 0 0 0.32 0'/>
  </filter>
  <rect width='240' height='240' filter='url(#n)'/>
</svg>`;

const kraftSvg = `
<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'>
  <filter id='k'>
    <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' seed='3'/>
    <feColorMatrix values='0 0 0 0 0.55  0 0 0 0 0.35  0 0 0 0 0.15  0 0 0 0.40 0'/>
  </filter>
  <rect width='260' height='260' filter='url(#k)'/>
</svg>`;

export const SURFACE_TEXTURES: SurfaceTexture[] = [
  {
    id: 'none',
    name: { es: 'Liso', en: 'Smooth' },
    description: { es: 'Sin textura.', en: 'No texture.' },
    cssImage: 'none',
  },
  {
    id: 'grid-math',
    name: { es: 'Cuadrícula', en: 'Math Grid' },
    description: {
      es: 'Papel de matemáticas. Estructura silenciosa.',
      en: 'Math paper. Quiet structure.',
    },
    cssImage: `
      linear-gradient(to right, hsl(var(--foreground) / 0.06) 1px, transparent 1px),
      linear-gradient(to bottom, hsl(var(--foreground) / 0.06) 1px, transparent 1px)
    `,
    cssSize: '24px 24px',
  },
  {
    id: 'dot-paper',
    name: { es: 'Punteado', en: 'Dot Paper' },
    description: {
      es: 'Bullet journal. Guía sin ruido.',
      en: 'Bullet journal. Guide without noise.',
    },
    cssImage: `radial-gradient(hsl(var(--foreground) / 0.18) 1px, transparent 1.2px)`,
    cssSize: '20px 20px',
  },
  {
    id: 'linen',
    name: { es: 'Lino', en: 'Linen' },
    description: { es: 'Tejido fino, táctil.', en: 'Fine woven, tactile.' },
    cssImage: svg(linenSvg),
    cssSize: '80px 80px',
  },
  {
    id: 'denim',
    name: { es: 'Denim', en: 'Denim' },
    description: { es: 'Diagonal de jean lavado.', en: 'Washed denim diagonal.' },
    cssImage: svg(denimSvg),
    cssSize: '8px 8px',
  },
  {
    id: 'limestone',
    name: { es: 'Caliza', en: 'Limestone' },
    description: { es: 'Piedra mate. Calma sostenida.', en: 'Matte stone. Sustained calm.' },
    cssImage: svg(limestoneSvg),
    cssSize: '220px 220px',
  },
  {
    id: 'kraft',
    name: { es: 'Kraft', en: 'Kraft' },
    description: { es: 'Papel kraft fibroso.', en: 'Fibrous kraft paper.' },
    cssImage: svg(kraftSvg),
    cssSize: '240px 240px',
  },
];

export const DEFAULT_SURFACE_TEXTURE: SurfaceTextureId = 'none';

export const getSurfaceTexture = (id: string | null): SurfaceTexture =>
  SURFACE_TEXTURES.find((t) => t.id === id) ??
  SURFACE_TEXTURES.find((t) => t.id === DEFAULT_SURFACE_TEXTURE)!;
