import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-auto items-center justify-center rounded-2xl p-3 text-muted-foreground gap-2.5 flex-wrap",
      "bg-gradient-to-br from-muted/70 via-background/50 to-muted/70",
      "border-2 border-border/40 backdrop-blur-lg",
      "shadow-[0_2px_12px_hsl(var(--primary)/0.08)]",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-xl px-5 py-3 text-sm font-bold ring-offset-background transition-all duration-300 cursor-pointer select-none gap-2",
      // ── Inactive: bold 3D candy button ──
      "data-[state=inactive]:bg-gradient-to-b data-[state=inactive]:from-accent/90 data-[state=inactive]:via-accent/70 data-[state=inactive]:to-accent/50",
      "data-[state=inactive]:border-[2.5px] data-[state=inactive]:border-accent-foreground/15",
      "data-[state=inactive]:text-accent-foreground/80",
      "data-[state=inactive]:shadow-[0_4px_0_hsl(var(--border)),0_6px_16px_-2px_hsl(var(--border)/0.35),inset_0_2px_0_hsl(0_0%_100%/0.15)]",
      // Hover: lift + primary glow
      "data-[state=inactive]:hover:-translate-y-1.5",
      "data-[state=inactive]:hover:bg-gradient-to-b data-[state=inactive]:hover:from-primary/25 data-[state=inactive]:hover:via-primary/15 data-[state=inactive]:hover:to-primary/10",
      "data-[state=inactive]:hover:border-primary/50",
      "data-[state=inactive]:hover:text-foreground",
      "data-[state=inactive]:hover:shadow-[0_6px_0_hsl(var(--primary)/0.3),0_12px_28px_-4px_hsl(var(--primary)/0.3),inset_0_2px_0_hsl(0_0%_100%/0.2)]",
      // Press: squish down
      "data-[state=inactive]:active:translate-y-0.5",
      "data-[state=inactive]:active:shadow-[0_1px_0_hsl(var(--border)),0_2px_4px_hsl(var(--border)/0.2),inset_0_2px_6px_hsl(var(--border)/0.15)]",
      // ── Active: vivid primary 3D ──
      "data-[state=active]:bg-gradient-to-b data-[state=active]:from-primary data-[state=active]:via-primary/90 data-[state=active]:to-primary/75",
      "data-[state=active]:text-primary-foreground",
      "data-[state=active]:border-[2.5px] data-[state=active]:border-primary-foreground/20",
      "data-[state=active]:shadow-[0_4px_0_hsl(var(--primary)/0.6),0_8px_24px_-2px_hsl(var(--primary)/0.45),inset_0_2px_0_hsl(0_0%_100%/0.25)]",
      "data-[state=active]:scale-[1.04]",
      // Focus
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
