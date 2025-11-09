import { courses } from '@/lib/mock-data';
import { CourseCard } from '@/components/course-card';

export default function CourseCatalogPage() {
  const availableCourses = courses.filter((c) => c.status === 'approved');

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Course Catalog
        </h1>
        <p className="text-muted-foreground">
          Explore new skills and enroll in courses to expand your knowledge.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {availableCourses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            link={`/student/courses/${course.id}`}
            action="enroll"
          />
        ))}
      </div>
    </div>
  );
}
