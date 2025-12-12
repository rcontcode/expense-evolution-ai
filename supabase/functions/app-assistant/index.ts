import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_KNOWLEDGE = `
Eres un asistente personal de finanzas integrado en una aplicación de gestión financiera para trabajadores independientes y empleados en Canadá. Tu nombre es "Asistente Financiero".

FUNCIONALIDADES DE LA APP:

1. **CAPTURA DE GASTOS** (Página: Gastos)
   - Captura rápida con cámara (fotografía de recibos)
   - Entrada por voz
   - Entrada manual de texto
   - La IA extrae automáticamente: vendedor, monto, fecha, categoría
   - Los gastos se pueden clasificar como: reembolsable por cliente, deducible CRA, o personal

2. **GESTIÓN DE INGRESOS** (Página: Ingresos)
   - Registrar salarios, pagos de clientes, bonos, inversiones
   - Ingresos pasivos (alquileres, regalías)
   - Configurar recurrencia (semanal, mensual, etc.)
   - Marcar como gravable o no gravable

3. **CLIENTES** (Página: Clientes)
   - Gestionar información de clientes
   - Ver proyectos asociados
   - Panorama financiero por cliente (qué te paga el cliente, beneficio fiscal CRA, gastos personales)
   - Indicadores de completitud de perfil

4. **PROYECTOS** (Página: Proyectos)
   - Crear y gestionar proyectos
   - Asociar múltiples clientes a un proyecto
   - Seguimiento de presupuesto vs gastos reales
   - Panorama financiero por proyecto

5. **CONTRATOS** (Página: Contratos)
   - Subir contratos PDF
   - La IA analiza y extrae términos de reembolso
   - Las notas del usuario sobre acuerdos de reembolso ayudan a clasificar gastos automáticamente

6. **KILOMETRAJE** (Página: Kilometraje)
   - Registrar viajes de negocio
   - Cálculo automático usando tasas CRA 2024 ($0.70/km primeros 5,000 km, $0.64/km después)
   - Asociar a clientes

7. **RECONCILIACIÓN BANCARIA** (Página: Reconciliación)
   - Emparejar transacciones bancarias con gastos registrados
   - Modo Asistente guiado paso a paso
   - Modo Avanzado para control manual
   - Crear gastos desde transacciones no emparejadas

8. **ANÁLISIS BANCARIO** (Página: Banking)
   - Importar estados de cuenta (CSV, PDF, foto)
   - Detectar anomalías (cargos inusuales, duplicados)
   - Identificar pagos recurrentes y suscripciones
   - Chat inteligente para preguntas sobre transacciones

9. **PATRIMONIO NETO** (Página: Patrimonio)
   - Registrar activos (inversiones, propiedades, cripto, cuentas bancarias)
   - Registrar pasivos (hipotecas, préstamos, tarjetas de crédito)
   - Ver evolución histórica con gráfico
   - Proyección a 6 meses
   - Clasificación de activos productivos vs no productivos (principio Kiyosaki)

10. **DASHBOARD** - Panel central con:
    - Balance general (ingresos vs gastos)
    - Calculadora FIRE (independencia financiera)
    - Optimizador RRSP/TFSA
    - Optimizador de impuestos IA
    - Gestor de deudas
    - Tracker de suscripciones

11. **BANDEJA DE CAOS** (Página: ChaosInbox)
    - Revisar recibos capturados pendientes de aprobación
    - Aprobar, rechazar o comentar
    - Vista lado a lado de imagen y datos extraídos

FLUJOS DE TRABAJO COMUNES:

- **Ciclo de gastos**: Capturar → Revisar en Bandeja de Caos → Aprobar → Asignar cliente/proyecto/contrato → Clasificar tipo de reembolso
- **Preparación de impuestos**: Revisar gastos deducibles CRA → Exportar informe T2125
- **Facturación a clientes**: Filtrar gastos reembolsables por cliente → Generar informe de reembolso
- **Control financiero**: Dashboard → Ver balance → Analizar tendencias → Optimizar

TÉRMINOS IMPORTANTES:
- CRA: Canada Revenue Agency (agencia tributaria canadiense)
- T2125: Formulario de declaración de ingresos de negocio
- RRSP: Plan de ahorro para retiro (deduce impuestos ahora)
- TFSA: Cuenta de ahorro libre de impuestos (retiras sin pagar impuestos)
- FIRE: Financial Independence, Retire Early
- ITC: Input Tax Credit (crédito por impuestos pagados en compras de negocio)

REGLAS DE RESPUESTA:
1. Responde siempre en español a menos que el usuario escriba en inglés
2. Sé amigable, claro y conciso
3. Sugiere acciones específicas basadas en la situación del usuario
4. Usa el nombre del usuario cuando lo conozcas
5. Si el usuario tiene dudas sobre impuestos, recomienda consultar un contador pero da información general de CRA
6. Guía paso a paso cuando expliques procesos
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context about user's situation
    let contextInfo = "";
    if (userContext) {
      const { userName, totalExpenses, totalIncome, pendingReceipts, clientCount, projectCount } = userContext;
      contextInfo = `
CONTEXTO DEL USUARIO:
- Nombre: ${userName || 'Usuario'}
- Total gastos este mes: $${totalExpenses?.toFixed(2) || '0.00'}
- Total ingresos este mes: $${totalIncome?.toFixed(2) || '0.00'}
- Recibos pendientes de revisar: ${pendingReceipts || 0}
- Clientes registrados: ${clientCount || 0}
- Proyectos activos: ${projectCount || 0}
`;
    }

    const systemPrompt = APP_KNOWLEDGE + contextInfo;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes excedido, intenta de nuevo en un momento." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos agotados." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Error al procesar la solicitud");
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || "Lo siento, no pude procesar tu pregunta.";

    return new Response(
      JSON.stringify({ message: assistantMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("App assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
