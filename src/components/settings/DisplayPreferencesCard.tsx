import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDisplayPreferences } from '@/hooks/data/useDisplayPreferences';
import { FOCUS_AREAS, FocusAreaId } from '@/lib/constants/focus-areas';
import { LayoutGrid, Layers } from 'lucide-react';

export function DisplayPreferencesCard() {
  const { language } = useLanguage();
  const {
    viewMode,
    activeAreas,
    showFocusDialog,
    setViewMode,
    toggleArea,
    activateAllAreas,
    setShowFocusDialog,
    isLoading,
    isSaving,
  } = useDisplayPreferences();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{language === 'es' ? 'Preferencias de Visualización' : 'Display Preferences'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>
              {language === 'es' ? 'Preferencias de Visualización' : 'Display Preferences'}
            </CardTitle>
            <CardDescription>
              {language === 'es' 
                ? 'Configura cómo se muestra el Dashboard y las áreas activas'
                : 'Configure how the Dashboard displays and active areas'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* View Mode Selection */}
        <div className="space-y-3">
          <Label>
            {language === 'es' ? 'Modo de Vista del Dashboard' : 'Dashboard View Mode'}
          </Label>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'classic' ? 'default' : 'outline'}
              size="sm"
              disabled={isSaving}
              onClick={() => setViewMode('classic')}
              className="flex items-center gap-2"
            >
              <Layers className="h-4 w-4" />
              {language === 'es' ? 'Vista Clásica' : 'Classic View'}
            </Button>
            <Button
              variant={viewMode === 'organized' ? 'default' : 'outline'}
              size="sm"
              disabled={isSaving}
              onClick={() => setViewMode('organized')}
              className="flex items-center gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              {language === 'es' ? 'Vista Organizada' : 'Organized View'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {viewMode === 'classic'
              ? (language === 'es' 
                  ? 'Muestra el Dashboard con los 10 tabs horizontales originales'
                  : 'Shows Dashboard with original 10 horizontal tabs')
              : (language === 'es'
                  ? 'Agrupa las herramientas en 5 secciones temáticas colapsables'
                  : 'Groups tools into 5 collapsible thematic sections')}
          </p>
        </div>

        {/* Focus Areas (only shown for organized view) */}
        {viewMode === 'organized' && (
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label>
                {language === 'es' ? 'Áreas de Enfoque Activas' : 'Active Focus Areas'}
              </Label>
              <Button
                variant="ghost"
                size="sm"
                disabled={isSaving}
                onClick={activateAllAreas}
              >
                {language === 'es' ? 'Activar Todas' : 'Activate All'}
              </Button>
            </div>
            <div className="grid gap-3">
              {(Object.keys(FOCUS_AREAS) as FocusAreaId[]).map((areaId) => {
                const area = FOCUS_AREAS[areaId];
                const isActive = activeAreas.includes(areaId);
                
                return (
                  <div 
                    key={areaId}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                      isActive ? 'border-primary/40 bg-muted/30' : 'border-border opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{area.emoji}</span>
                      <div>
                        <p className="font-medium">{area.name[language]}</p>
                        <p className="text-xs text-muted-foreground">
                          {area.description[language]}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={isActive}
                      disabled={isSaving}
                      onCheckedChange={() => toggleArea(areaId)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Show Focus Dialog on Start */}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="space-y-0.5">
            <Label>
              {language === 'es' ? 'Mostrar selector de enfoque al iniciar' : 'Show focus selector on startup'}
            </Label>
            <p className="text-xs text-muted-foreground">
              {language === 'es'
                ? 'Pregunta qué áreas necesitas al abrir el Dashboard'
                : 'Ask which areas you need when opening Dashboard'}
            </p>
          </div>
          <Switch
            checked={showFocusDialog}
            disabled={isSaving}
            onCheckedChange={setShowFocusDialog}
          />
        </div>
      </CardContent>
    </Card>
  );
}
