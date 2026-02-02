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
          className={cn(
            "w-full justify-between h-10 px-3",
            "bg-background hover:bg-muted",
            "border border-border/50 rounded-lg"
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">{currentLang.flag}</span>
            <span className="text-xs font-medium">{currentLang.shortCode}</span>
          </div>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[160px]">
        {Object.entries(languageConfig).map(([code, config]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setLanguage(code as 'es' | 'en')}
            className={cn(
              "flex items-center justify-between py-2 cursor-pointer",
              language === code && "bg-primary/10"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{config.flag}</span>
              <span className="text-sm">{config.name}</span>
            </div>
            {language === code && (
              <Check className="h-3 w-3 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
