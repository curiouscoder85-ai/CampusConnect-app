
'use client';

import * as React from 'react';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Submission } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Download } from 'lucide-react';
import Link from 'next/link';

interface GradeSubmissionDialogProps {
  submission: Submission;
  studentName: string;
  assignmentTitle: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onGradeUpdated: () => void;
}

const formSchema = z.object({
  grade: z.coerce.number().min(0, "Grade must be at least 0").max(100, "Grade cannot exceed 100"),
});

type FormValues = z.infer<typeof formSchema>;

export function GradeSubmissionDialog({
  submission,
  studentName,
  assignmentTitle,
  isOpen,
  onOpenChange,
  onGradeUpdated,
}: GradeSubmissionDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      grade: submission.grade ?? undefined,
    },
  });

  React.useEffect(() => {
    form.reset({ grade: submission.grade ?? undefined });
  }, [submission, form]);

  const onSubmit = (data: FormValues) => {
    const submissionRef = doc(firestore, 'submissions', submission.id);
    updateDocumentNonBlocking(submissionRef, { grade: data.grade });
    toast({
      title: 'Grade Submitted',
      description: `A grade of ${data.grade} has been recorded for ${studentName}.`,
    });
    onGradeUpdated();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Grade Submission</DialogTitle>
          <DialogDescription>
            Review the submission for "{assignmentTitle}" by {studentName}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Submitted File:</h4>
            {submission.fileUrl ? (
                <Button variant="outline" asChild>
                    <Link href={submission.fileUrl} target="_blank" download>
                        <Download className="mr-2 h-4 w-4" />
                        Download Submission
                    </Link>
                </Button>
            ) : (
                <p className="text-sm text-muted-foreground italic">No file was submitted.</p>
            )}
          </div>
           <div className="space-y-1">
            <h4 className="font-semibold text-sm">Student Comments:</h4>
            <div className="prose prose-sm dark:prose-invert max-w-none rounded-md border p-4 max-h-40 overflow-auto text-muted-foreground">
              <p>{submission.comment || <span className="italic">No comments provided.</span>}</p>
            </div>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade (0-100)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter grade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Saving...' : 'Save Grade'}
                  </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
