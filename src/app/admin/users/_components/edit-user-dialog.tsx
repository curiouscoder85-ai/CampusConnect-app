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
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useAuth } from '@/components/auth-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

const availableAvatars = [
  '/avatars/01.png',
  '/avatars/02.png',
  '/avatars/03.png',
  '/avatars/04.png',
  '/avatars/05.png',
];

const getInitials = (name: string) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2);
};

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['admin', 'teacher', 'student']),
  avatar: z.string().url('Invalid avatar URL'),
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
  const { user: currentUser } = useAuth(); // Get the currently logged-in user

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      role: 'student',
      avatar: '',
    },
  });

  React.useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role,
        avatar: user.avatar,
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to the profile. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="avatar"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Profile Picture</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-wrap items-center gap-4"
                    >
                      {availableAvatars.map((avatarSrc) => (
                        <FormItem key={avatarSrc} className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={avatarSrc} className="sr-only" />
                          </FormControl>
                           <Avatar className={cn(
                                'h-16 w-16 cursor-pointer border-2 border-transparent transition-all',
                                field.value === avatarSrc && 'border-primary ring-2 ring-primary ring-offset-2'
                            )}>
                                <AvatarImage src={avatarSrc} alt={`Avatar ${avatarSrc}`} />
                                <AvatarFallback>{getInitials(user?.name || '')}</AvatarFallback>
                            </Avatar>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            {currentUser?.role === 'admin' && (
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
            )}
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
