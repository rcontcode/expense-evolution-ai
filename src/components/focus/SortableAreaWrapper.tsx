 import { memo, type ReactNode } from 'react';
 import { useSortable } from '@dnd-kit/sortable';
 import { CSS } from '@dnd-kit/utilities';
 import { motion } from 'framer-motion';
 import { GripVertical } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
  interface SortableAreaWrapperProps {
    id: string;
    index: number;
    children: ReactNode;
    'data-area-id'?: string;
  }
  
  export const SortableAreaWrapper = memo(({ id, index, children, 'data-area-id': dataAreaId }: SortableAreaWrapperProps) => {
   const {
     attributes,
     listeners,
     setNodeRef,
     transform,
     transition,
     isDragging,
   } = useSortable({ id });
 
   const style = {
     transform: CSS.Transform.toString(transform),
     transition,
   };
 
   return (
     <motion.div
       ref={setNodeRef}
       style={style}
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ delay: index * 0.05, duration: 0.3 }}
       className={cn(
         "relative group",
         isDragging && "z-50 opacity-90"
       )}
     >
       {/* Drag handle - visible on hover */}
       <div
         {...attributes}
         {...listeners}
         className={cn(
           "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-2",
           "opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing",
           "hidden md:flex items-center",
           isDragging && "opacity-100"
         )}
       >
         <div className="p-1 rounded bg-muted/80 hover:bg-muted">
           <GripVertical className="h-4 w-4 text-muted-foreground" />
         </div>
       </div>
       {children}
     </motion.div>
   );
 });
 
 SortableAreaWrapper.displayName = 'SortableAreaWrapper';