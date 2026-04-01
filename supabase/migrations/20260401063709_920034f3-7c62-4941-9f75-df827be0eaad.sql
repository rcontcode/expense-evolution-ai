
INSERT INTO public.lead_message_templates (name, content, message_type, template_type, target_app, language, is_auto)
VALUES
-- EvoFinz Email Follow-up
('EvoFinz - Follow-up Email', 'Hola {{name}},

Vi que completaste el diagnóstico financiero de EvoFinz y obtuviste un resultado interesante. Me gustaría saber si pudiste revisar tu perfil financiero y si tienes alguna pregunta.

EvoFinz puede ayudarte a organizar tus gastos, contratos e ingresos de forma inteligente con IA.

¿Te gustaría que te muestre cómo sacarle el máximo provecho?

Saludos,
El equipo de EvoFinz 💰', 'email', 'follow_up', 'evofinz', 'es', false),

-- EvoFinz Email Reactivation
('EvoFinz - Reactivación Email', 'Hola {{name}},

Ha pasado un tiempo desde que visitaste EvoFinz. Hemos agregado nuevas funciones que podrían interesarte:

✅ OCR inteligente para escanear recibos
✅ Análisis de contratos con IA
✅ Dashboard de salud financiera

¿Quieres darle otra oportunidad? Tu cuenta sigue activa y lista para ti.

Saludos,
El equipo de EvoFinz 💰', 'email', 'reactivation', 'evofinz', 'es', false),

-- EvoFinz Email Offer
('EvoFinz - Oferta Email', 'Hola {{name}},

Tenemos una oferta especial para ti: accede al plan Premium de EvoFinz con un descuento exclusivo.

🎁 Plan Premium con todas las funciones de IA
📊 Sin límite de gastos e ingresos
🤖 Análisis inteligente ilimitado

¿Te interesa? Responde a este correo y te comparto los detalles.

Saludos,
El equipo de EvoFinz 💰', 'email', 'offer', 'evofinz', 'es', false),

-- Fokuspark Email Follow-up
('Fokuspark - Follow-up Email', 'Hola {{name}},

Vi que completaste el test de bienestar de FokusPark. Tu resultado muestra áreas donde podemos ayudarte a mejorar.

FokusPark combina meditación, journaling y hábitos saludables para tu bienestar integral.

¿Te gustaría explorar tu plan personalizado?

Saludos,
El equipo de FokusPark 🧘', 'email', 'follow_up', 'fokuspark', 'es', false),

-- Fokuspark Email Reactivation
('Fokuspark - Reactivación Email', 'Hola {{name}},

Te extrañamos en FokusPark. Desde tu última visita hemos añadido:

🧘 Nuevas meditaciones guiadas
📝 Journaling con IA
🎯 Seguimiento de hábitos mejorado

Tu bienestar es importante. ¿Volvemos a empezar?

Saludos,
El equipo de FokusPark 🧘', 'email', 'reactivation', 'fokuspark', 'es', false),

-- Fokuspark Email Offer
('Fokuspark - Oferta Email', 'Hola {{name}},

Oferta exclusiva para ti: accede al plan Premium de FokusPark.

🎁 Meditaciones ilimitadas
🤖 Coach de IA personalizado
📊 Analytics de bienestar avanzados

¿Quieres saber más? Responde a este correo.

Saludos,
El equipo de FokusPark 🧘', 'email', 'offer', 'fokuspark', 'es', false),

-- UniversMind Email Follow-up
('UniversMind - Follow-up Email', 'Hola {{name}},

Vi que completaste la evaluación de UniversMind. Tu perfil de aprendizaje tiene un gran potencial.

UniversMind te ayuda a organizar tu conocimiento, crear hábitos de lectura y potenciar tu desarrollo personal con IA.

¿Te gustaría que te muestre cómo comenzar?

Saludos,
El equipo de UniversMind 🧠', 'email', 'follow_up', 'universmind', 'es', false),

-- UniversMind Email Reactivation
('UniversMind - Reactivación Email', 'Hola {{name}},

Ha pasado un tiempo desde que usaste UniversMind. Hemos mejorado mucho:

🧠 Nuevo sistema de notas inteligentes
📚 Tracking de lectura con metas diarias
🤖 Resúmenes automáticos con IA

Tu camino de aprendizaje te espera. ¿Volvemos?

Saludos,
El equipo de UniversMind 🧠', 'email', 'reactivation', 'universmind', 'es', false),

-- UniversMind Email Offer
('UniversMind - Oferta Email', 'Hola {{name}},

Tenemos algo especial para ti: accede al plan Premium de UniversMind.

🎁 Funciones de IA ilimitadas
📖 Biblioteca de recursos expandida
🧠 Coach de aprendizaje personalizado

¿Te interesa? Responde y te comparto los detalles.

Saludos,
El equipo de UniversMind 🧠', 'email', 'offer', 'universmind', 'es', false),

-- WhatsApp Reactivation for all 3 apps
('EvoFinz - Reactivación WhatsApp', 'Hola {{name}} 👋

Ha pasado un tiempo desde que usaste EvoFinz. Hemos agregado nuevas funciones de IA que te van a encantar 💰

¿Te gustaría darle otra oportunidad? Tu cuenta sigue activa ✅', 'whatsapp', 'reactivation', 'evofinz', 'es', false),

('Fokuspark - Reactivación WhatsApp', 'Hola {{name}} 👋

Te extrañamos en FokusPark 🧘 Desde tu última visita hemos mejorado las meditaciones y el journaling con IA.

¿Volvemos a tu rutina de bienestar? 🌟', 'whatsapp', 'reactivation', 'fokuspark', 'es', false),

('UniversMind - Reactivación WhatsApp', 'Hola {{name}} 👋

Ha pasado un tiempo desde que usaste UniversMind 🧠 Hemos agregado nuevas herramientas de aprendizaje con IA.

¿Retomamos tu camino de conocimiento? 📚', 'whatsapp', 'reactivation', 'universmind', 'es', false)

ON CONFLICT DO NOTHING;
