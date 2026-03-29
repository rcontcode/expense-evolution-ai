ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type = ANY(ARRAY[
    'reminder','alert','success','warning','info',
    'bill_reminder','contract_reminder','tax_reminder',
    'budget_alert','achievement','gamification',
    'goal_milestone','goal_deadline','savings_alert',
    'income_alert','data_health','streak','level_up'
  ]));
