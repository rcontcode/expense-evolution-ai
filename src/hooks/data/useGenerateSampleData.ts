import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Database } from '@/integrations/supabase/types';

type ExpenseStatus = Database['public']['Enums']['expense_status'];
type IncomeType = Database['public']['Enums']['income_type'];
type RecurrenceType = Database['public']['Enums']['recurrence_type'];

// Marker to identify sample data
const SAMPLE_MARKER = '[SAMPLE]';

export function useGenerateSampleData() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const userId = user.id;
      const today = new Date();
      
      // ============================================
      // 1. CREATE 2 CLIENTS (well-structured)
      // ============================================
      const clients = [
        { 
          name: `${SAMPLE_MARKER} TechCorp Solutions`, 
          industry: 'technology', 
          client_type: 'corporate', 
          contact_email: 'contact@techcorp-sample.com',
          contact_phone: '+1 (416) 555-0101',
          payment_terms: 30, 
          province: 'Ontario', 
          country: 'Canada',
          website: 'https://techcorp-sample.com',
          tax_id: '123456789',
          notes: `${SAMPLE_MARKER} Large technology company specializing in software development. Has contracts for monthly retainer and project-based work.`,
          currency: 'CAD'
        },
        { 
          name: `${SAMPLE_MARKER} Creative Design Studio`, 
          industry: 'creative_services', 
          client_type: 'private', 
          contact_email: 'hello@creative-sample.com',
          contact_phone: '+1 (604) 555-0202',
          payment_terms: 15, 
          province: 'British Columbia', 
          country: 'Canada',
          website: 'https://creative-sample.com',
          notes: `${SAMPLE_MARKER} Boutique design agency. Reimburses materials and travel expenses per contract.`,
          currency: 'CAD'
        },
      ];

      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .insert(clients.map(c => ({ ...c, user_id: userId })))
        .select();

      if (clientsError) throw clientsError;

      // ============================================
      // 2. CREATE 2 PROJECTS PER CLIENT (4 total)
      // ============================================
      const projects = [
        // TechCorp projects
        { 
          name: `${SAMPLE_MARKER} Website Redesign`, 
          description: 'Complete website overhaul with new UX/UI', 
          status: 'active', 
          budget: 25000, 
          color: '#3B82F6', 
          client_id: clientsData[0].id,
          start_date: new Date(today.getFullYear(), today.getMonth() - 2, 1).toISOString().split('T')[0],
          end_date: new Date(today.getFullYear(), today.getMonth() + 3, 30).toISOString().split('T')[0],
        },
        { 
          name: `${SAMPLE_MARKER} Mobile App Development`, 
          description: 'iOS and Android native app development', 
          status: 'active', 
          budget: 75000, 
          color: '#10B981', 
          client_id: clientsData[0].id,
          start_date: new Date(today.getFullYear(), today.getMonth() - 1, 15).toISOString().split('T')[0],
          end_date: new Date(today.getFullYear(), today.getMonth() + 6, 15).toISOString().split('T')[0],
        },
        // Creative Design projects
        { 
          name: `${SAMPLE_MARKER} Brand Identity Package`, 
          description: 'Logo, brand guidelines, and marketing materials', 
          status: 'completed', 
          budget: 12000, 
          color: '#8B5CF6', 
          client_id: clientsData[1].id,
          start_date: new Date(today.getFullYear(), today.getMonth() - 3, 1).toISOString().split('T')[0],
          end_date: new Date(today.getFullYear(), today.getMonth() - 1, 15).toISOString().split('T')[0],
        },
        { 
          name: `${SAMPLE_MARKER} Q1 Marketing Campaign`, 
          description: 'Digital marketing and social media campaign', 
          status: 'active', 
          budget: 18000, 
          color: '#F59E0B', 
          client_id: clientsData[1].id,
          start_date: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
          end_date: new Date(today.getFullYear(), today.getMonth() + 2, 28).toISOString().split('T')[0],
        },
      ];

      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .insert(projects.map(p => ({ ...p, user_id: userId })))
        .select();

      if (projectsError) throw projectsError;

      // ============================================
      // 3. CREATE TAGS (6 tags for categorization)
      // ============================================
      const tags = [
        { name: `${SAMPLE_MARKER} Tax Deductible`, color: '#10B981' },
        { name: `${SAMPLE_MARKER} Client Billable`, color: '#3B82F6' },
        { name: `${SAMPLE_MARKER} Urgent`, color: '#EF4444' },
        { name: `${SAMPLE_MARKER} Recurring`, color: '#8B5CF6' },
        { name: `${SAMPLE_MARKER} Review Needed`, color: '#F59E0B' },
        { name: `${SAMPLE_MARKER} Office`, color: '#6B7280' },
      ];

      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .insert(tags.map(t => ({ ...t, user_id: userId })))
        .select();

      if (tagsError) throw tagsError;

      // ============================================
      // 4. CREATE 20 EXPENSES (varied categories, statuses, dates)
      // ============================================
      const expenseData: Array<{
        vendor: string;
        category: string;
        amount: number;
        status: ExpenseStatus;
        reimbursement_type: string;
        clientIdx: number | null;
        projectIdx: number | null;
        daysAgo: number;
      }> = [
        // Client-assigned expenses (reimbursable)
        { vendor: 'Adobe Creative Cloud', category: 'software', amount: 79.99, status: 'deductible', reimbursement_type: 'client_reimbursable', clientIdx: 0, projectIdx: 0, daysAgo: 5 },
        { vendor: 'Staples', category: 'office_supplies', amount: 156.45, status: 'classified', reimbursement_type: 'cra_deductible', clientIdx: 0, projectIdx: 1, daysAgo: 12 },
        { vendor: 'Air Canada', category: 'travel', amount: 487.00, status: 'reimbursable', reimbursement_type: 'client_reimbursable', clientIdx: 0, projectIdx: 0, daysAgo: 20 },
        { vendor: 'Best Buy', category: 'equipment', amount: 1299.99, status: 'deductible', reimbursement_type: 'cra_deductible', clientIdx: 1, projectIdx: 2, daysAgo: 30 },
        { vendor: 'Uber', category: 'travel', amount: 34.50, status: 'classified', reimbursement_type: 'client_reimbursable', clientIdx: 1, projectIdx: 3, daysAgo: 3 },
        // CRA deductible expenses
        { vendor: 'Microsoft 365', category: 'software', amount: 16.99, status: 'deductible', reimbursement_type: 'cra_deductible', clientIdx: null, projectIdx: null, daysAgo: 1 },
        { vendor: 'Bell Canada', category: 'utilities', amount: 145.00, status: 'deductible', reimbursement_type: 'cra_deductible', clientIdx: null, projectIdx: null, daysAgo: 15 },
        { vendor: 'Restaurant ABC', category: 'meals_entertainment', amount: 87.50, status: 'classified', reimbursement_type: 'cra_deductible', clientIdx: 0, projectIdx: 0, daysAgo: 8 },
        { vendor: 'Google Ads', category: 'advertising', amount: 350.00, status: 'deductible', reimbursement_type: 'cra_deductible', clientIdx: null, projectIdx: null, daysAgo: 25 },
        { vendor: 'Accountant Services', category: 'professional_services', amount: 500.00, status: 'deductible', reimbursement_type: 'cra_deductible', clientIdx: null, projectIdx: null, daysAgo: 45 },
        // Pending expenses (need review)
        { vendor: 'Amazon', category: 'office_supplies', amount: 67.89, status: 'pending', reimbursement_type: 'pending_classification', clientIdx: null, projectIdx: null, daysAgo: 2 },
        { vendor: 'Gas Station', category: 'fuel', amount: 85.00, status: 'pending', reimbursement_type: 'pending_classification', clientIdx: null, projectIdx: null, daysAgo: 4 },
        { vendor: 'Coffee Shop Meeting', category: 'meals_entertainment', amount: 24.50, status: 'pending', reimbursement_type: 'pending_classification', clientIdx: 0, projectIdx: null, daysAgo: 1 },
        // Personal expenses
        { vendor: 'Personal Lunch', category: 'meals_entertainment', amount: 18.99, status: 'non_deductible', reimbursement_type: 'personal', clientIdx: null, projectIdx: null, daysAgo: 7 },
        { vendor: 'Gym Membership', category: 'other', amount: 49.99, status: 'non_deductible', reimbursement_type: 'personal', clientIdx: null, projectIdx: null, daysAgo: 30 },
        // More varied expenses for charts
        { vendor: 'AWS Services', category: 'software', amount: 234.56, status: 'deductible', reimbursement_type: 'cra_deductible', clientIdx: 0, projectIdx: 1, daysAgo: 35 },
        { vendor: 'Home Depot', category: 'materials', amount: 189.00, status: 'classified', reimbursement_type: 'client_reimbursable', clientIdx: 1, projectIdx: 2, daysAgo: 40 },
        { vendor: 'FedEx Shipping', category: 'shipping', amount: 45.00, status: 'deductible', reimbursement_type: 'cra_deductible', clientIdx: 0, projectIdx: 0, daysAgo: 22 },
        { vendor: 'Insurance Premium', category: 'insurance', amount: 325.00, status: 'deductible', reimbursement_type: 'cra_deductible', clientIdx: null, projectIdx: null, daysAgo: 60 },
        { vendor: 'Training Course', category: 'education', amount: 199.00, status: 'classified', reimbursement_type: 'cra_deductible', clientIdx: null, projectIdx: null, daysAgo: 50 },
      ];

      const expenses = expenseData.map((e, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - e.daysAgo);
        return {
          user_id: userId,
          date: date.toISOString().split('T')[0],
          amount: e.amount,
          vendor: e.vendor,
          category: e.category,
          description: `${SAMPLE_MARKER} ${e.vendor} - Expense #${i + 1}`,
          client_id: e.clientIdx !== null ? clientsData[e.clientIdx].id : null,
          project_id: e.projectIdx !== null ? projectsData[e.projectIdx].id : null,
          status: e.status,
          reimbursement_type: e.reimbursement_type,
          notes: `${SAMPLE_MARKER} Sample expense for testing`,
        };
      });

      const { error: expensesError } = await supabase.from('expenses').insert(expenses);
      if (expensesError) throw expensesError;

      // ============================================
      // 5. CREATE 12 INCOME ENTRIES (various types)
      // ============================================
      const incomeData: Array<{
        source: string;
        type: IncomeType;
        amount: number;
        clientIdx: number | null;
        daysAgo: number;
        taxable: boolean;
      }> = [
        // Client payments
        { source: 'TechCorp - Website Milestone', type: 'client_payment', amount: 5000, clientIdx: 0, daysAgo: 10, taxable: true },
        { source: 'TechCorp - App Development', type: 'client_payment', amount: 12500, clientIdx: 0, daysAgo: 25, taxable: true },
        { source: 'Creative Design - Brand Package', type: 'client_payment', amount: 6000, clientIdx: 1, daysAgo: 35, taxable: true },
        { source: 'Creative Design - Retainer', type: 'client_payment', amount: 2500, clientIdx: 1, daysAgo: 5, taxable: true },
        // Freelance
        { source: 'Freelance Consulting', type: 'freelance', amount: 1500, clientIdx: null, daysAgo: 15, taxable: true },
        { source: 'Side Project Work', type: 'freelance', amount: 800, clientIdx: null, daysAgo: 45, taxable: true },
        // Investments
        { source: 'Stock Dividends - TD Bank', type: 'investment_stocks', amount: 245.50, clientIdx: null, daysAgo: 30, taxable: true },
        { source: 'ETF Distribution', type: 'investment_funds', amount: 178.25, clientIdx: null, daysAgo: 60, taxable: true },
        { source: 'Crypto Staking Rewards', type: 'investment_crypto', amount: 89.00, clientIdx: null, daysAgo: 20, taxable: true },
        // Passive income
        { source: 'Rental Income - Property', type: 'passive_rental', amount: 1800, clientIdx: null, daysAgo: 1, taxable: true },
        { source: 'Rental Income - Property', type: 'passive_rental', amount: 1800, clientIdx: null, daysAgo: 31, taxable: true },
        // Other
        { source: 'Tax Refund', type: 'refund', amount: 2340, clientIdx: null, daysAgo: 75, taxable: false },
      ];

      const incomeEntries = incomeData.map((inc, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - inc.daysAgo);
        const recurrence: RecurrenceType = inc.type === 'passive_rental' ? 'monthly' : 'one_time';
        return {
          user_id: userId,
          date: date.toISOString().split('T')[0],
          amount: inc.amount,
          income_type: inc.type,
          source: inc.source,
          description: `${SAMPLE_MARKER} ${inc.source}`,
          client_id: inc.clientIdx !== null ? clientsData[inc.clientIdx].id : null,
          is_taxable: inc.taxable,
          recurrence,
          notes: `${SAMPLE_MARKER} Sample income entry #${i + 1}`,
        };
      });

      const { error: incomeError } = await supabase.from('income').insert(incomeEntries);
      if (incomeError) throw incomeError;

      // ============================================
      // 6. CREATE 8 MILEAGE ENTRIES
      // ============================================
      const mileageData = [
        { route: 'Home → TechCorp Office', km: 45.5, purpose: 'Client meeting - project kickoff', clientIdx: 0, daysAgo: 5 },
        { route: 'Home → Creative Design Studio', km: 28.3, purpose: 'Design review meeting', clientIdx: 1, daysAgo: 8 },
        { route: 'TechCorp → Airport', km: 62.0, purpose: 'Business travel - conference', clientIdx: 0, daysAgo: 20 },
        { route: 'Home → Staples → Home', km: 15.2, purpose: 'Office supplies pickup', clientIdx: null, daysAgo: 12 },
        { route: 'Home → TechCorp → Creative Design', km: 78.5, purpose: 'Multiple client visits', clientIdx: 0, daysAgo: 15 },
        { route: 'Downtown Meeting Location', km: 22.0, purpose: 'Networking event', clientIdx: null, daysAgo: 25 },
        { route: 'Home → Best Buy → Client Site', km: 35.8, purpose: 'Equipment delivery', clientIdx: 1, daysAgo: 30 },
        { route: 'Client Site Inspection', km: 18.5, purpose: 'Project site visit', clientIdx: 0, daysAgo: 40 },
      ];

      const mileageEntries = mileageData.map(m => {
        const date = new Date(today);
        date.setDate(date.getDate() - m.daysAgo);
        return {
          user_id: userId,
          date: date.toISOString().split('T')[0],
          kilometers: m.km,
          route: `${SAMPLE_MARKER} ${m.route}`,
          purpose: m.purpose,
          client_id: m.clientIdx !== null ? clientsData[m.clientIdx].id : null,
        };
      });

      const { error: mileageError } = await supabase.from('mileage').insert(mileageEntries);
      if (mileageError) throw mileageError;

      // ============================================
      // 7. CREATE 10 ASSETS (varied categories)
      // ============================================
      const assets = [
        { name: `${SAMPLE_MARKER} TFSA - Wealthsimple`, category: 'investments', current_value: 45000, purchase_value: 38000, is_liquid: true, notes: 'Tax-free savings account with ETF portfolio' },
        { name: `${SAMPLE_MARKER} RRSP - TD Direct`, category: 'investments', current_value: 78000, purchase_value: 65000, is_liquid: false, notes: 'Retirement savings with balanced fund' },
        { name: `${SAMPLE_MARKER} Bitcoin Holdings`, category: 'bitcoin', current_value: 12500, purchase_value: 8000, is_liquid: true, notes: '0.15 BTC purchased over time' },
        { name: `${SAMPLE_MARKER} Ethereum`, category: 'ethereum', current_value: 5200, purchase_value: 4000, is_liquid: true, notes: '2.5 ETH for DeFi participation' },
        { name: `${SAMPLE_MARKER} Business Checking - RBC`, category: 'bank_accounts', current_value: 15800, is_liquid: true, notes: 'Main business operating account' },
        { name: `${SAMPLE_MARKER} Emergency Fund - EQ Bank`, category: 'bank_accounts', current_value: 22000, is_liquid: true, notes: '6 months expenses saved' },
        { name: `${SAMPLE_MARKER} Office Equipment`, category: 'business_assets', current_value: 6500, purchase_value: 12000, is_liquid: false, notes: 'Computers, monitors, furniture' },
        { name: `${SAMPLE_MARKER} Company Vehicle`, category: 'vehicles', current_value: 25000, purchase_value: 38000, is_liquid: false, notes: '2021 Honda CRV for business use' },
        { name: `${SAMPLE_MARKER} DeFi Staking`, category: 'defi_staking', current_value: 3200, purchase_value: 2800, is_liquid: true, notes: 'Staked tokens earning yield' },
        { name: `${SAMPLE_MARKER} Altcoin Portfolio`, category: 'altcoins', current_value: 2100, purchase_value: 1500, is_liquid: true, notes: 'Diversified altcoin positions' },
      ];

      const { error: assetsError } = await supabase.from('assets').insert(assets.map(a => ({ ...a, user_id: userId })));
      if (assetsError) throw assetsError;

      // ============================================
      // 8. CREATE 5 LIABILITIES
      // ============================================
      const liabilities = [
        { name: `${SAMPLE_MARKER} Business Line of Credit`, category: 'business_loan', original_amount: 50000, current_balance: 32000, interest_rate: 7.5, minimum_payment: 800, notes: 'RBC business LOC for operations' },
        { name: `${SAMPLE_MARKER} Vehicle Loan`, category: 'auto_loan', original_amount: 38000, current_balance: 22500, interest_rate: 4.9, minimum_payment: 580, notes: 'Honda Financial for CRV' },
        { name: `${SAMPLE_MARKER} Business Credit Card`, category: 'credit_card', original_amount: 10000, current_balance: 3800, interest_rate: 19.99, minimum_payment: 120, notes: 'TD Business Visa' },
        { name: `${SAMPLE_MARKER} Equipment Financing`, category: 'personal_loan', original_amount: 15000, current_balance: 8200, interest_rate: 6.5, minimum_payment: 320, notes: 'Office equipment lease-to-own' },
        { name: `${SAMPLE_MARKER} Student Loan`, category: 'student_loan', original_amount: 28000, current_balance: 12500, interest_rate: 5.0, minimum_payment: 250, notes: 'Canada Student Loan' },
      ];

      const { error: liabilitiesError } = await supabase.from('liabilities').insert(liabilities.map(l => ({ ...l, user_id: userId })));
      if (liabilitiesError) throw liabilitiesError;

      // ============================================
      // 9. CREATE 30 BANK TRANSACTIONS (for reconciliation)
      // ============================================
      const bankTransactionData = [
        // Matching transactions for reconciliation testing
        { desc: 'INTERAC PURCHASE - ADOBE', amount: -79.99, daysAgo: 5, status: 'unmatched' },
        { desc: 'INTERAC PURCHASE - STAPLES', amount: -156.45, daysAgo: 12, status: 'unmatched' },
        { desc: 'BILL PAYMENT - BELL CANADA', amount: -145.00, daysAgo: 15, status: 'unmatched' },
        { desc: 'INTERAC PURCHASE - AMAZON', amount: -67.89, daysAgo: 2, status: 'unmatched' },
        // Income deposits
        { desc: 'DIRECT DEPOSIT - TECHCORP', amount: 5000, daysAgo: 10, status: 'unmatched' },
        { desc: 'E-TRANSFER - CREATIVE DESIGN', amount: 2500, daysAgo: 5, status: 'unmatched' },
        { desc: 'DIRECT DEPOSIT - RENTAL', amount: 1800, daysAgo: 1, status: 'unmatched' },
        // Subscriptions (recurring pattern)
        { desc: 'SUBSCRIPTION - MICROSOFT 365', amount: -16.99, daysAgo: 1, status: 'unmatched' },
        { desc: 'SUBSCRIPTION - MICROSOFT 365', amount: -16.99, daysAgo: 31, status: 'matched' },
        { desc: 'SUBSCRIPTION - NETFLIX', amount: -22.99, daysAgo: 3, status: 'unmatched' },
        { desc: 'SUBSCRIPTION - NETFLIX', amount: -22.99, daysAgo: 33, status: 'matched' },
        { desc: 'SUBSCRIPTION - SPOTIFY', amount: -11.99, daysAgo: 7, status: 'unmatched' },
        // Other transactions
        { desc: 'ATM WITHDRAWAL', amount: -200, daysAgo: 4, status: 'ignored' },
        { desc: 'ATM WITHDRAWAL', amount: -100, daysAgo: 18, status: 'ignored' },
        { desc: 'E-TRANSFER SENT', amount: -500, daysAgo: 8, status: 'unmatched' },
        { desc: 'INTERAC PURCHASE - GAS STATION', amount: -85.00, daysAgo: 4, status: 'unmatched' },
        { desc: 'INTERAC PURCHASE - RESTAURANT', amount: -87.50, daysAgo: 8, status: 'unmatched' },
        { desc: 'BILL PAYMENT - INSURANCE', amount: -325, daysAgo: 60, status: 'matched' },
        { desc: 'INTERAC PURCHASE - UBER', amount: -34.50, daysAgo: 3, status: 'unmatched' },
        { desc: 'PAYROLL DEPOSIT', amount: 3500, daysAgo: 14, status: 'matched' },
        { desc: 'DIVIDEND - TD BANK', amount: 245.50, daysAgo: 30, status: 'matched' },
        // More variety
        { desc: 'INTERAC PURCHASE - HOME DEPOT', amount: -189.00, daysAgo: 40, status: 'unmatched' },
        { desc: 'BILL PAYMENT - HYDRO', amount: -156.78, daysAgo: 22, status: 'unmatched' },
        { desc: 'INTERAC PURCHASE - COSTCO', amount: -234.56, daysAgo: 16, status: 'unmatched' },
        { desc: 'INTERAC PURCHASE - GOOGLE ADS', amount: -350.00, daysAgo: 25, status: 'unmatched' },
        { desc: 'TRANSFER FROM SAVINGS', amount: 2000, daysAgo: 45, status: 'ignored' },
        { desc: 'INTERAC PURCHASE - COFFEE SHOP', amount: -24.50, daysAgo: 1, status: 'unmatched' },
        { desc: 'E-TRANSFER - FREELANCE CLIENT', amount: 1500, daysAgo: 15, status: 'unmatched' },
        { desc: 'INTERAC PURCHASE - FEDEX', amount: -45.00, daysAgo: 22, status: 'unmatched' },
        { desc: 'E-TRANSFER - TAX REFUND', amount: 2340, daysAgo: 75, status: 'matched' },
      ];

      const bankTransactions = bankTransactionData.map(t => {
        const date = new Date(today);
        date.setDate(date.getDate() - t.daysAgo);
        return {
          user_id: userId,
          transaction_date: date.toISOString().split('T')[0],
          amount: t.amount,
          description: `${SAMPLE_MARKER} ${t.desc}`,
          status: t.status,
        };
      });

      const { error: bankError } = await supabase.from('bank_transactions').insert(bankTransactions);
      if (bankError) throw bankError;

      // ============================================
      // 10. CREATE 4 INVESTMENT GOALS
      // ============================================
      const investmentGoals = [
        { 
          name: `${SAMPLE_MARKER} Emergency Fund`, 
          goal_type: 'savings', 
          target_amount: 30000, 
          current_amount: 22000, 
          monthly_target: 500,
          color: '#10B981', 
          risk_level: 'conservative',
          notes: '6 months of expenses target',
          status: 'active'
        },
        { 
          name: `${SAMPLE_MARKER} Retirement at 55`, 
          goal_type: 'early_retirement', 
          target_amount: 1000000, 
          current_amount: 123000,
          monthly_target: 2000,
          color: '#8B5CF6', 
          risk_level: 'moderate', 
          deadline: '2040-01-01',
          notes: 'FIRE goal - financial independence',
          status: 'active'
        },
        { 
          name: `${SAMPLE_MARKER} Passive Income $2K/month`, 
          goal_type: 'passive_income', 
          target_amount: 500000, 
          current_amount: 45000, 
          monthly_target: 1500, 
          color: '#F59E0B', 
          risk_level: 'aggressive',
          notes: 'Dividend and rental income portfolio',
          status: 'active'
        },
        { 
          name: `${SAMPLE_MARKER} House Down Payment`, 
          goal_type: 'house', 
          target_amount: 150000, 
          current_amount: 67000,
          monthly_target: 2500,
          color: '#3B82F6', 
          risk_level: 'conservative', 
          deadline: '2026-06-01',
          notes: '20% down payment for home purchase',
          status: 'active'
        },
      ];

      const { error: goalsError } = await supabase.from('investment_goals').insert(investmentGoals.map(g => ({ ...g, user_id: userId })));
      if (goalsError) throw goalsError;

      // ============================================
      // 11. CREATE 3 SAVINGS GOALS
      // ============================================
      const savingsGoals = [
        { name: `${SAMPLE_MARKER} Vacation Fund`, target_amount: 5000, current_amount: 2800, color: '#EC4899', priority: 2, deadline: new Date(today.getFullYear(), today.getMonth() + 4, 1).toISOString().split('T')[0] },
        { name: `${SAMPLE_MARKER} New MacBook Pro`, target_amount: 3500, current_amount: 1200, color: '#6366F1', priority: 3, deadline: new Date(today.getFullYear(), today.getMonth() + 6, 1).toISOString().split('T')[0] },
        { name: `${SAMPLE_MARKER} Business Workshop`, target_amount: 2000, current_amount: 1800, color: '#14B8A6', priority: 1, deadline: new Date(today.getFullYear(), today.getMonth() + 1, 15).toISOString().split('T')[0] },
      ];

      const { error: savingsError } = await supabase.from('savings_goals').insert(savingsGoals.map(g => ({ ...g, user_id: userId })));
      if (savingsError) throw savingsError;

      // ============================================
      // 12. CREATE NET WORTH SNAPSHOTS (historical data for charts)
      // ============================================
      const netWorthSnapshots = [];
      for (let i = 6; i >= 0; i--) {
        const snapshotDate = new Date(today);
        snapshotDate.setMonth(snapshotDate.getMonth() - i);
        const baseAssets = 200000 + (6 - i) * 3500;
        const baseLiabilities = 85000 - (6 - i) * 1200;
        netWorthSnapshots.push({
          user_id: userId,
          snapshot_date: snapshotDate.toISOString().split('T')[0],
          total_assets: baseAssets + Math.random() * 2000,
          total_liabilities: baseLiabilities + Math.random() * 500,
          net_worth: baseAssets - baseLiabilities + Math.random() * 1500,
        });
      }

      const { error: snapshotError } = await supabase.from('net_worth_snapshots').insert(netWorthSnapshots);
      if (snapshotError) throw snapshotError;

      // ============================================
      // 13. CREATE SAMPLE NOTIFICATIONS
      // ============================================
      const notifications = [
        { type: 'goal_milestone', title: `${SAMPLE_MARKER} ¡Meta al 75%!`, message: 'Tu fondo de emergencia está al 73% de completarse.', read: false },
        { type: 'achievement', title: `${SAMPLE_MARKER} ¡Nuevo logro!`, message: 'Desbloqueaste "Primer Objetivo" por crear tu primera meta.', read: true },
        { type: 'reminder', title: `${SAMPLE_MARKER} Revisar gastos`, message: 'Tienes 3 gastos pendientes de clasificación.', read: false },
      ];

      const { error: notifError } = await supabase.from('notifications').insert(notifications.map(n => ({ ...n, user_id: userId })));
      if (notifError) throw notifError;

      return { success: true };
    },
    onSuccess: () => {
      invalidateAllQueries(queryClient);
      toast.success(language === 'es' ? '¡Datos de ejemplo generados! (2 clientes, 4 proyectos, 20 gastos, 12 ingresos, y más)' : 'Sample data generated! (2 clients, 4 projects, 20 expenses, 12 incomes, and more)');
    },
    onError: (error: any) => {
      console.error('Error generating sample data:', error);
      toast.error(language === 'es' ? 'Error generando datos: ' + error.message : 'Error generating data: ' + error.message);
    },
  });
}

export function useDeleteSampleData() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const userId = user.id;

      // Delete in order to respect foreign key constraints
      // 1. Delete expense_tags (references expenses)
      const { data: sampleExpenses } = await supabase
        .from('expenses')
        .select('id')
        .eq('user_id', userId)
        .like('description', `%${SAMPLE_MARKER}%`);

      if (sampleExpenses && sampleExpenses.length > 0) {
        const expenseIds = sampleExpenses.map(e => e.id);
        await supabase.from('expense_tags').delete().in('expense_id', expenseIds);
      }

      // 2. Delete expenses (may reference projects, clients, contracts)
      await supabase.from('expenses').delete().eq('user_id', userId).like('description', `%${SAMPLE_MARKER}%`);

      // 3. Delete income (may reference projects, clients)
      await supabase.from('income').delete().eq('user_id', userId).like('description', `%${SAMPLE_MARKER}%`);

      // 4. Delete mileage (may reference clients)
      await supabase.from('mileage').delete().eq('user_id', userId).like('route', `%${SAMPLE_MARKER}%`);

      // 5. Delete bank_transactions
      await supabase.from('bank_transactions').delete().eq('user_id', userId).like('description', `%${SAMPLE_MARKER}%`);

      // 6. Delete project_clients (references projects)
      const { data: sampleProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', userId)
        .like('name', `%${SAMPLE_MARKER}%`);

      if (sampleProjects && sampleProjects.length > 0) {
        const projectIds = sampleProjects.map(p => p.id);
        await supabase.from('project_clients').delete().in('project_id', projectIds);
      }

      // 7. Delete projects
      await supabase.from('projects').delete().eq('user_id', userId).like('name', `%${SAMPLE_MARKER}%`);

      // 8. Delete clients
      await supabase.from('clients').delete().eq('user_id', userId).like('name', `%${SAMPLE_MARKER}%`);

      // 9. Delete other sample data
      await supabase.from('assets').delete().eq('user_id', userId).like('name', `%${SAMPLE_MARKER}%`);
      await supabase.from('liabilities').delete().eq('user_id', userId).like('name', `%${SAMPLE_MARKER}%`);
      await supabase.from('investment_goals').delete().eq('user_id', userId).like('name', `%${SAMPLE_MARKER}%`);
      await supabase.from('savings_goals').delete().eq('user_id', userId).like('name', `%${SAMPLE_MARKER}%`);
      await supabase.from('tags').delete().eq('user_id', userId).like('name', `%${SAMPLE_MARKER}%`);
      await supabase.from('notifications').delete().eq('user_id', userId).like('title', `%${SAMPLE_MARKER}%`);

      // Net worth snapshots don't have marker but we can delete recent ones during sample period
      // Skip this to preserve user's real snapshots

      return { success: true };
    },
    onSuccess: () => {
      invalidateAllQueries(queryClient);
      toast.success(language === 'es' ? '¡Datos de ejemplo eliminados!' : 'Sample data deleted!');
    },
    onError: (error: any) => {
      console.error('Error deleting sample data:', error);
      toast.error(language === 'es' ? 'Error eliminando datos: ' + error.message : 'Error deleting data: ' + error.message);
    },
  });
}

function invalidateAllQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['clients'] });
  queryClient.invalidateQueries({ queryKey: ['projects'] });
  queryClient.invalidateQueries({ queryKey: ['expenses'] });
  queryClient.invalidateQueries({ queryKey: ['income'] });
  queryClient.invalidateQueries({ queryKey: ['mileage'] });
  queryClient.invalidateQueries({ queryKey: ['assets'] });
  queryClient.invalidateQueries({ queryKey: ['liabilities'] });
  queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
  queryClient.invalidateQueries({ queryKey: ['investment-goals'] });
  queryClient.invalidateQueries({ queryKey: ['savings-goals'] });
  queryClient.invalidateQueries({ queryKey: ['tags'] });
  queryClient.invalidateQueries({ queryKey: ['net-worth-snapshots'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  queryClient.invalidateQueries({ queryKey: ['notifications'] });
  queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
}
