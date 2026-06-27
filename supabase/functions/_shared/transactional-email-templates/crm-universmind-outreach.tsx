/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'UniversMind'
const LOGO_URL = 'https://oxrfslyuzcgxacomgzgw.supabase.co/storage/v1/object/public/email-assets/universmind-logo.png'

interface UniversMindOutreachProps {
  recipientName?: string
  subject?: string
  body?: string
  ruleName?: string
}

const UniversMindOutreachEmail = ({ recipientName, body, ruleName }: UniversMindOutreachProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>{recipientName ? `Hola ${recipientName}` : 'Crianza con ciencia'} — {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={header}>
          <Img src={LOGO_URL} width="56" height="56" alt="UniversMind" style={logo} />
          <Text style={brandName}>UniversMind</Text>
        </Section>
        <Container style={card}>
          <Heading style={h1}>
            {recipientName ? `Hola ${recipientName} 🌌` : 'Hola 🌌'}
          </Heading>
          <Text style={textStyle}>
            {body || 'Descubre herramientas simples y con base científica para acompañarte en la crianza. Estamos para ayudarte.'}
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            {SITE_NAME} — crianza con ciencia
            {ruleName ? ` · ${ruleName}` : ''}
          </Text>
        </Container>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: UniversMindOutreachEmail,
  subject: (data: Record<string, any>) => data.subject || 'Universmind — crianza con ciencia',
  displayName: 'UniversMind Lead Outreach',
  previewData: {
    recipientName: 'Ana',
    subject: 'Recursos de crianza pensados para ti',
    body: 'Gracias por tu interés en Universmind. Preparamos recursos basados en la etapa de tu hijo. ¿Te gustaría explorarlos?',
    ruleName: 'UniversMind Welcome',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#faf5ff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const wrapper = { padding: '40px 20px' }
const header = { textAlign: 'center' as const, marginBottom: '24px' }
const logo = { margin: '0 auto', borderRadius: '12px' }
const brandName = { fontSize: '20px', fontWeight: 'bold' as const, color: '#7c3aed', margin: '8px 0 0', textAlign: 'center' as const }
const card = { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2332', margin: '0 0 20px' }
const textStyle = { fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 25px', whiteSpace: 'pre-wrap' as const }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0' }
