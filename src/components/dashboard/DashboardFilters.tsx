import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface DashboardFiltersProps {
  selectedClient: string;
  selectedStatus: string;
  selectedCategory: string;
  onClientChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onReset: () => void;
  clients: { id: string; name: string }[];
}

export const DashboardFilters = ({
  selectedClient,
  selectedStatus,
  selectedCategory,
  onClientChange,
  onStatusChange,
  onCategoryChange,
  onReset,
  clients,
}: DashboardFiltersProps) => {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros del Dashboard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select value={selectedClient} onValueChange={onClientChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los clientes</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={selectedStatus} onValueChange={onStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="deductible">Deducible</SelectItem>
                <SelectItem value="reimbursable">Reembolsable</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="meals">Comidas</SelectItem>
                <SelectItem value="travel">Viajes</SelectItem>
                <SelectItem value="equipment">Equipo</SelectItem>
                <SelectItem value="software">Software</SelectItem>
                <SelectItem value="office_supplies">Suministros de oficina</SelectItem>
                <SelectItem value="utilities">Servicios públicos</SelectItem>
                <SelectItem value="professional_services">Servicios profesionales</SelectItem>
                <SelectItem value="home_office">Oficina en casa</SelectItem>
                <SelectItem value="mileage">Kilometraje</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={onReset} variant="outline" className="w-full">
          Resetear Filtros
        </Button>
      </CardContent>
    </Card>
  );
};
