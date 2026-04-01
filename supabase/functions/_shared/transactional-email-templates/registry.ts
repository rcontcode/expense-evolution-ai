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

export const TEMPLATES: Record<string, TemplateEntry> = {
  'crm-lead-outreach': crmLeadOutreach,
  'crm-fokuspark-outreach': crmFokusparkOutreach,
  'crm-universmind-outreach': crmUniversmindOutreach,
  'crm-follow-up': crmFollowUp,
}
