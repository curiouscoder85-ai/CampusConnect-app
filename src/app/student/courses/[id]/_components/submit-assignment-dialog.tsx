
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';
import { useFirestore } from '@/firebase/provider';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { uploadImage } from '@/firebase/storage';
import { collection, serverTimestamp, doc, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { ContentItem, Course, User } from '@/lib/types';
import { Loader2, UploadCloud } from 'lucide-react';

const formSchema = z.object({
  comment: z.string().optional(),
  file: z.instanceof(File).refine(file => file.size > 0, 'A file is required.'),
});

type FormValues = z.infer<typeof formSchema>;

interface SubmitAssignmentDialogProps {
  assignment: ContentItem;
  course: Course;
  user: User;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmissionSuccess: () => void;
}

export function SubmitAssignmentDialog({
  assignment,
  course,
  user,
  isOpen,
  onOpenChange,
  onSubmissionSuccess,
}: SubmitAssignmentDialogProps) {
  const { storage } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      comment: '',
      file: undefined,
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!storage || !data.file) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Storage service is not available or file is missing.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Correct path for the submission subcollection
      const submissionsCol = collection(firestore, `courses/${course.id}/submissions`);
      
      // 1. Immediately create the submission document with an uploading state.
      const submissionDocRef = await addDoc(submissionsCol, {
        userId: user.id,
        courseId: course.id,
        contentId: assignment.id,
        assignmentTitle: assignment.title,
        teacherId: course.teacherId,
        comment: data.comment || '',
        submittedAt: serverTimestamp(),
        grade: null,
        uploading: true, 
      });

      // 2. Show immediate feedback and close dialog.
      onSubmissionSuccess();
      onOpenChange(false);

      // 3. Chain background tasks: upload file, then update the document.
      const filePath = `submissions/${course.id}/${user.id}/${assignment.id}/${submissionDocRef.id}/${data.file.name}`;
      uploadImage(storage, data.file, filePath)
        .then(fileUrl => {
          // Once uploaded, update the doc with the URL and set uploading to false.
          updateDocumentNonBlocking(submissionDocRef, {
            fileUrl,
            uploading: false,
          });
        })
        .catch(error => {
          console.error('Background upload/update failed:', error);
          // Optionally, update the doc to show an error state.
          updateDocumentNonBlocking(submissionDocRef, {
             uploading: false,
             fileUrl: 'ERROR', // Indicate a failed upload
          });
        });

    } catch (error: any) {
      console.error('Initial submission creation failed:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error.message || 'Could not initiate your assignment submission.',
      });
    } finally {
      // This happens almost immediately now.
      setIsSubmitting(false);
    }
  };


  React.useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit: {assignment.title}</DialogTitle>
          <DialogDescription>
            Upload your file and add any comments for your instructor.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignment File</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="file"
                        className="pl-10"
                        onChange={(e) => field.onChange(e.target.files?.[0])}
                      />
                      <UploadCloud className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comments (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes for your instructor..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
