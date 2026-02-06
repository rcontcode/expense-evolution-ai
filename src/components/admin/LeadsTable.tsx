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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Phone, UserCheck, Mail, CheckCircle } from 'lucide-react';
import type { QuizLead } from '@/hooks/admin/useLeadsManagement';
import { LeadDetail } from './LeadDetail';

interface LeadsTableProps {
  leads: QuizLead[];
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

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No hay leads que coincidan con los filtros</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Nivel</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell>
                  <a
                    href={`mailto:${lead.email}`}
                    className="text-primary hover:underline"
                  >
                    {lead.email}
                  </a>
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
                <TableCell>{lead.quiz_score}%</TableCell>
                <TableCell>
                  <div className="flex gap-1">
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
                <TableCell className="text-muted-foreground">
                  {format(new Date(lead.created_at), 'dd MMM yyyy', { locale: es })}
                </TableCell>
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
                      <DropdownMenuItem
                        onClick={() => window.open(`mailto:${lead.email}`, '_blank')}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Enviar email
                      </DropdownMenuItem>
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
            ))}
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
    </>
  );
}
