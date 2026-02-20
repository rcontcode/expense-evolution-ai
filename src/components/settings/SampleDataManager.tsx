import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Database, Trash2, RefreshCw, Users, FolderKanban, Receipt, TrendingUp, Car, Scale, 
  Target, FileText, Bell, BookOpen, Building2, Loader2, Info, CheckCircle2, Clock, 
  AlertTriangle, LogIn, Search, AlertCircle, Sparkles, PiggyBank, CalendarClock
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGenerateSampleData, useDeleteSampleData, useDeleteSampleDataBySection, useGenerateSampleDataBySection, useSampleDataCounts } from '@/hooks/data/useGenerateSampleData';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const SAMPLE_SECTIONS = [
  { key: 'clients',           icon: Users,         labelEs: 'Clientes',        labelEn: 'Clients',       color: 'text-blue-500',    bg: 'bg-blue-500/10',    countKey: 'clients' },
  { key: 'projects',          icon: FolderKanban,  labelEs: 'Proyectos',       labelEn: 'Projects',      color: 'text-purple-500',  bg: 'bg-purple-500/10',  countKey: 'projects' },
  { key: 'expenses',          icon: Receipt,       labelEs: 'Gastos',          labelEn: 'Expenses',      color: 'text-red-500',     bg: 'bg-red-500/10',     countKey: 'expenses' },
  { key: 'income',            icon: TrendingUp,    labelEs: 'Ingresos',        labelEn: 'Income',        color: 'text-green-500',   bg: 'bg-green-500/10',   countKey: 'income' },
  { key: 'mileage',           icon: Car,           labelEs: 'Kilometraje',     labelEn: 'Mileage',       color: 'text-amber-500',   bg: 'bg-amber-500/10',   countKey: 'mileage' },
  { key: 'assets',            icon: Scale,         labelEs: 'Activos',         labelEn: 'Assets',        color: 'text-cyan-500',    bg: 'bg-cyan-500/10',    countKey: 'assets' },
  { key: 'liabilities',       icon: Building2,     labelEs: 'Pasivos',         labelEn: 'Liabilities',   color: 'text-orange-500',  bg: 'bg-orange-500/10',  countKey: 'liabilities' },
  { key: 'goals',             icon: Target,        labelEs: 'Metas',           labelEn: 'Goals',         color: 'text-pink-500',    bg: 'bg-pink-500/10',    countKey: 'goals' },
  { key: 'contracts',         icon: FileText,      labelEs: 'Contratos',       labelEn: 'Contracts',     color: 'text-indigo-500',  bg: 'bg-indigo-500/10',  countKey: 'contracts' },
  { key: 'notifications',     icon: Bell,          labelEs: 'Notificaciones',  labelEn: 'Notifications', color: 'text-yellow-500',  bg: 'bg-yellow-500/10',  countKey: 'notifications' },
  { key: 'education',         icon: BookOpen,      labelEs: 'Educación',       labelEn: 'Education',     color: 'text-teal-500',    bg: 'bg-teal-500/10',    countKey: 'education' },
  { key: 'bank_transactions', icon: Building2,     labelEs: 'Transacciones',   labelEn: 'Transactions',  color: 'text-slate-500',   bg: 'bg-slate-500/10',   countKey: 'bank_transactions' },
  { key: 'category_budgets', icon: PiggyBank,     labelEs: 'Presupuestos',    labelEn: 'Budgets',       color: 'text-emerald-500', bg: 'bg-emerald-500/10', countKey: 'category_budgets' },
  { key: 'recurring_bills',  icon: CalendarClock,  labelEs: 'Facturas Recurrentes', labelEn: 'Recurring Bills', color: 'text-rose-500', bg: 'bg-rose-500/10', countKey: 'recurring_bills' },
] as const;

type SectionKey = typeof SAMPLE_SECTIONS[number]['key'];

const GENERATION_STEPS = [
  { key: 'clients',       labelEs: 'Creando clientes...',              labelEn: 'Creating clients...' },
  { key: 'projects',      labelEs: 'Creando proyectos...',             labelEn: 'Creating projects...' },
  { key: 'tags',          labelEs: 'Creando etiquetas...',             labelEn: 'Creating tags...' },
  { key: 'expenses',      labelEs: 'Creando gastos (20 registros)...', labelEn: 'Creating expenses (20 records)...' },
  { key: 'income',        labelEs: 'Creando ingresos (12 registros)...', labelEn: 'Creating income (12 records)...' },
  { key: 'mileage',       labelEs: 'Creando kilometraje (8 viajes)...', labelEn: 'Creating mileage (8 trips)...' },
  { key: 'assets',        labelEs: 'Creando activos (10 registros)...', labelEn: 'Creating assets (10 records)...' },
  { key: 'liabilities',   labelEs: 'Creando pasivos (5 registros)...', labelEn: 'Creating liabilities (5 records)...' },
  { key: 'bank',          labelEs: 'Creando transacciones bancarias...', labelEn: 'Creating bank transactions...' },
  { key: 'goals',         labelEs: 'Creando metas financieras...',     labelEn: 'Creating financial goals...' },
  { key: 'snapshots',     labelEs: 'Creando historial patrimonial...',  labelEn: 'Creating net worth history...' },
  { key: 'contracts',     labelEs: 'Creando contratos...',             labelEn: 'Creating contracts...' },
  { key: 'notifications', labelEs: 'Creando notificaciones...',        labelEn: 'Creating notifications...' },
  { key: 'habits',        labelEs: 'Creando hábitos financieros...',   labelEn: 'Creating financial habits...' },
  { key: 'journal',       labelEs: 'Creando diario financiero...',     labelEn: 'Creating financial journal...' },
  { key: 'education',     labelEs: 'Creando recursos educativos...',   labelEn: 'Creating education resources...' },
  { key: 'pyf',           labelEs: 'Configurando págate primero...',   labelEn: 'Setting up pay yourself first...' },
  { key: 'profile',       labelEs: 'Creando perfil financiero...',     labelEn: 'Creating financial profile...' },
  { key: 'gamification',  labelEs: 'Configurando gamificación...',     labelEn: 'Setting up gamification...' },
  { key: 'budgets',       labelEs: 'Creando presupuestos...',          labelEn: 'Creating budgets...' },
  { key: 'bills',         labelEs: 'Creando facturas recurrentes...',  labelEn: 'Creating recurring bills...' },
  { key: 'done',          labelEs: '¡Completado!',                     labelEn: 'Complete!' },
];

export function SampleDataManager() {
  const { language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const isEs = language === 'es';

  const generateSampleData = useGenerateSampleData();
  const generateBySection = useGenerateSampleDataBySection();
  const deleteSampleData = useDeleteSampleData();
  const deleteSampleDataBySection = useDeleteSampleDataBySection();
  const { data: counts, isLoading: countsLoading, refetch: refetchCounts } = useSampleDataCounts();

  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [showDeleteSelectedDialog, setShowDeleteSelectedDialog] = useState(false);
  const [generatingSection, setGeneratingSection] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  const isAuthenticated = !!user;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let timeInterval: NodeJS.Timeout;
    if (generateSampleData.isPending) {
      setCurrentStep(0);
      setElapsedTime(0);
      timeInterval = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
      interval = setInterval(() => {
        setCurrentStep(prev => prev < GENERATION_STEPS.length - 1 ? prev + 1 : prev);
      }, 1500);
    } else {
      setCurrentStep(0);
      setElapsedTime(0);
    }
    return () => { clearInterval(interval); clearInterval(timeInterval); };
  }, [generateSampleData.isPending]);

  const toggleSection = (key: string) => {
    setSelectedSections(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };
  const selectAllWithData = () => {
    const withData = SAMPLE_SECTIONS.filter(s => (counts?.[s.countKey as keyof typeof counts] ?? 0) > 0).map(s => s.key);
    setSelectedSections(withData.length > 0 ? withData : SAMPLE_SECTIONS.map(s => s.key));
  };
  const selectAll = () => setSelectedSections(SAMPLE_SECTIONS.map(s => s.key));
  const deselectAll = () => setSelectedSections([]);

  const handleDeleteSelected = async () => {
    await deleteSampleDataBySection.mutateAsync(selectedSections);
    setSelectedSections([]);
    setShowDeleteSelectedDialog(false);
  };
  const handleDeleteAll = async () => {
    await deleteSampleData.mutateAsync();
    setShowDeleteAllDialog(false);
  };
  const handleGenerateSection = async (sectionKey: string) => {
    setGeneratingSection(sectionKey);
    try { await generateBySection.mutateAsync(sectionKey); } finally { setGeneratingSection(null); }
  };

  const isLoading = generateSampleData.isPending || deleteSampleData.isPending || deleteSampleDataBySection.isPending || generateBySection.isPending;
  const progressPercent = generateSampleData.isPending ? Math.min(((currentStep + 1) / GENERATION_STEPS.length) * 100, 95) : 0;
  const totalSampleRecords = counts?.total ?? 0;
  const sectionsWithData = SAMPLE_SECTIONS.filter(s => (counts?.[s.countKey as keyof typeof counts] ?? 0) > 0);
  const hasAnySampleData = totalSampleRecords > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          {isEs ? "Gestión de Datos de Ejemplo" : "Sample Data Management"}
        </CardTitle>
        <CardDescription>
          {isEs
            ? "Ve exactamente cuántos datos de ejemplo existen en cada sección, y elimínalos todos o por partes."
            : "See exactly how many sample records exist per section, and delete all or part of them."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">

        {/* Generation Progress */}
        {generateSampleData.isPending && (
          <div className="space-y-4 p-4 bg-primary/5 border border-primary/20 rounded-lg animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="font-medium text-primary">
                  {isEs ? "Generando datos de ejemplo..." : "Generating sample data..."}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />{elapsedTime}s
              </div>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {isEs ? GENERATION_STEPS[currentStep]?.labelEs : GENERATION_STEPS[currentStep]?.labelEn}
              </span>
              <span className="text-muted-foreground">{currentStep + 1} / {GENERATION_STEPS.length}</span>
            </div>
            <div className="grid grid-cols-10 gap-1">
              {GENERATION_STEPS.slice(0, 10).map((step, idx) => (
                <div key={step.key} className={`h-1 rounded-full transition-colors ${idx <= currentStep ? 'bg-primary' : 'bg-muted'}`} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {isEs ? "Esto puede tomar 20-30 segundos..." : "This may take 20-30 seconds..."}
            </p>
          </div>
        )}

        {/* Auth Warning */}
        {!isAuthenticated && !authLoading && (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-amber-600">
                {isEs ? "Debes iniciar sesión para gestionar datos de ejemplo." : "You must be logged in to manage sample data."}
              </span>
              <Link to="/auth">
                <Button size="sm" variant="outline" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  {isEs ? "Iniciar Sesión" : "Log In"}
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* ── DIAGNÓSTICO: Resumen de datos de ejemplo ── */}
        {isAuthenticated && !generateSampleData.isPending && (
          <div className={cn(
            "rounded-xl border p-4 space-y-4",
            hasAnySampleData ? "border-amber-500/40 bg-amber-500/5" : "border-green-500/40 bg-green-500/5"
          )}>
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {countsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : hasAnySampleData ? (
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                <span className="font-semibold text-sm">
                  {countsLoading
                    ? (isEs ? "Analizando datos..." : "Analyzing data...")
                    : hasAnySampleData
                      ? isEs
                        ? `${totalSampleRecords} registros de ejemplo detectados en ${sectionsWithData.length} sección${sectionsWithData.length !== 1 ? 'es' : ''}`
                        : `${totalSampleRecords} sample records detected in ${sectionsWithData.length} section${sectionsWithData.length !== 1 ? 's' : ''}`
                      : isEs ? "Sin datos de ejemplo — todo es real ✓" : "No sample data found — all real ✓"
                  }
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => refetchCounts()} disabled={countsLoading} className="gap-1.5 text-xs">
                <Search className="h-3 w-3" />
                {isEs ? "Actualizar" : "Refresh"}
              </Button>
            </div>

            {/* Grid de secciones con conteo */}
            {!countsLoading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {SAMPLE_SECTIONS.map(section => {
                  const Icon = section.icon;
                  const count = counts?.[section.countKey as keyof typeof counts] ?? 0;
                  const hasData = count > 0;
                  return (
                    <div
                      key={section.key}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all",
                        hasData
                          ? "border-amber-400/50 bg-amber-400/10"
                          : "border-border/40 bg-muted/30 opacity-60"
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5 shrink-0", section.color)} />
                      <span className="flex-1 truncate text-xs font-medium">
                        {isEs ? section.labelEs : section.labelEn}
                      </span>
                      <Badge
                        variant={hasData ? "default" : "secondary"}
                        className={cn("text-[10px] px-1.5 py-0 font-bold", hasData ? "bg-amber-500 text-white" : "")}
                      >
                        {count}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick delete all if has data */}
            {hasAnySampleData && !countsLoading && (
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-500/20">
                <span className="text-xs text-muted-foreground flex-1">
                  {isEs
                    ? "Estos datos pueden estar afectando tus cálculos y proyecciones."
                    : "These records may be affecting your calculations and projections."}
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteAllDialog(true)}
                  disabled={isLoading}
                  className="gap-1.5 text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {isEs ? `Eliminar los ${totalSampleRecords}` : `Delete all ${totalSampleRecords}`}
                </Button>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Botones principales */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => generateSampleData.mutate(undefined)}
            disabled={isLoading || !isAuthenticated}
            className="gap-2"
          >
            {generateSampleData.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" />{isEs ? "Generando..." : "Generating..."}</>
            ) : (
              <><Sparkles className="h-4 w-4" />{isEs ? "Generar Todos los Ejemplos" : "Generate All Samples"}</>
            )}
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteAllDialog(true)}
            disabled={isLoading || !isAuthenticated || !hasAnySampleData}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isEs ? "Eliminar Todos" : "Delete All"}
          </Button>
        </div>

        {/* Delete by Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-sm">{isEs ? "Eliminar por Sección" : "Delete by Section"}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isEs ? "Selecciona qué secciones eliminar. Las marcadas en naranja tienen datos de ejemplo." : "Select sections to delete. Orange ones have sample data."}
              </p>
            </div>
            <div className="flex gap-1">
              <Button variant="link" size="sm" className="text-xs h-7 px-2" onClick={selectAllWithData}>
                {isEs ? "Con datos" : "With data"}
              </Button>
              <Button variant="link" size="sm" className="text-xs h-7 px-2" onClick={selectAll}>
                {isEs ? "Todos" : "All"}
              </Button>
              <Button variant="link" size="sm" className="text-xs h-7 px-2" onClick={deselectAll}>
                {isEs ? "Ninguno" : "None"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {SAMPLE_SECTIONS.map(section => {
              const Icon = section.icon;
              const isSelected = selectedSections.includes(section.key);
              const count = counts?.[section.countKey as keyof typeof counts] ?? 0;
              const hasData = count > 0;
              return (
                <div
                  key={section.key}
                  onClick={() => toggleSection(section.key)}
                  className={cn(
                    "p-3 border rounded-lg cursor-pointer transition-all select-none",
                    "flex items-center gap-2.5",
                    isSelected
                      ? "border-destructive bg-destructive/10"
                      : hasData
                        ? "border-amber-400/60 bg-amber-400/5 hover:border-destructive/50"
                        : "border-border/40 hover:border-primary/40"
                  )}
                >
                  <Checkbox checked={isSelected} className="shrink-0" />
                  <Icon className={cn("h-4 w-4 shrink-0", section.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">
                      {isEs ? section.labelEs : section.labelEn}
                    </div>
                    {!countsLoading && (
                      <div className={cn("text-[10px] font-bold", hasData ? "text-amber-600" : "text-muted-foreground")}>
                        {hasData ? `${count} ${isEs ? 'registros' : 'records'}` : isEs ? 'sin datos' : 'no data'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedSections.length > 0 && (
            <div className="flex items-center justify-between pt-2">
              <Badge variant="secondary">
                {selectedSections.length} {isEs ? "seleccionadas" : "selected"}
              </Badge>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteSelectedDialog(true)}
                disabled={isLoading}
                className="gap-2"
              >
                {deleteSampleDataBySection.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {isEs ? "Eliminar Seleccionadas" : "Delete Selected"}
              </Button>
            </div>
          )}
        </div>

        {/* Generate by Section */}
        <Separator />
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-sm">{isEs ? "Generar por Sección" : "Generate by Section"}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isEs ? "Agrega ejemplos solo a las secciones que necesites." : "Add samples only to the sections you need."}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {SAMPLE_SECTIONS.filter(s => ['clients', 'expenses', 'income', 'mileage', 'assets', 'contracts', 'education'].includes(s.key)).map(section => {
              const Icon = section.icon;
              const isGenerating = generatingSection === section.key;
              return (
                <Button
                  key={section.key}
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateSection(section.key)}
                  disabled={isLoading || !isAuthenticated}
                  className="justify-start gap-2 h-auto py-2.5"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className={cn("h-4 w-4", section.color)} />}
                  <span className="text-xs">{isEs ? section.labelEs : section.labelEn}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Success / Error States */}
        {(generateSampleData.isSuccess || deleteSampleData.isSuccess || deleteSampleDataBySection.isSuccess) && (
          <Alert className="bg-green-500/10 border-green-500/30">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-600">
              {generateSampleData.isSuccess
                ? (isEs ? "¡Datos generados exitosamente!" : "Data generated successfully!")
                : (isEs ? "¡Datos eliminados exitosamente!" : "Data deleted successfully!")}
            </AlertDescription>
          </Alert>
        )}
        {generateSampleData.isError && (
          <Alert className="bg-destructive/10 border-destructive/30">
            <Info className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              {isEs ? "Error al generar datos: " : "Error generating data: "}
              {generateSampleData.error?.message || 'Unknown error'}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      {/* Delete All Confirmation */}
      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isEs ? "¿Eliminar todos los datos de ejemplo?" : "Delete all sample data?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isEs
                ? `Esto eliminará ${totalSampleRecords > 0 ? totalSampleRecords + ' registros' : 'todos los datos'} marcados con [SAMPLE]. Esta acción no se puede deshacer.`
                : `This will delete ${totalSampleRecords > 0 ? totalSampleRecords + ' records' : 'all data'} marked with [SAMPLE]. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isEs ? "Cancelar" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive text-destructive-foreground">
              {isEs ? "Eliminar Todo" : "Delete All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Selected Confirmation */}
      <AlertDialog open={showDeleteSelectedDialog} onOpenChange={setShowDeleteSelectedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isEs ? "¿Eliminar secciones seleccionadas?" : "Delete selected sections?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isEs
                ? `Esto eliminará los datos de ejemplo de: ${selectedSections.map(s => SAMPLE_SECTIONS.find(sec => sec.key === s)?.[isEs ? 'labelEs' : 'labelEn']).join(', ')}`
                : `This will delete sample data from: ${selectedSections.map(s => SAMPLE_SECTIONS.find(sec => sec.key === s)?.labelEn).join(', ')}`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isEs ? "Cancelar" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive text-destructive-foreground">
              {isEs ? "Eliminar" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
