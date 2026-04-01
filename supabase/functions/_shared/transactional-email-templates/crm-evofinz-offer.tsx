/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Img, Preview, Section, Text, Hr, Button } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'EvoFinz'
const LOGO_URL = 'https://oxrfslyuzcgxacomgzgw.supabase.co/storage/v1/object/public/email-assets/evofinz-phoenix-logo.png'

interface Props { recipientName?: string; body?: string; offerDetails?: string; ruleName?: string }

const EvoFinzOfferEmail = ({ recipientName, body, offerDetails, ruleName }: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>{recipientName ? `${recipientName}, oferta exclusiva` : 'Oferta exclusiva'} — {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={header}>
          <Img src={LOGO_URL} width="56" height="56" alt="EvoFinz" style={logo} />
          <Text style={brandName}>EvoFinz</Text>
        </Section>
        <Container style={card}>
          <Heading style={h1}>
            {recipientName ? `${recipientName}, tenemos algo especial para ti 🎁` : 'Tenemos algo especial para ti 🎁'}
          </Heading>
          <Text style={textStyle}>
            {body || 'Queremos darte acceso exclusivo a nuestras herramientas premium de finanzas con IA. Esta oferta es solo para ti.'}
          </Text>
          {offerDetails && (
            <Section style={offerBox}>
              <Text style={offerText}>{offerDetails}</Text>
            </Section>
          )}
          <Section style={ctaSection}>
            <Button style={ctaButton} href="https://evofinz.com/pricing">
              Ver mi oferta exclusiva
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            {SITE_NAME} — Evoluciona tus finanzas
            {ruleName ? ` · ${ruleName}` : ''}
          </Text>
        </Container>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: EvoFinzOfferEmail,
  subject: (data: Record<string, any>) => data.subject || 'Oferta exclusiva para ti — EvoFinz',
  displayName: 'EvoFinz Special Offer',
  previewData: { recipientName: 'Carlos', body: 'Por completar tu evaluación financiera, te damos acceso especial a EvoFinz Pro.', offerDetails: '🔥 30 días gratis de EvoFinz Pro — acceso completo a IA, contratos y reportes avanzados', ruleName: 'Offer Campaign' },
} satisfies TemplateEntry

const main = { backgroundColor: '#f0f7ff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const wrapper = { padding: '40px 20px' }
const header = { textAlign: 'center' as const, marginBottom: '24px' }
const logo = { margin: '0 auto', borderRadius: '12px' }
const brandName = { fontSize: '20px', fontWeight: 'bold' as const, color: '#2563eb', margin: '8px 0 0', textAlign: 'center' as const }
const card = { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2332', margin: '0 0 20px' }
const textStyle = { fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 25px', whiteSpace: 'pre-wrap' as const }
const offerBox = { backgroundColor: '#eff6ff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #bfdbfe', margin: '0 0 20px' }
const offerText = { fontSize: '15px', fontWeight: 'bold' as const, color: '#1e40af', margin: '0', textAlign: 'center' as const }
const ctaSection = { textAlign: 'center' as const, margin: '20px 0' }
const ctaButton = { backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 28px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold' as const, textDecoration: 'none' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0' }
