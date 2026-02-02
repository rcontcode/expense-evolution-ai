import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Check, 
  X, 
  Camera, 
  Edit3, 
  Store, 
  DollarSign,
  Calendar,
  Tag,
  User,
  Folder
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useClients } from '@/hooks/data/useClients';
import { useProjects } from '@/hooks/data/useProjects';
import { ExtractedExpenseData } from '@/hooks/data/useReceiptProcessor';

const CATEGORY_OPTIONS = [
  { value: 'meals', label: '🍽️ Comidas', labelEn: '🍽️ Meals', color: 'bg-orange-500' },
  { value: 'travel', label: '✈️ Viajes', labelEn: '✈️ Travel', color: 'bg-blue-500' },
  { value: 'equipment', label: '🛠️ Equipo', labelEn: '🛠️ Equipment', color: 'bg-purple-500' },
  { value: 'software', label: '💻 Software', labelEn: '💻 Software', color: 'bg-cyan-500' },
  { value: 'office_supplies', label: '📎 Oficina', labelEn: '📎 Office', color: 'bg-amber-500' },
  { value: 'fuel', label: '⛽ Combustible', labelEn: '⛽ Fuel', color: 'bg-red-500' },
  { value: 'utilities', label: '💡 Servicios', labelEn: '💡 Utilities', color: 'bg-green-500' },
  { value: 'other', label: '📦 Otro', labelEn: '📦 Other', color: 'bg-gray-500' },
];

interface QuickEditPanelProps {
  expense: ExtractedExpenseData;
  onSave: (updates: { clientId?: string; projectId?: string; category?: string }) => void;
  onCaptureAnother: () => void;
  onEditMore: () => void;
  onClose: () => void;
}

export function QuickEditPanel({
  expense,
  onSave,
  onCaptureAnother,
  onEditMore,
  onClose,
}: QuickEditPanelProps) {
  const { language } = useLanguage();
  const { data: clients } = useClients();
  const { data: projects } = useProjects();
  
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(expense.category || '');

  const handleSave = () => {
    onSave({
      clientId: selectedClient || undefined,
      projectId: selectedProject || undefined,
      category: selectedCategory || undefined,
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(language === 'es' ? 'es-CA' : 'en-CA', {
      style: 'currency',
      currency: currency || 'CAD',
    }).format(amount);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed inset-x-4 bottom-4 z-50"
      >
        <Card className="border-2 border-emerald-500/50 bg-gradient-to-br from-card via-card to-emerald-500/5 shadow-xl shadow-emerald-500/10">
          <CardContent className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                  >
                    <Badge className="bg-emerald-500 text-white">
                      <Check className="h-3 w-3 mr-1" />
                      {language === 'es' ? '¡Detectado!' : 'Detected!'}
                    </Badge>
                  </motion.div>
                </div>
                
                {/* Vendor & Amount */}
                <div className="flex items-baseline gap-3">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-lg">{expense.vendor}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-bold text-foreground text-lg">
                      {formatCurrency(expense.amount, expense.currency)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{expense.date}</span>
                  </div>
                </div>
              </div>
              
              <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Selectors */}
            <div className="grid grid-cols-3 gap-2">
              {/* Client */}
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="h-10">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder={language === 'es' ? 'Cliente' : 'Client'} />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    {language === 'es' ? '— Sin cliente —' : '— No client —'}
                  </SelectItem>
                  {clients?.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Project */}
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="h-10">
                  <div className="flex items-center gap-1.5">
                    <Folder className="h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder={language === 'es' ? 'Proyecto' : 'Project'} />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    {language === 'es' ? '— Sin proyecto —' : '— No project —'}
                  </SelectItem>
                  {projects?.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Category */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-10">
                  <div className="flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder={language === 'es' ? 'Categoría' : 'Category'} />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {language === 'es' ? cat.label : cat.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onEditMore}
                className="flex-1"
              >
                <Edit3 className="h-4 w-4 mr-1.5" />
                {language === 'es' ? 'Editar más' : 'Edit more'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => { handleSave(); onCaptureAnother(); }}
                className="flex-1 border-primary text-primary hover:bg-primary/10"
              >
                <Camera className="h-4 w-4 mr-1.5" />
                {language === 'es' ? 'Otro' : 'Another'}
              </Button>
              
              <Button
                size="sm"
                onClick={handleSave}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
              >
                <Check className="h-4 w-4 mr-1.5" />
                OK
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
