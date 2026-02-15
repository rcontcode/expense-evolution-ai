import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CollapsibleSectionProps {
  emoji: string;
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  alert?: boolean;
  badge?: string;
}

export function CollapsibleSection({
  emoji,
  title,
  subtitle,
  defaultOpen = false,
  children,
  alert,
  badge,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className={cn(
        "overflow-hidden transition-all duration-300",
        alert && "border-red-500/30",
        open && "shadow-md"
      )}>
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors rounded-t-xl">
            <span className="text-xl">{emoji}</span>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold flex items-center gap-2">
                {title}
                {alert && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                {badge && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                    {badge}
                  </span>
                )}
              </p>
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-300", open && "rotate-180")} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
