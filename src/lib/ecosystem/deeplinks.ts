/**
 * Cross-app deep linking utilities for the Evo Ecosystem.
 * Generates URLs to specific Fokuspark tools with UTM tracking.
 */

const FOKUSPARK_BASE = 'https://fokuspark.lovable.app';

const UTM = 'utm_source=evofinz&utm_medium=ecosystem&utm_campaign=deeplink';

export type FokusparkTool = 
  | 'breathing'
  | 'focus-timer'
  | 'meditation'
  | 'journal'
  | 'worry-dump'
  | 'dashboard'
  | 'tasks';

const TOOL_PATHS: Record<FokusparkTool, string> = {
  'breathing': '/tools/breathing',
  'focus-timer': '/tools/focus-timer',
  'meditation': '/tools/meditation',
  'journal': '/tools/journal',
  'worry-dump': '/tools/worry-dump',
  'dashboard': '/',
  'tasks': '/tasks',
};

export function getFokusparkUrl(tool: FokusparkTool = 'dashboard', context?: string): string {
  const path = TOOL_PATHS[tool] || '/';
  const params = new URLSearchParams();
  params.set('utm_source', 'evofinz');
  params.set('utm_medium', 'ecosystem');
  params.set('utm_campaign', 'deeplink');
  if (context) params.set('context', context);
  return `${FOKUSPARK_BASE}${path}?${params.toString()}`;
}

export function openFokusparkTool(tool: FokusparkTool, context?: string): void {
  window.open(getFokusparkUrl(tool, context), '_blank', 'noopener,noreferrer');
}

// Tool metadata for UI display
export interface FokusparkToolInfo {
  key: FokusparkTool;
  labelEs: string;
  labelEn: string;
  descEs: string;
  descEn: string;
  emoji: string;
}

export const FOKUSPARK_TOOLS: FokusparkToolInfo[] = [
  {
    key: 'breathing',
    labelEs: 'Respiración',
    labelEn: 'Breathing',
    descEs: 'Calma tu mente antes de decidir',
    descEn: 'Calm your mind before deciding',
    emoji: '🌬️',
  },
  {
    key: 'focus-timer',
    labelEs: 'Timer de Enfoque',
    labelEn: 'Focus Timer',
    descEs: 'Sesión de concentración guiada',
    descEn: 'Guided focus session',
    emoji: '⏱️',
  },
  {
    key: 'meditation',
    labelEs: 'Meditación',
    labelEn: 'Meditation',
    descEs: 'Mindfulness para claridad financiera',
    descEn: 'Mindfulness for financial clarity',
    emoji: '🧘',
  },
  {
    key: 'journal',
    labelEs: 'Diario',
    labelEn: 'Journal',
    descEs: 'Reflexiona sobre tus decisiones',
    descEn: 'Reflect on your decisions',
    emoji: '📓',
  },
  {
    key: 'worry-dump',
    labelEs: 'Desahogo',
    labelEn: 'Worry Dump',
    descEs: 'Libera preocupaciones financieras',
    descEn: 'Release financial worries',
    emoji: '🌧️',
  },
];
