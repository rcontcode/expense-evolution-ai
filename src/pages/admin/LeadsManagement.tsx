import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { ArrowLeft, Users, Phone, UserCheck, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLeadsManagement } from '@/hooks/admin/useLeadsManagement';
import { LeadFilters } from '@/components/admin/LeadFilters';
import { LeadsTable } from '@/components/admin/LeadsTable';
import { LeadsExport } from '@/components/admin/LeadsExport';
import { TableSkeleton } from '@/components/ui/table-skeleton';

export default function LeadsManagement() {
  const navigate = useNavigate();
  const {
    leads,
    allLeads,
    isLoading,
    filters,
    setFilters,
    resetFilters,
    page,
    setPage,
    totalPages,
    countries,
    levels,
    stats,
    markContacted,
    markConverted,
  } = useLeadsManagement();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Gestión de Leads</h1>
                <p className="text-sm text-muted-foreground">
                  Leads capturados del Financial Phoenix Quiz
                </p>
              </div>
            </div>
            <LeadsExport leads={allLeads} />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Leads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{stats.total}</span>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Contactados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{stats.contacted}</span>
                <Phone className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.total > 0 ? ((stats.contacted / stats.total) * 100).toFixed(0) : 0}% del total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Convertidos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{stats.converted}</span>
                <UserCheck className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.total > 0 ? ((stats.converted / stats.total) * 100).toFixed(0) : 0}% conversión
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Sincronizados GHL</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{stats.synced}</span>
                <RefreshCw className="h-8 w-8 text-purple-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Enviados a GoHighLevel
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Level Distribution */}
        {Object.keys(stats.byLevel).length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Distribución por nivel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {Object.entries(stats.byLevel).map(([level, count]) => (
                  <div key={level} className="text-center">
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground capitalize">{level}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Filters */}
        <LeadFilters
          filters={filters}
          setFilters={setFilters}
          resetFilters={resetFilters}
          countries={countries}
          levels={levels}
        />

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {leads.length} de {allLeads.length} leads
          </p>
        </div>

        {/* Table */}
        {isLoading ? (
          <TableSkeleton rows={10} columns={8} />
        ) : (
          <LeadsTable
            leads={leads}
            onMarkContacted={(id, notes) => markContacted.mutate({ id, notes })}
            onMarkConverted={(id) => markConverted.mutate(id)}
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage(Math.max(1, page - 1))}
                  className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setPage(pageNum)}
                      isActive={page === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}
