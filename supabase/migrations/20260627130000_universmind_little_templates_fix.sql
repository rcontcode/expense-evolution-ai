-- ════════════════════════════════════════════════════════════════════════
-- Universmind Little — corrección de plantillas (SOLO universmind)
--   1) Restaura los 6 pasos de la secuencia de la Brújula (al desplegar se
--      alteraron los emails 4 y 5). Email 4 con cita Bowlby (apego, verificada).
--   2) Reescribe las 8 plantillas manuales de UniversMind (email + WhatsApp)
--      de la marca vieja (meditación/aprendizaje) a crianza.
-- NO toca EvoFinz ni Fokuspark. Idempotente (UPDATE).
-- ════════════════════════════════════════════════════════════════════════

-- ── 1) Secuencia: restaurar los 6 pasos correctos ──────────────────────────
UPDATE public.lead_nurturing_sequences
SET steps = jsonb_build_array(

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

  jsonb_build_object(
    'day', 9, 'delay_hours', 96, 'channel', 'email',
    'template_type', 'nurture', 'template_name', 'crm-universmind-little-nurture',
    'subject', $s$No, no lo estás malcriando$s$,
    'body', $b${{name}}, una de las frases que más escucho: 'si lo tomo cada vez que llora, lo malcrío'. Yo la escuché mil veces, y me hizo dudar.

La ciencia va al revés. En los primeros meses, atender a tu bebé rápido no lo malcría: fortalece su vínculo seguro. Es la base de su desarrollo emocional —lo que John Bowlby, el padre de la teoría del apego, planteó hace décadas. Un bebé que confía en que alguien viene cuando llama se siente más seguro, no más 'mañoso'.

Tu bebé todavía no puede manipularte. Solo te dice 'te necesito'. Y tú respondes. Eso es exactamente lo correcto.

La próxima vez que alguien te suelte esa frase, respira y recuerda: lo estás haciendo bien.

En un par de días te muestro el mapa completo que armé para esta etapa.

— Rudy$b$,
    'cta_text', '', 'cta_url', ''
  ),

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
WHERE name = 'Universmind Little — Brújula Nurturing';

-- ── 2) Plantillas manuales de UniversMind → crianza (8) ────────────────────

-- Email · Primer contacto
UPDATE public.lead_message_templates
SET name = 'Universmind Little - Primer Contacto Email', is_auto = false,
    content = $t$[SUBJECT: Tu Brújula de crianza, {{name}}]

Hola {{name}}, soy Rudy, papá de dos e ingeniero, de Universmind Little.

Vi que respondiste la Brújula de crianza — gracias por tomarte ese rato.

Armé Universmind Little para acompañarte en la etapa de tu bebé con la ciencia en simple, sin culpa.

¿Quieres que te cuente qué es lo que más importa en la etapa en la que estás ahora?

Un abrazo, Rudy 👶$t$
WHERE target_app = 'universmind' AND message_type = 'email' AND template_type = 'first_contact';

-- Email · Follow-up
UPDATE public.lead_message_templates
SET name = 'Universmind Little - Follow-up Email', is_auto = false,
    content = $t$[SUBJECT: ¿Pudiste verlo, {{name}}?]

Hola {{name}}, hace unos días te escribí desde Universmind Little.

Solo quería saber si pudiste mirar tu resultado de la Brújula y si te quedó alguna duda sobre la etapa de tu bebé.

Cualquier cosa, respóndeme — lo leo yo.

Un abrazo, Rudy 👶$t$
WHERE target_app = 'universmind' AND message_type = 'email' AND template_type = 'follow_up';

-- Email · Guía (antes "Oferta")
UPDATE public.lead_message_templates
SET name = 'Universmind Little - Guía Email', is_auto = false,
    content = $t$[SUBJECT: Lo que tengo para la etapa de tu bebé]

Hola {{name}}, te cuento lo que preparé para la etapa que vive tu bebé ahora.

La Guía de Universmind Little reúne la ciencia de estos meses —sueño, llanto, vínculo, juego— semana a semana, en lenguaje normal. Y si quieres el camino completo, del embarazo a los 12 meses, está la Colección de 5 guías.

Lo importante no es comprar; es aprovechar esta etapa, que no vuelve. Si te sirve, te paso el detalle.

Un abrazo, Rudy 👶$t$
WHERE target_app = 'universmind' AND message_type = 'email' AND template_type = 'offer';

-- Email · Reactivación
UPDATE public.lead_message_templates
SET name = 'Universmind Little - Reactivación Email', is_auto = false,
    content = $t$[SUBJECT: ¿Cómo va todo con tu bebé, {{name}}?]

Hola {{name}}, hace un tiempo pasaste por Universmind Little y quería saber cómo va todo.

Sumé guías nuevas, ordenadas etapa por etapa, con la ciencia de los primeros 12 meses, cada cosa respaldada por estudios reales.

Si quieres, te muestro la que va justo con la etapa de tu bebé hoy.

Un abrazo, Rudy 👶$t$
WHERE target_app = 'universmind' AND message_type = 'email' AND template_type = 'reactivation';

-- WhatsApp · Primer contacto
UPDATE public.lead_message_templates
SET name = 'Universmind Little - Primer Contacto WhatsApp', is_auto = false,
    content = $t$¡Hola {{name}}! 👋 Soy Rudy, de Universmind Little (papá de dos e ingeniero). Vi que respondiste la Brújula de crianza 👶 ¿Te cuento qué es lo que más importa en la etapa de tu bebé ahora? Con ciencia y sin culpa 💛$t$
WHERE target_app = 'universmind' AND message_type = 'whatsapp' AND template_type = 'first_contact';

-- WhatsApp · Follow-up
UPDATE public.lead_message_templates
SET name = 'Universmind Little - Follow-up WhatsApp', is_auto = false,
    content = $t$¡Hola {{name}}! 👋 Hace unos días te escribí de Universmind Little. ¿Pudiste ver tu resultado de la Brújula? Si te quedó alguna duda sobre la etapa de tu bebé, acá estoy 💛$t$
WHERE target_app = 'universmind' AND message_type = 'whatsapp' AND template_type = 'follow_up';

-- WhatsApp · Guía (antes "Oferta")
UPDATE public.lead_message_templates
SET name = 'Universmind Little - Guía WhatsApp', is_auto = false,
    content = $t$¡Hola {{name}}! 👶 Preparé la Guía de Universmind Little para la etapa de tu bebé: la ciencia de estos meses en simple, semana a semana. Si quieres te paso el detalle — sin apuro, lo importante es aprovechar esta etapa 💛$t$
WHERE target_app = 'universmind' AND message_type = 'whatsapp' AND template_type = 'offer';

-- WhatsApp · Reactivación
UPDATE public.lead_message_templates
SET name = 'Universmind Little - Reactivación WhatsApp', is_auto = false,
    content = $t$¡Hola {{name}}! 👋 Soy Rudy, de Universmind Little. Hace un tiempo respondiste la Brújula 👶 Sumé guías nuevas con la ciencia de cada etapa del bebé. ¿Te muestro la que va con tu etapa de ahora? 💛$t$
WHERE target_app = 'universmind' AND message_type = 'whatsapp' AND template_type = 'reactivation';
