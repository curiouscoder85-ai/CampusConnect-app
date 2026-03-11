'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, collectionGroup } from 'firebase/firestore';
import type { Course, Feedback } from '@/lib/types';
import { SectionHeader } from '@/components/section-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { summarizeFeedbackAction } from '@/app/actions';
import { Sparkles, Loader2, MessageSquare, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function TeacherFeedbackPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [selectedCourseId, setSelectedCourseId] = React.useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = React.useState(false);
  const [summary, setSummary] = React.useState<{ summary: string; areasForImprovement: string } | null>(null);

  // 1. Fetch teacher's courses
  const coursesQuery = useMemoFirebase(
    () => (user ? query(collection(firestore, 'courses'), where('teacherId', '==', user.id)) : null),
    [firestore, user?.id]
  );
  const { data: courses, isLoading: coursesLoading } = useCollection<Course>(coursesQuery);

  // 2. Fetch feedback for the selected course
  const feedbackQuery = useMemoFirebase(
    () => (selectedCourseId ? query(collection(firestore, `courses/${selectedCourseId}/feedback`)) : null),
    [firestore, selectedCourseId]
  );
  const { data: feedback, isLoading: feedbackLoading } = useCollection<Feedback>(feedbackQuery);

  const handleGenerateSummary = async () => {
    if (!feedback || feedback.length === 0 || !selectedCourseId) return;

    const course = courses?.find(c => c.id === selectedCourseId);
    if (!course) return;

    setIsSummarizing(true);
    setSummary(null);

    const result = await summarizeFeedbackAction({
      courseName: course.title,
      feedback: feedback.map(f => f.comment),
    });

    setSummary(result);
    setIsSummarizing(false);
  };

  const selectedCourse = courses?.find(c => c.id === selectedCourseId);

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader 
        title="Feedback Analysis"
        subtitle="Use AI to analyze student feedback and identify areas for improvement."
      />

      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <Card className="w-full md:w-1/3">
          <CardHeader>
            <CardTitle className="text-lg">Select Course</CardTitle>
            <CardDescription>Pick a course to analyze its feedback.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select onValueChange={setSelectedCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a course..." />
              </SelectTrigger>
              <SelectContent>
                {courses?.map(course => (
                  <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              className="w-full" 
              onClick={handleGenerateSummary} 
              disabled={!selectedCourseId || !feedback || feedback.length === 0 || isSummarizing}
            >
              {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Analyze with AI
            </Button>

            {!feedbackLoading && selectedCourseId && feedback?.length === 0 && (
              <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                <AlertCircle className="h-4 w-4" />
                No feedback submitted for this course yet.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex-1 space-y-6">
          {isSummarizing ? (
            <div className="space-y-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : summary ? (
            <>
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="font-headline flex items-center gap-2">
                    <MessageSquare className="text-primary h-5 w-5" />
                    Student Sentiment Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none">
                  <p>{summary.summary}</p>
                </CardContent>
              </Card>

              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader>
                  <CardTitle className="font-headline flex items-center gap-2">
                    <Sparkles className="text-amber-500 h-5 w-5" />
                    Key Areas for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none">
                  <p>{summary.areasForImprovement}</p>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-lg">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-lg">No Analysis Generated</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Select a course and click "Analyze with AI" to see insights from your students.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
