// Guardia de llamador para las funciones que NO son publicas pero corren con `verify_jwt = false`.
//
// Por que existe (1-sep-2026): cuatro funciones quedaron sin ninguna verificacion y respondian a
// cualquiera que supiera su direccion — una gastaba la llave de IA de la cuenta, dos mandaban
// correo con la llave de servicio, y otra firmaba y entregaba avisos a los sistemas conectados.
// El patron correcto ya existia en `run-automations` desde antes; aqui se extrae para que las
// demas lo usen tal cual en vez de repetirlo.
//
// Acepta dos credenciales, que son las dos que de verdad se usan:
//   a) Bearer <SUPABASE_SERVICE_ROLE_KEY> — las llamadas de funcion a funcion
//      (run-automations, run-delayed-automations, tareas programadas de la base).
//   b) Bearer <JWT de usuario> con rol admin — el panel de administracion, que llama por
//      `supabase.functions.invoke` y manda la sesion de quien esta adentro.
//
// Uso, justo despues del preflight de CORS:
//
//   const denied = await requireInternalCaller(req, corsHeaders);
//   if (denied) return denied;

export async function requireInternalCaller(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<Response | null> {
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const authHeader = req.headers.get('Authorization') ?? '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!bearer) return unauthorized(corsHeaders);

  // a) Llamada interna con la llave de servicio.
  if (serviceKey && bearer === serviceKey) return null;

  // b) Sesion de usuario: tiene que ser valida Y de un administrador.
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey =
      Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? '';

    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${bearer}`, apikey: anonKey },
    });
    if (!userRes.ok) return unauthorized(corsHeaders);

    const user = await userRes.json();
    const userId = user?.id;
    if (!userId) return unauthorized(corsHeaders);

    const roleRes = await fetch(
      `${supabaseUrl}/rest/v1/user_roles?user_id=eq.${userId}&role=eq.admin&select=user_id&limit=1`,
      { headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey } },
    );
    if (!roleRes.ok) return unauthorized(corsHeaders);

    const rows = await roleRes.json();
    if (Array.isArray(rows) && rows.length > 0) return null;
  } catch (e) {
    console.error('[caller-guard] error al verificar el llamador:', e);
  }

  return unauthorized(corsHeaders);
}

function unauthorized(corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: 'unauthorized' }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
