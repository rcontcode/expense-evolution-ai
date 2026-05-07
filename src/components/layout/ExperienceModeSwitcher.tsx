import { Sparkles, Sliders, Moon, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExperienceMode, type ExperienceModeId } from '@/hooks/useExperienceMode';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Props { className?: string }

const META = (es: boolean) => ({
  tranquilo: {
    icon: Moon,
    label: es ? 'Tranquilo' : 'Quiet',
    desc: es ? 'Modo Simple, sin textura. Mínimo ruido visual.' : 'Simple mode, no texture. Minimal visual noise.',
    chip: 'bg-slate-500/10 border-slate-500/30 text-slate-700 dark:text-slate-300',
    accent: 'text-slate-500',
  },
  equilibrado: {
    icon: Sliders,
    label: es ? 'Equilibrado' : 'Balanced',
    desc: es ? 'Modo Simple con textura punteada suave.' : 'Simple mode with soft dot texture.',
    chip: 'bg-sky-500/10 border-sky-500/30 text-sky-700 dark:text-sky-300',
    accent: 'text-sky-500',
  },
  pro: {
    icon: Sparkles,
    label: es ? 'Pro' : 'Pro',
    desc: es ? 'Modo Avanzado con textura lino. Todo activado.' : 'Advanced mode with linen texture. Everything on.',
    chip: 'bg-violet-500/10 border-violet-500/30 text-violet-700 dark:text-violet-300',
    accent: 'text-violet-500',
  },
});

export function ExperienceModeSwitcher({ className }: Props) {
  const { mode, applyMode } = useExperienceMode();
  const { language } = useLanguage();
  const es = language === 'es';
  const meta = META(es);
  const current = meta[mode ?? 'equilibrado'];
  const CurrentIcon = current.icon;
  const order: ExperienceModeId[] = ['tranquilo', 'equilibrado', 'pro'];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2 text-xs font-semibold transition-all',
            'hover:shadow-md hover:scale-[1.04]',
            current.chip,
            className,
          )}
        >
          <CurrentIcon className={cn('h-3.5 w-3.5', current.accent)} />
          <span className="hidden sm:inline">{es ? 'Modo:' : 'Mode:'}</span>
          <span>{current.label}</span>
          <ChevronDown className="h-3 w-3 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs">
          {es ? 'Modo de experiencia' : 'Experience mode'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {order.map((id) => {
          const info = meta[id];
          const Icon = info.icon;
          const active = mode === id;
          return (
            <DropdownMenuItem
              key={id}
              onClick={() => applyMode(id)}
              className={cn('flex items-start gap-3 py-2.5 cursor-pointer', active && 'bg-accent/60')}
            >
              <div className={cn('shrink-0 h-8 w-8 rounded-lg flex items-center justify-center border', info.chip)}>
                <Icon className={cn('h-4 w-4', info.accent)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold leading-tight">{info.label}</span>
                  {active && <Check className="h-3.5 w-3.5 text-primary" />}
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{info.desc}</p>
              </div>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-[10px] text-muted-foreground leading-snug">
          {es
            ? 'Aplica modo + textura de golpe. Podés afinar cada parte por separado.'
            : 'Sets mode + texture at once. You can fine-tune each separately.'}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
