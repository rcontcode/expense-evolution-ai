import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEntity } from '@/contexts/EntityContext';

interface ExchangeRate {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  rate_date: string;
  source: string | null;
}

interface ConversionResult {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  targetCurrency: string;
  rate: number;
  rateDate: string;
}

// Common currency symbols
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  CAD: 'C$',
  CLP: '$',
  EUR: '€',
  GBP: '£',
  MXN: 'MX$',
  ARS: 'AR$',
  BRL: 'R$',
  COP: 'COL$',
  PEN: 'S/',
};

// Fallback rates when no database rate exists (approximate)
const FALLBACK_RATES: Record<string, Record<string, number>> = {
  USD: { CAD: 1.36, CLP: 950, EUR: 0.92, GBP: 0.79, MXN: 17.5 },
  CAD: { USD: 0.74, CLP: 700, EUR: 0.68, GBP: 0.58, MXN: 12.9 },
  CLP: { USD: 0.00105, CAD: 0.00143, EUR: 0.00097, GBP: 0.00083 },
  EUR: { USD: 1.09, CAD: 1.48, CLP: 1030, GBP: 0.86, MXN: 19.0 },
};

export function useCurrencyConversion() {
  const { user } = useAuth();
  const { currentCurrency } = useEntity();

  // Fetch latest exchange rates
  const { data: rates = [], isLoading } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .order('rate_date', { ascending: false });

      if (error) throw error;
      return data as ExchangeRate[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  // Get the latest rate for a currency pair
  const getRate = (fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return 1;

    // Try direct rate
    const directRate = rates.find(
      r => r.from_currency === fromCurrency && r.to_currency === toCurrency
    );
    if (directRate) return directRate.rate;

    // Try inverse rate
    const inverseRate = rates.find(
      r => r.from_currency === toCurrency && r.to_currency === fromCurrency
    );
    if (inverseRate) return 1 / inverseRate.rate;

    // Try through USD as intermediate
    const fromToUsd = rates.find(
      r => r.from_currency === fromCurrency && r.to_currency === 'USD'
    );
    const usdToTarget = rates.find(
      r => r.from_currency === 'USD' && r.to_currency === toCurrency
    );
    if (fromToUsd && usdToTarget) {
      return fromToUsd.rate * usdToTarget.rate;
    }

    // Use fallback rates
    if (FALLBACK_RATES[fromCurrency]?.[toCurrency]) {
      return FALLBACK_RATES[fromCurrency][toCurrency];
    }

    // Inverse fallback
    if (FALLBACK_RATES[toCurrency]?.[fromCurrency]) {
      return 1 / FALLBACK_RATES[toCurrency][fromCurrency];
    }

    console.warn(`No exchange rate found for ${fromCurrency} -> ${toCurrency}`);
    return 1;
  };

  // Convert amount to target currency
  const convert = (
    amount: number,
    fromCurrency: string,
    toCurrency?: string
  ): ConversionResult => {
    const target = toCurrency || currentCurrency;
    const rate = getRate(fromCurrency, target);
    
    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: amount * rate,
      targetCurrency: target,
      rate,
      rateDate: rates[0]?.rate_date || new Date().toISOString().split('T')[0],
    };
  };

  // Convert multiple amounts and sum them
  const convertAndSum = (
    items: Array<{ amount: number; currency: string }>,
    targetCurrency?: string
  ): number => {
    const target = targetCurrency || currentCurrency;
    return items.reduce((sum, item) => {
      const converted = convert(item.amount, item.currency, target);
      return sum + converted.convertedAmount;
    }, 0);
  };

  // Format currency with proper symbol
  const formatCurrency = (
    amount: number,
    currency?: string,
    options?: { decimals?: number; showSymbol?: boolean }
  ): string => {
    const curr = currency || currentCurrency;
    const decimals = options?.decimals ?? (curr === 'CLP' ? 0 : 2);
    const showSymbol = options?.showSymbol ?? true;
    
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);

    if (showSymbol) {
      const symbol = CURRENCY_SYMBOLS[curr] || curr;
      return `${symbol}${formatted}`;
    }
    return formatted;
  };

  // Get currency symbol
  const getCurrencySymbol = (currency?: string): string => {
    const curr = currency || currentCurrency;
    return CURRENCY_SYMBOLS[curr] || curr;
  };

  return {
    rates,
    isLoading,
    convert,
    convertAndSum,
    formatCurrency,
    getCurrencySymbol,
    getRate,
    currentCurrency,
  };
}

// Hook to save a new exchange rate
export function useSaveExchangeRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rate: Omit<ExchangeRate, 'id'>) => {
      const { data, error } = await supabase
        .from('exchange_rates')
        .insert(rate)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-rates'] });
    },
  });
}
