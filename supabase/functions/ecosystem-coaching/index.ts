import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { checkPlanAccess } = await import('../_shared/plan-guard.ts');
    const guard = await checkPlanAccess(req, 'coaching');
    if (!guard.allowed) return guard.response;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const user = { id: guard.userId };

    // Fetch user's ecosystem data
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const oneMonthAgoDate = oneMonthAgo.slice(0, 10);

    const [expenses, income, focus, worries, journal, streaks] = await Promise.all([
      supabase.from("expenses").select("amount, category, date")
        .eq("user_id", user.id).is("deleted_at", null)
        .gte("date", oneMonthAgoDate),
      supabase.from("income").select("amount")
        .eq("user_id", user.id).is("deleted_at", null)
        .gte("date", oneMonthAgoDate),
      supabase.from("financial_focus_sessions").select("duration_minutes")
        .eq("user_id", user.id).gte("created_at", oneMonthAgo),
      supabase.from("financial_worry_entries").select("worry_category")
        .eq("user_id", user.id).gte("created_at", oneMonthAgo),
      supabase.from("financial_journal").select("content, entry_type")
        .eq("user_id", user.id).gte("created_at", oneMonthAgo).limit(5),
      supabase.from("ecosystem_streaks").select("*")
        .eq("user_id", user.id).maybeSingle(),
    ]);

    const totalExpenses = (expenses.data || []).reduce((a: number, e: any) => a + (e.amount || 0), 0);
    const totalIncome = (income.data || []).reduce((a: number, i: any) => a + (i.amount || 0), 0);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0;
    const focusMinutes = (focus.data || []).reduce((a: number, s: any) => a + (s.duration_minutes || 0), 0);
    const worryCount = (worries.data || []).length;

    // Top categories
    const catMap: Record<string, number> = {};
    for (const e of (expenses.data || [])) {
      const cat = e.category || "other";
      catMap[cat] = (catMap[cat] || 0) + (e.amount || 0);
    }
    const topCategories = Object.entries(catMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat, amount]) => `${cat}: $${amount.toFixed(0)}`);

    const { language } = await req.json().catch(() => ({ language: "es" }));
    const isEs = language === "es";

    const prompt = isEs
      ? `Eres un coach financiero personal del ecosistema Evo (EvoFinz + Fokuspark). Analiza estos datos del último mes del usuario y da 2-3 consejos personalizados, concretos y accionables. Sé breve y directo.

Datos:
- Ingresos: $${totalIncome.toFixed(0)}
- Gastos: $${totalExpenses.toFixed(0)}  
- Tasa de ahorro: ${savingsRate.toFixed(1)}%
- Top categorías: ${topCategories.join(", ")}
- Minutos de enfoque: ${focusMinutes}
- Entradas de preocupación: ${worryCount}
- Racha actual: ${streaks.data?.current_streak || 0} días
- Entradas de diario: ${(journal.data || []).length}

Responde SOLO en JSON con este formato exacto:
{"insights": [{"emoji": "🎯", "title": "título corto", "advice": "consejo de 1-2 líneas"}]}`
      : `You are a personal financial coach from the Evo Ecosystem (EvoFinz + Fokuspark). Analyze this user's last month data and give 2-3 personalized, concrete, actionable tips. Be brief and direct.

Data:
- Income: $${totalIncome.toFixed(0)}
- Expenses: $${totalExpenses.toFixed(0)}
- Savings rate: ${savingsRate.toFixed(1)}%
- Top categories: ${topCategories.join(", ")}
- Focus minutes: ${focusMinutes}
- Worry entries: ${worryCount}
- Current streak: ${streaks.data?.current_streak || 0} days
- Journal entries: ${(journal.data || []).length}

Respond ONLY in JSON with this exact format:
{"insights": [{"emoji": "🎯", "title": "short title", "advice": "1-2 line advice"}]}`;

    // Call Gemini via Lovable AI proxy
    const geminiResponse = await fetch("https://lovable.dev/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY") || ""}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!geminiResponse.ok) {
      // Fallback: return rule-based insights
      const fallbackInsights = [];
      if (savingsRate < 15) {
        fallbackInsights.push({
          emoji: "💰",
          title: isEs ? "Mejora tu ahorro" : "Improve savings",
          advice: isEs
            ? `Tu tasa de ahorro es ${savingsRate.toFixed(0)}%. Intenta reducir tu categoría más alta.`
            : `Your savings rate is ${savingsRate.toFixed(0)}%. Try reducing your top category.`,
        });
      }
      if (focusMinutes < 30) {
        fallbackInsights.push({
          emoji: "⏱️",
          title: isEs ? "Más enfoque" : "More focus",
          advice: isEs
            ? "Solo tuviste " + focusMinutes + " min de enfoque. Las sesiones ayudan a tomar mejores decisiones."
            : "Only " + focusMinutes + " min focus. Sessions help make better decisions.",
        });
      }
      if (fallbackInsights.length === 0) {
        fallbackInsights.push({
          emoji: "✅",
          title: isEs ? "Buen mes" : "Good month",
          advice: isEs ? "Tus métricas se ven bien. ¡Sigue así!" : "Your metrics look good. Keep it up!",
        });
      }
      return new Response(JSON.stringify({ insights: fallbackInsights, source: "rules" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await geminiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content || aiResult.text || "";

    // Parse JSON from response
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { insights: [] };
    } catch {
      parsed = { insights: [{ emoji: "🤖", title: isEs ? "Análisis listo" : "Analysis ready", advice: content.slice(0, 200) }] };
    }

    return new Response(JSON.stringify({ ...parsed, source: "ai" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
