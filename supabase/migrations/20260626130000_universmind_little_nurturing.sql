-- ════════════════════════════════════════════════════════════════════════
-- Universmind Little — Secuencia de nurturing de la Brújula (6 emails)
-- Copy FIJO (sin IA). Cadencia días 0 / 2 / 5 / 9 / 14 / 21.
-- Se inscriben los leads con source que contiene "universmind".
--
-- IMPORTANTE: la regla de inscripción se crea DESACTIVADA (is_enabled = false)
-- para no disparar en producción hasta probar. Para activar:
--   UPDATE public.automation_rules
--   SET is_enabled = true
--   WHERE name = 'Universmind Little — Inscribir Brújula';
--
-- Idempotente: no hace nada si la secuencia ya existe.
-- ════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_seq_id uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.lead_nurturing_sequences
    WHERE name = 'Universmind Little — Brújula Nurturing'
  ) THEN
    RAISE NOTICE 'Secuencia ya existe — no se inserta de nuevo.';
    RETURN;
  END IF;

  -- 1) Secuencia con los 6 pasos (delay_hours acumulativo → días 0/2/5/9/14/21)
  INSERT INTO public.lead_nurturing_sequences (name, trigger_priority, is_enabled, steps)
  VALUES (
    'Universmind Little — Brújula Nurturing',
    'warm',
    true,
    jsonb_build_array(

      -- ── Email 1 · Día 0 · Bienvenida ──
      jsonb_build_object(
        'day', 0, 'delay_hours', 0, 'channel', 'email',
        'template_type', 'welcome', 'template_name', 'crm-universmind-little-nurture',
        'subject', $s$Tu Brújula está lista, {{name}} 🧭$s$,
        'body', $b${{name}}, antes que nada: no estás fallando. Nadie te entregó un manual junto con tu bebé — yo tampoco lo tuve.

Soy Rudy. Papá de dos, e ingeniero. Cuando nació mi primer hijo me angustiaba no saber si lo hacía bien. Así que hice lo único que sé hacer: en vez de quedarme con opiniones, fui a leer los estudios. De ahí nació Universmind Little y esta Brújula que acabas de responder.

Tu resultado dice que estás en la etapa {{stage}}. Estos días te voy a ir mandando lo que de verdad importa en esta etapa — con la ciencia detrás, en simple, y sin culpa.

Hoy quédate solo con esto: tu bebé no necesita una madre o un padre perfecto. Te necesita a ti, presente. Y eso ya lo estás haciendo.

En un par de días te cuento algo que descubrí leyendo: por qué, a veces, mecer a tu bebé más rápido no lo calma. La respuesta me sorprendió.

— Rudy$b$,
        'cta_text', $c$Ver mi resultado de la Brújula$c$,
        'cta_url', 'https://universmind.com/evaluacion'
      ),

      -- ── Email 2 · Día 2 · Confianza + dato ──
      jsonb_build_object(
        'day', 2, 'delay_hours', 48, 'channel', 'email',
        'template_type', 'nurture', 'template_name', 'crm-universmind-little-nurture',
        'subject', $s$Por qué mecerlo más rápido no siempre funciona$s$,
        'body', $b${{name}}, ¿alguna vez tu bebé llora, nada lo calma, y por dentro piensas 'no sé qué hacer'? Te entiendo. Yo pasé noches así.

Cuando me puse a leer encontré algo de la Universidad de California, Berkeley (Hertenstein y Campos): las emociones de tu bebé se regulan por el contacto. El ritmo, la firmeza y la calidez de tus manos le hablan directo.

Traducción de ingeniero: a veces lo que más lo calma no es mecerlo más rápido. Es que TÚ respires más lento. Tu calma le entra por la piel.

No es magia ni 'buena madre / mal padre'. Es biología. Y juega a tu favor.

En el próximo correo te dejo una rutina de 4 pasos —probada con más de 400 familias— para que esta noche cueste un poco menos.

— Rudy$b$,
        'cta_text', '', 'cta_url', ''
      ),

      -- ── Email 3 · Día 5 · Valor puro (rutina) ──
      jsonb_build_object(
        'day', 5, 'delay_hours', 72, 'channel', 'email',
        'template_type', 'nurture', 'template_name', 'crm-universmind-little-nurture',
        'subject', $s$La rutina aburrida que por fin lo hace dormir$s$,
        'body', $b${{name}}, son las 2 de la mañana y ya no sabes si es hambre, sueño o nada. Te prometí algo práctico para noches así. Acá va.

La Dra. Jodi Mindell (Saint Joseph's University) siguió a más de 400 familias. El hallazgo es casi decepcionante de tan simple: una rutina de sueño constante —los mismos pasos, en el mismo orden, cada noche— reduce de forma notable los despertares. No la rutina perfecta. La misma.

Guárdala para esta noche:
1) Baño tibio
2) Luz baja
3) Una canción (siempre la misma)
4) Una frase corta de cierre

El cerebro de tu bebé aprende: 'esto significa que viene la calma'.

Un dato que casi nadie menciona: en ese mismo estudio mejoró el ánimo de las mamás. Cuando el bebé descansa, tú también vuelves a respirar.

PD: esto es solo una de las cosas que tengo ordenadas etapa por etapa. En el próximo correo quiero desarmar contigo el mito que más culpa carga: eso de que 'lo estás malcriando'.

— Rudy$b$,
        'cta_text', '', 'cta_url', ''
      ),

      -- ── Email 4 · Día 9 · Cambio de creencia ──
      jsonb_build_object(
        'day', 9, 'delay_hours', 96, 'channel', 'email',
        'template_type', 'nurture', 'template_name', 'crm-universmind-little-nurture',
        'subject', $s$No, no lo estás malcriando$s$,
        'body', $b${{name}}, una de las frases que más escucho: 'si lo tomo cada vez que llora, lo malcrío'.

La ciencia dice lo contrario. A esta edad no se malcría: se construye la confianza de que, cuando él llama, alguien viene. Esa confianza es la base de su seguridad para toda la vida.

(La Dra. Baillargeon, Universidad de Illinois, mostró que bebés de dos meses y medio ya arman teorías sobre el mundo. Tienes un pequeño científico en casa.)

El problema casi nunca es que falte amor. Es que falta un mapa: qué importa en cada etapa y qué puedes soltar. Eso es justo lo que ordené en la Guía de Universmind Little. En un par de días te la muestro como se debe.

— Rudy$b$,
        'cta_text', '', 'cta_url', ''
      ),

      -- ── Email 5 · Día 14 · La guía (oferta, urgencia por la ventana) ──
      jsonb_build_object(
        'day', 14, 'delay_hours', 120, 'channel', 'email',
        'template_type', 'offer', 'template_name', 'crm-universmind-little-nurture',
        'subject', $s$La guía que me hubiera gustado tener$s$,
        'body', $b${{name}}, te lo presento derecho.

Hay algo de esta etapa que no se dice lo suficiente: es una ventana que no vuelve. El cerebro de tu bebé está formando más de un millón de conexiones por segundo, y lo que vive contigo ahora —el contacto, el juego, la calma— deja huella justo en estos meses. No te lo digo para presionarte: al revés, para que sepas que lo que ya haces vale, y que vale la pena hacerlo con un mapa.

Eso es la Guía de Universmind Little de tu etapa: la ciencia de estos meses (sueño, llanto, vínculo, juego, desarrollo), semana a semana, en lenguaje de persona normal — no de manual. Cada actividad, respaldada por estudios reales.

• Guía de tu etapa: $67
• El camino completo, del embarazo a los 12 meses — la Colección (5 guías, 625 actividades): $247

Incluye soporte por email personalizado y actualizaciones de por vida.

¿Dudas? Responde este correo, lo leo yo. — Rudy$b$,
        'cta_text', $c$Quiero mi guía$c$,
        'cta_url', 'https://universmind.com/little'
      ),

      -- ── Email 6 · Día 21 · Lo único que no se recupera ──
      jsonb_build_object(
        'day', 21, 'delay_hours', 168, 'channel', 'email',
        'template_type', 'offer', 'template_name', 'crm-universmind-little-nurture',
        'subject', $s$Lo único que de verdad no se recupera$s$,
        'body', $b${{name}}, no te voy a insistir de más. Solo una cosa, de papá a madre o padre.

El dinero se recupera. Las etapas de tu bebé, no. Estos meses —su forma de mirarte, de aferrarse, de descubrir— pasan una sola vez. Esa es la única urgencia real: no la de una oferta, sino la del tiempo con tu hijo.

Por eso, si la Colección completa te parece mucho, empieza por la guía de la etapa que vive HOY ($67) — lo que necesita en estas semanas, nada más. Cuando crezca, sumas la siguiente.

Y si hoy no es el momento de comprar, también está bien: vas a seguir recibiendo lo que publico, gratis. Lo importante no es la guía; es que aproveches estos meses.

Recuerda lo del primer correo: tu bebé no necesita perfección. Te necesita a ti. Y que estés leyendo esto ya dice qué clase de madre o padre eres.

Gracias por dejarme acompañarte esta etapa. — Rudy$b$,
        'cta_text', $c$Ver la guía de mi etapa$c$,
        'cta_url', 'https://universmind.com/little'
      )

    )
  )
  RETURNING id INTO v_seq_id;

  -- 2) Regla de inscripción (DESACTIVADA): leads con source que contiene "universmind"
  INSERT INTO public.automation_rules
    (name, trigger_type, trigger_condition, action_type, action_config, delay_minutes, is_enabled, description)
  VALUES (
    'Universmind Little — Inscribir Brújula',
    'new_lead',
    '[{"field":"source","operator":"contains","value":"universmind"}]'::jsonb,
    'email_sequence',
    jsonb_build_object('sequence_id', v_seq_id),
    0,
    false,
    'Inscribe leads de Universmind Little (source contiene "universmind") en la secuencia de 6 emails de la Brújula. DESACTIVADA en staging — activar tras probar con un lead real.'
  );

  RAISE NOTICE 'Secuencia Universmind Little creada: %', v_seq_id;
END $$;
