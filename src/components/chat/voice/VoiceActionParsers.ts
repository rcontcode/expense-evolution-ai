// Small, deterministic parsers for voice/chat actions (no AI).

export function parseOpenClientCommand(
  text: string,
  language: 'es' | 'en'
): string | null {
  const raw = text.trim();
  if (!raw) return null;

  // Normalize common ASR artifacts (keep it conservative)
  const cleaned = raw
    .replace(/^[\s,.;:]+/, '')
    .replace(/[\s,.;:]+$/, '')
    .trim();

  // Spanish examples:
  // - "entra al cliente ACME Corporation"
  // - "entra a el cliente ACME Corporation"
  // - "abre el cliente ACME Corporation"
  // - "muéstrame el cliente ACME Corporation"
  const esPatterns: RegExp[] = [
    /^(?:entra(?:\s+a)?|abre|abrir|abre\s+el|abre\s+la|muéstrame|muestrame|mostrar|ver)\s+(?:al|a\s+el|a\s+la|el|la)?\s*cliente\s+(.+)$/i,
    /^(?:cliente)\s+(.+)$/i,
  ];

  // English examples:
  // - "open client ACME Corporation"
  // - "show client ACME Corporation"
  const enPatterns: RegExp[] = [
    /^(?:open|show|enter|go\s+to|view)\s+(?:the\s+)?client\s+(.+)$/i,
    /^(?:client)\s+(.+)$/i,
  ];

  const patterns = language === 'es' ? esPatterns : enPatterns;

  for (const pattern of patterns) {
    const m = cleaned.match(pattern);
    if (m?.[1]) {
      const name = m[1]
        .replace(/["“”'’]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (name.length >= 3) return name;
    }
  }

  return null;
}
