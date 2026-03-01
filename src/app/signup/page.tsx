'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Lock, Mail, User, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Logo from '@/components/logo';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required.' }),
  lastName: z.string().min(1, { message: 'Last name is required.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  role: z.enum(['student', 'teacher'], {
    required_error: 'Please select a role.',
  }),
});

type PasswordStrength = {
  level: 'none' | 'weak' | 'medium' | 'strong';
  progress: number;
  color: string;
  text: string;
};

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    level: 'none',
    progress: 0,
    color: '',
    text: '',
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'student',
    },
  });

  const password = form.watch('password');

  useEffect(() => {
    const checkPasswordStrength = (password: string): PasswordStrength => {
      if (!password) return { level: 'none', progress: 0, color: '', text: '' };

      let score = 0;
      if (password.length >= 8) score++;
      if (password.length >= 12) score++;
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
      if (/[0-9]/.test(password)) score++;
      if (/[^a-zA-Z0-9]/.test(password)) score++;

      if (password.length < 8) {
        return { level: 'weak', progress: 25, color: 'bg-destructive', text: 'Weak: Too short' };
      }

      switch (score) {
        case 1:
        case 2:
          return { level: 'weak', progress: 25, color: 'bg-destructive', text: 'Weak' };
        case 3:
          return { level: 'medium', progress: 60, color: 'bg-yellow-500', text: 'Medium' };
        case 4:
        case 5:
          return { level: 'strong', progress: 100, color: 'bg-green-500', text: 'Strong' };
        default:
          return { level: 'weak', progress: 25, color: 'bg-destructive', text: 'Weak' };
      }
    };
    setPasswordStrength(checkPasswordStrength(password));
  }, [password]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const fullName = `${values.firstName} ${values.lastName}`;
    try {
      const user = await signup(fullName, values.email, values.password, values.role);
      if (user) {
        toast({
          title: 'Account Created!',
          description: `Welcome to the platform, ${user.firstName}.`,
        });
        if (user.role === 'teacher') {
          router.push('/teacher/dashboard');
        } else {
          router.push('/student/dashboard');
        }
      }
    } catch (error: any) {
      let errorMessage = 'An error occurred during signup.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please try logging in.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'The password is too weak.';
      }

      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: errorMessage,
      });
    }
  };

  const isSubmitDisabled =
    form.formState.isSubmitting ||
    passwordStrength.level === 'weak' ||
    passwordStrength.level === 'none';

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-4">
      {/* Background Animation */}
      <div className="bubbles" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="bubble"></div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg z-10"
      >
        <Card className="glassmorphism shadow-2xl border-primary/10">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Logo />
            </div>
            <CardTitle className="font-headline text-3xl font-bold tracking-tight">Create Account</CardTitle>
            <CardDescription className="text-base">
              Join CampusConnect to start your learning journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="John" className="pl-10" {...field} />
                          </div>
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
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Doe" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="name@example.com" className="pl-10" {...field} autoComplete="email" />
                        </div>
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
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className="pl-10 pr-10"
                            {...field}
                            autoComplete="new-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1 h-8 w-8 text-muted-foreground hover:bg-transparent"
                            onClick={() => setShowPassword((prev) => !prev)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            <span className="sr-only">
                              {showPassword ? 'Hide password' : 'Show password'}
                            </span>
                          </Button>
                        </div>
                      </FormControl>
                      {passwordStrength.level !== 'none' && (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between gap-2">
                            <Progress value={passwordStrength.progress} className={cn('h-1.5 flex-1', passwordStrength.color)} />
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{passwordStrength.text}</p>
                          </div>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>I am a...</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <div className="relative">
                            <UserCircle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                            <SelectTrigger className="pl-10">
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </div>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold transition-all mt-2"
                  disabled={isSubmitDisabled}
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-wrap justify-center gap-1 border-t border-primary/5 pt-6">
            <span className="text-sm text-muted-foreground">Already have an account?</span>
            <Button variant="link" asChild className="p-0 h-auto font-semibold">
              <Link href="/">Sign in</Link>
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </main>
  );
}
