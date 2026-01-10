import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVoicePreferences } from '@/hooks/utils/useVoicePreferences';
import { useHighlight, type HighlightColor } from '@/contexts/HighlightContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Mic, Volume2, Bell, Zap, Trash2, Plus, Clock, Calendar, 
  MessageSquare, History, Play, Settings2, VolumeX, Volume1, Highlighter
} from 'lucide-react';
import { toast } from 'sonner';

export function VoicePreferencesCard() {
  const { language } = useLanguage();
  const voicePrefs = useVoicePreferences();
  const highlightCtx = useHighlight();
  
  const [showShortcutDialog, setShowShortcutDialog] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  
  // New shortcut form state
  const [newShortcut, setNewShortcut] = useState({
    trigger: '',
    route: '',
    nameEs: '',
    nameEn: '',
  });
  
  // New reminder form state
  const [newReminder, setNewReminder] = useState({
    messageEs: '',
    messageEn: '',
    time: '09:00',
    days: [1, 2, 3, 4, 5], // Mon-Fri by default
  });

  const handleAddShortcut = () => {
    if (!newShortcut.trigger || !newShortcut.route) {
      toast.error(language === 'es' ? 'Completa los campos requeridos' : 'Fill required fields');
      return;
    }
    
    voicePrefs.addShortcut({
      trigger: newShortcut.trigger.split(',').map(t => t.trim().toLowerCase()),
      action: 'navigate',
      route: newShortcut.route,
      name: {
        es: newShortcut.nameEs || newShortcut.trigger,
        en: newShortcut.nameEn || newShortcut.trigger,
      },
    });
    
    setNewShortcut({ trigger: '', route: '', nameEs: '', nameEn: '' });
    setShowShortcutDialog(false);
    toast.success(language === 'es' ? 'Atajo creado' : 'Shortcut created');
  };

  const handleAddReminder = () => {
    if (!newReminder.messageEs && !newReminder.messageEn) {
      toast.error(language === 'es' ? 'Escribe un mensaje' : 'Write a message');
      return;
    }
    
    voicePrefs.addReminder({
      message: {
        es: newReminder.messageEs || newReminder.messageEn,
        en: newReminder.messageEn || newReminder.messageEs,
      },
      time: newReminder.time,
      days: newReminder.days,
      enabled: true,
    });
    
    setNewReminder({ messageEs: '', messageEn: '', time: '09:00', days: [1, 2, 3, 4, 5] });
    setShowReminderDialog(false);
    toast.success(language === 'es' ? 'Recordatorio creado' : 'Reminder created');
  };

  const toggleDay = (day: number) => {
    setNewReminder(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day].sort(),
    }));
  };

  const dayLabels = {
    es: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  };

  const routeOptions = [
    { value: '/dashboard', label: { es: 'Dashboard', en: 'Dashboard' } },
    { value: '/expenses', label: { es: 'Gastos', en: 'Expenses' } },
    { value: '/income', label: { es: 'Ingresos', en: 'Income' } },
    { value: '/clients', label: { es: 'Clientes', en: 'Clients' } },
    { value: '/projects', label: { es: 'Proyectos', en: 'Projects' } },
    { value: '/contracts', label: { es: 'Contratos', en: 'Contracts' } },
    { value: '/mileage', label: { es: 'Kilometraje', en: 'Mileage' } },
    { value: '/net-worth', label: { es: 'Patrimonio', en: 'Net Worth' } },
    { value: '/banking', label: { es: 'Banca', en: 'Banking' } },
    { value: '/mentorship', label: { es: 'Mentoría', en: 'Mentorship' } },
    { value: '/tax-calendar', label: { es: 'Impuestos', en: 'Taxes' } },
    { value: '/settings', label: { es: 'Configuración', en: 'Settings' } },
    { value: '/chaos-inbox', label: { es: 'Bandeja de Caos', en: 'Chaos Inbox' } },
  ];

  const conversationHistory = voicePrefs.getRecentContext(50);
  const topActions = voicePrefs.getTopActions(5);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mic className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>{language === 'es' ? 'Preferencias de Voz' : 'Voice Preferences'}</CardTitle>
            <CardDescription>
              {language === 'es' 
                ? 'Configura el asistente de voz, atajos y recordatorios'
                : 'Configure voice assistant, shortcuts and reminders'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Voice Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            {language === 'es' ? 'Configuración de Voz' : 'Voice Settings'}
          </h4>
          
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Speed */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{language === 'es' ? 'Velocidad' : 'Speed'}</Label>
                <Badge variant="secondary" className="text-xs">{voicePrefs.speechSpeed.toFixed(1)}x</Badge>
              </div>
              <Slider
                value={[voicePrefs.speechSpeed]}
                min={0.5}
                max={2}
                step={0.1}
                onValueChange={([v]) => voicePrefs.setSpeechSpeed(v)}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{language === 'es' ? 'Lento' : 'Slow'}</span>
                <span>{language === 'es' ? 'Rápido' : 'Fast'}</span>
              </div>
            </div>
            
            {/* Volume */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{language === 'es' ? 'Volumen' : 'Volume'}</Label>
                <Badge variant="secondary" className="text-xs">
                  {Math.round(voicePrefs.volume * 100)}%
                </Badge>
              </div>
              <Slider
                value={[voicePrefs.volume]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={([v]) => voicePrefs.setVolume(v)}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <VolumeX className="h-3 w-3" />
                <Volume2 className="h-3 w-3" />
              </div>
            </div>
            
            {/* Pitch */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{language === 'es' ? 'Tono' : 'Pitch'}</Label>
                <Badge variant="secondary" className="text-xs">{voicePrefs.pitch.toFixed(1)}</Badge>
              </div>
              <Slider
                value={[voicePrefs.pitch]}
                min={0.5}
                max={2}
                step={0.1}
                onValueChange={([v]) => voicePrefs.setPitch(v)}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{language === 'es' ? 'Grave' : 'Low'}</span>
                <span>{language === 'es' ? 'Agudo' : 'High'}</span>
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={voicePrefs.enableSoundEffects}
                onCheckedChange={() => voicePrefs.toggleSoundEffects()}
              />
              <Label className="text-sm">
                {language === 'es' ? 'Sonidos de feedback' : 'Feedback sounds'}
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={voicePrefs.confirmDestructiveActions}
                onCheckedChange={() => voicePrefs.toggleConfirmDestructive()}
              />
              <Label className="text-sm">
                {language === 'es' ? 'Confirmar acciones destructivas' : 'Confirm destructive actions'}
              </Label>
            </div>
          </div>
        </div>

        {/* Highlight Color Settings */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Highlighter className="h-4 w-4" />
            {language === 'es' ? 'Resaltado Tutorial' : 'Tutorial Highlight'}
          </h4>
          <p className="text-xs text-muted-foreground">
            {language === 'es' 
              ? 'El asistente puede resaltar secciones de la app mientras te las explica.'
              : 'The assistant can highlight app sections while explaining them.'}
          </p>
          <div className="flex items-center gap-2">
            <Switch
              checked={highlightCtx.isHighlightEnabled}
              onCheckedChange={() => highlightCtx.toggleHighlightEnabled()}
            />
            <Label className="text-sm">
              {language === 'es' ? 'Activar resaltado' : 'Enable highlighting'}
            </Label>
          </div>
          {highlightCtx.isHighlightEnabled && (
            <div className="flex items-center gap-2 pt-2">
              <Label className="text-xs">{language === 'es' ? 'Color:' : 'Color:'}</Label>
              <div className="flex gap-1">
                {(['orange', 'green', 'red', 'blue', 'purple'] as HighlightColor[]).map((color) => (
                  <button
                    key={color}
                    onClick={() => highlightCtx.setHighlightColor(color)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      highlightCtx.highlightColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                    }`}
                    style={{ 
                      backgroundColor: color === 'orange' ? '#f97316' 
                        : color === 'green' ? '#22c55e' 
                        : color === 'red' ? '#ef4444' 
                        : color === 'blue' ? '#3b82f6' 
                        : '#a855f7' 
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Custom Shortcuts */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" />
              {language === 'es' ? 'Atajos Personalizados' : 'Custom Shortcuts'}
            </h4>
            <Dialog open={showShortcutDialog} onOpenChange={setShowShortcutDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  {language === 'es' ? 'Agregar' : 'Add'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{language === 'es' ? 'Nuevo Atajo de Voz' : 'New Voice Shortcut'}</DialogTitle>
                  <DialogDescription>
                    {language === 'es' 
                      ? 'Crea un atajo que navegue a una página cuando digas ciertas palabras'
                      : 'Create a shortcut that navigates to a page when you say certain words'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>{language === 'es' ? 'Palabras clave (separadas por coma)' : 'Keywords (comma separated)'}</Label>
                    <Input
                      value={newShortcut.trigger}
                      onChange={(e) => setNewShortcut(p => ({ ...p, trigger: e.target.value }))}
                      placeholder={language === 'es' ? 'mis finanzas, ver finanzas' : 'my finances, show finances'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'es' ? 'Navegar a' : 'Navigate to'}</Label>
                    <Select
                      value={newShortcut.route}
                      onValueChange={(v) => setNewShortcut(p => ({ ...p, route: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'es' ? 'Selecciona página' : 'Select page'} />
                      </SelectTrigger>
                      <SelectContent>
                        {routeOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label[language as 'es' | 'en']}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{language === 'es' ? 'Nombre (ES)' : 'Name (ES)'}</Label>
                      <Input
                        value={newShortcut.nameEs}
                        onChange={(e) => setNewShortcut(p => ({ ...p, nameEs: e.target.value }))}
                        placeholder="Mis Finanzas"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'es' ? 'Nombre (EN)' : 'Name (EN)'}</Label>
                      <Input
                        value={newShortcut.nameEn}
                        onChange={(e) => setNewShortcut(p => ({ ...p, nameEn: e.target.value }))}
                        placeholder="My Finances"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowShortcutDialog(false)}>
                    {language === 'es' ? 'Cancelar' : 'Cancel'}
                  </Button>
                  <Button onClick={handleAddShortcut}>
                    {language === 'es' ? 'Crear Atajo' : 'Create Shortcut'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          {voicePrefs.customShortcuts.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {language === 'es' 
                ? 'No tienes atajos personalizados. Crea uno para navegar rápidamente con tu voz.'
                : 'No custom shortcuts. Create one to navigate quickly with your voice.'}
            </p>
          ) : (
            <div className="space-y-2">
              {voicePrefs.customShortcuts.map((shortcut) => (
                <div key={shortcut.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {shortcut.name[language as 'es' | 'en']}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      "{shortcut.trigger.join(', ')}" → {shortcut.route}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => voicePrefs.removeShortcut(shortcut.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Voice Reminders */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Bell className="h-4 w-4" />
              {language === 'es' ? 'Recordatorios por Voz' : 'Voice Reminders'}
            </h4>
            <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  {language === 'es' ? 'Agregar' : 'Add'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{language === 'es' ? 'Nuevo Recordatorio' : 'New Reminder'}</DialogTitle>
                  <DialogDescription>
                    {language === 'es' 
                      ? 'El asistente te recordará con voz en el horario seleccionado'
                      : 'The assistant will remind you by voice at the selected time'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>{language === 'es' ? 'Mensaje (ES)' : 'Message (ES)'}</Label>
                    <Input
                      value={newReminder.messageEs}
                      onChange={(e) => setNewReminder(p => ({ ...p, messageEs: e.target.value }))}
                      placeholder={language === 'es' ? 'Recuerda revisar tus gastos' : 'Remember to review expenses'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'es' ? 'Mensaje (EN)' : 'Message (EN)'}</Label>
                    <Input
                      value={newReminder.messageEn}
                      onChange={(e) => setNewReminder(p => ({ ...p, messageEn: e.target.value }))}
                      placeholder="Remember to review your expenses"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {language === 'es' ? 'Hora' : 'Time'}
                    </Label>
                    <Input
                      type="time"
                      value={newReminder.time}
                      onChange={(e) => setNewReminder(p => ({ ...p, time: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {language === 'es' ? 'Días' : 'Days'}
                    </Label>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                        <Button
                          key={day}
                          type="button"
                          variant={newReminder.days.includes(day) ? "default" : "outline"}
                          size="sm"
                          className="h-8 w-10 text-xs"
                          onClick={() => toggleDay(day)}
                        >
                          {dayLabels[language as 'es' | 'en'][day]}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowReminderDialog(false)}>
                    {language === 'es' ? 'Cancelar' : 'Cancel'}
                  </Button>
                  <Button onClick={handleAddReminder}>
                    {language === 'es' ? 'Crear Recordatorio' : 'Create Reminder'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          {voicePrefs.voiceReminders.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {language === 'es' 
                ? 'No tienes recordatorios configurados. El asistente te avisará cuando el chat esté abierto.'
                : 'No reminders configured. The assistant will notify you when chat is open.'}
            </p>
          ) : (
            <div className="space-y-2">
              {voicePrefs.voiceReminders.map((reminder) => (
                <div key={reminder.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Switch
                      checked={reminder.enabled}
                      onCheckedChange={() => voicePrefs.toggleReminder(reminder.id)}
                    />
                    <div className="min-w-0">
                      <p className="text-sm truncate">
                        {reminder.message[language as 'es' | 'en']}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {reminder.time} • {reminder.days.map(d => dayLabels[language as 'es' | 'en'][d]).join(', ')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive flex-shrink-0"
                    onClick={() => voicePrefs.removeReminder(reminder.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conversation History & Stats */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <History className="h-4 w-4" />
              {language === 'es' ? 'Historial y Estadísticas' : 'History & Stats'}
            </h4>
            <div className="flex gap-2">
              <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    {language === 'es' ? 'Ver Historial' : 'View History'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{language === 'es' ? 'Historial de Conversación' : 'Conversation History'}</DialogTitle>
                    <DialogDescription>
                      {language === 'es' ? 'Últimas 50 interacciones' : 'Last 50 interactions'}
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="h-[400px] pr-4">
                    {conversationHistory.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        {language === 'es' ? 'No hay historial aún' : 'No history yet'}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {conversationHistory.map((entry, i) => (
                          <div 
                            key={i} 
                            className={`p-3 rounded-lg text-sm ${
                              entry.role === 'user' 
                                ? 'bg-primary/10 ml-8' 
                                : 'bg-muted mr-8'
                            }`}
                          >
                            <p className="text-xs text-muted-foreground mb-1">
                              {entry.role === 'user' ? '👤' : '🤖'} • {new Date(entry.timestamp).toLocaleString(language)}
                              {entry.page && ` • ${entry.page}`}
                            </p>
                            <p className="line-clamp-3">{entry.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  <DialogFooter>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        voicePrefs.clearHistory();
                        toast.success(language === 'es' ? 'Historial borrado' : 'History cleared');
                      }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      {language === 'es' ? 'Borrar Historial' : 'Clear History'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Top Actions */}
          {topActions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {language === 'es' ? 'Acciones más frecuentes:' : 'Most frequent actions:'}
              </p>
              <div className="flex flex-wrap gap-2">
                {topActions.map((action, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {action.action.replace(/_/g, ' ')} ({action.count})
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <p className="text-xs text-muted-foreground">
            {language === 'es' 
              ? `${conversationHistory.length} mensajes en historial`
              : `${conversationHistory.length} messages in history`}
          </p>
        </div>

        {/* Test Sound */}
        <div className="pt-4 border-t flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              voicePrefs.playSound('success');
              toast.info(language === 'es' ? 'Sonido de prueba' : 'Test sound');
            }}
            className="gap-2"
          >
            <Volume1 className="h-3 w-3" />
            {language === 'es' ? 'Probar Sonido' : 'Test Sound'}
          </Button>

          {/* Test Voice TTS */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              const testMessage = language === 'es'
                ? '¡Hola! Esta es una prueba de voz del asistente.'
                : 'Hello! This is a voice test from the assistant.';
              
              if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(testMessage);
                utterance.lang = language === 'es' ? 'es-ES' : 'en-US';
                utterance.rate = voicePrefs.speechSpeed;
                utterance.volume = voicePrefs.volume;
                utterance.pitch = voicePrefs.pitch;
                window.speechSynthesis.speak(utterance);
                toast.success(language === 'es' ? 'Reproduciendo voz...' : 'Playing voice...');
              } else {
                toast.error(language === 'es' ? 'Voz no soportada' : 'Voice not supported');
              }
            }}
            className="gap-2"
          >
            <Volume2 className="h-3 w-3" />
            {language === 'es' ? 'Probar Voz TTS' : 'Test Voice TTS'}
          </Button>

          {/* Export History */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              const history = voicePrefs.getRecentContext(100);
              if (history.length === 0) {
                toast.error(language === 'es' ? 'No hay historial para exportar' : 'No history to export');
                return;
              }
              
              const exportData = {
                exportedAt: new Date().toISOString(),
                language,
                messagesCount: history.length,
                messages: history.map(entry => ({
                  role: entry.role,
                  content: entry.content,
                  timestamp: entry.timestamp,
                  page: entry.page,
                })),
              };
              
              const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `voice-history-${new Date().toISOString().split('T')[0]}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              
              toast.success(language === 'es' ? 'Historial exportado' : 'History exported');
            }}
            className="gap-2"
          >
            <History className="h-3 w-3" />
            {language === 'es' ? 'Exportar Historial' : 'Export History'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
