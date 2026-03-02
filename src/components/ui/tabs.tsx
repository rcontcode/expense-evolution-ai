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
      "bg-gradient-to-br from-card/80 via-muted/40 to-card/80",
      "border-2 border-border/40 backdrop-blur-lg",
      "shadow-[0_2px_12px_hsl(var(--primary)/0.06)]",
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
      // ── Inactive: clear outlined button with high contrast ──
      "data-[state=inactive]:bg-card data-[state=inactive]:text-foreground",
      "data-[state=inactive]:border-2 data-[state=inactive]:border-border",
      "data-[state=inactive]:shadow-[0_3px_0_hsl(var(--border)),0_4px_12px_-2px_hsl(var(--border)/0.25),inset_0_1px_0_hsl(0_0%_100%/0.1)]",
      // Hover: lift + color hint
      "data-[state=inactive]:hover:-translate-y-1",
      "data-[state=inactive]:hover:border-primary/60",
      "data-[state=inactive]:hover:text-primary",
      "data-[state=inactive]:hover:shadow-[0_5px_0_hsl(var(--primary)/0.25),0_10px_24px_-4px_hsl(var(--primary)/0.2),inset_0_1px_0_hsl(0_0%_100%/0.15)]",
      // Press
      "data-[state=inactive]:active:translate-y-0.5",
      "data-[state=inactive]:active:shadow-[0_1px_0_hsl(var(--border)),inset_0_2px_4px_hsl(var(--border)/0.15)]",
      // ── Active: vivid primary with white text ──
      "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
      "data-[state=active]:border-2 data-[state=active]:border-primary",
      "data-[state=active]:shadow-[0_3px_0_hsl(var(--primary)/0.5),0_6px_20px_-2px_hsl(var(--primary)/0.4),inset_0_1px_0_hsl(0_0%_100%/0.2)]",
      "data-[state=active]:scale-[1.03]",
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
