import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Tag } from 'lucide-react';
import { toast } from 'sonner';

const PRESET_TAGS = [
  { label: 'VIP', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { label: 'Requiere Demo', color: 'bg-violet-100 text-violet-800 border-violet-300' },
  { label: 'Interés Bundle', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { label: 'No Molestar', color: 'bg-red-100 text-red-800 border-red-300' },
  { label: 'Seguimiento', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { label: 'Referido', color: 'bg-pink-100 text-pink-800 border-pink-300' },
  { label: 'Potencial Alto', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { label: 'Estudiante', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
];

function getTagColor(tag: string) {
  const preset = PRESET_TAGS.find(p => p.label.toLowerCase() === tag.toLowerCase());
  return preset?.color || 'bg-muted text-muted-foreground border-border';
}

interface LeadTagEditorProps {
  leadId: string;
  tags: string[];
}

export function LeadTagEditor({ leadId, tags }: LeadTagEditorProps) {
  const [newTag, setNewTag] = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const queryClient = useQueryClient();

  const updateTags = useMutation({
    mutationFn: async (newTags: string[]) => {
      const { error } = await supabase
        .from('quiz_leads')
        .update({ tags: newTags } as any)
        .eq('id', leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
    },
    onError: () => {
      toast.error('Error al actualizar tags');
    },
  });

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    updateTags.mutate([...tags, trimmed]);
    setNewTag('');
    setShowPresets(false);
  };

  const removeTag = (tag: string) => {
    updateTags.mutate(tags.filter(t => t !== tag));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Tags</span>
      </div>

      {/* Current tags */}
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className={`text-xs gap-1 ${getTagColor(tag)}`}
          >
            {tag}
            <button onClick={() => removeTag(tag)} className="ml-0.5 hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {tags.length === 0 && (
          <span className="text-xs text-muted-foreground italic">Sin tags</span>
        )}
      </div>

      {/* Add tag */}
      <div className="flex items-center gap-2">
        <Input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="Nuevo tag..."
          className="h-7 text-xs"
          onKeyDown={(e) => { if (e.key === 'Enter') addTag(newTag); }}
        />
        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => addTag(newTag)} disabled={!newTag.trim()}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="outline" className="h-7 px-2 text-[10px]" onClick={() => setShowPresets(!showPresets)}>
          Presets
        </Button>
      </div>

      {/* Presets */}
      {showPresets && (
        <div className="flex flex-wrap gap-1.5 p-2 rounded-md bg-muted/50 border">
          {PRESET_TAGS.filter(p => !tags.includes(p.label)).map((preset) => (
            <Badge
              key={preset.label}
              variant="outline"
              className={`text-[10px] cursor-pointer hover:scale-105 transition-transform ${preset.color}`}
              onClick={() => addTag(preset.label)}
            >
              + {preset.label}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
