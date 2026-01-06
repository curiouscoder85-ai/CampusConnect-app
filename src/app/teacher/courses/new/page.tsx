'use client';

import { useRouter } from 'next/navigation';
import { CourseForm } from '../_components/course-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function NewCoursePage() {
  const router = useRouter();

  const handleCourseCreated = (courseId: string) => {
    // After the course is created in the form, redirect to its edit page
    router.push(`/teacher/courses/${courseId}/edit`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
      <div className="lg:col-span-2">
        <CourseForm onCourseCreated={handleCourseCreated} />
      </div>
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Course Modules</CardTitle>
            <CardDescription>
              Organize your course content into modules.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-sm text-muted-foreground py-8 border-2 border-dashed rounded-lg">
              <p>Please create and save the course first to add modules.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
