import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSavingsGoals, useCreateSavingsGoal, useUpdateSavingsGoal, useDeleteSavingsGoal, useAddToSavingsGoal } from '@/hooks/data/useSavingsGoals';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Target, Plus, Edit, Trash2, PiggyBank, DollarSign, Palette, Sun, Moon, Monitor, RotateCcw, BookOpen, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { InvestmentSection } from '@/components/investments/InvestmentSection';
import { FinancialEducationResources } from '@/components/settings/FinancialEducationResources';
import { resetOnboardingTutorial } from '@/components/guidance/OnboardingTutorial';
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

const GOAL_COLORS = [
  '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'
];

export default function Settings() {
  const { t, language, setLanguage } = useLanguage();
  const { mode, style, setMode, setStyle } = useTheme();
  const { data: savingsGoals, isLoading: goalsLoading } = useSavingsGoals();
  const createGoal = useCreateSavingsGoal();
  const updateGoal = useUpdateSavingsGoal();
  const deleteGoal = useDeleteSavingsGoal();
  const addToGoal = useAddToSavingsGoal();

  // Savings goal dialog state
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [goalColor, setGoalColor] = useState('#10B981');
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);

  // Add amount dialog
  const [addAmountGoalId, setAddAmountGoalId] = useState<string | null>(null);
  const [amountToAdd, setAmountToAdd] = useState('');

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

  return (
    <Layout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">{t('nav.settings')}</h1>
          <p className="text-muted-foreground mt-2">
            {language === 'es' 
              ? 'Personaliza la apariencia y preferencias de la aplicación' 
              : 'Customize app appearance and preferences'}
          </p>
        </div>

        {/* Language Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>{t('settings.languageTitle')}</CardTitle>
                <CardDescription>{t('settings.languageDescription')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>{t('common.language')}</Label>
              <Select value={language} onValueChange={(val) => setLanguage(val as any)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Theme Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>{t('settings.themeTitle')}</CardTitle>
                <CardDescription>{t('settings.themeDescription')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme Mode */}
            <div className="space-y-3">
              <Label>{t('settings.themeMode')}</Label>
              <div className="flex gap-2">
                <Button
                  variant={mode === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('light')}
                  className="flex items-center gap-2"
                >
                  <Sun className="h-4 w-4" />
                  {t('settings.lightMode')}
                </Button>
                <Button
                  variant={mode === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('dark')}
                  className="flex items-center gap-2"
                >
                  <Moon className="h-4 w-4" />
                  {t('settings.darkMode')}
                </Button>
                <Button
                  variant={mode === 'system' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('system')}
                  className="flex items-center gap-2"
                >
                  <Monitor className="h-4 w-4" />
                  {t('settings.systemMode')}
                </Button>
              </div>
            </div>

            {/* Theme Style */}
            <div className="space-y-3">
              <Label>{t('settings.themeStyle')}</Label>
              <p className="text-xs text-muted-foreground mb-2">
                {language === 'es' ? 'Estilos Clásicos' : 'Classic Styles'}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {([
                  { value: 'modern', gradient: 'from-violet-500 to-fuchsia-500' },
                  { value: 'vintage', gradient: 'from-amber-600 to-orange-700' },
                  { value: 'ocean', gradient: 'from-cyan-500 to-blue-600' },
                  { value: 'forest', gradient: 'from-emerald-500 to-green-700' },
                  { value: 'sunset', gradient: 'from-orange-500 to-rose-600' },
                  { value: 'minimal', gradient: 'from-slate-400 to-slate-600' },
                ] as const).map(({ value, gradient }) => (
                  <button
                    key={value}
                    onClick={() => setStyle(value)}
                    className={`relative p-4 rounded-lg border-2 transition-all ${
                      style === value 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className={`w-full h-8 rounded bg-gradient-to-r ${gradient} mb-2`} />
                    <span className="text-sm font-medium">{t(`settings.${value}`)}</span>
                    {style === value && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                    )}
                  </button>
                ))}
              </div>
              
              <p className="text-xs text-muted-foreground mb-2 mt-4">
                {language === 'es' ? '🌸 Estaciones del Año' : '🌸 Seasons'}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {([
                  { value: 'spring', gradient: 'from-pink-400 to-green-400', emoji: '🌸' },
                  { value: 'summer', gradient: 'from-yellow-400 to-cyan-400', emoji: '☀️' },
                  { value: 'autumn', gradient: 'from-orange-500 to-amber-600', emoji: '🍂' },
                  { value: 'winter', gradient: 'from-blue-400 to-slate-300', emoji: '❄️' },
                ] as const).map(({ value, gradient, emoji }) => (
                  <button
                    key={value}
                    onClick={() => setStyle(value)}
                    className={`relative p-3 rounded-lg border-2 transition-all ${
                      style === value 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className={`w-full h-6 rounded bg-gradient-to-r ${gradient} mb-2`} />
                    <span className="text-sm font-medium flex items-center gap-1">
                      {emoji} {language === 'es' 
                        ? value === 'spring' ? 'Primavera' 
                        : value === 'summer' ? 'Verano' 
                        : value === 'autumn' ? 'Otoño' 
                        : 'Invierno'
                        : value.charAt(0).toUpperCase() + value.slice(1)}
                    </span>
                    {style === value && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                    )}
                  </button>
                ))}
              </div>
              
              <p className="text-xs text-muted-foreground mb-2 mt-4">
                {language === 'es' ? '🎮 Intereses & Hobbies' : '🎮 Interests & Hobbies'}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {([
                  { value: 'crypto', gradient: 'from-yellow-500 to-orange-500', emoji: '₿', label: { es: 'Crypto', en: 'Crypto' } },
                  { value: 'gaming', gradient: 'from-purple-500 via-pink-500 to-cyan-400', emoji: '🎮', label: { es: 'Gaming', en: 'Gaming' } },
                  { value: 'sports', gradient: 'from-blue-600 to-red-500', emoji: '⚽', label: { es: 'Deportes', en: 'Sports' } },
                  { value: 'music', gradient: 'from-purple-600 to-pink-500', emoji: '🎵', label: { es: 'Música', en: 'Music' } },
                  { value: 'coffee', gradient: 'from-amber-700 to-orange-800', emoji: '☕', label: { es: 'Café', en: 'Coffee' } },
                  { value: 'nature', gradient: 'from-green-500 to-lime-400', emoji: '🌿', label: { es: 'Naturaleza', en: 'Nature' } },
                ] as const).map(({ value, gradient, emoji, label }) => (
                  <button
                    key={value}
                    onClick={() => setStyle(value)}
                    className={`relative p-3 rounded-lg border-2 transition-all ${
                      style === value 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className={`w-full h-6 rounded bg-gradient-to-r ${gradient} mb-2`} />
                    <span className="text-sm font-medium flex items-center gap-1">
                      {emoji} {label[language as 'es' | 'en']}
                    </span>
                    {style === value && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Onboarding Guides Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>{language === 'es' ? 'Guías de Ayuda' : 'Help Guides'}</CardTitle>
                <CardDescription>
                  {language === 'es' 
                    ? 'Restablece las guías de onboarding para verlas de nuevo en cada página' 
                    : 'Reset the onboarding guides to see them again on each page'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  // Clear all onboarding dismissed flags
                  const keysToRemove = Object.keys(localStorage).filter(key => 
                    key.startsWith('onboarding-dismissed-') || 
                    key.startsWith('guide-') ||
                    key.startsWith('tip-') ||
                    key === 'setup-banner-dismissed'
                  );
                  keysToRemove.forEach(key => localStorage.removeItem(key));
                  toast.success(
                    language === 'es' 
                      ? '¡Guías de página restablecidas!' 
                      : 'Page guides reset!'
                  );
                }}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {language === 'es' ? 'Restablecer Guías de Página' : 'Reset Page Guides'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  resetOnboardingTutorial();
                  toast.success(
                    language === 'es' 
                      ? '¡Tutorial reiniciado! Recarga la página para verlo.' 
                      : 'Tutorial reset! Reload the page to see it.'
                  );
                }}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {language === 'es' ? 'Ver Tutorial de Inicio' : 'View Welcome Tutorial'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {language === 'es' 
                ? 'Puedes restablecer las guías contextuales de cada página o volver a ver el tutorial interactivo de bienvenida.'
                : 'You can reset the contextual guides on each page or view the interactive welcome tutorial again.'}
            </p>
          </CardContent>
        </Card>

        {/* Savings Goals Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>{t('savingsGoals.title')}</CardTitle>
                  <CardDescription>{t('savingsGoals.description')}</CardDescription>
                </div>
              </div>
              <Button onClick={() => openGoalDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                {t('savingsGoals.addGoal')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {goalsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : savingsGoals && savingsGoals.length > 0 ? (
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
            ) : (
              <div className="text-center py-8">
                <PiggyBank className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">{t('savingsGoals.noGoals')}</p>
                <p className="text-sm text-muted-foreground">{t('savingsGoals.createFirst')}</p>
              </div>
            )}
        </CardContent>
        </Card>

        {/* Investment Goals Section */}
        <InvestmentSection />

        {/* Financial Education Resources */}
        <FinancialEducationResources />

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
      </div>
    </Layout>
  );
}
