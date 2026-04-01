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

const SITE_NAME = 'Fokuspark'
const LOGO_URL = 'https://oxrfslyuzcgxacomgzgw.supabase.co/storage/v1/object/public/email-assets/fokuspark-logo.png'

interface FokusparkOutreachProps {
  recipientName?: string
  subject?: string
  body?: string
  ruleName?: string
}

const FokusparkOutreachEmail = ({ recipientName, body, ruleName }: FokusparkOutreachProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>{recipientName ? `Hola ${recipientName}` : 'Impulsa tu productividad'} — {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={header}>
          <Img src={LOGO_URL} width="56" height="56" alt="Fokuspark" style={logo} />
          <Text style={brandName}>Fokuspark</Text>
        </Section>
        <Container style={card}>
          <Heading style={h1}>
            {recipientName ? `Hola ${recipientName} 🧠` : 'Hola 🧠'}
          </Heading>
          <Text style={textStyle}>
            {body || 'Queremos ayudarte a potenciar tu enfoque y productividad. Estamos aquí para ti.'}
          </Text>
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
  component: FokusparkOutreachEmail,
  subject: (data: Record<string, any>) => data.subject || 'Impulsa tu productividad — Fokuspark',
  displayName: 'Fokuspark Lead Outreach',
  previewData: {
    recipientName: 'Carlos',
    subject: 'Tu productividad puede dar un salto',
    body: 'Notamos que completaste nuestro quiz de productividad. Tienes un gran potencial — ¿te gustaría una guía personalizada para mejorar tu enfoque?',
    ruleName: 'Fokuspark Quiz Follow-up',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#f5f3ff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const wrapper = { padding: '40px 20px' }
const header = { textAlign: 'center' as const, marginBottom: '24px' }
const logo = { margin: '0 auto', borderRadius: '12px' }
const brandName = { fontSize: '20px', fontWeight: 'bold' as const, color: '#8b5cf6', margin: '8px 0 0', textAlign: 'center' as const }
const card = { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2332', margin: '0 0 20px' }
const textStyle = { fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 25px', whiteSpace: 'pre-wrap' as const }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0' }
