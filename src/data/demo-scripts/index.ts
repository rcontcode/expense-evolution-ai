// Embedded demo recording scripts. Source: /mnt/documents/demo-studio/*.md
// Imported as raw strings via Vite ?raw suffix.
import script01 from './01-tour-general-90s.md?raw';
import script02 from './02-chaos-inbox-2min.md?raw';
import script03 from './03-bank-master-truth-90s.md?raw';
import script04 from './04-voice-capture-60s.md?raw';
import script05 from './05-reports-tax-hub-2min.md?raw';

export type DemoScriptScenario = 'maria_profesional' | 'carlos_caos' | 'constructora_ca';

export interface DemoScript {
  id: string;
  number: string;
  title: string;
  duration: string;
  scenario: DemoScriptScenario;
  raw: string;
}

export const DEMO_SCRIPTS: DemoScript[] = [
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
