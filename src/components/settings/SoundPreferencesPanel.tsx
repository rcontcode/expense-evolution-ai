 import React, { useState, useEffect } from 'react';
 import { Volume2, VolumeX, Flame, Music, Gamepad2, Vibrate, Play, Sparkles, Bell, Navigation, Zap } from 'lucide-react';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Switch } from '@/components/ui/switch';
 import { Slider } from '@/components/ui/slider';
 import { Label } from '@/components/ui/label';
 import { Badge } from '@/components/ui/badge';
 import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
 import { cn } from '@/lib/utils';
 import { useAppSounds, type SoundStyle, type SoundCategory, type SoundPreferences, type SoundName } from '@/hooks/utils/useAppSounds';
 
 interface SoundPreferencesPanelProps {
   language: 'es' | 'en';
   compact?: boolean;
 }
 
 const STYLE_INFO: Record<SoundStyle, { icon: React.ElementType; label: { es: string; en: string }; desc: { es: string; en: string } }> = {
   phoenix: {
     icon: Flame,
     label: { es: 'Phoenix', en: 'Phoenix' },
     desc: { es: 'Temático con fuego y renacimiento', en: 'Fire and rebirth themed' },
   },
   minimal: {
     icon: Music,
     label: { es: 'Minimal', en: 'Minimal' },
     desc: { es: 'Tonos simples y sutiles', en: 'Simple and subtle tones' },
   },
   arcade: {
     icon: Gamepad2,
     label: { es: 'Arcade', en: 'Arcade' },
     desc: { es: 'Retro 8-bit clásico', en: 'Classic retro 8-bit' },
   },
 };
 
 const CATEGORY_INFO: Record<SoundCategory, { icon: React.ElementType; label: { es: string; en: string }; examples: { es: string; en: string } }> = {
   actions: {
     icon: Zap,
     label: { es: 'Acciones', en: 'Actions' },
     examples: { es: 'Crear, editar, eliminar', en: 'Create, edit, delete' },
   },
   celebrations: {
     icon: Sparkles,
     label: { es: 'Celebraciones', en: 'Celebrations' },
     examples: { es: 'Metas, logros, rachas', en: 'Goals, achievements, streaks' },
   },
   navigation: {
     icon: Navigation,
     label: { es: 'Navegación', en: 'Navigation' },
     examples: { es: 'Cambio de página, menús', en: 'Page changes, menus' },
   },
   feedback: {
     icon: Bell,
     label: { es: 'Notificaciones', en: 'Notifications' },
     examples: { es: 'Éxito, error, alertas', en: 'Success, error, alerts' },
   },
 };
 
 // Preview sounds for each category
 const CATEGORY_PREVIEW_SOUNDS: Record<SoundCategory, SoundName> = {
   actions: 'create',
   celebrations: 'achievement',
   navigation: 'menuOpen',
   feedback: 'success',
 };
 
 export function SoundPreferencesPanel({ language, compact = false }: SoundPreferencesPanelProps) {
   const sounds = useAppSounds();
   const [prefs, setPrefs] = useState<SoundPreferences>(sounds.getPreferences());
 
   // Sync local state with hook
   useEffect(() => {
     setPrefs(sounds.getPreferences());
   }, [sounds]);
 
   const handleEnabledChange = (enabled: boolean) => {
     sounds.setEnabled(enabled);
     setPrefs(sounds.getPreferences());
   };
 
   const handleVolumeChange = (volume: number) => {
     sounds.setVolume(volume);
     setPrefs(sounds.getPreferences());
   };
 
   const handleStyleChange = (style: SoundStyle) => {
     sounds.setStyle(style);
     setPrefs(sounds.getPreferences());
     // Play a preview
     sounds.preview('success', style);
   };
 
   const handleCategoryToggle = (category: SoundCategory) => {
     sounds.setCategoryEnabled(category, !prefs.categories[category]);
     setPrefs(sounds.getPreferences());
   };
 
   const handleHapticToggle = () => {
     sounds.setHapticEnabled(!prefs.hapticEnabled);
     setPrefs(sounds.getPreferences());
   };
 
   const previewCategory = (category: SoundCategory) => {
     const soundName = CATEGORY_PREVIEW_SOUNDS[category];
     sounds.preview(soundName);
   };
 
   if (compact) {
     return (
       <div className="space-y-4">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <Volume2 className="h-4 w-4 text-primary" />
             <span className="text-sm font-medium">
               {language === 'es' ? 'Sonidos de la App' : 'App Sounds'}
             </span>
           </div>
           <Switch
             checked={prefs.enabled}
             onCheckedChange={handleEnabledChange}
           />
         </div>
 
         {prefs.enabled && (
           <>
             <div className="space-y-2">
               <div className="flex items-center justify-between text-xs">
                 <span>{language === 'es' ? 'Volumen' : 'Volume'}</span>
                 <Badge variant="secondary" className="text-[10px] h-5">
                   {Math.round(prefs.volume * 100)}%
                 </Badge>
               </div>
               <Slider
                 value={[prefs.volume]}
                 min={0}
                 max={1}
                 step={0.1}
                 onValueChange={([v]) => handleVolumeChange(v)}
               />
             </div>
 
             <div className="space-y-2">
               <span className="text-xs font-medium">
                 {language === 'es' ? 'Estilo' : 'Style'}
               </span>
               <div className="flex gap-2">
                 {(Object.keys(STYLE_INFO) as SoundStyle[]).map((style) => {
                   const info = STYLE_INFO[style];
                   const Icon = info.icon;
                   const isSelected = prefs.style === style;
                   
                   return (
                     <Button
                       key={style}
                       variant={isSelected ? 'default' : 'outline'}
                       size="sm"
                       className="flex-1 h-8"
                       onClick={() => handleStyleChange(style)}
                     >
                       <Icon className="h-3.5 w-3.5 mr-1" />
                       <span className="text-xs">{info.label[language]}</span>
                     </Button>
                   );
                 })}
               </div>
             </div>
           </>
         )}
       </div>
     );
   }
 
   return (
     <Card>
       <CardHeader className="pb-3">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <Volume2 className="h-5 w-5 text-primary" />
             <div>
               <CardTitle className="text-base">
                 {language === 'es' ? 'Sonidos de la App' : 'App Sounds'}
               </CardTitle>
               <CardDescription className="text-xs">
                 {language === 'es' 
                   ? 'Configura los efectos de sonido' 
                   : 'Configure sound effects'}
               </CardDescription>
             </div>
           </div>
           <Switch
             checked={prefs.enabled}
             onCheckedChange={handleEnabledChange}
           />
         </div>
       </CardHeader>
 
       {prefs.enabled && (
         <CardContent className="space-y-6">
           {/* Volume Control */}
           <div className="space-y-3">
             <div className="flex items-center justify-between">
               <Label className="text-sm">
                 {language === 'es' ? 'Volumen General' : 'Master Volume'}
               </Label>
               <Badge variant="secondary">{Math.round(prefs.volume * 100)}%</Badge>
             </div>
             <div className="flex items-center gap-3">
               <VolumeX className="h-4 w-4 text-muted-foreground" />
               <Slider
                 value={[prefs.volume]}
                 min={0}
                 max={1}
                 step={0.05}
                 onValueChange={([v]) => handleVolumeChange(v)}
                 className="flex-1"
               />
               <Volume2 className="h-4 w-4 text-muted-foreground" />
             </div>
           </div>
 
           {/* Sound Style Selection */}
           <div className="space-y-3">
             <Label className="text-sm">
               {language === 'es' ? 'Estilo de Sonidos' : 'Sound Style'}
             </Label>
             <RadioGroup
               value={prefs.style}
               onValueChange={(v) => handleStyleChange(v as SoundStyle)}
               className="grid gap-2"
             >
               {(Object.keys(STYLE_INFO) as SoundStyle[]).map((style) => {
                 const info = STYLE_INFO[style];
                 const Icon = info.icon;
                 const isSelected = prefs.style === style;
                 
                 return (
                   <div
                     key={style}
                     className={cn(
                       "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                       isSelected 
                         ? "border-primary bg-primary/10" 
                         : "border-border hover:border-primary/50"
                     )}
                     onClick={() => handleStyleChange(style)}
                   >
                     <RadioGroupItem value={style} id={style} />
                    <Icon className={cn(
                       "h-5 w-5",
                       style === 'phoenix' && "text-primary",
                       style === 'minimal' && "text-muted-foreground",
                       style === 'arcade' && "text-accent-foreground"
                     )} />
                     <div className="flex-1">
                       <Label htmlFor={style} className="cursor-pointer font-medium">
                         {info.label[language]}
                       </Label>
                       <p className="text-xs text-muted-foreground">
                         {info.desc[language]}
                       </p>
                     </div>
                     <Button
                       variant="ghost"
                       size="icon"
                       className="h-8 w-8"
                       onClick={(e) => {
                         e.stopPropagation();
                         sounds.preview('levelUp', style);
                       }}
                     >
                       <Play className="h-4 w-4" />
                     </Button>
                   </div>
                 );
               })}
             </RadioGroup>
           </div>
 
           {/* Category Toggles */}
           <div className="space-y-3">
             <Label className="text-sm">
               {language === 'es' ? 'Categorías' : 'Categories'}
             </Label>
             <div className="grid gap-2">
               {(Object.keys(CATEGORY_INFO) as SoundCategory[]).map((category) => {
                 const info = CATEGORY_INFO[category];
                 const Icon = info.icon;
                 const isEnabled = prefs.categories[category];
                 
                 return (
                   <div
                     key={category}
                     className={cn(
                       "flex items-center gap-3 p-3 rounded-lg border transition-all",
                       isEnabled ? "border-primary/30 bg-primary/5" : "border-border opacity-60"
                     )}
                   >
                     <Switch
                       checked={isEnabled}
                       onCheckedChange={() => handleCategoryToggle(category)}
                     />
                     <Icon className={cn(
                       "h-4 w-4",
                       isEnabled ? "text-primary" : "text-muted-foreground"
                     )} />
                     <div className="flex-1">
                       <span className="text-sm font-medium">
                         {info.label[language]}
                       </span>
                       <p className="text-xs text-muted-foreground">
                         {info.examples[language]}
                       </p>
                     </div>
                     {isEnabled && (
                       <Button
                         variant="ghost"
                         size="icon"
                         className="h-8 w-8"
                         onClick={() => previewCategory(category)}
                       >
                         <Play className="h-3.5 w-3.5" />
                       </Button>
                     )}
                   </div>
                 );
               })}
             </div>
           </div>
 
           {/* Haptic Feedback Toggle */}
           <div className="flex items-center justify-between p-3 rounded-lg border">
             <div className="flex items-center gap-3">
               <Vibrate className="h-4 w-4 text-primary" />
               <div>
                 <span className="text-sm font-medium">
                   {language === 'es' ? 'Vibración Táctil' : 'Haptic Feedback'}
                 </span>
                 <p className="text-xs text-muted-foreground">
                   {language === 'es' ? 'En dispositivos móviles' : 'On mobile devices'}
                 </p>
               </div>
             </div>
             <Switch
               checked={prefs.hapticEnabled}
               onCheckedChange={handleHapticToggle}
             />
           </div>
         </CardContent>
       )}
     </Card>
   );
 }