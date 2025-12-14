import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  useFinancialEducation, 
  useEducationStats, 
  useCreateEducationResource,
  useUpdateEducationResource,
  useDeleteEducationResource,
  FinancialEducationResource,
} from '@/hooks/data/useFinancialEducation';
import { useLanguage } from '@/contexts/LanguageContext';
import { GraduationCap, Book, Video, Headphones, FileText, Plus, Star, Check, Clock, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const RESOURCE_TYPES = [
  { value: 'book', icon: Book, labelEs: 'Libro', labelEn: 'Book' },
  { value: 'course', icon: GraduationCap, labelEs: 'Curso', labelEn: 'Course' },
  { value: 'podcast', icon: Headphones, labelEs: 'Podcast', labelEn: 'Podcast' },
  { value: 'video', icon: Video, labelEs: 'Video', labelEn: 'Video' },
  { value: 'article', icon: FileText, labelEs: 'Artículo', labelEn: 'Article' },
];

const STATUS_OPTIONS = [
  { value: 'wishlist', labelEs: 'Por leer', labelEn: 'Wishlist' },
  { value: 'in_progress', labelEs: 'En progreso', labelEn: 'In Progress' },
  { value: 'completed', labelEs: 'Completado', labelEn: 'Completed' },
];

export function FinancialEducationCard() {
  const { language } = useLanguage();
  const [showNewResource, setShowNewResource] = useState(false);
  const [newResource, setNewResource] = useState({
    resource_type: 'book',
    title: '',
    author: '',
    status: 'wishlist',
    key_lessons: '',
    impact_rating: 0,
  });

  const { data: resources, isLoading } = useFinancialEducation();
  const { data: stats } = useEducationStats();
  const createResource = useCreateEducationResource();
  const updateResource = useUpdateEducationResource();
  const deleteResource = useDeleteEducationResource();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  const handleCreateResource = () => {
    if (newResource.title.trim()) {
      createResource.mutate(newResource);
      setNewResource({
        resource_type: 'book',
        title: '',
        author: '',
        status: 'wishlist',
        key_lessons: '',
        impact_rating: 0,
      });
      setShowNewResource(false);
    }
  };

  const handleStatusChange = (resource: FinancialEducationResource, newStatus: string) => {
    updateResource.mutate({
      id: resource.id,
      resource_type: resource.resource_type,
      title: resource.title,
      status: newStatus,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check className="h-3 w-3 text-green-500" />;
      case 'in_progress': return <Clock className="h-3 w-3 text-yellow-500" />;
      default: return null;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <GraduationCap className="h-5 w-5 text-primary" />
            {language === 'es' ? 'Educación Financiera' : 'Financial Education'}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Jim Rohn
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground italic">
          "{language === 'es' 
            ? 'La educación formal te da un trabajo; la autoeducación te da una fortuna' 
            : 'Formal education gets you a job; self-education gets you a fortune'}"
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="flex items-center justify-around py-2 bg-muted/30 rounded-lg">
          <div className="text-center">
            <span className="text-xl font-bold text-green-600">{stats?.completed || 0}</span>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'Completados' : 'Completed'}
            </p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <span className="text-xl font-bold text-yellow-600">{stats?.inProgress || 0}</span>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'En progreso' : 'In progress'}
            </p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-xl font-bold">{stats?.avgImpactRating?.toFixed(1) || '-'}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'Impacto' : 'Impact'}
            </p>
          </div>
        </div>

        {/* Resource List */}
        {resources && resources.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {resources.slice(0, 5).map((resource) => {
              const typeInfo = RESOURCE_TYPES.find(t => t.value === resource.resource_type);
              const TypeIcon = typeInfo?.icon || Book;

              return (
                <div 
                  key={resource.id}
                  className="flex items-center gap-3 p-2 rounded-lg border hover:bg-muted/30 transition-colors group"
                >
                  <TypeIcon className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{resource.title}</p>
                    {resource.author && (
                      <p className="text-xs text-muted-foreground truncate">{resource.author}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(resource.status)}
                    <Select 
                      value={resource.status} 
                      onValueChange={(value) => handleStatusChange(resource, value)}
                    >
                      <SelectTrigger className="h-7 w-24 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {language === 'es' ? option.labelEs : option.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteResource.mutate(resource.id)}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {(!resources || resources.length === 0) && (
          <div className="text-center py-4">
            <Book className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {language === 'es' 
                ? 'Agrega libros, cursos o podcasts que estés estudiando'
                : 'Add books, courses, or podcasts you are studying'}
            </p>
          </div>
        )}

        {/* Add New Resource */}
        <Dialog open={showNewResource} onOpenChange={setShowNewResource}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Agregar recurso' : 'Add resource'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === 'es' ? 'Agregar Recurso Educativo' : 'Add Educational Resource'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">
                    {language === 'es' ? 'Tipo' : 'Type'}
                  </label>
                  <Select 
                    value={newResource.resource_type} 
                    onValueChange={(v) => setNewResource({ ...newResource, resource_type: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOURCE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {language === 'es' ? type.labelEs : type.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">
                    {language === 'es' ? 'Estado' : 'Status'}
                  </label>
                  <Select 
                    value={newResource.status} 
                    onValueChange={(v) => setNewResource({ ...newResource, status: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {language === 'es' ? option.labelEs : option.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">
                  {language === 'es' ? 'Título' : 'Title'}
                </label>
                <Input
                  value={newResource.title}
                  onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                  placeholder={language === 'es' ? 'Ej: Padre Rico, Padre Pobre' : 'Ex: Rich Dad Poor Dad'}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  {language === 'es' ? 'Autor' : 'Author'}
                </label>
                <Input
                  value={newResource.author}
                  onChange={(e) => setNewResource({ ...newResource, author: e.target.value })}
                  placeholder={language === 'es' ? 'Ej: Robert Kiyosaki' : 'Ex: Robert Kiyosaki'}
                  className="mt-1"
                />
              </div>
              {newResource.status === 'completed' && (
                <div>
                  <label className="text-sm font-medium">
                    {language === 'es' ? 'Lecciones clave' : 'Key lessons'}
                  </label>
                  <Textarea
                    value={newResource.key_lessons}
                    onChange={(e) => setNewResource({ ...newResource, key_lessons: e.target.value })}
                    placeholder={language === 'es' ? '¿Qué aprendiste?' : 'What did you learn?'}
                    className="mt-1"
                    rows={2}
                  />
                </div>
              )}
              <Button onClick={handleCreateResource} disabled={!newResource.title.trim()} className="w-full">
                {language === 'es' ? 'Agregar' : 'Add'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
