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
        'body', $b${{name}}, cuando esperábamos al primero yo tenía la cabeza llena de listas de cosas que comprar y ninguna respuesta a la única pregunta que de verdad me quitaba el sueño: ¿y yo qué hago cuando esté acá?

Soy Rudy, papá de dos e ingeniero. Así que hice lo que mejor sé hacer: en vez de juntar opiniones me fui a leer los estudios, y anoté qué decía cada uno y hasta dónde llegaba. De ahí nació Universmind Little, y también la Brújula.

En los tres correos que siguen te cuento qué se pudo medir de lo que un bebé reconoce al nacer, qué conviene dejar conversado para la primera hora después del parto, y qué me sirvió a mí contra el miedo a no saber qué hacer. Después te ofrezco la guía que hice.
{{puente}}

Para prepararte no hace falta tener el cuarto armado. Alcanza con ir entendiendo qué viene, a tu ritmo y cuando quieras.

En un par de días te cuento algo que me sorprendió leyendo: cómo hicieron para saber que un recién nacido reconoce algo que oyó antes de nacer.

— Rudy$b$,
        'cta_text', $c$Ver mi resultado de la Brújula$c$,
        'cta_url', 'https://universmind.com/evaluacion?utm_source=correo&utm_medium=nurture&utm_campaign=espera&utm_content=dia0-brujula'
      ),

      -- ── Correo 2 · Día 2 · Confianza + dato ──
      jsonb_build_object(
        'day', 2, 'delay_hours', 48, 'channel', 'email',
        'nota_interna', 'Espera 2/6 — el dato prenatal (DeCasper). Sin pedir nada.',
        'template_type', 'nurture', 'template_name', 'crm-universmind-little-nurture',
        'subject', $s$Lo que midieron con un chupete y una grabadora$s$,
        'body', $b${{name}}, hay una frase que circula mucho en el embarazo: "tranquila, que el bebé lo siente". Suena a frase de manual y, peor, suena a que ahora estar nerviosa también es culpa tuya.

En 1986, DeCasper y Spence les pidieron a un grupo de embarazadas que leyeran en voz alta el mismo pasaje, todos los días, durante las últimas seis semanas. Cuando esos bebés nacieron, les pusieron un chupete conectado a una grabadora: succionando de una manera sonaba el pasaje conocido y de otra manera sonaba uno nuevo. Los bebés succionaban para escuchar el conocido.

Lo que se midió ahí fue una preferencia después de nacer, no lo que pasaba adentro: el estudio no dice cómo llega el sonido ni qué fue exactamente lo que retuvieron. Seis años antes, DeCasper y Fifer habían medido otra cosa: un recién nacido de días prefiere la voz de su madre a la de otra mujer. Ese estudio no midió nada del embarazo. Ninguno de los dos midió que entienda la historia, ni que leerle lo vuelva más listo. Así que si te gusta leerle en voz alta, léele. Lo que no puedo decirte es qué pasa si no lo haces, porque eso tampoco lo midieron. De ahí no sale una tarea diaria.

Sobre la calma, que era de lo que hablaba esa frase, hay otra cosa medida, esta vez después del nacimiento. Gunnar y Donzella (2002) no hicieron un experimento: juntaron lo que se había estudiado del cortisol en los primeros años y lo ordenaron, y los resultados no apuntan todos al mismo lado. De ahí sacan que la presencia de un adulto que responde amortigua la subida de cortisol en varias situaciones, y avisan que eso cambia con la edad, con el temperamento del niño y con el vínculo que ya tengan. Lo que se midió fue cortisol, no el estrés entero.

Eso no dice que tengas que estar serena todo el tiempo; nadie lo está. Lo que yo saco de ahí, y esto ya es mío y no del estudio, es que alterarse forma parte del asunto y que no hay que tenerlo resuelto antes de que nazca. Y con un recién nacido delante, eso se practica bastante.

En el próximo correo te cuento algo concreto que conviene dejar conversado con tu equipo antes del parto.

— Rudy$b$,
        'cta_text', '', 'cta_url', ''
      ),

      -- ── Correo 3 · Día 5 · Valor puro ──
      jsonb_build_object(
        'day', 5, 'delay_hours', 72, 'channel', 'email',
        'nota_interna', 'Espera 3/6 — la lista de la primera hora. Valor puro, sin venta.',
        'template_type', 'nurture', 'template_name', 'crm-universmind-little-nurture',
        'subject', $s$Lo que conviene dejar conversado antes del parto$s$,
        'body', $b${{name}}, el contacto piel con piel es esto: tu bebé sobre tu pecho apenas nace, sin ropa de por medio y sin apuro. Conviene dejarlo conversado antes. Si tú y tu bebé están estables, la Organización Mundial de la Salud recomienda que empiece lo antes posible después del nacimiento y sin interrupciones; está en su guía de 2017 sobre lactancia en maternidades, que añade aparte que lo ideal es que dure más de una hora. Esa recomendación se apoya en la revisión Cochrane de Moore y colegas sobre contacto piel con piel inmediato o temprano, que compara hacerlo contra la atención habitual de cada hospital, que no es la misma en todas partes. Ahí el grupo del piel con piel sale mejor en los resultados de lactancia. La temperatura también sube algo, pero la diferencia es pequeña. Y si aparece una urgencia, esa parte la resuelve el equipo médico ahí mismo, lo que no borra lo que dejaste conversado ni te impide preguntar cuando se pueda.

Estas cuatro son preferencias, no requisitos, y solo sirven si son las tuyas. Quédate con las que quieras y descarta el resto; tenerlo escrito antes ahorra explicarlo el mismo día:

1) Que quieres piel con piel apenas nazca, si la situación médica lo permite.
2) Que pesarlo, vestirlo y las fotos pueden esperar un rato.
3) Quién dice todo esto por ti si tú no puedes hablar en ese momento.
4) Que si te toca cesárea, quieres piel con piel contigo igual, en el quirófano, si el estado de ambos lo permite; y que si no se puede, lo haga quien te acompañe mientras tanto. Eso depende del protocolo de cada hospital, así que conviene preguntar antes las dos cosas.

Sobre ese punto 4 hay una medición directa. Erlandsson y colegas (2007) siguieron a 29 bebés nacidos por cesárea programada: unos pasaron las primeras horas piel con piel con el padre y otros en una cuna al lado. Los que estuvieron con el padre lloraron menos, se calmaron antes y llegaron antes a un estado de somnolencia. Son 29 bebés, son cesáreas programadas y no urgencias, y el estudio no compara al padre con la madre. Sirve para conversarlo con tu equipo, no para prometerte que da lo mismo.

Se conversan antes con el equipo que te va a atender; no son cosas para exigir el día del parto. Escríbelos en una nota del teléfono. Si vas acompañada, muéstraselos antes a esa persona. Y si vas sola, déjalos conversados con tu matrona o con el equipo en alguna consulta previa, que para eso están esas consultas.

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

Yo no lo supe. Y con el segundo tampoco lo supe del todo, aunque ya había pasado una vez por ahí. Lo que me cambió las cosas fue tener a mano dos o tres cosas medidas de verdad, como la del chupete y la grabadora que te conté el otro día, y saber también hasta dónde llegaban. Con eso a las tres de la mañana uno hace menos cosas por puro miedo.

Y hay algo más, que la Academia Americana de Pediatría dejó por escrito (Shonkoff, Garner y colegas, 2012): entre lo que amortigua la respuesta de estrés tóxico en los primeros años están las relaciones estables con adultos que responden a lo que le pasa. Amortiguar no es borrar, y no es lo único que cuenta. Estrés tóxico ahí no describe una circunstancia sino una reacción, la de un organismo con los sistemas de estrés encendidos fuerte o mucho tiempo y sin apoyos alrededor que lo amortigüen. No son los nervios de una madre primeriza que no sabe qué hacer. La palabra que hace el trabajo ahí es "responden": darte cuenta de que algo le pasa y hacer algo con eso, una y otra vez, aunque no siempre aciertes qué era.

Eso no dice que tú sola tengas que compensar todo lo que venga. Hay circunstancias que no se compensan con buena voluntad, y no sería justo cargártelas.

Lo que ordené en la Guía Completa de la Espera es algo mucho más terrenal: las 40 semanas, una por una, con lo que ocurre en cada una y de dónde salió cada cosa, para no tener que ir armando el mapa sobre la marcha.

La semana que viene te la muestro como se debe, con precio y todo.

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

La Guía Completa de la Espera son las 40 semanas del embarazo, una por una: qué está pasando dentro, qué puedes hacer esa semana, y de dónde salió cada idea, con la referencia y el enlace de cada estudio. Algunos abren completos y otros solo el resumen, porque hay revistas que cobran.

Qué trae, en concreto:

• Las 40 semanas del embarazo, una por una.
• 160 actividades repartidas entre esas semanas.
• Una reflexión para escribir cada semana, en tres versiones (para la mamá, para el papá y para los dos juntos) y eliges la que te sirva esa semana. No son 120 tareas: es una pregunta por semana, y eliges con cuál de las tres entrar. A mí me faltó eso cuando esperábamos, y por eso lo hice así.
• Las referencias científicas de donde salió cada idea, con su enlace. Que una actividad se apoye en un estudio no quiere decir que ese estudio haya probado esa actividad; quiere decir que de ahí salió la idea, y tú puedes ir a leerlo.
• Soporte por correo: me escribes y te contesto yo.
• Actualizaciones incluidas: cuando corrijo o amplío una semana, te llega la versión nueva sin pagar de nuevo.

Los precios:

• Guía Completa de la Espera — US$87.
• Cada una de las cuatro guías posteriores (0-3, 3-6, 6-9 y 9-12 meses) — US$67.
• Colección Completa, las cinco juntas — US$247, en vez de los US$355 que costarían sueltas.

Empezando por la Espera: con una guía más son US$154; con dos más, US$221; con tres más, US$288. Ahí la Colección, que son US$247, ya te sale menos. Así que por precio la Colección conviene si crees que vas a usar cuatro o cinco etapas, y no antes. Y si empiezas por la Espera y más adelante quieres la Colección, la Colección se paga entera aparte, o sea US$334 en total. Si todavía no sabes cuántas etapas vas a usar, empieza por la Espera contando con eso.

Cómo funciona la compra, para que no haya sorpresas: lo que te ofrezco aquí es un pago único y no una suscripción; la guía no se descarga como archivo, se abre dentro de la app y ahí se va actualizando; y el acceso no vence. Los 30 días de garantía corren desde el día que pagas, no desde que la abres: escribes a soporte@universmind.com dentro de ese plazo y te devuelvo el 100%, sin pedirte explicaciones.

Una cosa más, que vale para las dos: no reemplazan a quien lleva tu embarazo, ni al pediatra después. Sirven para llegar a esas consultas con las preguntas ordenadas.

Y si tu bebé ya nació, dímelo respondiendo aquí: esta guía es para antes, y te sirve otra.

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

Y antes que nada: si tu bebé ya nació en estas semanas, respóndeme y te cambio lo que te mando. También puedes volver a responder la Brújula y el cambio se hace solo.

La guía viene ordenada semana por semana y con las fuentes a la vista, así que te ahorra la parte de buscar.

Si la Colección te parece mucho, empieza por la Guía de la Espera (US$87), que es la que cubre las semanas que tienes por delante. Y como te decía, si más adelante quieres la Colección, esa se paga entera aparte: los US$87 no se descuentan y el total te quedaría en US$334. Con los mismos 30 días de garantía: si no es lo que esperabas, te devuelvo el dinero.

Y si lo que pesa es poner US$87 de una vez, hay otra puerta: la app cobra las cinco guías también por suscripción, US$14,99 al mes, y se cancela cuando quieras. Empiezas hoy con poco y entras a las cinco, la de la Espera incluida. Tiene su costo: mientras la pagas tienes acceso, y si la cortas lo pierdes. Y pasados unos dieciséis meses habrás pagado más que los US$247 de la Colección sin quedarte con nada. Conviene si quieres probar; no si ya sabes que la vas a usar los dos años.

Y si hoy no es el momento de comprar, también está bien: vas a seguir recibiendo lo que publico, gratis.

Y acuérdate de lo que te decía hace unos días: para acompañar a tu bebé no vas a necesitar saberlo todo.

Y si un día de estos te toca la duda de las tres de la mañana, respóndeme este correo aunque no hayas comprado nada. Lo leo yo. — Rudy$b$,
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
      {"field":"situation","operator":"in","value":["Esperando bebé","Embarazada","Pregnant"]},
      {"field":"metadata.rol","operator":"in","value":["Mamá","Mom"]}]'::jsonb,
    'email_sequence',
    jsonb_build_object('sequence_id', v_seq_id),
    0,
    false,
    'Inscribe en la secuencia de la Espera a quien respondio la Brujula estando embarazada. Pide rol Mama/Mom a proposito: el texto le habla a la persona embarazada (cesarea, matrona, quien lleva tu embarazo), asi que un papa o cuidador que elija "Esperando bebe" NO entra aqui y necesita su propia secuencia. DESACTIVADA hasta que Rudy apruebe el copy Y hasta que la plantilla tenga direccion postal (CASL).'
  );

  RAISE NOTICE 'Secuencia de la Espera creada: %', v_seq_id;
END $$;
