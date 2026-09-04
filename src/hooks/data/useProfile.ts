import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRecMode } from '@/hooks/useRecMode';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type WorkType = Database['public']['Enums']['work_type'];

export interface ProfileFormData {
  full_name: string;
  email: string;
  province: string | null;
  language: string;
  work_types: WorkType[];
  business_name?: string | null;
  business_number?: string | null;
  gst_hst_registered?: boolean;
  business_start_date?: string | null;
  fiscal_year_end?: string | null;
  // Multi-country support
  country?: string | null;
  rut?: string | null;
  tax_regime?: string | null;
}

/**
 * REC Mode enmascara la identidad en el perfil MISMO, no en cada pantalla.
 *
 * POR QUE SE HIZO ASI (2-sep-2026). El Demo Studio promete, textualmente, «Oculta tu nombre,
 * email e identidad EN TODA LA APP». No lo cumplia. La mascara estaba hecha solo con CSS sobre
 * `[data-pii="name"]`, y ese atributo esta puesto en dos archivos —`Layout.tsx` y
 * `ProfileCard.tsx`—, mientras que `full_name` se lee en unos veinticinco lugares. Resultado: la
 * barra lateral decia «Demo User» y al mismo tiempo el tablero saludaba con el nombre real
 * («¡Excelente Rudy! Estas ahorrando el 36 % de tus ingresos»), y lo mismo pasaba en los avisos
 * de gastos, el mentor, los reportes exportados y el contexto que se le manda al asistente.
 *
 * Marcar los veinticinco sitios que faltan no arregla nada de fondo: el sitio numero veintiseis
 * que alguien escriba manana vuelve a filtrar el nombre. Por eso la mascara baja aca, al unico
 * lugar por donde pasan todos: si REC Mode esta activo, el perfil que entrega este hook YA viene
 * con nombre y correo de demostracion. Quien lo consuma no tiene que saber que existe REC Mode.
 *
 * El CSS de `.rec-mode [data-pii]` se deja como esta: sigue sirviendo para el avatar y para
 * cualquier dato que no venga del perfil.
 */
const PERFIL_DEMO = {
  full_name: 'Demo User',
  email: 'demo@evofinz.com',
  nickname: 'Demo',
  business_name: 'Demo Studio',
  business_number: null,
  rut: null,
  phone: null,
} as const;

/**
 * La mascara se aplica al ENTREGAR el perfil, no al traerlo.
 *
 * Antes se aplicaba dentro de la consulta, leyendo la clase `rec-mode` del body. Esa clase la
 * pone un efecto, y la consulta puede salir antes: cuando eso pasaba, el perfil real quedaba
 * guardado en cache bajo la llave de grabacion y el nombre verdadero seguia apareciendo por
 * horas, sin que nada avisara. Aplicarla en `select` la deja como funcion de lo que se muestra:
 * se evalua en cada render, con el valor del hook y sin tocar el DOM.
 *
 * Y si todavia no hay perfil cargado, grabando se devuelve igual el de demostracion: varias
 * pantallas caen a `user.email` cuando el perfil viene vacio, y ese correo tambien es identidad.
 */
function enmascarar(perfil: Profile | null, grabando: boolean): Profile | null {
  if (!grabando) return perfil;
  return { ...(perfil || {}), ...PERFIL_DEMO } as Profile;
}

export function useProfile() {
  const { user } = useAuth();
  const { active: grabando } = useRecMode();

  const aplicarMascara = useCallback(
    (perfil: Profile | null) => enmascarar(perfil, grabando),
    [grabando],
  );

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Profile | null;
    },
    select: aplicarMascara,
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<ProfileFormData>) => {
      if (!user) throw new Error('Not authenticated');

      const updateData: ProfileUpdate = {
        full_name: data.full_name,
        province: data.province,
        language: data.language,
        work_types: data.work_types,
        business_name: data.business_name,
        business_number: data.business_number,
        gst_hst_registered: data.gst_hst_registered,
        business_start_date: data.business_start_date,
        fiscal_year_end: data.fiscal_year_end,
        // Multi-country support
        country: data.country,
        rut: data.rut,
        tax_regime: data.tax_regime,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Perfil actualizado');
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar perfil');
      console.error(error);
    },
  });
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
