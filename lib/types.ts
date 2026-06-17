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
    stability: number;
    expat?: number;
    safety: number;
  };
  aiInsight: string;
  /** Set by the server: true when this card is locked (free tier, not the #1 match). */
  locked?: boolean;
}

export interface UserPriorities {
  tax: number;
  housing: number;
  /** Legacy field — climate scoring uses lifestyle tags, not this slider. */
  climate: number;
  health: number;
  stability: number;
  safety: number;
  expat_community: number;
  visa_residency: number;
}

export interface AnalyzeRequest {
  monthlyBudget: number;
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
