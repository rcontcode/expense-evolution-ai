import { Layout } from '@/components/Layout';
import { BankAnalysisDashboard } from '@/components/banking/BankAnalysisDashboard';
import { MentorQuoteBanner } from '@/components/MentorQuoteBanner';

export default function Banking() {
  return (
    <Layout>
      <div className="p-8 space-y-6">
        <MentorQuoteBanner context="dashboard" className="mb-2" />
        <BankAnalysisDashboard />
      </div>
    </Layout>
  );
}
