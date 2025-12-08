import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Users,
  FolderKanban,
  FileText,
  Info
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface MissingDataAlertProps {
  type: 'no-clients' | 'no-projects' | 'no-contracts' | 'expense-needs-client' | 'expense-needs-project' | 'expense-needs-contract';
  clientName?: string;
  className?: string;
}

const ALERT_CONFIG = {
  'no-clients': {
    icon: Users,
    variant: 'warning' as const,
    title: { es: 'No tienes clientes configurados', en: 'No clients configured' },
    description: { 
      es: 'Agrega clientes para asociar gastos y generar reportes de reembolso.',
      en: 'Add clients to associate expenses and generate reimbursement reports.'
    },
    action: { es: 'Agregar cliente', en: 'Add client' },
    path: '/clients'
  },
  'no-projects': {
    icon: FolderKanban,
    variant: 'info' as const,
    title: { es: 'Organiza mejor con proyectos', en: 'Organize better with projects' },
    description: { 
      es: 'Crea proyectos para agrupar gastos e ingresos relacionados.',
      en: 'Create projects to group related expenses and income.'
    },
    action: { es: 'Crear proyecto', en: 'Create project' },
    path: '/settings?tab=projects'
  },
  'no-contracts': {
    icon: FileText,
    variant: 'info' as const,
    title: { es: 'Sube contratos para verificar reembolsos', en: 'Upload contracts to verify reimbursements' },
    description: { 
      es: 'Los contratos definen qué gastos puede reembolsar cada cliente.',
      en: 'Contracts define which expenses each client can reimburse.'
    },
    action: { es: 'Subir contrato', en: 'Upload contract' },
    path: '/contracts'
  },
  'expense-needs-client': {
    icon: Users,
    variant: 'warning' as const,
    title: { es: 'Asocia este gasto a un cliente', en: 'Associate this expense to a client' },
    description: { 
      es: 'Para incluirlo en reportes de reembolso, selecciona el cliente correspondiente.',
      en: 'To include it in reimbursement reports, select the corresponding client.'
    },
    action: { es: 'Ver clientes', en: 'View clients' },
    path: '/clients'
  },
  'expense-needs-project': {
    icon: FolderKanban,
    variant: 'info' as const,
    title: { es: 'Sin proyecto asignado', en: 'No project assigned' },
    description: { 
      es: 'Asignar un proyecto ayuda a organizar y reportar gastos por iniciativa.',
      en: 'Assigning a project helps organize and report expenses by initiative.'
    },
    action: { es: 'Crear proyecto', en: 'Create project' },
    path: '/settings?tab=projects'
  },
  'expense-needs-contract': {
    icon: FileText,
    variant: 'warning' as const,
    title: { es: 'Sin contrato para verificar reembolso', en: 'No contract to verify reimbursement' },
    description: { 
      es: 'Sin contrato no se pueden verificar los términos de reembolso del cliente.',
      en: 'Without a contract, client reimbursement terms cannot be verified.'
    },
    action: { es: 'Subir contrato', en: 'Upload contract' },
    path: '/contracts'
  }
};

export function MissingDataAlert({ type, clientName, className }: MissingDataAlertProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const config = ALERT_CONFIG[type];
  const Icon = config.icon;

  let description = config.description[language];
  if (clientName && type === 'expense-needs-contract') {
    description = language === 'es'
      ? `Sin contrato con ${clientName} no se pueden verificar los términos de reembolso.`
      : `Without a contract with ${clientName}, reimbursement terms cannot be verified.`;
  }

  return (
    <Alert 
      variant={config.variant === 'warning' ? 'destructive' : 'default'}
      className={className}
    >
      {config.variant === 'warning' ? (
        <AlertTriangle className="h-4 w-4" />
      ) : (
        <Info className="h-4 w-4" />
      )}
      <AlertTitle className="flex items-center justify-between">
        <span>{config.title[language]}</span>
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-sm mb-3">{description}</p>
        <Button
          size="sm"
          variant={config.variant === 'warning' ? 'default' : 'outline'}
          onClick={() => navigate(config.path)}
        >
          {config.action[language]}
          <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}
