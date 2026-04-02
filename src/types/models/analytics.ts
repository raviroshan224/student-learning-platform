export interface AnalyticsDashboard {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  activeUsers: number;
  newUsersThisMonth: number;
  enrollmentsThisMonth: number;
  revenueThisMonth: number;
  topCourses: Array<{
    id: string;
    title: string;
    enrollmentCount: number;
    revenue: number;
  }>;
  enrollmentTrend: Array<{
    date: string;
    count: number;
  }>;
  revenueTrend: Array<{
    date: string;
    amount: number;
  }>;
}
