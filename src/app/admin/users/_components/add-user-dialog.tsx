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
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import { setDocumentNonBlocking, errorEmitter, FirestorePermissionError } from '@/firebase';

const formSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['teacher', 'student', 'admin']),
});

type FormValues = z.infer<typeof formSchema>;

interface AddUserDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUserAdded: () => void;
}

export function AddUserDialog({ isOpen, onOpenChange, onUserAdded }: AddUserDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'student',
    },
  });

  const onSubmit = async (data: FormValues) => {
    // Create a secondary app for user creation to avoid redirecting the admin
    const secondaryAppName = 'secondary-auth-app';
    let secondaryApp;
    
    const existingApp = getApps().find(app => app.name === secondaryAppName);
    if (existingApp) {
      secondaryApp = existingApp;
    } else {
      secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    }
    const secondaryAuth = getAuth(secondaryApp);

    try {
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, data.email, data.password);
      const { uid } = userCredential.user;

      const [firstName, lastName] = data.name.split(' ');

      const userDocRef = doc(firestore, 'users', uid);
      const userData = {
        id: uid,
        name: data.name,
        email: data.email,
        role: data.role,
        firstName,
        lastName: lastName || '',
        avatar: `/avatars/0${(Math.floor(Math.random() * 5)) + 1}.png`,
      };

      setDocumentNonBlocking(userDocRef, userData, {});

      toast({
        title: 'User Created',
        description: `An account for ${data.name} has been successfully created.`,
      });
      onUserAdded();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      if (error.code && error.code.startsWith('auth/')) {
         toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: error.message || 'Could not create user authentication entry.',
        });
      } else {
        const contextualError = new FirestorePermissionError({
          path: `users/new-user`,
          operation: 'create',
          requestResourceData: data,
        });
        errorEmitter.emit('permission-error', contextualError);
      }
    } finally {
        // Clean up the secondary app
        if(secondaryAuth.currentUser) {
           await secondaryAuth.signOut();
        }
        await deleteApp(secondaryApp);
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
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new account. They will be able to log in with the credentials you provide.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
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
                {form.formState.isSubmitting ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
