import { useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Phone, UserCheck, RefreshCw, Flame, ThermometerSun, MessageSquare, AlertTriangle, Brain, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLeadsManagement } from '@/hooks/admin/useLeadsManagement';
import { LeadFilters } from '@/components/admin/LeadFilters';
import { LeadsTable } from '@/components/admin/LeadsTable';
import { LeadsExport } from '@/components/admin/LeadsExport';
import { CRMIntelligenceDashboard } from '@/components/admin/CRMIntelligenceDashboard';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { PageHeader } from '@/components/PageHeader';
import { Layout } from '@/components/Layout';

export default function LeadsManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('leads');
  const {
    leads,
    allLeads,
    rawLeads,
    isLoading,
    filters,
    setFilters,
    resetFilters,
    page,
    setPage,
    totalPages,
    countries,
    levels,
    situations,
    goals,
    obstacles,
    stats,
    markContacted,
    markConverted,
  } = useLeadsManagement();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4 space-y-6">
        <PageHeader
          title="Gestión de Leads"
          description="CRM inteligente con scoring automático e IA"
        >
          <LeadsExport leads={allLeads} />
        </PageHeader>

        {/* Main Tabs: Intelligence vs Leads Table */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="intelligence" className="flex items-center gap-1.5">
              <Brain className="h-4 w-4" />
              Inteligencia IA
            </TabsTrigger>
            <TabsTrigger value="leads" className="flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" />
              Leads ({stats.total})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="intelligence" className="mt-4">
            <CRMIntelligenceDashboard leads={rawLeads} />
          </TabsContent>

          <TabsContent value="leads" className="mt-4 space-y-6">

      
        {/* Priority Stats - First Row */}
        <div className="grid gap-4 md:grid-cols-4">
          {/* HOT leads without contact - URGENT */}
          <Card className={stats.hotUncontacted.length > 0 ? 'border-red-300 bg-red-50/50 dark:bg-red-900/10' : ''}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                {stats.hotUncontacted.length > 0 && <AlertTriangle className="h-3 w-3 text-red-500" />}
                HOT sin contactar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className={`text-3xl font-bold ${stats.hotUncontacted.length > 0 ? 'text-red-600' : ''}`}>
                  {stats.hotUncontacted.length}
                </span>
                <Flame className="h-8 w-8 text-red-500" />
              </div>
              {stats.hotUncontacted.length > 0 && (
                <p className="text-xs text-red-600 mt-1 font-medium">
                  ¡Requiere atención urgente!
                </p>
              )}
            </CardContent>
          </Card>

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
        </div>

        {/* Priority Distribution - Second Row */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Flame className="h-3 w-3 text-red-500" />
                HOT (80-100)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-red-600">{stats.priorityStats.hot}</span>
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <ThermometerSun className="h-3 w-3 text-orange-500" />
                WARM (50-79)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-orange-600">{stats.priorityStats.warm}</span>
                <div className="w-3 h-3 rounded-full bg-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>COOL (25-49)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-blue-600">{stats.priorityStats.cool}</span>
                <div className="w-3 h-3 rounded-full bg-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>COLD (0-24)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-600">{stats.priorityStats.cold}</span>
                <div className="w-3 h-3 rounded-full bg-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3 text-amber-500" />
                Con comentarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-amber-600">{stats.withComments}</span>
                <RefreshCw className="h-6 w-6 text-purple-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Leads con mensaje personal
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
          situations={situations}
          goals={goals}
          obstacles={obstacles}
        />

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {leads.length} de {allLeads.length} leads
            {allLeads.length !== stats.total && ` (${stats.total} total)`}
          </p>
        </div>

        {/* Table */}
        {isLoading ? (
          <TableSkeleton rows={10} columns={10} />
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
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
