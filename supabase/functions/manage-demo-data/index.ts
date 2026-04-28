// Demo Studio: seeder/reset/status for admin demo data
// All demo records tagged with [DEMO] in notes/description for safe cleanup
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEMO_TAG = "[DEMO]";

type Action = "seed" | "reset" | "status";
type Scenario =
  | "maria_profesional"
  | "carlos_caos"
  | "constructora_ca"
  | "familia_rodriguez"
  | "ecolavanderia_spa"
  | "pareja_millennial";

interface ReqBody {
  action: Action;
  scenario?: Scenario;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// ======================================================================
// SCENARIO A: María Profesional (Chile, persona natural) — FOCALIZADO
// ======================================================================
function buildScenarioMaria(userId: string) {
  const expenses = [
    { vendor: "Arriendo Depto", amount: 650000, category: "vivienda", date: daysAgo(30), description: "Arriendo mensual" },
    { vendor: "Jumbo", amount: 145320, category: "alimentacion", date: daysAgo(28), description: "Compra semanal" },
    { vendor: "Copec", amount: 52000, category: "transporte", date: daysAgo(25), description: "Bencina" },
    { vendor: "Netflix", amount: 9990, category: "suscripciones", date: daysAgo(22), description: "Plan estandar" },
    { vendor: "Spotify", amount: 5990, category: "suscripciones", date: daysAgo(22), description: "Premium" },
    { vendor: "Smart Fit", amount: 24990, category: "salud", date: daysAgo(20), description: "Mensualidad gym" },
    { vendor: "Lider Express", amount: 38450, category: "alimentacion", date: daysAgo(18), description: "Compras rapidas" },
    { vendor: "Uber", amount: 12300, category: "transporte", date: daysAgo(15), description: "Viaje aeropuerto" },
    { vendor: "Cruz Verde", amount: 18760, category: "salud", date: daysAgo(12), description: "Medicamentos" },
    { vendor: "Starbucks", amount: 4890, category: "alimentacion", date: daysAgo(8), description: "Cafe" },
    { vendor: "Ripley", amount: 89990, category: "compras", date: daysAgo(5), description: "Ropa" },
    { vendor: "ENEL", amount: 42180, category: "servicios", date: daysAgo(3), description: "Cuenta luz" },
  ];

  const incomes = [
    { source: "Empresa Tech SpA", amount: 2200000, income_type: "salary", date: daysAgo(30), description: "Sueldo" },
    { source: "Empresa Tech SpA", amount: 2200000, income_type: "salary", date: daysAgo(60), description: "Sueldo" },
    { source: "Cliente Freelance A", amount: 450000, income_type: "freelance", date: daysAgo(20), description: "Diseno web" },
    { source: "Cliente Freelance B", amount: 280000, income_type: "freelance", date: daysAgo(10), description: "Consultoria UX" },
  ];

  const bills = [
    { name: "Netflix", amount: 9990, category: "suscripciones", frequency: "monthly", next_due_date: daysAgo(-7) },
    { name: "Spotify", amount: 5990, category: "suscripciones", frequency: "monthly", next_due_date: daysAgo(-7) },
    { name: "Smart Fit", amount: 24990, category: "salud", frequency: "monthly", next_due_date: daysAgo(-10) },
  ];

  const bankTxns: any[] = [];
  for (const e of expenses) {
    bankTxns.push({
      transaction_date: e.date,
      description: e.vendor.toUpperCase() + " - " + e.description.toUpperCase(),
      amount: -e.amount,
      transaction_type: "expense",
      bank_name: "Banco de Chile",
      category: e.category,
    });
  }
  for (const i of incomes) {
    bankTxns.push({
      transaction_date: i.date,
      description: "TRANSFERENCIA " + i.source.toUpperCase(),
      amount: i.amount,
      transaction_type: "income",
      bank_name: "Banco de Chile",
      category: i.income_type,
    });
  }

  const fiscalEntity = {
    name: "Maria Gonzalez - Persona Natural",
    country: "CL",
    entity_type: "individual",
    tax_regime: "second_category",
    default_currency: "CLP",
    is_active: true,
    is_primary: true,
  };

  return {
    expenses: expenses.map((e) => ({ ...e, user_id: userId, currency: "CLP", notes: `${DEMO_TAG} ${e.description}`, status: "pending" })),
    incomes: incomes.map((i) => ({ ...i, user_id: userId, currency: "CLP", notes: `${DEMO_TAG} ${i.description}`, recurrence: "one_time" })),
    bills: bills.map((b) => ({ ...b, user_id: userId, currency: "CLP", notes: `${DEMO_TAG} factura recurrente`, status: "active", payment_method_type: "manual_online" })),
    bankTxns: bankTxns.map((t) => ({ ...t, user_id: userId, description: `${DEMO_TAG} ${t.description}` })),
    fiscalEntity: { ...fiscalEntity, user_id: userId, notes: `${DEMO_TAG} entidad fiscal demo` },
    mileage: [],
    budgets: [],
    goals: [],
    liabilities: [],
    tags: [],
  };
}

// ======================================================================
// SCENARIO B: Carlos Caos (Chile, duplicados) — FOCALIZADO
// ======================================================================
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
    { transaction_date: daysAgo(45), description: "DEPOSITO SUELDO", amount: 1850000, transaction_type: "income", bank_name: "Santander" },
  ];

  const expenses = [
    { vendor: "Unimarc", amount: 67890, category: "alimentacion", date: daysAgo(10), description: "Compra mercado" },
    { vendor: "Unimarc 45", amount: 67890, category: "alimentacion", date: daysAgo(10), description: "Mercaderia" },
    { vendor: "Uber Eats", amount: 18500, category: "alimentacion", date: daysAgo(15), description: "Almuerzo" },
    { vendor: "Uber Eats", amount: 18500, category: "alimentacion", date: daysAgo(15), description: "Comida" },
    { vendor: "Shell", amount: 45000, category: "transporte", date: daysAgo(20), description: "Bencina" },
    { vendor: "Shell Las Condes", amount: 45000, category: "transporte", date: daysAgo(20), description: "Combustible" },
  ];

  return {
    expenses: expenses.map((e) => ({ ...e, user_id: userId, currency: "CLP", notes: `${DEMO_TAG} ${e.description}`, status: "pending" })),
    incomes: [],
    bills: [],
    bankTxns: bankTxns.map((t) => ({ ...t, user_id: userId, description: `${DEMO_TAG} ${t.description}` })),
    fiscalEntity: null,
    mileage: [],
    budgets: [],
    goals: [],
    liabilities: [],
    tags: [],
  };
}

// ======================================================================
// SCENARIO C: Lopez Construction Inc. (Canada B2B) — FOCALIZADO
// ======================================================================
function buildScenarioConstructoraCA(userId: string) {
  const expenses = [
    { vendor: "Home Depot Toronto", amount: 1245.67, category: "materials", date: daysAgo(28), description: "Lumber - Smith project" },
    { vendor: "Petro-Canada", amount: 89.50, category: "transport", date: daysAgo(25), description: "Fuel work truck" },
    { vendor: "Rona Inc", amount: 567.30, category: "materials", date: daysAgo(20), description: "Plumbing fixtures" },
    { vendor: "Rogers Mobile", amount: 95.00, category: "communications", date: daysAgo(18), description: "Business phone" },
    { vendor: "Toronto Hydro", amount: 178.45, category: "utilities", date: daysAgo(15), description: "Workshop electricity" },
    { vendor: "Starbucks", amount: 12.40, category: "meals", date: daysAgo(12), description: "Client meeting" },
    { vendor: "Subway", amount: 18.75, category: "meals", date: daysAgo(10), description: "Lunch subcontractor" },
    { vendor: "Canadian Tire", amount: 234.99, category: "tools", date: daysAgo(7), description: "Power drill" },
  ];

  const incomes = [
    { source: "Smith Family Renovation", amount: 18500, income_type: "freelance", date: daysAgo(22), description: "Kitchen Phase 1" },
    { source: "Johnson Bathroom", amount: 7200, income_type: "freelance", date: daysAgo(14), description: "Bathroom deposit" },
    { source: "Davis Deck Build", amount: 4500, income_type: "freelance", date: daysAgo(5), description: "Deck final" },
  ];

  const bills = [
    { name: "Workshop Lease", amount: 1850, category: "rent", frequency: "monthly", next_due_date: daysAgo(-3) },
    { name: "WSIB Insurance", amount: 412, category: "insurance", frequency: "monthly", next_due_date: daysAgo(-10) },
    { name: "QuickBooks Online", amount: 45, category: "software", frequency: "monthly", next_due_date: daysAgo(-15) },
  ];

  const bankTxns: any[] = [];
  for (const e of expenses) {
    bankTxns.push({
      transaction_date: e.date, description: e.vendor.toUpperCase() + " " + e.description.toUpperCase(),
      amount: -e.amount, transaction_type: "expense", bank_name: "RBC Royal Bank", category: e.category,
    });
  }
  for (const i of incomes) {
    bankTxns.push({
      transaction_date: i.date, description: "E-TRANSFER FROM " + i.source.toUpperCase(),
      amount: i.amount, transaction_type: "income", bank_name: "RBC Royal Bank", category: "client_payment",
    });
  }

  const mileage = [
    { date: daysAgo(28), kilometers: 42, route: "Office to Home Depot", purpose: "Materials pickup", start_address: "Workshop, Toronto", end_address: "Home Depot, Toronto" },
    { date: daysAgo(22), kilometers: 35, route: "Office to Smith", purpose: "Site visit", start_address: "Workshop", end_address: "Smith Residence, Mississauga" },
    { date: daysAgo(18), kilometers: 28, route: "Office to Johnson", purpose: "Bathroom assessment", start_address: "Workshop", end_address: "Johnson House, Etobicoke" },
    { date: daysAgo(12), kilometers: 18, route: "Client meeting", purpose: "Davis coffee", start_address: "Workshop", end_address: "Starbucks Bloor" },
    { date: daysAgo(5), kilometers: 52, route: "Office to Davis", purpose: "Final walkthrough", start_address: "Workshop", end_address: "Davis, Markham" },
  ];

  const fiscalEntity = {
    name: "Lopez Construction Inc.",
    country: "CA", province: "ON",
    entity_type: "corporation", tax_regime: "corporation",
    tax_id: "123456789RT0001", tax_id_type: "BN",
    default_currency: "CAD", is_active: true, is_primary: true,
  };

  return {
    expenses: expenses.map((e) => ({ ...e, user_id: userId, currency: "CAD", notes: `${DEMO_TAG} ${e.description}`, status: "pending" })),
    incomes: incomes.map((i) => ({ ...i, user_id: userId, currency: "CAD", notes: `${DEMO_TAG} ${i.description}`, recurrence: "one_time" })),
    bills: bills.map((b) => ({ ...b, user_id: userId, currency: "CAD", notes: `${DEMO_TAG} recurring`, status: "active", payment_method_type: "auto_debit" })),
    bankTxns: bankTxns.map((t) => ({ ...t, user_id: userId, description: `${DEMO_TAG} ${t.description}` })),
    fiscalEntity: { ...fiscalEntity, user_id: userId, notes: `${DEMO_TAG} fiscal entity demo` },
    mileage: mileage.map((m) => ({ ...m, user_id: userId, recurrence: "one_time", purpose: `${DEMO_TAG} ${m.purpose}` })),
    budgets: [],
    goals: [],
    liabilities: [],
    tags: [],
  };
}

// ======================================================================
// SCENARIO D: Familia Rodriguez (Chile, padre familia) — SHOWCASE COMPLETO
// 6 meses de datos. Pedro (ingeniero) + Carmen (profesora) + 2 hijos
// ======================================================================
function buildScenarioFamiliaRodriguez(userId: string) {
  const expenses: any[] = [];
  const bankTxns: any[] = [];

  // 6 meses (180 dias) de gastos recurrentes + variables
  for (let m = 0; m < 6; m++) {
    const baseDay = m * 30;
    // Vivienda
    expenses.push({ vendor: "Banco BCI - Dividendo", amount: 580000, category: "vivienda", date: daysAgo(baseDay + 5), description: "Dividendo hipotecario" });
    expenses.push({ vendor: "Aguas Andinas", amount: 28500, category: "servicios", date: daysAgo(baseDay + 8), description: "Agua hogar" });
    expenses.push({ vendor: "ENEL Distribucion", amount: 65800, category: "servicios", date: daysAgo(baseDay + 10), description: "Electricidad" });
    expenses.push({ vendor: "Movistar Hogar", amount: 42990, category: "servicios", date: daysAgo(baseDay + 12), description: "Internet+TV" });
    // Alimentacion
    expenses.push({ vendor: "Jumbo", amount: 285000 + Math.round(Math.random() * 30000), category: "alimentacion", date: daysAgo(baseDay + 3), description: "Compra mensual familia" });
    expenses.push({ vendor: "Lider Express", amount: 78000 + Math.round(Math.random() * 15000), category: "alimentacion", date: daysAgo(baseDay + 17), description: "Compra quincenal" });
    expenses.push({ vendor: "Vega Central", amount: 35000, category: "alimentacion", date: daysAgo(baseDay + 22), description: "Frutas y verduras" });
    // Educacion (hijos)
    expenses.push({ vendor: "Colegio San Ignacio", amount: 320000, category: "educacion", date: daysAgo(baseDay + 6), description: "Mensualidad colegio hijo1" });
    expenses.push({ vendor: "Colegio San Ignacio", amount: 320000, category: "educacion", date: daysAgo(baseDay + 6), description: "Mensualidad colegio hijo2" });
    expenses.push({ vendor: "Academia Ingles Kids", amount: 45000, category: "educacion", date: daysAgo(baseDay + 14), description: "Ingles after-school" });
    // Transporte
    expenses.push({ vendor: "Copec", amount: 55000, category: "transporte", date: daysAgo(baseDay + 9), description: "Bencina auto familiar" });
    expenses.push({ vendor: "Copec", amount: 52000, category: "transporte", date: daysAgo(baseDay + 24), description: "Bencina" });
    expenses.push({ vendor: "TAG Autopistas", amount: 38500, category: "transporte", date: daysAgo(baseDay + 28), description: "Peajes urbanos" });
    // Salud
    expenses.push({ vendor: "Cruz Verde", amount: 22000, category: "salud", date: daysAgo(baseDay + 15), description: "Farmacia familia" });
    if (m === 0 || m === 3) {
      expenses.push({ vendor: "Clinica Las Condes", amount: 85000, category: "salud", date: daysAgo(baseDay + 18), description: "Pediatra hijos" });
    }
    // Mascota
    expenses.push({ vendor: "Veterinaria Patitas", amount: 28500, category: "mascota", date: daysAgo(baseDay + 20), description: "Alimento perro" });
    // Suscripciones
    expenses.push({ vendor: "Netflix", amount: 9990, category: "suscripciones", date: daysAgo(baseDay + 7), description: "Plan familiar" });
    expenses.push({ vendor: "Disney Plus", amount: 6390, category: "suscripciones", date: daysAgo(baseDay + 7), description: "Suscripcion hijos" });
    expenses.push({ vendor: "Spotify Familiar", amount: 8990, category: "suscripciones", date: daysAgo(baseDay + 8), description: "Plan familiar" });
  }

  // Ingresos: 2 sueldos x 6 meses
  const incomes: any[] = [];
  for (let m = 0; m < 6; m++) {
    incomes.push({ source: "Empresa Constructora SA", amount: 2850000, income_type: "salary", date: daysAgo(m * 30 + 1), description: "Sueldo Pedro - Ingeniero" });
    incomes.push({ source: "Colegio Particular", amount: 980000, income_type: "salary", date: daysAgo(m * 30 + 1), description: "Sueldo Carmen - Profesora" });
  }

  // Bills recurrentes
  const bills = [
    { name: "Dividendo Hipotecario BCI", amount: 580000, category: "vivienda", frequency: "monthly", next_due_date: daysAgo(-25), priority: "high" },
    { name: "Colegio San Ignacio (hijo1)", amount: 320000, category: "educacion", frequency: "monthly", next_due_date: daysAgo(-24), priority: "high" },
    { name: "Colegio San Ignacio (hijo2)", amount: 320000, category: "educacion", frequency: "monthly", next_due_date: daysAgo(-24), priority: "high" },
    { name: "Movistar Hogar", amount: 42990, category: "servicios", frequency: "monthly", next_due_date: daysAgo(-18) },
    { name: "Netflix Familiar", amount: 9990, category: "suscripciones", frequency: "monthly", next_due_date: daysAgo(-23) },
    { name: "Disney Plus", amount: 6390, category: "suscripciones", frequency: "monthly", next_due_date: daysAgo(-23) },
    { name: "Spotify Familiar", amount: 8990, category: "suscripciones", frequency: "monthly", next_due_date: daysAgo(-22) },
    { name: "TAG Autopistas", amount: 38500, category: "transporte", frequency: "monthly", next_due_date: daysAgo(-2) },
  ];

  // Espejo bancario en 2 cuentas
  for (const e of expenses) {
    const bank = e.category === "vivienda" || e.category === "educacion" ? "Banco Estado" : "BCI";
    bankTxns.push({
      transaction_date: e.date,
      description: e.vendor.toUpperCase() + " - " + e.description.toUpperCase(),
      amount: -e.amount, transaction_type: "expense", bank_name: bank, category: e.category,
    });
  }
  for (const i of incomes) {
    bankTxns.push({
      transaction_date: i.date,
      description: "TRANSF SUELDO " + i.source.toUpperCase(),
      amount: i.amount, transaction_type: "income", bank_name: "Banco Estado", category: "salary",
    });
  }

  // Presupuestos por categoria
  const budgets = [
    { category: "alimentacion", monthly_budget: 450000, alert_threshold: 85 },
    { category: "educacion", monthly_budget: 720000, alert_threshold: 95 },
    { category: "salud", monthly_budget: 120000, alert_threshold: 80 },
    { category: "transporte", monthly_budget: 180000, alert_threshold: 80 },
    { category: "suscripciones", monthly_budget: 30000, alert_threshold: 90 },
    { category: "mascota", monthly_budget: 40000, alert_threshold: 85 },
  ];

  // Metas de ahorro
  const goals = [
    { name: "Vacaciones familia Bariloche", target_amount: 800000, current_amount: 320000, deadline: daysAgo(-150), priority: 2, color: "#3B82F6" },
    { name: "Fondo emergencia 6 meses", target_amount: 3000000, current_amount: 1450000, deadline: daysAgo(-365), priority: 1, color: "#10B981" },
    { name: "Universidad hijos", target_amount: 15000000, current_amount: 2800000, deadline: daysAgo(-1825), priority: 1, color: "#8B5CF6" },
  ];

  // Deudas
  const liabilities = [
    { name: "Credito Hipotecario BCI", category: "mortgage", original_amount: 95000000, current_balance: 78500000, interest_rate: 4.2, minimum_payment: 580000, due_date: daysAgo(-25), debt_type: "good" },
    { name: "Credito Automotriz Santander", category: "auto_loan", original_amount: 12000000, current_balance: 5800000, interest_rate: 8.5, minimum_payment: 285000, due_date: daysAgo(-12), debt_type: "neutral" },
  ];

  // Tags
  const tags = [
    { name: "hijo1", color: "#3B82F6" },
    { name: "hijo2", color: "#10B981" },
    { name: "compartido", color: "#8B5CF6" },
    { name: "personal-pedro", color: "#F59E0B" },
    { name: "personal-carmen", color: "#EC4899" },
    { name: "vacaciones", color: "#06B6D4" },
    { name: "mascota", color: "#84CC16" },
    { name: "emergencia", color: "#EF4444" },
  ];

  const fiscalEntity = {
    name: "Familia Rodriguez - Persona Natural",
    country: "CL", entity_type: "individual", tax_regime: "second_category",
    default_currency: "CLP", is_active: true, is_primary: true,
  };

  return {
    expenses: expenses.map((e) => ({ ...e, user_id: userId, currency: "CLP", notes: `${DEMO_TAG} ${e.description}`, status: "pending" })),
    incomes: incomes.map((i) => ({ ...i, user_id: userId, currency: "CLP", notes: `${DEMO_TAG} ${i.description}`, recurrence: "monthly" })),
    bills: bills.map((b) => ({ ...b, user_id: userId, currency: "CLP", notes: `${DEMO_TAG} bill recurrente familia`, status: "active", payment_method_type: "auto_debit" })),
    bankTxns: bankTxns.map((t) => ({ ...t, user_id: userId, description: `${DEMO_TAG} ${t.description}` })),
    fiscalEntity: { ...fiscalEntity, user_id: userId, notes: `${DEMO_TAG} familia` },
    mileage: [],
    budgets: budgets.map((b) => ({ ...b, user_id: userId })),
    goals: goals.map((g) => ({ ...g, user_id: userId, status: "active" })),
    liabilities: liabilities.map((l) => ({ ...l, user_id: userId, currency: "CLP", notes: `${DEMO_TAG} deuda familia` })),
    tags: tags.map((t) => ({ ...t, user_id: userId })),
  };
}

// ======================================================================
// SCENARIO E: EcoLavanderia SpA (Chile, PYME) — SHOWCASE COMPLETO
// Sofia (42), dueña, 2 empleados
// ======================================================================
function buildScenarioEcoLavanderia(userId: string) {
  const expenses: any[] = [];
  const incomes: any[] = [];
  const bankTxns: any[] = [];

  // 6 meses de operacion
  for (let m = 0; m < 6; m++) {
    const baseDay = m * 30;
    // Insumos operativos
    expenses.push({ vendor: "Distribuidora Eco Clean", amount: 485000, category: "insumos", date: daysAgo(baseDay + 4), description: "Detergentes biodegradables" });
    expenses.push({ vendor: "Empaques Verdes Ltda", amount: 125000, category: "insumos", date: daysAgo(baseDay + 11), description: "Bolsas compostables" });
    expenses.push({ vendor: "Suavitel Industrial", amount: 95000, category: "insumos", date: daysAgo(baseDay + 19), description: "Suavizantes" });
    // Sueldos empleados
    expenses.push({ vendor: "Sueldo - Operario 1", amount: 650000, category: "sueldos", date: daysAgo(baseDay + 1), description: "Sueldo mensual operario" });
    expenses.push({ vendor: "Sueldo - Operario 2", amount: 650000, category: "sueldos", date: daysAgo(baseDay + 1), description: "Sueldo mensual operario" });
    // Arriendo y servicios local
    expenses.push({ vendor: "Inmobiliaria Norte", amount: 850000, category: "arriendo", date: daysAgo(baseDay + 5), description: "Arriendo local comercial" });
    expenses.push({ vendor: "ENEL Empresa", amount: 285000, category: "servicios", date: daysAgo(baseDay + 13), description: "Electricidad local (alta)" });
    expenses.push({ vendor: "Aguas Andinas", amount: 195000, category: "servicios", date: daysAgo(baseDay + 14), description: "Agua local (alto consumo)" });
    expenses.push({ vendor: "GTD Internet Empresa", amount: 38990, category: "servicios", date: daysAgo(baseDay + 15), description: "Fibra optica" });
    // Marketing
    expenses.push({ vendor: "Meta Ads", amount: 120000, category: "marketing", date: daysAgo(baseDay + 8), description: "Publicidad Instagram" });
    expenses.push({ vendor: "Google Ads", amount: 85000, category: "marketing", date: daysAgo(baseDay + 22), description: "Search ads" });
    // Software
    expenses.push({ vendor: "Defontana ERP", amount: 89000, category: "software", date: daysAgo(baseDay + 16), description: "ERP contable" });
    // Transporte/delivery
    expenses.push({ vendor: "Copec - Camioneta", amount: 95000, category: "transporte", date: daysAgo(baseDay + 6), description: "Combustible delivery" });
    expenses.push({ vendor: "Copec - Camioneta", amount: 88000, category: "transporte", date: daysAgo(baseDay + 23), description: "Combustible delivery" });
  }

  // Ingresos: ventas POS + transferencias B2B + Mercado Pago
  for (let m = 0; m < 6; m++) {
    const baseDay = m * 30;
    // POS diarios (8 al mes muestreo)
    for (let d = 0; d < 8; d++) {
      incomes.push({ source: "Ventas POS local", amount: 120000 + Math.round(Math.random() * 80000), income_type: "business", date: daysAgo(baseDay + d * 3 + 2), description: `Ventas dia ${d + 1}` });
    }
    // B2B clientes corporativos
    incomes.push({ source: "Hotel Boutique Lastarria", amount: 1250000, income_type: "business", date: daysAgo(baseDay + 10), description: "Servicio mensual hotel" });
    incomes.push({ source: "Restaurante Quinoa", amount: 480000, income_type: "business", date: daysAgo(baseDay + 18), description: "Servicio mensual mantelería" });
    // Mercado Pago
    incomes.push({ source: "Mercado Pago", amount: 285000, income_type: "business", date: daysAgo(baseDay + 25), description: "Liquidacion MP" });
  }

  // Bills B2B
  const bills = [
    { name: "Arriendo Local Comercial", amount: 850000, category: "arriendo", frequency: "monthly", next_due_date: daysAgo(-25), priority: "high" },
    { name: "Defontana ERP", amount: 89000, category: "software", frequency: "monthly", next_due_date: daysAgo(-15) },
    { name: "GTD Fibra Empresa", amount: 38990, category: "servicios", frequency: "monthly", next_due_date: daysAgo(-15) },
    { name: "Aguas Andinas Local", amount: 195000, category: "servicios", frequency: "monthly", next_due_date: daysAgo(-16) },
    { name: "ENEL Local Comercial", amount: 285000, category: "servicios", frequency: "monthly", next_due_date: daysAgo(-17) },
  ];

  // Espejo bancario en 3 "cuentas" (banco_name)
  for (const e of expenses) {
    const bank = e.category === "sueldos" || e.category === "arriendo" ? "BCI Empresa" : "Banco de Chile Empresa";
    bankTxns.push({
      transaction_date: e.date, description: e.vendor.toUpperCase() + " - " + e.description.toUpperCase(),
      amount: -e.amount, transaction_type: "expense", bank_name: bank, category: e.category,
    });
  }
  for (const i of incomes) {
    const bank = i.source === "Mercado Pago" ? "Mercado Pago" : (i.source === "Ventas POS local" ? "Banco de Chile Empresa" : "BCI Empresa");
    bankTxns.push({
      transaction_date: i.date, description: i.source.toUpperCase() + " - " + i.description.toUpperCase(),
      amount: i.amount, transaction_type: "income", bank_name: bank, category: "business",
    });
  }

  // Mileage (visitas a clientes B2B)
  const mileage: any[] = [];
  for (let m = 0; m < 6; m++) {
    const baseDay = m * 30;
    mileage.push({ date: daysAgo(baseDay + 7), kilometers: 18, route: "Local a Hotel Lastarria", purpose: "Entrega y retiro hotel", start_address: "Local Eco Lavanderia", end_address: "Hotel Lastarria, Santiago" });
    mileage.push({ date: daysAgo(baseDay + 14), kilometers: 24, route: "Local a Quinoa", purpose: "Entrega manteleria restaurante", start_address: "Local Eco Lavanderia", end_address: "Restaurante Quinoa, Providencia" });
    mileage.push({ date: daysAgo(baseDay + 21), kilometers: 32, route: "Visita prospecto", purpose: "Cotizacion nuevo cliente", start_address: "Local Eco Lavanderia", end_address: "Hotel Plaza, Las Condes" });
  }

  // Presupuestos operacionales
  const budgets = [
    { category: "insumos", monthly_budget: 750000, alert_threshold: 85 },
    { category: "marketing", monthly_budget: 250000, alert_threshold: 90 },
    { category: "servicios", monthly_budget: 550000, alert_threshold: 80 },
  ];

  // Metas
  const goals = [
    { name: "Renovar maquinaria industrial", target_amount: 5000000, current_amount: 1850000, deadline: daysAgo(-180), priority: 1, color: "#3B82F6" },
    { name: "Expansion segundo local", target_amount: 20000000, current_amount: 4200000, deadline: daysAgo(-540), priority: 2, color: "#10B981" },
  ];

  // Deuda CORFO
  const liabilities = [
    { name: "Credito CORFO Maquinaria", category: "business_loan", original_amount: 8000000, current_balance: 4500000, interest_rate: 3.8, minimum_payment: 185000, due_date: daysAgo(-15), debt_type: "good" },
  ];

  // Tags por cliente B2B y operacion
  const tags = [
    { name: "cliente-hotel-lastarria", color: "#3B82F6" },
    { name: "cliente-restaurante-quinoa", color: "#10B981" },
    { name: "prospecto", color: "#F59E0B" },
    { name: "operativo", color: "#8B5CF6" },
    { name: "marketing-q1", color: "#EC4899" },
    { name: "deducible", color: "#06B6D4" },
    { name: "delivery", color: "#84CC16" },
  ];

  const fiscalEntity = {
    name: "EcoLavanderia SpA",
    country: "CL", entity_type: "spa", tax_regime: "pro_pyme_general",
    tax_id: "76.543.210-K", tax_id_type: "RUT",
    default_currency: "CLP", is_active: true, is_primary: true,
  };

  return {
    expenses: expenses.map((e) => ({ ...e, user_id: userId, currency: "CLP", notes: `${DEMO_TAG} ${e.description}`, status: "approved" })),
    incomes: incomes.map((i) => ({ ...i, user_id: userId, currency: "CLP", notes: `${DEMO_TAG} ${i.description}`, recurrence: "one_time" })),
    bills: bills.map((b) => ({ ...b, user_id: userId, currency: "CLP", notes: `${DEMO_TAG} bill operacional`, status: "active", payment_method_type: "manual_online" })),
    bankTxns: bankTxns.map((t) => ({ ...t, user_id: userId, description: `${DEMO_TAG} ${t.description}` })),
    fiscalEntity: { ...fiscalEntity, user_id: userId, notes: `${DEMO_TAG} pyme cl` },
    mileage: mileage.map((m) => ({ ...m, user_id: userId, recurrence: "one_time", purpose: `${DEMO_TAG} ${m.purpose}` })),
    budgets: budgets.map((b) => ({ ...b, user_id: userId })),
    goals: goals.map((g) => ({ ...g, user_id: userId, status: "active" })),
    liabilities: liabilities.map((l) => ({ ...l, user_id: userId, currency: "CLP", notes: `${DEMO_TAG} deuda corfo` })),
    tags: tags.map((t) => ({ ...t, user_id: userId })),
  };
}

// ======================================================================
// SCENARIO F: Pareja Millennial (Chile, sin hijos) — FOCALIZADO
// Daniela (29) + Joaquin (31), ahorrando casa propia
// ======================================================================
function buildScenarioParejaMillennial(userId: string) {
  const expenses = [
    { vendor: "Arriendo Depto", amount: 720000, category: "vivienda", date: daysAgo(28), description: "Arriendo compartido" },
    { vendor: "Jumbo", amount: 195000, category: "alimentacion", date: daysAgo(25), description: "Compra mensual" },
    { vendor: "Uber Eats", amount: 22000, category: "alimentacion", date: daysAgo(20), description: "Cena viernes" },
    { vendor: "Movistar Hogar", amount: 32000, category: "servicios", date: daysAgo(18), description: "Internet" },
    { vendor: "ENEL", amount: 38000, category: "servicios", date: daysAgo(16), description: "Luz" },
    { vendor: "Spotify Duo", amount: 8990, category: "suscripciones", date: daysAgo(14), description: "Plan duo" },
    { vendor: "Netflix", amount: 9990, category: "suscripciones", date: daysAgo(14), description: "Estandar" },
    { vendor: "Smart Fit Daniela", amount: 24990, category: "salud", date: daysAgo(12), description: "Gym Daniela" },
    { vendor: "Smart Fit Joaquin", amount: 24990, category: "salud", date: daysAgo(12), description: "Gym Joaquin" },
    { vendor: "Copec", amount: 48000, category: "transporte", date: daysAgo(10), description: "Bencina auto compartido" },
    { vendor: "Cine Hoyts", amount: 18000, category: "entretenimiento", date: daysAgo(8), description: "Salida pareja" },
    { vendor: "Restaurant Boragó", amount: 145000, category: "entretenimiento", date: daysAgo(5), description: "Aniversario" },
  ];

  const incomes = [
    { source: "Startup TechCo", amount: 1850000, income_type: "salary", date: daysAgo(28), description: "Sueldo Daniela - PM" },
    { source: "Banco Itau", amount: 2100000, income_type: "salary", date: daysAgo(28), description: "Sueldo Joaquin - Analista" },
  ];

  const bankTxns: any[] = [];
  for (const e of expenses) {
    bankTxns.push({
      transaction_date: e.date, description: e.vendor.toUpperCase() + " " + e.description.toUpperCase(),
      amount: -e.amount, transaction_type: "expense", bank_name: e.vendor.includes("Daniela") ? "Banco de Chile" : "Itau", category: e.category,
    });
  }
  for (const i of incomes) {
    bankTxns.push({
      transaction_date: i.date, description: "TRANSF SUELDO " + i.source.toUpperCase(),
      amount: i.amount, transaction_type: "income", bank_name: i.description.includes("Daniela") ? "Banco de Chile" : "Itau", category: "salary",
    });
  }

  const goals = [
    { name: "Pie casa propia", target_amount: 45000000, current_amount: 12500000, deadline: daysAgo(-730), priority: 1, color: "#3B82F6" },
    { name: "Viaje Europa 2027", target_amount: 6000000, current_amount: 1800000, deadline: daysAgo(-365), priority: 2, color: "#8B5CF6" },
  ];

  const tags = [
    { name: "compartido", color: "#3B82F6" },
    { name: "personal-daniela", color: "#EC4899" },
    { name: "personal-joaquin", color: "#10B981" },
    { name: "ahorro-casa", color: "#F59E0B" },
  ];

  const fiscalEntity = {
    name: "Pareja Rojas-Vega - Persona Natural",
    country: "CL", entity_type: "individual", tax_regime: "second_category",
    default_currency: "CLP", is_active: true, is_primary: true,
  };

  return {
    expenses: expenses.map((e) => ({ ...e, user_id: userId, currency: "CLP", notes: `${DEMO_TAG} ${e.description}`, status: "pending" })),
    incomes: incomes.map((i) => ({ ...i, user_id: userId, currency: "CLP", notes: `${DEMO_TAG} ${i.description}`, recurrence: "monthly" })),
    bills: [],
    bankTxns: bankTxns.map((t) => ({ ...t, user_id: userId, description: `${DEMO_TAG} ${t.description}` })),
    fiscalEntity: { ...fiscalEntity, user_id: userId, notes: `${DEMO_TAG} pareja` },
    mileage: [],
    budgets: [],
    goals: goals.map((g) => ({ ...g, user_id: userId, status: "active" })),
    liabilities: [],
    tags: tags.map((t) => ({ ...t, user_id: userId })),
  };
}

// ======================================================================
// RESET / STATUS / SEED
// ======================================================================
const RESET_TABLES = [
  { name: "expense_tags", isRelation: true }, // limpiar relaciones primero
  { name: "expenses", col: "notes" },
  { name: "income", col: "notes" },
  { name: "recurring_bills", col: "notes" },
  { name: "bank_transactions", col: "description" },
  { name: "mileage", col: "purpose" },
  { name: "category_budgets", col: null }, // no tiene notes; limpiar todos del usuario que coincidan con categorias demo? Mejor: borrar todos del user.
  { name: "savings_goals", col: "name" }, // usar prefijo en name? Mejor: borrar tods donde name empiece con cualquier demo
  { name: "liabilities", col: "notes" },
  { name: "tags", col: null }, // tags no tiene notes; borrar tags marcadas via user_id (ya filtrado)
  { name: "fiscal_entities", col: "notes" },
];

async function resetDemo(supabase: any, userId: string) {
  const counts: Record<string, number> = {};

  // 1. Borrar relaciones expense_tags (ON DELETE CASCADE de expenses ya las borra, pero por seguridad las dejamos primero)
  // 2. Borrar registros con prefijo [DEMO]
  for (const t of [
    { name: "expenses", col: "notes" },
    { name: "income", col: "notes" },
    { name: "recurring_bills", col: "notes" },
    { name: "bank_transactions", col: "description" },
    { name: "mileage", col: "purpose" },
    { name: "liabilities", col: "notes" },
    { name: "fiscal_entities", col: "notes" },
  ]) {
    const { data, error } = await supabase
      .from(t.name).delete().eq("user_id", userId).ilike(t.col, `${DEMO_TAG}%`).select("id");
    counts[t.name] = error ? -1 : (data?.length || 0);
    if (error) console.error(`Reset ${t.name}:`, error);
  }

  // 3. category_budgets, savings_goals, tags: no tienen columna notes confiable.
  //    Usamos heuristica: solo borrar si el user tiene una entidad fiscal demo presente en este momento (ya borrada arriba).
  //    Para idempotencia simple: borrar TODOS los del user (admin demo studio).
  for (const t of ["category_budgets", "savings_goals", "tags"]) {
    const { data, error } = await supabase.from(t).delete().eq("user_id", userId).select("id");
    counts[t] = error ? -1 : (data?.length || 0);
    if (error) console.error(`Reset ${t}:`, error);
  }

  return counts;
}

async function statusDemo(supabase: any, userId: string) {
  const counts: Record<string, number> = {};
  for (const t of [
    { name: "expenses", col: "notes" },
    { name: "income", col: "notes" },
    { name: "recurring_bills", col: "notes" },
    { name: "bank_transactions", col: "description" },
    { name: "mileage", col: "purpose" },
    { name: "liabilities", col: "notes" },
    { name: "fiscal_entities", col: "notes" },
  ]) {
    const { count, error } = await supabase
      .from(t.name).select("*", { count: "exact", head: true })
      .eq("user_id", userId).ilike(t.col, `${DEMO_TAG}%`);
    counts[t.name] = error ? -1 : (count || 0);
  }
  for (const t of ["category_budgets", "savings_goals", "tags"]) {
    const { count, error } = await supabase
      .from(t).select("*", { count: "exact", head: true }).eq("user_id", userId);
    counts[t] = error ? -1 : (count || 0);
  }
  return counts;
}

async function seedDemo(supabase: any, userId: string, scenario: Scenario) {
  await resetDemo(supabase, userId);

  let data;
  switch (scenario) {
    case "maria_profesional": data = buildScenarioMaria(userId); break;
    case "carlos_caos": data = buildScenarioCarlos(userId); break;
    case "constructora_ca": data = buildScenarioConstructoraCA(userId); break;
    case "familia_rodriguez": data = buildScenarioFamiliaRodriguez(userId); break;
    case "ecolavanderia_spa": data = buildScenarioEcoLavanderia(userId); break;
    case "pareja_millennial": data = buildScenarioParejaMillennial(userId); break;
    default: throw new Error(`Unknown scenario: ${scenario}`);
  }

  const inserted: Record<string, number> = {};
  let entityId: string | null = null;

  // 1. Fiscal entity primero (los demas pueden referenciarla)
  if (data.fiscalEntity) {
    const { data: ins, error } = await supabase.from("fiscal_entities").insert(data.fiscalEntity).select("id");
    if (error) throw new Error(`fiscal_entities: ${error.message}`);
    inserted.fiscal_entities = ins?.length || 0;
    entityId = ins?.[0]?.id || null;
  }

  // 2. Expenses (con entity_id si aplica)
  if (data.expenses.length) {
    const withEntity = data.expenses.map((e: any) => entityId ? { ...e, entity_id: entityId } : e);
    const { data: ins, error } = await supabase.from("expenses").insert(withEntity).select("id");
    if (error) throw new Error(`expenses: ${error.message}`);
    inserted.expenses = ins?.length || 0;
  }

  // 3. Income
  if (data.incomes.length) {
    const withEntity = data.incomes.map((i: any) => entityId ? { ...i, entity_id: entityId } : i);
    const { data: ins, error } = await supabase.from("income").insert(withEntity).select("id");
    if (error) throw new Error(`income: ${error.message}`);
    inserted.income = ins?.length || 0;
  }

  // 4. Bills
  if (data.bills.length) {
    const withEntity = data.bills.map((b: any) => entityId ? { ...b, entity_id: entityId } : b);
    const { data: ins, error } = await supabase.from("recurring_bills").insert(withEntity).select("id");
    if (error) throw new Error(`recurring_bills: ${error.message}`);
    inserted.recurring_bills = ins?.length || 0;
  }

  // 5. Bank transactions
  if (data.bankTxns.length) {
    const { data: ins, error } = await supabase.from("bank_transactions").insert(data.bankTxns).select("id");
    if (error) throw new Error(`bank_transactions: ${error.message}`);
    inserted.bank_transactions = ins?.length || 0;
  }

  // 6. Mileage
  if (data.mileage.length) {
    const withEntity = data.mileage.map((m: any) => entityId ? { ...m, entity_id: entityId } : m);
    const { data: ins, error } = await supabase.from("mileage").insert(withEntity).select("id");
    if (error) throw new Error(`mileage: ${error.message}`);
    inserted.mileage = ins?.length || 0;
  }

  // 7. Budgets
  if (data.budgets.length) {
    const withEntity = data.budgets.map((b: any) => entityId ? { ...b, entity_id: entityId } : b);
    const { data: ins, error } = await supabase.from("category_budgets").insert(withEntity).select("id");
    if (error) throw new Error(`category_budgets: ${error.message}`);
    inserted.category_budgets = ins?.length || 0;
  }

  // 8. Goals
  if (data.goals.length) {
    const { data: ins, error } = await supabase.from("savings_goals").insert(data.goals).select("id");
    if (error) throw new Error(`savings_goals: ${error.message}`);
    inserted.savings_goals = ins?.length || 0;
  }

  // 9. Liabilities
  if (data.liabilities.length) {
    const withEntity = data.liabilities.map((l: any) => entityId ? { ...l, entity_id: entityId } : l);
    const { data: ins, error } = await supabase.from("liabilities").insert(withEntity).select("id");
    if (error) throw new Error(`liabilities: ${error.message}`);
    inserted.liabilities = ins?.length || 0;
  }

  // 10. Tags
  if (data.tags.length) {
    const { data: ins, error } = await supabase.from("tags").insert(data.tags).select("id");
    if (error) throw new Error(`tags: ${error.message}`);
    inserted.tags = ins?.length || 0;
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

    const { data: roleRow } = await userClient
      .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);
    const body = (await req.json()) as ReqBody;
    const { action, scenario } = body;

    let result: unknown;
    if (action === "status") result = await statusDemo(adminClient, userId);
    else if (action === "reset") result = await resetDemo(adminClient, userId);
    else if (action === "seed") {
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
