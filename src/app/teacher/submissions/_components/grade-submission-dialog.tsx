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
import { Button } from '@/components/ui/button';
import { useFirestore } from '@/firebase/provider';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { Submission } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  grade: z.coerce
    .number()
    .min(0, 'Grade must be at least 0.')
    .max(100, 'Grade must be 100 or less.'),
});

type FormValues = z.infer<typeof formSchema>;

interface GradeSubmissionDialogProps {
  submission: Submission | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onGradeSaved: () => void;
}

export function GradeSubmissionDialog({
  submission,
  isOpen,
  onOpenChange,
  onGradeSaved,
}: GradeSubmissionDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      grade: submission?.grade ?? undefined,
    },
  });

  React.useEffect(() => {
    if (submission) {
      form.reset({ grade: submission.grade ?? undefined });
    }
  }, [submission, form]);

  const onSubmit = (data: FormValues) => {
    if (!submission) return;

    const submissionRef = doc(firestore, `courses/${submission.courseId}/assignments/${submission.assignmentId}/submissions/${submission.id}`);
    
    updateDocumentNonBlocking(submissionRef, { grade: data.grade });
    
    toast({
      title: 'Grade Saved',
      description: `The submission has been graded successfully.`,
    });
    
    onGradeSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Grade Submission</DialogTitle>
          <DialogDescription>
            Enter a grade for this submission. The student will be notified.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade (0-100)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 88" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={form.formState.isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Grade'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
