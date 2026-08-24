/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Img, Preview, Section, Text, Hr, Button } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

// Future Lab — plantilla de los correos del aula (código de acceso y recuperación).
//
// POR QUÉ EXISTE ESTA PLANTILLA Y NO SE REUSÓ crm-universmind-welcome:
// esa trae clavados el botón «Explorar Universmind» apuntando a universmind.com y el pie
// «UniversMind — crianza con ciencia», que es la marca de Little (bebés 0-12 meses). Future
// Lab es otro producto y otro avatar: el padre de un hijo de 10 a 17 años. Mandarle el código
// de un curso de US$67 firmado por la app de bebés se lee como correo equivocado, y un padre
// que duda de un correo con un código no entra al curso — que es justo lo que este correo
// existe para lograr.
//
// EL NOMBRE TIENE QUE EMPEZAR CON `crm-universmind-`. No es estética: `send-transactional-email`
// decide desde qué dominio sale el correo con esa condición literal
// (`templateName.startsWith('crm-universmind-')`). Con el prefijo sale desde
// noreply@universmind.com; sin él, desde evofinz.com — y nadie se daría cuenta hasta que un
// comprador lo comentara.
const SITE_NAME = 'Future Lab'
const LOGO_URL = 'https://oxrfslyuzcgxacomgzgw.supabase.co/storage/v1/object/public/email-assets/universmind-logo.png'
const BRAND = '#7c3aed'
const ORO = '#fbbf24'

interface Props {
  recipientName?: string
  subject?: string
  body?: string
  ctaText?: string
  ctaUrl?: string
  /* El código de acceso, aparte del cuerpo. Va como dato propio para poder pintarlo como
     protagonista —caja, monoespaciado, letra grande— en vez de dejarlo perdido dentro de un
     párrafo. Es lo único de este correo que la persona no puede conseguir por su cuenta. */
  codigo?: string
  /* El curso se vende en los dos idiomas desde el 22-ago-2026. Sin esto el correo sale
     siempre marcado como español y Gmail le ofrece traducir su propio correo en inglés al
     comprador inglés. */
  idioma?: string
  ruleName?: string
}

const FutureLabEmail = ({ subject, body, ctaText, ctaUrl, codigo, idioma }: Props) => {
  const en = idioma === 'en'
  return (
    <Html lang={en ? 'en' : 'es'} dir="ltr">
      <Head />
      <Preview>{subject || 'Future Lab'}</Preview>
      <Body style={main}>
        <Container style={wrapper}>
          <Section style={header}>
            <Img src={LOGO_URL} width="56" height="56" alt={SITE_NAME} style={logo} />
            <Text style={brandName}>{SITE_NAME}</Text>
          </Section>
          <Container style={card}>
            {subject ? <Heading style={h1}>{subject}</Heading> : null}

            {/* El código va ARRIBA del texto: quien abre este correo lo abre por el código,
                no por la explicación. En el teléfono, lo que queda bajo el pliegue no se lee. */}
            {codigo ? (
              <Section style={cajaCodigo}>
                <Text style={rotulo}>{en ? 'YOUR ACCESS CODE' : 'TU CÓDIGO DE ACCESO'}</Text>
                <Text style={codigoTexto}>{codigo}</Text>
              </Section>
            ) : null}

            <Text style={textStyle}>
              {body || (en
                ? 'Your Future Lab classroom is ready.'
                : 'Tu aula del Future Lab está lista.')}
            </Text>

            {ctaText && ctaUrl ? (
              <Section style={ctaSection}>
                <Button style={ctaButton} href={ctaUrl}>{ctaText}</Button>
              </Section>
            ) : null}

            <Hr style={hr} />
            <Text style={footer}>
              {en
                ? 'Future Lab — a Universmind course · futurelab.universmind.com'
                : 'Future Lab — un curso de Universmind · futurelab.universmind.com'}
            </Text>
          </Container>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: FutureLabEmail,
  subject: (data: Record<string, any>) => data.subject || 'Future Lab',
  displayName: 'Future Lab — Acceso al aula',
  previewData: {
    recipientName: 'Marcela',
    subject: 'Tu código del Future Lab: FLAB-8LS3-68LB',
    codigo: 'FLAB-8LS3-68LB',
    body: 'Hola Marcela,\n\nTu compra quedó lista. Guarda este código donde lo vayas a encontrar: es el que abre las seis lecciones cada vez que vuelvas.\n\nEl acceso no vence y sirve en cualquier dispositivo.',
    ctaText: 'Entrar al aula',
    ctaUrl: 'https://futurelab.universmind.com/aula',
    idioma: 'es',
    ruleName: 'Future Lab — Acceso',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#f6f3ff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const wrapper = { padding: '40px 20px' }
const header = { textAlign: 'center' as const, marginBottom: '24px' }
const logo = { margin: '0 auto', borderRadius: '14px' }
const brandName = { fontSize: '20px', fontWeight: 'bold' as const, color: BRAND, margin: '8px 0 0', textAlign: 'center' as const }
const card = { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e9e2f8', padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const h1 = { fontSize: '21px', fontWeight: 'bold' as const, color: '#1a1530', lineHeight: '1.35', margin: '0 0 20px' }

/* La caja del código. Fondo violeta muy claro con borde dorado: el mismo par de colores que
   el aula usa para su llave, así que el comprador reconoce el correo como parte del curso. */
const cajaCodigo = { backgroundColor: '#faf7ff', border: '1.5px solid ' + ORO, borderRadius: '12px', padding: '16px 14px', margin: '0 0 22px', textAlign: 'center' as const }
const rotulo = { fontSize: '11px', letterSpacing: '0.14em', fontWeight: 'bold' as const, color: '#8b6d1f', margin: '0 0 8px' }
/* Monoespaciado y con espacio entre letras porque este código se dicta y se copia a mano:
   la I y la l, o el 0 y la O, se confunden en una tipografía de texto. El propio generador
   ya evita los caracteres ambiguos, y esto termina el trabajo del lado del que lee. */
const codigoTexto = { fontFamily: "'Courier New', Courier, monospace", fontSize: '24px', fontWeight: 'bold' as const, letterSpacing: '0.08em', color: '#1a1530', margin: '0' }

const textStyle = { fontSize: '15px', color: '#4b5563', lineHeight: '1.65', margin: '0 0 24px', whiteSpace: 'pre-wrap' as const }
const ctaSection = { textAlign: 'center' as const, margin: '8px 0 4px' }
/* Texto casi negro sobre el dorado: 10,5:1 de contraste, muy por encima del 4,5:1 que pide
   el criterio. El violeta con texto blanco daba 5,9:1 — pasa igual, pero el dorado es el
   botón que el comprador ya vio en la página de pago. */
const ctaButton = { backgroundColor: ORO, color: '#2a1a00', padding: '13px 30px', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold' as const, textDecoration: 'none' }
const hr = { borderColor: '#e9e2f8', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#9ca3af', margin: '0' }
