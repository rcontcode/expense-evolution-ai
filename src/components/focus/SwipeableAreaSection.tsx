 import { memo, useRef, useState, type ReactNode } from 'react';
 import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
 import { FocusAreaId } from '@/lib/constants/focus-areas';
 import { AreaSection } from './AreaSection';
 import { ChevronLeft, ChevronRight } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 interface SwipeableAreaSectionProps {
   areaId: FocusAreaId;
   isCollapsed: boolean;
   onToggleCollapse: () => void;
   children: ReactNode;
   className?: string;
   showSwipeHint?: boolean;
 }
 
 const SWIPE_THRESHOLD = 80;
 
 export const SwipeableAreaSection = memo(({
   areaId,
   isCollapsed,
   onToggleCollapse,
   children,
   className,
   showSwipeHint = true
 }: SwipeableAreaSectionProps) => {
   const x = useMotionValue(0);
   const [isDragging, setIsDragging] = useState(false);
 
   // Visual feedback during swipe
   const leftOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
   const rightOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
   const scale = useTransform(x, [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD], [0.98, 1, 0.98]);
 
   const handleDragEnd = (_: any, info: PanInfo) => {
     setIsDragging(false);
     
     // Only trigger on horizontal swipes that exceed threshold
     if (Math.abs(info.offset.x) > SWIPE_THRESHOLD && Math.abs(info.offset.y) < 50) {
       onToggleCollapse();
     }
   };
 
   return (
     <div className="relative">
       {/* Swipe indicators */}
       <motion.div 
         className="absolute left-2 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
         style={{ opacity: leftOpacity }}
       >
         <div className="bg-primary/20 rounded-full p-2">
           <ChevronLeft className="h-5 w-5 text-primary" />
         </div>
       </motion.div>
       <motion.div 
         className="absolute right-2 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
         style={{ opacity: rightOpacity }}
       >
         <div className="bg-primary/20 rounded-full p-2">
           <ChevronRight className="h-5 w-5 text-primary" />
         </div>
       </motion.div>
 
       <motion.div
         drag="x"
         dragConstraints={{ left: 0, right: 0 }}
         dragElastic={0.2}
         onDragStart={() => setIsDragging(true)}
         onDragEnd={handleDragEnd}
         style={{ x, scale }}
         className={cn(
           "touch-pan-y",
           isDragging && "cursor-grabbing"
         )}
       >
         <AreaSection
           areaId={areaId}
           isCollapsed={isCollapsed}
           onToggleCollapse={onToggleCollapse}
           className={className}
         >
           {children}
         </AreaSection>
       </motion.div>
     </div>
   );
 });
 
 SwipeableAreaSection.displayName = 'SwipeableAreaSection';