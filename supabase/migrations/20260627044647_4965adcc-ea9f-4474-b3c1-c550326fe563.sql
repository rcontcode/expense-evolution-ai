-- ════════════════════════════════════════════════════════════════════════
-- Universmind Little — Secuencia de nurturing de la Brújula (6 emails)
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

  INSERT INTO public.lead_nurturing_sequences (name, trigger_priority, is_enabled, steps)
  VALUES (
    'Universmind Little — Brújula Nurturing',
    'warm',
    true,
    jsonb_build_array(
      jsonb_build_object(
        'day', 0, 'delay_hours', 0, 'channel', 'email',
        'template_type', 'welcome', 'template_name', 'crm-universmind-little-nurture',
        'subject', 'Tu Brújula está lista, {{name}} 🧭',
        'body', E'{{name}}, antes que nada: no estás fallando. Nadie te entregó un manual junto con tu bebé — yo tampoco lo tuve.\n\nSoy Rudy. Papá de dos, e ingeniero. Cuando nació mi primer hijo me angustiaba no saber si lo hacía bien. Así que hice lo único que sé hacer: en vez de quedarme con opiniones, fui a leer los estudios. De ahí nació Universmind Little y esta Brújula que acabas de responder.\n\nTu resultado dice que estás en la etapa {{stage}}. Estos días te voy a ir mandando lo que de verdad importa en esta etapa — con la ciencia detrás, en simple, y sin culpa.\n\nHoy quédate solo con esto: tu bebé no necesita una madre o un padre perfecto. Te necesita a ti, presente. Y eso ya lo estás haciendo.\n\nEn un par de días te cuento algo que descubrí leyendo: por qué, a veces, mecer a tu bebé más rápido no lo calma. La respuesta me sorprendió.\n\n— Rudy',
        'cta_text', 'Ver mi resultado de la Brújula',
        'cta_url', 'https://universmind.com/evaluacion'
      ),
      jsonb_build_object(
        'day', 2, 'delay_hours', 48, 'channel', 'email',
        'template_type', 'nurture', 'template_name', 'crm-universmind-little-nurture',
        'subject', 'Por qué mecerlo más rápido no siempre funciona',
        'body', E'{{name}}, ¿alguna vez tu bebé llora, nada lo calma, y por dentro piensas ''no sé qué hacer''? Te entiendo. Yo pasé noches así.\n\nCuando me puse a leer encontré algo de la Universidad de California, Berkeley (Hertenstein y Campos): las emociones de tu bebé se regulan por el contacto. El ritmo, la firmeza y la calidez de tus manos le hablan directo.\n\nTraducción de ingeniero: a veces lo que más lo calma no es mecerlo más rápido. Es que TÚ respires más lento. Tu calma le entra por la piel.\n\nNo es magia ni ''buena madre / mal padre''. Es biología. Y juega a tu favor.\n\nEn el próximo correo te dejo una rutina de 4 pasos —probada con más de 400 familias— para que esta noche cueste un poco menos.\n\n— Rudy',
        'cta_text', '', 'cta_url', ''
      ),
      jsonb_build_object(
        'day', 5, 'delay_hours', 72, 'channel', 'email',
        'template_type', 'nurture', 'template_name', 'crm-universmind-little-nurture',
        'subject', 'La rutina aburrida que por fin lo hace dormir',
        'body', E'{{name}}, son las 2 de la mañana y ya no sabes si es hambre, sueño o nada. Te prometí algo práctico para noches así. Acá va.\n\nLa Dra. Jodi Mindell (Saint Joseph''s University) siguió a más de 400 familias. El hallazgo es casi decepcionante de tan simple: una rutina de sueño constante —los mismos pasos, en el mismo orden, cada noche— reduce de forma notable los despertares. No la rutina perfecta. La misma.\n\nGuárdala para esta noche:\n1) Baño tibio\n2) Luz baja\n3) Una canción (siempre la misma)\n4) Una frase corta de cierre\n\nEl cerebro de tu bebé aprende: ''esto significa que viene la calma''.\n\nUn dato que casi nadie menciona: en ese mismo estudio mejoró el ánimo de las mamás. Cuando el bebé descansa, tú también vuelves a respirar.\n\nPD: esto es solo una de las cosas que tengo ordenadas etapa por etapa. En el próximo correo quiero desarmar contigo el mito que más culpa carga: eso de que ''lo estás malcriando''.\n\n— Rudy',
        'cta_text', '', 'cta_url', ''
      ),
      jsonb_build_object(
        'day', 9, 'delay_hours', 96, 'channel', 'email',
        'template_type', 'nurture', 'template_name', 'crm-universmind-little-nurture',
        'subject', 'No, no lo estás malcriando',
        'body', E'{{name}}, alguien ya te lo dijo, ¿cierto? ''Lo vas a malcriar de tanto cargarlo''. Yo lo escuché mil veces. Y me hizo dudar.\n\nLa ciencia es clara y va al revés: en los primeros meses, atender el llanto rápido NO malcría. Construye apego seguro. Mary Ainsworth (Universidad Johns Hopkins) lo mostró hace décadas: los bebés respondidos lloran menos, no más, hacia el año de vida.\n\nTu bebé no está manipulándote. Su cerebro todavía no puede. Solo te está diciendo: ''te necesito''. Y tú respondes. Eso es lo correcto. Eso es lo que querías hacer.\n\nLa próxima vez que alguien te diga esa frase, respira y recuerda: lo estás haciendo bien.\n\n— Rudy',
        'cta_text', '', 'cta_url', ''
      ),
      jsonb_build_object(
        'day', 14, 'delay_hours', 120, 'channel', 'email',
        'template_type', 'offer', 'template_name', 'crm-universmind-little-nurture',
        'subject', 'Lo que arma esta etapa, ordenado',
        'body', E'{{name}}, llevamos dos semanas juntos. Ya viste cómo es esto: ciencia en simple, sin culpa, sin recetas mágicas.\n\nLo que te he mandado son piezas. La guía de Universmind Little es el mapa completo de TU etapa: qué pasa en su cerebro, qué necesita, qué actividades concretas hacer hoy, esta semana, este mes.\n\nDos formas de empezar:\n• Guía de tu etapa: $67\n• El camino completo, del embarazo a los 12 meses — la Colección (5 guías, 625 actividades): $247\n\nIncluye soporte por email personalizado y actualizaciones de por vida.\n\n¿Dudas? Responde este correo, lo leo yo. — Rudy',
        'cta_text', 'Quiero mi guía',
        'cta_url', 'https://universmind.com/little'
      ),
      jsonb_build_object(
        'day', 21, 'delay_hours', 168, 'channel', 'email',
        'template_type', 'offer', 'template_name', 'crm-universmind-little-nurture',
        'subject', 'Lo único que de verdad no se recupera',
        'body', E'{{name}}, no te voy a insistir de más. Solo una cosa, de papá a madre o padre.\n\nEl dinero se recupera. Las etapas de tu bebé, no. Estos meses —su forma de mirarte, de aferrarse, de descubrir— pasan una sola vez. Esa es la única urgencia real: no la de una oferta, sino la del tiempo con tu hijo.\n\nPor eso, si la Colección completa te parece mucho, empieza por la guía de la etapa que vive HOY ($67) — lo que necesita en estas semanas, nada más. Cuando crezca, sumas la siguiente.\n\nY si hoy no es el momento de comprar, también está bien: vas a seguir recibiendo lo que publico, gratis. Lo importante no es la guía; es que aproveches estos meses.\n\nRecuerda lo del primer correo: tu bebé no necesita perfección. Te necesita a ti. Y que estés leyendo esto ya dice qué clase de madre o padre eres.\n\nGracias por dejarme acompañarte esta etapa. — Rudy',
        'cta_text', 'Ver la guía de mi etapa',
        'cta_url', 'https://universmind.com/little'
      )
    )
  )
  RETURNING id INTO v_seq_id;

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