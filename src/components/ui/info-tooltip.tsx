import * as React from "react";
import { HelpCircle, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface InfoTooltipProps {
  title: string;
  description: string;
  howToUse?: string;
  children?: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  variant?: "icon" | "wrapper";
  className?: string;
}

export function InfoTooltip({
  title,
  description,
  howToUse,
  children,
  side = "top",
  variant = "icon",
  className,
}: InfoTooltipProps) {
  const content = (
    <div className="max-w-xs space-y-2">
      <div className="font-semibold text-sm">{title}</div>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      {howToUse && (
        <div className="pt-1 border-t border-border/50">
          <p className="text-xs text-primary/80 flex items-start gap-1.5">
            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span>{howToUse}</span>
          </p>
        </div>
      )}
    </div>
  );

  if (variant === "wrapper" && children) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} className="p-3">
          {content}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center justify-center rounded-full p-0.5 text-muted-foreground/60 hover:text-muted-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            className
          )}
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} className="p-3">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

// Pre-configured tooltips for common sections
export const TOOLTIP_CONTENT = {
  // ========== COMMON ACTIONS ==========
  editAction: {
    title: "Editar",
    description: "Abre el formulario de edición para modificar este elemento.",
    howToUse: "Los cambios se guardan al confirmar el formulario.",
  },
  deleteAction: {
    title: "Eliminar",
    description: "Elimina permanentemente este elemento. Esta acción no se puede deshacer.",
    howToUse: "Se te pedirá confirmación antes de eliminar.",
  },

  // ========== DASHBOARD ==========
  monthlyTotal: {
    title: "Total Mensual",
    description: "Suma de todos los gastos registrados en el mes actual, sin importar su estado de clasificación.",
    howToUse: "Usa los filtros arriba para ver totales por cliente o categoría específica.",
  },
  totalExpenses: {
    title: "Total de Registros",
    description: "Cantidad total de gastos registrados en el sistema que coinciden con los filtros activos.",
    howToUse: "Haz clic en 'Gastos' en el menú para ver el listado completo.",
  },
  pendingDocs: {
    title: "Documentos Pendientes",
    description: "Gastos que aún no han sido clasificados o necesitan revisión antes de poder ser incluidos en reportes fiscales.",
    howToUse: "Revísalos cuanto antes para mantener tu contabilidad al día.",
  },
  billableExpenses: {
    title: "Gastos Facturables",
    description: "Gastos marcados como reembolsables por un cliente, listos para incluir en tu próxima factura.",
    howToUse: "Genera el reporte de reembolsos para enviarlo a tu cliente.",
  },
  chartsTab: {
    title: "Gráficos de Análisis",
    description: "Visualización de tus gastos por categoría, cliente y tendencia mensual.",
    howToUse: "Pasa el mouse sobre los gráficos para ver detalles específicos.",
  },
  taxTab: {
    title: "Análisis Fiscal CRA",
    description: "Resumen de deducciones fiscales calculadas según las reglas del CRA de Canadá.",
    howToUse: "Usa esta información para preparar tu declaración T2125.",
  },
  mileageTab: {
    title: "Kilometraje Deducible",
    description: "Seguimiento de viajes de negocio para deducciones por uso de vehículo según tasas CRA 2024.",
    howToUse: "Registra cada viaje de trabajo para maximizar tus deducciones.",
  },
  exportButton: {
    title: "Exportar Datos",
    description: "Descarga tus gastos en formato Excel o CSV, incluyendo el reporte T2125 para el CRA.",
    howToUse: "Selecciona el formato y rango de fechas en el diálogo de exportación.",
  },

  // ========== EXPENSES ==========
  quickCapture: {
    title: "Captura Rápida con IA",
    description: "Sube una foto de recibo, usa tu voz o escribe para registrar gastos automáticamente con inteligencia artificial.",
    howToUse: "La IA extraerá automáticamente el monto, fecha, vendedor y categoría.",
  },
  addExpense: {
    title: "Agregar Gasto Manual",
    description: "Formulario completo para registrar un gasto con todos los detalles manualmente.",
    howToUse: "Usa esto cuando prefieras control total sobre la información ingresada.",
  },
  reimbursementReport: {
    title: "Reporte de Reembolsos",
    description: "Genera un informe de gastos reembolsables agrupados por cliente para facturación.",
    howToUse: "Filtra por fecha para generar reportes de períodos específicos.",
  },
  expenseFilters: {
    title: "Filtros de Búsqueda",
    description: "Filtra gastos por categoría, cliente, estado, fecha o texto de búsqueda.",
    howToUse: "Combina múltiples filtros para encontrar gastos específicos rápidamente.",
  },

  // ========== CHAOS INBOX ==========
  chaosInbox: {
    title: "Bandeja Inteligente",
    description: "Sube documentos sin organizar - la IA los clasificará y extraerá la información automáticamente.",
    howToUse: "Arrastra múltiples archivos para procesamiento masivo.",
  },
  chaosInboxUpload: {
    title: "Subir Documentos",
    description: "Arrastra archivos o haz clic para subir recibos, facturas, emails y cualquier documento.",
    howToUse: "La IA clasificará automáticamente cada documento y extraerá la información relevante.",
  },
  chaosInboxStatus: {
    title: "Estado del Documento",
    description: "Indica si el documento está pendiente de procesar, clasificado o archivado.",
    howToUse: "Los documentos 'pendientes' serán procesados por la IA próximamente.",
  },

  // ========== CLIENTS ==========
  clients: {
    title: "Administración de Clientes",
    description: "Gestiona la información de tus clientes para asociar gastos y generar reportes de reembolso.",
    howToUse: "Cada cliente puede tener su propio perfil de facturación.",
  },
  addClient: {
    title: "Agregar Cliente",
    description: "Crea un nuevo perfil de cliente para asociar gastos y generar reportes de reembolso.",
    howToUse: "Incluye información de contacto, industria y tipo de cliente.",
  },

  // ========== TAGS ==========
  tags: {
    title: "Sistema de Etiquetas",
    description: "Crea etiquetas personalizadas para organizar y filtrar tus gastos de forma flexible.",
    howToUse: "Asigna múltiples etiquetas a cada gasto para mejor organización.",
  },
  createTag: {
    title: "Crear Etiqueta",
    description: "Crea etiquetas personalizadas con colores para organizar tus gastos.",
    howToUse: "Elige un color que represente el tipo de etiqueta (rojo = urgente, verde = pagado).",
  },

  // ========== CONTRACTS ==========
  contracts: {
    title: "Contratos y Acuerdos",
    description: "Almacena contratos, emails y acuerdos de reembolso que respalden tus deducciones.",
    howToUse: "Sube PDFs, imágenes o cualquier documento relacionado.",
  },
  uploadContract: {
    title: "Subir Contrato o Acuerdo",
    description: "Sube PDFs, imágenes o cualquier documento que respalde tus términos de reembolso.",
    howToUse: "Puedes subir contratos formales, emails de confirmación o cualquier acuerdo escrito.",
  },

  // ========== MILEAGE ==========
  mileage: {
    title: "Registro de Kilometraje",
    description: "Registra viajes de negocio para deducciones por uso de vehículo con tasas CRA 2024.",
    howToUse: "Ingresa ruta, kilómetros y propósito de cada viaje.",
  },
  addTrip: {
    title: "Registrar Viaje",
    description: "Añade un viaje de negocio para calcular deducciones por kilometraje según tasas CRA.",
    howToUse: "Ingresa origen, destino, kilómetros y propósito del viaje.",
  },
  yearSelector: {
    title: "Seleccionar Año",
    description: "Filtra los registros de kilometraje por año fiscal.",
    howToUse: "El CRA requiere registros separados por año para el cálculo de deducciones.",
  },
  mileageTripsTab: {
    title: "Viajes Registrados",
    description: "Lista detallada de todos los viajes de negocio con kilometraje y deducciones.",
    howToUse: "Haz clic en un viaje para editarlo o eliminarlo.",
  },
  mileageSummaryTab: {
    title: "Resumen Anual",
    description: "Totales de kilometraje, deducciones y créditos ITC calculados según tasas CRA 2024.",
    howToUse: "Usa estos datos para tu declaración T2125.",
  },

  // ========== RECONCILIATION ==========
  reconciliation: {
    title: "Conciliación Bancaria",
    description: "Compara tus gastos registrados con transacciones bancarias para detectar discrepancias.",
    howToUse: "Importa tu estado de cuenta para conciliación automática.",
  },
  reconciliationUpload: {
    title: "Importar Estado de Cuenta",
    description: "Sube tu estado bancario para comparar transacciones con gastos registrados.",
    howToUse: "Acepta formatos CSV, OFX y QFX de la mayoría de bancos.",
  },

  // ========== SETTINGS ==========
  settings: {
    title: "Configuración",
    description: "Personaliza tu perfil, preferencias fiscales, idioma y notificaciones.",
    howToUse: "Configura tu provincia para cálculos de impuestos precisos.",
  },
  languageSetting: {
    title: "Idioma de la Aplicación",
    description: "Cambia el idioma de toda la interfaz entre Español e Inglés.",
    howToUse: "El cambio se aplica inmediatamente a toda la aplicación.",
  },

  // ========== NAVIGATION ==========
  dashboard: {
    title: "Panel de Control",
    description: "Vista general de tus finanzas con estadísticas, gráficos y análisis fiscal.",
    howToUse: "Tu punto de partida para entender tu situación financiera.",
  },
  expenses: {
    title: "Gestión de Gastos",
    description: "Lista completa de todos tus gastos con herramientas de filtrado y edición.",
    howToUse: "Haz clic en cualquier gasto para editarlo o ver detalles.",
  },
} as const;
