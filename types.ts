export interface StockMetric {
  label: string;
  value: string | number;
  benchmark: string | number; // e.g., Industry Avg
  signal: 'undervalued' | 'overvalued' | 'neutral';
  explanation: string;
}

export interface StockReportData {
  symbol: string;
  companyName: string;
  currentPrice: string;
  recommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
  valuationStatus: 'Undervalued' | 'Overvalued' | 'Fairly Valued';
  confidenceScore: number; // 0-100
  summary: string;
  metrics: StockMetric[];
  riskFactors: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isReport?: boolean;
  reportData?: StockReportData;
  isLoading?: boolean;
  groundingUrls?: Array<{ title: string; uri: string }>;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  lastModified: number;
}