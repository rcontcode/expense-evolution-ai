/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Img, Preview, Section, Text, Hr, Button } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'UniversMind'
const LOGO_URL = 'https://oxrfslyuzcgxacomgzgw.supabase.co/storage/v1/object/public/email-assets/universmind-logo.png'

interface Props { recipientName?: string; body?: string; ruleName?: string }

const UniversMindWelcomeEmail = ({ recipientName, body, ruleName }: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>{recipientName ? `¡Bienvenido ${recipientName}!` : '¡Bienvenido!'} — {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={header}>
          <Img src={LOGO_URL} width="56" height="56" alt="UniversMind" style={logo} />
          <Text style={brandName}>UniversMind</Text>
        </Section>
        <Container style={card}>
          <Heading style={h1}>
            {recipientName ? `¡Bienvenido ${recipientName}! 🌌` : '¡Bienvenido! 🌌'}
          </Heading>
          <Text style={textStyle}>
            {body || 'Gracias por unirte a UniversMind. Estamos listos para acompañarte en tu viaje de crecimiento personal con meditación, journaling y herramientas de bienestar mental.'}
          </Text>
          <Section style={ctaSection}>
            <Button style={ctaButton} href="https://universmind.com/dashboard">
              Explorar UniversMind
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            {SITE_NAME} — Expande tu universo mental
            {ruleName ? ` · ${ruleName}` : ''}
          </Text>
        </Container>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: UniversMindWelcomeEmail,
  subject: (data: Record<string, any>) => data.subject || '¡Bienvenido a UniversMind! Tu viaje interior comienza',
  displayName: 'UniversMind Welcome',
  previewData: { recipientName: 'María', body: 'Tu perfil de bienestar está listo. Descubre meditaciones guiadas, journaling reflexivo y herramientas para expandir tu mente.', ruleName: 'Welcome Sequence' },
} satisfies TemplateEntry

const main = { backgroundColor: '#faf5ff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const wrapper = { padding: '40px 20px' }
const header = { textAlign: 'center' as const, marginBottom: '24px' }
const logo = { margin: '0 auto', borderRadius: '12px' }
const brandName = { fontSize: '20px', fontWeight: 'bold' as const, color: '#6d28d9', margin: '8px 0 0', textAlign: 'center' as const }
const card = { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2332', margin: '0 0 20px' }
const textStyle = { fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 25px', whiteSpace: 'pre-wrap' as const }
const ctaSection = { textAlign: 'center' as const, margin: '20px 0' }
const ctaButton = { backgroundColor: '#6d28d9', color: '#ffffff', padding: '12px 28px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold' as const, textDecoration: 'none' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0' }
