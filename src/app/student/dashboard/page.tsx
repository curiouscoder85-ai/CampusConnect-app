import {
  getStudentEnrollments,
  getCourseById,
  getUserById,
} from '@/lib/mock-data';
import { CourseCard } from '@/components/course-card';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Mock current student
const STUDENT_ID = '3';

export default function StudentDashboardPage() {
  const student = getUserById(STUDENT_ID);
  const enrolled = getStudentEnrollments(STUDENT_ID);
  const enrolledCourses = enrolled.map((enrollment) => ({
    course: getCourseById(enrollment.courseId)!,
    progress: enrollment.progress,
  }));

  return (
    <div className="flex flex-col gap-8">
       <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Welcome back, {student?.name.split(' ')[0]}!
        </h1>
        <p className="text-muted-foreground">Let's continue your learning journey.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl">My Courses</CardTitle>
          <CardDescription>Courses you are currently enrolled in.</CardDescription>
        </CardHeader>
        <CardContent>
          {enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {enrolledCourses.map(({ course, progress }) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  enrollmentProgress={progress}
                  link={`/student/courses/${course.id}`}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <h3 className="font-semibold">No Courses Yet</h3>
                <p className="text-sm text-muted-foreground mt-1">You haven't enrolled in any courses.</p>
                <Button asChild className="mt-4">
                    <Link href="/student/courses">Browse Courses</Link>
                </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
