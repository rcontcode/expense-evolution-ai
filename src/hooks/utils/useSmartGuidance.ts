import { useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/data/useProfile';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { useClients } from '@/hooks/data/useClients';
import { useProjects } from '@/hooks/data/useProjects';
import { useDashboardStats } from '@/hooks/data/useDashboardStats';

// Tutorial definitions for each feature
interface TutorialStep {
  title: { es: string; en: string };
  description: { es: string; en: string };
  action?: string; // Voice command to execute
}

interface Tutorial {
  id: string;
  name: { es: string; en: string };
  triggers: string[];
  steps: TutorialStep[];
}

// Voice tutorials for guided walkthroughs
const VOICE_TUTORIALS: Tutorial[] = [
  {
    id: 'capture-expense',
    name: { es: 'Capturar gastos', en: 'Capture expenses' },
    triggers: ['enseñame a capturar', 'cómo capturo', 'tutorial captura', 'teach me to capture', 'how to capture', 'capture tutorial'],
    steps: [
      {
        title: { es: 'Paso 1: Accede a la captura', en: 'Step 1: Access capture' },
        description: { 
          es: 'Tienes dos opciones para capturar gastos: usa el botón verde "Captura de Gastos" en la barra lateral, o di "capturar gasto" y yo te ayudaré.',
          en: 'You have two options to capture expenses: use the green "Expense Capture" button in the sidebar, or say "capture expense" and I\'ll help you.'
        }
      },
      {
        title: { es: 'Paso 2: Elige el método', en: 'Step 2: Choose the method' },
        description: {
          es: 'Puedes tomar una foto del recibo, subir una imagen existente, o dictarme el gasto por voz. Por ejemplo: "gasto de 50 dólares en restaurante".',
          en: 'You can take a photo of the receipt, upload an existing image, or dictate the expense to me. For example: "expense of 50 dollars at restaurant".'
        }
      },
      {
        title: { es: 'Paso 3: Revisa y clasifica', en: 'Step 3: Review and classify' },
        description: {
          es: 'Después de capturar, revisa que los datos sean correctos y asigna el gasto a un cliente o proyecto si aplica. Esto te ayudará con los reportes de reembolso.',
          en: 'After capturing, verify the data is correct and assign the expense to a client or project if applicable. This will help with reimbursement reports.'
        }
      }
    ]
  },
  {
    id: 'setup-client',
    name: { es: 'Configurar cliente', en: 'Setup client' },
    triggers: ['configurar cliente', 'agregar cliente', 'nuevo cliente', 'setup client', 'add client', 'new client', 'cómo agrego un cliente'],
    steps: [
      {
        title: { es: 'Paso 1: Ve a Clientes', en: 'Step 1: Go to Clients' },
        description: {
          es: 'Primero, navega a la sección de Clientes desde el menú lateral o di "ir a clientes".',
          en: 'First, navigate to the Clients section from the sidebar menu or say "go to clients".'
        },
        action: '/clients'
      },
      {
        title: { es: 'Paso 2: Crea el cliente', en: 'Step 2: Create the client' },
        description: {
          es: 'Haz clic en "Agregar Cliente" e ingresa el nombre, email, y dirección. Estos datos serán usados para los reportes de reembolso.',
          en: 'Click "Add Client" and enter the name, email, and address. This data will be used for reimbursement reports.'
        }
      },
      {
        title: { es: 'Paso 3: Sube el contrato', en: 'Step 3: Upload the contract' },
        description: {
          es: 'Si tienes un contrato, súbelo en la sección de Contratos. EvoFinz analizará automáticamente los términos de reembolso.',
          en: 'If you have a contract, upload it in the Contracts section. EvoFinz will automatically analyze the reimbursement terms.'
        }
      }
    ]
  },
  {
    id: 'tax-deductions',
    name: { es: 'Deducciones fiscales', en: 'Tax deductions' },
    triggers: ['deducciones', 'deducir impuestos', 'tax deductions', 'how to deduct', 'cómo deduzco', 'maximizar deducciones'],
    steps: [
      {
        title: { es: 'Paso 1: Clasifica tus gastos', en: 'Step 1: Classify your expenses' },
        description: {
          es: 'Primero, asegúrate de que cada gasto esté correctamente categorizado. Los gastos de oficina, equipo, viajes de trabajo y software suelen ser deducibles.',
          en: 'First, ensure each expense is correctly categorized. Office supplies, equipment, business travel, and software are usually deductible.'
        }
      },
      {
        title: { es: 'Paso 2: Marca como deducible', en: 'Step 2: Mark as deductible' },
        description: {
          es: 'En cada gasto, cambia el tipo de reembolso a "Deducible Fiscal". Solo los gastos relacionados con tu trabajo independiente califican.',
          en: 'On each expense, change the reimbursement type to "Tax Deductible". Only expenses related to your self-employment qualify.'
        }
      },
      {
        title: { es: 'Paso 3: Usa el Optimizador', en: 'Step 3: Use the Optimizer' },
        description: {
          es: 'Ve al Dashboard y abre la pestaña de Impuestos. El Optimizador Fiscal te mostrará cuánto puedes deducir y sugerencias para maximizar tus ahorros.',
          en: 'Go to the Dashboard and open the Taxes tab. The Tax Optimizer will show you how much you can deduct and suggestions to maximize your savings.'
        }
      }
    ]
  },
  {
    id: 'banking-analysis',
    name: { es: 'Análisis bancario', en: 'Banking analysis' },
    triggers: ['análisis bancario', 'importar banco', 'banking analysis', 'import bank', 'cómo importo mi banco', 'analizar cuenta'],
    steps: [
      {
        title: { es: 'Paso 1: Descarga tu estado', en: 'Step 1: Download your statement' },
        description: {
          es: 'Entra a tu banco online y descarga el estado de cuenta en formato CSV o PDF. La mayoría de los bancos ofrecen esta opción.',
          en: 'Log into your online bank and download your statement in CSV or PDF format. Most banks offer this option.'
        }
      },
      {
        title: { es: 'Paso 2: Importa en EvoFinz', en: 'Step 2: Import in EvoFinz' },
        description: {
          es: 'Ve a la sección de Banca y haz clic en "Importar Estado". Sube el archivo y EvoFinz analizará todas las transacciones.',
          en: 'Go to the Banking section and click "Import Statement". Upload the file and EvoFinz will analyze all transactions.'
        },
        action: '/banking'
      },
      {
        title: { es: 'Paso 3: Revisa las alertas', en: 'Step 3: Review alerts' },
        description: {
          es: 'EvoFinz detectará suscripciones recurrentes, cobros duplicados, y anomalías. Revisa las alertas y toma acción en los gastos sospechosos.',
          en: 'EvoFinz will detect recurring subscriptions, duplicate charges, and anomalies. Review the alerts and take action on suspicious expenses.'
        }
      }
    ]
  },
  {
    id: 'net-worth',
    name: { es: 'Patrimonio neto', en: 'Net worth' },
    triggers: ['patrimonio', 'net worth', 'activos', 'assets', 'cómo registro activos', 'mis inversiones'],
    steps: [
      {
        title: { es: 'Paso 1: Lista tus activos', en: 'Step 1: List your assets' },
        description: {
          es: 'Ve a Patrimonio Neto y agrega todos tus activos: cuentas bancarias, inversiones, propiedades, vehículos, crypto, etc.',
          en: 'Go to Net Worth and add all your assets: bank accounts, investments, properties, vehicles, crypto, etc.'
        },
        action: '/net-worth'
      },
      {
        title: { es: 'Paso 2: Registra tus pasivos', en: 'Step 2: Record your liabilities' },
        description: {
          es: 'También agrega tus deudas: hipoteca, préstamos, tarjetas de crédito. Esto te dará una imagen real de tu patrimonio.',
          en: 'Also add your debts: mortgage, loans, credit cards. This will give you a real picture of your wealth.'
        }
      },
      {
        title: { es: 'Paso 3: Revisa la evolución', en: 'Step 3: Review evolution' },
        description: {
          es: 'EvoFinz calcula tu patrimonio neto automáticamente y te muestra cómo ha evolucionado. La meta es que crezca cada mes.',
          en: 'EvoFinz automatically calculates your net worth and shows you how it has evolved. The goal is for it to grow each month.'
        }
      }
    ]
  },
  // ========== NEW TUTORIALS ==========
  {
    id: 'fire-calculator',
    name: { es: 'Calculadora FIRE', en: 'FIRE Calculator' },
    triggers: ['fire', 'retiro temprano', 'early retirement', 'libertad financiera', 'financial freedom', 'cuándo puedo retirarme', 'when can i retire'],
    steps: [
      {
        title: { es: 'Paso 1: Abre el calculador FIRE', en: 'Step 1: Open the FIRE calculator' },
        description: {
          es: 'Ve al Dashboard y busca la pestaña "FIRE". Aquí puedes calcular cuánto necesitas ahorrar para jubilarte temprano.',
          en: 'Go to the Dashboard and find the "FIRE" tab. Here you can calculate how much you need to save for early retirement.'
        },
        action: '/dashboard?tab=fire'
      },
      {
        title: { es: 'Paso 2: Ingresa tus datos', en: 'Step 2: Enter your data' },
        description: {
          es: 'Introduce tu edad actual, edad objetivo de retiro, gastos mensuales, ahorros actuales, y tasa de retorno esperada. La app calculará automáticamente tu "número FIRE".',
          en: 'Enter your current age, target retirement age, monthly expenses, current savings, and expected return rate. The app will automatically calculate your "FIRE number".'
        }
      },
      {
        title: { es: 'Paso 3: Explora las variantes', en: 'Step 3: Explore the variants' },
        description: {
          es: 'Hay tres tipos de FIRE: Lean (austero), Regular, y Fat (holgado). Cada uno requiere diferentes niveles de ahorro. También revisa Coast FIRE para ver si ya puedes dejar de ahorrar.',
          en: 'There are three types of FIRE: Lean, Regular, and Fat. Each requires different savings levels. Also check Coast FIRE to see if you can already stop saving.'
        }
      }
    ]
  },
  {
    id: 'mileage-tracking',
    name: { es: 'Registro de kilometraje', en: 'Mileage tracking' },
    triggers: ['kilometraje', 'mileage', 'viajes de trabajo', 'work trips', 'cómo registro viajes', 'deducciones de auto', 'car deductions'],
    steps: [
      {
        title: { es: 'Paso 1: Ve a Kilometraje', en: 'Step 1: Go to Mileage' },
        description: {
          es: 'Navega a la sección de Kilometraje desde el menú lateral. Aquí puedes registrar todos tus viajes de trabajo.',
          en: 'Navigate to the Mileage section from the sidebar. Here you can record all your work trips.'
        },
        action: '/mileage'
      },
      {
        title: { es: 'Paso 2: Agrega una ruta', en: 'Step 2: Add a route' },
        description: {
          es: 'Haz clic en "Agregar Viaje" e ingresa las direcciones de inicio y destino. La app calculará automáticamente los kilómetros usando mapas.',
          en: 'Click "Add Trip" and enter the start and end addresses. The app will automatically calculate kilometers using maps.'
        }
      },
      {
        title: { es: 'Paso 3: Configura recurrencia', en: 'Step 3: Set recurrence' },
        description: {
          es: 'Si haces el mismo viaje regularmente (ejemplo: ir a la oficina del cliente cada martes), puedes configurar que se repita automáticamente.',
          en: 'If you make the same trip regularly (e.g., going to client\'s office every Tuesday), you can set it to repeat automatically.'
        }
      }
    ]
  },
  {
    id: 'reimbursement-reports',
    name: { es: 'Reportes de reembolso', en: 'Reimbursement reports' },
    triggers: ['reembolso', 'reimbursement', 'facturar cliente', 'billing client', 'cómo cobro gastos', 'exportar reporte'],
    steps: [
      {
        title: { es: 'Paso 1: Clasifica tus gastos', en: 'Step 1: Classify your expenses' },
        description: {
          es: 'Asegúrate de que cada gasto reembolsable esté marcado como "Reembolsable por Cliente" y asignado al cliente correcto.',
          en: 'Make sure each reimbursable expense is marked as "Client Reimbursable" and assigned to the correct client.'
        }
      },
      {
        title: { es: 'Paso 2: Accede al reporte', en: 'Step 2: Access the report' },
        description: {
          es: 'Ve a Gastos, haz clic en el botón de exportar, y selecciona "Reporte de Reembolso". Puedes filtrarlo por cliente y fechas.',
          en: 'Go to Expenses, click the export button, and select "Reimbursement Report". You can filter by client and dates.'
        },
        action: '/expenses'
      },
      {
        title: { es: 'Paso 3: Exporta y envía', en: 'Step 3: Export and send' },
        description: {
          es: 'Descarga el reporte en Excel con todas las hojas profesionales: resumen ejecutivo, análisis por categoría, detalle completo, y más. Envíalo a tu cliente para cobrar.',
          en: 'Download the report in Excel with all professional sheets: executive summary, category analysis, complete detail, and more. Send it to your client for billing.'
        }
      }
    ]
  },
  {
    id: 'mentorship-system',
    name: { es: 'Sistema de mentoría', en: 'Mentorship system' },
    triggers: ['mentoría', 'mentorship', 'kiyosaki', 'educación financiera', 'financial education', 'cuadrante', 'quadrant'],
    steps: [
      {
        title: { es: 'Paso 1: Explora la mentoría', en: 'Step 1: Explore mentorship' },
        description: {
          es: 'Ve a la sección de Mentoría. Aquí encontrarás herramientas basadas en principios de Robert Kiyosaki, Jim Rohn, y Brian Tracy.',
          en: 'Go to the Mentorship section. Here you\'ll find tools based on principles from Robert Kiyosaki, Jim Rohn, and Brian Tracy.'
        },
        action: '/mentorship'
      },
      {
        title: { es: 'Paso 2: Conoce tu cuadrante', en: 'Step 2: Know your quadrant' },
        description: {
          es: 'El Cuadrante del Flujo de Efectivo te muestra de dónde viene tu dinero: Empleado, Auto-empleado, Dueño de negocio, o Inversionista. La meta es moverse hacia la derecha.',
          en: 'The Cashflow Quadrant shows you where your money comes from: Employee, Self-employed, Business owner, or Investor. The goal is to move to the right side.'
        }
      },
      {
        title: { es: 'Paso 3: Establece metas SMART', en: 'Step 3: Set SMART goals' },
        description: {
          es: 'Usa el asistente de metas SMART para crear objetivos específicos, medibles, alcanzables, relevantes, y con tiempo definido. Te ayudará a mantener el enfoque.',
          en: 'Use the SMART goal wizard to create specific, measurable, achievable, relevant, and time-bound objectives. It will help you stay focused.'
        }
      }
    ]
  },
  {
    id: 'voice-commands',
    name: { es: 'Comandos de voz', en: 'Voice commands' },
    triggers: ['comandos de voz', 'voice commands', 'qué puedo decirte', 'what can i say', 'cómo uso la voz', 'how to use voice'],
    steps: [
      {
        title: { es: 'Paso 1: Navegación por voz', en: 'Step 1: Voice navigation' },
        description: {
          es: 'Puedes navegar diciendo cosas como: "ir a gastos", "llévame a clientes", "abre el dashboard". Reconozco más de 20 destinos.',
          en: 'You can navigate by saying things like: "go to expenses", "take me to clients", "open the dashboard". I recognize 20+ destinations.'
        }
      },
      {
        title: { es: 'Paso 2: Crear registros', en: 'Step 2: Create records' },
        description: {
          es: 'Crea gastos e ingresos por voz: "gasto de 100 en restaurante", "recibí 5000 de cliente ABC", "pagué 50 en gasolina". Auto-categorizo todo.',
          en: 'Create expenses and income by voice: "expense of 100 at restaurant", "received 5000 from client ABC", "paid 50 for gas". I auto-categorize everything.'
        }
      },
      {
        title: { es: 'Paso 3: Consultar datos', en: 'Step 3: Query data' },
        description: {
          es: 'Pregunta sobre tus finanzas: "cuánto gasté este mes", "cuál es mi balance", "cuántos clientes tengo", "cuál fue mi gasto más grande". Respondo al instante.',
          en: 'Ask about your finances: "how much did I spend this month", "what is my balance", "how many clients do I have", "what was my biggest expense". I answer instantly.'
        }
      }
    ]
  },
  {
    id: 'contract-analysis',
    name: { es: 'Análisis de contratos', en: 'Contract analysis' },
    triggers: ['analizar contrato', 'analyze contract', 'subir contrato', 'upload contract', 'términos de reembolso', 'reimbursement terms'],
    steps: [
      {
        title: { es: 'Paso 1: Sube tu contrato', en: 'Step 1: Upload your contract' },
        description: {
          es: 'Ve a Contratos y haz clic en "Agregar Contrato". Sube el archivo PDF o Word de tu contrato con el cliente.',
          en: 'Go to Contracts and click "Add Contract". Upload the PDF or Word file of your client contract.'
        },
        action: '/contracts'
      },
      {
        title: { es: 'Paso 2: Análisis inteligente', en: 'Step 2: Smart analysis' },
        description: {
          es: 'EvoFinz analizará automáticamente el contrato para extraer términos importantes: fechas, montos, categorías de gastos reembolsables, y condiciones especiales.',
          en: 'EvoFinz will automatically analyze the contract to extract important terms: dates, amounts, reimbursable expense categories, and special conditions.'
        }
      },
      {
        title: { es: 'Paso 3: Clasificación automática', en: 'Step 3: Automatic classification' },
        description: {
          es: 'Una vez analizado, cuando captures gastos relacionados, EvoFinz sugerirá automáticamente si son reembolsables según los términos del contrato.',
          en: 'Once analyzed, when you capture related expenses, EvoFinz will automatically suggest if they are reimbursable according to the contract terms.'
        }
      }
    ]
  },
  {
    id: 'rrsp-tfsa-optimizer',
    name: { es: 'Optimizador RRSP/TFSA', en: 'RRSP/TFSA Optimizer' },
    triggers: ['rrsp', 'tfsa', 'apv', 'ahorro previsional', 'retirement savings', 'optimizar ahorro', 'optimize savings'],
    steps: [
      {
        title: { es: 'Paso 1: Abre el optimizador', en: 'Step 1: Open the optimizer' },
        description: {
          es: 'Ve al Dashboard y abre la pestaña de Impuestos. Busca el "Optimizador RRSP/TFSA" (en Chile es APV).',
          en: 'Go to the Dashboard and open the Taxes tab. Find the "RRSP/TFSA Optimizer" (in Chile it\'s APV).'
        },
        action: '/dashboard?tab=tax'
      },
      {
        title: { es: 'Paso 2: Ingresa tu información', en: 'Step 2: Enter your information' },
        description: {
          es: 'Indica tu ingreso anual, provincia, cuánto puedes ahorrar mensualmente, y tus contribuciones actuales. La app calculará la distribución óptima.',
          en: 'Enter your annual income, province, how much you can save monthly, and your current contributions. The app will calculate the optimal distribution.'
        }
      },
      {
        title: { es: 'Paso 3: Sigue las recomendaciones', en: 'Step 3: Follow recommendations' },
        description: {
          es: 'El optimizador te dirá cuánto poner en cada cuenta para maximizar tus beneficios fiscales. También muestra proyecciones de crecimiento a largo plazo.',
          en: 'The optimizer will tell you how much to put in each account to maximize your tax benefits. It also shows long-term growth projections.'
        }
      }
    ]
  },
  {
    id: 'debt-manager',
    name: { es: 'Gestor de deudas', en: 'Debt manager' },
    triggers: ['deudas', 'debts', 'pagar deudas', 'pay off debts', 'estrategia deuda', 'debt strategy', 'avalancha', 'bola de nieve', 'snowball'],
    steps: [
      {
        title: { es: 'Paso 1: Registra tus deudas', en: 'Step 1: Register your debts' },
        description: {
          es: 'Ve a Patrimonio Neto y agrega todos tus pasivos: tarjetas de crédito, préstamos, hipoteca. Incluye el saldo, tasa de interés, y pago mínimo.',
          en: 'Go to Net Worth and add all your liabilities: credit cards, loans, mortgage. Include balance, interest rate, and minimum payment.'
        },
        action: '/net-worth'
      },
      {
        title: { es: 'Paso 2: Elige tu estrategia', en: 'Step 2: Choose your strategy' },
        description: {
          es: 'El Dashboard muestra dos estrategias: "Avalancha" (pagar primero la de mayor interés) y "Bola de Nieve" (pagar primero la más pequeña para motivación).',
          en: 'The Dashboard shows two strategies: "Avalanche" (pay highest interest first) and "Snowball" (pay smallest first for motivation).'
        }
      },
      {
        title: { es: 'Paso 3: Simula pagos extra', en: 'Step 3: Simulate extra payments' },
        description: {
          es: 'Usa el simulador para ver cuánto tiempo ahorras agregando pagos extra. Te mostrará la fecha proyectada de liberación de deudas.',
          en: 'Use the simulator to see how much time you save by adding extra payments. It will show you the projected debt-free date.'
        }
      }
    ]
  },
  // ========== ADDITIONAL ADVANCED TUTORIALS ==========
  {
    id: 'spending-alerts',
    name: { es: 'Alertas de gasto', en: 'Spending alerts' },
    triggers: ['alerta de gasto', 'spending alert', 'notificar gasto', 'notify spending', 'avisar cuando gaste', 'warn when i spend'],
    steps: [
      {
        title: { es: 'Paso 1: Configura una alerta', en: 'Step 1: Set up an alert' },
        description: {
          es: 'Puedes configurar alertas por voz diciendo: "alerta cuando gaste más de 500" o "avísame si gasto más de 100 en restaurantes".',
          en: 'You can set alerts by voice saying: "alert when I spend more than 500" or "notify me if I spend more than 100 on restaurants".'
        }
      },
      {
        title: { es: 'Paso 2: Recibe notificaciones', en: 'Step 2: Receive notifications' },
        description: {
          es: 'Cuando captures un gasto que supere tu límite, recibirás una notificación inmediata. También puedes ver todas tus alertas en Configuración.',
          en: 'When you capture an expense that exceeds your limit, you\'ll receive an immediate notification. You can also see all your alerts in Settings.'
        }
      },
      {
        title: { es: 'Paso 3: Ajusta tus límites', en: 'Step 3: Adjust your limits' },
        description: {
          es: 'Revisa y ajusta tus alertas según tu presupuesto mensual. Puedes tener múltiples alertas para diferentes categorías.',
          en: 'Review and adjust your alerts based on your monthly budget. You can have multiple alerts for different categories.'
        }
      }
    ]
  },
  {
    id: 'export-reports',
    name: { es: 'Exportar reportes', en: 'Export reports' },
    triggers: ['exportar', 'export', 'descargar reporte', 'download report', 'para contador', 'for accountant', 'generar excel', 'generate excel'],
    steps: [
      {
        title: { es: 'Paso 1: Elige qué exportar', en: 'Step 1: Choose what to export' },
        description: {
          es: 'Tienes varias opciones de exportación: reporte fiscal para impuestos, reporte de reembolsos para clientes, o todos tus gastos/ingresos.',
          en: 'You have several export options: tax report for taxes, reimbursement report for clients, or all your expenses/income.'
        }
      },
      {
        title: { es: 'Paso 2: Usa comandos de voz', en: 'Step 2: Use voice commands' },
        description: {
          es: 'Di "exportar para mi contador" para generar el reporte fiscal, o "exportar reembolsos" para el reporte de clientes. También funciona desde el menú de Gastos.',
          en: 'Say "export for my accountant" for the tax report, or "export reimbursements" for client reports. It also works from the Expenses menu.'
        },
        action: '/expenses'
      },
      {
        title: { es: 'Paso 3: Revisa el archivo', en: 'Step 3: Review the file' },
        description: {
          es: 'El reporte Excel incluye múltiples hojas: resumen ejecutivo, análisis por categoría, tendencias mensuales, y detalle completo. Perfecto para tu contador.',
          en: 'The Excel report includes multiple sheets: executive summary, category analysis, monthly trends, and complete detail. Perfect for your accountant.'
        }
      }
    ]
  },
  {
    id: 'voice-reminders',
    name: { es: 'Recordatorios por voz', en: 'Voice reminders' },
    triggers: ['recordatorio', 'reminder', 'recuérdame', 'remind me', 'no olvidar', 'don\'t forget'],
    steps: [
      {
        title: { es: 'Paso 1: Crea un recordatorio', en: 'Step 1: Create a reminder' },
        description: {
          es: 'Di algo como: "recuérdame revisar gastos el viernes" o "recordatorio: pagar facturas mañana a las 10".',
          en: 'Say something like: "remind me to review expenses on Friday" or "reminder: pay bills tomorrow at 10".'
        }
      },
      {
        title: { es: 'Paso 2: Gestiona tus recordatorios', en: 'Step 2: Manage your reminders' },
        description: {
          es: 'Todos tus recordatorios se guardan y puedes verlos en Configuración > Preferencias de Voz. Recibe notificaciones en el día/hora programados.',
          en: 'All your reminders are saved and you can see them in Settings > Voice Preferences. Receive notifications on the scheduled day/time.'
        },
        action: '/settings'
      },
      {
        title: { es: 'Paso 3: Acciones sugeridas', en: 'Step 3: Suggested actions' },
        description: {
          es: 'Cuando llegue la hora, te recordaré y te ofreceré acciones rápidas relacionadas, como abrir la sección correspondiente o capturar un gasto.',
          en: 'When the time comes, I\'ll remind you and offer quick related actions, like opening the corresponding section or capturing an expense.'
        }
      }
    ]
  },
  {
    id: 'subscription-tracking',
    name: { es: 'Seguimiento de suscripciones', en: 'Subscription tracking' },
    triggers: ['suscripciones', 'subscriptions', 'pagos recurrentes', 'recurring payments', 'netflix', 'spotify', 'cuánto pago mensual'],
    steps: [
      {
        title: { es: 'Paso 1: Importa tu banco', en: 'Step 1: Import your bank' },
        description: {
          es: 'Para detectar suscripciones, primero importa tus estados bancarios en la sección de Banca. EvoFinz analizará los patrones de pago.',
          en: 'To detect subscriptions, first import your bank statements in the Banking section. EvoFinz will analyze payment patterns.'
        },
        action: '/banking'
      },
      {
        title: { es: 'Paso 2: Revisa las suscripciones detectadas', en: 'Step 2: Review detected subscriptions' },
        description: {
          es: 'El sistema identifica pagos recurrentes como Netflix, Spotify, seguros, etc. Di "mis suscripciones" para ver la lista y el total mensual.',
          en: 'The system identifies recurring payments like Netflix, Spotify, insurance, etc. Say "my subscriptions" to see the list and monthly total.'
        }
      },
      {
        title: { es: 'Paso 3: Optimiza tus gastos', en: 'Step 3: Optimize your spending' },
        description: {
          es: 'Revisa si hay suscripciones que ya no usas. Cancela las innecesarias y ahorra dinero cada mes.',
          en: 'Check if there are subscriptions you no longer use. Cancel the unnecessary ones and save money each month.'
        }
      }
    ]
  },
  {
    id: 'month-comparison',
    name: { es: 'Comparación mensual', en: 'Monthly comparison' },
    triggers: ['comparar meses', 'compare months', 'vs mes anterior', 'vs last month', 'diferencia mensual', 'monthly difference'],
    steps: [
      {
        title: { es: 'Paso 1: Consulta la comparación', en: 'Step 1: Query the comparison' },
        description: {
          es: 'Di "comparar este mes con el anterior" o "cómo voy vs mes pasado". Te diré la diferencia en gastos e ingresos.',
          en: 'Say "compare this month to last month" or "how am I vs last month". I\'ll tell you the difference in expenses and income.'
        }
      },
      {
        title: { es: 'Paso 2: Analiza las tendencias', en: 'Step 2: Analyze trends' },
        description: {
          es: 'En el Dashboard, la línea de tiempo anual te muestra cada mes con colores: verde para meses positivos, rojo para negativos.',
          en: 'On the Dashboard, the annual timeline shows you each month with colors: green for positive months, red for negative ones.'
        },
        action: '/dashboard'
      },
      {
        title: { es: 'Paso 3: Identifica patrones', en: 'Step 3: Identify patterns' },
        description: {
          es: 'Busca patrones estacionales: ¿gastas más en diciembre? ¿Ganas menos en verano? Usa esta información para planificar mejor.',
          en: 'Look for seasonal patterns: do you spend more in December? Earn less in summer? Use this information to plan better.'
        }
      }
    ]
  },
  {
    id: 'duplicate-entries',
    name: { es: 'Duplicar registros', en: 'Duplicate entries' },
    triggers: ['duplicar gasto', 'duplicate expense', 'repetir ingreso', 'repeat income', 'otro igual', 'another same'],
    steps: [
      {
        title: { es: 'Paso 1: Usa el comando de voz', en: 'Step 1: Use the voice command' },
        description: {
          es: 'Después de crear un gasto o ingreso, di "duplicar el último gasto" o "repetir el ingreso anterior" para crear una copia idéntica.',
          en: 'After creating an expense or income, say "duplicate last expense" or "repeat last income" to create an identical copy.'
        }
      },
      {
        title: { es: 'Paso 2: Modifica si es necesario', en: 'Step 2: Modify if needed' },
        description: {
          es: 'El duplicado aparecerá listo para editar. Puedes cambiar la fecha, monto, o cualquier otro campo antes de guardarlo.',
          en: 'The duplicate will appear ready to edit. You can change the date, amount, or any other field before saving.'
        }
      },
      {
        title: { es: 'Paso 3: Úsalo para gastos recurrentes', en: 'Step 3: Use for recurring expenses' },
        description: {
          es: 'Esta función es perfecta para gastos que se repiten: café semanal, transporte diario, pagos mensuales similares.',
          en: 'This feature is perfect for recurring expenses: weekly coffee, daily transport, similar monthly payments.'
        }
      }
    ]
  }
];

// Proactive alerts based on user data
interface ProactiveAlert {
  id: string;
  priority: 'high' | 'medium' | 'low';
  message: { es: string; en: string };
  action?: { es: string; en: string };
  route?: string;
}

// Post-action suggestions
interface PostActionSuggestion {
  trigger: string; // What action was just completed
  suggestions: { es: string; en: string }[];
}

const POST_ACTION_SUGGESTIONS: PostActionSuggestion[] = [
  {
    trigger: 'expense_created',
    suggestions: [
      { es: '¿Quieres asignar este gasto a un cliente para reembolso?', en: 'Would you like to assign this expense to a client for reimbursement?' },
      { es: 'Recuerda clasificar el gasto como deducible si aplica.', en: 'Remember to classify the expense as deductible if applicable.' },
      { es: '¿Tienes más recibos por capturar?', en: 'Do you have more receipts to capture?' }
    ]
  },
  {
    trigger: 'income_created',
    suggestions: [
      { es: '¿Quieres vincular este ingreso a un proyecto?', en: 'Would you like to link this income to a project?' },
      { es: 'Revisa tu balance en el Dashboard para ver cómo vas este mes.', en: 'Check your balance in the Dashboard to see how you\'re doing this month.' }
    ]
  },
  {
    trigger: 'client_created',
    suggestions: [
      { es: '¿Tienes un contrato con este cliente? Súbelo para extraer términos de reembolso.', en: 'Do you have a contract with this client? Upload it to extract reimbursement terms.' },
      { es: '¿Quieres crear un proyecto para este cliente?', en: 'Would you like to create a project for this client?' }
    ]
  },
  {
    trigger: 'navigation',
    suggestions: [
      { es: '¿Necesitas ayuda con esta página? Di "qué puedo hacer aquí".', en: 'Need help with this page? Say "what can I do here".' }
    ]
  }
];

// Error recovery alternatives
interface ErrorRecovery {
  patterns: string[];
  alternatives: { es: string[]; en: string[] };
}

const ERROR_RECOVERIES: ErrorRecovery[] = [
  {
    patterns: ['no entendí', 'no te entendí', 'didn\'t understand', 'i don\'t understand'],
    alternatives: {
      es: [
        'Intenta decir: "ir a gastos" para navegar, o "cuánto gasté este mes" para consultar datos.',
        'Puedes preguntar: "qué puedo hacer aquí" para que te explique esta página.',
        'Di algo como: "gasto de 50 dólares en restaurante" para crear un gasto por voz.'
      ],
      en: [
        'Try saying: "go to expenses" to navigate, or "how much did I spend this month" to query data.',
        'You can ask: "what can I do here" so I can explain this page.',
        'Say something like: "expense of 50 dollars at restaurant" to create an expense by voice.'
      ]
    }
  },
  {
    patterns: ['no funciona', 'doesn\'t work', 'not working', 'error'],
    alternatives: {
      es: [
        'Intenta ser más específico. Por ejemplo: "agregar gasto de 100 en oficina".',
        'Si quieres navegar, di el nombre de la sección: "gastos", "ingresos", "clientes".',
        'Para consultas, pregunta directamente: "cuál es mi balance", "cuántos clientes tengo".'
      ],
      en: [
        'Try to be more specific. For example: "add expense of 100 for office".',
        'If you want to navigate, say the section name: "expenses", "income", "clients".',
        'For queries, ask directly: "what is my balance", "how many clients do I have".'
      ]
    }
  }
];

export function useSmartGuidance() {
  const { language } = useLanguage();
  const location = useLocation();
  const { data: profile } = useProfile();
  const { data: expenses } = useExpenses();
  const { data: income } = useIncome();
  const { data: clients } = useClients();
  const { data: projects } = useProjects();
  const { data: stats } = useDashboardStats();

  const userName = profile?.full_name?.split(' ')[0] || 'Usuario';

  // Get contextual welcome message based on current page
  const getContextualWelcome = useCallback((): string => {
    const path = location.pathname;
    const hour = new Date().getHours();
    
    const greeting = hour < 12 
      ? (language === 'es' ? 'Buenos días' : 'Good morning')
      : hour < 18 
        ? (language === 'es' ? 'Buenas tardes' : 'Good afternoon')
        : (language === 'es' ? 'Buenas noches' : 'Good evening');

    const pageMessages: Record<string, { es: string; en: string }> = {
      '/dashboard': {
        es: `${greeting}, ${userName}. Estás en tu Dashboard. ¿Quieres ver tu balance, capturar un gasto, o revisar tus alertas?`,
        en: `${greeting}, ${userName}. You're on your Dashboard. Would you like to see your balance, capture an expense, or review your alerts?`
      },
      '/expenses': {
        es: `${greeting}, ${userName}. Aquí puedes ver y gestionar todos tus gastos. ¿Quieres agregar uno nuevo, filtrar por categoría, o generar un reporte?`,
        en: `${greeting}, ${userName}. Here you can view and manage all your expenses. Would you like to add a new one, filter by category, or generate a report?`
      },
      '/income': {
        es: `${greeting}, ${userName}. Esta es tu sección de ingresos. ¿Quieres registrar un pago de cliente, ver tus tendencias, o consultar tu balance?`,
        en: `${greeting}, ${userName}. This is your income section. Would you like to record a client payment, view your trends, or check your balance?`
      },
      '/clients': {
        es: `${greeting}, ${userName}. Aquí gestionas tus clientes. ¿Quieres agregar un nuevo cliente, ver gastos por cliente, o generar un reporte de reembolso?`,
        en: `${greeting}, ${userName}. Here you manage your clients. Would you like to add a new client, view expenses by client, or generate a reimbursement report?`
      },
      '/projects': {
        es: `${greeting}, ${userName}. Esta es tu sección de proyectos. ¿Quieres crear un proyecto, ver la rentabilidad de uno existente, o asignar gastos?`,
        en: `${greeting}, ${userName}. This is your projects section. Would you like to create a project, view the profitability of an existing one, or assign expenses?`
      },
      '/net-worth': {
        es: `${greeting}, ${userName}. Aquí puedes ver y actualizar tu patrimonio neto. ¿Quieres agregar un activo, registrar un pasivo, o ver la proyección?`,
        en: `${greeting}, ${userName}. Here you can view and update your net worth. Would you like to add an asset, record a liability, or view the projection?`
      },
      '/banking': {
        es: `${greeting}, ${userName}. Esta es la sección de análisis bancario. ¿Quieres importar un estado de cuenta, buscar transacciones, o revisar alertas de anomalías?`,
        en: `${greeting}, ${userName}. This is the banking analysis section. Would you like to import a statement, search transactions, or review anomaly alerts?`
      },
      '/mentorship': {
        es: `${greeting}, ${userName}. Bienvenido a la sección de mentoría financiera. ¿Quieres revisar tus hábitos, establecer una meta, o continuar tu educación?`,
        en: `${greeting}, ${userName}. Welcome to the financial mentorship section. Would you like to review your habits, set a goal, or continue your education?`
      },
      '/tax-calendar': {
        es: `${greeting}, ${userName}. Este es tu calendario fiscal. ¿Quieres ver fechas importantes, usar el optimizador de impuestos, o configurar tu perfil fiscal?`,
        en: `${greeting}, ${userName}. This is your tax calendar. Would you like to see important dates, use the tax optimizer, or configure your tax profile?`
      }
    };

    const defaultMessage = {
      es: `${greeting}, ${userName}. Soy tu asistente financiero. ¿En qué puedo ayudarte hoy?`,
      en: `${greeting}, ${userName}. I'm your financial assistant. How can I help you today?`
    };

    const message = pageMessages[path] || defaultMessage;
    return message[language as 'es' | 'en'];
  }, [location.pathname, language, userName]);

  // Get proactive alerts based on user data
  const getProactiveAlerts = useCallback((): ProactiveAlert[] => {
    const alerts: ProactiveAlert[] = [];

    // Check for pending receipts
    const pendingReceipts = stats?.pendingDocs || 0;
    if (pendingReceipts > 0) {
      alerts.push({
        id: 'pending_receipts',
        priority: pendingReceipts > 5 ? 'high' : 'medium',
        message: {
          es: `Tienes ${pendingReceipts} recibos pendientes de revisar. ¿Quieres ir a la bandeja de caos?`,
          en: `You have ${pendingReceipts} pending receipts to review. Would you like to go to the chaos inbox?`
        },
        action: { es: 'Ir a Bandeja', en: 'Go to Inbox' },
        route: '/chaos-inbox'
      });
    }

    // Check for unclassified expenses
    const unclassifiedExpenses = expenses?.filter(e => e.reimbursement_type === 'pending_classification' || !e.reimbursement_type).length || 0;
    if (unclassifiedExpenses > 3) {
      alerts.push({
        id: 'unclassified_expenses',
        priority: 'medium',
        message: {
          es: `Tienes ${unclassifiedExpenses} gastos sin clasificar. Clasificarlos te ayudará con tus reportes.`,
          en: `You have ${unclassifiedExpenses} unclassified expenses. Classifying them will help with your reports.`
        },
        action: { es: 'Ver Gastos', en: 'View Expenses' },
        route: '/expenses'
      });
    }

    // Check for negative balance
    const yearlyIncome = income?.reduce((sum, inc) => sum + Number(inc.amount), 0) || 0;
    const yearlyExpenses = stats?.totalExpenses || 0;
    const balance = yearlyIncome - yearlyExpenses;
    
    if (balance < 0 && Math.abs(balance) > 1000) {
      alerts.push({
        id: 'negative_balance',
        priority: 'high',
        message: {
          es: `Tu balance anual es negativo por $${Math.abs(balance).toFixed(2)}. ¿Quieres revisar tus gastos?`,
          en: `Your yearly balance is negative by $${Math.abs(balance).toFixed(2)}. Would you like to review your expenses?`
        },
        action: { es: 'Analizar Gastos', en: 'Analyze Expenses' },
        route: '/expenses'
      });
    }

    // Check for clients without projects
    const clientsWithoutProjects = clients?.filter(c => 
      !projects?.some(p => p.client_id === c.id)
    ).length || 0;
    
    if (clientsWithoutProjects > 0 && clients && clients.length > 0) {
      alerts.push({
        id: 'clients_no_projects',
        priority: 'low',
        message: {
          es: `Tienes ${clientsWithoutProjects} clientes sin proyectos asociados. Considera crear proyectos para mejor organización.`,
          en: `You have ${clientsWithoutProjects} clients without associated projects. Consider creating projects for better organization.`
        },
        action: { es: 'Ver Proyectos', en: 'View Projects' },
        route: '/projects'
      });
    }

    return alerts.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [stats, expenses, income, clients, projects]);

  // Check if user is asking for a tutorial
  const findTutorial = useCallback((text: string): Tutorial | null => {
    const normalizedText = text.toLowerCase().trim();
    
    for (const tutorial of VOICE_TUTORIALS) {
      for (const trigger of tutorial.triggers) {
        if (normalizedText.includes(trigger)) {
          return tutorial;
        }
      }
    }
    
    return null;
  }, []);

  // Get post-action suggestion
  const getPostActionSuggestion = useCallback((actionType: string): string | null => {
    const suggestion = POST_ACTION_SUGGESTIONS.find(s => s.trigger === actionType);
    if (!suggestion) return null;
    
    const randomSuggestion = suggestion.suggestions[Math.floor(Math.random() * suggestion.suggestions.length)];
    return randomSuggestion[language as 'es' | 'en'];
  }, [language]);

  // Get error recovery suggestions
  const getErrorRecovery = useCallback((text: string): string[] | null => {
    const normalizedText = text.toLowerCase().trim();
    
    for (const recovery of ERROR_RECOVERIES) {
      for (const pattern of recovery.patterns) {
        if (normalizedText.includes(pattern)) {
          return recovery.alternatives[language as 'es' | 'en'];
        }
      }
    }
    
    return null;
  }, [language]);

  // Format tutorial for speech
  const formatTutorialForSpeech = useCallback((tutorial: Tutorial): string => {
    const lang = language as 'es' | 'en';
    const intro = language === 'es' 
      ? `Te voy a enseñar a ${tutorial.name[lang]}. ` 
      : `I'll teach you how to ${tutorial.name[lang]}. `;
    
    const steps = tutorial.steps.map((step, index) => {
      return `${step.title[lang]}. ${step.description[lang]}`;
    }).join(language === 'es' ? ' Siguiente: ' : ' Next: ');
    
    const outro = language === 'es'
      ? ' ¿Te quedó claro o necesitas que repita algo?'
      : ' Is that clear or do you need me to repeat anything?';
    
    return intro + steps + outro;
  }, [language]);

  // Get quick actions for current page
  const getQuickActions = useMemo(() => {
    const path = location.pathname;
    
    const actionsMap: Record<string, { es: string[]; en: string[] }> = {
      '/dashboard': {
        es: ['ver balance', 'capturar gasto', 'ver alertas', 'abrir calculadora FIRE'],
        en: ['view balance', 'capture expense', 'view alerts', 'open FIRE calculator']
      },
      '/expenses': {
        es: ['agregar gasto', 'filtrar por categoría', 'exportar reporte', 'buscar gasto'],
        en: ['add expense', 'filter by category', 'export report', 'search expense']
      },
      '/income': {
        es: ['agregar ingreso', 'ver tendencias', 'balance del mes'],
        en: ['add income', 'view trends', 'monthly balance']
      },
      '/clients': {
        es: ['agregar cliente', 'ver gastos por cliente', 'generar reporte'],
        en: ['add client', 'view expenses by client', 'generate report']
      },
      '/net-worth': {
        es: ['agregar activo', 'agregar pasivo', 'ver proyección'],
        en: ['add asset', 'add liability', 'view projection']
      }
    };
    
    return actionsMap[path] || { es: [], en: [] };
  }, [location.pathname]);

  return {
    getContextualWelcome,
    getProactiveAlerts,
    findTutorial,
    formatTutorialForSpeech,
    getPostActionSuggestion,
    getErrorRecovery,
    getQuickActions,
    tutorials: VOICE_TUTORIALS
  };
}
