-- Add recurrence columns to mileage table (similar to income table)
ALTER TABLE public.mileage 
ADD COLUMN recurrence text DEFAULT 'one_time',
ADD COLUMN recurrence_end_date date DEFAULT NULL,
ADD COLUMN recurrence_days integer[] DEFAULT NULL;

COMMENT ON COLUMN public.mileage.recurrence IS 'Recurrence type: one_time, daily, weekly, biweekly, monthly';
COMMENT ON COLUMN public.mileage.recurrence_end_date IS 'End date for recurring trips';
COMMENT ON COLUMN public.mileage.recurrence_days IS 'Days of week for weekly recurrence (0=Sunday, 1=Monday, etc.)';