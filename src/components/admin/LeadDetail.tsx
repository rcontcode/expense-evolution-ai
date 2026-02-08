import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Mail,
  Phone,
  MapPin,
  Target,
  AlertTriangle,
  Clock,
  BarChart3,
  UserCheck,
  MessageSquare,
} from 'lucide-react';
import type { QuizLead } from '@/hooks/admin/useLeadsManagement';

interface LeadDetailProps {
  lead: QuizLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkContacted: (id: string, notes?: string) => void;
  onMarkConverted: (id: string) => void;
}

const levelColors: Record<string, string> = {
  principiante: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  emergente: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  evolucionando: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  maestro: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

const failedQuestionLabels: Record<number, string> = {
  1: 'Presupuesto mensual',
  2: 'Fondo de emergencia',
  3: 'Revisión de gastos',
  4: 'Deudas de alto interés',
  5: 'Inversión para retiro',
  6: 'Metas financieras claras',
  7: 'Seguro de vida/salud',
  8: 'Educación financiera',
  9: 'Diversificación de ingresos',
  10: 'Plan de sucesión',
};

export function LeadDetail({
  lead,
  open,
  onOpenChange,
  onMarkContacted,
  onMarkConverted,
}: LeadDetailProps) {
  const [contactNotes, setContactNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);

  if (!lead) return null;

  const handleMarkContacted = () => {
    onMarkContacted(lead.id, contactNotes);
    setContactNotes('');
    setShowNotesInput(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{lead.name}</span>
            <Badge
              variant="secondary"
              className={levelColors[lead.quiz_level?.toLowerCase()] || ''}
            >
              {lead.quiz_level}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Personal Comments - Highlighted */}
          {lead.comments && (
            <div className="rounded-lg border-2 border-amber-400 bg-amber-50 dark:bg-amber-900/20 p-4">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                💬 Mensaje personal del lead
              </p>
              <p className="text-sm text-amber-900 dark:text-amber-100 italic">
                "{lead.comments}"
              </p>
            </div>
          )}

          {/* Contact Info */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${lead.email}`} className="text-primary hover:underline">
                {lead.email}
              </a>
            </div>
            {lead.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${lead.phone}`} className="text-primary hover:underline">
                  {lead.phone}
                </a>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{lead.country}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(lead.created_at), "dd MMM yyyy 'a las' HH:mm", { locale: es })}</span>
            </div>
          </div>

          <Separator />

          {/* Quiz Results */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Resultados del Quiz
            </h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-2xl font-bold">{lead.quiz_score}%</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Tiempo invertido</p>
                <p className="text-2xl font-bold">{lead.time_spent || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Failed Questions */}
          {lead.failed_questions && lead.failed_questions.length > 0 && (
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Áreas de oportunidad ({lead.failed_questions.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {lead.failed_questions.map((q) => (
                  <Badge key={q} variant="outline" className="text-xs">
                    {failedQuestionLabels[q] || `Pregunta ${q}`}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* User Context */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground mb-1">Situación actual</p>
              <p className="text-sm font-medium">{lead.situation}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                <Target className="h-3 w-3" />
                Meta
              </p>
              <p className="text-sm font-medium">{lead.goal}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Obstáculo
              </p>
              <p className="text-sm font-medium">{lead.obstacle}</p>
            </div>
          </div>

          <Separator />

          {/* Status & Actions */}
          <div>
            <h4 className="font-medium mb-3">Estado del lead</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {lead.contacted_at ? (
                <Badge variant="outline">
                  Contactado el {format(new Date(lead.contacted_at), 'dd MMM yyyy', { locale: es })}
                </Badge>
              ) : (
                <Badge variant="secondary">Sin contactar</Badge>
              )}
              {lead.converted_to_user ? (
                <Badge className="bg-green-600">Convertido a usuario</Badge>
              ) : (
                <Badge variant="secondary">No convertido</Badge>
              )}
              {lead.ghl_synced && (
                <Badge variant="outline">Sincronizado con GHL</Badge>
              )}
            </div>

            {/* Contact Notes */}
            {lead.contact_notes && (
              <div className="rounded-lg border p-4 mb-4 bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  Notas de contacto
                </p>
                <p className="text-sm">{lead.contact_notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {!lead.contacted_at && (
                <>
                  {showNotesInput ? (
                    <div className="w-full space-y-2">
                      <Textarea
                        placeholder="Notas sobre el contacto (opcional)..."
                        value={contactNotes}
                        onChange={(e) => setContactNotes(e.target.value)}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleMarkContacted}>
                          Confirmar contactado
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowNotesInput(false)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setShowNotesInput(true)}>
                      <Phone className="mr-2 h-4 w-4" />
                      Marcar como contactado
                    </Button>
                  )}
                </>
              )}
              {!lead.converted_to_user && (
                <Button size="sm" onClick={() => onMarkConverted(lead.id)}>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Marcar como convertido
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
