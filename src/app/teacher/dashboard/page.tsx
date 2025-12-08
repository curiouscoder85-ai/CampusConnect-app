
'use client';

import { useMemo } from 'react';
import { DashboardStatCard } from '@/components/dashboard-stat-card';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, collectionGroup } from 'firebase/firestore';
import type { Course, Enrollment, Feedback } from '@/lib/types';
import { BookCopy, Users, MessageSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { summarizeFeedbackAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import React from 'react';

function AiFeedbackSummary({ feedback }: { feedback: Feedback[] }) {
  const [summary, setSummary] = React.useState<{ summary: string; areasForImprovement: string } | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSummarize = async () => {
    setIsLoading(true);
    const feedbackStrings = feedback.map(f => f.comment);
    // For this demo, let's just use the course name of the first feedback item
    const courseName = 'your courses';
    const result = await summarizeFeedbackAction({ courseName, feedback: feedbackStrings });
    setSummary(result);
    setIsLoading(false);
  };
  
  if (feedback.length === 0) return null;

  return (
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
            <div className='flex items-start justify-between'>
                <div>
                    <CardTitle className="font-headline flex items-center gap-2 text-lg">
                        <Sparkles className="text-primary" />
                        <span>AI Feedback Summary</span>
                    </CardTitle>
                    <CardDescription>Get a quick summary of student feedback.</CardDescription>
                </div>
                <Button onClick={handleSummarize} disabled={isLoading} size="sm">
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Generate
                </Button>
            </div>
        </CardHeader>
         {summary && (
            <CardContent className="prose prose-sm max-w-none text-foreground/80">
                <h4>Summary</h4>
                <p>{summary.summary}</p>
                <h4>Areas for Improvement</h4>
                <p>{summary.areasForImprovement}</p>
            </CardContent>
        )}
      </Card>
  )

}


export default function TeacherDashboardPage() {
  const { user, isUserLoading: userLoading } = useUser();
  const firestore = useFirestore();

  const coursesQuery = useMemoFirebase(
    () => (user ? query(collection(firestore, 'courses'), where('teacherId', '==', user.id)) : null),
    [firestore, user]
  );
  const { data: teacherCourses, isLoading: coursesLoading } = useCollection<Course>(coursesQuery);

  const courseIds = useMemo(() => teacherCourses?.map((c) => c.id) || [], [teacherCourses]);

  const enrollmentsQuery = useMemoFirebase(
    () => {
        // This is the critical fix: Do not run the query until the courseIds array has been populated.
        if (!firestore || courseIds.length === 0) return null;
        return query(collection(firestore, 'enrollments'), where('courseId', 'in', courseIds));
    },
    [firestore, courseIds] // This query now correctly depends on the populated courseIds
  );
  const { data: enrollments, isLoading: enrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);

  const feedbackQuery = useMemoFirebase(
    () => (user ? query(collectionGroup(firestore, 'feedback'), where('teacherId', '==', user.id)) : null),
    [firestore, user]
  );
  const { data: feedback, isLoading: feedbackLoading } = useCollection<Feedback>(feedbackQuery);


  const totalEnrollments = enrollments?.length ?? 0;
  
  const isLoading = userLoading || coursesLoading; // Enrollment loading is secondary

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DashboardStatCard
          title="My Courses"
          value={String(teacherCourses?.length ?? 0)}
          icon={BookCopy}
          description="Total courses you manage"
          isLoading={isLoading}
        />
        <DashboardStatCard
          title="Total Students"
          value={String(totalEnrollments)}
          icon={Users}
          description="Across all your courses"
          isLoading={isLoading || (courseIds.length > 0 && enrollmentsLoading)}
        />
        <DashboardStatCard
          title="Feedback Received"
          value={String(feedback?.length ?? 0)}
          icon={MessageSquare}
          description="From all your students"
          isLoading={isLoading || feedbackLoading}
        />
      </div>
      <AiFeedbackSummary feedback={feedback || []} />
    </div>
  );
}
