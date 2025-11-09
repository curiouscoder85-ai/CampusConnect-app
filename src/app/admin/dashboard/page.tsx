import { DashboardStatCard } from '@/components/dashboard-stat-card';
import { users, courses } from '@/lib/mock-data';
import { Users, BookOpen, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function AdminDashboardPage() {
  const totalUsers = users.length;
  const totalCourses = courses.length;
  const pendingCourses = courses.filter((c) => c.status === 'pending').length;

  const chartData = [
    { name: 'Students', count: users.filter(u => u.role === 'student').length, fill: 'hsl(var(--chart-1))' },
    { name: 'Teachers', count: users.filter(u => u.role === 'teacher').length, fill: 'hsl(var(--chart-2))' },
    { name: 'Admins', count: users.filter(u => u.role === 'admin').length, fill: 'hsl(var(--chart-4))' },
  ];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DashboardStatCard
          title="Total Users"
          value={String(totalUsers)}
          icon={Users}
          description="All user accounts on the platform"
        />
        <DashboardStatCard
          title="Total Courses"
          value={String(totalCourses)}
          icon={BookOpen}
          description="All courses created on the platform"
        />
        <DashboardStatCard
          title="Pending Approvals"
          value={String(pendingCourses)}
          icon={Clock}
          description="Courses awaiting admin review"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">User Roles Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '14px' }} />
              <Bar dataKey="count" name="Number of Users" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
