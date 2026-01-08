export type CountryCode = 'CA' | 'CL';

// ============================================
// TAX INFORMATION VERSION CONTROL
// ============================================
// This metadata tracks when tax rules were last verified
// Update these dates whenever tax rules are modified

export interface TaxInfoVersion {
  lastUpdated: string; // ISO date format
  taxYear: number;
  verifiedBy: string;
  sourceUrls: string[];
  notes?: string;
}

export const TAX_INFO_VERSIONS: Record<CountryCode, TaxInfoVersion> = {
  CA: {
    lastUpdated: '2025-01-08',
    taxYear: 2024,
    verifiedBy: 'Evofinz System',
    sourceUrls: [
      'https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html',
      'https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4002.html',
    ],
    notes: 'Federal brackets for 2024. Provincial rates may vary by territory.',
  },
  CL: {
    lastUpdated: '2025-01-08',
    taxYear: 2024,
    verifiedBy: 'Evofinz System',
    sourceUrls: [
      'https://www.sii.cl/valores_y_fechas/valores/tabla_impuesto_2da_categoria.htm',
      'https://www.sii.cl/portales/mipyme/conoce_sii_facil/tributacion_regimenes.html',
    ],
    notes: 'Valores en UTM para Segunda Categoría. Régimen Pro PyME al 25%.',
  },
};

// Get version info for a country
export function getTaxInfoVersion(code: CountryCode): TaxInfoVersion {
  return TAX_INFO_VERSIONS[code];
}

// Check if tax info might be outdated (more than 6 months old)
export function isTaxInfoPotentiallyOutdated(code: CountryCode): boolean {
  const version = TAX_INFO_VERSIONS[code];
  const lastUpdated = new Date(version.lastUpdated);
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  return lastUpdated < sixMonthsAgo;
}

// Check if we're past the tax year
export function isNewTaxYearAvailable(code: CountryCode): boolean {
  const version = TAX_INFO_VERSIONS[code];
  const currentYear = new Date().getFullYear();
  return currentYear > version.taxYear;
}

export interface Region {
  code: string;
  name: string;
  taxRate?: number; // Provincial/regional tax rate
}

export interface TaxBracket {
  limit: number;
  rate: number;
}

export interface DeductionRule {
  category: string;
  deductionRate: number;
  description: string;
  maxAmount?: number;
}

export interface TaxDeadline {
  id: string;
  name: string;
  description: string;
  frequency: 'monthly' | 'quarterly' | 'annual';
  day?: number;
  month?: number;
  formId?: string;
}

export interface WorkTypeOption {
  value: string;
  label: { es: string; en: string };
  description: { es: string; en: string };
}

export interface BusinessIdConfig {
  name: { es: string; en: string };
  format: string;
  placeholder: string;
  validationRegex: RegExp;
  formatFunction?: (value: string) => string;
}

export interface CountryConfig {
  code: CountryCode;
  name: { es: string; en: string };
  currency: string;
  currencySymbol: string;
  taxAuthority: { name: string; website: string };
  regions: Region[];
  federalTaxBrackets: TaxBracket[];
  deductionRules: DeductionRule[];
  taxDeadlines: TaxDeadline[];
  workTypes: WorkTypeOption[];
  businessIdConfig: BusinessIdConfig;
  vatRate?: number;
  hasProvincialTax: boolean;
}

// CANADA Configuration
export const CANADA_CONFIG: CountryConfig = {
  code: 'CA',
  name: { es: 'Canadá', en: 'Canada' },
  currency: 'CAD',
  currencySymbol: '$',
  taxAuthority: { name: 'CRA', website: 'https://www.canada.ca/en/revenue-agency.html' },
  hasProvincialTax: true,
  regions: [
    { code: 'AB', name: 'Alberta', taxRate: 0 },
    { code: 'BC', name: 'British Columbia', taxRate: 0.07 },
    { code: 'MB', name: 'Manitoba', taxRate: 0.07 },
    { code: 'NB', name: 'New Brunswick', taxRate: 0.15 },
    { code: 'NL', name: 'Newfoundland and Labrador', taxRate: 0.15 },
    { code: 'NS', name: 'Nova Scotia', taxRate: 0.15 },
    { code: 'NT', name: 'Northwest Territories', taxRate: 0 },
    { code: 'NU', name: 'Nunavut', taxRate: 0 },
    { code: 'ON', name: 'Ontario', taxRate: 0.13 },
    { code: 'PE', name: 'Prince Edward Island', taxRate: 0.15 },
    { code: 'QC', name: 'Quebec', taxRate: 0.09975 },
    { code: 'SK', name: 'Saskatchewan', taxRate: 0.06 },
    { code: 'YT', name: 'Yukon', taxRate: 0 },
  ],
  federalTaxBrackets: [
    { limit: 55867, rate: 0.15 },
    { limit: 111733, rate: 0.205 },
    { limit: 173205, rate: 0.26 },
    { limit: 246752, rate: 0.29 },
    { limit: Infinity, rate: 0.33 },
  ],
  deductionRules: [
    { category: 'meals', deductionRate: 0.5, description: 'Meals & Entertainment: 50% deductible (CRA IT-518R)' },
    { category: 'travel', deductionRate: 1.0, description: 'Travel expenses: 100% deductible for business purposes' },
    { category: 'office', deductionRate: 1.0, description: 'Office expenses: 100% deductible' },
    { category: 'equipment', deductionRate: 1.0, description: 'Equipment: 100% deductible (subject to CCA)' },
    { category: 'professional', deductionRate: 1.0, description: 'Professional fees: 100% deductible' },
    { category: 'marketing', deductionRate: 1.0, description: 'Marketing: 100% deductible' },
    { category: 'utilities', deductionRate: 1.0, description: 'Utilities: Proportional to business use' },
    { category: 'insurance', deductionRate: 1.0, description: 'Business insurance: 100% deductible' },
    { category: 'vehicle', deductionRate: 1.0, description: 'Vehicle: Based on business use percentage' },
    { category: 'supplies', deductionRate: 1.0, description: 'Supplies: 100% deductible' },
    { category: 'software', deductionRate: 1.0, description: 'Software subscriptions: 100% deductible' },
    { category: 'training', deductionRate: 1.0, description: 'Professional development: 100% deductible' },
    { category: 'home_office', deductionRate: 1.0, description: 'Home office: Proportional to dedicated space' },
    { category: 'bank_fees', deductionRate: 1.0, description: 'Bank fees: 100% deductible for business accounts' },
    { category: 'other', deductionRate: 1.0, description: 'Other business expenses: Case by case' },
  ],
  taxDeadlines: [
    { id: 'ca-t1', name: 'T1 Income Tax Return', description: 'Personal income tax return', frequency: 'annual', month: 4, day: 30, formId: 'T1' },
    { id: 'ca-t2', name: 'T2 Corporate Tax Return', description: 'Corporate income tax return', frequency: 'annual', formId: 'T2' },
    { id: 'ca-t2125', name: 'T2125 Business Income', description: 'Statement of business activities', frequency: 'annual', formId: 'T2125' },
    { id: 'ca-hst', name: 'HST/GST Remittance', description: 'Sales tax remittance', frequency: 'quarterly', formId: 'GST34' },
    { id: 'ca-installments', name: 'Tax Installments', description: 'Quarterly tax installments', frequency: 'quarterly' },
  ],
  workTypes: [
    { value: 'sole_proprietor', label: { es: 'Propietario Único', en: 'Sole Proprietor' }, description: { es: 'Negocio no incorporado', en: 'Unincorporated business' } },
    { value: 'contractor', label: { es: 'Contratista', en: 'Contractor' }, description: { es: 'Trabajador independiente', en: 'Independent worker' } },
    { value: 'corporation', label: { es: 'Corporación', en: 'Corporation' }, description: { es: 'Empresa incorporada', en: 'Incorporated company' } },
    { value: 'employee', label: { es: 'Empleado', en: 'Employee' }, description: { es: 'Trabajador con nómina', en: 'Payroll employee' } },
  ],
  businessIdConfig: {
    name: { es: 'Número de Negocio', en: 'Business Number' },
    format: '9 dígitos',
    placeholder: '123456789',
    validationRegex: /^\d{9}$/,
    formatFunction: (value: string) => value.replace(/\D/g, '').slice(0, 9),
  },
};

// CHILE Configuration
export const CHILE_CONFIG: CountryConfig = {
  code: 'CL',
  name: { es: 'Chile', en: 'Chile' },
  currency: 'CLP',
  currencySymbol: '$',
  taxAuthority: { name: 'SII', website: 'https://www.sii.cl' },
  hasProvincialTax: false,
  vatRate: 0.19, // 19% IVA
  regions: [
    { code: 'AP', name: 'Arica y Parinacota' },
    { code: 'TA', name: 'Tarapacá' },
    { code: 'AN', name: 'Antofagasta' },
    { code: 'AT', name: 'Atacama' },
    { code: 'CO', name: 'Coquimbo' },
    { code: 'VS', name: 'Valparaíso' },
    { code: 'RM', name: 'Región Metropolitana' },
    { code: 'LI', name: "O'Higgins" },
    { code: 'ML', name: 'Maule' },
    { code: 'NB', name: 'Ñuble' },
    { code: 'BI', name: 'Biobío' },
    { code: 'AR', name: 'La Araucanía' },
    { code: 'LR', name: 'Los Ríos' },
    { code: 'LL', name: 'Los Lagos' },
    { code: 'AI', name: 'Aysén' },
    { code: 'MA', name: 'Magallanes' },
  ],
  federalTaxBrackets: [
    // Segunda Categoría (trabajadores) - valores en UTM
    { limit: 13.5, rate: 0 },      // Exento
    { limit: 30, rate: 0.04 },
    { limit: 50, rate: 0.08 },
    { limit: 70, rate: 0.135 },
    { limit: 90, rate: 0.23 },
    { limit: 120, rate: 0.304 },
    { limit: Infinity, rate: 0.40 },
  ],
  deductionRules: [
    { category: 'meals', deductionRate: 1.0, description: 'Gastos de alimentación: 100% deducible si es necesario para la actividad' },
    { category: 'travel', deductionRate: 1.0, description: 'Viajes de negocios: 100% deducible' },
    { category: 'office', deductionRate: 1.0, description: 'Gastos de oficina: 100% deducible' },
    { category: 'equipment', deductionRate: 1.0, description: 'Equipamiento: Depreciación según tablas SII' },
    { category: 'professional', deductionRate: 1.0, description: 'Honorarios profesionales: 100% deducible' },
    { category: 'marketing', deductionRate: 0.01, description: 'Publicidad: Máx 1% de ingresos brutos', maxAmount: 0.01 },
    { category: 'utilities', deductionRate: 1.0, description: 'Servicios básicos: Proporcional al uso comercial' },
    { category: 'insurance', deductionRate: 1.0, description: 'Seguros de negocio: 100% deducible' },
    { category: 'vehicle', deductionRate: 1.0, description: 'Vehículo: Según uso comercial demostrable' },
    { category: 'supplies', deductionRate: 1.0, description: 'Insumos: 100% deducible' },
    { category: 'software', deductionRate: 1.0, description: 'Software: 100% deducible' },
    { category: 'training', deductionRate: 1.0, description: 'Capacitación: 100% deducible' },
    { category: 'home_office', deductionRate: 1.0, description: 'Oficina en casa: Proporcional al espacio dedicado' },
    { category: 'bank_fees', deductionRate: 1.0, description: 'Gastos bancarios: 100% deducible' },
    { category: 'other', deductionRate: 1.0, description: 'Otros gastos necesarios: Caso por caso' },
  ],
  taxDeadlines: [
    { id: 'cl-f29', name: 'Formulario 29', description: 'Declaración mensual IVA y PPM', frequency: 'monthly', day: 12, formId: 'F29' },
    { id: 'cl-f22', name: 'Formulario 22', description: 'Declaración anual de renta', frequency: 'annual', month: 4, formId: 'F22' },
    { id: 'cl-f50', name: 'Formulario 50', description: 'Retenciones de honorarios', frequency: 'monthly', day: 12, formId: 'F50' },
    { id: 'cl-dj', name: 'Declaraciones Juradas', description: 'Declaraciones juradas anuales', frequency: 'annual', month: 3, formId: 'DJ' },
  ],
  workTypes: [
    { value: 'persona_natural', label: { es: 'Persona Natural', en: 'Individual' }, description: { es: 'Contribuyente individual', en: 'Individual taxpayer' } },
    { value: 'empresa_individual', label: { es: 'Empresa Individual', en: 'Sole Proprietorship' }, description: { es: 'EIRL o empresa unipersonal', en: 'EIRL or sole proprietorship' } },
    { value: 'sociedad', label: { es: 'Sociedad', en: 'Company' }, description: { es: 'SpA, Ltda., S.A.', en: 'SpA, LLC, Corporation' } },
    { value: 'empleado', label: { es: 'Empleado', en: 'Employee' }, description: { es: 'Trabajador dependiente', en: 'Dependent worker' } },
  ],
  businessIdConfig: {
    name: { es: 'RUT', en: 'Tax ID (RUT)' },
    format: 'XX.XXX.XXX-X',
    placeholder: '12.345.678-9',
    validationRegex: /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/,
    formatFunction: (value: string) => {
      const cleaned = value.replace(/[^\dkK]/gi, '').toUpperCase();
      if (cleaned.length <= 1) return cleaned;
      
      const body = cleaned.slice(0, -1);
      const dv = cleaned.slice(-1);
      
      let formatted = '';
      const bodyReversed = body.split('').reverse();
      bodyReversed.forEach((char, index) => {
        if (index > 0 && index % 3 === 0) {
          formatted = '.' + formatted;
        }
        formatted = char + formatted;
      });
      
      return `${formatted}-${dv}`;
    },
  },
};

// Tax regime options for Chile
export const CHILE_TAX_REGIMES = [
  { value: 'general', label: { es: 'Régimen General', en: 'General Regime' }, rate: 0.27 },
  { value: 'propyme', label: { es: 'Régimen Pro PyME', en: 'Pro SME Regime' }, rate: 0.25 },
  { value: 'transparente', label: { es: 'Régimen Transparente', en: 'Transparent Regime' }, rate: 0 },
];

// Chile first category tax rates
export const CHILE_PRIMERA_CATEGORIA = {
  general: 0.27,
  propyme: 0.25,
};

// Get country config by code
export function getCountryConfig(code: CountryCode): CountryConfig {
  switch (code) {
    case 'CL':
      return CHILE_CONFIG;
    case 'CA':
    default:
      return CANADA_CONFIG;
  }
}

// Get all available countries
export function getAvailableCountries(): { code: CountryCode; name: { es: string; en: string } }[] {
  return [
    { code: 'CA', name: CANADA_CONFIG.name },
    { code: 'CL', name: CHILE_CONFIG.name },
  ];
}
