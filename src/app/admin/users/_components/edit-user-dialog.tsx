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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useFirestore } from '@/firebase/provider';
import { doc, updateDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['admin', 'teacher', 'student']),
});

type FormValues = z.infer<typeof formSchema>;

interface EditUserDialogProps {
  user: User | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function EditUserDialog({ user, isOpen, onOpenChange }: EditUserDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      role: 'student',
    },
  });

  React.useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role,
      });
    }
  }, [user, form]);
  
  const onSubmit = async (data: FormValues) => {
    if (!user) return;
    
    const userRef = doc(firestore, 'users', user.id);
    const updatedData = {
        ...data,
        name: `${data.firstName} ${data.lastName}`
    };

    updateDocumentNonBlocking(userRef, updatedData);
    
    toast({
      title: 'User Updated',
      description: `${updatedData.name}'s profile has been successfully updated.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Make changes to the user's profile. Email cannot be changed.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
