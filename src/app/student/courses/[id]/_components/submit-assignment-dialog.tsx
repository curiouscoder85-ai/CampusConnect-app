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
import { collection, serverTimestamp, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { ContentItem, Course, User } from '@/lib/types';
import { Loader2, UploadCloud, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { nanoid } from 'nanoid';

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
  const [isDone, setIsDone] = React.useState(false);

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
    setIsDone(false);
    
    try {
      // 1. Upload file to Storage first (Atomic approach)
      // Generate a unique ID for the folder to prevent collisions
      const submissionTempId = nanoid();
      const filePath = `submissions/${course.id}/${user.id}/${assignment.id}/${submissionTempId}/${data.file.name}`;
      
      const fileUrl = await uploadFileWithProgress(storage, data.file, filePath, (progress) => {
        setUploadProgress(Math.round(progress));
      });

      // 2. Create the Firestore record only AFTER upload succeeds
      const submissionsCol = collection(firestore, `courses/${course.id}/submissions`);
      await addDoc(submissionsCol, {
        userId: user.id,
        studentId: user.id, // Support both naming conventions
        courseId: course.id,
        contentId: assignment.id,
        assignmentTitle: assignment.title,
        teacherId: course.teacherId,
        comment: data.comment || '',
        submittedAt: serverTimestamp(),
        submissionDate: new Date().toISOString(), // Schema compliance
        grade: null,
        fileUrl,
        uploading: false, 
      });

      setIsDone(true);
      toast({
        title: 'Assignment Submitted!',
        description: 'Your work has been received and is now visible to your teacher.',
      });
      
      // Delay closing so student sees completion
      setTimeout(() => {
        onSubmissionSuccess();
        onOpenChange(false);
      }, 1500);

    } catch (error: any) {
      console.error('Submission failed:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error.message || 'Could not complete your submission. Please try again.',
      });
      setIsSubmitting(false);
    }
  };

  React.useEffect(() => {
    if (!isOpen) {
      form.reset();
      setUploadProgress(0);
      setIsSubmitting(false);
      setIsDone(false);
    }
  }, [isOpen, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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
              <div className="space-y-2 rounded-lg bg-muted/50 p-4 border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-primary uppercase">
                    {uploadProgress < 100 ? 'Uploading Work...' : 'Finalizing Submission...'}
                  </span>
                  <span className="text-xs font-bold text-primary">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="min-w-[120px]"
                disabled={isSubmitting || !form.formState.isValid || isDone}
              >
                {isDone ? (
                  <><CheckCircle2 className="mr-2 h-4 w-4" /> Submitted!</>
                ) : isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {uploadProgress}%</>
                ) : (
                  'Submit Assignment'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
