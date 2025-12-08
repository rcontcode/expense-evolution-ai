import { z } from 'zod';

export const expenseSchema = z.object({
  date: z.date({
    required_error: 'Date is required',
  }),
  vendor: z.string()
    .min(1, 'Vendor name is required')
    .max(200, 'Vendor name must be less than 200 characters')
    .trim(),
  amount: z.number({
    required_error: 'Amount is required',
  })
    .positive('Amount must be positive')
    .max(1000000, 'Amount too large'),
  category: z.enum([
    'meals',
    'travel',
    'equipment',
    'software',
    'mileage',
    'home_office',
    'professional_services',
    'office_supplies',
    'utilities',
    'fuel',
    'other'
  ]),
  description: z.string().max(500, 'Description too long').trim().optional(),
  notes: z.string().max(1000, 'Notes too long').trim().optional(),
  client_id: z.string().uuid().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
  contract_id: z.string().uuid().optional().nullable(),
  status: z.enum(['pending', 'classified', 'deductible', 'non_deductible', 'reimbursable', 'rejected', 'under_review', 'finalized']).optional(),
  reimbursement_type: z.enum(['pending_classification', 'client_reimbursable', 'cra_deductible', 'personal']).optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;