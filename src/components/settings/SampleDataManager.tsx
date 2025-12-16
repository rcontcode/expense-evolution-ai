import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
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

export function SampleDataManager() {
  const { language } = useLanguage();
  const isEs = language === 'es';
  
  const generateSampleData = useGenerateSampleData();
  const deleteSampleData = useDeleteSampleData();
  const deleteSampleDataBySection = useDeleteSampleDataBySection();
  
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [showDeleteSelectedDialog, setShowDeleteSelectedDialog] = useState(false);

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
        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {isEs 
              ? "Los datos de ejemplo están marcados con [SAMPLE] para identificarlos fácilmente. Puedes eliminarlos por sección para ir aprendiendo gradualmente sin perder ejemplos en otras áreas."
              : "Sample data is marked with [SAMPLE] for easy identification. You can delete them by section to learn gradually without losing examples in other areas."
            }
          </AlertDescription>
        </Alert>

        {/* Generate Button */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => generateSampleData.mutate()}
            disabled={isLoading}
            className="gap-2"
          >
            {generateSampleData.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isEs ? "Generar Datos de Ejemplo" : "Generate Sample Data"}
          </Button>
          <Button 
            variant="destructive"
            onClick={() => setShowDeleteAllDialog(true)}
            disabled={isLoading}
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
        {(deleteSampleData.isSuccess || deleteSampleDataBySection.isSuccess) && (
          <Alert className="bg-green-500/10 border-green-500/30">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-600">
              {isEs ? "¡Datos eliminados exitosamente!" : "Data deleted successfully!"}
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
