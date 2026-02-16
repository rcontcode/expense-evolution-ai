import { useLanguage } from "@/contexts/LanguageContext";
import { useBudgetAuditLog } from "@/hooks/data/useBudgetAuditLog";
import { formatDistanceToNow, parseISO } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { History, FileEdit, Plus, Trash2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const ACTION_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  create: { icon: <Plus className="h-3 w-3" />, color: "text-emerald-500" },
  update: { icon: <FileEdit className="h-3 w-3" />, color: "text-blue-500" },
  delete: { icon: <Trash2 className="h-3 w-3" />, color: "text-destructive" },
  rollover: { icon: <RefreshCw className="h-3 w-3" />, color: "text-amber-500" },
};

export function BudgetAuditLogWidget() {
  const { language } = useLanguage();
  const l = language === "es";
  const { data: logs, isLoading } = useBudgetAuditLog(20);

  if (isLoading) return <div className="h-24 animate-pulse bg-muted/30 rounded-lg" />;

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-6">
        <History className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">
          {l ? "Los cambios en tu presupuesto aparecerán aquí" : "Budget changes will appear here"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
      {logs.map((entry) => {
        const config = ACTION_CONFIG[entry.action] || ACTION_CONFIG.update;
        const timeAgo = formatDistanceToNow(parseISO(entry.created_at), {
          addSuffix: true,
          locale: l ? es : enUS,
        });

        return (
          <div key={entry.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors">
            <div className={cn("mt-0.5 shrink-0", config.color)}>
              {config.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs">
                <span className="font-medium capitalize">{entry.action}</span>
                {" "}
                <span className="text-muted-foreground">{entry.entity_type}</span>
              </p>
              {entry.new_values && (
                <p className="text-[10px] text-muted-foreground truncate">
                  {typeof entry.new_values === 'object' 
                    ? Object.entries(entry.new_values).map(([k, v]) => `${k}: ${v}`).join(', ')
                    : String(entry.new_values)}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground/60">{timeAgo}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
