export interface CityResult {
  name: string;
  country: string;
  continent: string;
  flag: string;
  score: number;
  taxRate: number;
  monthlyRent: number;
  monthlyCost: number;
  takeHomeMonthly: number;
  monthlySavings: number;
  pros: string[];
  cons: string[];
  tags: string[];
  visa: string;
  scores: {
    tax: number;
    housing: number;
    climate: number;
    health: number;
    nightlife: number;
    safety: number;
  };
  aiInsight: string;
}

export interface UserPriorities {
  tax: number;
  housing: number;
  climate: number;
  health: number;
  nightlife: number;
  safety: number;
}

export interface AnalyzeRequest {
  salary: number;
  currency: string;
  priorities: UserPriorities;
  lifestyle: string[];
}

export interface Profile {
  id: string;
  email: string;
  plan: 'free' | 'pro' | 'lifetime';
  searches_this_month: number;
  stripe_customer_id?: string;
}
