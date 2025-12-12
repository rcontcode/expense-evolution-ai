import { useMemo } from 'react';
import { useAssets } from './useNetWorth';
import { useIncome } from './useIncome';

export interface PortfolioAsset {
  id: string;
  name: string;
  category: string;
  currentValue: number;
  purchaseValue: number;
  purchaseDate: string | null;
  returnAmount: number;
  returnPercentage: number;
  isLiquid: boolean;
}

export interface DiversificationData {
  category: string;
  value: number;
  percentage: number;
  color: string;
}

export interface DividendIncome {
  id: string;
  source: string;
  amount: number;
  date: string;
  type: string;
}

export interface PortfolioMetrics {
  totalValue: number;
  totalInvested: number;
  totalReturn: number;
  totalReturnPercentage: number;
  totalDividends: number;
  monthlyDividendAverage: number;
  yearlyDividendProjection: number;
  dividendYield: number;
  assets: PortfolioAsset[];
  diversification: DiversificationData[];
  dividendHistory: DividendIncome[];
  topPerformers: PortfolioAsset[];
  underperformers: PortfolioAsset[];
}

const CATEGORY_COLORS: Record<string, string> = {
  'stocks': 'hsl(142, 76%, 36%)',
  'crypto': 'hsl(38, 92%, 50%)',
  'bonds': 'hsl(221, 83%, 53%)',
  'real_estate': 'hsl(262, 83%, 58%)',
  'mutual_funds': 'hsl(330, 81%, 60%)',
  'etf': 'hsl(173, 80%, 40%)',
  'commodities': 'hsl(25, 95%, 53%)',
  'cash': 'hsl(210, 40%, 70%)',
  'other': 'hsl(0, 0%, 50%)',
};

export function usePortfolioTracker() {
  const { data: assets } = useAssets();
  const { data: income } = useIncome();

  const metrics = useMemo<PortfolioMetrics>(() => {
    // Filter investment assets (excluding properties, vehicles, etc.)
    const investmentCategories = ['stocks', 'crypto', 'bonds', 'mutual_funds', 'etf', 'commodities', 'investments'];
    const investmentAssets = assets?.filter(a => 
      investmentCategories.some(cat => a.category.toLowerCase().includes(cat)) ||
      a.category.toLowerCase().includes('investment')
    ) || [];

    // Calculate portfolio assets with returns
    const portfolioAssets: PortfolioAsset[] = investmentAssets.map(asset => {
      const purchaseValue = asset.purchase_value || asset.current_value;
      const returnAmount = asset.current_value - purchaseValue;
      const returnPercentage = purchaseValue > 0 ? (returnAmount / purchaseValue) * 100 : 0;

      return {
        id: asset.id,
        name: asset.name,
        category: asset.category,
        currentValue: asset.current_value,
        purchaseValue,
        purchaseDate: asset.purchase_date,
        returnAmount,
        returnPercentage,
        isLiquid: asset.is_liquid ?? true,
      };
    });

    // Calculate totals
    const totalValue = portfolioAssets.reduce((sum, a) => sum + a.currentValue, 0);
    const totalInvested = portfolioAssets.reduce((sum, a) => sum + a.purchaseValue, 0);
    const totalReturn = totalValue - totalInvested;
    const totalReturnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    // Filter dividend income
    const dividendTypes = ['investment_stocks', 'investment_crypto', 'investment_funds', 'passive_royalties'];
    const dividendIncomes = income?.filter(i => 
      dividendTypes.includes(i.income_type) || 
      i.description?.toLowerCase().includes('dividend') ||
      i.description?.toLowerCase().includes('dividendo')
    ) || [];

    const dividendHistory: DividendIncome[] = dividendIncomes.map(i => ({
      id: i.id,
      source: i.source || i.description || 'Unknown',
      amount: i.amount,
      date: i.date,
      type: i.income_type,
    }));

    // Calculate dividend metrics
    const totalDividends = dividendHistory.reduce((sum, d) => sum + d.amount, 0);
    const monthsWithDividends = new Set(dividendHistory.map(d => d.date.substring(0, 7))).size || 1;
    const monthlyDividendAverage = totalDividends / Math.max(monthsWithDividends, 1);
    const yearlyDividendProjection = monthlyDividendAverage * 12;
    const dividendYield = totalValue > 0 ? (yearlyDividendProjection / totalValue) * 100 : 0;

    // Calculate diversification
    const categoryTotals: Record<string, number> = {};
    portfolioAssets.forEach(asset => {
      const category = asset.category.toLowerCase();
      categoryTotals[category] = (categoryTotals[category] || 0) + asset.currentValue;
    });

    const diversification: DiversificationData[] = Object.entries(categoryTotals)
      .map(([category, value]) => ({
        category,
        value,
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
        color: CATEGORY_COLORS[category] || CATEGORY_COLORS['other'],
      }))
      .sort((a, b) => b.value - a.value);

    // Top performers and underperformers
    const sortedByReturn = [...portfolioAssets].sort((a, b) => b.returnPercentage - a.returnPercentage);
    const topPerformers = sortedByReturn.slice(0, 3).filter(a => a.returnPercentage > 0);
    const underperformers = sortedByReturn.slice(-3).filter(a => a.returnPercentage < 0).reverse();

    return {
      totalValue,
      totalInvested,
      totalReturn,
      totalReturnPercentage,
      totalDividends,
      monthlyDividendAverage,
      yearlyDividendProjection,
      dividendYield,
      assets: portfolioAssets,
      diversification,
      dividendHistory,
      topPerformers,
      underperformers,
    };
  }, [assets, income]);

  return metrics;
}
