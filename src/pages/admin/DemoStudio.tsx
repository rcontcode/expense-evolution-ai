import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRecMode } from '@/hooks/useRecMode';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Database, Trash2, Sparkles, Video, FileText, ExternalLink } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type Scenario = 'maria_profesional' | 'carlos_caos';

const SCENARIOS: Record<Scenario, { title: string; subtitle: string; description: string; useFor: string[] }> = {
  maria_profesional: {
    title: 'Escenario A — María Profesional',
    subtitle: 'Caso ordenado, ideal para tour general y reportes',
    description:
      'Vida financiera limpia: 12 gastos categorizados, 4 ingresos (sueldos + freelance), 3 facturas recurrentes detectables, 20 transacciones bancarias con patrones recurrentes claros, 1 entidad fiscal Chile/SII.',
    useFor: ['Tour General (90s)', 'Bank Master Truth (90s)', 'Reports & Tax Hub (2min)'],
  },
  carlos_caos: {
    title: 'Escenario B — Carlos Caos',
    subtitle: 'Caso desordenado, ideal para Chaos Inbox y duplicados',
    description:
      '30 transacciones bancarias sin clasificar, 3 grupos de duplicados detectables (Unimarc, Uber Eats, Shell), 6 transacciones recurrentes ocultas (Amazon Prime, Disney+) que se descubren en vivo, 8 gastos duplicados.',
    useFor: ['Chaos Inbox (2min)', 'Smart Duplicate Detection demo'],
  },
};

export default function DemoStudio() {
  const { toast } = useToast();
  const { active: recActive, setMode: setRecMode } = useRecMode();
  const [status, setStatus] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState<'status' | 'seed' | 'reset' | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<Scenario>('maria_profesional');

  const callDemoApi = async (action: 'status' | 'seed' | 'reset', scenario?: Scenario) => {
    const { data, error } = await supabase.functions.invoke('manage-demo-data', {
      body: { action, scenario },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const fetchStatus = async () => {
    setLoading('status');
    try {
      const data = await callDemoApi('status');
      setStatus(data.result);
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message ?? 'No se pudo consultar el estado', variant: 'destructive' });
    } finally {
      setLoading(null);
    }
  };

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSeed = async () => {
    setLoading('seed');
    try {
      const data = await callDemoApi('seed', selectedScenario);
      toast({
        title: 'Escenario cargado',
        description: `Insertados: ${JSON.stringify(data.result)}`,
      });
      await fetchStatus();
    } catch (e: any) {
      toast({ title: 'Error al cargar', description: e?.message, variant: 'destructive' });
    } finally {
      setLoading(null);
    }
  };

  const handleReset = async () => {
    setLoading('reset');
    try {
      const data = await callDemoApi('reset');
      toast({
        title: 'Datos demo eliminados',
        description: `Borrados: ${JSON.stringify(data.result)}`,
      });
      await fetchStatus();
    } catch (e: any) {
      toast({ title: 'Error al limpiar', description: e?.message, variant: 'destructive' });
    } finally {
      setLoading(null);
    }
  };

  const totalDemo = status ? Object.values(status).reduce((a, b) => a + Math.max(0, b), 0) : 0;

  return (
    <div className="container mx-auto max-w-5xl p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-primary" />
          Demo Studio
        </h1>
        <p className="text-muted-foreground mt-1">
          Carga datos de ejemplo realistas para grabar videos sin exponer información personal.
        </p>
      </div>

      {/* Status card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Estado actual
          </CardTitle>
          <CardDescription>Registros demo activos en tu cuenta (filtrados por prefijo [DEMO])</CardDescription>
        </CardHeader>
        <CardContent>
          {loading === 'status' && !status ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <div className="flex flex-wrap gap-2">
              <Badge variant={totalDemo > 0 ? 'default' : 'secondary'} className="text-sm">
                Total: {totalDemo}
              </Badge>
              {status &&
                Object.entries(status).map(([table, count]) => (
                  <Badge key={table} variant="outline">
                    {table}: {count}
                  </Badge>
                ))}
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={fetchStatus} className="mt-3" disabled={loading !== null}>
            Actualizar
          </Button>
        </CardContent>
      </Card>

      {/* REC Mode card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            REC Mode
          </CardTitle>
          <CardDescription>
            Oculta tu nombre, email e IDs sensibles en toda la app durante la grabación. También aparece un FAB rojo "● REC" abajo a la derecha.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="font-medium">{recActive ? 'Activo' : 'Desactivado'}</p>
            <p className="text-sm text-muted-foreground">
              {recActive ? 'Tu identidad está enmascarada visualmente.' : 'Tus datos reales son visibles.'}
            </p>
          </div>
          <Switch checked={recActive} onCheckedChange={setRecMode} />
        </CardContent>
      </Card>

      {/* Scenario selector */}
      <Card>
        <CardHeader>
          <CardTitle>Cargar escenario de ejemplo</CardTitle>
          <CardDescription>Cargar reemplaza los datos demo previos (idempotente).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            {(Object.keys(SCENARIOS) as Scenario[]).map((key) => {
              const s = SCENARIOS[key];
              const selected = selectedScenario === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedScenario(key)}
                  className={`text-left rounded-lg border-2 p-4 transition-all ${
                    selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <h3 className="font-bold">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.subtitle}</p>
                  <p className="text-xs mt-2">{s.description}</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {s.useFor.map((u) => (
                      <Badge key={u} variant="secondary" className="text-xs">
                        {u}
                      </Badge>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={loading !== null}>
                  {loading === 'seed' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Cargar escenario seleccionado
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Cargar {SCENARIOS[selectedScenario].title}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esto primero limpiará todos los datos demo previos (registros con prefijo [DEMO]) y luego
                    insertará los nuevos. Tus datos reales NO se tocan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSeed}>Cargar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={loading !== null || totalDemo === 0}>
                  {loading === 'reset' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Limpiar todos los datos demo
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar todos los registros [DEMO]?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Borra solo los registros con prefijo [DEMO] de tu cuenta. Tus datos reales se mantienen intactos.
                    Esta acción es irreversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Sí, limpiar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Docs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentación y guiones
          </CardTitle>
          <CardDescription>
            Los guiones de los 5 videos demo y el checklist pre-grabación están en
            <code className="mx-1 px-1.5 py-0.5 bg-muted rounded text-xs">/mnt/documents/demo-studio/</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p className="font-medium">Flujo recomendado para grabar:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Activa REC Mode (toggle arriba o FAB rojo).</li>
            <li>Carga el escenario que requiere el guion (A o B — ver badges).</li>
            <li>Abre el guion correspondiente en una segunda pantalla.</li>
            <li>Graba siguiendo timestamps y voiceover.</li>
            <li>Al terminar: "Limpiar todos los datos demo" + desactiva REC Mode.</li>
          </ol>
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            Pídele al asistente "muéstrame el guion del tour general" cuando estés listo para grabar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
