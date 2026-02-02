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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 gap-1.5 bg-muted/50 hover:bg-muted rounded-md"
        >
          <span className="text-sm">{currentLang.flag}</span>
          <span className="text-[10px] font-medium text-muted-foreground">{currentLang.shortCode}</span>
          <ChevronDown className="h-2.5 w-2.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[120px] bg-popover">
        {Object.entries(languageConfig).map(([code, config]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setLanguage(code as 'es' | 'en')}
            className={cn(
              "flex items-center justify-between py-1.5 cursor-pointer text-xs",
              language === code && "bg-primary/10"
            )}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{config.flag}</span>
              <span>{config.shortCode}</span>
            </div>
            {language === code && <Check className="h-3 w-3 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
