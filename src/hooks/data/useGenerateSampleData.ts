import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export function useGenerateSampleData() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const userId = user.id;
      const today = new Date();
      
      // 1. Create sample clients
      const clients = [
        { name: 'TechCorp Inc.', industry: 'technology', client_type: 'corporate', contact_email: 'contact@techcorp.com', payment_terms: 30, province: 'Ontario', country: 'Canada' },
        { name: 'Design Studio Pro', industry: 'creative_services', client_type: 'private', contact_email: 'hello@designpro.com', payment_terms: 15, province: 'British Columbia', country: 'Canada' },
        { name: 'Green Energy Solutions', industry: 'energy', client_type: 'corporate', contact_email: 'info@greenenergy.ca', payment_terms: 45, province: 'Alberta', country: 'Canada' },
        { name: 'Local Restaurant Group', industry: 'food_beverage', client_type: 'private', contact_email: 'orders@localfood.com', payment_terms: 30, province: 'Quebec', country: 'Canada' },
      ];

      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .insert(clients.map(c => ({ ...c, user_id: userId })))
        .select();

      if (clientsError) throw clientsError;

      // 2. Create sample projects
      const projects = [
        { name: 'Website Redesign', description: 'Complete website overhaul', status: 'active', budget: 25000, color: '#3B82F6', client_id: clientsData[0].id },
        { name: 'Mobile App Development', description: 'iOS and Android app', status: 'active', budget: 50000, color: '#10B981', client_id: clientsData[0].id },
        { name: 'Brand Identity', description: 'Logo and brand guidelines', status: 'completed', budget: 8000, color: '#8B5CF6', client_id: clientsData[1].id },
        { name: 'Marketing Campaign', description: 'Q1 digital marketing', status: 'active', budget: 15000, color: '#F59E0B', client_id: clientsData[2].id },
      ];

      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .insert(projects.map(p => ({ ...p, user_id: userId })))
        .select();

      if (projectsError) throw projectsError;

      // 3. Create sample expenses (various categories and dates)
      const expenseCategories = ['office_supplies', 'software', 'travel', 'meals_entertainment', 'equipment', 'advertising', 'professional_services', 'utilities'];
      const vendors = ['Amazon', 'Staples', 'Adobe', 'Microsoft', 'Air Canada', 'Uber', 'Restaurant XYZ', 'Google Ads', 'Bell Canada', 'Best Buy'];
      
      const expenses = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - Math.floor(Math.random() * 90));
        const clientIndex = Math.floor(Math.random() * clientsData.length);
        const projectIndex = Math.floor(Math.random() * projectsData.length);
        
        expenses.push({
          user_id: userId,
          date: date.toISOString().split('T')[0],
          amount: Math.round((Math.random() * 500 + 20) * 100) / 100,
          vendor: vendors[Math.floor(Math.random() * vendors.length)],
          category: expenseCategories[Math.floor(Math.random() * expenseCategories.length)],
          description: `Sample expense #${i + 1}`,
          client_id: Math.random() > 0.3 ? clientsData[clientIndex].id : null,
          project_id: Math.random() > 0.4 ? projectsData[projectIndex].id : null,
          status: ['pending', 'classified', 'deductible', 'reimbursable'][Math.floor(Math.random() * 4)],
          reimbursement_type: ['pending_classification', 'client_reimbursable', 'cra_deductible', 'personal'][Math.floor(Math.random() * 4)],
        });
      }

      const { error: expensesError } = await supabase.from('expenses').insert(expenses);
      if (expensesError) throw expensesError;

      // 4. Create sample income
      const incomeTypes = ['client_payment', 'salary', 'freelance', 'investment_stocks', 'passive_rental'];
      const incomeEntries = [];
      for (let i = 0; i < 15; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - Math.floor(Math.random() * 90));
        const clientIndex = Math.floor(Math.random() * clientsData.length);
        
        incomeEntries.push({
          user_id: userId,
          date: date.toISOString().split('T')[0],
          amount: Math.round((Math.random() * 5000 + 500) * 100) / 100,
          income_type: incomeTypes[Math.floor(Math.random() * incomeTypes.length)],
          source: ['Project payment', 'Consulting', 'Dividends', 'Rent', 'Contract work'][Math.floor(Math.random() * 5)],
          description: `Income entry #${i + 1}`,
          client_id: Math.random() > 0.4 ? clientsData[clientIndex].id : null,
          is_taxable: Math.random() > 0.2,
          recurrence: ['one_time', 'monthly', 'weekly'][Math.floor(Math.random() * 3)],
        });
      }

      const { error: incomeError } = await supabase.from('income').insert(incomeEntries);
      if (incomeError) throw incomeError;

      // 5. Create sample mileage
      const mileageEntries = [];
      const routes = ['Home to Client Office', 'Office to Airport', 'Client A to Client B', 'Downtown Meeting', 'Site Visit'];
      for (let i = 0; i < 10; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - Math.floor(Math.random() * 60));
        
        mileageEntries.push({
          user_id: userId,
          date: date.toISOString().split('T')[0],
          kilometers: Math.round((Math.random() * 100 + 10) * 10) / 10,
          route: routes[Math.floor(Math.random() * routes.length)],
          purpose: ['Client meeting', 'Site inspection', 'Delivery', 'Business travel'][Math.floor(Math.random() * 4)],
          client_id: clientsData[Math.floor(Math.random() * clientsData.length)].id,
        });
      }

      const { error: mileageError } = await supabase.from('mileage').insert(mileageEntries);
      if (mileageError) throw mileageError;

      // 6. Create sample assets
      const assets = [
        { name: 'TFSA Investments', category: 'investments', current_value: 45000, is_liquid: true },
        { name: 'RRSP Portfolio', category: 'investments', current_value: 78000, is_liquid: false },
        { name: 'Bitcoin Holdings', category: 'bitcoin', current_value: 12000, is_liquid: true },
        { name: 'Ethereum', category: 'ethereum', current_value: 5000, is_liquid: true },
        { name: 'Business Checking', category: 'bank_accounts', current_value: 15000, is_liquid: true },
        { name: 'Emergency Fund', category: 'bank_accounts', current_value: 20000, is_liquid: true },
        { name: 'Office Equipment', category: 'business_assets', current_value: 8000, is_liquid: false, purchase_value: 12000 },
        { name: 'Company Vehicle', category: 'vehicles', current_value: 25000, is_liquid: false, purchase_value: 35000 },
      ];

      const { error: assetsError } = await supabase.from('assets').insert(assets.map(a => ({ ...a, user_id: userId })));
      if (assetsError) throw assetsError;

      // 7. Create sample liabilities
      const liabilities = [
        { name: 'Business Line of Credit', category: 'business_loan', original_amount: 50000, current_balance: 32000, interest_rate: 7.5, minimum_payment: 800 },
        { name: 'Vehicle Loan', category: 'auto_loan', original_amount: 35000, current_balance: 22000, interest_rate: 4.9, minimum_payment: 550 },
        { name: 'Credit Card - Business', category: 'credit_card', original_amount: 5000, current_balance: 3200, interest_rate: 19.99, minimum_payment: 100 },
        { name: 'Equipment Financing', category: 'personal_loan', original_amount: 15000, current_balance: 8500, interest_rate: 6.5, minimum_payment: 300 },
      ];

      const { error: liabilitiesError } = await supabase.from('liabilities').insert(liabilities.map(l => ({ ...l, user_id: userId })));
      if (liabilitiesError) throw liabilitiesError;

      // 8. Create sample bank transactions
      const bankTransactions = [];
      for (let i = 0; i < 40; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - Math.floor(Math.random() * 60));
        
        bankTransactions.push({
          user_id: userId,
          transaction_date: date.toISOString().split('T')[0],
          amount: Math.random() > 0.3 
            ? -Math.round((Math.random() * 300 + 10) * 100) / 100 
            : Math.round((Math.random() * 2000 + 100) * 100) / 100,
          description: ['INTERAC PURCHASE', 'DIRECT DEPOSIT', 'BILL PAYMENT', 'ATM WITHDRAWAL', 'E-TRANSFER', 'SUBSCRIPTION', 'PAYROLL'][Math.floor(Math.random() * 7)],
          status: ['unmatched', 'matched', 'ignored'][Math.floor(Math.random() * 3)],
        });
      }

      const { error: bankError } = await supabase.from('bank_transactions').insert(bankTransactions);
      if (bankError) throw bankError;

      // 9. Create sample investment goals
      const investmentGoals = [
        { name: 'Emergency Fund', goal_type: 'savings', target_amount: 30000, current_amount: 20000, color: '#10B981', risk_level: 'conservative' },
        { name: 'Retirement at 55', goal_type: 'early_retirement', target_amount: 1000000, current_amount: 123000, color: '#8B5CF6', risk_level: 'moderate', deadline: '2040-01-01' },
        { name: 'Passive Income $2K/month', goal_type: 'passive_income', target_amount: 500000, current_amount: 45000, monthly_target: 1500, color: '#F59E0B', risk_level: 'aggressive' },
        { name: 'House Down Payment', goal_type: 'house', target_amount: 150000, current_amount: 67000, color: '#3B82F6', risk_level: 'conservative', deadline: '2026-06-01' },
      ];

      const { error: goalsError } = await supabase.from('investment_goals').insert(investmentGoals.map(g => ({ ...g, user_id: userId })));
      if (goalsError) throw goalsError;

      // 10. Create sample tags
      const tags = [
        { name: 'Tax Deductible', color: '#10B981' },
        { name: 'Client Billable', color: '#3B82F6' },
        { name: 'Urgent', color: '#EF4444' },
        { name: 'Recurring', color: '#8B5CF6' },
        { name: 'Review Needed', color: '#F59E0B' },
      ];

      const { error: tagsError } = await supabase.from('tags').insert(tags.map(t => ({ ...t, user_id: userId })));
      if (tagsError) throw tagsError;

      // 11. Create net worth snapshot
      const { error: snapshotError } = await supabase.from('net_worth_snapshots').insert({
        user_id: userId,
        snapshot_date: today.toISOString().split('T')[0],
        total_assets: 208000,
        total_liabilities: 65700,
        net_worth: 142300,
      });
      if (snapshotError) throw snapshotError;

      return { success: true };
    },
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['income'] });
      queryClient.invalidateQueries({ queryKey: ['mileage'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['liabilities'] });
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['investment-goals'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['net-worth-snapshots'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      toast.success(language === 'es' ? '¡Datos de ejemplo generados!' : 'Sample data generated!');
    },
    onError: (error: any) => {
      console.error('Error generating sample data:', error);
      toast.error(language === 'es' ? 'Error generando datos' : 'Error generating data');
    },
  });
}
