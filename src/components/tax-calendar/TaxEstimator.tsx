import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProfile } from "@/hooks/data/useProfile";
import { useExpenses } from "@/hooks/data/useExpenses";
import { useIncome } from "@/hooks/data/useIncome";
import { useTaxCalculations } from "@/hooks/data/useTaxCalculations";
import { 
  Calculator, DollarSign, TrendingUp, TrendingDown, AlertTriangle, 
  Info, PieChart, BarChart3, Sparkles, FileText, Building2, Briefcase
} from "lucide-react";

const PROVINCES = [
  { code: 'ON', name: 'Ontario', rate: 0.0915, brackets: [{ limit: 51446, rate: 0.0505 }, { limit: 102894, rate: 0.0915 }, { limit: 150000, rate: 0.1116 }, { limit: 220000, rate: 0.1216 }, { limit: Infinity, rate: 0.1316 }] },
  { code: 'BC', name: 'British Columbia', rate: 0.0770, brackets: [{ limit: 47937, rate: 0.0506 }, { limit: 95875, rate: 0.077 }, { limit: 110076, rate: 0.105 }, { limit: 133664, rate: 0.1229 }, { limit: 181232, rate: 0.147 }, { limit: 252752, rate: 0.168 }, { limit: Infinity, rate: 0.205 }] },
  { code: 'AB', name: 'Alberta', rate: 0.10, brackets: [{ limit: 148269, rate: 0.10 }, { limit: 177922, rate: 0.12 }, { limit: 237230, rate: 0.13 }, { limit: 355845, rate: 0.14 }, { limit: Infinity, rate: 0.15 }] },
  { code: 'QC', name: 'Quebec', rate: 0.15, brackets: [{ limit: 51780, rate: 0.14 }, { limit: 103545, rate: 0.19 }, { limit: 126000, rate: 0.24 }, { limit: Infinity, rate: 0.2575 }] },
  { code: 'SK', name: 'Saskatchewan', rate: 0.105, brackets: [{ limit: 52057, rate: 0.105 }, { limit: 148734, rate: 0.125 }, { limit: Infinity, rate: 0.145 }] },
  { code: 'MB', name: 'Manitoba', rate: 0.108, brackets: [{ limit: 47000, rate: 0.108 }, { limit: 100000, rate: 0.1275 }, { limit: Infinity, rate: 0.174 }] },
  { code: 'NB', name: 'New Brunswick', rate: 0.0968, brackets: [{ limit: 49958, rate: 0.0968 }, { limit: 99916, rate: 0.1482 }, { limit: 185064, rate: 0.1652 }, { limit: Infinity, rate: 0.203 }] },
  { code: 'NS', name: 'Nova Scotia', rate: 0.0879, brackets: [{ limit: 29590, rate: 0.0879 }, { limit: 59180, rate: 0.1495 }, { limit: 93000, rate: 0.1667 }, { limit: 150000, rate: 0.175 }, { limit: Infinity, rate: 0.21 }] },
  { code: 'PE', name: 'Prince Edward Island', rate: 0.098, brackets: [{ limit: 32656, rate: 0.098 }, { limit: 64313, rate: 0.138 }, { limit: 105000, rate: 0.167 }, { limit: 140000, rate: 0.178 }, { limit: Infinity, rate: 0.19 }] },
  { code: 'NL', name: 'Newfoundland and Labrador', rate: 0.087, brackets: [{ limit: 43198, rate: 0.087 }, { limit: 86395, rate: 0.145 }, { limit: 154244, rate: 0.158 }, { limit: 215943, rate: 0.178 }, { limit: 275870, rate: 0.198 }, { limit: 551739, rate: 0.208 }, { limit: 1103478, rate: 0.213 }, { limit: Infinity, rate: 0.218 }] },
];

const FEDERAL_BRACKETS_2024 = [
  { limit: 55867, rate: 0.15 },
  { limit: 111733, rate: 0.205 },
  { limit: 173205, rate: 0.26 },
  { limit: 246752, rate: 0.29 },
  { limit: Infinity, rate: 0.33 }
];

export function TaxEstimator() {
  const { language } = useLanguage();
  const { data: profile } = useProfile();
  const { data: expenses } = useExpenses();
  const { data: income } = useIncome();
  const isEs = language === 'es';

  const workTypes = profile?.work_types || [];
  const [province, setProvince] = useState(profile?.province || 'ON');
  const [grossIncome, setGrossIncome] = useState('');
  const [businessExpenses, setBusinessExpenses] = useState('');
  const [rrspContribution, setRrspContribution] = useState('');
  const [taxWithheld, setTaxWithheld] = useState('');
  const [useAppData, setUseAppData] = useState(false);

  // Auto-populate from app data
  const appTotals = useMemo(() => {
    const totalIncome = (income || []).reduce((sum, i) => sum + Number(i.amount), 0);
    const totalExpenses = (expenses || []).reduce((sum, e) => sum + Number(e.amount), 0);
    const deductibleExpenses = (expenses || [])
      .filter(e => e.status === 'deductible')
      .reduce((sum, e) => sum + Number(e.amount), 0);
    
    return { totalIncome, totalExpenses, deductibleExpenses };
  }, [income, expenses]);

  const incomeValue = useAppData ? appTotals.totalIncome : (parseFloat(grossIncome) || 0);
  const expensesValue = useAppData ? appTotals.deductibleExpenses : (parseFloat(businessExpenses) || 0);
  const rrspValue = parseFloat(rrspContribution) || 0;
  const withheldValue = parseFloat(taxWithheld) || 0;

  const calculations = useMemo(() => {
    const taxableIncome = Math.max(0, incomeValue - expensesValue - rrspValue);
    
    // Federal tax calculation
    let federalTax = 0;
    let remaining = taxableIncome;
    let prevLimit = 0;
    
    for (const bracket of FEDERAL_BRACKETS_2024) {
      const taxableInBracket = Math.min(remaining, bracket.limit - prevLimit);
      if (taxableInBracket <= 0) break;
      federalTax += taxableInBracket * bracket.rate;
      remaining -= taxableInBracket;
      prevLimit = bracket.limit;
    }

    // Provincial tax calculation
    const selectedProvince = PROVINCES.find(p => p.code === province) || PROVINCES[0];
    let provincialTax = 0;
    remaining = taxableIncome;
    prevLimit = 0;
    
    for (const bracket of selectedProvince.brackets) {
      const taxableInBracket = Math.min(remaining, bracket.limit - prevLimit);
      if (taxableInBracket <= 0) break;
      provincialTax += taxableInBracket * bracket.rate;
      remaining -= taxableInBracket;
      prevLimit = bracket.limit;
    }

    // CPP/QPP for self-employed (both portions)
    const cppMaxEarnings = 68500;
    const cppExemption = 3500;
    const cppRate = 0.1175; // 5.95% x 2 for self-employed
    const cppPensionableEarnings = Math.min(Math.max(0, taxableIncome - cppExemption), cppMaxEarnings - cppExemption);
    const cppContribution = workTypes.includes('contractor') ? cppPensionableEarnings * cppRate : 0;

    // Basic Personal Amount credit
    const bpaCredit = 15705 * 0.15; // Federal BPA

    // Total tax
    const grossTax = federalTax + provincialTax + cppContribution - bpaCredit;
    const totalTax = Math.max(0, grossTax);
    
    // Refund or owing
    const netResult = withheldValue - totalTax;
    
    // Effective rate
    const effectiveRate = incomeValue > 0 ? (totalTax / incomeValue) * 100 : 0;
    const marginalRate = taxableIncome > 246752 ? 33 + (selectedProvince.brackets[selectedProvince.brackets.length - 1].rate * 100) :
                         taxableIncome > 173205 ? 29 + (selectedProvince.rate * 100) :
                         taxableIncome > 111733 ? 26 + (selectedProvince.rate * 100) :
                         taxableIncome > 55867 ? 20.5 + (selectedProvince.rate * 100) :
                         15 + (selectedProvince.rate * 100);

    return {
      taxableIncome,
      federalTax,
      provincialTax,
      cppContribution,
      bpaCredit,
      totalTax,
      netResult,
      effectiveRate,
      marginalRate,
      isRefund: netResult > 0
    };
  }, [incomeValue, expensesValue, rrspValue, withheldValue, province, workTypes]);

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <Alert className="bg-amber-500/10 border-amber-500/30">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <AlertTitle>{isEs ? "Aviso Legal Importante" : "Important Legal Notice"}</AlertTitle>
        <AlertDescription className="text-sm">
          {isEs 
            ? "Esta herramienta proporciona ESTIMACIONES aproximadas solo con fines educativos. NO constituye asesoramiento fiscal, financiero o legal. Los cálculos son simplificados y no incluyen todos los créditos, deducciones o circunstancias personales. SIEMPRE consulta con un contador profesional certificado (CPA) o preparador de impuestos autorizado para tu situación específica. EvoFinz no se hace responsable de decisiones basadas en estas estimaciones."
            : "This tool provides APPROXIMATE ESTIMATES for educational purposes only. It does NOT constitute tax, financial, or legal advice. Calculations are simplified and do not include all credits, deductions, or personal circumstances. ALWAYS consult with a certified professional accountant (CPA) or authorized tax preparer for your specific situation. EvoFinz is not responsible for decisions made based on these estimates."
          }
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              {isEs ? "Datos para Estimación" : "Estimation Data"}
            </CardTitle>
            <CardDescription>
              {isEs 
                ? "Ingresa tus datos para calcular una estimación aproximada"
                : "Enter your data to calculate an approximate estimate"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Use App Data Toggle */}
            {(appTotals.totalIncome > 0 || appTotals.deductibleExpenses > 0) && (
              <Alert className="bg-primary/10 border-primary/30">
                <Sparkles className="h-4 w-4 text-primary" />
                <AlertDescription className="flex items-center justify-between">
                  <span className="text-sm">
                    {isEs 
                      ? `Detectamos datos en tu app: $${appTotals.totalIncome.toLocaleString()} ingresos, $${appTotals.deductibleExpenses.toLocaleString()} deducciones`
                      : `We detected app data: $${appTotals.totalIncome.toLocaleString()} income, $${appTotals.deductibleExpenses.toLocaleString()} deductions`
                    }
                  </span>
                  <Button 
                    variant={useAppData ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setUseAppData(!useAppData)}
                  >
                    {useAppData ? (isEs ? "Usando" : "Using") : (isEs ? "Usar" : "Use")}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>{isEs ? "Provincia" : "Province"}</Label>
              <Select value={province} onValueChange={setProvince}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCES.map(p => (
                    <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{isEs ? "Ingreso Bruto Anual" : "Annual Gross Income"}</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="number"
                  placeholder="75000"
                  className="pl-9"
                  value={useAppData ? appTotals.totalIncome.toString() : grossIncome}
                  onChange={(e) => { setUseAppData(false); setGrossIncome(e.target.value); }}
                  disabled={useAppData}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {isEs ? "Incluye salarios, ingresos de negocio, inversiones" : "Include salary, business income, investments"}
              </p>
            </div>

            {(workTypes.includes('contractor') || workTypes.includes('corporation')) && (
              <div className="space-y-2">
                <Label>{isEs ? "Gastos de Negocio Deducibles" : "Deductible Business Expenses"}</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="number"
                    placeholder="15000"
                    className="pl-9"
                    value={useAppData ? appTotals.deductibleExpenses.toString() : businessExpenses}
                    onChange={(e) => { setUseAppData(false); setBusinessExpenses(e.target.value); }}
                    disabled={useAppData}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>{isEs ? "Contribución RRSP (Opcional)" : "RRSP Contribution (Optional)"}</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="number"
                  placeholder="5000"
                  className="pl-9"
                  value={rrspContribution}
                  onChange={(e) => setRrspContribution(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{isEs ? "Impuestos Ya Retenidos (del T4, instalments, etc.)" : "Taxes Already Withheld (from T4, instalments, etc.)"}</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="number"
                  placeholder="12000"
                  className="pl-9"
                  value={taxWithheld}
                  onChange={(e) => setTaxWithheld(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {isEs 
                  ? "Box 22 de tu T4, o pagos de instalments realizados"
                  : "Box 22 from your T4, or instalment payments made"
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card className={calculations.isRefund ? "border-green-500/30" : "border-red-500/30"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {calculations.isRefund 
                ? <TrendingUp className="h-5 w-5 text-green-500" />
                : <TrendingDown className="h-5 w-5 text-red-500" />
              }
              {isEs ? "Resultado Estimado" : "Estimated Result"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main Result */}
            <div className={`p-4 rounded-lg text-center ${calculations.isRefund ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              <p className="text-sm text-muted-foreground mb-1">
                {calculations.isRefund 
                  ? (isEs ? "Reembolso Estimado" : "Estimated Refund")
                  : (isEs ? "Impuesto a Pagar Estimado" : "Estimated Tax Owing")
                }
              </p>
              <p className={`text-4xl font-bold ${calculations.isRefund ? 'text-green-500' : 'text-red-500'}`}>
                ${Math.abs(calculations.netResult).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>

            {/* Breakdown */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{isEs ? "Ingreso Gravable" : "Taxable Income"}</span>
                <span className="font-medium">${calculations.taxableIncome.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{isEs ? "Impuesto Federal" : "Federal Tax"}</span>
                <span className="font-medium">${calculations.federalTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{isEs ? "Impuesto Provincial" : "Provincial Tax"}</span>
                <span className="font-medium">${calculations.provincialTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              {calculations.cppContribution > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">CPP (Self-Employed)</span>
                  <span className="font-medium">${calculations.cppContribution.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-green-600">
                <span>BPA Credit</span>
                <span>-${calculations.bpaCredit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <hr />
              <div className="flex justify-between text-sm font-medium">
                <span>{isEs ? "Total Impuestos" : "Total Tax"}</span>
                <span>${calculations.totalTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{isEs ? "Ya Pagado/Retenido" : "Already Paid/Withheld"}</span>
                <span className="font-medium">-${withheldValue.toLocaleString()}</span>
              </div>
            </div>

            {/* Rates */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 border rounded-lg text-center">
                <p className="text-xs text-muted-foreground">{isEs ? "Tasa Efectiva" : "Effective Rate"}</p>
                <p className="text-lg font-bold">{calculations.effectiveRate.toFixed(1)}%</p>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <p className="text-xs text-muted-foreground">{isEs ? "Tasa Marginal" : "Marginal Rate"}</p>
                <p className="text-lg font-bold">{calculations.marginalRate.toFixed(1)}%</p>
              </div>
            </div>

            {/* Tips */}
            {calculations.totalTax > 0 && (
              <Alert className="bg-blue-500/10 border-blue-500/30">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-sm">
                  {isEs ? (
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Contribuir más a RRSP reduciría tu ingreso gravable</li>
                      <li>Revisa si tienes todos los gastos de negocio registrados</li>
                      <li>Consulta créditos fiscales disponibles (medical, childcare, etc.)</li>
                    </ul>
                  ) : (
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Contributing more to RRSP would reduce taxable income</li>
                      <li>Check if all business expenses are recorded</li>
                      <li>Review available tax credits (medical, childcare, etc.)</li>
                    </ul>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {isEs ? "Información Importante" : "Important Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="notincluded">
            <TabsList>
              <TabsTrigger value="notincluded">{isEs ? "No Incluido" : "Not Included"}</TabsTrigger>
              <TabsTrigger value="wheretofind">{isEs ? "Dónde Encontrar" : "Where to Find"}</TabsTrigger>
              <TabsTrigger value="nextsteps">{isEs ? "Próximos Pasos" : "Next Steps"}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="notincluded" className="space-y-2 text-sm">
              <p className="font-medium text-muted-foreground">
                {isEs ? "Esta estimación NO incluye:" : "This estimate does NOT include:"}
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>{isEs ? "Créditos por hijos (CCB, Child Care)" : "Child credits (CCB, Child Care)"}</li>
                <li>{isEs ? "Créditos médicos" : "Medical credits"}</li>
                <li>{isEs ? "Créditos de matrícula/educación" : "Tuition/education credits"}</li>
                <li>{isEs ? "Créditos por donaciones" : "Donation credits"}</li>
                <li>{isEs ? "Deducciones específicas por industria" : "Industry-specific deductions"}</li>
                <li>{isEs ? "Input Tax Credits (ITC) de GST/HST" : "GST/HST Input Tax Credits (ITC)"}</li>
                <li>{isEs ? "Pérdidas de años anteriores" : "Prior year losses"}</li>
              </ul>
            </TabsContent>
            
            <TabsContent value="wheretofind" className="space-y-2 text-sm">
              <p className="font-medium text-muted-foreground">
                {isEs ? "Dónde encontrar la información necesaria:" : "Where to find necessary information:"}
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>T4:</strong> {isEs ? "Tu empleador te lo envía en febrero" : "Your employer sends it in February"}</li>
                <li><strong>T5:</strong> {isEs ? "Bancos e inversiones te los envían" : "Banks and investments send these"}</li>
                <li><strong>RRSP:</strong> {isEs ? "Tu institución financiera te envía recibos" : "Your financial institution sends receipts"}</li>
                <li><strong>CRA My Account:</strong> {isEs ? "Historial de declaraciones y NOAs" : "Filing history and NOAs"}</li>
                <li><strong>Notice of Assessment:</strong> {isEs ? "CRA te lo envía después de declarar" : "CRA sends after filing"}</li>
              </ul>
            </TabsContent>
            
            <TabsContent value="nextsteps" className="space-y-2 text-sm">
              <p className="font-medium text-muted-foreground">
                {isEs ? "Pasos recomendados:" : "Recommended steps:"}
              </p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>{isEs ? "Reúne todos tus documentos fiscales (T4, T5, recibos)" : "Gather all tax documents (T4, T5, receipts)"}</li>
                <li>{isEs ? "Usa esta estimación como referencia inicial" : "Use this estimate as initial reference"}</li>
                <li>{isEs ? "Consulta con un contador para situaciones complejas" : "Consult an accountant for complex situations"}</li>
                <li>{isEs ? "Considera software certificado por CRA para declarar" : "Consider CRA-certified software for filing"}</li>
                <li>{isEs ? "Declara antes de la fecha límite para evitar penalidades" : "File before deadline to avoid penalties"}</li>
              </ol>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
