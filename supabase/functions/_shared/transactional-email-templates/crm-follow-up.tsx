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

const LOGO_URL = 'https://oxrfslyuzcgxacomgzgw.supabase.co/storage/v1/object/public/email-assets/phoenix-clean-logo.png'

interface FollowUpProps {
  recipientName?: string
  subject?: string
  body?: string
  appName?: string
  stepNumber?: number
}

const CrmFollowUpEmail = ({ recipientName, body, appName, stepNumber }: FollowUpProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>{recipientName ? `${recipientName}, seguimos en contacto` : 'Seguimos en contacto'}</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={header}>
          <Img src={LOGO_URL} width="48" height="48" alt={appName || 'EvoFinz'} style={logo} />
          <Text style={brandName}>{appName || 'EvoFinz'}</Text>
        </Section>
        <Container style={card}>
          <Heading style={h1}>
            {recipientName ? `${recipientName}, seguimos aquí para ti` : 'Seguimos aquí para ti'}
          </Heading>
          <Text style={textStyle}>
            {body || 'Queríamos asegurarnos de que recibiste nuestro mensaje anterior. Estamos disponibles para ayudarte en lo que necesites.'}
          </Text>
          {stepNumber && stepNumber > 1 && (
            <Text style={subtleNote}>
              Este es un seguimiento de nuestra conversación anterior.
            </Text>
          )}
          <Hr style={hr} />
          <Text style={footer}>
            {appName || 'EvoFinz'} — Tu evolución comienza aquí
          </Text>
        </Container>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CrmFollowUpEmail,
  subject: (data: Record<string, any>) => data.subject || 'Seguimos en contacto',
  displayName: 'CRM Follow-Up',
  previewData: {
    recipientName: 'María',
    subject: '¿Pudiste revisar nuestro mensaje?',
    body: 'Hace unos días te escribimos sobre cómo podemos ayudarte. ¿Tuviste oportunidad de revisarlo? Estamos a un mensaje de distancia.',
    appName: 'EvoFinz',
    stepNumber: 2,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#f4f4f5', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const wrapper = { padding: '40px 20px' }
const header = { textAlign: 'center' as const, marginBottom: '24px' }
const logo = { margin: '0 auto', borderRadius: '12px' }
const brandName = { fontSize: '18px', fontWeight: 'bold' as const, color: '#2563eb', margin: '8px 0 0', textAlign: 'center' as const }
const card = { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const h1 = { fontSize: '20px', fontWeight: 'bold' as const, color: '#1a2332', margin: '0 0 20px' }
const textStyle = { fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 20px', whiteSpace: 'pre-wrap' as const }
const subtleNote = { fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' as const, margin: '0 0 20px' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0' }
