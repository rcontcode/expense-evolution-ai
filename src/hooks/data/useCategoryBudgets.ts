import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface CategoryBudget {
  id: string;
  user_id: string;
  category: string;
  monthly_budget: number;
  alert_threshold: number;
  entity_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useCategoryBudgets(entityId?: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["category-budgets", user?.id, entityId],
    queryFn: async () => {
      let query = supabase
        .from("category_budgets")
        .select("*")
        .order("category");

      if (entityId === null) {
        // Family / no entity
        query = query.is("entity_id", null);
      } else if (entityId) {
        query = query.eq("entity_id", entityId);
      }
      // If entityId is undefined, return all (unified mode)

      const { data, error } = await query;
      if (error) throw error;
      return data as CategoryBudget[];
    },
    enabled: !!user,
  });
}

export function useUpsertCategoryBudget() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { category: string; monthly_budget: number; alert_threshold?: number; entity_id?: string | null }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("category_budgets")
        .upsert({
          user_id: user.id,
          category: data.category,
          monthly_budget: data.monthly_budget,
          alert_threshold: data.alert_threshold || 80,
          entity_id: data.entity_id ?? null,
        }, { onConflict: "user_id,category,entity_id" });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-budgets"] });
      toast.success("Presupuesto guardado");
    },
    onError: (error: Error) => {
      toast.error("Error al guardar presupuesto");
      console.error(error);
    },
  });
}

export function useDeleteCategoryBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("category_budgets")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-budgets"] });
      toast.success("Presupuesto eliminado");
    },
    onError: (error: Error) => {
      toast.error("Error al eliminar");
      console.error(error);
    },
  });
}
