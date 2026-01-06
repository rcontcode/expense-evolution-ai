import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, Users, Edit, Trash2, MapPin, CircleDot, CheckCircle2, AlertCircle, Zap, Mail, Phone, Building2, Globe, FileText, FlaskConical, PieChart } from 'lucide-react';
import { useClients, useDeleteClient, useDeleteClientTestData } from '@/hooks/data/useClients';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useIncome } from '@/hooks/data/useIncome';
import { useMileage } from '@/hooks/data/useMileage';
import { useContracts } from '@/hooks/data/useContracts';
import { ClientDialog } from '@/components/dialogs/ClientDialog';
import { ClientFinancialOverview } from '@/components/clients/ClientFinancialOverview';
import { MentorQuoteBanner } from '@/components/MentorQuoteBanner';
import { Client } from '@/types/expense.types';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoTooltip, TOOLTIP_CONTENT } from '@/components/ui/info-tooltip';
import { Badge } from '@/components/ui/badge';
import { PageContextGuide, PAGE_GUIDES } from '@/components/guidance/PageContextGuide';
import { SectionEmptyState } from '@/components/guidance/SectionEmptyState';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeader } from '@/components/PageHeader';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  calculateClientCompleteness,
  CLIENT_STATUS_CONFIG,
  ClientStatus,
} from '@/lib/constants/client-completeness';

const STATUS_ICONS: Record<ClientStatus, React.ElementType> = {
  incomplete: AlertCircle,
  in_progress: CircleDot,
  complete: CheckCircle2,
  active: Zap,
};

export default function Clients() {
  const { t, language } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();
  const [financialClient, setFinancialClient] = useState<Client | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteTestDataId, setDeleteTestDataId] = useState<string | null>(null);

  const { data: clients, isLoading } = useClients();
  const { data: expenses } = useExpenses();
  const { data: income } = useIncome();
  const { data: mileage } = useMileage();
  const { data: contracts } = useContracts();
  const deleteMutation = useDeleteClient();
  const deleteTestDataMutation = useDeleteClientTestData();

  // Listen for voice command actions
  useEffect(() => {
    const handleVoiceAction = (event: CustomEvent<{ action: string }>) => {
      if (event.detail.action === 'add-client') {
        setSelectedClient(undefined);
        setDialogOpen(true);
      }
    };

    window.addEventListener('voice-command-action', handleVoiceAction as EventListener);
    return () => {
      window.removeEventListener('voice-command-action', handleVoiceAction as EventListener);
    };
  }, []);

  // Check which clients have test data (any associated records)
  const getClientHasTestData = (clientId: string) => {
    const hasExpenses = expenses?.some(exp => exp.client_id === clientId) || false;
    const hasIncome = income?.some(inc => inc.client_id === clientId) || false;
    const hasMileage = mileage?.some(mil => mil.client_id === clientId) || false;
    const hasContracts = contracts?.some(con => con.client_id === clientId) || false;
    return hasExpenses || hasIncome || hasMileage || hasContracts;
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setSelectedClient(undefined);
  };

  const handleCreate = () => {
    setSelectedClient(undefined);
    setDialogOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const handleDeleteTestData = () => {
    if (deleteTestDataId) {
      deleteTestDataMutation.mutate(deleteTestDataId);
      setDeleteTestDataId(null);
    }
  };

  return (
    <Layout>
      <TooltipProvider>
        <div className="p-8 space-y-8">
          <PageHeader
            title={t('clients.title')}
            description={t('clients.description')}
          >
            <InfoTooltip content={TOOLTIP_CONTENT.addClient} variant="wrapper">
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t('clients.addClient')}
              </Button>
            </InfoTooltip>
          </PageHeader>

          {/* Mentor Quote Banner */}
          <MentorQuoteBanner context="clients" className="mb-2" />

          {/* Contextual Page Guide */}
          <PageContextGuide
            {...PAGE_GUIDES.clients}
            actions={[
              { icon: Plus, title: { es: 'Nuevo Cliente', en: 'New Client' }, description: { es: 'Agregar cliente', en: 'Add client' }, action: handleCreate },
              { icon: FileText, title: { es: 'Ver Contratos', en: 'View Contracts' }, description: { es: 'Términos y acuerdos', en: 'Terms and agreements' }, path: '/contracts' },
              { icon: PieChart, title: { es: 'Panorama', en: 'Overview' }, description: { es: 'Financiero por cliente', en: 'Financial by client' }, action: () => clients?.[0] && setFinancialClient(clients[0]) },
              { icon: Users, title: { es: 'Ver Proyectos', en: 'View Projects' }, description: { es: 'Por cliente', en: 'By client' }, path: '/projects' }
            ]}
          />

          {/* Legend */}
          <Card className="bg-muted/30">
            <CardContent className="py-3">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="font-medium text-muted-foreground">{t('clients.legendTitle')}:</span>
                {(Object.keys(CLIENT_STATUS_CONFIG) as ClientStatus[]).map((status) => {
                  const config = CLIENT_STATUS_CONFIG[status];
                  const StatusIcon = STATUS_ICONS[status];
                  return (
                    <div key={status} className="flex items-center gap-1.5">
                      <StatusIcon className={`h-4 w-4 ${config.color}`} />
                      <span className="text-muted-foreground">
                        {language === 'es' ? config.label : config.labelEn}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <Card className="border-dashed">
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">{t('clients.loadingClients')}</p>
              </CardContent>
            </Card>
          ) : clients && clients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clients.map((client) => {
                const hasTestData = getClientHasTestData(client.id);
                const completeness = calculateClientCompleteness(client, hasTestData);
                const statusConfig = CLIENT_STATUS_CONFIG[completeness.status];
                const StatusIcon = STATUS_ICONS[completeness.status];

                return (
                  <Card key={client.id} className="hover:shadow-lg transition-shadow relative overflow-hidden">
                    {/* Status indicator bar */}
                    <div className={`absolute top-0 left-0 right-0 h-1 ${statusConfig.bgColor.replace('bg-', 'bg-').replace('/30', '')}`} />
                    
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-xl">{client.name}</CardTitle>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0 gap-1`}>
                                  <StatusIcon className="h-3 w-3" />
                                  <span className="text-xs">{completeness.percentage}%</span>
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <div className="space-y-2">
                                  <p className="font-medium">
                                    {language === 'es' ? statusConfig.label : statusConfig.labelEn}
                                  </p>
                                  {completeness.missingFields.length > 0 ? (
                                    <>
                                      <p className="text-xs text-muted-foreground">{t('clients.missingFields')}:</p>
                                      <ul className="text-xs space-y-0.5">
                                        {completeness.missingFields.map(field => (
                                          <li key={field.key}>• {language === 'es' ? field.label : field.labelEn}</li>
                                        ))}
                                      </ul>
                                    </>
                                  ) : (
                                    <p className="text-xs text-green-600">{t('clients.profileComplete')}</p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          {hasTestData && (
                            <div className="flex items-center gap-1.5 text-xs text-amber-600">
                              <FlaskConical className="h-3 w-3" />
                              <span>{t('clients.hasTestData')}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {hasTestData && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                  onClick={() => setDeleteTestDataId(client.id)}
                                >
                                  <FlaskConical className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t('clients.deleteTestData')}</TooltipContent>
                            </Tooltip>
                          )}
                          <InfoTooltip content={TOOLTIP_CONTENT.editAction} variant="wrapper">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(client)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </InfoTooltip>
                          <InfoTooltip content={TOOLTIP_CONTENT.deleteAction} variant="wrapper">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(client.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </InfoTooltip>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{t('clients.completeness')}</span>
                          <span>{completeness.percentage}%</span>
                        </div>
                        <Progress value={completeness.percentage} className="h-1.5" />
                      </div>

                      {/* Client info icons */}
                      <div className="flex flex-wrap gap-2">
                        <Tooltip>
                          <TooltipTrigger>
                            <div className={`p-1.5 rounded-full ${client.contact_email ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'}`}>
                              <Mail className={`h-3.5 w-3.5 ${client.contact_email ? 'text-green-600' : 'text-muted-foreground'}`} />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>{client.contact_email || t('clients.contactEmail')}</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger>
                            <div className={`p-1.5 rounded-full ${client.contact_phone ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'}`}>
                              <Phone className={`h-3.5 w-3.5 ${client.contact_phone ? 'text-green-600' : 'text-muted-foreground'}`} />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>{client.contact_phone || t('clients.contactPhone')}</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger>
                            <div className={`p-1.5 rounded-full ${client.industry ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'}`}>
                              <Building2 className={`h-3.5 w-3.5 ${client.industry ? 'text-green-600' : 'text-muted-foreground'}`} />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>{client.industry || t('clients.industry')}</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger>
                            <div className={`p-1.5 rounded-full ${client.website ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'}`}>
                              <Globe className={`h-3.5 w-3.5 ${client.website ? 'text-green-600' : 'text-muted-foreground'}`} />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>{client.website || t('clients.website')}</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger>
                            <div className={`p-1.5 rounded-full ${client.tax_id ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'}`}>
                              <FileText className={`h-3.5 w-3.5 ${client.tax_id ? 'text-green-600' : 'text-muted-foreground'}`} />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>{client.tax_id || t('clients.taxId')}</TooltipContent>
                        </Tooltip>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {client.province && `${client.province}, `}
                          {client.country || 'Canada'}
                        </span>
                      </div>

                      {client.notes && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{client.notes}</p>
                      )}

                      {/* Quick Financial Overview Button */}
                      <InfoTooltip content={TOOLTIP_CONTENT.clientFinancialOverview} variant="wrapper">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-2 gap-2"
                          onClick={() => setFinancialClient(client)}
                        >
                          <PieChart className="h-4 w-4" />
                          {language === 'es' ? 'Panorama Financiero' : 'Financial Overview'}
                        </Button>
                      </InfoTooltip>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <SectionEmptyState 
              section="clients" 
              onAction={handleCreate}
              showSampleDataButton={true}
            />
          )}

          <ClientDialog open={dialogOpen} onClose={handleClose} client={selectedClient} />

          {/* Quick Financial Overview Dialog */}
          <Dialog open={!!financialClient} onOpenChange={() => setFinancialClient(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  {language === 'es' ? 'Panorama Financiero' : 'Financial Overview'}
                  {financialClient && (
                    <span className="text-muted-foreground font-normal">
                      — {financialClient.name}
                    </span>
                  )}
                </DialogTitle>
              </DialogHeader>
              {financialClient && (
                <ClientFinancialOverview 
                  clientId={financialClient.id} 
                  clientName={financialClient.name}
                />
              )}
            </DialogContent>
          </Dialog>

          <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('clients.deleteConfirm')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('clients.deleteWarning')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>{t('common.delete')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={!!deleteTestDataId} onOpenChange={() => setDeleteTestDataId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('clients.deleteTestDataConfirm')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('clients.deleteTestDataWarning')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteTestData} className="bg-amber-600 hover:bg-amber-700">
                  {t('clients.deleteTestData')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TooltipProvider>
    </Layout>
  );
}