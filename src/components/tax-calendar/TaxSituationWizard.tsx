import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProfile } from "@/hooks/data/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  X, HelpCircle, Lightbulb, ExternalLink, Building2, User, Briefcase, 
  ChevronRight, ChevronLeft, CheckCircle2, AlertTriangle, Search, 
  Calendar, DollarSign, FileText, Info
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface TaxSituationWizardProps {
  onClose: () => void;
  onComplete: () => void;
}

type WizardStep = 'situation' | 'details' | 'dates' | 'income' | 'summary';

export function TaxSituationWizard({ onClose, onComplete }: TaxSituationWizardProps) {
  const { language } = useLanguage();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const isEs = language === 'es';

  const [step, setStep] = useState<WizardStep>('situation');
  const [saving, setSaving] = useState(false);
  
  // Step 1: Basic situation
  const [knowsSituation, setKnowsSituation] = useState<boolean | null>(null);
  const [workTypes, setWorkTypes] = useState<string[]>(profile?.work_types || []);
  
  // Step 2: Details
  const [businessStartDate, setBusinessStartDate] = useState<string>(profile?.business_start_date || '');
  const [gstHstRegistered, setGstHstRegistered] = useState<boolean>(profile?.gst_hst_registered || false);
  const [businessNumber, setBusinessNumber] = useState<string>(profile?.business_number || '');
  
  // Step 3: Fiscal year
  const [fiscalMonth, setFiscalMonth] = useState<string>(
    profile?.fiscal_year_end 
      ? new Date(profile.fiscal_year_end).getMonth().toString() 
      : "11"
  );
  const [fiscalDay, setFiscalDay] = useState<string>(
    profile?.fiscal_year_end 
      ? new Date(profile.fiscal_year_end).getDate().toString() 
      : "31"
  );

  // Step 4: Income estimates (stored in localStorage for now)
  const [estimatedIncome, setEstimatedIncome] = useState<string>('');
  const [estimatedDeductions, setEstimatedDeductions] = useState<string>('');

  const steps: WizardStep[] = ['situation', 'details', 'dates', 'income', 'summary'];
  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleWorkTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setWorkTypes([...workTypes, type]);
    } else {
      setWorkTypes(workTypes.filter(t => t !== type));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fiscalYearEnd = workTypes.includes('corporation') 
        ? `2024-${(parseInt(fiscalMonth) + 1).toString().padStart(2, '0')}-${fiscalDay.padStart(2, '0')}`
        : null;
      
      const { error } = await supabase
        .from('profiles')
        .update({
          work_types: workTypes as any,
          fiscal_year_end: fiscalYearEnd,
          business_start_date: businessStartDate || null,
          gst_hst_registered: gstHstRegistered,
          business_number: businessNumber || null
        })
        .eq('id', profile?.id);

      if (error) throw error;

      // Save income estimates to localStorage
      if (estimatedIncome || estimatedDeductions) {
        localStorage.setItem('tax_estimates', JSON.stringify({
          income: estimatedIncome,
          deductions: estimatedDeductions,
          year: new Date().getFullYear()
        }));
      }

      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(isEs ? "Perfil fiscal actualizado" : "Tax profile updated");
      onComplete();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(isEs ? "Error al actualizar perfil" : "Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 'situation':
        return knowsSituation !== null && (knowsSituation ? workTypes.length > 0 : true);
      case 'details':
        return true;
      case 'dates':
        return true;
      case 'income':
        return true;
      case 'summary':
        return workTypes.length > 0;
      default:
        return true;
    }
  };

  const nextStep = () => {
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) {
      setStep(steps[idx + 1]);
    }
  };

  const prevStep = () => {
    const idx = steps.indexOf(step);
    if (idx > 0) {
      setStep(steps[idx - 1]);
    }
  };

  return (
    <Card className="border-primary/30">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            {isEs ? "Asistente de Configuración Fiscal" : "Tax Setup Wizard"}
          </CardTitle>
          <CardDescription>
            {isEs 
              ? "Te ayudaremos a determinar tu situación fiscal paso a paso"
              : "We'll help you determine your tax situation step by step"
            }
          </CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{isEs ? `Paso ${currentStepIndex + 1} de ${steps.length}` : `Step ${currentStepIndex + 1} of ${steps.length}`}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Disclaimer */}
        <Alert className="bg-amber-500/10 border-amber-500/30">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-xs">
            {isEs 
              ? "⚠️ AVISO: Esta información es solo orientativa. Para asesoría fiscal profesional, consulta con un contador certificado (CPA). Las leyes fiscales cambian y cada situación es única."
              : "⚠️ DISCLAIMER: This information is for guidance only. For professional tax advice, consult a certified accountant (CPA). Tax laws change and every situation is unique."
            }
          </AlertDescription>
        </Alert>

        {/* Step Content */}
        {step === 'situation' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                {isEs ? "¿Conoces tu situación fiscal?" : "Do you know your tax situation?"}
              </Label>
              
              <RadioGroup 
                value={knowsSituation === null ? '' : knowsSituation ? 'yes' : 'no'}
                onValueChange={(v) => setKnowsSituation(v === 'yes')}
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="yes" id="knows-yes" />
                  <Label htmlFor="knows-yes" className="flex-1 cursor-pointer">
                    {isEs ? "Sí, sé qué tipo de declaración debo hacer" : "Yes, I know what type of return I need to file"}
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="no" id="knows-no" />
                  <Label htmlFor="knows-no" className="flex-1 cursor-pointer">
                    {isEs ? "No estoy seguro, necesito ayuda" : "I'm not sure, I need help"}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {knowsSituation === true && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">
                  {isEs ? "Selecciona tu(s) situación(es):" : "Select your situation(s):"}
                </Label>
                <div className="grid gap-3">
                  <WorkTypeOption
                    type="employee"
                    icon={<User className="h-4 w-4 text-blue-500" />}
                    label={isEs ? "Empleado" : "Employee"}
                    description={isEs ? "Recibes T4, tu empleador deduce impuestos" : "You receive T4, employer withholds taxes"}
                    checked={workTypes.includes('employee')}
                    onChange={(checked) => handleWorkTypeChange('employee', checked)}
                    color="blue"
                  />
                  <WorkTypeOption
                    type="contractor"
                    icon={<Briefcase className="h-4 w-4 text-amber-500" />}
                    label={isEs ? "Autónomo / Sole Proprietorship" : "Self-Employed / Sole Proprietorship"}
                    description={isEs ? "Facturas a clientes, declaras T1 con Schedule T2125" : "Invoice clients, file T1 with Schedule T2125"}
                    checked={workTypes.includes('contractor')}
                    onChange={(checked) => handleWorkTypeChange('contractor', checked)}
                    color="amber"
                  />
                  <WorkTypeOption
                    type="corporation"
                    icon={<Building2 className="h-4 w-4 text-purple-500" />}
                    label={isEs ? "Corporación (Inc./Ltd./Corp.)" : "Corporation (Inc./Ltd./Corp.)"}
                    description={isEs ? "Empresa incorporada, declaras T2 corporativo" : "Incorporated business, file T2 corporate return"}
                    checked={workTypes.includes('corporation')}
                    onChange={(checked) => handleWorkTypeChange('corporation', checked)}
                    color="purple"
                  />
                </div>
              </div>
            )}

            {knowsSituation === false && (
              <HelpDetermineSection 
                language={language} 
                onDetermine={(types) => {
                  setWorkTypes(types);
                  setKnowsSituation(true);
                }} 
              />
            )}
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                {isEs ? "Detalles de tu negocio" : "Business Details"}
              </Label>

              {(workTypes.includes('contractor') || workTypes.includes('corporation')) && (
                <>
                  <div className="space-y-2">
                    <Label>{isEs ? "¿Cuándo comenzaste tu negocio?" : "When did you start your business?"}</Label>
                    <Input 
                      type="date" 
                      value={businessStartDate}
                      onChange={(e) => setBusinessStartDate(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {isEs 
                        ? "Importante: Si comenzaste este año, tu primer año fiscal será parcial"
                        : "Important: If you started this year, your first tax year will be partial"
                      }
                    </p>
                  </div>

                  {businessStartDate && new Date(businessStartDate).getFullYear() === new Date().getFullYear() && (
                    <Alert className="bg-blue-500/10 border-blue-500/30">
                      <Info className="h-4 w-4 text-blue-500" />
                      <AlertTitle>{isEs ? "Primer Año Fiscal Parcial" : "Partial First Tax Year"}</AlertTitle>
                      <AlertDescription className="text-sm">
                        {isEs 
                          ? `Tu negocio comenzó en ${new Date(businessStartDate).toLocaleDateString('es-CA', { month: 'long', year: 'numeric' })}. Tu primera declaración cubrirá solo desde esa fecha hasta el fin del año fiscal. Esto es normal y CRA lo entiende.`
                          : `Your business started in ${new Date(businessStartDate).toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })}. Your first return will cover only from that date to fiscal year end. This is normal and CRA understands this.`
                        }
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="gst-registered" 
                        checked={gstHstRegistered}
                        onCheckedChange={(checked) => setGstHstRegistered(!!checked)}
                      />
                      <Label htmlFor="gst-registered">
                        {isEs ? "Estoy registrado para GST/HST" : "I'm registered for GST/HST"}
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground pl-6">
                      {isEs 
                        ? "Obligatorio si facturaste más de $30,000 en los últimos 4 trimestres"
                        : "Required if you billed more than $30,000 in the last 4 quarters"
                      }
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>{isEs ? "Número de Negocio (BN) - Opcional" : "Business Number (BN) - Optional"}</Label>
                    <Input 
                      placeholder="123456789 RT0001"
                      value={businessNumber}
                      onChange={(e) => setBusinessNumber(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {isEs 
                        ? "9 dígitos + programa (RT para GST/HST). Encuéntralo en tu carta de confirmación de CRA"
                        : "9 digits + program (RT for GST/HST). Find it on your CRA confirmation letter"
                      }
                    </p>
                  </div>
                </>
              )}

              {!workTypes.includes('contractor') && !workTypes.includes('corporation') && workTypes.includes('employee') && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription>
                    {isEs 
                      ? "Como empleado, tu situación es más simple. Tu empleador deduce impuestos automáticamente. Solo necesitas declarar antes del 30 de abril."
                      : "As an employee, your situation is simpler. Your employer withholds taxes automatically. You just need to file by April 30."
                    }
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}

        {step === 'dates' && (
          <div className="space-y-6">
            {workTypes.includes('corporation') && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">
                  {isEs ? "Fin de Año Fiscal de tu Corporación" : "Corporation Fiscal Year End"}
                </Label>
                
                <Alert>
                  <Search className="h-4 w-4" />
                  <AlertTitle>{isEs ? "¿Dónde encuentro esta fecha?" : "Where do I find this date?"}</AlertTitle>
                  <AlertDescription className="mt-2 space-y-3 text-sm">
                    <div className="space-y-2">
                      <p className="font-medium">{isEs ? "Busca en:" : "Look in:"}</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>
                          <strong>Articles of Incorporation</strong>
                          {isEs ? " - El documento que recibiste cuando incorporaste" : " - The document you received when incorporating"}
                        </li>
                        <li>
                          <strong>Notice of Assessment (T2)</strong>
                          {isEs ? " - Si ya declaraste antes, CRA te envió esto" : " - If you filed before, CRA sent you this"}
                        </li>
                        <li>
                          <strong>CRA My Business Account</strong>
                          {isEs ? " - En la sección 'Corporation income tax'" : " - In the 'Corporation income tax' section"}
                        </li>
                      </ul>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href="https://www.canada.ca/en/revenue-agency/services/e-services/e-services-businesses/business-account.html" target="_blank" rel="noopener">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        {isEs ? "Ir a CRA My Business Account" : "Go to CRA My Business Account"}
                      </a>
                    </Button>
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isEs ? "Mes" : "Month"}</Label>
                    <Select value={fiscalMonth} onValueChange={setFiscalMonth}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((month, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {isEs ? month : ['January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'][i]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{isEs ? "Día" : "Day"}</Label>
                    <Select value={fiscalDay} onValueChange={setFiscalDay}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 31 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {!workTypes.includes('corporation') && (
              <Alert>
                <Calendar className="h-4 w-4 text-green-500" />
                <AlertTitle>{isEs ? "Año Fiscal = Año Calendario" : "Fiscal Year = Calendar Year"}</AlertTitle>
                <AlertDescription>
                  {isEs 
                    ? "Para empleados y sole proprietors, el año fiscal siempre termina el 31 de diciembre. No necesitas configurar nada especial."
                    : "For employees and sole proprietors, the fiscal year always ends December 31. You don't need to configure anything special."
                  }
                </AlertDescription>
              </Alert>
            )}

            {/* Key Dates Summary */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">{isEs ? "Tus Fechas Clave" : "Your Key Dates"}</Label>
              <div className="grid gap-2">
                {workTypes.includes('employee') && (
                  <DateCard 
                    date="30 Abril / April 30"
                    title={isEs ? "Impuestos Personales (T1)" : "Personal Taxes (T1)"}
                    description={isEs ? "Fecha límite para declarar Y pagar" : "Deadline to file AND pay"}
                    color="blue"
                  />
                )}
                {workTypes.includes('contractor') && (
                  <>
                    <DateCard 
                      date="15 Junio / June 15"
                      title={isEs ? "Declaración T1 (Autónomo)" : "T1 Filing (Self-Employed)"}
                      description={isEs ? "Fecha límite para DECLARAR" : "Deadline to FILE"}
                      color="amber"
                    />
                    <DateCard 
                      date="30 Abril / April 30"
                      title={isEs ? "Pago de Impuestos" : "Tax Payment"}
                      description={isEs ? "Fecha límite para PAGAR (aunque declares en junio)" : "Deadline to PAY (even if you file in June)"}
                      color="red"
                    />
                  </>
                )}
                {workTypes.includes('corporation') && (
                  <DateCard 
                    date={isEs ? "6 meses después de fin fiscal" : "6 months after fiscal year end"}
                    title={isEs ? "Declaración T2 (Corporación)" : "T2 Filing (Corporation)"}
                    description={isEs ? "Ejemplo: Si terminas dic 31, declaras antes de junio 30" : "Example: If you end Dec 31, file by June 30"}
                    color="purple"
                  />
                )}
                {gstHstRegistered && (
                  <DateCard 
                    date={isEs ? "Trimestral o Anual" : "Quarterly or Annual"}
                    title="GST/HST"
                    description={isEs ? "Depende de tu período de reporte elegido" : "Depends on your chosen reporting period"}
                    color="green"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {step === 'income' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                {isEs ? "Estimaciones para Proyección de Impuestos" : "Estimates for Tax Projection"}
              </Label>
              <p className="text-sm text-muted-foreground">
                {isEs 
                  ? "Opcional: Ingresa estimaciones para calcular una proyección aproximada de impuestos"
                  : "Optional: Enter estimates to calculate an approximate tax projection"
                }
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{isEs ? "Ingreso Bruto Estimado (anual)" : "Estimated Gross Income (annual)"}</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="number"
                      placeholder="50000"
                      className="pl-9"
                      value={estimatedIncome}
                      onChange={(e) => setEstimatedIncome(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{isEs ? "Deducciones Estimadas (anual)" : "Estimated Deductions (annual)"}</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="number"
                      placeholder="10000"
                      className="pl-9"
                      value={estimatedDeductions}
                      onChange={(e) => setEstimatedDeductions(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isEs 
                      ? "Incluye gastos de negocio, RRSP, deducciones por home office, etc."
                      : "Include business expenses, RRSP, home office deductions, etc."
                    }
                  </p>
                </div>
              </div>

              {estimatedIncome && (
                <TaxEstimatePreview 
                  income={parseFloat(estimatedIncome) || 0}
                  deductions={parseFloat(estimatedDeductions) || 0}
                  workTypes={workTypes}
                  language={language}
                />
              )}
            </div>
          </div>
        )}

        {step === 'summary' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                {isEs ? "Resumen de tu Configuración" : "Your Configuration Summary"}
              </Label>

              <div className="grid gap-3">
                <div className="p-3 border rounded-lg">
                  <p className="text-sm text-muted-foreground">{isEs ? "Tipo de Trabajo" : "Work Type"}</p>
                  <div className="flex gap-2 mt-1">
                    {workTypes.map(type => (
                      <Badge key={type} variant="secondary">
                        {type === 'employee' ? (isEs ? 'Empleado' : 'Employee') :
                         type === 'contractor' ? (isEs ? 'Autónomo' : 'Self-Employed') :
                         type === 'corporation' ? (isEs ? 'Corporación' : 'Corporation') : type}
                      </Badge>
                    ))}
                  </div>
                </div>

                {businessStartDate && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">{isEs ? "Inicio del Negocio" : "Business Start"}</p>
                    <p className="font-medium">{new Date(businessStartDate).toLocaleDateString()}</p>
                  </div>
                )}

                {workTypes.includes('corporation') && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">{isEs ? "Fin de Año Fiscal" : "Fiscal Year End"}</p>
                    <p className="font-medium">
                      {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][parseInt(fiscalMonth)]} {fiscalDay}
                    </p>
                  </div>
                )}

                <div className="p-3 border rounded-lg">
                  <p className="text-sm text-muted-foreground">GST/HST</p>
                  <p className="font-medium">
                    {gstHstRegistered 
                      ? (isEs ? '✅ Registrado' : '✅ Registered')
                      : (isEs ? '❌ No registrado' : '❌ Not registered')
                    }
                  </p>
                </div>
              </div>

              <Alert className="bg-amber-500/10 border-amber-500/30">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertTitle>{isEs ? "Recordatorio Importante" : "Important Reminder"}</AlertTitle>
                <AlertDescription className="text-sm">
                  {isEs 
                    ? "Esta configuración es para referencia. Siempre verifica las fechas oficiales en CRA y consulta con un contador profesional para tu situación específica."
                    : "This configuration is for reference. Always verify official dates with CRA and consult a professional accountant for your specific situation."
                  }
                </AlertDescription>
              </Alert>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={step === 'situation' ? onClose : prevStep}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {step === 'situation' ? (isEs ? 'Cancelar' : 'Cancel') : (isEs ? 'Anterior' : 'Previous')}
          </Button>
          
          {step === 'summary' ? (
            <Button onClick={handleSave} disabled={saving || !canProceed()}>
              {saving ? (isEs ? "Guardando..." : "Saving...") : (isEs ? "Guardar Configuración" : "Save Configuration")}
              <CheckCircle2 className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={nextStep} disabled={!canProceed()}>
              {isEs ? "Siguiente" : "Next"}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper Components
function WorkTypeOption({ 
  type, icon, label, description, checked, onChange, color 
}: { 
  type: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  color: string;
}) {
  return (
    <div 
      className={`p-4 border rounded-lg cursor-pointer transition-all ${
        checked ? `border-${color}-500 bg-${color}-500/10` : `hover:border-${color}-500/50`
      }`}
      onClick={() => onChange(!checked)}
    >
      <div className="flex items-start gap-3">
        <Checkbox checked={checked} onCheckedChange={onChange} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium">{label}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}

function DateCard({ date, title, description, color }: {
  date: string;
  title: string;
  description: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'border-blue-500/30 bg-blue-500/5',
    amber: 'border-amber-500/30 bg-amber-500/5',
    purple: 'border-purple-500/30 bg-purple-500/5',
    green: 'border-green-500/30 bg-green-500/5',
    red: 'border-red-500/30 bg-red-500/5'
  };

  return (
    <div className={`p-3 border rounded-lg ${colorClasses[color]}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Badge variant="secondary">{date}</Badge>
      </div>
    </div>
  );
}

function HelpDetermineSection({ language, onDetermine }: { language: string; onDetermine: (types: string[]) => void }) {
  const isEs = language === 'es';
  const [answers, setAnswers] = useState<Record<string, boolean>>({});

  const questions = [
    { key: 'hasT4', question: isEs ? '¿Recibes T4 de un empleador?' : 'Do you receive a T4 from an employer?' },
    { key: 'invoicesClients', question: isEs ? '¿Facturas directamente a clientes?' : 'Do you invoice clients directly?' },
    { key: 'hasIncorporation', question: isEs ? '¿Tienes certificado de incorporación (Inc., Ltd., Corp.)?' : 'Do you have incorporation certificate (Inc., Ltd., Corp.)?' },
  ];

  const determineTypes = () => {
    const types: string[] = [];
    if (answers.hasT4) types.push('employee');
    if (answers.invoicesClients && !answers.hasIncorporation) types.push('contractor');
    if (answers.hasIncorporation) types.push('corporation');
    return types;
  };

  return (
    <div className="space-y-4">
      <Alert>
        <Lightbulb className="h-4 w-4" />
        <AlertTitle>{isEs ? "Responde estas preguntas" : "Answer these questions"}</AlertTitle>
        <AlertDescription className="text-sm">
          {isEs 
            ? "Te ayudaremos a determinar tu situación fiscal basándonos en tus respuestas"
            : "We'll help determine your tax situation based on your answers"
          }
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        {questions.map(q => (
          <div key={q.key} className="flex items-center justify-between p-3 border rounded-lg">
            <span className="text-sm">{q.question}</span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant={answers[q.key] === true ? "default" : "outline"}
                onClick={() => setAnswers({...answers, [q.key]: true})}
              >
                {isEs ? "Sí" : "Yes"}
              </Button>
              <Button 
                size="sm" 
                variant={answers[q.key] === false ? "default" : "outline"}
                onClick={() => setAnswers({...answers, [q.key]: false})}
              >
                No
              </Button>
            </div>
          </div>
        ))}
      </div>

      {Object.keys(answers).length === questions.length && (
        <div className="space-y-3">
          <Alert className="bg-green-500/10 border-green-500/30">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle>{isEs ? "Tu situación parece ser:" : "Your situation appears to be:"}</AlertTitle>
            <AlertDescription>
              <div className="flex gap-2 mt-2">
                {determineTypes().map(type => (
                  <Badge key={type} variant="secondary">
                    {type === 'employee' ? (isEs ? 'Empleado' : 'Employee') :
                     type === 'contractor' ? (isEs ? 'Autónomo' : 'Self-Employed') :
                     type === 'corporation' ? (isEs ? 'Corporación' : 'Corporation') : type}
                  </Badge>
                ))}
                {determineTypes().length === 0 && (
                  <span className="text-sm text-muted-foreground">
                    {isEs ? "No se detectó ningún tipo. ¿Quizás eres inversor o no tienes ingresos?" : "No type detected. Maybe you're an investor or have no income?"}
                  </span>
                )}
              </div>
            </AlertDescription>
          </Alert>
          
          <Button onClick={() => onDetermine(determineTypes())} className="w-full">
            {isEs ? "Usar esta configuración" : "Use this configuration"}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      <Alert className="bg-muted/50">
        <Search className="h-4 w-4" />
        <AlertTitle>{isEs ? "¿Aún no estás seguro?" : "Still not sure?"}</AlertTitle>
        <AlertDescription className="text-sm space-y-2">
          <p>{isEs ? "Puedes verificar en:" : "You can verify at:"}</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>
              <a href="https://www.canada.ca/en/revenue-agency/services/e-services/e-services-individuals/account-individuals.html" 
                 target="_blank" 
                 rel="noopener"
                 className="text-primary hover:underline flex items-center gap-1">
                CRA My Account <ExternalLink className="h-3 w-3" />
              </a>
              {isEs ? " - Ve tu historial de declaraciones" : " - See your filing history"}
            </li>
            <li>{isEs ? "Tu contador o preparador de impuestos" : "Your accountant or tax preparer"}</li>
            <li>{isEs ? "Notice of Assessment de años anteriores" : "Previous years' Notice of Assessment"}</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}

function TaxEstimatePreview({ income, deductions, workTypes, language }: {
  income: number;
  deductions: number;
  workTypes: string[];
  language: string;
}) {
  const isEs = language === 'es';
  const taxableIncome = Math.max(0, income - deductions);
  
  // Simplified Canadian federal tax calculation (2024 brackets)
  const calculateFederalTax = (taxable: number) => {
    let tax = 0;
    const brackets = [
      { limit: 55867, rate: 0.15 },
      { limit: 111733, rate: 0.205 },
      { limit: 173205, rate: 0.26 },
      { limit: 246752, rate: 0.29 },
      { limit: Infinity, rate: 0.33 }
    ];
    
    let remaining = taxable;
    let prevLimit = 0;
    
    for (const bracket of brackets) {
      const taxableInBracket = Math.min(remaining, bracket.limit - prevLimit);
      if (taxableInBracket <= 0) break;
      tax += taxableInBracket * bracket.rate;
      remaining -= taxableInBracket;
      prevLimit = bracket.limit;
    }
    
    return tax;
  };

  // CPP/EI for self-employed
  const calculateSelfEmployedContributions = (income: number) => {
    const cppMax = 3867.50 * 2; // Both portions for self-employed
    const eiMax = 0; // Optional for self-employed
    const cpp = Math.min(income * 0.1175, cppMax);
    return { cpp, ei: eiMax };
  };

  const federalTax = calculateFederalTax(taxableIncome);
  const provincialTax = taxableIncome * 0.0915; // Ontario example
  const { cpp } = workTypes.includes('contractor') ? calculateSelfEmployedContributions(taxableIncome) : { cpp: 0 };
  
  const totalTax = federalTax + provincialTax + cpp;
  const effectiveRate = income > 0 ? (totalTax / income) * 100 : 0;

  return (
    <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        <span className="font-medium">{isEs ? "Estimación Aproximada" : "Approximate Estimate"}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground">{isEs ? "Ingreso Gravable" : "Taxable Income"}</p>
          <p className="font-medium">${taxableIncome.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{isEs ? "Impuesto Federal Est." : "Est. Federal Tax"}</p>
          <p className="font-medium">${federalTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{isEs ? "Impuesto Provincial Est." : "Est. Provincial Tax"}</p>
          <p className="font-medium">${provincialTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
        {workTypes.includes('contractor') && (
          <div>
            <p className="text-muted-foreground">CPP (Self-Employed)</p>
            <p className="font-medium">${cpp.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
        )}
      </div>

      <div className="pt-2 border-t">
        <div className="flex justify-between">
          <span className="font-medium">{isEs ? "Total Estimado" : "Total Estimated"}</span>
          <span className="font-bold text-lg">${totalTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {isEs ? `Tasa efectiva: ~${effectiveRate.toFixed(1)}%` : `Effective rate: ~${effectiveRate.toFixed(1)}%`}
        </p>
      </div>

      <Alert className="bg-amber-500/10 border-amber-500/30 py-2">
        <AlertDescription className="text-xs">
          {isEs 
            ? "⚠️ Esta es una estimación muy simplificada. Los impuestos reales dependen de muchos factores (provincia, créditos, etc.). Consulta un contador."
            : "⚠️ This is a very simplified estimate. Actual taxes depend on many factors (province, credits, etc.). Consult an accountant."
          }
        </AlertDescription>
      </Alert>
    </div>
  );
}
