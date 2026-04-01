/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Img, Preview, Section, Text, Hr, Button } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Fokuspark'
const LOGO_URL = 'https://oxrfslyuzcgxacomgzgw.supabase.co/storage/v1/object/public/email-assets/fokuspark-logo.png'

interface Props { recipientName?: string; body?: string; offerDetails?: string; ruleName?: string }

const FokusparkOfferEmail = ({ recipientName, body, offerDetails, ruleName }: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>{recipientName ? `${recipientName}, oferta exclusiva` : 'Oferta exclusiva'} — {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={header}>
          <Img src={LOGO_URL} width="56" height="56" alt="Fokuspark" style={logo} />
          <Text style={brandName}>Fokuspark</Text>
        </Section>
        <Container style={card}>
          <Heading style={h1}>
            {recipientName ? `${recipientName}, tenemos algo especial para ti 🎁` : 'Tenemos algo especial para ti 🎁'}
          </Heading>
          <Text style={textStyle}>
            {body || 'Queremos darte acceso exclusivo a nuestras herramientas premium de productividad y bienestar. Esta oferta es solo para ti.'}
          </Text>
          {offerDetails && (
            <Section style={offerBox}>
              <Text style={offerText}>{offerDetails}</Text>
            </Section>
          )}
          <Section style={ctaSection}>
            <Button style={ctaButton} href="https://fokuspark.com/pricing">
              Ver mi oferta exclusiva
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            {SITE_NAME} — Enfoca tu potencial
            {ruleName ? ` · ${ruleName}` : ''}
          </Text>
        </Container>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: FokusparkOfferEmail,
  subject: (data: Record<string, any>) => data.subject || 'Oferta exclusiva para ti — Fokuspark',
  displayName: 'Fokuspark Special Offer',
  previewData: { recipientName: 'Ana', body: 'Queremos ayudarte a llevar tu productividad al siguiente nivel.', offerDetails: '🧠 14 días gratis de Fokuspark Pro — focus timers, journaling avanzado y meditaciones premium', ruleName: 'Offer Campaign' },
} satisfies TemplateEntry

const main = { backgroundColor: '#f5f3ff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const wrapper = { padding: '40px 20px' }
const header = { textAlign: 'center' as const, marginBottom: '24px' }
const logo = { margin: '0 auto', borderRadius: '12px' }
const brandName = { fontSize: '20px', fontWeight: 'bold' as const, color: '#8b5cf6', margin: '8px 0 0', textAlign: 'center' as const }
const card = { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2332', margin: '0 0 20px' }
const textStyle = { fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 25px', whiteSpace: 'pre-wrap' as const }
const offerBox = { backgroundColor: '#f5f3ff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #c4b5fd', margin: '0 0 20px' }
const offerText = { fontSize: '15px', fontWeight: 'bold' as const, color: '#5b21b6', margin: '0', textAlign: 'center' as const }
const ctaSection = { textAlign: 'center' as const, margin: '20px 0' }
const ctaButton = { backgroundColor: '#8b5cf6', color: '#ffffff', padding: '12px 28px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold' as const, textDecoration: 'none' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0' }
