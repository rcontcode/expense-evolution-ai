-- ════════════════════════════════════════════════════════════════════════
-- Universmind Little — Secuencia de la ESPERA (embarazo)
--
-- Primera de las cinco secuencias por etapa. Hasta ahora habia UNA sola para
-- todas: a una mujer embarazada le llegaba texto escrito para una mama con un
-- bebe de meses, y encima le ofrecia la guia a $67, que es el precio de las
-- guias de 0-12 meses. La Guia Completa de la Espera cuesta $87.
--
-- Nace DESACTIVADA. Se activa recien cuando Rudy apruebe el copy:
--   UPDATE public.automation_rules
--   SET is_enabled = true
--   WHERE name = 'Universmind Little — Inscribir Espera';
--
-- Idempotente: no hace nada si la secuencia ya existe.
-- ════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_seq_id uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.lead_nurturing_sequences
    WHERE name = 'Universmind Little — Espera'
  ) THEN
    RAISE NOTICE 'Secuencia de la Espera ya existe — no se inserta de nuevo.';
    RETURN;
  END IF;

  INSERT INTO public.lead_nurturing_sequences (name, trigger_priority, is_enabled, steps)
  VALUES (
    'Universmind Little — Espera',
    'warm',
    true,
    jsonb_build_array(

      -- ── Correo 1 · Día 0 · Bienvenida ──
      jsonb_build_object(
        'day', 0, 'delay_hours', 0, 'channel', 'email',
        'template_type', 'welcome', 'template_name', 'crm-universmind-little-nurture',
        'subject', $s$Tu Brújula está lista, {{name}} 🧭$s$,
        'body', $b${{name}}, antes que nada: todavía no nace y ya estás preparándote. Eso dice bastante.

Soy Rudy. Papá de dos, e ingeniero. Cuando esperábamos al primero yo tenía la cabeza llena de listas de cosas que comprar y ninguna respuesta a la pregunta que de verdad me quitaba el sueño: ¿y yo qué hago cuando esté acá? Así que hice lo único que sé hacer: en vez de quedarme con opiniones, fui a leer los estudios. De ahí nació Universmind Little y esta Brújula que acabas de responder.

Tu resultado dice que estás en la etapa {{stage}}. Estas semanas te voy a ir mandando lo que de verdad importa antes de que nazca — con la ciencia detrás, en palabras normales.
{{puente}}

Hoy quédate solo con esto: el trabajo ya empezó, y no es el de armar el cuarto. Es el que estás haciendo ahora, cuando te informas en vez de asustarte.

En un par de días te cuento algo que me sorprendió leyendo: por qué tu calma le llega a tu bebé antes de que nazca, y por qué eso no es una frase bonita.

— Rudy$b$,
        'cta_text', $c$Ver mi resultado de la Brújula$c$,
        'cta_url', 'https://universmind.com/evaluacion'
      ),

      -- ── Correo 2 · Día 2 · Confianza + dato ──
      jsonb_build_object(
        'day', 2, 'delay_hours', 48, 'channel', 'email',
        'template_type', 'nurture', 'template_name', 'crm-universmind-little-nurture',
        'subject', $s$Tu calma no es solo tuya$s$,
        'body', $b${{name}}, ¿te ha pasado que alguien te dice "tranquila, que el bebé lo siente" y te dan ganas de responderle cualquier cosa? A mí me pasaba por mi esposa. Suena a frase de manual, y encima suena a que ahora también es culpa tuya estar nerviosa.

Resulta que la parte de la frase que sí tiene respaldo es más interesante que la frase.

El Dr. Stephen Porges, de la Universidad de Carolina del Norte, describió algo que se llama teoría polivagal: el sistema nervioso de un bebé no se calma por orden, se calma por señales de seguridad que le llegan de su cuidador. No es obediencia; es fisiología. Y ese canal empieza a funcionar mucho antes del primer cumpleaños.

Traducción de ingeniero: no se trata de que estés serena todo el tiempo — nadie lo está, y menos embarazada. Se trata de que tu bebé no necesita una madre en calma permanente. Necesita a alguien que se altere y vuelva. Eso es lo que le enseña que del susto se sale.

Y aquí va la parte que a mí me quitó peso de encima: eso se puede practicar. No hace falta nacer con paciencia.

En el próximo correo te dejo lo único que de verdad conviene tener listo para la primera hora después del parto. No es nada que se compre.

— Rudy$b$,
        'cta_text', '', 'cta_url', ''
      ),

      -- ── Correo 3 · Día 5 · Valor puro ──
      jsonb_build_object(
        'day', 5, 'delay_hours', 72, 'channel', 'email',
        'template_type', 'nurture', 'template_name', 'crm-universmind-little-nurture',
        'subject', $s$Lo único que hay que tener listo para la primera hora$s$,
        'body', $b${{name}}, te prometí algo práctico. Acá va, y no se compra en ninguna tienda.

La primera hora después del parto tiene nombre propio en la literatura, y lo que más pesa en ella es el contacto piel con piel: tu bebé sobre tu pecho, sin ropa de por medio, sin apuro. La Organización Mundial de la Salud y UNICEF lo pusieron dentro de su marco de Cuidado Nutritivo (Britto y colegas, 2017) junto con la respuesta sensible y la estimulación: no como un gesto tierno, sino como uno de los cinco pilares del desarrollo de esos primeros años.

Lo que te sirve tener decidido ANTES, porque en el momento no vas a estar para negociar:

1) Que quieres piel con piel apenas nazca, si la situación médica lo permite.
2) Que el pesaje, la vestida y las fotos pueden esperar un rato.
3) Quién lo pide por ti si tú no estás en condiciones de hablar.
4) Que si te toca cesárea o una urgencia, el piel con piel igual puede hacerlo tu pareja — y sirve.

Ese punto 4 no es un premio de consuelo. La Dra. Ruth Feldman, con Braun y Champagne, publicó en Nature Reviews (2019) que el cuidado paterno activa sus propios circuitos de oxitocina y vasopresina: no es una versión menor del cuidado materno, es otro camino con efectos propios.

Escríbelo en una nota del teléfono y muéstraselo a quien te acompañe. Eso es todo.

PD: en el próximo correo quiero desarmar contigo el miedo que más escuché de futuros padres, y que yo también tuve: "no voy a saber qué hacer".

— Rudy$b$,
        'cta_text', '', 'cta_url', ''
      ),

      -- ── Correo 4 · Día 9 · Cambio de creencia ──
      jsonb_build_object(
        'day', 9, 'delay_hours', 96, 'channel', 'email',
        'template_type', 'nurture', 'template_name', 'crm-universmind-little-nurture',
        'subject', $s$"No voy a saber qué hacer"$s$,
        'body', $b${{name}}, esa frase la pensé yo, palabra por palabra, mirando una cuna vacía.

Te digo lo que aprendí, y no es lo que esperaba.

Nadie sabe qué hacer. Tampoco los que se ven seguros. Lo que separa a una familia que se acomoda rápido de una que la pasa peor no es saber de antemano: es tener a mano dos o tres cosas ciertas cuando llega el momento, en vez de cinco opiniones contradictorias.

Y hay algo más, que la Academia Americana de Pediatría dejó por escrito (Shonkoff, Garner y colegas, 2012): lo que protege el cerebro de un bebé frente al estrés no es un entorno perfecto. Es que haya un adulto que responda. El amortiguador eres tú, no las circunstancias.

O sea que el requisito no es saberlo todo. Es estar.

Lo que sí te ahorra sufrimiento es no tener que averiguar cada cosa de madrugada, con el teléfono en una mano y tu hijo en la otra. Eso es exactamente lo que ordené en la Guía Completa de la Espera: qué pasa cada semana, qué le sirve, y qué puedes soltar sin que se caiga nada.

En un par de días te la muestro como se debe, con precio y todo.

— Rudy$b$,
        'cta_text', '', 'cta_url', ''
      ),

      -- ── Correo 5 · Día 14 · La guía ──
      jsonb_build_object(
        'day', 14, 'delay_hours', 120, 'channel', 'email',
        'template_type', 'offer', 'template_name', 'crm-universmind-little-nurture',
        'subject', $s$La guía que me hubiera gustado tener esperando$s$,
        'body', $b${{name}}, te lo presento derecho, sin rodeos.

La **Guía Completa de la Espera** son las 40 semanas del embarazo, una por una: qué está pasando dentro, qué puedes hacer esa semana, y por qué — con el estudio de donde salió cada cosa, para que puedas revisarlo tú y no creerme a mí.

Adentro hay 160 actividades, y una cosa que no vi en ningún otro lado: **40 reflexiones separadas por rol** — para la mamá, para el papá, y para los dos juntos. Porque el que espera también está esperando, y casi nadie le escribe a él.

• Guía Completa de la Espera — **$87**
• La Colección completa, del embarazo a los 12 meses (5 guías, 496 actividades) — **$247** en vez de $355

Te digo con franqueza cuál te conviene: si es tu primer hijo y quieres una sola cosa, la Guía de la Espera. Si ya sabes que vas a querer seguir después del parto, la Colección te sale más barata que comprar dos guías por separado.

Las dos incluyen soporte por correo — me escribes y te contesto yo — y actualizaciones de por vida.

¿Dudas? Responde este correo. Lo leo yo. — Rudy$b$,
        'cta_text', $c$Ver la Guía de la Espera$c$,
        'cta_url', 'https://universmind.com/guia/embarazo'
      ),

      -- ── Correo 6 · Día 21 · Cierre ──
      jsonb_build_object(
        'day', 21, 'delay_hours', 168, 'channel', 'email',
        'template_type', 'offer', 'template_name', 'crm-universmind-little-nurture',
        'subject', $s$Antes de que nazca$s$,
        'body', $b${{name}}, no te voy a insistir más. Una cosa sola, de padre a madre o padre.

El embarazo tiene una fecha de término. No es una oferta que se acaba: es que las semanas que quedan se van a usar en algo. Se pueden usar leyendo foros a las tres de la mañana, o se pueden usar sabiendo qué pasa esta semana y qué hacer con eso.

Si la Colección te parece mucho, empieza por la Guía de la Espera ($87) — lo que te sirve ahora, nada más. Después del parto ya verás si quieres la siguiente.

Y si hoy no es el momento de comprar, también está bien. Vas a seguir recibiendo lo que publico, gratis, y no vas a dejar de recibirlo por no haber comprado. Lo importante no es la guía: es que llegues a ese día sintiendo que te preparaste.

Acuérdate de lo del primer correo: el requisito no es saberlo todo. Es estar. Y que estés leyendo esto, con todo lo que tienes encima, ya dice qué clase de madre o padre vas a ser.

Gracias por dejarme acompañarte esta espera. — Rudy$b$,
        'cta_text', $c$Ver la Guía de la Espera$c$,
        'cta_url', 'https://universmind.com/guia/embarazo'
      )

    )
  )
  RETURNING id INTO v_seq_id;

  -- Regla de inscripción (DESACTIVADA hasta que Rudy apruebe el copy).
  -- El operador `in` cubre las dos formas en que el quiz guarda la etapa segun el
  -- idioma en que la persona respondio.
  INSERT INTO public.automation_rules
    (name, trigger_type, trigger_condition, action_type, action_config, delay_minutes, is_enabled, description)
  VALUES (
    'Universmind Little — Inscribir Espera',
    'new_lead',
    '[{"field":"source","operator":"contains","value":"universmind"},
      {"field":"situation","operator":"in","value":["Esperando bebé","Embarazada","Pregnant"]}]'::jsonb,
    'email_sequence',
    jsonb_build_object('sequence_id', v_seq_id),
    0,
    false,
    'Inscribe en la secuencia de la Espera a quien respondio la Brujula estando embarazada. DESACTIVADA hasta que Rudy apruebe el copy.'
  );

  RAISE NOTICE 'Secuencia de la Espera creada: %', v_seq_id;
END $$;
