import { useState, useMemo } from 'react';
import { CountryFlag } from '@/components/ui/country-flag';
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
import { MoreHorizontal, Eye, Phone, UserCheck, CheckCircle, MessageSquare, Calendar, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
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

const countryMap: { pattern: RegExp; code: string; label: string }[] = [
  { pattern: /canad/i, code: 'CA', label: 'Canadá' },
  { pattern: /chile/i, code: 'CL', label: 'Chile' },
  { pattern: /m[eé]x/i, code: 'MX', label: 'México' },
  { pattern: /estados|united|usa|\bus\b/i, code: 'US', label: 'EE.UU.' },
  { pattern: /colomb/i, code: 'CO', label: 'Colombia' },
  { pattern: /argent/i, code: 'AR', label: 'Argentina' },
  { pattern: /per[uú]/i, code: 'PE', label: 'Perú' },
  { pattern: /espa[ñn]a|spain/i, code: 'ES', label: 'España' },
  { pattern: /brasil|brazil/i, code: 'BR', label: 'Brasil' },
  { pattern: /ecuad/i, code: 'EC', label: 'Ecuador' },
  { pattern: /venezu/i, code: 'VE', label: 'Venezuela' },
  { pattern: /urugua/i, code: 'UY', label: 'Uruguay' },
  { pattern: /paragu/i, code: 'PY', label: 'Paraguay' },
  { pattern: /boliv/i, code: 'BO', label: 'Bolivia' },
  { pattern: /panam/i, code: 'PA', label: 'Panamá' },
  { pattern: /costa\s*rica/i, code: 'CR', label: 'Costa Rica' },
  { pattern: /rep.*domin|dominican/i, code: 'DO', label: 'Rep. Dominicana' },
  { pattern: /guatem/i, code: 'GT', label: 'Guatemala' },
  { pattern: /hondur/i, code: 'HN', label: 'Honduras' },
  { pattern: /salvador/i, code: 'SV', label: 'El Salvador' },
  { pattern: /nicarag/i, code: 'NI', label: 'Nicaragua' },
  { pattern: /cuba/i, code: 'CU', label: 'Cuba' },
  { pattern: /puerto\s*rico/i, code: 'PR', label: 'Puerto Rico' },
];

function getCountryInfo(country: string): { code: string | null; label: string } {
  if (!country || !country.trim()) return { code: null, label: 'Sin país' };
  // Remove ALL emoji types: flag sequences (regional indicators), pictographics, modifiers, etc.
  const clean = country
    .replace(/[\u{1F1E0}-\u{1F1FF}]{2}/gu, '') // flag emoji (regional indicator pairs)
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '') // other emoji
    .replace(/[\/]/g, ' ')
    .trim();
  for (const entry of countryMap) {
    if (entry.pattern.test(country) || entry.pattern.test(clean)) return { code: entry.code, label: entry.label };
  }
  if (/otro|other/i.test(country)) return { code: null, label: 'Otro' };
  return { code: null, label: clean || 'Sin país' };
}

type SortKey = 'created_at' | 'priority' | 'name' | 'source' | 'country' | 'quiz_level' | 'quiz_score' | 'status';
type SortDir = 'asc' | 'desc';

const priorityOrder: Record<string, number> = { hot: 4, warm: 3, cool: 2, cold: 1 };

function SortableHeader({ label, sortKey, currentKey, currentDir, onSort }: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const isActive = currentKey === sortKey;
  return (
    <TableHead
      className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {isActive ? (
          currentDir === 'desc' ? (
            <ArrowDown className="h-3.5 w-3.5 text-primary" />
          ) : (
            <ArrowUp className="h-3.5 w-3.5 text-primary" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
        )}
      </div>
    </TableHead>
  );
}

export function LeadsTable({ leads, allLeads, onMarkContacted, onMarkConverted }: LeadsTableProps) {
  const [selectedLead, setSelectedLead] = useState<QuizLead | null>(null);
  const [followUpLead, setFollowUpLead] = useState<QuizLead | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  // Enrich and sort leads
  const enrichedLeads = useMemo(() => {
    const enriched = leads.map(lead => {
      const score = calculateLeadScore(lead);
      const priority = getLeadPriority(score);
      return { ...lead, calculatedScore: score, calculatedPriority: priority };
    });

    enriched.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'created_at':
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'priority':
          cmp = (priorityOrder[a.calculatedPriority] || 0) - (priorityOrder[b.calculatedPriority] || 0);
          break;
        case 'name':
          cmp = (a.name || '').localeCompare(b.name || '');
          break;
        case 'source':
          cmp = (a.source || '').localeCompare(b.source || '');
          break;
        case 'country':
          cmp = (a.country || '').localeCompare(b.country || '');
          break;
        case 'quiz_level':
          cmp = (a.quiz_level || '').localeCompare(b.quiz_level || '');
          break;
        case 'quiz_score':
          cmp = (a.quiz_score || 0) - (b.quiz_score || 0);
          break;
        case 'status': {
          const statusVal = (l: typeof a) => l.converted_to_user ? 2 : l.contacted_at ? 1 : 0;
          cmp = statusVal(a) - statusVal(b);
          break;
        }
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return enriched;
  }, [leads, sortKey, sortDir]);

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No hay leads que coincidan con los filtros</p>
      </div>
    );
  }

  const sortProps = { currentKey: sortKey, currentDir: sortDir, onSort: handleSort };

  return (
    <>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <SortableHeader label="Nombre" sortKey="name" {...sortProps} />
              <SortableHeader label="Prioridad" sortKey="priority" {...sortProps} />
              <SortableHeader label="Fuente" sortKey="source" {...sortProps} />
              <SortableHeader label="País" sortKey="country" {...sortProps} />
              <SortableHeader label="Nivel" sortKey="quiz_level" {...sortProps} />
              <SortableHeader label="Score Quiz" sortKey="quiz_score" {...sortProps} />
              <SortableHeader label="Estado" sortKey="status" {...sortProps} />
              <SortableHeader label="Fecha" sortKey="created_at" {...sortProps} />
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

                  <TableCell>
                    {(() => {
                      const info = getCountryInfo(lead.country);
                      return (
                        <div className="flex items-center gap-1.5">
                          {info.code ? (
                            <CountryFlag code={info.code} size="sm" />
                          ) : (
                            <div className="h-4 w-6 rounded-sm bg-muted flex items-center justify-center text-[8px] text-muted-foreground">?</div>
                          )}
                          <span className="text-xs">{info.label}</span>
                        </div>
                      );
                    })()}
                  </TableCell>
                  
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
        allLeads={allLeads}
      />

      <FollowUpModal
        lead={followUpLead}
        open={!!followUpLead}
        onOpenChange={(open) => !open && setFollowUpLead(null)}
      />
    </>
  );
}
