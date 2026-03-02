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
      "inline-flex h-auto items-center justify-center rounded-2xl bg-muted/40 p-2.5 text-muted-foreground border border-border/30 backdrop-blur-md gap-2 flex-wrap",
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
      "inline-flex items-center justify-center whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-bold ring-offset-background transition-all duration-300 cursor-pointer select-none",
      // Inactive: 3D raised button look
      "data-[state=inactive]:bg-gradient-to-b data-[state=inactive]:from-card data-[state=inactive]:to-muted/80",
      "data-[state=inactive]:border-2 data-[state=inactive]:border-border",
      "data-[state=inactive]:shadow-[0_4px_6px_-1px_hsl(var(--border)/0.4),inset_0_1px_0_hsl(var(--card)/0.8)]",
      "data-[state=inactive]:text-muted-foreground",
      // Inactive hover: lift + glow
      "data-[state=inactive]:hover:-translate-y-1 data-[state=inactive]:hover:shadow-[0_8px_20px_-4px_hsl(var(--primary)/0.25),inset_0_1px_0_hsl(var(--card)/0.9)]",
      "data-[state=inactive]:hover:border-primary/50 data-[state=inactive]:hover:text-foreground",
      "data-[state=inactive]:hover:bg-gradient-to-b data-[state=inactive]:hover:from-primary/10 data-[state=inactive]:hover:to-primary/5",
      // Active press
      "data-[state=inactive]:active:translate-y-0 data-[state=inactive]:active:shadow-[0_1px_2px_hsl(var(--border)/0.3),inset_0_2px_4px_hsl(var(--border)/0.2)]",
      // Active state: vivid primary
      "data-[state=active]:bg-gradient-to-b data-[state=active]:from-primary data-[state=active]:to-primary/85",
      "data-[state=active]:text-primary-foreground",
      "data-[state=active]:border-2 data-[state=active]:border-primary/60",
      "data-[state=active]:shadow-[0_6px_20px_-2px_hsl(var(--primary)/0.5),inset_0_1px_0_hsl(0_0%_100%/0.2)]",
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
