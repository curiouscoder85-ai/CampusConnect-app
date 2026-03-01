'use client';

import * as React from 'react';
import { useCollection } from '@/firebase';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { collection, doc, query, where } from 'firebase/firestore';
import type { Course, User } from '@/lib/types';
import { CoursesTable } from './_components/courses-table';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen } from 'lucide-react';

export default function AdminCoursesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState('all');

  const coursesQuery = useMemoFirebase(() => query(collection(firestore, 'courses')), [firestore]);
  const { data: courses, isLoading: coursesLoading } = useCollection<Course>(coursesQuery);

  const teachersQuery = useMemoFirebase(() => query(collection(firestore, 'users'), where('role', '==', 'teacher')), [firestore]);
  const { data: teachers, isLoading: teachersLoading } = useCollection<User>(teachersQuery);

  const teachersMap = React.useMemo(() => {
    if (!teachers) return {};
    return teachers.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {} as Record<string, User>);
  }, [teachers]);
  
  const filteredCourses = React.useMemo(() => {
    if (!courses) return [];
    if (activeTab === 'all') return courses;
    return courses.filter(course => course.status === activeTab);
  }, [courses, activeTab]);

  const handleUpdateStatus = (courseId: string, status: 'approved' | 'rejected') => {
    const courseRef = doc(firestore, 'courses', courseId);
    updateDocumentNonBlocking(courseRef, { status });
    toast({
      title: 'Course Updated',
      description: `The course has been ${status}.`,
    });
  };
  
  const isLoading = coursesLoading || teachersLoading;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">Course Management</h1>
          <p className="text-muted-foreground">
            Approve, reject, and manage all courses on the platform.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Courses</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredCourses.length > 0 || isLoading ? (
        <CoursesTable 
          courses={filteredCourses} 
          teachers={teachersMap}
          isLoading={isLoading}
          onUpdateStatus={handleUpdateStatus} 
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-lg">
          <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold text-lg">No courses found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            There are no courses with the status "{activeTab}" at the moment.
          </p>
        </div>
      )}
    </div>
  );
}
