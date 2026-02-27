/**
 * Evo Ecosystem App Switcher Specification
 * 
 * Shared config for cross-app navigation between EvoFinz and Fokuspark.
 * This file is designed to be copied as-is to Fokuspark.
 */

export type EcoApp = 'evofinz' | 'fokuspark';

export interface EcoAppInfo {
  key: EcoApp;
  name: string;
  emoji: string;
  taglineEs: string;
  taglineEn: string;
  url: string;
  colorClass: string; // tailwind bg class token
}

export const ECO_APPS: Record<EcoApp, EcoAppInfo> = {
  evofinz: {
    key: 'evofinz',
    name: 'EvoFinz',
    emoji: '💰',
    taglineEs: 'Finanzas inteligentes',
    taglineEn: 'Smart finances',
    url: 'https://expense-evolution-ai.lovable.app',
    colorClass: 'bg-primary/15',
  },
  fokuspark: {
    key: 'fokuspark',
    name: 'Fokuspark',
    emoji: '🧘',
    taglineEs: 'Bienestar y enfoque',
    taglineEn: 'Wellbeing & focus',
    url: 'https://fokuspark.lovable.app',
    colorClass: 'bg-accent/15',
  },
};

export const ECO_MOTTO = {
  es: 'Tus finanzas y bienestar, conectados',
  en: 'Your finances and wellbeing, connected',
};

export function getEcoAppUrl(target: EcoApp, source: EcoApp, context?: string): string {
  const app = ECO_APPS[target];
  const params = new URLSearchParams({
    utm_source: source,
    utm_medium: 'ecosystem',
    utm_campaign: 'app-switcher',
  });
  if (context) params.set('context', context);
  return `${app.url}?${params.toString()}`;
}
