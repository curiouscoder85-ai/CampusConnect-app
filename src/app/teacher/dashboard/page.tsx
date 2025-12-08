'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Course, Enrollment, Feedback } from '@/lib/types';
import { DashboardStatCard } from '@/components/dashboard-stat-card';
import { Users, BookOpen, MessageSquare } from 'lucide-react';
import { AiRecommendations } from '@/components/ai-recommendations';
import { summarizeFeedbackAction } from '@/app/actions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function TeacherDashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [feedbackSummary, setFeedbackSummary] = React.useState('');
  const [isSummaryLoading, setIsSummaryLoading] = React.useState(false);

  // Step 1: Fetch teacher's courses
  const coursesQuery = useMemoFirebase(
    () => {
      if (isUserLoading || !user) return null;
      return query(collection(firestore, 'courses'), where('teacherId', '==', user.id));
    },
    [firestore, user, isUserLoading]
  );
  const { data: teacherCourses, isLoading: coursesLoading } = useCollection<Course>(coursesQuery);

  const courseIds = React.useMemo(() => {
    return teacherCourses?.map(course => course.id) || [];
  }, [teacherCourses]);

  // Step 2: Fetch enrollments for those courses, only if courseIds are available
  const enrollmentsQuery = useMemoFirebase(
    () => {
      if (!firestore || courseIds.length === 0) return null;
      return query(collection(firestore, 'enrollments'), where('courseId', 'in', courseIds));
    },
    [firestore, courseIds]
  );
  const { data: enrollments, isLoading: enrollmentsLoading } = useCollection<Enrollment>(enrollmentsQuery);

  // Step 3: Fetch feedback for those courses, only if courseIds are available
  const feedbackQuery = useMemoFirebase(
    () => {
      if (!firestore || courseIds.length === 0) return null;
      return query(collectionGroup(firestore, 'feedback'), where('courseId', 'in', courseIds));
    },
    [firestore, courseIds]
  );
  const { data: feedback, isLoading: feedbackLoading } = useCollection<Feedback>(feedbackQuery);

  const totalStudents = React.useMemo(() => {
    if (!enrollments) return 0;
    const uniqueStudentIds = new Set(enrollments.map(e => e.userId));
    return uniqueStudentIds.size;
  }, [enrollments]);

  const handleGenerateSummary = React.useCallback(async () => {
    if (!feedback || feedback.length === 0) return;
    setIsSummaryLoading(true);
    const feedbackStrings = feedback.map(f => `Rating: ${f.rating}/5 - "${f.comment}"`);
    try {
      const result = await summarizeFeedbackAction({
        courseName: "All Courses",
        feedback: feedbackStrings,
      });
      setFeedbackSummary(result.summary);
    } catch (error) {
      console.error("Failed to generate feedback summary:", error);
      setFeedbackSummary("Could not generate summary at this time.");
    } finally {
      setIsSummaryLoading(false);
    }
  }, [feedback]);

  React.useEffect(() => {
    if(feedback && feedback.length > 0) {
        handleGenerateSummary();
    }
  }, [feedback, handleGenerateSummary]);

  const isLoading = coursesLoading || (courseIds.length > 0 && (enrollmentsLoading || feedbackLoading));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Welcome, {user?.firstName || 'Teacher'}!
        </h1>
        <p className="text-muted-foreground">Here's a summary of your activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DashboardStatCard
          title="Total Courses"
          value={teacherCourses?.length.toString() ?? '0'}
          icon={BookOpen}
          isLoading={isLoading}
        />
        <DashboardStatCard
          title="Total Students"
          value={totalStudents.toString()}
          icon={Users}
          isLoading={isLoading}
        />
        <DashboardStatCard
          title="Feedback Received"
          value={feedback?.length.toString() ?? '0'}
          icon={MessageSquare}
          isLoading={isLoading}
        />
      </div>

      <Card>
        <CardHeader>
            <CardTitle className="font-headline">AI Feedback Summary</CardTitle>
        </CardHeader>
        <CardContent>
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> :
             feedback && feedback.length > 0 ? (
                isSummaryLoading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> :
                <p className="text-sm text-muted-foreground italic">"{feedbackSummary}"</p>
             ) : (
                <p className="text-sm text-muted-foreground">No feedback has been submitted for your courses yet.</p>
             )
            }
        </CardContent>
      </Card>
    </div>
  );
}
