import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
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
import { Target, Plus, Edit, Trash2, PiggyBank, DollarSign } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSavingsGoals, useCreateSavingsGoal, useUpdateSavingsGoal, useDeleteSavingsGoal, useAddToSavingsGoal } from '@/hooks/data/useSavingsGoals';

const GOAL_COLORS = [
  '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'
];

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
    <>
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
          ) : !savingsGoals || savingsGoals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <PiggyBank className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{language === 'es' ? 'No tienes metas de ahorro aún' : 'No savings goals yet'}</p>
              <p className="text-sm">{language === 'es' ? 'Crea tu primera meta para empezar' : 'Create your first goal to get started'}</p>
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
