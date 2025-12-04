import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateInvestmentGoal, useUpdateInvestmentGoal } from '@/hooks/data/useInvestmentGoals';

const GOAL_TYPES = [
  { value: 'passive_income', labelKey: 'passiveIncome' },
  { value: 'dividend', labelKey: 'dividend' },
  { value: 'rental', labelKey: 'rental' },
  { value: 'business', labelKey: 'business' },
  { value: 'digital', labelKey: 'digital' },
  { value: 'other', labelKey: 'other' },
];

const RISK_LEVELS = [
  { value: 'low', labelKey: 'lowRisk' },
  { value: 'moderate', labelKey: 'moderateRisk' },
  { value: 'high', labelKey: 'highRisk' },
];

const ASSET_CLASSES = [
  { value: 'stocks', labelKey: 'stocks' },
  { value: 'real_estate', labelKey: 'realEstate' },
  { value: 'bonds', labelKey: 'bonds' },
  { value: 'crypto', labelKey: 'crypto' },
  { value: 'business', labelKey: 'business' },
  { value: 'royalties', labelKey: 'royalties' },
  { value: 'other', labelKey: 'other' },
];

const GOAL_COLORS = [
  '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'
];

interface InvestmentGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingGoal?: any;
}

export function InvestmentGoalDialog({ open, onOpenChange, editingGoal }: InvestmentGoalDialogProps) {
  const { t } = useLanguage();
  const createGoal = useCreateInvestmentGoal();
  const updateGoal = useUpdateInvestmentGoal();

  const [name, setName] = useState('');
  const [goalType, setGoalType] = useState('passive_income');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [monthlyTarget, setMonthlyTarget] = useState('');
  const [assetClass, setAssetClass] = useState('');
  const [riskLevel, setRiskLevel] = useState('moderate');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState('#8B5CF6');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingGoal) {
      setName(editingGoal.name);
      setGoalType(editingGoal.goal_type);
      setTargetAmount(String(editingGoal.target_amount));
      setCurrentAmount(String(editingGoal.current_amount || 0));
      setMonthlyTarget(String(editingGoal.monthly_target || ''));
      setAssetClass(editingGoal.asset_class || '');
      setRiskLevel(editingGoal.risk_level || 'moderate');
      setDeadline(editingGoal.deadline || '');
      setColor(editingGoal.color || '#8B5CF6');
      setNotes(editingGoal.notes || '');
    } else {
      setName('');
      setGoalType('passive_income');
      setTargetAmount('');
      setCurrentAmount('0');
      setMonthlyTarget('');
      setAssetClass('');
      setRiskLevel('moderate');
      setDeadline('');
      setColor('#8B5CF6');
      setNotes('');
    }
  }, [editingGoal, open]);

  const handleSave = () => {
    const data = {
      name,
      goal_type: goalType,
      target_amount: parseFloat(targetAmount) || 0,
      current_amount: parseFloat(currentAmount) || 0,
      monthly_target: parseFloat(monthlyTarget) || 0,
      asset_class: assetClass || null,
      risk_level: riskLevel,
      deadline: deadline || null,
      color,
      notes: notes || null,
    };

    if (editingGoal) {
      updateGoal.mutate({ id: editingGoal.id, data }, { onSuccess: () => onOpenChange(false) });
    } else {
      createGoal.mutate(data, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingGoal ? t('investments.editGoal') : t('investments.addGoal')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('investments.goalName')}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('investments.goalNamePlaceholder')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('investments.goalType')}</Label>
              <Select value={goalType} onValueChange={setGoalType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {t(`investments.${type.labelKey}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('investments.assetClass')}</Label>
              <Select value={assetClass} onValueChange={setAssetClass}>
                <SelectTrigger>
                  <SelectValue placeholder={t('investments.selectAssetClass')} />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_CLASSES.map(ac => (
                    <SelectItem key={ac.value} value={ac.value}>
                      {t(`investments.${ac.labelKey}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('investments.targetAmount')}</Label>
              <Input
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('investments.currentAmount')}</Label>
              <Input
                type="number"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('investments.monthlyTarget')}</Label>
              <Input
                type="number"
                value={monthlyTarget}
                onChange={(e) => setMonthlyTarget(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('investments.riskLevel')}</Label>
              <Select value={riskLevel} onValueChange={setRiskLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RISK_LEVELS.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      {t(`investments.${level.labelKey}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('investments.deadline')}</Label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('savingsGoals.color')}</Label>
            <div className="flex gap-2">
              {GOAL_COLORS.map(c => (
                <button
                  key={c}
                  className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('common.notes')}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('investments.notesPlaceholder')}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!name || !targetAmount}>
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
