/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as crmLeadOutreach } from './crm-lead-outreach.tsx'
import { template as crmFokusparkOutreach } from './crm-fokuspark-outreach.tsx'
import { template as crmUniversmindOutreach } from './crm-universmind-outreach.tsx'
import { template as crmFollowUp } from './crm-follow-up.tsx'
import { template as crmEvofinzWelcome } from './crm-evofinz-welcome.tsx'
import { template as crmFokusparkWelcome } from './crm-fokuspark-welcome.tsx'
import { template as crmUniversmindWelcome } from './crm-universmind-welcome.tsx'
import { template as crmEvofinzReactivation } from './crm-evofinz-reactivation.tsx'
import { template as crmFokusparkReactivation } from './crm-fokuspark-reactivation.tsx'
import { template as crmUniversmindReactivation } from './crm-universmind-reactivation.tsx'
import { template as crmEvofinzOffer } from './crm-evofinz-offer.tsx'
import { template as crmFokusparkOffer } from './crm-fokuspark-offer.tsx'
import { template as crmUniversmindOffer } from './crm-universmind-offer.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'crm-lead-outreach': crmLeadOutreach,
  'crm-fokuspark-outreach': crmFokusparkOutreach,
  'crm-universmind-outreach': crmUniversmindOutreach,
  'crm-follow-up': crmFollowUp,
  'crm-evofinz-welcome': crmEvofinzWelcome,
  'crm-fokuspark-welcome': crmFokusparkWelcome,
  'crm-universmind-welcome': crmUniversmindWelcome,
  'crm-evofinz-reactivation': crmEvofinzReactivation,
  'crm-fokuspark-reactivation': crmFokusparkReactivation,
  'crm-universmind-reactivation': crmUniversmindReactivation,
  'crm-evofinz-offer': crmEvofinzOffer,
  'crm-fokuspark-offer': crmFokusparkOffer,
  'crm-universmind-offer': crmUniversmindOffer,
}
