import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRecMode } from '@/hooks/useRecMode';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, Database, Trash2, Sparkles, Video, FileText, Copy, ChevronDown, ChevronRight, VolumeX,
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { DEMO_SCRIPTS, extractVoiceover, type DemoScriptScenario } from '@/data/demo-scripts';

type Scenario = 'maria_profesional' | 'carlos_caos' | 'constructora_ca';

const SCENARIOS: Record<Scenario, { title: string; subtitle: string; description: string; useFor: string[] }> = {
  maria_profesional: {
    title: 'A — María Profesional (CL)',
    subtitle: 'Caso ordenado, persona natural Chile',
    description: '12 gastos categorizados, 4 ingresos, 3 facturas recurrentes, 20 transacciones bancarias con patrones, entidad fiscal CL/SII.',
    useFor: ['Tour General', 'Bank Master Truth', 'Reports & Tax Hub'],
  },
  carlos_caos: {
    title: 'B — Carlos Caos (CL)',
    subtitle: 'Caso desordenado, duplicados y recurrentes ocultas',
    description: '30 transacciones sin clasificar, 3 grupos de duplicados (Unimarc, Uber Eats, Shell), 6 recurrentes ocultas (Amazon, Disney+).',
    useFor: ['Chaos Inbox', 'Smart Duplicates'],
  },
  constructora_ca: {
    title: 'C — Constructora CA (Canadá)',
    subtitle: 'Empresa B2B con HST/GST, mileage tracking',
    description: '8 gastos en CAD, 3 pagos de clientes, 3 facturas (lease, WSIB, software), 5 entradas de mileage, entidad fiscal CA con BN.',
    useFor: ['Reports & Tax Hub (CRA)', 'Demos para leads canadienses'],
  },
};

const SCENARIO_LABEL: Record<DemoScriptScenario, string> = {
  maria_profesional: 'A',
  carlos_caos: 'B',
  constructora_ca: 'C',
};

export default function DemoStudio() {
  const { toast } = useToast();
  const { active: recActive, quietMode, setMode: setRecMode, setQuiet } = useRecMode();
  const [status, setStatus] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState<'status' | 'seed' | 'reset' | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<Scenario>('maria_profesional');
  const [openScriptId, setOpenScriptId] = useState<string | null>(null);

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
      toast({ title: 'Escenario cargado', description: `Insertados: ${JSON.stringify(data.result)}` });
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
      toast({ title: 'Datos demo eliminados', description: `Borrados: ${JSON.stringify(data.result)}` });
      await fetchStatus();
    } catch (e: any) {
      toast({ title: 'Error al limpiar', description: e?.message, variant: 'destructive' });
    } finally {
      setLoading(null);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copiado', description: label });
    } catch {
      toast({ title: 'Error', description: 'No se pudo copiar', variant: 'destructive' });
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

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" /> Estado actual
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
              {status && Object.entries(status).map(([table, count]) => (
                <Badge key={table} variant="outline">{table}: {count}</Badge>
              ))}
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={fetchStatus} className="mt-3" disabled={loading !== null}>
            Actualizar
          </Button>
        </CardContent>
      </Card>

      {/* REC Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" /> REC Mode
          </CardTitle>
          <CardDescription>
            Oculta tu nombre, email e identidad en toda la app. Cuando está activo verás un borde rojo y la etiqueta "DEMO MODE" arriba a la izquierda.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">REC Mode {recActive ? '(activo)' : '(desactivado)'}</p>
              <p className="text-sm text-muted-foreground">
                {recActive ? 'Tu identidad está enmascarada visualmente.' : 'Tus datos reales son visibles.'}
              </p>
            </div>
            <Switch checked={recActive} onCheckedChange={setRecMode} />
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <p className="font-medium flex items-center gap-2">
                <VolumeX className="h-4 w-4" /> Modo silencioso (gamificación)
              </p>
              <p className="text-sm text-muted-foreground">
                Oculta XP, streaks y celebraciones durante REC Mode. No afecta tu progreso real.
              </p>
            </div>
            <Switch checked={quietMode} onCheckedChange={setQuiet} disabled={!recActive} />
          </div>
        </CardContent>
      </Card>

      {/* Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle>Cargar escenario de ejemplo</CardTitle>
          <CardDescription>Cargar reemplaza los datos demo previos (idempotente).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
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
                  <h3 className="font-bold text-sm">{s.title}</h3>
                  <p className="text-xs text-muted-foreground">{s.subtitle}</p>
                  <p className="text-xs mt-2">{s.description}</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {s.useFor.map((u) => (
                      <Badge key={u} variant="secondary" className="text-[10px]">{u}</Badge>
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

      {/* Embedded Scripts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> Guiones de los videos
          </CardTitle>
          <CardDescription>
            Los 5 guiones embebidos. Copia el voiceover ES o EN al portapapeles para grabar fácil.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {DEMO_SCRIPTS.map((s) => {
            const open = openScriptId === s.id;
            const voiceES = extractVoiceover(s.raw, 'ES');
            const voiceEN = extractVoiceover(s.raw, 'EN');
            return (
              <div key={s.id} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenScriptId(open ? null : s.id)}
                  className="w-full flex items-center gap-2 p-3 hover:bg-muted/50 transition-colors"
                >
                  {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                  <span className="font-mono text-xs text-muted-foreground">#{s.number}</span>
                  <span className="font-semibold text-sm flex-1 text-left">{s.title}</span>
                  <Badge variant="outline" className="text-[10px]">{s.duration}</Badge>
                  <Badge variant="secondary" className="text-[10px]">Escenario {SCENARIO_LABEL[s.scenario]}</Badge>
                </button>
                {open && (
                  <div className="border-t p-4 space-y-3 bg-muted/20">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(voiceES, 'Voiceover ES copiado')}>
                        <Copy className="h-3 w-3 mr-1" /> Copiar voiceover ES
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(voiceEN, 'Voiceover EN copiado')}>
                        <Copy className="h-3 w-3 mr-1" /> Copiar voiceover EN
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard(s.raw, 'Guion completo copiado')}>
                        <Copy className="h-3 w-3 mr-1" /> Copiar guion completo
                      </Button>
                    </div>
                    <pre className="text-xs whitespace-pre-wrap font-mono bg-background p-3 rounded border max-h-[400px] overflow-y-auto">
                      {s.raw}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Flujo recomendado para grabar</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Activa REC Mode (toggle arriba) y opcionalmente el Modo silencioso.</li>
            <li>Selecciona el escenario que pide el guion (badge "Escenario A/B/C").</li>
            <li>Click "Cargar escenario seleccionado".</li>
            <li>Abre el guion correspondiente, copia el voiceover, graba.</li>
            <li>Al terminar: "Limpiar todos los datos demo" + desactiva REC Mode.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
