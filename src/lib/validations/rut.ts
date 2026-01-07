/**
 * Chilean RUT (Rol Único Tributario) validation
 * Uses Modulo 11 algorithm
 */

export function validateRut(rut: string): boolean {
  if (!rut) return false;
  
  // Remove dots and hyphens
  const cleaned = rut.replace(/[.-]/g, '').toUpperCase();
  
  if (cleaned.length < 2) return false;
  
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  
  // Body should be numeric
  if (!/^\d+$/.test(body)) return false;
  
  // Calculate verification digit
  const calculatedDv = calculateDv(parseInt(body, 10));
  
  return calculatedDv === dv;
}

function calculateDv(rut: number): string {
  let sum = 0;
  let multiplier = 2;
  
  // Process each digit from right to left
  let current = rut;
  while (current > 0) {
    sum += (current % 10) * multiplier;
    current = Math.floor(current / 10);
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const remainder = 11 - (sum % 11);
  
  if (remainder === 11) return '0';
  if (remainder === 10) return 'K';
  return remainder.toString();
}

export function formatRut(value: string): string {
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
}

export function cleanRut(rut: string): string {
  return rut.replace(/[.-]/g, '').toUpperCase();
}
