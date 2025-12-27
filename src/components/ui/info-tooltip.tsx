import * as React from "react";
import { HelpCircle, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface TooltipText {
  es: { title: string; description: string; howToUse?: string };
  en: { title: string; description: string; howToUse?: string };
}

interface InfoTooltipProps {
  content: TooltipText;
  children?: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  variant?: "icon" | "wrapper";
  className?: string;
}

export function InfoTooltip({
  content,
  children,
  side = "top",
  variant = "icon",
  className,
}: InfoTooltipProps) {
  const { language } = useLanguage();
  const { title, description, howToUse } = content[language] || content.es;

  const tooltipContent = (
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
          {tooltipContent}
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
        {tooltipContent}
      </TooltipContent>
    </Tooltip>
  );
}

// Pre-configured bilingual tooltips
export const TOOLTIP_CONTENT = {
  // ========== COMMON ACTIONS ==========
  editAction: {
    es: {
      title: "Editar",
      description: "Abre el formulario de edición para modificar este elemento.",
      howToUse: "Los cambios se guardan al confirmar el formulario.",
    },
    en: {
      title: "Edit",
      description: "Opens the edit form to modify this item.",
      howToUse: "Changes are saved when you confirm the form.",
    },
  },
  deleteAction: {
    es: {
      title: "Eliminar",
      description: "Elimina permanentemente este elemento. Esta acción no se puede deshacer.",
      howToUse: "Se te pedirá confirmación antes de eliminar.",
    },
    en: {
      title: "Delete",
      description: "Permanently deletes this item. This action cannot be undone.",
      howToUse: "You'll be asked for confirmation before deleting.",
    },
  },

  // ========== DASHBOARD ==========
  dashboard: {
    es: {
      title: "Panel de Control",
      description: "Vista general de tus finanzas con estadísticas, gráficos y análisis fiscal.",
      howToUse: "Tu punto de partida para entender tu situación financiera.",
    },
    en: {
      title: "Dashboard",
      description: "Overview of your finances with statistics, charts and tax analysis.",
      howToUse: "Your starting point to understand your financial situation.",
    },
  },
  balanceCard: {
    es: {
      title: "Balance Financiero",
      description: "Muestra la diferencia entre tus ingresos totales y gastos del año actual. Un balance positivo indica que estás ahorrando dinero.",
      howToUse: "Mantén un balance positivo para cumplir tus metas de ahorro. Si es negativo, revisa tus gastos.",
    },
    en: {
      title: "Financial Balance",
      description: "Shows the difference between your total income and expenses for the current year. A positive balance indicates you're saving money.",
      howToUse: "Keep a positive balance to meet your savings goals. If negative, review your expenses.",
    },
  },
  profileCard: {
    es: {
      title: "Tu Perfil de Negocio",
      description: "Muestra tu información de negocio: tipo de trabajador, provincia y estado de GST/HST. Esto afecta los cálculos fiscales.",
      howToUse: "Haz clic en 'Editar' para actualizar tu información y mejorar las recomendaciones fiscales.",
    },
    en: {
      title: "Your Business Profile",
      description: "Shows your business info: worker type, province and GST/HST status. This affects tax calculations.",
      howToUse: "Click 'Edit' to update your info and improve tax recommendations.",
    },
  },
  completenessCard: {
    es: {
      title: "Completitud de Datos",
      description: "Indica qué porcentaje de tus gastos tienen toda la información necesaria para deducciones fiscales.",
      howToUse: "Intenta mantener arriba del 80% para reportes fiscales precisos.",
    },
    en: {
      title: "Data Completeness",
      description: "Shows what percentage of your expenses have all necessary information for tax deductions.",
      howToUse: "Try to keep above 80% for accurate tax reports.",
    },
  },
  workflowWidget: {
    es: {
      title: "Flujos de Trabajo",
      description: "Muestra el progreso en tus flujos de trabajo financieros: captura de gastos, facturación a clientes y preparación fiscal.",
      howToUse: "Haz clic en cualquier flujo para ver los pasos detallados.",
    },
    en: {
      title: "Workflows",
      description: "Shows progress on your financial workflows: expense capture, client billing, and tax preparation.",
      howToUse: "Click any workflow to see detailed steps.",
    },
  },
  filtersPanel: {
    es: {
      title: "Filtros del Dashboard",
      description: "Filtra todos los datos del dashboard por cliente, estado de gasto o categoría. Los filtros afectan las estadísticas y gráficos.",
      howToUse: "Combina filtros para análisis específicos. Usa 'Limpiar' para resetear.",
    },
    en: {
      title: "Dashboard Filters",
      description: "Filter all dashboard data by client, expense status, or category. Filters affect statistics and charts.",
      howToUse: "Combine filters for specific analysis. Use 'Clear' to reset.",
    },
  },
  monthlyTotal: {
    es: {
      title: "Total Mensual",
      description: "Suma de todos los gastos registrados en el mes actual, sin importar su estado de clasificación.",
      howToUse: "Usa los filtros arriba para ver totales por cliente o categoría específica.",
    },
    en: {
      title: "Monthly Total",
      description: "Sum of all expenses recorded in the current month, regardless of their classification status.",
      howToUse: "Use the filters above to see totals by specific client or category.",
    },
  },
  totalExpenses: {
    es: {
      title: "Total de Registros",
      description: "Cantidad total de gastos registrados en el sistema que coinciden con los filtros activos.",
      howToUse: "Haz clic en 'Gastos' en el menú para ver el listado completo.",
    },
    en: {
      title: "Total Records",
      description: "Total number of expenses recorded in the system matching the active filters.",
      howToUse: "Click 'Expenses' in the menu to see the full list.",
    },
  },
  pendingDocs: {
    es: {
      title: "Documentos Pendientes",
      description: "Gastos que aún no han sido clasificados o necesitan revisión antes de poder ser incluidos en reportes fiscales.",
      howToUse: "Revísalos cuanto antes para mantener tu contabilidad al día.",
    },
    en: {
      title: "Pending Documents",
      description: "Expenses that haven't been classified yet or need review before being included in tax reports.",
      howToUse: "Review them as soon as possible to keep your accounting up to date.",
    },
  },
  billableExpenses: {
    es: {
      title: "Gastos Facturables",
      description: "Gastos marcados como reembolsables por un cliente, listos para incluir en tu próxima factura.",
      howToUse: "Genera el reporte de reembolsos para enviarlo a tu cliente.",
    },
    en: {
      title: "Billable Expenses",
      description: "Expenses marked as reimbursable by a client, ready to include in your next invoice.",
      howToUse: "Generate the reimbursement report to send to your client.",
    },
  },
  chartsTab: {
    es: {
      title: "Gráficos de Análisis",
      description: "Visualización de tus gastos por categoría, cliente y tendencia mensual.",
      howToUse: "Pasa el mouse sobre los gráficos para ver detalles específicos.",
    },
    en: {
      title: "Analysis Charts",
      description: "Visualization of your expenses by category, client, and monthly trend.",
      howToUse: "Hover over the charts to see specific details.",
    },
  },
  taxTab: {
    es: {
      title: "Análisis Fiscal CRA",
      description: "Resumen de deducciones fiscales calculadas según las reglas del CRA de Canadá.",
      howToUse: "Usa esta información para preparar tu declaración T2125.",
    },
    en: {
      title: "CRA Tax Analysis",
      description: "Tax deduction summary calculated according to Canada's CRA rules.",
      howToUse: "Use this information to prepare your T2125 declaration.",
    },
  },
  mileageTab: {
    es: {
      title: "Kilometraje Deducible",
      description: "Seguimiento de viajes de negocio para deducciones por uso de vehículo según tasas CRA 2024.",
      howToUse: "Registra cada viaje de trabajo para maximizar tus deducciones.",
    },
    en: {
      title: "Deductible Mileage",
      description: "Business trip tracking for vehicle use deductions according to CRA 2024 rates.",
      howToUse: "Record each work trip to maximize your deductions.",
    },
  },
  exportButton: {
    es: {
      title: "Exportar Datos",
      description: "Descarga tus gastos en formato Excel o CSV, incluyendo el reporte T2125 para el CRA.",
      howToUse: "Selecciona el formato y rango de fechas en el diálogo de exportación.",
    },
    en: {
      title: "Export Data",
      description: "Download your expenses in Excel or CSV format, including the T2125 report for the CRA.",
      howToUse: "Select the format and date range in the export dialog.",
    },
  },

  // ========== EXPENSES ==========
  expenseUploadPhoto: {
    es: {
      title: "Subir Foto de Recibo",
      description: "Toma o sube una foto de tu recibo. La IA extraerá automáticamente el monto, fecha, proveedor y categoría.",
      howToUse: "Asegúrate de que la foto esté bien iluminada y el texto sea legible.",
    },
    en: {
      title: "Upload Receipt Photo",
      description: "Take or upload a photo of your receipt. AI will automatically extract the amount, date, vendor and category.",
      howToUse: "Make sure the photo is well-lit and text is readable.",
    },
  },
  expenseVoiceInput: {
    es: {
      title: "Entrada por Voz",
      description: "Describe tu gasto hablando. Di algo como 'Almuerzo en restaurante, 25 dólares, hoy'.",
      howToUse: "Mantén presionado el botón del micrófono mientras hablas.",
    },
    en: {
      title: "Voice Input",
      description: "Describe your expense by speaking. Say something like 'Lunch at restaurant, 25 dollars, today'.",
      howToUse: "Hold the microphone button while speaking.",
    },
  },
  expenseCategory: {
    es: {
      title: "Categoría de Gasto",
      description: "Clasifica el gasto para análisis y deducciones fiscales. Cada categoría tiene diferentes reglas de deducción CRA.",
      howToUse: "La categoría afecta el porcentaje de deducción fiscal (ej: comidas = 50%).",
    },
    en: {
      title: "Expense Category",
      description: "Classify the expense for analysis and tax deductions. Each category has different CRA deduction rules.",
      howToUse: "The category affects the tax deduction percentage (e.g., meals = 50%).",
    },
  },
  expenseReimbursementType: {
    es: {
      title: "Tipo de Reembolso",
      description: "Define si el gasto es reembolsable por cliente, deducible de impuestos CRA, o personal.",
      howToUse: "Marca 'Reembolsable por cliente' para incluirlo en reportes de facturación.",
    },
    en: {
      title: "Reimbursement Type",
      description: "Define if the expense is client reimbursable, CRA tax deductible, or personal.",
      howToUse: "Mark 'Client reimbursable' to include it in billing reports.",
    },
  },
  expenseClientAssociation: {
    es: {
      title: "Asociación con Cliente",
      description: "Vincula el gasto a un cliente específico para generar reportes de reembolso y facturación.",
      howToUse: "Selecciona cliente, proyecto y contrato para un tracking completo.",
    },
    en: {
      title: "Client Association",
      description: "Link the expense to a specific client to generate reimbursement and billing reports.",
      howToUse: "Select client, project and contract for complete tracking.",
    },
  },
  expenseConfidenceLevel: {
    es: {
      title: "Nivel de Confianza IA",
      description: "Indica qué tan segura está la IA sobre los datos extraídos. Alta = muy seguro, Baja = requiere verificación.",
      howToUse: "Revisa manualmente los campos cuando la confianza sea baja.",
    },
    en: {
      title: "AI Confidence Level",
      description: "Indicates how confident the AI is about the extracted data. High = very sure, Low = needs verification.",
      howToUse: "Manually review fields when confidence is low.",
    },
  },
  expenseCraDeductible: {
    es: {
      title: "Deducible CRA",
      description: "Indica si el gasto es deducible de impuestos según las reglas del CRA de Canadá.",
      howToUse: "Los porcentajes varían: 100% para equipo, 50% para comidas de negocio.",
    },
    en: {
      title: "CRA Deductible",
      description: "Indicates if the expense is tax deductible according to Canada's CRA rules.",
      howToUse: "Percentages vary: 100% for equipment, 50% for business meals.",
    },
  },
  expenseTags: {
    es: {
      title: "Etiquetas",
      description: "Agrega etiquetas personalizadas para organizar y filtrar gastos de forma flexible.",
      howToUse: "Crea etiquetas como 'Urgente', 'Proyecto X', 'Pendiente revisión'.",
    },
    en: {
      title: "Tags",
      description: "Add custom tags to organize and filter expenses flexibly.",
      howToUse: "Create tags like 'Urgent', 'Project X', 'Pending review'.",
    },
  },
  bulkAssign: {
    es: {
      title: "Asignación Masiva",
      description: "Asigna cliente, proyecto o etiquetas a múltiples gastos a la vez.",
      howToUse: "Selecciona los gastos en la tabla y usa esta función para actualizarlos en lote.",
    },
    en: {
      title: "Bulk Assign",
      description: "Assign client, project or tags to multiple expenses at once.",
      howToUse: "Select expenses in the table and use this function to update them in batch.",
    },
  },
  quickCapture: {
    es: {
      title: "Captura Rápida con IA",
      description: "Sube una foto de recibo, usa tu voz o escribe para registrar gastos automáticamente con inteligencia artificial.",
      howToUse: "La IA extraerá automáticamente el monto, fecha, vendedor y categoría.",
    },
    en: {
      title: "AI Quick Capture",
      description: "Upload a receipt photo, use your voice or type to automatically record expenses with artificial intelligence.",
      howToUse: "AI will automatically extract the amount, date, vendor and category.",
    },
  },
  addExpense: {
    es: {
      title: "Agregar Gasto Manual",
      description: "Formulario completo para registrar un gasto con todos los detalles manualmente.",
      howToUse: "Usa esto cuando prefieras control total sobre la información ingresada.",
    },
    en: {
      title: "Add Manual Expense",
      description: "Complete form to record an expense with all details manually.",
      howToUse: "Use this when you prefer full control over the entered information.",
    },
  },
  reimbursementReport: {
    es: {
      title: "Reporte de Reembolsos",
      description: "Genera un informe de gastos reembolsables agrupados por cliente para facturación.",
      howToUse: "Filtra por fecha para generar reportes de períodos específicos.",
    },
    en: {
      title: "Reimbursement Report",
      description: "Generate a report of reimbursable expenses grouped by client for billing.",
      howToUse: "Filter by date to generate reports for specific periods.",
    },
  },
  expenseFilters: {
    es: {
      title: "Filtros de Búsqueda",
      description: "Filtra gastos por categoría, cliente, estado, fecha o texto de búsqueda.",
      howToUse: "Combina múltiples filtros para encontrar gastos específicos rápidamente.",
    },
    en: {
      title: "Search Filters",
      description: "Filter expenses by category, client, status, date or search text.",
      howToUse: "Combine multiple filters to quickly find specific expenses.",
    },
  },

  // ========== CHAOS INBOX ==========
  chaosInbox: {
    es: {
      title: "Bandeja Inteligente",
      description: "Sube documentos sin organizar - la IA los clasificará y extraerá la información automáticamente.",
      howToUse: "Arrastra múltiples archivos para procesamiento masivo.",
    },
    en: {
      title: "Smart Inbox",
      description: "Upload unorganized documents - AI will classify them and extract information automatically.",
      howToUse: "Drag multiple files for batch processing.",
    },
  },
  chaosInboxUpload: {
    es: {
      title: "Subir Documentos",
      description: "Arrastra archivos o haz clic para subir recibos, facturas, emails y cualquier documento.",
      howToUse: "La IA clasificará automáticamente cada documento y extraerá la información relevante.",
    },
    en: {
      title: "Upload Documents",
      description: "Drag files or click to upload receipts, invoices, emails and any document.",
      howToUse: "AI will automatically classify each document and extract relevant information.",
    },
  },
  chaosInboxStatus: {
    es: {
      title: "Estado del Documento",
      description: "Indica si el documento está pendiente de procesar, clasificado o archivado.",
      howToUse: "Los documentos 'pendientes' serán procesados por la IA próximamente.",
    },
    en: {
      title: "Document Status",
      description: "Indicates if the document is pending processing, classified or archived.",
      howToUse: "Documents marked 'pending' will be processed by AI soon.",
    },
  },

  // ========== CLIENTS ==========
  clients: {
    es: {
      title: "Administración de Clientes",
      description: "Gestiona la información de tus clientes para asociar gastos y generar reportes de reembolso.",
      howToUse: "Cada cliente puede tener su propio perfil de facturación.",
    },
    en: {
      title: "Client Management",
      description: "Manage your client information to associate expenses and generate reimbursement reports.",
      howToUse: "Each client can have their own billing profile.",
    },
  },
  addClient: {
    es: {
      title: "Agregar Cliente",
      description: "Crea un nuevo perfil de cliente para asociar gastos y generar reportes de reembolso.",
      howToUse: "Incluye información de contacto, industria y tipo de cliente.",
    },
    en: {
      title: "Add Client",
      description: "Create a new client profile to associate expenses and generate reimbursement reports.",
      howToUse: "Include contact information, industry and client type.",
    },
  },

  // ========== TAGS ==========
  tags: {
    es: {
      title: "Sistema de Etiquetas",
      description: "Crea etiquetas personalizadas para organizar y filtrar tus gastos de forma flexible.",
      howToUse: "Asigna múltiples etiquetas a cada gasto para mejor organización.",
    },
    en: {
      title: "Tag System",
      description: "Create custom tags to organize and filter your expenses flexibly.",
      howToUse: "Assign multiple tags to each expense for better organization.",
    },
  },
  createTag: {
    es: {
      title: "Crear Etiqueta",
      description: "Crea etiquetas personalizadas con colores para organizar tus gastos.",
      howToUse: "Elige un color que represente el tipo de etiqueta (rojo = urgente, verde = pagado).",
    },
    en: {
      title: "Create Tag",
      description: "Create custom tags with colors to organize your expenses.",
      howToUse: "Choose a color that represents the tag type (red = urgent, green = paid).",
    },
  },

  // ========== CONTRACTS ==========
  contracts: {
    es: {
      title: "Contratos y Acuerdos",
      description: "Almacena contratos, emails y acuerdos de reembolso que respalden tus deducciones.",
      howToUse: "Sube PDFs, imágenes o cualquier documento relacionado.",
    },
    en: {
      title: "Contracts & Agreements",
      description: "Store contracts, emails and reimbursement agreements that support your deductions.",
      howToUse: "Upload PDFs, images or any related document.",
    },
  },
  uploadContract: {
    es: {
      title: "Subir Contrato o Acuerdo",
      description: "Sube PDFs, imágenes o cualquier documento que respalde tus términos de reembolso.",
      howToUse: "Puedes subir contratos formales, emails de confirmación o cualquier acuerdo escrito.",
    },
    en: {
      title: "Upload Contract or Agreement",
      description: "Upload PDFs, images or any document that supports your reimbursement terms.",
      howToUse: "You can upload formal contracts, confirmation emails or any written agreement.",
    },
  },

  // ========== MILEAGE ==========
  mileage: {
    es: {
      title: "Registro de Kilometraje",
      description: "Registra viajes de negocio para deducciones por uso de vehículo con tasas CRA 2024.",
      howToUse: "Ingresa ruta, kilómetros y propósito de cada viaje.",
    },
    en: {
      title: "Mileage Tracking",
      description: "Record business trips for vehicle use deductions with CRA 2024 rates.",
      howToUse: "Enter route, kilometers and purpose of each trip.",
    },
  },
  addTrip: {
    es: {
      title: "Registrar Viaje",
      description: "Añade un viaje de negocio para calcular deducciones por kilometraje según tasas CRA.",
      howToUse: "Ingresa origen, destino, kilómetros y propósito del viaje.",
    },
    en: {
      title: "Record Trip",
      description: "Add a business trip to calculate mileage deductions according to CRA rates.",
      howToUse: "Enter origin, destination, kilometers and trip purpose.",
    },
  },
  yearSelector: {
    es: {
      title: "Seleccionar Año",
      description: "Filtra los registros de kilometraje por año fiscal.",
      howToUse: "El CRA requiere registros separados por año para el cálculo de deducciones.",
    },
    en: {
      title: "Select Year",
      description: "Filter mileage records by fiscal year.",
      howToUse: "CRA requires separate records by year for deduction calculations.",
    },
  },
  mileageTripsTab: {
    es: {
      title: "Viajes Registrados",
      description: "Lista detallada de todos los viajes de negocio con kilometraje y deducciones.",
      howToUse: "Haz clic en un viaje para editarlo o eliminarlo.",
    },
    en: {
      title: "Recorded Trips",
      description: "Detailed list of all business trips with mileage and deductions.",
      howToUse: "Click on a trip to edit or delete it.",
    },
  },
  mileageSummaryTab: {
    es: {
      title: "Resumen Anual",
      description: "Totales de kilometraje, deducciones y créditos ITC calculados según tasas CRA 2024.",
      howToUse: "Usa estos datos para tu declaración T2125.",
    },
    en: {
      title: "Annual Summary",
      description: "Mileage totals, deductions and ITC credits calculated according to CRA 2024 rates.",
      howToUse: "Use this data for your T2125 declaration.",
    },
  },

  // ========== RECONCILIATION ==========
  reconciliation: {
    es: {
      title: "Conciliación Bancaria",
      description: "Compara tus gastos registrados con transacciones bancarias para detectar discrepancias.",
      howToUse: "Importa tu estado de cuenta para conciliación automática.",
    },
    en: {
      title: "Bank Reconciliation",
      description: "Compare your recorded expenses with bank transactions to detect discrepancies.",
      howToUse: "Import your bank statement for automatic reconciliation.",
    },
  },
  reconciliationUpload: {
    es: {
      title: "Importar Estado de Cuenta",
      description: "Sube tu estado bancario para comparar transacciones con gastos registrados.",
      howToUse: "Acepta formatos CSV, OFX y QFX de la mayoría de bancos.",
    },
    en: {
      title: "Import Bank Statement",
      description: "Upload your bank statement to compare transactions with recorded expenses.",
      howToUse: "Accepts CSV, OFX and QFX formats from most banks.",
    },
  },

  // ========== SETTINGS ==========
  settings: {
    es: {
      title: "Configuración",
      description: "Personaliza tu perfil, preferencias fiscales, idioma y notificaciones.",
      howToUse: "Configura tu provincia para cálculos de impuestos precisos.",
    },
    en: {
      title: "Settings",
      description: "Customize your profile, tax preferences, language and notifications.",
      howToUse: "Set your province for accurate tax calculations.",
    },
  },
  languageSetting: {
    es: {
      title: "Idioma de la Aplicación",
      description: "Cambia el idioma de toda la interfaz entre Español e Inglés.",
      howToUse: "El cambio se aplica inmediatamente a toda la aplicación.",
    },
    en: {
      title: "Application Language",
      description: "Change the entire interface language between Spanish and English.",
      howToUse: "The change applies immediately to the entire application.",
    },
  },

  // ========== NAVIGATION ==========
  expenses: {
    es: {
      title: "Gestión de Gastos",
      description: "Lista completa de todos tus gastos con herramientas de filtrado y edición.",
      howToUse: "Haz clic en cualquier gasto para editarlo o ver detalles.",
    },
    en: {
      title: "Expense Management",
      description: "Complete list of all your expenses with filtering and editing tools.",
      howToUse: "Click on any expense to edit it or view details.",
    },
  },
  income: {
    es: {
      title: "Control de Ingresos",
      description: "Registra todos tus ingresos: salario, pagos de clientes, inversiones, ingresos pasivos y más.",
      howToUse: "Asocia ingresos a proyectos para un seguimiento detallado.",
    },
    en: {
      title: "Income Tracking",
      description: "Record all your income: salary, client payments, investments, passive income and more.",
      howToUse: "Associate income with projects for detailed tracking.",
    },
  },

  // ========== CLIENTS (Extended) ==========
  clientName: {
    es: {
      title: "Nombre del Cliente",
      description: "El nombre comercial o legal de tu cliente. Aparecerá en reportes y facturas.",
      howToUse: "Usa el nombre oficial para documentos fiscales.",
    },
    en: {
      title: "Client Name",
      description: "The commercial or legal name of your client. Will appear on reports and invoices.",
      howToUse: "Use official name for tax documents.",
    },
  },
  clientType: {
    es: {
      title: "Tipo de Cliente",
      description: "Clasifica si el cliente es empresa privada, gobierno, ONG o persona física. Útil para análisis y reportes.",
      howToUse: "Esto ayuda a segmentar tus clientes y ajustar estrategias de facturación.",
    },
    en: {
      title: "Client Type",
      description: "Classify if the client is private company, government, non-profit or individual. Useful for analysis and reports.",
      howToUse: "This helps segment clients and adjust billing strategies.",
    },
  },
  clientIndustry: {
    es: {
      title: "Industria",
      description: "El sector o industria donde opera tu cliente. Ayuda a categorizar y analizar tu cartera.",
      howToUse: "Selecciona la industria principal para estadísticas de diversificación.",
    },
    en: {
      title: "Industry",
      description: "The sector or industry where your client operates. Helps categorize and analyze your portfolio.",
      howToUse: "Select main industry for diversification statistics.",
    },
  },
  clientContact: {
    es: {
      title: "Información de Contacto",
      description: "Email y teléfono del contacto principal. Facilita la comunicación y facturación.",
      howToUse: "Mantén estos datos actualizados para comunicaciones importantes.",
    },
    en: {
      title: "Contact Information",
      description: "Email and phone of the main contact. Facilitates communication and billing.",
      howToUse: "Keep this data updated for important communications.",
    },
  },
  clientPaymentTerms: {
    es: {
      title: "Términos de Pago",
      description: "Días que el cliente tiene para pagar después de recibir la factura. Afecta proyecciones de flujo de caja.",
      howToUse: "Estándar es 30 días. Gobiernos suelen requerir más tiempo.",
    },
    en: {
      title: "Payment Terms",
      description: "Days the client has to pay after receiving the invoice. Affects cash flow projections.",
      howToUse: "Standard is 30 days. Government clients often need more time.",
    },
  },
  clientCurrency: {
    es: {
      title: "Moneda",
      description: "La moneda en que facturas a este cliente. Importante para clientes internacionales.",
      howToUse: "CAD es la moneda por defecto para clientes canadienses.",
    },
    en: {
      title: "Currency",
      description: "The currency you invoice this client in. Important for international clients.",
      howToUse: "CAD is default for Canadian clients.",
    },
  },
  clientTaxId: {
    es: {
      title: "ID Fiscal / GST-HST",
      description: "El número de registro fiscal o GST/HST del cliente. Necesario para facturas formales.",
      howToUse: "Solicita este número para incluirlo en tus facturas oficiales.",
    },
    en: {
      title: "Tax ID / GST-HST",
      description: "The client's tax registration or GST/HST number. Needed for formal invoices.",
      howToUse: "Request this number to include in your official invoices.",
    },
  },
  clientWebsite: {
    es: {
      title: "Sitio Web",
      description: "La URL del sitio web del cliente. Útil para referencia rápida y validación.",
      howToUse: "Incluye https:// para que el enlace sea clickeable.",
    },
    en: {
      title: "Website",
      description: "The client's website URL. Useful for quick reference and validation.",
      howToUse: "Include https:// to make the link clickable.",
    },
  },
  clientNotes: {
    es: {
      title: "Notas del Cliente",
      description: "Información adicional relevante: preferencias, historial, acuerdos especiales.",
      howToUse: "Documenta acuerdos verbales o consideraciones importantes.",
    },
    en: {
      title: "Client Notes",
      description: "Additional relevant info: preferences, history, special agreements.",
      howToUse: "Document verbal agreements or important considerations.",
    },
  },
  clientCompleteness: {
    es: {
      title: "Completitud del Perfil",
      description: "Indica qué tan completo está el perfil del cliente. Más información = mejores reportes.",
      howToUse: "Intenta completar al menos 80% para reportes precisos.",
    },
    en: {
      title: "Profile Completeness",
      description: "Shows how complete the client profile is. More info = better reports.",
      howToUse: "Try to complete at least 80% for accurate reports.",
    },
  },
  clientFinancialOverview: {
    es: {
      title: "Panorama Financiero",
      description: "Vista rápida de ingresos, gastos y rentabilidad con este cliente.",
      howToUse: "Revisa regularmente para identificar clientes más rentables.",
    },
    en: {
      title: "Financial Overview",
      description: "Quick view of income, expenses and profitability with this client.",
      howToUse: "Review regularly to identify most profitable clients.",
    },
  },
} as const;
