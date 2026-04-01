/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'

const LOGO_URL = 'https://oxrfslyuzcgxacomgzgw.supabase.co/storage/v1/object/public/email-assets/phoenix-clean-logo.png'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Te invitaron a {siteName}</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={header}>
          <Img src={LOGO_URL} width="56" height="56" alt="EvoFinz" style={logo} />
          <Text style={brandName}>EvoFinz</Text>
        </Section>
        <Container style={card}>
          <Heading style={h1}>¡Estás invitado!</Heading>
          <Text style={text}>
            Fuiste invitado a unirte a{' '}
            <Link href={siteUrl} style={link}>
              <strong>{siteName}</strong>
            </Link>
            . Haz clic en el botón para aceptar y crear tu cuenta.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={confirmationUrl}>
              Aceptar Invitación
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Si no esperabas esta invitación, puedes ignorar este email.
          </Text>
          <Text style={footerBrand}>EvoFinz — Tu evolución financiera</Text>
        </Container>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#f4f4f5', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const wrapper = { padding: '40px 20px' }
const header = { textAlign: 'center' as const, marginBottom: '24px' }
const logo = { margin: '0 auto', borderRadius: '12px' }
const brandName = { fontSize: '20px', fontWeight: 'bold' as const, color: '#2563eb', margin: '8px 0 0', textAlign: 'center' as const }
const card = { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2332', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: '#2563eb', textDecoration: 'underline' }
const buttonContainer = { textAlign: 'center' as const, margin: '28px 0' }
const button = { backgroundColor: '#2563eb', color: '#ffffff', fontSize: '14px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0 0 8px' }
const footerBrand = { fontSize: '12px', color: '#2563eb', margin: '0', fontWeight: '500' as const }
