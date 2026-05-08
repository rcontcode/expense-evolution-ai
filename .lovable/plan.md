# Profesionalizar EvoFinz fuera de Lovable

## 1. Reemplazar favicons e íconos con el fénix
Usar `src/assets/phoenix-no-bg.png` como fuente y generar (con ImageMagick vía nix) todos los tamaños:

| Archivo destino | Tamaño |
|---|---|
| `public/favicon.ico` | multi (16/32/48) |
| `public/favicon-32.png` | 32×32 |
| `public/favicon-16.png` | 16×16 |
| `public/apple-touch-icon.png` | 180×180 (con fondo de marca, sin transparencia para iOS) |
| `public/pwa-192x192.png` | 192×192 |
| `public/pwa-512x512.png` | 512×512 |
| `public/og-image.png` | 1200×630 (fénix + texto "EvoFinz — Evoluciona tus Finanzas" sobre fondo de marca) |

Reemplazan los archivos actuales (logo Lovable / placeholders).

## 2. Crear `public/manifest.webmanifest`
Hoy `index.html` lo referencia pero no existe. Crearlo con:
- `name`: "EvoFinz — Evoluciona tus Finanzas"
- `short_name`: "EvoFinz"
- `theme_color`: `#8B5CF6` (consistente con `index.html`)
- `background_color`: acorde a la marca
- `display`: `standalone`
- `start_url`: `/`
- `icons`: referencias a `pwa-192x192.png` y `pwa-512x512.png` (con `purpose: "any maskable"`)

Nota: solo manifest, sin service worker ni `vite-plugin-pwa` (mantiene la app instalable sin riesgos de cache).

## 3. Actualizar URLs al dominio real `evofinz.com`
- `public/sitemap.xml`: reemplazar `expense-evolution-ai.lovable.app` → `evofinz.com` en los 5 `<loc>` y subir `lastmod`.
- `public/robots.txt`: actualizar línea `Sitemap:` a `https://evofinz.com/sitemap.xml`.
- `index.html`: ya tiene `og:url` y canonical en `evofinz.com` ✓ (sin cambios).

## 4. Ocultar el badge "Edit with Lovable"
Llamar `publish_settings--set_badge_visibility` con `hide_badge: true` (requiere aprobación tuya y plan Pro+).

## 5. Pasos manuales que tenés que hacer vos (te los detallo después de implementar)
Resumen rápido para que sepas qué viene:
- Dar de alta `evofinz.com` en Google Search Console.
- Verificar propiedad (TXT en Cloudflare).
- Enviar el sitemap.
- Pedir indexación de la home.
- Probar previews en WhatsApp/LinkedIn.

Te paso el paso a paso detallado una vez completados los puntos 1–4.

## Detalle técnico
- Generación de imágenes: `nix run nixpkgs#imagemagick -- ...` (convert/magick). Para el OG image: componer fénix sobre fondo `#0F0A1F` con texto blanco usando `-pointsize` y `-annotate`.
- QA visual: convertir cada PNG generado a vista previa y verificar antes de entregar.
- No tocar `src/integrations/supabase/*`, `.env`, ni `supabase/config.toml`.
