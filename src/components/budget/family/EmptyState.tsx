import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface EmptyStateProps {
  emoji: string;
  text: string;
  actionLabel: string;
  onAction: () => void;
}

export function EmptyState({ emoji, text, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="text-center py-6 space-y-3">
      <span className="text-3xl">{emoji}</span>
      <p className="text-sm text-muted-foreground">{text}</p>
      <Button size="sm" variant="outline" onClick={onAction} className="gap-1.5">
        <Plus className="h-3.5 w-3.5" />
        {actionLabel}
      </Button>
    </div>
  );
}
