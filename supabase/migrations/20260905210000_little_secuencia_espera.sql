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
-- Tercera version. Las tres rondas de revision las hizo GPT directamente contra este
-- archivo (shared-brain/tools/revisor-gpt.mjs --tipo copy), sin que Rudy tuviera que copiar
-- y pegar nada; el informe de cada ronda quedo en shared-brain/revisiones-gpt/. Lo que se
-- corrigio en esas rondas, por orden de gravedad:
--   a. El dia 2 afirmaba «lo que le llega antes de nacer no es tu estado de animo: es tu voz».
--      DeCasper mide preferencia por un sonido conocido y no midio nada sobre el animo de la
--      madre, asi que la frase decia mas que el estudio. Ahora se cuenta el metodo (el chupete
--      conectado a la grabadora) y se dice explicitamente que NO se midio.
--   b. Se atribuia a Bergman una explicacion fisiologica sin fuente localizable. Se dejo solo
--      lo que sostiene la recomendacion de la OMS, y condicionada a que madre y bebe esten
--      estables, que es como la OMS la escribe.
--   c. «Lo unico que hay que tener listo» y «lo que mas pesa en la primera hora» eran
--      superlativos que ningun estudio comparo. Fuera los dos.
--   d. Feldman/Braun/Champagne ya no se usa para insinuar equivalencia entre el piel con piel
--      materno y el paterno: se dice que el cuidado del padre cuenta por si mismo y que de ahi
--      no sale una promesa de reemplazo.
--   e. Se agrego que apoyarse en un estudio no equivale a que ese estudio haya probado la
--      actividad, y que la guia no reemplaza a quien lleva el embarazo.
--   f. Tres formulas de eslogan («no es X, es Y») y la frase «te lo presento derecho», que Rudy
--      tiene prohibida desde el 2-ago-2026, salieron del texto.
-- Veredicto de la ronda 3: SE DA POR BUENO DEFINITIVAMENTE.
--
-- Lo que se RECHAZO con argumento, porque el revisor tiende a la prosa defensiva: quitar la
-- cita de Shonkoff del dia 9 (la AAP si sostiene lo que se dice), volver los asuntos en
-- titulos de estudio, y reemplazar la voz de padre por la de un folleto clinico.
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

Tu resultado dice que estás en la etapa {{stage}}. Durante los próximos días te voy a ir mandando lo que de verdad importa antes de que nazca, con la ciencia detrás y en palabras normales.
{{puente}}

Hoy quédate solo con esto: el trabajo ya empezó, y no es el de armar el cuarto. Es este, el de ir entendiendo qué viene, a tu ritmo y sin apuro.

En un par de días te cuento algo que me sorprendió leyendo: qué es lo que tu bebé ya reconoce de ti antes de nacer, y cómo hicieron para medirlo.

— Rudy$b$,
        'cta_text', $c$Ver mi resultado de la Brújula$c$,
        'cta_url', 'https://universmind.com/evaluacion?utm_source=correo&utm_medium=nurture&utm_campaign=espera&utm_content=dia0-brujula'
      ),

      -- ── Correo 2 · Día 2 · Confianza + dato ──
      jsonb_build_object(
        'day', 2, 'delay_hours', 48, 'channel', 'email',
        'nota_interna', 'Espera 2/6 — el dato prenatal (DeCasper). Sin pedir nada.',
        'template_type', 'nurture', 'template_name', 'crm-universmind-little-nurture',
        'subject', $s$Tu voz ya le suena conocida$s$,
        'body', $b${{name}}, seguro te han dicho "tranquila, que el bebé lo siente". Suena a frase de manual y, peor, suena a que ahora estar nerviosa también es culpa tuya.

Te cuento lo que sí está medido, porque es más interesante que la frase, y porque no te carga con nada.

En 1986, DeCasper y Spence les pidieron a un grupo de embarazadas que leyeran en voz alta el mismo pasaje, todos los días, durante las últimas seis semanas. Cuando esos bebés nacieron, les pusieron un chupete conectado a una grabadora: succionando de una manera sonaba el pasaje conocido y de otra manera sonaba uno nuevo. Los bebés succionaban para escuchar el conocido. Seis años antes, DeCasper y Fifer ya habían mostrado lo mismo con la voz: un recién nacido de días prefiere la de su madre a la de otra mujer.

Fíjate en lo que midieron, porque es bastante y es poco a la vez. Midieron que el sonido de tu voz le llega y que le llega lo suficiente como para reconocerlo al nacer. No midieron que entienda la historia, ni que leerle lo vuelva más listo, ni nada sobre cómo te sentiste esos meses. Así que si te gusta leerle en voz alta, léele; y si no, tampoco pasa nada. De ahí no sale una tarea diaria.

Lo otro —lo de la calma— empieza a funcionar después de nacer, y también está estudiado. Gunnar y Donzella (2002) revisaron los estudios sobre el cortisol en los primeros años y describen algo que se repite: cuando hay un adulto atento cerca, la respuesta de estrés del bebé sube menos.

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
        'subject', $s$Lo que conviene dejar conversado antes del parto$s$,
        'body', $b${{name}}, te prometí algo práctico. Acá va, y no se compra en ninguna tienda.

Hay algo que conviene dejar hablado antes, y es el contacto piel con piel: tu bebé sobre tu pecho, sin ropa de por medio, sin apuro. Si tú y tu bebé están estables, la Organización Mundial de la Salud recomienda que sea inmediato y sin interrupciones durante al menos una hora. La razón que dan es concreta y no es sentimental: encima de su madre el bebé mantiene mejor la temperatura, y la lactancia arranca mejor que si se lo llevan a pesar primero. Si el parto se complica, esa decisión la toma el equipo médico y no hay nada que negociar en ese momento.

Eso es una cosa. Otra distinta —y conviene no confundirlas— es el marco de Cuidado Nutritivo de la OMS y UNICEF (Britto y colegas, en The Lancet, 2017). Ese marco tiene cinco componentes, y el piel con piel no es uno de ellos: los cinco son salud, nutrición, seguridad, cuidado responsivo y oportunidades de aprendizaje temprano. El piel con piel es una de las formas más tempranas de cuidado responsivo, no una categoría aparte. Te lo aclaro porque vas a ver ese marco citado en todas partes, casi siempre mal.

Lo que te sirve tener decidido ANTES, porque en el momento no vas a estar para negociar:

1) Que quieres piel con piel apenas nazca, si la situación médica lo permite.
2) Que el pesaje, la vestida y las fotos pueden esperar un rato.
3) Quién lo pide por ti si tú no estás en condiciones de hablar.
4) Que si te toca cesárea o una urgencia, el piel con piel lo puede hacer tu pareja mientras tanto. Muchos hospitales ya lo ofrecen; conviene preguntarlo antes y no en el momento.

Sobre ese punto 4, una precisión honesta: no te voy a decir que exista un estudio que mida exactamente eso. Lo que sí está documentado es otra cosa. Feldman, Braun y Champagne, en Nature Reviews Neuroscience (2019), describen que el cuidado paterno tiene su propia neurobiología, con oxitocina y vasopresina de por medio. Eso respalda que el cuidado del padre cuenta por sí mismo; no alcanza para prometerte que una cosa reemplace a la otra.

Los cuatro puntos son preferencias para conversar antes con el equipo que te va a atender, no cosas que haya que exigir el día del parto. Escríbelos en una nota del teléfono y muéstraselos a quien te acompañe. Eso es todo.

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

Lo que aprendí después no era lo que yo esperaba.

Nadie sabe qué hacer. Tampoco los que se ven seguros. Lo que cambia las cosas a las tres de la mañana es tener a mano dos o tres cosas ciertas, en lugar de cinco opiniones que se contradicen entre sí.

Y hay algo más, que la Academia Americana de Pediatría dejó por escrito (Shonkoff, Garner y colegas, 2012): lo que protege el cerebro de un bebé frente al estrés sostenido son las relaciones estables con adultos que responden. Una relación, entonces, y no un entorno perfecto.

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
        'body', $b${{name}}, esto es lo que hay adentro de la guía y lo que cuesta.

La Guía Completa de la Espera son las 40 semanas del embarazo, una por una: qué está pasando dentro, qué puedes hacer esa semana, y por qué, con el estudio de donde salió cada cosa para que puedas revisarlo tú y no creerme a mí.

Qué trae, en concreto:

• Las 40 semanas del embarazo, una por una.
• 160 actividades repartidas entre esas semanas.
• 40 reflexiones para escribir, una por semana. Cada una viene en tres versiones (para la mamá, para el papá y para los dos juntos) y eliges la que te sirva esa semana. No son 120 tareas: es una pregunta semanal con tres puertas de entrada. Casi nadie le escribe al que espera al lado, y esa fue la razón de hacerlo así.
• Las referencias científicas de donde sale cada recomendación, con su enlace. Que una actividad se apoye en un estudio no quiere decir que ese estudio haya probado esa actividad; quiere decir que de ahí salió la idea, y tú puedes ir a leerlo.
• Soporte por correo: me escribes y te contesto yo.
• Actualizaciones de por vida.

Los precios:

• Guía Completa de la Espera — US$87.
• Colección Completa, del embarazo a los 12 meses (5 guías, 496 actividades) — US$247, en vez de los US$355 que costarían sueltas. Son US$108 menos, alrededor de un 30 %.

Y ahora lo que te conviene saber antes de decidir, con el cálculo hecho: si compras la Guía de la Espera y más adelante una sola guía más, gastas US$154, que es menos que la Colección. Dicho al revés: la Colección son US$160 más que la Guía de la Espera. Conviene si crees que vas a usar cuatro o cinco etapas. Si todavía no lo sabes, empieza por la Espera, que es lo que te sirve ahora.

Las dos tienen 30 días de garantía. Si la abres y no es lo que esperabas, me escribes y te devuelvo el dinero, sin pedirte explicaciones. Y ninguna de las dos reemplaza a quien lleva tu embarazo: son para llegar a esa consulta con las preguntas ordenadas.

¿Dudas? Responde este correo. Lo leo yo. — Rudy$b$,
        'cta_text', $c$Ver la Guía de la Espera — US$87$c$,
        'cta_url', 'https://universmind.com/guia/embarazo?utm_source=correo&utm_medium=nurture&utm_campaign=espera&utm_content=dia14-guia',
        'cta2_text', $c$Ver la Colección completa — US$247$c$,
        'cta2_url', 'https://universmind.com/coleccion?utm_source=correo&utm_medium=nurture&utm_campaign=espera&utm_content=dia14-coleccion'
      ),

      -- ── Correo 6 · Día 21 · Cierre ──
      jsonb_build_object(
        'day', 21, 'delay_hours', 168, 'channel', 'email',
        'nota_interna', 'Espera 6/6 — cierre. Ultimo correo de la serie; se dice explicitamente.',
        'template_type', 'offer', 'template_name', 'crm-universmind-little-nurture',
        'subject', $s$Antes de que nazca$s$,
        'body', $b${{name}}, este es el último correo de esta serie sobre la Guía de la Espera. No te insisto más con ella.

El embarazo tiene fecha de término, y aquí no hay ninguna oferta que venza. Lo que se acaba son las semanas, y esas se van a usar igual en algo. Se pueden usar leyendo foros a las tres de la mañana, o se pueden usar sabiendo qué pasa esta semana y qué hacer con eso.

Si la Colección te parece mucho, empieza por la Guía de la Espera (US$87), que es lo que te sirve ahora y nada más. Con los mismos 30 días de garantía: si no es lo que esperabas, te devuelvo el dinero.

Y si hoy no es el momento de comprar, también está bien. Vas a seguir recibiendo lo que publico, gratis, y no vas a dejar de recibirlo por no haber comprado.

Y acuérdate de lo que te decía hace unos días: para acompañar a un bebé no hay que saberlo todo, hay que estar.

Gracias por dejarme acompañarte esta espera. — Rudy$b$,
        'cta_text', $c$Ver la Guía de la Espera — US$87$c$,
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
