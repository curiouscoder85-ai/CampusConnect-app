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
import { uploadFileWithProgress } from '@/firebase/storage';
import { collection, serverTimestamp, doc, addDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { ContentItem, Course, User } from '@/lib/types';
import { Loader2, UploadCloud } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

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
  const [uploadProgress, setUploadProgress] = React.useState(0);

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
    setUploadProgress(0);
    
    // Correctly define the path to the submissions subcollection for the course.
    const submissionsCol = collection(firestore, `courses/${course.id}/submissions`);

    try {
      // Step 1: Create the initial document with an 'uploading' state.
      const submissionDocRef = await addDoc(submissionsCol, {
        userId: user.id,
        courseId: course.id,
        contentId: assignment.id,
        assignmentTitle: assignment.title,
        teacherId: course.teacherId, // IMPORTANT: Denormalize teacherId for security rules.
        comment: data.comment || '',
        submittedAt: serverTimestamp(),
        grade: null,
        uploading: true, 
      });

      // Step 2: Upload the file to storage with progress tracking.
      const filePath = `submissions/${course.id}/${user.id}/${assignment.id}/${submissionDocRef.id}/${data.file.name}`;
      const fileUrl = await uploadFileWithProgress(storage, data.file, filePath, (progress) => {
        setUploadProgress(Math.round(progress));
      });

      // Step 3: Update the document with the file URL and set uploading to false.
      // We await this to ensure the teacher sees the correct status immediately.
      await updateDoc(doc(firestore, `courses/${course.id}/submissions/${submissionDocRef.id}`), {
        fileUrl,
        uploading: false,
      });

      toast({
        title: 'Assignment Submitted!',
        description: 'Your submission has been received successfully.',
      });
      
      onSubmissionSuccess();
      onOpenChange(false);

    } catch (error: any) {
      console.error('Submission failed:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error.message || 'Could not save your assignment submission. Check permissions.',
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };


  React.useEffect(() => {
    if (!isOpen) {
      form.reset();
      setUploadProgress(0);
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
                        disabled={isSubmitting}
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
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isSubmitting && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-[10px] text-right text-muted-foreground font-medium uppercase tracking-wider">
                  {uploadProgress}% Uploaded
                </p>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading {uploadProgress}%...
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
