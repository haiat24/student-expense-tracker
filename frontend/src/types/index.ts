
export interface RecentTransaction {
  id: number;
  title: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  category_name: string;
}

export interface DashboardData {
  period_month: number;
  period_year: number;
  total_income: number;
  total_expense: number;
  balance: number;
  recent_transactions: RecentTransaction[];
}
