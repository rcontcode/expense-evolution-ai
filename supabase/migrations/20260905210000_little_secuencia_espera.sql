-- ════════════════════════════════════════════════════════════════════════
-- Universmind Little — Secuencia de la ESPERA (embarazo)
--
-- Primera de las cinco secuencias por etapa. Hasta ahora habia UNA sola para
-- todas: a una mujer embarazada le llegaba texto escrito para una mama con un
-- bebe de meses, y encima le ofrecia la guia a US$67, que es el precio de las
-- guias de 0-12 meses. La Guia Completa de la Espera cuesta US$87.
--
-- Segunda version del copy. La primera se reviso entera y se rechazo por cuatro
-- motivos que quedaron corregidos aqui:
--   1. Citaba a Porges (polivagal) como hecho probado y lo extendia al embarazo.
--      Se reemplazo por DeCasper & Spence (1986) y DeCasper & Fifer (1980), que
--      SI son prenatales y estan medidos, y por Gunnar & Donzella (2002) para lo
--      posnatal, dicho como posnatal.
--   2. Presentaba el piel con piel como uno de los cinco componentes del marco de
--      Cuidado Nutritivo (Britto, 2017). No lo es: los cinco son salud, nutricion,
--      seguridad, cuidado responsivo y oportunidades de aprendizaje.
--   3. Usaba a Feldman/Braun/Champagne (2019) como evidencia de piel con piel
--      paterno tras cesarea. Ese estudio no mide eso; ahora se cita solo por lo
--      que si dice (el cuidado paterno tiene neurobiologia propia).
--   4. La comparacion de precios era FALSA: decia que la Coleccion sale mas barata
--      que comprar dos guias sueltas. Dos guias son US$87 + US$67 = US$154, menos
--      que los US$247 de la Coleccion. Ahora el correo dice el numero de verdad.
--
-- Ademas: se agrega la columna `stop_conditions`, que es lo que impide seguir
-- ofreciendole la guia a quien ya la compro o ya tuvo a su bebe.
--
-- Nace DESACTIVADA. Se activa recien cuando Rudy apruebe el copy:
--   UPDATE public.automation_rules
--   SET is_enabled = true
--   WHERE name = 'Universmind Little — Inscribir Espera';
--
-- Idempotente: no hace nada si la secuencia ya existe.
-- ════════════════════════════════════════════════════════════════════════

-- Frenos de la secuencia. Un paso que no corresponde no se salta: apaga la
-- secuencia entera para ese lead. Si ella compra el dia 15, saltarse solo ese
-- paso le mandaria igual la oferta del dia 21, ofreciendole lo que ya pago.
ALTER TABLE public.lead_nurturing_sequences
  ADD COLUMN IF NOT EXISTS stop_conditions jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.lead_nurturing_sequences.stop_conditions IS
  'Lista de {field, operator, value}. Basta que se cumpla UNA para detener la secuencia completa de ese lead. Mismo evaluador que automation_rules.trigger_condition.';

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

  INSERT INTO public.lead_nurturing_sequences (name, trigger_priority, is_enabled, stop_conditions, steps)
  VALUES (
    'Universmind Little — Espera',
    'warm',
    true,
    -- Las tres etiquetas las escribe la app de Little cuando se paga o cuando
    -- ella avisa que nacio. La cuarta cubre el caso de que vuelva a responder la
    -- Brujula diciendo otra etapa.
    '[{"field":"tags","operator":"array_contains","value":"compro-guia-espera"},
      {"field":"tags","operator":"array_contains","value":"compro-coleccion"},
      {"field":"tags","operator":"array_contains","value":"nacio-el-bebe"},
      {"field":"situation","operator":"not_in","value":["Esperando bebé","Embarazada","Pregnant"]}]'::jsonb,
    jsonb_build_array(

      -- ── Correo 1 · Día 0 · Bienvenida ──
      jsonb_build_object(
        'day', 0, 'delay_hours', 0, 'channel', 'email',
        'nota_interna', 'Espera 1/6 — bienvenida. Unico paso que usa {{puente}} (el obstaculo del quiz).',
        'template_type', 'welcome', 'template_name', 'crm-universmind-little-nurture',
        'subject', $s$Tu Brújula está lista, {{name}} 🧭$s$,
        'body', $b${{name}}, antes que nada: todavía no nace y ya estás preparándote. Eso dice bastante.

Soy Rudy. Papá de dos, e ingeniero. Cuando esperábamos al primero yo tenía la cabeza llena de listas de cosas que comprar y ninguna respuesta a la pregunta que de verdad me quitaba el sueño: ¿y yo qué hago cuando esté acá? Así que hice lo que mejor sé hacer: ordenar el problema, comparar la evidencia y convertirla en pasos claros. De ahí nació Universmind Little y esta Brújula que acabas de responder.

Tu resultado dice que estás en la etapa {{stage}}. Durante los próximos días te voy a ir mandando lo que de verdad importa antes de que nazca — con la ciencia detrás, en palabras normales.
{{puente}}

Hoy quédate solo con esto: el trabajo ya empezó, y no es el de armar el cuarto. Es el que estás haciendo ahora, cuando te informas en vez de asustarte.

En un par de días te cuento algo que me sorprendió leyendo: qué es lo que tu bebé ya está aprendiendo de ti sin haber nacido, y cómo lo midieron.

— Rudy$b$,
        'cta_text', $c$Ver mi resultado de la Brújula$c$,
        'cta_url', 'https://universmind.com/evaluacion?utm_source=correo&utm_medium=nurture&utm_campaign=espera&utm_content=dia0-brujula'
      ),

      -- ── Correo 2 · Día 2 · Confianza + dato ──
      jsonb_build_object(
        'day', 2, 'delay_hours', 48, 'channel', 'email',
        'nota_interna', 'Espera 2/6 — el dato prenatal (DeCasper). Sin pedir nada.',
        'template_type', 'nurture', 'template_name', 'crm-universmind-little-nurture',
        'subject', $s$Tu voz ya le está enseñando algo$s$,
        'body', $b${{name}}, seguro te han dicho "tranquila, que el bebé lo siente". Suena a frase de manual y, peor, suena a que ahora estar nerviosa también es culpa tuya.

Te cuento lo que sí está medido, porque es más interesante que la frase — y no te carga con nada.

En 1986, DeCasper y Spence les pidieron a un grupo de embarazadas que leyeran en voz alta el mismo pasaje, todos los días, durante las últimas seis semanas. Cuando esos bebés nacieron, los evaluaron: preferían ese pasaje por sobre uno nuevo. Lo reconocían. Seis años antes, DeCasper y Fifer ya habían mostrado que un recién nacido de días prefiere la voz de su madre a la de otra mujer.

O sea que lo que le llega antes de nacer no es tu estado de ánimo: es tu voz. Y le llega lo bastante como para que la reconozca al salir.

Lo otro —lo de la calma— empieza a funcionar después de nacer, y también está estudiado. Gunnar y Donzella (2002) revisaron cómo un adulto presente y atento le baja el cortisol al bebé: el sistema de estrés de un recién nacido no se regula solo, se regula con alguien.

Fíjate bien en lo que eso NO dice. No dice que tengas que estar serena todo el tiempo; nadie lo está, y menos embarazada. Dice que tu bebé va a necesitar a alguien que se altere y vuelva. Eso es lo que le enseña que del susto se sale.

Y esa parte se practica. No hace falta nacer con paciencia.

En el próximo correo te dejo lo único que de verdad conviene tener listo para la primera hora después del parto. No es nada que se compre.

— Rudy$b$,
        'cta_text', '', 'cta_url', ''
      ),

      -- ── Correo 3 · Día 5 · Valor puro ──
      jsonb_build_object(
        'day', 5, 'delay_hours', 72, 'channel', 'email',
        'nota_interna', 'Espera 3/6 — la lista de la primera hora. Valor puro, sin venta.',
        'template_type', 'nurture', 'template_name', 'crm-universmind-little-nurture',
        'subject', $s$Lo único que hay que tener listo para la primera hora$s$,
        'body', $b${{name}}, te prometí algo práctico. Acá va, y no se compra en ninguna tienda.

Lo que más pesa en la primera hora después del parto es el contacto piel con piel: tu bebé sobre tu pecho, sin ropa de por medio, sin apuro. La Organización Mundial de la Salud lo recomienda de forma inmediata para todo recién nacido que esté bien, y Nils Bergman ha descrito por qué: el cuerpo de la madre es lo que le regula la temperatura, la glucosa y el sistema nervioso al recién llegado.

Eso es una cosa. Otra distinta —y conviene no confundirlas— es el marco de Cuidado Nutritivo de la OMS y UNICEF (Britto y colegas, en The Lancet, 2017). Ese marco tiene cinco componentes, y el piel con piel no es uno de ellos: los cinco son salud, nutrición, seguridad, cuidado responsivo y oportunidades de aprendizaje temprano. El piel con piel es una de las formas más tempranas de cuidado responsivo, no una categoría aparte. Te lo aclaro porque vas a ver ese marco citado en todas partes, casi siempre mal.

Lo que te sirve tener decidido ANTES, porque en el momento no vas a estar para negociar:

1) Que quieres piel con piel apenas nazca, si la situación médica lo permite.
2) Que el pesaje, la vestida y las fotos pueden esperar un rato.
3) Quién lo pide por ti si tú no estás en condiciones de hablar.
4) Que si te toca cesárea o una urgencia, el piel con piel lo puede hacer tu pareja mientras tanto. Muchos hospitales ya lo ofrecen; conviene preguntarlo antes y no en el momento.

Sobre ese punto 4, una precisión honesta: no te lo pongo como premio de consuelo, pero tampoco te voy a decir que existe un estudio que mida exactamente eso. Lo que sí está bien documentado es otra cosa — Feldman, Braun y Champagne, en Nature Reviews Neuroscience (2019), describen que el cuidado paterno activa sus propios circuitos de oxitocina y vasopresina. No es una versión menor del cuidado materno: es un camino distinto, con efectos propios.

Escríbelo en una nota del teléfono y muéstraselo a quien te acompañe. Eso es todo.

PD: en el próximo correo quiero desarmar contigo el miedo que más he escuchado de futuros padres, y que yo también tuve: "no voy a saber qué hacer".

— Rudy$b$,
        'cta_text', '', 'cta_url', ''
      ),

      -- ── Correo 4 · Día 9 · Cambio de creencia ──
      jsonb_build_object(
        'day', 9, 'delay_hours', 96, 'channel', 'email',
        'nota_interna', 'Espera 4/6 — "no voy a saber que hacer". Prepara la oferta del dia 14.',
        'template_type', 'nurture', 'template_name', 'crm-universmind-little-nurture',
        'subject', $s$"No voy a saber qué hacer"$s$,
        'body', $b${{name}}, esa frase la pensé yo, palabra por palabra, mirando una cuna vacía.

Te digo lo que aprendí, y no es lo que esperaba.

Nadie sabe qué hacer. Tampoco los que se ven seguros. La diferencia no está en saber de antemano: está en tener a mano dos o tres cosas ciertas cuando llega el momento, en vez de cinco opiniones que se contradicen a las tres de la mañana.

Y hay algo más, que la Academia Americana de Pediatría dejó por escrito (Shonkoff, Garner y colegas, 2012): lo que protege el cerebro de un bebé frente al estrés sostenido son las relaciones estables con adultos que responden. No un entorno perfecto: una relación.

Lee bien lo que eso dice y lo que no dice. No dice que tú sola tengas que compensar todo lo que venga; hay circunstancias que no se compensan con buena voluntad, y no sería justo cargártelas. Dice que el vínculo cuenta, y que el vínculo se construye estando, no sabiendo.

Lo que sí te ahorra sufrimiento es no tener que averiguar cada cosa de madrugada, con el teléfono en una mano y tu hijo en la otra. Eso es exactamente lo que ordené en la Guía Completa de la Espera: qué pasa cada semana, qué le sirve, y qué puedes soltar sin que se caiga nada.

En un par de días te la muestro como se debe, con precio y todo.

— Rudy$b$,
        'cta_text', '', 'cta_url', ''
      ),

      -- ── Correo 5 · Día 14 · La guía ──
      jsonb_build_object(
        'day', 14, 'delay_hours', 120, 'channel', 'email',
        'nota_interna', 'Espera 5/6 — la oferta. Dos botones: guia (principal) y coleccion (secundario).',
        'template_type', 'offer', 'template_name', 'crm-universmind-little-nurture',
        'subject', $s$La guía que me hubiera gustado tener esperando$s$,
        'body', $b${{name}}, te lo presento derecho, sin rodeos.

La Guía Completa de la Espera son las 40 semanas del embarazo, una por una: qué está pasando dentro, qué puedes hacer esa semana, y por qué — con el estudio de donde salió cada cosa, para que puedas revisarlo tú y no creerme a mí.

Qué trae, en concreto:

• Las 40 semanas del embarazo, una por una.
• 160 actividades repartidas entre esas semanas.
• 40 reflexiones para escribir, una por semana. Cada una viene en tres versiones —para la mamá, para el papá y para los dos juntos— y eliges la que te sirva esa semana. No son 120 tareas: es una pregunta semanal con tres puertas de entrada. Casi nadie le escribe al que espera al lado, y esa fue la razón de hacerlo así.
• Las referencias científicas de donde sale cada recomendación, con su enlace.
• Soporte por correo: me escribes y te contesto yo.
• Actualizaciones de por vida.

Los precios:

• Guía Completa de la Espera — US$87.
• Colección Completa, del embarazo a los 12 meses (5 guías, 496 actividades) — US$247, en vez de los US$355 que costarían sueltas. Son US$108 menos, alrededor de un 30 %.

Y ahora lo que te conviene saber antes de decidir, con el cálculo hecho: si compras la Guía de la Espera y más adelante una sola guía más, gastas US$154 — menos que la Colección. La Colección conviene si crees que vas a usar cuatro o cinco etapas. Si todavía no lo sabes, empieza por la Espera: es lo que te sirve ahora.

Las dos tienen 30 días de garantía. Si la abres y no es lo que esperabas, me escribes y te devuelvo el dinero, sin pedirte explicaciones.

¿Dudas? Responde este correo. Lo leo yo. — Rudy$b$,
        'cta_text', $c$Ver la Guía de la Espera$c$,
        'cta_url', 'https://universmind.com/guia/embarazo?utm_source=correo&utm_medium=nurture&utm_campaign=espera&utm_content=dia14-guia',
        'cta2_text', $c$Prefiero ver la Colección completa$c$,
        'cta2_url', 'https://universmind.com/coleccion?utm_source=correo&utm_medium=nurture&utm_campaign=espera&utm_content=dia14-coleccion'
      ),

      -- ── Correo 6 · Día 21 · Cierre ──
      jsonb_build_object(
        'day', 21, 'delay_hours', 168, 'channel', 'email',
        'nota_interna', 'Espera 6/6 — cierre. Ultimo correo de la serie; se dice explicitamente.',
        'template_type', 'offer', 'template_name', 'crm-universmind-little-nurture',
        'subject', $s$Antes de que nazca$s$,
        'body', $b${{name}}, este es el último correo de esta serie sobre la Guía de la Espera. No te insisto más con ella.

El embarazo tiene fecha de término. No es una oferta que se acaba: es que las semanas que quedan se van a usar en algo. Se pueden usar leyendo foros a las tres de la mañana, o se pueden usar sabiendo qué pasa esta semana y qué hacer con eso.

Si la Colección te parece mucho, empieza por la Guía de la Espera (US$87) — lo que te sirve ahora, nada más. Con los mismos 30 días de garantía: si no es lo que esperabas, te devuelvo el dinero.

Y si hoy no es el momento de comprar, también está bien. Vas a seguir recibiendo lo que publico, gratis, y no vas a dejar de recibirlo por no haber comprado.

Acuérdate de lo que te dije hace unos días: el requisito no es saberlo todo. Es estar.

Gracias por dejarme acompañarte esta espera. — Rudy$b$,
        'cta_text', $c$Ver la Guía de la Espera$c$,
        'cta_url', 'https://universmind.com/guia/embarazo?utm_source=correo&utm_medium=nurture&utm_campaign=espera&utm_content=dia21-guia'
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
    'Inscribe en la secuencia de la Espera a quien respondio la Brujula estando embarazada. DESACTIVADA hasta que Rudy apruebe el copy Y hasta que la plantilla tenga direccion postal (CASL).'
  );

  RAISE NOTICE 'Secuencia de la Espera creada: %', v_seq_id;
END $$;
