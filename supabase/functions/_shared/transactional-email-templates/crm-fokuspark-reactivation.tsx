/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Img, Preview, Section, Text, Hr, Button } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Fokuspark'
const LOGO_URL = 'https://oxrfslyuzcgxacomgzgw.supabase.co/storage/v1/object/public/email-assets/fokuspark-logo.png'

interface Props { recipientName?: string; body?: string; ruleName?: string }

const FokusparkReactivationEmail = ({ recipientName, body, ruleName }: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>{recipientName ? `${recipientName}, tu enfoque te espera` : 'Tu enfoque te espera'} — {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={header}>
          <Img src={LOGO_URL} width="56" height="56" alt="Fokuspark" style={logo} />
          <Text style={brandName}>Fokuspark</Text>
        </Section>
        <Container style={card}>
          <Heading style={h1}>
            {recipientName ? `${recipientName}, tu enfoque te espera 🧠` : 'Tu enfoque te espera 🧠'}
          </Heading>
          <Text style={textStyle}>
            {body || 'Hace tiempo que no te vemos en Fokuspark. Tu productividad y bienestar merecen atención. Hemos añadido nuevas sesiones y herramientas que te van a encantar.'}
          </Text>
          <Section style={ctaSection}>
            <Button style={ctaButton} href="https://fokuspark.com/dashboard">
              Volver a enfocarme
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
  component: FokusparkReactivationEmail,
  subject: (data: Record<string, any>) => data.subject || '¿Retomamos tu productividad? — Fokuspark',
  displayName: 'Fokuspark Reactivation',
  previewData: { recipientName: 'Ana', body: 'Han pasado semanas desde tu última sesión de enfoque. Nuevas meditaciones y focus timers te esperan. ¿Volvemos?', ruleName: 'Reactivation Cold' },
} satisfies TemplateEntry

const main = { backgroundColor: '#f5f3ff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const wrapper = { padding: '40px 20px' }
const header = { textAlign: 'center' as const, marginBottom: '24px' }
const logo = { margin: '0 auto', borderRadius: '12px' }
const brandName = { fontSize: '20px', fontWeight: 'bold' as const, color: '#8b5cf6', margin: '8px 0 0', textAlign: 'center' as const }
const card = { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2332', margin: '0 0 20px' }
const textStyle = { fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 25px', whiteSpace: 'pre-wrap' as const }
const ctaSection = { textAlign: 'center' as const, margin: '20px 0' }
const ctaButton = { backgroundColor: '#8b5cf6', color: '#ffffff', padding: '12px 28px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold' as const, textDecoration: 'none' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0' }
