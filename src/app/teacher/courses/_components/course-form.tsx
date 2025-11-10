'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { Course } from '@/lib/types';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { DeleteCourseAlert } from './delete-course-alert';
import { Trash2 } from 'lucide-react';

const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long'),
  description: z.string().min(20, 'Description must be at least 20 characters long'),
});

type CourseFormValues = z.infer<typeof formSchema>;

interface CourseFormProps {
  course?: Course;
}

export function CourseForm({ course }: CourseFormProps) {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: course?.title || '',
      description: course?.description || '',
    },
  });

  const onSubmit = async (data: CourseFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }

    try {
      if (course) {
        // Update existing course
        const courseRef = doc(firestore, 'courses', course.id);
        updateDocumentNonBlocking(courseRef, data);
        toast({
          title: 'Course Updated',
          description: `"${data.title}" has been successfully updated.`,
        });
        // No redirect on update, stay on the edit page
      } else {
        // Create new course
        const coursesCol = collection(firestore, 'courses');
        const randomImage = PlaceHolderImages[Math.floor(Math.random() * PlaceHolderImages.length)];
        const newDoc = await addDocumentNonBlocking(coursesCol, {
          ...data,
          teacherId: user.id,
          status: 'pending',
          image: randomImage.imageUrl,
          modules: [],
          assignments: [],
        });
        toast({
          title: 'Course Created',
          description: `"${data.title}" has been submitted for approval.`,
        });
        if (newDoc) {
          router.push(`/teacher/courses/${newDoc.id}/edit`);
        } else {
          router.push('/teacher/courses');
        }
      }
    } catch (error: any) {
      const contextualError = new FirestorePermissionError({
        path: course ? `courses/${course.id}` : 'courses',
        operation: course ? 'update' : 'create',
        requestResourceData: data,
      });
      errorEmitter.emit('permission-error', contextualError);
    }
  };

  const handleDeleteCourse = () => {
    if (!course) return;

    const courseRef = doc(firestore, 'courses', course.id);
    deleteDocumentNonBlocking(courseRef);

    toast({
      title: 'Course Deleted',
      description: `The course "${course.title}" has been permanently deleted.`,
    });
    router.push('/teacher/courses');
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">
            {course ? 'Edit Course' : 'Create a New Course'}
          </CardTitle>
          <CardDescription>
            {course
              ? 'Update the details for your course.'
              : 'Fill out the form below to get started.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Introduction to Python" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what students will learn in your course."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-between items-center gap-2">
                 <div>
                  {course && (
                     <Button
                       type="button"
                       variant="destructive"
                       onClick={() => setIsDeleteDialogOpen(true)}
                     >
                       <Trash2 className="mr-2 h-4 w-4" />
                       Delete Course
                     </Button>
                   )}
                 </div>
                 <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => router.push('/teacher/courses')}>
                      {course ? 'Done' : 'Cancel'}
                    </Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting
                        ? course
                          ? 'Saving...'
                          : 'Creating...'
                        : course
                        ? 'Save Changes'
                        : 'Create Course'}
                    </Button>
                 </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      {course && (
        <DeleteCourseAlert
          course={course}
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleDeleteCourse}
        />
      )}
    </>
  );
}
