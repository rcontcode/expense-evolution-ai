import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  useFinancialEducation, 
  useEducationStats, 
  useCreateEducationResource,
  useUpdateEducationResource,
  useDeleteEducationResource,
  useLogDailyProgress,
  useLogPractice,
  usePracticeLogs,
  FinancialEducationResource,
} from '@/hooks/data/useFinancialEducation';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  SUGGESTED_RESOURCES, 
  MOTIVATIONAL_QUOTES, 
  PRACTICE_SUGGESTIONS,
  SuggestedResource 
} from '@/lib/constants/suggested-resources';
import { 
  GraduationCap, Book, Video, Headphones, FileText, Plus, Star, Check, Clock, Trash2,
  Sparkles, Target, Lightbulb, TrendingUp, CheckCircle2, ChevronDown, BookOpen, Flame,
  Zap, Trophy, Calendar
} from 'lucide-react';
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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedResource, setSelectedResource] = useState<FinancialEducationResource | null>(null);
  const [dailyProgress, setDailyProgress] = useState({ pages: 0, minutes: 0, notes: '' });
  const [practiceInput, setPracticeInput] = useState({ description: '', outcome: '' });
  const [newResource, setNewResource] = useState({
    resource_type: 'book',
    title: '',
    author: '',
    status: 'wishlist',
    key_lessons: '',
    impact_rating: 0,
    total_pages: 0,
    total_minutes: 0,
    category: '',
    suggested_resource_id: '',
  });

  const { data: resources, isLoading } = useFinancialEducation();
  const { data: stats } = useEducationStats();
  const { data: practiceLogs } = usePracticeLogs();
  const createResource = useCreateEducationResource();
  const updateResource = useUpdateEducationResource();
  const deleteResource = useDeleteEducationResource();
  const logDailyProgress = useLogDailyProgress();
  const logPractice = useLogPractice();

  // Random motivational quote
  const motivationalQuote = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    return MOTIVATIONAL_QUOTES[randomIndex];
  }, []);

  // Get practice suggestions based on selected resource category
  const getPracticeSuggestions = (category: string) => {
    const suggestions = PRACTICE_SUGGESTIONS[category as keyof typeof PRACTICE_SUGGESTIONS];
    if (!suggestions) return PRACTICE_SUGGESTIONS.mindset;
    return suggestions;
  };

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
        total_pages: 0,
        total_minutes: 0,
        category: '',
        suggested_resource_id: '',
      });
      setShowNewResource(false);
    }
  };

  const handleAddSuggestedResource = (suggested: SuggestedResource) => {
    createResource.mutate({
      resource_type: suggested.type,
      title: suggested.title,
      author: suggested.author,
      status: 'wishlist',
      total_pages: suggested.totalPages,
      total_minutes: suggested.totalMinutes,
      category: suggested.category,
      suggested_resource_id: suggested.id,
    });
    setShowSuggestions(false);
  };

  const handleStatusChange = (resource: FinancialEducationResource, newStatus: string) => {
    updateResource.mutate({
      id: resource.id,
      resource_type: resource.resource_type,
      title: resource.title,
      status: newStatus,
    });
  };

  const handleLogProgress = () => {
    if (selectedResource && (dailyProgress.pages > 0 || dailyProgress.minutes > 0)) {
      logDailyProgress.mutate({
        resource_id: selectedResource.id,
        pages_read: dailyProgress.pages,
        minutes_consumed: dailyProgress.minutes,
        notes: dailyProgress.notes,
      });
      setDailyProgress({ pages: 0, minutes: 0, notes: '' });
    }
  };

  const handleLogPractice = () => {
    if (practiceInput.description.trim()) {
      logPractice.mutate({
        resource_id: selectedResource?.id,
        suggested_resource_id: selectedResource?.suggested_resource_id || undefined,
        practice_description: practiceInput.description,
        outcome: practiceInput.outcome,
      });
      setPracticeInput({ description: '', outcome: '' });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check className="h-3 w-3 text-green-500" />;
      case 'in_progress': return <Clock className="h-3 w-3 text-yellow-500" />;
      default: return null;
    }
  };

  const getSuggestedResourceInfo = (suggestedId: string | null) => {
    if (!suggestedId) return null;
    return SUGGESTED_RESOURCES.find(r => r.id === suggestedId);
  };

  // Check which suggested resources are already added
  const addedSuggestedIds = resources?.map(r => r.suggested_resource_id).filter(Boolean) || [];

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
        {/* Motivational Banner */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-3 border border-primary/20">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-primary">
                {language === 'es' ? motivationalQuote.textEs : motivationalQuote.textEn}
              </p>
              <p className="text-xs text-muted-foreground mt-1">— {motivationalQuote.author}</p>
            </div>
          </div>
        </div>

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

        {/* Suggested Resources Dropdown */}
        <Dialog open={showSuggestions} onOpenChange={setShowSuggestions}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full justify-between" size="sm">
              <span className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                {language === 'es' ? 'Libros y recursos sugeridos' : 'Suggested books & resources'}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {language === 'es' ? 'Recursos Sugeridos para tu Crecimiento Financiero' : 'Suggested Resources for Your Financial Growth'}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-4">
                {SUGGESTED_RESOURCES.map((suggested) => {
                  const isAdded = addedSuggestedIds.includes(suggested.id);
                  return (
                    <div 
                      key={suggested.id}
                      className={`border rounded-lg p-4 ${isAdded ? 'bg-green-50 dark:bg-green-900/10 border-green-200' : 'hover:bg-muted/30'} transition-colors`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Book className="h-4 w-4 text-primary" />
                            <h4 className="font-semibold">{suggested.title}</h4>
                            {isAdded && (
                              <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                {language === 'es' ? 'Agregado' : 'Added'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{suggested.author}</p>
                          {suggested.totalPages && (
                            <p className="text-xs text-muted-foreground mt-1">
                              📖 {suggested.totalPages} {language === 'es' ? 'páginas' : 'pages'}
                            </p>
                          )}
                        </div>
                        {!isAdded && (
                          <Button 
                            size="sm" 
                            onClick={() => handleAddSuggestedResource(suggested)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            {language === 'es' ? 'Agregar' : 'Add'}
                          </Button>
                        )}
                      </div>
                      
                      {/* Summary */}
                      <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium flex items-center gap-1 mb-1">
                          <Target className="h-3 w-3" />
                          {language === 'es' ? 'Resumen clave:' : 'Key summary:'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {language === 'es' ? suggested.summaryEs : suggested.summaryEn}
                        </p>
                      </div>

                      {/* Practical Tips */}
                      <div className="mt-3">
                        <p className="text-sm font-medium flex items-center gap-1 mb-2">
                          <Zap className="h-3 w-3 text-yellow-500" />
                          {language === 'es' ? 'Ponlo en práctica YA:' : 'Put it into practice NOW:'}
                        </p>
                        <ul className="space-y-1">
                          {(language === 'es' ? suggested.practicalTipsEs : suggested.practicalTipsEn).map((tip, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                              <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Resource List with Progress */}
        {resources && resources.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {resources.map((resource) => {
              const typeInfo = RESOURCE_TYPES.find(t => t.value === resource.resource_type);
              const TypeIcon = typeInfo?.icon || Book;
              const suggestedInfo = getSuggestedResourceInfo(resource.suggested_resource_id);
              const progressPercent = resource.progress_percentage || 0;

              return (
                <div 
                  key={resource.id}
                  className="border rounded-lg p-3 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedResource(resource)}
                >
                  <div className="flex items-center gap-3">
                    <TypeIcon className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{resource.title}</p>
                        {resource.status === 'completed' && (
                          <Trophy className="h-3 w-3 text-yellow-500" />
                        )}
                      </div>
                      {resource.author && (
                        <p className="text-xs text-muted-foreground truncate">{resource.author}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(resource.status)}
                      <Select 
                        value={resource.status} 
                        onValueChange={(value) => {
                          handleStatusChange(resource, value);
                        }}
                      >
                        <SelectTrigger className="h-7 w-24 text-xs" onClick={(e) => e.stopPropagation()}>
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
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteResource.mutate(resource.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  {resource.status === 'in_progress' && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">
                          {resource.pages_read || 0}/{resource.total_pages || '?'} {language === 'es' ? 'páginas' : 'pages'}
                        </span>
                        <span className="font-medium">{progressPercent}%</span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                    </div>
                  )}
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

        {/* Resource Detail Dialog */}
        <Dialog open={!!selectedResource} onOpenChange={(open) => !open && setSelectedResource(null)}>
          <DialogContent className="max-w-lg">
            {selectedResource && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    {selectedResource.title}
                  </DialogTitle>
                </DialogHeader>
                
                <Tabs defaultValue="progress" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="progress" className="text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {language === 'es' ? 'Progreso' : 'Progress'}
                    </TabsTrigger>
                    <TabsTrigger value="tips" className="text-xs">
                      <Lightbulb className="h-3 w-3 mr-1" />
                      {language === 'es' ? 'Tips' : 'Tips'}
                    </TabsTrigger>
                    <TabsTrigger value="practice" className="text-xs">
                      <Target className="h-3 w-3 mr-1" />
                      {language === 'es' ? 'Práctica' : 'Practice'}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="progress" className="space-y-4 mt-4">
                    {/* Current Progress */}
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {language === 'es' ? 'Progreso actual' : 'Current progress'}
                        </span>
                        <span className="text-lg font-bold text-primary">
                          {selectedResource.progress_percentage || 0}%
                        </span>
                      </div>
                      <Progress value={selectedResource.progress_percentage || 0} className="h-3" />
                      <p className="text-xs text-muted-foreground mt-2">
                        📖 {selectedResource.pages_read || 0}/{selectedResource.total_pages || '?'} {language === 'es' ? 'páginas' : 'pages'}
                      </p>
                    </div>

                    {/* Log Daily Progress */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {language === 'es' ? 'Registrar progreso de hoy' : 'Log today\'s progress'}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground">
                            {language === 'es' ? 'Páginas leídas' : 'Pages read'}
                          </label>
                          <Input
                            type="number"
                            min={0}
                            value={dailyProgress.pages || ''}
                            onChange={(e) => setDailyProgress({ ...dailyProgress, pages: parseInt(e.target.value) || 0 })}
                            placeholder="0"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">
                            {language === 'es' ? 'Minutos dedicados' : 'Minutes spent'}
                          </label>
                          <Input
                            type="number"
                            min={0}
                            value={dailyProgress.minutes || ''}
                            onChange={(e) => setDailyProgress({ ...dailyProgress, minutes: parseInt(e.target.value) || 0 })}
                            placeholder="0"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <Textarea
                        value={dailyProgress.notes}
                        onChange={(e) => setDailyProgress({ ...dailyProgress, notes: e.target.value })}
                        placeholder={language === 'es' ? 'Notas de hoy (opcional)...' : 'Today\'s notes (optional)...'}
                        rows={2}
                      />
                      <Button onClick={handleLogProgress} className="w-full" size="sm">
                        <Flame className="h-4 w-4 mr-2" />
                        {language === 'es' ? '¡Registrar progreso!' : 'Log progress!'}
                      </Button>
                    </div>

                    {/* Motivational Message */}
                    <div className="p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        {language === 'es' 
                          ? '¡Sigue así! Cada página te acerca más a tus metas financieras.'
                          : 'Keep it up! Every page brings you closer to your financial goals.'}
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="tips" className="space-y-4 mt-4">
                    {(() => {
                      const suggestedInfo = getSuggestedResourceInfo(selectedResource.suggested_resource_id);
                      if (suggestedInfo) {
                        return (
                          <>
                            {/* Summary */}
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <p className="text-sm font-medium flex items-center gap-1 mb-2">
                                <Target className="h-4 w-4" />
                                {language === 'es' ? 'Resumen clave' : 'Key summary'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {language === 'es' ? suggestedInfo.summaryEs : suggestedInfo.summaryEn}
                              </p>
                            </div>

                            {/* Practical Tips */}
                            <div>
                              <p className="text-sm font-medium flex items-center gap-2 mb-3">
                                <Zap className="h-4 w-4 text-yellow-500" />
                                {language === 'es' ? '¡Ponlo en práctica YA!' : 'Put it into practice NOW!'}
                              </p>
                              <ul className="space-y-2">
                                {(language === 'es' ? suggestedInfo.practicalTipsEs : suggestedInfo.practicalTipsEn).map((tip, i) => (
                                  <li 
                                    key={i} 
                                    className="text-sm p-2 bg-muted/30 rounded-lg flex items-start gap-2"
                                  >
                                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </>
                        );
                      }
                      
                      // Generic tips for custom resources
                      const category = selectedResource.category || 'mindset';
                      const suggestions = getPracticeSuggestions(category);
                      return (
                        <div>
                          <p className="text-sm font-medium flex items-center gap-2 mb-3">
                            <Lightbulb className="h-4 w-4 text-yellow-500" />
                            {language === 'es' ? 'Sugerencias para aplicar' : 'Suggestions to apply'}
                          </p>
                          <ul className="space-y-2">
                            {(language === 'es' ? suggestions.es : suggestions.en).map((tip, i) => (
                              <li 
                                key={i} 
                                className="text-sm p-2 bg-muted/30 rounded-lg flex items-start gap-2"
                              >
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })()}
                  </TabsContent>

                  <TabsContent value="practice" className="space-y-4 mt-4">
                    {/* Log Practice */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        {language === 'es' ? '¿Qué pusiste en práctica hoy?' : 'What did you practice today?'}
                      </p>
                      <Textarea
                        value={practiceInput.description}
                        onChange={(e) => setPracticeInput({ ...practiceInput, description: e.target.value })}
                        placeholder={language === 'es' 
                          ? 'Ej: Hice una lista de mis activos y pasivos...' 
                          : 'Ex: I made a list of my assets and liabilities...'}
                        rows={3}
                      />
                      <Textarea
                        value={practiceInput.outcome}
                        onChange={(e) => setPracticeInput({ ...practiceInput, outcome: e.target.value })}
                        placeholder={language === 'es' 
                          ? '¿Cuál fue el resultado? (opcional)' 
                          : 'What was the outcome? (optional)'}
                        rows={2}
                      />
                      <Button 
                        onClick={handleLogPractice} 
                        className="w-full" 
                        size="sm"
                        disabled={!practiceInput.description.trim()}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {language === 'es' ? 'Registrar práctica' : 'Log practice'}
                      </Button>
                    </div>

                    {/* Practice History */}
                    {practiceLogs && practiceLogs.filter(l => l.resource_id === selectedResource.id).length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">
                          {language === 'es' ? 'Historial de práctica' : 'Practice history'}
                        </p>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {practiceLogs
                            .filter(l => l.resource_id === selectedResource.id)
                            .slice(0, 5)
                            .map((log) => (
                              <div key={log.id} className="text-xs p-2 bg-muted/30 rounded">
                                <p className="font-medium">{log.practice_description}</p>
                                {log.outcome && (
                                  <p className="text-muted-foreground mt-1">→ {log.outcome}</p>
                                )}
                                <p className="text-muted-foreground mt-1">
                                  📅 {new Date(log.practice_date).toLocaleDateString()}
                                </p>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Encouragement */}
                    <div className="p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-200 dark:border-purple-800">
                      <p className="text-sm text-purple-700 dark:text-purple-300 flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        {language === 'es' 
                          ? '¡El conocimiento sin acción es inútil! Practica lo aprendido.'
                          : 'Knowledge without action is useless! Practice what you learned.'}
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Add New Resource */}
        <Dialog open={showNewResource} onOpenChange={setShowNewResource}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Agregar recurso personalizado' : 'Add custom resource'}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">
                    {language === 'es' ? 'Total páginas' : 'Total pages'}
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={newResource.total_pages || ''}
                    onChange={(e) => setNewResource({ ...newResource, total_pages: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    {language === 'es' ? 'Categoría' : 'Category'}
                  </label>
                  <Select 
                    value={newResource.category} 
                    onValueChange={(v) => setNewResource({ ...newResource, category: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={language === 'es' ? 'Seleccionar...' : 'Select...'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mindset">{language === 'es' ? 'Mentalidad' : 'Mindset'}</SelectItem>
                      <SelectItem value="investing">{language === 'es' ? 'Inversiones' : 'Investing'}</SelectItem>
                      <SelectItem value="business">{language === 'es' ? 'Negocios' : 'Business'}</SelectItem>
                      <SelectItem value="habits">{language === 'es' ? 'Hábitos' : 'Habits'}</SelectItem>
                      <SelectItem value="wealth">{language === 'es' ? 'Riqueza' : 'Wealth'}</SelectItem>
                      <SelectItem value="entrepreneurship">{language === 'es' ? 'Emprendimiento' : 'Entrepreneurship'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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