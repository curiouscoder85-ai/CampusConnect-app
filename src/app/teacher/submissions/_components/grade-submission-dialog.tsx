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
import type { Submission, User } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

const formSchema = z.object({
  grade: z.coerce.number().min(0, "Grade can't be negative.").max(100, "Grade can't exceed 100."),
});

type FormValues = z.infer<typeof formSchema>;

interface GradeSubmissionDialogProps {
  submission: Submission;
  student: User;
  assignmentTitle: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (grade: number) => void;
}

const getInitials = (name: string) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2);
  };

export function GradeSubmissionDialog({
  submission,
  student,
  assignmentTitle,
  isOpen,
  onOpenChange,
  onSave,
}: GradeSubmissionDialogProps) {
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      grade: submission.grade ?? undefined,
    },
  });

  const onSubmit = (data: FormValues) => {
    onSave(data.grade);
  };
  
  React.useEffect(() => {
    if (isOpen) {
      form.reset({ grade: submission.grade ?? undefined });
    }
  }, [isOpen, submission, form]);

  const submittedAt = submission.submittedAt?.seconds 
    ? formatDistanceToNow(new Date(submission.submittedAt.seconds * 1000), { addSuffix: true }) 
    : 'a few moments ago';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Grade Submission</DialogTitle>
          <DialogDescription>
            {assignmentTitle}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={student.avatar} alt={student.name} />
                    <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{student.name}</p>
                    <p className="text-sm text-muted-foreground">Submitted: {submittedAt}</p>
                </div>
            </div>
            {submission.comment && (
                 <blockquote className="mt-6 border-l-2 pl-6 italic text-sm">
                    "{submission.comment}"
                </blockquote>
            )}
             {submission.fileUrl && (
                <Button variant="outline" asChild>
                    <Link href={submission.fileUrl} target="_blank" rel="noopener noreferrer">
                        Download Submission File
                    </Link>
                </Button>
            )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade (out of 100)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 95" {...field} />
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
