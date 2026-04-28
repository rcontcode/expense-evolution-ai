// Demo Studio: seeder/reset/status for admin demo data
// All demo records are tagged with [DEMO] in notes/description for safe cleanup
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEMO_TAG = "[DEMO]";

type Action = "seed" | "reset" | "status";
type Scenario = "maria_profesional" | "carlos_caos" | "constructora_ca";

interface ReqBody {
  action: Action;
  scenario?: Scenario;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// ============== SCENARIO A: María Profesional (Chile, persona natural) ==============
function buildScenarioMaria(userId: string) {
  const expenses = [
    { vendor: "Arriendo Depto", amount: 650000, category: "vivienda", date: daysAgo(30), description: "Arriendo mensual" },
    { vendor: "Jumbo Supermercado", amount: 145320, category: "alimentacion", date: daysAgo(28), description: "Compra semanal" },
    { vendor: "Copec", amount: 52000, category: "transporte", date: daysAgo(25), description: "Bencina" },
    { vendor: "Netflix", amount: 9990, category: "suscripciones", date: daysAgo(22), description: "Plan estandar" },
    { vendor: "Spotify", amount: 5990, category: "suscripciones", date: daysAgo(22), description: "Premium individual" },
    { vendor: "Smart Fit Gym", amount: 24990, category: "salud", date: daysAgo(20), description: "Mensualidad" },
    { vendor: "Lider Express", amount: 38450, category: "alimentacion", date: daysAgo(18), description: "Compras rapidas" },
    { vendor: "Uber", amount: 12300, category: "transporte", date: daysAgo(15), description: "Viaje aeropuerto" },
    { vendor: "Farmacia Cruz Verde", amount: 18760, category: "salud", date: daysAgo(12), description: "Medicamentos" },
    { vendor: "Starbucks", amount: 4890, category: "alimentacion", date: daysAgo(8), description: "Cafe" },
    { vendor: "Ripley", amount: 89990, category: "compras", date: daysAgo(5), description: "Ropa" },
    { vendor: "ENEL Electricidad", amount: 42180, category: "servicios", date: daysAgo(3), description: "Cuenta luz" },
  ];

  const incomes = [
    { source: "Empresa Tech SpA", amount: 2200000, income_type: "salary", date: daysAgo(30), description: "Sueldo mensual" },
    { source: "Empresa Tech SpA", amount: 2200000, income_type: "salary", date: daysAgo(60), description: "Sueldo mensual" },
    { source: "Cliente Freelance A", amount: 450000, income_type: "freelance", date: daysAgo(20), description: "Proyecto diseno web" },
    { source: "Cliente Freelance B", amount: 280000, income_type: "freelance", date: daysAgo(10), description: "Consultoria UX" },
  ];

  const bills = [
    { name: "Netflix", amount: 9990, category: "suscripciones", frequency: "monthly", next_due_date: daysAgo(-7) },
    { name: "Spotify", amount: 5990, category: "suscripciones", frequency: "monthly", next_due_date: daysAgo(-7) },
    { name: "Smart Fit Gym", amount: 24990, category: "salud", frequency: "monthly", next_due_date: daysAgo(-10) },
  ];

  const bankTxns = [
    { transaction_date: daysAgo(30), description: "TRANSFERENCIA SUELDO - EMPRESA TECH SPA", amount: 2200000, transaction_type: "income", bank_name: "Banco de Chile", category: "salary" },
    { transaction_date: daysAgo(30), description: "ARRIENDO DEPTO - INMOB SAN MIGUEL", amount: -650000, transaction_type: "expense", bank_name: "Banco de Chile", category: "vivienda" },
    { transaction_date: daysAgo(28), description: "COMPRA JUMBO SUC PROVIDENCIA", amount: -145320, transaction_type: "expense", bank_name: "Banco de Chile", category: "alimentacion" },
    { transaction_date: daysAgo(25), description: "COMPRA COPEC ESTACION 234", amount: -52000, transaction_type: "expense", bank_name: "Banco de Chile", category: "transporte" },
    { transaction_date: daysAgo(22), description: "PAGO SUSCRIPCION NETFLIX.COM", amount: -9990, transaction_type: "expense", bank_name: "Banco de Chile", category: "suscripciones" },
    { transaction_date: daysAgo(22), description: "PAGO SUSCRIPCION SPOTIFY", amount: -5990, transaction_type: "expense", bank_name: "Banco de Chile", category: "suscripciones" },
    { transaction_date: daysAgo(20), description: "TRANSFERENCIA RECIBIDA - CLIENTE FREELANCE A", amount: 450000, transaction_type: "income", bank_name: "Banco de Chile", category: "freelance" },
    { transaction_date: daysAgo(20), description: "PAGO MENSUALIDAD SMART FIT", amount: -24990, transaction_type: "expense", bank_name: "Banco de Chile", category: "salud" },
    { transaction_date: daysAgo(18), description: "COMPRA LIDER EXPRESS NUNOA", amount: -38450, transaction_type: "expense", bank_name: "Banco de Chile", category: "alimentacion" },
    { transaction_date: daysAgo(15), description: "UBER TRIP CL", amount: -12300, transaction_type: "expense", bank_name: "Banco de Chile", category: "transporte" },
    { transaction_date: daysAgo(12), description: "FARMACIA CRUZ VERDE 145", amount: -18760, transaction_type: "expense", bank_name: "Banco de Chile", category: "salud" },
    { transaction_date: daysAgo(10), description: "TRANSFERENCIA RECIBIDA - CLIENTE B", amount: 280000, transaction_type: "income", bank_name: "Banco de Chile", category: "freelance" },
    { transaction_date: daysAgo(8), description: "STARBUCKS COFFEE PROVIDENCIA", amount: -4890, transaction_type: "expense", bank_name: "Banco de Chile", category: "alimentacion" },
    { transaction_date: daysAgo(5), description: "RIPLEY TIENDA COSTANERA", amount: -89990, transaction_type: "expense", bank_name: "Banco de Chile", category: "compras" },
    { transaction_date: daysAgo(3), description: "PAGO ENEL DISTRIBUCION", amount: -42180, transaction_type: "expense", bank_name: "Banco de Chile", category: "servicios" },
    { transaction_date: daysAgo(60), description: "TRANSFERENCIA SUELDO - EMPRESA TECH SPA", amount: 2200000, transaction_type: "income", bank_name: "Banco de Chile", category: "salary" },
    { transaction_date: daysAgo(60), description: "ARRIENDO DEPTO - INMOB SAN MIGUEL", amount: -650000, transaction_type: "expense", bank_name: "Banco de Chile", category: "vivienda" },
    { transaction_date: daysAgo(52), description: "PAGO SUSCRIPCION NETFLIX.COM", amount: -9990, transaction_type: "expense", bank_name: "Banco de Chile", category: "suscripciones" },
    { transaction_date: daysAgo(52), description: "PAGO SUSCRIPCION SPOTIFY", amount: -5990, transaction_type: "expense", bank_name: "Banco de Chile", category: "suscripciones" },
    { transaction_date: daysAgo(50), description: "PAGO MENSUALIDAD SMART FIT", amount: -24990, transaction_type: "expense", bank_name: "Banco de Chile", category: "salud" },
  ];

  const fiscalEntity = {
    name: "Maria Gonzalez - Persona Natural",
    country: "CL",
    entity_type: "individual",
    tax_regime: "renta_presunta",
    default_currency: "CLP",
    is_active: true,
  };

  return {
    expenses: expenses.map((e) => ({ ...e, user_id: userId, currency: "CLP", notes: `${DEMO_TAG} ${e.description}`, status: "pending" })),
    incomes: incomes.map((i) => ({ ...i, user_id: userId, currency: "CLP", notes: `${DEMO_TAG} ${i.description}`, recurrence: "one_time" })),
    bills: bills.map((b) => ({ ...b, user_id: userId, currency: "CLP", notes: `${DEMO_TAG} factura recurrente`, status: "active", payment_method_type: "card" })),
    bankTxns: bankTxns.map((t) => ({ ...t, user_id: userId, description: `${DEMO_TAG} ${t.description}` })),
    fiscalEntity: { ...fiscalEntity, user_id: userId, notes: `${DEMO_TAG} entidad fiscal demo` },
    mileage: [],
  };
}

// ============== SCENARIO B: Carlos Caos (Chile, desordenado, duplicados) ==============
function buildScenarioCarlos(userId: string) {
  const bankTxns = [
    { transaction_date: daysAgo(5), description: "AMAZON PRIME MEMBERSHIP", amount: -7990, transaction_type: "expense", bank_name: "Santander" },
    { transaction_date: daysAgo(35), description: "AMAZON PRIME MEMBERSHIP", amount: -7990, transaction_type: "expense", bank_name: "Santander" },
    { transaction_date: daysAgo(65), description: "AMAZON PRIME MEMBERSHIP", amount: -7990, transaction_type: "expense", bank_name: "Santander" },
    { transaction_date: daysAgo(7), description: "DISNEY PLUS LATAM", amount: -6390, transaction_type: "expense", bank_name: "Santander" },
    { transaction_date: daysAgo(37), description: "DISNEY PLUS LATAM", amount: -6390, transaction_type: "expense", bank_name: "Santander" },
    { transaction_date: daysAgo(67), description: "DISNEY PLUS LATAM", amount: -6390, transaction_type: "expense", bank_name: "Santander" },
    { transaction_date: daysAgo(10), description: "SUPERMERCADO UNIMARC SUC 45", amount: -67890, transaction_type: "expense", bank_name: "Santander" },
    { transaction_date: daysAgo(10), description: "UNIMARC 45 PROVIDENCIA", amount: -67890, transaction_type: "expense", bank_name: "Santander" },
    { transaction_date: daysAgo(15), description: "UBER EATS DELIVERY", amount: -18500, transaction_type: "expense", bank_name: "Santander" },
    { transaction_date: daysAgo(15), description: "UBER*EATS HELP.UBER.COM", amount: -18500, transaction_type: "expense", bank_name: "Santander" },
    { transaction_date: daysAgo(20), description: "ESTACION SHELL LAS CONDES", amount: -45000, transaction_type: "expense", bank_name: "Santander" },
    { transaction_date: daysAgo(20), description: "SHELL CL LAS CONDES 234", amount: -45000, transaction_type: "expense", bank_name: "Santander" },
    { transaction_date: daysAgo(2), description: "PAGO SERVIPAG", amount: -34500, transaction_type: "expense", bank_name: "Santander" },
    { transaction_date: daysAgo(3), description: "TRANSBANK COMPRA POS", amount: -22300, transaction_type: "expense", bank_name: "Santander" },
    { transaction_date: daysAgo(4), description: "RETIRO CAJERO REDBANC", amount: -100000, transaction_type: "expense", bank_name: "Santander" },
    { transaction_date: daysAgo(6), description: "DEPOSITO TRANSFERENCIA J.PEREZ", amount: 350000, transaction_type: "income", bank_name: "Santander" },
    { transaction_date: daysAgo(8), description: "MERCADOLIBRE COMPRA", amount: -28990, transaction_type: "expense", bank_name: "Santander" },
    { transaction_date: daysAgo(11), description: "PEDIDOSYA APP", amount: -14500, transaction_type: "expense", bank_name: "Santander" },
    { transaction_date: daysAgo(13), description: "TRANSFERENCIA ENVIADA", amount: -75000, transaction_type: "expense", bank_name: "Santander" },
    { transaction_date: daysAgo(14), description: "WALMART CHILE", amount: -52340, transaction_type: "expense", bank_name: "Santander" },
    { transaction_date: daysAgo(17), description: "FALABELLA RETAIL", amount: -119900, transaction_type: "expense", bank_name: "Santander" },
    { transaction_date: daysAgo(19), description: "DOMINOS PIZZA", amount: -16990, transaction_type: "expense", bank_name: "Santander" },
    { transaction_date: daysAgo(21), description: "APPLE.COM/BILL", amount: -2990, transaction_type: "expense", bank_name: "Santander" },
    { transaction_date: daysAgo(23), description: "GOOGLE *YOUTUBE", amount: -5500, transaction_type: "expense", bank_name: "Santander" },
    { transaction_date: daysAgo(26), description: "SODIMAC HOMECENTER", amount: -89500, transaction_type: "expense", bank_name: "Santander" },
    { transaction_date: daysAgo(28), description: "TRANSFERENCIA RECIBIDA M.SOTO", amount: 120000, transaction_type: "income", bank_name: "Santander" },
    { transaction_date: daysAgo(31), description: "PAGO TARJETA CREDITO", amount: -450000, transaction_type: "expense", bank_name: "Santander" },
    { transaction_date: daysAgo(33), description: "STARBUCKS APUMANQUE", amount: -5400, transaction_type: "expense", bank_name: "Santander" },
    { transaction_date: daysAgo(40), description: "FARMACIA SALCOBRAND", amount: -23400, transaction_type: "expense", bank_name: "Santander" },
    { transaction_date: daysAgo(45), description: "DEPOSITO SUELDO", amount: 1850000, transaction_type: "income", bank_name: "Santander" },
  ];

  const expenses = [
    { vendor: "Unimarc", amount: 67890, category: "alimentacion", date: daysAgo(10), description: "Compra mercado" },
    { vendor: "Unimarc 45", amount: 67890, category: "alimentacion", date: daysAgo(10), description: "Mercaderia" },
    { vendor: "Uber Eats", amount: 18500, category: "alimentacion", date: daysAgo(15), description: "Almuerzo" },
    { vendor: "Uber Eats", amount: 18500, category: "alimentacion", date: daysAgo(15), description: "Comida domicilio" },
    { vendor: "Shell", amount: 45000, category: "transporte", date: daysAgo(20), description: "Bencina auto" },
    { vendor: "Shell Las Condes", amount: 45000, category: "transporte", date: daysAgo(20), description: "Combustible" },
    { vendor: "Falabella", amount: 119900, category: "compras", date: daysAgo(17), description: "Compra ropa" },
    { vendor: "Sodimac", amount: 89500, category: "hogar", date: daysAgo(26), description: "Materiales" },
  ];

  return {
    expenses: expenses.map((e) => ({ ...e, user_id: userId, currency: "CLP", notes: `${DEMO_TAG} ${e.description}`, status: "pending" })),
    incomes: [],
    bills: [],
    bankTxns: bankTxns.map((t) => ({ ...t, user_id: userId, description: `${DEMO_TAG} ${t.description}` })),
    fiscalEntity: null,
    mileage: [],
  };
}

// ============== SCENARIO C: Constructora CA (Canada B2B, HST/GST) ==============
function buildScenarioConstructoraCA(userId: string) {
  const expenses = [
    { vendor: "Home Depot Toronto", amount: 1245.67, category: "materials", date: daysAgo(28), description: "Lumber and drywall - Project Smith" },
    { vendor: "Petro-Canada", amount: 89.50, category: "transport", date: daysAgo(25), description: "Fuel for work truck" },
    { vendor: "Rona Inc", amount: 567.30, category: "materials", date: daysAgo(20), description: "Plumbing fixtures" },
    { vendor: "Rogers Mobile", amount: 95.00, category: "communications", date: daysAgo(18), description: "Business phone plan" },
    { vendor: "Toronto Hydro", amount: 178.45, category: "utilities", date: daysAgo(15), description: "Workshop electricity" },
    { vendor: "Starbucks", amount: 12.40, category: "meals", date: daysAgo(12), description: "Client meeting" },
    { vendor: "Subway", amount: 18.75, category: "meals", date: daysAgo(10), description: "Lunch with subcontractor" },
    { vendor: "Canadian Tire", amount: 234.99, category: "tools", date: daysAgo(7), description: "Power drill replacement" },
  ];

  const incomes = [
    { source: "Smith Family Renovation", amount: 18500.00, income_type: "client_payment", date: daysAgo(22), description: "Kitchen renovation - Phase 1" },
    { source: "Johnson Bathroom Project", amount: 7200.00, income_type: "client_payment", date: daysAgo(14), description: "Bathroom remodel deposit" },
    { source: "Davis Deck Build", amount: 4500.00, income_type: "client_payment", date: daysAgo(5), description: "Deck construction final" },
  ];

  const bills = [
    { name: "Workshop Lease", amount: 1850.00, category: "rent", frequency: "monthly", next_due_date: daysAgo(-3) },
    { name: "WSIB Insurance", amount: 412.00, category: "insurance", frequency: "monthly", next_due_date: daysAgo(-10) },
    { name: "QuickBooks Online", amount: 45.00, category: "software", frequency: "monthly", next_due_date: daysAgo(-15) },
  ];

  const bankTxns = [
    { transaction_date: daysAgo(28), description: "HOME DEPOT #7234 TORONTO ON", amount: -1245.67, transaction_type: "expense", bank_name: "RBC Royal Bank", category: "materials" },
    { transaction_date: daysAgo(25), description: "PETRO-CAN STN #34521", amount: -89.50, transaction_type: "expense", bank_name: "RBC Royal Bank", category: "transport" },
    { transaction_date: daysAgo(22), description: "E-TRANSFER FROM J SMITH", amount: 18500.00, transaction_type: "income", bank_name: "RBC Royal Bank", category: "client_payment" },
    { transaction_date: daysAgo(20), description: "RONA STORE #145 ETOBICOKE", amount: -567.30, transaction_type: "expense", bank_name: "RBC Royal Bank", category: "materials" },
    { transaction_date: daysAgo(18), description: "ROGERS WIRELESS PAYMENT", amount: -95.00, transaction_type: "expense", bank_name: "RBC Royal Bank", category: "communications" },
    { transaction_date: daysAgo(15), description: "TORONTO HYDRO BILL PMT", amount: -178.45, transaction_type: "expense", bank_name: "RBC Royal Bank", category: "utilities" },
    { transaction_date: daysAgo(14), description: "E-TRANSFER FROM M JOHNSON", amount: 7200.00, transaction_type: "income", bank_name: "RBC Royal Bank", category: "client_payment" },
    { transaction_date: daysAgo(12), description: "STARBUCKS #04521 TORONTO", amount: -12.40, transaction_type: "expense", bank_name: "RBC Royal Bank", category: "meals" },
    { transaction_date: daysAgo(7), description: "CANADIAN TIRE #243", amount: -234.99, transaction_type: "expense", bank_name: "RBC Royal Bank", category: "tools" },
    { transaction_date: daysAgo(5), description: "E-TRANSFER FROM R DAVIS", amount: 4500.00, transaction_type: "income", bank_name: "RBC Royal Bank", category: "client_payment" },
    { transaction_date: daysAgo(3), description: "WORKSHOP LEASE - DLR PROP", amount: -1850.00, transaction_type: "expense", bank_name: "RBC Royal Bank", category: "rent" },
  ];

  const mileage = [
    { date: daysAgo(28), kilometers: 42, route: "Office to Home Depot Toronto", purpose: "Materials pickup - Smith project", start_address: "Workshop, Toronto", end_address: "Home Depot, Toronto" },
    { date: daysAgo(22), kilometers: 35, route: "Office to Smith Residence", purpose: "Site visit and measurement", start_address: "Workshop, Toronto", end_address: "Smith Residence, Mississauga" },
    { date: daysAgo(18), kilometers: 28, route: "Office to Johnson Property", purpose: "Bathroom assessment", start_address: "Workshop, Toronto", end_address: "Johnson House, Etobicoke" },
    { date: daysAgo(12), kilometers: 18, route: "Office to client meeting", purpose: "Client coffee meeting - Davis", start_address: "Workshop, Toronto", end_address: "Starbucks Bloor St" },
    { date: daysAgo(5), kilometers: 52, route: "Office to Davis Property", purpose: "Final walkthrough", start_address: "Workshop, Toronto", end_address: "Davis Residence, Markham" },
  ];

  const fiscalEntity = {
    name: "Lopez Construction Inc.",
    country: "CA",
    province: "ON",
    entity_type: "corporation",
    tax_regime: "corporation",
    tax_id: "123456789RT0001",
    tax_id_type: "BN",
    default_currency: "CAD",
    is_active: true,
  };

  return {
    expenses: expenses.map((e) => ({ ...e, user_id: userId, currency: "CAD", notes: `${DEMO_TAG} ${e.description}`, status: "pending" })),
    incomes: incomes.map((i) => ({ ...i, user_id: userId, currency: "CAD", notes: `${DEMO_TAG} ${i.description}`, recurrence: "one_time" })),
    bills: bills.map((b) => ({ ...b, user_id: userId, currency: "CAD", notes: `${DEMO_TAG} recurring bill`, status: "active", payment_method_type: "auto_debit" })),
    bankTxns: bankTxns.map((t) => ({ ...t, user_id: userId, description: `${DEMO_TAG} ${t.description}` })),
    fiscalEntity: { ...fiscalEntity, user_id: userId, notes: `${DEMO_TAG} fiscal entity demo` },
    mileage: mileage.map((m) => ({ ...m, user_id: userId, recurrence: "one_time", purpose: `${DEMO_TAG} ${m.purpose}` })),
  };
}

// ============== RESET / STATUS / SEED ==============
async function resetDemo(supabase: any, userId: string) {
  const counts: Record<string, number> = {};
  const tables = [
    { name: "expenses", col: "notes" },
    { name: "income", col: "notes" },
    { name: "recurring_bills", col: "notes" },
    { name: "bank_transactions", col: "description" },
    { name: "fiscal_entities", col: "notes" },
    { name: "mileage", col: "purpose" },
  ];

  for (const t of tables) {
    const { data, error } = await supabase
      .from(t.name)
      .delete()
      .eq("user_id", userId)
      .ilike(t.col, `${DEMO_TAG}%`)
      .select("id");
    if (error) {
      console.error(`Reset ${t.name} error:`, error);
      counts[t.name] = -1;
    } else {
      counts[t.name] = data?.length || 0;
    }
  }
  return counts;
}

async function statusDemo(supabase: any, userId: string) {
  const counts: Record<string, number> = {};
  const tables = [
    { name: "expenses", col: "notes" },
    { name: "income", col: "notes" },
    { name: "recurring_bills", col: "notes" },
    { name: "bank_transactions", col: "description" },
    { name: "fiscal_entities", col: "notes" },
    { name: "mileage", col: "purpose" },
  ];
  for (const t of tables) {
    const { count, error } = await supabase
      .from(t.name)
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .ilike(t.col, `${DEMO_TAG}%`);
    counts[t.name] = error ? -1 : count || 0;
  }
  return counts;
}

async function seedDemo(supabase: any, userId: string, scenario: Scenario) {
  // First reset to be idempotent
  await resetDemo(supabase, userId);

  let data;
  if (scenario === "maria_profesional") data = buildScenarioMaria(userId);
  else if (scenario === "carlos_caos") data = buildScenarioCarlos(userId);
  else if (scenario === "constructora_ca") data = buildScenarioConstructoraCA(userId);
  else throw new Error(`Unknown scenario: ${scenario}`);

  const inserted: Record<string, number> = {};

  if (data.expenses.length) {
    const { data: ins, error } = await supabase.from("expenses").insert(data.expenses).select("id");
    if (error) throw new Error(`expenses: ${error.message}`);
    inserted.expenses = ins?.length || 0;
  }
  if (data.incomes.length) {
    const { data: ins, error } = await supabase.from("income").insert(data.incomes).select("id");
    if (error) throw new Error(`income: ${error.message}`);
    inserted.income = ins?.length || 0;
  }
  if (data.bills.length) {
    const { data: ins, error } = await supabase.from("recurring_bills").insert(data.bills).select("id");
    if (error) throw new Error(`recurring_bills: ${error.message}`);
    inserted.recurring_bills = ins?.length || 0;
  }
  if (data.bankTxns.length) {
    const { data: ins, error } = await supabase.from("bank_transactions").insert(data.bankTxns).select("id");
    if (error) throw new Error(`bank_transactions: ${error.message}`);
    inserted.bank_transactions = ins?.length || 0;
  }
  if (data.fiscalEntity) {
    const { data: ins, error } = await supabase.from("fiscal_entities").insert(data.fiscalEntity).select("id");
    if (error) throw new Error(`fiscal_entities: ${error.message}`);
    inserted.fiscal_entities = ins?.length || 0;
  }
  if (data.mileage.length) {
    const { data: ins, error } = await supabase.from("mileage").insert(data.mileage).select("id");
    if (error) throw new Error(`mileage: ${error.message}`);
    inserted.mileage = ins?.length || 0;
  }

  return inserted;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Check admin
    const { data: roleRow } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role for inserts/deletes, always filter by userId
    const adminClient = createClient(supabaseUrl, serviceKey);

    const body = (await req.json()) as ReqBody;
    const { action, scenario } = body;

    let result: unknown;
    if (action === "status") {
      result = await statusDemo(adminClient, userId);
    } else if (action === "reset") {
      result = await resetDemo(adminClient, userId);
    } else if (action === "seed") {
      if (!scenario) {
        return new Response(JSON.stringify({ error: "scenario required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      result = await seedDemo(adminClient, userId, scenario);
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, action, scenario, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("manage-demo-data error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
