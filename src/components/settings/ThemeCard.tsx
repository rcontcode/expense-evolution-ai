import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme, ThemeStyle } from '@/contexts/ThemeContext';
import { 
  Palette, Sun, Moon, ChevronDown, ChevronUp, AlertTriangle, Zap
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

export function ThemeCard() {
  const { language } = useLanguage();
  const { 
    mode, style, setMode, setStyle, 
    animationSpeed, animationIntensity, 
    setAnimationSpeed, setAnimationIntensity 
  } = useTheme();
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Check if using optimized theme
  const isOptimizedTheme = style === 'evo-light' || style === 'evo-dark';

  return (
    <Card data-highlight="theme-settings">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>{language === 'es' ? 'Apariencia' : 'Appearance'}</CardTitle>
            <CardDescription>
              {language === 'es' 
                ? 'Elige entre modo claro u oscuro' 
                : 'Choose between light or dark mode'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Simple Light/Dark Toggle */}
        <div className="space-y-3">
          <Label>{language === 'es' ? 'Modo de Color' : 'Color Mode'}</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setMode('light');
                if (!isOptimizedTheme) setStyle('evo-light' as ThemeStyle);
              }}
              className={`relative p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                mode === 'light' 
                  ? 'border-primary ring-2 ring-primary/20 bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-100 via-white to-sky-100 flex items-center justify-center shadow-lg">
                <Sun className="h-8 w-8 text-amber-500" />
              </div>
              <div className="text-center">
                <span className="font-semibold block">{language === 'es' ? 'Claro' : 'Light'}</span>
                <span className="text-xs text-muted-foreground">
                  {language === 'es' ? 'Ideal para el día' : 'Best for daytime'}
                </span>
              </div>
              {mode === 'light' && (
                <div className="absolute top-2 right-2">
                  <Badge variant="default" className="text-[10px]">
                    {language === 'es' ? 'Activo' : 'Active'}
                  </Badge>
                </div>
              )}
            </button>

            <button
              onClick={() => {
                setMode('dark');
                if (!isOptimizedTheme) setStyle('evo-dark' as ThemeStyle);
              }}
              className={`relative p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                mode === 'dark' 
                  ? 'border-primary ring-2 ring-primary/20 bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 flex items-center justify-center shadow-lg">
                <Moon className="h-8 w-8 text-cyan-400" />
              </div>
              <div className="text-center">
                <span className="font-semibold block">{language === 'es' ? 'Oscuro' : 'Dark'}</span>
                <span className="text-xs text-muted-foreground">
                  {language === 'es' ? 'Ideal para la noche' : 'Best for nighttime'}
                </span>
              </div>
              {mode === 'dark' && (
                <div className="absolute top-2 right-2">
                  <Badge variant="default" className="text-[10px]">
                    {language === 'es' ? 'Activo' : 'Active'}
                  </Badge>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Optimized Theme Info */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
          <Zap className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-success">
              {language === 'es' ? 'Tema Optimizado Activo' : 'Optimized Theme Active'}
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              {language === 'es' 
                ? 'Usando tema EvoFinz optimizado para máximo rendimiento y velocidad.' 
                : 'Using EvoFinz optimized theme for maximum performance and speed.'}
            </p>
          </div>
        </div>

        {/* Advanced Themes - Collapsible */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                {language === 'es' ? 'Temas Decorativos Avanzados' : 'Advanced Decorative Themes'}
              </span>
              {advancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 space-y-4">
            {/* Performance Warning */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-warning">
                  {language === 'es' ? 'Aviso de Rendimiento' : 'Performance Notice'}
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  {language === 'es' 
                    ? 'Los temas decorativos incluyen animaciones y efectos visuales que pueden consumir más recursos. Recomendados para dispositivos con buena capacidad de procesamiento (8GB+ RAM, procesador moderno). Si experimentas lentitud, vuelve al tema optimizado EvoFinz.' 
                    : 'Decorative themes include animations and visual effects that may consume more resources. Recommended for devices with good processing power (8GB+ RAM, modern processor). If you experience slowness, return to the optimized EvoFinz theme.'}
                </p>
              </div>
            </div>

            {/* Return to Optimized Button */}
            {!isOptimizedTheme && (
              <Button 
                variant="outline" 
                className="w-full border-success text-success hover:bg-success/10"
                onClick={() => setStyle(mode === 'dark' ? 'evo-dark' as ThemeStyle : 'evo-light' as ThemeStyle)}
              >
                <Zap className="h-4 w-4 mr-2" />
                {language === 'es' ? 'Volver a Tema Optimizado' : 'Return to Optimized Theme'}
              </Button>
            )}

            {/* Classic Styles */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {language === 'es' ? 'Estilos Clásicos' : 'Classic Styles'}
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'modern', gradient: 'from-violet-500 to-fuchsia-500', label: 'Modern' },
                  { value: 'vintage', gradient: 'from-amber-600 to-orange-700', label: 'Vintage' },
                  { value: 'ocean', gradient: 'from-cyan-500 to-blue-600', label: 'Ocean' },
                  { value: 'forest', gradient: 'from-emerald-500 to-green-700', label: 'Forest' },
                  { value: 'sunset', gradient: 'from-orange-500 to-rose-600', label: 'Sunset' },
                  { value: 'minimal', gradient: 'from-slate-400 to-slate-600', label: 'Minimal' },
                ] as const).map(({ value, gradient, label }) => (
                  <button
                    key={value}
                    onClick={() => setStyle(value)}
                    className={`relative p-2 rounded-lg border-2 transition-all ${
                      style === value 
                        ? 'border-primary ring-1 ring-primary/20' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className={`w-full h-4 rounded bg-gradient-to-r ${gradient} mb-1`} />
                    <span className="text-[10px] font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Seasonal Themes */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {language === 'es' ? '🌸 Estaciones' : '🌸 Seasons'}
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {([
                  { value: 'spring', gradient: 'from-pink-400 to-green-400', emoji: '🌸' },
                  { value: 'summer', gradient: 'from-yellow-400 to-cyan-400', emoji: '☀️' },
                  { value: 'autumn', gradient: 'from-orange-500 to-amber-600', emoji: '🍂' },
                  { value: 'winter', gradient: 'from-blue-400 to-slate-300', emoji: '❄️' },
                ] as const).map(({ value, gradient, emoji }) => (
                  <button
                    key={value}
                    onClick={() => setStyle(value)}
                    className={`relative p-2 rounded-lg border-2 transition-all ${
                      style === value 
                        ? 'border-primary ring-1 ring-primary/20' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className={`w-full h-4 rounded bg-gradient-to-r ${gradient} mb-1`} />
                    <span className="text-xs">{emoji}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {language === 'es' ? '🎮 Intereses' : '🎮 Interests'}
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'crypto', gradient: 'from-yellow-500 to-orange-500', emoji: '₿' },
                  { value: 'gaming', gradient: 'from-purple-500 via-pink-500 to-cyan-400', emoji: '🎮' },
                  { value: 'sports', gradient: 'from-blue-600 to-red-500', emoji: '⚽' },
                  { value: 'music', gradient: 'from-purple-600 to-pink-500', emoji: '🎵' },
                  { value: 'coffee', gradient: 'from-amber-700 to-orange-800', emoji: '☕' },
                  { value: 'nature', gradient: 'from-green-500 to-lime-400', emoji: '🌿' },
                ] as const).map(({ value, gradient, emoji }) => (
                  <button
                    key={value}
                    onClick={() => setStyle(value)}
                    className={`relative p-2 rounded-lg border-2 transition-all ${
                      style === value 
                        ? 'border-primary ring-1 ring-primary/20' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className={`w-full h-4 rounded bg-gradient-to-r ${gradient} mb-1`} />
                    <span className="text-xs">{emoji}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Creative */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {language === 'es' ? '🚀 Creativos' : '🚀 Creative'}
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {([
                  { value: 'space', gradient: 'from-indigo-900 via-purple-800 to-blue-900', emoji: '🚀' },
                  { value: 'photography', gradient: 'from-gray-700 to-gray-500', emoji: '📷' },
                  { value: 'travel', gradient: 'from-sky-500 to-amber-400', emoji: '✈️' },
                  { value: 'cinema', gradient: 'from-red-900 via-black to-yellow-600', emoji: '🎬' },
                ] as const).map(({ value, gradient, emoji }) => (
                  <button
                    key={value}
                    onClick={() => setStyle(value)}
                    className={`relative p-2 rounded-lg border-2 transition-all ${
                      style === value 
                        ? 'border-primary ring-1 ring-primary/20' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className={`w-full h-4 rounded bg-gradient-to-r ${gradient} mb-1`} />
                    <span className="text-xs">{emoji}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Animation Controls */}
            <div className="border-t pt-4 mt-4">
              <Label className="text-xs text-muted-foreground mb-3 block">
                {language === 'es' ? '⚡ Control de Animaciones' : '⚡ Animation Controls'}
              </Label>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    {language === 'es' ? 'Velocidad' : 'Speed'}
                  </Label>
                  <div className="flex gap-1">
                    {(['off', 'slow', 'normal', 'fast'] as const).map((speed) => (
                      <Button
                        key={speed}
                        variant={animationSpeed === speed ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setAnimationSpeed(speed)}
                        className="flex-1 text-xs px-1"
                      >
                        {speed === 'off' ? '⏸' : 
                         speed === 'slow' ? '🐢' :
                         speed === 'normal' ? '▶️' : '⚡'}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    {language === 'es' ? 'Intensidad' : 'Intensity'}
                  </Label>
                  <div className="flex gap-1">
                    {(['subtle', 'normal', 'vibrant'] as const).map((intensity) => (
                      <Button
                        key={intensity}
                        variant={animationIntensity === intensity ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setAnimationIntensity(intensity)}
                        className="flex-1 text-xs px-1"
                      >
                        {intensity === 'subtle' ? '◐' : 
                         intensity === 'normal' ? '◑' : '●'}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
