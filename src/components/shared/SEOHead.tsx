import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SEOHeadProps {
  title: string;
  description: string;
  path?: string;
  type?: 'website' | 'product' | 'article';
  image?: string;
  price?: string;
  currency?: string;
  jsonLd?: Record<string, unknown>;
  /** Páginas privadas/técnicas (ej. /dashboard) que no deben salir en buscadores. */
  noindex?: boolean;
}

const BASE_URL = 'https://evofinz.com';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertJsonLd(data: Record<string, unknown>) {
  let el = document.head.querySelector<HTMLScriptElement>('script[type="application/ld+json"][data-seo="1"]');
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.setAttribute('data-seo', '1');
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

/**
 * Aplica el <head> de cada página (título, descripción, canonical, Open Graph, JSON-LD).
 *
 * Se maneja el DOM directo a propósito: EvoFinz no usa react-helmet ni ningún componente
 * SEO por página — todas las rutas servían el título/descripción/canonical estáticos de
 * index.html. Verificado en producción (https://evofinz.com/about renderiza el h1 "About
 * EvoFinz" pero sirve `<title>EvoFinz - Evoluciona tus Finanzas</title>` y
 * `<link rel="canonical" href="https://evofinz.com/">`). Ese canonical hardcodeado le dice
 * a Google que /quiz, /about, /landing "son en realidad la home", lo que las desindexa.
 * Estas ~40 líneas resuelven esto sin agregar una dependencia. La última página montada
 * manda, que es el comportamiento correcto para una SPA de una sola vista a la vez.
 */
export function SEOHead({ title, description, path = '/', type = 'website', image, price, currency, jsonLd, noindex = false }: SEOHeadProps) {
  const { language } = useLanguage();
  const fullTitle = path === '/' ? title : `${title} | EvoFinz`;
  const url = `${BASE_URL}${path}`;
  const ogImage = image || DEFAULT_IMAGE;
  const ogLocale = language === 'en' ? 'en_US' : 'es_ES';
  const ogType = type === 'product' ? 'product' : 'website';
  const serializedJsonLd = JSON.stringify(
    jsonLd || {
      '@context': 'https://schema.org',
      '@type': type === 'product' ? 'Product' : 'WebPage',
      name: fullTitle,
      description,
      url,
      inLanguage: language,
      ...(type === 'product' && price
        ? { offers: { '@type': 'Offer', price, priceCurrency: currency || 'USD', availability: 'https://schema.org/InStock' } }
        : {}),
    },
  );

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = fullTitle;

    upsertMeta('name', 'description', description);
    upsertLink('canonical', url);
    // Se escribe SIEMPRE (no solo cuando noindex=true): las etiquetas se reutilizan entre
    // páginas, así que omitirlo dejaría el noindex de /dashboard pegado en la página pública
    // siguiente (ej. si el usuario navega de vuelta a /about).
    upsertMeta('name', 'robots', noindex ? 'noindex,nofollow' : 'index,follow');

    upsertMeta('property', 'og:type', ogType);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:image', ogImage);
    upsertMeta('property', 'og:site_name', 'EvoFinz');
    upsertMeta('property', 'og:locale', ogLocale);

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', ogImage);

    upsertJsonLd(JSON.parse(serializedJsonLd));
  }, [fullTitle, description, url, ogType, ogImage, ogLocale, language, serializedJsonLd, noindex]);

  return null;
}
