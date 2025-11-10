
'use client';

import { notFound } from 'next/navigation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { AiRecommendations } from '@/components/ai-recommendations';
import { Book, CheckCircle, FileText, Video, PlayCircle, Star } from 'lucide-react';
import Link from 'next/link';
import { useDoc, useCollection, useUser } from '@/firebase';
import { doc, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import type { Course, Enrollment, ContentItem } from '@/lib/types';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import React, { useState } from 'react';
import { ContentPlayer } from './_components/content-player';
import { cn } from '@/lib/utils';

const contentIcons: Record<ContentItem['type'], React.ReactNode> = {
  video: <Video className="h-4 w-4 flex-shrink-0" />,
  reading: <Book className="h-4 w-4 flex-shrink-0" />,
  quiz: <FileText className="h-4 w-4 flex-shrink-0" />,
};

export default function StudentCoursePage({ params }: { params: { id: string } }) {
  const { id } = React.use(params);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);


  const courseRef = useMemoFirebase(() => doc(firestore, 'courses', id), [firestore, id]);
  const { data: course, isLoading: courseLoading } = useDoc<Course>(courseRef);

  const enrollmentsQuery = useMemoFirebase(
    () =>
      user
        ? query(
            collection(firestore, 'enrollments'),
            where('userId', '==', user.id),
            where('courseId', '==', id)
          )
        : null,
    [firestore, user, id]
  );
  const { data: enrollments, isLoading: enrollmentLoading } = useCollection<Enrollment>(enrollmentsQuery);
  const enrollment = enrollments?.[0];

  const handleSubmitAssignment = (assignmentId: string) => {
    if (!user || !course) return;

    // In a real app, you'd have a form to collect submission content.
    // For this demo, we'll use placeholder content.
    const submissionContent = `This is a submission for assignment ${assignmentId}.`;
    
    // Note: The path to the submissions sub-collection needs the assignmentId.
    // This assumes assignments are top-level content items in a module.
    const submissionsCol = collection(firestore, 'courses', course.id, 'assignments', assignmentId, 'submissions');
    
    addDocumentNonBlocking(submissionsCol, {
      userId: user.id,
      courseId: course.id,
      assignmentId: assignmentId,
      teacherId: course.teacherId, // Denormalize teacherId for easier queries
      content: submissionContent,
      submittedAt: serverTimestamp(),
      grade: null,
    });

    toast({
      title: 'Assignment Submitted!',
      description: 'Your submission has been received.',
    });
  };


  if (courseLoading || enrollmentLoading) {
    return (
      <div className="mx-auto max-w-7xl">
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
             <Skeleton className="h-64 w-full" />
             <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-8">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    notFound();
  }
  
  const handleEnroll = () => {
    if (!user) return;
    const enrollmentsCol = collection(firestore, 'enrollments');
    addDocumentNonBlocking(enrollmentsCol, {
      userId: user.id,
      courseId: course.id,
      progress: 0,
      completed: false
    });
    toast({ title: 'Enrolled!', description: `You have successfully enrolled in ${course.title}.` });
  };
  
  const handleFeedbackSubmit = () => {
    if (!user || !feedbackComment || feedbackRating === 0) {
      toast({
        variant: 'destructive',
        title: 'Incomplete Feedback',
        description: 'Please provide a rating and a comment.',
      });
      return;
    }
    
    setIsSubmittingFeedback(true);
    const feedbackCol = collection(firestore, `courses/${id}/feedback`);
    
    addDocumentNonBlocking(feedbackCol, {
      userId: user.id,
      courseId: id,
      rating: feedbackRating,
      comment: feedbackComment,
      createdAt: serverTimestamp(),
    }).then(() => {
      toast({
        title: 'Feedback Submitted',
        description: 'Thank you for helping us improve this course!',
      });
      setFeedbackComment('');
      setFeedbackRating(0);
      setIsSubmittingFeedback(false);
    }).catch(() => {
        setIsSubmittingFeedback(false);
    });
  };

  if (!enrollment) {
    return (
        <div className="mx-auto max-w-3xl text-center py-20">
            <h1 className="font-headline text-4xl font-bold tracking-tight">{course.title}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{course.description}</p>
            <Button onClick={handleEnroll} className="mt-8" size="lg">Enroll Now</Button>
        </div>
    )
  }

  const recommendationInput = {
    courseName: course.title,
    studentProgress: `Completed ${enrollment.progress}% of the course.`,
    learningMaterials: course.modules?.map(m => m.title).join(', ') || "Not available",
  };

  const defaultOpenAccordion = course.modules && course.modules.length > 0 ? [course.modules[0].id] : [];
  
  const assignments = course.modules?.flatMap(m => m.content.filter(c => c.type === 'quiz')) ?? [];

  return (
    <>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="font-headline text-4xl font-bold tracking-tight">{course.title}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{course.description}</p>
        </div>

        <div className="mb-6">
          <div className="mb-2 flex justify-between font-medium">
            <span>Overall Progress</span>
            <span>{enrollment.progress}%</span>
          </div>
          <Progress value={enrollment.progress} />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
              <Card>
                  <CardHeader>
                      <CardTitle className="font-headline">Course Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <Accordion type="multiple" defaultValue={defaultOpenAccordion}>
                         {course.modules && course.modules.map(module => (
                           <AccordionItem value={module.id} key={module.id}>
                               <AccordionTrigger className="font-semibold">{module.title}</AccordionTrigger>
                               <AccordionContent>
                                   <ul className="space-y-1">
                                       {module.content.map(item => (
                                          <li key={item.id}>
                                             <button 
                                                onClick={() => setSelectedContent(item)}
                                                className="w-full flex items-center justify-between gap-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 p-2 rounded-md transition-colors text-left"
                                              >
                                                <div className="flex items-center gap-3">
                                                  {contentIcons[item.type]}
                                                  <span>{item.title}</span>
                                                </div>
                                                <PlayCircle className="h-5 w-5 text-primary/50" />
                                             </button>
                                          </li>
                                       ))}
                                   </ul>
                               </AccordionContent>
                           </AccordionItem>
                         ))}
                      </Accordion>
                  </CardContent>
              </Card>
          </div>

          <div className="space-y-8">
              <AiRecommendations recommendationInput={recommendationInput} />

              <Card>
                  <CardHeader>
                      <CardTitle className="font-headline text-lg">Assignments</CardTitle>
                  </CardHeader>
                  <CardContent>
                      {assignments.length > 0 ? (
                        <div className="space-y-4">
                          {assignments.map(assignment => (
                            <div key={assignment.id}>
                                <h4 className="font-semibold">{assignment.title}</h4>
                                <p className="text-sm text-muted-foreground mb-4">Apply what you've learned.</p>
                                <Button onClick={() => handleSubmitAssignment(assignment.id)}>Submit Assignment</Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No assignments for this course yet.</p>
                      )}
                  </CardContent>
              </Card>

              <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-lg">Provide Feedback</CardTitle>
                    <CardDescription>Help the instructor improve this course.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">Rating:</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button key={star} onClick={() => setFeedbackRating(star)}>
                            <Star
                                className={cn(
                                'h-5 w-5 cursor-pointer transition-colors',
                                star <= feedbackRating
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-muted-foreground/50 hover:text-amber-400'
                                )}
                            />
                            </button>
                        ))}
                    </div>
                    <Textarea
                        placeholder="Share your thoughts..."
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                    />
                    <Button onClick={handleFeedbackSubmit} disabled={isSubmittingFeedback}>
                        {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                    </Button>
                </CardContent>
              </Card>

              {enrollment.progress === 100 && (
                  <Button asChild size="lg" className="w-full bg-green-600 hover:bg-green-700">
                      <Link href={`/student/courses/${course.id}/certificate`}>
                          <CheckCircle className="mr-2 h-5 w-5" />
                          Download Certificate
                      </Link>
                  </Button>
              )}
          </div>
        </div>
      </div>
      
      <ContentPlayer 
        contentItem={selectedContent}
        isOpen={!!selectedContent}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedContent(null);
        }}
        courseTitle={course.title}
      />
    </>
  );
}
