import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIncome } from './useIncome';
import { toast } from 'sonner';

export interface PayYourselfFirstSettings {
  id: string;
  user_id: string;
  target_percentage: number;
  current_month_saved: number;
  current_month_income: number;
  streak_months: number;
  best_streak_months: number;
  last_payment_date: string | null;
}

export interface PayYourselfFirstData {
  settings: PayYourselfFirstSettings | null;
  actualSavedThisMonth: number;
  targetSavedThisMonth: number;
  incomeThisMonth: number;
  percentageSaved: number;
  isOnTrack: boolean;
  streakMonths: number;
  bestStreak: number;
  hasPaidThisMonth: boolean;
  recommendations: string[];
  isLoading: boolean;
}

export function usePayYourselfFirst(): PayYourselfFirstData {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const { data: incomeData } = useIncome({ year: currentYear, month: currentMonth + 1 });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['pay-yourself-first', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('pay_yourself_first_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as PayYourselfFirstSettings | null;
    },
    enabled: !!user,
  });

  // Calculate actual income this month
  const incomeThisMonth = incomeData?.reduce((sum, inc) => sum + inc.amount, 0) || 0;

  // Calculate target and actual saved
  const targetPercentage = settings?.target_percentage || 20;
  const targetSavedThisMonth = incomeThisMonth * (targetPercentage / 100);
  const actualSavedThisMonth = settings?.current_month_saved || 0;
  const percentageSaved = incomeThisMonth > 0 ? (actualSavedThisMonth / incomeThisMonth) * 100 : 0;
  const isOnTrack = actualSavedThisMonth >= targetSavedThisMonth;

  // Check if paid this month
  const lastPaymentDate = settings?.last_payment_date ? new Date(settings.last_payment_date) : null;
  const hasPaidThisMonth = lastPaymentDate 
    ? lastPaymentDate.getMonth() === currentMonth && lastPaymentDate.getFullYear() === currentYear
    : false;

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (!hasPaidThisMonth && incomeThisMonth > 0) {
    recommendations.push(`Jim Rohn: "No gastes lo que queda después de ahorrar; ahorra primero"`);
    recommendations.push(`Deberías apartar $${targetSavedThisMonth.toFixed(0)} este mes (${targetPercentage}% de tu ingreso)`);
  } else if (hasPaidThisMonth && !isOnTrack) {
    recommendations.push(`Te faltan $${(targetSavedThisMonth - actualSavedThisMonth).toFixed(0)} para alcanzar tu meta`);
  } else if (hasPaidThisMonth && isOnTrack) {
    recommendations.push('¡Excelente! Ya te pagaste primero este mes');
    if (settings?.streak_months && settings.streak_months > 1) {
      recommendations.push(`Llevas ${settings.streak_months} meses consecutivos. ¡Sigue así!`);
    }
  }

  if (!settings) {
    recommendations.push('Configura tu porcentaje de ahorro para empezar a rastrear');
  }

  return {
    settings,
    actualSavedThisMonth,
    targetSavedThisMonth,
    incomeThisMonth,
    percentageSaved,
    isOnTrack,
    streakMonths: settings?.streak_months || 0,
    bestStreak: settings?.best_streak_months || 0,
    hasPaidThisMonth,
    recommendations,
    isLoading,
  };
}

export function useUpdatePayYourselfFirst() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<PayYourselfFirstSettings>) => {
      if (!user) throw new Error('No user');

      // Check if settings exist
      const { data: existing } = await supabase
        .from('pay_yourself_first_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('pay_yourself_first_settings')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pay_yourself_first_settings')
          .insert({ user_id: user.id, ...data });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pay-yourself-first'] });
      toast.success('Configuración actualizada');
    },
  });
}

export function useRecordPayment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amount: number) => {
      if (!user) throw new Error('No user');

      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      // Get current settings
      const { data: settings } = await supabase
        .from('pay_yourself_first_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const lastPaymentDate = settings?.last_payment_date ? new Date(settings.last_payment_date) : null;
      const isNewMonth = !lastPaymentDate || 
        lastPaymentDate.getMonth() !== currentMonth || 
        lastPaymentDate.getFullYear() !== currentYear;

      const newSaved = isNewMonth ? amount : (settings?.current_month_saved || 0) + amount;
      const newStreak = isNewMonth ? (settings?.streak_months || 0) + 1 : settings?.streak_months || 1;
      const newBestStreak = Math.max(newStreak, settings?.best_streak_months || 0);

      if (settings) {
        const { error } = await supabase
          .from('pay_yourself_first_settings')
          .update({
            current_month_saved: newSaved,
            streak_months: newStreak,
            best_streak_months: newBestStreak,
            last_payment_date: today.toISOString().split('T')[0],
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pay_yourself_first_settings')
          .insert({
            user_id: user.id,
            current_month_saved: amount,
            streak_months: 1,
            best_streak_months: 1,
            last_payment_date: today.toISOString().split('T')[0],
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pay-yourself-first'] });
      toast.success('¡Te has pagado primero! 🎉');
    },
  });
}
