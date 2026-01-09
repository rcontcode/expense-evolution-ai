import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
import { Target, Plus, Edit, Trash2, PiggyBank, DollarSign, Sparkles, Home, Car, GraduationCap, Plane, Heart, Briefcase, Baby, Shield, Laptop, Gift, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSavingsGoals, useCreateSavingsGoal, useUpdateSavingsGoal, useDeleteSavingsGoal, useAddToSavingsGoal } from '@/hooks/data/useSavingsGoals';
import { cn } from '@/lib/utils';

const GOAL_COLORS = [
  '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'
];

interface SuggestedGoal {
  id: string;
  icon: React.ElementType;
  name: { es: string; en: string };
  description: { es: string; en: string };
  suggestedAmount: number;
  color: string;
  category: 'essential' | 'lifestyle' | 'future';
}

const SUGGESTED_GOALS: SuggestedGoal[] = [
  // Essential
  { id: 'emergency', icon: Shield, name: { es: 'Fondo de emergencia', en: 'Emergency fund' }, description: { es: '3-6 meses de gastos', en: '3-6 months of expenses' }, suggestedAmount: 10000, color: '#10B981', category: 'essential' },
  { id: 'debt-free', icon: Target, name: { es: 'Pagar deudas', en: 'Pay off debt' }, description: { es: 'Liberarse de deudas', en: 'Become debt-free' }, suggestedAmount: 5000, color: '#EF4444', category: 'essential' },
  
  // Lifestyle
  { id: 'vacation', icon: Plane, name: { es: 'Vacaciones soñadas', en: 'Dream vacation' }, description: { es: 'Tu próximo viaje', en: 'Your next trip' }, suggestedAmount: 3000, color: '#3B82F6', category: 'lifestyle' },
  { id: 'car', icon: Car, name: { es: 'Auto nuevo', en: 'New car' }, description: { es: 'Vehículo propio', en: 'Own vehicle' }, suggestedAmount: 15000, color: '#8B5CF6', category: 'lifestyle' },
  { id: 'tech', icon: Laptop, name: { es: 'Tecnología', en: 'Technology' }, description: { es: 'Laptop, teléfono, etc.', en: 'Laptop, phone, etc.' }, suggestedAmount: 2000, color: '#06B6D4', category: 'lifestyle' },
  { id: 'wedding', icon: Heart, name: { es: 'Matrimonio', en: 'Wedding' }, description: { es: 'Tu día especial', en: 'Your special day' }, suggestedAmount: 20000, color: '#EC4899', category: 'lifestyle' },
  { id: 'gifts', icon: Gift, name: { es: 'Regalos navideños', en: 'Holiday gifts' }, description: { es: 'Diciembre sin estrés', en: 'Stress-free December' }, suggestedAmount: 1000, color: '#F59E0B', category: 'lifestyle' },
  
  // Future
  { id: 'home', icon: Home, name: { es: 'Casa propia', en: 'Own home' }, description: { es: 'Pie para tu hogar', en: 'Down payment' }, suggestedAmount: 50000, color: '#84CC16', category: 'future' },
  { id: 'education', icon: GraduationCap, name: { es: 'Educación', en: 'Education' }, description: { es: 'Curso, máster, etc.', en: 'Course, masters, etc.' }, suggestedAmount: 8000, color: '#8B5CF6', category: 'future' },
  { id: 'baby', icon: Baby, name: { es: 'Bebé en camino', en: 'Baby on the way' }, description: { es: 'Prepararse para la familia', en: 'Prepare for family' }, suggestedAmount: 5000, color: '#EC4899', category: 'future' },
  { id: 'business', icon: Briefcase, name: { es: 'Emprender negocio', en: 'Start a business' }, description: { es: 'Capital inicial', en: 'Startup capital' }, suggestedAmount: 10000, color: '#F59E0B', category: 'future' },
  { id: 'retirement', icon: PiggyBank, name: { es: 'Retiro anticipado', en: 'Early retirement' }, description: { es: 'Libertad financiera', en: 'Financial freedom' }, suggestedAmount: 100000, color: '#10B981', category: 'future' },
];

const CATEGORY_CONFIG = {
  essential: { label: { es: '🛡️ Esenciales', en: '🛡️ Essential' }, color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' },
  lifestyle: { label: { es: '✨ Estilo de vida', en: '✨ Lifestyle' }, color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30' },
  future: { label: { es: '🚀 Futuro', en: '🚀 Future' }, color: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30' },
};

export function SavingsGoalsSection() {
  const { t, language } = useLanguage();
  const { data: savingsGoals, isLoading: goalsLoading } = useSavingsGoals();
  const createGoal = useCreateSavingsGoal();
  const updateGoal = useUpdateSavingsGoal();
  const deleteGoal = useDeleteSavingsGoal();
  const addToGoal = useAddToSavingsGoal();

  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [goalColor, setGoalColor] = useState('#10B981');
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);
  const [addAmountGoalId, setAddAmountGoalId] = useState<string | null>(null);
  const [amountToAdd, setAmountToAdd] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Check which suggested goals are already created (by similar name)
  const existingGoalNames = savingsGoals?.map(g => g.name.toLowerCase()) || [];

  const openGoalDialog = (goal?: any) => {
    if (goal) {
      setEditingGoal(goal);
      setGoalName(goal.name);
      setTargetAmount(String(goal.target_amount));
      setCurrentAmount(String(goal.current_amount || 0));
      setGoalDeadline(goal.deadline || '');
      setGoalColor(goal.color || '#10B981');
    } else {
      setEditingGoal(null);
      setGoalName('');
      setTargetAmount('');
      setCurrentAmount('0');
      setGoalDeadline('');
      setGoalColor('#10B981');
    }
    setGoalDialogOpen(true);
  };

  const handleSelectSuggestion = (suggestion: SuggestedGoal) => {
    setEditingGoal(null);
    setGoalName(suggestion.name[language]);
    setTargetAmount(String(suggestion.suggestedAmount));
    setCurrentAmount('0');
    setGoalDeadline('');
    setGoalColor(suggestion.color);
    setShowSuggestions(false);
    setGoalDialogOpen(true);
  };

  const handleSaveGoal = () => {
    const data = {
      name: goalName,
      target_amount: parseFloat(targetAmount),
      current_amount: parseFloat(currentAmount) || 0,
      deadline: goalDeadline ? new Date(goalDeadline) : null,
      color: goalColor,
    };

    if (editingGoal) {
      updateGoal.mutate({ id: editingGoal.id, data }, { onSuccess: () => setGoalDialogOpen(false) });
    } else {
      createGoal.mutate(data, { onSuccess: () => setGoalDialogOpen(false) });
    }
  };

  const handleDeleteGoal = () => {
    if (deleteGoalId) {
      deleteGoal.mutate(deleteGoalId);
      setDeleteGoalId(null);
    }
  };

  const handleAddAmount = () => {
    if (addAmountGoalId && amountToAdd) {
      addToGoal.mutate({ id: addAmountGoalId, amount: parseFloat(amountToAdd) });
      setAddAmountGoalId(null);
      setAmountToAdd('');
    }
  };

  const filteredSuggestions = selectedCategory
    ? SUGGESTED_GOALS.filter(s => s.category === selectedCategory)
    : SUGGESTED_GOALS;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>{t('savingsGoals.title')}</CardTitle>
                <CardDescription>{t('savingsGoals.description')}</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowSuggestions(true)}>
                <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
                {language === 'es' ? 'Ideas' : 'Ideas'}
              </Button>
              <Button onClick={() => openGoalDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                {t('savingsGoals.addGoal')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Suggestions Panel (inline, collapsible) */}
          {showSuggestions && (
            <div className="p-4 rounded-xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  <h3 className="font-semibold">
                    {language === 'es' ? 'Ideas de metas de ahorro' : 'Savings goal ideas'}
                  </h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowSuggestions(false)}>
                  {language === 'es' ? 'Cerrar' : 'Close'}
                </Button>
              </div>

              {/* Category filters */}
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "cursor-pointer transition-all hover:scale-105",
                    !selectedCategory ? "bg-primary/10 text-primary border-primary/30" : "hover:bg-accent"
                  )}
                  onClick={() => setSelectedCategory(null)}
                >
                  {language === 'es' ? '✨ Todas' : '✨ All'}
                </Badge>
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                  <Badge
                    key={key}
                    variant="outline"
                    className={cn(
                      "cursor-pointer transition-all hover:scale-105",
                      selectedCategory === key ? config.color : "hover:bg-accent"
                    )}
                    onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
                  >
                    {config.label[language]}
                  </Badge>
                ))}
              </div>

              {/* Suggestions grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredSuggestions.map((suggestion) => {
                  const Icon = suggestion.icon;
                  const isAlreadyCreated = existingGoalNames.some(name =>
                    name.includes(suggestion.name[language].toLowerCase().split(' ')[0])
                  );

                  return (
                    <button
                      key={suggestion.id}
                      onClick={() => !isAlreadyCreated && handleSelectSuggestion(suggestion)}
                      disabled={isAlreadyCreated}
                      className={cn(
                        "group p-3 rounded-xl border-2 text-left transition-all",
                        isAlreadyCreated
                          ? "opacity-50 cursor-not-allowed border-muted bg-muted/30"
                          : "hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 border-border/50 bg-card"
                      )}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <div
                          className="p-1.5 rounded-lg"
                          style={{ backgroundColor: `${suggestion.color}20` }}
                        >
                          <Icon className="h-4 w-4" style={{ color: suggestion.color }} />
                        </div>
                        {isAlreadyCreated && (
                          <Check className="h-4 w-4 text-success ml-auto" />
                        )}
                      </div>
                      <p className="font-medium text-sm leading-tight">{suggestion.name[language]}</p>
                      <p className="text-xs text-muted-foreground mt-1">{suggestion.description[language]}</p>
                      <p className="text-xs font-medium mt-2" style={{ color: suggestion.color }}>
                        ${suggestion.suggestedAmount.toLocaleString()}
                      </p>
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                {language === 'es'
                  ? 'Selecciona una idea y ajusta el monto según tu situación'
                  : 'Select an idea and adjust the amount based on your situation'}
              </p>
            </div>
          )}

          {/* Existing goals */}
          {goalsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : !savingsGoals || savingsGoals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <PiggyBank className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{language === 'es' ? 'No tienes metas de ahorro aún' : 'No savings goals yet'}</p>
              <p className="text-sm mb-4">{language === 'es' ? 'Crea tu primera meta para empezar' : 'Create your first goal to get started'}</p>
              <Button variant="outline" size="sm" onClick={() => setShowSuggestions(true)}>
                <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
                {language === 'es' ? 'Ver ideas sugeridas' : 'See suggested ideas'}
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {savingsGoals.map((goal) => {
                const progress = goal.target_amount > 0 
                  ? ((goal.current_amount || 0) / goal.target_amount) * 100 
                  : 0;
                const remaining = goal.target_amount - (goal.current_amount || 0);
                const isCompleted = progress >= 100;

                return (
                  <Card key={goal.id} className="relative overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ backgroundColor: goal.color || '#10B981' }}
                    />
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <PiggyBank className="h-5 w-5" style={{ color: goal.color || '#10B981' }} />
                          <h4 className="font-semibold">{goal.name}</h4>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setAddAmountGoalId(goal.id)}>
                            <DollarSign className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openGoalDialog(goal)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteGoalId(goal.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{t('savingsGoals.progress')}</span>
                          <span className="font-medium">{Math.min(progress, 100).toFixed(0)}%</span>
                        </div>
                        <Progress value={Math.min(progress, 100)} className="h-2" />
                        <div className="flex justify-between text-sm">
                          <span>${(goal.current_amount || 0).toLocaleString()}</span>
                          <span className="text-muted-foreground">/ ${goal.target_amount.toLocaleString()}</span>
                        </div>
                      </div>

                      {!isCompleted && remaining > 0 && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {t('savingsGoals.remaining')}: ${remaining.toLocaleString()}
                        </p>
                      )}
                      {isCompleted && (
                        <p className="text-sm text-green-600 font-medium mt-2">
                          ✓ {t('savingsGoals.completed')}
                        </p>
                      )}
                      {goal.deadline && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('savingsGoals.deadline')}: {new Date(goal.deadline).toLocaleDateString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Goal Dialog */}
      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGoal ? t('savingsGoals.editGoal') : t('savingsGoals.addGoal')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('savingsGoals.goalName')}</Label>
              <Input
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder={t('savingsGoals.goalNamePlaceholder')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('savingsGoals.targetAmount')}</Label>
                <Input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('savingsGoals.currentAmount')}</Label>
                <Input
                  type="number"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('savingsGoals.deadline')}</Label>
              <Input
                type="date"
                value={goalDeadline}
                onChange={(e) => setGoalDeadline(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('savingsGoals.color')}</Label>
              <div className="flex gap-2">
                {GOAL_COLORS.map(color => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 ${goalColor === color ? 'border-primary' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setGoalColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGoalDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveGoal} disabled={!goalName || !targetAmount}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Amount Dialog */}
      <Dialog open={!!addAmountGoalId} onOpenChange={() => setAddAmountGoalId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('savingsGoals.addAmount')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('expenses.amount')}</Label>
              <Input
                type="number"
                value={amountToAdd}
                onChange={(e) => setAmountToAdd(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddAmountGoalId(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddAmount} disabled={!amountToAdd}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteGoalId} onOpenChange={() => setDeleteGoalId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('savingsGoals.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('savingsGoals.deleteWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGoal}>{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
