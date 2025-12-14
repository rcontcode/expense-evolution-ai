import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useFinancialJournal, useJournalStats, useCreateJournalEntry, useDeleteJournalEntry } from '@/hooks/data/useFinancialJournal';
import { useLanguage } from '@/contexts/LanguageContext';
import { BookOpen, Flame, Plus, Lightbulb, Heart, Target, Brain, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

const ENTRY_TYPES = [
  { value: 'reflection', labelEs: 'Reflexión', labelEn: 'Reflection', icon: Brain },
  { value: 'decision', labelEs: 'Decisión', labelEn: 'Decision', icon: Target },
  { value: 'lesson', labelEs: 'Lección', labelEn: 'Lesson', icon: Lightbulb },
  { value: 'gratitude', labelEs: 'Gratitud', labelEn: 'Gratitude', icon: Heart },
  { value: 'goal', labelEs: 'Meta', labelEn: 'Goal', icon: Target },
];

const MOODS = [
  { value: 'confident', emoji: '😊', labelEs: 'Confiado', labelEn: 'Confident' },
  { value: 'anxious', emoji: '😰', labelEs: 'Ansioso', labelEn: 'Anxious' },
  { value: 'motivated', emoji: '🔥', labelEs: 'Motivado', labelEn: 'Motivated' },
  { value: 'uncertain', emoji: '🤔', labelEs: 'Incierto', labelEn: 'Uncertain' },
  { value: 'grateful', emoji: '🙏', labelEs: 'Agradecido', labelEn: 'Grateful' },
];

export function FinancialJournalCard() {
  const { language } = useLanguage();
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [entryType, setEntryType] = useState('reflection');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');

  const { data: entries, isLoading } = useFinancialJournal(5);
  const { data: stats } = useJournalStats();
  const createEntry = useCreateJournalEntry();
  const deleteEntry = useDeleteJournalEntry();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  const handleCreateEntry = () => {
    if (content.trim()) {
      createEntry.mutate({
        entry_type: entryType,
        content: content.trim(),
        mood: mood || undefined,
      });
      setContent('');
      setMood('');
      setEntryType('reflection');
      setShowNewEntry(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-primary" />
            {language === 'es' ? 'Diario Financiero' : 'Financial Journal'}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Jim Rohn
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground italic">
          "{language === 'es' 
            ? 'Reflexiona sobre tus decisiones financieras para crecer' 
            : 'Reflect on your financial decisions to grow'}"
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="flex items-center justify-around py-2 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <Flame className={`h-4 w-4 ${(stats?.streak || 0) > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
              <span className="text-xl font-bold">{stats?.streak || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'Racha' : 'Streak'}
            </p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <span className="text-xl font-bold">{stats?.entriesThisMonth || 0}</span>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'Este mes' : 'This month'}
            </p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <span className="text-xl font-bold">{stats?.totalEntries || 0}</span>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'Total' : 'Total'}
            </p>
          </div>
        </div>

        {/* New Entry Button or Form */}
        {!showNewEntry ? (
          <Button 
            onClick={() => setShowNewEntry(true)} 
            className="w-full"
            variant={stats?.hasEntryToday ? 'outline' : 'default'}
          >
            <Plus className="h-4 w-4 mr-2" />
            {stats?.hasEntryToday 
              ? (language === 'es' ? 'Agregar otra entrada' : 'Add another entry')
              : (language === 'es' ? 'Escribir reflexión de hoy' : "Write today's reflection")
            }
          </Button>
        ) : (
          <div className="space-y-3 p-3 border rounded-lg bg-muted/20">
            <div className="flex gap-2">
              <Select value={entryType} onValueChange={setEntryType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTRY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {language === 'es' ? type.labelEs : type.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={mood} onValueChange={setMood}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder={language === 'es' ? 'Estado...' : 'Mood...'} />
                </SelectTrigger>
                <SelectContent>
                  {MOODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.emoji} {language === 'es' ? m.labelEs : m.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder={language === 'es' ? '¿Qué aprendiste hoy sobre tus finanzas?' : 'What did you learn about your finances today?'}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button onClick={handleCreateEntry} disabled={!content.trim()} className="flex-1">
                {language === 'es' ? 'Guardar' : 'Save'}
              </Button>
              <Button variant="outline" onClick={() => setShowNewEntry(false)}>
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </Button>
            </div>
          </div>
        )}

        {/* Recent Entries */}
        {entries && entries.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <p className="text-sm font-medium">
              {language === 'es' ? 'Entradas recientes' : 'Recent entries'}
            </p>
            {entries.map((entry) => {
              const typeInfo = ENTRY_TYPES.find(t => t.value === entry.entry_type);
              const moodInfo = MOODS.find(m => m.value === entry.mood);
              const TypeIcon = typeInfo?.icon || Brain;

              return (
                <div 
                  key={entry.id} 
                  className="p-2 rounded-lg border bg-card hover:bg-muted/30 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <TypeIcon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(entry.entry_date), 'dd MMM', {
                              locale: language === 'es' ? es : enUS,
                            })}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {language === 'es' ? typeInfo?.labelEs : typeInfo?.labelEn}
                          </Badge>
                          {moodInfo && <span className="text-xs">{moodInfo.emoji}</span>}
                        </div>
                        <p className="text-sm mt-1 line-clamp-2">{entry.content}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={() => deleteEntry.mutate(entry.id)}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
