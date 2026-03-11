import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Phone, UserCheck, CheckCircle, MessageSquare, Calendar } from 'lucide-react';
import type { QuizLead } from '@/hooks/admin/useLeadsManagement';
import { 
  calculateLeadScore, 
  getLeadPriority, 
  getPriorityColors 
} from '@/hooks/admin/useLeadScoring';
import { LeadScoreBadge, LeadScoreProgress } from './LeadScoreBadge';
import { QuickContact } from './QuickContact';
import { LeadDetail } from './LeadDetail';
import { FollowUpModal } from './FollowUpModal';
import { cn } from '@/lib/utils';

interface LeadsTableProps {
  leads: QuizLead[];
  allLeads?: QuizLead[];
  onMarkContacted: (id: string, notes?: string) => void;
  onMarkConverted: (id: string) => void;
}

const levelColors: Record<string, string> = {
  principiante: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  emergente: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  evolucionando: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  maestro: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

export function LeadsTable({ leads, onMarkContacted, onMarkConverted }: LeadsTableProps) {
  const [selectedLead, setSelectedLead] = useState<QuizLead | null>(null);
  const [followUpLead, setFollowUpLead] = useState<QuizLead | null>(null);

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No hay leads que coincidan con los filtros</p>
      </div>
    );
  }

  // Enrich leads with scores and sort by priority
  const enrichedLeads = leads.map(lead => {
    const score = calculateLeadScore(lead);
    const priority = getLeadPriority(score);
    return { ...lead, calculatedScore: score, calculatedPriority: priority };
  }).sort((a, b) => b.calculatedScore - a.calculatedScore);

  return (
    <>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Fuente</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Nivel</TableHead>
              <TableHead>Score Quiz</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrichedLeads.map((lead) => {
              const colors = getPriorityColors(lead.calculatedPriority);
              
              return (
                <TableRow 
                  key={lead.id}
                  className={cn(colors.row, colors.border)}
                >
                  {/* Priority indicator */}
                  <TableCell className="px-2">
                    <div 
                      className={cn(
                        'w-2 h-2 rounded-full mx-auto',
                        lead.calculatedPriority === 'hot' && 'bg-red-500 animate-pulse',
                        lead.calculatedPriority === 'warm' && 'bg-orange-500',
                        lead.calculatedPriority === 'cool' && 'bg-blue-500',
                        lead.calculatedPriority === 'cold' && 'bg-gray-400'
                      )}
                    />
                  </TableCell>

                  {/* Name + indicators */}
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span 
                        className="cursor-pointer hover:underline"
                        onClick={() => setSelectedLead(lead)}
                      >
                        {lead.name}
                      </span>
                      {lead.comments && (
                        <span title="Tiene comentarios personales">
                          <MessageSquare className="h-4 w-4 text-amber-500" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {lead.email}
                    </p>
                  </TableCell>

                  {/* Priority badge with score */}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <LeadScoreBadge 
                        score={lead.calculatedScore} 
                        priority={lead.calculatedPriority}
                        showScore={false}
                        size="sm"
                      />
                      <LeadScoreProgress 
                        score={lead.calculatedScore}
                        priority={lead.calculatedPriority}
                      />
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        'text-xs',
                        lead.source === 'fokuspark' 
                          ? 'border-violet-300 text-violet-700 dark:border-violet-700 dark:text-violet-400'
                          : lead.source?.toLowerCase().includes('trustly')
                            ? 'border-sky-300 text-sky-700 dark:border-sky-700 dark:text-sky-400'
                            : lead.source === 'evofinz' || !lead.source
                              ? 'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400'
                              : 'border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400'
                      )}
                    >
                      {lead.source === 'fokuspark' ? 'Fokuspark' 
                        : lead.source === 'evofinz' || !lead.source ? 'EvoFinz'
                        : lead.source}
                    </Badge>
                  </TableCell>

                  <TableCell>{lead.country}</TableCell>
                  
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={levelColors[lead.quiz_level?.toLowerCase()] || ''}
                    >
                      {lead.quiz_level}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <span className="font-medium">{lead.quiz_score}%</span>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {lead.contacted_at && (
                        <Badge variant="outline" className="text-xs">
                          <Phone className="mr-1 h-3 w-3" />
                          Contactado
                        </Badge>
                      )}
                      {lead.converted_to_user && (
                        <Badge className="text-xs bg-green-600">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Convertido
                        </Badge>
                      )}
                      {!lead.contacted_at && !lead.converted_to_user && (
                        <Badge variant="secondary" className="text-xs">
                          Nuevo
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(lead.created_at), 'dd MMM yyyy', { locale: es })}
                  </TableCell>

                  {/* Quick contact buttons */}
                  <TableCell>
                    <QuickContact lead={lead} variant="buttons" />
                  </TableCell>

                  {/* Actions dropdown */}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedLead(lead)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFollowUpLead(lead)}>
                          <Calendar className="mr-2 h-4 w-4" />
                          Programar seguimiento
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {!lead.contacted_at && (
                          <DropdownMenuItem onClick={() => onMarkContacted(lead.id)}>
                            <Phone className="mr-2 h-4 w-4" />
                            Marcar contactado
                          </DropdownMenuItem>
                        )}
                        {!lead.converted_to_user && (
                          <DropdownMenuItem onClick={() => onMarkConverted(lead.id)}>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Marcar convertido
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <LeadDetail
        lead={selectedLead}
        open={!!selectedLead}
        onOpenChange={(open) => !open && setSelectedLead(null)}
        onMarkContacted={onMarkContacted}
        onMarkConverted={onMarkConverted}
      />

      <FollowUpModal
        lead={followUpLead}
        open={!!followUpLead}
        onOpenChange={(open) => !open && setFollowUpLead(null)}
      />
    </>
  );
}
