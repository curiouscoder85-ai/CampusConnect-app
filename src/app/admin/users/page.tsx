'use client';

import { useCollection } from '@/firebase';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { collection }s from 'firebase/firestore';
import type { User } from '@/lib/types';
import { UsersTable } from './_components/users-table';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminUsersPage() {
  const firestore = useFirestore();
  const usersQuery = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: users, isLoading } = useCollection<User>(usersQuery);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          View and manage all user accounts on the platform.
        </p>
      </div>
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <UsersTable users={users || []} />
      )}
    </div>
  );
}
