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
      console.log('[SAMPLE DATA] Starting generation...');
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('[SAMPLE DATA] Auth error:', authError);
        throw new Error('Authentication error: ' + authError.message);
      }
      if (!user) {
        console.error('[SAMPLE DATA] No user found');
        throw new Error('No authenticated user');
      }
      
      console.log('[SAMPLE DATA] User authenticated:', user.id);

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

      console.log('[SAMPLE DATA] Creating clients...');
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .insert(clients.map(c => ({ ...c, user_id: userId })))
        .select();

      if (clientsError) {
        console.error('[SAMPLE DATA] Clients error:', clientsError);
        throw new Error('Error creating clients: ' + clientsError.message);
      }
      console.log('[SAMPLE DATA] Clients created:', clientsData?.length);

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
      // 13. CREATE SAMPLE CONTRACTS WITH REIMBURSEMENT TERMS
      // ============================================
      const contracts = [
        {
          file_name: `${SAMPLE_MARKER} TechCorp-Services-Agreement.pdf`,
          file_path: 'sample/techcorp-services.pdf',
          file_type: 'application/pdf',
          title: `${SAMPLE_MARKER} TechCorp Services Agreement`,
          client_id: clientsData[0].id,
          contract_type: 'services',
          status: 'ready' as const,
          value: 75000,
          start_date: new Date(today.getFullYear(), today.getMonth() - 2, 1).toISOString().split('T')[0],
          end_date: new Date(today.getFullYear(), today.getMonth() + 10, 30).toISOString().split('T')[0],
          auto_renew: true,
          renewal_notice_days: 30,
          description: 'Master services agreement for software development',
          user_notes: `${SAMPLE_MARKER} Me reembolsarán cualquier compra de materiales, herramientas, software o insumos necesarios para el proyecto. También cubren viajes y kilometraje para visitas al cliente. Comidas de trabajo están cubiertas al 100%.`,
          extracted_terms: {
            parties: ['TechCorp Solutions', 'Contractor'],
            effective_date: new Date(today.getFullYear(), today.getMonth() - 2, 1).toISOString().split('T')[0],
            termination_date: new Date(today.getFullYear(), today.getMonth() + 10, 30).toISOString().split('T')[0],
            payment_terms: 'Net 30 days from invoice date',
            key_clauses: [
              'All work product becomes property of TechCorp',
              'Confidentiality obligations for 5 years',
              'Expense reimbursement within 15 business days'
            ]
          },
          reimbursement_terms: {
            policies: [
              {
                category: 'software',
                reimbursable: true,
                percentage: 100,
                requires_approval: false,
                documentation: 'Receipt required',
                notes: 'Any software licenses or subscriptions needed for the project'
              },
              {
                category: 'equipment',
                reimbursable: true,
                percentage: 100,
                requires_approval: true,
                approval_threshold: 500,
                documentation: 'Receipt and purchase order required',
                notes: 'Hardware and equipment purchases over $500 require pre-approval'
              },
              {
                category: 'travel',
                reimbursable: true,
                percentage: 100,
                requires_approval: false,
                documentation: 'Receipts and itinerary',
                notes: 'Business class for flights over 4 hours'
              },
              {
                category: 'meals_entertainment',
                reimbursable: true,
                percentage: 100,
                requires_approval: false,
                max_per_day: 75,
                documentation: 'Receipt with attendees listed',
                notes: 'Business meals with client or team'
              },
              {
                category: 'mileage',
                reimbursable: true,
                rate_per_km: 0.70,
                documentation: 'Mileage log',
                notes: 'CRA 2024 rate for business travel'
              },
              {
                category: 'materials',
                reimbursable: true,
                percentage: 100,
                requires_approval: false,
                documentation: 'Receipt required',
                notes: 'Office supplies and project materials'
              }
            ],
            submission_deadline: 30,
            payment_method: 'Direct deposit with next invoice'
          },
          ai_processed_at: new Date().toISOString()
        },
        {
          file_name: `${SAMPLE_MARKER} CreativeDesign-Retainer-Contract.pdf`,
          file_path: 'sample/creative-retainer.pdf',
          file_type: 'application/pdf',
          title: `${SAMPLE_MARKER} Creative Design Monthly Retainer`,
          client_id: clientsData[1].id,
          contract_type: 'retainer',
          status: 'ready' as const,
          value: 36000,
          start_date: new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0],
          end_date: new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0],
          auto_renew: false,
          renewal_notice_days: 60,
          description: 'Annual retainer for design and marketing services',
          user_notes: `${SAMPLE_MARKER} Reembolso de materiales de diseño y subscripciones de software creativo. Viajes para sesiones de fotos están incluidos. NO reembolsan comidas excepto durante eventos.`,
          extracted_terms: {
            parties: ['Creative Design Studio', 'Contractor'],
            effective_date: new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0],
            termination_date: new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0],
            payment_terms: 'Monthly retainer due on 1st of each month',
            key_clauses: [
              'Minimum 20 hours per month',
              'Unused hours roll over for 2 months',
              'Materials and creative software reimbursed'
            ]
          },
          reimbursement_terms: {
            policies: [
              {
                category: 'software',
                reimbursable: true,
                percentage: 100,
                requires_approval: false,
                documentation: 'Receipt required',
                notes: 'Adobe Creative Cloud, Figma, and other design tools'
              },
              {
                category: 'materials',
                reimbursable: true,
                percentage: 100,
                requires_approval: true,
                approval_threshold: 200,
                documentation: 'Receipt and description',
                notes: 'Design materials, printing, prototypes'
              },
              {
                category: 'travel',
                reimbursable: true,
                percentage: 100,
                requires_approval: true,
                documentation: 'Receipts and prior approval email',
                notes: 'Only for approved photo shoots and events'
              },
              {
                category: 'meals_entertainment',
                reimbursable: false,
                notes: 'Not covered except during client events'
              }
            ],
            submission_deadline: 15,
            payment_method: 'Added to monthly invoice'
          },
          ai_processed_at: new Date().toISOString()
        }
      ];

      const { error: contractsError } = await supabase.from('contracts').insert(contracts.map(c => ({ ...c, user_id: userId })));
      if (contractsError) throw contractsError;

      // ============================================
      // 14. CREATE SAMPLE NOTIFICATIONS (diverse types)
      // ============================================
      console.log('[SAMPLE DATA] Creating notifications...');
      const notifications = [
        // Goal notifications
        { type: 'goal_milestone', title: `${SAMPLE_MARKER} ¡Meta al 75%!`, message: 'Tu fondo de emergencia está al 73% de completarse. ¡Sigue así!', read: false, action_url: '/dashboard' },
        { type: 'goal_deadline', title: `${SAMPLE_MARKER} Meta próxima a vencer`, message: 'Tu meta "Vacaciones" vence en 7 días. Faltan $2,200 por alcanzar.', read: false, action_url: '/dashboard' },
        
        // Achievement notifications
        { type: 'achievement', title: `${SAMPLE_MARKER} 🏆 ¡Nuevo logro desbloqueado!`, message: 'Desbloqueaste "Primer Objetivo" por crear tu primera meta de ahorro.', read: true, action_url: '/notifications' },
        { type: 'achievement', title: `${SAMPLE_MARKER} 🔥 Racha de 7 días`, message: '¡Has registrado gastos por 7 días consecutivos! Tu organización es admirable.', read: false, action_url: '/expenses' },
        
        // Expense reminders
        { type: 'reminder', title: `${SAMPLE_MARKER} Gastos pendientes`, message: 'Tienes 3 gastos pendientes de clasificación. Revísalos para mantener tus registros al día.', read: false, action_url: '/expenses?incomplete=true' },
        { type: 'reminder', title: `${SAMPLE_MARKER} Recibos sin revisar`, message: 'Hay 2 recibos capturados esperando tu revisión en el Inbox.', read: false, action_url: '/chaos' },
        
        // Contract notifications
        { type: 'contract', title: `${SAMPLE_MARKER} Contrato analizado`, message: 'El contrato de TechCorp ha sido analizado. Se detectaron términos de reembolso para software, viajes y materiales.', read: false, action_url: '/contracts' },
        { type: 'contract', title: `${SAMPLE_MARKER} Contrato próximo a renovar`, message: 'El contrato con Creative Design vence en 60 días. Revisa los términos de renovación.', read: true, action_url: '/contracts' },
        
        // Tax reminders
        { type: 'tax', title: `${SAMPLE_MARKER} 📅 Recordatorio fiscal`, message: 'La fecha límite para declaración de impuestos personales (T1) es el 30 de abril. Prepara tus documentos.', read: false, action_url: '/tax-calendar' },
        { type: 'tax', title: `${SAMPLE_MARKER} GST/HST trimestral`, message: 'El trimestre Q1 finaliza pronto. Recuerda presentar tu declaración GST/HST antes del 30 de abril.', read: false, action_url: '/tax-calendar' },
        
        // Financial insights
        { type: 'insight', title: `${SAMPLE_MARKER} 💡 Oportunidad de ahorro`, message: 'Detectamos $156 en subscripciones recurrentes este mes. ¿Revisas si todas son necesarias?', read: false, action_url: '/banking' },
        { type: 'insight', title: `${SAMPLE_MARKER} Gasto inusual detectado`, message: 'Tu gasto en "Comidas" este mes es 45% mayor que el promedio. Revisa los detalles.', read: false, action_url: '/expenses' },
        
        // Mentorship/Education
        { type: 'education', title: `${SAMPLE_MARKER} 📚 Continúa tu lectura`, message: 'Llevas 3 días sin registrar progreso en "Rich Dad Poor Dad". ¡No pierdas el hábito!', read: false, action_url: '/mentorship' },
        { type: 'tip', title: `${SAMPLE_MARKER} Consejo del día`, message: '"Los ricos adquieren activos. Los pobres y la clase media adquieren pasivos que creen son activos." - Robert Kiyosaki', read: true },
        
        // System notifications
        { type: 'system', title: `${SAMPLE_MARKER} Bienvenido a EvoFinz`, message: '¡Gracias por unirte! Explora los datos de ejemplo para conocer todas las funcionalidades.', read: true, action_url: '/dashboard' },
      ];

      const { error: notifError } = await supabase.from('notifications').insert(notifications.map(n => ({ ...n, user_id: userId })));
      if (notifError) console.warn('[SAMPLE DATA] Notifications error (non-critical):', notifError);

      // ============================================
      // 15. CREATE FINANCIAL HABITS (for Habit Tracker)
      // ============================================
      console.log('[SAMPLE DATA] Creating financial habits...');
      const financialHabits = [
        { habit_name: `${SAMPLE_MARKER} Review daily expenses`, habit_description: 'Spend 5 minutes reviewing today\'s spending', frequency: 'daily', target_per_period: 1, current_streak: 7, best_streak: 14, xp_reward: 15, is_active: true },
        { habit_name: `${SAMPLE_MARKER} Pay yourself first`, habit_description: 'Transfer 20% of income to savings before spending', frequency: 'monthly', target_per_period: 1, current_streak: 3, best_streak: 5, xp_reward: 50, is_active: true },
        { habit_name: `${SAMPLE_MARKER} Read financial book`, habit_description: 'Read at least 10 pages of a financial education book', frequency: 'daily', target_per_period: 10, current_streak: 4, best_streak: 21, xp_reward: 20, is_active: true },
        { habit_name: `${SAMPLE_MARKER} Review investment goals`, habit_description: 'Check progress on investment and savings goals', frequency: 'weekly', target_per_period: 1, current_streak: 2, best_streak: 8, xp_reward: 25, is_active: true },
      ];

      const { data: habitsData, error: habitsError } = await supabase
        .from('financial_habits')
        .insert(financialHabits.map(h => ({ ...h, user_id: userId })))
        .select();
      if (habitsError) console.warn('[SAMPLE DATA] Habits error:', habitsError);

      // Create habit logs for the last 7 days
      if (habitsData && habitsData.length > 0) {
        const habitLogs = [];
        for (let i = 0; i < 7; i++) {
          const logDate = new Date(today);
          logDate.setDate(logDate.getDate() - i);
          habitLogs.push({
            user_id: userId,
            habit_id: habitsData[0].id, // Daily expense review habit
            completed_at: logDate.toISOString(),
            notes: i === 0 ? `${SAMPLE_MARKER} Reviewed $${(Math.random() * 200 + 50).toFixed(2)} in daily spending` : null
          });
        }
        await supabase.from('financial_habit_logs').insert(habitLogs);
      }

      // ============================================
      // 16. CREATE FINANCIAL JOURNAL ENTRIES
      // ============================================
      console.log('[SAMPLE DATA] Creating journal entries...');
      const journalEntries = [
        { entry_type: 'reflection', content: `${SAMPLE_MARKER} Today I realized I've been spending too much on subscription services. Need to review and cancel unused ones.`, mood: 'thoughtful', lessons_learned: 'Small recurring expenses add up quickly over the year', entry_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).toISOString().split('T')[0] },
        { entry_type: 'gratitude', content: `${SAMPLE_MARKER} Grateful for the new client project! This will significantly boost my quarterly income.`, mood: 'happy', entry_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3).toISOString().split('T')[0] },
        { entry_type: 'decision', content: `${SAMPLE_MARKER} Decided to increase my monthly RRSP contribution from $500 to $750. Tax benefits plus compound growth!`, mood: 'motivated', lessons_learned: 'Automating savings removes the temptation to spend', entry_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7).toISOString().split('T')[0] },
        { entry_type: 'lesson', content: `${SAMPLE_MARKER} Read chapter 5 of Rich Dad Poor Dad. Key insight: Focus on building assets that generate passive income.`, mood: 'inspired', lessons_learned: 'Assets put money in your pocket; liabilities take money out', entry_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10).toISOString().split('T')[0] },
        { entry_type: 'reflection', content: `${SAMPLE_MARKER} Reviewed my expense categories this month. Food spending is 15% over budget - need to meal prep more.`, mood: 'determined', lessons_learned: 'Tracking expenses reveals patterns invisible to memory', entry_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 14).toISOString().split('T')[0] },
      ];

      const { error: journalError } = await supabase.from('financial_journal').insert(journalEntries.map(j => ({ ...j, user_id: userId })));
      if (journalError) console.warn('[SAMPLE DATA] Journal error:', journalError);

      // ============================================
      // 17. CREATE FINANCIAL EDUCATION RESOURCES
      // ============================================
      console.log('[SAMPLE DATA] Creating education resources...');
      const educationResources = [
        { title: `${SAMPLE_MARKER} Rich Dad Poor Dad`, author: 'Robert Kiyosaki', resource_type: 'book', category: 'mindset', total_pages: 336, pages_read: 248, progress_percentage: 74, daily_goal_pages: 15, status: 'in_progress', started_date: new Date(today.getFullYear(), today.getMonth() - 1, 10).toISOString().split('T')[0], key_lessons: 'Assets vs liabilities, cash flow quadrant, financial education importance', notes: 'Essential reading for understanding wealth building mindset' },
        { title: `${SAMPLE_MARKER} The Intelligent Investor`, author: 'Benjamin Graham', resource_type: 'book', category: 'investing', total_pages: 640, pages_read: 640, progress_percentage: 100, status: 'completed', started_date: new Date(today.getFullYear(), today.getMonth() - 3, 1).toISOString().split('T')[0], completed_date: new Date(today.getFullYear(), today.getMonth() - 1, 15).toISOString().split('T')[0], impact_rating: 5, key_lessons: 'Value investing, margin of safety, Mr. Market concept' },
        { title: `${SAMPLE_MARKER} Financial Freedom Course`, resource_type: 'course', category: 'planning', total_minutes: 480, minutes_consumed: 320, progress_percentage: 67, daily_goal_minutes: 30, status: 'in_progress', url: 'https://example.com/course' },
        { title: `${SAMPLE_MARKER} The Psychology of Money`, author: 'Morgan Housel', resource_type: 'book', category: 'mindset', total_pages: 256, pages_read: 0, progress_percentage: 0, status: 'not_started', notes: 'Next on my reading list' },
      ];

      const { data: eduData, error: eduError } = await supabase
        .from('financial_education')
        .insert(educationResources.map(e => ({ ...e, user_id: userId })))
        .select();
      if (eduError) console.warn('[SAMPLE DATA] Education error:', eduError);

      // Create daily reading logs
      if (eduData && eduData.length > 0) {
        const dailyLogs = [];
        for (let i = 0; i < 14; i++) {
          const logDate = new Date(today);
          logDate.setDate(logDate.getDate() - i);
          dailyLogs.push({
            user_id: userId,
            resource_id: eduData[0].id, // Rich Dad Poor Dad
            log_date: logDate.toISOString().split('T')[0],
            pages_read: Math.floor(Math.random() * 20) + 5,
            minutes_consumed: Math.floor(Math.random() * 40) + 15,
            notes: i % 3 === 0 ? `${SAMPLE_MARKER} Great chapter on ${['assets', 'cash flow', 'financial literacy', 'investing'][i % 4]}` : null
          });
        }
        await supabase.from('education_daily_logs').insert(dailyLogs);
      }

      // ============================================
      // 18. CREATE PAY YOURSELF FIRST SETTINGS
      // ============================================
      console.log('[SAMPLE DATA] Creating PYF settings...');
      const pyfSettings = {
        user_id: userId,
        target_percentage: 20,
        current_month_saved: 850,
        current_month_income: 5500,
        streak_months: 3,
        best_streak_months: 5,
        last_payment_date: new Date(today.getFullYear(), today.getMonth(), 5).toISOString().split('T')[0]
      };

      const { error: pyfError } = await supabase.from('pay_yourself_first_settings').upsert(pyfSettings, { onConflict: 'user_id' });
      if (pyfError) console.warn('[SAMPLE DATA] PYF error:', pyfError);

      // ============================================
      // 19. CREATE USER FINANCIAL PROFILE
      // ============================================
      console.log('[SAMPLE DATA] Creating financial profile...');
      const financialProfile = {
        user_id: userId,
        risk_tolerance: 'moderate',
        time_availability: 'part_time',
        preferred_income_type: 'mixed',
        financial_education_level: 'intermediate',
        available_capital: 25000,
        monthly_investment_capacity: 1500,
        passions: ['technology', 'real estate', 'entrepreneurship'],
        talents: ['programming', 'analysis', 'communication'],
        interests: ['stocks', 'crypto', 'rental properties']
      };

      const { error: profileError } = await supabase.from('user_financial_profile').upsert(financialProfile, { onConflict: 'user_id' });
      if (profileError) console.warn('[SAMPLE DATA] Profile error:', profileError);

      // ============================================
      // 20. CREATE USER FINANCIAL LEVEL (Gamification)
      // ============================================
      console.log('[SAMPLE DATA] Creating gamification level...');
      const financialLevel = {
        user_id: userId,
        level: 5,
        experience_points: 2450,
        total_savings: 15000,
        total_investments: 45000,
        streak_days: 12,
        last_activity_date: today.toISOString().split('T')[0]
      };

      const { error: levelError } = await supabase.from('user_financial_level').upsert(financialLevel, { onConflict: 'user_id' });
      if (levelError) console.warn('[SAMPLE DATA] Level error:', levelError);

      // ============================================
      // 21. CREATE USER ACHIEVEMENTS
      // ============================================
      console.log('[SAMPLE DATA] Creating achievements...');
      const achievements = [
        { achievement_key: 'first_expense', progress: 100, unlocked_at: new Date(today.getFullYear(), today.getMonth() - 2, 1).toISOString() },
        { achievement_key: 'expense_master_10', progress: 100, unlocked_at: new Date(today.getFullYear(), today.getMonth() - 1, 15).toISOString() },
        { achievement_key: 'first_goal_complete', progress: 100, unlocked_at: new Date(today.getFullYear(), today.getMonth() - 1, 20).toISOString() },
        { achievement_key: 'savings_streak_7', progress: 100, unlocked_at: new Date(today.getFullYear(), today.getMonth(), 1).toISOString() },
        { achievement_key: 'budget_master', progress: 65 }, // In progress
        { achievement_key: 'investment_beginner', progress: 40 }, // In progress
      ];

      const { error: achError } = await supabase.from('user_achievements').insert(achievements.map(a => ({ ...a, user_id: userId })));
      if (achError) console.warn('[SAMPLE DATA] Achievements error:', achError);

      console.log('[SAMPLE DATA] ✅ All sample data created successfully!');
      return { success: true };
    },
    onMutate: () => {
      toast.loading(language === 'es' ? 'Generando datos de ejemplo...' : 'Generating sample data...', { id: 'sample-data-gen' });
    },
    onSuccess: () => {
      toast.dismiss('sample-data-gen');
      invalidateAllQueries(queryClient);
      toast.success(language === 'es' ? '¡Datos de ejemplo generados! (2 clientes, 4 proyectos, 20 gastos, 12 ingresos, y más)' : 'Sample data generated! (2 clients, 4 projects, 20 expenses, 12 incomes, and more)');
    },
    onError: (error: any) => {
      toast.dismiss('sample-data-gen');
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

      // 7. Delete contracts (may reference clients)
      await supabase.from('contracts').delete().eq('user_id', userId).like('file_name', `%${SAMPLE_MARKER}%`);

      // 8. Delete projects
      await supabase.from('projects').delete().eq('user_id', userId).like('name', `%${SAMPLE_MARKER}%`);

      // 9. Delete clients
      await supabase.from('clients').delete().eq('user_id', userId).like('name', `%${SAMPLE_MARKER}%`);

      // 10. Delete other sample data
      await supabase.from('assets').delete().eq('user_id', userId).like('name', `%${SAMPLE_MARKER}%`);
      await supabase.from('liabilities').delete().eq('user_id', userId).like('name', `%${SAMPLE_MARKER}%`);
      await supabase.from('investment_goals').delete().eq('user_id', userId).like('name', `%${SAMPLE_MARKER}%`);
      await supabase.from('savings_goals').delete().eq('user_id', userId).like('name', `%${SAMPLE_MARKER}%`);
      await supabase.from('tags').delete().eq('user_id', userId).like('name', `%${SAMPLE_MARKER}%`);
      await supabase.from('notifications').delete().eq('user_id', userId).like('title', `%${SAMPLE_MARKER}%`);

      // 11. Delete new sample data tables
      // Financial habits and logs
      const { data: sampleHabits } = await supabase
        .from('financial_habits')
        .select('id')
        .eq('user_id', userId)
        .like('habit_name', `%${SAMPLE_MARKER}%`);
      
      if (sampleHabits && sampleHabits.length > 0) {
        const habitIds = sampleHabits.map(h => h.id);
        await supabase.from('financial_habit_logs').delete().in('habit_id', habitIds);
      }
      await supabase.from('financial_habits').delete().eq('user_id', userId).like('habit_name', `%${SAMPLE_MARKER}%`);

      // Financial journal
      await supabase.from('financial_journal').delete().eq('user_id', userId).like('content', `%${SAMPLE_MARKER}%`);

      // Financial education and daily logs
      const { data: sampleEdu } = await supabase
        .from('financial_education')
        .select('id')
        .eq('user_id', userId)
        .like('title', `%${SAMPLE_MARKER}%`);
      
      if (sampleEdu && sampleEdu.length > 0) {
        const eduIds = sampleEdu.map(e => e.id);
        await supabase.from('education_daily_logs').delete().in('resource_id', eduIds);
      }
      await supabase.from('financial_education').delete().eq('user_id', userId).like('title', `%${SAMPLE_MARKER}%`);

      // User achievements (delete sample ones by checking unlocked_at dates or just leave them)
      // Since achievements don't have SAMPLE_MARKER in key, we skip to avoid deleting real achievements

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

export function useDeleteSampleDataBySection() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: async (sections: string[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const userId = user.id;
      const SAMPLE_MARKER = '[SAMPLE]';

      for (const section of sections) {
        console.log(`[SAMPLE DATA] Deleting section: ${section}`);
        
        switch (section) {
          case 'clients':
            // First delete dependent records
            const { data: clientExpenses } = await supabase
              .from('expenses')
              .select('id')
              .eq('user_id', userId)
              .like('description', `%${SAMPLE_MARKER}%`);
            if (clientExpenses && clientExpenses.length > 0) {
              await supabase.from('expense_tags').delete().in('expense_id', clientExpenses.map(e => e.id));
            }
            await supabase.from('expenses').delete().eq('user_id', userId).like('description', `%${SAMPLE_MARKER}%`);
            await supabase.from('income').delete().eq('user_id', userId).like('description', `%${SAMPLE_MARKER}%`);
            await supabase.from('mileage').delete().eq('user_id', userId).like('route', `%${SAMPLE_MARKER}%`);
            await supabase.from('contracts').delete().eq('user_id', userId).like('file_name', `%${SAMPLE_MARKER}%`);
            const { data: sampleProjects } = await supabase.from('projects').select('id').eq('user_id', userId).like('name', `%${SAMPLE_MARKER}%`);
            if (sampleProjects && sampleProjects.length > 0) {
              await supabase.from('project_clients').delete().in('project_id', sampleProjects.map(p => p.id));
            }
            await supabase.from('projects').delete().eq('user_id', userId).like('name', `%${SAMPLE_MARKER}%`);
            await supabase.from('clients').delete().eq('user_id', userId).like('name', `%${SAMPLE_MARKER}%`);
            break;
            
          case 'projects':
            const { data: projData } = await supabase.from('projects').select('id').eq('user_id', userId).like('name', `%${SAMPLE_MARKER}%`);
            if (projData && projData.length > 0) {
              await supabase.from('project_clients').delete().in('project_id', projData.map(p => p.id));
            }
            await supabase.from('projects').delete().eq('user_id', userId).like('name', `%${SAMPLE_MARKER}%`);
            break;
            
          case 'expenses':
            const { data: expData } = await supabase.from('expenses').select('id').eq('user_id', userId).like('description', `%${SAMPLE_MARKER}%`);
            if (expData && expData.length > 0) {
              await supabase.from('expense_tags').delete().in('expense_id', expData.map(e => e.id));
            }
            await supabase.from('expenses').delete().eq('user_id', userId).like('description', `%${SAMPLE_MARKER}%`);
            break;
            
          case 'income':
            await supabase.from('income').delete().eq('user_id', userId).like('description', `%${SAMPLE_MARKER}%`);
            break;
            
          case 'mileage':
            await supabase.from('mileage').delete().eq('user_id', userId).like('route', `%${SAMPLE_MARKER}%`);
            break;
            
          case 'assets':
            await supabase.from('assets').delete().eq('user_id', userId).like('name', `%${SAMPLE_MARKER}%`);
            break;
            
          case 'liabilities':
            await supabase.from('liabilities').delete().eq('user_id', userId).like('name', `%${SAMPLE_MARKER}%`);
            break;
            
          case 'goals':
            await supabase.from('investment_goals').delete().eq('user_id', userId).like('name', `%${SAMPLE_MARKER}%`);
            await supabase.from('savings_goals').delete().eq('user_id', userId).like('name', `%${SAMPLE_MARKER}%`);
            break;
            
          case 'contracts':
            await supabase.from('contracts').delete().eq('user_id', userId).like('file_name', `%${SAMPLE_MARKER}%`);
            break;
            
          case 'notifications':
            await supabase.from('notifications').delete().eq('user_id', userId).like('title', `%${SAMPLE_MARKER}%`);
            break;
            
          case 'education':
            const { data: eduData } = await supabase.from('financial_education').select('id').eq('user_id', userId).like('title', `%${SAMPLE_MARKER}%`);
            if (eduData && eduData.length > 0) {
              await supabase.from('education_daily_logs').delete().in('resource_id', eduData.map(e => e.id));
            }
            await supabase.from('financial_education').delete().eq('user_id', userId).like('title', `%${SAMPLE_MARKER}%`);
            break;
            
          case 'bank_transactions':
            await supabase.from('bank_transactions').delete().eq('user_id', userId).like('description', `%${SAMPLE_MARKER}%`);
            break;
        }
      }

      return { success: true, deletedSections: sections };
    },
    onSuccess: (data) => {
      invalidateAllQueries(queryClient);
      toast.success(
        language === 'es' 
          ? `¡${data.deletedSections.length} secciones eliminadas!` 
          : `${data.deletedSections.length} sections deleted!`
      );
    },
    onError: (error: any) => {
      console.error('Error deleting sample data by section:', error);
      toast.error(language === 'es' ? 'Error eliminando datos: ' + error.message : 'Error deleting data: ' + error.message);
    },
  });
}

function invalidateAllQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['clients'] });
  queryClient.invalidateQueries({ queryKey: ['projects'] });
  queryClient.invalidateQueries({ queryKey: ['contracts'] });
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
  // New queries
  queryClient.invalidateQueries({ queryKey: ['financial-habits'] });
  queryClient.invalidateQueries({ queryKey: ['financial-journal'] });
  queryClient.invalidateQueries({ queryKey: ['financial-education'] });
  queryClient.invalidateQueries({ queryKey: ['pay-yourself-first'] });
  queryClient.invalidateQueries({ queryKey: ['financial-profile'] });
  queryClient.invalidateQueries({ queryKey: ['financial-level'] });
  queryClient.invalidateQueries({ queryKey: ['achievements'] });
  queryClient.invalidateQueries({ queryKey: ['education-daily-logs'] });
}
