import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText, Plus, Copy, Trash2, MessageCircle, Mail,
  Gift, Search, Star, Download, Sparkles, Edit,
} from 'lucide-react';
import { format } from 'date-fns';
import { es as esLocale } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import ExcelJS from 'exceljs';

interface Props {
  language: 'es' | 'en';
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  whatsapp: <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />,
  email: <Mail className="h-3.5 w-3.5 text-violet-500" />,
  offer: <Gift className="h-3.5 w-3.5 text-amber-500" />,
};

const TEMPLATE_TYPE_LABELS: Record<string, { es: string; en: string }> = {
  first_contact: { es: 'Primer contacto', en: 'First contact' },
  follow_up: { es: 'Follow-up', en: 'Follow-up' },
  reactivation: { es: 'Reactivación', en: 'Reactivation' },
  invitation: { es: 'Invitación', en: 'Invitation' },
  offer: { es: 'Oferta', en: 'Offer' },
  welcome: { es: 'Bienvenida', en: 'Welcome' },
};

const APP_LABELS: Record<string, string> = {
  evofinz: '💰 EvoFinz',
  fokuspark: '🧘 FokusPark',
  universmind: '🧠 UniversMind',
  bundle: '🔥 Bundle',
};

export const AdminSavedTemplates = ({ language }: Props) => {
  const isEs = language === 'es';
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterApp, setFilterApp] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [editOpen, setEditOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [formName, setFormName] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formMessageType, setFormMessageType] = useState('whatsapp');
  const [formTemplateType, setFormTemplateType] = useState('first_contact');
  const [formTargetApp, setFormTargetApp] = useState('evofinz');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['saved-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_message_templates')
        .select('*')
        .order('use_count', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const saveTemplate = useMutation({
    mutationFn: async () => {
      if (editingTemplate) {
        const { error } = await supabase.from('lead_message_templates')
          .update({ name: formName, content: formContent, message_type: formMessageType, template_type: formTemplateType, target_app: formTargetApp, updated_at: new Date().toISOString() })
          .eq('id', editingTemplate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('lead_message_templates').insert({
          name: formName, content: formContent, message_type: formMessageType,
          template_type: formTemplateType, target_app: formTargetApp, language,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-templates'] });
      setEditOpen(false);
      resetForm();
      toast.success(isEs ? '✅ Plantilla guardada' : '✅ Template saved');
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('lead_message_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-templates'] });
      toast.success(isEs ? 'Plantilla eliminada' : 'Template deleted');
    },
  });

  const incrementUseCount = useMutation({
    mutationFn: async (id: string) => {
      const template = templates.find((t: any) => t.id === id);
      if (!template) return;
      await supabase.from('lead_message_templates')
        .update({ use_count: (template.use_count || 0) + 1 })
        .eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-templates'] }),
  });

  const resetForm = () => {
    setFormName(''); setFormContent(''); setFormMessageType('whatsapp');
    setFormTemplateType('first_contact'); setFormTargetApp('evofinz');
    setEditingTemplate(null);
  };

  const openEdit = (template?: any) => {
    if (template) {
      setEditingTemplate(template);
      setFormName(template.name);
      setFormContent(template.content);
      setFormMessageType(template.message_type);
      setFormTemplateType(template.template_type);
      setFormTargetApp(template.target_app);
    } else {
      resetForm();
    }
    setEditOpen(true);
  };

  const handleCopy = (template: any) => {
    navigator.clipboard.writeText(template.content);
    incrementUseCount.mutate(template.id);
    toast.success(isEs ? '📋 Plantilla copiada' : '📋 Template copied');
  };

  const exportLeadsToExcel = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!data?.length) { toast.error(isEs ? 'No hay leads' : 'No leads'); return; }

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Leads');

      sheet.columns = [
        { header: 'Name', key: 'name', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Country', key: 'country', width: 12 },
        { header: 'Score', key: 'quiz_score', width: 8 },
        { header: 'Level', key: 'quiz_level', width: 14 },
        { header: 'Situation', key: 'situation', width: 20 },
        { header: 'Goal', key: 'goal', width: 25 },
        { header: 'Obstacle', key: 'obstacle', width: 25 },
        { header: 'Source', key: 'source', width: 12 },
        { header: 'Stage', key: 'pipeline_stage', width: 12 },
        { header: 'Contacted', key: 'contacted_at', width: 18 },
        { header: 'Converted', key: 'converted_to_user', width: 10 },
        { header: 'Comments', key: 'comments', width: 30 },
        { header: 'Created', key: 'created_at', width: 18 },
      ];

      // Style header
      sheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '6366F1' } };
      });

      data.forEach((lead: any) => sheet.addRow(lead));

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-export-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(isEs ? '📊 Excel exportado' : '📊 Excel exported');
    } catch (err: any) {
      toast.error(err.message || 'Export error');
    }
  };

  const filtered = templates.filter((t: any) => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.content.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType !== 'all' && t.message_type !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Actions bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={isEs ? 'Buscar plantillas...' : 'Search templates...'} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isEs ? 'Todos' : 'All'}</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="offer">{isEs ? 'Oferta' : 'Offer'}</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" className="gap-1.5" onClick={() => openEdit()}>
          <Plus className="h-4 w-4" />
          {isEs ? 'Nueva' : 'New'}
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={exportLeadsToExcel}>
          <Download className="h-4 w-4" />
          {isEs ? 'Exportar Leads' : 'Export Leads'}
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <AnimatePresence>
          {filtered.map((template: any, i: number) => (
            <motion.div key={template.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {TYPE_ICONS[template.message_type]}
                      <span className="font-bold text-sm">{template.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-[9px]">
                        {TEMPLATE_TYPE_LABELS[template.template_type]?.[isEs ? 'es' : 'en'] || template.template_type}
                      </Badge>
                      <Badge variant="secondary" className="text-[9px]">
                        {APP_LABELS[template.target_app] || template.target_app}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-3">{template.content}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Star className="h-3 w-3" />
                      <span>{template.use_count || 0} {isEs ? 'usos' : 'uses'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(template)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(template)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteTemplate.mutate(template.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{isEs ? 'Sin plantillas guardadas' : 'No saved templates'}</p>
            <Button size="sm" className="mt-3 gap-1" onClick={() => openEdit()}>
              <Plus className="h-4 w-4" /> {isEs ? 'Crear primera' : 'Create first'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => { if (!open) { setEditOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? (isEs ? '✏️ Editar plantilla' : '✏️ Edit template') : (isEs ? '➕ Nueva plantilla' : '➕ New template')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder={isEs ? 'Nombre de la plantilla' : 'Template name'} value={formName} onChange={(e) => setFormName(e.target.value)} />
            <div className="grid grid-cols-3 gap-2">
              <Select value={formMessageType} onValueChange={setFormMessageType}>
                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="offer">{isEs ? 'Oferta' : 'Offer'}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={formTemplateType} onValueChange={setFormTemplateType}>
                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TEMPLATE_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key} className="text-xs">{isEs ? label.es : label.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={formTargetApp} onValueChange={setFormTargetApp}>
                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="evofinz">💰 EvoFinz</SelectItem>
                  <SelectItem value="fokuspark">🧘 FokusPark</SelectItem>
                  <SelectItem value="universmind">🧠 UniversMind</SelectItem>
                  <SelectItem value="bundle">🔥 Bundle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder={isEs ? 'Contenido del mensaje...' : 'Message content...'}
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              rows={6}
            />
          </div>
          <DialogFooter>
            <Button onClick={() => saveTemplate.mutate()} disabled={!formName.trim() || !formContent.trim() || saveTemplate.isPending}>
              <Sparkles className="h-4 w-4 mr-1" />
              {isEs ? 'Guardar' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
