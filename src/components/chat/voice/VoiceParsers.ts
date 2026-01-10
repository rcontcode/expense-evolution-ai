import { ExpenseCategory } from '@/types/expense.types';
import { IncomeType } from '@/types/income.types';

// Category mappings for voice expense creation
export const CATEGORY_KEYWORDS: Record<string, { keywords: string[]; category: ExpenseCategory }> = {
  meals: { keywords: ['restaurante', 'restaurant', 'comida', 'food', 'almuerzo', 'lunch', 'cena', 'dinner', 'desayuno', 'breakfast', 'cafe', 'café', 'coffee'], category: 'meals' },
  travel: { keywords: ['viaje', 'travel', 'vuelo', 'flight', 'hotel', 'hospedaje', 'avión', 'airplane', 'tren', 'train', 'bus', 'taxi', 'uber', 'transporte', 'transport'], category: 'travel' },
  equipment: { keywords: ['equipo', 'equipment', 'computadora', 'computer', 'laptop', 'teléfono', 'phone', 'tablet', 'monitor', 'teclado', 'keyboard', 'herramienta', 'tool'], category: 'equipment' },
  software: { keywords: ['software', 'licencia', 'license', 'suscripción', 'subscription', 'app', 'aplicación', 'programa'], category: 'software' },
  fuel: { keywords: ['gasolina', 'gas', 'fuel', 'combustible', 'diesel', 'nafta', 'bencina'], category: 'fuel' },
  office_supplies: { keywords: ['oficina', 'office', 'papelería', 'stationery', 'papel', 'paper', 'tinta', 'ink', 'material'], category: 'office_supplies' },
  utilities: { keywords: ['servicios', 'utilities', 'luz', 'electricity', 'agua', 'water', 'internet', 'teléfono fijo', 'landline'], category: 'utilities' },
  professional_services: { keywords: ['servicio', 'service', 'consultoría', 'consulting', 'abogado', 'lawyer', 'contador', 'accountant', 'profesional'], category: 'professional_services' },
};

// Income type mappings for voice income creation
export const INCOME_TYPE_KEYWORDS: Record<string, { keywords: string[]; incomeType: IncomeType }> = {
  client_payment: { keywords: ['cliente', 'client', 'pago de cliente', 'client payment', 'factura', 'invoice'], incomeType: 'client_payment' },
  salary: { keywords: ['salario', 'salary', 'sueldo', 'nómina', 'payroll', 'wage'], incomeType: 'salary' },
  bonus: { keywords: ['bono', 'bonus', 'aguinaldo', 'prima'], incomeType: 'bonus' },
  freelance: { keywords: ['freelance', 'proyecto', 'project', 'trabajo independiente', 'independiente'], incomeType: 'freelance' },
  investment_stocks: { keywords: ['dividendos', 'dividends', 'inversión', 'investment', 'acciones', 'stocks', 'bolsa'], incomeType: 'investment_stocks' },
  investment_crypto: { keywords: ['crypto', 'cripto', 'bitcoin', 'ethereum', 'criptomoneda'], incomeType: 'investment_crypto' },
  passive_rental: { keywords: ['alquiler', 'renta', 'rental', 'arrendamiento', 'rent'], incomeType: 'passive_rental' },
  passive_royalties: { keywords: ['regalías', 'royalties', 'derechos de autor', 'royalty'], incomeType: 'passive_royalties' },
  gift: { keywords: ['regalo', 'gift', 'donación', 'donation'], incomeType: 'gift' },
  refund: { keywords: ['reembolso', 'refund', 'devolución', 'return'], incomeType: 'refund' },
  online_business: { keywords: ['online', 'ecommerce', 'tienda online', 'negocio online'], incomeType: 'online_business' },
};

// Parse voice expense command
export interface ParsedExpense {
  amount: number;
  category: ExpenseCategory;
  vendor: string;
}

export function parseVoiceExpense(text: string): ParsedExpense | null {
  const normalizedText = text.toLowerCase().trim();
  
  // Patterns: "gasto de X en Y", "expense of X at Y", "X dólares en Y", "X dollars at Y"
  const patterns = [
    /(?:gasto de|expense of|gasté)\s*\$?\s*(\d+(?:[.,]\d+)?)\s*(?:dólares?|dollars?|pesos?)?\s*(?:en|at|de)\s+(.+)/i,
    /\$?\s*(\d+(?:[.,]\d+)?)\s*(?:dólares?|dollars?|pesos?)?\s*(?:en|at|de)\s+(.+)/i,
    /(?:gasto|expense|gasté)\s+(.+)\s+(?:por|for)\s*\$?\s*(\d+(?:[.,]\d+)?)/i,
  ];
  
  let amount: number | null = null;
  let vendorText: string = '';
  
  for (const pattern of patterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      if (pattern.source.includes('por|for')) {
        // Pattern: "gasto restaurante por 50"
        vendorText = match[1].trim();
        amount = parseFloat(match[2].replace(',', '.'));
      } else {
        // Pattern: "gasto de 50 en restaurante"
        amount = parseFloat(match[1].replace(',', '.'));
        vendorText = match[2].trim();
      }
      break;
    }
  }
  
  if (!amount || amount <= 0 || !vendorText) {
    return null;
  }
  
  // Detect category from vendor text
  let category: ExpenseCategory = 'other';
  for (const [, config] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of config.keywords) {
      if (vendorText.includes(keyword)) {
        category = config.category;
        break;
      }
    }
    if (category !== 'other') break;
  }
  
  // Capitalize vendor name
  const vendor = vendorText.charAt(0).toUpperCase() + vendorText.slice(1);
  
  return { amount, category, vendor };
}

// Parse voice income command
export interface ParsedIncome {
  amount: number;
  incomeType: IncomeType;
  source: string;
}

export function parseVoiceIncome(text: string): ParsedIncome | null {
  const normalizedText = text.toLowerCase().trim();
  
  // Patterns: "ingreso de X de cliente", "income of X from client", "recibí X por proyecto"
  const patterns = [
    /(?:ingreso de|income of|recibí|gané|recibí pago de)\s*\$?\s*(\d+(?:[.,]\d+)?)\s*(?:dólares?|dollars?|pesos?)?\s*(?:de|from|por|by)\s+(.+)/i,
    /(?:me pagaron|pago de)\s*\$?\s*(\d+(?:[.,]\d+)?)\s*(?:dólares?|dollars?|pesos?)?\s*(?:de|por|from)\s+(.+)/i,
    /\$?\s*(\d+(?:[.,]\d+)?)\s*(?:dólares?|dollars?|pesos?)?\s*(?:de ingreso|de sueldo|de salario)\s*(?:de|por)?\s*(.+)?/i,
  ];
  
  let amount: number | null = null;
  let sourceText: string = '';
  
  for (const pattern of patterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      amount = parseFloat(match[1].replace(',', '.'));
      sourceText = (match[2] || '').trim();
      break;
    }
  }
  
  if (!amount || amount <= 0) {
    return null;
  }
  
  // Detect income type from source text
  let incomeType: IncomeType = 'other';
  const combinedText = `${normalizedText} ${sourceText}`;
  
  for (const [, config] of Object.entries(INCOME_TYPE_KEYWORDS)) {
    for (const keyword of config.keywords) {
      if (combinedText.includes(keyword)) {
        incomeType = config.incomeType;
        break;
      }
    }
    if (incomeType !== 'other') break;
  }
  
  // Capitalize source name
  const source = sourceText ? sourceText.charAt(0).toUpperCase() + sourceText.slice(1) : '';
  
  return { amount, incomeType, source };
}
