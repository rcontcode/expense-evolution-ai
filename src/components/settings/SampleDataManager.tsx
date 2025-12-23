import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  Trash2, 
  RefreshCw, 
  Users, 
  FolderKanban, 
  Receipt, 
  TrendingUp, 
  Car, 
  Scale, 
  Target, 
  FileText, 
  Bell, 
  BookOpen, 
  Building2,
  Loader2,
  Info,
  CheckCircle2,
  Clock,
  AlertTriangle,
  LogIn
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGenerateSampleData, useDeleteSampleData, useDeleteSampleDataBySection } from '@/hooks/data/useGenerateSampleData';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Link } from 'react-router-dom';

const SAMPLE_SECTIONS = [
  { key: 'clients', icon: Users, labelEs: 'Clientes', labelEn: 'Clients', color: 'text-blue-500' },
  { key: 'projects', icon: FolderKanban, labelEs: 'Proyectos', labelEn: 'Projects', color: 'text-purple-500' },
  { key: 'expenses', icon: Receipt, labelEs: 'Gastos', labelEn: 'Expenses', color: 'text-red-500' },
  { key: 'income', icon: TrendingUp, labelEs: 'Ingresos', labelEn: 'Income', color: 'text-green-500' },
  { key: 'mileage', icon: Car, labelEs: 'Kilometraje', labelEn: 'Mileage', color: 'text-amber-500' },
  { key: 'assets', icon: Scale, labelEs: 'Activos', labelEn: 'Assets', color: 'text-cyan-500' },
  { key: 'liabilities', icon: Building2, labelEs: 'Pasivos', labelEn: 'Liabilities', color: 'text-orange-500' },
  { key: 'goals', icon: Target, labelEs: 'Metas', labelEn: 'Goals', color: 'text-pink-500' },
  { key: 'contracts', icon: FileText, labelEs: 'Contratos', labelEn: 'Contracts', color: 'text-indigo-500' },
  { key: 'notifications', icon: Bell, labelEs: 'Notificaciones', labelEn: 'Notifications', color: 'text-yellow-500' },
  { key: 'education', icon: BookOpen, labelEs: 'Educación', labelEn: 'Education', color: 'text-teal-500' },
  { key: 'bank_transactions', icon: Building2, labelEs: 'Transacciones', labelEn: 'Transactions', color: 'text-slate-500' },
];

const GENERATION_STEPS = [
  { key: 'clients', labelEs: 'Creando clientes...', labelEn: 'Creating clients...' },
  { key: 'projects', labelEs: 'Creando proyectos...', labelEn: 'Creating projects...' },
  { key: 'tags', labelEs: 'Creando etiquetas...', labelEn: 'Creating tags...' },
  { key: 'expenses', labelEs: 'Creando gastos (20 registros)...', labelEn: 'Creating expenses (20 records)...' },
  { key: 'income', labelEs: 'Creando ingresos (12 registros)...', labelEn: 'Creating income (12 records)...' },
  { key: 'mileage', labelEs: 'Creando kilometraje (8 viajes)...', labelEn: 'Creating mileage (8 trips)...' },
  { key: 'assets', labelEs: 'Creando activos (10 registros)...', labelEn: 'Creating assets (10 records)...' },
  { key: 'liabilities', labelEs: 'Creando pasivos (5 registros)...', labelEn: 'Creating liabilities (5 records)...' },
  { key: 'bank', labelEs: 'Creando transacciones bancarias...', labelEn: 'Creating bank transactions...' },
  { key: 'goals', labelEs: 'Creando metas financieras...', labelEn: 'Creating financial goals...' },
  { key: 'snapshots', labelEs: 'Creando historial patrimonial...', labelEn: 'Creating net worth history...' },
  { key: 'contracts', labelEs: 'Creando contratos...', labelEn: 'Creating contracts...' },
  { key: 'notifications', labelEs: 'Creando notificaciones...', labelEn: 'Creating notifications...' },
  { key: 'habits', labelEs: 'Creando hábitos financieros...', labelEn: 'Creating financial habits...' },
  { key: 'journal', labelEs: 'Creando diario financiero...', labelEn: 'Creating financial journal...' },
  { key: 'education', labelEs: 'Creando recursos educativos...', labelEn: 'Creating education resources...' },
  { key: 'pyf', labelEs: 'Configurando págate primero...', labelEn: 'Setting up pay yourself first...' },
  { key: 'profile', labelEs: 'Creando perfil financiero...', labelEn: 'Creating financial profile...' },
  { key: 'gamification', labelEs: 'Configurando gamificación...', labelEn: 'Setting up gamification...' },
  { key: 'done', labelEs: '¡Completado!', labelEn: 'Complete!' },
];

export function SampleDataManager() {
  const { language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const isEs = language === 'es';
  
  const generateSampleData = useGenerateSampleData();
  const deleteSampleData = useDeleteSampleData();
  const deleteSampleDataBySection = useDeleteSampleDataBySection();
  
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [showDeleteSelectedDialog, setShowDeleteSelectedDialog] = useState(false);
  
  // Progress simulation for better UX
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Check if user is authenticated
  const isAuthenticated = !!user;

  // Simulate progress when generating
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let timeInterval: NodeJS.Timeout;
    
    if (generateSampleData.isPending) {
      setCurrentStep(0);
      setElapsedTime(0);
      
      // Update elapsed time every second
      timeInterval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      
      // Simulate step progression (average ~1.5s per step, 20 steps)
      interval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < GENERATION_STEPS.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 1500);
    } else {
      setCurrentStep(0);
      setElapsedTime(0);
    }
    
    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, [generateSampleData.isPending]);

  const toggleSection = (key: string) => {
    setSelectedSections(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key) 
        : [...prev, key]
    );
  };

  const selectAll = () => {
    setSelectedSections(SAMPLE_SECTIONS.map(s => s.key));
  };

  const deselectAll = () => {
    setSelectedSections([]);
  };

  const handleDeleteSelected = async () => {
    await deleteSampleDataBySection.mutateAsync(selectedSections);
    setSelectedSections([]);
    setShowDeleteSelectedDialog(false);
  };

  const handleDeleteAll = async () => {
    await deleteSampleData.mutateAsync();
    setShowDeleteAllDialog(false);
  };

  const isLoading = generateSampleData.isPending || deleteSampleData.isPending || deleteSampleDataBySection.isPending;
  const progressPercent = generateSampleData.isPending 
    ? Math.min(((currentStep + 1) / GENERATION_STEPS.length) * 100, 95) 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          {isEs ? "Gestión de Datos de Ejemplo" : "Sample Data Management"}
        </CardTitle>
        <CardDescription>
          {isEs 
            ? "Genera datos de ejemplo para explorar la app o elimina secciones específicas cuando ya no las necesites."
            : "Generate sample data to explore the app or delete specific sections when no longer needed."
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Indicator when generating */}
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
                <Clock className="h-4 w-4" />
                {elapsedTime}s
              </div>
            </div>
            
            <Progress value={progressPercent} className="h-2" />
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {isEs ? GENERATION_STEPS[currentStep]?.labelEs : GENERATION_STEPS[currentStep]?.labelEn}
              </span>
              <span className="text-muted-foreground">
                {currentStep + 1} / {GENERATION_STEPS.length}
              </span>
            </div>
            
            <div className="grid grid-cols-5 gap-1">
              {GENERATION_STEPS.slice(0, 10).map((step, idx) => (
                <div 
                  key={step.key}
                  className={`h-1 rounded-full transition-colors ${
                    idx <= currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              {isEs 
                ? "Esto puede tomar entre 20-30 segundos dependiendo de la conexión..."
                : "This may take 20-30 seconds depending on connection..."
              }
            </p>
          </div>
        )}

        {/* Auth Warning */}
        {!isAuthenticated && !authLoading && (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-amber-600">
                {isEs 
                  ? "Debes iniciar sesión para generar datos de ejemplo." 
                  : "You must be logged in to generate sample data."
                }
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

        {/* Info Alert - hide when generating */}
        {!generateSampleData.isPending && isAuthenticated && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {isEs 
                ? "Los datos de ejemplo están marcados con [SAMPLE] para identificarlos fácilmente. Puedes eliminarlos por sección para ir aprendiendo gradualmente sin perder ejemplos en otras áreas."
                : "Sample data is marked with [SAMPLE] for easy identification. You can delete them by section to learn gradually without losing examples in other areas."
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Generate Button */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => generateSampleData.mutate(undefined)}
            disabled={isLoading || !isAuthenticated}
            className="gap-2"
            size="lg"
          >
            {generateSampleData.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isEs ? "Generando..." : "Generating..."}
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                {isEs ? "Generar Datos de Ejemplo" : "Generate Sample Data"}
              </>
            )}
          </Button>
          <Button 
            variant="destructive"
            onClick={() => setShowDeleteAllDialog(true)}
            disabled={isLoading || !isAuthenticated}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isEs ? "Eliminar Todos" : "Delete All"}
          </Button>
        </div>

        {/* Section Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">
              {isEs ? "Eliminar por Sección" : "Delete by Section"}
            </h4>
            <div className="flex gap-2">
              <Button variant="link" size="sm" onClick={selectAll}>
                {isEs ? "Seleccionar todo" : "Select all"}
              </Button>
              <Button variant="link" size="sm" onClick={deselectAll}>
                {isEs ? "Deseleccionar" : "Deselect"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {SAMPLE_SECTIONS.map(section => {
              const Icon = section.icon;
              const isSelected = selectedSections.includes(section.key);
              
              return (
                <div 
                  key={section.key}
                  onClick={() => toggleSection(section.key)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all flex items-center gap-3
                    ${isSelected ? 'border-destructive bg-destructive/10' : 'hover:border-primary/50'}`}
                >
                  <Checkbox checked={isSelected} />
                  <Icon className={`h-4 w-4 ${section.color}`} />
                  <span className="text-sm">
                    {isEs ? section.labelEs : section.labelEn}
                  </span>
                </div>
              );
            })}
          </div>

          {selectedSections.length > 0 && (
            <div className="flex items-center justify-between pt-2">
              <Badge variant="secondary">
                {selectedSections.length} {isEs ? "seleccionados" : "selected"}
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
                {isEs ? "Eliminar Seleccionados" : "Delete Selected"}
              </Button>
            </div>
          )}
        </div>

        {/* Success State */}
        {(generateSampleData.isSuccess || deleteSampleData.isSuccess || deleteSampleDataBySection.isSuccess) && (
          <Alert className="bg-green-500/10 border-green-500/30">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-600">
              {generateSampleData.isSuccess 
                ? (isEs ? "¡Datos generados exitosamente! Revisa las secciones de la app." : "Data generated successfully! Check the app sections.")
                : (isEs ? "¡Datos eliminados exitosamente!" : "Data deleted successfully!")
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Error State */}
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
            <AlertDialogTitle>
              {isEs ? "¿Eliminar todos los datos de ejemplo?" : "Delete all sample data?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isEs 
                ? "Esto eliminará TODOS los datos marcados con [SAMPLE] de todas las secciones. Esta acción no se puede deshacer."
                : "This will delete ALL data marked with [SAMPLE] from all sections. This action cannot be undone."
              }
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
            <AlertDialogTitle>
              {isEs ? "¿Eliminar secciones seleccionadas?" : "Delete selected sections?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isEs 
                ? `Esto eliminará los datos de ejemplo de: ${selectedSections.map(s => SAMPLE_SECTIONS.find(sec => sec.key === s)?.labelEs).join(', ')}`
                : `This will delete sample data from: ${selectedSections.map(s => SAMPLE_SECTIONS.find(sec => sec.key === s)?.labelEn).join(', ')}`
              }
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
