'use client';

import { DashboardStatCard } from '@/components/dashboard-stat-card';
import { Users, BookOpen, Clock, PlusCircle, ShieldCheck, MessageSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useCollection } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import React from 'react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const coursesQuery = useMemoFirebase(() => collection(firestore, 'courses'), [firestore]);

  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);
  const { data: courses, isLoading: coursesLoading } = useCollection(coursesQuery);

  const { totalUsers, totalCourses, pendingCoursesCount, chartData, stats } = React.useMemo(() => {
    const totalUsers = users?.length ?? 0;
    const totalCourses = courses?.length ?? 0;
    const pendingCoursesCount = courses?.filter(c => c.status === 'pending').length ?? 0;
    
    const studentsCount = users?.filter(u => u.role === 'student').length ?? 0;
    const teachersCount = users?.filter(u => u.role === 'teacher').length ?? 0;
    const adminsCount = users?.filter(u => u.role === 'admin').length ?? 0;

    const chartData = [
      { name: 'Students', count: studentsCount, fill: 'hsl(var(--chart-1))' },
      { name: 'Teachers', count: teachersCount, fill: 'hsl(var(--chart-2))' },
      { name: 'Admins', count: adminsCount, fill: 'hsl(var(--chart-4))' },
    ];
    
    return { 
      totalUsers, 
      totalCourses, 
      pendingCoursesCount, 
      chartData,
      stats: {
        studentsCount,
        teachersCount,
        adminsCount
      }
    };
  }, [users, courses]);

  const loading = usersLoading || coursesLoading;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-headline text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Monitor platform growth and manage pending approvals.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DashboardStatCard
          title="Total Users"
          value={String(totalUsers)}
          icon={Users}
          description={`${stats.studentsCount} Students, ${stats.teachersCount} Teachers`}
          isLoading={loading}
        />
        <DashboardStatCard
          title="Total Courses"
          value={String(totalCourses)}
          icon={BookOpen}
          description="Approved and pending courses"
          isLoading={loading}
        />
        <DashboardStatCard
          title="Pending Approvals"
          value={String(pendingCoursesCount)}
          icon={Clock}
          description="Courses awaiting review"
          isLoading={loading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline">User Roles Overview</CardTitle>
            <CardDescription>Distribution of user accounts across the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {loading ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading chart data...</div>
                ) : (
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                      }}
                    />
                    <Bar dataKey="count" name="Users" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Quick Actions</CardTitle>
            <CardDescription>Commonly used administrative tasks.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/users">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New User
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/courses">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Review Pending Courses
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/feedback">
                <MessageSquare className="mr-2 h-4 w-4" />
                View Latest Feedback
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
