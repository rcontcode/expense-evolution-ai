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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Calendar,
  History,
  Brain,
} from 'lucide-react';
import type { QuizLead } from '@/hooks/admin/useLeadsManagement';
import { calculateLeadScore, getLeadPriority } from '@/hooks/admin/useLeadScoring';
import { LeadScoreBadge, LeadScoreProgress } from './LeadScoreBadge';
import { QuickContact } from './QuickContact';
import { InteractionTimeline } from './InteractionTimeline';
import { FollowUpsList } from './FollowUpsList';
import { FollowUpModal } from './FollowUpModal';
import { LeadEnrichmentPanel } from './LeadEnrichmentPanel';
import { LeadTagEditor } from './LeadTagEditor';

interface LeadDetailProps {
  lead: QuizLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkContacted: (id: string, notes?: string) => void;
  onMarkConverted: (id: string) => void;
  allLeads?: QuizLead[];
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
  allLeads = [],
}: LeadDetailProps) {
  const [contactNotes, setContactNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);

  if (!lead) return null;

  const score = calculateLeadScore(lead);
  const priority = getLeadPriority(score);

  const handleMarkContacted = () => {
    onMarkContacted(lead.id, contactNotes);
    setContactNotes('');
    setShowNotesInput(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span>{lead.name}</span>
                <Badge
                  variant="secondary"
                  className={levelColors[lead.quiz_level?.toLowerCase()] || ''}
                >
                  {lead.quiz_level}
                </Badge>
                {lead.metadata?.producto_recomendado && (
                  <Badge className="bg-violet-600 text-white text-[10px]">
                    {lead.metadata.producto_recomendado as string}
                  </Badge>
                )}
                {lead.metadata?.precio_producto && (
                  <Badge variant="outline" className="text-[10px] border-emerald-400 text-emerald-700">
                    ${lead.metadata.precio_producto as number}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <LeadScoreBadge score={score} priority={priority} />
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Priority Score Bar */}
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <span className="text-sm font-medium">Lead Score:</span>
              <LeadScoreProgress score={score} priority={priority} className="flex-1" />
              <span className="text-sm text-muted-foreground">{score}/100</span>
            </div>

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

            {/* Tags */}
            <LeadTagEditor leadId={lead.id} tags={lead.tags || []} />

            {/* Quick Contact Actions */}
            <div className="flex items-center gap-3">
              <QuickContact lead={lead} variant="dropdown" />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFollowUpModal(true)}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Programar seguimiento
              </Button>
            </div>

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

            {/* Tabs for different sections */}
            <Tabs defaultValue="intelligence" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="intelligence" className="flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  Intel
                </TabsTrigger>
                <TabsTrigger value="profile">Perfil</TabsTrigger>
                <TabsTrigger value="followups" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Seguimientos
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-1">
                  <History className="h-3 w-3" />
                  Historial
                </TabsTrigger>
              </TabsList>

              <TabsContent value="intelligence" className="mt-4">
                <LeadEnrichmentPanel lead={lead} allLeads={allLeads} />
              </TabsContent>

              <TabsContent value="profile" className="space-y-6 mt-4">
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
              </TabsContent>

              <TabsContent value="followups" className="mt-4">
                <FollowUpsList leadId={lead.id} />
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <InteractionTimeline leadId={lead.id} />
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <FollowUpModal
        lead={lead}
        open={showFollowUpModal}
        onOpenChange={setShowFollowUpModal}
      />
    </>
  );
}
