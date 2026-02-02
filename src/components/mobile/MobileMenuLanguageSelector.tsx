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
          variant="outline"
          className={cn(
            "w-full justify-between h-12",
            "bg-muted/50 hover:bg-muted",
            "border-border/50"
          )}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{currentLang.flag}</span>
            <span className="font-medium">{currentLang.name}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        {Object.entries(languageConfig).map(([code, config]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setLanguage(code as 'es' | 'en')}
            className={cn(
              "flex items-center justify-between py-3 cursor-pointer",
              language === code && "bg-muted"
            )}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{config.flag}</span>
              <span className={cn(
                "font-medium",
                language === code && "font-bold"
              )}>
                {config.name}
              </span>
            </div>
            {language === code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
