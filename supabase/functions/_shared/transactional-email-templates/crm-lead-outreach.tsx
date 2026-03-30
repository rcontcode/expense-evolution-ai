/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'EvoFinz'

interface CrmLeadOutreachProps {
  recipientName?: string
  subject?: string
  body?: string
  ruleName?: string
}

const CrmLeadOutreachEmail = ({ recipientName, body, ruleName }: CrmLeadOutreachProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>{recipientName ? `Hola ${recipientName}` : 'Tenemos algo para ti'} — {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {recipientName ? `Hola ${recipientName} 👋` : 'Hola 👋'}
        </Heading>
        <Text style={textStyle}>
          {body || 'Nos encantaría ayudarte a optimizar tus finanzas. Estamos a tu disposición.'}
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          {SITE_NAME} — Tu evolución financiera
          {ruleName ? ` · ${ruleName}` : ''}
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CrmLeadOutreachEmail,
  subject: (data: Record<string, any>) => data.subject || 'Tenemos algo para ti — EvoFinz',
  displayName: 'CRM Lead Outreach',
  previewData: {
    recipientName: 'María',
    subject: 'Optimiza tus finanzas con EvoFinz',
    body: 'Hemos analizado tu perfil financiero y creemos que podemos ayudarte a ahorrar más. ¿Te gustaría una consulta personalizada?',
    ruleName: 'Hot Lead Welcome',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2332', margin: '0 0 20px' }
const textStyle = { fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 25px', whiteSpace: 'pre-wrap' as const }
const hr = { borderColor: '#e5e7eb', margin: '20px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0' }
