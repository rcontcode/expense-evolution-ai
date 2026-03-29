import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CloudRain, Send, Trash2, BookOpen, Check } from 'lucide-react';
import { toast } from 'sonner';

const PROMPTS_ES = [
  '¿Qué te preocupa de tu dinero?',
  '¿Qué deuda te quita el sueño?',
  '¿Qué miedo financiero tienes?',
  '¿Qué decisión financiera te genera ansiedad?',
];
const PROMPTS_EN = [
  'What worries you about your money?',
  'What debt keeps you up at night?',
  'What financial fear do you have?',
  'What financial decision gives you anxiety?',
];

const CATEGORIES = [
  { value: 'debt', es: 'Deuda', en: 'Debt' },
  { value: 'expenses', es: 'Gastos', en: 'Expenses' },
  { value: 'investments', es: 'Inversiones', en: 'Investments' },
  { value: 'work', es: 'Trabajo', en: 'Work' },
  { value: 'general', es: 'General', en: 'General' },
];

interface WorryEntry {
  id: string;
  content: string;
  worry_category: string;
  released: boolean;
  converted_to_journal: boolean;
  created_at: string;
}

export function FinancialWorryDump() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [promptIndex] = useState(() => Math.floor(Math.random() * 4));
  const prompts = language === 'es' ? PROMPTS_ES : PROMPTS_EN;

  const { data: entries = [] } = useQuery({
    queryKey: ['worry-entries', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('financial_worry_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as WorryEntry[];
    },
    enabled: !!user?.id,
  });

  const submit = async () => {
    if (!content.trim() || !user?.id) return;
    try {
      await supabase
        .from('financial_worry_entries')
        .insert({ user_id: user.id, content: content.trim(), worry_category: category });
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['worry-entries'] });
      toast.success(language === 'es' ? '💨 Preocupación liberada' : '💨 Worry released');
    } catch {
      toast.error(language === 'es' ? 'Error al guardar' : 'Error saving');
    }
  };

  const release = async (id: string) => {
    if (!user?.id) return;
    await supabase.from('financial_worry_entries').update({ released: true }).eq('id', id).eq('user_id', user.id);
    queryClient.invalidateQueries({ queryKey: ['worry-entries'] });
  };

  const convertToJournal = async (entry: WorryEntry) => {
    if (!user?.id) return;
    try {
      await supabase.from('financial_journal').insert({
        user_id: user.id,
        content: entry.content,
        entry_type: 'reflection',
        mood: 'anxious',
      });
      await supabase.from('financial_worry_entries').update({ converted_to_journal: true }).eq('id', entry.id).eq('user_id', user.id);
      queryClient.invalidateQueries({ queryKey: ['worry-entries'] });
      toast.success(language === 'es' ? '📓 Convertido en reflexión' : '📓 Converted to reflection');
    } catch {
      toast.error(language === 'es' ? 'Error' : 'Error');
    }
  };

  const unreleased = entries.filter((e: WorryEntry) => !e.released);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <CloudRain className="h-4 w-4 text-violet-500" />
          {language === 'es' ? 'Libera Preocupaciones' : 'Worry Dump'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground italic">{prompts[promptIndex]}</p>

        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={prompts[promptIndex]}
          rows={3}
          className="text-sm"
        />

        <div className="flex gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => (
                <SelectItem key={c.value} value={c.value}>
                  {language === 'es' ? c.es : c.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={submit} disabled={!content.trim()} className="gap-1 min-h-[44px]">
            <Send className="h-3 w-3" />
            {language === 'es' ? 'Soltar' : 'Release'}
          </Button>
        </div>

        {/* Entries */}
        {unreleased.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {unreleased.map((entry: WorryEntry) => (
              <div key={entry.id} className="text-xs p-2 rounded-lg bg-muted/50 flex items-start gap-2">
                <p className="flex-1 text-muted-foreground">{entry.content}</p>
                <div className="flex gap-1 shrink-0">
                  {!entry.converted_to_journal && (
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => convertToJournal(entry)}>
                      <BookOpen className="h-3 w-3" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => release(entry.id)}>
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
