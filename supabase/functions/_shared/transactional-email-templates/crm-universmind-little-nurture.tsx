/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Img, Preview, Section, Text, Hr, Button } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

// Universmind Little — plantilla de la secuencia de nurturing de la Brújula.
// Marca: crianza con ciencia, sin culpa. Renderiza el copy FIJO (subject + body)
// que le pasa el ejecutor, más un botón CTA opcional (ctaText/ctaUrl).
const SITE_NAME = 'Universmind Little'
const LOGO_URL = 'https://oxrfslyuzcgxacomgzgw.supabase.co/storage/v1/object/public/email-assets/universmind-email-logo.png'
const BRAND = '#8b5cf6'

interface Props {
  recipientName?: string
  subject?: string
  body?: string
  ctaText?: string
  ctaUrl?: string
  ruleName?: string
}

const UniversmindLittleNurtureEmail = ({ subject, body, ctaText, ctaUrl }: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>{subject || 'Universmind Little'}</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={header}>
          <Img src={LOGO_URL} width="56" height="56" alt={SITE_NAME} style={logo} />
          <Text style={brandName}>{SITE_NAME}</Text>
        </Section>
        <Container style={card}>
          {subject ? <Heading style={h1}>{subject}</Heading> : null}
          <Text style={textStyle}>
            {body || 'La ciencia de criar a tu bebé, en simple y sin culpa.'}
          </Text>
          {ctaText && ctaUrl ? (
            <Section style={ctaSection}>
              <Button style={ctaButton} href={ctaUrl}>{ctaText}</Button>
            </Section>
          ) : null}
          <Hr style={hr} />
          <Text style={footer}>
            {SITE_NAME} — la ciencia de criar, en simple
          </Text>
        </Container>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: UniversmindLittleNurtureEmail,
  subject: (data: Record<string, any>) => data.subject || 'Universmind Little',
  displayName: 'Universmind Little — Nurturing',
  previewData: {
    recipientName: 'Ana',
    subject: 'Tu Brújula está lista, Ana 🧭',
    body: 'Ana, antes que nada: no estás fallando. Nadie te entregó un manual junto con tu bebé — yo tampoco lo tuve.\n\nSoy Rudy. Papá de dos, e ingeniero. En vez de quedarme con opiniones, fui a leer los estudios. De ahí nació Universmind Little.',
    ctaText: 'Ver mi resultado de la Brújula',
    ctaUrl: 'https://universmind.com/evaluacion',
    ruleName: 'Universmind Little — Brújula Nurturing',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#faf5ff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const wrapper = { padding: '40px 20px' }
const header = { textAlign: 'center' as const, marginBottom: '24px' }
const logo = { margin: '0 auto', borderRadius: '14px' }
const brandName = { fontSize: '20px', fontWeight: 'bold' as const, color: BRAND, margin: '8px 0 0', textAlign: 'center' as const }
const card = { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #ece5f6', padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const h1 = { fontSize: '21px', fontWeight: 'bold' as const, color: '#1a1530', lineHeight: '1.35', margin: '0 0 20px' }
const textStyle = { fontSize: '15px', color: '#4b5563', lineHeight: '1.65', margin: '0 0 24px', whiteSpace: 'pre-wrap' as const }
const ctaSection = { textAlign: 'center' as const, margin: '8px 0 4px' }
const ctaButton = { backgroundColor: BRAND, color: '#ffffff', padding: '13px 30px', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold' as const, textDecoration: 'none' }
const hr = { borderColor: '#ece5f6', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#9ca3af', margin: '0' }
