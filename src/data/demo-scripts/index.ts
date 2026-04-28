// Embedded demo recording scripts. Imported as raw strings via Vite ?raw suffix.
import script01 from './01-tour-general-90s.md?raw';
import script02 from './02-chaos-inbox-2min.md?raw';
import script03 from './03-bank-master-truth-90s.md?raw';
import script04 from './04-voice-capture-60s.md?raw';
import script05 from './05-reports-tax-hub-2min.md?raw';
import script06 from './06-familia-rodriguez-tour-12min.md?raw';
import script07 from './07-ecolavanderia-pyme-15min.md?raw';
import script08 from './08-pareja-millennial-4min.md?raw';
import script09 from './09-contador-independiente-10min.md?raw';
import script10 from './10-expat-multipais-8min.md?raw';
import script11 from './11-jubilado-inversiones-7min.md?raw';
import script12 from './12-emprendedor-digital-9min.md?raw';

export type DemoScriptScenario =
  | 'maria_profesional'
  | 'carlos_caos'
  | 'constructora_ca'
  | 'familia_rodriguez'
  | 'ecolavanderia_spa'
  | 'pareja_millennial'
  | 'contador_independiente'
  | 'expat_multipais'
  | 'jubilado_inversiones'
  | 'emprendedor_digital';

export interface DemoScript {
  id: string;
  number: string;
  title: string;
  duration: string;
  scenario: DemoScriptScenario;
  raw: string;
}

export const DEMO_SCRIPTS: DemoScript[] = [
  // SHOWCASE COMPLETOS (recomendados para grabar tour de venta)
  {
    id: 'familia-rodriguez',
    number: '06',
    title: 'Familia Rodríguez — Tour completo (CL)',
    duration: '12 min',
    scenario: 'familia_rodriguez',
    raw: script06,
  },
  {
    id: 'ecolavanderia',
    number: '07',
    title: 'EcoLavandería SpA — PYME completo (CL)',
    duration: '15 min',
    scenario: 'ecolavanderia_spa',
    raw: script07,
  },
  {
    id: 'contador-independiente',
    number: '09',
    title: 'Contador Independiente — Multi-entidad (CL)',
    duration: '10 min',
    scenario: 'contador_independiente',
    raw: script09,
  },
  {
    id: 'expat-multipais',
    number: '10',
    title: 'Expat Multi-País — CL ↔ CA',
    duration: '8 min',
    scenario: 'expat_multipais',
    raw: script10,
  },
  {
    id: 'jubilado-inversiones',
    number: '11',
    title: 'Jubilado con Inversiones — RRSP/TFSA (CA)',
    duration: '7 min',
    scenario: 'jubilado_inversiones',
    raw: script11,
  },
  {
    id: 'emprendedor-digital',
    number: '12',
    title: 'Emprendedor Digital — SaaS USD/CLP',
    duration: '9 min',
    scenario: 'emprendedor_digital',
    raw: script12,
  },
  // ARQUETIPOS FOCALIZADOS
  {
    id: 'tour-general',
    number: '01',
    title: 'Tour General',
    duration: '90s',
    scenario: 'maria_profesional',
    raw: script01,
  },
  {
    id: 'chaos-inbox',
    number: '02',
    title: 'Chaos Inbox + Smart Duplicates',
    duration: '2 min',
    scenario: 'carlos_caos',
    raw: script02,
  },
  {
    id: 'bank-master-truth',
    number: '03',
    title: 'Bank Master Truth',
    duration: '90s',
    scenario: 'maria_profesional',
    raw: script03,
  },
  {
    id: 'voice-capture',
    number: '04',
    title: 'Voice Capture móvil',
    duration: '60s',
    scenario: 'maria_profesional',
    raw: script04,
  },
  {
    id: 'reports-tax-hub',
    number: '05',
    title: 'Reports & Tax Hub',
    duration: '2 min',
    scenario: 'maria_profesional',
    raw: script05,
  },
  {
    id: 'pareja-millennial',
    number: '08',
    title: 'Pareja Millennial — Casa propia',
    duration: '4 min',
    scenario: 'pareja_millennial',
    raw: script08,
  },
];

/** Extract only the ES voiceover lines from a script. */
export function extractVoiceover(raw: string, lang: 'ES' | 'EN'): string {
  const prefix = `**${lang}:**`;
  return raw
    .split('\n')
    .filter((line) => line.trim().startsWith(prefix))
    .map((line) => line.replace(prefix, '').trim().replace(/^"|"$/g, ''))
    .join('\n\n');
}
