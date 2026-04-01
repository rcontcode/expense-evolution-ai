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
  Row,
  Column,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const LOGO_URL = 'https://oxrfslyuzcgxacomgzgw.supabase.co/storage/v1/object/public/email-assets/phoenix-clean-logo.png'

interface CrmWeeklyReportProps {
  weekLabel?: string
  newLeads?: number
  contactedLeads?: number
  convertedLeads?: number
  hotUncontacted?: number
  bySource?: { name: string; count: number }[]
  topRule?: string
  conversionRate?: string
}

const CrmWeeklyReportEmail = ({
  weekLabel = 'Esta semana',
  newLeads = 0,
  contactedLeads = 0,
  convertedLeads = 0,
  hotUncontacted = 0,
  bySource = [],
  topRule,
  conversionRate,
}: CrmWeeklyReportProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Reporte CRM Semanal — {weekLabel}</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={header}>
          <Img src={LOGO_URL} width="48" height="48" alt="EvoFinz" style={logo} />
          <Text style={brandName}>CRM Ecosystem</Text>
        </Section>
        <Container style={card}>
          <Heading style={h1}>📊 Reporte Semanal</Heading>
          <Text style={weekText}>{weekLabel}</Text>

          <Section style={kpiGrid}>
            <Row>
              <Column style={kpiBox}>
                <Text style={kpiValue}>{newLeads}</Text>
                <Text style={kpiLabel}>Nuevos Leads</Text>
              </Column>
              <Column style={kpiBox}>
                <Text style={kpiValue}>{contactedLeads}</Text>
                <Text style={kpiLabel}>Contactados</Text>
              </Column>
            </Row>
            <Row>
              <Column style={kpiBox}>
                <Text style={{ ...kpiValue, color: '#16a34a' }}>{convertedLeads}</Text>
                <Text style={kpiLabel}>Convertidos</Text>
              </Column>
              <Column style={kpiBox}>
                <Text style={{ ...kpiValue, color: hotUncontacted > 0 ? '#dc2626' : '#6b7280' }}>{hotUncontacted}</Text>
                <Text style={kpiLabel}>🔥 Hot sin contactar</Text>
              </Column>
            </Row>
          </Section>

          {conversionRate && (
            <Text style={convRateText}>Tasa de conversión: <strong>{conversionRate}</strong></Text>
          )}

          {bySource.length > 0 && (
            <>
              <Hr style={hr} />
              <Text style={sectionTitle}>Por Fuente</Text>
              {bySource.map((s, i) => (
                <Row key={i} style={sourceRow}>
                  <Column style={{ width: '70%' }}><Text style={sourceText}>{s.name}</Text></Column>
                  <Column style={{ width: '30%', textAlign: 'right' as const }}><Text style={sourceCount}>{s.count}</Text></Column>
                </Row>
              ))}
            </>
          )}

          {topRule && (
            <>
              <Hr style={hr} />
              <Text style={ruleText}>⚡ Regla más activa: <strong>{topRule}</strong></Text>
            </>
          )}

          <Hr style={hr} />
          <Text style={footer}>CRM Ecosystem — Reporte automático semanal</Text>
        </Container>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CrmWeeklyReportEmail,
  subject: (data: Record<string, any>) => `Reporte CRM Semanal — ${data.weekLabel || 'Esta semana'}`,
  displayName: 'CRM Weekly Report',
  previewData: {
    weekLabel: '24 Mar – 30 Mar 2026',
    newLeads: 47,
    contactedLeads: 32,
    convertedLeads: 8,
    hotUncontacted: 3,
    conversionRate: '17%',
    bySource: [
      { name: 'EvoFinz Quiz', count: 22 },
      { name: 'Fokuspark', count: 15 },
      { name: 'UniversMind', count: 10 },
    ],
    topRule: 'Hot Lead Welcome',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#f4f4f5', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const wrapper = { padding: '40px 20px' }
const header = { textAlign: 'center' as const, marginBottom: '24px' }
const logo = { margin: '0 auto', borderRadius: '12px' }
const brandName = { fontSize: '18px', fontWeight: 'bold' as const, color: '#2563eb', margin: '8px 0 0', textAlign: 'center' as const }
const card = { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '32px 28px', maxWidth: '520px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2332', margin: '0 0 4px' }
const weekText = { fontSize: '13px', color: '#6b7280', margin: '0 0 24px' }
const kpiGrid = { margin: '0 0 20px' }
const kpiBox = { textAlign: 'center' as const, padding: '12px 8px', backgroundColor: '#f9fafb', borderRadius: '10px', margin: '4px' }
const kpiValue = { fontSize: '28px', fontWeight: 'bold' as const, color: '#1a2332', margin: '0' }
const kpiLabel = { fontSize: '11px', color: '#6b7280', margin: '4px 0 0', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const convRateText = { fontSize: '14px', color: '#6b7280', margin: '0 0 8px', textAlign: 'center' as const }
const hr = { borderColor: '#e5e7eb', margin: '20px 0' }
const sectionTitle = { fontSize: '14px', fontWeight: 'bold' as const, color: '#1a2332', margin: '0 0 12px' }
const sourceRow = { marginBottom: '4px' }
const sourceText = { fontSize: '13px', color: '#374151', margin: '2px 0' }
const sourceCount = { fontSize: '13px', fontWeight: 'bold' as const, color: '#1a2332', margin: '2px 0' }
const ruleText = { fontSize: '13px', color: '#6b7280', margin: '0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', textAlign: 'center' as const }
