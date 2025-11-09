import { DashboardStatCard } from '@/components/dashboard-stat-card';
import { getTeacherCourses, enrollments, feedback, getUserById } from '@/lib/mock-data';
import { BookCopy, Users, Star } from 'lucide-react';

// Mock current teacher
const TEACHER_ID = '2';

export default function TeacherDashboardPage() {
  const teacherCourses = getTeacherCourses(TEACHER_ID);
  const courseIds = teacherCourses.map(c => c.id);
  
  const totalEnrollments = enrollments.filter(e => courseIds.includes(e.courseId)).length;
  
  const courseFeedback = feedback.filter(f => courseIds.includes(f.courseId));
  const averageRating = courseFeedback.length > 0 
    ? (courseFeedback.reduce((acc, f) => acc + f.rating, 0) / courseFeedback.length).toFixed(1) 
    : 'N/A';

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DashboardStatCard
          title="My Courses"
          value={String(teacherCourses.length)}
          icon={BookCopy}
          description="Total courses you manage"
        />
        <DashboardStatCard
          title="Total Students"
          value={String(totalEnrollments)}
          icon={Users}
          description="Across all your courses"
        />
        <DashboardStatCard
          title="Average Rating"
          value={String(averageRating)}
          icon={Star}
          description="Average feedback rating from students"
        />
      </div>
      {/* Additional components like recent activity or notifications can be added here */}
    </div>
  );
}
