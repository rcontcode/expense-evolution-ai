import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProfile } from "@/hooks/data/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { X, HelpCircle, Lightbulb, ExternalLink, Building2, User, Briefcase } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface TaxProfileSetupProps {
  onClose: () => void;
}

export function TaxProfileSetup({ onClose }: TaxProfileSetupProps) {
  const { language } = useLanguage();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const isEs = language === 'es';

  const [workTypes, setWorkTypes] = useState<string[]>(profile?.work_types || []);
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
  const [saving, setSaving] = useState(false);

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
      const fiscalYearEnd = `2024-${(parseInt(fiscalMonth) + 1).toString().padStart(2, '0')}-${fiscalDay.padStart(2, '0')}`;
      
      const { error } = await supabase
        .from('profiles')
        .update({
          work_types: workTypes as any,
          fiscal_year_end: fiscalYearEnd
        })
        .eq('id', profile?.id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(isEs ? "Perfil fiscal actualizado" : "Tax profile updated");
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(isEs ? "Error al actualizar perfil" : "Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-primary/30">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            {isEs ? "Configurar Perfil Fiscal" : "Configure Tax Profile"}
          </CardTitle>
          <CardDescription>
            {isEs 
              ? "Configura tu situación fiscal para ver las fechas correctas"
              : "Configure your tax situation to see the correct dates"
            }
          </CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Work Type Selection */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">
            {isEs ? "¿Cuál es tu situación laboral?" : "What is your work situation?"}
          </Label>
          <p className="text-sm text-muted-foreground">
            {isEs ? "Puedes seleccionar múltiples si aplica" : "You can select multiple if applicable"}
          </p>
          
          <div className="grid gap-4 md:grid-cols-3">
            {/* Employee */}
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                workTypes.includes('employee') ? 'border-blue-500 bg-blue-500/10' : 'hover:border-blue-500/50'
              }`}
              onClick={() => handleWorkTypeChange('employee', !workTypes.includes('employee'))}
            >
              <div className="flex items-start gap-3">
                <Checkbox 
                  checked={workTypes.includes('employee')}
                  onCheckedChange={(checked) => handleWorkTypeChange('employee', !!checked)}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{isEs ? "Empleado" : "Employee"}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isEs 
                      ? "Recibes T4 de un empleador"
                      : "You receive a T4 from an employer"
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Contractor / Sole Proprietor */}
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                workTypes.includes('contractor') ? 'border-amber-500 bg-amber-500/10' : 'hover:border-amber-500/50'
              }`}
              onClick={() => handleWorkTypeChange('contractor', !workTypes.includes('contractor'))}
            >
              <div className="flex items-start gap-3">
                <Checkbox 
                  checked={workTypes.includes('contractor')}
                  onCheckedChange={(checked) => handleWorkTypeChange('contractor', !!checked)}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-amber-500" />
                    <span className="font-medium">{isEs ? "Autónomo" : "Self-Employed"}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isEs 
                      ? "Sole proprietorship, freelancer, contratista"
                      : "Sole proprietorship, freelancer, contractor"
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Corporation */}
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                workTypes.includes('corporation') ? 'border-purple-500 bg-purple-500/10' : 'hover:border-purple-500/50'
              }`}
              onClick={() => handleWorkTypeChange('corporation', !workTypes.includes('corporation'))}
            >
              <div className="flex items-start gap-3">
                <Checkbox 
                  checked={workTypes.includes('corporation')}
                  onCheckedChange={(checked) => handleWorkTypeChange('corporation', !!checked)}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">{isEs ? "Corporación" : "Corporation"}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isEs 
                      ? "Empresa incorporada (Inc., Ltd., Corp.)"
                      : "Incorporated business (Inc., Ltd., Corp.)"
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fiscal Year End (for Corporation) */}
        {workTypes.includes('corporation') && (
          <div className="space-y-4">
            <Label className="text-base font-semibold">
              {isEs ? "Fin de Año Fiscal de tu Corporación" : "Corporation Fiscal Year End"}
            </Label>
            
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>{isEs ? "¿Dónde encuentro esto?" : "Where do I find this?"}</AlertTitle>
              <AlertDescription className="mt-2 space-y-2 text-sm">
                <p>{isEs 
                  ? "El fin de año fiscal está en:"
                  : "Your fiscal year end is found in:"
                }</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>{isEs ? "Articles of Incorporation (Certificado de Incorporación)" : "Articles of Incorporation"}</li>
                  <li>{isEs ? "Notice of Assessment de T2 anterior" : "Previous T2 Notice of Assessment"}</li>
                  <li>{isEs ? "CRA My Business Account" : "CRA My Business Account"}</li>
                </ul>
                <Button variant="link" size="sm" className="h-auto p-0" asChild>
                  <a href="https://www.canada.ca/en/revenue-agency/services/e-services/e-services-businesses/business-account.html" target="_blank" rel="noopener">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    {isEs ? "Acceder a CRA My Business Account" : "Access CRA My Business Account"}
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
                    <SelectItem value="0">{isEs ? "Enero" : "January"}</SelectItem>
                    <SelectItem value="1">{isEs ? "Febrero" : "February"}</SelectItem>
                    <SelectItem value="2">{isEs ? "Marzo" : "March"}</SelectItem>
                    <SelectItem value="3">{isEs ? "Abril" : "April"}</SelectItem>
                    <SelectItem value="4">{isEs ? "Mayo" : "May"}</SelectItem>
                    <SelectItem value="5">{isEs ? "Junio" : "June"}</SelectItem>
                    <SelectItem value="6">{isEs ? "Julio" : "July"}</SelectItem>
                    <SelectItem value="7">{isEs ? "Agosto" : "August"}</SelectItem>
                    <SelectItem value="8">{isEs ? "Septiembre" : "September"}</SelectItem>
                    <SelectItem value="9">{isEs ? "Octubre" : "October"}</SelectItem>
                    <SelectItem value="10">{isEs ? "Noviembre" : "November"}</SelectItem>
                    <SelectItem value="11">{isEs ? "Diciembre" : "December"}</SelectItem>
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

        {/* Not Sure Section */}
        <Alert className="bg-muted/50">
          <HelpCircle className="h-4 w-4" />
          <AlertTitle>{isEs ? "¿No estás seguro de tu situación?" : "Not sure about your situation?"}</AlertTitle>
          <AlertDescription className="mt-2 space-y-2 text-sm">
            <p>{isEs ? "Aquí está cómo investigar:" : "Here's how to find out:"}</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>{isEs ? "Revisa tu T4:" : "Check your T4:"}</strong>
                {isEs ? " Si recibes T4, eres empleado" : " If you receive a T4, you're an employee"}
              </li>
              <li>
                <strong>{isEs ? "Facturación propia:" : "Self-billing:"}</strong>
                {isEs ? " Si facturas directamente a clientes, eres autónomo" : " If you invoice clients directly, you're self-employed"}
              </li>
              <li>
                <strong>{isEs ? "Certificado de incorporación:" : "Incorporation certificate:"}</strong>
                {isEs ? " Si tienes uno, tienes una corporación" : " If you have one, you have a corporation"}
              </li>
            </ul>
            <div className="flex gap-2 mt-2">
              <Button variant="link" size="sm" className="h-auto p-0" asChild>
                <a href="https://www.canada.ca/en/revenue-agency/services/e-services/e-services-individuals/account-individuals.html" target="_blank" rel="noopener">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  CRA My Account
                </a>
              </Button>
            </div>
          </AlertDescription>
        </Alert>

        {/* Save Button */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {isEs ? "Cancelar" : "Cancel"}
          </Button>
          <Button onClick={handleSave} disabled={saving || workTypes.length === 0}>
            {saving ? (isEs ? "Guardando..." : "Saving...") : (isEs ? "Guardar" : "Save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
