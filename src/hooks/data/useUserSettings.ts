import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useInvalidateRelated } from "./useInvalidateRelated";

export type BudgetMode = "unified" | "separated" | "family_only";

export interface UserPreferences {
  global_monthly_budget?: number;
  global_budget_alert_threshold?: number;
  budget_mode?: BudgetMode;
}

export function useUserSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-settings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useUpdateUserPreferences() {
  const { user } = useAuth();
  const { afterSettings } = useInvalidateRelated();

  return useMutation({
    mutationFn: async (preferences: Partial<UserPreferences>) => {
      if (!user) throw new Error("Not authenticated");

      const { data: current } = await supabase
        .from("settings")
        .select("preferences")
        .single();

      const currentPrefs = (current?.preferences as UserPreferences) || {};
      const updatedPrefs = { ...currentPrefs, ...preferences };

      const { error } = await supabase
        .from("settings")
        .update({ preferences: updatedPrefs })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      afterSettings();
      toast.success("Configuración guardada");
    },
    onError: (error: Error) => {
      toast.error("Error al guardar configuración");
      console.error(error);
    },
  });
}
