// ══════════════════════════════════════════════════════════════════════════
// marcar-evento-lead — le pone una etiqueta a un lead del CRM desde otra app.
//
// Para qué existe: la secuencia de correos de la Espera termina ofreciendo la
// Guía Completa de la Espera el día 14 y el día 21. Si ella la compra el día 15,
// el día 21 le llega igual una oferta de lo que ya pagó. Los frenos de la
// secuencia (`lead_nurturing_sequences.stop_conditions`) ya saben detenerse al
// ver la etiqueta — pero la etiqueta no llegaba nunca, porque la compra ocurre en
// la base de datos de Universmind Little y el CRM vive en la de EvoFinz. Este es
// el puente que faltaba.
//
// Autenticación: el MISMO secreto compartido que ya usa `sync-lead` de Little
// para mandar leads (`LEADS_WEBHOOK_SHARED_SECRET`). No hay que configurar nada
// nuevo en ninguna de las dos apps.
//
// Sólo etiqueta. No crea leads, no borra, no cambia ningún otro campo.
// ══════════════════════════════════════════════════════════════════════════

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-leads-secret',
};

// Lista blanca. Una app externa no puede escribir cualquier texto en las etiquetas
// de un lead: solo estos hechos, que son los que apagan una secuencia de correos.
const ETIQUETAS_PERMITIDAS = new Set([
  'compro-guia-espera',
  'compro-guia-0-3',
  'compro-guia-3-6',
  'compro-guia-6-9',
  'compro-guia-9-12',
  'compro-coleccion',
  'nacio-el-bebe',
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const secretoEsperado = Deno.env.get('LEADS_WEBHOOK_SHARED_SECRET') ?? '';
  const secretoRecibido = req.headers.get('x-leads-secret') ?? '';
  // Sin secreto configurado NO se abre la puerta: la falta de configuración nunca
  // afloja el freno.
  if (secretoEsperado.length === 0 || secretoRecibido !== secretoEsperado) {
    return json({ error: 'Unauthorized' }, 401);
  }

  let cuerpo: { email?: string; etiqueta?: string };
  try {
    cuerpo = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const email = String(cuerpo.email ?? '').trim().toLowerCase();
  const etiqueta = String(cuerpo.etiqueta ?? '').trim().toLowerCase();

  if (!EMAIL_RE.test(email) || email.length > 255) return json({ error: 'Invalid email' }, 400);
  if (!ETIQUETAS_PERMITIDAS.has(etiqueta)) return json({ error: 'Unknown etiqueta' }, 400);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  const supabase = createClient(supabaseUrl, serviceKey);

  // Una persona puede tener varias filas en quiz_leads: cada vez que responde un
  // quiz se crea una nueva. La compra las alcanza a todas, porque cualquiera de
  // ellas puede tener una secuencia de correos corriendo.
  const { data: leads, error: errorLectura } = await supabase
    .from('quiz_leads')
    .select('id, tags')
    .eq('email', email)
    .limit(50);

  if (errorLectura) {
    console.error('[marcar-evento-lead] Error leyendo leads:', errorLectura);
    return json({ error: 'Lookup failed' }, 500);
  }
  if (!leads || leads.length === 0) {
    // No es un error: la persona pudo comprar sin haber respondido nunca un quiz.
    return json({ success: true, actualizados: 0, motivo: 'sin leads con ese correo' });
  }

  let actualizados = 0;
  for (const lead of leads) {
    const actuales: string[] = Array.isArray(lead.tags) ? lead.tags : [];
    if (actuales.includes(etiqueta)) continue;
    const { error } = await supabase
      .from('quiz_leads')
      .update({ tags: [...actuales, etiqueta] })
      .eq('id', lead.id);
    if (error) console.error(`[marcar-evento-lead] No se pudo etiquetar ${lead.id}:`, error);
    else actualizados++;
  }

  console.log(`[marcar-evento-lead] "${etiqueta}" aplicada a ${actualizados}/${leads.length} lead(s)`);
  return json({ success: true, actualizados, encontrados: leads.length });
});
