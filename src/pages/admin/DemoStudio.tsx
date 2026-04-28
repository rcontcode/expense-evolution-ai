import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRecMode } from '@/hooks/useRecMode';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, Database, Trash2, Sparkles, Video, FileText, Copy, ChevronDown, ChevronRight, VolumeX, Star,
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { DEMO_SCRIPTS, extractVoiceover, type DemoScriptScenario } from '@/data/demo-scripts';

type Scenario = DemoScriptScenario;
type Tier = 'showcase' | 'focused';

interface ScenarioMeta {
  title: string;
  subtitle: string;
  description: string;
  tier: Tier;
  estRecords: string;
  covers: string[];
}

const SCENARIOS: Record<Scenario, ScenarioMeta> = {
  // SHOWCASE COMPLETOS
  familia_rodriguez: {
    title: 'Familia Rodríguez (CL)',
    subtitle: 'Padre de familia, 6 meses completos',
    description: 'Pedro + Carmen + 2 hijos. 6 meses de gastos (~110), 12 sueldos, 8 bills, 220+ txns bancarias en 2 cuentas, 6 presupuestos, 3 metas, 2 deudas, 8 tags.',
    tier: 'showcase',
    estRecords: '~370 registros',
    covers: ['Dashboard', 'Gastos compartidos', 'Tags', 'Presupuestos', 'Metas', 'Deudas', 'Bills', 'Multi-cuenta', 'Mentor'],
  },
  ecolavanderia_spa: {
    title: 'EcoLavandería SpA (CL)',
    subtitle: 'PYME chilena con 2 empleados',
    description: 'Sofía, dueña pyme. 6 meses: ~85 gastos B2B, ~80 ingresos (POS+B2B+Mercado Pago), 5 bills, 3 cuentas, 18 mileage, 3 presupuestos, 2 metas, deuda CORFO, 7 tags por cliente.',
    tier: 'showcase',
    estRecords: '~340 registros',
    covers: ['Multi-cuenta', 'B2B clientes', 'Mileage', 'Reportes SII', 'Bills B2B', 'Flujo caja', 'Entidad SpA'],
  },
  // FOCALIZADOS
  maria_profesional: {
    title: 'María Profesional (CL)',
    subtitle: 'Persona natural, ingresos mixtos',
    description: '12 gastos, 4 ingresos (sueldo + freelance), 3 bills, 16 txns bancarias, entidad fiscal CL.',
    tier: 'focused',
    estRecords: '~36 registros',
    covers: ['Tour rápido', 'Bank Master', 'Reports'],
  },
  carlos_caos: {
    title: 'Carlos Caos (CL)',
    subtitle: 'Duplicados y desorden bancario',
    description: '13 transacciones bancarias con 3 grupos de duplicados, 6 gastos duplicados manualmente, recurrentes ocultas.',
    tier: 'focused',
    estRecords: '~19 registros',
    covers: ['Smart Duplicates', 'Chaos Inbox'],
  },
  constructora_ca: {
    title: 'Lopez Construction (CA)',
    subtitle: 'Empresa B2B Canadá HST/GST',
    description: '8 gastos CAD, 3 pagos clientes, 3 bills, 5 mileage, entidad fiscal CA con BN.',
    tier: 'focused',
    estRecords: '~30 registros',
    covers: ['Tax Hub CRA', 'Mileage', 'Demo CA'],
  },
  pareja_millennial: {
    title: 'Pareja Millennial (CL)',
    subtitle: 'Sin hijos, ahorrando casa propia',
    description: 'Daniela + Joaquín. 12 gastos, 2 sueldos, 2 metas (casa $45M, viaje), 4 tags compartidos.',
    tier: 'focused',
    estRecords: '~32 registros',
    covers: ['Tags pareja', 'Meta conjunta', 'Multi-cuenta'],
  },
};

const SCENARIO_LABEL: Record<DemoScriptScenario, string> = {
  familia_rodriguez: 'Familia',
  ecolavanderia_spa: 'PYME',
  maria_profesional: 'María',
  carlos_caos: 'Carlos',
  constructora_ca: 'Lopez',
  pareja_millennial: 'Pareja',
};

export default function DemoStudio() {
  const { toast } = useToast();
  const { active: recActive, quietMode, setMode: setRecMode, setQuiet } = useRecMode();
  const [status, setStatus] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState<'status' | 'seed' | 'reset' | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<Scenario>('familia_rodriguez');
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

  const showcaseKeys = (Object.keys(SCENARIOS) as Scenario[]).filter((k) => SCENARIOS[k].tier === 'showcase');
  const focusedKeys = (Object.keys(SCENARIOS) as Scenario[]).filter((k) => SCENARIOS[k].tier === 'focused');

  const renderScenarioCard = (key: Scenario) => {
    const s = SCENARIOS[key];
    const selected = selectedScenario === key;
    const isShowcase = s.tier === 'showcase';
    return (
      <button
        key={key}
        onClick={() => setSelectedScenario(key)}
        className={`text-left rounded-lg border-2 p-4 transition-all ${
          selected ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:border-primary/50'
        }`}
      >
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-sm">{s.title}</h3>
          {isShowcase ? (
            <Badge className="text-[9px] bg-amber-500 hover:bg-amber-600 text-white shrink-0">
              <Star className="h-2.5 w-2.5 mr-0.5" /> COMPLETO
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[9px] shrink-0">FOCALIZADO</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{s.subtitle}</p>
        <p className="text-xs mt-2">{s.description}</p>
        <p className="text-[10px] mt-2 font-mono text-primary">{s.estRecords}</p>
        <div className="flex flex-wrap gap-1 mt-2">
          {s.covers.map((u) => (
            <Badge key={u} variant="secondary" className="text-[10px]">{u}</Badge>
          ))}
        </div>
      </button>
    );
  };

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
          <CardDescription>
            Cargar reemplaza los datos demo previos (idempotente). Recomendado para grabar tour de venta: <strong>Showcase Completo</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Showcase Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                Showcase Completo — para grabar tour de venta
              </h3>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {showcaseKeys.map(renderScenarioCard)}
            </div>
          </div>

          {/* Focused Section */}
          <div className="space-y-3 border-t pt-6">
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Arquetipos Focalizados — para grabar features puntuales
            </h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {focusedKeys.map(renderScenarioCard)}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 border-t pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={loading !== null}>
                  {loading === 'seed' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Cargar: {SCENARIOS[selectedScenario].title}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Cargar {SCENARIOS[selectedScenario].title}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esto primero limpiará todos los datos demo previos (registros con prefijo [DEMO], además de tags, presupuestos y metas) y luego insertará los nuevos. <strong>Tus datos reales NO se tocan.</strong>
                    <br /><br />
                    Estimado a insertar: <strong>{SCENARIOS[selectedScenario].estRecords}</strong>
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
                    Borra los registros con prefijo [DEMO] de tu cuenta + todas tus tags, presupuestos y metas (asumimos que son demo en cuenta admin). Tus gastos/ingresos reales se mantienen intactos.
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
            Los guiones embebidos. Copia el voiceover ES o EN al portapapeles para grabar fácil.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {DEMO_SCRIPTS.map((s) => {
            const open = openScriptId === s.id;
            const voiceES = extractVoiceover(s.raw, 'ES');
            const voiceEN = extractVoiceover(s.raw, 'EN');
            const meta = SCENARIOS[s.scenario];
            const isShowcase = meta?.tier === 'showcase';
            return (
              <div key={s.id} className={`border rounded-lg overflow-hidden ${isShowcase ? 'border-amber-300/50' : ''}`}>
                <button
                  onClick={() => setOpenScriptId(open ? null : s.id)}
                  className="w-full flex items-center gap-2 p-3 hover:bg-muted/50 transition-colors"
                >
                  {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                  <span className="font-mono text-xs text-muted-foreground">#{s.number}</span>
                  <span className="font-semibold text-sm flex-1 text-left">{s.title}</span>
                  {isShowcase && <Star className="h-3 w-3 text-amber-500" />}
                  <Badge variant="outline" className="text-[10px]">{s.duration}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{SCENARIO_LABEL[s.scenario]}</Badge>
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
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => {
                          setSelectedScenario(s.scenario);
                          toast({ title: 'Escenario seleccionado', description: `Listo para cargar "${SCENARIOS[s.scenario]?.title}"` });
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <Sparkles className="h-3 w-3 mr-1" /> Usar este escenario
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
            <li>Para tour completo de venta: elige <strong>Familia Rodríguez</strong> o <strong>EcoLavandería SpA</strong>.</li>
            <li>Para feature puntual: elige el arquetipo focalizado correspondiente.</li>
            <li>Click "Cargar". Espera ~10 segundos para los showcase (más datos).</li>
            <li>Abre el guion correspondiente, copia el voiceover, graba.</li>
            <li>Al terminar: "Limpiar todos los datos demo" + desactiva REC Mode.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
