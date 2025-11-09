'use client';

import { DashboardStatCard } from '@/components/dashboard-stat-card';
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
import { useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useMemo } from 'react';

export default function AdminDashboardPage() {
  const firestore = useFirestore();

  const usersQuery = useMemo(() => collection(firestore, 'users'), [firestore]);
  const coursesQuery = useMemo(() => collection(firestore, 'courses'), [firestore]);
  const pendingCoursesQuery = useMemo(() => query(collection(firestore, 'courses'), where('status', '==', 'pending')), [firestore]);

  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);
  const { data: courses, isLoading: coursesLoading } = useCollection(coursesQuery);
  const { data: pendingCourses, isLoading: pendingCoursesLoading } = useCollection(pendingCoursesQuery);


  const totalUsers = users?.length ?? 0;
  const totalCourses = courses?.length ?? 0;
  const pendingCoursesCount = pendingCourses?.length ?? 0;

  const chartData = [
    { name: 'Students', count: users?.filter(u => u.role === 'student').length ?? 0, fill: 'hsl(var(--chart-1))' },
    { name: 'Teachers', count: users?.filter(u => u.role === 'teacher').length ?? 0, fill: 'hsl(var(--chart-2))' },
    { name: 'Admins', count: users?.filter(u => u.role === 'admin').length ?? 0, fill: 'hsl(var(--chart-4))' },
  ];
  const loading = usersLoading || coursesLoading || pendingCoursesLoading;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DashboardStatCard
          title="Total Users"
          value={String(totalUsers)}
          icon={Users}
          description="All user accounts on the platform"
          isLoading={loading}
        />
        <DashboardStatCard
          title="Total Courses"
          value={String(totalCourses)}
          icon={BookOpen}
          description="All courses created on the platform"
          isLoading={loading}
        />
        <DashboardStatCard
          title="Pending Approvals"
          value={String(pendingCoursesCount)}
          icon={Clock}
          description="Courses awaiting admin review"
          isLoading={loading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">User Roles Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            {loading ? <div className="h-full w-full flex items-center justify-center">Loading...</div> : (
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
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
