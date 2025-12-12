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
import { useFirestore, useAuth } from '@/firebase/provider';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword } from 'firebase/auth';
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
  const auth = useAuth(); // Use the auth instance from our provider
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
    try {
      // 1. Create the authentication user
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const { uid } = userCredential.user;
      
      const [firstName, lastName] = data.name.split(' ');

      // 2. Create the user document in Firestore
      const userDocRef = doc(firestore, 'users', uid);
      const userData = {
        id: uid,
        name: data.name,
        email: data.email,
        role: data.role,
        firstName,
        lastName: lastName || '',
        avatar: `https://picsum.photos/seed/${uid}/200`,
      };

      // Use setDoc which is fine here since we have the UID
      await setDoc(userDocRef, userData);

      toast({
        title: 'User Created Successfully',
        description: `The user account for ${data.name} has been created and can now log in.`,
      });
      onUserAdded();
      onOpenChange(false);
      form.reset();

    } catch (error: any) {
        console.error("Error creating user:", error);
        
        // Handle specific Firebase auth errors
        let errorMessage = 'Could not create user.';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'This email address is already in use.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'The password is too weak.';
        }

        toast({
            variant: 'destructive',
            title: 'Error',
            description: errorMessage
        });
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
            Create a new user profile and login account.
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
