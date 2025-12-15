import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ArrowLeft, Plus, Ticket, Users, CheckCircle2, XCircle,
  Copy, Trash2, ToggleLeft, ToggleRight, Calendar, Hash,
  TrendingUp, Shield, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useBetaCodes } from '@/hooks/data/useBetaCodes';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function BetaCodesAdmin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { codes, codeUses, stats, isLoading, createCodes, toggleCodeStatus, deleteCode } = useBetaCodes();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCodePrefix, setNewCodePrefix] = useState('EVOFINZ-BETA');
  const [newCodeQuantity, setNewCodeQuantity] = useState(5);
  const [newCodeMaxUses, setNewCodeMaxUses] = useState(1);
  const [newCodeExpiry, setNewCodeExpiry] = useState('2025-12-31');

  const handleCreateCodes = async () => {
    await createCodes.mutateAsync({
      prefix: newCodePrefix,
      quantity: newCodeQuantity,
      maxUses: newCodeMaxUses,
      expiresAt: newCodeExpiry ? new Date(newCodeExpiry).toISOString() : null,
    });
    setCreateDialogOpen(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: '¡Copiado!',
      description: 'Código copiado al portapapeles',
    });
  };

  const getCodeUsesForCode = (codeId: string) => {
    return codeUses?.filter(u => u.code_id === codeId) || [];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                Administración de Códigos Beta
              </h1>
              <p className="text-muted-foreground">
                Gestiona los códigos de invitación para beta testers
              </p>
            </div>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Crear Códigos
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nuevos Códigos Beta</DialogTitle>
                <DialogDescription>
                  Genera códigos de invitación para nuevos beta testers
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="prefix">Prefijo del Código</Label>
                  <Input
                    id="prefix"
                    value={newCodePrefix}
                    onChange={(e) => setNewCodePrefix(e.target.value.toUpperCase())}
                    placeholder="EVOFINZ-BETA"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ejemplo: {newCodePrefix}-01, {newCodePrefix}-02, etc.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Cantidad</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min={1}
                      max={100}
                      value={newCodeQuantity}
                      onChange={(e) => setNewCodeQuantity(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxUses">Usos Máximos</Label>
                    <Input
                      id="maxUses"
                      type="number"
                      min={1}
                      max={100}
                      value={newCodeMaxUses}
                      onChange={(e) => setNewCodeMaxUses(parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiry">Fecha de Expiración</Label>
                  <Input
                    id="expiry"
                    type="date"
                    value={newCodeExpiry}
                    onChange={(e) => setNewCodeExpiry(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateCodes} disabled={createCodes.isPending}>
                  {createCodes.isPending ? 'Creando...' : `Crear ${newCodeQuantity} Códigos`}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Ticket className="h-4 w-4" />
                  Total Códigos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.totalCodes}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Códigos Activos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-500">{stats.activeCodes}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Códigos Usados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-500">{stats.totalUses}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-500" />
                  Usos Disponibles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-amber-500">{stats.availableUses}</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="codes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="codes" className="gap-2">
              <Ticket className="h-4 w-4" />
              Códigos
            </TabsTrigger>
            <TabsTrigger value="uses" className="gap-2">
              <Users className="h-4 w-4" />
              Historial de Usos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="codes">
            <Card>
              <CardHeader>
                <CardTitle>Códigos de Invitación</CardTitle>
                <CardDescription>
                  Lista de todos los códigos beta generados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Usos</TableHead>
                      <TableHead>Expira</TableHead>
                      <TableHead>Creado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {codes?.map((code) => (
                      <TableRow key={code.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                              {code.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(code.code)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          {code.is_active ? (
                            <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Activo
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-red-500/20 text-red-500 border-red-500/30">
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactivo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className={code.current_uses >= code.max_uses ? 'text-red-500' : ''}>
                              {code.current_uses}
                            </span>
                            <span className="text-muted-foreground">/ {code.max_uses}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {code.expires_at ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(code.expires_at), 'dd MMM yyyy', { locale: es })}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Sin expiración</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(code.created_at), 'dd MMM yyyy', { locale: es })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleCodeStatus.mutate({ 
                                codeId: code.id, 
                                isActive: !code.is_active 
                              })}
                              title={code.is_active ? 'Desactivar' : 'Activar'}
                            >
                              {code.is_active ? (
                                <ToggleRight className="h-4 w-4 text-green-500" />
                              ) : (
                                <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar código?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. El código <strong>{code.code}</strong> será eliminado permanentemente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteCode.mutate(code.id)}
                                    className="bg-destructive text-destructive-foreground"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!codes || codes.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No hay códigos creados aún
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="uses">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Usos</CardTitle>
                <CardDescription>
                  Registro de todos los códigos utilizados por beta testers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Fecha de Uso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {codeUses?.map((use) => {
                      const code = codes?.find(c => c.id === use.code_id);
                      return (
                        <TableRow key={use.id}>
                          <TableCell>
                            <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                              {code?.code || 'N/A'}
                            </code>
                          </TableCell>
                          <TableCell>{use.user_name}</TableCell>
                          <TableCell className="text-muted-foreground">{use.user_email}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-3 w-3" />
                              {format(new Date(use.used_at), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(!codeUses || codeUses.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Ningún código ha sido utilizado aún
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
