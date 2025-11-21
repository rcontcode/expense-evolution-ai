import { useState } from 'react';
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useTags } from '@/hooks/data/useTags';
import { TagDialog } from '@/components/dialogs/TagDialog';
import { cn } from '@/lib/utils';

interface TagSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function TagSelect({ value = [], onChange }: TagSelectProps) {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: tags } = useTags();

  const selectedTags = tags?.filter((tag) => value.includes(tag.id)) || [];

  const handleSelect = (tagId: string) => {
    if (value.includes(tagId)) {
      onChange(value.filter((id) => id !== tagId));
    } else {
      onChange([...value, tagId]);
    }
  };

  const handleRemove = (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((id) => id !== tagId));
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <div className="flex flex-wrap gap-1 flex-1 items-center">
              {selectedTags.length === 0 ? (
                <span className="text-muted-foreground">Select tags...</span>
              ) : (
                selectedTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    style={{ backgroundColor: tag.color || '#3B82F6' }}
                    className="text-white"
                  >
                    {tag.name}
                    <button
                      onClick={(e) => handleRemove(tag.id, e)}
                      className="ml-1 hover:bg-white/20 rounded-sm"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandEmpty>No tags found.</CommandEmpty>
            <CommandGroup>
              {tags?.map((tag) => (
                <CommandItem
                  key={tag.id}
                  value={tag.name}
                  onSelect={() => handleSelect(tag.id)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value.includes(tag.id) ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <Badge
                    style={{ backgroundColor: tag.color || '#3B82F6' }}
                    className="text-white"
                  >
                    {tag.name}
                  </Badge>
                </CommandItem>
              ))}
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  setDialogOpen(true);
                }}
                className="text-primary"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create new tag
              </CommandItem>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      <TagDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
}
