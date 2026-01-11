/**
 * Advanced Voice Actions - Additional commands beyond basic CRUD
 * 
 * These parsers handle:
 * - Setting alerts ("alerta cuando gaste más de 1000")
 * - Setting reminders ("recuérdame revisar gastos el viernes")
 * - Duplicating entries ("duplicar el último gasto")
 * - Export requests ("exportar para mi contador")
 */

export interface SpendingAlert {
  type: 'spending_alert';
  threshold: number;
  category?: string;
}

export interface Reminder {
  type: 'reminder';
  action: string;
  dayOrDate: string;
  time?: string;
}

export interface DuplicateRequest {
  type: 'duplicate';
  target: 'last_expense' | 'last_income' | 'expense' | 'income';
}

export interface ExportRequest {
  type: 'export';
  exportType: 'tax_report' | 'reimbursement' | 'all_expenses' | 'all_income' | 'full_report';
  format?: 'excel' | 'pdf' | 'csv';
}

export type AdvancedAction = SpendingAlert | Reminder | DuplicateRequest | ExportRequest;

/**
 * Parse spending alert command
 * Examples:
 * - "alerta cuando gaste más de 1000"
 * - "alert me when I spend more than 500"
 * - "avísame si gasto más de 200 en restaurantes"
 */
export function parseSpendingAlert(text: string): SpendingAlert | null {
  const normalized = text.toLowerCase().trim();
  
  const patterns = [
    // Spanish patterns
    /(?:alerta|avísame|avisame|notifícame|notificame)\s+(?:cuando|si|if)\s+(?:gaste|gasto)\s+(?:más|mas)\s+(?:de|than)\s*\$?\s*(\d+(?:[.,]\d+)?)\s*(?:en\s+(.+))?/i,
    /(?:pon|configura|crea)\s+(?:una\s+)?alerta\s+(?:de\s+)?(?:gasto\s+)?(?:mayor\s+a|de)\s*\$?\s*(\d+(?:[.,]\d+)?)\s*(?:en\s+(.+))?/i,
    // English patterns
    /(?:alert|notify|warn)\s+(?:me\s+)?(?:when|if)\s+(?:i\s+)?(?:spend|spending)\s+(?:more\s+than|over|above)\s*\$?\s*(\d+(?:[.,]\d+)?)\s*(?:on\s+(.+))?/i,
    /(?:set|create)\s+(?:a\s+)?(?:spending\s+)?alert\s+(?:for\s+)?\$?\s*(\d+(?:[.,]\d+)?)\s*(?:on\s+(.+))?/i,
  ];
  
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      const threshold = parseFloat(match[1].replace(',', '.'));
      const category = match[2]?.trim();
      
      if (threshold > 0) {
        return {
          type: 'spending_alert',
          threshold,
          category: category || undefined,
        };
      }
    }
  }
  
  return null;
}

/**
 * Parse reminder command
 * Examples:
 * - "recuérdame revisar gastos el viernes"
 * - "remind me to check expenses on friday"
 * - "recordatorio: revisar facturas mañana"
 */
export function parseReminder(text: string): Reminder | null {
  const normalized = text.toLowerCase().trim();
  
  const patterns = [
    // Spanish patterns
    /(?:recuérdame|recuerdame|recordatorio|hazme acordar)\s+(?:de\s+)?(.+?)\s+(?:el\s+)?(\w+(?:\s+a\s+las?\s+\d{1,2}(?::\d{2})?)?)/i,
    /(?:pon|configura)\s+(?:un\s+)?recordatorio\s+(?:para\s+)?(.+?)\s+(?:el\s+)?(\w+)/i,
    // English patterns
    /(?:remind\s+me|reminder|set\s+reminder)\s+(?:to\s+)?(.+?)\s+(?:on\s+)?(\w+(?:\s+at\s+\d{1,2}(?::\d{2})?(?:\s*[ap]m)?)?)/i,
  ];
  
  const dayMappings: Record<string, string> = {
    // Spanish
    'lunes': 'monday', 'martes': 'tuesday', 'miércoles': 'wednesday', 'miercoles': 'wednesday',
    'jueves': 'thursday', 'viernes': 'friday', 'sábado': 'saturday', 'sabado': 'saturday',
    'domingo': 'sunday', 'mañana': 'tomorrow', 'manana': 'tomorrow', 'hoy': 'today',
    'pasado mañana': 'day_after_tomorrow', 'pasado manana': 'day_after_tomorrow',
    // English
    'monday': 'monday', 'tuesday': 'tuesday', 'wednesday': 'wednesday',
    'thursday': 'thursday', 'friday': 'friday', 'saturday': 'saturday', 'sunday': 'sunday',
    'tomorrow': 'tomorrow', 'today': 'today',
  };
  
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      const action = match[1]?.trim();
      const dayRaw = match[2]?.trim().split(/\s+(?:a\s+las?|at)\s*/)[0];
      const timeMatch = match[2]?.match(/(\d{1,2}(?::\d{2})?(?:\s*[ap]m)?)/);
      
      const day = dayMappings[dayRaw] || dayRaw;
      
      if (action && day) {
        return {
          type: 'reminder',
          action,
          dayOrDate: day,
          time: timeMatch?.[1],
        };
      }
    }
  }
  
  return null;
}

/**
 * Parse duplicate command
 * Examples:
 * - "duplicar el último gasto"
 * - "duplicate last expense"
 * - "repetir el gasto anterior"
 */
export function parseDuplicateRequest(text: string): DuplicateRequest | null {
  const normalized = text.toLowerCase().trim();
  
  const expensePatterns = [
    /(?:duplicar?|duplicate|copiar?|copy|repetir?|repeat)\s+(?:el\s+)?(?:último|ultimo|last|anterior|previous)\s+(?:gasto|expense)/i,
    /(?:otro|another)\s+(?:gasto|expense)\s+(?:igual|like\s+that|same)/i,
  ];
  
  const incomePatterns = [
    /(?:duplicar?|duplicate|copiar?|copy|repetir?|repeat)\s+(?:el\s+)?(?:último|ultimo|last|anterior|previous)\s+(?:ingreso|income)/i,
    /(?:otro|another)\s+(?:ingreso|income)\s+(?:igual|like\s+that|same)/i,
  ];
  
  for (const pattern of expensePatterns) {
    if (pattern.test(normalized)) {
      return { type: 'duplicate', target: 'last_expense' };
    }
  }
  
  for (const pattern of incomePatterns) {
    if (pattern.test(normalized)) {
      return { type: 'duplicate', target: 'last_income' };
    }
  }
  
  return null;
}

/**
 * Parse export command
 * Examples:
 * - "exportar para mi contador"
 * - "export for my accountant"
 * - "generar reporte de impuestos"
 * - "descargar reembolsos en excel"
 */
export function parseExportRequest(text: string): ExportRequest | null {
  const normalized = text.toLowerCase().trim();
  
  // Determine export type
  let exportType: ExportRequest['exportType'] = 'full_report';
  
  if (/(?:impuesto|tax|fiscal|t2125|declaración|declaracion)/i.test(normalized)) {
    exportType = 'tax_report';
  } else if (/(?:reembolso|reimbursement|facturar|billing|cliente|client)/i.test(normalized)) {
    exportType = 'reimbursement';
  } else if (/(?:todos?\s+los?\s+gastos|all\s+expenses|gastos\s+completos)/i.test(normalized)) {
    exportType = 'all_expenses';
  } else if (/(?:todos?\s+los?\s+ingresos|all\s+income|ingresos\s+completos)/i.test(normalized)) {
    exportType = 'all_income';
  }
  
  // Determine format
  let format: ExportRequest['format'] = 'excel';
  
  if (/(?:pdf|documento)/i.test(normalized)) {
    format = 'pdf';
  } else if (/(?:csv|texto|text)/i.test(normalized)) {
    format = 'csv';
  }
  
  // Check if this is an export request
  const exportPatterns = [
    /(?:exportar?|export|descargar?|download|generar?|generate|crear?|create)\s+(?:para|for|un|a)?\s*(?:mi\s+)?(?:contador|accountant|reporte|report)/i,
    /(?:exportar?|export|descargar?|download)\s+(?:gastos|ingresos|expenses|income|reembolsos|reimbursements|impuestos|taxes)/i,
    /(?:reporte|report)\s+(?:de\s+)?(?:impuestos|taxes|reembolso|reimbursement|gastos|expenses)/i,
    /(?:dame|give\s+me|quiero|i\s+want)\s+(?:el\s+)?(?:reporte|report|archivo|file)/i,
  ];
  
  for (const pattern of exportPatterns) {
    if (pattern.test(normalized)) {
      return { type: 'export', exportType, format };
    }
  }
  
  return null;
}

/**
 * Main parser - tries all advanced action parsers
 */
export function parseAdvancedAction(text: string): AdvancedAction | null {
  // Try each parser in order of specificity
  const alert = parseSpendingAlert(text);
  if (alert) return alert;
  
  const reminder = parseReminder(text);
  if (reminder) return reminder;
  
  const duplicate = parseDuplicateRequest(text);
  if (duplicate) return duplicate;
  
  const exportReq = parseExportRequest(text);
  if (exportReq) return exportReq;
  
  return null;
}
