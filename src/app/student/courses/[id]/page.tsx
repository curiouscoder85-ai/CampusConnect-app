import { getCourseById, getStudentEnrollments } from '@/lib/mock-data';
import { notFound } from 'next/navigation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { AiRecommendations } from '@/components/ai-recommendations';
import { Book, CheckCircle, FileText, Sparkles, Video } from 'lucide-react';
import Link from 'next/link';

const STUDENT_ID = '3'; // Mock current student

export default function StudentCoursePage({ params }: { params: { id: string } }) {
  const course = getCourseById(params.id);
  const enrollment = getStudentEnrollments(STUDENT_ID).find(e => e.courseId === params.id);

  if (!course || !enrollment) {
    notFound();
  }

  const recommendationInput = {
    courseName: course.title,
    studentProgress: `Completed ${enrollment.progress}% of the course.`,
    learningMaterials: course.modules.map(m => m.title).join(', '),
  };

  return (
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
                    <Accordion type="single" collapsible defaultValue={course.modules[0]?.id}>
                    {course.modules.map((module) => (
                        <AccordionItem value={module.id} key={module.id}>
                        <AccordionTrigger className="font-semibold">{module.title}</AccordionTrigger>
                        <AccordionContent>
                            <ul className="space-y-2 pl-4">
                                {module.videos.map(video => <li key={video.id} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground"><Video className="h-4 w-4" /><span>{video.title}</span></li>)}
                                {module.reading.map(item => <li key={item.id} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground"><Book className="h-4 w-4" /><span>{item.title}</span></li>)}
                                {module.quizzes.map(quiz => <li key={quiz.id} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground"><FileText className="h-4 w-4" /><span>{quiz.title}</span></li>)}
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
                    {course.assignments.map(assignment => (
                        <div key={assignment.id}>
                            <h4 className="font-semibold">{assignment.title}</h4>
                            <p className="text-sm text-muted-foreground mb-4">{assignment.description}</p>
                            <Button>Submit Assignment</Button>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-lg">Provide Feedback</CardTitle>
                    <CardDescription>Help the instructor improve this course.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea placeholder="Share your thoughts..." />
                    <Button>Submit Feedback</Button>
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
  );
}
