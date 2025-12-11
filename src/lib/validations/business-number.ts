/**
 * Canadian Business Number Validation and Formatting
 * Format: 9 digits (e.g., 123456789) or with program identifier (e.g., 123456789 RT0001)
 */

// Validate Canadian Business Number (9 digits)
export function validateBusinessNumber(value: string): { valid: boolean; error?: string } {
  if (!value || value.trim() === '') {
    return { valid: true }; // Optional field
  }

  // Remove all non-alphanumeric characters for validation
  const cleaned = value.replace(/[^0-9A-Za-z]/g, '');
  
  // Check if it's just the 9-digit BN
  const bnOnly = cleaned.slice(0, 9);
  if (!/^\d{9}$/.test(bnOnly)) {
    return { 
      valid: false, 
      error: 'businessNumberInvalid' // Must be 9 digits
    };
  }

  // If there's a program identifier, validate it (e.g., RT0001, RP0001, RC0001)
  if (cleaned.length > 9) {
    const programId = cleaned.slice(9).toUpperCase();
    // Valid program identifiers: RT (GST/HST), RP (Payroll), RC (Corporation Income Tax), RM (Import/Export)
    const validPrograms = /^(RT|RP|RC|RM|RR|RZ)\d{4}$/;
    if (!validPrograms.test(programId)) {
      return { 
        valid: false, 
        error: 'businessNumberProgramInvalid' // Invalid program identifier
      };
    }
  }

  return { valid: true };
}

// Format Business Number as user types
export function formatBusinessNumber(value: string): string {
  // Remove all non-alphanumeric characters
  let cleaned = value.replace(/[^0-9A-Za-z]/g, '');
  
  // Limit to 15 characters max (9 digits + 6 for program ID)
  if (cleaned.length > 15) {
    cleaned = cleaned.slice(0, 15);
  }

  // If we have more than 9 characters, format with space
  if (cleaned.length > 9) {
    const bn = cleaned.slice(0, 9);
    const program = cleaned.slice(9).toUpperCase();
    return `${bn} ${program}`;
  }

  return cleaned;
}

// Check if Luhn algorithm passes (optional additional validation)
export function validateLuhn(digits: string): boolean {
  if (!/^\d+$/.test(digits)) return false;
  
  let sum = 0;
  let isEven = false;
  
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}
