import { Check, ChevronDown, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';

const languageConfig = {
  es: {
    flag: '🇪🇸',
    name: 'Español',
    shortCode: 'ES',
  },
  en: {
    flag: '🇬🇧',
    name: 'English',
    shortCode: 'EN',
  },
};

export function MobileMenuLanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const currentLang = languageConfig[language];
  const otherLang = language === 'es' ? 'en' : 'es';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 gap-2 bg-background hover:bg-muted border-border/50 rounded-lg shadow-sm"
        >
          <Languages className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-lg leading-none">{currentLang.flag}</span>
          <span className="text-xs font-semibold">{currentLang.shortCode}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[140px] p-1 bg-popover/95 backdrop-blur-sm">
        {Object.entries(languageConfig).map(([code, config]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setLanguage(code as 'es' | 'en')}
            className={cn(
              "flex items-center justify-between py-2 px-2.5 cursor-pointer rounded-md",
              language === code 
                ? "bg-primary/10 text-primary font-medium" 
                : "hover:bg-muted"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{config.flag}</span>
              <span className="text-sm">{config.name}</span>
            </div>
            {language === code && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
