import { useState } from 'react';
import { Check, ChevronDown, Globe2, Building2, User, Briefcase, Plus, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFiscalEntities, useSetPrimaryEntity, type FiscalEntity } from '@/hooks/data/useFiscalEntities';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface EntitySelectorProps {
  collapsed?: boolean;
}

// Enhanced entity type configuration with colors and emojis
const entityTypeConfig: Record<string, { 
  icon: React.ReactNode; 
  emoji: string; 
  gradient: string; 
  bgColor: string;
  textColor: string;
}> = {
  personal: { 
    icon: <User className="h-3.5 w-3.5" />, 
    emoji: '👤',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-600 dark:text-blue-400'
  },
  freelancer: { 
    icon: <Briefcase className="h-3.5 w-3.5" />, 
    emoji: '💼',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-600 dark:text-emerald-400'
  },
  business: { 
    icon: <Building2 className="h-3.5 w-3.5" />, 
    emoji: '🏢',
    gradient: 'from-purple-500/20 to-pink-500/20',
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-600 dark:text-purple-400'
  },
  corporation: { 
    icon: <Building2 className="h-3.5 w-3.5" />, 
    emoji: '🏛️',
    gradient: 'from-amber-500/20 to-orange-500/20',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-600 dark:text-amber-400'
  },
};

const countryFlags: Record<string, string> = {
  CA: '🇨🇦',
  CL: '🇨🇱',
  US: '🇺🇸',
  MX: '🇲🇽',
  ES: '🇪🇸',
  AR: '🇦🇷',
  CO: '🇨🇴',
  PE: '🇵🇪',
  BR: '🇧🇷',
};

const currencySymbols: Record<string, string> = {
  CAD: '🍁',
  USD: '💵',
  CLP: '🌶️',
  MXN: '🌮',
  EUR: '💶',
  ARS: '🥩',
  COP: '☕',
  PEN: '🦙',
  BRL: '⚽',
};

export function EntitySelector({ collapsed = false }: EntitySelectorProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { data: entities, isLoading } = useFiscalEntities();
  const setPrimary = useSetPrimaryEntity();
  const [open, setOpen] = useState(false);

  const primaryEntity = entities?.find(e => e.is_primary);
  const activeEntities = entities?.filter(e => e.is_active !== false) || [];

  const handleSelectEntity = (entity: FiscalEntity) => {
    if (!entity.is_primary) {
      setPrimary.mutate(entity.id);
    }
    setOpen(false);
  };

  const getEntityTypeLabel = (type: string) => {
    const labels: Record<string, { es: string; en: string }> = {
      personal: { es: 'Personal', en: 'Personal' },
      freelancer: { es: 'Freelancer', en: 'Freelancer' },
      business: { es: 'Negocio', en: 'Business' },
      corporation: { es: 'Corporación', en: 'Corporation' },
    };
    return labels[type]?.[language] || type;
  };

  const getEntityConfig = (type: string) => {
    return entityTypeConfig[type] || entityTypeConfig.personal;
  };

  if (isLoading) {
    return (
      <div className={cn("px-2", collapsed && "flex justify-center")}>
        <Skeleton className={cn("h-12 rounded-xl", collapsed ? "w-12" : "w-full")} />
      </div>
    );
  }

  // Don't show if no entities exist - show attractive setup prompt
  if (!entities || entities.length === 0) {
    return (
      <div className={cn("px-2", collapsed && "flex justify-center")}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/settings')}
            className={cn(
              "w-full border-dashed border-2 border-primary/30 hover:border-primary/60",
              "bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5",
              "hover:from-primary/10 hover:via-primary/15 hover:to-primary/10",
              "transition-all duration-300 group",
              collapsed && "w-12 h-12 p-0"
            )}
          >
            {collapsed ? (
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Globe2 className="h-5 w-5 text-primary" />
              </motion.div>
            ) : (
              <span className="flex items-center gap-2 text-xs">
                <motion.span
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-lg"
                >
                  🌍
                </motion.span>
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                  {language === 'es' ? 'Configurar Jurisdicción' : 'Set Up Jurisdiction'}
                </span>
                <Sparkles className="h-3 w-3 text-primary animate-pulse" />
              </span>
            )}
          </Button>
        </motion.div>
      </div>
    );
  }

  // If only one entity, show attractive static display
  if (activeEntities.length === 1 && primaryEntity) {
    const config = getEntityConfig(primaryEntity.entity_type);
    
    return (
      <div className={cn("px-2", collapsed && "flex justify-center")}>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "relative overflow-hidden rounded-xl",
            "bg-gradient-to-br", config.gradient,
            "border border-border/50 shadow-sm",
            collapsed && "w-12 h-12"
          )}
        >
          {/* Animated background effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
          
          <div className={cn(
            "relative flex items-center gap-3 px-3 py-2.5",
            collapsed && "justify-center p-0 h-full"
          )}>
            {collapsed ? (
              <motion.span 
                className="text-xl"
                whileHover={{ scale: 1.2, rotate: 5 }}
              >
                {countryFlags[primaryEntity.country] || '🌍'}
              </motion.span>
            ) : (
              <>
                <motion.div 
                  className="relative"
                  whileHover={{ scale: 1.1 }}
                >
                  <span className="text-2xl drop-shadow-md">
                    {countryFlags[primaryEntity.country] || '🌍'}
                  </span>
                  <span className="absolute -bottom-1 -right-1 text-xs">
                    {config.emoji}
                  </span>
                </motion.div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold truncate">
                      {primaryEntity.name}
                    </p>
                    <span className="text-xs opacity-60">
                      {currencySymbols[primaryEntity.default_currency || 'CAD'] || '💰'}
                    </span>
                  </div>
                  <p className={cn("text-[10px] font-medium truncate", config.textColor)}>
                    {config.emoji} {getEntityTypeLabel(primaryEntity.entity_type)}
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Multiple entities - show dropdown
  const primaryConfig = primaryEntity ? getEntityConfig(primaryEntity.entity_type) : entityTypeConfig.personal;
  
  return (
    <div className={cn("px-2", collapsed && "flex justify-center")}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                "w-full justify-between",
                "bg-gradient-to-br", primaryConfig.gradient,
                "border-border/50 hover:border-primary/50",
                "transition-all duration-300 shadow-sm hover:shadow-md",
                collapsed && "w-12 h-12 p-0 justify-center"
              )}
            >
              {collapsed ? (
                <motion.span 
                  className="text-xl"
                  animate={open ? { rotate: 360 } : { rotate: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {primaryEntity ? countryFlags[primaryEntity.country] || '🌍' : '🌍'}
                </motion.span>
              ) : (
                <>
                  <span className="flex items-center gap-2.5 text-sm truncate">
                    <motion.span 
                      className="text-xl"
                      whileHover={{ scale: 1.1 }}
                    >
                      {primaryEntity ? countryFlags[primaryEntity.country] || '🌍' : '🌍'}
                    </motion.span>
                    <div className="text-left">
                      <span className="font-medium truncate block">{primaryEntity?.name || (language === 'es' ? 'Seleccionar' : 'Select')}</span>
                      {primaryEntity && (
                        <span className={cn("text-[10px] truncate block", primaryConfig.textColor)}>
                          {primaryConfig.emoji} {getEntityTypeLabel(primaryEntity.entity_type)}
                        </span>
                      )}
                    </div>
                  </span>
                  <motion.div
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </motion.div>
                </>
              )}
            </Button>
          </motion.div>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          className="w-72 z-[100] p-2 bg-popover/95 backdrop-blur-lg border-border/50 shadow-xl" 
          align={collapsed ? "start" : "center"}
          side={collapsed ? "right" : "bottom"}
        >
          <DropdownMenuLabel className="flex items-center gap-2 text-xs font-semibold text-muted-foreground px-2 py-1.5">
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="text-base"
            >
              🌍
            </motion.span>
            {language === 'es' ? 'Jurisdicciones Fiscales' : 'Fiscal Jurisdictions'}
            <Badge variant="secondary" className="ml-auto text-[9px] px-1.5">
              {activeEntities.length}
            </Badge>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-border/50" />
          
          <AnimatePresence>
            {activeEntities.map((entity, index) => {
              const config = getEntityConfig(entity.entity_type);
              
              return (
                <motion.div
                  key={entity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <DropdownMenuItem
                    onClick={() => handleSelectEntity(entity)}
                    className={cn(
                      "cursor-pointer rounded-lg my-1 transition-all duration-200",
                      "hover:bg-gradient-to-r", config.gradient,
                      entity.is_primary && ["bg-gradient-to-r", config.gradient, "ring-1 ring-primary/30"]
                    )}
                  >
                    <div className="flex items-center gap-3 w-full py-1">
                      <motion.div 
                        className="relative"
                        whileHover={{ scale: 1.15, rotate: 5 }}
                      >
                        <span className="text-2xl drop-shadow-md">
                          {countryFlags[entity.country] || '🌍'}
                        </span>
                        <span className="absolute -bottom-1 -right-1.5 text-sm">
                          {config.emoji}
                        </span>
                      </motion.div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold truncate">{entity.name}</span>
                          {entity.is_primary && (
                            <Badge 
                              variant="default" 
                              className="text-[9px] px-1.5 py-0 h-4 bg-primary/80 animate-pulse"
                            >
                              ✨ {language === 'es' ? 'Activa' : 'Active'}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn("text-xs font-medium", config.textColor)}>
                            {getEntityTypeLabel(entity.entity_type)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {currencySymbols[entity.default_currency || 'CAD'] || '💰'} {entity.default_currency || 'CAD'}
                          </span>
                        </div>
                      </div>
                      
                      {entity.is_primary && (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                          <Check className="h-5 w-5 text-primary shrink-0" />
                        </motion.div>
                      )}
                    </div>
                  </DropdownMenuItem>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          <DropdownMenuSeparator className="bg-border/50" />
          
          <motion.div whileHover={{ scale: 1.01 }}>
            <DropdownMenuItem
              onClick={() => {
                setOpen(false);
                navigate('/settings');
              }}
              className="cursor-pointer rounded-lg mt-1 bg-muted/30 hover:bg-muted/50"
            >
              <div className="flex items-center gap-2 w-full py-1">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Plus className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">
                  {language === 'es' ? '⚙️ Gestionar Jurisdicciones' : '⚙️ Manage Jurisdictions'}
                </span>
              </div>
            </DropdownMenuItem>
          </motion.div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
