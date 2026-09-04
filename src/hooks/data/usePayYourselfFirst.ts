import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormatCurrency } from '@/hooks/utils/useFormatCurrency';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIncome } from './useIncome';
import { useLocalizedToast } from '@/hooks/utils/useLocalizedToast';
import { aFechaISO, fechaLocal } from '@/lib/fecha';

export interface PayYourselfFirstSettings {
  id: string; user_id: string; target_percentage: number; current_month_saved: number;
  current_month_income: number; streak_months: number; best_streak_months: number;
  last_payment_date: string | null;
}

export interface PayYourselfFirstData {
  settings: PayYourselfFirstSettings | null; actualSavedThisMonth: number;
  targetSavedThisMonth: number; incomeThisMonth: number; percentageSaved: number;
  isOnTrack: boolean; streakMonths: number; bestStreak: number; hasPaidThisMonth: boolean;
  recommendations: string[]; isLoading: boolean;
}

export function usePayYourselfFirst(): PayYourselfFirstData {
  const { formatCurrency } = useFormatCurrency();
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const { data: incomeData } = useIncome({ year: currentYear, month: currentMonth + 1 });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['pay-yourself-first', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from('pay_yourself_first_settings').select('*').eq('user_id', user.id).maybeSingle();
      if (error) throw error;
      return data as PayYourselfFirstSettings | null;
    },
    enabled: !!user,
  });

  const incomeThisMonth = incomeData?.reduce((sum, inc) => sum + inc.amount, 0) || 0;
  const targetPercentage = settings?.target_percentage || 20;
  const targetSavedThisMonth = incomeThisMonth * (targetPercentage / 100);

  const lastPaymentDate = settings?.last_payment_date ? fechaLocal(settings.last_payment_date) : null;
  const hasPaidThisMonth = lastPaymentDate
    ? lastPaymentDate.getMonth() === currentMonth && lastPaymentDate.getFullYear() === currentYear : false;

  // `current_month_saved` guarda lo apartado en el mes del ultimo aporte, y solo se
  // pone a cero cuando la persona registra el aporte siguiente. Asi que el dia 1 del
  // mes nuevo la pantalla seguia mostrando lo del mes pasado: alguien que aparto 850
  // en septiembre abria la app el 1 de octubre y leia "llevas 850 ahorrados este mes"
  // y "vas bien", cuando todavia no habia apartado nada. Mientras el ultimo aporte no
  // sea de ESTE mes, lo ahorrado de este mes es cero.
  const actualSavedThisMonth = hasPaidThisMonth ? (settings?.current_month_saved || 0) : 0;
  const percentageSaved = incomeThisMonth > 0 ? (actualSavedThisMonth / incomeThisMonth) * 100 : 0;
  const isOnTrack = actualSavedThisMonth >= targetSavedThisMonth;

  // Estos consejos estaban escritos solo en espanol: a un usuario en ingles le
  // aparecia el bloque entero en el idioma equivocado.
  const es = language === 'es';
  const recommendations: string[] = [];
  if (!hasPaidThisMonth && incomeThisMonth > 0) {
    recommendations.push(es
      ? '"No gastes lo que queda después de ahorrar; ahorra primero"'
      : '"Do not spend what is left after saving; save first"');
    recommendations.push(es
      ? `Deberías apartar ${formatCurrency(targetSavedThisMonth)} este mes (${targetPercentage}% de tu ingreso)`
      : `You should set aside ${formatCurrency(targetSavedThisMonth)} this month (${targetPercentage}% of your income)`);
  } else if (hasPaidThisMonth && !isOnTrack) {
    recommendations.push(es
      ? `Te faltan ${formatCurrency(targetSavedThisMonth - actualSavedThisMonth)} para alcanzar tu meta`
      : `You are ${formatCurrency(targetSavedThisMonth - actualSavedThisMonth)} away from your goal`);
  } else if (hasPaidThisMonth && isOnTrack) {
    recommendations.push(es
      ? '¡Excelente! Ya te pagaste primero este mes'
      : 'Excellent! You already paid yourself first this month');
    if (settings?.streak_months && settings.streak_months > 1) {
      recommendations.push(es
        ? `Llevas ${settings.streak_months} meses consecutivos. ¡Sigue así!`
        : `${settings.streak_months} months in a row. Keep it up!`);
    }
  }
  if (!settings) {
    recommendations.push(es
      ? 'Configura tu porcentaje de ahorro para empezar a rastrear'
      : 'Set your savings percentage to start tracking');
  }

  return {
    settings, actualSavedThisMonth, targetSavedThisMonth, incomeThisMonth,
    percentageSaved, isOnTrack, streakMonths: settings?.streak_months || 0,
    bestStreak: settings?.best_streak_months || 0, hasPaidThisMonth, recommendations, isLoading,
  };
}

export function useUpdatePayYourselfFirst() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const t = useLocalizedToast();

  return useMutation({
    mutationFn: async (data: Partial<PayYourselfFirstSettings>) => {
      if (!user) throw new Error('No user');
      const { data: existing } = await supabase.from('pay_yourself_first_settings').select('id').eq('user_id', user.id).maybeSingle();
      if (existing) {
        const { error } = await supabase.from('pay_yourself_first_settings').update({ ...data, updated_at: new Date().toISOString() }).eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('pay_yourself_first_settings').insert({ user_id: user.id, ...data });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pay-yourself-first'] });
      t.success('Configuración actualizada', 'Settings updated');
    },
  });
}

export function useRecordPayment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const t = useLocalizedToast();

  return useMutation({
    mutationFn: async (amount: number) => {
      if (!user) throw new Error('No user');
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      const { data: settings } = await supabase.from('pay_yourself_first_settings').select('*').eq('user_id', user.id).maybeSingle();
      const lastPaymentDate = settings?.last_payment_date ? fechaLocal(settings.last_payment_date) : null;
      const isNewMonth = !lastPaymentDate || lastPaymentDate.getMonth() !== currentMonth || lastPaymentDate.getFullYear() !== currentYear;
      const newSaved = isNewMonth ? amount : (settings?.current_month_saved || 0) + amount;

      // La racha decia "meses consecutivos" pero contaba aportes: quien aportaba en
      // enero, se saltaba diez meses y aportaba en diciembre veia "2 meses
      // consecutivos". Solo sigue la racha si el aporte anterior fue el mes pasado.
      const mesPasado = new Date(currentYear, currentMonth - 1, 1);
      const veniaSeguido = !!lastPaymentDate
        && lastPaymentDate.getMonth() === mesPasado.getMonth()
        && lastPaymentDate.getFullYear() === mesPasado.getFullYear();
      const newStreak = isNewMonth
        ? (veniaSeguido ? (settings?.streak_months || 0) + 1 : 1)
        : (settings?.streak_months || 1);
      const newBestStreak = Math.max(newStreak, settings?.best_streak_months || 0);

      if (settings) {
        const { error } = await supabase.from('pay_yourself_first_settings').update({
          current_month_saved: newSaved, streak_months: newStreak, best_streak_months: newBestStreak,
          last_payment_date: aFechaISO(today), updated_at: new Date().toISOString(),
        }).eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('pay_yourself_first_settings').insert({
          user_id: user.id, current_month_saved: amount, streak_months: 1, best_streak_months: 1,
          last_payment_date: aFechaISO(today),
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pay-yourself-first'] });
      t.success('¡Te has pagado primero! 🎉', 'You paid yourself first! 🎉');
    },
  });
}
